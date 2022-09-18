import { Construct } from 'constructs';
import { EnterpriseVPC } from './enterprise-vpc';
import { SimpleVPCProps } from './props';

export class SimpleVPC extends EnterpriseVPC {
  constructor(scope: Construct, id: string, props: SimpleVPCProps) {
    super(scope, id, SimpleVPCProps.parse(props));
  }
}
