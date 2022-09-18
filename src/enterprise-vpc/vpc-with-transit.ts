import { Construct } from 'constructs';
import { EnterpriseVPC } from './enterprise-vpc';
import { VPCWithTransitProps } from './props';

export class VPCWithTransit extends EnterpriseVPC {
  constructor(scope: Construct, id: string, props: VPCWithTransitProps) {
    super(scope, id, VPCWithTransitProps.parse(props));
  }
}
