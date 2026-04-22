"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { HrmEmployeeService } from "../../../hrmEmployee/services/hrmEmployeeService";
import { mapApiProfileToEmployeeProfile } from "../../../hrmEmployee/utils/transformations";
import type { EmployeeProfile } from "../../../hrmEmployee/types/domain.types";
import { LeaveBalance } from "../../types/domain.types";
import type { HolidayResponse } from "../../../hrmHoliday/types/api.types";
import type { TeamCalendarEntry, LeaveBlackoutPeriod } from "../../types/api.types";
import styles from "../../styles/HrmLeaveForm.module.css";

const { Text } = Typography;
const { Dragger } = Upload;

interface LeaveRequestFormDrawerProps {
  organizationId: string;
  employeeId: string;
  balances: LeaveBalance[];
  /** When true, the drawer renders an Employee picker so HR can choose which user to apply for. */
  allowEmployeeSelection?: boolean;
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

const LeaveRequestFormDrawer: React.FC<LeaveRequestFormDrawerProps> = ({ organizationId,
  employeeId,
  balances,
  allowEmployeeSelection = false,
  onSubmitted,
}) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? employeeId;
  const buHandle = cookies.buHandle ?? "";

  const {
    showLeaveForm,
    leaveFormState,
    leaveTypes,
    formTargetEmployeeId,
    closeLeaveForm,
    updateLeaveFormState,
    addMyRequest,
    setLeaveTypes,
    setFormTargetEmployeeId,
  } = useHrmLeaveStore();

