"use client";

import React from "react";
import { Radio, Select, Space, Typography, Alert, Spin, Tag, Row, Col, Button } from "antd";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmAnnouncementService } from "../../services/hrmAnnouncementService";
import { HrmOrganizationService } from "@/modules/hrmOrganization/services/hrmOrganizationService";
import { HrmEmployeeService } from "@/modules/hrmEmployee/services/hrmEmployeeService";
import { HrmAccessService } from "@/modules/hrmAccess/services/hrmAccessService";
import type { AudienceResolution } from "../../types/api.types";
import type { Department } from "@/modules/hrmOrganization/types/domain.types";
import type { EmployeeDirectoryRow } from "@/modules/hrmEmployee/types/api.types";
import type { RoleResponse } from "@/modules/hrmAccess/types/api.types";

const { Text } = Typography;

/** One page of employee search results. Not a ceiling on who can be chosen. */
const SEARCH_PAGE_SIZE = 50;

/** Upper bound when resolving a department or role to its members. */
const GROUP_PAGE_SIZE = 500;

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
 * <p>One list decides who receives the announcement: <b>Recipients</b>. Department
 * and role are conveniences that fill it — pick a department, optionally narrow
 * by role, and the matching people are put in the list, where they can be
 * searched, added to and removed individually.
 *
 * <p>Filling replaces rather than accumulates. An earlier version merged each
 * resolution into the list, so narrowing the filters could not shrink it: three
 * filters that matched six people still showed thirty-three, because the first
 * broad selection was never let go.
 *
 * <p>Business unit was dropped. On this data one unit holds every employee, so
 * it could only ever mean "everyone", which the All employees option already
 * says more clearly.
 *
 * <p>The groups are never sent. The server ORs its targeting clauses, so
 * "department AND role" cannot be expressed there — the announcement carries the
 * resolved employee codes alone, and the list is literally the recipients.
 */
