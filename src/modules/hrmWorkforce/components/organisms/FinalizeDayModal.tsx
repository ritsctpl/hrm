'use client';

import React, { useState } from 'react';
import { Alert, DatePicker, Modal, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { AttendanceQuery } from '../../types/ui.types';
import { MAX_RANGE_DAYS } from '../../utils/workforceConstants';
import styles from '../../styles/Workforce.module.css';

const { Text } = Typography;

/** The wire format for every workforce date field. */
const ISO = 'YYYY-MM-DD';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * The attendance range that must be on screen for a freshly finalized `date` to be visible, or
 * `null` when the range already covers it.
 *
 * <b>Why this exists.</b> `finalize(date)` re-derives one day and then reloads attendance over the
 * range *stored in the store* — not over the day it just wrote. Finalize 2026-08-26 while the
 * table is showing last month and the run succeeds, the toast reports real counts, and the table
 * refreshes to exactly the rows it already had: the operator's only evidence is that nothing
 * changed, which reads as a failure. So the range is moved to include the day *before* the run.
 *
 * <b>Widen when it is cheap, snap when it is not.</b> Extending the current window keeps the
 * surrounding days the operator was looking at, but the backend rejects a range longer than
 * `MAX_RANGE_DAYS` — so a day far outside the window collapses the range to that single day rather
 * than producing a request that 400s. Pure and exported so the behaviour can be reasoned about (and
 * tested) without a modal.
 *
 * ISO `YYYY-MM-DD` strings compare lexicographically in date order, which is why the containment
 * test needs no parsing; the span, which does, is measured with dayjs.
 */
export function rangeIncluding(query: AttendanceQuery, date: string): AttendanceQuery | null {
  // Both bounds must be present strings before anything is compared: `dayjs(undefined)` is *now*,
  // and a missing bound that silently parsed as today would widen the range to a window nobody
  // asked for. A range that will not parse cannot be widened meaningfully either — in both cases
  // the single day is the honest window, and it is the one the operator just asked about.
  const parsable =
    typeof query?.from === 'string' &&
    typeof query?.to === 'string' &&
    dayjs(query.from, ISO).isValid() &&
    dayjs(query.to, ISO).isValid();
  if (!parsable) return { ...query, from: date, to: date };

  if (date >= query.from && date <= query.to) return null;

  const from = date < query.from ? date : query.from;
  const to = date > query.to ? date : query.to;
  const span = dayjs(to, ISO).diff(dayjs(from, ISO), 'day') + 1;
  return span <= MAX_RANGE_DAYS ? { ...query, from, to } : { ...query, from: date, to: date };
}

/**
 * "Finalize day": re-derive one site-day of attendance from the machines that reported.
 *
 * <b>One day, not a range</b> — mirroring the backend endpoint, which finalizes a single date. The
 * nightly sweep does this unattended; this modal exists for the day it did not run, or a day whose
 * agents reported late.
 *
 * <b>The range is moved before the run, and the operator is told before they confirm.</b> See
 * `rangeIncluding` for why. The notice is rendered as soon as the date is picked rather than after
 * the fact, because a date range that changes underneath a table is otherwise indistinguishable
 * from a table that lost its filter.
 *
 * <b>Toasts are not duplicated.</b> `useHrmWorkforceData.finalize` already reports the outcome
 * verbatim — the counts on a real derivation, a warning when the site has no working calendar for
 * that day, the backend's own sentence on failure. This modal adds exactly one toast, and only for
 * `alreadyFinalized`: that is the case the hook reports as a success carrying counts which, on a
 * day nobody re-derived, are zeros — "0 device(s) read" is a real and different finding, so the
 * day being already settled has to be said out loud.
 *
 * <b>A failed run keeps the modal open.</b> The result is `undefined` there and is never
 * dereferenced; the durable store error is shown inline so the operator can fix the date and retry
 * without reopening.
 */
const FinalizeDayModal: React.FC<Props> = ({ open, onClose }) => {
  const { finalize } = useHrmWorkforceData();
  const attendanceQuery = useHrmWorkforceStore((s) => s.attendanceQuery);
  const setAttendanceQuery = useHrmWorkforceStore((s) => s.setAttendanceQuery);

  const [date, setDate] = useState<Dayjs>(dayjs());
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const iso = date.isValid() ? date.format(ISO) : '';
  const widened = iso ? rangeIncluding(attendanceQuery, iso) : null;

  const handleOk = async () => {
    if (!iso) return;
    setSubmitting(true);
    setFailure(null);

    // Written to the store first, so the reload inside `finalize` (which reads the stored range)
    // covers the day, and so the query bar visibly shows the window the table is about to hold.
    if (widened) setAttendanceQuery(widened);

    const result = await finalize(iso);

    setSubmitting(false);
    if (!result) {
      setFailure(
        useHrmWorkforceStore.getState().error ??
          `Finalize for ${iso} did not complete — the day may not have been re-derived.`,
      );
      return;
    }
    if (result.alreadyFinalized) {
      message.info(
        `${iso} was already finalized — the stored day is unchanged and nothing was re-derived.`,
      );
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Finalize day"
      okText="Finalize"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={submitting}
      // A re-derivation writes attendance records; closing it by clicking past the dialog is not
      // an intention anybody had.
      maskClosable={false}
      okButtonProps={{ disabled: !iso }}
      width={460}
    >
      <div className={styles.finalizeBody}>
        <Text type="secondary">
          Re-derives one day&apos;s attendance for this site from the machines that reported.
          The nightly sweep does this automatically — use it for a day it missed, or one whose
          agents reported late.
        </Text>

        <DatePicker
          value={date}
          onChange={(next) => {
            if (next) setDate(next);
            setFailure(null);
          }}
          allowClear={false}
          format="DD MMM YYYY"
          // A day that has not happened has no machine activity to derive from.
          disabledDate={(current) => !!current && current.isAfter(dayjs().endOf('day'))}
          style={{ width: '100%' }}
        />

        {widened ? (
          <Alert
            type="info"
            showIcon
            message="The attendance range will move to include this day"
            description={
              <span>
                {dayjs(widened.from, ISO).format('DD MMM YYYY')} →{' '}
                {dayjs(widened.to, ISO).format('DD MMM YYYY')} — otherwise the day you finalize
                would not be in the window on screen, and the table would look unchanged.
              </span>
            }
          />
        ) : null}

        {failure ? <Alert type="error" showIcon message="Finalize failed" description={failure} /> : null}
      </div>
    </Modal>
  );
};

export default FinalizeDayModal;
