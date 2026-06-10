/**
 * HRM Asset Module - Service Layer
 * Static class handling all API calls for asset operations
 */

import api from '@/services/api';
import { fileToBase64 } from '../utils/fileToBase64';
import type {
  AssetCategoryPayload,
  AssetCategoryResponse,
  CreateAssetPayload,
  UpdateAssetPayload,
  AssetAttachmentDto,
  AssetResponse,
  AssetListResponse,
  UpdateAssetStatusPayload,
  AssignAssetPayload,
  ReturnAssetPayload,
  MaintenanceEventPayload,
  AssetMaintenanceResponse,
  DepreciationRunPayload,
  DepreciationRunResult,
  AssetDepreciationSnapshotResponse,
  ChargeRecoveryPayload,
  ExitClearancePayload,
  ExitClearanceCheckResponse,
  AssetDashboardResponse,
  AssetWarrantyReminderResponse,
  AssetCustodyResponse,
  CreateAssetRequestPayload,
  AssetRequestResponse,
  ApproveRejectAssetRequestPayload,
  AllocateAssetPayload,
  AssetApprovalActionResponse,
  UpdateAssetRequestPayload,
  MoveNextAssetRequestPayload,
} from '../types/api.types';

export class HrmAssetService {
  private static readonly BASE = '/hrm-service';

  // ─── Asset Category ───────────────────────────────────────────────────────

  static async createCategory(payload: AssetCategoryPayload): Promise<AssetCategoryResponse> {
    const res = await api.post(`${this.BASE}/asset/category/create`, payload);
    return res.data;
  }

  static async updateCategory(payload: AssetCategoryPayload): Promise<AssetCategoryResponse> {
    const res = await api.post(`${this.BASE}/asset/category/update`, payload);
    return res.data;
  }

  static async getCategory(organizationId: string, categoryCode: string): Promise<AssetCategoryResponse> {
    const res = await api.post(`${this.BASE}/asset/category/retrieve`, { organizationId, categoryCode });
    return res.data;
  }

  static async getAllCategories(organizationId: string): Promise<AssetCategoryResponse[]> {
    const res = await api.post(`${this.BASE}/asset/category/retrieveAll`, { organizationId });
    return res.data;
  }

  static async deleteCategory(organizationId: string, categoryCode: string, deletedBy: string): Promise<void> {
    await api.post(`${this.BASE}/asset/category/delete`, { organizationId, categoryCode, createdBy: deletedBy });
  }

  // ─── Asset CRUD ───────────────────────────────────────────────────────────

