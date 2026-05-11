"use client";

import React, { useRef, useState } from "react";
import { Button, Tooltip, Space, Tag, Popconfirm, message } from "antd";
import { FileOutlined, UploadOutlined, CloseOutlined } from "@ant-design/icons";
import ReceiptPreviewModal from "./ReceiptPreviewModal";

interface Props {
  attachmentRefs: string[];
  expenseId?: string;
  lineIndex?: number;
  readonly?: boolean;
  onUpload?: (files: File[]) => void | Promise<void>;
  onDelete?: (attachmentId: string) => void | Promise<void>;
}

const LineReceiptStrip: React.FC<Props> = ({
  attachmentRefs,
  expenseId,
  lineIndex,
  readonly,
  onUpload,
  onDelete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const oversized = arr.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      message.error(`${oversized.name} exceeds 5 MB limit.`);
      return;
    }
    onUpload?.(arr);
  };

  return (
    <>
      <Space size={4} wrap>
        {attachmentRefs.map((ref, i) => (
          <Tag
            key={ref}
            icon={<FileOutlined />}
            color="blue"
            style={{ cursor: "pointer", marginInlineEnd: 0 }}
            closable={!readonly && !!onDelete}
            closeIcon={
              <Popconfirm
                title="Remove this receipt?"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDelete?.(ref);
                }}
                onCancel={(e) => e?.stopPropagation()}
              >
                <CloseOutlined onClick={(e) => e.stopPropagation()} />
              </Popconfirm>
            }
            onClick={() => openPreview(i)}
          >
            #{i + 1}
          </Tag>
        ))}
        {!readonly && onUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Tooltip title="Upload receipts (PDF / image, max 5 MB each)">
              <Button
                type="link"
                size="small"
                icon={<UploadOutlined />}
                onClick={() => inputRef.current?.click()}
                style={{ padding: 0 }}
              >
                {attachmentRefs.length === 0 ? "Add receipt" : "Add"}
              </Button>
            </Tooltip>
          </>
        )}
        {readonly && attachmentRefs.length === 0 && (
          <span style={{ fontSize: 12, color: "#8c8c8c" }}>No receipts</span>
        )}
      </Space>
      <ReceiptPreviewModal
        open={previewOpen}
        attachmentIds={attachmentRefs}
        expenseId={expenseId}
        lineIndex={lineIndex}
        initialIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
};

export default LineReceiptStrip;
