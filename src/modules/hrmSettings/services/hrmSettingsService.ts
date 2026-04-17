import api from '@/services/api';

export const HrmSettingsService = {
  async fetchEmployeeProfile(organizationId: string, userId: string) {
    const response = await api.post('/hrm-service/employee/getByUserId', {
      organizationId,
      userId,
    });
    return response.data;
  },
};