  // When HR picks an employee, target overrides the prop. Otherwise the
  // logged-in user's id is used.
  const effectiveEmployeeId = formTargetEmployeeId ?? employeeId;
  // HR users (indicated by allowEmployeeSelection) can submit any date
  // without backdated restrictions.
  const isHrUser = allowEmployeeSelection;

  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; base64: string }[]>([]);
  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);
  const [teamEntries, setTeamEntries] = useState<TeamCalendarEntry[]>([]);
  const [blackouts, setBlackouts] = useState<LeaveBlackoutPeriod[]>([]);
  const [handoverPerson, setHandoverPerson] = useState<string | undefined>();
  const [fetchedBalances, setFetchedBalances] = useState<LeaveBalance[]>([]);
  const [currentProfile, setCurrentProfile] = useState<EmployeeProfile | null>(null);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);

  const {
    options: employeeOptions,
    employees: directoryEmployees,
    loading: employeeOptionsLoading,
  } = useEmployeeOptions();

  // Resolve the active employee against the directory. When HR has picked a
  // target the effectiveEmployeeId already points to that employee — match
  // it by handle / employeeCode / email so the Applying-as label updates.
  const cookieCandidates = [
    effectiveEmployeeId,
    cookies.employeeCode,
    cookies.userId,
    cookies.username,
    cookies.email,
    cookies.preferred_username,
    cookies.user,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  const matchedEmployee = directoryEmployees.find((emp) =>
    cookieCandidates.some(
      (c) =>
        c === emp.handle ||
        c === emp.employeeCode ||
        c.toLowerCase() === (emp.workEmail || "").toLowerCase() ||
        c.toLowerCase() === (emp.fullName || "").toLowerCase(),
    ),
  );

  // Build the profile-derived label first — that's the most authoritative
  // source. fall back to directory match, then cookies, then raw ids.
  const profileLabel = (() => {
    if (!currentProfile) return "";
    const code = currentProfile.employeeCode || currentProfile.basicDetails?.employeeCode || "";
    const name = currentProfile.basicDetails?.fullName || "";
    if (code && name) return `${code} - ${name}`;
    return name || code || "";
  })();

  // Use || (not ??) so empty-string cookies fall through.
  const employeeDisplayName =
    profileLabel ||
    (matchedEmployee
      ? `${matchedEmployee.employeeCode} - ${matchedEmployee.fullName}`
      : "") ||
    cookies.fullName ||
    cookies.employeeName ||
    cookies.name ||
    cookies.firstName ||
    cookies.displayName ||
    cookies.username ||
    cookies.preferred_username ||
    cookies.email ||
    cookies.user ||
    cookies.employeeCode ||
    employeeId ||
    cookies.userId ||
    "Current user";

  // When the drawer opens with no target picked yet, default the picker to
  // the logged-in user by looking up their handle in the directory using
  // any identifier we have in cookies/props.
  useEffect(() => {
    if (!showLeaveForm || formTargetEmployeeId || directoryEmployees.length === 0) {
      return;
    }
    const candidates = [
      employeeId,
      cookies.employeeCode,
      cookies.userId,
      cookies.username,
      cookies.email,
      cookies.preferred_username,
      cookies.user,
    ].filter((v): v is string => typeof v === "string" && v.length > 0);
    const me = directoryEmployees.find((emp) =>
      candidates.some(
        (c) =>
          c === emp.handle ||
          c === emp.employeeCode ||
          c.toLowerCase() === (emp.workEmail || "").toLowerCase(),
      ),
    );
    if (me?.handle) {
      setFormTargetEmployeeId(me.handle);
    }
  }, [
    showLeaveForm,
    formTargetEmployeeId,
    directoryEmployees,
    employeeId,
    cookies.employeeCode,
    cookies.userId,
    cookies.username,
    cookies.email,
    cookies.preferred_username,
    cookies.user,
    setFormTargetEmployeeId,
  ]);

  // Always reload leave types, the current user's balances, AND the current
  // user's profile when the drawer opens so the choice cards always have
  // something to render and the Applying-as field knows the real name.
  useEffect(() => {
    if (!showLeaveForm || !organizationId) return;
    let cancelled = false;
    setLeaveTypesLoading(true);
    HrmLeaveService.getAllLeaveTypes({ organizationId })
      .then((res) => {
        if (cancelled) return;
        setLeaveTypes(res ?? []);
      })
      .catch(() => {
        // silent — the form falls back to balances or shows the empty hint
      })
      .finally(() => {
        if (!cancelled) setLeaveTypesLoading(false);
      });
    if (effectiveEmployeeId) {
      HrmLeaveService.getEmployeeBalances({ organizationId,
        employeeId: effectiveEmployeeId,
        year: new Date().getFullYear(),
      })
        .then((res) => {
          if (cancelled) return;
          setFetchedBalances((res as unknown as LeaveBalance[]) ?? []);
        })
        .catch(() => {
          if (!cancelled) setFetchedBalances([]);
        });
      HrmEmployeeService.fetchProfile(organizationId, effectiveEmployeeId)
        .then((raw) => {
          if (cancelled) return;
          const rawObj = raw as unknown as Record<string, unknown>;
          const inner =
            rawObj && typeof rawObj === "object" && "response" in rawObj
              ? (rawObj.response as Record<string, unknown>)
              : rawObj;
          const mapped = mapApiProfileToEmployeeProfile(inner ?? {});
          setCurrentProfile(mapped);
        })
        .catch(() => {
          if (!cancelled) setCurrentProfile(null);
        });
    } else {
      setFetchedBalances([]);
      setCurrentProfile(null);
    }
    return () => {
      cancelled = true;
    };
  }, [showLeaveForm, organizationId, effectiveEmployeeId, setLeaveTypes]);

  // Derive the employee's gender from the fetched profile so that
  // gender-restricted leave types can be hidden / disabled.
  const employeeGender = currentProfile?.personalDetails?.gender?.toUpperCase();

  // Merge prop balances + drawer-fetched balances + configured leave types.
  // The drawer-fetched balances cover the case where the parent never loaded
  // them (e.g. HR landing where the dashboard isn't shown).
  const choiceOptions = useMemo(() => {
    type ChoiceOption = {
      code: string;
      name: string;
      available: number;
      halfDayAllowed: boolean;
      hasBalance: boolean;
      /** When true the card is dimmed and unclickable (gender / probation filter). */
      disabled: boolean;
      disabledReason?: string;
    };
    const byCode = new Map<string, ChoiceOption>();
    const addBalance = (b: LeaveBalance) => {
      byCode.set(b.leaveTypeCode, {
        code: b.leaveTypeCode,
        name: b.leaveTypeName,
        available: b.availableBalance,
        halfDayAllowed: b.halfDayAllowed,
        hasBalance: true,
        disabled: false,
      });
    };
    balances.forEach(addBalance);
    fetchedBalances.forEach(addBalance);

    // Build a quick lookup for gender applicability from leaveTypes.
    const genderByCode = new Map<string, string>();
    leaveTypes.forEach((lt) => {
      genderByCode.set(lt.code, (lt.applicableGender ?? 'ALL').toUpperCase());
    });

    leaveTypes.forEach((lt) => {
      if (byCode.has(lt.code)) return;
      byCode.set(lt.code, {
        code: lt.code,
        name: lt.name,
        available: 0,
        halfDayAllowed: !!lt.halfDayAllowed,
        hasBalance: false,
        disabled: false,
      });
    });

    // Apply gender filter on every entry.
    if (employeeGender) {
      byCode.forEach((opt, code) => {
        const applicable = genderByCode.get(code) ?? 'ALL';
        if (applicable !== 'ALL' && applicable !== employeeGender) {
          opt.disabled = true;
          opt.disabledReason = 'Not applicable';
        }
      });
    }

    // TODO: probation filter — requires fetching effective policies per leave
    // type and comparing joiningDate + availableAfterMonths with today. The
    // backend already validates at submit time (state "probation_restricted").

    return Array.from(byCode.values());
  }, [balances, fetchedBalances, leaveTypes, employeeGender]);

  const selectedBalance = choiceOptions.find(
    (o) => o.code === leaveFormState.leaveTypeCode,
  );

  // Load published holidays for the user's BU once the drawer opens.
  useEffect(() => {
    if (!showLeaveForm || !organizationId) return;
    if (!buHandle) {
      setHolidays([]);
      return;
    }
    let cancelled = false;
    HrmHolidayService.getPublishedHolidaysForBu({ organizationId,
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
  }, [showLeaveForm, organizationId, buHandle]);

  // Load team calendar so we can show overlapping team-out-of-office.
  useEffect(() => {
    if (!showLeaveForm || !organizationId || !leaveFormState.startDate) return;
    let cancelled = false;
    const start = dayjs(leaveFormState.startDate);
    HrmLeaveService.getTeamCalendar({ organizationId,
      managerId: cookies.supervisorId ?? effectiveEmployeeId,
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
  }, [showLeaveForm, organizationId, leaveFormState.startDate, cookies.supervisorId, effectiveEmployeeId]);

  // Load blackout periods when the drawer opens.
  useEffect(() => {
    if (!showLeaveForm || !organizationId) return;
    let cancelled = false;
    HrmLeaveService.getAllBlackouts({ organizationId })
      .then((res) => {
        if (!cancelled) setBlackouts(res ?? []);
      })
      .catch(() => {
        if (!cancelled) setBlackouts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showLeaveForm, organizationId]);

  // Determine if the selected date range overlaps an active blackout period.
  const overlappingBlackout = useMemo(() => {
    if (!leaveFormState.startDate || !leaveFormState.endDate) return null;
    return blackouts.find((b) => {
      const bStart = dayjs(b.startDate);
      const bEnd = dayjs(b.endDate);
      const sDate = dayjs(leaveFormState.startDate);
      const eDate = dayjs(leaveFormState.endDate);
      // Check overlap: not (end before b.start or start after b.end)
      const overlaps = !(eDate.isBefore(bStart, "day") || sDate.isAfter(bEnd, "day"));
      // Check leave type applicability — empty means all types blocked
      const typeApplies =
        b.applicableLeaveTypes.length === 0 ||
        b.applicableLeaveTypes.includes(leaveFormState.leaveTypeCode);
      return overlaps && typeApplies;
    }) ?? null;
  }, [leaveFormState.startDate, leaveFormState.endDate, blackouts, leaveFormState.leaveTypeCode]);

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
      if (entry.employeeId === effectiveEmployeeId) return;
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
  }, [teamEntries, leaveFormState.startDate, leaveFormState.endDate, effectiveEmployeeId]);

  const availableBalance = selectedBalance?.available ?? 0;
  const balanceKnown = selectedBalance?.hasBalance ?? false;
  const balanceAfter = availableBalance - leaveFormState.totalDays;
  // Only enforce the exceeds-balance check when we actually know the user's
  // balance — otherwise let the backend validate at submit time.
  const exceedsBalance =
    balanceKnown && leaveFormState.totalDays > 0 && balanceAfter < 0;

  // Backdated leave detection
  const isBackdated =
    !!leaveFormState.startDate &&
    dayjs(leaveFormState.startDate).isBefore(dayjs(), "day");
  const daysBackdated = isBackdated
    ? dayjs().diff(dayjs(leaveFormState.startDate), "day")
    : 0;
  // Default max backdated days — backend will also validate
  const maxBackdatedDays = 7;
  const isBackdatedBeyondLimit = daysBackdated > maxBackdatedDays;

  const canSubmit =
    !!leaveFormState.leaveTypeCode &&
    !!leaveFormState.startDate &&
    !!leaveFormState.endDate &&
    leaveFormState.totalDays > 0 &&
    leaveFormState.reason.trim().length > 0 &&
    !exceedsBalance &&
    // Block non-HR users from submitting beyond-limit backdated requests
    !(isBackdatedBeyondLimit && !isHrUser) &&
    // Block non-HR users from submitting during a blackout period
    !(overlappingBlackout && !isHrUser);

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
        organizationId,
        employeeId: effectiveEmployeeId,
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
    } catch (err: unknown) {
      // Extract actual backend error message instead of generic message
      const apiError = err as { response?: { data?: { message_details?: { error?: string }; message?: string } }; message?: string };
      const backendMsg =
        apiError?.response?.data?.message_details?.error ||
        apiError?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to submit leave request";
      message.error(backendMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (!leaveFormState.leaveTypeCode) {
      message.warning("Pick a leave type before saving a draft");
      return;
    }
    if (!leaveFormState.startDate) {
      message.warning("Set a start date before saving a draft");
      return;
    }
    if (leaveFormState.totalDays <= 0) {
      message.warning("Set the number of days before saving a draft");
      return;
    }
    message.success("Draft saved");
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
    const typeName = selectedBalance?.name ?? leaveFormState.leaveTypeCode;
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
                {exceedsBalance
                  ? "Insufficient Balance"
                  : isBackdatedBeyondLimit && !isHrUser
                    ? "Backdated Not Allowed"
                    : overlappingBlackout && !isHrUser
                      ? "Blackout Period"
                      : "Submit Request"}
              </Button>
            </Can>
          </div>
        </div>
      }
    >
      <div className={styles.formGrid}>
        {/* ── Form Column ────────────────────────────────────────────── */}
        <div className={styles.formColumn}>
          {/* Employee: HR gets a picker to choose any employee.
              Regular employees see their own name as read-only. */}
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Employee</span>
            {allowEmployeeSelection ? (
              <>
                <Select
                  showSearch
                  allowClear
                  placeholder="Search and select an employee"
                  value={formTargetEmployeeId ?? undefined}
                  onChange={(value) => setFormTargetEmployeeId(value ?? null)}
                  options={employeeOptions}
                  loading={employeeOptionsLoading}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
                {!formTargetEmployeeId && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Pick an employee to load their leave balances and continue.
                  </Text>
                )}
              </>
            ) : (
              <div style={{
                padding: '5px 11px',
                background: '#f5f5f5',
                borderRadius: 6,
                border: '1px solid #d9d9d9',
                fontSize: 14,
                color: '#262626',
              }}>
                {employeeDisplayName}
              </div>
            )}
          </div>

          {/* Leave type choice cards */}
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Leave Type</span>
            <div className={styles.typeChoiceGrid}>
              {choiceOptions.map((opt) => {
                const selected = leaveFormState.leaveTypeCode === opt.code;
                return (
                  <div
                    key={opt.code}
                    className={`${styles.typeChoiceCard} ${
                      selected ? styles.typeChoiceCardSelected : ""
                    } ${opt.disabled ? styles.typeChoiceCardDisabled ?? "" : ""}`}
                    onClick={() => {
                      if (!opt.disabled) {
                        updateLeaveFormState({ leaveTypeCode: opt.code });
                      }
                    }}
                    title={opt.disabled ? opt.disabledReason : undefined}
                    style={opt.disabled ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                  >
                    <span className={styles.typeChoiceIcon}>{getLeaveIcon(opt.code)}</span>
                    <span className={styles.typeChoiceName}>{opt.name}</span>
                    <span className={styles.typeChoiceBalance}>
                      {opt.disabled
                        ? opt.disabledReason ?? "Not applicable"
                        : opt.hasBalance
                          ? `${opt.available.toFixed(1)} days available`
                          : "Balance not configured"}
                    </span>
                    {selected && !opt.disabled && <span className={styles.typeChoiceCheckmark}>✓</span>}
                  </div>
                );
              })}
              {choiceOptions.length === 0 && (
                <Text type="secondary">
                  {leaveTypesLoading
                    ? "Loading leave types..."
                    : "No leave types configured for this site."}
                </Text>
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
              employeeId={effectiveEmployeeId}
              onStartDateChange={(date, dayType) =>
                updateLeaveFormState({ startDate: date, startDayType: dayType })
              }
              onEndDateChange={(date, dayType) =>
                updateLeaveFormState({ endDate: date, endDayType: dayType })
              }
              onTotalDaysChange={(days) => updateLeaveFormState({ totalDays: days })}
            />

            {/* Backdated leave warnings */}
            {isBackdated && !isBackdatedBeyondLimit && (
              <Alert
                type="warning"
                showIcon
                message="Backdated Leave Request"
                description={`This request is for ${daysBackdated} day(s) in the past. It will be routed to HR for approval.`}
                style={{ marginTop: 8 }}
              />
            )}

            {isBackdatedBeyondLimit && !isHrUser && (
              <Alert
                type="error"
                showIcon
                message="Backdated Request Not Allowed"
                description={`Backdated requests beyond ${maxBackdatedDays} days are not permitted. Please contact HR.`}
                style={{ marginTop: 8 }}
              />
            )}

            {isBackdatedBeyondLimit && isHrUser && (
              <Alert
                type="warning"
                showIcon
                message="Backdated Leave Request (HR Override)"
                description={`This request is ${daysBackdated} day(s) in the past, exceeding the ${maxBackdatedDays}-day limit. Submitting as HR.`}
                style={{ marginTop: 8 }}
              />
            )}

            {overlappingBlackout && !isHrUser && (
              <Alert
                type="error"
                showIcon
                message={`Leave Blackout: ${overlappingBlackout.name}`}
                description={`Leave is restricted from ${overlappingBlackout.startDate} to ${overlappingBlackout.endDate}. Reason: ${overlappingBlackout.reason}`}
                style={{ marginTop: 8 }}
              />
            )}

            {overlappingBlackout && isHrUser && (
              <Alert
                type="warning"
                showIcon
                message={`Leave Blackout: ${overlappingBlackout.name} (HR Override)`}
                description={`Leave is restricted from ${overlappingBlackout.startDate} to ${overlappingBlackout.endDate}. Reason: ${overlappingBlackout.reason}. Submitting as HR — blackout check bypassed.`}
                style={{ marginTop: 8 }}
              />
            )}
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
              options={employeeOptions.filter((opt) => opt.value !== effectiveEmployeeId)}
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
            {!selectedBalance ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Pick a leave type to see your balance preview.
              </Text>
            ) : balanceKnown ? (
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
                    : `Applying ${leaveFormState.totalDays.toFixed(1)} day(s) of ${selectedBalance.name}`}
                </Text>
              </>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Balance not configured for {selectedBalance.name}. Backend will validate on submit.
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
