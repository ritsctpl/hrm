"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Select, Spin, Typography } from "antd";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmEmployeeService } from "../../../hrmEmployee/services/hrmEmployeeService";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import CoTravellerRow from "../molecules/CoTravellerRow";
import type { CoTravellerDto } from "../../types/domain.types";
import type { EmployeeDirectoryRow } from "../../../hrmEmployee/types/api.types";
import styles from "../../styles/TravelForm.module.css";

const { Text } = Typography;

interface Props {
  coTravellers: CoTravellerDto[];
  onAdd: (traveller: CoTravellerDto) => void;
  onRemove: (employeeId: string) => void;
  readonly?: boolean;
  error?: string;
}

interface DirectoryOption {
  value: string;
  label: string;
  row: EmployeeDirectoryRow;
}

const CoTravellerPanel: React.FC<Props> = ({ coTravellers, onAdd, onRemove, readonly, error }) => {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  const [options, setOptions] = useState<DirectoryOption[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addedIds = useMemo(
    () => new Set(coTravellers.map((t) => t.employeeId)),
    [coTravellers],
  );

  const fetchDirectory = useCallback(
    async (query: string) => {
      setSearching(true);
      try {
        const res = await HrmEmployeeService.searchByKeyword(organizationId, query);
        const rows = (res?.employees ?? []).filter(
          (r) =>
            r.employeeCode &&
            r.employeeCode !== identity.employeeCode &&
            !addedIds.has(r.employeeCode),
        );
        setOptions(
          rows.map((r) => ({
            value: r.employeeCode,
            label: `${r.fullName} — ${r.employeeCode}${r.department ? ` (${r.department})` : ""}`,
            row: r,
          })),
        );
      } catch {
        setOptions([]);
      } finally {
        setSearching(false);
      }
    },
    [organizationId, identity.employeeCode, addedIds],
  );

  // Preload the full org directory so the dropdown is populated by default.
  // Typing then refines via backend keyword search.
  useEffect(() => {
    fetchDirectory("");
  }, [fetchDirectory]);

  const handleSearch = useCallback(
    (raw: string) => {
      const query = raw.trim();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Empty input → reload the default full list. Otherwise debounce the
      // remote search so we don't hammer the directory endpoint per keystroke.
      debounceRef.current = setTimeout(() => {
        fetchDirectory(query);
      }, query ? 300 : 0);
    },
    [fetchDirectory],
  );

  const handleSelect = (value: string, opt: DirectoryOption) => {
    const r = opt.row;
    onAdd({
      employeeId: r.employeeCode,
      employeeName: r.fullName,
      department: r.department ?? "",
      hasConflict: false,
    });
    setOptions((prev) => prev.filter((o) => o.value !== value));
  };

  return (
    <div>
      {error && (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />
      )}
      {!readonly && (
        <div className={styles.searchRow}>
          <Select
            showSearch
            value={null}
            placeholder="Select an employee or type to filter..."
            filterOption={false}
            onSearch={handleSearch}
            onSelect={handleSelect as never}
            options={options}
            loading={searching}
            notFoundContent={searching ? <Spin size="small" /> : "No employees found"}
            style={{ flex: 1, width: "100%" }}
            allowClear
          />
        </div>
      )}

      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        All employees are listed by default — type to filter by name, code, email, or department.
      </Text>

      {coTravellers.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: "#8c8c8c", fontSize: 13 }}>
          No co-travellers added.
        </div>
      ) : (
        <div className={styles.cotravellerList}>
          <div
            style={{
              display: "flex",
              padding: "8px 12px",
              background: "#fafafa",
              borderBottom: "1px solid #f0f0f0",
              fontSize: 12,
              fontWeight: 500,
              color: "#8c8c8c",
            }}
          >
            <span style={{ width: 80 }}>Emp ID</span>
            <span style={{ flex: 1 }}>Name</span>
            <span style={{ width: 120 }}>Department</span>
            <span style={{ width: 90 }}>Conflict</span>
            {!readonly && <span style={{ width: 32 }} />}
          </div>
          {coTravellers.map((t) => (
            <CoTravellerRow
              key={t.employeeId}
              traveller={t}
              readonly={readonly}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CoTravellerPanel;
