'use client';

import React, { useEffect } from 'react';
import CommonAppBar from '@/components/CommonAppBar';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import GradeMasterLayout from './components/templates/GradeMasterLayout';
import { useHrmGradeStore } from './stores/gradeStore';
import styles from './styles/Grade.module.css';

const HrmGradeLanding: React.FC = () => {
  const fetchGrades = useHrmGradeStore((s) => s.fetchGrades);
  const reset = useHrmGradeStore((s) => s.reset);

  useEffect(() => {
    fetchGrades();
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModuleAccessGate moduleCode="HRM_GRADE" appTitle="Grade Management">
      <div className={`hrm-module-root ${styles.gradePage}`}>
        <CommonAppBar appTitle="Grade Management" />
        <div className={styles.layoutWrapper}>
          <GradeMasterLayout />
        </div>
      </div>
    </ModuleAccessGate>
  );
};

export default HrmGradeLanding;
