'use client';

import React from 'react';
import type { OrgFieldLabelProps } from '../../types/ui.types';
import styles from '../../styles/HrmOrganizationForm.module.css';

const OrgFieldLabel: React.FC<OrgFieldLabelProps> = ({ label, required = false }) => {
  return (
    <span className={`${styles.formFieldLabel} ${required ? styles.formFieldRequired : ''}`}>
      {label}
    </span>
  );
};

export default OrgFieldLabel;
