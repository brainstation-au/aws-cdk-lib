import { Construct } from 'constructs';
import { BatchFargateProps } from './props';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as batch from 'aws-cdk-lib/aws-batch';

export class BatchFargate extends Construct {
  readonly compute: batch.CfnComputeEnvironment;
  readonly queue: batch.CfnJobQueue;

  constructor(scope: Construct, id: string, props: BatchFargateProps) {
    super(scope, id);

    const serviceRole = new iam.Role(this, 'BatchServiceRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
      description: 'AWS Batch Service Role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBatchServiceRole'),
      ],
    });

    this.compute = new batch.CfnComputeEnvironment(this, 'ComputeEnvironment', {
      type: 'MANAGED',
      state: 'ENABLED',
      serviceRole: serviceRole.roleArn,
      computeResources: {
        maxvCpus: props.maxvCpus,
        subnets: props.subnetIds,
        type: 'FARGATE',
        securityGroupIds: props.securityGroupIds,
      },
    });

    this.queue = new batch.CfnJobQueue(this, 'JobQueue', {
      priority: 1,
      state: 'ENABLED',
      computeEnvironmentOrder: [{
        computeEnvironment: cdk.Fn.ref(this.compute.logicalId),
        order: 1,
      }],
    });
  }
}
