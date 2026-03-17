/**
 * HrmEmployeeScreen
 * Full-page employee profile view with 11 tabs.
 * Loads profile data by handle and delegates rendering to EmployeeProfileTemplate.
 */

'use client';

import React from 'react';
import { useEmployeeProfile } from './hooks/useHrmEmployeeData';
import EmployeeProfileTemplate from './components/templates/EmployeeProfileTemplate';
import type { ProfileTabKey } from './types/ui.types';

interface HrmEmployeeScreenProps {
  handle: string;
  onBack: () => void;
}

const HrmEmployeeScreen: React.FC<HrmEmployeeScreenProps> = ({ handle, onBack }) => {
  const {
    data,
    isLoading,
    isEditing,
    isSaving,
    activeTab,
    setActiveTab,
    setEditing,
    updateProfile,
    refresh,
  } = useEmployeeProfile(handle);

  const handleSave = async (section: string, payload: Record<string, unknown>) => {
    await updateProfile(section, payload);
  };

  const handleTabChange = (tab: ProfileTabKey) => {
    setActiveTab(tab);
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  if (!data && !isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        Employee profile not found.
      </div>
    );
  }

  return (
    <EmployeeProfileTemplate
      profile={data!}
      isLoading={isLoading}
      isEditing={isEditing}
      isSaving={isSaving}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      onBack={onBack}
      onRefresh={refresh}
    />
  );
};

export default HrmEmployeeScreen;
