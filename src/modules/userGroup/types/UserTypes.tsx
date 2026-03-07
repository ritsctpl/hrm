interface User {
    user?: string;
}

interface Activity {
    activityId?: string;
    enabled?: boolean;
}

interface ActivityGroup {
    activityGroupName?: string;
    enabled?: boolean;
    activities?: Activity[];
}

export interface CustomData {
    customData?:string;
    value?:string;
}

export interface UserGroups {
    site?: string;
    userGroup?: string;
    description?: string;
    pod?: string;
    users?: User[];
    permissionForActivityGroup?: ActivityGroup[];
    customDataList?: CustomData[];
}

export const defaultUserGroup: UserGroups = {
    site: '',
    userGroup: '',
    description: '',
    pod: '',
    users: [],
    permissionForActivityGroup: [],
    customDataList: [],
};