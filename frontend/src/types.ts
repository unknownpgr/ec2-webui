export interface Ec2State {
  instanceType: string;
  instanceName: string;
  instanceId: string;
  publicIpAddress: string;
  state: {
    code: number;
    name: string;
  };
}

export interface Ec2Schedule {
  instanceId: string;
  startupTime: string;
  shutdownTime: string;
}

export interface State {
  ec2State: Ec2State[];
  ec2Schedules: Ec2Schedule[];
}
