'use client';
// src/modules/hrmProject/hooks/useProjectMutations.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../stores/hrmProjectStore';
import { HrmProjectService } from '../services/hrmProjectService';
import { useProjectData } from './useProjectData';
import type { ProjectFormValues, AllocationFormValues, TaskFormValues } from '../types/ui.types';

function extractBackendMsg(error: any, fallback: string): string {
  return (
    error?.response?.data?.message_details?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.response ||
    error?.response?.data?.error ||
    error?.response?.data?.errorCode ||
    error?.message ||
    fallback
  );
}

export function useProjectMutations() {
  const store = useHrmProjectStore();
  const { loadProjects, loadAllocations, loadPendingAllocations, loadProjectDetail } = useProjectData();
  const organizationId = getOrganizationId();

  const createProject = useCallback(async (values: ProjectFormValues, createdBy: string) => {
    store.setSavingProject(true);
    try {
      await HrmProjectService.createProject({ organizationId,
        projectName: values.projectName,
        projectType: values.projectType,
        status: values.status,
        baseProjectHandle: values.baseProjectHandle,
        clientName: values.clientName,
        clientId: values.clientId,
        currency: values.currency,
        buCode: values.buCode,
        departmentCode: values.departmentCode,
        projectManagerId: values.projectManagerId,
        estimateHours: values.estimateHours,
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description,
        milestones: values.milestones.map((m) => ({
          milestoneName: m.milestoneName,
          targetDate: m.targetDate,
          description: m.description,
        })),
        createdBy,
      });
      message.success('Project created successfully');
      store.closeProjectForm();
      await loadProjects();
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to create project'));
      console.error(error);
    } finally {
      store.setSavingProject(false);
    }
  }, [organizationId, loadProjects]);

  const updateProject = useCallback(async (handle: string, values: Partial<ProjectFormValues>, modifiedBy: string) => {
    store.setSavingProject(true);
    try {
      await HrmProjectService.updateProject(handle, { ...values, organizationId, modifiedBy } as any);
      message.success('Project updated successfully');
      store.closeProjectForm();
      await loadProjects();
      // Refresh detail if viewing same project
      if (store.selectedProject?.handle === handle) {
        await loadProjectDetail(handle);
      }
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update project'));
      console.error(error);
    } finally {
      store.setSavingProject(false);
    }
  }, [organizationId, loadProjects]);

  const deleteProject = useCallback(async (handle: string) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.deleteProject(organizationId, handle, userId);
      message.success('Project deleted');
      store.removeProjectFromList(handle);
      await loadProjects();
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Cannot delete project (may have approved allocations)'));
      console.error(error);
    }
  }, [organizationId, loadProjects]);

  const updateProjectStatus = useCallback(async (
    handle: string,
    status: 'INITIATED' | 'DRAFT' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
    reason: string,
    modifiedBy: string
  ) => {
    try {
      await HrmProjectService.updateProjectStatus({ organizationId, handle, status, reason, modifiedBy });
      message.success('Project status updated');
      await loadProjects();
      // Refresh the open detail panel so the badge + available actions update immediately
      if (store.selectedProject?.handle === handle) {
        await loadProjectDetail(handle);
      }
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update project status'));
      console.error(error);
    }
  }, [organizationId, loadProjects, loadProjectDetail]);

  // Creates one allocation per assignment (task) — assign a user to several tasks at once.
  // assignments = [{ taskId: null }] for a single project-level allocation.
  const createAllocations = useCallback(async (
    projectHandle: string,
    values: AllocationFormValues,
    assignments: Array<{ taskId: string | null; billableRate?: number | null }>,
    createdBy: string
  ) => {
    store.setSavingAllocation(true);
    let ok = 0;
    let fail = 0;
    let lastErr = '';
    for (const a of assignments) {
      try {
        await HrmProjectService.createAllocation({
          organizationId,
          projectHandle,
          employeeId: values.employeeId,
          employeeName: values.employeeName,
          taskId: a.taskId,
          billableRate: a.billableRate ?? values.billableRate,
          costRate: values.costRate,
          role: values.role,
          bookingType: values.bookingType,
          hoursPerDay: values.hoursPerDay,
          startDate: values.startDate,
          endDate: values.endDate,
          recurring: values.recurring,
          recurrencePattern: values.recurring ? values.recurrencePattern : null,
          recurrenceDays: values.recurring ? values.recurrenceDays : null,
          createdBy,
        });
        ok++;
      } catch (error: any) {
        fail++;
        lastErr = extractBackendMsg(error, 'Failed to create allocation');
        console.error(error);
      }
    }
    if (ok) message.success(`${ok} allocation${ok > 1 ? 's' : ''} created`);
    if (fail) message.error(`${fail} allocation${fail > 1 ? 's' : ''} failed${lastErr ? `: ${lastErr}` : ''}`);
    if (ok) {
      store.closeAllocationForm();
      await loadAllocations(projectHandle);
    }
    store.setSavingAllocation(false);
  }, [organizationId, loadAllocations]);

  const submitAllocation = useCallback(async (handle: string, projectHandle: string) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.submitAllocation(organizationId, handle, userId);
      message.success('Allocation submitted for approval');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to submit allocation'));
      console.error(error);
    }
  }, [organizationId, loadAllocations]);

  const cancelAllocation = useCallback(async (handle: string, projectHandle: string) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.cancelAllocation(organizationId, handle, userId);
      message.success('Allocation cancelled');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to cancel allocation'));
      console.error(error);
    }
  }, [organizationId, loadAllocations]);

  const approveAllocation = useCallback(async (
    allocationHandle: string,
    action: 'APPROVED' | 'REJECTED',
    remarks: string,
    approvedBy: string,
  ) => {
    store.setApprovingAllocation(true);
    try {
      await HrmProjectService.approveOrRejectAllocation({
        organizationId,
        allocationHandle,
        action,
        approverEmployeeId: approvedBy,
        remarks,
      });
      message.success(`Allocation ${action.toLowerCase()}`);
      await loadPendingAllocations();
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to process approval'));
      console.error(error);
    } finally {
      store.setApprovingAllocation(false);
    }
  }, [organizationId, loadPendingAllocations]);

  // Approve/reject several allocations in one go (e.g. a membership + its task allocations)
  const approveAllocations = useCallback(async (
    handles: string[],
    action: 'APPROVED' | 'REJECTED',
    remarks: string,
    approvedBy: string,
  ) => {
    if (handles.length === 0) return;
    store.setApprovingAllocation(true);
    let ok = 0;
    let fail = 0;
    let lastErr = '';
    for (const allocationHandle of handles) {
      try {
        await HrmProjectService.approveOrRejectAllocation({
          organizationId,
          allocationHandle,
          action,
          approverEmployeeId: approvedBy,
          remarks,
        });
        ok++;
      } catch (error: any) {
        fail++;
        lastErr = extractBackendMsg(error, 'Failed to process approval');
        console.error(error);
      }
    }
    if (ok) message.success(`${ok} allocation${ok > 1 ? 's' : ''} ${action.toLowerCase()}`);
    if (fail) message.error(`${fail} failed${lastErr ? `: ${lastErr}` : ''}`);
    await loadPendingAllocations();
    store.setApprovingAllocation(false);
  }, [organizationId, loadPendingAllocations]);

  const addMilestone = useCallback(async (
    projectHandle: string,
    milestone: { milestoneName: string; targetDate: string; description?: string }
  ) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.addMilestone(projectHandle, milestone, userId);
      message.success('Milestone added');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to add milestone'));
      console.error(error);
    }
  }, [loadProjectDetail]);

  const updateMilestone = useCallback(async (
    projectHandle: string,
    milestoneId: string,
    values: { milestoneName: string; targetDate: string; description?: string }
  ) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.updateMilestone({ organizationId, projectHandle, milestoneId, ...values, modifiedBy: userId });
      message.success('Milestone updated');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update milestone'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail]);

  const removeMilestone = useCallback(async (projectHandle: string, milestoneId: string) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.removeMilestone(projectHandle, milestoneId, userId);
      message.success('Milestone removed');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to remove milestone'));
      console.error(error);
    }
  }, [loadProjectDetail]);

  const updateMilestoneStatus = useCallback(async (
    projectHandle: string,
    milestoneId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED',
    modifiedBy: string
  ) => {
    try {
      await HrmProjectService.updateMilestoneStatus({ organizationId, projectHandle, milestoneId, status, modifiedBy });
      message.success('Milestone status updated');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update milestone status'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail]);

  const createTask = useCallback(async (projectHandle: string, values: TaskFormValues) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.createTask({ organizationId, projectHandle, createdBy: userId, ...values });
      message.success('Task added');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to add task'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail]);

  const updateTask = useCallback(async (projectHandle: string, handle: string, values: TaskFormValues) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.updateTask({ organizationId, projectHandle, handle, modifiedBy: userId, ...values });
      message.success('Task updated');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update task'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail]);

  const removeTask = useCallback(async (projectHandle: string, taskHandle: string) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.removeTask(taskHandle, userId);
      message.success('Task removed');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to remove task'));
      console.error(error);
    }
  }, [loadProjectDetail]);

  const importTasks = useCallback(async (targetProjectHandle: string, sourceProjectHandle: string, taskHandles?: string[]) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    try {
      await HrmProjectService.importTasksFromProject({ organizationId, targetProjectHandle, sourceProjectHandle, taskHandles, createdBy: userId });
      message.success('Tasks imported');
      await loadProjectDetail(targetProjectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to import tasks'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail]);

  return {
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    createAllocations,
    createTask,
    updateTask,
    removeTask,
    importTasks,
    submitAllocation,
    cancelAllocation,
    approveAllocation,
    approveAllocations,
    addMilestone,
    updateMilestone,
    removeMilestone,
    updateMilestoneStatus,
  };
}
