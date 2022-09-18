import * as cdk from 'aws-cdk-lib';
import YAML from 'yaml';
import { VPCWithTransitAndNAT } from './vpc-with-transit-and-nat';
import { VPCWithTransitAndNATProps } from './props';

const createStack = (vpcProps: VPCWithTransitAndNATProps) => {
  class MyStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?:cdk.StackProps) {
      super(scope, id, props);

      const name = new cdk.CfnParameter(this, 'GroupName', {
        type: 'String',
        default: vpcProps.name,
      });

      new VPCWithTransitAndNAT(this, 'MyVpc', {
        ...vpcProps,
        name: cdk.Fn.ref(name.logicalId),
      });
    }
  }

  const app = new cdk.App();
  return new MyStack(app, 'MyStack');
};

describe('vpc-with-transit-and-nat', () => {
  const stack = createStack({
    name: 'brainstation',
    ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
    ipv4NetmaskLength: 19,
    transitGatewayId: 'tgw-07be5896cb38426e1',
    attachNatGateways: true,
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
