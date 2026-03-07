import getKeycloakInstance from "@/keycloak";
import axios from "axios";

let runtimeConfig: Record<string, string> | null = null;

interface UserProp {
    data: {
        user: string;
        firstName: string;
        lastName: string;
        emailAddress: string;
        password: string;
    };
}

interface UpdateProp {
    data: {
        user: string;
        firstName: string;
        lastName: string;
        emailAddress: string;
        password: string;
    };
}

interface UserIdProp {
    data: {
        user: string;
    };
}

const fetchRuntimeConfig = async (): Promise<Record<string, string>> => {
    if (!runtimeConfig) {
        try {
            const response = await fetch("/manufacturing/api/config");
            runtimeConfig = await response.json();
            console.log("Fetched runtime config:", runtimeConfig);

            // Set window.runtimeConfig if window is defined
            if (typeof window !== "undefined") {
                window.runtimeConfig = runtimeConfig;
                console.log("Set window.runtimeConfig:", window.runtimeConfig);
            }
        } catch (error) {
            console.error("Failed to fetch runtime config:", error);
            throw new Error("Unable to load runtime configuration");
        }
    }
    return runtimeConfig;
};

const keycloakConfig = async () => {
    const config = await fetchRuntimeConfig();
    return {
        url: config.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
        realm: config.NEXT_PUBLIC_KEYCLOAK_REALM || "default-realm",
        clientId: config.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "default-client-id",
        clientSecret: config.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || "default-client-secret",
    };
};

// console.log("Final Keycloak configuration used:", keycloakConfig); // Debug final Keycloak config

// keycloakInstance = new Keycloak(keycloakConfig);
// realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM!,
// url: process.env.NEXT_PUBLIC_KEYCLOAK_URL!,
// clientSecret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET!,
// clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
// };
export const getKeyCloakUserId = async ({ data }: UserIdProp) => {
    try {
        const keyCloak = await getKeycloakInstance();
        const config = await keycloakConfig();
        console.log(config, 'config');

        const response = await axios.get(`${config.url}/admin/realms/${config.realm}/users`, {
            headers: {
                'Authorization': `Bearer ${keyCloak.token}`
            },
            params: {
                username: data.user
            }
        });
        return response.data[0].id;
    }
    catch (error) {
        return error;
    }
}

export const validateUser = async ({ data }: UserIdProp) => {
    try {
        const keyCloak = await getKeycloakInstance();
        const config = await keycloakConfig();
        const response = await axios.get(`${config.url}/admin/realms/${config.realm}/users`, {
            headers: {
                'Authorization': `Bearer ${keyCloak.token}`
            }, params: {
                username: data.user
            }
        });
        return response.data;
    }
    catch (error) {
        return error;
    }
}

export const CreateKeycloakUser = async ({ data }: UserProp) => {
    const user = {
        username: data.user,
        enabled: true,
        emailVerified: true,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.emailAddress,
        credentials: [
            {
                type: "password",
                value: data.password,
                temporary: false,
            },
        ],
    };

    try {
        const keyCloak = await getKeycloakInstance();
        const config = await keycloakConfig();
        console.log(config.url, 'url');
        console.log(config.realm, 'realm');
        console.log(config.clientId, 'clientId');
        console.log(config.clientSecret, 'clientSecret');
        const createUserResponse = await axios.post(
            `${config.url}/admin/realms/${config.realm}/users`,
            user,
            {
                headers: {
                    Authorization: `Bearer ${keyCloak.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return { succes: createUserResponse }
    } catch (error) {
        return { error: error.response?.data?.errorMessage }
    }
};

export const DeleteKeycloakUser = async ({ data }: UserIdProp) => {
    const users = {
        data: {
            user: data.user
        }
    }
    try {
        const keyCloak = await getKeycloakInstance();
        const userId = await getKeyCloakUserId(users)
        const config = await keycloakConfig();
        const createUserResponse = await axios.delete(
            `${config.url}/admin/realms/${config.realm}/users/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${keyCloak.token}`,
                },
            }
        );
        return { succes: createUserResponse }
    } catch (error) {
        return { error: error.response?.data?.errorMessage }
    }
};


export const UpdateKeycloakUser = async ({ data }: UpdateProp) => {
    console.log("Update keycloak request: ", data);
    const user = {
        username: data.user,
        enabled: true,
        emailVerified: true,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.emailAddress,
        credentials: [
            {
                type: "password",
                value: data.password,
                temporary: false,
            },
        ],
    };

    const users = {
        data: {
            user: data.user
        }
    }

    try {
        const keyCloak = await getKeycloakInstance();
        const config = await keycloakConfig();
        console.log("Update keycloak user id request: ", users);
        const userId = await getKeyCloakUserId(users)
        // debugger 
        console.log("User ID: ", userId)
        const createUserResponse = await axios.put(
            `${config.url}/admin/realms/${config.realm}/users/${userId}`, user,
            {
                headers: {
                    Authorization: `Bearer ${keyCloak.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return { succes: createUserResponse }
    } catch (error) {
        return { error: error.response?.data?.errorMessage }
    }
};