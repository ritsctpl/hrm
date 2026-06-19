"use client";

import React from "react";
import { Table, Empty, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TravelRequest } from "../../types/domain.types";
import TravelStatusChip from "../atoms/TravelStatusChip";
import TravelTypeTag from "../atoms/TravelTypeTag";
import { formatDateRange } from "../../utils/travelTransformations";
import { textSearchFilter, categoryFilter } from "@/components/tableColumnFilters";
import styles from "../../styles/TravelList.module.css";

interface Props {
  requests: TravelRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: TravelRequest) => void;
}

const ApproverInboxTable: React.FC<Props> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
}) => {
  const columns: ColumnsType<TravelRequest> = [
    {
      title: "Req ID",
      dataIndex: "requestId",
      key: "requestId",
      width: 110,
      ...textSearchFilter<TravelRequest>('requestId'),
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 130,
      ...textSearchFilter<TravelRequest>('purpose'),
      render: (purpose) => <span style={{ fontSize: 12 }}>{purpose}</span>,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employee",
      width: 130,
      ...textSearchFilter<TravelRequest>('employeeName'),
      render: (name) => <span style={{ fontSize: 12 }}>{name}</span>,
    },
    {
      title: "Destination",
      key: "destination",
      width: 120,
      ...textSearchFilter<TravelRequest>('destinationCity'),
      render: (_, r) => <span style={{ fontSize: 12 }}>{r.destinationCity}</span>,
    },
    {
      title: "Travel Type",
      key: "travelType",
      width: 120,
      ...categoryFilter<TravelRequest>('travelType', requests, { getValue: (r) => r.travelType }),
      render: (_, r) => <TravelTypeTag travelType={r.travelType} />,
    },
    {
      title: "Travel Mode",
      dataIndex: "travelMode",
      key: "travelMode",
      width: 100,
      ...categoryFilter<TravelRequest>('travelMode', requests),
      render: (mode) => (
        <Tag color="blue" style={{ fontSize: 11 }}>
          {mode || "—"}
        </Tag>
      ),
    },
    {
      title: "Date(s)",
      key: "dates",
      width: 130,
      render: (_, r) => <span style={{ fontSize: 12 }}>{formatDateRange(r)}</span>,
    },
    {
      title: "Status",
      key: "status",
      width: 160,
      ...categoryFilter<TravelRequest>('status', requests, { getValue: (r) => r.status }),
      render: (_, r) => (
        <span style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <TravelStatusChip status={r.status} />
          {r.escalationLevel > 0 && (
            <Tooltip title={`Escalated to level ${r.escalationLevel}`}>
              <Tag color="volcano" style={{ marginLeft: 2, fontSize: 10 }}>
                L{r.escalationLevel}
              </Tag>
            </Tooltip>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.tableWrapper}>
      <Table
        rowKey="handle"
        columns={columns}
        dataSource={requests}
        loading={loading}
        size="small"
        pagination={false}
        rowClassName={(r) =>
          `${styles.rowClickable} ${r.handle === selectedHandle ? styles.rowSelected : ""}`
        }
        onRow={(r) => ({ onClick: () => onRowClick(r) })}
        locale={{ emptyText: <Empty description="No requests in this inbox." /> }}
      />
      <div className={styles.recordCount}>
        Showing {requests.length} record{requests.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default ApproverInboxTable;