  static async createAsset(payload: CreateAssetPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/create`, payload);
    return res.data;
  }

  static async updateAsset(payload: UpdateAssetPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/update`, payload);
    return res.data;
  }

  static async getAsset(organizationId: string, assetId: string): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/retrieve`, { organizationId, assetId });
    return res.data;
  }

  /**
   * Unified, role-aware asset list. Only organizationId is sent; the backend
   * determines the caller's role from the session/token and returns:
   *   Admin    → all assets in the organization.
   *   Employee → only assets allocated to them.
   * See ASSET_PENDING_BACKEND_CHANGES_V2.md #2.
   */
  static async getAllAssets(organizationId: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveAll`, { organizationId });
    return res.data;
  }

  static async getAssetsByCategory(organizationId: string, categoryCode: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveByCategory`, { organizationId, categoryCode });
    return res.data;
  }

  static async getAssetsByStatus(organizationId: string, status: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveByStatus`, { organizationId, status });
    return res.data;
  }

  static async getAssetsByEmployee(organizationId: string, employeeId: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveByEmployee`, { organizationId, employeeId });
    return res.data;
  }

  static async getInStoreByCategory(organizationId: string, categoryCode: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveInStore`, { organizationId, categoryCode });
    return res.data;
  }

  // ─── Status & Assignment ──────────────────────────────────────────────────

  static async updateStatus(payload: UpdateAssetStatusPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/updateStatus`, payload);
    return res.data;
  }

  static async assignAsset(payload: AssignAssetPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/assign`, payload);
    return res.data;
  }

  static async returnAsset(payload: ReturnAssetPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/return`, payload);
    return res.data;
  }

  static async getCustodyHistory(organizationId: string, assetId: string): Promise<AssetCustodyResponse[]> {
    const res = await api.post(`${this.BASE}/asset/custody/history`, { organizationId, assetId });
    return res.data;
  }

  // ─── Maintenance ──────────────────────────────────────────────────────────

  static async addMaintenanceEvent(payload: MaintenanceEventPayload): Promise<AssetMaintenanceResponse> {
    const res = await api.post(`${this.BASE}/asset/maintenance/create`, payload);
    return res.data;
  }

  static async getMaintenanceHistory(organizationId: string, assetId: string): Promise<AssetMaintenanceResponse[]> {
    const res = await api.post(`${this.BASE}/asset/maintenance/history`, { organizationId, assetId });
    return res.data;
  }

  // ─── Depreciation ─────────────────────────────────────────────────────────

  static async runDepreciation(payload: DepreciationRunPayload): Promise<DepreciationRunResult> {
    const res = await api.post(`${this.BASE}/asset/depreciation/run`, payload);
    return res.data;
  }

  static async getDepreciationHistory(organizationId: string, assetId: string): Promise<AssetDepreciationSnapshotResponse[]> {
    const res = await api.post(`${this.BASE}/asset/depreciation/history`, { organizationId, assetId });
    return res.data;
  }

  // ─── QR Code ──────────────────────────────────────────────────────────────

  static async generateQRCode(organizationId: string, assetId: string): Promise<string> {
    const res = await api.post(`${this.BASE}/asset/qr/generate`, { organizationId, assetId });
    return res.data;
  }

  // ─── Charge Recovery ──────────────────────────────────────────────────────

  static async confirmChargeRecovery(payload: ChargeRecoveryPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/recovery/confirm`, payload);
    return res.data;
  }

  // ─── Exit Clearance ───────────────────────────────────────────────────────

  static async checkExitClearance(payload: ExitClearancePayload): Promise<ExitClearanceCheckResponse> {
    const res = await api.post(`${this.BASE}/asset/exit/check`, payload);
    return res.data;
  }

  // ─── Dashboard & Warranty ─────────────────────────────────────────────────

  static async getDashboard(organizationId: string): Promise<AssetDashboardResponse> {
    const res = await api.post(`${this.BASE}/asset/dashboard`, { organizationId });
    return res.data;
  }

  static async getWarrantyReminders(organizationId: string, days: number = 30): Promise<AssetWarrantyReminderResponse[]> {
    const res = await api.post(`${this.BASE}/asset/warranty/reminders`, { organizationId, days });
    return res.data;
  }

  // ─── Asset Request ────────────────────────────────────────────────────────

  static async createAssetRequest(payload: CreateAssetRequestPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/create`, payload);
    return res.data;
  }

  static async submitAssetRequest(organizationId: string, requestId: string, employeeId: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/submit`, { organizationId, requestId, employeeId });
    return res.data;
  }

  static async cancelAssetRequest(
    organizationId: string,
    requestId: string,
    employeeId: string,
    reason?: string,
  ): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/cancel`, {
      organizationId,
      requestId,
      employeeId,
      // Sent so the backend can record why the request was withdrawn and
      // surface it on the detail panel + timeline (mirrors Leave).
      reason,
    });
    return res.data;
  }

  static async approveOrRejectRequest(payload: ApproveRejectAssetRequestPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/approve`, payload);
    return res.data;
  }

  /**
   * Edit a request that is still pending approval (PENDING_SUPERVISOR /
   * PENDING_ADMIN). Mirrors HrmLeaveService.amendLeaveRequest.
   * NOTE: backend endpoint pending — see ASSET_BACKEND_ISSUES_2.md.
   */
  static async updateAssetRequest(payload: UpdateAssetRequestPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/update`, payload);
    return res.data;
  }

  /**
   * Forward a pending request to the next-level supervisor. The current
   * approver pushes the request up the chain; backend resolves the next
   * approver. Mirrors HrmLeaveService.reassignRequest.
   * NOTE: backend endpoint pending — see ASSET_BACKEND_ISSUES_2.md.
   */
  static async moveToNextSupervisor(payload: MoveNextAssetRequestPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/moveNext`, payload);
    return res.data;
  }

  /**
   * Auto-escalate a pending request to the next level in the hierarchy.
   * Mirrors HrmLeaveService.escalateRequest.
   * NOTE: backend endpoint pending — see ASSET_BACKEND_ISSUES_2.md.
   */
  static async escalateAssetRequest(payload: MoveNextAssetRequestPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/escalate`, payload);
    return res.data;
  }

  static async allocateAsset(payload: AllocateAssetPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/allocate`, payload);
    return res.data;
  }

  static async markProcurement(organizationId: string, requestId: string, markedBy: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/procurement`, { organizationId, requestId, markedBy });
    return res.data;
  }

  static async getRequest(organizationId: string, requestId: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/retrieve`, { organizationId, requestId });
    return res.data;
  }

  static async getRequestsByEmployee(organizationId: string, employeeId: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/retrieveAll`, { organizationId, employeeId });
    return res.data;
  }

  static async getPendingForSupervisor(organizationId: string, supervisorId: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/pendingSupervisor`, { organizationId, supervisorId });
    return res.data;
  }

  static async getPendingForAdmin(organizationId: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/pendingAdmin`, { organizationId });
    return res.data;
  }

  static async getPendingAllocation(organizationId: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/pendingAllocation`, { organizationId });
    return res.data;
  }

  static async getApprovalHistory(organizationId: string, requestId: string): Promise<AssetApprovalActionResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/approvalHistory`, { organizationId, requestId });
    return res.data;
  }

  // ─── Attachments ──────────────────────────────────────────────────────────

  static async uploadAttachment(
    organizationId: string,
    assetId: string,
    file: File,
    uploadedBy: string,
  ): Promise<AssetAttachmentDto> {
    // Send the file inline as raw base64 — strip the `data:<mime>;base64,`
    // prefix so contentBase64 carries only the encoded bytes.
    const dataUri = await fileToBase64(file);
    const contentBase64 = dataUri.replace(/^data:[^;]+;base64,/, '');
    const res = await api.post(`${this.BASE}/asset/attachment/upload`, {
      organizationId,
      assetId,
      fileName: file.name,
      fileType: file.type,
      contentBase64,
      uploadedBy,
    });
    return res.data;
  }

  static async deleteAttachment(
    organizationId: string,
    assetId: string,
    attachmentId: string,
    deletedBy: string,
  ): Promise<void> {
    await api.post(`${this.BASE}/asset/attachment/delete`, {
      organizationId,
      assetId,
      attachmentId,
      deletedBy,
    });
  }
}
