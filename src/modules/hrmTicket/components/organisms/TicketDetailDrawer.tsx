'use client';

import React, { useState } from 'react';
import { Button, Descriptions, Drawer, Rate, Skeleton, Space, Tag, Tooltip } from 'antd';
import TicketStatusTag from '../atoms/TicketStatusTag';
import TicketPriorityTag from '../atoms/TicketPriorityTag';
import SlaBadge from '../atoms/SlaBadge';
import TicketCommentThread from './TicketCommentThread';
import AttachmentChips from '../molecules/AttachmentChips';
import AttachmentPreviewModal from './AttachmentPreviewModal';
import type { Ticket, TicketAttachment, TicketStatus } from '../../types/domain.types';
import type { TicketActionKind } from '../../types/ui.types';
import { displayNameOnly, formatBytes, formatDateTime, isTerminal } from '../../utils/ticketHelpers';

interface Props {
  open: boolean;
  ticket: Ticket | null;
  loading: boolean;
  posting: boolean;
  onClose: () => void;
  onAction: (kind: TicketActionKind) => void;
  onClaim: (ticketNumber: string) => void;
  onEdit: (ticket: Ticket) => void;
  onPostComment: (
    body: string,
    internal: boolean,
    files: File[],
    statusAfterComment?: TicketStatus,
  ) => Promise<boolean>;
  onDownload: (attachmentId: string, fileName: string) => void;
  /** Fetches the bytes for the preview; detail reads never carry them. */
  onFetchAttachment: (attachmentId: string) => Promise<string | undefined>;
}

/**
 * The ticket in full: header, facts, attachments, and the thread.
 *
 * Every button here is driven by a `can*` flag the server computed. The alternative — deriving
 * them from status and assignee in the component — cannot see whether the viewer agents for the
 * ticket's group, and would let the UI offer actions the backend then refuses.
 */
