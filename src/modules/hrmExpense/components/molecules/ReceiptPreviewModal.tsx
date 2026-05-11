"use client";

import React, { useEffect, useState } from "react";
import { Modal, Spin, Button, Space, Typography, message } from "antd";
import { LeftOutlined, RightOutlined, DownloadOutlined } from "@ant-design/icons";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmExpenseService } from "../../services/hrmExpenseService";
import { extractExpenseError } from "../../utils/extractExpenseError";

const { Text } = Typography;

interface Props {
  open: boolean;
  attachmentIds: string[];
  expenseId?: string;
  lineIndex?: number;
  initialIndex?: number;
  onClose: () => void;
}

const ReceiptPreviewModal: React.FC<Props> = ({
  open,
  attachmentIds,
  expenseId,
  lineIndex,
  initialIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open || !attachmentIds[index]) {
      setBlobUrl(null);
      return;
    }
    let revoked = false;
    let url: string | null = null;
    setLoading(true);
    HrmExpenseService.downloadReceipt({
      organizationId: getOrganizationId(),
      expenseId,
      lineIndex,
      attachmentRef: attachmentIds[index],
    })
      .then((blob) => {
        if (revoked) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((error) => {
        message.error(extractExpenseError(error, "Failed to load receipt."));
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, attachmentIds, index]);

  const total = attachmentIds.length;
  const canPrev = total > 1 && index > 0;
  const canNext = total > 1 && index < total - 1;

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `receipt-${index + 1}`;
    a.click();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80vw"
      style={{ top: 24 }}
      bodyStyle={{ padding: 0, height: "82vh", display: "flex", flexDirection: "column" }}
      title={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text>
            Receipt {total > 1 ? `${index + 1} of ${total}` : ""}
          </Text>
          <Space>
            {total > 1 && (
              <>
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  disabled={!canPrev}
                  onClick={() => setIndex((i) => i - 1)}
                />
                <Button
                  size="small"
                  icon={<RightOutlined />}
                  disabled={!canNext}
                  onClick={() => setIndex((i) => i + 1)}
                />
              </>
            )}
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!blobUrl}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Space>
        </Space>
      }
    >
      <div style={{ flex: 1, background: "#f5f5f5", position: "relative" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin size="large" />
          </div>
        )}
        {blobUrl && !loading && (
          <iframe
            key={blobUrl}
            src={blobUrl}
            title="Receipt preview"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        )}
      </div>
    </Modal>
  );
};

export default ReceiptPreviewModal;
