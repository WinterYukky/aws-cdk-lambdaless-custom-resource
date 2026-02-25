import * as cdk from 'aws-cdk-lib';
import {
  Choice,
  Condition,
  DefinitionBody,
  Fail,
  Pass,
  StateMachine,
  StateMachineFragment,
} from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { CustomResourceFlow, LambdalessCustomResource } from '../../src';

const ingressRulesParams = (
  resourceProperties: 'OldResourceProperties' | 'ResourceProperties',
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
  resourceProperties: 'OldResourceProperties' | 'ResourceProperties',
) => ({
  GroupId: `{% $${resourceProperties}.DefaultSecurityGroupId %}`,
  IpPermissions: [
    {
      IpRanges: [{ CidrIp: '0.0.0.0/0' }],
      IpProtocol: '-1',
    },
  ],
});

interface RevokeRulesProps {
  vpcDefaultSecurityGroup: string;
  resourceProperties: 'ResourceProperties' | 'OldResourceProperties';
}

class RevokeRules extends StateMachineFragment {
  readonly startState: cdk.aws_stepfunctions.State;
  readonly endStates: cdk.aws_stepfunctions.INextable[];

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

    const revokeIngress = CallAwsService.jsonata(this, 'RevokeIngress', {
      service: 'ec2',
      action: 'revokeSecurityGroupIngress',
      iamResources: [sgArn],
      parameters: ingressRulesParams(props.resourceProperties),
    });

    const revokeEgress = CallAwsService.jsonata(this, 'RevokeEgress', {
      service: 'ec2',
      action: 'revokeSecurityGroupEgress',
      iamResources: [sgArn],
      parameters: egressRulesParams(props.resourceProperties),
    });

    revokeEgress.addCatch(
      Choice.jsonata(this, 'RevokeEgressCatch')
        .when(
          Condition.jsonata(
            "{% $contains($states.input.Cause, 'The specified rule does not exist in this security group') %}",
          ),
          revokeIngress,
        )
        .otherwise(failState),
      { outputs: '{% $states.errorOutput %}' },
    );

    revokeIngress.addCatch(
      Choice.jsonata(this, 'RevokeIngressCatch')
        .when(
          Condition.jsonata(
            "{% $contains($states.input.Cause, 'The specified rule does not exist in this security group') %}",
          ),
          Pass.jsonata(this, 'RevokeIngressPass'),
        )
        .otherwise(failState),
      { outputs: '{% $states.errorOutput %}' },
    );

    this.startState = revokeEgress;
    this.endStates = [revokeEgress.next(revokeIngress)];
  }
}

interface AuthorizeRulesProps {
  vpcDefaultSecurityGroup: string;
  resourceProperties: 'ResourceProperties' | 'OldResourceProperties';
}

class AuthorizeRules extends StateMachineFragment {
  readonly startState: cdk.aws_stepfunctions.State;
  readonly endStates: cdk.aws_stepfunctions.INextable[];

  constructor(parent: Construct, id: string, props: AuthorizeRulesProps) {
    super(parent, id);
    const sgArn = cdk.Stack.of(this).formatArn({
      resource: 'security-group',
      service: 'ec2',
      resourceName: props.vpcDefaultSecurityGroup,
    });

    const authorizeIngress = CallAwsService.jsonata(
      this,
      'AuthorizeIngress',
      {
        service: 'ec2',
        action: 'authorizeSecurityGroupIngress',
        iamResources: [sgArn],
        parameters: ingressRulesParams(props.resourceProperties),
      },
    );

    this.startState = authorizeIngress;
    this.endStates = [
      authorizeIngress.next(
        CallAwsService.jsonata(this, 'AuthorizeEgress', {
          service: 'ec2',
          action: 'authorizeSecurityGroupEgress',
          iamResources: [sgArn],
          parameters: egressRulesParams(props.resourceProperties),
        }),
      ),
    ];
  }
}

export interface RestrictDefaultSecurityGroupProps {
  readonly vpcDefaultSecurityGroup: string;
}

/**
 * Restricts the default security group of a VPC by revoking all ingress and egress rules.
 * On delete, the rules are restored.
 */
export class RestrictDefaultSecurityGroup extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: RestrictDefaultSecurityGroupProps,
  ) {
    super(scope, id);

    const sgId = props.vpcDefaultSecurityGroup;

    const flow = new CustomResourceFlow(this, 'Flow', {
      onCreate: new RevokeRules(this, 'RevokeOnCreate', {
        vpcDefaultSecurityGroup: sgId,
        resourceProperties: 'ResourceProperties',
      }).prefixStates(),
      onUpdate: Choice.jsonata(this, 'NewSecurityGroup?')
        .when(
          Condition.jsonata(
            '{% $OldResourceProperties.DefaultSecurityGroupId != $ResourceProperties.DefaultSecurityGroupId %}',
          ),
          new AuthorizeRules(this, 'AuthorizeOnUpdate', {
            vpcDefaultSecurityGroup: sgId,
            resourceProperties: 'OldResourceProperties',
          })
            .prefixStates()
            .next(
              new RevokeRules(this, 'RevokeOnUpdate', {
                vpcDefaultSecurityGroup: sgId,
                resourceProperties: 'ResourceProperties',
              }).prefixStates(),
            ),
        )
        .otherwise(Pass.jsonata(this, 'NoChanges')),
      onDelete: new AuthorizeRules(this, 'AuthorizeOnDelete', {
        vpcDefaultSecurityGroup: sgId,
        resourceProperties: 'ResourceProperties',
      }).prefixStates(),
    });

    new LambdalessCustomResource(this, 'Resource', {
      stateMachine: new StateMachine(this, 'StateMachine', {
        definitionBody: DefinitionBody.fromChainable(flow),
      }),
      properties: {
        DefaultSecurityGroupId: sgId,
        Account: cdk.Stack.of(this).account,
      },
      serviceTimeout: cdk.Duration.seconds(15),
      resourceType: 'Custom::VpcRestrictDefaultSG',
    });
  }
}
