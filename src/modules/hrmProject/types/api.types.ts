// src/modules/hrmProject/types/api.types.ts

export interface ProjectRequest {
  site: string;
  projectName: string;
  description?: string;
  projectType: 'INTERNAL' | 'EXTERNAL';
  buCode: string;
  departmentCode?: string;
  clientName?: string;
  estimateHours: number;
  startDate: string;
  endDate: string;
  projectManagerId: string;
  milestones?: MilestoneRequest[];
  createdBy: string;
}

export interface MilestoneRequest {
  milestoneName: string;
  targetDate: string;
  description?: string;
}

export interface ProjectStatusUpdateRequest {
  site: string;
  handle: string;
  status: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  modifiedBy: string;
}

export interface MilestoneStatusUpdateRequest {
  site: string;
  projectHandle: string;
  milestoneId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  modifiedBy: string;
}

export interface ProjectResponse {
  handle: string;
  site: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: string;
  buCode: string;
  departmentCode?: string;
  clientName?: string;
  estimateHours: number;
  startDate: string;
  endDate: string;
  status: string;
  projectManagerId: string;
  projectManagerName: string;
  milestones: MilestoneResponse[];
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
  site: string;
  projectHandle: string;
  employeeId: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  recurring: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKDAYS' | 'CUSTOM';
  recurrenceDays?: string[];
  createdBy: string;
}

export interface AllocationResponse {
  handle: string;
  site: string;
  projectHandle: string;
  projectCode: string;
  projectName: string;
  employeeId: string;
  employeeName: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  bookingType: string;
  recurring: boolean;
  recurrencePattern?: string;
  recurrenceDays?: string[];
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
  isHoliday: boolean;
  isLeave: boolean;
  availableCapacity: number;
}

export interface AllocationApprovalRequest {
  site: string;
  allocationHandle: string;
  action: 'APPROVED' | 'REJECTED';
  remarks?: string;
  approverEmployeeId: string;
}

export interface CapacityCheckRequest {
  site: string;
  employeeId: string;
  startDate: string;
  endDate: string;
}

export interface CapacityCheckResponse {
  employeeId: string;
  employeeName: string;
  dailyCapacities: DailyCapacityResponse[];
}

export interface DailyCapacityResponse {
  date: string;
  baseCapacity: number;
  isHoliday: boolean;
  isLeave: boolean;
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
    isHoliday: boolean;
    isLeave: boolean;
    capacityStatus: 'GREEN' | 'YELLOW' | 'RED' | 'GREY';
  }[];
}

// ─── Client Types ────────────────────────────────────────────────────────────

export interface ClientRequest {
  site: string;
  clientCode: string;
  clientName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  createdBy: string;
}

export interface ClientResponse {
  handle: string;
  site: string;
  clientCode: string;
  clientName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
  modifiedBy: string;
}

// ─── Billing Types ───────────────────────────────────────────────────────────

export interface BillingConfigRequest {
  site: string;
  projectHandle: string;
  billingModel: 'TIME_AND_MATERIAL' | 'FIXED_PRICE' | 'MILESTONE' | 'RETAINER';
  currency: string;
  hourlyRate?: number;
  fixedAmount?: number;
  billingCycle?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
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
