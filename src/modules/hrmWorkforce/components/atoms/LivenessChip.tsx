'use client';

import React from 'react';
import { Tag, Tooltip } from 'antd';
import type { Liveness } from '../../types/domain.types';
import { LIVENESS_META } from '../../utils/workforceConstants';
import { fromNowSafe } from '../../utils/workforceFormat';
import styles from '../../styles/Workforce.module.css';

/**
 * AntD preset colours rather than hex, so the chip follows the app's dark mode for free — the
 * ConfigProvider in `src/components/ThemeContext.tsx` swaps `darkAlgorithm` and the presets
 * re-derive. STALE maps to no colour at all (a plain neutral tag): "we have not heard from it
 * recently" is an absence of news, and painting it would put it on the same footing as OFFLINE,
 * which is news.
 */
const TAG_COLOR: Record<Liveness, string | undefined> = {
  ONLINE: 'green',
  DELAYED: 'orange',
  STALE: undefined,
  OFFLINE: 'red',
};

interface Props {
  liveness: Liveness | string | null | undefined;
  /** The row's `lastSeenAt`, shown on hover — the chip says what, this says when. */
  lastSeenAt?: string | null;
}

/**
 * The four-state liveness chip.
 *
 * Liveness is derived at read time from `lastSeenAt`, so every state is reachable on any
 * refresh and an unknown/absent value has to render too: a device the backend sent without a
 * liveness is still a row somebody has to look at, so it falls back to a neutral tag with the
 * raw value rather than disappearing.
 */
const LivenessChip: React.FC<Props> = ({ liveness, lastSeenAt }) => {
  if (!liveness) return <span className={styles.healthAbsent}>—</span>;

  const key = String(liveness).toUpperCase();
  const meta = LIVENESS_META[key];
  const dotClass = meta ? styles[meta.className] : styles.liveStale;

  const chip = (
    <Tag color={TAG_COLOR[key as Liveness]} className={styles.livenessChip}>
      <i className={`${styles.liveDot} ${dotClass ?? ''}`} />
      {meta?.label ?? key}
    </Tag>
  );

  // `undefined` = the caller passed no last-seen at all, so there is nothing to say on hover.
  // `null` = the backend sent one and it is empty, which is the interesting case: a device that
  // has never heartbeated. That gets its own words rather than "Last seen —".
  if (lastSeenAt === undefined) return chip;
  const title = lastSeenAt ? `Last seen ${fromNowSafe(lastSeenAt)}` : 'Never seen — this device has not heartbeated';
  return <Tooltip title={title}>{chip}</Tooltip>;
};

export default LivenessChip;
