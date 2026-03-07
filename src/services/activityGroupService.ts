
import api from './api';

export const fetchActivityGroupTop50 = async (site: string) => {
  const response = await api.post('/activitygroup-service/retrieveTop50', { site });
  return response.data.activityGroupList;
};

export const retrieveAllActivityGroup = async (site: string) => {
  const response = await api.post('/activitygroup-service/retrieveAll', { site });
  return response.data.activityGroupList;
};

export const RetriveActivityGrpRow = async (site: string, payload: object) => {
    const response = await api.post('/activitygroup-service/retrieve', { site, ...payload });
    return response.data;
  };

  export const retrieveAvailableActivityGroupNames = async (site: string) => {
    const response = await api.post('/activitygroup-service/retrieveAvailableActivities', { site });
    return response.data.availableActivitiesList;
  };

  export const retrieveAllAvailableActivityGroupNames = async (site: string, activityGroupName) => {
    
    const response = await api.post('/activitygroup-service/retrieveAvailableActivities', { site, activityGroupName });
    return response.data.availableActivitiesList;
  };

  // export const retrieveAllAvailableActivityGroupNames = async (site: string, activityGroupName) => {

  //   const response = await api.post('/activitygroup-service/retrieveActivityGroupMemberList', { site, activityGroupName });
  //   return response.data.activityGroupMemberList;
  // };

  export const createCopyActivityGroup = async (site: string, userId: string, payload: Object) => {
    const response = await api.post('activitygroup-service/create', { site, userId, ...payload, });
    return response.data;
  };

  export const deleteActivityGroup = async (site: string, userId: string, payload: Object, currentSite: string) => {
    const response = await api.post('activitygroup-service/delete', { site, userId, ...payload, currentSite });
    return response.data;
  };
  
  export const UpdateActivityGroup = async (site: string, userId: string, payload: Object) => {
    const response = await api.post('activitygroup-service/update', { site, userId, ...payload, });
    return response.data;
  };

  export const CreateActivityGroup = async (site: string, payload: Object) => {
    const response = await api.post('activitygroup-service/create', { site, ...payload, });
    return response.data;
  };

