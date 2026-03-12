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
  WaitConditionCallback,
} from '../../src';

/**
 * Example: Wait for an async Batch job using LambdalessWaitCondition.
 *
 * This demonstrates how to use LambdalessWaitCondition to wait for a
 * long-running AWS Batch job to complete. The custom resource triggers
 * the job, polls for completion, and signals the WaitCondition when done.
 */
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

    const uniqueId = 'batch-job';

    // Submit the Batch job
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

    // Wait before polling
    const wait = Wait.jsonata(this, 'Wait', {
      time: WaitTime.duration(cdk.Duration.seconds(60)),
    });

    // Describe the job to check status
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

    // Callback to WaitCondition on success
    const callback = new WaitConditionCallback(this, 'Callback', {
      uniqueId: `{% "${uniqueId}" %}`,
      data: '{% $ResourceProperties.artifactS3Prefix %}',
    });

    // Check if job is done
    const checkStatus = Choice.jsonata(this, 'JobFinished?')
      .when(
        Condition.jsonata("{% $JobStatus = 'SUCCEEDED' %}"),
        callback,
      )
      .when(
        Condition.jsonata("{% $JobStatus = 'FAILED' %}"),
        Pass.jsonata(this, 'JobFailed'),
      )
      .otherwise(wait);

    // Chain: submit -> wait -> describe -> check
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

    const waitCondition = new LambdalessWaitCondition(
      this,
      'WaitCondition',
      {
        stateMachine,
        timeout: cdk.Duration.hours(12),
        properties: {
          jobDefinitionArn: props.jobDefinitionArn,
          jobQueueArn: props.jobQueueArn,
          artifactS3Prefix: props.artifactS3Prefix,
        },
        resourceType: 'Custom::BatchJobWaitCondition',
      },
    );

    this.data = waitCondition.getDataById(uniqueId);
  }
}
