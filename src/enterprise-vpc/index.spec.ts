import * as cdk from 'aws-cdk-lib';
import YAML from 'yaml';
import { EnterpriseVPC } from '.';
import { EnterpriseVPCProps } from './props';

const createStack = (vpcProps: EnterpriseVPCProps) => {
  class MyStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?:cdk.StackProps) {
      super(scope, id, props);

      const name = new cdk.CfnParameter(this, 'GroupName', {
        type: 'String',
        default: vpcProps.name,
      });

      new EnterpriseVPC(this, 'MyVpc', {
        ...vpcProps,
        name: cdk.Fn.ref(name.logicalId),
      });
    }
  }

  const app = new cdk.App();
  return new MyStack(app, 'MyStack');
};

describe('enterprise-vpc', () => {
  describe('No TGW, No NAT', () => {
    const stack = createStack({
      name: 'brainstation',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 19,
    });
    const template = cdk.assertions.Template.fromStack(stack);

    test('produces correct cloudformation template', () => {
      expect(YAML.stringify(template.toJSON())).toMatchSnapshot();
    });

    test('creates a VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates an internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates an internet gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('creates 6 subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('does not create any elastic IP', () => {
      template.resourceCountIs('AWS::EC2::EIP', 0);
    });

    test('does not create any NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('does not create any transit gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayAttachment', 0);
    });

    test('creates 2 route table', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 2);
    });

    test('creates 6 subnet route table association', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 6);
    });

    test('creates 1 routes', () => {
      template.resourceCountIs('AWS::EC2::Route', 1);
    });
  });

  describe('Attach TGW, No NAT', () => {
    const stack = createStack({
      name: 'brainstation',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 19,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      enterpriseCidr: '10.0.0.0/8',
    });
    const template = cdk.assertions.Template.fromStack(stack);

    test('produces correct cloudformation template', () => {
      expect(YAML.stringify(template.toJSON())).toMatchSnapshot();
    });

    test('creates a VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates an internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates an internet gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('creates 6 subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);
    });

    test('does not create any elastic IP', () => {
      template.resourceCountIs('AWS::EC2::EIP', 0);
    });

    test('does not create any NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('creates a transit gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayAttachment', 1);
    });

    test('creates 2 route table', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 2);
    });

    test('creates 9 subnet route table association', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 9);
    });

    test('creates 3 routes', () => {
      template.resourceCountIs('AWS::EC2::Route', 3);
    });
  });

  describe('No TGW, attach NAT', () => {
    const stack = createStack({
      name: 'brainstation',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 19,
      attachNatGateways: true,
    });
    const template = cdk.assertions.Template.fromStack(stack);

    test('produces correct cloudformation template', () => {
      expect(YAML.stringify(template.toJSON())).toMatchSnapshot();
    });

    test('creates a VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates an internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates an internet gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('creates 6 subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('creates 3 elastic IP', () => {
      template.resourceCountIs('AWS::EC2::EIP', 3);
    });

    test('creates 3 NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('does not create any transit gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayAttachment', 0);
    });

    test('creates 4 route table', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
    });

    test('creates 6 subnet route table association', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 6);
    });

    test('creates 4 routes', () => {
      template.resourceCountIs('AWS::EC2::Route', 4);
    });
  });

  describe('attach TGW, attach NAT', () => {
    const stack = createStack({
      name: 'brainstation',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 19,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      attachNatGateways: true,
      transitGatewayRouteTableId: 'tgw-rtb-0067500ea8a2d6c12',
    });
    const template = cdk.assertions.Template.fromStack(stack);

    test('produces correct cloudformation template', () => {
      expect(YAML.stringify(template.toJSON())).toMatchSnapshot();
    });

    test('creates a VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates an internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates an internet gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('creates 9 subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);
    });

    test('creates 3 elastic IP', () => {
      template.resourceCountIs('AWS::EC2::EIP', 3);
    });

    test('creates 3 NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('creates a transit gateway attachment', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayAttachment', 1);
    });

    test('creates 4 route table', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
    });

    test('creates 9 subnet route table association', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 9);
    });

    test('creates 7 routes', () => {
      template.resourceCountIs('AWS::EC2::Route', 8);
    });
  });
});
