"use client";

import React from "react";
import { Table, Empty, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TravelRequest } from "../../types/domain.types";
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
      width: 160,
      render: (_, r) => (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TravelTypeTag travelType={r.travelType} />
          {r.escalationLevel > 0 && (
            <Tooltip title={`Escalated to level ${r.escalationLevel}`}>
              <Tag color="volcano" style={{ marginLeft: 2 }}>
                L{r.escalationLevel}
              </Tag>
            </Tooltip>
          )}
        </span>
      ),
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
      width: 130,
      render: (_, r) => <SlaIndicator sla={computeSlaInfo(r)} deadline={r.slaDeadline} />,
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
