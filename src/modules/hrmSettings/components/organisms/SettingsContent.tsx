'use client';

import React from 'react';
import ProfileSection from './ProfileSection';
import SecuritySection from './SecuritySection';
import NotificationSection from './NotificationSection';
import PreferencesSection from './PreferencesSection';
import SupportSection from './SupportSection';
import type { SettingsContentProps } from '../../types/ui.types';
import styles from '../../styles/HrmSettings.module.css';

const sectionMap: Record<string, React.FC> = {
  profile: ProfileSection,
  security: SecuritySection,
  notifications: NotificationSection,
  preferences: PreferencesSection,
  support: SupportSection,
};

const SettingsContent: React.FC<SettingsContentProps> = ({ activeSection }) => {
  const ActiveComponent = sectionMap[activeSection] || ProfileSection;

  return (
    <div className={styles.contentArea}>
      <ActiveComponent />
    </div>
  );
};

export default SettingsContent;
