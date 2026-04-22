"use client";

import React, { useState } from "react";
import { Alert, Input, Typography, Spin } from "antd";
import { useHrmTravelStore } from "../../stores/hrmTravelStore";
import { useCoTravellerSearch } from "../../hooks/useCoTravellerSearch";
import CoTravellerRow from "../molecules/CoTravellerRow";
import type { CoTravellerDto } from "../../types/domain.types";
import styles from "../../styles/TravelForm.module.css";

const { Text } = Typography;

interface Props {
  coTravellers: CoTravellerDto[];
  onAdd: (traveller: CoTravellerDto) => void;
  onRemove: (employeeId: string) => void;
  readonly?: boolean;
  error?: string;
}

const CoTravellerPanel: React.FC<Props> = ({ coTravellers, onAdd, onRemove, readonly, error }) => {
  const [query, setQuery] = useState("");
  const { eligibleCoTravellers, coTravellerSearchLoading } = useHrmTravelStore();
  const { searchCoTravellers } = useCoTravellerSearch();

  const addedIds = new Set(coTravellers.map((t) => t.employeeId));

  return (
    <div>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 12 }}
        />
      )}
      {!readonly && (
        <div className={styles.searchRow}>
          <Input
            placeholder="Search employee name or ID..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              searchCoTravellers(e.target.value);
            }}
            style={{ flex: 1 }}
            suffix={coTravellerSearchLoading ? <Spin size="small" /> : null}
          />
        </div>
      )}

      {!readonly && query.trim() && (
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            marginBottom: 12,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {coTravellerSearchLoading ? (
            <div style={{ padding: 12, textAlign: "center" }}><Spin size="small" /></div>
          ) : eligibleCoTravellers.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "#8c8c8c", fontSize: 13 }}>
              No employees found for &quot;{query.trim()}&quot;
            </div>
          ) : (
            eligibleCoTravellers.map((t) => (
              <div
                key={t.employeeId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  cursor: addedIds.has(t.employeeId) ? "default" : "pointer",
                  borderBottom: "1px solid #f5f5f5",
                  background: addedIds.has(t.employeeId) ? "#fafafa" : "#fff",
                }}
                onClick={() => !addedIds.has(t.employeeId) && onAdd(t)}
              >
                <span style={{ flex: 1, fontSize: 13 }}>
                  {t.employeeName} ({t.employeeId}) — {t.department}
                </span>
                {addedIds.has(t.employeeId) && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Added
                  </Text>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        Only employees sharing the same supervisor are shown.
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
