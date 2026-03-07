export interface ActivityGroupMember {
    activityId?: string;
}

export interface ActivityGroupRequest {
    site?: string;
    activityGroupName?: string;
    activityGroupDescription?: string;
    activityId?: string[];  
    activityGroupMemberList?: ActivityGroupMember[];  
    active?: number;
    createdDateTime?: string; 
    modifiedDateTime?: string; 
    userId?: string;
}

export const defaultActivityGroupRequest: ActivityGroupRequest = {
    site: '',
    activityGroupName: '',
    activityGroupDescription: '',
    activityId: [],
    activityGroupMemberList: [],
    active: 1, 
    createdDateTime: '',
    modifiedDateTime: '',
    userId: ''
};
