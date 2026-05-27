"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Empty, Select, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { HrmEmployeeService } from "../../../hrmEmployee/services/hrmEmployeeService";
import type { EmployeeHierarchyNode } from "../../../hrmEmployee/types/api.types";
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
  /** Requests to scope to the team (typically the global queue). All
   *  statuses are shown — Approved / Rejected / Pending / Draft / Cancelled. */
  requests: LeaveRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: LeaveRequest) => void;
  rightPanel: React.ReactNode;
  leaveTypeOptions?: { value: string; label: string }[];
  employeeOptions?: { value: string; label: string }[];
}

/** Extract the bare employee code from a composite "EMP-1 - Name" or a plain
 *  code/handle. */
const codeOf = (raw?: string): string => {
  if (!raw) return "";
  const stripped = raw.includes("_") ? raw.substring(raw.indexOf("_") + 1) : raw;
  return stripped.includes(" - ") ? stripped.split(" - ")[0]?.trim() ?? stripped : stripped;
};

/** Walk the hierarchy tree, find the manager's node, and collect every
 *  descendant's employeeCode + handle (direct AND indirect reports). */
function collectReports(
  roots: EmployeeHierarchyNode[],
  managerCode: string,
  managerHandle: string,
): Set<string> {
  const ids = new Set<string>();

  const collectDescendants = (node: EmployeeHierarchyNode) => {
    for (const child of node.directReports ?? []) {
      if (child.employeeCode) ids.add(child.employeeCode);
      if (child.handle) ids.add(child.handle);
      collectDescendants(child);
    }
  };

  const findManager = (node: EmployeeHierarchyNode): boolean => {
    const isManager =
      (managerCode && node.employeeCode === managerCode) ||
      (managerHandle && node.handle === managerHandle);
    if (isManager) {
      collectDescendants(node);
      return true;
    }
    return (node.directReports ?? []).some(findManager);
  };

  roots.forEach(findManager);
  return ids;
}

const TeamHistoryPanel: React.FC<TeamHistoryPanelProps> = ({
  organizationId,
  managerCode,
  managerHandle,
  requests,
  loading,
  selectedHandle,
  onRowClick,
  rightPanel,
  leaveTypeOptions = [],
  employeeOptions = [],
}) => {
  const cookies = parseCookies();
  const [reportIds, setReportIds] = useState<Set<string>>(new Set());
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // Resolve the manager's direct + indirect reports dynamically. Prefer the
  // pre-built hierarchy tree; fall back to direct reports only if it fails.
  useEffect(() => {
    if (!organizationId || (!managerCode && !managerHandle)) return;
    let cancelled = false;
    setHierarchyLoading(true);
    const organizationName =
      cookies.organizationName || cookies.companyName || cookies.orgName || "";
    HrmEmployeeService.fetchEmployeeHierarchy(organizationId, organizationName)
      .then((roots) => {
        if (cancelled) return;
        const ids = collectReports(Array.isArray(roots) ? roots : [], managerCode, managerHandle);
        if (ids.size > 0) {
          setReportIds(ids);
        } else {
          // Hierarchy didn't resolve a sub-tree — fall back to direct reports.
          return HrmEmployeeService.getDirectReports(organizationId, managerCode).then((reports) => {
            if (cancelled) return;
            const fallback = new Set<string>();
            (reports ?? []).forEach((r) => {
              if (r.employeeCode) fallback.add(r.employeeCode);
              if (r.handle) fallback.add(r.handle);
            });
            setReportIds(fallback);
          });
        }
      })
      .catch(async () => {
        if (cancelled) return;
        try {
          const reports = await HrmEmployeeService.getDirectReports(organizationId, managerCode);
          if (cancelled) return;
          const fallback = new Set<string>();
          (reports ?? []).forEach((r) => {
            if (r.employeeCode) fallback.add(r.employeeCode);
            if (r.handle) fallback.add(r.handle);
          });
          setReportIds(fallback);
        } catch {
          if (!cancelled) setReportIds(new Set());
        }
      })
      .finally(() => {
        if (!cancelled) setHierarchyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId, managerCode, managerHandle, cookies.organizationName, cookies.companyName, cookies.orgName]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Scope to the manager's reporting hierarchy (direct + indirect).
      const reqCode = codeOf(req.employeeId);
      const inTeam = reportIds.has(reqCode) || reportIds.has(req.employeeId);
      if (!inTeam) return false;
      if (statusFilter && req.status !== statusFilter) return false;
      if (employeeFilter) {
        const empMatch =
          req.employeeId === employeeFilter ||
          req.employeeName?.includes(employeeFilter) ||
          req.employeeId?.includes(employeeFilter);
        if (!empMatch) return false;
      }
      if (leaveTypeFilter && req.leaveTypeCode !== leaveTypeFilter) return false;
      if (dateRange) {
        const start = dayjs(req.startDate);
        const end = dayjs(req.endDate);
        if (end.isBefore(dayjs(dateRange[0])) || start.isAfter(dayjs(dateRange[1]))) return false;
      }
      return true;
    });
  }, [requests, reportIds, statusFilter, employeeFilter, leaveTypeFilter, dateRange]);

  if (loading || hierarchyLoading) {
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
          <Text strong>Team Leave History ({filteredRequests.length})</Text>
          {(statusFilter || employeeFilter || leaveTypeFilter || dateRange) && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setStatusFilter(undefined);
                setEmployeeFilter(undefined);
                setLeaveTypeFilter(undefined);
                setDateRange(null);
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
        {filteredRequests.length === 0 ? (
          <div className={styles.panelEmpty}>
            <Empty
              description={
                reportIds.size === 0
                  ? "No reporting employees found for your account."
                  : "No team leave requests found"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          filteredRequests.map((req) => (
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
