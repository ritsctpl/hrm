// src/services/activityService.ts

import api from './api';

export const fetchActivities = async (site: string) => {
  const response = await api.post('/activity-service/retrieveTop50', { site });
  return response.data.activityList;
};




export const fetchTop50Activity = async (site: string) => {
  const response = await api.post('/activity-service/retrieveTop50', { site });
  // console.log(response,'Activity Top 50 Response');
  
  return response.data.activityList;
};

export const retrieveHookActivity = async (site: string) => {
  const response = await api.post('/activity-service/retrieveHookActivity', { site });
  // console.log(response,'retrieveHookActivity Response');
  
  return response.data;
};

export const fetchAllActivityGroup = async (site: string) => {
  const response = await api.post('/activitygroup-service/retrieveAll', { site });
  return response.data.activityGroupList;
};

export const retrieveAllBOMBySite = async (site: string) => {
  const response = await api.post('/bom-service/retrieveAll', { site });
  return response.data.activityGroupList;
};







interface ActivityData {
  site: string;
  userId: string;
  activityId: string;
  description: string;
  activityGroupList: {
      activityGroupName: string;
  }[];
  url: string;
  enabled: boolean;
  visibleInActivityManager: boolean;
  type: string;
  listOfMethods: {
      methodName: string;
  }[];
  activityRules: {
      ruleName: string;
      setting: string;
  }[];
  activityHookList: {
      sequence: string;
      hookPoint: string;
      activity: string;
      hookableMethod: string;
      enable: boolean;
      userArgument: string;
  }[];
}


export const createActivity = async (activityData: ActivityData) => {
  try {
    const response = await api.post('/activity-service/create', activityData);
    // console.log('Create Activity Response:', response);

    return response.data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export const updateActivity = async (activityData: ActivityData) => {
  try {
    const response = await api.post('/activity-service/update', activityData);
    // console.log('Update Activity Response:', response);

    return response.data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export const retrieveCustomDataList = async (site: string, category: string, userId: string) => {
  const response = await api.post('/customdata-service/retrieveByCategory', { site, category, userId });
  // console.log(response,'Custom Data List Response');
  
  return response.data;
};

export const deleteActivity = async (site: string, activityId: string,  userId: string, currentSite: string) => {
  const response = await api.post('/activity-service/delete', { site, activityId, userId, currentSite });
  // console.log(response,'activity Delete Response');
  
  return response.data;
};

export const retrieveActivity = async (site: string, activityId: string, currentSite: string)   => {
  const response = await api.post('/activity-service/retrieve', { site, activityId, currentSite });
  return response.data;
};

export const retrieveAllActivity = async (site: string, activityId: string) => {
  console.log("retrieve all response: ", activityId)
  const response = await api.post('/activity-service/retrieveByActivityId', { site, activityId });
  // console.log(response,'all activity  Response');
  
  return response.data.activityList;
};

export const retrieveAllReasonCodeBySite = async (site: string) => {
  const response = await api.post('/reasoncode-service/retrieveAll', { site });
  // console.log(response,'reason code Delete Response');
  
  return response.data.reasonCodeResponseList;
};



