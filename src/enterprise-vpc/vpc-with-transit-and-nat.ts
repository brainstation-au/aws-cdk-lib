import { Construct } from 'constructs';
import { EnterpriseVPC } from './enterprise-vpc';
import { VPCWithTransitAndNATProps } from './props';

export class VPCWithTransitAndNAT extends EnterpriseVPC {
  constructor(scope: Construct, id: string, props: VPCWithTransitAndNATProps) {
    super(scope, id, VPCWithTransitAndNATProps.parse(props));
  }
}
