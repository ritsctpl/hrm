'use client';

import React from 'react';
import OrgFieldLabel from '../atoms/OrgFieldLabel';
import type { OrgFormFieldProps } from '../../types/ui.types';
import styles from '../../styles/HrmOrganizationForm.module.css';

const OrgFormField: React.FC<OrgFormFieldProps> = ({
  label,
  required = false,
  error,
  children,
}) => {
  return (
    <div className={styles.formField}>
      <OrgFieldLabel label={label} required={required} />
      {children}
      {error && <div className={styles.formFieldError}>{error}</div>}
    </div>
  );
};

export default OrgFormField;
