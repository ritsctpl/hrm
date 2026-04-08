'use client';

import { useEffect, useCallback } from 'react';
import { Modal } from 'antd';
import { useHrmOrganizationStore } from '../stores/hrmOrganizationStore';

/**
 * Hook to warn users about unsaved changes in Organization forms.
 * - Adds browser `beforeunload` prompt when form is dirty
 * - Exposes `confirmNavigation` for in-app navigation guards
 */
export function useUnsavedChanges() {
  const { companyProfile, businessUnit, department, location } = useHrmOrganizationStore();

  const hasDirtyForm =
    companyProfile.isEditing ||
    businessUnit.isCreating ||
    (businessUnit.selected !== null && businessUnit.draft !== null) ||
    department.isCreating ||
    (department.selected !== null && department.draft !== null) ||
    location.isCreating ||
    (location.selected !== null && location.draft !== null);

  // Browser tab close / refresh warning
  useEffect(() => {
    if (!hasDirtyForm) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message regardless of returnValue
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasDirtyForm]);

  // In-app navigation confirmation
  const confirmNavigation = useCallback(
    (onConfirm: () => void) => {
      if (!hasDirtyForm) {
        onConfirm();
        return;
      }
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes that will be lost. Do you want to continue?',
        okText: 'Leave',
        cancelText: 'Stay',
        okButtonProps: { danger: true },
        onOk: onConfirm,
      });
    },
    [hasDirtyForm]
  );

  return { hasDirtyForm, confirmNavigation };
}
