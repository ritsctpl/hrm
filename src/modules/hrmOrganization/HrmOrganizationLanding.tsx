'use client';

import React, { useEffect } from 'react';
import CommonAppBar from '@/components/CommonAppBar';
import OrganizationListTemplate from './components/templates/OrganizationListTemplate';
import CompanyDetailTemplate from './components/templates/CompanyDetailTemplate';
import { useHrmOrganizationStore } from './stores/hrmOrganizationStore';
import styles from './styles/HrmOrganization.module.css';

const HrmOrganizationLanding: React.FC = () => {
  const { view, reset } = useHrmOrganizationStore();

  useEffect(() => {
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      <CommonAppBar appTitle="Organization Setup" />
      <div className={styles.content}>
        {view === 'list' ? <OrganizationListTemplate /> : <CompanyDetailTemplate />}
      </div>
    </div>
  );
};

export default HrmOrganizationLanding;
