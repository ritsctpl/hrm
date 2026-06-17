/**
 * HRM Grade Module — Zustand Store
 */

'use client';

import { create } from 'zustand';
import { parseCookies } from 'nookies';
import { message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmGradeService } from '../services/gradeService';
import type { Grade } from '../types/domain.types';
import type { GradeFormState } from '../types/ui.types';

const getUser = (): string => {
  const cookies = parseCookies();
  return cookies.rl_user_id ?? cookies.user ?? 'system';
};

/** Map flat form state into the nested GradeRequest payload. */
const toRequest = (data: GradeFormState, organizationId: string) => ({
  organizationId,
  gradeCode: data.gradeCode,
  gradeName: data.gradeName,
  level: data.level,
  track: data.track,
  description: data.description,
  salaryBand: {
    minSalary: data.minSalary,
    midSalary: data.midSalary,
    maxSalary: data.maxSalary,
    currency: data.currency,
  },
  appraisalConfig: {
    cycle: data.cycle,
    eligibilityMonths: data.eligibilityMonths,
    ratingScale: data.ratingScale,
  },
  progression: {
    nextGradeCodes: data.nextGradeCodes ?? [],
    minTenureMonths: data.minTenureMonths,
  },
  effectiveFrom: data.effectiveFrom,
});

interface GradeStoreState {
  grades: Grade[];
  selectedGrade: Grade | null;
  loading: boolean;
  error: string | null;

  fetchGrades: () => Promise<void>;
  selectGrade: (grade: Grade | null) => void;
  saveGrade: (data: GradeFormState, handle?: string) => Promise<void>;
  deactivateGrade: (gradeCode: string) => Promise<void>;
  reset: () => void;
}

export const useHrmGradeStore = create<GradeStoreState>((set, get) => ({
  grades: [],
  selectedGrade: null,
  loading: false,
  error: null,

  fetchGrades: async () => {
    set({ loading: true, error: null });
    try {
      const data = await HrmGradeService.fetchAllGrades(getOrganizationId());
      // Master list reads cleanest sorted by level (junior → senior).
      set({ grades: [...data].sort((a, b) => a.level - b.level) });
    } catch {
      set({ error: 'Failed to load grades' });
    } finally {
      set({ loading: false });
    }
  },

  selectGrade: (grade) => set({ selectedGrade: grade }),

  saveGrade: async (data, handle) => {
    const organizationId = getOrganizationId();
    const user = getUser();
    const payload = toRequest(data, organizationId);
    if (handle) {
      await HrmGradeService.updateGrade({ ...payload, handle, modifiedBy: user });
    } else {
      await HrmGradeService.createGrade({ ...payload, createdBy: user });
    }
    message.success('Grade saved');
    await get().fetchGrades();
  },

  deactivateGrade: async (gradeCode) => {
    await HrmGradeService.deactivateGrade({
      organizationId: getOrganizationId(),
      gradeCode,
      updatedBy: getUser(),
    });
    message.success('Grade deactivated');
    set({ selectedGrade: null });
    await get().fetchGrades();
  },

  reset: () => set({ grades: [], selectedGrade: null, loading: false, error: null }),
}));
