"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  HomeOutlined,
  InboxOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import type { LeavePermissions } from "../../types/ui.types";
import type { LeaveRequest, LeaveRequestStatus } from "../../types/api.types";
import { LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS } from "../../utils/constants";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Dragger } = Upload;

/** WFH leave type code as configured in the backend */
const WFH_CODE = "WFH";
/** Policy limit: warn when monthly WFH days exceed this */
const WFH_MONTHLY_LIMIT = 8;

// ── Types ────────────────────────────────────────────────────────────────────

interface WFHManagementTabProps {
  organizationId: string;
  employeeId: string;
  permissions: LeavePermissions;
  showApprovalInbox?: boolean;
  onWFHSubmitted?: () => void;
}

interface WFHFormValues {
  fromDate: Dayjs;
  toDate: Dayjs;
  reason: string;
  workPlan: string;
}

interface AttachmentItem {
  name: string;
  base64: string;
  contentType: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusTag(status: LeaveRequestStatus) {
  const color = LEAVE_STATUS_COLORS[status] ?? "default";
  const label = LEAVE_STATUS_LABELS[status] ?? status;
  return <Tag color={color}>{label}</Tag>;
}

function formatDate(iso: string) {
  return dayjs(iso).format("DD MMM YYYY");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Count total WFH days from a list of approved/pending requests that fall
 * within a given calendar month (zero-indexed, as returned by dayjs().month()).
 */
function countWfhDaysInMonth(
  requests: LeaveRequest[],
  year: number,
  month: number,
): number {
  return requests
    .filter((r) => {
      if (r.status === "REJECTED" || r.status === "CANCELLED") return false;
      const start = dayjs(r.startDate);
      const end = dayjs(r.endDate);
      // Any overlap with the target month counts
      const monthStart = dayjs().year(year).month(month).startOf("month");
      const monthEnd = dayjs().year(year).month(month).endOf("month");
      return !(end.isBefore(monthStart, "day") || start.isAfter(monthEnd, "day"));
    })
    .reduce((acc, r) => acc + (r.totalDays ?? 0), 0);
}

/**
 * Count total WFH days from a list of approved/pending requests that fall
 * within the current calendar year.
 */
function countWfhDaysInYear(requests: LeaveRequest[], year: number): number {
  return requests
    .filter((r) => {
      if (r.status === "REJECTED" || r.status === "CANCELLED") return false;
      return dayjs(r.startDate).year() === year || dayjs(r.endDate).year() === year;
    })
    .reduce((acc, r) => acc + (r.totalDays ?? 0), 0);
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface WFHSummaryCardProps {
  monthDays: number;
  yearDays: number;
  currentMonth: string;
  currentYear: number;
}

const WFHSummaryCard: React.FC<WFHSummaryCardProps> = ({
  monthDays,
  yearDays,
  currentMonth,
  currentYear,
}) => {
  const overLimit = monthDays > WFH_MONTHLY_LIMIT;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: overLimit ? "#fff7e6" : "#f6ffed",
        border: `1px solid ${overLimit ? "#ffd591" : "#b7eb8f"}`,
        borderRadius: 8,
      }}
    >
      <Row gutter={16} align="middle">
        <Col flex="none">
          <HomeOutlined
            style={{
              fontSize: 28,
              color: overLimit ? "#fa8c16" : "#52c41a",
            }}
          />
        </Col>
        <Col flex="auto">
          <Row gutter={24}>
            <Col>
              <Statistic
                title={`WFH Days — ${currentMonth}`}
                value={monthDays}
                suffix="days"
                valueStyle={{
                  fontSize: 20,
                  color: overLimit ? "#fa8c16" : "#389e0d",
                }}
              />
            </Col>
            <Col>
              <Statistic
                title={`WFH Days — ${currentYear}`}
                value={yearDays}
                suffix="days"
                valueStyle={{ fontSize: 20, color: "#1890ff" }}
              />
            </Col>
            <Col>
              <Statistic
                title="Monthly Limit"
                value={WFH_MONTHLY_LIMIT}
                suffix="days"
                valueStyle={{ fontSize: 20, color: "#8c8c8c" }}
              />
            </Col>
          </Row>
        </Col>
        {overLimit && (
          <Col flex="none">
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={`Monthly WFH limit exceeded by ${(monthDays - WFH_MONTHLY_LIMIT).toFixed(1)} day(s)`}
              style={{ padding: "4px 12px" }}
            />
          </Col>
        )}
      </Row>
    </Card>
  );
};

