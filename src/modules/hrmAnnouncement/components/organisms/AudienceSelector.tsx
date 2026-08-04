"use client";

import React from "react";
import { Radio, Select, Space, Typography, Alert, Spin, Tag, Row, Col } from "antd";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmAnnouncementService } from "../../services/hrmAnnouncementService";
import { HrmOrganizationService } from "@/modules/hrmOrganization/services/hrmOrganizationService";
import { HrmEmployeeService } from "@/modules/hrmEmployee/services/hrmEmployeeService";
import { HrmAccessService } from "@/modules/hrmAccess/services/hrmAccessService";
import type { AudienceResolution } from "../../types/api.types";
import type { BusinessUnit, Department } from "@/modules/hrmOrganization/types/domain.types";
import type { EmployeeDirectoryRow } from "@/modules/hrmEmployee/types/api.types";
import type { RoleResponse } from "@/modules/hrmAccess/types/api.types";

const { Text } = Typography;

/**
 * One page of employee results. The picker searches server-side rather than
 * prefetching the directory, so this is a page size, not a ceiling on who can
 * be chosen.
 */
const EMPLOYEE_PAGE_SIZE = 50;

export interface AudienceValue {
  allEmployees: boolean;
  targetBusinessUnits: string[];
  targetDepartments: string[];
  targetRoles: string[];
  targetEmployeeIds: string[];
}

export const EMPTY_AUDIENCE: AudienceValue = {
  allEmployees: true,
  targetBusinessUnits: [],
  targetDepartments: [],
  targetRoles: [],
  targetEmployeeIds: [],
};

/** True when nothing is targeted — the announcement would reach nobody. */
export function isAudienceEmpty(v: AudienceValue): boolean {
  return (
    !v.allEmployees &&
    !v.targetBusinessUnits.length &&
    !v.targetDepartments.length &&
    !v.targetRoles.length &&
    !v.targetEmployeeIds.length
  );
}

interface AudienceSelectorProps {
  value: AudienceValue;
  onChange: (value: AudienceValue) => void;
  disabled?: boolean;
}

/**
 * Recipient selection for the composer.
 *
 * The server treats targeting as **additive**: an employee matching any selected
 * BU, department, role or explicit code receives it. `allEmployees` overrides the
 * lot. Every control here is therefore a widening one, and the UI says so — an
 * earlier version nested departments under business units, which read as a
 * drill-down and led authors to expect "Manufacturing → QA" to mean the dozen
 * people in QA rather than the whole business unit.
 *
 * The resolved count is shown before save on purpose: "I didn't realise this
 * went to all 148 people" is the most common post-publish regret (screen.md §2),
 * and unlike a draft, a publish cannot be recalled once the mail is queued.
 */
