import { IntegTest, ExpectedResult } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { RestrictDefaultSecurityGroup } from '../examples/restrict-default-security-group';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'RestrictDefaultSecurityGroupIntegTest');

const vpc = new Vpc(stack, 'Vpc', {
  natGateways: 0,
  restrictDefaultSecurityGroup: false,
});

new RestrictDefaultSecurityGroup(stack, 'RestrictDefaultSG', {
  vpcDefaultSecurityGroup: vpc.vpcDefaultSecurityGroup,
});

new IntegTest(app, 'RestrictDefaultSecurityGroupTest', {
  testCases: [stack],
  diffAssets: true,
}).assertions
  .awsApiCall('EC2', 'describeSecurityGroups', {
    GroupIds: [vpc.vpcDefaultSecurityGroup],
  })
  .expect(
    ExpectedResult.objectLike({
      SecurityGroups: [
        {
          IpPermissions: [],
          IpPermissionsEgress: [],
        },
      ],
    }),
  );
