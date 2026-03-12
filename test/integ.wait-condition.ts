import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import {
  DefinitionBody,
  Pass,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import {
  CustomResourceFlow,
  LambdalessWaitCondition,
  WaitConditionCallback,
} from '../src';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'WaitConditionIntegTest');

const uniqueId = 'test-signal';

// Simple flow: on Create, immediately callback with data containing special chars
const callback = new WaitConditionCallback(stack, 'Callback', {
  uniqueId: `{% "${uniqueId}" %}`,
  data: '{% "s3://my-bucket/path/to/artifact" %}',
});

const flow = new CustomResourceFlow(stack, 'Flow', {
  onCreate: callback,
  onDelete: Pass.jsonata(stack, 'DeleteNoOp', {
    outputs: {
      PhysicalResourceId: '{% $PhysicalResourceId %}',
    },
  }),
});

const stateMachine = new StateMachine(stack, 'StateMachine', {
  definitionBody: DefinitionBody.fromChainable(flow),
});

const waitCondition = new LambdalessWaitCondition(stack, 'WaitCondition', {
  stateMachine,
  timeout: cdk.Duration.minutes(5),
  resourceType: 'Custom::WaitConditionTest',
});

new cdk.CfnOutput(stack, 'WaitConditionData', {
  value: waitCondition.getDataById(uniqueId),
});

new cdk.CfnOutput(stack, 'WaitConditionRawData', {
  value: waitCondition.attrData,
});

const integ = new IntegTest(app, 'WaitConditionTest', {
  testCases: [stack],
});

const describe = integ.assertions.awsApiCall(
  'CloudFormation',
  'describeStacks',
  { StackName: stack.stackName },
);

describe.assertAtPath(
  'Stacks.0.Outputs.0.OutputValue',
  ExpectedResult.stringLikeRegexp('s3://my-bucket/path/to/artifact'),
);
