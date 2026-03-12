import * as cdk from 'aws-cdk-lib';
import {
  Choice,
  Condition,
  DefinitionBody,
  Pass,
  StateMachine,
  Wait,
  WaitTime,
} from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import {
  CustomResourceFlow,
  LambdalessWaitCondition,
} from '../../src';

export interface BatchJobWaitConditionProps {
  readonly jobDefinitionArn: string;
  readonly jobQueueArn: string;
  readonly artifactS3Prefix: string;
}

export class BatchJobWaitCondition extends Construct {
  readonly data: string;

  constructor(
    scope: Construct,
    id: string,
    props: BatchJobWaitConditionProps,
  ) {
    super(scope, id);

    const submitJob = CallAwsService.jsonata(this, 'SubmitJob', {
      service: 'batch',
      action: 'submitJob',
      iamResources: ['*'],
      parameters: {
        JobDefinition: '{% $ResourceProperties.jobDefinitionArn %}',
        JobQueue: '{% $ResourceProperties.jobQueueArn %}',
        JobName: '{% "compile-" & $RequestId %}',
      },
      assign: {
        JobId: '{% $states.result.JobId %}',
      },
    });

    const wait = Wait.jsonata(this, 'Wait', {
      time: WaitTime.duration(cdk.Duration.seconds(60)),
    });

    const describeJob = CallAwsService.jsonata(this, 'DescribeJob', {
      service: 'batch',
      action: 'describeJobs',
      iamResources: ['*'],
      parameters: {
        Jobs: ['{% $JobId %}'],
      },
      assign: {
        JobStatus: '{% $states.result.Jobs[0].Status %}',
      },
    });

    const succeeded = Pass.jsonata(this, 'Succeeded', {
      outputs: {
        PhysicalResourceId: '{% $JobId %}',
        Data: {
          artifactS3Prefix: '{% $ResourceProperties.artifactS3Prefix %}',
        },
      },
    });

    const checkStatus = Choice.jsonata(this, 'JobFinished?')
      .when(Condition.jsonata("{% $JobStatus = 'SUCCEEDED' %}"), succeeded)
      .when(
        Condition.jsonata("{% $JobStatus = 'FAILED' %}"),
        Pass.jsonata(this, 'JobFailed'),
      )
      .otherwise(wait);

    const onCreate = submitJob.next(wait).next(describeJob).next(checkStatus);

    const flow = new CustomResourceFlow(this, 'Flow', {
      onCreate,
      onDelete: Pass.jsonata(this, 'DeleteNoOp', {
        outputs: {
          PhysicalResourceId: '{% $PhysicalResourceId %}',
        },
      }),
    });

    const stateMachine = new StateMachine(this, 'StateMachine', {
      definitionBody: DefinitionBody.fromChainable(flow),
    });

    const waitCondition = new LambdalessWaitCondition(this, 'WaitCondition', {
      stateMachine,
      timeout: cdk.Duration.hours(12),
      properties: {
        jobDefinitionArn: props.jobDefinitionArn,
        jobQueueArn: props.jobQueueArn,
        artifactS3Prefix: props.artifactS3Prefix,
      },
      resourceType: 'Custom::BatchJobWaitCondition',
    });

    this.data = waitCondition.data;
  }
}
