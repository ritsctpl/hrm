/**
 * HRM Compensation Module — Zustand Store
 */

'use client';

import { create } from 'zustand';
import { parseCookies } from 'nookies';
import { message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmCompensationService } from '../services/compensationService';
import type {
  PayComponent,
  SalaryStructure,
  EmployeeCompensationResponse,
  SalaryRevisionRow,
} from '../types/domain.types';
import type { CompensationTabKey, RevisionMode, PayComponentFormState } from '../types/ui.types';

const getUser = (): string => {
  const cookies = parseCookies();
  return cookies.rl_user_id ?? cookies.user ?? 'system';
};

interface CompensationStoreState {
  // Tab
  activeTab: CompensationTabKey;
  setActiveTab: (tab: CompensationTabKey) => void;

  // Pay Components
  payComponents: PayComponent[];
  selectedComponent: PayComponent | null;
  componentsLoading: boolean;
  componentsError: string | null;
  fetchPayComponents: () => Promise<void>;
  selectComponent: (component: PayComponent | null) => void;
  savePayComponent: (data: PayComponentFormState, handle?: string) => Promise<void>;
  deletePayComponent: (componentCode: string) => Promise<void>;

  // Salary Structures
  salaryStructures: SalaryStructure[];
  selectedStructure: SalaryStructure | null;
  structuresLoading: boolean;
  fetchSalaryStructures: () => Promise<void>;
  selectStructure: (structure: SalaryStructure | null) => void;
  saveSalaryStructure: (req: SalaryStructure) => Promise<void>;

  // Employee Compensation Assignment
  selectedEmployeeId: string | null;
  currentCompensation: EmployeeCompensationResponse | null;
  compensationHistory: EmployeeCompensationResponse[];
  previewCompensation: EmployeeCompensationResponse | null;
  assignmentLoading: boolean;
  setSelectedEmployeeId: (id: string | null) => void;
  loadEmployeeCompensation: (employeeId: string) => Promise<void>;
  fetchCompensationHistory: (employeeId: string) => Promise<void>;
  runPreview: (req: unknown) => Promise<void>;
  saveCompensationDraft: (req: unknown) => Promise<void>;
  submitCompensationForApproval: (handle: string) => Promise<void>;

  // Salary Revision
  revisionMode: RevisionMode;
  revisionRows: SalaryRevisionRow[];
  revisionLoading: boolean;
  selectedRevisionIds: string[];
  setRevisionMode: (mode: RevisionMode) => void;
  setRevisionRows: (rows: SalaryRevisionRow[]) => void;
  setSelectedRevisionIds: (ids: string[]) => void;
  submitBulkRevision: () => Promise<void>;

  // Approvals
  pendingApprovals: EmployeeCompensationResponse[];
  approvalsLoading: boolean;
  fetchPendingApprovals: () => Promise<void>;
  approveCompensation: (handle: string, remarks: string) => Promise<void>;
  rejectCompensation: (handle: string, reason: string) => Promise<void>;

  // Global
  reset: () => void;
}

