import { z } from 'zod';

const Rfc1918 = z.enum([
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
]);

export const SimpleVPCProps = z.object({
  name: z.string().min(2).max(20),
  ipv4IpamPoolId: z.string().regex(/^ipam-pool-[a-z0-9]{17}$/g),
  ipv4NetmaskLength: z.number().min(16).max(25).default(19),
});

const transit = z.object({
  transitGatewayId: z.string().regex(/^tgw-[a-z0-9]{17}$/g),
  enterpriseCidr: Rfc1918.default(Rfc1918.enum['10.0.0.0/8']),
});

const nat = z.object({
  attachNatGateways: z.literal(true).refine((v) => !!v),
});

export const VPCWithNATProps = SimpleVPCProps.merge(nat);

export const VPCWithTransitProps = SimpleVPCProps.merge(transit);

export const VPCWithTransitAndNATProps = SimpleVPCProps.merge(transit).merge(nat);

export const VPCWithEnterpriseNATProps = SimpleVPCProps.merge(transit).merge(nat).extend({
  transitGatewayRouteTableId: z.string().regex(/^tgw-rtb-[a-z0-9]{17}$/g),
});

export const EnterpriseVPCProps = z.union([
  VPCWithEnterpriseNATProps,
  VPCWithTransitAndNATProps,
  VPCWithTransitProps,
  VPCWithNATProps,
  SimpleVPCProps,
]);

/* eslint-disable @typescript-eslint/no-redeclare */
export type SimpleVPCProps = z.infer<typeof SimpleVPCProps>;
export type VPCWithNATProps = z.infer<typeof VPCWithNATProps>;
export type VPCWithTransitProps = z.infer<typeof VPCWithTransitProps>;
export type VPCWithTransitAndNATProps = z.infer<typeof VPCWithTransitAndNATProps>;
export type VPCWithEnterpriseNATProps = z.infer<typeof VPCWithEnterpriseNATProps>;
export type EnterpriseVPCProps = z.infer<typeof EnterpriseVPCProps>;
