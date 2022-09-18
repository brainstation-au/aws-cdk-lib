import { Construct } from 'constructs';
import { EnterpriseVPC } from './enterprise-vpc';
import { VPCWithEnterpriseNATProps } from './props';

export class VPCWithEnterpriseNAT extends EnterpriseVPC {
  constructor(scope: Construct, id: string, props: VPCWithEnterpriseNATProps) {
    super(scope, id, VPCWithEnterpriseNATProps.parse(props));
  }
}
