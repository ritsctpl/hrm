'use client';

import React from 'react';
import { Tooltip } from 'antd';
import { fmtPct } from '../../utils/workforceFormat';
import type { HealthSeverity } from '../../types/ui.types';
import styles from '../../styles/Workforce.module.css';

/**
 * How a health reading scores against the *backend detector's* thresholds.
 *
 * Pure and exported on its own because the tiles, the row tints and the unit test all have to
 * agree with `HealthIssueDetector` (feat/workforce-collector): disk free < 10%, cpu p95 > 95%,
 * battery health < 50%. If the screen coloured itself on its own numbers, a green disk tile
 * could sit next to an open DISK_LOW issue on the same row and nothing in the build would
 * object — the only place that mismatch would surface is in front of an IT lead.
 *
 * `null → 'ok'` is the deliberate half of the contract. Every metric is nullable all the way
 * from the agent (a sensor it could not read reports nothing), and "no evidence" must never
 * render as an alarm: the tile shows an em dash and stays untinted. The absent-reading case is
 * the one this function is most often asked, so it is the one it must get right.
 *
 * There is no 'warn' band here on purpose. The backend raises an issue or it does not, and
 * inventing an amber band on the screen would put a colour on rows the detector is silent
 * about. 'warn' stays in the type so a caller with its own softer rule (a trend, a forecast)
 * can still pass it to <HealthMetric>.
 */
export function healthSeverity(
  metric: 'disk' | 'cpu' | 'battery',
  value: number | null,
): HealthSeverity {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'ok';
  switch (metric) {
    case 'disk':
      return value < 10 ? 'crit' : 'ok';
    case 'cpu':
      return value > 95 ? 'crit' : 'ok';
    case 'battery':
      return value < 50 ? 'crit' : 'ok';
    default:
      return 'ok';
  }
}

/**
 * Severity → CSS-module class *name*, resolved inside render rather than in a module-level map.
 * `healthSeverity` is imported by a node-side unit test, and the test runner's transpiler drops
 * the `.module.css` import instead of resolving it — a top-level `styles.sevOk` would therefore
 * throw at import time and take the pure function down with the stylesheet. Same styling,
 * evaluated where a stylesheet actually exists.
 */
const SEVERITY_CLASS: Record<HealthSeverity, string> = {
  ok: 'sevOk',
  warn: 'sevWarn',
  crit: 'sevCrit',
};

interface Props {
  label: string;
  /** Nullable on purpose — an unreadable sensor reports nothing and renders as an em dash. */
  value: number | null | undefined;
  /** `%` routes through `fmtPct`; anything else is appended verbatim (`°C`, `GB`). */
  unit?: string;
  severity: HealthSeverity;
  /** Extra context on hover — typically the date the reading is from. */
  tooltip?: string;
}

/** One health reading: a label, a number, and a tint only when the detector would act on it. */
const HealthMetric: React.FC<Props> = ({ label, value, unit, severity, tooltip }) => {
  const absent = value === null || value === undefined || !Number.isFinite(value);
  const text = unit === '%' ? fmtPct(value) : absent ? '—' : String(Math.round(value as number));

  const body = (
    <div className={styles.healthMetric}>
      <span className={styles.healthLabel}>{label}</span>
      <span
        className={`${styles.healthValue} ${
          absent ? styles.healthAbsent : styles[SEVERITY_CLASS[severity] ?? 'sevOk']
        }`}
      >
        {text}
        {!absent && unit && unit !== '%' ? <span className={styles.healthUnit}>{unit}</span> : null}
      </span>
    </div>
  );

  return tooltip ? <Tooltip title={tooltip}>{body}</Tooltip> : body;
};

export default HealthMetric;
