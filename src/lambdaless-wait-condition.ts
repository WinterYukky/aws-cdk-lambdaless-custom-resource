import * as cdk from 'aws-cdk-lib';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import {
  LambdalessCustomResource,
  LambdalessJsonParse,
} from './lambdaless-custom-resource';

export interface LambdalessWaitConditionProps {
  readonly stateMachine: IStateMachine;
  /**
   * @default Duration.hours(12)
   */
  readonly timeout?: cdk.Duration;
  /**
   * @default - automatically determined by getAttString calls
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
  private parsedAttrData?: LambdalessJsonParse;

  constructor(
    scope: Construct,
    id: string,
    props: LambdalessWaitConditionProps,
  ) {
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
      count: cdk.Lazy.number({
        produce: () => this.explicitCount ?? (this.uniqueIds.size || 1),
      }),
      timeout: timeout.toSeconds().toString(),
      handle: handle.ref,
    });
    waitCondition.node.addDependency(customResource);
    this.attrData = waitCondition.attrData.toString();
  }

  /**
   * Returns the value of an attribute signaled to the wait condition through
   * the key/value pairs encoded in `attrData` (the JSON document assembled by
   * `CfnWaitCondition` from each `SignalResource` call).
   *
   * Internally, `attrData` is parsed through a shared Lambdaless helper so
   * that the returned token is a simple `Fn::GetAtt`. This avoids
   * CloudFormation template escaping pitfalls that occur when the raw JSON
   * string is embedded in contexts whose content ends up being
   * `JSON.stringify`'d by CDK.
   *
   * The helper resource is created lazily on the first call, so consumers
   * that do not call `getAttString` pay no extra cost.
   */
  getAttString(uniqueId: string): string {
    this.uniqueIds.add(uniqueId);
    this.parsedAttrData ??= new LambdalessJsonParse(this, 'ParsedAttrData', {
      value: this.attrData,
    });
    return this.parsedAttrData.getAttString(uniqueId);
  }
}
