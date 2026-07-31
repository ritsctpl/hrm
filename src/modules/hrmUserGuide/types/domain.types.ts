/**
 * User Guide module — core business entities.
 *
 * A guide is a single uploaded document (PDF) that documents ONE HRM module,
 * identified by `moduleCode` (HRM_LEAVE, HRM_ASSET, …). That field is what
 * lets the same records back both the standalone library screen and the
 * in-context help drawer opened from any module.
 */

export type GuideStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Who a guide is written for. `ADMIN` guides are hidden from users who lack
 * admin rights on the guide's target module — an "Approving Leave" guide is
 * noise for someone who can only apply for leave.
 */
export type GuideAudience = 'ALL' | 'ADMIN';

export interface UserGuide {
  guideId: string;
  organizationId?: string;
  /** Module this guide documents, e.g. "HRM_LEAVE". */
  moduleCode: string;
  /** Display name resolved server-side; falls back to the local label map. */
  moduleName?: string;
  title: string;
  description?: string;
  version?: string;
  audience: GuideAudience;
  status: GuideStatus;
  fileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  /**
   * Raw base64 of the document (no data-URI prefix). Returned ONLY by
   * `getGuide` — list responses omit it so the library grid stays light.
   */
  contentBase64?: string;
  tags?: string[];
  displayOrder?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

/** One module's worth of guides, as rendered by the library grid. */
export interface GuideGroup {
  moduleCode: string;
  moduleName: string;
  guides: UserGuide[];
}

/** Row of the left-hand module rail. */
export interface ModuleGuideCount {
  moduleCode: string;
  moduleName: string;
  guideCount: number;
}
