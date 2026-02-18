export interface JsonataObject {
  readonly [key: string]: JsonataObject;
}

export class JsonataPathObject {
  static of(path: string): JsonataObject {
    const newPath = new JsonataPathObject(path);
    return new Proxy({}, newPath) as JsonataObject;
  }
  constructor(readonly path: string) {}
  get(_target: object, propertyKey: PropertyKey, _receiver?: unknown) {
    if (propertyKey === 'toString' || propertyKey === Symbol.toPrimitive) {
      return () => this.path;
    }
    return JsonataPathObject.of(`${this.path}.${propertyKey.toString()}`);
  }
}

/**
 *
 */
export interface JsonataContextExecution {
  readonly id: string;
  readonly input: JsonataObject;
  readonly name: string;
  readonly roleArn: string;
  readonly startTime: string;
  readonly redriveCount: string;
  readonly redriveTime: string;
}
export interface JsonataContextState {
  readonly enteredTime: string;
  readonly name: string;
  readonly retryCount: string;
}
export interface JsonataContextStateMachine {
  readonly id: string;
  readonly name: string;
}
export interface JsonataContextTask {
  readonly token: string;
}
export interface JsonataContext {
  readonly execution: JsonataContextExecution;
  readonly state: JsonataContextState;
  readonly stateMachine: JsonataContextStateMachine;
  readonly task: JsonataContextTask;
}
export interface JsonataErrorOutput {
  readonly error: string;
  readonly cause: string;
}
export interface JsonataStates {
  readonly input: JsonataObject;
  readonly result: JsonataObject;
  readonly errorOutput: JsonataErrorOutput;
  readonly context: JsonataContext;
}

export class Jsonata {
  static readonly states = {
    input: JsonataPathObject.of('$states.input'),
    result: JsonataPathObject.of('$states.result'),
    errorOutput: {
      toString: () => '$states.errorOutput',
      error: '$states.errorOutput.Error',
      cause: '$states.errorOutput.Cause',
    },
    context: {
      toString: () => '$states.context',
      execution: {
        toString: () => '$states.context.Execution',
        id: '$states.context.Execution.Id',
        input: JsonataPathObject.of('$states.context.Execution.Input'),
        name: '$states.context.Execution.Name',
        roleArn: '$states.context.Execution.RoleArn',
        startTime: '$states.context.Execution.StartTime',
        redriveCount: '$states.context.Execution.RedriveCount',
        redriveTime: '$states.context.Execution.RedriveTime',
      },
      state: {
        toString: () => '$states.context.State',
        enteredTime: '$states.context.State.EnteredTime',
        name: '$states.context.State.Name',
        retryCount: '$states.context.State.RetryCount',
      },
      stateMachine: {
        toString: () => '$states.context.StateMachine',
        id: '$states.context.StateMachine.Id',
        name: '$states.context.StateMachine.Name',
      },
      task: {
        toString: () => '$states.context.Task',
        token: '$states.context.Task.Token',
      },
    },
  } as JsonataStates;
  static map(arr: any, func: any) {
    return `$map(${arr}, ${func})`;
  }
}
