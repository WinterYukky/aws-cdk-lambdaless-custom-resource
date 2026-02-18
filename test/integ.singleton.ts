import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import {
  Pass,
  StateMachine,
  DefinitionBody,
} from 'aws-cdk-lib/aws-stepfunctions';
import { CustomResourceFlow, LambdalessCustomResource } from '../src';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'SingletonIntegTest');

// Create two custom resources to verify singleton behavior
const workflow1 = new CustomResourceFlow(stack, 'Flow1', {
  onCreate: Pass.jsonata(stack, 'Create1', {
    outputs: {
      PhysicalResourceId: 'resource-1',
      Data: {
        message: '{% $states.input.ResourceProperties.value %}',
      },
    },
  }),
});

const workflow2 = new CustomResourceFlow(stack, 'Flow2', {
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
  workflow: new StateMachine(stack, 'StateMachine1', {
    definitionBody: DefinitionBody.fromChainable(workflow1),
  }),
  properties: {
    value: 'first',
  },
});

const cr2 = new LambdalessCustomResource(stack, 'CustomResource2', {
  workflow: new StateMachine(stack, 'StateMachine2', {
    definitionBody: DefinitionBody.fromChainable(workflow2),
  }),
  properties: {
    value: 'second',
  },
});

// Output to verify both resources work independently
new cdk.CfnOutput(stack, 'Message1', {
  value: cr1.getAttString('message'),
});

new cdk.CfnOutput(stack, 'Message2', {
  value: cr2.getAttString('message'),
});

new IntegTest(app, 'SingletonTest', {
  testCases: [stack],
  diffAssets: true,
});
