import * as cdk from 'aws-cdk-lib';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { LambdalessCustomResource } from './lambdaless-custom-resource';

/**
 * Properties for LambdalessWaitCondition.
 */
export interface LambdalessWaitConditionProps {
  /**
   * The state machine to execute for this custom resource.
   *
   * The state machine receives `waitConditionCallbackURL` in `ResourceProperties`.
   * It must send a PUT request to this URL when the async operation completes.
   *
   * The PUT body must be JSON with:
   * - `Status`: `"SUCCESS"` or `"FAILURE"`
   * - `UniqueId`: A unique identifier string
   * - `Reason`: Optional reason string
   * - `Data`: Optional data string to return
   *
   * You can use `WaitConditionCallback` fragment to simplify this.
   */
  readonly stateMachine: IStateMachine;
  /**
   * The maximum time to wait for the async operation to complete.
   *
   * @default Duration.hours(12)
   */
  readonly timeout?: cdk.Duration;
  /**
   * The number of success signals that CloudFormation must receive
   * before it sets the wait condition's status to CREATE_COMPLETE.
   *
   * @default 1
   */
  readonly count?: number;
  /**
   * Properties to pass to the custom resource.
   *
   * These are available in the state machine as `$states.input.ResourceProperties.*`.
   * The `waitConditionCallbackURL` property is automatically added.
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
 * for long-running async operations.
 *
 * This construct creates:
 * 1. A `CfnWaitConditionHandle` for the callback URL
 * 2. A `LambdalessCustomResource` that triggers the user-defined state machine
 * 3. A `CfnWaitCondition` that waits for the async operation to complete
 *
 * The state machine receives the `waitConditionCallbackURL` in its input,
 * and must send a PUT request to it when the operation is done.
 *
 * @example
 * const waitCondition = new LambdalessWaitCondition(this, 'CompileJob', {
 *   stateMachine,
 *   timeout: Duration.hours(12),
 *   properties: {
 *     jobDefinitionArn: jobDefinition.jobDefinitionArn,
 *     jobQueueArn: jobQueue.jobQueueArn,
 *   },
 * });
 *
 * // Get the data returned by the callback
 * const result = waitCondition.getDataById('my-job-id');
 */
export class LambdalessWaitCondition extends Construct {
  /**
   * The underlying CfnWaitCondition's raw attrData.
   *
   * The format is a JSON string like `{"UniqueId":"DataValue"}`.
   * Use `getDataById` for convenient access to the data value.
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
      count: props.count ?? 1,
      timeout: timeout.toSeconds().toString(),
      handle: handle.ref,
    });
    waitCondition.node.addDependency(customResource);

    this.attrData = waitCondition.attrData.toString();
  }

  /**
   * Extract the data value from the WaitCondition signal by UniqueId.
   *
   * The WaitCondition's attrData has the format `{"UniqueId":"DataValue"}`
   * for a single signal, or `{"Id1":"Data1","Id2":"Data2"}` for multiple signals.
   * This method extracts the DataValue by removing the known prefix and suffix
   * using CloudFormation intrinsic functions.
   *
   * @param uniqueId - The UniqueId used when signaling the WaitCondition.
   *   This must match the `uniqueId` passed to `WaitConditionCallback`.
   * @returns The data string sent in the WaitCondition signal.
   */
  getDataById(uniqueId: string): string {
    const prefix = `"${uniqueId}":"`;
    // Step 1: Split by '"uniqueId":"' and take the second part
    // e.g. '{"id1":"data1","id2":"data2"}' → 'data1","id2":"data2"}'
    const afterPrefix = cdk.Fn.select(
      1,
      cdk.Fn.split(prefix, this.attrData),
    );
    // Step 2: Split by '","' and take the first part (handles multi-signal)
    // e.g. 'data1","id2":"data2"}' → 'data1'
    // For the last entry: 'data2"}' → 'data2"}'
    const beforeNextEntry = cdk.Fn.select(
      0,
      cdk.Fn.split('","', afterPrefix),
    );
    // Step 3: Remove trailing '"}' (only present for the last entry)
    // e.g. 'data2"}' → 'data2'
    // For non-last entries: 'data1' → 'data1' (no-op, '"}' not found)
    return cdk.Fn.join('', cdk.Fn.split('"}', beforeNextEntry));
  }
}
