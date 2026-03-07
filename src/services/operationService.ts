
import api from './api';

export const fetchOperation= async (site: string) => {
  const response = await api.post('/operation-service/retrieveTop50/', { site });
  console.log(response.data +'Response')
  return response.data.operationList;
};
export const fetchOperationAllData= async (site: string) => {
  const response = await api.post('/operation-service/retrieveBySite/', { site });
  console.log(response.data +'Response')
  return response.data.operationList;
};

export const retrieveAllOperation = async (site: string, operation: string) => {
  const response = await api.post('/operation-service/retrieveByOperation', { site, operation });
  
  return response.data.operationList;
};

export const fetchCertification= async (site: string, userId: string, url: string) => {
      const response = await api.post(`/${url}`, { site});
  console.log(response.data +'Response')
  return response.data.certificationList;
};

export const retrieveCustomDataList = async (site: string, category: string, userId: string) => {
  const response = await api.post('/customdata-service/retrieveByCategory', { site, category, userId });
  return response.data;
};
export const fetchOperationAll= async (site: string, operation,revision) => {
    const response = await api.post('/operation-service/retrieve/', { site,operation,revision});
    console.log(response.data +'Response')
    return response.data;
  };
  export const fetchOperationOne= async (site: string, operation) => {
    const response = await api.post('/operation-service/retrieve/', { site,operation});
    console.log(response.data +'Response')
    return response.data;
  };
  // In @services/shiftService.js
  export const updateOperation = async (site: string, userId: string, shiftData: Object) => {
    try {
      console.log(shiftData,"Enter Update");
      const response = await api.post('/operation-service/update', {
        site, // Include site here
        userId, // Include userId here
        ...shiftData, // Include all other fields from shiftData
      }, {
        headers: {
          'Content-Type': 'application/json',
          // Add other headers if needed, e.g., Authorization tokens
        },
      });
      // Return the response data
      console.log(response,'response');
      return response.data;
  
    } catch (error) {
      // Handle error
      console.error('Error updating shift:', error);
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  
  export const addOperation = async (site: string, userId: string, operationData: Object) => {
    try {
      console.log({site,userId,...operationData});
      const response = await api.post('/operation-service/create', {site,userId,...operationData}, {
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
      console.error('Error updating shift:', error);
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  
  
  // In @services/shiftService.js
  export const deleteOperation = async (site: string, userId: string,data: Object) => {
    try {
      console.log(data);
      const response = await api.post('/operation-service/delete', {site,userId,...data}, {
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
  export const copyAllOperation = async (site: string, userId: string, operationData: Object) => {
    try {
      console.log({site,userId,...operationData});
      const response = await api.post('/operation-service/create', {site,userId,...operationData}, {
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
      console.error('Error updating shift:', error);
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  
  