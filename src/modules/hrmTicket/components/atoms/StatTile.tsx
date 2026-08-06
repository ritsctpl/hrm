'use client';

import React from 'react';
import { Tooltip } from 'antd';

interface Props {
  label: string;
  value: React.ReactNode;
  /** Small qualifier under the number — "of 214 resolved", "last 30 days". */
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  tooltip?: string;
}

const TONE_COLORS: Record<NonNullable<Props['tone']>, string> = {
  default: '#262626',
  good: '#237804',
  warn: '#d46b08',
  bad: '#cf1322',
};

/** One figure on the dashboard. Deliberately plain — the numbers carry the meaning, not the chrome. */
const StatTile: React.FC<Props> = ({ label, value, hint, tone = 'default', tooltip }) => {
  const body = (
    <div
      style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        padding: '12px 16px',
        minWidth: 140,
        flex: '1 1 140px',
      }}
    >
      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2, color: TONE_COLORS[tone] }}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </div>
      {hint ? <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 2 }}>{hint}</div> : null}
    </div>
  );

  return tooltip ? <Tooltip title={tooltip}>{body}</Tooltip> : body;
};

export default StatTile;
