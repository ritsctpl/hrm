'use client';

import React, { useEffect } from 'react';
import CommonAppBar from '@/components/CommonAppBar';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import CompensationTabLayout from './components/templates/CompensationTabLayout';
import { useHrmCompensationStore } from './stores/compensationStore';
import styles from './styles/Compensation.module.css';

const HrmCompensationLanding: React.FC = () => {
  const fetchPayComponents = useHrmCompensationStore((s) => s.fetchPayComponents);
  const fetchSalaryStructures = useHrmCompensationStore((s) => s.fetchSalaryStructures);
  const fetchPendingApprovals = useHrmCompensationStore((s) => s.fetchPendingApprovals);
  const reset = useHrmCompensationStore((s) => s.reset);

  useEffect(() => {
    fetchPayComponents();
    fetchSalaryStructures();
    fetchPendingApprovals();
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModuleAccessGate moduleCode="HRM_COMPENSATION" appTitle="Compensation Management">
      <div className={`hrm-module-root ${styles.compensationPage}`}>
        <CommonAppBar appTitle="Compensation Management" />
        <div className={styles.tabsWrapper}>
          <CompensationTabLayout />
        </div>
      </div>
    </ModuleAccessGate>
  );
};

export default HrmCompensationLanding;
