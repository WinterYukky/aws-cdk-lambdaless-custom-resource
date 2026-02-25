import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BucketGrants, IBucketRef } from 'aws-cdk-lib/aws-s3';
import {
  Choice,
  Condition,
  DefinitionBody,
  Pass,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { CustomResourceFlow, LambdalessCustomResource } from '../../src';

const AUTO_DELETE_OBJECTS_TAG = 'aws-cdk:auto-delete-objects';

export interface AutoDeleteObjectsProps {
  readonly bucket: IBucketRef;
}

export class AutoDeleteObjects extends Construct {
  constructor(scope: Construct, id: string, props: AutoDeleteObjectsProps) {
    super(scope, id);

    const { bucket } = props;

    // Tag the bucket for deletion safety check
    cdk.Tags.of(bucket).add(AUTO_DELETE_OBJECTS_TAG, 'true');

    // Check if bucket is tagged for deletion
    const checkTag = CallAwsService.jsonata(this, 'GetBucketTagging', {
      service: 's3',
      action: 'getBucketTagging',
      iamResources: [bucket.bucketRef.bucketArn],
      parameters: {
        Bucket: '{% $ResourceProperties.BucketName %}',
      },
      assign: {
        IsTagged: `{% $exists($states.result.TagSet[$lowercase(Key) = '${AUTO_DELETE_OBJECTS_TAG}' and Value = 'true']) %}`,
      },
    });

    const skipDeletion = Pass.jsonata(this, 'SkipDeletion', {
      outputs: {
        PhysicalResourceId: '{% $ResourceProperties.BucketName %}',
      },
    });

    // Deny new writes to prevent race conditions (preserve existing policy)
    const getPolicy = CallAwsService.jsonata(this, 'GetBucketPolicy', {
      service: 's3',
      action: 'getBucketPolicy',
      iamResources: [bucket.bucketRef.bucketArn],
      parameters: {
        Bucket: '{% $ResourceProperties.BucketName %}',
      },
      assign: {
        ExistingPolicy:
          '{% $exists($states.result.Policy) ? $parse($states.result.Policy) : {"Version": "2012-10-17", "Statement": []} %}',
      },
    });
    const noPolicyFound = Pass.jsonata(this, 'NoPolicyFound', {
      assign: {
        ExistingPolicy: { Version: '2012-10-17', Statement: [] },
      },
    });
    getPolicy.addCatch(noPolicyFound, {
      outputs: '{% $states.errorOutput %}',
    });

    const denyWrites = CallAwsService.jsonata(this, 'DenyWrites', {
      service: 's3',
      action: 'putBucketPolicy',
      iamResources: [bucket.bucketRef.bucketArn],
      parameters: {
        Bucket: '{% $ResourceProperties.BucketName %}',
        Policy: `{% $string($merge([$ExistingPolicy, {"Statement": $append($ExistingPolicy.Statement, [{"Principal": "*", "Effect": "Deny", "Action": ["s3:PutObject"], "Resource": ["arn:aws:s3:::" & $ResourceProperties.BucketName & "/*"]}])}])) %}`,
      },
    });
    denyWrites.addCatch(
      Pass.jsonata(this, 'DenyWritesFailed', {
        comment: 'Non-fatal: bucket deletion should still proceed',
      }),
      { outputs: '{% $states.errorOutput %}' },
    );

    // List object versions (MaxKeys: 100 to stay within SFn 256KB payload limit)
    const listObjects = CallAwsService.jsonata(this, 'ListObjectVersions', {
      service: 's3',
      action: 'listObjectVersions',
      iamResources: [
        bucket.bucketRef.bucketArn,
        `${bucket.bucketRef.bucketArn}/*`,
      ],
      parameters: {
        Bucket: '{% $ResourceProperties.BucketName %}',
        // 256KB payload limit in SFn requires batching if bucket has many objects, but for demo purposes we assume <100 objects in the bucket
        MaxKeys: 100,
      },
      assign: {
        Objects:
          '{% [($states.result.Versions ~> $map(function($v) { {"Key": $v.Key, "VersionId": $v.VersionId} })), ($states.result.DeleteMarkers ~> $map(function($v) { {"Key": $v.Key, "VersionId": $v.VersionId} }))] %}',
        IsTruncated: '{% $states.result.IsTruncated %}',
      },
    });

    // Delete objects
    const deleteObjects = CallAwsService.jsonata(this, 'DeleteObjects', {
      service: 's3',
      action: 'deleteObjects',
      iamResources: [bucket.bucketRef.bucketArn, bucket.bucketRef.bucketArn],
      parameters: {
        Bucket: '{% $ResourceProperties.BucketName %}',
        Delete: {
          Objects: '{% $Objects %}',
        },
      },
    });

    // Check if more objects to delete
    const checkMore = Choice.jsonata(this, 'MoreObjects?')
      .when(Condition.jsonata('{% $IsTruncated = true %}'), listObjects)
      .otherwise(
        Pass.jsonata(this, 'Done', {
          outputs: {
            PhysicalResourceId: '{% $ResourceProperties.BucketName %}',
          },
        }),
      );

    // Empty bucket flow: list -> delete -> check if more
    const emptyBucket = listObjects.next(
      Choice.jsonata(this, 'HasObjects?')
        .when(
          Condition.jsonata('{% $count($Objects) > 0 %}'),
          deleteObjects.next(checkMore),
        )
        .otherwise(
          Pass.jsonata(this, 'BucketEmpty', {
            outputs: {
              PhysicalResourceId: '{% $ResourceProperties.BucketName %}',
            },
          }),
        ),
    );

    // On Delete: check tag -> get policy -> deny writes -> empty bucket
    const noSuchBucket = Pass.jsonata(this, 'BucketDoesNotExist', {
      outputs: {
        PhysicalResourceId: '{% $ResourceProperties.BucketName %}',
      },
    });

    const onDelete = checkTag.next(
      Choice.jsonata(this, 'IsTaggedForDeletion?')
        .when(
          Condition.jsonata('{% $IsTagged = true %}'),
          getPolicy.next(denyWrites).next(emptyBucket),
        )
        .otherwise(skipDeletion),
    );
    noPolicyFound.next(denyWrites);
    checkTag.addCatch(
      Choice.jsonata(this, 'CheckTagError')
        .when(
          Condition.jsonata(
            "{% $contains($states.input.Cause, 'NoSuchBucket') %}",
          ),
          noSuchBucket,
        )
        .otherwise(noSuchBucket),
      { outputs: '{% $states.errorOutput %}' },
    );

    const flow = new CustomResourceFlow(this, 'Flow', {
      onCreate: Pass.jsonata(this, 'CreateNoOp', {
        outputs: {
          PhysicalResourceId: '{% $ResourceProperties.BucketName %}',
        },
      }),
      onUpdate: Pass.jsonata(this, 'UpdateBucketName', {
        outputs: {
          PhysicalResourceId: '{% $ResourceProperties.BucketName %}',
        },
      }),
      onDelete,
    });

    const stateMachine = new StateMachine(this, 'StateMachine', {
      definitionBody: DefinitionBody.fromChainable(flow),
    });

    // Grant S3 permissions
    const bucketGrants = BucketGrants.fromBucket(bucket);
    bucketGrants.read(stateMachine);
    bucketGrants.delete(stateMachine);
    stateMachine.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          's3:PutBucketPolicy',
          's3:GetBucketPolicy',
          's3:GetBucketTagging',
        ],
        resources: [bucket.bucketRef.bucketArn],
      }),
    );

    const cr = new LambdalessCustomResource(this, 'Resource', {
      stateMachine,
      properties: {
        BucketName: bucket.bucketRef.bucketName,
      },
      resourceType: 'Custom::S3AutoDeleteObjects',
    });

    cr.node.addDependency(bucket);
  }
}
