import api from '@/services/api';
import type {
  ProjectRequest,
  ProjectResponse,
  ProjectListResponse,
  ProjectStatusUpdateRequest,
  MilestoneStatusUpdateRequest,
  AllocationRequest,
  AllocationResponse,
  AllocationApprovalRequest,
  CapacityCheckRequest,
  CapacityCheckResponse,
  ProjectAllocationVsActualReport,
  ResourceUtilizationReport,
  CapacityDemandReport,
  ClientRequest,
  ClientResponse,
  BillingConfigRequest,
  BillingSummaryResponse,
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
    projectHandle: string,
    milestone: { milestoneName: string; targetDate: string; description?: string },
    createdBy: string
  ): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/milestone/add`, { projectHandle, milestone, createdBy });
    return res.data;
  }

  static async updateMilestoneStatus(payload: MilestoneStatusUpdateRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/milestone/updateStatus`, payload);
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

  static async getPendingApprovals(organizationId: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/allocation/pending`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async submitAllocation(organizationId: string, handle: string, submittedBy: string): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/submit`, { organizationId, handle, submittedBy });
    return res.data;
  }

  static async approveOrRejectAllocation(payload: AllocationApprovalRequest): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/approve`, payload);
    return res.data;
  }

  static async cancelAllocation(organizationId: string, handle: string, cancelledBy: string): Promise<void> {
    await api.post(`${BASE}/allocation/cancel`, { organizationId, handle, cancelledBy });
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

  static async getProjectKpis(organizationId: string): Promise<{ total: number; active: number; draft: number; onHold: number; completed: number }> {
    const res = await api.post(`${BASE}/kpis`, { organizationId });
    return res.data;
  }

  static async getPendingAllocations(organizationId: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/allocation/pending`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
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

  static async updateClient(handle: string, payload: Partial<ClientRequest>): Promise<ClientResponse> {
    const res = await api.post(`${BASE}/client/update`, { handle, ...payload });
    return res.data;
  }

  static async deleteClient(organizationId: string, handle: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/client/delete`, { organizationId, handle, deletedBy });
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
