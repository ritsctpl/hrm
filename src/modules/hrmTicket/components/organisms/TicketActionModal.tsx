'use client';

import React, { useEffect, useState } from 'react';
import { Input, Modal, Rate, Select, Typography } from 'antd';
import type { TicketStatus } from '../../types/domain.types';
import type { TicketActionKind } from '../../types/ui.types';
import { AGENT_STATUS_OPTIONS } from '../../utils/ticketConstants';

interface Props {
  kind: TicketActionKind;
  ticketNumber?: string;
  agents: string[];
  loading: boolean;
  onCancel: () => void;
  onConfirm: (payload: {
    assigneeCode?: string;
    status?: TicketStatus;
    note?: string;
    satisfactionRating?: number;
  }) => void;
}

/**
 * One modal for every transition that needs a word from the user.
 *
 * The transitions differ in what they collect, not in how they are presented, so they share a
 * dialog and vary by config. What does not vary: a note is mandatory wherever the backend requires
 * one. Resolving without notes, or cancelling without a reason, leaves the next person reading the
 * ticket with a state change and no explanation — which is the single most common complaint about
 * every helpdesk that made those fields optional.
 */
const CONFIG: Record<
  Exclude<TicketActionKind, null>,
  { title: string; okText: string; noteLabel?: string; noteRequired?: boolean; placeholder?: string }
> = {
  assign: { title: 'Assign ticket', okText: 'Assign', noteLabel: 'Note (optional)' },
  hold: {
    title: 'Change status',
    okText: 'Update',
    noteLabel: 'Reason',
    noteRequired: true,
    placeholder: 'Why is this being put on hold, or what are you waiting for?',
  },
  resolve: {
    title: 'Resolve ticket',
    okText: 'Resolve',
    noteLabel: 'Resolution',
    noteRequired: true,
    placeholder: 'What was wrong and what you did — the requester reads this.',
  },
  reopen: {
    title: 'Reopen ticket',
    okText: 'Reopen',
    noteLabel: 'What is still wrong?',
    noteRequired: true,
    placeholder: 'The agent needs to know what the resolution missed.',
  },
  close: { title: 'Close ticket', okText: 'Close', noteLabel: 'Closing note (optional)' },
  cancel: {
    title: 'Cancel ticket',
    okText: 'Cancel ticket',
    noteLabel: 'Reason',
    noteRequired: true,
    placeholder: 'Duplicate, raised in error, no longer needed…',
  },
  rate: { title: 'Rate this ticket', okText: 'Submit', noteLabel: 'Comment (optional)' },
};

const TicketActionModal: React.FC<Props> = ({
  kind,
  ticketNumber,
  agents,
  loading,
  onCancel,
  onConfirm,
}) => {
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState<string | undefined>();
  const [status, setStatus] = useState<TicketStatus | undefined>();
  const [rating, setRating] = useState<number>(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (kind) {
      setNote('');
      setAssignee(undefined);
      setStatus(undefined);
      setRating(0);
      setTouched(false);
    }
  }, [kind]);

  if (!kind) return null;
  const config = CONFIG[kind];

  const noteMissing = Boolean(config.noteRequired) && !note.trim();
  const assigneeMissing = kind === 'assign' && !assignee;
  const statusMissing = kind === 'hold' && !status;
  const ratingMissing = kind === 'rate' && rating < 1;
  const blocked = noteMissing || assigneeMissing || statusMissing || ratingMissing;

  const handleOk = () => {
    setTouched(true);
    if (blocked) return;
    onConfirm({
      assigneeCode: assignee,
      status,
      note: note.trim() || undefined,
      satisfactionRating: kind === 'rate' ? rating : undefined,
    });
  };

  return (
    <Modal
      open
      title={`${config.title}${ticketNumber ? ` · ${ticketNumber}` : ''}`}
      okText={config.okText}
      okButtonProps={{ loading, danger: kind === 'cancel' }}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      {kind === 'assign' ? (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>Assign to</Typography.Text>
          <Select
            showSearch
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Choose an agent from this queue"
            value={assignee}
            onChange={setAssignee}
            // Values are the composite "CODE - Name"; the backend parses the code out of it, so the
            // picker can show a name without the caller having to know the code.
            options={agents.map((agent) => ({ value: agent, label: agent }))}
            status={touched && assigneeMissing ? 'error' : undefined}
            notFoundContent="No agents in this support group"
          />
        </div>
      ) : null}

      {kind === 'hold' ? (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>New status</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Choose a status"
            value={status}
            onChange={setStatus}
            options={AGENT_STATUS_OPTIONS}
            status={touched && statusMissing ? 'error' : undefined}
          />
        </div>
      ) : null}

      {kind === 'rate' ? (
        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <Rate value={rating} onChange={setRating} />
          {touched && ratingMissing ? (
            <div style={{ color: '#cf1322', fontSize: 12, marginTop: 4 }}>
              Please choose a rating
            </div>
          ) : null}
        </div>
      ) : null}

      {config.noteLabel ? (
        <div>
          <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>
            {config.noteLabel}
          </Typography.Text>
          <Input.TextArea
            rows={4}
            style={{ marginTop: 4 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={config.placeholder}
            status={touched && noteMissing ? 'error' : undefined}
          />
          {touched && noteMissing ? (
            <div style={{ color: '#cf1322', fontSize: 12, marginTop: 4 }}>
              This is required — it is what the next person reading the ticket will see.
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
};

export default TicketActionModal;
