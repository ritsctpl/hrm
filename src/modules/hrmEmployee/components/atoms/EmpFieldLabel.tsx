/**
 * EmpFieldLabel - Atom component for label + value pairs in profile view
 */

'use client';

import React from 'react';
import styles from '../../styles/HrmEmployeeTable.module.css';
import type { EmpFieldLabelProps } from '../../types/ui.types';

const EmpFieldLabel: React.FC<EmpFieldLabelProps> = ({
  label,
  value,
  direction = 'vertical',
}) => {
  const isEmpty = value === null || value === undefined || value === '' || value === '--';

  if (direction === 'horizontal') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={isEmpty ? styles.detailValueEmpty : styles.detailValue}>
          {isEmpty ? '--' : value}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={isEmpty ? styles.detailValueEmpty : styles.detailValue}>
        {isEmpty ? '--' : value}
      </span>
    </div>
  );
};

export default EmpFieldLabel;
