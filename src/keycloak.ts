import Keycloak, { KeycloakConfig, KeycloakInstance, KeycloakInitOptions } from "keycloak-js";

let keycloakInstance: KeycloakInstance | null = null;
let runtimeConfig: Record<string, string> | null = null;

// Fetch runtime configuration
const fetchRuntimeConfig = async (): Promise<Record<string, string>> => {
  if (!runtimeConfig) {
    try {
      const basePath = '/hrm';
      const response = await fetch(`${basePath}/api/config`);
      runtimeConfig = await response.json();
      // console.log("Fetched runtime config:", runtimeConfig);

      // Set window.runtimeConfig if window is defined
      if (typeof window !== "undefined") {
        window.runtimeConfig = runtimeConfig;
        // console.log("Set window.runtimeConfig:", window.runtimeConfig);
      }
    } catch (error) {
      console.error("Failed to fetch runtime config:", error);
      throw new Error("Unable to load runtime configuration");
    }
  }
  return runtimeConfig;
};

export const getKeycloakInstance = async (): Promise<KeycloakInstance> => {
  if (!keycloakInstance) {
    const config = await fetchRuntimeConfig(); // Fetch the runtime config when initializing Keycloak

    const keycloakConfig: KeycloakConfig = {
      url: config.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080", // Fallback for dev
      realm: config.NEXT_PUBLIC_KEYCLOAK_REALM || "default-realm",
      clientId: config.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "default-client-id",
    };

    // console.log("Final Keycloak configuration used:", keycloakConfig); // Debug final Keycloak config

    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance!;
};

export const getKeycloakInitOptions = async (): Promise<KeycloakInitOptions> => {
  const config = await fetchRuntimeConfig();
  return {
    onLoad: "login-required",
    checkLoginIframe: false,
    pkceMethod: "S256",
    redirectUri: config.NEXT_PUBLIC_REDIRECT_URI,
  };
};

// Legacy export kept for compatibility — does not include redirectUri
export const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: "login-required",
  checkLoginIframe: false,
  pkceMethod: "S256",
};

export default getKeycloakInstance;
