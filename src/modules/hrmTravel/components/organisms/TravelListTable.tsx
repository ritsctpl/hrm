"use client";

import React from "react";
import { Table, Empty, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import type { TravelRequest } from "../../types/domain.types";
import TravelStatusChip from "../atoms/TravelStatusChip";
import TravelTypeTag from "../atoms/TravelTypeTag";
import SlaIndicator from "../atoms/SlaIndicator";
import { formatDateRange, formatDestination, computeSlaInfo } from "../../utils/travelTransformations";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/TravelList.module.css";

interface Props {
  requests: TravelRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: TravelRequest) => void;
  onNewRequest?: () => void;
}

const TravelListTable: React.FC<Props> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
  onNewRequest,
}) => {
  const columns: ColumnsType<TravelRequest> = [
    {
      title: "Req ID",
      dataIndex: "requestId",
      key: "requestId",
      width: 120,
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      ellipsis: true,
      render: (text) => <span style={{ fontSize: 13 }}>{text}</span>,
    },
    {
      title: "Destination",
      key: "destination",
      width: 140,
      render: (_, r) => <span style={{ fontSize: 12 }}>{formatDestination(r)}</span>,
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
      width: 140,
      render: (_, r) => <span style={{ fontSize: 12 }}>{formatDateRange(r)}</span>,
    },
    {
      title: "Status",
      key: "status",
      width: 160,
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TravelStatusChip status={r.status} size="sm" />
          {r.onDutyApplied && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#52c41a",
                display: "inline-block",
              }}
              title="On Duty Applied"
            />
          )}
          {(r.status === "PENDING_APPROVAL" || r.status === "ESCALATED") && (
            <SlaIndicator sla={computeSlaInfo(r)} />
          )}
        </div>
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
        locale={{
          emptyText: (
            <Empty
              image={<FlightTakeoffIcon style={{ fontSize: 48, color: "#d9d9d9" }} />}
              description="No travel requests yet"
            >
              {onNewRequest && (
                <Can I="add">
                  <Button type="primary" onClick={onNewRequest}>
                    + Create Travel Request
                  </Button>
                </Can>
              )}
            </Empty>
          ),
        }}
      />
      <div className={styles.recordCount}>
        Showing {requests.length} record{requests.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default TravelListTable;
