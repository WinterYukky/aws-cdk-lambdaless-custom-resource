import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import {
  DefinitionBody,
  Pass,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { CustomResourceFlow, LambdalessCustomResource } from '../src';

export const app = new cdk.App();

// Application stage containing LambdalessCustomResource
class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const stack = new cdk.Stack(this, 'AppStack');

    const flow = new CustomResourceFlow(stack, 'Flow', {
      onCreate: Pass.jsonata(stack, 'Create', {
        outputs: {
          PhysicalResourceId: 'pipeline-resource',
          Data: {
            message: '{% $states.input.ResourceProperties.value %}',
          },
        },
      }),
    });

    new LambdalessCustomResource(stack, 'CustomResource', {
      stateMachine: new StateMachine(stack, 'StateMachine', {
        definitionBody: DefinitionBody.fromChainable(flow),
      }),
      properties: {
        value: 'from-pipeline',
      },
    });
  }
}

// Pipeline stack
export const pipelineStack = new cdk.Stack(app, 'ViaCdkPipelineIntegTest');

const sourceBucket = new Bucket(pipelineStack, 'SourceBucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  versioned: true,
});

new BucketDeployment(pipelineStack, 'UploadSource', {
  sources: [
    Source.asset(path.join(__dirname, '..'), {
      exclude: [
        'node_modules',
        'cdk.out',
        '.git',
        '**/*.snapshot',
        '**/*.snapshot/**',
        'examples',
        'test/integ.*',
      ],
      bundling: {
        image: cdk.DockerImage.fromRegistry(
          'public.ecr.aws/docker/library/alpine',
        ),
        user: 'root',
        outputType: cdk.BundlingOutput.NOT_ARCHIVED,
        command: [
          'sh',
          '-c',
          'apk add --no-cache zip && cd /asset-input && zip -r /asset-output/source.zip . -x "node_modules/*" "cdk.out/*" ".git/*" "*.snapshot/*" "examples/*" "test/integ.*"',
        ],
      },
    }),
  ],
  destinationBucket: sourceBucket,
});

const artifactsBucket = new Bucket(pipelineStack, 'ArtifactsBucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

export const pipeline = new CodePipeline(pipelineStack, 'Pipeline', {
  artifactBucket: artifactsBucket,
  synth: new CodeBuildStep('Synth', {
    input: CodePipelineSource.s3(sourceBucket, 'source.zip'),
    buildEnvironment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
    },
    installCommands: ['n 24', 'npm i -g yarn'],
    commands: [
      'yarn install --frozen-lockfile',
      'yarn cdk synth --app "yarn ts-node test/integ-cdk-pipeline-app.ts"',
    ],
  }),
  selfMutation: false,
});

pipeline.addStage(new AppStage(pipelineStack, 'Deploy'));
pipeline.buildPipeline();
cdk.RemovalPolicies.of(app).apply(cdk.RemovalPolicy.DESTROY);
