// src/modules/hrmProject/types/api.types.ts

export interface ProjectRequest {
  organizationId: string;
  projectName: string;
  description?: string;
  projectType: 'BILLABLE' | 'NON_BILLABLE' | 'REVENUE_GENERATION';
  status?: 'INITIATED' | 'DRAFT' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  baseProjectHandle?: string;
  buCode: string;
  departmentCode?: string;
  clientName?: string;
  clientId?: string;
  currency?: string;
  estimateHours: number;
  startDate: string;
  endDate: string;
  projectManagerId: string;
  projectManagerName?: string;
  milestones?: MilestoneRequest[];
  createdBy: string;
}

export interface MilestoneRequest {
  milestoneName: string;
  targetDate: string;
  description?: string;
}

export interface ProjectStatusUpdateRequest {
  organizationId: string;
  handle: string;
  status: 'INITIATED' | 'DRAFT' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  modifiedBy: string;
}

export interface MilestoneStatusUpdateRequest {
  organizationId: string;
  projectHandle: string;
  milestoneId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  modifiedBy: string;
}

export interface MilestoneUpdateRequest {
  organizationId: string;
  projectHandle: string;
  milestoneId: string;
  milestoneName: string;
  targetDate: string;
  description?: string;
  modifiedBy: string;
}

export interface ProjectResponse {
  handle: string;
  organizationId: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: string;
  baseProjectHandle?: string;
  buCode: string;
  departmentCode?: string;
  clientName?: string;
  estimateHours: number;
  startDate: string;
  endDate: string;
  status: string;
  projectManagerId: string;
  projectManagerName: string;
  clientId?: string;
  billingType?: string;
  hourlyRate?: number;
  currency?: string;
  milestones: MilestoneResponse[];
  tasks?: ProjectTaskResponse[];
  attachments: ProjectAttachmentResponse[];
  totalAllocatedHours: number;
  totalActualHours: number;
  utilizationPercentage: number;
  scheduleVariance: number;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
  modifiedBy: string;
}

export interface ProjectListResponse {
  handle: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  baseProjectHandle?: string;
  buCode: string;
  status: string;
  projectManagerName: string;
  estimateHours: number;
  totalAllocatedHours: number;
  totalActualHours: number;
  utilizationPercentage: number;
  startDate: string;
  endDate: string;
}

export interface MilestoneResponse {
  milestoneId: string;
  milestoneName: string;
  targetDate: string;
  status: string;
  description?: string;
}

