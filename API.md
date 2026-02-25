# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### CustomResourceFlow <a name="CustomResourceFlow" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow"></a>

#### Initializers <a name="Initializers" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.Initializer"></a>

```typescript
import { CustomResourceFlow } from 'aws-cdk-lambdaless-custom-resource'

new CustomResourceFlow(scope: Construct, id: string, props: CustomResourceFlowProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.Initializer.parameter.id">id</a></code> | <code>string</code> | Descriptive identifier for this chainable. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.Initializer.parameter.props">props</a></code> | <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps">CustomResourceFlowProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.Initializer.parameter.id"></a>

- *Type:* string

Descriptive identifier for this chainable.

---

##### `props`<sup>Required</sup> <a name="props" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.Initializer.parameter.props"></a>

- *Type:* <a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps">CustomResourceFlowProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.next">next</a></code> | Continue normal execution with the given state. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.prefixStates">prefixStates</a></code> | Prefix the IDs of all states in this state machine fragment. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.toSingleState">toSingleState</a></code> | Wrap all states in this state machine fragment up into a single state. |

---

##### `toString` <a name="toString" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

##### `next` <a name="next" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.next"></a>

```typescript
public next(next: IChainable): Chain
```

Continue normal execution with the given state.

###### `next`<sup>Required</sup> <a name="next" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.next.parameter.next"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable

---

##### `prefixStates` <a name="prefixStates" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.prefixStates"></a>

```typescript
public prefixStates(prefix?: string): StateMachineFragment
```

Prefix the IDs of all states in this state machine fragment.

Use this to avoid multiple copies of the state machine all having the
same state IDs.

###### `prefix`<sup>Optional</sup> <a name="prefix" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.prefixStates.parameter.prefix"></a>

- *Type:* string

The prefix to add.

Will use construct ID by default.

---

##### `toSingleState` <a name="toSingleState" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.toSingleState"></a>

```typescript
public toSingleState(options?: SingleStateOptions): Parallel
```

Wrap all states in this state machine fragment up into a single state.

This can be used to add retry or error handling onto this state
machine fragment.

Be aware that this changes the result of the inner state machine
to be an array with the result of the state machine in it. Adjust
your paths accordingly. For example, change 'outputPath' to
'$[0]'.

###### `options`<sup>Optional</sup> <a name="options" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.toSingleState.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.SingleStateOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.isConstruct"></a>

```typescript
import { CustomResourceFlow } from 'aws-cdk-lambdaless-custom-resource'

CustomResourceFlow.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.endStates">endStates</a></code> | <code>aws-cdk-lib.aws_stepfunctions.INextable[]</code> | The states to chain onto if this fragment is used. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.id">id</a></code> | <code>string</code> | Descriptive identifier for this chainable. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.startState">startState</a></code> | <code>aws-cdk-lib.aws_stepfunctions.State</code> | The start state of this state machine fragment. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `endStates`<sup>Required</sup> <a name="endStates" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.endStates"></a>

```typescript
public readonly endStates: INextable[];
```

- *Type:* aws-cdk-lib.aws_stepfunctions.INextable[]

The states to chain onto if this fragment is used.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Descriptive identifier for this chainable.

---

##### `startState`<sup>Required</sup> <a name="startState" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlow.property.startState"></a>

```typescript
public readonly startState: State;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.State

The start state of this state machine fragment.

---


### LambdalessCustomResource <a name="LambdalessCustomResource" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource"></a>

#### Initializers <a name="Initializers" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.Initializer"></a>

```typescript
import { LambdalessCustomResource } from 'aws-cdk-lambdaless-custom-resource'

