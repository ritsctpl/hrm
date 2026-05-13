/**
 * HRM Holiday Module - Detail Hook
 * Loads holidays and audit logs for a selected group
 */

import { useCallback } from 'react';
import { message } from 'antd';
import { HrmHolidayService } from '../services/hrmHolidayService';
import { useHrmHolidayStore } from '../stores/hrmHolidayStore';
import type { HolidayListRequest } from '../types/api.types';

export function useHolidayDetail(organizationId: string, groupHandle: string) {
  const {
    setHolidays,
    setHolidaysLoading,
    setHolidaysError,
    setAuditLogs,
    setAuditLogsLoading,
    setCategories,
    setCategoriesLoading,
  } = useHrmHolidayStore();

  const loadHolidays = useCallback(
    async (params: Partial<HolidayListRequest> = {}) => {
      setHolidaysLoading(true);
      setHolidaysError(null);
      try {
        const res = await HrmHolidayService.listHolidays({ organizationId,
          groupHandle,
          ...params,
        });
        
        // Handle both wrapped and unwrapped responses
        const data = res?.data || res;
        const holidays = Array.isArray(data) ? data : [];
        
        console.log('Holidays loaded:', holidays.length, 'items');
        if (holidays.length > 0) {
          console.log('Sample holiday:', holidays[0]);
        }
        
        const mapped = holidays.map((h) => ({
          ...h,
          compensatory: h.compensatory ?? false,
          optional: h.optional ?? false,
        }));
        setHolidays(mapped);
      } catch (error) {
        console.error('Failed to load holidays:', error);
        setHolidaysError('Failed to load holidays');
        message.error('Failed to load holidays');
      } finally {
        setHolidaysLoading(false);
      }
    },
    [organizationId, groupHandle, setHolidays, setHolidaysLoading, setHolidaysError]
  );

  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    try {
      const res = await HrmHolidayService.getGroupAuditLog({ organizationId, groupHandle });
      // The global axios interceptor strips the {success, message, data}
      // wrapper for HRM service endpoints, so `res` arrives as the raw
      // array. Fall back to res.data only when the wrapper survived
      // (e.g. against a backend variant without `messageCode`).
      const payload = (res as any)?.data ?? res;
      setAuditLogs(Array.isArray(payload) ? payload : []);
    } catch {
      message.error('Failed to load audit logs');
    } finally {
      setAuditLogsLoading(false);
    }
  }, [organizationId, groupHandle, setAuditLogs, setAuditLogsLoading]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await HrmHolidayService.listCategories({ organizationId, activeOnly: true });
      // Same wrapped/unwrapped duality as loadAuditLogs.
      const payload = (res as any)?.data ?? res;
      if (Array.isArray(payload)) {
        setCategories(payload.map((c) => ({ ...c })));
      }
    } catch {
      // silently ignore — default categories still show
    } finally {
      setCategoriesLoading(false);
    }
  }, [organizationId, setCategories, setCategoriesLoading]);

  return { loadHolidays, loadAuditLogs, loadCategories };
}
