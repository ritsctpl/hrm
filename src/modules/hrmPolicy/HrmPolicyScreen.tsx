"use client";

import React, { useEffect } from "react";
import { Button, Space, Typography, Tag, Divider, message, Spin } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import { PolicyDocument } from "./types/domain.types";
import { useHrmPolicyStore } from "./stores/hrmPolicyStore";
import { HrmPolicyService } from "./services/hrmPolicyService";
import PolicyContentRenderer from "./components/organisms/PolicyContentRenderer";
import VersionHistorySidebar from "./components/organisms/VersionHistorySidebar";
import AcknowledgmentTracker from "./components/organisms/AcknowledgmentTracker";
import PolicyTypeBadge from "./components/atoms/PolicyTypeBadge";
import PolicyStatusTag from "./components/atoms/PolicyStatusTag";
import { POLICY_HR_ROLES } from "./utils/constants";
import styles from "./styles/PolicyViewer.module.css";

interface HrmPolicyScreenProps {
  policy: PolicyDocument;
  loading?: boolean;
  onBack: () => void;
}

const HrmPolicyScreen: React.FC<HrmPolicyScreenProps> = ({ policy, loading = false, onBack }) => {
  const cookies = parseCookies();
  const site = cookies.site ?? "RITS";
  const role = cookies.userRole ?? "EMPLOYEE";
  const canAdmin = POLICY_HR_ROLES.includes(role);

  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);

  const {
    versionHistory,
    versionHistoryLoading,
    ackReport,
    ackReportLoading,
    setVersionHistory,
    setVersionHistoryLoading,
    setAckReport,
    setAckReportLoading,
  } = useHrmPolicyStore();

  // Create blob URL for PDF
  useEffect(() => {
    if (policy.pdfBase64) {
      try {
        // Clean the base64 string - remove any whitespace, newlines, or data URL prefix
        let base64String = policy.pdfBase64.trim();
        
        // Remove data URL prefix if present
        if (base64String.startsWith('data:')) {
          base64String = base64String.split(',')[1];
        }
        
        // Decode base64 to binary string
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob and URL
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        // Cleanup
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error('Error creating PDF blob:', error);
        message.error('Failed to load PDF document. The PDF data may be corrupted.');
        setPdfUrl(null);
      }
    } else {
      setPdfUrl(null);
    }
  }, [policy.pdfBase64]);

  useEffect(() => {
    const loadHistory = async () => {
      setVersionHistoryLoading(true);
      try {
        const data = await HrmPolicyService.getVersionHistory({ site, policyHandle: policy.handle });
        setVersionHistory(data);
      } catch {
        // silent
      } finally {
        setVersionHistoryLoading(false);
      }
    };
    loadHistory();

    if (canAdmin) {
      const loadReport = async () => {
        setAckReportLoading(true);
        try {
          const data = await HrmPolicyService.getAcknowledgmentReport({ site, policyHandle: policy.handle });
          setAckReport(data);
        } catch {
          // silent
        } finally {
          setAckReportLoading(false);
        }
      };
      loadReport();
    }
  }, [policy.handle, site, canAdmin]);

  const handleSendReminder = async () => {
    // Note: The backend has waiveAcknowledgment, not a "send reminder" endpoint.
    // This would need a separate backend endpoint or notification service.
    message.info("Reminder functionality requires backend notification service");
  };

  return (
    <div className={styles.viewerLayout}>
      <div className={styles.viewerMain}>
        <Button icon={<ArrowLeftOutlined />} type="link" onClick={onBack} style={{ paddingLeft: 0 }}>
          Back to List
        </Button>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Loading policy details..." />
          </div>
        ) : (
          <>
            <Space direction="vertical" size={4} style={{ width: "100%", marginBottom: 16 }}>
              <Space wrap>
                <PolicyTypeBadge docType={policy.documentType} />
                <PolicyStatusTag status={policy.status} />
              </Space>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {policy.title}
              </Typography.Title>
              <Space split={<Divider type="vertical" />} wrap>
                <Typography.Text type="secondary">Version {policy.currentVersion}</Typography.Text>
                {policy.createdBy && <Typography.Text type="secondary">Owner: {policy.createdBy}</Typography.Text>}
                {policy.effectiveFrom && (
                  <Typography.Text type="secondary">
                    Effective: {new Date(policy.effectiveFrom).toLocaleDateString("en-IN")}
                  </Typography.Text>
                )}
                {policy.reviewDate && (
                  <Typography.Text type="secondary">
                    Next Review: {new Date(policy.reviewDate).toLocaleDateString("en-IN")}
                  </Typography.Text>
                )}
              </Space>
              {policy.tags && policy.tags.length > 0 && (
                <Space wrap>
                  {policy.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </Space>
              )}
            </Space>

            <PolicyContentRenderer
              content={policy.textContent}
              contentType="html"
            />

            {policy.pdfBase64 && (
              <>
                <Divider />
                <div className={styles.pdfViewerSection}>
                  <Space style={{ marginBottom: 12 }}>
                    <Typography.Text strong>Policy Document (PDF)</Typography.Text>
                    {/* {pdfUrl && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = pdfUrl;
                          link.download = `${policy.policyCode}_${policy.title}.pdf`;
                          link.click();
                        }}
                      >
                        Download PDF
                      </Button>
                    )} */}
                  </Space>
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className={styles.pdfFrame}
                      title="Policy PDF Document"
                    />
                  ) : (
                    <div className={styles.pdfError}>
                      <Typography.Text type="danger">
                        Unable to display PDF. The document may be corrupted or in an invalid format.
                      </Typography.Text>
                    </div>
                  )}
                </div>
              </>
            )}

            {policy.attachments && policy.attachments.length > 0 && (
              <>
                <Divider />
                <Typography.Text strong>Attachments</Typography.Text>
                <Space direction="vertical" size={4}>
                  {policy.attachments.map((att) => (
                    <Button
                      key={att.id}
                      type="link"
                      icon={<DownloadOutlined />}
                      href={att.fileUrl}
                      target="_blank"
                      style={{ padding: 0 }}
                    >
                      {att.fileName}
                    </Button>
                  ))}
                </Space>
              </>
            )}

            {/* {canAdmin && ackReport && (
              <AcknowledgmentTracker
                report={ackReport}
                loading={ackReportLoading}
                onSendReminder={handleSendReminder}
              />
            )} */}
          </>
        )}
      </div>

      {/* <div className={styles.viewerSidebar}>
        <VersionHistorySidebar
          versions={versionHistory}
          currentVersion={policy.currentVersion}
          loading={versionHistoryLoading}
        />
      </div> */}
    </div>
  );
};

export default HrmPolicyScreen;
