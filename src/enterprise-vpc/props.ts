import { z } from 'zod';

const required = z.object({
  name: z.string().min(2).max(20),
  ipv4IpamPoolId: z.string(),
  ipv4NetmaskLength: z.number().min(16).max(25).default(19),
  attachNatGateways: z.literal(true),
}).partial({
  attachNatGateways: true,
});

const transit = z.object({
  transitGatewayId: z.string(),
  enterpriseCidr: z.string().default('10.0.0.0/8'),
});

const nat = z.object({
  attachNatGateways: z.literal(true),
  transitGatewayRouteTableId: z.string(),
});

export const EnterpriseVPCProps = z.union([
  required.merge(transit).merge(nat),
  required.merge(transit),
  required,
]);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EnterpriseVPCProps = z.infer<typeof EnterpriseVPCProps>;
