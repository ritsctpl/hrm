'use client';

import React from 'react';
import type { CalcMethodBadgeProps } from '../../types/ui.types';
import { CALC_METHOD_LABEL_MAP } from '../../utils/compensationConstants';
import styles from '../../styles/Compensation.module.css';

/** Token-driven badge: gold reserves for BALANCE (money-of-the-remainder), info for FORMULA. */
const CALC_CLASS: Record<string, string> = {
  BALANCE: styles.calcGold,
  FORMULA: styles.calcInfo,
};

const CalcMethodBadge: React.FC<CalcMethodBadgeProps> = ({ method }) => {
  const cls = CALC_CLASS[method] ?? styles.calcDefault;
  return (
    <span className={`${styles.calcBadge} ${cls}`}>
      {CALC_METHOD_LABEL_MAP[method] ?? method}
    </span>
  );
};

export default CalcMethodBadge;
