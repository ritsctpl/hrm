/**
 * HRM Asset Module - Domain Types
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

export type AssetDetailTab =
  | 'overview'
  | 'attributes'
  | 'attachments'
  | 'custody'
  | 'maintenance'
  | 'depreciation';

export interface AssetAttribute {
  attrName: string;
  attrValue: string;
}

export interface AttributeSchema {
  fieldName: string;
  label: string;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  required: boolean;
}

export interface AssetCategory {
  categoryCode: string;
  categoryName: string;
  description?: string;
  iconUrl?: string;
  wdvRatePct: number;
  usefulLifeYears?: number;
  salvageValueINR?: number;
  attributeSchema: AttributeSchema[];
  active: number;
}

export interface AssetAttachment {
  attachmentId: string;
  fileType: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ChargeRecovery {
  presentValueAtEvent: number;
  eventDate: string;
  eventType: 'LOST' | 'DAMAGED';
  recoveryStatus: 'PENDING_FINANCE' | 'FINANCE_CONFIRMED' | 'PAYROLL_DEDUCTION' | 'CLOSED';
  financeConfirmedBy?: string;
  financeConfirmedAt?: string;
  remarks?: string;
}

export interface Asset {
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
  attributes: AssetAttribute[];
  attachments: AssetAttachment[];
  chargeRecovery?: ChargeRecovery;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface AssetCustody {
  custodyId: string;
  assetId: string;
  employeeId: string;
  employeeName: string;
  fromDate: string;
  toDate?: string;
  expectedReturnDate?: string;
  allocationRequestId?: string;
  returnedBy?: string;
  returnRemarks?: string;
  handoverReceiptNo?: string;
}

export interface AssetMaintenanceEvent {
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

export interface AssetDepreciationSnapshot {
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

export interface AssetDashboard {
  totalAssets: number;
  inStore: number;
  assigned: number;
  underRepair: number;
  damaged: number;
  lost: number;
  retired: number;
  pendingRequests: number;
  warrantyExpiringIn30Days: number;
  categoryBreakdown: CategorySummary[];
}

export interface CategorySummary {
  categoryCode: string;
  categoryName: string;
  count: number;
  assignedCount: number;
}

export interface AssetApprovalAction {
  actionId: string;
  requestId: string;
  actorEmployeeId: string;
  actorName: string;
  actorRole: string;
  action: string;
  remarks?: string;
  actionAt: string;
}

export interface AssetRequest {
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
  approvalHistory: AssetApprovalAction[];
  createdDateTime: string;
  modifiedDateTime: string;
}
