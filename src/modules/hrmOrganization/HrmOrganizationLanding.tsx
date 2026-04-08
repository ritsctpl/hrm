'use client';

import React, { useEffect } from 'react';
import CommonAppBar from '@/components/CommonAppBar';
import OrganizationListTemplate from './components/templates/OrganizationListTemplate';
import CompanyDetailTemplate from './components/templates/CompanyDetailTemplate';
import { useHrmOrganizationStore } from './stores/hrmOrganizationStore';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';
import styles from './styles/HrmOrganization.module.css';

const HrmOrganizationLanding: React.FC = () => {
  const { view, reset } = useHrmOrganizationStore();
  useUnsavedChanges();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <div className={`hrm-module-root ${styles.container}`}>
      <CommonAppBar appTitle="Organization Setup" />
      <div className={styles.content}>
        {view === 'list' ? <OrganizationListTemplate /> : <CompanyDetailTemplate />}
      </div>
    </div>
  );
};

export default HrmOrganizationLanding;
