// src/modules/hrmProject/types/ui.types.ts
import type { Project, ResourceAllocation, Milestone, MilestoneStatus, AllocationStatus, ProjectStatus } from './domain.types';

export type ProjectMainTab = 'projects' | 'allocations' | 'approvals' | 'calendar' | 'reports';
export type ProjectDetailTab = 'overview' | 'allocations' | 'milestones' | 'attachments' | 'audit';
export type ReportType = 'allocationVsActual' | 'utilization' | 'capacityDemand';

export interface ProjectFilters {
  searchQuery: string;
  filterBU: string;
  filterDept: string;
  filterType: string;
  filterStatus: string;
  filterPM: string;
}

export interface MilestoneFormItem {
  key: string;
  milestoneName: string;
  targetDate: string;
  description: string;
}

export interface ProjectFormValues {
  projectName: string;
  projectType: 'INTERNAL' | 'EXTERNAL';
  clientName?: string;
  buCode: string;
  departmentCode?: string;
  projectManagerId: string;
  estimateHours: number;
  startDate: string;
  endDate: string;
  description?: string;
  milestones: MilestoneFormItem[];
}

export interface AllocationFormValues {
  employeeId: string;
  employeeName: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  recurring: boolean;
  recurrencePattern: 'DAILY' | 'WEEKDAYS' | 'CUSTOM';
  recurrenceDays: string[];
}

export interface ProjectKpis {
  total: number;
  active: number;
  draft: number;
  onHold: number;
  completed: number;
}

export interface ProjectListItem extends Pick<Project, 'handle' | 'projectCode' | 'projectName' | 'projectType' | 'buCode' | 'status' | 'projectManagerName' | 'estimateHours' | 'totalAllocatedHours' | 'totalActualHours' | 'utilizationPercentage' | 'startDate' | 'endDate'> {}

// Component prop types (for linter compatibility)
export interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export interface AllocationStatusBadgeProps {
  status: AllocationStatus;
}

export interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
}

export interface ProjectKpiCardProps {
  label: string;
  value: number;
  colorVariant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export interface ProjectListRowProps {
  project: ProjectListItem;
  isSelected: boolean;
  onClick: (project: ProjectListItem) => void;
}

export interface AllocationRowProps {
  allocation: ResourceAllocation;
  onEdit?: (a: ResourceAllocation) => void;
  onSubmit?: (a: ResourceAllocation) => void;
  onCancel?: (a: ResourceAllocation) => void;
}

export interface MilestoneRowProps {
  milestone: Milestone;
  isEditing?: boolean;
  onStatusChange?: (milestoneId: string, status: MilestoneStatus) => void;
  onRemove?: (milestoneId: string) => void;
}

export interface CapacityDayCellProps {
  capacity: import('./domain.types').DailyCapacity;
}
