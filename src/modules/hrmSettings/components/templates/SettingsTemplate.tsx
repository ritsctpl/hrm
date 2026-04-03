'use client';

import React, { useState } from 'react';
import { Drawer } from 'antd';
import { Menu } from 'lucide-react';
import SettingsSidebar from '../organisms/SettingsSidebar';
import SettingsContent from '../organisms/SettingsContent';
import type { SettingsTemplateProps } from '../../types/ui.types';
import styles from '../../styles/HrmSettings.module.css';

const SettingsTemplate: React.FC<SettingsTemplateProps> = ({ activeSection, onSectionChange, onLogout }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleSectionChange = (section: typeof activeSection) => {
    onSectionChange(section);
    setMobileDrawerOpen(false);
  };

  return (
    <div className={styles.settingsLayout}>
      <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} onLogout={onLogout} />

      <button className={styles.mobileMenuBtn} onClick={() => setMobileDrawerOpen(true)}>
        <Menu size={22} />
      </button>

      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} onLogout={onLogout} />
      </Drawer>

      <SettingsContent activeSection={activeSection} />
    </div>
  );
};

export default SettingsTemplate;
