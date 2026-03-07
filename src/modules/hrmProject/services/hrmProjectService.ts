'use client';

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

  static async getProject(site: string, handle: string): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/retrieve`, { site, handle });
    return res.data;
  }

  static async listProjects(
    site: string,
    buCode?: string,
    departmentCode?: string,
    status?: string,
    projectManagerId?: string
  ): Promise<ProjectListResponse[]> {
    const res = await api.post(`${BASE}/list`, { site, buCode, departmentCode, status, projectManagerId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async updateProjectStatus(payload: ProjectStatusUpdateRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/updateStatus`, payload);
    return res.data;
  }

  static async deleteProject(site: string, handle: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/delete`, { site, handle, deletedBy });
  }

  static async addMilestone(
    projectHandle: string,
    milestone: { milestoneName: string; targetDate: string; description?: string },
    createdBy: string
  ): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/addMilestone`, { projectHandle, ...milestone, createdBy });
    return res.data;
  }

  static async updateMilestoneStatus(payload: MilestoneStatusUpdateRequest): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/updateMilestoneStatus`, payload);
    return res.data;
  }

  static async removeMilestone(projectHandle: string, milestoneId: string, removedBy: string): Promise<ProjectResponse> {
    const res = await api.post(`${BASE}/removeMilestone`, { projectHandle, milestoneId, removedBy });
    return res.data;
  }

  static async createAllocation(payload: AllocationRequest): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/create`, payload);
    return res.data;
  }

  static async getAllocationsByProject(site: string, projectHandle: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/listAllocationsByProject`, { site, projectHandle });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getAllocationsByEmployee(site: string, employeeId: string, status?: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/listAllocationsByEmployee`, { site, employeeId, status });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getPendingApprovals(site: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/pendingAllocations`, { site });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async submitAllocation(site: string, handle: string, submittedBy: string): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/submit`, { site, handle, submittedBy });
    return res.data;
  }

  static async approveOrRejectAllocation(payload: AllocationApprovalRequest): Promise<AllocationResponse> {
    const res = await api.post(`${BASE}/allocation/approve`, payload);
    return res.data;
  }

  static async cancelAllocation(site: string, handle: string, cancelledBy: string): Promise<void> {
    await api.post(`${BASE}/cancelAllocation`, { site, handle, cancelledBy });
  }

  static async checkCapacity(payload: CapacityCheckRequest): Promise<CapacityCheckResponse> {
    const res = await api.post(`${BASE}/checkCapacity`, payload);
    return res.data;
  }

  static async getCalendarCapacity(site: string, weekStart: string, buCode?: string, departmentCode?: string): Promise<CapacityCheckResponse[]> {
    const res = await api.post(`${BASE}/capacityCalendar`, { site, weekStart, buCode, departmentCode });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getAllocationVsActual(site: string, projectHandle: string): Promise<ProjectAllocationVsActualReport> {
    const res = await api.post(`${BASE}/allocationVsActualReport`, { site, projectHandle });
    return res.data;
  }

  static async getResourceUtilization(site: string, startDate: string, endDate: string, department?: string): Promise<ResourceUtilizationReport> {
    const res = await api.post(`${BASE}/resourceUtilizationReport`, { site, startDate, endDate, department });
    return res.data;
  }

  static async getCapacityDemand(site: string, startDate: string, endDate: string): Promise<CapacityDemandReport> {
    const res = await api.post(`${BASE}/capacityDemandReport`, { site, startDate, endDate });
    return res.data;
  }

  static async getProjectKpis(site: string): Promise<{ total: number; active: number; draft: number; onHold: number; completed: number }> {
    const res = await api.post(`${BASE}/kpis`, { site });
    return res.data;
  }

  static async getPendingAllocations(site: string): Promise<AllocationResponse[]> {
    const res = await api.post(`${BASE}/pendingAllocations`, { site });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getResourceCalendar(
    site: string,
    weekStart: string,
    buCode?: string,
    departmentCode?: string
  ): Promise<Array<{ employee: { employeeId: string; employeeName: string; department: string }; days: Array<{ date: string; allocatedHours: number; isHoliday: boolean; isLeave: boolean; capacityStatus: string }> }>> {
    const res = await api.post(`${BASE}/capacityCalendar`, { site, weekStart, buCode, departmentCode });
    return Array.isArray(res.data) ? res.data : [];
  }
}
