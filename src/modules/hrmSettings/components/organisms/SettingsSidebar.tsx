'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import SidebarItem from '../atoms/SidebarItem';
import { SIDEBAR_ITEMS } from '../../utils/constants';
import type { SettingsSidebarProps } from '../../types/ui.types';
import type { SettingsSection } from '../../types/domain.types';
import styles from '../../styles/HrmSettings.module.css';

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeSection, onSectionChange, onLogout }) => {
  const { t } = useTranslation();
  const navItems = SIDEBAR_ITEMS.filter((item) => item.key !== 'logout');
  const logoutItem = SIDEBAR_ITEMS.find((item) => item.key === 'logout')!;

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarNav}>
        {navItems.map((item) => (
          <SidebarItem
            key={item.key}
            icon={<item.icon size={18} />}
            label={t(`settings.sidebar.${item.key}`)}
            sectionKey={item.key}
            isActive={activeSection === item.key}
            onClick={() => onSectionChange(item.key as SettingsSection)}
          />
        ))}
      </div>
      <div className={styles.sidebarDivider} />
      <div style={{ padding: '0 8px' }}>
        <SidebarItem
          icon={<logoutItem.icon size={18} />}
          label={t('settings.sidebar.logout')}
          sectionKey="logout"
          isActive={false}
          onClick={onLogout}
        />
      </div>
    </div>
  );
};

export default SettingsSidebar;
