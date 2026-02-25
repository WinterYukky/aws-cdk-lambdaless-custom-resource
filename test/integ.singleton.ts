import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import {
  DefinitionBody,
  Pass,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { CustomResourceFlow, LambdalessCustomResource } from '../src';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'SingletonIntegTest');

// Create two custom resources to verify singleton behavior
const flow1 = new CustomResourceFlow(stack, 'Flow1', {
  onCreate: Pass.jsonata(stack, 'Create1', {
    outputs: {
      PhysicalResourceId: 'resource-1',
      Data: {
        message: '{% $states.input.ResourceProperties.value %}',
      },
    },
  }),
});

const flow2 = new CustomResourceFlow(stack, 'Flow2', {
  onCreate: Pass.jsonata(stack, 'Create2', {
    outputs: {
      PhysicalResourceId: 'resource-2',
      Data: {
        message: '{% $states.input.ResourceProperties.value %}',
      },
    },
  }),
});

const cr1 = new LambdalessCustomResource(stack, 'CustomResource1', {
  stateMachine: new StateMachine(stack, 'StateMachine1', {
    definitionBody: DefinitionBody.fromChainable(flow1),
  }),
  properties: {
    value: 'first',
  },
});

const cr2 = new LambdalessCustomResource(stack, 'CustomResource2', {
  stateMachine: new StateMachine(stack, 'StateMachine2', {
    definitionBody: DefinitionBody.fromChainable(flow2),
  }),
  properties: {
    value: 'second',
  },
});

const integ = new IntegTest(app, 'SingletonTest', {
  testCases: [stack],
  diffAssets: true,
});

// Output to verify both resources work independently
new cdk.CfnOutput(stack, 'Message1', {
  value: cr1.getAttString('message'),
});

new cdk.CfnOutput(stack, 'Message2', {
  value: cr2.getAttString('message'),
});

// Verify both custom resources return correct values independently
const describe = integ.assertions.awsApiCall(
  'CloudFormation',
  'describeStacks',
  { StackName: stack.stackName },
);

describe.assertAtPath(
  'Stacks.0.Outputs.0.OutputValue',
  ExpectedResult.stringLikeRegexp('second'),
);

describe.assertAtPath(
  'Stacks.0.Outputs.1.OutputValue',
  ExpectedResult.stringLikeRegexp('first'),
);
