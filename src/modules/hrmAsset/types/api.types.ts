/**
 * HRM Asset Module - API Types
 * Request/response DTOs for all asset API operations
 */

export type AssetStatus = 'IN_STORE' | 'WORKING' | 'UNDER_REPAIR' | 'DAMAGED' | 'LOST' | 'RETIRED';

export type AssetRequestStatus =
  | 'DRAFT'
  | 'PENDING_SUPERVISOR'
  | 'PENDING_ADMIN'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING_ALLOCATION'
  | 'ALLOCATED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AttributeSchemaDto {
  fieldName: string;
  label: string;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  required: boolean;
}

export interface AssetCategoryPayload {
  organizationId: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  iconUrl?: string;
  wdvRatePct: number;
  usefulLifeYears?: number;
  salvageValueINR?: number;
  attributeSchema?: AttributeSchemaDto[];
  createdBy?: string;
}

export interface AssetCategoryResponse {
  handle: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  iconUrl?: string;
  wdvRatePct: number;
  usefulLifeYears?: number;
  salvageValueINR?: number;
  attributeSchema: AttributeSchemaDto[];
  active: number;
}

export interface CreateAssetPayload {
  organizationId: string;
  categoryCode: string;
  assetName: string;
  assetId?: string;
  purchaseValueINR: number;
  purchaseDate: string;
  vendor?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  location?: string;
  attributes?: { attrName: string; attrValue: string }[];
  createdBy: string;
}

export interface UpdateAssetPayload {
  organizationId: string;
  assetId: string;
  assetName?: string;
  purchaseValueINR?: number;
  purchaseDate?: string;
  vendor?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  location?: string;
  modifiedBy: string;
}

