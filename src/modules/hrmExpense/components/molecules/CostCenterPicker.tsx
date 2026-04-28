"use client";

import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { HrmOrganizationService } from "../../../hrmOrganization/services/hrmOrganizationService";
import type { BusinessUnit } from "../../../hrmOrganization/types/domain.types";

interface Props {
  organizationId: string;
  value: string;
  disabled?: boolean;
  onChange: (buCode: string) => void;
}

const CostCenterPicker: React.FC<Props> = ({
  organizationId,
  value,
  disabled,
  onChange,
}) => {
  const [options, setOptions] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    setLoading(true);
    HrmOrganizationService.fetchBusinessUnitsBySite(organizationId)
      .then((data) => {
        if (active) setOptions(data ?? []);
      })
      .catch((err) => {
        console.error("[Expense] Failed to load business units:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      disabled={disabled}
      placeholder="Select cost center (business unit)"
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
      }
      options={options.map((bu) => ({
        value: bu.buCode,
        label: `${bu.buCode} — ${bu.buName}`,
      }))}
      notFoundContent={loading ? "Loading..." : "No business units found"}
      style={{ width: "100%" }}
    />
  );
};

export default CostCenterPicker;
