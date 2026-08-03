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
 * The server treats targeting as additive — an employee matching any selected
 * BU, department, role or explicit code receives it. `allEmployees` overrides
 * the lot.
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
  const [employees, setEmployees] = React.useState<EmployeeDirectoryRow[]>([]);
  const [loadingRef, setLoadingRef] = React.useState(false);

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
      HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 }),
    ])
      .then(([bu, role, emp]) => {
        if (bu.status === "fulfilled") setBusinessUnits(bu.value ?? []);
        if (role.status === "fulfilled") setRoles(role.value ?? []);
        if (emp.status === "fulfilled") setEmployees(emp.value?.employees ?? []);
      })
      .finally(() => setLoadingRef(false));
  }, [organizationId]);

  // Departments hang off the selected BUs.
  React.useEffect(() => {
    if (!organizationId || !value.targetBusinessUnits.length) {
      setDepartments([]);
      return;
    }
    const handles = businessUnits
      .filter((b) => value.targetBusinessUnits.includes(b.buCode))
      .map((b) => b.handle)
      .filter(Boolean);
    if (!handles.length) return;
    Promise.allSettled(
      handles.map((h) => HrmOrganizationService.fetchDepartments(organizationId, h))
    ).then((results) => {
      const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value ?? [] : []));
      setDepartments(all);
    });
  }, [organizationId, businessUnits, value.targetBusinessUnits]);

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
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>Business units</Text>
            <Select
              mode="multiple" allowClear size="small" style={{ width: "100%" }}
              placeholder="Any" loading={loadingRef} disabled={disabled}
              value={value.targetBusinessUnits}
              onChange={(v) => patch({ targetBusinessUnits: v, targetDepartments: [] })}
              optionFilterProp="label"
              options={businessUnits.map((b) => ({ value: b.buCode, label: `${b.buCode} — ${b.buName}` }))}
            />
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>Departments</Text>
            <Select
              mode="multiple" allowClear size="small" style={{ width: "100%" }}
              placeholder={value.targetBusinessUnits.length ? "Any" : "Select a business unit first"}
              disabled={disabled || !value.targetBusinessUnits.length}
              value={value.targetDepartments}
              onChange={(v) => patch({ targetDepartments: v })}
              optionFilterProp="label"
              options={departments.map((d) => ({ value: d.deptCode, label: `${d.deptCode} — ${d.deptName}` }))}
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
              placeholder="Search by name or code" loading={loadingRef} disabled={disabled}
              value={value.targetEmployeeIds}
              onChange={(v) => patch({ targetEmployeeIds: v })}
              optionFilterProp="label"
              options={employees.map((e) => ({
                value: e.employeeCode,
                label: `${e.employeeCode} — ${e.fullName}`,
              }))}
            />
          </Col>
        </Row>
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
