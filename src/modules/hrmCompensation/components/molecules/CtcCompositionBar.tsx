'use client';

import React from 'react';
import type { CompensationComponent } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import styles from '../../styles/Compensation.module.css';

export interface CtcSegment {
  code: string;
  name: string;
  amount: number;
  pct: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** One bar segment per EARNING component, width = its share of gross earnings. */
export function buildCtcSegments(
  components: Pick<CompensationComponent, 'componentCode' | 'componentName' | 'componentType' | 'derivedAmount'>[],
  gross: number,
): CtcSegment[] {
  return (components ?? [])
    .filter((c) => c.componentType === 'EARNING')
    .map((c) => ({
      code: c.componentCode,
      name: c.componentName,
      amount: c.derivedAmount ?? 0,
      pct: gross > 0 ? round1(((c.derivedAmount ?? 0) / gross) * 100) : 0,
    }));
}

export type DeltaDirection = 'up' | 'down' | 'flat';

/** Percentage change from a previous CTC to a new one; null when there is no valid previous. */
export function computeDelta(
  prev: number | null | undefined,
  next: number,
): { deltaPct: number | null; direction: DeltaDirection } {
  if (prev == null || prev <= 0) return { deltaPct: null, direction: 'flat' };
  const deltaPct = round1(((next - prev) / prev) * 100);
  const direction: DeltaDirection = deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
  return { deltaPct, direction };
}

interface CtcCompositionBarProps {
  components: CompensationComponent[];
  gross: number;
}

const CtcCompositionBar: React.FC<CtcCompositionBarProps> = ({ components, gross }) => {
  const segments = buildCtcSegments(components, gross);
  if (segments.length === 0) return null;

  return (
    <div className={styles.ctcBarWrap}>
      <div className={styles.ctcBarTrack} role="img" aria-label="Earnings composition of gross">
        {segments.map((s, i) => (
          <div
            key={s.code}
            className={styles.ctcBarSeg}
            style={{ flexBasis: `${s.pct}%`, background: `var(--comp-seg-${(i % 6) + 1})` }}
            title={`${s.name}: ${formatINRPlain(s.amount)} (${s.pct}%)`}
          />
        ))}
      </div>
      <ul className={styles.ctcLegend}>
        {segments.map((s, i) => (
          <li key={s.code} className={styles.ctcLegendItem}>
            <span className={styles.ctcLegendDot} style={{ background: `var(--comp-seg-${(i % 6) + 1})` }} aria-hidden />
            <span className={styles.ctcLegendName}>{s.name}</span>
            <span className={styles.ctcLegendMeta}>
              {formatINRPlain(s.amount)} · {s.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CtcCompositionBar;
