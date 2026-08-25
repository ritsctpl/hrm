import api from '@/services/api';
import type {
  ProjectRequest,
  ProjectResponse,
  ProjectListResponse,
  ProjectStatusUpdateRequest,
  MilestoneStatusUpdateRequest,
  MilestoneUpdateRequest,
  AllocationRequest,
  AllocationResponse,
  AllocationReassignRequest,
  MemberReplaceRequest,
  MemberReleaseRequest,
  AllocationReviseRequest,
  ProjectManagerChangeRequest,
  ProjectCloneRequest,
  ProjectArchiveRequest,
  AllocationTemporaryCoverRequest,
  CapacityCheckRequest,
  CapacityCheckResponse,
  ProjectAllocationVsActualReport,
  ResourceUtilizationReport,
  CapacityDemandReport,
  ResourceWorkloadReport,
  ClientRequest,
  ClientUpdateRequest,
  ClientResponse,
  BillingConfigRequest,
  BillingSummaryResponse,
  ProjectTaskRequest,
  ProjectTaskResponse,
  ImportTasksRequest,
  TaskStatusUpdateRequest,
  TaskMoveRequest,
  TaskMergeRequest,
  TaskExtensionRequest,
  ProjectAuditResponse,
} from '../types/api.types';

const BASE = '/hrm-service/project';

