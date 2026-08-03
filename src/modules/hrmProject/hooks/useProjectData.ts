'use client';
// src/modules/hrmProject/hooks/useProjectData.ts
import { useCallback } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { useHrmProjectStore } from '../stores/hrmProjectStore';
import { HrmProjectService } from '../services/hrmProjectService';
import type { Project, ResourceAllocation, ProjectTask } from '../types/domain.types';
import type {
  ProjectResponse,
  AllocationResponse,
} from '../types/api.types';

function mapProjectResponse(r: ProjectResponse): Project {
  return {
    handle: r.handle,
    organizationId: r.organizationId,
    projectCode: r.projectCode,
    projectName: r.projectName,
    description: r.description,
    projectType: r.projectType as Project['projectType'],
    baseProjectHandle: r.baseProjectHandle,
    buCode: r.buCode,
    departmentCode: r.departmentCode,
    clientName: r.clientName,
    clientId: r.clientId,
    billingType: r.billingType,
    hourlyRate: r.hourlyRate,
    currency: r.currency,
    estimateHours: r.estimateHours,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status as Project['status'],
    projectManagerId: r.projectManagerId,
    projectManagerName: r.projectManagerName,
    milestones: r.milestones.map((m) => ({
      milestoneId: m.milestoneId,
      milestoneName: m.milestoneName,
      targetDate: m.targetDate,
      status: m.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED',
      description: m.description,
    })),
    tasks: (r.tasks ?? []).map((t) => ({
      handle: t.handle,
      projectHandle: t.projectHandle,
      taskName: t.taskName,
      description: t.description,
      estimatedHours: t.estimatedHours,
      billableRate: t.billableRate,
      billable: t.billable,
      isDefault: t.isDefault,
      actualHours: t.actualHours,
      status: (t.status as ProjectTask['status']) ?? 'NOT_STARTED',
      milestoneId: t.milestoneId,
      extensions: t.extensions,
      active: t.active,
    })),
    attachments: r.attachments.map((a) => ({
      attachmentId: a.attachmentId,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileType: a.fileType,
      fileSizeBytes: a.fileSizeBytes,
      uploadedBy: a.uploadedBy,
      uploadedAt: a.uploadedAt,
    })),
    totalAllocatedHours: r.totalAllocatedHours,
    totalActualHours: r.totalActualHours,
    committedWorkHours: r.committedWorkHours,
    utilizationPercentage: r.utilizationPercentage,
    scheduleVariance: r.scheduleVariance,
    archived: r.archived,
    active: r.active,
    createdDateTime: r.createdDateTime,
    modifiedDateTime: r.modifiedDateTime,
  };
}

function mapAllocationResponse(r: AllocationResponse): ResourceAllocation {
  return {
    handle: r.handle,
    organizationId: r.organizationId,
    projectHandle: r.projectHandle,
    projectCode: r.projectCode,
    projectName: r.projectName,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    taskId: r.taskId,
    taskName: r.taskName,
    billableRate: r.billableRate,
    costRate: r.costRate,
    hoursPerDay: r.hoursPerDay,
    startDate: r.startDate,
    endDate: r.endDate,
    bookingType: r.bookingType,
    recurring: r.recurring,
    recurrencePattern: r.recurrencePattern as ResourceAllocation['recurrencePattern'],
    recurrenceDays: r.recurrenceDays,
    status: r.status as ResourceAllocation['status'],
    approvalRemarks: r.approvalRemarks,
    totalAllocatedHours: r.totalAllocatedHours,
    allocationDays: r.allocationDays,
    active: r.active,
    createdDateTime: r.createdDateTime,
    modifiedDateTime: r.modifiedDateTime,
  };
}

