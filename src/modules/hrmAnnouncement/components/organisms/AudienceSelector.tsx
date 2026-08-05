"use client";

import React from "react";
import { Radio, Select, Space, Typography, Alert, Spin, Tag, Row, Col, message } from "antd";
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

  /**
   * Active headcount, resolved once. Used only to tell the author when a
   * "specific" selection has quietly become everyone — the case that reads as
   * targeting being broken when it is working exactly as asked.
   */
  const [headcount, setHeadcount] = React.useState(0);
  React.useEffect(() => {
    if (!organizationId) return;
    HrmAnnouncementService.previewAudience({ organizationId, allEmployees: true })
      .then((r) => setHeadcount(r?.totalTargetEmployees ?? 0))
      .catch(() => setHeadcount(0));
  }, [organizationId]);

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

  /**
   * Picking a group selects the people in it, then releases the group.
   *
   * Business unit, department and role are shortcuts for "everyone in this right
   * now", not standing filters — each resolves to explicit employees the author
   * can see and strike out one by one. Keeping the group chip as well would look
   * editable while not being: the server ORs its clauses, so a person removed
   * from the list would still match the group and receive it anyway.
   *
   * This also makes the reach honest. Selecting a business unit that happens to
   * contain the whole company used to read as a narrow choice while resolving to
   * everyone; now the roster fills with every name, and the count agrees.
   *
   * The trade is that the audience is fixed when chosen — someone who joins the
   * group before publishing is not swept in.
   *
   * Employee records store these inconsistently: `department` and
   * `businessUnits` hold either the bare code or the "CODE - Name" composite,
   * while `role` holds the bare code. The directory filter matches by equality,
   * so every plausible form is queried and the results merged.
   */
  const expandToEmployees = async (
    field: "businessUnit" | "department" | "role",
    forms: string[],
    restore: () => void,
    label: string
  ) => {
    if (!organizationId || !forms.length) return;
    setEmployeesLoading(true);
    try {
      const results = await Promise.allSettled(
        forms.map((v) =>
          HrmEmployeeService.fetchDirectory({
            organizationId,
            [field]: v,
            status: "ACTIVE",
            size: 500,
          } as Parameters<typeof HrmEmployeeService.fetchDirectory>[0])
        )
      );
      const rows = results.flatMap((r) =>
        r.status === "fulfilled" ? r.value?.employees ?? [] : []
      );

      // Nothing matched — keep the selection rather than silently swapping a
      // real target for an empty one.
      if (!rows.length) {
        restore();
        message.warning(`No active employees found in that ${label} — left as a filter instead.`);
        return;
      }

      const codes = value.targetEmployeeIds.slice();
      let added = 0;
      rows.forEach((e) => {
        if (!codes.includes(e.employeeCode)) {
          codes.push(e.employeeCode);
          added += 1;
        }
        employeeLabels.current[e.employeeCode] = `${e.employeeCode} — ${e.fullName}`;
      });
      patch({ targetBusinessUnits: [], targetDepartments: [], targetRoles: [], targetEmployeeIds: codes });
      message.success(`Added ${added} employee${added === 1 ? "" : "s"} from the selected ${label}.`);
    } catch {
      restore();
      message.error(`Could not load that ${label}'s employees — left as a filter.`);
    } finally {
      setEmployeesLoading(false);
    }
  };

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
            Business unit, department and role are shortcuts: choosing one adds
            its people to <b>Individual employees</b> below, where you can remove
            any of them. The recipients are whoever is listed there.
          </Text>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Business units</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled}
                value={value.targetBusinessUnits}
                onChange={(v) => {
                  if (v.length <= value.targetBusinessUnits.length) {
                    patch({ targetBusinessUnits: v });
                    return;
                  }
                  const forms = v.flatMap((code) => {
                    const bu = businessUnits.find((b) => b.buCode === code);
                    return bu ? [code, `${code} - ${bu.buName}`] : [code];
                  });
                  expandToEmployees("businessUnit", forms,
                    () => patch({ targetBusinessUnits: v }), "business unit");
                }}
                optionFilterProp="label"
                options={businessUnits.map((b) => ({ value: b.buCode, label: `${b.buCode} — ${b.buName}` }))}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Adds that unit&apos;s people below.
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Departments</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled}
                value={value.targetDepartments}
                // Selecting resolves to people and clears itself; see
                // expandDepartments. Deselecting is left alone so the guard
                // path (department kept as a filter) stays clearable.
                onChange={(v) => {
                  if (v.length <= value.targetDepartments.length) {
                    patch({ targetDepartments: v });
                    return;
                  }
                  const forms = v.flatMap((code) => {
                    const d = departments.find((x) => x.deptCode === code);
                    return d ? [code, `${code} - ${d.deptName}`] : [code];
                  });
                  expandToEmployees("department", forms,
                    () => patch({ targetDepartments: v }), "department");
                }}
                optionFilterProp="label"
                options={departmentOptions}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Adds that department&apos;s people below.
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Roles</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled}
                value={value.targetRoles}
                onChange={(v) => {
                  if (v.length <= value.targetRoles.length) {
                    patch({ targetRoles: v });
                    return;
                  }
                  // Employee.role holds the bare code, so no composite form.
                  expandToEmployees("role", v, () => patch({ targetRoles: v }), "role");
                }}
                optionFilterProp="label"
                options={roles.map((r) => ({ value: r.roleCode, label: r.roleName || r.roleCode }))}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Adds that role&apos;s people below.
              </Text>
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
            type={
              preview.totalTargetEmployees === 0
                ? "warning"
                : specific && headcount > 0 && preview.totalTargetEmployees >= headcount
                ? "warning"
                : "info"
            }
            showIcon
            message={
              preview.totalTargetEmployees === 0
                ? "This targeting matches nobody"
                : specific && headcount > 0 && preview.totalTargetEmployees >= headcount
                ? `This reaches all ${headcount} employees — the same as "All employees"`
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
