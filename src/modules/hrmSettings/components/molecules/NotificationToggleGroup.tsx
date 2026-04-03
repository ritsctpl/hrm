'use client';

import React from 'react';
import { Switch } from 'antd';
import styles from '../../styles/HrmSettings.module.css';
import type { NotificationToggleGroupProps } from '../../types/ui.types';

const NotificationToggleGroup: React.FC<NotificationToggleGroupProps> = ({ title, toggles, onToggle }) => {
  return (
    <div>
      <h4 className={styles.subSectionTitle}>{title}</h4>
      {toggles.map((toggle) => (
        <div key={toggle.key} className={styles.toggleRow}>
          <span className={styles.toggleLabel}>{toggle.label}</span>
          <Switch checked={toggle.checked} onChange={(val) => onToggle(toggle.key, val)} size="small" />
        </div>
      ))}
    </div>
  );
};

export default NotificationToggleGroup;
