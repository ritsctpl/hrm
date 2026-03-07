'use client';

import React from "react";
import { Button, Select } from "antd";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import { MONTHS, YEAR_OPTIONS } from "../../utils/payslipConstants";
import styles from "../../styles/PayslipRepository.module.css";

const RepositoryFilterBar: React.FC = () => {
  const store = useHrmPayslipStore();

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterField}>
        <span className={styles.filterLabel}>Year</span>
        <Select
          value={store.repositoryYear}
          onChange={(v) => store.setRepositoryFilters({ year: v })}
          options={YEAR_OPTIONS.map((y) => ({ value: y, label: String(y) }))}
          style={{ width: 120 }}
          allowClear
          placeholder="Year"
        />
      </div>
      <div className={styles.filterField}>
        <span className={styles.filterLabel}>Month</span>
        <Select
          value={store.repositoryMonth}
          onChange={(v) => store.setRepositoryFilters({ month: v })}
          options={MONTHS.map((m) => ({ value: m.value, label: m.fullLabel }))}
          style={{ width: 140 }}
          allowClear
          placeholder="Month"
        />
      </div>
      <div className={styles.filterField}>
        <span className={styles.filterLabel}>Status</span>
        <Select
          value={store.repositoryStatus}
          onChange={(v) => store.setRepositoryFilters({ status: v })}
          options={[
            { value: "ALL", label: "All" },
            { value: "GENERATED", label: "Generated" },
            { value: "FAILED", label: "Failed" },
            { value: "REGENERATED", label: "Regenerated" },
          ]}
          style={{ width: 140 }}
        />
      </div>
      <Button type="primary" onClick={store.searchRepository}>
        Search
      </Button>
      <Button
        onClick={() => {
          store.setRepositoryFilters({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            employeeSearch: "",
            status: "ALL",
          });
        }}
      >
        Reset
      </Button>
    </div>
  );
};

export default RepositoryFilterBar;
