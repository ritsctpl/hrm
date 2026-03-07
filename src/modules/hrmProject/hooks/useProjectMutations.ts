'use client';
// src/modules/hrmProject/hooks/useProjectMutations.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { useHrmProjectStore } from '../stores/hrmProjectStore';
import { HrmProjectService } from '../services/hrmProjectService';
import { useProjectData } from './useProjectData';
import type { ProjectFormValues, AllocationFormValues } from '../types/ui.types';

export function useProjectMutations() {
  const store = useHrmProjectStore();
  const { loadProjects, loadAllocations, loadPendingAllocations } = useProjectData();
  const { site } = parseCookies();

  const createProject = useCallback(async (values: ProjectFormValues, createdBy: string) => {
    store.setSavingProject(true);
    try {
      await HrmProjectService.createProject({
        site,
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
    } catch (error) {
      message.error('Failed to create project');
      console.error(error);
    } finally {
      store.setSavingProject(false);
    }
  }, [site, loadProjects]);

  const updateProject = useCallback(async (handle: string, values: Partial<ProjectFormValues>, modifiedBy: string) => {
    store.setSavingProject(true);
    try {
      await HrmProjectService.updateProject(handle, { ...values, site, createdBy: modifiedBy });
      message.success('Project updated successfully');
      store.closeProjectForm();
      await loadProjects();
    } catch (error) {
      message.error('Failed to update project');
      console.error(error);
    } finally {
      store.setSavingProject(false);
    }
  }, [site, loadProjects]);

  const updateProjectStatus = useCallback(async (
    handle: string,
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
    reason: string,
    modifiedBy: string
  ) => {
    try {
      await HrmProjectService.updateProjectStatus({ site, handle, status, reason, modifiedBy });
      message.success('Project status updated');
      await loadProjects();
    } catch (error) {
      message.error('Failed to update project status');
      console.error(error);
    }
  }, [site, loadProjects]);

  const createAllocation = useCallback(async (
    projectHandle: string,
    values: AllocationFormValues,
    createdBy: string
  ) => {
    store.setSavingAllocation(true);
    try {
      await HrmProjectService.createAllocation({
        site,
        projectHandle,
        employeeId: values.employeeId,
        hoursPerDay: values.hoursPerDay,
        startDate: values.startDate,
        endDate: values.endDate,
        recurring: values.recurring,
        recurrencePattern: values.recurrencePattern,
        recurrenceDays: values.recurrenceDays,
        createdBy,
      });
      message.success('Allocation submitted for approval');
      store.closeAllocationForm();
      await loadAllocations(projectHandle);
    } catch (error) {
      message.error('Failed to create allocation');
      console.error(error);
    } finally {
      store.setSavingAllocation(false);
    }
  }, [site, loadAllocations]);

  const approveAllocation = useCallback(async (
    allocationHandle: string,
    action: 'APPROVED' | 'REJECTED',
    remarks: string,
    approverEmployeeId: string
  ) => {
    store.setApprovingAllocation(true);
    try {
      await HrmProjectService.approveOrRejectAllocation({
        site,
        allocationHandle,
        action,
        remarks,
        approverEmployeeId,
      });
      message.success(`Allocation ${action.toLowerCase()}`);
      await loadPendingAllocations();
    } catch (error) {
      message.error('Failed to process approval');
      console.error(error);
    } finally {
      store.setApprovingAllocation(false);
    }
  }, [site, loadPendingAllocations]);

  const updateMilestoneStatus = useCallback(async (
    projectHandle: string,
    milestoneId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED',
    modifiedBy: string
  ) => {
    try {
      await HrmProjectService.updateMilestoneStatus({ site, projectHandle, milestoneId, status, modifiedBy });
      message.success('Milestone status updated');
    } catch (error) {
      message.error('Failed to update milestone status');
      console.error(error);
    }
  }, [site]);

  return {
    createProject,
    updateProject,
    updateProjectStatus,
    createAllocation,
    approveAllocation,
    updateMilestoneStatus,
  };
}
