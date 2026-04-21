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
        s3Prefix: 's3://my-bucket/path/to/artifact',
        region: 'ap-northeast-1',
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

// Exercise a JSON.stringify'd context (as used by, e.g.,
// `eks.Cluster#addManifest`). The returned token must survive being embedded
// inside a string literal that CDK resolves at synthesis time.
new cdk.CfnOutput(stack, 'StringifiedPayload', {
  value: JSON.stringify({
    s3Prefix: waitCondition.getAttString('s3Prefix'),
    region: waitCondition.getAttString('region'),
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
  'Stacks.0.Outputs.0.OutputValue.s3Prefix',
  ExpectedResult.stringLikeRegexp('s3://my-bucket/path/to/artifact'),
);
describe.assertAtPath(
  'Stacks.0.Outputs.0.OutputValue.region',
  ExpectedResult.stringLikeRegexp('ap-northeast-1'),
);
