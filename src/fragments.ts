import {
  Choice,
  Condition,
  IChainable,
  INextable,
  IntegrationPattern,
  IStateMachine,
  Pass,
  State,
  StateMachineFragment,
  TaskInput,
} from 'aws-cdk-lib/aws-stepfunctions';
import { StepFunctionsStartExecution } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface CustomResourceFlowProps {
  readonly onCreate: IChainable;
  readonly onUpdate?: IChainable;
  readonly onDelete?: IChainable;
}

export class CustomResourceFlow extends StateMachineFragment {
  readonly startState: State;
  readonly endStates: INextable[];
  constructor(scope: Construct, id: string, props: CustomResourceFlowProps) {
    super(scope, id);

    const onUpdate = props.onUpdate ?? Pass.jsonata(this, 'Update');
    const onDelete = props.onDelete ?? Pass.jsonata(this, 'Delete');

    const choice = Choice.jsonata(this, 'Which Request Type?')
      .when(Condition.jsonata(`{% $RequestType = "Create" %}`), props.onCreate)
      .when(Condition.jsonata(`{% $RequestType = "Update" %}`), onUpdate)
      .when(Condition.jsonata(`{% $RequestType = "Delete" %}`), onDelete);
    const init = Pass.jsonata(this, 'Initialize', {
      assign: {
        RequestType: `{% $states.input.RequestType %}`,
        StackId: `{% $states.input.StackId %}`,
        RequestId: `{% $states.input.RequestId %}`,
        ResourceType: `{% $states.input.ResourceType %}`,
        LogicalResourceId: `{% $states.input.LogicalResourceId %}`,
        PhysicalResourceId: `{% $exists($states.input.PhysicalResourceId) ? $states.input.PhysicalResourceId : null %}`,
        ResourceProperties: `{% $states.input.ResourceProperties %}`,
        OldResourceProperties: `{% $exists($states.input.OldResourceProperties) ? $states.input.OldResourceProperties : null %}`,
      },
    });
    init.next(choice);

    this.startState = init;
    this.endStates = choice.endStates;
  }
}

export interface OriginalStepFunctionsFlowProps {
  readonly stateMachine: IStateMachine;
}
export class OriginalStepFunctionsFlow extends StateMachineFragment {
  readonly startState: State;
  readonly endStates: INextable[];
  constructor(
    scope: Construct,
    id: string,
    props: OriginalStepFunctionsFlowProps,
  ) {
    super(scope, id);
    const startExecution = StepFunctionsStartExecution.jsonata(
      this,
      'StartExecution',
      {
        stateMachine: props.stateMachine,
        input: TaskInput.fromObject({
          RequestType: `{% $RequestType %}`,
          StackId: `{% $StackId %}`,
          RequestId: `{% $RequestId %}`,
          ResourceType: `{% $ResourceType %}`,
          LogicalResourceId: `{% $LogicalResourceId %}`,
          PhysicalResourceId: `{% $PhysicalResourceId %}`,
          ResourceProperties: `{% $ResourceProperties %}`,
          OldResourceProperties: `{% $OldResourceProperties %}`,
        }),
        integrationPattern: IntegrationPattern.RUN_JOB,
      },
    );
    this.startState = startExecution;
    this.endStates = [startExecution];
  }
}
