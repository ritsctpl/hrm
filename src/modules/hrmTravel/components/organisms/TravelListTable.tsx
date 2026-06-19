"use client";

import React, { useMemo } from "react";
import { Table, Empty, Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import type { TravelRequest } from "../../types/domain.types";
import TravelStatusChip from "../atoms/TravelStatusChip";
import TravelTypeTag from "../atoms/TravelTypeTag";
import SlaIndicator from "../atoms/SlaIndicator";
import { formatDateRange, formatDestination, computeSlaInfo } from "../../utils/travelTransformations";
import Can from "../../../hrmAccess/components/Can";
import { textSearchFilter, categoryFilter } from "@/components/tableColumnFilters";
import styles from "../../styles/TravelList.module.css";

interface Props {
  requests: TravelRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: TravelRequest) => void;
  onNewRequest?: () => void;
  searchTerm?: string;
  statusFilter?: string | null;
  typeFilter?: string | null;
  dateRange?: [string, string] | null;
}

const TravelListTable: React.FC<Props> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
  onNewRequest,
  searchTerm = "",
  statusFilter = null,
  typeFilter = null,
  dateRange = null,
}) => {
  // All filtering happens client-side against the full list the store holds.
  // The landing fetches every request for the employee once (no per-filter
  // API calls), so search / status / type / date are applied here uniformly
  // and instantly. dateRange is [from, to] in YYYY-MM-DD.
  const filteredRequests = useMemo(() => {
    let rows = requests;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (r) =>
          r.requestId.toLowerCase().includes(term) ||
          r.purpose.toLowerCase().includes(term),
      );
    }

    if (statusFilter) {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    if (typeFilter) {
      rows = rows.filter((r) => r.travelType === typeFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const from = dayjs(dateRange[0], "YYYY-MM-DD").startOf("day");
      const to = dayjs(dateRange[1], "YYYY-MM-DD").endOf("day");
      rows = rows.filter((r) => {
        // LOCAL travel carries a single travelDate; multi-day travel uses
        // startDate. Fall back across both so every row has a date to test.
        const raw =
          r.travelType === "LOCAL"
            ? r.travelDate || r.startDate
            : r.startDate || r.travelDate;
        if (!raw) return false;
        const d = dayjs(raw);
        return (
          d.isValid() &&
          !d.isBefore(from) &&
          !d.isAfter(to)
        );
      });
    }

    return rows;
  }, [requests, searchTerm, statusFilter, typeFilter, dateRange]);
  const columns: ColumnsType<TravelRequest> = [
    {
      title: "Req ID",
      dataIndex: "requestId",
      key: "requestId",
      width: 120,
      ...textSearchFilter<TravelRequest>('requestId'),
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 150,
      ellipsis: true,
      ...textSearchFilter<TravelRequest>('purpose'),
      render: (text) => <span style={{ fontSize: 13 }}>{text}</span>,
    },
    {
      title: "Destination",
      key: "destination",
      width: 140,
      ...textSearchFilter<TravelRequest>('destinationCity', { getText: (r) => formatDestination(r) }),
      render: (_, r) => <span style={{ fontSize: 12 }}>{formatDestination(r)}</span>,
    },
    {
      title: "Type",
      key: "type",
      width: 120,
      ...categoryFilter<TravelRequest>('travelType', filteredRequests, { getValue: (r) => r.travelType }),
      render: (_, r) => <TravelTypeTag travelType={r.travelType} />,
    },
    {
      title: "Date(s)",
      key: "dates",
      width: 140,
      render: (_, r) => <span style={{ fontSize: 12 }}>{formatDateRange(r)}</span>,
    },
    {
      title: "With",
      key: "approver",
      width: 130,
      render: (_, r) =>
        r.currentApproverName ? (
          <span style={{ fontSize: 12 }} title={r.currentApproverId}>
            {r.currentApproverName}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#8c8c8c" }}>—</span>
        ),
    },
    {
      title: "Status",
      key: "status",
      width: 180,
      ...categoryFilter<TravelRequest>('status', filteredRequests, { getValue: (r) => r.status }),
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TravelStatusChip status={r.status} size="sm" />
          {r.onDutyApplied && (
            <Tag color="green" style={{ marginLeft: 2 }} title="On-duty entry auto-applied">
              On Duty
            </Tag>
          )}
          {r.escalationLevel > 0 && (
            <Tag color="volcano" style={{ marginLeft: 2 }} title={`Escalated to level ${r.escalationLevel}`}>
              L{r.escalationLevel}
            </Tag>
          )}
          {(r.status === "PENDING_APPROVAL" || r.status === "ESCALATED") && (
            <SlaIndicator sla={computeSlaInfo(r)} deadline={r.slaDeadline} />
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
        dataSource={filteredRequests}
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
                <Can I="add" object="travel_request">
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
        Showing {filteredRequests.length} record{filteredRequests.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default TravelListTable;
