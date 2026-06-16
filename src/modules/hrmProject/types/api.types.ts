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
  committedWorkHours?: number;
  utilizationPercentage: number;
  scheduleVariance: number;
  archived?: number;
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
  committedWorkHours?: number;
  utilizationPercentage: number;
  startDate: string;
  endDate: string;
  archived?: number;
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
  recurrenceDays?: string[] | null;
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
  recurrenceDays?: string[] | null;
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

// ─── Resource lifecycle: reassign / replace / revise ─────────────────────────

// Move ONE allocation (typically a task allocation) from its current employee to another.
// BE closes the outgoing allocation at effectiveDate (keeping past actuals) and opens an
// equivalent one for the incoming employee for the remaining window.
export interface AllocationReassignRequest {
  organizationId: string;
  allocationHandle: string;          // the allocation being moved
  newEmployeeId: string;
  newEmployeeName?: string;
  effectiveDate?: string;            // first day on the new employee; defaults to today
  reassignedBy: string;
  remarks?: string;
}

// Release a member from the project with NO replacement — end all their future
// allocations from effectiveDate, keeping past actuals.
export interface MemberReleaseRequest {
  organizationId: string;
  projectHandle: string;
  employeeId: string;
  effectiveDate?: string;
  releasedBy: string;
  remarks?: string;
}

// Replace a project member entirely: move their membership + ALL their task allocations
// on this project to the incoming employee from effectiveDate.
export interface MemberReplaceRequest {
  organizationId: string;
  projectHandle: string;
  outgoingEmployeeId: string;
  incomingEmployeeId: string;
  incomingEmployeeName?: string;
  effectiveDate?: string;            // first day for the incoming employee; defaults to today
  replacedBy: string;
  remarks?: string;
}

// Edit/extend an existing (typically APPROVED) allocation without cancel+recreate.
// Changing hours or shortening/extending the window resets the allocation to SUBMITTED
// for re-approval. End date cannot be moved before days that already have logged actuals.
export interface AllocationReviseRequest {
  organizationId: string;
  allocationHandle: string;
  hoursPerDay?: number;
  endDate?: string;
  billableRate?: number | null;
  revisedBy: string;
  remarks?: string;
}

// ─── Project manager handover ────────────────────────────────────────────────
// Changing the PM re-routes pending allocation approvals to the new manager.
export interface ProjectManagerChangeRequest {
  organizationId: string;
  handle: string;
  newProjectManagerId: string;
  newProjectManagerName?: string;
  reason?: string;
  modifiedBy: string;
}

// ─── Clone / archive ─────────────────────────────────────────────────────────
export interface ProjectCloneRequest {
  organizationId: string;
  sourceProjectHandle: string;
  newProjectName: string;
  includeTasks: boolean;
  includeMilestones: boolean;
  includeAllocations: boolean;
  clonedBy: string;
}

export interface ProjectArchiveRequest {
  organizationId: string;
  handle: string;
  archivedBy: string;
  reason?: string;
}

// ─── Temporary cover (leave backfill) ────────────────────────────────────────
export interface AllocationTemporaryCoverRequest {
  organizationId: string;
  allocationHandle: string;
  coverEmployeeId: string;
  coverEmployeeName?: string;
  coverFrom: string;
  coverTo: string;
  coveredBy: string;
  remarks?: string;
}

// ─── Approval delegation ─────────────────────────────────────────────────────
export interface ApprovalDelegationRequest {
  organizationId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  fromDate: string;
  toDate: string;
  delegatedBy: string;
  remarks?: string;
}

export interface ApprovalDelegationResponse {
  id?: string;
  handle?: string;
  organizationId: string;
  fromEmployeeId: string;
  fromEmployeeName?: string;
  toEmployeeId: string;
  toEmployeeName?: string;
  fromDate: string;
  toDate: string;
  active?: number;
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

export interface ResourceWorkloadEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  onBillable: boolean;
  onNonBillable: boolean;
  assignedProjects: { projectCode: string; projectName: string; projectType: string }[];
  unassigned: boolean;
  capacityHours: number;
  allocatedHours: number;
  actualHours: number;
  utilizationPercentage: number;
  utilizationStatus: 'UNDER' | 'OPTIMAL' | 'OVER' | string;
}

export interface ResourceWorkloadReport {
  periodStart: string;
  periodEnd: string;
  underThreshold: number;
  overThreshold: number;
  totalEmployees: number;
  billableCount: number;
  nonBillableCount: number;
  unassignedCount: number;
  underUtilizedCount: number;
  optimalCount: number;
  overloadedCount: number;
  employees: ResourceWorkloadEmployee[];
}

export interface ProjectAuditResponse {
  action: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  details?: string;
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
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  milestoneId?: string | null;
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
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  milestoneId?: string | null;
  active?: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
}

// Task lifecycle (status / move / merge)
export interface TaskStatusUpdateRequest {
  organizationId: string;
  projectHandle: string;
  taskHandle: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  modifiedBy: string;
}

export interface TaskMoveRequest {
  organizationId: string;
  taskHandle: string;
  targetProjectHandle: string;
  moveAllocations: boolean;
  movedBy: string;
  remarks?: string;
}

export interface TaskMergeRequest {
  organizationId: string;
  projectHandle: string;
  sourceTaskHandles: string[];
  targetTaskHandle: string;
  mergedBy: string;
  remarks?: string;
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
