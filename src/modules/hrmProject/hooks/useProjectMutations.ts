'use client';
// src/modules/hrmProject/hooks/useProjectMutations.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../stores/hrmProjectStore';
import { HrmProjectService } from '../services/hrmProjectService';
import { useProjectData } from './useProjectData';
import type { ProjectFormValues, AllocationFormValues } from '../types/ui.types';

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
        clientName: values.clientName,
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
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
    reason: string,
    modifiedBy: string
  ) => {
    try {
      await HrmProjectService.updateProjectStatus({ organizationId, handle, status, reason, modifiedBy });
      message.success('Project status updated');
      await loadProjects();
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to update project status'));
      console.error(error);
    }
  }, [organizationId, loadProjects]);

  const createAllocation = useCallback(async (
    projectHandle: string,
    values: AllocationFormValues,
    createdBy: string
  ) => {
    store.setSavingAllocation(true);
    try {
      await HrmProjectService.createAllocation({
        organizationId,
        projectHandle,
        employeeId: values.employeeId,
        employeeName: values.employeeName,
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
      message.success('Allocation created');
      store.closeAllocationForm();
      await loadAllocations(projectHandle);
    } catch (error: any) {
      message.error(extractBackendMsg(error, 'Failed to create allocation'));
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
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
        handle: allocationHandle,
        approved: action === 'APPROVED',
        approvedBy,
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

  return {
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    createAllocation,
    submitAllocation,
    cancelAllocation,
    approveAllocation,
    addMilestone,
    removeMilestone,
    updateMilestoneStatus,
  };
}
