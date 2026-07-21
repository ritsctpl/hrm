"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Input,
  Select,
  Typography,
  Upload,
  message,
} from "antd";
import { InboxOutlined, DeleteOutlined, CalendarOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import DateRangePicker from "../molecules/DateRangePicker";
import Can from "../../../hrmAccess/components/Can";
import { useCan } from "../../../hrmAccess/hooks/useCan";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { HrmHolidayService } from "../../../hrmHoliday/services/hrmHolidayService";
import { HrmEmployeeService } from "../../../hrmEmployee/services/hrmEmployeeService";
import { mapApiProfileToEmployeeProfile } from "../../../hrmEmployee/utils/transformations";
import { mapBalanceResponseToDomain } from "../../utils/transformations";
import type { EmployeeProfile } from "../../../hrmEmployee/types/domain.types";
import { LeaveBalance, LeaveRequest, LeavePolicy, LeaveAttachment } from "../../types/domain.types";
import {
  checkGenderMaritalEligibility,
  ELIGIBILITY_FLAGS,
  ELIGIBILITY_ERROR_CODES,
} from "../../utils/constants";
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

/** Attachment as held in the drawer. Covers both freshly uploaded files
 *  (which carry `base64`) and attachments already on a draft being edited
 *  (which carry `url`/`id`, plus `base64` only when the BE inlined it). */
type FormAttachment = {
  uid: string;
  name: string;
  contentType: string;
  base64?: string;
  url?: string;
  existing: boolean;
  id?: string;
};

const LeaveRequestFormDrawer: React.FC<LeaveRequestFormDrawerProps> = ({ organizationId,
  employeeId,
  balances,
  allowEmployeeSelection = false,
  onSubmitted,
}) => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Backend accepts composite `"EMP0012 - John Doe"` for employee-id fields
  // across all non-employee services. Falls back to plain employeeCode if
  // fullName hasn't resolved yet (gate the submit on identity.isReady).
  const userId = cookies.userId ?? employeeId;
  const buHandle = cookies.buHandle ?? "";

  // Check permissions for leave request creation
  const requestPerms = useCan("HRM_LEAVE", "leave_request");

  const {
    showLeaveForm,
    leaveFormState,
    leaveTypes,
    formTargetEmployeeId,
    editingDraftHandle,
    editingDraftAttachments,
    closeLeaveForm,
    updateLeaveFormState,
    addMyRequest,
    setLeaveTypes,
    setFormTargetEmployeeId,
    setSelectedRequest,
  } = useHrmLeaveStore();

  // When HR picks an employee, target overrides the prop. Otherwise the
  // logged-in user's id is used.
  //
  // The `employeeId` prop from the parent is now the composite form
  // (`"EMP0012 - John Doe"`) used by non-employee services. For the
  // single employee-service call below (`HrmEmployeeService.fetchProfile`),
  // we need the raw DB handle instead — reach for identity.handle when
  // submitting for self, or fall back to the composite otherwise (the HR
  // picker path; backend will still accept a handle-shaped value).
  const effectiveEmployeeId = formTargetEmployeeId ?? employeeId;
  const effectiveEmployeeHandle = formTargetEmployeeId ?? identity.handle ?? employeeId;
  // HR users (indicated by allowEmployeeSelection) can submit any date
  // without backdated restrictions.
  const isHrUser = allowEmployeeSelection;

  const [submitting, setSubmitting] = useState(false);
  // After a successful Save Draft, the BE returns the draft handle. We keep
  // it so subsequent Save Draft clicks update the same draft in-place (per
  // LeaveRequestServiceImpl saveDraft contract) and the final Submit click
  // transitions DRAFT → PENDING_SUPERVISOR by reusing the @Id instead of
  // generating a duplicate row. When the drawer is opened to edit an
  // existing draft (via openLeaveFormForEdit), the store seeds this with
  // the row's handle so the first Save / Submit in this session also
  // points to the existing row instead of creating a duplicate.
  const [draftHandle, setDraftHandle] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<FormAttachment[]>([]);
  useEffect(() => {
    if (showLeaveForm) {
      setDraftHandle(editingDraftHandle);
      // Seed the attachment list from the draft being edited so existing
      // files are visible and can be removed / replaced (item 8). For a
      // fresh form editingDraftAttachments is empty, clearing the list.
      setAttachments(
        (editingDraftAttachments ?? []).map((a: LeaveAttachment, i) => ({
          uid: a.id || `existing-${i}`,
          name: a.name,
          contentType: a.contentType || "application/octet-stream",
          base64: a.contentBase64,
          url: a.downloadUrl,
          existing: true,
          id: a.id,
        })),
      );
    }
  }, [showLeaveForm, editingDraftHandle, editingDraftAttachments]);
  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);
  const [teamEntries, setTeamEntries] = useState<TeamCalendarEntry[]>([]);
  const [blackouts, setBlackouts] = useState<LeaveBlackoutPeriod[]>([]);
  // Effective policy for the selected leave type — drives negative-balance
  // handling (item 15). Null until a leave type is chosen / policy loads.
  const [effectivePolicy, setEffectivePolicy] = useState<LeavePolicy | null>(null);
  // Policy-eligibility verdict from /leave-request/validate. The backend
  // computes the actual eligible-from date and returns it inside the
  // message, so we render `messages` verbatim rather than composing our own
  // copy from eligibilityMonths.
  const [eligibilityBlock, setEligibilityBlock] = useState<{
    flags: string[];
    messages: string[];
  } | null>(null);
  const [handoverPerson, setHandoverPerson] = useState<string | undefined>();
  const [wfhDetails, setWfhDetails] = useState({ workPlan: "", taskDetails: "", reportingNotes: "" });
  const [maternityDetails, setMaternityDetails] = useState({ childCount: "", childDate: null as string | null });
  const [paternityDetails, setPaternityDetails] = useState({ childBirthDate: null as string | null, childCount: "" });
  const [fetchedBalances, setFetchedBalances] = useState<LeaveBalance[]>([]);
  const [currentProfile, setCurrentProfile] = useState<EmployeeProfile | null>(null);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<{
    loading: boolean;
    hasDuplicate: boolean;
    duplicateRequests: LeaveRequest[];
  }>({ loading: false, hasDuplicate: false, duplicateRequests: [] });

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

  // Resolution priority (most → least authoritative):
  //   1. profileLabel — the freshly-fetched profile fullName + code.
  //   2. useEmployeeIdentity composite — the canonical "<code> - <name>"
  //      contract used everywhere in the leave module. Trust it before
  //      reaching into cookies, because cookies are notoriously stale /
  //      missing for Reporting Manager logins (those frequently lack
  //      cookies.fullName / cookies.employeeName, which used to leave
  //      this label rendering only the email or "Current user").
  //   3. matchedEmployee — directory lookup by handle / code / email.
  //   4. cookies — last-ditch fallbacks, may render an email.
  // Use || (not ??) so empty-string cookies fall through.
  const employeeDisplayName =
    profileLabel ||
    (identity.isReady && identity.employeeCode && identity.fullName
      ? `${identity.employeeCode} - ${identity.fullName}`
      : "") ||
    identity.employeeIdWithName ||
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
          setFetchedBalances((res ?? []).map(mapBalanceResponseToDomain));
        })
        .catch(() => {
          if (!cancelled) setFetchedBalances([]);
        });
      HrmEmployeeService.fetchProfile(organizationId, effectiveEmployeeHandle)
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

  // Derive the employee's gender and marital status from the fetched
  // profile so that gender-restricted and marital-restricted leave types
  // (Maternity → married female, Paternity → married male) can be hidden
  // / disabled.
  const employeeGender = currentProfile?.personalDetails?.gender?.toUpperCase();
  const employeeMarital = currentProfile?.personalDetails?.maritalStatus?.toUpperCase();

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
      /** Whether the policy on this balance row permits a negative balance. */
      negativeBalanceAllowed?: boolean;
      /** Magnitude of the negative balance the policy permits. */
      negativeFloor?: number;
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
        negativeBalanceAllowed: b.negativeBalanceAllowed,
        negativeFloor: b.negativeFloor,
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

    // Maternity / Paternity eligibility (item 1) — applied even when the
    // leave type carries no gender/marital config, because the codes
    // themselves imply the rule.
    if (currentProfile) {
      byCode.forEach((opt, code) => {
        const eligibility = checkGenderMaritalEligibility(
          code,
          employeeGender,
          employeeMarital,
        );
        if (!eligibility.ok) {
          opt.disabled = true;
          opt.disabledReason = eligibility.reason ?? "Not applicable";
        }
      });
    }

    // Probation / tenure filtering is handled by the eligibility pre-check
    // below, which asks the backend to evaluate eligibilityMonths against the
    // policy anchor rather than re-deriving the rule here.

    return Array.from(byCode.values());
  }, [balances, fetchedBalances, leaveTypes, employeeGender, employeeMarital, currentProfile]);

  const selectedBalance = choiceOptions.find(
    (o) => o.code === leaveFormState.leaveTypeCode,
  );

  const leaveTypeCategory = useMemo(() => {
    const code = (leaveFormState.leaveTypeCode ?? "").toUpperCase();
    if (!code) return "STANDARD";
    if (code.includes("WFH")) return "WFH";
    if (code === "ML" || code.includes("MATERNITY")) return "MATERNITY";
    if (code === "PAT" || code.includes("PATERNITY")) return "PATERNITY";
    return "STANDARD";
  }, [leaveFormState.leaveTypeCode]);

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

  // Check for duplicate leave requests when dates change
  useEffect(() => {
    if (!showLeaveForm || !organizationId || !leaveFormState.startDate || !leaveFormState.endDate || !effectiveEmployeeId) {
      setDuplicateCheck({ loading: false, hasDuplicate: false, duplicateRequests: [] });
      return;
    }

    let cancelled = false;
    setDuplicateCheck(prev => ({ ...prev, loading: true }));

    HrmLeaveService.checkDuplicateLeaveRequest({
      organizationId,
      employeeId: effectiveEmployeeId,
      startDate: leaveFormState.startDate,
      endDate: leaveFormState.endDate,
      excludeRequestId: draftHandle || undefined,
    })
      .then((result) => {
        if (!cancelled) {
          setDuplicateCheck({
            loading: false,
            hasDuplicate: result.hasDuplicate,
            duplicateRequests: result.duplicateRequests,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateCheck({ loading: false, hasDuplicate: false, duplicateRequests: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showLeaveForm, organizationId, leaveFormState.startDate, leaveFormState.endDate, effectiveEmployeeId, draftHandle]);

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

  // Load the effective policy for the chosen leave type so we know whether
  // a negative balance is permitted and down to what floor (item 15).
  useEffect(() => {
    if (!showLeaveForm || !organizationId || !leaveFormState.leaveTypeCode) {
      setEffectivePolicy(null);
      return;
    }
    const lt = leaveTypes.find((t) => t.code === leaveFormState.leaveTypeCode);
    if (!lt) {
      setEffectivePolicy(null);
      return;
    }
    let cancelled = false;
    HrmLeaveService.getEffectivePolicy({
      organizationId,
      leaveTypeId: lt.handle,
      buId: buHandle || undefined,
      employeeId: effectiveEmployeeId || undefined,
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
  }, [showLeaveForm, organizationId, leaveFormState.leaveTypeCode, leaveTypes, buHandle]);

  // ── Policy eligibility pre-check ───────────────────────────────────
  // Ask the backend whether this employee may take this leave type at all
  // (service tenure from the accrual anchor, employment status). Submitting
  // regardless returns LEAVE_NOT_YET_ELIGIBLE / LEAVE_STATUS_NOT_ELIGIBLE,
  // so catching it here keeps the failure inline instead of post-submit.
  useEffect(() => {
    const { leaveTypeCode, startDate, endDate } = leaveFormState;
    if (
      !showLeaveForm ||
      !organizationId ||
      !leaveTypeCode ||
      !startDate ||
      !endDate ||
      !effectiveEmployeeId
    ) {
      setEligibilityBlock(null);
      return;
    }
    let cancelled = false;
    // Debounced — the date pickers fire in quick succession while the user
    // adjusts a range.
    const timer = setTimeout(() => {
      HrmLeaveService.validateLeaveRequest({
        organizationId,
        employeeId: effectiveEmployeeId,
        leaveTypeCode,
        startDate,
        endDate,
        startDayType: leaveFormState.startDayType,
        endDayType: leaveFormState.endDayType,
        totalDays: leaveFormState.totalDays,
        reason: leaveFormState.reason || "",
        createdBy: identity.employeeIdWithName || "",
      })
        .then((res) => {
          if (cancelled) return;
          const flags = [
            ...(res?.conflictFlags ?? []),
            // Some backends report the failure as the summary state rather
            // than a conflict flag; accept either.
            ...(res?.state ? [res.state] : []),
          ].filter((f) => ELIGIBILITY_FLAGS.includes(f));
          setEligibilityBlock(
            flags.length > 0
              ? { flags, messages: res?.messages ?? [] }
              : null,
          );
        })
        .catch(() => {
          // Validation is advisory here — the backend still rejects at
          // submit. Don't block the form on a transport failure.
          if (!cancelled) setEligibilityBlock(null);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showLeaveForm,
    organizationId,
    effectiveEmployeeId,
    leaveFormState.leaveTypeCode,
    leaveFormState.startDate,
    leaveFormState.endDate,
    leaveFormState.startDayType,
    leaveFormState.endDayType,
    leaveFormState.totalDays,
  ]);

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
      setAttachments((prev) => [
        ...prev,
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

  // Build the upload payload: only attachments we have content (base64) for
  // can be (re)sent. Newly uploaded files always qualify; existing draft
  // attachments qualify only when the BE inlined their base64.
  const buildAttachmentUploads = () =>
    attachments
      .filter((a) => !!a.base64)
      .map((a) => ({
        name: a.name,
        contentType: a.contentType,
        contentBase64: a.base64 as string,
      }));

  // View / Download work immediately, before any save round-trip. The BE
  // returns contentBase64 as raw base64 (no `data:<mime>;base64,` prefix)
  // and downloadUrl as a relative path that doesn't open cleanly, so build
  // a proper data URI from base64 + contentType. Newly uploaded files
  // already carry the data: prefix (FileReader.readAsDataURL), so the
  // helper short-circuits in that case.
  const attachmentHref = (a: FormAttachment): string => {
    if (a.base64) {
      return a.base64.startsWith("data:")
        ? a.base64
        : `data:${a.contentType || "application/octet-stream"};base64,${a.base64}`;
    }
    return a.url || "";
  };

  const viewAttachment = (a: FormAttachment) => {
    const href = attachmentHref(a);
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const downloadAttachment = (a: FormAttachment) => {
    const href = attachmentHref(a);
    if (!href) return;
    const link = document.createElement("a");
    link.href = href;
    link.download = a.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // ── Policy-driven eligibility (item 1) ─────────────────────────────
  // Beyond the hardcoded ML / PAT rule on the choice cards, the effective
  // policy can carry applicableGender + applicableMaritalStatus that pin
  // the leave type to a subset of employees (e.g. married females only).
  // When the employee's profile mismatches, surface a clear inline error
  // and block submit.
  const policyApplicabilityError = useMemo<string | null>(() => {
    if (!effectivePolicy || !currentProfile) return null;
    const allowedGender = (effectivePolicy.applicableGender ?? "ALL").toUpperCase();
    const allowedMarital = (effectivePolicy.applicableMaritalStatus ?? "ALL").toUpperCase();
    const empG = (employeeGender ?? "").toUpperCase();
    const empM = (employeeMarital ?? "").toUpperCase();
    const typeName = selectedBalance?.name ?? leaveFormState.leaveTypeCode ?? "This leave type";
    if (allowedGender !== "ALL" && empG && allowedGender !== empG) {
      return `${typeName} is restricted to ${allowedGender.toLowerCase()} employees per policy.`;
    }
    if (allowedMarital !== "ALL" && empM && allowedMarital !== empM) {
      return `${typeName} is restricted to ${allowedMarital.toLowerCase()} employees per policy.`;
    }
    return null;
  }, [
    effectivePolicy,
    currentProfile,
    employeeGender,
    employeeMarital,
    selectedBalance,
    leaveFormState.leaveTypeCode,
  ]);

  // ── Negative-balance handling (item 15) ────────────────────────────
  // Source of truth for these is the /leave-balance/retrieve row when it
  // carries them (now the authoritative answer per BE update). Fall back
  // to /leave-policy/effective when the balance row is silent — older
  // backends still rely on that. `negativeFloor` is a magnitude (e.g.
  // `2.0` ⇒ "2 days negative allowed"); the actual minimum balance is
  // therefore −|negativeFloor|. Math.abs makes the check robust whether
  // the value arrives positive (2) or negative (−2).
  const negativeAllowed =
    selectedBalance?.negativeBalanceAllowed ??
    effectivePolicy?.negativeBalanceAllowed ??
    false;
  const negativeFloor =
    selectedBalance?.negativeFloor != null
      ? selectedBalance.negativeFloor
      : effectivePolicy?.negativeFloor ?? null;
  const minAllowedBalance =
    negativeAllowed && negativeFloor != null ? -Math.abs(negativeFloor) : 0;
  const goesNegative =
    balanceKnown && leaveFormState.totalDays > 0 && balanceAfter < 0;
  // Blocking condition: negatives disallowed → any negative blocks; allowed
  // → only dropping below the configured floor blocks (balanceAfter is
  // below −|negativeFloor|). When the policy allows negatives without a
  // floor, nothing blocks on balance.
  const exceedsBalance =
    balanceKnown &&
    leaveFormState.totalDays > 0 &&
    (negativeAllowed
      ? negativeFloor != null && balanceAfter < minAllowedBalance
      : balanceAfter < 0);
  // Non-blocking warning: balance goes negative but the policy allows it.
  const negativeWarning = goesNegative && !exceedsBalance;

  // ── Backdated handling (item 16) ───────────────────────────────────
  // Past-dated leave is allowed, but non-HR users may only backdate up to 30
  // days from today; earlier dates must be routed through HR.
  const isBackdated =
    !!leaveFormState.startDate &&
    dayjs(leaveFormState.startDate).isBefore(dayjs(), "day");
  const daysBackdated = isBackdated
    ? dayjs().diff(dayjs(leaveFormState.startDate), "day")
    : 0;
  const earliestAllowed = dayjs().subtract(30, "day");
  const tooOld =
    !!leaveFormState.startDate &&
    dayjs(leaveFormState.startDate).isBefore(earliestAllowed, "day");
  const backdatedBlocked = tooOld && !isHrUser;

  // ── Duplicate handling (item 22) ───────────────────────────────────
  // Cancelled / rejected (and deleted) requests must not block re-applying
  // for the same dates — only still-active overlaps are blocking.
  const blockingDuplicates = duplicateCheck.duplicateRequests.filter(
    (r) => !["CANCELLED", "REJECTED"].includes(r.status),
  );
  const hasBlockingDuplicate =
    duplicateCheck.hasDuplicate && blockingDuplicates.length > 0;

  const canSubmit =
    !!leaveFormState.leaveTypeCode &&
    !!leaveFormState.startDate &&
    !!leaveFormState.endDate &&
    leaveFormState.totalDays > 0 &&
    leaveFormState.reason.trim().length > 0 &&
    !exceedsBalance &&
    !hasBlockingDuplicate &&
    requestPerms.canAdd &&
    // Block non-HR users from backdating more than 30 days in the past
    !backdatedBlocked &&
    // Block non-HR users from submitting during a blackout period
    !(overlappingBlackout && !isHrUser) &&
    // Block when the effective policy restricts this leave type to a
    // gender / marital status the employee doesn't match.
    !policyApplicabilityError &&
    // Block when the backend says the employee hasn't served long enough
    // from the accrual anchor, or their employment status is out of scope.
    !eligibilityBlock;

  const handleReset = () => {
    setAttachments([]);
    setEligibilityBlock(null);
    setHandoverPerson(undefined);
    setDraftHandle(null);
    setWfhDetails({ workPlan: "", taskDetails: "", reportingNotes: "" });
    setMaternityDetails({ childCount: "", childDate: null });
    setPaternityDetails({ childBirthDate: null, childCount: "" });
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

  const buildExtendedReason = () => {
    let r = leaveFormState.reason.trim();
    if (leaveTypeCategory === "WFH") {
      if (wfhDetails.workPlan) r += `\n[Work Plan: ${wfhDetails.workPlan}]`;
      if (wfhDetails.taskDetails) r += `\n[Tasks: ${wfhDetails.taskDetails}]`;
      if (wfhDetails.reportingNotes) r += `\n[Reporting Notes: ${wfhDetails.reportingNotes}]`;
    } else if (leaveTypeCategory === "MATERNITY") {
      if (maternityDetails.childCount) r += `\n[Child: ${maternityDetails.childCount} child]`;
      if (maternityDetails.childDate) r += `\n[Expected/Birth Date: ${maternityDetails.childDate}]`;
    } else if (leaveTypeCategory === "PATERNITY") {
      if (paternityDetails.childBirthDate) r += `\n[Child Birth Date: ${paternityDetails.childBirthDate}]`;
      if (paternityDetails.childCount) r += `\n[Child: ${paternityDetails.childCount} child]`;
    }
    return r;
  };

  const handleClose = () => {
    handleReset();
    closeLeaveForm();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !leaveFormState.leaveTypeCode) return;
    if (!identity.isReady) {
      message.error("Employee identity not resolved yet. Please retry.");
      return;
    }
    
    // Check if user has permission to create leave requests
    if (!requestPerms.canAdd) {
      message.error("You don't have permission to create leave requests.");
      return;
    }
    
    setSubmitting(true);
    try {
      // When HR is submitting on behalf of another employee (formTarget is
      // set), the `employeeId` field must carry that employee's composite
      // id — not the logged-in user's. When there's no override, the
      // submitter is also the leave owner, so we use identity.
      // NOTE: formTargetEmployeeId currently flows from the picker as a
      // UUID/code; HR-override path still needs the picker to emit
      // composite values — tracked as part of the broader PR 2 sweep.
      const submitterComposite = identity.employeeIdWithName;
      const employeeIdForPayload = formTargetEmployeeId ?? submitterComposite;

      const payload = {
        organizationId,
        employeeId: employeeIdForPayload,
        leaveTypeCode: leaveFormState.leaveTypeCode,
        startDate: leaveFormState.startDate!,
        endDate: leaveFormState.endDate!,
        startDayType: leaveFormState.startDayType,
        endDayType: leaveFormState.endDayType,
        totalDays: leaveFormState.totalDays,
        reason: buildExtendedReason(),
        createdBy: submitterComposite,
        // Send attachments only when we have file content to send. Omitting
        // the field preserves whatever the BE already holds on the draft.
        ...(buildAttachmentUploads().length > 0
          ? { attachments: buildAttachmentUploads() }
          : {}),
        handoverEmployeeId: handoverPerson,
        // When the user saved as draft first, pass the handle so BE
        // transitions DRAFT → PENDING_SUPERVISOR on the same row instead
        // of creating a duplicate.
        ...(draftHandle ? { handle: draftHandle } : {}),
      } as Parameters<typeof HrmLeaveService.submitLeaveRequest>[0];
      const result = await HrmLeaveService.submitLeaveRequest(payload);
      addMyRequest(result);
      // Surface the newly submitted request in the right panel so the user
      // immediately sees what they just created (replaces whatever was
      // selected before, or fills an empty panel).
      setSelectedRequest(result);
      message.success("Leave request submitted successfully");
      handleClose();
      onSubmitted();
    } catch (err: unknown) {
      // Extract actual backend error message instead of generic message
      const apiError = err as {
        response?: {
          data?: {
            message_details?: { error?: string };
            message?: string;
            errorCode?: string;
            messages?: string[];
          };
        };
        message?: string;
      };
      const backendMsg =
        apiError?.response?.data?.message_details?.error ||
        apiError?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to submit leave request";
      // Eligibility rejections belong on the form next to the offending
      // field, not in a toast that disappears. Promote them to the inline
      // alert (which also disables submit) instead of flashing a message.
      const errorCode = apiError?.response?.data?.errorCode;
      const eligibilityFlag = errorCode ? ELIGIBILITY_ERROR_CODES[errorCode] : undefined;
      if (eligibilityFlag) {
        setEligibilityBlock({
          flags: [eligibilityFlag],
          messages: apiError?.response?.data?.messages ?? [backendMsg],
        });
      } else {
        message.error(backendMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const [savingDraft, setSavingDraft] = useState(false);

  const handleSaveDraft = async () => {
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
    if (!identity.isReady) {
      message.error("Employee identity not resolved yet. Please retry.");
      return;
    }
    setSavingDraft(true);
    try {
      const submitterComposite = identity.employeeIdWithName;
      const employeeIdForPayload = formTargetEmployeeId ?? submitterComposite;
      const payload = {
        organizationId,
        employeeId: employeeIdForPayload,
        leaveTypeCode: leaveFormState.leaveTypeCode,
        startDate: leaveFormState.startDate!,
        endDate: leaveFormState.endDate ?? leaveFormState.startDate!,
        startDayType: leaveFormState.startDayType,
        endDayType: leaveFormState.endDayType,
        totalDays: leaveFormState.totalDays,
        reason: buildExtendedReason(),
        createdBy: submitterComposite,
        // Per BE saveDraft contract: attachments are only replaced when a
        // non-empty list is sent. So we omit the field on re-save when there
        // is no new file content — preserves whatever the BE already has on
        // the draft row.
        ...(buildAttachmentUploads().length > 0
          ? { attachments: buildAttachmentUploads() }
          : {}),
        handoverEmployeeId: handoverPerson,
        // When we already saved this draft once, pass the handle so BE
        // updates in-place instead of creating a new DRAFT row.
        ...(draftHandle ? { handle: draftHandle } : {}),
      } as Parameters<typeof HrmLeaveService.saveDraftLeaveRequest>[0];
      const result = await HrmLeaveService.saveDraftLeaveRequest(payload);
      // Capture the handle so the next Save Draft / Submit click on this
      // same drawer references the same row. The drawer stays open so the
      // user can continue editing — closing happens only on full Submit
      // or explicit Cancel.
      if (result?.handle) {
        setDraftHandle(result.handle);
      }
      addMyRequest(result);
      // Reflect the freshly saved / updated draft in the right panel so it
      // is visible behind the drawer and once the user closes the drawer.
      setSelectedRequest(result);
      message.success(draftHandle ? "Draft updated" : "Draft saved — keep editing or click Submit when ready");
      onSubmitted();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message_details?: { error?: string; msg?: string }; message?: string } }; message?: string };
      const backendMsg =
        apiError?.response?.data?.message_details?.msg ||
        apiError?.response?.data?.message_details?.error ||
        apiError?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to save draft";
      message.error(backendMsg);
    } finally {
      setSavingDraft(false);
    }
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
            <Button onClick={handleSaveDraft} loading={savingDraft}>Save as Draft</Button>
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
                {policyApplicabilityError
                  ? "Not Eligible"
                  : exceedsBalance
                    ? negativeAllowed && negativeFloor != null
                      ? "Exceeds Negative Limit"
                      : "Insufficient Balance"
                    // : hasBlockingDuplicate
                    //   ? "Duplicate Request Exists"
                      : backdatedBlocked
                        ? "Older Than 30 Days"
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
              leaveTypeCode={leaveFormState.leaveTypeCode}
              onStartDateChange={(date, dayType) =>
                updateLeaveFormState({ startDate: date, startDayType: dayType })
              }
              onEndDateChange={(date, dayType) =>
                updateLeaveFormState({ endDate: date, endDayType: dayType })
              }
              onTotalDaysChange={(days) => updateLeaveFormState({ totalDays: days })}
            />

            {/* Backdated leave warnings (item 16).
                Non-HR users may backdate up to 30 days; earlier dates are
                blocked and must be routed through HR. HR users get an override
                notice but can still submit. Requests within the window submit
                normally and any HR-approval routing happens in the backend. */}
            {tooOld && !isHrUser && (
              <Alert
                type="error"
                showIcon
                message="Backdated Request Not Allowed"
                description="Backdated leave is only allowed up to 30 days in the past. Please contact HR for earlier dates."
                style={{ marginTop: 8 }}
              />
            )}

            {tooOld && isHrUser && (
              <Alert
                type="warning"
                showIcon
                message="Backdated Leave Request (HR Override)"
                description={`This request is ${daysBackdated} day(s) in the past, more than 30 days back. Submitting as HR.`}
                style={{ marginTop: 8 }}
              />
            )}

            {/* Negative-balance warning (item 15) — shown when the policy
                permits a negative balance and this request crosses zero.
                negativeFloor is a magnitude (e.g. 2.0 = "2 days negative
                allowed"); show the actual floor as a negative day count. */}
            {policyApplicabilityError && (
              <Alert
                type="error"
                showIcon
                message="Not Eligible"
                description={policyApplicabilityError}
                style={{ marginTop: 8 }}
              />
            )}

            {/* Policy eligibility (service tenure / employment status). The
                backend message already carries the computed eligible-from
                date, so it is rendered as returned rather than rebuilt. */}
            {eligibilityBlock && (
              <Alert
                type="error"
                showIcon
                message={
                  eligibilityBlock.flags.includes("status_not_eligible")
                    ? "Not Eligible for Your Employment Status"
                    : "Not Yet Eligible"
                }
                description={
                  eligibilityBlock.messages.length > 0 ? (
                    eligibilityBlock.messages.map((m, i) => (
                      <div key={i}>{m}</div>
                    ))
                  ) : (
                    <div>
                      This leave type is not yet available to you under the
                      current policy.
                    </div>
                  )
                }
                style={{ marginTop: 8 }}
              />
            )}

            {negativeWarning && (
              <Alert
                type="warning"
                showIcon
                message="You are using negative leave balance"
                description={
                  <>
                    <div>
                      <strong>Available Leave:</strong> {balanceAfter.toFixed(1)} day(s)
                    </div>
                    {negativeFloor != null && (
                      <>
                        <div>
                          <strong>Negative Floor:</strong> {Math.abs(negativeFloor).toFixed(1)} day(s)
                        </div>
                        <div>
                          <strong>Remaining Negative:</strong>{" "}
                          {Math.max(0, Math.abs(negativeFloor) - Math.abs(balanceAfter)).toFixed(1)} day(s)
                        </div>
                      </>
                    )}
                  </>
                }
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

            {/* Duplicate leave request validation (item 22 — cancelled /
                rejected / deleted requests don't block re-applying) */}
            {hasBlockingDuplicate && (
              <Alert
                type="error"
                showIcon
                message="Duplicate Leave Request Detected"
                description={
                  <div>
                    <p>You already have a leave request for overlapping dates:</p>
                    <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                      {blockingDuplicates.map((req) => (
                        <li key={req.handle}>
                          <strong>{req.leaveTypeName || req.leaveTypeCode}</strong> from{" "}
                          {new Date(req.startDate).toLocaleDateString("en-GB")} to{" "}
                          {new Date(req.endDate).toLocaleDateString("en-GB")} - Status: {req.status}
                        </li>
                      ))}
                    </ul>
                    <p>Please cancel or modify the existing request before creating a new one.</p>
                  </div>
                }
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          {/* ── Dynamic fields based on leave type ─────────────────── */}
          {leaveTypeCategory === "WFH" && (
            <>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Work Plan <Text type="secondary" style={{ fontSize: 11 }}>(required for WFH)</Text></span>
                <Input.TextArea
                  rows={3}
                  placeholder="Describe what you plan to work on (tasks, meetings, deliverables)"
                  value={wfhDetails.workPlan}
                  onChange={(e) => setWfhDetails((d) => ({ ...d, workPlan: e.target.value }))}
                  maxLength={500}
                  showCount
                />
              </div>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Task Details</span>
                <Input.TextArea
                  rows={2}
                  placeholder="List specific tasks or project deliverables"
                  value={wfhDetails.taskDetails}
                  onChange={(e) => setWfhDetails((d) => ({ ...d, taskDetails: e.target.value }))}
                  maxLength={300}
                  showCount
                />
              </div>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Reporting Notes</span>
                <Input.TextArea
                  rows={2}
                  placeholder="How will you stay reachable? (e.g. Slack, MS Teams, scheduled calls)"
                  value={wfhDetails.reportingNotes}
                  onChange={(e) => setWfhDetails((d) => ({ ...d, reportingNotes: e.target.value }))}
                  maxLength={300}
                  showCount
                />
              </div>
            </>
          )}

          {leaveTypeCategory === "MATERNITY" && (
            <>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Child Number</span>
                <Select
                  placeholder="Is this for the 1st or 2nd child?"
                  value={maternityDetails.childCount || undefined}
                  onChange={(val) => setMaternityDetails((d) => ({ ...d, childCount: val }))}
                  style={{ width: "100%" }}
                  options={[
                    { value: "1st", label: "1st Child" },
                    { value: "2nd", label: "2nd Child" },
                    { value: "3rd+", label: "3rd Child or more" },
                  ]}
                />
              </div>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Expected / Actual Birth Date</span>
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Select expected or actual birth date"
                  value={maternityDetails.childDate ? dayjs(maternityDetails.childDate) : null}
                  onChange={(_, str) => setMaternityDetails((d) => ({ ...d, childDate: str as string || null }))}
                />
              </div>
              <Alert
                type="info"
                showIcon
                message="Medical Document Required"
                description="Please attach a medical certificate or hospital letter in the Supporting Documents section below."
                style={{ marginBottom: 8 }}
              />
            </>
          )}

          {leaveTypeCategory === "PATERNITY" && (
            <>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Child Birth Date</span>
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Select child's birth date"
                  value={paternityDetails.childBirthDate ? dayjs(paternityDetails.childBirthDate) : null}
                  onChange={(_, str) => setPaternityDetails((d) => ({ ...d, childBirthDate: str as string || null }))}
                />
              </div>
              <div className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Child Number</span>
                <Select
                  placeholder="Is this for the 1st or 2nd child?"
                  value={paternityDetails.childCount || undefined}
                  onChange={(val) => setPaternityDetails((d) => ({ ...d, childCount: val }))}
                  style={{ width: "100%" }}
                  options={[
                    { value: "1st", label: "1st Child" },
                    { value: "2nd", label: "2nd Child" },
                    { value: "3rd+", label: "3rd Child or more" },
                  ]}
                />
              </div>
              <Alert
                type="info"
                showIcon
                message="Supporting Document Required"
                description="Please attach a birth certificate or hospital discharge document in the Supporting Documents section below."
                style={{ marginBottom: 8 }}
              />
            </>
          )}

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
                    <li key={a.uid} className={styles.attachmentItem}>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.name}
                      </span>
                      {a.existing && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 6, marginRight: 6 }}>
                          saved
                        </Text>
                      )}
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => viewAttachment(a)}
                        disabled={!attachmentHref(a)}
                      >
                        View
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadAttachment(a)}
                        disabled={!attachmentHref(a)}
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
                    style={
                      balanceAfter < 0 && !exceedsBalance ? { color: "#d97706" } : undefined
                    }
                  >
                    {balanceAfter.toFixed(1)}
                  </span>
                  <span style={{ marginLeft: 4 }}>days</span>
                </div>
                <Text style={{ fontSize: 11, color: exceedsBalance ? "#dc2626" : "#64748b" }}>
                  {exceedsBalance
                    ? negativeAllowed && negativeFloor != null
                      ? `Requested leave exceeds the allowed negative limit (floor: ${(-Math.abs(negativeFloor)).toFixed(1)} day(s)).`
                      : `Exceeds available balance by ${Math.abs(balanceAfter).toFixed(1)} day(s)`
                    : `Applying ${leaveFormState.totalDays.toFixed(1)} day(s) of ${selectedBalance.name}`}
                </Text>
                {/* Item 4: when a negative balance is permitted by policy and
                    this request takes the balance below zero, surface the
                    exact floor + remaining-negative numbers so the user
                    knows how far the policy still allows them to go. */}
                {goesNegative && negativeAllowed && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #fde68a" }}>
                    <Text style={{ fontSize: 11, display: "block" }}>
                      <strong>Available Leave:</strong> {balanceAfter.toFixed(1)} day(s)
                    </Text>
                    {negativeFloor != null && (
                      <>
                        <Text style={{ fontSize: 11, display: "block" }}>
                          <strong>Negative Floor:</strong> {Math.abs(negativeFloor).toFixed(1)} day(s)
                        </Text>
                        <Text style={{ fontSize: 11, display: "block" }}>
                          <strong>Remaining Negative:</strong>{" "}
                          {Math.max(0, Math.abs(negativeFloor) - Math.abs(balanceAfter)).toFixed(1)} day(s)
                        </Text>
                      </>
                    )}
                    <Text type="warning" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                      Warning: You are using negative leave balance.
                    </Text>
                  </div>
                )}
                {/* Item 7: prorate badge — surface the configured entitlement
                    and the joining date the proration is anchored against
                    when the policy enables it. */}
                {effectivePolicy?.prorateEnabled && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                    <Text style={{ fontSize: 11, display: "block" }}>
                      <strong>Prorate:</strong> Enabled
                    </Text>
                    <Text style={{ fontSize: 11, display: "block" }}>
                      <strong>Annual Entitlement:</strong>{" "}
                      {(Number(effectivePolicy.accrualQuantity) || 0).toFixed(1)} day(s)
                    </Text>
                    {currentProfile?.officialDetails?.joiningDate && (
                      <Text style={{ fontSize: 11, display: "block" }}>
                        <strong>Joining Date:</strong>{" "}
                        {dayjs(currentProfile.officialDetails.joiningDate).format("DD MMM YYYY")}
                      </Text>
                    )}
                  </div>
                )}
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
