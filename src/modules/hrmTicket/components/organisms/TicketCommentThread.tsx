'use client';

import React, { useState } from 'react';
import { Button, Checkbox, Empty, Input, Select, Space, Tag, Tooltip, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { LockOutlined, UploadOutlined } from '@ant-design/icons';
import AttachmentChips from '../molecules/AttachmentChips';
import type { TicketComment, TicketStatus } from '../../types/domain.types';
import {
  AGENT_STATUS_OPTIONS,
  MAX_ATTACHMENTS_PER_POST,
  MAX_ATTACHMENT_BYTES,
} from '../../utils/ticketConstants';
import { displayNameOnly, formatBytes, formatDateTime, previewLocalFile } from '../../utils/ticketHelpers';

interface Props {
  comments: TicketComment[];
  ticketNumber: string;
  canComment: boolean;
  isAgent: boolean;
  posting: boolean;
  onPost: (
    body: string,
    internal: boolean,
    files: File[],
    statusAfterComment?: TicketStatus,
  ) => Promise<boolean>;
  onDownload: (attachmentId: string, fileName: string) => void;
  onPreview: (attachment: NonNullable<TicketComment['attachments']>[number]) => void;
}

/**
 * The ticket conversation: human replies and system events on one timeline.
 *
 * System entries are rendered as thin centred lines rather than message bubbles — they are the
 * spine of the story (raised, assigned, put on hold, resolved) and giving them the same visual
 * weight as a reply buries the actual conversation.
 *
 * The internal-note toggle is only rendered for agents. It is a display concern only: the backend
 * decides what "internal" means and strips those entries before a requester's response is built.
 */
const TicketCommentThread: React.FC<Props> = ({
  comments,
  ticketNumber,
  canComment,
  isAgent,
  posting,
  onPost,
  onDownload,
  onPreview,
}) => {
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [statusAfter, setStatusAfter] = useState<TicketStatus | undefined>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handlePost = async () => {
    if (!body.trim()) {
      message.warning('Write something first');
      return;
    }
    const files = fileList
      .map((item) => item.originFileObj as File)
      .filter((file): file is File => Boolean(file));
    const ok = await onPost(body.trim(), internal, files, statusAfter);
    if (ok) {
      setBody('');
      setInternal(false);
      setStatusAfter(undefined);
      setFileList([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {comments.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No activity yet" />
        ) : (
          comments.map((comment) =>
            comment.systemGenerated ? (
              <div
                key={comment.commentId}
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  color: '#8c8c8c',
                  margin: '10px 0',
                  padding: '0 12px',
                }}
              >
                <span style={{ background: '#fafafa', padding: '2px 10px', borderRadius: 10 }}>
                  {comment.body} · {formatDateTime(comment.createdAt)}
                </span>
              </div>
            ) : (
              <div
                key={comment.commentId}
                style={{
                  margin: '10px 0',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: comment.internal ? '#ffe58f' : '#f0f0f0',
                  background: comment.internal
                    ? '#fffbe6'
                    : comment.ownComment
                      ? '#f6ffed'
                      : '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    fontSize: 12,
                  }}
                >
                  <strong>{displayNameOnly(comment.authorName)}</strong>
                  {comment.authorIsAgent ? (
                    <Tag color="blue" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                      Agent
                    </Tag>
                  ) : null}
                  {comment.internal ? (
                    <Tooltip title="Visible to the support team only">
                      <Tag color="gold" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                        <LockOutlined /> Internal
                      </Tag>
                    </Tooltip>
                  ) : null}
                  <span style={{ marginLeft: 'auto', color: '#bfbfbf', fontSize: 11 }}>
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {comment.body}
                </div>
                <AttachmentChips
                  compact
                  attachments={comment.attachments}
                  onPreview={onPreview}
                  onDownload={(a) => onDownload(a.attachmentId, a.fileName)}
                />
              </div>
            ),
          )
        )}
      </div>

      {canComment ? (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
          <Input.TextArea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={internal ? 'Internal note — the requester will not see this' : 'Write a reply…'}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 8,
            }}
          >
            <Upload
              multiple
              fileList={fileList}
              beforeUpload={(file) => {
                if (file.size > MAX_ATTACHMENT_BYTES) {
                  message.error(`${file.name} exceeds ${formatBytes(MAX_ATTACHMENT_BYTES)}`);
                  return Upload.LIST_IGNORE;
                }
                if (fileList.length >= MAX_ATTACHMENTS_PER_POST) {
                  message.error(`Up to ${MAX_ATTACHMENTS_PER_POST} files per reply`);
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
              onChange={({ fileList: next }) => setFileList(next)}
              onPreview={(file) => previewLocalFile(file.originFileObj as File)}
            >
              <Button size="small" icon={<UploadOutlined />}>
                Attach
              </Button>
            </Upload>

            {isAgent ? (
              <>
                <Checkbox checked={internal} onChange={(e) => setInternal(e.target.checked)}>
                  <span style={{ fontSize: 12 }}>Internal note</span>
                </Checkbox>
                {/* Posting a reply and moving the ticket is one action for an agent — asking a
                    question almost always means PENDING_REQUESTER, and splitting it in two is how
                    tickets end up sitting in the wrong state. */}
                <Select
                  allowClear
                  size="small"
                  placeholder="Also set status"
                  value={statusAfter}
                  onChange={setStatusAfter}
                  options={AGENT_STATUS_OPTIONS}
                  style={{ width: 170 }}
                />
              </>
            ) : null}

            <Space style={{ marginLeft: 'auto' }}>
              <Button type="primary" size="small" loading={posting} onClick={handlePost}>
                {internal ? 'Add note' : 'Reply'}
              </Button>
            </Space>
          </div>
        </div>
      ) : (
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            paddingTop: 10,
            fontSize: 12,
            color: '#8c8c8c',
          }}
        >
          This ticket is closed. Reopen it if the issue persists.
        </div>
      )}
    </div>
  );
};

export default TicketCommentThread;