const AudienceSelector: React.FC<AudienceSelectorProps> = ({ value, onChange, disabled }) => {
  const organizationId = getOrganizationId();

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [roles, setRoles] = React.useState<RoleResponse[]>([]);
  const [loadingRef, setLoadingRef] = React.useState(false);

  // Filters are UI only — they choose who goes in the list, they are not sent.
  const [filterDepts, setFilterDepts] = React.useState<string[]>([]);
  const [filterRoles, setFilterRoles] = React.useState<string[]>([]);
  const [filling, setFilling] = React.useState(false);

  const [results, setResults] = React.useState<EmployeeDirectoryRow[]>([]);
  const [resultTotal, setResultTotal] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [searching, setSearching] = React.useState(false);

  /** Names for chosen people; a later search need not return them again. */
  const labels = React.useRef<Record<string, string>>({});

  const [preview, setPreview] = React.useState<AudienceResolution | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [headcount, setHeadcount] = React.useState(0);

  // Reference data — loaded once, tolerant of individual failures.
  React.useEffect(() => {
    if (!organizationId) return;
    setLoadingRef(true);
    Promise.allSettled([
      HrmOrganizationService.fetchBusinessUnitsBySite(organizationId),
      HrmAccessService.fetchActiveRoles(organizationId),
      HrmAnnouncementService.previewAudience({ organizationId, allEmployees: true }),
    ])
      .then(async ([bu, role, all]) => {
        if (role.status === "fulfilled") setRoles(role.value ?? []);
        if (all.status === "fulfilled") setHeadcount(all.value?.totalTargetEmployees ?? 0);
        // Departments are only queryable per business unit, so the units are
        // read to reach them — the unit itself is not offered as a filter.
        const units = bu.status === "fulfilled" ? bu.value ?? [] : [];
        const perBu = await Promise.allSettled(
          units.map((b) => b.handle).filter(Boolean)
            .map((h) => HrmOrganizationService.fetchDepartments(organizationId, h))
        );
        setDepartments(perBu.flatMap((r) => (r.status === "fulfilled" ? r.value ?? [] : [])));
      })
      .finally(() => setLoadingRef(false));
  }, [organizationId]);

  /**
   * Employees matching one filter value.
   *
   * `Employee.department` holds either the bare code or the "CODE - Name"
   * composite depending on how the record was written, while `role` holds the
   * bare code. The directory matches by equality, so each plausible form is
   * tried and the results merged.
   */
  const membersOf = React.useCallback(
    async (field: "department" | "role", forms: string[]): Promise<string[]> => {
      const settled = await Promise.allSettled(
        forms.map((v) =>
          HrmEmployeeService.fetchDirectory({
            organizationId,
            [field]: v,
            status: "ACTIVE",
            size: GROUP_PAGE_SIZE,
          } as Parameters<typeof HrmEmployeeService.fetchDirectory>[0])
        )
      );
      const codes: string[] = [];
      settled.forEach((r) => {
        if (r.status !== "fulfilled") return;
        (r.value?.employees ?? []).forEach((e) => {
          labels.current[e.employeeCode] = `${e.employeeCode} — ${e.fullName}`;
          if (!codes.includes(e.employeeCode)) codes.push(e.employeeCode);
        });
      });
      return codes;
    },
    [organizationId]
  );

  /**
   * Fills the recipient list from the current filters, replacing whatever was
   * there. Values within a field are OR'd — nobody is in two departments at
   * once — while department and role are AND'd, so adding a role narrows.
   */
  const applyFilters = async (depts: string[], roleCodes: string[]) => {
    if (!organizationId) return;
    if (!depts.length && !roleCodes.length) {
      onChange({ ...value, allEmployees: false, targetEmployeeIds: [] });
      return;
    }
    setFilling(true);
    try {
      const sets: string[][] = [];
      if (depts.length) {
        const forms = depts.flatMap((code) => {
          const d = departments.find((x) => x.deptCode === code);
          return d ? [code, `${code} - ${d.deptName}`] : [code];
        });
        sets.push(await membersOf("department", forms));
      }
      if (roleCodes.length) {
        sets.push(await membersOf("role", roleCodes));
      }
      const matched = sets.reduce((acc, s) => acc.filter((c) => s.includes(c)));
      onChange({
        allEmployees: false,
        // Never sent — the server ORs these, undoing the narrowing above.
        targetBusinessUnits: [],
        targetDepartments: [],
        targetRoles: [],
        targetEmployeeIds: matched,
      });
    } finally {
      setFilling(false);
    }
  };

  // Recipient search — server-side, debounced.
  React.useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await HrmEmployeeService.fetchDirectory({
          organizationId,
          keyword: search.trim() || undefined,
          status: "ACTIVE",
          size: SEARCH_PAGE_SIZE,
        });
        if (cancelled) return;
        const rows = res?.employees ?? [];
        rows.forEach((e) => {
          labels.current[e.employeeCode] = `${e.employeeCode} — ${e.fullName}`;
        });
        setResults(rows);
        setResultTotal(res?.totalCount ?? rows.length);
      } catch {
        if (!cancelled) {
          setResults([]);
          setResultTotal(0);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [organizationId, search]);

  // Debounced recipient count.
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
          targetBusinessUnits: [],
          targetDepartments: [],
          targetRoles: [],
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

  const specific = !value.allEmployees;
  const chosen = value.targetEmployeeIds;

  const departmentOptions = React.useMemo(
    () => departments.map((d) => ({ value: d.deptCode, label: `${d.deptCode} — ${d.deptName}` })),
    [departments]
  );

  /** Search results, plus any chosen person the current query omits. */
  const recipientOptions = React.useMemo(() => {
    const shown = new Set(results.map((e) => e.employeeCode));
    return [
      ...chosen.filter((c) => !shown.has(c)).map((c) => ({ value: c, label: labels.current[c] ?? c })),
      ...results.map((e) => ({ value: e.employeeCode, label: `${e.employeeCode} — ${e.fullName}` })),
    ];
  }, [results, chosen]);

  const reachesAll = specific && headcount > 0 && chosen.length >= headcount;

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ fontSize: 13 }}>Recipients</Text>

      <Radio.Group
        value={value.allEmployees ? "all" : "specific"}
        disabled={disabled}
        style={{ display: "block", margin: "8px 0" }}
        onChange={(e) => {
          setFilterDepts([]);
          setFilterRoles([]);
          onChange(
            e.target.value === "all"
              ? { ...EMPTY_AUDIENCE, allEmployees: true }
              : { ...EMPTY_AUDIENCE, allEmployees: false }
          );
        }}
      >
        <Radio value="all">All employees</Radio>
        <Radio value="specific">Specific recipients</Radio>
      </Radio.Group>

      {specific && (
        <>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Department</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled || filling}
                value={filterDepts}
                onChange={(v) => { setFilterDepts(v); applyFilters(v, filterRoles); }}
                optionFilterProp="label"
                maxTagCount="responsive"
                options={departmentOptions}
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>Role</Text>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Any" loading={loadingRef} disabled={disabled || filling}
                value={filterRoles}
                onChange={(v) => { setFilterRoles(v); applyFilters(filterDepts, v); }}
                optionFilterProp="label"
                maxTagCount="responsive"
                options={roles.map((r) => ({ value: r.roleCode, label: r.roleName || r.roleCode }))}
              />
            </Col>
            <Col span={24}>
              <Space size={6} style={{ width: "100%", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Recipients{chosen.length ? ` (${chosen.length})` : ""}
                </Text>
                {chosen.length > 0 && (
                  <Button
                    type="link" size="small" disabled={disabled}
                    onClick={() => {
                      setFilterDepts([]);
                      setFilterRoles([]);
                      onChange({ ...value, allEmployees: false, targetEmployeeIds: [] });
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Space>
              <Select
                mode="multiple" allowClear size="small" style={{ width: "100%" }}
                placeholder="Search by name or code, or pick a department above"
                disabled={disabled}
                value={chosen}
                onChange={(v) => onChange({ ...value, allEmployees: false, targetEmployeeIds: v })}
                // Matching happens server-side; filtering again here would hide
                // results the search already qualified.
                filterOption={false}
                onSearch={setSearch}
                onBlur={() => setSearch("")}
                loading={searching || filling}
                notFoundContent={searching ? <Spin size="small" /> : "No matches"}
                // Keeps a large roster from becoming a wall of chips.
                maxTagCount={8}
                maxTagPlaceholder={(rest) => `+${rest.length} more`}
                options={recipientOptions}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {filling
                  ? "Applying filters…"
                  : resultTotal > results.length
                  ? `Search shows ${results.length} of ${resultTotal} — type to narrow.`
                  : "Department and role fill this list; add or remove anyone by name."}
              </Text>
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
            description="Pick a department or role, or search for people by name — otherwise this announcement reaches nobody."
          />
        ) : previewLoading ? (
          <Space size={6}>
            <Spin size="small" />
            <Text type="secondary" style={{ fontSize: 12 }}>Resolving recipients…</Text>
          </Space>
        ) : preview ? (
          <Alert
            type={preview.totalTargetEmployees === 0 || reachesAll ? "warning" : "info"}
            showIcon
            message={
              preview.totalTargetEmployees === 0
                ? "This targeting matches nobody"
                : reachesAll
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
