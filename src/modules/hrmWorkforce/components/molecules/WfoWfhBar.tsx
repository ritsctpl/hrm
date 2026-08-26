'use client';

import React from 'react';
import { Tooltip } from 'antd';
import { fmtMinutes } from '../../utils/workforceFormat';
import styles from '../../styles/Workforce.module.css';

type Minutes = number | null | undefined;

interface Props {
  office: Minutes;
  home: Minutes;
  client: Minutes;
  other: Minutes;
  /** Row height in px — the attendance table wants it thinner than a report card does. */
  height?: number;
}

const SEGMENTS: Array<{ key: 'office' | 'home' | 'client' | 'other'; label: string; cls: string }> = [
  { key: 'office', label: 'Office', cls: 'segOffice' },
  { key: 'home', label: 'Home', cls: 'segHome' },
  { key: 'client', label: 'Client site', cls: 'segClient' },
  { key: 'other', label: 'Other', cls: 'segOther' },
];

const safe = (n: Minutes): number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;

/**
 * Where a person's present minutes were spent, as one proportional bar.
 *
 * The bar answers "mostly office or mostly home?" at a glance; the exact minutes live in the
 * tooltip via `fmtMinutes`, because four numbers inline would out-shout every other column and
 * a raw `429` reads as a count rather than a working day.
 *
 * The zero guard is not defensive padding: a holiday, a leave day and a person whose machines
 * never reported all arrive as four zeros, and `portion / 0` would put `NaN%` widths on the
 * page. Those rows draw an empty track instead — still a bar, so the column keeps its shape and
 * "no time recorded" is visibly different from "nothing rendered here".
 */
const WfoWfhBar: React.FC<Props> = (props) => {
  const { height = 8 } = props;
  const parts = SEGMENTS.map((s) => ({ ...s, minutes: safe(props[s.key]) }));
  const present = parts.reduce((sum, p) => sum + p.minutes, 0);

  if (present === 0) {
    return (
      <Tooltip title="No location minutes recorded for this day">
        <div
          className={`${styles.wfoBar} ${styles.wfoEmpty}`}
          style={{ height }}
          role="img"
          aria-label="No location minutes recorded"
        />
      </Tooltip>
    );
  }

  const shown = parts.filter((p) => p.minutes > 0);
  const summary = shown
    .map((p) => `${p.label} ${fmtMinutes(p.minutes)} (${Math.round((p.minutes / present) * 100)}%)`)
    .join(' · ');

  return (
    <Tooltip
      title={
        <span>
          {shown.map((p) => (
            <span key={p.label} style={{ display: 'block', whiteSpace: 'nowrap' }}>
              {p.label}: {fmtMinutes(p.minutes)} ({Math.round((p.minutes / present) * 100)}%)
            </span>
          ))}
          <span style={{ display: 'block', whiteSpace: 'nowrap', opacity: 0.75 }}>
            Total {fmtMinutes(present)}
          </span>
        </span>
      }
    >
      <div className={styles.wfoBar} style={{ height }} role="img" aria-label={summary}>
        {shown.map((p) => (
          <i
            key={p.label}
            className={`${styles.wfoSeg} ${styles[p.cls]}`}
            style={{ width: `${(p.minutes / present) * 100}%` }}
          />
        ))}
      </div>
    </Tooltip>
  );
};

export default WfoWfhBar;
