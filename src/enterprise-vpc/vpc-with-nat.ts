import { Construct } from 'constructs';
import { EnterpriseVPC } from './enterprise-vpc';
import { VPCWithNATProps } from './props';

export class VPCWithNAT extends EnterpriseVPC {
  constructor(scope: Construct, id: string, props: VPCWithNATProps) {
    super(scope, id, VPCWithNATProps.parse(props));
  }
}