const AudienceSelector: React.FC<AudienceSelectorProps> = ({ value, onChange, disabled }) => {
  const organizationId = getOrganizationId();

  const [businessUnits, setBusinessUnits] = React.useState<BusinessUnit[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [roles, setRoles] = React.useState<RoleResponse[]>([]);
  const [loadingRef, setLoadingRef] = React.useState(false);

  const [employees, setEmployees] = React.useState<EmployeeDirectoryRow[]>([]);
  const [employeeTotal, setEmployeeTotal] = React.useState(0);
  const [employeeSearch, setEmployeeSearch] = React.useState("");
  const [employeesLoading, setEmployeesLoading] = React.useState(false);

  /**
   * Labels for employees that have been picked. A server-side search only
   * returns what matches the current query, so without this a selected employee
   * renders as a bare code the moment the search box is retyped.
   */
  const employeeLabels = React.useRef<Record<string, string>>({});

  const [preview, setPreview] = React.useState<AudienceResolution | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // Reference data — loaded once, tolerant of individual failures so one bad
  // endpoint doesn't blank every picker.
  React.useEffect(() => {
    if (!organizationId) return;
    setLoadingRef(true);
    Promise.allSettled([
      HrmOrganizationService.fetchBusinessUnitsBySite(organizationId),
      HrmAccessService.fetchActiveRoles(organizationId),
    ])
      .then(async ([bu, role]) => {
        const units = bu.status === "fulfilled" ? bu.value ?? [] : [];
        setBusinessUnits(units);
        if (role.status === "fulfilled") setRoles(role.value ?? []);

        // Departments are only queryable per business unit, but the picker must
        // offer all of them regardless of what is selected above — a department
        // is an independent target, not a child of a chosen BU. Sites have a
        // handful of BUs, so fanning out is cheaper than the cascade it replaces.
        const perBu = await Promise.allSettled(
          units
            .map((b) => b.handle)
            .filter(Boolean)
            .map((h) => HrmOrganizationService.fetchDepartments(organizationId, h))
        );
        setDepartments(
          perBu.flatMap((r) => (r.status === "fulfilled" ? r.value ?? [] : []))
        );
      })
      .finally(() => setLoadingRef(false));
  }, [organizationId]);

  /**
   * Employee search, server-side and debounced.
   *
   * The previous implementation prefetched 500 rows ordered by creation date and
   * filtered them in the browser, so at higher headcount the longest-serving
   * employees were simply unselectable with nothing to indicate it.
   *
   * `status: "ACTIVE"` mirrors what the server's audience query counts as a
   * recipient (`active == 1 && status == "ACTIVE"`). Filtering on `isActive`
   * instead — a separate, nullable field — hid employees who were valid
   * recipients, so the picker and the delivery disagreed about who exists.
   */
  React.useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setEmployeesLoading(true);
      try {
        const res = await HrmEmployeeService.fetchDirectory({
          organizationId,
          keyword: employeeSearch.trim() || undefined,
          status: "ACTIVE",
          size: EMPLOYEE_PAGE_SIZE,
        });
        if (cancelled) return;
        const rows = res?.employees ?? [];
        rows.forEach((e) => {
          employeeLabels.current[e.employeeCode] = `${e.employeeCode} — ${e.fullName}`;
        });
        setEmployees(rows);
        setEmployeeTotal(res?.totalCount ?? rows.length);
      } catch {
        if (!cancelled) {
          setEmployees([]);
          setEmployeeTotal(0);
        }
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [organizationId, employeeSearch]);

  // Debounced recipient count — the targeting changes on every keystroke of a
  // multi-select, and each preview is a server round trip.
  React.useEffect(() => {
    if (!organizationId) return;
    if (isAudienceEmpty(value)) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await HrmAnnouncementService.previewAudience({
          organizationId,
          allEmployees: value.allEmployees,
          targetBusinessUnits: value.targetBusinessUnits,
          targetDepartments: value.targetDepartments,
          targetRoles: value.targetRoles,
          targetEmployeeIds: value.targetEmployeeIds,
        });
        if (!cancelled) setPreview(result);
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [organizationId, value]);

  const patch = (p: Partial<AudienceValue>) => onChange({ ...value, ...p });
  const specific = !value.allEmployees;

  /** Departments grouped under their business unit — for orientation only; each
   *  remains independently selectable. */
  const departmentOptions = React.useMemo(() => {
    const buLabel: Record<string, string> = {};
    businessUnits.forEach((b) => {
      buLabel[b.handle] = `${b.buCode} — ${b.buName}`;
    });
    const grouped: Record<string, { value: string; label: string }[]> = {};
    departments.forEach((d) => {
      const key = buLabel[d.buHandle] ?? d.buName ?? "Other";
      (grouped[key] ??= []).push({ value: d.deptCode, label: `${d.deptCode} — ${d.deptName}` });
    });
    return Object.entries(grouped).map(([label, options]) => ({ label, options }));
  }, [businessUnits, departments]);

  /** Search results, plus any already-picked employee the current query omits. */
  const employeeOptions = React.useMemo(() => {
    const shown = new Set(employees.map((e) => e.employeeCode));
    const missing = value.targetEmployeeIds
      .filter((code) => !shown.has(code))
      .map((code) => ({ value: code, label: employeeLabels.current[code] ?? code }));
    return [
      ...missing,
      ...employees.map((e) => ({
        value: e.employeeCode,
        label: `${e.employeeCode} — ${e.fullName}`,
      })),
    ];
  }, [employees, value.targetEmployeeIds]);

  const employeesTruncated = employeeTotal > employees.length;

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ fontSize: 13 }}>Recipients</Text>

      <Radio.Group
        value={value.allEmployees ? "all" : "specific"}
        disabled={disabled}
        style={{ display: "block", margin: "8px 0" }}
        onChange={(e) =>
          e.target.value === "all"
            ? onChange({ ...EMPTY_AUDIENCE, allEmployees: true })
            : patch({ allEmployees: false })
        }
      >
        <Radio value="all">All employees</Radio>
        <Radio value="specific">Specific recipients</Radio>
      </Radio.Group>

      {specific && (
        <>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
            Anyone matching <b>any</b> of these receives the announcement — each
            selection widens the audience rather than narrowing it. Selecting a
            business unit <i>and</i> a department inside it reaches the whole
            business unit.
          </Text>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Business units</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled}
                value={value.targetBusinessUnits}
                onChange={(v) => patch({ targetBusinessUnits: v })}
                optionFilterProp="label"
                options={businessUnits.map((b) => ({ value: b.buCode, label: `${b.buCode} — ${b.buName}` }))}
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Departments</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled}
                value={value.targetDepartments}
                onChange={(v) => patch({ targetDepartments: v })}
                optionFilterProp="label"
                options={departmentOptions}
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Roles</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled}
                value={value.targetRoles}
                onChange={(v) => patch({ targetRoles: v })}
                optionFilterProp="label"
                options={roles.map((r) => ({ value: r.roleCode, label: r.roleName || r.roleCode }))}
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Individual employees</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Search by name or code" disabled={disabled}
                value={value.targetEmployeeIds}
                onChange={(v) => patch({ targetEmployeeIds: v })}
                // Matching happens server-side; filtering again in the browser
                // would hide results the search already qualified.
                filterOption={false}
                onSearch={setEmployeeSearch}
                onBlur={() => setEmployeeSearch("")}
                loading={employeesLoading}
                notFoundContent={employeesLoading ? <Spin size="small" /> : "No matches"}
                options={employeeOptions}
              />
              {employeesTruncated && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Showing {employees.length} of {employeeTotal} — type to narrow.
                </Text>
              )}
            </Col>
          </Row>
        </>
      )}

      <div style={{ marginTop: 12 }}>
        {isAudienceEmpty(value) ? (
          <Alert
            type="error"
            showIcon
            message="No recipients selected"
            description="Pick at least one business unit, department, role or employee — otherwise this announcement reaches nobody."
          />
        ) : previewLoading ? (
          <Space size={6}>
            <Spin size="small" />
            <Text type="secondary" style={{ fontSize: 12 }}>Resolving recipients…</Text>
          </Space>
        ) : preview ? (
          <Alert
            type={preview.totalTargetEmployees === 0 ? "warning" : "info"}
            showIcon
            message={
              preview.totalTargetEmployees === 0
                ? "This targeting matches nobody"
                : `Reaches ${preview.totalTargetEmployees} employee${preview.totalTargetEmployees === 1 ? "" : "s"}`
            }
            description={
              preview.totalTargetEmployees > 0 && (
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space size={6} wrap>
                    <Tag color="blue">{preview.withEmailCount} with email</Tag>
                    {preview.withoutEmailCount > 0 && (
                      <Tag color="orange">{preview.withoutEmailCount} without email</Tag>
                    )}
                  </Space>
                  {!!preview.sampleRecipients?.length && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      e.g. {preview.sampleRecipients.slice(0, 3).map((r) => r.employeeName).join(", ")}
                      {preview.totalTargetEmployees > 3 ? ", …" : ""}
                    </Text>
                  )}
                </Space>
              )
            }
          />
        ) : null}
      </div>
    </div>
  );
};

export default AudienceSelector;
