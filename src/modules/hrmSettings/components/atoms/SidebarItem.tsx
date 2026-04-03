'use client';

import React from 'react';
import styles from '../../styles/HrmSettings.module.css';
import type { SidebarItemProps } from '../../types/ui.types';

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, sectionKey, isActive, onClick }) => {
  const isLogout = sectionKey === 'logout';

  return (
    <button
      className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''} ${isLogout ? styles.sidebarItemLogout : ''}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default SidebarItem;
