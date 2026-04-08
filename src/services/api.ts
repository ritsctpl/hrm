import axios from "axios";
import { parseCookies } from "nookies";
import { decryptToken } from "../utils/encryption";

// Axios instance
const api = axios.create({
  baseURL: null,
});

// Helper function to fetch runtime configuration
const fetchRuntimeConfig = async (): Promise<Record<string, string>> => {
    try {
    // Attempt to fetch from the client-side runtimeConfig if available
    if (typeof window !== "undefined" && window.runtimeConfig) {
      // console.log("Using client-side runtimeConfig:", window.runtimeConfig);
      return window.runtimeConfig;
    }

    // Attempt to fetch from the API endpoint — always use /hrm base path
    const basePath = '/hrm';
    const response = await fetch(`${basePath}/api/config`);
    // console.log("Fetching runtimeConfig from API...", response);
    if (response.ok) {
      const runtimeConfig = await response.json();
      // console.log("Fetched runtimeConfig from API:", runtimeConfig);

      // Set window.runtimeConfig for future use (client-side only)
      if (typeof window !== 'undefined') {
        window.runtimeConfig = runtimeConfig;
      }
      // console.log('window.runtimeConfihg', window.runtimeConfig);

      return runtimeConfig;
    } else {
      console.warn(`API responded with ${response.status}: ${response.statusText}`);
      throw new Error("Failed to fetch runtime config from API");
    }
  } catch (error) {
   // console.error("Error fetching runtime config (client-side):", error);

    try {
      // Fallback to server-side fetching using an absolute URL
      const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:8687";
      const apiUrl = `${baseUrl}/api/config`;
      // console.log("Server-side fetching runtimeConfig from:", apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch runtime config: ${response.statusText}`);
      }

      const runtimeConfig = await response.json();
      // console.log("Fetched runtimeConfig from server-side API:", runtimeConfig);

      return runtimeConfig;
    } catch (serverError) {
     // console.error("Error fetching runtime config (server-side):", serverError);

      // Final fallback to environment variables
      console.warn("Using fallback environment variables.");
      return {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.147.129:8080/app/v1",
        NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST || "http://192.168.147.129:8687",
      };
    }
  }
};

// Initialize the API's baseURL dynamically
let apiInitialized = false;

export const initializeApi = async (): Promise<void> => {
  try {
    if (!apiInitialized) {
      let config;

      // Fast path: use window.runtimeConfig if already set by layout
      if (typeof window !== 'undefined' && window.runtimeConfig) {
        config = window.runtimeConfig;
      } else {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Runtime config fetch timeout')), 15000)
          );
          config = await Promise.race([fetchRuntimeConfig(), timeoutPromise]);
        } catch (error) {
          console.warn('Runtime config fetch timed out, using env fallback');
          config = {
            NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.147.129:8080/app/v1",
            NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST || "http://192.168.147.129:8687",
          };
        }
      }
      // console.log(api.defaults.baseURL,'API initialized with base URL:');

       api.defaults.baseURL = config.NEXT_PUBLIC_API_BASE_URL;
      // console.log("API initialized with base URL:", api.defaults.baseURL,config);
      apiInitialized = true;
    }
  } catch (error) {
    console.warn("Failed to initialize API, using fallback:", error);
    // Don't throw - use fallback and mark as initialized
    api.defaults.baseURL = "http://192.168.147.129:8080/app/v1";
    apiInitialized = true;
  }
};

// Lazy initialization fallback if `initializeApi` is not called explicitly
(async () => {
  if (!apiInitialized) {
    try {
      await initializeApi();
    } catch (error) {
      console.warn(
        "API initialization failed during import. Ensure initializeApi() is called explicitly before usage."
      );
    }
  }
})();

// Add interceptors to handle authentication tokens
api.interceptors.request.use(
  async (config) => {
    try {
      const cookies = parseCookies();
      const encryptedToken = cookies.token;

      if (!api.defaults.baseURL || api.defaults.baseURL.includes('8687') || api.defaults.baseURL.includes('8686')) {
        const response = await fetch("/hrm/api/config");
        // console.log("Fetching runtimeConfig from API...", response);
        const runtimeConfig = await response.json();
        // Update both the current request config AND the default baseURL
        config.baseURL = runtimeConfig.NEXT_PUBLIC_API_BASE_URL;
        api.defaults.baseURL = runtimeConfig.NEXT_PUBLIC_API_BASE_URL;
        console.log("Updated API baseURL to:", api.defaults.baseURL);
      }

      // Add authorization token if available
      if (encryptedToken) {
        const token = decryptToken(encryptedToken);
        config.headers.Authorization = `Bearer ${token}`;
      //  console.log(config ,"window",window.runtimeConfig,"Response","BaseUrl Loading if Null...");

      }

      // Set default content-type if not already set
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
      // console.log("API request interceptor:", config);

      return config;
    } catch (error) {
      console.warn("Error in request interceptor:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for unwrapping backend response wrappers and error handling
api.interceptors.response.use(
  (response) => {
    // Only unwrap responses from HRM service endpoints
    const url = response.config?.url ?? '';
    const isHrmService = url.includes('/hrm-service/');
    if (!isHrmService) return response;

    const data = response.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Check for error response (msg_type 'E' = error)
      if (data.errorCode || data.message_details?.msg_type === 'E') {
        const err = new Error(data.message_details?.msg || 'API Error');
        (err as any).errorCode = data.errorCode;
        (err as any).response = response;
        return Promise.reject(err);
      }

      // Backend wrapper format 1: { handle, message_details, errorCode, response }
      if ('response' in data && 'message_details' in data) {
        response.data = data.response ?? [];
      }
      // Backend wrapper format 2 (Employee/Holiday): { success, message, messageCode, data }
      else if ('data' in data && 'success' in data && 'messageCode' in data) {
        response.data = data.data ?? [];
      }
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // 401 Unauthorized — session expired, redirect to login
      if (status === 401) {
        console.error('Session expired (401). Redirecting to login...');
        if (typeof window !== 'undefined') {
          const isAlreadyRedirecting = sessionStorage.getItem('auth_redirecting');
          if (!isAlreadyRedirecting) {
            sessionStorage.setItem('auth_redirecting', 'true');
            window.location.href = '/hrm/login';
          }
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      console.warn('API Error:', status, error.response.data);

      // Handle errors with message_details format (400, 500, etc.)
      const data = error.response.data;
      if (data && typeof data === 'object' && data.message_details?.msg) {
        const err = new Error(data.message_details.msg);
        (err as any).response = error.response;
        (err as any).errorCode = data.errorCode;
        return Promise.reject(err);
      }
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
