import * as cdk from 'aws-cdk-lib';
import YAML from 'yaml';
import { BatchFargate, BatchFargateProps } from '.';

const createStack = (batchProps: BatchFargateProps) => {
  class MyStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?:cdk.StackProps) {
      super(scope, id, props);

      const vpc = new cdk.CfnParameter(this, 'VPC', {
        type: 'String',
        default: batchProps.vpcId,
      });

      const subnets = new cdk.CfnParameter(this, 'SubnetIds', {
        type: 'List<String>',
        default: batchProps.subnetIds.join(','),
      });

      new BatchFargate(this, 'MyBatch', {
        vpcId: vpc.valueAsString,
        subnetIds: subnets.valueAsList,
        maxvCpus: batchProps.maxvCpus,
        securityGroupIds: batchProps.securityGroupIds,
      });
    }
  }

  const app = new cdk.App();
  return new MyStack(app, 'MyStack');
};

describe('batch-fargate', () => {
  const stack = createStack({
    vpcId: 'vpc-1234',
    subnetIds: ['subnet-123', 'subnet-234'],
    maxvCpus: 4,
    securityGroupIds: ['sg-1234'],
  });
  const template = cdk.assertions.Template.fromStack(stack);

  test('produces correct cloudformation template', () => {
    expect(YAML.stringify(template.toJSON())).toMatchSnapshot();
  });

  test('creates a IAM Role', () => {
    template.resourceCountIs('AWS::IAM::Role', 1);
  });

  test('creates a compute environment', () => {
    template.resourceCountIs('AWS::Batch::ComputeEnvironment', 2);
  });

  test('creates a batch job queue', () => {
    template.resourceCountIs('AWS::Batch::JobQueue', 1);
  });
});
