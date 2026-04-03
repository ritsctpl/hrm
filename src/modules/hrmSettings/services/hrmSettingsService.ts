import api from '@/services/api';

export const HrmSettingsService = {
  async fetchEmployeeProfile(site: string, userId: string) {
    const response = await api.post('/hrm-service/employee/getByUserId', {
      site,
      userId,
    });
    return response.data;
  },
};