const TicketDetailDrawer: React.FC<Props> = ({
  open,
  ticket,
  loading,
  posting,
  onClose,
  onAction,
  onClaim,
  onEdit,
  onPostComment,
  onDownload,
  onFetchAttachment,
}) => {
  const [preview, setPreview] = useState<TicketAttachment | null>(null);
  const [previewContent, setPreviewContent] = useState<string | undefined>();
  const [previewLoading, setPreviewLoading] = useState(false);

  /** Bytes are fetched per open rather than cached — a queue of screenshots would pile up in memory. */
  const openPreview = async (attachment: TicketAttachment) => {
    setPreview(attachment);
    setPreviewContent(undefined);
    setPreviewLoading(true);
    try {
      setPreviewContent(await onFetchAttachment(attachment.attachmentId));
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
  <Drawer
    open={open}
    onClose={onClose}
    width={720}
    destroyOnHidden
    title={
      ticket ? (
        <Space size={10} wrap>
          <strong>{ticket.ticketNumber}</strong>
          <TicketStatusTag status={ticket.status} />
          <TicketPriorityTag priority={ticket.priority} />
          {ticket.autoClosed ? (
            <Tooltip title="Closed automatically after the review window passed with no response">
              <Tag>Auto-closed</Tag>
            </Tooltip>
          ) : null}
        </Space>
      ) : (
        'Ticket'
      )
    }
    styles={{ body: { display: 'flex', flexDirection: 'column', paddingTop: 12 } }}
  >
    {loading && !ticket ? (
      <Skeleton active paragraph={{ rows: 8 }} />
    ) : !ticket ? (
      <div style={{ color: '#8c8c8c' }}>This ticket could not be loaded.</div>
    ) : (
      <>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{ticket.subject}</div>

        <div
          style={{
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
          }}
        >
          {ticket.description}
        </div>

        {ticket.attachments?.length ? (
          <div style={{ marginBottom: 12 }}>
            <AttachmentChips
              attachments={ticket.attachments}
              onPreview={openPreview}
              onDownload={(a) => onDownload(a.attachmentId, a.fileName)}
            />
          </div>
        ) : null}

        <Descriptions
          size="small"
          column={2}
          bordered
          style={{ marginBottom: 12 }}
          labelStyle={{ width: 110, fontSize: 12 }}
          contentStyle={{ fontSize: 12 }}
        >
          <Descriptions.Item label="Category">
            {ticket.categoryName ?? ticket.categoryCode ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Queue">
            {ticket.supportGroupName ?? ticket.supportGroupCode ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Raised by">
            {displayNameOnly(ticket.raisedByName)}
            {ticket.onBehalfOfName ? (
              <span style={{ color: '#8c8c8c' }}>
                {' '}
                on behalf of {displayNameOnly(ticket.onBehalfOfName)}
              </span>
            ) : null}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned to">
            {ticket.assignedToName ? (
              displayNameOnly(ticket.assignedToName)
            ) : (
              <span style={{ color: '#bfbfbf' }}>Unassigned</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Raised">{formatDateTime(ticket.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="SLA">
            <SlaBadge
              minutesRemaining={ticket.minutesToResolutionDue}
              dueAt={ticket.resolutionDueAt}
              breached={ticket.resolutionSlaBreached || ticket.responseSlaBreached}
              paused={ticket.slaClockPaused}
            />
          </Descriptions.Item>
          {ticket.tags?.length ? (
            <Descriptions.Item label="Tags" span={2}>
              {ticket.tags.map((tag) => (
                <Tag key={tag} style={{ marginBottom: 2 }}>
                  {tag}
                </Tag>
              ))}
            </Descriptions.Item>
          ) : null}
          {ticket.watcherNames?.length ? (
            <Descriptions.Item label="Watching" span={2}>
              {ticket.watcherNames.map(displayNameOnly).join(', ')}
            </Descriptions.Item>
          ) : null}
          {ticket.resolutionNotes ? (
            <Descriptions.Item label="Resolution" span={2}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{ticket.resolutionNotes}</div>
              <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                {displayNameOnly(ticket.resolvedByName)} · {formatDateTime(ticket.resolvedAt)}
              </div>
            </Descriptions.Item>
          ) : null}
          {ticket.cancellationReason ? (
            <Descriptions.Item label="Cancelled" span={2}>
              {ticket.cancellationReason}
            </Descriptions.Item>
          ) : null}
          {ticket.satisfactionRating ? (
            <Descriptions.Item label="Rating" span={2}>
              <Rate disabled value={ticket.satisfactionRating} style={{ fontSize: 14 }} />
              {ticket.satisfactionComment ? (
                <span style={{ marginLeft: 8, color: '#8c8c8c' }}>
                  {ticket.satisfactionComment}
                </span>
              ) : null}
            </Descriptions.Item>
          ) : null}
        </Descriptions>

        <Space wrap style={{ marginBottom: 12 }}>
          {ticket.viewerIsAgent && !ticket.assignedToCode ? (
            <Button size="small" onClick={() => onClaim(ticket.ticketNumber)}>
              Claim
            </Button>
          ) : null}
          {ticket.canAssign ? (
            <Button size="small" onClick={() => onAction('assign')}>
              {ticket.assignedToCode ? 'Reassign' : 'Assign'}
            </Button>
          ) : null}
          {ticket.viewerIsAgent && !isTerminal(ticket.status) ? (
            <Button size="small" onClick={() => onAction('hold')}>
              Change status
            </Button>
          ) : null}
          {ticket.canResolve ? (
            <Button size="small" type="primary" onClick={() => onAction('resolve')}>
              Resolve
            </Button>
          ) : null}
          {ticket.canReopen ? (
            <Button size="small" onClick={() => onAction('reopen')}>
              Reopen
            </Button>
          ) : null}
          {ticket.canRate ? (
            <Button size="small" onClick={() => onAction('rate')}>
              Rate
            </Button>
          ) : null}
          {ticket.canClose ? (
            <Button size="small" onClick={() => onAction('close')}>
              Close
            </Button>
          ) : null}
          {ticket.canEdit ? (
            <Button size="small" onClick={() => onEdit(ticket)}>
              Edit
            </Button>
          ) : null}
          {ticket.canCancel ? (
            <Button size="small" danger onClick={() => onAction('cancel')}>
              Cancel ticket
            </Button>
          ) : null}
        </Space>

        <div style={{ flex: 1, minHeight: 260, display: 'flex', flexDirection: 'column' }}>
          <TicketCommentThread
            comments={ticket.comments ?? []}
            ticketNumber={ticket.ticketNumber}
            canComment={Boolean(ticket.canComment)}
            isAgent={Boolean(ticket.viewerIsAgent)}
            posting={posting}
            onPost={onPostComment}
            onDownload={onDownload}
            onPreview={openPreview}
          />
        </div>
      </>
    )}

    <AttachmentPreviewModal
      attachment={preview}
      contentBase64={previewContent}
      loading={previewLoading}
      onClose={() => setPreview(null)}
      onDownload={() => preview && onDownload(preview.attachmentId, preview.fileName)}
    />
  </Drawer>
  );
};

export default TicketDetailDrawer;
