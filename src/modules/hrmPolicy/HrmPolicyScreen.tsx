"use client";

import React, { useEffect } from "react";
import { Button, Space, Typography, Tag, Divider, Alert, Checkbox, message } from "antd";
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
  onBack: () => void;
}

const HrmPolicyScreen: React.FC<HrmPolicyScreenProps> = ({ policy, onBack }) => {
  const cookies = parseCookies();
  const site = cookies.site ?? "RITS";
  const employeeId = cookies.userId ?? "";
  const role = cookies.userRole ?? "EMPLOYEE";
  const canAdmin = POLICY_HR_ROLES.includes(role);

  const {
    versionHistory,
    versionHistoryLoading,
    ackReport,
    ackReportLoading,
    acknowledging,
    setVersionHistory,
    setVersionHistoryLoading,
    setAckReport,
    setAckReportLoading,
    setAcknowledging,
    updatePolicyAckStatus,
  } = useHrmPolicyStore();

  const [ackChecked, setAckChecked] = React.useState(false);

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

  const handleAcknowledge = async () => {
    if (!ackChecked) {
      message.warning("Please check the acknowledgment checkbox first");
      return;
    }
    setAcknowledging(true);
    try {
      await HrmPolicyService.acknowledgePolicy({
        site,
        policyHandle: policy.handle,
        employeeId,
        acknowledgedVia: "WEB",
      });
      const ackDate = new Date().toISOString();
      updatePolicyAckStatus(policy.handle, ackDate);
      message.success("Policy acknowledged successfully");
    } catch {
      message.error("Failed to acknowledge policy");
    } finally {
      setAcknowledging(false);
    }
  };

  const handleSendReminder = async () => {
    // Note: The backend has waiveAcknowledgment, not a "send reminder" endpoint.
    // This would need a separate backend endpoint or notification service.
    message.info("Reminder functionality requires backend notification service");
  };

  const isAcknowledged = policy.ackStatus === "ACKNOWLEDGED";

  return (
    <div className={styles.viewerLayout}>
      <div className={styles.viewerMain}>
        <Button icon={<ArrowLeftOutlined />} type="link" onClick={onBack} style={{ paddingLeft: 0 }}>
          Back to List
        </Button>
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

        {policy.ackStatus === "PENDING" || policy.ackStatus === "OVERDUE" ? (
          <div className={styles.ackBanner}>
            <Alert
              type={policy.ackStatus === "OVERDUE" ? "error" : "warning"}
              message="Acknowledgment Required"
              description="This policy requires your acknowledgment."
              showIcon
              style={{ marginBottom: 12 }}
            />
            <Checkbox
              checked={ackChecked}
              onChange={(e) => setAckChecked(e.target.checked)}
            >
              I have read, understood, and agree to comply with this policy.
            </Checkbox>
            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                onClick={handleAcknowledge}
                loading={acknowledging}
                disabled={!ackChecked}
              >
                Acknowledge Policy
              </Button>
            </div>
          </div>
        ) : isAcknowledged ? (
          <div className={styles.ackBannerSuccess}>
            <Alert
              type="success"
              message={`You acknowledged this policy on ${policy.acknowledgedAt ? new Date(policy.acknowledgedAt).toLocaleDateString("en-IN") : ""} (v${policy.currentVersion}).`}
              showIcon
            />
          </div>
        ) : null}

        {canAdmin && ackReport && (
          <AcknowledgmentTracker
            report={ackReport}
            loading={ackReportLoading}
            onSendReminder={handleSendReminder}
          />
        )}
      </div>

      <div className={styles.viewerSidebar}>
        <VersionHistorySidebar
          versions={versionHistory}
          currentVersion={policy.currentVersion}
          loading={versionHistoryLoading}
        />
      </div>
    </div>
  );
};

export default HrmPolicyScreen;
