# AWS CDK Lambdaless Custom Resource

AWS CDK construct library for creating CloudFormation custom resources without Lambda functions, using Step Functions instead.

## Why?

Traditional CloudFormation custom resources require Lambda functions, which add runtime maintenance overhead. This library uses AWS Step Functions instead, eliminating Lambda entirely while supporting long-running workflows (up to 1 hour). Step Functions are serverless and require no runtime maintenance.

## Architecture

```mermaid
graph LR
    CFn[CloudFormation] -->|serviceToken| SNS[SNS Topic]
    SNS --> SQS[SQS Queue]
    SQS --> Pipes[EventBridge Pipes]
    Pipes -->|invoke| Express[Express State Machine]
    Express -->|startExecution| Standard[Your State Machine]
    Express -->|describeExecution| Standard
    Express -->|HttpInvoke| CFn
    Express -.->|timeout| Pipes
```

## Installation

```bash
npm install aws-cdk-lambdaless-custom-resource
```

## Usage

### Basic Example

```typescript
import { CustomResourceFlow, LambdalessCustomResource } from 'aws-cdk-lambdaless-custom-resource';
import { Pass, StateMachine, DefinitionBody } from 'aws-cdk-lib/aws-stepfunctions';
import * as cdk from 'aws-cdk-lib';

const flow = new CustomResourceFlow(this, 'ExampleFlow', {
  onCreate: Pass.jsonata(this, 'Create', {
    outputs: {
      PhysicalResourceId: 'example-id',
      Data: {
        message: '{% $states.input.ResourceProperties.myProperty %}',
      },
    },
  }),
  onUpdate: Pass.jsonata(this, 'Update', {
    outputs: {
      Data: {
        message: '{% $states.input.ResourceProperties.myProperty %}',
      },
    },
  }),
  onDelete: Pass.jsonata(this, 'Delete'),
});

const customResource = new LambdalessCustomResource(this, 'MyCustomResource', {
  stateMachine: new StateMachine(this, 'StateMachine', {
    definitionBody: DefinitionBody.fromChainable(flow),
  }),
  properties: {
    myProperty: 'Hello, World!',
  },
});

// Access custom resource attributes
new cdk.CfnOutput(this, 'Message', {
  value: customResource.getAttString('message'),
});
```

## Examples

- [Restrict default VPC security group](./test/integ.restrict-default-security-group.ts) - Revoke/authorize default security group rules using Step Functions

## State Machine Requirements

The state machine you pass to `LambdalessCustomResource` is invoked by the internal orchestrator whenever CloudFormation sends a Create, Update, or Delete event. You can use `CustomResourceFlow` to route these events, or build your own state machine from scratch.

### Input

Your state machine receives the following input. When using `CustomResourceFlow`, these are also available as variables (e.g. `$RequestType`).

| Variable | Description |
|---|---|
| `$RequestType` | `"Create"`, `"Update"`, or `"Delete"` |
| `$ResourceProperties` | Properties passed to the custom resource |
| `$OldResourceProperties` | Previous properties (Update only, otherwise `null`) |
| `$PhysicalResourceId` | Physical resource ID (Create: `null`) |
| `$LogicalResourceId` | Logical resource ID |
| `$StackId` | CloudFormation stack ID |
| `$RequestId` | Unique request ID |

### Output

Your state machine must return a JSON object. The orchestrator uses this to respond to CloudFormation on your behalf.

```json
{
  "PhysicalResourceId": "unique-id",
  "Data": {
    "key1": "value1",
    "key2": "value2"
  },
  "NoEcho": false
}
```

| Field | Required | Description |
|---|---|---|
| `PhysicalResourceId` | Yes (on Create) | Unique identifier for the resource. If omitted, `RequestId` is used. |
| `Data` | No | Key-value pairs accessible via `getAtt()` / `getAttString()`. Nested objects are flattened with dot notation. |
| `NoEcho` | No | If `true`, masks the output in CloudFormation events. Defaults to `false`. |

Access outputs in your CDK code:

```typescript
customResource.getAttString('key1')  // Returns 'value1'
```

## License

Apache-2.0
