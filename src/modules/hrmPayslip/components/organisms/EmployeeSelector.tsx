'use client';

import React, { useState } from "react";
import { Button, Checkbox, Input } from "antd";
import type { EmployeeSelectorProps } from "../../types/ui.types";
import styles from "../../styles/Payslip.module.css";

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedIds,
  onSelectionChange,
}) => {
  const [search, setSearch] = useState("");

  const filtered = employees.filter(
    (e) =>
      e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheck = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Input.Search
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
          allowClear
        />
        <Button size="small" onClick={() => onSelectionChange(employees.map((e) => e.employeeId))}>
          Select All
        </Button>
        <Button size="small" onClick={() => onSelectionChange([])}>
          Deselect All
        </Button>
      </div>
      <div className={styles.employeeGrid}>
        {filtered.map((emp) => (
          <Checkbox
            key={emp.employeeId}
            checked={selectedIds.includes(emp.employeeId)}
            onChange={(e) => handleCheck(emp.employeeId, e.target.checked)}
          >
            {emp.employeeId} — {emp.employeeName}
          </Checkbox>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        Selected: {selectedIds.length}
      </div>
    </div>
  );
};

export default EmployeeSelector;
