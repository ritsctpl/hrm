/**
 * User Guide module — request payload shapes.
 *
 * Every endpoint is POST and takes `organizationId`, per the HRM backend
 * convention. Responses are unwrapped by the `api.ts` interceptor, so the
 * service layer sees the payload directly.
 */

import { GuideAudience, GuideStatus } from './domain.types';

export interface ListGuidesPayload {
  organizationId: string;
  /** Omit for the whole library. */
  moduleCode?: string;
  /** Admin lists pass 'DRAFT' etc.; omit to get PUBLISHED only. */
  status?: GuideStatus;
  searchText?: string;
  audience?: GuideAudience;
}

export interface GetGuidePayload {
  organizationId: string;
  guideId: string;
}

export interface ListModulesWithGuidesPayload {
  organizationId: string;
  /** True when the caller may see DRAFT/ARCHIVED counts too. */
  includeUnpublished?: boolean;
}

export interface CreateGuidePayload {
  organizationId: string;
  moduleCode: string;
  title: string;
  description?: string;
  version?: string;
  audience: GuideAudience;
  status?: GuideStatus;
  tags?: string[];
  displayOrder?: number;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  /** Raw base64, data-URI prefix stripped. */
  contentBase64: string;
  uploadedBy: string;
}

export interface UpdateGuidePayload {
  organizationId: string;
  guideId: string;
  moduleCode?: string;
  title?: string;
  description?: string;
  version?: string;
  audience?: GuideAudience;
  status?: GuideStatus;
  tags?: string[];
  displayOrder?: number;
  /** File fields present only when the document is being replaced. */
  fileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  contentBase64?: string;
  modifiedBy: string;
}

export interface PublishGuidePayload {
  organizationId: string;
  guideId: string;
  publishedBy: string;
}

export interface DeleteGuidePayload {
  organizationId: string;
  guideId: string;
  deletedBy: string;
}