new LambdalessCustomResource(scope: Construct, id: string, props: LambdalessCustomResourceProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.Initializer.parameter.props">props</a></code> | <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps">LambdalessCustomResourceProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.Initializer.parameter.props"></a>

- *Type:* <a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps">LambdalessCustomResourceProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.getAtt">getAtt</a></code> | Returns the value of an attribute of the custom resource of an arbitrary type. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.getAttString">getAttString</a></code> | Returns the value of an attribute of the custom resource of type string. |

---

##### `toString` <a name="toString" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

##### `getAtt` <a name="getAtt" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.getAtt"></a>

```typescript
public getAtt(attributeName: string): Reference
```

Returns the value of an attribute of the custom resource of an arbitrary type.

Attributes are returned from the custom resource provider through the
`Data` map where the key is the attribute name.

###### `attributeName`<sup>Required</sup> <a name="attributeName" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.getAtt.parameter.attributeName"></a>

- *Type:* string

the name of the attribute.

---

##### `getAttString` <a name="getAttString" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.getAttString"></a>

```typescript
public getAttString(attributeName: string): string
```

Returns the value of an attribute of the custom resource of type string.

Attributes are returned from the custom resource provider through the
`Data` map where the key is the attribute name.

###### `attributeName`<sup>Required</sup> <a name="attributeName" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.getAttString.parameter.attributeName"></a>

- *Type:* string

the name of the attribute.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.isConstruct"></a>

```typescript
import { LambdalessCustomResource } from 'aws-cdk-lambdaless-custom-resource'

LambdalessCustomResource.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.property.ref">ref</a></code> | <code>string</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `ref`<sup>Required</sup> <a name="ref" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResource.property.ref"></a>

```typescript
public readonly ref: string;
```

- *Type:* string

---


## Structs <a name="Structs" id="Structs"></a>

### CustomResourceFlowProps <a name="CustomResourceFlowProps" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps"></a>

#### Initializer <a name="Initializer" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps.Initializer"></a>

```typescript
import { CustomResourceFlowProps } from 'aws-cdk-lambdaless-custom-resource'

const customResourceFlowProps: CustomResourceFlowProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps.property.onCreate">onCreate</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IChainable</code> | The workflow to execute on Create. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps.property.onDelete">onDelete</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IChainable</code> | The workflow to execute on Delete. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps.property.onUpdate">onUpdate</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IChainable</code> | The workflow to execute on Update. |

---

##### `onCreate`<sup>Optional</sup> <a name="onCreate" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps.property.onCreate"></a>

```typescript
public readonly onCreate: IChainable;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable
- *Default:* the onUpdate workflow

The workflow to execute on Create.

---

##### `onDelete`<sup>Optional</sup> <a name="onDelete" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps.property.onDelete"></a>

```typescript
public readonly onDelete: IChainable;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable
- *Default:* no-op

The workflow to execute on Delete.

---

##### `onUpdate`<sup>Optional</sup> <a name="onUpdate" id="aws-cdk-lambdaless-custom-resource.CustomResourceFlowProps.property.onUpdate"></a>

```typescript
public readonly onUpdate: IChainable;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable
- *Default:* no-op

The workflow to execute on Update.

---

### LambdalessCustomResourceProps <a name="LambdalessCustomResourceProps" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps"></a>

Properties to provide a Lambdaless custom resource.

#### Initializer <a name="Initializer" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.Initializer"></a>

```typescript
import { LambdalessCustomResourceProps } from 'aws-cdk-lambdaless-custom-resource'

const lambdalessCustomResourceProps: LambdalessCustomResourceProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.stateMachine">stateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IStateMachine</code> | *No description.* |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.pascalCaseProperties">pascalCaseProperties</a></code> | <code>boolean</code> | Convert all property keys to pascal case. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.properties">properties</a></code> | <code>{[ key: string ]: any}</code> | Properties to pass to the Lambda. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The policy to apply when this resource is removed from the application. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.resourceType">resourceType</a></code> | <code>string</code> | For custom resources, you can specify AWS::CloudFormation::CustomResource (the default) as the resource type, or you can specify your own resource type name. |
| <code><a href="#aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.serviceTimeout">serviceTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | The maximum time that can elapse before a custom resource operation times out. |

---

##### `stateMachine`<sup>Required</sup> <a name="stateMachine" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.stateMachine"></a>

```typescript
public readonly stateMachine: IStateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IStateMachine

---

##### `pascalCaseProperties`<sup>Optional</sup> <a name="pascalCaseProperties" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.pascalCaseProperties"></a>

```typescript
public readonly pascalCaseProperties: boolean;
```

- *Type:* boolean
- *Default:* false

Convert all property keys to pascal case.

---

##### `properties`<sup>Optional</sup> <a name="properties" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.properties"></a>

```typescript
public readonly properties: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}
- *Default:* No properties.

Properties to pass to the Lambda.

Values in this `properties` dictionary can possibly overwrite other values in `CustomResourceProps`
E.g. `ServiceToken` and `ServiceTimeout`
It is recommended to avoid using same keys that exist in `CustomResourceProps`

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* cdk.RemovalPolicy.Destroy

The policy to apply when this resource is removed from the application.

---

##### `resourceType`<sup>Optional</sup> <a name="resourceType" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.resourceType"></a>

```typescript
public readonly resourceType: string;
```

- *Type:* string
- *Default:* AWS::CloudFormation::CustomResource

For custom resources, you can specify AWS::CloudFormation::CustomResource (the default) as the resource type, or you can specify your own resource type name.

For example, you can use "Custom::MyCustomResourceTypeName".

Custom resource type names must begin with "Custom::" and can include
alphanumeric characters and the following characters: _@-. You can specify
a custom resource type name up to a maximum length of 60 characters. You
cannot change the type during an update.

Using your own resource type names helps you quickly differentiate the
types of custom resources in your stack. For example, if you had two custom
resources that conduct two different ping tests, you could name their type
as Custom::PingTester to make them easily identifiable as ping testers
(instead of using AWS::CloudFormation::CustomResource).

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cfn-customresource.html#aws-cfn-resource-type-name](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cfn-customresource.html#aws-cfn-resource-type-name)

---

##### `serviceTimeout`<sup>Optional</sup> <a name="serviceTimeout" id="aws-cdk-lambdaless-custom-resource.LambdalessCustomResourceProps.property.serviceTimeout"></a>

```typescript
public readonly serviceTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(3600)

The maximum time that can elapse before a custom resource operation times out.

The value must be between 1 second and 3600 seconds.

Maps to [ServiceTimeout](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudformation-customresource.html#cfn-cloudformation-customresource-servicetimeout) property for the `AWS::CloudFormation::CustomResource` resource

A token can be specified for this property, but it must be specified with `Duration.seconds()`.

---

*Example*

```typescript
const stack = new Stack();
const durToken = new CfnParameter(stack, 'MyParameter', {
  type: 'Number',
  default: 60,
});
new CustomResource(stack, 'MyCustomResource', {
  serviceToken: 'MyServiceToken',
  serviceTimeout: Duration.seconds(durToken.valueAsNumber),
});
```




