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
        fontWeight: 500,
        padding: '10px 12px',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: '6px',
        lineHeight: '1.5',
      }}>
        {children || value || <span style={{ color: '#bfbfbf', fontWeight: 400 }}>-</span>}
      </div>
    </div>
  );
};

export default OrgViewField;
