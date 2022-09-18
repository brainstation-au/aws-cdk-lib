import { SimpleVPCProps, VPCWithEnterpriseNATProps, VPCWithNATProps, VPCWithTransitAndNATProps, VPCWithTransitProps } from './props';

describe('props', () => {
  test('simple vpc, no transit, no NAT', () => {
    expect(SimpleVPCProps.parse({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
    })).toEqual({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
    });
  });

  test('simple vpc, wrong input for NAT', () => {
    expect(() => VPCWithNATProps.parse({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      attachNatGateways: '',
    })).toThrow();
  });

  test('VPC with NAT', () => {
    expect(VPCWithNATProps.parse({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      attachNatGateways: true,
    })).toEqual({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      attachNatGateways: true,
    });
  });

  test('vpc with transit, but no NAT', () => {
    expect(VPCWithTransitProps.parse({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      transitGatewayId: 'tgw-07be5896cb38426e1',
    })).toEqual({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      enterpriseCidr: '10.0.0.0/8',
    });
  });

  test('vpc with both transit and NAT, but no internet for transit', () => {
    expect(VPCWithTransitAndNATProps.parse({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      attachNatGateways: true,
    })).toEqual({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      enterpriseCidr: '10.0.0.0/8',
      attachNatGateways: true,
    });
  });

  test('vpc with both transit and NAT with internet for transit', () => {
    expect(VPCWithEnterpriseNATProps.parse({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      attachNatGateways: true,
      transitGatewayRouteTableId: 'tgw-rtb-0067500ea8a2d6c12',
    })).toEqual({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      enterpriseCidr: '10.0.0.0/8',
      attachNatGateways: true,
      transitGatewayRouteTableId: 'tgw-rtb-0067500ea8a2d6c12',
    });
  });

  test('invalid cidr', () => {
    expect(() => VPCWithTransitProps.parse({
      name: 'foo',
      ipv4IpamPoolId: 'ipam-pool-0fdbd5d6bea6196ed',
      ipv4NetmaskLength: 18,
      transitGatewayId: 'tgw-07be5896cb38426e1',
      enterpriseCidr: '10.0.0.0/6',
    })).toThrow();
  });
});
