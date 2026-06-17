/**
 * HRM Grade Module — Service Layer
 * Static class — all API calls via api.post().
 *
 * Contract: /hrm-service/grade/* — designed FE-first.
 * Backend implementation pending; see
 *   src/docs/project/GRADE_BE_SPEC.md
 */

import api from '@/services/api';
import type {
  GradeRequest,
  DeactivateGradeRequest,
  DeleteGradeRequest,
  GetPromotionCandidatesRequest,
} from '../types/api.types';
import type { Grade, PromotionCandidate } from '../types/domain.types';

const BASE = '/hrm-service/grade';

export class HrmGradeService {
  // ============================================================
  // Grade Master CRUD
  // ============================================================

  static async fetchAllGrades(organizationId: string): Promise<Grade[]> {
    const res = await api.post<Grade[]>(`${BASE}/getAllGrades`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getGrade(organizationId: string, gradeCode: string): Promise<Grade> {
    const res = await api.post<Grade>(`${BASE}/getGrade`, { organizationId, gradeCode });
    return res.data;
  }

  static async createGrade(payload: GradeRequest): Promise<Grade> {
    const res = await api.post<Grade>(`${BASE}/createGrade`, payload);
    return res.data;
  }

  static async updateGrade(payload: GradeRequest & { handle: string }): Promise<Grade> {
    const res = await api.post<Grade>(`${BASE}/updateGrade`, payload);
    return res.data;
  }

  static async deactivateGrade(payload: DeactivateGradeRequest): Promise<void> {
    await api.post(`${BASE}/deactivateGrade`, payload);
  }

  static async deleteGrade(payload: DeleteGradeRequest): Promise<void> {
    await api.post(`${BASE}/deleteGrade`, payload);
  }

  // ============================================================
  // Opportunities — Promotion candidates (Phase 3, BE pending)
  // ============================================================

  static async getPromotionCandidates(
    payload: GetPromotionCandidatesRequest,
  ): Promise<PromotionCandidate[]> {
    const res = await api.post<PromotionCandidate[]>(
      `${BASE}/getPromotionCandidates`,
      payload,
    );
    return Array.isArray(res.data) ? res.data : [];
  }
}
