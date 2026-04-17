/**
 * HRM Asset Module - Service Layer
 * Static class handling all API calls for asset operations
 */

import api from '@/services/api';
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

  static async cancelAssetRequest(organizationId: string, requestId: string, employeeId: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/cancel`, { organizationId, requestId, employeeId });
    return res.data;
  }

  static async approveOrRejectRequest(payload: ApproveRejectAssetRequestPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/approve`, payload);
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
    const form = new FormData();
    form.append('file', file);
    form.append('organizationId', organizationId);
    form.append('assetId', assetId);
    form.append('uploadedBy', uploadedBy);
    const res = await api.post(`${this.BASE}/asset/attachment/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
