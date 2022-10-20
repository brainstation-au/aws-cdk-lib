import * as cdk from 'aws-cdk-lib';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { z } from 'zod';

export const BatchFargateProps = z.object({
  vpcId: z.string(),
  subnetIds: z.string().array(),
  maxvCpus: z.number().positive(),
  securityGroupIds: z.string().array(),
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BatchFargateProps = z.infer<typeof BatchFargateProps>;

export class BatchFargate extends Construct {
  readonly compute: batch.CfnComputeEnvironment;
  readonly computeSpot: batch.CfnComputeEnvironment;
  readonly queue: batch.CfnJobQueue;

  constructor(scope: Construct, id: string, props: BatchFargateProps) {
    super(scope, id);

    const serviceRole = new iam.Role(this, 'BatchServiceRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
      description: 'AWS Batch Service Role',
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          'AWSBatchServiceRole',
          'arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole',
        ),
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

    this.computeSpot = new batch.CfnComputeEnvironment(this, 'ComputeEnvironmentSpot', {
      type: 'MANAGED',
      state: 'ENABLED',
      serviceRole: serviceRole.roleArn,
      computeResources: {
        maxvCpus: props.maxvCpus,
        subnets: props.subnetIds,
        type: 'FARGATE_SPOT',
        securityGroupIds: props.securityGroupIds,
      },
    });

    this.queue = new batch.CfnJobQueue(this, 'JobQueue', {
      priority: 1,
      state: 'ENABLED',
      computeEnvironmentOrder: [
        {
          computeEnvironment: cdk.Fn.ref(this.computeSpot.logicalId),
          order: 1,
        },
        {
          computeEnvironment: cdk.Fn.ref(this.compute.logicalId),
          order: 2,
        },
      ],
    });
  }
}
