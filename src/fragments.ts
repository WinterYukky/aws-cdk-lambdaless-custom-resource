import * as cdk from 'aws-cdk-lib';
import { Authorization, Connection } from 'aws-cdk-lib/aws-events';
import {
  Choice,
  Condition,
  IChainable,
  INextable,
  Pass,
  State,
  StateMachineFragment,
} from 'aws-cdk-lib/aws-stepfunctions';
import { HttpInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface CustomResourceFlowProps {
  /**
   * The workflow to execute on Create.
   *
   * @default - the onUpdate workflow
   */
  readonly onCreate?: IChainable;
  /**
   * The workflow to execute on Update.
   *
   * @default - no-op
   */
  readonly onUpdate?: IChainable;
  /**
   * The workflow to execute on Delete.
   *
   * @default - no-op
   */
  readonly onDelete?: IChainable;
}

export class CustomResourceFlow extends StateMachineFragment {
  readonly startState: State;
  readonly endStates: INextable[];
  constructor(scope: Construct, id: string, props: CustomResourceFlowProps) {
    super(scope, id);

    if (!props.onCreate && !props.onUpdate && !props.onDelete) {
      throw new cdk.UnscopedValidationError(
        'At least one of `onCreate`, `onUpdate` or `onDelete` must be specified.',
      );
    }

    const onCreate =
      props.onCreate ?? props.onUpdate ?? Pass.jsonata(this, 'Create');
    const onUpdate = props.onUpdate ?? Pass.jsonata(this, 'Update');
    const onDelete = props.onDelete ?? Pass.jsonata(this, 'Delete');

    const choice = Choice.jsonata(this, 'Which Request Type?')
      .when(Condition.jsonata(`{% $RequestType = "Create" %}`), onCreate)
      .when(Condition.jsonata(`{% $RequestType = "Update" %}`), onUpdate)
      .when(Condition.jsonata(`{% $RequestType = "Delete" %}`), onDelete);
    const init = Pass.jsonata(this, 'Initialize', {
      assign: {
        RequestType: `{% $states.input.RequestType %}`,
        StackId: `{% $states.input.StackId %}`,
        RequestId: `{% $states.input.RequestId %}`,
        ResourceType: `{% $states.input.ResourceType %}`,
        LogicalResourceId: `{% $states.input.LogicalResourceId %}`,
        PhysicalResourceId: `{% $exists($states.input.PhysicalResourceId) ? $states.input.PhysicalResourceId : null %}`,
        ResourceProperties: `{% $states.input.ResourceProperties %}`,
        OldResourceProperties: `{% $exists($states.input.OldResourceProperties) ? $states.input.OldResourceProperties : null %}`,
      },
    });
    init.next(choice);

    this.startState = init;
    this.endStates = choice.endStates;
  }
}

/**
 * Properties for WaitConditionCallback.
 */
export interface WaitConditionCallbackProps {
  /**
   * A JSONata expression that evaluates to a unique identifier for the callback signal.
   *
   * @example '{% $jobId %}'
   */
  readonly uniqueId: string;
  /**
   * A JSONata expression that evaluates to the data string to return through the WaitCondition.
   *
   * This value will be accessible via `LambdalessWaitCondition.data`.
   *
   * @default - No data returned.
   */
  readonly data?: string;
  /**
   * A JSONata expression that evaluates to a reason string.
   *
   * @default - 'Complete'
   */
  readonly reason?: string;
}

/**
 * A Step Functions fragment that sends a SUCCESS callback to a CloudFormation WaitCondition.
 *
 * Use this at the end of your state machine workflow (inside a `CustomResourceFlow`'s `onCreate`)
 * to signal completion of a long-running async operation.
 *
 * The callback URL is read from `$ResourceProperties.waitConditionCallbackURL`,
 * which is automatically set by `LambdalessWaitCondition`.
 *
 * @example
 * const submitJob = CallAwsService.jsonata(this, 'SubmitJob', { ... });
 * const pollJob = // ... polling logic ...
 * const callback = new WaitConditionCallback(this, 'Callback', {
 *   uniqueId: '{% $jobId %}',
 *   data: '{% $artifactS3Prefix %}',
 * });
 *
 * // Chain: submit -> poll -> callback
 * submitJob.next(pollJob).next(callback);
 */
export class WaitConditionCallback extends StateMachineFragment {
  readonly startState: State;
  readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: WaitConditionCallbackProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const connection =
      (stack.node.tryFindChild(
        'WaitConditionCallbackConnection',
      ) as Connection) ??
      new Connection(stack, 'WaitConditionCallbackConnection', {
        authorization: Authorization.apiKey(
          'dummy',
          cdk.SecretValue.unsafePlainText('dummy'),
        ),
      });

    const callbackUrl = '{% $ResourceProperties.waitConditionCallbackURL %}';
    const callback = HttpInvoke.jsonata(this, 'Callback', {
      apiRoot: `{% $match(${callbackUrl}, /(https:\\/\\/[^/]+)\\/(.*)\\?/).groups[0] %}`,
      apiEndpoint: cdk.aws_stepfunctions.TaskInput.fromText(
        `{% $match(${callbackUrl}, /(https:\\/\\/[^/]+)\\/(.*)\\?/).groups[1] ~> $decodeUrlComponent() %}`,
      ),
      method: cdk.aws_stepfunctions.TaskInput.fromText('PUT'),
      headers: cdk.aws_stepfunctions.TaskInput.fromObject({
        'Content-Type': [''],
      }),
      connection,
      body: cdk.aws_stepfunctions.TaskInput.fromObject({
        Status: 'SUCCESS',
        UniqueId: props.uniqueId,
        Reason: props.reason ?? 'Complete',
        Data: props.data ?? '',
      }),
      queryStringParameters: cdk.aws_stepfunctions.TaskInput.fromText(
        `{% ${callbackUrl} ~> $substringAfter('?') ~> $split('&') ~> $map(function($v) {( $kv := $split($v, '='); {$kv[0]: $decodeUrlComponent($kv[1])} )}) ~> $merge %}`,
      ),
    });

    this.startState = callback;
    this.endStates = [callback];
  }
}
