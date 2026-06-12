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
  const [blobType, setBlobType] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
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

    // Clear stale preview/name so the prior receipt can't flash or be
    // downloaded while the next one loads.
    setBlobUrl(null);
    setBlobType("");
    setFileName("");
    setLoading(true);
    
    HrmExpenseService.downloadReceipt({
      organizationId: getOrganizationId(),
      expenseId,
      lineIndex,
      attachmentRef: attachmentIds[index],
    })
      .then(({ blob, fileName: name }) => {
        if (revoked) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setBlobType(blob.type || "");
        setFileName(name || "");
      })
      .catch((error) => {
        if (!revoked) {
          console.error("Receipt download error:", error);
          message.error(extractExpenseError(error, "Failed to load receipt."));
        }
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });
    
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, attachmentIds, index, expenseId, lineIndex]);

  const total = attachmentIds.length;
  const canPrev = total > 1 && index > 0;
  const canNext = total > 1 && index < total - 1;

  const handleDownload = () => {
    if (!blobUrl) return;

    try {
      // Prefer the BE-provided file name (keeps the real extension so the
      // OS opens it correctly). Fall back to a name derived from the MIME
      // type when the BE didn't send one.
      const extFromType = blobType.includes("/") ? blobType.split("/")[1] : "";
      const fallback = `receipt-${index + 1}${extFromType ? `.${extFromType}` : ""}`;
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || fallback;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      message.error("Failed to download receipt");
    }
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
          <Text ellipsis style={{ maxWidth: "50vw" }}>
            {fileName || `Receipt${total > 1 ? ` ${index + 1} of ${total}` : ""}`}
            {fileName && total > 1 ? ` (${index + 1} of ${total})` : ""}
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
              zIndex: 1,
            }}
          >
            <Spin size="large" />
          </div>
        )}
        {blobUrl && !loading && (
          (() => {
            // Pick the renderer by MIME. An <iframe> with no/unknown type
            // shows raw bytes as text in Chrome — the original bug. <img>
            // for image/*, <iframe> for application/pdf, otherwise show a
            // download fallback so the user can still save the file.
            const isImage = blobType.startsWith("image/");
            const isPdf = blobType === "application/pdf";
            if (isImage) {
              return (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "auto",
                    padding: 16,
                  }}
                >
                  <img
                    key={blobUrl}
                    src={blobUrl}
                    alt="Receipt"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    onError={() => {
                      console.error("Image render failed; type=", blobType);
                      message.error("Failed to display receipt");
                    }}
                  />
                </div>
              );
            }
            if (isPdf) {
              return (
                <iframe
                  key={blobUrl}
                  src={blobUrl}
                  title="Receipt preview"
                  style={{ width: "100%", height: "100%", border: "none" }}
                  onError={(e) => {
                    console.error("Iframe error:", e);
                    message.error("Failed to display receipt");
                  }}
                />
              );
            }
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 12,
                  color: "#595959",
                }}
              >
                <Text>Preview not available for this file type{blobType ? ` (${blobType})` : ""}.</Text>
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download to view
                </Button>
              </div>
            );
          })()
        )}
        {!blobUrl && !loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#999",
            }}
          >
            <Text>No receipt to display</Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReceiptPreviewModal;