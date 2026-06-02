"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Typography,
  Upload,
  message,
} from "antd";
import { DeleteOutlined, DownloadOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import { useLeaveTypeOptions } from "../../hooks/useLeaveTypeOptions";
import { LeavePolicy, LeaveRequest } from "../../types/domain.types";
import styles from "../../styles/HrmLeaveForm.module.css";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface AmendLeavePanelProps {
  open: boolean;
  organizationId: string;
  request: LeaveRequest | null;
  onClose: () => void;
  onAmended?: (updated: LeaveRequest) => void;
}

const AmendLeavePanel: React.FC<AmendLeavePanelProps> = ({
  open,
  organizationId,
  request,
  onClose,
  onAmended,
}) => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for modifiedBy.
  const userId = identity.employeeIdWithName || cookies.userId || "";
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  // Item 6: live working-day count + balance impact for the new range.
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  // Source of truth for negativeBalanceAllowed / negativeFloor — the
  // policy retrieve, NOT the balance retrieve (which currently returns
  // stale `false` / `0` for these). Loaded once per amend open.
  const { leaveTypes } = useLeaveTypeOptions();
  const [effectivePolicy, setEffectivePolicy] = useState<LeavePolicy | null>(null);
  // Watch the form's range field so we can recalculate days the moment
  // the user moves either picker (no need to submit first).
  const watchedRange = Form.useWatch<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(
    "range",
    form,
  );
  // Attachment item — covers both files already on the request being amended
  // (`existing: true`, carries `url` / `id`) and freshly uploaded ones
  // (`existing: false`, carries `base64`). View / Download work for both.
  type AmendAttachment = {
    uid: string;
    name: string;
    contentType: string;
    base64?: string;
    url?: string;
    existing: boolean;
    id?: string;
  };
  const [attachments, setAttachments] = useState<AmendAttachment[]>([]);

  // Seed attachments from a LeaveRequest's `attachments` array. Defined here
  // so both the prop fallback and the retrieved-detail effect share the
  // same mapping.
  const seedAttachmentsFrom = React.useCallback((rq: LeaveRequest | null | undefined) => {
    setAttachments(
      (rq?.attachments ?? []).map((a, i) => ({
        uid: a.id || `existing-${i}`,
        name: a.name,
        contentType: a.contentType || "application/octet-stream",
        base64: a.contentBase64,
        url: a.downloadUrl,
        existing: true,
        id: a.id,
      })),
    );
  }, []);

  useEffect(() => {
    if (open && request) {
      form.setFieldsValue({
        range: [dayjs(request.startDate), dayjs(request.endDate)],
        reason: request.reason,
      });
      // First-pass seed from the prop so the list isn't blank while the
      // detail call is in flight. The retrieve effect below overrides
      // this with the authoritative attachments from /leave-request/retrieve.
      seedAttachmentsFrom(request);
    }
    if (!open) {
      form.resetFields();
      setAttachments([]);
    }
  }, [open, request, form, seedAttachmentsFrom]);

  // Pull the effective Leave Policy on open so amend respects the same
  // negative-balance rule as create. The balance retrieve currently
  // sends `negativeBalanceAllowed: false` / `negativeFloor: 0` even when
  // the policy says otherwise, so we ignore those fields on the balance
  // row and read them from /leave-policy/effective instead.
  useEffect(() => {
    if (!open || !request || !organizationId) return;
    const lt = leaveTypes.find((t) => t.code === request.leaveTypeCode);
    if (!lt?.handle) {
      setEffectivePolicy(null);
      return;
    }
    let cancelled = false;
    HrmLeaveService.getEffectivePolicy({
      organizationId,
      leaveTypeId: lt.handle,
    })
      .then((p) => {
        if (!cancelled) setEffectivePolicy(p);
      })
      .catch(() => {
        if (!cancelled) setEffectivePolicy(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, request, organizationId, leaveTypes]);

  // Derived negative-balance state. Drives both the live impact display
  // and the submit-blocked rule. Floor semantics match the apply-leave
  // drawer: `negativeFloor` is a magnitude; actual minimum = -|floor|.
  const negativeAllowed = effectivePolicy?.negativeBalanceAllowed ?? false;
  const negativeFloor = effectivePolicy?.negativeFloor ?? null;
  const minAllowedBalance =
    negativeAllowed && negativeFloor != null && Math.abs(negativeFloor) > 0
      ? -Math.abs(negativeFloor)
      : 0;
  const balanceAfter =
    currentBalance != null && calculatedDays != null
      ? currentBalance - calculatedDays
      : null;
  const exceedsNegativeLimit =
    balanceAfter != null && balanceAfter < minAllowedBalance;
  const goesNegative = balanceAfter != null && balanceAfter < 0;
  const negativeWarning = goesNegative && !exceedsNegativeLimit;

  // Item 6: re-fetch the live balance for the request's leave type on open
  // so we can show "current → after" impact. Falls silently if the BE call
  // fails; the rest of the amend flow continues to work.
  useEffect(() => {
    if (!open || !request || !organizationId) return;
    let cancelled = false;
    const year = dayjs(request.startDate).year() || new Date().getFullYear();
    HrmLeaveService.getBalanceByType({
      organizationId,
      employeeId: request.employeeId,
      leaveTypeCode: request.leaveTypeCode,
      year,
    })
      .then((bal) => {
        if (!cancelled) {
          const avail = Number((bal as { availableBalance?: number })?.availableBalance);
          setCurrentBalance(Number.isFinite(avail) ? avail : null);
        }
      })
      .catch(() => {
        if (!cancelled) setCurrentBalance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, request, organizationId]);

  // Item 6: recalculate working days whenever the user adjusts the range.
  // Backend gives the authoritative number (excludes weekends + holidays);
  // a synchronous weekday-only count serves as the fallback so weekends
  // are NEVER counted while the BE request is in flight, fails, or is
  // slow. The BE response then trims holidays off that figure on top.
  useEffect(() => {
    if (!open || !request || !organizationId) return;
    const range = watchedRange;
    if (!range || !range[0] || !range[1]) {
      setCalculatedDays(null);
      return;
    }
    const start = range[0];
    const end = range[1];
    if (end.isBefore(start, "day")) {
      setCalculatedDays(0);
      return;
    }
    // Synchronous fallback: walk the range and count Mon–Fri only.
    // Saturdays (day === 6) and Sundays (day === 0) are excluded.
    const countWeekdays = (s: dayjs.Dayjs, e: dayjs.Dayjs): number => {
      let count = 0;
      let cur = s.startOf("day");
      const last = e.startOf("day");
      while (cur.isSame(last, "day") || cur.isBefore(last, "day")) {
        const dow = cur.day();
        if (dow !== 0 && dow !== 6) count += 1;
        cur = cur.add(1, "day");
      }
      return count;
    };
    setCalculatedDays(countWeekdays(start, end));
    let cancelled = false;
    HrmLeaveService.calculateWorkingDays({
      organizationId,
      employeeId: request.employeeId,
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
      startDayType: request.startDayType,
      endDayType: request.endDayType,
    })
      .then((res) => {
        if (!cancelled && typeof res?.calculatedDays === "number") {
          setCalculatedDays(res.calculatedDays);
        }
      })
      .catch(() => {
        // Keep the weekday-only fallback; BE will re-validate on submit.
      });
    return () => {
      cancelled = true;
    };
  }, [open, request, organizationId, watchedRange]);

  // /my-requests often returns a truncated row without the `attachments`
  // array populated — the previously-uploaded files would then never render
  // in the Amend drawer. Always re-fetch the full request on open so the
  // existing attachments load automatically, complete with their downloadUrl.
  useEffect(() => {
    if (!open || !request?.handle || !organizationId) return;
    let cancelled = false;
    setLoadingDetail(true);
    HrmLeaveService.getLeaveRequestById({
      organizationId,
      id: request.handle,
    })
      .then((detail) => {
        if (!cancelled && detail) {
          seedAttachmentsFrom(detail);
        }
      })
      .catch(() => {
        // Silent — the prop-based seed (above) is still in place so the user
        // can at least see whatever the list row carried.
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, request?.handle, organizationId, seedAttachmentsFrom]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleAttachmentUpload = async (file: File) => {
    const isAllowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) {
      message.error("Only image or PDF files are allowed");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("File must be smaller than 5MB");
      return false;
    }
    try {
      const base64 = await fileToBase64(file);
      // Amend is a "replace the supporting document" flow — a fresh upload
      // takes over the slot so the user sees the new file (with View /
      // Download) instead of an ever-growing list. Existing attachments are
      // discarded on a new upload, mirroring "Allow replacing old attachment
      // with new uploaded file" in the requirements.
      setAttachments([
        {
          uid: `new-${Date.now()}-${file.name}`,
          name: file.name,
          base64,
          contentType: file.type || "application/octet-stream",
          existing: false,
        },
      ]);
      message.success(`${file.name} attached`);
    } catch {
      message.error("Failed to read file");
    }
    return false;
  };

  const removeAttachment = (uid: string) => {
    setAttachments((prev) => prev.filter((a) => a.uid !== uid));
  };

  // View / Download work straight from contentBase64. The BE returns the
  // base64 WITHOUT the `data:<mime>;base64,` prefix and the downloadUrl
  // as a relative path that doesn't resolve cleanly via window.open, so
  // build a real data URI from base64 + contentType. Newly uploaded
  // files already carry the data: prefix (FileReader.readAsDataURL),
  // so only the bare-base64 path needs the prefix grafted on.
  const hrefFor = (a: AmendAttachment): string => {
    if (a.base64) {
      return a.base64.startsWith("data:")
        ? a.base64
        : `data:${a.contentType || "application/octet-stream"};base64,${a.base64}`;
    }
    return a.url || "";
  };
  const viewAttachment = (a: AmendAttachment) => {
    const href = hrefFor(a);
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  };
  const downloadAttachment = (a: AmendAttachment) => {
    const href = hrefFor(a);
    if (!href) return;
    const link = document.createElement("a");
    link.href = href;
    link.download = a.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attachmentFileList: UploadFile[] = attachments.map((a, idx) => ({
    uid: `${idx}`,
    name: a.name,
    status: "done",
  }));

  const handleSubmit = async () => {
    if (!request) return;
    try {
      const values = await form.validateFields();
      const [start, end] = values.range as [dayjs.Dayjs, dayjs.Dayjs];
      // Prefer the working-day figure already computed by the live recalc
      // (which excludes weekends and holidays via the BE). If that hasn't
      // resolved yet, fall back to a weekday-only walk so we still skip
      // Saturdays and Sundays — never a calendar-day count.
      const countWeekdaysAtSubmit = (s: dayjs.Dayjs, e: dayjs.Dayjs): number => {
        if (!s || !e || e.isBefore(s, "day")) return 0;
        let count = 0;
        let cur = s.startOf("day");
        const last = e.startOf("day");
        while (cur.isSame(last, "day") || cur.isBefore(last, "day")) {
          const dow = cur.day();
          if (dow !== 0 && dow !== 6) count += 1;
          cur = cur.add(1, "day");
        }
        return count;
      };
      const totalDays =
        calculatedDays != null && calculatedDays > 0
          ? calculatedDays
          : countWeekdaysAtSubmit(start, end);

      // Final guard: refuse the amend if it would push the balance below
      // the policy's negative floor. Mirrors the apply-leave drawer's
      // exceedsBalance gate so both flows enforce the same limit.
      if (currentBalance != null) {
        const projected = currentBalance - totalDays;
        if (negativeAllowed) {
          if (
            negativeFloor != null &&
            Math.abs(negativeFloor) > 0 &&
            projected < -Math.abs(negativeFloor)
          ) {
            message.error(
              `Requested leave exceeds the allowed negative limit (floor: ${(-Math.abs(
                negativeFloor,
              )).toFixed(1)} day(s)).`,
            );
            return;
          }
          if (negativeFloor == null || Math.abs(negativeFloor) === 0) {
            // Per the spec: when negativeFloor is 0, treat as no negative
            // even if negativeBalanceAllowed is true — the floor of 0 means
            // "no headroom below zero".
            if (projected < 0) {
              message.error(
                `Insufficient balance. Available: ${currentBalance.toFixed(
                  1,
                )}, requested: ${totalDays.toFixed(1)}.`,
              );
              return;
            }
          }
        } else if (projected < 0) {
          message.error(
            `Insufficient balance. Available: ${currentBalance.toFixed(
              1,
            )}, requested: ${totalDays.toFixed(1)}.`,
          );
          return;
        }
      }

      setSubmitting(true);
      const payload = {
        organizationId,
        handle: request.handle,
        startDate: start.format("YYYY-MM-DD"),
        endDate: end.format("YYYY-MM-DD"),
        startDayType: request.startDayType,
        endDayType: request.endDayType,
        totalDays,
        reason: values.reason,
        amendedBy: userId,
        // Only send attachments when there is fresh file content to send
        // (newly uploaded files carry base64). Existing files without base64
        // would be silently dropped by the BE's "non-empty list replaces"
        // contract, so we omit the field and let the BE keep them intact —
        // matching the apply-leave drawer.
        ...((() => {
          const uploads = attachments
            .filter((a) => !!a.base64)
            .map((a) => ({
              name: a.name,
              contentType: a.contentType,
              contentBase64: a.base64 as string,
            }));
          return uploads.length > 0 ? { attachments: uploads } : {};
        })()),
      } as Parameters<typeof HrmLeaveService.amendLeaveRequest>[0];
      const updated = await HrmLeaveService.amendLeaveRequest(payload);
      message.success("Leave request amended");
      onAmended?.(updated);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error("Failed to amend leave request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Amend Leave Request"
      open={open}
      onClose={onClose}
      width={520}
      footer={
        <div className={styles.formActions}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={exceedsNegativeLimit}
          >
            {exceedsNegativeLimit
              ? negativeAllowed && negativeFloor != null && Math.abs(negativeFloor) > 0
                ? "Exceeds Negative Limit"
                : "Insufficient Balance"
              : "Save Changes"}
          </Button>
        </div>
      }
    >
      {request && (
        <>
          <Title level={5} style={{ marginTop: 0 }}>
            {request.leaveTypeName}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Current status: {request.status}
          </Text>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="range"
              label="Dates"
              rules={[{ required: true, message: "Select date range" }]}
            >
              <RangePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
            </Form.Item>

            {/* Item 6: live recalc + balance impact + negative-floor view.
                Updates the moment either picker moves; no need to submit
                to see the new day count or the resulting balance. The
                negative-floor block reads from /leave-policy/effective
                because the balance retrieve currently doesn't carry it. */}
            {watchedRange && watchedRange[0] && watchedRange[1] && (
              <div
                style={{
                  margin: "-4px 0 12px",
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: exceedsNegativeLimit
                    ? "#fef2f2"
                    : negativeWarning
                      ? "#fff7ed"
                      : "#f8fafc",
                  border: `1px solid ${
                    exceedsNegativeLimit
                      ? "#fecaca"
                      : negativeWarning
                        ? "#fed7aa"
                        : "#e2e8f0"
                  }`,
                  fontSize: 12,
                }}
              >
                <div>
                  <strong>Updated days:</strong>{" "}
                  {calculatedDays != null ? `${calculatedDays.toFixed(1)} day(s)` : "—"}
                  {request &&
                    calculatedDays != null &&
                    calculatedDays !== request.totalDays && (
                      <Text type="secondary" style={{ marginLeft: 6 }}>
                        (was {request.totalDays.toFixed(1)})
                      </Text>
                    )}
                </div>
                {currentBalance != null && calculatedDays != null && (
                  <div style={{ marginTop: 2 }}>
                    <strong>Balance impact:</strong> {currentBalance.toFixed(1)}{" "}
                    → {(currentBalance - calculatedDays).toFixed(1)} day(s)
                  </div>
                )}
                {balanceAfter != null && balanceAfter < 0 && negativeAllowed && negativeFloor != null && Math.abs(negativeFloor) > 0 && (
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed #d4d4d8" }}>
                    <div>
                      <strong>Available Leave:</strong> {balanceAfter.toFixed(1)} day(s)
                    </div>
                    <div>
                      <strong>Negative Floor:</strong>{" "}
                      {Math.abs(negativeFloor).toFixed(1)} day(s)
                    </div>
                    <div>
                      <strong>Remaining Negative:</strong>{" "}
                      {Math.max(
                        0,
                        Math.abs(negativeFloor) - Math.abs(balanceAfter),
                      ).toFixed(1)}{" "}
                      day(s)
                    </div>
                  </div>
                )}
                {exceedsNegativeLimit && (
                  <Text type="danger" style={{ marginTop: 6, display: "block" }}>
                    Requested leave exceeds the allowed negative limit
                    {negativeFloor != null && Math.abs(negativeFloor) > 0
                      ? ` (floor: ${(-Math.abs(negativeFloor)).toFixed(1)} day(s))`
                      : ""}
                    .
                  </Text>
                )}
                {negativeWarning && (
                  <Text type="warning" style={{ marginTop: 6, display: "block" }}>
                    Warning: You are using negative leave balance.
                  </Text>
                )}
              </div>
            )}
            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: "Reason is required" }]}
            >
              <Input.TextArea rows={4} placeholder="Updated reason for leave" />
            </Form.Item>
            <Form.Item label="Supporting Documents">
              <Upload
                accept="image/*,application/pdf"
                beforeUpload={handleAttachmentUpload}
                fileList={attachmentFileList}
                showUploadList={false}
                multiple
              >
                <Button icon={<UploadOutlined />}>Attach File</Button>
              </Upload>
              <Text
                type="secondary"
                style={{ fontSize: 11, display: "block", marginTop: 4 }}
              >
                Image or PDF, max 5MB each
              </Text>
              {attachments.length > 0 && (
                <ul
                  style={{
                    marginTop: 8,
                    paddingLeft: 0,
                    listStyle: "none",
                  }}
                >
                  {attachments.map((a) => (
                    <li
                      key={a.uid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 4,
                        padding: "4px 8px",
                        background: "#fafafa",
                        borderRadius: 4,
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.name}
                      </span>
                      {a.existing && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4, marginRight: 4 }}>
                          saved
                        </Text>
                      )}
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => viewAttachment(a)}
                        disabled={!hrefFor(a)}
                      >
                        View
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadAttachment(a)}
                        disabled={!hrefFor(a)}
                      >
                        Download
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeAttachment(a.uid)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Form.Item>
          </Form>
        </>
      )}
    </Drawer>
  );
};

export default AmendLeavePanel;
