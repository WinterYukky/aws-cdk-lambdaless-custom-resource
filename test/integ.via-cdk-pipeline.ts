import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import { app, pipeline, pipelineStack } from './integ-cdk-pipeline-app';

const integ = new IntegTest(app, 'ViaCdkPipelineTest', {
  testCases: [pipelineStack],
  hooks: {
    preDestroy: [
      'aws cloudformation delete-stack --stack-name Deploy-AppStack',
      'aws cloudformation wait stack-delete-complete --stack-name Deploy-AppStack',
    ],
  },
});

// Explicitly kick the pipeline to ensure we check this execution, not a previous one
const start = integ.assertions.awsApiCall(
  'CodePipeline',
  'startPipelineExecution',
  {
    name: pipeline.pipeline.pipelineName,
  },
);

// Pipeline stages: 0=Source, 1=Build, 2=Deploy
const DEPLOY_STAGE_INDEX = 2;

// Wait for pipeline Deploy stage to succeed
const check = integ.assertions
  .awsApiCall('CodePipeline', 'getPipelineState', {
    name: pipeline.pipeline.pipelineName,
  })
  .waitForAssertions({
    totalTimeout: cdk.Duration.minutes(15),
    interval: cdk.Duration.seconds(30),
  })
  .assertAtPath(
    `stageStates.${DEPLOY_STAGE_INDEX}.latestExecution.status`,
    ExpectedResult.stringLikeRegexp('Succeeded'),
  );

start.next(check);
