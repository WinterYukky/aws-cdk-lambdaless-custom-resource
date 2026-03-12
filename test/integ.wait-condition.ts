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
      Data: { s3Prefix: 's3://my-bucket/path/to/artifact' },
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

new cdk.CfnOutput(stack, 'S3Prefix', {
  value: waitCondition.getDataById('s3Prefix'),
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
describe.assertAtPath(
  'Stacks.0.Outputs.0.OutputValue',
  ExpectedResult.stringLikeRegexp('s3://my-bucket/path/to/artifact'),
);
