'use client';

import React from 'react';
import OrgFieldLabel from '../atoms/OrgFieldLabel';
import type { OrgFormFieldProps } from '../../types/ui.types';
import styles from '../../styles/HrmOrganizationForm.module.css';

interface OrgViewFieldProps extends Omit<OrgFormFieldProps, 'children'> {
  value?: string | number | null;
  children?: React.ReactNode;
}

const OrgViewField: React.FC<OrgViewFieldProps> = ({
  label,
  required = false,
  value,
  children,
}) => {
  return (
    <div className={styles.formField}>
      <OrgFieldLabel label={label} required={required} />
      <div style={{
        fontSize: '14px',
        color: '#262626',
        padding: '8px 0',
        minHeight: '32px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {children || value || '-'}
      </div>
    </div>
  );
};

export default OrgViewField;
