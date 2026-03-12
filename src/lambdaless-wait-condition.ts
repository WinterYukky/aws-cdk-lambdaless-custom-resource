import * as cdk from 'aws-cdk-lib';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { LambdalessCustomResource } from './lambdaless-custom-resource';

export interface LambdalessWaitConditionProps {
  readonly stateMachine: IStateMachine;
  /**
   * @default Duration.hours(12)
   */
  readonly timeout?: cdk.Duration;
  /**
   * @default - automatically determined by getDataById calls
   */
  readonly count?: number;
  readonly properties?: { [key: string]: any };
  readonly resourceType?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class LambdalessWaitCondition extends Construct {
  readonly attrData: string;
  private readonly uniqueIds = new Set<string>();
  private readonly explicitCount?: number;

  constructor(scope: Construct, id: string, props: LambdalessWaitConditionProps) {
    super(scope, id);
    const timeout = props.timeout ?? cdk.Duration.hours(12);
    this.explicitCount = props.count;

    const handle = new cdk.CfnWaitConditionHandle(this, 'Handle');
    const customResource = new LambdalessCustomResource(this, 'Resource', {
      stateMachine: props.stateMachine,
      resourceType: props.resourceType,
      removalPolicy: props.removalPolicy,
      properties: { ...props.properties, waitConditionCallbackURL: handle.ref },
    });

    const waitCondition = new cdk.CfnWaitCondition(this, 'WaitCondition', {
      count: cdk.Lazy.number({ produce: () => this.explicitCount ?? (this.uniqueIds.size || 1) }),
      timeout: timeout.toSeconds().toString(),
      handle: handle.ref,
    });
    waitCondition.node.addDependency(customResource);
    this.attrData = waitCondition.attrData.toString();
  }

  getDataById(uniqueId: string): string {
    this.uniqueIds.add(uniqueId);
    const prefix = `"${uniqueId}":"`;
    const afterPrefix = cdk.Fn.select(1, cdk.Fn.split(prefix, this.attrData));
    const beforeNextEntry = cdk.Fn.select(0, cdk.Fn.split('","', afterPrefix));
    return cdk.Fn.join('', cdk.Fn.split('"}', beforeNextEntry));
  }
}
