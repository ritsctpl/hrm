'use client';

import { useEffect, useCallback } from 'react';
import { useHrmCompensationStore } from '../stores/compensationStore';
import type { PayComponent } from '../types/domain.types';
import type { PayComponentFormState } from '../types/ui.types';

export function usePayComponents() {
  const payComponents = useHrmCompensationStore((s) => s.payComponents);
  const selectedComponent = useHrmCompensationStore((s) => s.selectedComponent);
  const componentsLoading = useHrmCompensationStore((s) => s.componentsLoading);
  const componentsError = useHrmCompensationStore((s) => s.componentsError);
  const fetchPayComponents = useHrmCompensationStore((s) => s.fetchPayComponents);
  const selectComponent = useHrmCompensationStore((s) => s.selectComponent);
  const savePayComponent = useHrmCompensationStore((s) => s.savePayComponent);
  const deletePayComponent = useHrmCompensationStore((s) => s.deletePayComponent);

  useEffect(() => {
    if (payComponents.length === 0) {
      fetchPayComponents();
    }
  }, []);

  const handleSelect = useCallback(
    (component: PayComponent | null) => {
      selectComponent(component);
    },
    [selectComponent],
  );

  const handleNew = useCallback(() => {
    selectComponent(null);
  }, [selectComponent]);

  const handleSave = useCallback(
    async (formState: PayComponentFormState) => {
      // Cast form state to PayComponent shape for the store
      await savePayComponent(formState as unknown as PayComponent);
    },
    [savePayComponent],
  );

  const handleDelete = useCallback(
    async (componentCode: string) => {
      await deletePayComponent(componentCode);
    },
    [deletePayComponent],
  );

  const handleRefresh = useCallback(() => {
    fetchPayComponents();
  }, [fetchPayComponents]);

  return {
    payComponents,
    selectedComponent,
    componentsLoading,
    componentsError,
    handleSelect,
    handleNew,
    handleSave,
    handleDelete,
    handleRefresh,
  };
}
