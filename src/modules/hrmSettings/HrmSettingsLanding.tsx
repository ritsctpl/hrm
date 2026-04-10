'use client';

import React from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import CommonAppBar from '@/components/CommonAppBar';
import { useAuth } from '@/context/AuthContext';
import SettingsTemplate from './components/templates/SettingsTemplate';
import { useHrmSettingsStore } from './stores/hrmSettingsStore';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';

const HrmSettingsLanding: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { activeSection, setActiveSection } = useHrmSettingsStore();

  const handleLogout = () => {
    Modal.confirm({
      title: t('settings.logout.title'),
      content: t('settings.logout.confirm'),
      okText: 'Yes',
      cancelText: 'Cancel',
      onOk: () => {
        logout();
      },
    });
  };

  return (
    <ModuleAccessGate moduleCode="HRM_SETTINGS" appTitle="Settings">
      <div className="hrm-module-root">
        <CommonAppBar appTitle="Settings" />
        <SettingsTemplate
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
      </div>
    </ModuleAccessGate>
  );
};

export default HrmSettingsLanding;
