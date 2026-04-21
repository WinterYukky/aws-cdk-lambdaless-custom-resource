import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import {
  DefinitionBody,
  Pass,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { CustomResourceFlow, LambdalessWaitCondition } from '../src';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'WaitConditionIntegTest');

const flow = new CustomResourceFlow(stack, 'Flow', {
  onCreate: Pass.jsonata(stack, 'CreateWithData', {
    outputs: {
      PhysicalResourceId: '{% $RequestId %}',
      Data: {
        message: 'Hello, World!',
        endpoint: 'https://api.example.com',
      },
    },
  }),
  onDelete: Pass.jsonata(stack, 'DeleteNoOp', {
    outputs: { PhysicalResourceId: '{% $PhysicalResourceId %}' },
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

// Exercise a JSON.stringify'd context. The returned token must survive being
// embedded inside a string literal that CDK re-serializes at synthesis time
// (e.g. any construct that goes through `Stack.toJsonString`, or user code
// that calls `JSON.stringify` on an object containing tokens).
new cdk.CfnOutput(stack, 'StringifiedPayload', {
  value: JSON.stringify({
    message: waitCondition.getAttString('message'),
    endpoint: waitCondition.getAttString('endpoint'),
  }),
});

const integ = new IntegTest(app, 'WaitConditionTest', {
  testCases: [stack],
});

const describe = integ.assertions.awsApiCall(
  'CloudFormation',
  'describeStacks',
  {
    StackName: stack.stackName,
  },
);
// The integ-tests SDK handler auto-parses JSON strings in the response
// (`deepParseJson`). We assert on the parsed fields, which also proves that
// the stringified payload round-trips through CloudFormation as valid JSON.
describe.assertAtPath(
  'Stacks.0.Outputs.0.OutputValue.message',
  ExpectedResult.stringLikeRegexp('Hello, World!'),
);
describe.assertAtPath(
  'Stacks.0.Outputs.0.OutputValue.endpoint',
  ExpectedResult.stringLikeRegexp('https://api.example.com'),
);