export const useHrmCompensationStore = create<CompensationStoreState>((set, get) => ({
  activeTab: 'components',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ------------------------------------------------------------------
  // Pay Components
  // ------------------------------------------------------------------
  payComponents: [],
  selectedComponent: null,
  componentsLoading: false,
  componentsError: null,

  fetchPayComponents: async () => {
    set({ componentsLoading: true, componentsError: null });
    try {
      const data = await HrmCompensationService.fetchAllPayComponents(getOrganizationId());
      set({ payComponents: data });
    } catch {
      set({ componentsError: 'Failed to load pay components' });
    } finally {
      set({ componentsLoading: false });
    }
  },

  selectComponent: (component) => set({ selectedComponent: component }),

  savePayComponent: async (data, handle) => {
    const organizationId = getOrganizationId();
    const user = getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = { ...(data as any), organizationId };
    if (handle) {
      await HrmCompensationService.updatePayComponent({ ...payload, handle, modifiedBy: user });
    } else {
      await HrmCompensationService.createPayComponent({ ...payload, createdBy: user });
    }
    message.success('Pay component saved');
    await get().fetchPayComponents();
  },

  deletePayComponent: async (componentCode) => {
    await HrmCompensationService.deactivatePayComponent({
      organizationId: getOrganizationId(),
      componentCode,
      updatedBy: getUser(),
    });
    message.success('Pay component deactivated');
    set({ selectedComponent: null });
    await get().fetchPayComponents();
  },

  // ------------------------------------------------------------------
  // Salary Structures
  // ------------------------------------------------------------------
  salaryStructures: [],
  selectedStructure: null,
  structuresLoading: false,

  fetchSalaryStructures: async () => {
    set({ structuresLoading: true });
    try {
      const data = await HrmCompensationService.fetchAllSalaryStructures(getOrganizationId());
      set({ salaryStructures: data });
    } finally {
      set({ structuresLoading: false });
    }
  },

  selectStructure: (structure) => set({ selectedStructure: structure }),

  saveSalaryStructure: async (req) => {
    const organizationId = getOrganizationId();
    const user = getUser();
    if (req.handle) {
      await HrmCompensationService.updateSalaryStructure({ ...req, organizationId, modifiedBy: user });
    } else {
      await HrmCompensationService.createSalaryStructure({ ...req, organizationId, createdBy: user });
    }
    message.success('Salary structure saved');
    await get().fetchSalaryStructures();
  },

  // ------------------------------------------------------------------
  // Assignment
  // ------------------------------------------------------------------
  selectedEmployeeId: null,
  currentCompensation: null,
  compensationHistory: [],
  previewCompensation: null,
  assignmentLoading: false,

  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id }),

  loadEmployeeCompensation: async (employeeId) => {
    set({ assignmentLoading: true, currentCompensation: null });
    try {
      const data = await HrmCompensationService.getActiveCompensation(getOrganizationId(), employeeId);
      set({ currentCompensation: data });
    } catch {
      // Employee may have no existing compensation — that's ok
    } finally {
      set({ assignmentLoading: false });
    }
  },

  fetchCompensationHistory: async (employeeId) => {
    const data = await HrmCompensationService.getCompensationHistory(getOrganizationId(), employeeId);
    set({ compensationHistory: data });
  },

  runPreview: async (req) => {
    const data = await HrmCompensationService.previewCompensation(
      req as Parameters<typeof HrmCompensationService.previewCompensation>[0],
    );
    set({ previewCompensation: data });
  },

  saveCompensationDraft: async (req) => {
    await HrmCompensationService.createEmployeeCompensation(
      req as Parameters<typeof HrmCompensationService.createEmployeeCompensation>[0],
    );
    message.success('Compensation saved as draft');
  },

  submitCompensationForApproval: async (handle) => {
    await HrmCompensationService.submitCompensationForApproval({
      organizationId: getOrganizationId(),
      handle,
      submittedBy: getUser(),
    });
    message.success('Submitted for approval');
    const empId = get().selectedEmployeeId;
    if (empId) await get().loadEmployeeCompensation(empId);
  },

  // ------------------------------------------------------------------
  // Salary Revision
  // ------------------------------------------------------------------
  revisionMode: 'individual',
  revisionRows: [],
  revisionLoading: false,
  selectedRevisionIds: [],

  setRevisionMode: (mode) => set({ revisionMode: mode }),
  setRevisionRows: (rows) => set({ revisionRows: rows }),
  setSelectedRevisionIds: (ids) => set({ selectedRevisionIds: ids }),

  submitBulkRevision: async () => {
    set({ revisionLoading: true });
    try {
      const { revisionRows, selectedRevisionIds } = get();
      const selected = revisionRows.filter((r) => selectedRevisionIds.includes(r.employeeId));
      for (const row of selected) {
        const created = await HrmCompensationService.createEmployeeCompensation({
          organizationId: getOrganizationId(),
          employeeId: row.employeeId,
          effectiveFrom: row.effectiveFrom,
          structureCode: '',
          components: [],
          remarks: `Bulk revision: ${row.incrementPercent}% increment`,
          createdBy: getUser(),
        });
        await HrmCompensationService.submitCompensationForApproval({
          organizationId: getOrganizationId(),
          handle: created.handle,
          submittedBy: getUser(),
        });
      }
      message.success(`${selected.length} revisions submitted for approval`);
    } finally {
      set({ revisionLoading: false });
    }
  },

  // ------------------------------------------------------------------
  // Approvals
  // ------------------------------------------------------------------
  pendingApprovals: [],
  approvalsLoading: false,

  fetchPendingApprovals: async () => {
    set({ approvalsLoading: true });
    try {
      const data = await HrmCompensationService.getPendingApprovals(getOrganizationId());
      set({ pendingApprovals: data });
    } finally {
      set({ approvalsLoading: false });
    }
  },

  approveCompensation: async (handle, remarks) => {
    await HrmCompensationService.approveRejectCompensation({
      organizationId: getOrganizationId(),
      handle,
      action: 'APPROVE',
      remarks,
      performedBy: getUser(),
    });
    message.success('Compensation approved');
    await get().fetchPendingApprovals();
  },

  rejectCompensation: async (handle, reason) => {
    await HrmCompensationService.approveRejectCompensation({
      organizationId: getOrganizationId(),
      handle,
      action: 'REJECT',
      remarks: reason,
      performedBy: getUser(),
    });
    message.success('Compensation rejected');
    await get().fetchPendingApprovals();
  },

  // ------------------------------------------------------------------
  // Global
  // ------------------------------------------------------------------
  reset: () =>
    set({
      activeTab: 'components',
      payComponents: [],
      selectedComponent: null,
      salaryStructures: [],
      selectedStructure: null,
      selectedEmployeeId: null,
      currentCompensation: null,
      compensationHistory: [],
      previewCompensation: null,
      revisionRows: [],
      selectedRevisionIds: [],
      pendingApprovals: [],
    }),
}));