export function useProjectData() {
  const store = useHrmProjectStore();
  const organizationId = getOrganizationId();
  const { employeeCode } = useEmployeeIdentity();

  const loadProjects = useCallback(async () => {
    store.setLoadingProjects(true);
    try {
      const [projectsResult, kpisResult] = await Promise.allSettled([
        HrmProjectService.listProjects(
          organizationId,
          store.filterBU || undefined,
          store.filterDept || undefined,
          store.filterStatus || undefined,
          store.filterPM || undefined
        ),
        HrmProjectService.getProjectKpis(organizationId),
      ]);

      if (projectsResult.status === "fulfilled") {
        const projects = projectsResult.value;
        store.setProjects(
          projects.map((p) => ({
          handle: p.handle,
          organizationId,
          projectCode: p.projectCode,
          projectName: p.projectName,
          projectType: p.projectType as Project['projectType'],
          baseProjectHandle: p.baseProjectHandle,
          buCode: p.buCode,
          clientName: p.clientName,
          status: p.status as Project['status'],
          // Was hardcoded to '' — which silently disabled every
          // "am I the project manager?" check on a project opened from the
          // list, because that is the only way a project gets opened.
          projectManagerId: p.projectManagerId ?? '',
          projectManagerName: p.projectManagerName,
          milestones: [],
          tasks: [],
          attachments: [],
          estimateHours: p.estimateHours,
          totalAllocatedHours: p.totalAllocatedHours,
          totalActualHours: p.totalActualHours,
          committedWorkHours: p.committedWorkHours,
          utilizationPercentage: p.utilizationPercentage,
          scheduleVariance: 0,
          archived: p.archived,
          startDate: p.startDate,
          endDate: p.endDate,
          active: 1,
          createdDateTime: '',
          modifiedDateTime: '',
        }))
        );
      } else {
        console.error("Failed to load projects:", projectsResult.reason);
        store.setProjects([]);
      }

      if (kpisResult.status === "fulfilled") {
        const kpis = kpisResult.value;
        store.setProjectKpis({
          total: kpis.total,
          active: kpis.active,
          draft: kpis.draft,
          onHold: kpis.onHold,
          completed: kpis.completed,
        });
      } else {
        console.error("Failed to load project KPIs:", kpisResult.reason);
        store.setProjectKpis({
          total: 0,
          active: 0,
          draft: 0,
          onHold: 0,
          completed: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      store.setLoadingProjects(false);
    }
  }, [organizationId, store.filterBU, store.filterDept, store.filterStatus, store.filterPM]);

  const loadProjectDetail = useCallback(async (handle: string) => {
    try {
      const data = await HrmProjectService.getProject(organizationId, handle);
      const project = mapProjectResponse(data);
      store.setSelectedProject(project);
      // Update in list too
      store.setProjects(
        store.projects.map((p) => (p.handle === handle ? { ...p, ...project } : p))
      );
    } catch (error) {
      console.error('Failed to load project detail:', error);
    }
  }, [organizationId, store.projects]);

  const loadAllocations = useCallback(async (projectHandle: string) => {
    store.setLoadingAllocations(true);
    try {
      const data = await HrmProjectService.getAllocationsByProject(organizationId, projectHandle);
      store.setProjectAllocations(data.map(mapAllocationResponse));
    } catch (error) {
      console.error('Failed to load allocations:', error);
    } finally {
      store.setLoadingAllocations(false);
    }
  }, [organizationId]);

  const loadPendingAllocations = useCallback(async () => {
    store.setLoadingApprovals(true);
    try {
      // Filter to the logged-in manager's projects (BE uses managerId = employeeId)
      const data = await HrmProjectService.getPendingApprovals(organizationId, employeeCode || undefined);
      store.setPendingAllocations(data.map(mapAllocationResponse));
    } catch (error) {
      console.error('Failed to load pending allocations:', error);
    } finally {
      store.setLoadingApprovals(false);
    }
  }, [organizationId, employeeCode]);

  const checkCapacity = useCallback(async (
    employeeId: string,
    startDate: string,
    endDate: string,
    requestedHoursPerDay?: number,
  ) => {
    store.setLoadingCapacity(true);
    try {
      const data = await HrmProjectService.checkCapacity({
        organizationId,
        employeeId,
        startDate,
        endDate,
        requestedHoursPerDay,
      });
      store.setCapacityCheck({
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        dailyCapacities: data.dailyCapacities.map((d) => ({
          ...d,
          capacityStatus: d.capacityStatus as 'GREEN' | 'YELLOW' | 'RED',
        })),
      });
    } catch (error) {
      console.error('Failed to check capacity:', error);
    } finally {
      store.setLoadingCapacity(false);
    }
  }, [organizationId]);

  const loadCalendar = useCallback(async () => {
    store.setLoadingCalendar(true);
    try {
      const data = await HrmProjectService.getResourceCalendar(
        organizationId,
        store.calendarWeekStart,
        store.calendarBU || undefined,
        store.calendarDept || undefined
      ) as Array<{ employee: { employeeId: string; employeeName: string; department: string }; days: Array<{ date: string; allocatedHours: number; holiday: boolean; leave: boolean; capacityStatus: string }> }>;
      store.setCalendarData(
        data.map((r) => ({
          employeeId: r.employee.employeeId,
          employeeName: r.employee.employeeName,
          department: r.employee.department,
          days: r.days.map((d) => ({
            date: d.date,
            allocatedHours: d.allocatedHours,
            holiday: d.holiday,
            leave: d.leave,
            capacityStatus: d.capacityStatus as 'GREEN' | 'YELLOW' | 'RED' | 'GREY',
          })),
        }))
      );
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      store.setLoadingCalendar(false);
    }
  }, [organizationId, store.calendarWeekStart, store.calendarBU, store.calendarDept]);

  return {
    loadProjects,
    loadProjectDetail,
    loadAllocations,
    loadPendingAllocations,
    checkCapacity,
    loadCalendar,
  };
}
