// src/modules/hrmProject/types/domain.types.ts

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectType = 'INTERNAL' | 'EXTERNAL';
export type AllocationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
export type RecurrencePattern = 'DAILY' | 'WEEKDAYS' | 'CUSTOM';
export type CapacityStatus = 'GREEN' | 'YELLOW' | 'RED' | 'GREY';

export interface Milestone {
  milestoneId: string;
  milestoneName: string;
  targetDate: string;
  status: MilestoneStatus;
  description?: string;
}

export interface ProjectAttachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Project {
  handle: string;
  site: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: ProjectType;
  buCode: string;
  departmentCode?: string;
  clientName?: string;
  estimateHours: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  projectManagerId: string;
  projectManagerName: string;
  milestones: Milestone[];
  attachments: ProjectAttachment[];
  totalAllocatedHours: number;
  totalActualHours: number;
  utilizationPercentage: number;
  scheduleVariance: number;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface AllocationDay {
  date: string;
  hours: number;
  isHoliday: boolean;
  isLeave: boolean;
  availableCapacity: number;
}

export interface ResourceAllocation {
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
  recurrencePattern?: RecurrencePattern;
  recurrenceDays?: string[];
  status: AllocationStatus;
  approvalRemarks?: string;
  totalAllocatedHours: number;
  allocationDays: AllocationDay[];
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface AllocationApproval {
  handle: string;
  site: string;
  allocationHandle: string;
  approverEmployeeId: string;
  approverName: string;
  approverRole: string;
  action: 'APPROVED' | 'REJECTED';
  remarks?: string;
  actionDateTime: string;
}

export interface DailyCapacity {
  date: string;
  baseCapacity: number;
  isHoliday: boolean;
  isLeave: boolean;
  allocatedHours: number;
  availableHours: number;
  capacityStatus: CapacityStatus;
}

export interface CapacityCheckResult {
  employeeId: string;
  employeeName: string;
  dailyCapacities: DailyCapacity[];
}

export interface ProjectAllocationVsActual {
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

export interface ResourceCalendarEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  days: {
    date: string;
    allocatedHours: number;
    isHoliday: boolean;
    isLeave: boolean;
    capacityStatus: CapacityStatus;
  }[];
}
