/**
 * HRM Holiday Module - Data Fetching Hooks
 */

import { useEffect } from 'react';
import { parseCookies } from 'nookies';
import { message } from 'antd';
import { HrmHolidayService } from '../services/hrmHolidayService';
import { useHrmHolidayStore } from '../stores/hrmHolidayStore';

export function useHolidayGroupsLoader(userRole: string = 'EMPLOYEE') {
  const {
    searchParams,
    setGroups,
    setGroupsLoading,
    setGroupsError,
  } = useHrmHolidayStore();

  const { site } = parseCookies();

  useEffect(() => {
    if (!site) return;

    const load = async () => {
      setGroupsLoading(true);
      setGroupsError(null);
      try {
        const res = await HrmHolidayService.listGroups({
          site,
          year: searchParams.year,
          status: searchParams.status,
          requestingUserRole: userRole,
          buHandle: searchParams.buHandle,
        });
        if (res.success) {
          setGroups(res.data.map((g) => ({ ...g, mappings: g.mappings ?? [] })));
        } else {
          setGroupsError(res.message);
          message.error(res.message || 'Failed to load holiday groups');
        }
      } catch {
        const errMsg = 'Failed to load holiday groups';
        setGroupsError(errMsg);
        message.error(errMsg);
      } finally {
        setGroupsLoading(false);
      }
    };

    load();
  }, [site, searchParams.year, searchParams.status, searchParams.buHandle, userRole]);
}
