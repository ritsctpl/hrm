'use client';
// src/modules/hrmProject/hooks/useProjectMutations.ts
import { useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../stores/hrmProjectStore';
import { HrmProjectService } from '../services/hrmProjectService';
import { useProjectData } from './useProjectData';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
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
  const { loadProjects, loadAllocations, loadProjectDetail } = useProjectData();
  const organizationId = getOrganizationId();
  // Backend actor fields (createdBy/modifiedBy/deletedBy/...) are compared against
  // employeeCode (e.g. project.projectManagerId), never the login string — sending the
  // raw cookie here is what caused PRJ_038 to fire for the actual project manager (the
  // login's email/username never matches the stored employeeCode). See
  // useEmployeeIdentity's contract doc for the full rationale.
  const { employeeCode } = useEmployeeIdentity();

  const resolveActor = useCallback(
    () => employeeCode || parseCookies().rl_user_id || parseCookies().user || 'system',
    [employeeCode]
  );

  // Business rule: a COMPLETED project whose end date is pushed out is no longer finished —
  // reopen it to IN_PROGRESS so work/timesheets can resume. `existing` must be a snapshot taken
  // BEFORE the write, since the store picks up the new end date once the detail reloads.
  const reopenIfExtended = useCallback(async (
    existing: { handle: string; status: string; endDate?: string } | null | undefined,
    newEndDate: string | undefined,
    actor: string,
  ) => {
    if (!existing || existing.status !== 'COMPLETED' || !newEndDate) return;
    // Only reopen when the end date actually moves later than the recorded one.
    if (existing.endDate && !dayjs(newEndDate).isAfter(dayjs(existing.endDate), 'day')) return;
    try {
      await HrmProjectService.updateProjectStatus({
        organizationId,
        handle: existing.handle,
        status: 'IN_PROGRESS',
        reason: 'Auto-reopened: project end date extended',
        modifiedBy: actor,
      });
      message.info('Project re-opened to In Progress — end date was extended');
    } catch (error) {
      console.error('Failed to auto-reopen extended project', error);
    }
  }, [organizationId]);

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
    // Snapshot status + end date before the write — needed to detect a completed-project extension.
    const existing = store.selectedProject?.handle === handle
      ? store.selectedProject
      : store.projects.find((p) => p.handle === handle);
    try {
      await HrmProjectService.updateProject(handle, { ...values, organizationId, modifiedBy } as any);
      message.success('Project updated successfully');
      await reopenIfExtended(existing, (values as any).endDate, modifiedBy);
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
  }, [organizationId, loadProjects, reopenIfExtended]);

  const deleteProject = useCallback(async (handle: string) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.deleteProject(organizationId, handle, userId);
      message.success('Project deleted');
      store.removeProjectFromList(handle);
      await loadProjects();
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Cannot delete project (may have approved allocations)'));
      console.error(error);
    }
  }, [organizationId, loadProjects, resolveActor]);

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
    assignments: Array<{ taskId: string | null; billableRate?: number | null; hoursPerDay?: number }>,
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
          hoursPerDay: a.hoursPerDay ?? values.hoursPerDay,
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

  const cancelAllocation = useCallback(async (handle: string, projectHandle: string) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.cancelAllocation(organizationId, handle, userId);
      message.success('Allocation cancelled');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to cancel allocation'));
      console.error(error);
    }
  }, [organizationId, loadAllocations, resolveActor]);

  // Move one allocation (task or membership) to another employee.
  const reassignAllocation = useCallback(async (
    projectHandle: string,
    payload: { allocationHandle: string; newEmployeeId: string; newEmployeeName?: string; effectiveDate?: string; remarks?: string },
    actor: string,
  ) => {
    store.setSavingAllocation(true);
    try {
      await HrmProjectService.reassignAllocation({ organizationId, reassignedBy: actor, ...payload });
      message.success('Allocation reassigned');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to reassign allocation'));
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
  }, [organizationId, loadAllocations]);

  // Replace a project member — moves membership + all their task allocations.
  const replaceMember = useCallback(async (
    projectHandle: string,
    payload: { outgoingEmployeeId: string; incomingEmployeeId: string; incomingEmployeeName?: string; effectiveDate?: string; remarks?: string },
    actor: string,
  ) => {
    store.setSavingAllocation(true);
    try {
      const moved = await HrmProjectService.replaceMember({ organizationId, projectHandle, replacedBy: actor, ...payload });
      message.success(`Member replaced — ${moved.length} allocation${moved.length === 1 ? '' : 's'} moved`);
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to replace member'));
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
  }, [organizationId, loadAllocations]);

  // Release a member from the project (no replacement) — ends their future allocations.
  const releaseMember = useCallback(async (
    projectHandle: string,
    payload: { employeeId: string; effectiveDate?: string; remarks?: string },
    actor: string,
  ) => {
    store.setSavingAllocation(true);
    try {
      const affected = await HrmProjectService.releaseMember({ organizationId, projectHandle, releasedBy: actor, ...payload });
      message.success(`Member released — ${affected.length} allocation${affected.length === 1 ? '' : 's'} ended`);
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to release member'));
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
  }, [organizationId, loadAllocations]);

  /** Correct an allocation's hours/dates in place — takes effect immediately. */
  const updateAllocation = useCallback(async (
    projectHandle: string,
    payload: { handle: string; hoursPerDay: number; startDate: string; endDate: string; billableRate?: number | null },
    actor: string,
  ) => {
    store.setSavingAllocation(true);
    try {
      await HrmProjectService.updateAllocation({ organizationId, modifiedBy: actor, ...payload });
      message.success('Allocation updated');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update allocation'));
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
  }, [organizationId, loadAllocations]);

  /** Delete, as distinct from cancel: the row goes, rather than staying as a record. */
  const deleteAllocation = useCallback(async (
    handle: string, projectHandle: string, actor: string,
  ) => {
    store.setSavingAllocation(true);
    try {
      await HrmProjectService.deleteAllocation({ organizationId, handle, deletedBy: actor });
      message.success('Allocation deleted');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to delete allocation'));
    } finally {
      store.setSavingAllocation(false);
    }
  }, [organizationId, loadAllocations]);

  // Edit/extend an existing allocation (resets to SUBMITTED for re-approval).
  const reviseAllocation = useCallback(async (
    projectHandle: string,
    payload: { allocationHandle: string; hoursPerDay?: number; endDate?: string; billableRate?: number | null; remarks?: string },
    actor: string,
  ) => {
    store.setSavingAllocation(true);
    try {
      await HrmProjectService.reviseAllocation({ organizationId, revisedBy: actor, ...payload });
      message.success('Allocation revised');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to revise allocation'));
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
  }, [organizationId, loadAllocations]);

  // Hand the project over to a new manager.
  const changeProjectManager = useCallback(async (
    handle: string,
    payload: { newProjectManagerId: string; newProjectManagerName?: string; reason?: string },
    actor: string,
  ) => {
    store.setSavingProject(true);
    try {
      await HrmProjectService.changeProjectManager({ organizationId, handle, modifiedBy: actor, ...payload });
      message.success('Project manager changed');
      await loadProjects();
      if (store.selectedProject?.handle === handle) {
        await loadProjectDetail(handle);
      }
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to change project manager'));
      console.error(error);
    } finally {
      store.setSavingProject(false);
    }
  }, [organizationId, loadProjects, loadProjectDetail]);

  const cloneProject = useCallback(async (
    payload: { sourceProjectHandle: string; newProjectName: string; includeTasks: boolean; includeMilestones: boolean; includeAllocations: boolean },
    actor: string,
  ) => {
    store.setSavingProject(true);
    try {
      await HrmProjectService.cloneProject({ organizationId, clonedBy: actor, ...payload });
      message.success('Project cloned');
      await loadProjects();
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to clone project'));
      console.error(error);
    } finally {
      store.setSavingProject(false);
    }
  }, [organizationId, loadProjects]);

  const setProjectArchived = useCallback(async (handle: string, archived: boolean, reason: string, actor: string) => {
    try {
      if (archived) await HrmProjectService.archiveProject({ organizationId, handle, archivedBy: actor, reason });
      else await HrmProjectService.unarchiveProject({ organizationId, handle, archivedBy: actor, reason });
      message.success(archived ? 'Project archived' : 'Project unarchived');
      await loadProjects();
    } catch (error: any) {
      message.error(extractBackendMsg(error, `Failed to ${archived ? 'archive' : 'unarchive'} project`));
      console.error(error);
    }
  }, [organizationId, loadProjects]);

  const temporaryCover = useCallback(async (
    projectHandle: string,
    payload: { allocationHandle: string; coverEmployeeId: string; coverEmployeeName?: string; coverFrom: string; coverTo: string; remarks?: string },
    actor: string,
  ) => {
    store.setSavingAllocation(true);
    try {
      await HrmProjectService.temporaryCover({ organizationId, coveredBy: actor, ...payload });
      message.success('Temporary cover created');
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to create temporary cover'));
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
  }, [organizationId, loadAllocations]);

  const addMilestone = useCallback(async (
    projectHandle: string,
    milestone: { milestoneName: string; targetDate: string; description?: string }
  ) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.addMilestone(organizationId, projectHandle, milestone, userId);
      message.success('Milestone added');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to add milestone'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  const updateMilestone = useCallback(async (
    projectHandle: string,
    milestoneId: string,
    values: { milestoneName: string; targetDate: string; description?: string }
  ) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.updateMilestone({ organizationId, projectHandle, milestoneId, ...values, modifiedBy: userId });
      message.success('Milestone updated');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update milestone'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  const removeMilestone = useCallback(async (projectHandle: string, milestoneId: string) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.removeMilestone(projectHandle, milestoneId, userId);
      message.success('Milestone removed');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to remove milestone'));
      console.error(error);
    }
  }, [loadProjectDetail, resolveActor]);

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
    const userId = resolveActor();
    try {
      await HrmProjectService.createTask({ organizationId, projectHandle, createdBy: userId, ...values });
      message.success('Task added');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to add task'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  const updateTask = useCallback(async (projectHandle: string, handle: string, values: TaskFormValues) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.updateTask({ organizationId, projectHandle, handle, modifiedBy: userId, ...values });
      message.success('Task updated');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update task'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  const removeTask = useCallback(async (projectHandle: string, taskHandle: string) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.removeTask(taskHandle, userId);
      message.success('Task removed');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to remove task'));
      console.error(error);
    }
  }, [loadProjectDetail, resolveActor]);

  const updateTaskStatus = useCallback(async (
    projectHandle: string,
    taskHandle: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED',
  ) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.updateTaskStatus({ organizationId, projectHandle, taskHandle, status, modifiedBy: userId });
      message.success('Task status updated');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update task status'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  const moveTaskToProject = useCallback(async (
    projectHandle: string,
    payload: { taskHandle: string; targetProjectHandle: string; moveAllocations: boolean; remarks?: string },
  ) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.moveTaskToProject({ organizationId, movedBy: userId, ...payload });
      message.success('Task moved');
      await loadProjectDetail(projectHandle);
      if (store.selectedProject?.handle !== projectHandle) await loadProjectDetail(payload.targetProjectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to move task'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  const mergeTasks = useCallback(async (
    projectHandle: string,
    payload: { sourceTaskHandles: string[]; targetTaskHandle: string; remarks?: string },
  ) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.mergeTasks({ organizationId, projectHandle, mergedBy: userId, ...payload });
      message.success('Tasks merged');
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to merge tasks'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  const extendTask = useCallback(async (
    projectHandle: string,
    payload: { taskHandle: string; additionalHours: number; newProjectEndDate?: string; reason?: string },
    actor: string,
  ) => {
    // Snapshot before the write so we can tell a completed project was extended.
    const existing = store.selectedProject?.handle === projectHandle
      ? store.selectedProject
      : store.projects.find((p) => p.handle === projectHandle);
    try {
      await HrmProjectService.extendTask({ organizationId, projectHandle, extendedBy: actor, ...payload });
      message.success(`Task extended by ${payload.additionalHours} h`);
      await reopenIfExtended(existing, payload.newProjectEndDate, actor);
      await loadProjectDetail(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to extend task'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, reopenIfExtended]);

  const importTasks = useCallback(async (targetProjectHandle: string, sourceProjectHandle: string, taskHandles?: string[]) => {
    const userId = resolveActor();
    try {
      await HrmProjectService.importTasksFromProject({ organizationId, targetProjectHandle, sourceProjectHandle, taskHandles, createdBy: userId });
      message.success('Tasks imported');
      await loadProjectDetail(targetProjectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to import tasks'));
      console.error(error);
    }
  }, [organizationId, loadProjectDetail, resolveActor]);

  return {
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    createAllocations,
    reassignAllocation,
    replaceMember,
    releaseMember,
    updateAllocation,
    deleteAllocation,
    reviseAllocation,
    changeProjectManager,
    cloneProject,
    setProjectArchived,
    temporaryCover,
    createTask,
    updateTask,
    removeTask,
    updateTaskStatus,
    moveTaskToProject,
    mergeTasks,
    extendTask,
    importTasks,
    cancelAllocation,
    addMilestone,
    updateMilestone,
    removeMilestone,
    updateMilestoneStatus,
  };
}
