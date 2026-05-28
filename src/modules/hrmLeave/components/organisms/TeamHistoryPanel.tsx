"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, DatePicker, Empty, Select, Spin, Typography, message } from "antd";
import dayjs from "dayjs";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import LeaveMasterDetail from "../templates/LeaveMasterDetail";
import LeaveStatusChip from "../atoms/LeaveStatusChip";
import { LeaveRequest } from "../../types/domain.types";
import { LEAVE_STATUS_LABELS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const statusFilterOptions = Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface TeamHistoryPanelProps {
  organizationId: string;
  /** Logged-in manager — used to locate their node in the hierarchy. */
  managerCode: string;
  managerHandle: string;
  /** @deprecated - Now fetched via API instead of passed as prop */
  requests?: LeaveRequest[];
  /** @deprecated - Now managed internally */
  loading?: boolean;
  selectedHandle?: string;
  onRowClick: (request: LeaveRequest) => void;
  rightPanel: React.ReactNode;
  leaveTypeOptions?: { value: string; label: string }[];
  employeeOptions?: { value: string; label: string }[];
}

const TeamHistoryPanel: React.FC<TeamHistoryPanelProps> = ({
  organizationId,
  managerCode,
  selectedHandle,
  onRowClick,
  rightPanel,
  leaveTypeOptions = [],
  employeeOptions = [],
}) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // Fetch team history from the backend API with proper filters
  const fetchTeamHistory = useCallback(async () => {
    if (!organizationId || !managerCode) return;
    
    setLoading(true);
    try {
      const response = await HrmLeaveService.getTeamHistory({
        organizationId,
        managerId: managerCode,
        employeeFilter,
        leaveTypeCode: leaveTypeFilter,
        status: statusFilter,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
        page: currentPage,
        size: pageSize,
      });
      
      setRequests(response.items || []);
      setTotalRecords(response.total || 0);
    } catch (error) {
      console.error("Failed to fetch team history:", error);
      message.error("Failed to load team history");
      setRequests([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [
    organizationId,
    managerCode,
    employeeFilter,
    leaveTypeFilter,
    statusFilter,
    dateRange,
    currentPage,
    pageSize,
  ]);

  // Fetch data when filters change
  useEffect(() => {
    fetchTeamHistory();
  }, [fetchTeamHistory]);

  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading team history..." />
      </div>
    );
  }

  return (
    <LeaveMasterDetail leftWidth="45%">
      <div className={styles.requestsList}>
        <div className={styles.requestsListHeader}>
          <Text strong>Team Leave History ({totalRecords})</Text>
          {(statusFilter || employeeFilter || leaveTypeFilter || dateRange) && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setStatusFilter(undefined);
                setEmployeeFilter(undefined);
                setLeaveTypeFilter(undefined);
                setDateRange(null);
                setCurrentPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px 12px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Select
            placeholder="Employee"
            allowClear
            showSearch
            value={employeeFilter}
            onChange={(val) => setEmployeeFilter(val)}
            options={employeeOptions}
            style={{ minWidth: 180 }}
            size="small"
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Select
            placeholder="Leave Type"
            allowClear
            value={leaveTypeFilter}
            onChange={(val) => setLeaveTypeFilter(val)}
            options={leaveTypeOptions}
            style={{ minWidth: 130 }}
            size="small"
          />
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={statusFilterOptions}
            style={{ minWidth: 150 }}
            size="small"
          />
          <DatePicker.RangePicker
            size="small"
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(_, strs) => {
              if (strs[0] && strs[1]) setDateRange([strs[0], strs[1]]);
              else setDateRange(null);
            }}
            style={{ minWidth: 220 }}
            format="DD/MM/YYYY"
          />
        </div>
        {requests.length === 0 ? (
          <div className={styles.panelEmpty}>
            <Empty
              description="No team leave requests found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.handle}
              className={`${styles.requestRow} ${
                req.handle === selectedHandle ? styles.requestRowSelected : ""
              }`}
              onClick={() => onRowClick(req)}
            >
              <div className={styles.requestRowTop}>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>
                  {req.employeeName || req.employeeId}
                </Text>
                <LeaveStatusChip status={req.status} />
              </div>
              <div className={styles.requestRowMid}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {req.leaveTypeName || req.leaveTypeCode} &middot;{" "}
                  {new Date(req.startDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {" – "}
                  {new Date(req.endDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </Text>
              </div>
              <div className={styles.requestRowBottom}>
                <Text style={{ fontSize: 12 }}>{req.totalDays.toFixed(1)} days</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(req.createdDateTime).toLocaleDateString("en-GB")}
                </Text>
              </div>
            </div>
          ))
        )}
      </div>
      {rightPanel}
    </LeaveMasterDetail>
  );
};

export default TeamHistoryPanel;
