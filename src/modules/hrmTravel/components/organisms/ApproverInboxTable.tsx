"use client";

import React from "react";
import { Table, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TravelRequest } from "../../types/domain.types";
import TravelStatusChip from "../atoms/TravelStatusChip";
import TravelTypeTag from "../atoms/TravelTypeTag";
import SlaIndicator from "../atoms/SlaIndicator";
import { formatDateRange, computeSlaInfo } from "../../utils/travelTransformations";
import styles from "../../styles/TravelList.module.css";
import dayjs from "dayjs";

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
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employee",
      render: (name) => <span style={{ fontSize: 13 }}>{name}</span>,
    },
    {
      title: "Destination",
      key: "destination",
      width: 120,
      render: (_, r) => <span style={{ fontSize: 12 }}>{r.destinationCity}</span>,
    },
    {
      title: "Type",
      key: "type",
      width: 100,
      render: (_, r) => <TravelTypeTag travelType={r.travelType} />,
    },
    {
      title: "Date(s)",
      key: "dates",
      width: 130,
      render: (_, r) => <span style={{ fontSize: 12 }}>{formatDateRange(r)}</span>,
    },
    {
      title: "Submitted",
      key: "submitted",
      width: 100,
      render: (_, r) => (
        <span style={{ fontSize: 12 }}>
          {r.submittedAt ? dayjs(r.submittedAt).format("DD MMM") : "—"}
        </span>
      ),
    },
    {
      title: "SLA",
      key: "sla",
      width: 100,
      render: (_, r) => <SlaIndicator sla={computeSlaInfo(r)} />,
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
