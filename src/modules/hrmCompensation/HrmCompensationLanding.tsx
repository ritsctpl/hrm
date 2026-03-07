'use client';

import React, { useEffect } from 'react';
import CommonAppBar from '@/components/CommonAppBar';
import CompensationTabLayout from './components/templates/CompensationTabLayout';
import { useHrmCompensationStore } from './stores/compensationStore';
import styles from './styles/Compensation.module.css';

const HrmCompensationLanding: React.FC = () => {
  const fetchPayComponents = useHrmCompensationStore((s) => s.fetchPayComponents);
  const fetchSalaryStructures = useHrmCompensationStore((s) => s.fetchSalaryStructures);
  const reset = useHrmCompensationStore((s) => s.reset);

  useEffect(() => {
    fetchPayComponents();
    fetchSalaryStructures();
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.compensationPage}>
      <CommonAppBar appTitle="Compensation Management" />
      <div className={styles.tabsWrapper}>
        <CompensationTabLayout />
      </div>
    </div>
  );
};

export default HrmCompensationLanding;
