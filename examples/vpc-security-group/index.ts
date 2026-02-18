import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  Choice,
  Condition,
  Fail,
  Pass,
  StateMachineFragment,
  DefinitionBody,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { CustomResourceFlow, LambdalessCustomResource } from 'aws-cdk-lambdaless-custom-resource';

const ingressRulesParams = (
  resourceProperties: 'OldResourceProperties' | 'ResourceProperties'
) => {
  const groupId = `{% $${resourceProperties}.DefaultSecurityGroupId %}`;
  return {
    GroupId: groupId,
    IpPermissions: [
      {
        UserIdGroupPairs: [
          {
            GroupId: groupId,
            UserId: '{% $ResourceProperties.Account %}',
          },
        ],
        IpProtocol: '-1',
      },
    ],
  };
};

const egressRulesParams = (
  resourceProperties: 'OldResourceProperties' | 'ResourceProperties'
) => ({
  GroupId: `{% $${resourceProperties}.DefaultSecurityGroupId %}`,
  IpPermissions: [
    {
      IpRanges: [
        {
          CidrIp: '0.0.0.0/0',
        },
      ],
      IpProtocol: '-1',
    },
  ],
});

interface RevokeRulesProps {
  vpcDefaultSecurityGroup: string;
  resourceProperties: 'ResourceProperties' | 'OldResourceProperties';
}

class RevokeRules extends StateMachineFragment {
  startState: cdk.aws_stepfunctions.State;
  endStates: cdk.aws_stepfunctions.INextable[];

  constructor(parent: Construct, id: string, props: RevokeRulesProps) {
    super(parent, id);
    const sgArn = cdk.Stack.of(this).formatArn({
      resource: 'security-group',
      service: 'ec2',
      resourceName: props.vpcDefaultSecurityGroup,
    });

    const failState = Fail.jsonata(this, 'Fail', {
      error: '{% $states.input.Error %}',
      cause: '{% $states.input.Cause %}',
    });

    const revokeSecurityGroupIngress = CallAwsService.jsonata(
      this,
      'RevokeSecurityGroupIngress',
      {
        service: 'ec2',
        action: 'revokeSecurityGroupIngress',
        iamResources: [sgArn],
        parameters: ingressRulesParams(props.resourceProperties),
      }
    );

    const revokeSecurityGroupEgress = CallAwsService.jsonata(
      this,
      'RevokeSecurityGroupEgress',
      {
        service: 'ec2',
        action: 'revokeSecurityGroupEgress',
        iamResources: [sgArn],
        parameters: egressRulesParams(props.resourceProperties),
      }
    );

    revokeSecurityGroupEgress.addCatch(
      Choice.jsonata(this, 'RevokeSecurityGroupEgressCatch')
        .when(
          Condition.jsonata(
            "{% $contains($states.input.Cause, 'The specified rule does not exist in this security group') %}"
          ),
          revokeSecurityGroupIngress
        )
        .otherwise(failState),
      {
        outputs: '{% $states.errorOutput %}',
      }
    );

    revokeSecurityGroupIngress.addCatch(
      Choice.jsonata(this, 'RevokeSecurityGroupIngressCatch')
        .when(
          Condition.jsonata(
            "{% $contains($states.input.Cause, 'The specified rule does not exist in this security group') %}"
          ),
          Pass.jsonata(this, 'RevokeSecurityGroupIngressPass')
        )
        .otherwise(failState),
      {
        outputs: '{% $states.errorOutput %}',
      }
    );

    this.endStates = [
      revokeSecurityGroupEgress.next(revokeSecurityGroupIngress),
    ];
    this.startState = revokeSecurityGroupEgress;
  }
}

interface AuthorizeRulesProps {
  vpcDefaultSecurityGroup: string;
  resourceProperties: 'ResourceProperties' | 'OldResourceProperties';
}

class AuthorizeRules extends StateMachineFragment {
  startState: cdk.aws_stepfunctions.State;
  endStates: cdk.aws_stepfunctions.INextable[];

  constructor(parent: Construct, id: string, props: AuthorizeRulesProps) {
    super(parent, id);
    const sgArn = cdk.Stack.of(this).formatArn({
      resource: 'security-group',
      service: 'ec2',
      resourceName: props.vpcDefaultSecurityGroup,
    });

    const startState = CallAwsService.jsonata(
      this,
      'AuthorizeSecurityGroupIngress',
      {
        service: 'ec2',
        action: 'authorizeSecurityGroupIngress',
        iamResources: [sgArn],
        parameters: ingressRulesParams(props.resourceProperties),
      }
    );

    this.endStates = [
      startState.next(
        CallAwsService.jsonata(this, 'AuthorizeSecurityGroupEgress', {
          service: 'ec2',
          action: 'authorizeSecurityGroupEgress',
          iamResources: [sgArn],
          parameters: egressRulesParams(props.resourceProperties),
        })
      ),
    ];
    this.startState = startState;
  }
}

export class VpcSecurityGroupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'Vpc', {
      natGateways: 0,
      restrictDefaultSecurityGroup: false,
    });

    const workflow = new CustomResourceFlow(this, 'CustomResourceFlow', {
      onCreate: new RevokeRules(this, 'RevokeRules on Create', {
        vpcDefaultSecurityGroup: vpc.vpcDefaultSecurityGroup,
        resourceProperties: 'ResourceProperties',
      }).prefixStates(),
      onUpdate: Choice.jsonata(this, 'New Security Group?')
        .when(
          Condition.jsonata(
            '{% $OldResourceProperties.DefaultSecurityGroupId != $ResourceProperties.DefaultSecurityGroupId %}'
          ),
          new AuthorizeRules(this, 'AuthorizeRules on Update', {
            vpcDefaultSecurityGroup: vpc.vpcDefaultSecurityGroup,
            resourceProperties: 'OldResourceProperties',
          })
            .prefixStates()
            .next(
              new RevokeRules(this, 'RevokeRules on Update', {
                vpcDefaultSecurityGroup: vpc.vpcDefaultSecurityGroup,
                resourceProperties: 'ResourceProperties',
              }).prefixStates()
            )
        )
        .otherwise(Pass.jsonata(this, 'No changes')),
      onDelete: new AuthorizeRules(this, 'AuthorizeRules on Delete', {
        vpcDefaultSecurityGroup: vpc.vpcDefaultSecurityGroup,
        resourceProperties: 'ResourceProperties',
      }).prefixStates(),
    });

    new LambdalessCustomResource(this, 'RestrictedSecurityGroup', {
      workflow: new StateMachine(this, 'StateMachine', {
        definitionBody: DefinitionBody.fromChainable(workflow),
      }),
      properties: {
        DefaultSecurityGroupId: vpc.vpcDefaultSecurityGroup,
        Account: cdk.Stack.of(this).account,
      },
      serviceTimeout: cdk.Duration.seconds(15),
      resourceType: 'Custom::VpcRestrictDefaultSG',
    });
  }
}
