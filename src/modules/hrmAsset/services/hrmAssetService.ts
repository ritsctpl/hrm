/**
 * HRM Asset Module - Service Layer
 * Static class handling all API calls for asset operations
 */

import api from '@/services/api';
import type {
  AssetCategoryPayload,
  AssetCategoryResponse,
  CreateAssetPayload,
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

  static async getCategory(site: string, categoryCode: string): Promise<AssetCategoryResponse> {
    const res = await api.post(`${this.BASE}/asset/category/retrieve`, { site, categoryCode });
    return res.data;
  }

  static async getAllCategories(site: string): Promise<AssetCategoryResponse[]> {
    const res = await api.post(`${this.BASE}/asset/category/retrieveAll`, { site });
    return res.data;
  }

  static async deleteCategory(site: string, categoryCode: string, deletedBy: string): Promise<void> {
    await api.post(`${this.BASE}/asset/category/delete`, { site, categoryCode, createdBy: deletedBy });
  }

  // ─── Asset CRUD ───────────────────────────────────────────────────────────

  static async createAsset(payload: CreateAssetPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/create`, payload);
    return res.data;
  }

  static async updateAsset(payload: CreateAssetPayload): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/update`, payload);
    return res.data;
  }

  static async getAsset(site: string, assetId: string): Promise<AssetResponse> {
    const res = await api.post(`${this.BASE}/asset/retrieve`, { site, assetId });
    return res.data;
  }

  static async getAllAssets(site: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveAll`, { site });
    return res.data;
  }

  static async getAssetsByCategory(site: string, categoryCode: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveByCategory`, { site, categoryCode });
    return res.data;
  }

  static async getAssetsByStatus(site: string, status: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveByStatus`, { site, status });
    return res.data;
  }

  static async getAssetsByEmployee(site: string, employeeId: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveByEmployee`, { site, employeeId });
    return res.data;
  }

  static async getInStoreByCategory(site: string, categoryCode: string): Promise<AssetListResponse[]> {
    const res = await api.post(`${this.BASE}/asset/retrieveInStore`, { site, categoryCode });
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

  static async getCustodyHistory(site: string, assetId: string): Promise<AssetCustodyResponse[]> {
    const res = await api.post(`${this.BASE}/asset/custody/history`, { site, assetId });
    return res.data;
  }

  // ─── Maintenance ──────────────────────────────────────────────────────────

  static async addMaintenanceEvent(payload: MaintenanceEventPayload): Promise<AssetMaintenanceResponse> {
    const res = await api.post(`${this.BASE}/asset/maintenance/create`, payload);
    return res.data;
  }

  static async getMaintenanceHistory(site: string, assetId: string): Promise<AssetMaintenanceResponse[]> {
    const res = await api.post(`${this.BASE}/asset/maintenance/history`, { site, assetId });
    return res.data;
  }

  // ─── Depreciation ─────────────────────────────────────────────────────────

  static async runDepreciation(payload: DepreciationRunPayload): Promise<DepreciationRunResult> {
    const res = await api.post(`${this.BASE}/asset/depreciation/run`, payload);
    return res.data;
  }

  static async getDepreciationHistory(site: string, assetId: string): Promise<AssetDepreciationSnapshotResponse[]> {
    const res = await api.post(`${this.BASE}/asset/depreciation/history`, { site, assetId });
    return res.data;
  }

  // ─── QR Code ──────────────────────────────────────────────────────────────

  static async generateQRCode(site: string, assetId: string): Promise<string> {
    const res = await api.post(`${this.BASE}/asset/qr/generate`, { site, assetId });
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

  static async getDashboard(site: string): Promise<AssetDashboardResponse> {
    const res = await api.post(`${this.BASE}/asset/dashboard`, { site });
    return res.data;
  }

  static async getWarrantyReminders(site: string, days: number = 30): Promise<AssetWarrantyReminderResponse[]> {
    const res = await api.post(`${this.BASE}/asset/warranty/reminders`, { site, days });
    return res.data;
  }

  // ─── Asset Request ────────────────────────────────────────────────────────

  static async createAssetRequest(payload: CreateAssetRequestPayload): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/create`, payload);
    return res.data;
  }

  static async submitAssetRequest(site: string, requestId: string, employeeId: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/submit`, { site, requestId, employeeId });
    return res.data;
  }

  static async cancelAssetRequest(site: string, requestId: string, employeeId: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/cancel`, { site, requestId, employeeId });
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

  static async markProcurement(site: string, requestId: string, markedBy: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/procurement`, { site, requestId, markedBy });
    return res.data;
  }

  static async getRequest(site: string, requestId: string): Promise<AssetRequestResponse> {
    const res = await api.post(`${this.BASE}/asset/request/retrieve`, { site, requestId });
    return res.data;
  }

  static async getRequestsByEmployee(site: string, employeeId: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/retrieveAll`, { site, employeeId });
    return res.data;
  }

  static async getPendingForSupervisor(site: string, supervisorId: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/pendingSupervisor`, { site, supervisorId });
    return res.data;
  }

  static async getPendingForAdmin(site: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/pendingAdmin`, { site });
    return res.data;
  }

  static async getPendingAllocation(site: string): Promise<AssetRequestResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/pendingAllocation`, { site });
    return res.data;
  }

  static async getApprovalHistory(site: string, requestId: string): Promise<AssetApprovalActionResponse[]> {
    const res = await api.post(`${this.BASE}/asset/request/approvalHistory`, { site, requestId });
    return res.data;
  }
}
