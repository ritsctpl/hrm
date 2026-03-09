'use client';
// src/modules/hrmProject/hooks/useProjectData.ts
import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { useHrmProjectStore } from '../stores/hrmProjectStore';
import { HrmProjectService } from '../services/hrmProjectService';
import type { Project, ResourceAllocation } from '../types/domain.types';
import type {
  ProjectResponse,
  AllocationResponse,
} from '../types/api.types';

function mapProjectResponse(r: ProjectResponse): Project {
  return {
    handle: r.handle,
    site: r.site,
    projectCode: r.projectCode,
    projectName: r.projectName,
    description: r.description,
    projectType: r.projectType as Project['projectType'],
    buCode: r.buCode,
    departmentCode: r.departmentCode,
    clientName: r.clientName,
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
    utilizationPercentage: r.utilizationPercentage,
    scheduleVariance: r.scheduleVariance,
    active: r.active,
    createdDateTime: r.createdDateTime,
    modifiedDateTime: r.modifiedDateTime,
  };
}

function mapAllocationResponse(r: AllocationResponse): ResourceAllocation {
  return {
    handle: r.handle,
    site: r.site,
    projectHandle: r.projectHandle,
    projectCode: r.projectCode,
    projectName: r.projectName,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
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
  const { site } = parseCookies();

  const loadProjects = useCallback(async () => {
    store.setLoadingProjects(true);
    try {
      const [projectsResult, kpisResult] = await Promise.allSettled([
        HrmProjectService.listProjects(
          site,
          store.filterBU || undefined,
          store.filterDept || undefined,
          store.filterStatus || undefined,
          store.filterPM || undefined
        ),
        HrmProjectService.getProjectKpis(site),
      ]);

      if (projectsResult.status === "fulfilled") {
        const projects = projectsResult.value;
        store.setProjects(
          projects.map((p) => ({
          handle: p.handle,
          site,
          projectCode: p.projectCode,
          projectName: p.projectName,
          projectType: p.projectType as Project['projectType'],
          buCode: p.buCode,
          status: p.status as Project['status'],
          projectManagerId: '',
          projectManagerName: p.projectManagerName,
          milestones: [],
          attachments: [],
          estimateHours: p.estimateHours,
          totalAllocatedHours: p.totalAllocatedHours,
          totalActualHours: p.totalActualHours,
          utilizationPercentage: p.utilizationPercentage,
          scheduleVariance: 0,
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
  }, [site, store.filterBU, store.filterDept, store.filterStatus, store.filterPM]);

  const loadProjectDetail = useCallback(async (handle: string) => {
    try {
      const data = await HrmProjectService.getProject(site, handle);
      const project = mapProjectResponse(data);
      store.setSelectedProject(project);
      // Update in list too
      store.setProjects(
        store.projects.map((p) => (p.handle === handle ? { ...p, ...project } : p))
      );
    } catch (error) {
      console.error('Failed to load project detail:', error);
    }
  }, [site, store.projects]);

  const loadAllocations = useCallback(async (projectHandle: string) => {
    store.setLoadingAllocations(true);
    try {
      const data = await HrmProjectService.getAllocationsByProject(site, projectHandle);
      store.setProjectAllocations(data.map(mapAllocationResponse));
    } catch (error) {
      console.error('Failed to load allocations:', error);
    } finally {
      store.setLoadingAllocations(false);
    }
  }, [site]);

  const loadPendingAllocations = useCallback(async () => {
    store.setLoadingApprovals(true);
    try {
      const data = await HrmProjectService.getPendingApprovals(site);
      store.setPendingAllocations(data.map(mapAllocationResponse));
    } catch (error) {
      console.error('Failed to load pending allocations:', error);
    } finally {
      store.setLoadingApprovals(false);
    }
  }, [site]);

  const checkCapacity = useCallback(async (employeeId: string, startDate: string, endDate: string) => {
    store.setLoadingCapacity(true);
    try {
      const data = await HrmProjectService.checkCapacity({ site, employeeId, startDate, endDate });
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
  }, [site]);

  const loadCalendar = useCallback(async () => {
    store.setLoadingCalendar(true);
    try {
      const data = await HrmProjectService.getResourceCalendar(
        site,
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
  }, [site, store.calendarWeekStart, store.calendarBU, store.calendarDept]);

  return {
    loadProjects,
    loadProjectDetail,
    loadAllocations,
    loadPendingAllocations,
    checkCapacity,
    loadCalendar,
  };
}
