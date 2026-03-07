'use client';

import React from 'react';
import { Tag } from 'antd';
import type { VarianceIndicatorProps } from '../../types/ui.types';
import { computeVariancePct, formatVariancePct } from '../../utils/payrollFormatters';
import { VARIANCE_THRESHOLD_WARNING, VARIANCE_THRESHOLD_ERROR } from '../../utils/payrollConstants';

const VarianceIndicator: React.FC<VarianceIndicatorProps> = ({
  current,
  previous,
  thresholdWarning = VARIANCE_THRESHOLD_WARNING,
  thresholdError = VARIANCE_THRESHOLD_ERROR,
}) => {
  if (previous === 0) return <span>—</span>;

  const pct = computeVariancePct(current, previous);
  const absPct = Math.abs(pct);

  let color = 'default';
  if (absPct >= thresholdError) color = 'error';
  else if (absPct >= thresholdWarning) color = 'warning';
  else color = pct >= 0 ? 'success' : 'default';

  return <Tag color={color}>{formatVariancePct(pct)}</Tag>;
};

export default VarianceIndicator;
