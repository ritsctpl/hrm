import api from './api';


export const siteServices= async (user: string) => {
  console.log(user,'user');
  
  const response = await api.post('/user-service/getSiteListByUser', { user });
  console.log(response.data,'userResponse')
  return response.data;
};

export const initializeSite= async () => {
  const response = await api.post('/master-data/initialize');
  return response.data;
};

export const fetchSiteTop50= async (user: string) => {
  const response = await api.post('/site-service/retrieveTop50');
  console.log(response.data,'userResponse')
  return response.data.retrieveTop50List;
};

export const fetchSiteAll= async (site: string) => {
  try {
    const response = await api.post('/site-service/retrieveBySite/', { site});
    // console.log(response.data +'Response')
    return response.data;
  } catch (error) {
    console.error('Error fetching site details:', error);
  }
};
export const fetchAllEventTypes= async (site: string) => {
  try {
    const response = await api.post('/productionlog-service/retrieveEventTypes', { site});
    // console.log(response.data +'Response')
    return response.data;
  } catch (error) {
    console.error('Error fetching site details:', error);
  }
};

export const copyAllSite = async ( userId: string, userData: Object) => {
  try {
    console.log({userId,...userData});
    const response = await api.post('/site-service/create', {userId,...userData}, {
      headers: {
        'Content-Type': 'application/json',
        // Add other headers if needed, e.g., Authorization tokens
      },
    });
    // Return the response data
    console.log(response);
    return response.data;

  } catch (error) {
    // Handle error
    console.error('Error updating site:', error);
    throw error; // Re-throw error or handle it according to your needs
  }
};
export const updateSite = async (userId: string, userData: Object) => {
  try {
    console.log("Enter Update");
    const response = await api.post('/site-service/update', { // Include site here
      userId, // Include userId here
      ...userData, // Include all other fields from siteData
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Add other headers if needed, e.g., Authorization tokens
      },
    });
    // Return the response data
    console.log(response);
    return response.data;

  } catch (error) {
    // Handle error
    console.error('Error updating site:', error);
    throw error; // Re-throw error or handle it according to your needs
  }
};

export const addSite = async (userId: string, userData: Object) => {
  console.log('called');
  
  try {
    console.log({userId,...userData});
    const response = await api.post('/site-service/create', {userId,...userData}, {
      headers: {
        'Content-Type': 'application/json',
        // Add other headers if needed, e.g., Authorization tokens
      },
    });
    // Return the response data
    console.log(response ,"add user");
    return response.data;

  } catch (error) {
    // Handle error
    console.error('Error updating shift:', error);
    throw error; // Re-throw error or handle it according to your needs
  }
};
export const deleteSite = async ( userId: string,site: any) => {
  try {
    const response = await api.post('/site-service/delete', {userId,site}, {
      headers: {
        'Content-Type': 'application/json',
        // Add other headers if needed, e.g., Authorization tokens
      },
    });
    // Return the response data
    console.log(response);
    return response.data;

  } catch (error) {
    // Handle error
    console.error('Error deleting shift:', error);
    throw error; // Re-throw error or handle it according to your needs
  }
};
export const downTimeUpdate = async (payload) => {
  const requestPayLoad = {
    "commentUsr": payload?.commentUsr,
    "reason": payload?.reason,
    "rootCause": payload?.rootCause,
    site: payload?.site,
    downtimeType:payload?.downtimeType,
    downtimeStart: payload?.downtimeStart,
    downtimeEnd: payload?.downtimeEnd,
  }
  try {
    const response = await api.put(`/downtime-service/update/${payload?.id}`, {...requestPayLoad}, {
      headers: {
        'Content-Type': 'application/json',
        // Add other headers if needed, e.g., Authorization tokens
      },
    });
    // Return the response data
    console.log(response);
    return response.data;

  } catch (error) {
    // Handle error
    console.error('Error deleting shift:', error);
    throw error; // Re-throw error or handle it according to your needs
  }
};

export const downTimeUpdateReason= async (payload) => {
    const requestPayLoad = {
    "commentUsr": payload?.commentUsr,
    "reason": payload?.reason,
    "rootCause": payload?.rootCause,
    site: payload?.site,
    downtimeType:payload?.downtimeType,
    downtimeStart: payload?.downtimeStart === "Invalid Date" ? null : payload?.downtimeStart,
    downtimeEnd: payload?.downtimeEnd === "Invalid Date" ? null : payload?.downtimeEnd,
    resourceId:payload?.resourceId,
  }
  const response = await api.post('/downtime-service/updateReason', { ...requestPayLoad });
  console.log(response +'Response')
  return response;
};


export const fetchDownTimeWithFilters = async (payload) => {
const requestPayload = {
  downtimeStart: payload?.downtimeStart,
  downtimeEnd: payload?.downtimeEnd,
  site: payload?.site,
  ...(payload?.resourceId?.length > 0 && { resourceList: payload.resourceId }),
  ...(payload?.workCenterId?.length > 0 && { workcenterList: payload.workCenterId })
};
  try {
    const response = await api.post('/downtime-service/getDowntime', { ...payload });
    // console.log(response.data +'Response')
    return response.data;
  } catch (error) {
    console.error('Error fetching site details:', error);
  }
};
export const fetchDownTimeWithFiltersPlanned = async (payload) => {
  try {
    const response = await api.post('/planneddowntime-service/getAll', { ...payload });
    // console.log(response.data +'Response')
    return response.data;
  } catch (error) {
    console.error('Error fetching site details:', error);
  }
};

export const fetchDownTimeByFiltersPlanned = async (payload) => {
  try {
    const response = await api.post('/planneddowntime-service/getWithFilters', { ...payload });
    return response.data;
  } catch (error) {
    console.error('Error fetching planned downtime details:', error);
  }
};