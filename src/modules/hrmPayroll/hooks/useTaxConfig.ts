'use client';

import { useEffect } from 'react';
import { useHrmPayrollStore } from '../stores/payrollStore';
import type { TaxConfiguration, StatutoryConfig } from '../types/domain.types';
import { getCurrentFinancialYear } from '../utils/payrollFormatters';

export function useTaxConfig() {
  const store = useHrmPayrollStore();

  useEffect(() => {
    store.fetchTaxConfig(getCurrentFinancialYear(), 'NEW');
    store.fetchStatutoryConfig('PF');
    store.fetchStatutoryConfig('ESI');
    store.fetchStatutoryConfig('PT');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveTax = async (config: TaxConfiguration) => {
    await store.saveTaxConfig(config);
  };

  const saveStatutory = async (config: StatutoryConfig) => {
    await store.saveStatutoryConfig(config);
  };

  return {
    taxConfig: store.taxConfig,
    pfConfig: store.pfConfig,
    esiConfig: store.esiConfig,
    ptConfig: store.ptConfig,
    loading: store.taxConfigLoading,
    loadTaxConfig: store.fetchTaxConfig,
    saveTax,
    saveStatutory,
  };
}
