import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { AutoDeleteObjects } from '../examples/auto-delete-objects';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'AutoDeleteObjectsIntegTest');

const bucket = new Bucket(stack, 'Bucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  versioned: true,
});

new AutoDeleteObjects(stack, 'AutoDelete', { bucket });

new IntegTest(app, 'AutoDeleteObjectsTest', {
  testCases: [stack],
});
