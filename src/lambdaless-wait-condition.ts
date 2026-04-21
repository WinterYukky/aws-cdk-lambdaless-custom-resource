import * as cdk from 'aws-cdk-lib';
import {
  DefinitionBody,
  IStateMachine,
  Pass,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { CustomResourceFlow } from './fragments';
import { LambdalessCustomResource } from './lambdaless-custom-resource';

export interface LambdalessWaitConditionProps {
  readonly stateMachine: IStateMachine;
  /**
   * @default Duration.hours(12)
   */
  readonly timeout?: cdk.Duration;
  /**
   * @default - automatically determined by getAttString calls
   */
  readonly count?: number;
  readonly properties?: { [key: string]: any };
  readonly resourceType?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class LambdalessWaitCondition extends Construct {
  readonly attrData: string;
  private readonly uniqueIds = new Set<string>();
  private readonly explicitCount?: number;
  private readonly removalPolicy?: cdk.RemovalPolicy;
  private parsedResource?: LambdalessCustomResource;

  constructor(
    scope: Construct,
    id: string,
    props: LambdalessWaitConditionProps,
  ) {
    super(scope, id);
    const timeout = props.timeout ?? cdk.Duration.hours(12);
    this.explicitCount = props.count;
    this.removalPolicy = props.removalPolicy;

    const handle = new cdk.CfnWaitConditionHandle(this, 'Handle');
    const customResource = new LambdalessCustomResource(this, 'Resource', {
      stateMachine: props.stateMachine,
      resourceType: props.resourceType,
      removalPolicy: props.removalPolicy,
      properties: { ...props.properties, waitConditionCallbackURL: handle.ref },
    });

    const waitCondition = new cdk.CfnWaitCondition(this, 'WaitCondition', {
      count: cdk.Lazy.number({
        produce: () => this.explicitCount ?? (this.uniqueIds.size || 1),
      }),
      timeout: timeout.toSeconds().toString(),
      handle: handle.ref,
    });
    waitCondition.node.addDependency(customResource);
    this.attrData = waitCondition.attrData.toString();
  }

  /**
   * Returns the value of an attribute signaled to the wait condition through
   * the key/value pairs encoded in `attrData` (the JSON document assembled by
   * `CfnWaitCondition` from each `SignalResource` call).
   *
   * Internally, this parses `attrData` through an auxiliary
   * `LambdalessCustomResource` so that the returned token is a simple
   * `Fn::GetAtt`. This avoids CloudFormation template escaping pitfalls that
   * occur when the raw `Fn::Split`/`Fn::Select` chain is embedded in contexts
   * whose content ends up being `JSON.stringify`'d by CDK (for example,
   * `eks.Cluster#addManifest`).
   *
   * The auxiliary resource is created lazily on the first call, so consumers
   * that do not call `getAttString` pay no extra cost.
   */
  getAttString(uniqueId: string): string {
    this.uniqueIds.add(uniqueId);
    return this.ensureParsedResource().getAttString(uniqueId);
  }

  private ensureParsedResource(): LambdalessCustomResource {
    if (this.parsedResource) {
      return this.parsedResource;
    }
    const flow = new CustomResourceFlow(this, 'ParseFlow', {
      onCreate: Pass.jsonata(this, 'ParseCreate', {
        outputs: {
          PhysicalResourceId: '{% $RequestId %}',
          Data: '{% $parse($ResourceProperties.attrData) %}',
        },
      }),
      onUpdate: Pass.jsonata(this, 'ParseUpdate', {
        outputs: {
          Data: '{% $parse($ResourceProperties.attrData) %}',
        },
      }),
      onDelete: Pass.jsonata(this, 'ParseDelete', {
        outputs: {
          PhysicalResourceId: '{% $PhysicalResourceId %}',
        },
      }),
    });
    const stateMachine = new StateMachine(this, 'ParseStateMachine', {
      definitionBody: DefinitionBody.fromChainable(flow),
    });
    this.parsedResource = new LambdalessCustomResource(this, 'Parsed', {
      stateMachine,
      removalPolicy: this.removalPolicy,
      properties: {
        attrData: this.attrData,
      },
    });
    return this.parsedResource;
  }
}
