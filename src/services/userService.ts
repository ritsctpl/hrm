import CryptoJS from 'crypto-js';
import api from './api';

const ENCRYPTION_KEY = 'fenta@123'; 

const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

export const fetchUserTop50= async () => {
  const response = await api.post('/user-service/retrieveTop50/', {  });
  console.log("response",response.data.userList)
  return response.data.userList;
};
export const fetchUserAllData= async (user: string) => {
  const response = await api.post('/user-service/retrieveAllByUser/', { user });
  return response.data.userList;
};

export const fetchCertification= async (site: string, userId: string, url: string) => {
      const response = await api.post(`/${url}`, { site});
  return response.data.certificationList;
};

export const retrieveCustomDataList = async (site: string, category: string, userId: string) => {
  const response = await api.post('/customdata-service/retrieveByCategory', { site, category, userId });
  return response.data;
};
export const fetchUserAll= async ( user ) => {
    const response = await api.post('/user-service/retrieveByUser/', { user});
    return response.data;
  };


  export const fetchUserGroup= async (currentSite: string, user: string) => {
    const settingUser = (user ==""? await api.post('/user-service/availableUserGroup/', 
      {currentSite}) : await api.post('/user-service/availableUserGroup/', { currentSite, user}))
    const response = settingUser;
    return response.data;
  };

  export const fetchUserWorkCenter= async (currentSite: string, user: string) => {
  //  debugger;
    const settingUser = (user ==""? await api.post('/user-service/availableWorkCenter/', {currentSite}) : await api.post('/user-service/availableWorkCenter/', { currentSite,user}))
    const response =settingUser
    return response.data;
  };
  export const getSiteRetrieveTop50= async () => {
    const response = await api.post('/site-service/retrieveTop50/');
    return response.data;
  };
  
  export const updateUser = async ( request: any) => {
    const encryptedRequest = {
      ...request,
      ...(request.password && { password: encryptPassword(request?.password) }),
      ...(request.confirmPassword && { confirmPassword: encryptPassword(request?.confirmPassword) })
    };
    // debugger
    try {
      const response = await api.post('/user-service/update', 
        encryptedRequest 
      , {
        headers: {
          'Content-Type': 'application/json',
          // Add other headers if needed, e.g., Authorization tokens
        },
      });
      return response.data;
  
    } catch (error) {
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  export const updateUserSite = async (params) => {
    const{user,site,defaultSite}= params
    try {
      const response = await api.post('/user-service/updateLastDefaultSite', {user,defaultSite}, {
        headers: {
          'Content-Type': 'application/json',
          // Add other headers if needed, e.g., Authorization tokens
        },
      });
      return response.data;
  
    } catch (error) {
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  
  export const addUser = async (request: any) => {

    const encryptedRequest = {
      ...request,
      ...(request.password && { password: encryptPassword(request?.password) }),
      ...(request.confirmPassword && { confirmPassword: encryptPassword(request?.confirmPassword) })
    };
    // debugger

    try {
      const response = await api.post('/user-service/create', encryptedRequest, {
        headers: {
          'Content-Type': 'application/json',
          // Add other headers if needed, e.g., Authorization tokens
        },
      });
      return response.data;
  
    } catch (error) {
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  
  // In @services/shiftService.js
  export const deleteUser = async ( site: any[], userId: string, user: Object, currentSite: string, userGroups: any) => {
    try {
      const response = await api.post('/user-service/delete', {site, userId, ...user, currentSite, userGroups}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Return the response data
      return response.data;
  
    } catch (error) {
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  export const copyAllUser = async (site: string, userId: string, userData: Object) => {
    try {
      const response = await api.post('/user-service/create', {site,userId,...userData}, {
        headers: {
          'Content-Type': 'application/json',
          // Add other headers if needed, e.g., Authorization tokens
        },
      });
      return response.data;
  
    } catch (error) {
      // Handle error
      throw error; // Re-throw error or handle it according to your needs
    }
  };
  

function post(arg0: string, payload: Object) {
  throw new Error('Function not implemented.');
}
  