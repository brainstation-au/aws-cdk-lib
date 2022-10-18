import { z } from 'zod';

export const BatchFargateProps = z.object({
  vpcId: z.string(),
  subnetIds: z.string().array(),
  maxvCpus: z.number().positive(),
  securityGroupIds: z.string().array(),
});

/* eslint-disable @typescript-eslint/no-redeclare */
export type BatchFargateProps = z.infer<typeof BatchFargateProps>;
