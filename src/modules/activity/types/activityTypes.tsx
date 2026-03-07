export interface ActivityGroup {
  activityGroupName: string;
}

export interface ListOfMethods {
  methodName: string;
}

export interface ActivityRule {
  ruleName: string;
  setting: string;
}

export interface ActivityHook {
  sequence: string;
  hookPoint: string;
  activity: string;
  hookableMethod: string;
  enable: boolean;
  userArgument: string;
}

export interface ActivityData {
  site: string;
  userId: string;
  activityId: string;
  description: string;
  activityGroupList: ActivityGroup[];
  url: string;
  enabled: boolean;
  visibleInActivityManager: boolean;
  type: string;
  listOfMethods: ListOfMethods[];
  activityRules: ActivityRule[];
  activityHookList: ActivityHook[];
  createdDateTime?: string;
  updatedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export const defaultActivityData: ActivityData = {
  site: '',
  userId: '',
  activityId: '',
  description: '',
  activityGroupList: [],
  url: '',
  enabled: false,
  visibleInActivityManager: false,
  type: 'Service',
  listOfMethods: [],
  activityRules: [],
  activityHookList: [],
  createdDateTime: '',
  updatedDateTime: '',
  createdBy: '',
  modifiedBy: ''
};