export class HrmProjectService {
  static async createProject(payload: ProjectRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/create`, payload);
    return res.data;
  }

  static async updateProject(handle: string, payload: Partial<ProjectRequest>): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/update`, { handle, ...payload });
    return res.data;
  }

  static async getProject(organizationId: string, handle: string): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/retrieve`, { organizationId, handle });
    return res.data;
  }

  static async listProjects(
    organizationId: string,
    buCode?: string,
    departmentCode?: string,
    status?: string,
    projectManagerId?: string
  ): Promise<ProjectListResponse[]> {
    const res = await api.post(`${BASE}/list`, { organizationId, buCode, departmentCode, status, projectManagerId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async updateProjectStatus(payload: ProjectStatusUpdateRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/updateStatus`, payload);
    return res.data;
  }

  static async deleteProject(organizationId: string, handle: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/delete`, { organizationId, handle, deletedBy });
  }

  static async addMilestone(
    organizationId: string,
    projectHandle: string,
    milestone: { milestoneName: string; targetDate: string; description?: string },
    createdBy: string
  ): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/milestone/add`, { organizationId, projectHandle, milestone, createdBy });
    return res.data;
  }

  static async updateMilestoneStatus(payload: MilestoneStatusUpdateRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/milestone/updateStatus`, payload);
    return res.data;
  }

  static async updateMilestone(payload: MilestoneUpdateRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/milestone/update`, payload);
    return res.data;
  }

  static async removeMilestone(projectHandle: string, milestoneId: string, removedBy: string): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/milestone/remove`, { projectHandle, milestoneId, removedBy });
    return res.data;
  }

  static async createAllocation(payload: AllocationRequest): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/create`, payload);
    return res.data;
  }

  static async getAllocationsByProject(organizationId: string, projectHandle: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/allocation/listByProject`, { organizationId, projectHandle });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getAllocationsByEmployee(organizationId: string, employeeId: string, status?: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/allocation/listByEmployee`, { organizationId, employeeId, status });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async cancelAllocation(organizationId: string, handle: string, cancelledBy: string): Promise<void> {
    await api.post(`${BASE}/allocation/cancel`, { organizationId, handle, cancelledBy });
  }

  // Move one allocation (task or membership) to another employee.
  static async reassignAllocation(payload: AllocationReassignRequest): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/reassign`, payload);
    return res.data;
  }

  // Replace a project member — moves membership + all their task allocations.
  static async replaceMember(payload: MemberReplaceRequest): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/allocation/replaceMember`, payload);
    return Array.isArray(res.data) ? res.data : [];
  }

  // Release a member (no replacement) — ends their future allocations from a date.
  static async releaseMember(payload: MemberReleaseRequest): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/allocation/releaseMember`, payload);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Edit an allocation's hours/dates/rate in place. */
  static async updateAllocation(payload: {
    organizationId: string;
    handle: string;
    hoursPerDay: number;
    startDate: string;
    endDate: string;
    billableRate?: number | null;
    modifiedBy?: string;
  }): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/update`, payload);
    return res.data;
  }

  /** Removes an allocation for good; a project-level one takes its task rows with it. */
  static async deleteAllocation(payload: { organizationId: string; handle: string; deletedBy: string }): Promise<void> {
    await api.post(`${BASE}/allocation/delete`, payload);
  }

  // Edit/extend an existing APPROVED allocation.
  static async reviseAllocation(payload: AllocationReviseRequest): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/revise`, payload);
    return res.data;
  }

  // Hand the project over to a new manager.
  static async changeProjectManager(payload: ProjectManagerChangeRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/changeManager`, payload);
    return res.data;
  }

  // Clone / archive a project.
  static async cloneProject(payload: ProjectCloneRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/clone`, payload);
    return res.data;
  }

  static async archiveProject(payload: ProjectArchiveRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/archive`, payload);
    return res.data;
  }

  static async unarchiveProject(payload: ProjectArchiveRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/unarchive`, payload);
    return res.data;
  }

  // Time-boxed cover for someone on leave.
  static async temporaryCover(payload: AllocationTemporaryCoverRequest): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/temporaryCover`, payload);
    return res.data;
  }

  static async checkCapacity(payload: CapacityCheckRequest): Promise<CapacityCheckResponse> {
    const res = await api.post(`${BASE}/capacity/check`, payload);
    return res.data;
  }

  static async getCalendarCapacity(organizationId: string, weekStart: string, buCode?: string, departmentCode?: string): Promise<CapacityCheckResponse[]> {
    const res = await api.post(`${BASE}/capacity/calendar`, { organizationId, weekStart, buCode, departmentCode });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getAllocationVsActual(organizationId: string, projectHandle: string): Promise<ProjectAllocationVsActualReport> {
    const res = await api.post(`${BASE}/report/allocationVsActual`, { organizationId, projectHandle });
    return res.data;
  }

  static async getResourceUtilization(organizationId: string, startDate: string, endDate: string, department?: string): Promise<ResourceUtilizationReport> {
    const res = await api.post(`${BASE}/report/resourceUtilization`, { organizationId, startDate, endDate, department });
    return res.data;
  }

  static async getCapacityDemand(organizationId: string, startDate: string, endDate: string): Promise<CapacityDemandReport> {
    const res = await api.post(`${BASE}/report/capacityDemand`, { organizationId, startDate, endDate });
    return res.data;
  }

  static async getResourceWorkload(
    organizationId: string,
    startDate?: string,
    endDate?: string,
    underThreshold?: number,
    overThreshold?: number,
  ): Promise<ResourceWorkloadReport> {
    const res = await api.post(`${BASE}/report/resourceWorkload`, {
      organizationId,
      startDate,
      endDate,
      underThreshold: underThreshold != null ? String(underThreshold) : undefined,
      overThreshold: overThreshold != null ? String(overThreshold) : undefined,
    });
    return res.data;
  }

  static async getProjectKpis(organizationId: string): Promise<{ total: number; active: number; draft: number; onHold: number; completed: number }> {
    const res = await api.post(`${BASE}/kpis`, { organizationId });
    return res.data;
  }

  static async getResourceCalendar(
    organizationId: string,
    weekStart: string,
    buCode?: string,
    departmentCode?: string
  ): Promise<Array<{ employee: { employeeId: string; employeeName: string; department: string }; days: Array<{ date: string; allocatedHours: number; holiday: boolean; leave: boolean; capacityStatus: string }> }>> {
    const res = await api.post(`${BASE}/capacity/calendar`, { organizationId, weekStart, buCode, departmentCode });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Retrieve by Code ──────────────────────────────────────────────────────

  static async getProjectByCode(organizationId: string, projectCode: string): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/retrieveByCode`, { organizationId, projectCode });
    return res.data;
  }

  // ─── Allocation Retrieve ───────────────────────────────────────────────────

  static async getAllocation(organizationId: string, handle: string): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/retrieve`, { organizationId, handle });
    return res.data;
  }

  // ─── Client CRUD ───────────────────────────────────────────────────────────

  static async createClient(payload: ClientRequest): Promise<ClientResponse> {
    const res = await api.post(`${BASE}/client/create`, payload);
    return res.data;
  }

  static async getClient(organizationId: string, code: string): Promise<ClientResponse> {
    const res = await api.post(`${BASE}/client/retrieve`, { organizationId, code });
    return res.data;
  }

  static async listClients(organizationId: string): Promise<ClientResponse[]> {
    const res = await api.post(`${BASE}/client/list`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async updateClient(payload: ClientUpdateRequest): Promise<ClientResponse> {
    const res = await api.post(`${BASE}/client/update`, payload);
    return res.data;
  }

  static async deleteClient(organizationId: string, id: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/client/delete`, { organizationId, id, deletedBy });
  }

  // ─── Tasks (S2) ────────────────────────────────────────────────────────────
  // NOTE: request shapes for remove/list confirmed against BE ProjectTask DTOs.

  static async createTask(payload: ProjectTaskRequest): Promise<ProjectTaskResponse> {
    const res = await api.post(`${BASE}/task/create`, payload);
    return res.data;
  }

  static async updateTask(payload: ProjectTaskRequest): Promise<ProjectTaskResponse> {
    const res = await api.post(`${BASE}/task/update`, payload);
    return res.data;
  }

  static async removeTask(taskHandle: string, removedBy: string): Promise<void> {
    await api.post(`${BASE}/task/remove`, { taskHandle, removedBy });
  }

  static async listTasksByProject(organizationId: string, projectHandle: string): Promise<ProjectTaskResponse[]> {
    const res = await api.post(`${BASE}/task/listByProject`, { organizationId, projectHandle });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async listDefaultTasks(organizationId: string): Promise<ProjectTaskResponse[]> {
    const res = await api.post(`${BASE}/task/listDefaults`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async importTasksFromProject(payload: ImportTasksRequest): Promise<ProjectTaskResponse[]> {
    const res = await api.post(`${BASE}/task/importFromProject`, payload);
    return Array.isArray(res.data) ? res.data : [];
  }

  static async updateTaskStatus(payload: TaskStatusUpdateRequest): Promise<ProjectTaskResponse> {
    const res = await api.post(`${BASE}/task/updateStatus`, payload);
    return res.data;
  }

  static async moveTaskToProject(payload: TaskMoveRequest): Promise<ProjectTaskResponse> {
    const res = await api.post(`${BASE}/task/moveToProject`, payload);
    return res.data;
  }

  static async mergeTasks(payload: TaskMergeRequest): Promise<ProjectTaskResponse> {
    const res = await api.post(`${BASE}/task/merge`, payload);
    return res.data;
  }

  // Extend an over-running task (rolls into project estimate/timeline, records history).
  static async extendTask(payload: TaskExtensionRequest): Promise<ProjectTaskResponse> {
    const res = await api.post(`${BASE}/task/extend`, payload);
    return res.data;
  }

  // ─── History / audit ─────────────────────────────────────────────────────────

  static async getProjectHistory(organizationId: string, projectHandle: string): Promise<ProjectAuditResponse[]> {
    const res = await api.post(`${BASE}/history`, { organizationId, projectHandle });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Billing ───────────────────────────────────────────────────────────────

  static async configureBilling(payload: BillingConfigRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/billing/configure`, payload);
    return res.data;
  }

  static async getBillingSummary(organizationId: string, projectHandle: string, startDate: string, endDate: string): Promise<BillingSummaryResponse> {
    const res = await api.post(`${BASE}/billing/summary`, { organizationId, projectHandle, startDate, endDate });
    return res.data;
  }
}
