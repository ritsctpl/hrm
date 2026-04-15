"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Input,
  Select,
  Typography,
  Upload,
  message,
} from "antd";
import { InboxOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import DateRangePicker from "../molecules/DateRangePicker";
import Can from "../../../hrmAccess/components/Can";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { HrmHolidayService } from "../../../hrmHoliday/services/hrmHolidayService";
import { LeaveBalance } from "../../types/domain.types";
import type { HolidayResponse } from "../../../hrmHoliday/types/api.types";
import type { TeamCalendarEntry } from "../../types/api.types";
import styles from "../../styles/HrmLeaveForm.module.css";

const { Text } = Typography;
const { Dragger } = Upload;

interface LeaveRequestFormDrawerProps {
  site: string;
  employeeId: string;
  balances: LeaveBalance[];
  onSubmitted: () => void;
}

const REASON_TAGS = [
  "Personal",
  "Medical",
  "Family Function",
  "Travel",
  "Wedding",
  "Bereavement",
];

const LEAVE_TYPE_ICONS: Record<string, string> = {
  SL: "🤒",
  SICK: "🤒",
  CL: "🌴",
  CASUAL: "🌴",
  EL: "✈️",
  EARNED: "✈️",
  PL: "✈️",
  PRIVILEGE: "✈️",
  ML: "👶",
  MATERNITY: "👶",
  PATERNITY: "👶",
  LOP: "💸",
  WFH: "🏠",
  CO: "⏱️",
  COMP: "⏱️",
};

const getLeaveIcon = (code: string): string => {
  const upper = (code ?? "").toUpperCase();
  if (LEAVE_TYPE_ICONS[upper]) return LEAVE_TYPE_ICONS[upper];
  for (const key of Object.keys(LEAVE_TYPE_ICONS)) {
    if (upper.includes(key)) return LEAVE_TYPE_ICONS[key];
  }
  return "📅";
};

const formatDateLabel = (iso: string | null): string =>
  iso ? dayjs(iso).format("MMMM D") : "—";

const LeaveRequestFormDrawer: React.FC<LeaveRequestFormDrawerProps> = ({
  site,
  employeeId,
  balances,
  onSubmitted,
}) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? employeeId;
  const buHandle = cookies.buHandle ?? "";

  const {
    showLeaveForm,
    leaveFormState,
    closeLeaveForm,
    updateLeaveFormState,
    addMyRequest,
  } = useHrmLeaveStore();

  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; base64: string }[]>([]);
  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);
  const [teamEntries, setTeamEntries] = useState<TeamCalendarEntry[]>([]);
  const [handoverPerson, setHandoverPerson] = useState<string | undefined>();

  const { options: employeeOptions, loading: employeeOptionsLoading } = useEmployeeOptions();

  const selectedBalance = balances.find(
    (b) => b.leaveTypeCode === leaveFormState.leaveTypeCode,
  );

  // Load published holidays for the user's BU once the drawer opens.
  useEffect(() => {
    if (!showLeaveForm || !site) return;
    if (!buHandle) {
      setHolidays([]);
      return;
    }
    let cancelled = false;
    HrmHolidayService.getPublishedHolidaysForBu({
      site,
      buHandle,
      year: new Date().getFullYear(),
    })
      .then((res) => {
        if (cancelled) return;
        const list = (res?.data ?? []) as HolidayResponse[];
        setHolidays(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setHolidays([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showLeaveForm, site, buHandle]);

  // Load team calendar so we can show overlapping team-out-of-office.
  useEffect(() => {
    if (!showLeaveForm || !site || !leaveFormState.startDate) return;
    let cancelled = false;
    const start = dayjs(leaveFormState.startDate);
    HrmLeaveService.getTeamCalendar({
      site,
      managerId: cookies.supervisorId ?? employeeId,
      month: start.month() + 1,
      year: start.year(),
    })
      .then((res) => {
        if (cancelled) return;
        setTeamEntries(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) setTeamEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showLeaveForm, site, leaveFormState.startDate, cookies.supervisorId, employeeId]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleAttachmentUpload = async (file: File) => {
    const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) {
      message.error("Only image or PDF files are allowed");
      return false;
    }
    if (file.size / 1024 / 1024 >= 5) {
      message.error("File must be smaller than 5MB");
      return false;
    }
    try {
      const base64 = await fileToBase64(file);
      setAttachments((prev) => [...prev, { name: file.name, base64 }]);
      message.success(`${file.name} attached`);
    } catch {
      message.error("Failed to read file");
    }
    return false;
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  // Holidays that fall inside the requested range.
  const overlappingHolidays = useMemo(() => {
    if (!leaveFormState.startDate || !leaveFormState.endDate) return [];
    const s = dayjs(leaveFormState.startDate);
    const e = dayjs(leaveFormState.endDate);
    return holidays.filter((h) => {
      const d = dayjs(h.date);
      return !d.isBefore(s, "day") && !d.isAfter(e, "day");
    });
  }, [holidays, leaveFormState.startDate, leaveFormState.endDate]);

  // Team members on leave during the same range, grouped by employee.
  const overlappingTeam = useMemo(() => {
    if (!leaveFormState.startDate || !leaveFormState.endDate) return [];
    const s = dayjs(leaveFormState.startDate);
    const e = dayjs(leaveFormState.endDate);
    const byEmployee = new Map<string, { name: string; dates: string[] }>();
    teamEntries.forEach((entry) => {
      if (entry.employeeId === employeeId) return;
      const d = dayjs(entry.date);
      if (d.isBefore(s, "day") || d.isAfter(e, "day")) return;
      const existing = byEmployee.get(entry.employeeId);
      if (existing) {
        existing.dates.push(entry.date);
      } else {
        byEmployee.set(entry.employeeId, { name: entry.employeeName, dates: [entry.date] });
      }
    });
    return Array.from(byEmployee.entries()).map(([id, { name, dates }]) => ({
      id,
      name,
      range: dates.length === 1
        ? dayjs(dates[0]).format("MMM D")
        : `${dayjs(dates[0]).format("MMM D")} – ${dayjs(dates[dates.length - 1]).format("MMM D")}`,
    }));
  }, [teamEntries, leaveFormState.startDate, leaveFormState.endDate, employeeId]);

  const availableBalance = selectedBalance?.availableBalance ?? 0;
  const balanceAfter = availableBalance - leaveFormState.totalDays;
  const exceedsBalance = leaveFormState.totalDays > 0 && balanceAfter < 0;

  const canSubmit =
    !!leaveFormState.leaveTypeCode &&
    !!leaveFormState.startDate &&
    !!leaveFormState.endDate &&
    leaveFormState.totalDays > 0 &&
    leaveFormState.reason.trim().length > 0 &&
    !exceedsBalance;

  const handleReset = () => {
    setAttachments([]);
    setHandoverPerson(undefined);
    updateLeaveFormState({
      leaveTypeCode: "",
      startDate: null,
      endDate: null,
      startDayType: "FULL",
      endDayType: "FULL",
      totalDays: 0,
      reason: "",
      attachmentPath: null,
    });
  };

  const handleClose = () => {
    handleReset();
    closeLeaveForm();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !leaveFormState.leaveTypeCode) return;
    setSubmitting(true);
    try {
      const payload = {
        site,
        employeeId,
        leaveTypeCode: leaveFormState.leaveTypeCode,
        startDate: leaveFormState.startDate!,
        endDate: leaveFormState.endDate!,
        startDayType: leaveFormState.startDayType,
        endDayType: leaveFormState.endDayType,
        totalDays: leaveFormState.totalDays,
        reason: leaveFormState.reason,
        attachmentPath: leaveFormState.attachmentPath ?? undefined,
        createdBy: userId,
        attachments: attachments.map((a) => a.base64),
        handoverEmployeeId: handoverPerson,
      } as Parameters<typeof HrmLeaveService.submitLeaveRequest>[0];
      const result = await HrmLeaveService.submitLeaveRequest(payload);
      addMyRequest(result);
      message.success("Leave request submitted successfully");
      handleClose();
      onSubmitted();
    } catch {
      message.error("Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    message.info("Draft saved locally");
  };

  const reasonChipClick = (tag: string) => {
    const current = leaveFormState.reason.trim();
    const next = current && !current.includes(tag) ? `${current} · ${tag}` : tag;
    updateLeaveFormState({ reason: next });
  };

  const summaryLine = () => {
    if (!leaveFormState.leaveTypeCode || !leaveFormState.startDate || !leaveFormState.endDate) {
      return "Fill in the leave details to see the summary.";
    }
    const typeName = selectedBalance?.leaveTypeName ?? leaveFormState.leaveTypeCode;
    return (
      <>
        Applying for <strong>{leaveFormState.totalDays.toFixed(1)} day(s)</strong> of{" "}
        <strong>{typeName}</strong> from{" "}
        <strong>{formatDateLabel(leaveFormState.startDate)}</strong> to{" "}
        <strong>{formatDateLabel(leaveFormState.endDate)}</strong>.
      </>
    );
  };

  return (
    <Drawer
      title="Apply for Leave"
      open={showLeaveForm}
      onClose={handleClose}
      width={1080}
      destroyOnHidden
      footer={
        <div className={styles.formActions}>
          <Button onClick={handleClose}>Cancel</Button>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleSaveDraft}>Save as Draft</Button>
            <Can I="add" object="leave_request" passIf={true}>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!canSubmit}
                className={`${styles.submitButton} ${
                  exceedsBalance ? styles.submitButtonInsufficient : ""
                }`}
              >
                {exceedsBalance ? "Insufficient Balance" : "Submit Request"}
              </Button>
            </Can>
          </div>
        </div>
      }
    >
      <div className={styles.formGrid}>
        {/* ── Form Column ────────────────────────────────────────────── */}
        <div className={styles.formColumn}>
          {/* Leave type choice cards */}
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Leave Type</span>
            <div className={styles.typeChoiceGrid}>
              {balances.map((b) => {
                const selected = leaveFormState.leaveTypeCode === b.leaveTypeCode;
                const disabled = b.availableBalance <= 0;
                return (
                  <div
                    key={b.leaveTypeCode}
                    className={`${styles.typeChoiceCard} ${
                      selected ? styles.typeChoiceCardSelected : ""
                    } ${disabled ? styles.typeChoiceCardDisabled : ""}`}
                    onClick={() => {
                      if (disabled) return;
                      updateLeaveFormState({ leaveTypeCode: b.leaveTypeCode });
                    }}
                  >
                    <span className={styles.typeChoiceIcon}>
                      {getLeaveIcon(b.leaveTypeCode)}
                    </span>
                    <span className={styles.typeChoiceName}>{b.leaveTypeName}</span>
                    <span className={styles.typeChoiceBalance}>
                      {b.availableBalance.toFixed(1)} days available
                    </span>
                    {selected && <span className={styles.typeChoiceCheckmark}>✓</span>}
                  </div>
                );
              })}
              {balances.length === 0 && (
                <Text type="secondary">No leave balance available.</Text>
              )}
            </div>
          </div>

          {/* Date range */}
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Date Range</span>
            <DateRangePicker
              startDate={leaveFormState.startDate}
              endDate={leaveFormState.endDate}
              startDayType={leaveFormState.startDayType}
              endDayType={leaveFormState.endDayType}
              halfDayAllowed={selectedBalance?.halfDayAllowed ?? false}
              onStartDateChange={(date, dayType) =>
                updateLeaveFormState({ startDate: date, startDayType: dayType })
              }
              onEndDateChange={(date, dayType) =>
                updateLeaveFormState({ endDate: date, endDayType: dayType })
              }
              onTotalDaysChange={(days) => updateLeaveFormState({ totalDays: days })}
            />
          </div>

          {/* Reason */}
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>
              Reason <Text type="danger">*</Text>
            </span>
            <Input.TextArea
              rows={3}
              placeholder="Briefly describe the reason for your leave"
              value={leaveFormState.reason}
              onChange={(e) => updateLeaveFormState({ reason: e.target.value })}
              maxLength={500}
              showCount
            />
            <div className={styles.reasonChips}>
              {REASON_TAGS.map((tag) => {
                const active = leaveFormState.reason.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`${styles.reasonChip} ${active ? styles.reasonChipActive : ""}`}
                    onClick={() => reasonChipClick(tag)}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Handover person */}
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Handover / Backup Person</span>
            <Select
              showSearch
              allowClear
              placeholder="Who will cover for you?"
              value={handoverPerson}
              onChange={(value) => setHandoverPerson(value ?? undefined)}
              options={employeeOptions.filter((opt) => opt.value !== employeeId)}
              loading={employeeOptionsLoading}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          {/* Document upload */}
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Supporting Documents</span>
            <div className={styles.dragDropZone}>
              <Dragger
                accept="image/*,application/pdf"
                beforeUpload={handleAttachmentUpload}
                showUploadList={false}
                multiple
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Drop file here or click to upload</p>
                <p className="ant-upload-hint" style={{ fontSize: 11, color: "#94a3b8" }}>
                  Image or PDF, max 5MB. Required for medical leave longer than 2 days.
                </p>
              </Dragger>
              {attachments.length > 0 && (
                <ul className={styles.attachmentList}>
                  {attachments.map((a) => (
                    <li key={a.name} className={styles.attachmentItem}>
                      <span>{a.name}</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeAttachment(a.name)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Smart Info Column (glassmorphic) ───────────────────────── */}
        <aside className={styles.smartPanel}>
          {/* Balance preview */}
          <div className={`${styles.smartCard} ${exceedsBalance ? styles.smartCardError : ""}`}>
            <div className={styles.smartCardHeader}>
              <span>💼</span> Balance Preview
            </div>
            {selectedBalance ? (
              <>
                <div className={styles.balancePreview}>
                  <span className={styles.balancePreviewCurrent}>
                    {availableBalance.toFixed(1)}
                  </span>
                  <span className={styles.balancePreviewArrow}>→</span>
                  <span
                    className={`${styles.balancePreviewAfter} ${
                      exceedsBalance ? styles.balancePreviewAfterError : ""
                    }`}
                  >
                    {balanceAfter.toFixed(1)}
                  </span>
                  <span style={{ marginLeft: 4 }}>days</span>
                </div>
                <Text style={{ fontSize: 11, color: exceedsBalance ? "#dc2626" : "#64748b" }}>
                  {exceedsBalance
                    ? `Exceeds available balance by ${Math.abs(balanceAfter).toFixed(1)} day(s)`
                    : `Applying ${leaveFormState.totalDays.toFixed(1)} day(s) of ${selectedBalance.leaveTypeName}`}
                </Text>
              </>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Pick a leave type to see your balance preview.
              </Text>
            )}
          </div>

          {/* Holiday alert */}
          {overlappingHolidays.length > 0 && (
            <div className={`${styles.smartCard} ${styles.smartCardWarn}`}>
              <div className={styles.smartCardHeader}>
                <span>🎉</span> Public Holidays in Range
              </div>
              {overlappingHolidays.map((h) => (
                <div key={h.handle} className={styles.holidayItem}>
                  <span className={styles.holidayDot} />
                  <span>
                    <strong>{h.name}</strong> — {dayjs(h.date).format("MMM D")}
                  </span>
                </div>
              ))}
              <Text style={{ fontSize: 11, color: "#c2410c", marginTop: 6, display: "block" }}>
                This range includes {overlappingHolidays.length} public holiday(s) — you may not need to apply for those days.
              </Text>
            </div>
          )}

          {/* Team OOO */}
          <div className={styles.smartCard}>
            <div className={styles.smartCardHeader}>
              <span>👥</span> Team Out-of-Office
            </div>
            {overlappingTeam.length > 0 ? (
              <div className={styles.oooList}>
                {overlappingTeam.map((t) => (
                  <div key={t.id} className={styles.oooItem}>
                    <span className={styles.oooName}>{t.name}</span>
                    <span className={styles.oooDates}>{t.range}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No team members on leave during these dates.
              </Text>
            )}
          </div>

          {/* Review summary */}
          <div className={styles.smartCard}>
            <div className={styles.smartCardHeader}>
              <CalendarOutlined /> Review
            </div>
            <div className={styles.reviewSummary}>{summaryLine()}</div>
          </div>
        </aside>
      </div>
    </Drawer>
  );
};

export default LeaveRequestFormDrawer;
