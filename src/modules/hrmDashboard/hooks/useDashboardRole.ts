'use client';
// src/modules/hrmDashboard/hooks/useDashboardRole.ts
import { useMemo } from 'react';
import { parseCookies } from 'nookies';
import type { DashboardRole } from '../types/domain.types';

const ROLE_MAP: Record<string, DashboardRole> = {
  ROLE_ADMIN: 'ADMIN',
  ROLE_SUPERADMIN: 'SUPERADMIN',
  ROLE_HR_MANAGER: 'HR_MANAGER',
  ROLE_HR: 'HR',
  ROLE_MANAGER: 'MANAGER',
  ROLE_EMPLOYEE: 'EMPLOYEE',
};

export function useDashboardRole(): DashboardRole {
  const cookies = parseCookies();
  const rawRole: string = cookies.role ?? cookies.userRole ?? 'ROLE_EMPLOYEE';

  return useMemo<DashboardRole>(() => {
    if (ROLE_MAP[rawRole]) return ROLE_MAP[rawRole];
    const upper = rawRole.toUpperCase();
    if (upper.includes('ADMIN')) return 'ADMIN';
    if (upper.includes('HR_MANAGER')) return 'HR_MANAGER';
    if (upper.includes('HR')) return 'HR';
    if (upper.includes('MANAGER')) return 'MANAGER';
    return 'EMPLOYEE';
  }, [rawRole]);
}
