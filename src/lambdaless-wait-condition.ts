import * as cdk from 'aws-cdk-lib';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { LambdalessCustomResource } from './lambdaless-custom-resource';

export interface LambdalessWaitConditionProps {
  /**
   * The state machine to execute for this custom resource.
   *
   * The state machine output should follow the same format as `LambdalessCustomResource`:
   * - `PhysicalResourceId`: Unique identifier for the resource
   * - `Data`: Key-value pairs (JSON-stringified and sent as WaitCondition data)
   */
  readonly stateMachine: IStateMachine;
  /**
   * The maximum time to wait for the async operation to complete.
   *
   * @default Duration.hours(12)
   */
  readonly timeout?: cdk.Duration;
  /**
   * Properties to pass to the custom resource.
   *
   * @default - No additional properties.
   */
  readonly properties?: {
    [key: string]: any;
  };
  /**
   * For custom resources, you can specify AWS::CloudFormation::CustomResource
   * (the default) as the resource type, or you can specify your own resource
   * type name.
   *
   * @default - AWS::CloudFormation::CustomResource
   */
  readonly resourceType?: string;
  /**
   * The policy to apply when this resource is removed from the application.
   *
   * @default cdk.RemovalPolicy.Destroy
   */
  readonly removalPolicy?: cdk.RemovalPolicy;
}

/**
 * A lambdaless custom resource that integrates with CloudFormation WaitCondition
 * for long-running async operations (up to 12 hours).
 *
 * Triggers the user-defined state machine via the shared `LambdalessProvider`,
 * and additionally signals a CloudFormation WaitCondition when the state machine completes.
 * The state machine's output `Data` is JSON-stringified and sent as the WaitCondition data.
 *
 * @example
 * const waitCondition = new LambdalessWaitCondition(this, 'CompileJob', {
 *   stateMachine,
 *   timeout: Duration.hours(12),
 *   properties: {
 *     jobDefinitionArn: jobDefinition.jobDefinitionArn,
 *   },
 * });
 *
 * const data = waitCondition.data; // JSON-stringified Data from the state machine
 */
export class LambdalessWaitCondition extends Construct {
  /**
   * The data returned by the WaitCondition signal.
   *
   * This is the JSON-stringified `Data` object from the state machine output.
   * The format is `{"key":"value"}` which can be used to extract values.
   */
  readonly data: string;

  /**
   * The underlying CfnWaitCondition's raw attrData.
   *
   * The format is `{"UniqueId":"DataValue"}`.
   */
  readonly attrData: string;

  constructor(
    scope: Construct,
    id: string,
    props: LambdalessWaitConditionProps,
  ) {
    super(scope, id);

    const timeout = props.timeout ?? cdk.Duration.hours(12);

    const handle = new cdk.CfnWaitConditionHandle(this, 'Handle');

    const customResource = new LambdalessCustomResource(this, 'Resource', {
      stateMachine: props.stateMachine,
      resourceType: props.resourceType,
      removalPolicy: props.removalPolicy,
      properties: {
        ...props.properties,
        waitConditionCallbackURL: handle.ref,
      },
    });

    const waitCondition = new cdk.CfnWaitCondition(this, 'WaitCondition', {
      count: 1,
      timeout: timeout.toSeconds().toString(),
      handle: handle.ref,
    });
    waitCondition.node.addDependency(customResource);

    this.attrData = waitCondition.attrData.toString();
    // attrData format: {"UniqueId":"DataValue"}
    // Remove prefix up to first ":"  and trailing "}
    const afterFirstColon = cdk.Fn.select(
      1,
      cdk.Fn.split('":"', this.attrData),
    );
    this.data = cdk.Fn.join('', cdk.Fn.split('"}', afterFirstColon));
  }
}