export interface AssetAttachmentDto {
  attachmentId: string;
  fileType: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ChargeRecoveryDto {
  presentValueAtEvent: number;
  eventDate: string;
  eventType: 'LOST' | 'DAMAGED';
  recoveryStatus: 'PENDING_FINANCE' | 'FINANCE_CONFIRMED' | 'PAYROLL_DEDUCTION' | 'CLOSED';
  financeConfirmedBy?: string;
  financeConfirmedAt?: string;
  remarks?: string;
}

export interface AssetResponse {
  assetId: string;
  categoryCode: string;
  categoryName: string;
  assetName: string;
  status: AssetStatus;
  purchaseValueINR: number;
  purchaseDate: string;
  vendor: string;
  invoiceNo: string;
  invoiceDate: string;
  location?: string;
  currentHolderEmployeeId?: string;
  currentHolderName?: string;
  presentValueINR: number;
  lastDepreciationDate?: string;
  qrDownloadUrl?: string;
  attributes: { attrName: string; attrValue: string }[];
  attachments: AssetAttachmentDto[];
  chargeRecovery?: ChargeRecoveryDto;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface AssetListResponse {
  assetId: string;
  categoryCode: string;
  categoryName: string;
  assetName: string;
  status: AssetStatus;
  currentHolderName?: string;
  presentValueINR: number;
  location?: string;
}

export interface UpdateAssetStatusPayload {
  organizationId: string;
  assetId: string;
  newStatus: string;
  remarks?: string;
  updatedBy: string;
}

export interface AssignAssetPayload {
  organizationId: string;
  assetId: string;
  employeeId: string;
  employeeName: string;
  allocationRequestId: string;
  allocationDate: string;
  expectedReturnDate?: string;
  assignedBy: string;
}

export interface ReturnAssetPayload {
  organizationId: string;
  assetId: string;
  returnDate: string;
  checklistCompleted: boolean;
  handoverReceiptNo?: string;
  returnRemarks?: string;
  returnedBy: string;
}

export interface MaintenanceEventPayload {
  organizationId: string;
  assetId: string;
  maintenanceDate: string;
  vendor?: string;
  issue: string;
  actionTaken?: string;
  costINR?: number;
  warrantyUsed: boolean;
  warrantyRef?: string;
  createdBy: string;
}

export interface AssetMaintenanceResponse {
  eventId: string;
  assetId: string;
  maintenanceDate: string;
  vendor?: string;
  issue: string;
  actionTaken?: string;
  costINR?: number;
  warrantyUsed: boolean;
  warrantyRef?: string;
  createdDateTime: string;
}

export interface DepreciationRunPayload {
  organizationId: string;
  asOfDate: string;
  categoryCode?: string;
  prorateMidYear: boolean;
  runBy: string;
}

export interface DepreciationRunResult {
  batchRunId: string;
  asOfDate: string;
  totalAssetsProcessed: number;
  totalPrevBookValue: number;
  totalPresentValue: number;
  details: {
    assetId: string;
    assetName: string;
    categoryCode: string;
    prevBookValue: number;
    ratePct: number;
    presentValue: number;
  }[];
}

export interface AssetDepreciationSnapshotResponse {
  snapId: string;
  assetId: string;
  categoryCode: string;
  asOfDate: string;
  method: string;
  ratePct: number;
  prevBookValueINR: number;
  presentValueINR: number;
  proratedFirstYear: boolean;
  runBy: string;
  batchRunId: string;
}

export interface ChargeRecoveryPayload {
  organizationId: string;
  assetId: string;
  action: 'CONFIRM' | 'CLOSE';
  financeConfirmedBy?: string;
  remarks?: string;
}

export interface ExitClearancePayload {
  organizationId: string;
  employeeId: string;
}

export interface ExitClearanceCheckResponse {
  employeeId: string;
  clearanceGranted: boolean;
  pendingAssets: AssetResponse[];
  message: string;
}

export interface AssetDashboardResponse {
  totalAssets: number;
  inStore: number;
  assigned: number;
  underRepair: number;
  damaged: number;
  lost: number;
  retired: number;
  pendingRequests: number;
  warrantyExpiringIn30Days: number;
  categoryBreakdown: { categoryCode: string; categoryName: string; count: number; assignedCount: number }[];
}

export interface AssetWarrantyReminderResponse {
  assetId: string;
  assetName: string;
  reminderType: 'WARRANTY' | 'AMC' | 'INSURANCE' | 'PUC';
  expiryDate: string;
  reminderSent: boolean;
}

export interface AssetCustodyResponse {
  custodyId: string;
  assetId: string;
  employeeId: string;
  employeeName: string;
  fromDate: string;
  toDate?: string;
  expectedReturnDate?: string;
  allocationRequestId?: string;
  returnRemarks?: string;
  handoverReceiptNo?: string;
}

export interface CreateAssetRequestPayload {
  organizationId: string;
  employeeId: string;
  employeeName: string;
  categoryCode: string;
  quantity: number;
  purpose: string;
  remarks?: string;
  supervisorId: string;
  supervisorName: string;
  createdBy: string;
}

export interface AssetApprovalActionResponse {
  actionId: string;
  requestId: string;
  actorEmployeeId: string;
  actorName: string;
  actorRole: string;
  action: string;
  remarks?: string;
  actionAt: string;
}

export interface AssetRequestResponse {
  requestId: string;
  employeeId: string;
  employeeName: string;
  categoryCode: string;
  categoryName: string;
  quantity: number;
  purpose: string;
  remarks?: string;
  status: AssetRequestStatus;
  supervisorId: string;
  supervisorName: string;
  linkedAssetId?: string;
  allocationDate?: string;
  allocatedBy?: string;
  escalated: boolean;
  pendingProcurement: boolean;
  approvalHistory: AssetApprovalActionResponse[];
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface ApproveRejectAssetRequestPayload {
  organizationId: string;
  requestId: string;
  action: 'APPROVE_SUPERVISOR' | 'REJECT_SUPERVISOR' | 'APPROVE_ADMIN' | 'REJECT_ADMIN';
  actorEmployeeId: string;
  actorName: string;
  actorRole: string;
  remarks?: string;
}

export interface AllocateAssetPayload {
  organizationId: string;
  requestId: string;
  assetId: string;
  allocatedBy: string;
  allocationDate: string;
  expectedReturnDate?: string;
  remarks?: string;
}
