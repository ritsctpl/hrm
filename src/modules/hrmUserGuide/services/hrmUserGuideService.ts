import api from '@/services/api';
import type { ModuleGuideCount, UserGuide } from '../types/domain.types';
import type {
  CreateGuidePayload,
  DeleteGuidePayload,
  GetGuidePayload,
  ListGuidesPayload,
  ListModulesWithGuidesPayload,
  PublishGuidePayload,
  UpdateGuidePayload,
} from '../types/api.types';
import { USER_GUIDE_BASE } from '../utils/guideConstants';
import { fileToBase64 } from '../utils/guideHelpers';

/**
 * User Guide service — all POST, on the shared `api` instance.
 *
 * Files travel inline as raw base64 (`contentBase64`), matching the Asset and
 * Leave attachment contract rather than the older multipart Policy upload.
 */
export class HrmUserGuideService {
  // ── Read ──────────────────────────────────────────────────────────────

  /**
   * Browse / search. Omit `moduleCode` for the whole library. The backend
   * returns PUBLISHED only unless the caller holds EDIT on the module, and
   * never includes `contentBase64` here — the grid would carry megabytes.
   */
  static async listGuides(payload: ListGuidesPayload): Promise<UserGuide[]> {
    const res = await api.post(`${USER_GUIDE_BASE}/listGuides`, payload);
    return res.data ?? [];
  }

  /** Full record including `contentBase64`, for the viewer and download. */
  static async getGuide(payload: GetGuidePayload): Promise<UserGuide> {
    const res = await api.post(`${USER_GUIDE_BASE}/getGuide`, payload);
    return res.data;
  }

  /** Modules that actually have guides — drives the left rail and its counts. */
  static async listModulesWithGuides(
    payload: ListModulesWithGuidesPayload,
  ): Promise<ModuleGuideCount[]> {
    const res = await api.post(`${USER_GUIDE_BASE}/listModulesWithGuides`, payload);
    return res.data ?? [];
  }

  // ── Write (admin) ─────────────────────────────────────────────────────

  /**
   * Create a guide. The file is mandatory — a guide record with no document
   * is not useful, so metadata and content are written in one call.
   */
  static async createGuide(
    payload: Omit<CreateGuidePayload, 'fileName' | 'fileType' | 'fileSizeBytes' | 'contentBase64'>,
    file: File,
  ): Promise<UserGuide> {
    const contentBase64 = await fileToBase64(file);
    const res = await api.post(`${USER_GUIDE_BASE}/createGuide`, {
      ...payload,
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      fileSizeBytes: file.size,
      contentBase64,
    });
    return res.data;
  }

  /**
   * Update metadata, and optionally replace the document in place. Passing no
   * file leaves the existing content untouched — the common case, since most
   * edits are a title or version bump.
   */
  static async updateGuide(payload: UpdateGuidePayload, file?: File): Promise<UserGuide> {
    let body: UpdateGuidePayload = payload;
    if (file) {
      body = {
        ...payload,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSizeBytes: file.size,
        contentBase64: await fileToBase64(file),
      };
    }
    const res = await api.post(`${USER_GUIDE_BASE}/updateGuide`, body);
    return res.data;
  }

  static async publishGuide(payload: PublishGuidePayload): Promise<UserGuide> {
    const res = await api.post(`${USER_GUIDE_BASE}/publishGuide`, payload);
    return res.data;
  }

  /** Soft delete — the record moves to ARCHIVED, the file is retained. */
  static async deleteGuide(payload: DeleteGuidePayload): Promise<void> {
    await api.post(`${USER_GUIDE_BASE}/deleteGuide`, payload);
  }
}
