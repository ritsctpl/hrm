'use client';

import React from 'react';
import type { CurrencyCellProps } from '../../types/ui.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import styles from '../../styles/Compensation.module.css';

const CurrencyCell: React.FC<CurrencyCellProps> = ({ value, colored = false }) => {
  const text = formatINRPlain(value ?? 0);
  return <span className={colored ? styles.currencyPos : styles.currency}>{text}</span>;
};

export default CurrencyCell;