export interface ProjectAttachmentResponse {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AllocationRequest {
  organizationId: string;
  projectHandle: string;
  employeeId: string;
  employeeName?: string;
  taskId?: string | null;
  billableRate?: number | null;
  costRate?: number | null;
  role: string;
  bookingType: 'FIRM' | 'TENTATIVE';
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  recurring: boolean;
  recurrencePattern?: 'WEEKLY' | 'MONTHLY' | null;
  recurrenceDays?: number[] | null;
  createdBy: string;
}

export interface AllocationResponse {
  handle: string;
  organizationId: string;
  projectHandle: string;
  projectCode: string;
  projectName: string;
  employeeId: string;
  employeeName: string;
  taskId?: string | null;
  taskName?: string | null;
  billableRate?: number | null;
  costRate?: number | null;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  bookingType: string;
  role?: string;
  recurring: boolean;
  recurrencePattern?: string | null;
  recurrenceDays?: number[] | null;
  status: string;
  approvalRemarks?: string;
  totalAllocatedHours: number;
  allocationDays: AllocationDayResponse[];
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
  modifiedBy: string;
}

export interface AllocationDayResponse {
  date: string;
  hours: number;
  holiday: boolean;
  leave: boolean;
  availableCapacity: number;
}

export interface AllocationApprovalRequest {
  organizationId: string;
  allocationHandle: string;
  action: 'APPROVED' | 'REJECTED';
  approverEmployeeId: string;
  approverName?: string;
  remarks?: string;
}

export interface CapacityCheckRequest {
  organizationId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  requestedHoursPerDay?: number;
}

export interface CapacityCheckResponse {
  employeeId: string;
  employeeName: string;
  dailyCapacities: DailyCapacityResponse[];
}

export interface DailyCapacityResponse {
  date: string;
  baseCapacity: number;
  holiday: boolean;
  leave: boolean;
  allocatedHours: number;
  availableHours: number;
  capacityStatus: 'GREEN' | 'YELLOW' | 'RED';
}

export interface ProjectAllocationVsActualReport {
  projectHandle: string;
  projectCode: string;
  projectName: string;
  estimateHours: number;
  allocatedHours: number;
  actualHours: number;
  scheduleVariance: number;
  allocationAdherence: number;
  forecastAccuracy: number;
  employeeBreakdown: {
    employeeId: string;
    employeeName: string;
    allocatedHours: number;
    actualHours: number;
    adherencePercentage: number;
  }[];
}

export interface ResourceUtilizationReport {
  periodStart: string;
  periodEnd: string;
  employees: {
    employeeId: string;
    employeeName: string;
    department: string;
    totalCapacityHours: number;
    allocatedHours: number;
    actualHours: number;
    utilizationPercentage: number;
    utilizationStatus: 'UNDER' | 'OPTIMAL' | 'OVER';
  }[];
}

export interface CapacityDemandReport {
  periodStart: string;
  periodEnd: string;
  totalCapacityHours: number;
  totalDemandHours: number;
  gapHours: number;
  byDepartment: {
    department: string;
    headcount: number;
    capacityHours: number;
    demandHours: number;
    gapHours: number;
  }[];
}

export interface ProjectKpiResponse {
  total: number;
  active: number;
  draft: number;
  onHold: number;
  completed: number;
}

export interface ResourceCalendarResponse {
  employee: {
    employeeId: string;
    employeeName: string;
    department: string;
  };
  days: {
    date: string;
    allocatedHours: number;
    holiday: boolean;
    leave: boolean;
    capacityStatus: 'GREEN' | 'YELLOW' | 'RED' | 'GREY';
  }[];
}

// ─── Task Types (S2) — confirm exact field names with BE ProjectTask DTOs ────────

export interface ProjectTaskRequest {
  organizationId: string;
  projectHandle: string;
  handle?: string; // for update — the task handle being updated
  taskName: string;
  description?: string;
  estimatedHours?: number;
  billableRate?: number;
  billable?: boolean;
  isDefault?: boolean;
  createdBy?: string;
  modifiedBy?: string;
}

export interface ProjectTaskResponse {
  handle: string; // task identifier
  projectHandle: string;
  taskName: string;
  description?: string;
  estimatedHours: number;
  billableRate?: number;
  billable: boolean;
  isDefault: boolean;
  actualHours?: number;
  active?: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
}

export interface ImportTasksRequest {
  organizationId: string;
  targetProjectHandle: string;
  sourceProjectHandle: string;
  taskHandles?: string[]; // omit to copy ALL tasks from source
  createdBy: string;
}

// ─── Client Types ────────────────────────────────────────────────────────────

export interface ClientRequest {
  organizationId: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  createdBy: string;
}

export interface ClientUpdateRequest {
  organizationId: string;
  id: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  modifiedBy: string;
}

export interface ClientResponse {
  id?: string;
  handle?: string;
  organizationId: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  active?: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

// ─── Billing Types ───────────────────────────────────────────────────────────

export interface BillingConfigRequest {
  organizationId: string;
  projectHandle: string;
  billingType: 'TIME_MATERIAL' | 'FIXED_PRICE' | 'RETAINER';
  currency: string;
  hourlyRate?: number;
  configuredBy: string;
}

export interface BillingSummaryResponse {
  projectHandle: string;
  projectCode: string;
  projectName: string;
  billingModel: string;
  currency: string;
  totalBillableHours: number;
  totalBilledAmount: number;
  outstandingAmount: number;
  periodStart: string;
  periodEnd: string;
  entries: {
    employeeId: string;
    employeeName: string;
    billableHours: number;
    rate: number;
    amount: number;
  }[];
}
