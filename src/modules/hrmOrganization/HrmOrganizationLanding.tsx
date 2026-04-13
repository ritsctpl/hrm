'use client';

import React, { useEffect } from 'react';
import CommonAppBar from '@/components/CommonAppBar';
import OrganizationListTemplate from './components/templates/OrganizationListTemplate';
import CompanyDetailTemplate from './components/templates/CompanyDetailTemplate';
import { useHrmOrganizationStore } from './stores/hrmOrganizationStore';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import styles from './styles/HrmOrganization.module.css';

const HrmOrganizationLanding: React.FC = () => {
  const { view, reset } = useHrmOrganizationStore();
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const isReady = useHrmRbacStore(s => s.isReady);
  
  useUnsavedChanges();

  // Load Organization module permissions on mount
  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_ORGANIZATION');
    }
  }, [isReady, loadSectionPermissions]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <ModuleAccessGate moduleCode="HRM_ORGANIZATION" appTitle="Organization Setup">
      <div className={`hrm-module-root ${styles.container}`}>
        <CommonAppBar appTitle="Organization Setup" />
        <div className={styles.content}>
          {view === 'list' ? <OrganizationListTemplate /> : <CompanyDetailTemplate />}
        </div>
      </div>
    </ModuleAccessGate>
  );
};

export default HrmOrganizationLanding;
