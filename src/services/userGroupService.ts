import api from './api';

export const fetchUserGroupTop50 = async (site: string) => {
  const response = await api.post('/usergroup-service/retrieveTop50', { site });
  return response.data.userGroupResponses;
};

export const fetchUserGrpAll = async (site: string) => {
  const response = await api.post('/usergroup-service/retrieveAll', { site });
  return response.data.userGroupResponses;
};

export const getDocumentRule = async (payload: any) => {
  const response = await api.post('/activity-service/getDocumentRule', payload);
  return response.data;
};

export const retrieveAvailableUserGroups = async (site: string) => {
  console.log("site", site);
  const response = await api.post('/usergroup-service/getAvailableUser', { site });
  console.log("responseAvailable", response);
  
  return response.data;
};

export const retrieveAvailableActivityGroups = async (site: string) => {
  const response = await api.post('/usergroup-service/getAvailableActivityGroup', { site });
  return response.data;
};

export const CreateUserGroup = async (site: string, userId: string, payload: object) => {
  const response = await api.post('/usergroup-service/create', { site, userId, ...payload });
   return response.data;
};

export const UpdateUserGroup = async (site: string, userId: string, payload: object) => {
  const response = await api.post('/usergroup-service/update', { site, userId, ...payload });
   return response.data;
};

export const RetriveUserGroupSelectedRow = async (site: string, row, currentSite: string) => {
    const response = await api.post('/usergroup-service/retrieve', { site, ...row, currentSite });
    return response.data;
  };  

  export const createCopyUserGroup = async (site: string, userId: string, payload: Object) => {
    const response = await api.post('usergroup-service/create', { site, userId, ...payload, });
    return response.data;
  };

  export const deleteUserGroup = async (site: string,userId: string,payload: Object, currentSite: string) => {
    const response = await api.post('usergroup-service/delete', { site, userId, ...payload, currentSite });
    return response.data;
  };

  export const RetriveUGUpdateList = async (site: string, userGroup) => {  
    console.log("response", userGroup);
    const response = await api.post('/usergroup-service/getAvailableUser', { site, userGroup });
    console.log("responseRetriveUGUpdateList", response);
    return response.data;
  };  

  export const RetriveActivityGroupUpdateList = async (site: string, userGroup) => {  
    const response = await api.post('/usergroup-service/getAvailableActivityGroup', { site, userGroup });
    return response.data;
  };  

  export const createUserGroupCustom = async (site: string, userId: string, payload:object) => {
    const response = await api.post('/customdata-service/retrieveByCategory', { site, userId, ...payload });
    return response.data;
  };

  export const fetchAllPod = async (site: string, newValue: object) => {
    const response = await api.post('/pod-service/retrieveAll', { site, ...newValue });
    return response.data;
  };
  
  export const fetchTop50Pod = async ( site: string ) => {
    const response = await api.post('/pod-service/retrieveTop50', { site });
    return response.data;
  };

  export const retrieveActivityGrp = async (site: string) => {
    const response = await api.post('/activitygroup-service/getActivities', { site });
    console.log(response, 'retrieveActivityGrp');
    return response.data;
  };

  export const retrieveUserGrpUsers = async (site: string, userGroup: string) => {
    const response = await api.post('/usergroup-service/getAssignedUsersForUserGroup', { site, userGroup });
    console.log(response, 'retrieveUserGrpUsers');
    return response.data;
  };
