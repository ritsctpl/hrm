import { useEffect, useState, useCallback } from 'react';
import { parseCookies } from 'nookies';
import { HrmSettingsService } from '../services/hrmSettingsService';
import { useHrmSettingsStore } from '../stores/hrmSettingsStore';
import type { ProfileFormData } from '../types/domain.types';

export function useSettingsData() {
  const [profileData, setProfileData] = useState<ProfileFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const { setProfileDraft } = useHrmSettingsStore();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const cookies = parseCookies();
      const site = cookies.site ?? '';
      const userId = cookies.userId ?? '';
      if (!site || !userId) return;

      const data = await HrmSettingsService.fetchEmployeeProfile(site, userId);
      const mapped: ProfileFormData = {
        name: data?.name || data?.firstName || '',
        contactNumber: data?.contactNumber || data?.phone || '',
        personalEmail: data?.personalEmail || data?.email || '',
        profilePhoto: data?.profilePhoto || '',
      };
      setProfileData(mapped);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const cookies = parseCookies();
      const token = cookies.token;
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.auth_time) {
          setLastLogin(new Date(payload.auth_time * 1000).toLocaleString());
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profileData, loading, lastLogin, refetchProfile: fetchProfile };
}