// ── WFH Request Form (inline, not a drawer) ──────────────────────────────────

interface WFHApplyFormProps {
  organizationId: string;
  employeeId: string;
  onCancel: () => void;
  onSubmitted: () => void;
}

const WFHApplyForm: React.FC<WFHApplyFormProps> = ({
  organizationId,
  employeeId,
  onCancel,
  onSubmitted,
}) => {
  const [form] = Form.useForm<WFHFormValues>();
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftHandle, setDraftHandle] = useState<string | null>(null);

  const identity = useEmployeeIdentity();
  const cookies = parseCookies();

  // Resolve the composite employee id used by the leave service
  const compositeEmployeeId = useMemo(() => {
    return identity.employeeIdWithName || cookies.employeeId || cookies.userId || employeeId;
  }, [identity.employeeIdWithName, cookies.employeeId, cookies.userId, employeeId]);

  const handleBeforeUpload = async (file: File) => {
    const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) {
      message.error("Only image or PDF files are allowed");
      return false;
    }
    if (file.size / 1024 / 1024 >= 5) {
      message.error("File must be smaller than 5 MB");
      return false;
    }
    try {
      const base64 = await fileToBase64(file);
      setAttachments((prev) => [
        ...prev,
        { name: file.name, base64, contentType: file.type || "application/octet-stream" },
      ]);
      message.success(`${file.name} attached`);
    } catch {
      message.error("Failed to read file");
    }
    return false; // prevent antd auto-upload
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  // Validate that toDate >= fromDate
  const validateDateRange = (_: unknown, toDate: Dayjs) => {
    const fromDate: Dayjs = form.getFieldValue("fromDate");
    if (!fromDate || !toDate) return Promise.resolve();
    if (toDate.isBefore(fromDate, "day")) {
      return Promise.reject(new Error("To Date must be on or after From Date"));
    }
    return Promise.resolve();
  };

  const buildPayload = (values: WFHFormValues, handle?: string) => {
    const fromDate = values.fromDate.format("YYYY-MM-DD");
    const toDate = values.toDate.format("YYYY-MM-DD");
    const diffDays = values.toDate.diff(values.fromDate, "day") + 1;

    return {
      organizationId,
      employeeId: compositeEmployeeId,
      leaveTypeCode: WFH_CODE,
      startDate: fromDate,
      endDate: toDate,
      startDayType: "FULL" as const,
      endDayType: "FULL" as const,
      totalDays: diffDays,
      reason: values.reason,
      // Work plan goes into reason as extra context since the API has no
      // dedicated workPlan field — format as "Reason | Work Plan: ..."
      createdBy: compositeEmployeeId,
      attachments: attachments.map((a) => ({
        name: a.name,
        contentType: a.contentType,
        contentBase64: a.base64,
      })),
      ...(handle ? { handle } : {}),
    };
  };

  const handleSaveDraft = async () => {
    let values: WFHFormValues;
    try {
      values = await form.validateFields(["fromDate", "toDate"]);
    } catch {
      message.warning("Please fill in the date fields before saving a draft");
      return;
    }

    if (!identity.isReady) {
      message.error("Employee identity not resolved yet — please retry");
      return;
    }

    setSavingDraft(true);
    try {
      const partialValues: WFHFormValues = {
        ...values,
        reason: form.getFieldValue("reason") ?? "",
        workPlan: form.getFieldValue("workPlan") ?? "",
      };
      const payload = buildPayload(partialValues, draftHandle ?? undefined);
      const result = await HrmLeaveService.saveDraftLeaveRequest(payload);
      if (result?.handle) {
        setDraftHandle(result.handle);
      }
      message.success(draftHandle ? "WFH draft updated" : "WFH draft saved — keep editing or submit when ready");
      onSubmitted();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message_details?: { error?: string; msg?: string }; message?: string } };
        message?: string;
      };
      const backendMsg =
        apiErr?.response?.data?.message_details?.msg ||
        apiErr?.response?.data?.message_details?.error ||
        apiErr?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to save WFH draft";
      message.error(backendMsg);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    let values: WFHFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // antd shows field-level errors
    }

    if (!identity.isReady) {
      message.error("Employee identity not resolved yet — please retry");
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload(values, draftHandle ?? undefined);
      await HrmLeaveService.submitLeaveRequest(payload);
      message.success("WFH request submitted for approval");
      form.resetFields();
      setAttachments([]);
      setDraftHandle(null);
      onSubmitted();
      onCancel();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message_details?: { error?: string }; message?: string } };
        message?: string;
      };
      const backendMsg =
        apiErr?.response?.data?.message_details?.error ||
        apiErr?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to submit WFH request";
      message.error(backendMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      style={{
        marginBottom: 20,
        border: "1px solid #bae7ff",
        borderRadius: 8,
        background: "#f0f9ff",
      }}
      title={
        <span style={{ color: "#0958d9" }}>
          <HomeOutlined style={{ marginRight: 6 }} />
          Apply for Work From Home
        </span>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fromDate"
              label="From Date"
              rules={[{ required: true, message: "Please select the start date" }]}
            >
              <DatePicker
                format="DD-MMM-YYYY"
                style={{ width: "100%" }}
                placeholder="Select start date"
                disabledDate={(current) =>
                  current && current.isBefore(dayjs().subtract(7, "day"), "day")
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="toDate"
              label="To Date"
              dependencies={["fromDate"]}
              rules={[
                { required: true, message: "Please select the end date" },
                { validator: validateDateRange },
              ]}
            >
              <DatePicker
                format="DD-MMM-YYYY"
                style={{ width: "100%" }}
                placeholder="Select end date"
                disabledDate={(current) => {
                  const fromDate: Dayjs = form.getFieldValue("fromDate");
                  if (fromDate && current.isBefore(fromDate, "day")) return true;
                  return false;
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="reason"
          label="Reason for WFH"
          rules={[
            { required: true, message: "Please provide a reason" },
            { min: 10, message: "Reason must be at least 10 characters" },
          ]}
        >
          <TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder="Describe why you need to work from home (e.g., medical, home repairs, personal obligation)"
          />
        </Form.Item>

        <Form.Item
          name="workPlan"
          label="Work Plan"
          rules={[
            { required: true, message: "Please describe your work plan" },
            { min: 10, message: "Work plan must be at least 10 characters" },
          ]}
          extra="Describe the tasks and deliverables you plan to complete while working from home."
        >
          <TextArea
            rows={4}
            maxLength={1000}
            showCount
            placeholder="e.g., 9:00–11:00 Sprint review, 11:00–13:00 Code reviews, 14:00–17:00 Feature development for ticket #1234"
          />
        </Form.Item>

        {/* Attachment upload */}
        <Form.Item label="Attachment (optional)">
          <Dragger
            accept="image/*,application/pdf"
            beforeUpload={handleBeforeUpload}
            showUploadList={false}
            multiple
            style={{ background: "#fff" }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file here to upload</p>
            <p className="ant-upload-hint" style={{ fontSize: 11, color: "#94a3b8" }}>
              Image or PDF, max 5 MB per file
            </p>
          </Dragger>

          {attachments.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none" }}>
              {attachments.map((a) => (
                <li
                  key={a.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "#fff",
                    borderRadius: 4,
                    marginBottom: 4,
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{a.name}</Text>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeAttachment(a.name)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Form.Item>

        <Divider style={{ margin: "12px 0" }} />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSaveDraft} loading={savingDraft}>
            Save as Draft
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            icon={<CheckCircleOutlined />}
          >
            Submit for Approval
          </Button>
        </div>
      </Form>
    </Card>
  );
};

// ── Approval Inbox Item ───────────────────────────────────────────────────────

interface ApprovalInboxItemProps {
  request: LeaveRequest;
  organizationId: string;
  actorId: string;
  actorRole: string;
  onActionComplete: () => void;
}

const ApprovalInboxItem: React.FC<ApprovalInboxItemProps> = ({
  request,
  organizationId,
  actorId,
  actorRole,
  onActionComplete,
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await HrmLeaveService.approveRequest({
        organizationId,
        requestId: request.handle,
        actorId,
        actorRole,
        remarks: "Approved",
      });
      message.success("WFH request approved");
      onActionComplete();
    } catch {
      message.error("Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning("Please enter a rejection reason");
      return;
    }
    setLoading(true);
    try {
      await HrmLeaveService.rejectRequest({
        organizationId,
        requestId: request.handle,
        actorId,
        actorRole,
        remarks: rejectReason.trim(),
      });
      message.success("WFH request rejected");
      setRejectModalOpen(false);
      setRejectReason("");
      onActionComplete();
    } catch {
      message.error("Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <List.Item
        key={request.handle}
        actions={[
          <Button
            key="approve"
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={loading}
            onClick={handleApprove}
          >
            Approve
          </Button>,
          <Button
            key="reject"
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            disabled={loading}
            onClick={() => setRejectModalOpen(true)}
          >
            Reject
          </Button>,
        ]}
      >
        <List.Item.Meta
          avatar={<HomeOutlined style={{ fontSize: 20, color: "#13c2c2", marginTop: 4 }} />}
          title={
            <span>
              <Text strong>{request.employeeName || request.employeeId}</Text>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                {formatDate(request.startDate)}
                {request.startDate !== request.endDate ? ` – ${formatDate(request.endDate)}` : ""}
                {" "}({request.totalDays} day{request.totalDays !== 1 ? "s" : ""})
              </Text>
            </span>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {request.reason || "No reason provided"}
              </Text>
              <div style={{ marginTop: 4 }}>{statusTag(request.status)}</div>
            </div>
          }
        />
      </List.Item>

      <Modal
        title="Reject WFH Request"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason("");
        }}
        confirmLoading={loading}
        okText="Reject"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Text>
          Rejecting WFH request for{" "}
          <strong>{request.employeeName || request.employeeId}</strong> (
          {formatDate(request.startDate)}
          {request.startDate !== request.endDate ? ` – ${formatDate(request.endDate)}` : ""}).
        </Text>
        <TextArea
          rows={4}
          placeholder="Enter rejection reason (required)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          style={{ marginTop: 12 }}
          maxLength={500}
          showCount
        />
      </Modal>
    </>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

const WFHManagementTab: React.FC<WFHManagementTabProps> = ({
  organizationId,
  employeeId,
  permissions,
  showApprovalInbox = false,
  onWFHSubmitted,
}) => {
  const identity = useEmployeeIdentity();
  const cookies = parseCookies();

  const actorRole = useMemo(() => {
    return (
      cookies.role ||
      cookies.userRole ||
      cookies.roles ||
      (showApprovalInbox ? "SUPERVISOR" : "EMPLOYEE")
    );
  }, [cookies.role, cookies.userRole, cookies.roles, showApprovalInbox]);

  const compositeEmployeeId = useMemo(() => {
    return identity.employeeIdWithName || cookies.employeeId || cookies.userId || employeeId;
  }, [identity.employeeIdWithName, cookies.employeeId, cookies.userId, employeeId]);

  // ── State ──────────────────────────────────────────────────────────────

  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(true);

  const [inboxRequests, setInboxRequests] = useState<LeaveRequest[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);

  const [showApplyForm, setShowApplyForm] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────

  const loadMyRequests = useCallback(async () => {
    if (!organizationId || !compositeEmployeeId) return;
    setMyRequestsLoading(true);
    try {
      const all = await HrmLeaveService.getMyRequests({
        organizationId,
        employeeId: compositeEmployeeId,
      });
      // Filter to WFH only
      setMyRequests(all.filter((r) => r.leaveTypeCode === WFH_CODE));
    } catch {
      message.error("Failed to load WFH requests");
      setMyRequests([]);
    } finally {
      setMyRequestsLoading(false);
    }
  }, [organizationId, compositeEmployeeId]);

  const loadInboxRequests = useCallback(async () => {
    if (!showApprovalInbox || !organizationId || !compositeEmployeeId) return;
    setInboxLoading(true);
    try {
      const all = await HrmLeaveService.getPendingForApprover({
        organizationId,
        approverId: compositeEmployeeId,
      });
      // Filter to WFH only
      setInboxRequests(all.filter((r) => r.leaveTypeCode === WFH_CODE));
    } catch {
      message.error("Failed to load pending WFH approvals");
      setInboxRequests([]);
    } finally {
      setInboxLoading(false);
    }
  }, [showApprovalInbox, organizationId, compositeEmployeeId]);

  useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests]);

  useEffect(() => {
    loadInboxRequests();
  }, [loadInboxRequests]);

  // ── WFH summary calculations ───────────────────────────────────────────

  const now = dayjs();
  const currentYear = now.year();
  const currentMonthIndex = now.month(); // 0-indexed
  const currentMonthName = now.format("MMMM YYYY");

  const monthWfhDays = useMemo(
    () => countWfhDaysInMonth(myRequests, currentYear, currentMonthIndex),
    [myRequests, currentYear, currentMonthIndex],
  );

  const yearWfhDays = useMemo(
    () => countWfhDaysInYear(myRequests, currentYear),
    [myRequests, currentYear],
  );

  // ── Action handlers ────────────────────────────────────────────────────

  const handleFormSubmitted = () => {
    loadMyRequests();
    onWFHSubmitted?.();
  };

  const handleInboxActionComplete = () => {
    loadInboxRequests();
    loadMyRequests();
    onWFHSubmitted?.();
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "16px 20px", maxWidth: 900 }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          <HomeOutlined style={{ marginRight: 8, color: "#13c2c2" }} />
          Work From Home
        </Title>
        {permissions.canApply && !showApplyForm && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowApplyForm(true)}
          >
            Apply for WFH
          </Button>
        )}
      </div>

      {/* Monthly summary card */}
      <WFHSummaryCard
        monthDays={monthWfhDays}
        yearDays={yearWfhDays}
        currentMonth={currentMonthName}
        currentYear={currentYear}
      />

      {/* Inline apply form */}
      {showApplyForm && (
        <WFHApplyForm
          organizationId={organizationId}
          employeeId={employeeId}
          onCancel={() => setShowApplyForm(false)}
          onSubmitted={handleFormSubmitted}
        />
      )}

      {/* My WFH requests */}
      <Card
        size="small"
        title={
          <span>
            <CalendarOutlined style={{ marginRight: 6 }} />
            My WFH Requests
          </span>
        }
        style={{ marginBottom: 20, borderRadius: 8 }}
        extra={
          <Button
            type="text"
            size="small"
            onClick={loadMyRequests}
            disabled={myRequestsLoading}
          >
            Refresh
          </Button>
        }
      >
        {myRequestsLoading ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <Spin tip="Loading your WFH requests..." />
          </div>
        ) : myRequests.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No WFH requests found"
            style={{ padding: "24px 0" }}
          />
        ) : (
          <List
            dataSource={myRequests}
            rowKey="handle"
            renderItem={(req) => (
              <List.Item
                key={req.handle}
                extra={statusTag(req.status)}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <HomeOutlined
                      style={{ fontSize: 18, color: "#13c2c2", marginTop: 4 }}
                    />
                  }
                  title={
                    <span>
                      <Text strong>
                        {formatDate(req.startDate)}
                        {req.startDate !== req.endDate
                          ? ` – ${formatDate(req.endDate)}`
                          : ""}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ marginLeft: 8, fontSize: 12 }}
                      >
                        ({req.totalDays} day{req.totalDays !== 1 ? "s" : ""})
                      </Text>
                    </span>
                  }
                  description={
                    <div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, display: "block" }}
                      >
                        {req.reason
                          ? req.reason.length > 120
                            ? `${req.reason.slice(0, 120)}…`
                            : req.reason
                          : "No reason provided"}
                      </Text>
                      {req.rejectionReason && (
                        <Text
                          type="danger"
                          style={{ fontSize: 11, display: "block", marginTop: 2 }}
                        >
                          Rejection reason: {req.rejectionReason}
                        </Text>
                      )}
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, display: "block", marginTop: 2 }}
                      >
                        Submitted: {dayjs(req.createdDateTime).format("DD MMM YYYY, HH:mm")}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Approval inbox — visible only for managers/HR */}
      {showApprovalInbox && (
        <Card
          size="small"
          title={
            <span>
              <CheckCircleOutlined style={{ marginRight: 6, color: "#1890ff" }} />
              Pending WFH Approvals
              {inboxRequests.length > 0 && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {inboxRequests.length}
                </Tag>
              )}
            </span>
          }
          style={{ borderRadius: 8 }}
          extra={
            <Button
              type="text"
              size="small"
              onClick={loadInboxRequests}
              disabled={inboxLoading}
            >
              Refresh
            </Button>
          }
        >
          {inboxLoading ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <Spin tip="Loading pending approvals..." />
            </div>
          ) : inboxRequests.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No pending WFH approvals"
              style={{ padding: "24px 0" }}
            />
          ) : (
            <List
              dataSource={inboxRequests}
              rowKey="handle"
              renderItem={(req) => (
                <ApprovalInboxItem
                  key={req.handle}
                  request={req}
                  organizationId={organizationId}
                  actorId={compositeEmployeeId}
                  actorRole={actorRole}
                  onActionComplete={handleInboxActionComplete}
                />
              )}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default WFHManagementTab;
