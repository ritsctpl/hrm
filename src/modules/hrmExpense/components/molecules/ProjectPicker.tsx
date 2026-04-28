"use client";

import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { HrmProjectService } from "../../../hrmProject/services/hrmProjectService";
import type { AllocationResponse } from "../../../hrmProject/types/api.types";

export interface ProjectOption {
  projectHandle: string;
  projectCode: string;
  projectName: string;
}

interface Props {
  organizationId: string;
  employeeId: string;
  value: string | null;
  disabled?: boolean;
  onChange: (projectCode: string | null, project?: ProjectOption) => void;
}

const ProjectPicker: React.FC<Props> = ({
  organizationId,
  employeeId,
  value,
  disabled,
  onChange,
}) => {
  const [options, setOptions] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId || !employeeId) return;
    let active = true;
    setLoading(true);
    HrmProjectService.getAllocationsByEmployee(organizationId, employeeId, "ACTIVE")
      .then((allocations: AllocationResponse[]) => {
        if (!active) return;
        // Dedupe by projectCode so the same project with multiple allocations shows once.
        const seen = new Set<string>();
        const uniques: ProjectOption[] = [];
        for (const a of allocations ?? []) {
          if (seen.has(a.projectCode)) continue;
          seen.add(a.projectCode);
          uniques.push({
            projectHandle: a.projectHandle,
            projectCode: a.projectCode,
            projectName: a.projectName,
          });
        }
        setOptions(uniques);
      })
      .catch((err) => {
        console.error("[Expense] Failed to load project allocations:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, employeeId]);

  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      disabled={disabled}
      placeholder="Select a project from your allocations"
      value={value ?? undefined}
      onChange={(v) => {
        const picked = options.find((p) => p.projectCode === v);
        onChange(v ?? null, picked);
      }}
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
      }
      options={options.map((p) => ({
        value: p.projectCode,
        label: `${p.projectCode} — ${p.projectName}`,
      }))}
      notFoundContent={loading ? "Loading..." : "No active project allocations"}
      style={{ width: "100%" }}
    />
  );
};

export default ProjectPicker;
