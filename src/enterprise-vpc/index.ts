import { CfnOutput, Fn } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { EnterpriseVPCProps } from './props';

export class EnterpriseVPC extends Construct {
  constructor(scope: Construct, id: string, props: EnterpriseVPCProps) {
    super(scope, id);

    const p = EnterpriseVPCProps.parse(props);
    const AZs = ['a', 'b', 'c'];

    const vpc = new ec2.CfnVPC(this, 'VPC', {
      enableDnsHostnames: true,
      enableDnsSupport: true,
      ipv4IpamPoolId: p.ipv4IpamPoolId,
      ipv4NetmaskLength: p.ipv4NetmaskLength,
      tags: [{key: 'Name', value: p.name}],
    });

    const internetGateway = new ec2.CfnInternetGateway(this, 'InternetGateway', {
      tags: [{key: 'Name', value: p.name}],
    });

    const internetGatewayAttachment = new ec2.CfnVPCGatewayAttachment(this, 'InternetGatewayAttachment', {
      vpcId: Fn.ref(vpc.logicalId),
      internetGatewayId: Fn.ref(internetGateway.logicalId),
    });

    const publicSubnets = AZs.map((az, i) => new ec2.CfnSubnet(this, `SubnetPublic${az.toUpperCase()}`, {
      vpcId: Fn.ref(vpc.logicalId),
      availabilityZone: Fn.select(i, Fn.getAzs()),
      cidrBlock: Fn.select(i, Fn.cidr(vpc.attrCidrBlock, 8, (32 - p.ipv4NetmaskLength - 3).toString() )),
      mapPublicIpOnLaunch: true,
      tags: [{key: 'Name', value: `${p.name}/public-${az}`}],
    }));

    const privateSubnets = AZs.map((az, i) => new ec2.CfnSubnet(this, `SubnetPrivate${az.toUpperCase()}`, {
      vpcId: Fn.ref(vpc.logicalId),
      availabilityZone: Fn.select(i, Fn.getAzs()),
      cidrBlock: Fn.select(3 + i, Fn.cidr(vpc.attrCidrBlock, 8, (32 - p.ipv4NetmaskLength - 3).toString() )),
      mapPublicIpOnLaunch: false,
      tags: [{key: 'Name', value: `${p.name}/private-${az}`}],
    }));

    const transitSubnets = 'transitGatewayId' in p ? AZs.map((az, i) => new ec2.CfnSubnet(this, `SubnetTransit${az.toUpperCase()}`, {
      vpcId: Fn.ref(vpc.logicalId),
      availabilityZone: Fn.select(i, Fn.getAzs()),
      cidrBlock: Fn.select(i, Fn.cidr(Fn.select(
        7,
        Fn.cidr(vpc.attrCidrBlock, 8, (32 - p.ipv4NetmaskLength - 3).toString() )
      ), 3, '4' )),
      mapPublicIpOnLaunch: false,
      tags: [{key: 'Name', value: `${p.name}/private-${az}`}],
    })) : [];

    const transitGatewayAttachment = 'transitGatewayId' in p ?
      new ec2.CfnTransitGatewayAttachment(this, 'TransitGatewayAttachment', {
        subnetIds: transitSubnets.map(subnet => Fn.ref(subnet.logicalId)),
        transitGatewayId: p.transitGatewayId,
        vpcId: Fn.ref(vpc.logicalId),
      }) : undefined;

    const natGateways = 'attachNatGateways' in p ? AZs.map((az, i) => {
      const eip = new ec2.CfnEIP(this, `NatGatewayEip${az.toUpperCase()}`, {domain: 'vpc'});
      eip.addDependsOn(internetGatewayAttachment);

      return new ec2.CfnNatGateway(this, `NatGateway${az.toUpperCase()}`, {
        subnetId: Fn.ref(publicSubnets[i].logicalId),
        allocationId: eip.attrAllocationId,
      });
    }) : [];

    const publicTable = new ec2.CfnRouteTable(this, 'RouteTablePublic', {
      vpcId: Fn.ref(vpc.logicalId),
      tags: [{key: 'Name', value: `${p.name}/public`}],
    });

    const publicRoute = new ec2.CfnRoute(this, 'RoutePublicDefault', {
      routeTableId: Fn.ref(publicTable.logicalId),
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: Fn.ref(internetGateway.logicalId),
    });
    publicRoute.addDependsOn(internetGatewayAttachment);

    if ('transitGatewayId' in p && transitGatewayAttachment) {
      const transitRoute = new ec2.CfnRoute(this, 'RoutePublicTransit', {
        routeTableId: Fn.ref(publicTable.logicalId),
        destinationCidrBlock: p.enterpriseCidr,
        transitGatewayId: p.transitGatewayId,
      });
      transitRoute.addDependsOn(transitGatewayAttachment);
    }

    AZs.forEach((az, i) => {
      new ec2.CfnSubnetRouteTableAssociation(this, `SubnetRouteTableAssociationPublic${az.toUpperCase()}`, {
        routeTableId: Fn.ref(publicTable.logicalId),
        subnetId: Fn.ref(publicSubnets[i].logicalId),
      });
    });

    natGateways.forEach((nat, i) => {
      const az = AZs[i];
      const azUpper = AZs[i].toUpperCase();
      const privateTable = new ec2.CfnRouteTable(this, `RouteTablePrivate${azUpper}`, {
        vpcId: Fn.ref(vpc.logicalId),
        tags: [{key: 'Name', value: `${p.name}/private-${az}`}],
      });

      new ec2.CfnRoute(this, `RoutePrivateDefault${azUpper}`, {
        routeTableId: Fn.ref(privateTable.logicalId),
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: Fn.ref(nat.logicalId),
      });

      if ('transitGatewayId' in p && transitGatewayAttachment) {
        const transitRoute = new ec2.CfnRoute(this, `RoutePrivateTransit${azUpper}`, {
          routeTableId: Fn.ref(privateTable.logicalId),
          destinationCidrBlock: p.enterpriseCidr,
          transitGatewayId: p.transitGatewayId,
        });
        transitRoute.addDependsOn(transitGatewayAttachment);
      }

      new ec2.CfnSubnetRouteTableAssociation(this, `SubnetRouteTableAssociationPrivate${azUpper}`, {
        routeTableId: Fn.ref(privateTable.logicalId),
        subnetId: Fn.ref(privateSubnets[i].logicalId),
      });

      if (transitSubnets[i]) {
        new ec2.CfnSubnetRouteTableAssociation(this, `SubnetRouteTableAssociationTransit${azUpper}`, {
          routeTableId: Fn.ref(privateTable.logicalId),
          subnetId: Fn.ref(transitSubnets[i].logicalId),
        });
      }
    });

    if (natGateways.length === 0) {
      const privateTable = new ec2.CfnRouteTable(this, 'RouteTablePrivate', {
        vpcId: Fn.ref(vpc.logicalId),
        tags: [{key: 'Name', value: `${p.name}/private`}],
      });

      if ('transitGatewayId' in p && transitGatewayAttachment) {
        const transitRoute = new ec2.CfnRoute(this, 'RoutePrivateTransit', {
          routeTableId: Fn.ref(privateTable.logicalId),
          destinationCidrBlock: '0.0.0.0/0',
          transitGatewayId: p.transitGatewayId,
        });
        transitRoute.addDependsOn(transitGatewayAttachment);
      }

      privateSubnets.forEach((subnet, i) => {
        new ec2.CfnSubnetRouteTableAssociation(this, `SubnetRouteTableAssociationPrivate${AZs[i].toUpperCase()}`, {
          routeTableId: Fn.ref(privateTable.logicalId),
          subnetId: Fn.ref(subnet.logicalId),
        });
      });

      transitSubnets.forEach((subnet, i) => {
        new ec2.CfnSubnetRouteTableAssociation(this, `SubnetRouteTableAssociationTransit${AZs[i].toUpperCase()}`, {
          routeTableId: Fn.ref(privateTable.logicalId),
          subnetId: Fn.ref(subnet.logicalId),
        });
      });
    }

    new ssm.CfnParameter(this, 'ParamVpcId', {
      type: 'String',
      name: `/cf/${p.name}/vpc/id`,
      value: Fn.ref(vpc.logicalId),
      description: 'VPC Id',
    });

    new ssm.CfnParameter(this, 'ParamSecurityGroupId', {
      type: 'String',
      name: `/cf/${p.name}/security-group/default/id`,
      value: vpc.attrDefaultSecurityGroup,
      description: 'ID of default securite group for intra-vpc access',
    });

    new ssm.CfnParameter(this, 'ParamPublicSubnetsIds', {
      type: 'List<String>',
      name: `/cf/${p.name}/public-subnets/ids`,
      value: Fn.join(',', publicSubnets.map(subnet => Fn.ref(subnet.logicalId))),
      description: 'List of IDs of the public subnets',
    });

    new ssm.CfnParameter(this, 'ParamPrivateSubnetsIds', {
      type: 'List<String>',
      name: `/cf/${p.name}/private-subnets/ids`,
      value: Fn.join(',', privateSubnets.map(subnet => Fn.ref(subnet.logicalId))),
      description: 'List of IDs of the private subnets',
    });

    if (transitGatewayAttachment) {
      new ssm.CfnParameter(this, 'ParamTransitSubnetsIds', {
        type: 'List<String>',
        name: `/cf/${p.name}/transit-subnets/ids`,
        value: Fn.join(',', transitSubnets.map(subnet => Fn.ref(subnet.logicalId))),
        description: 'List of IDs of the transit subnets',
      });
    }

    if (transitGatewayAttachment && 'transitGatewayRouteTableId' in p) {
      new ec2.CfnTransitGatewayRoute(this, 'TransitGatewayRouteToInternet', {
        transitGatewayRouteTableId: p.transitGatewayRouteTableId,
        destinationCidrBlock: '0.0.0.0/0',
        transitGatewayAttachmentId: Fn.ref(transitGatewayAttachment.logicalId),
      });
    }

    new CfnOutput(this, 'VpcId', {
      value: Fn.ref(vpc.logicalId),
      description: 'VPC ID',
      exportName: `${p.name}-vpc`,
    });

    new CfnOutput(this, 'PublicSubnets', {
      value: Fn.join(',', publicSubnets.map(subnet => Fn.ref(subnet.logicalId))),
      description: 'List of IDs of the public subnets',
      exportName: `${p.name}-public-subnets`,
    });

    new CfnOutput(this, 'PrivateSubnets', {
      value: Fn.join(',', privateSubnets.map(subnet => Fn.ref(subnet.logicalId))),
      description: 'List of IDs of the private subnets',
      exportName: `${p.name}-private-subnets`,
    });
  }
}
