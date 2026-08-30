'use client';

import React from 'react';
import type { VariancePillProps } from '../../types/ui.types';
import styles from '../../styles/Compensation.module.css';

const VariancePill: React.FC<VariancePillProps> = ({ value, suffix = '%' }) => {
  const isPositive = value >= 0;
  const sign = isPositive ? '+' : '';
  return (
    <span className={`${styles.variancePill} ${isPositive ? styles.varianceUp : styles.varianceDown}`}>
      {sign}{value.toFixed(1)}{suffix}
    </span>
  );
};

export default VariancePill;
