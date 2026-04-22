"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Select,
  Table,
  Progress,
  Statistic,
  Spin,
  Empty,
  Row,
  Col,
  Space,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BarChartOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import {
  AbsenteeismData,
  LeaveTrendData,
  TopAbsenteeData,
} from "../../types/api.types";
import { buildYearOptions } from "../../utils/transformations";

const { Title, Text } = Typography;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface LeaveAnalyticsPanelProps {
  organizationId: string;
}

const LeaveAnalyticsPanel: React.FC<LeaveAnalyticsPanelProps> = ({
  organizationId,
}) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => buildYearOptions(currentYear), [currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedDept, setSelectedDept] = useState<string | undefined>(undefined);

  // Absenteeism state
  const [absenteeismData, setAbsenteeismData] = useState<AbsenteeismData[]>([]);
  const [absenteeismLoading, setAbsenteeismLoading] = useState(false);

  // Leave Trend state
  const [trendData, setTrendData] = useState<LeaveTrendData[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // Top Absentees state
  const [topAbsentees, setTopAbsentees] = useState<TopAbsenteeData[]>([]);
  const [topAbsenteesLoading, setTopAbsenteesLoading] = useState(false);

  // ── Fetch Data ──────────────────────────────────────────────────────

  const fetchAbsenteeism = useCallback(async () => {
    setAbsenteeismLoading(true);
    try {
      const res = await HrmLeaveService.getAbsenteeismRate({
        organizationId,
        year: selectedYear,
        deptId: selectedDept,
      });
      setAbsenteeismData(res);
    } catch {
      message.error("Failed to load absenteeism data");
    } finally {
      setAbsenteeismLoading(false);
    }
  }, [organizationId, selectedYear, selectedDept]);

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await HrmLeaveService.getLeaveTrend({
        organizationId,
        year: selectedYear,
      });
      setTrendData(res);
    } catch {
      message.error("Failed to load leave trend data");
    } finally {
      setTrendLoading(false);
    }
  }, [organizationId, selectedYear]);

  const fetchTopAbsentees = useCallback(async () => {
    setTopAbsenteesLoading(true);
    try {
      const res = await HrmLeaveService.getTopAbsentees({
        organizationId,
        year: selectedYear,
        limit: 10,
      });
      // Normalize: backend may return totalDays/leaveDays instead of totalLeaveDays
      const normalized = (res || []).map((item: unknown) => {
        const r = item as Record<string, unknown>;
        return {
        employeeId: (r.employeeId ?? r.employeeHandle ?? "") as string,
        employeeName: (r.employeeName ?? r.fullName ?? "") as string,
        employeeNumber: (r.employeeNumber ?? r.employeeCode ?? "") as string,
        department: (r.department ?? "") as string,
        totalLeaveDays: Number(r.totalLeaveDays ?? r.totalDays ?? r.leaveDays ?? 0),
        leaveBreakdown: (r.leaveBreakdown ?? []) as { leaveTypeCode: string; days: number }[],
      };
      });
      setTopAbsentees(normalized);
    } catch {
      message.error("Failed to load top absentees data");
    } finally {
      setTopAbsenteesLoading(false);
    }
  }, [organizationId, selectedYear]);

  useEffect(() => {
    fetchAbsenteeism();
    fetchTrend();
    fetchTopAbsentees();
  }, [fetchAbsenteeism, fetchTrend, fetchTopAbsentees]);

  // ── Department options derived from absenteeism data ────────────────

  const departmentOptions = useMemo(() => {
    const depts = Array.from(new Set(absenteeismData.map((d) => d.department))).sort();
    return depts.map((d) => ({ value: d, label: d }));
  }, [absenteeismData]);

  // ── Summary Stats ───────────────────────────────────────────────────

  const summaryStats = useMemo(() => {
    const totalEmployees = absenteeismData.reduce((sum, d) => sum + (d.totalEmployees || 0), 0);
    const totalLeaveDays = absenteeismData.reduce((sum, d) => sum + (d.totalLeaveDays || 0), 0);
    const validRates = absenteeismData.filter(d => typeof d.absenteeismRate === 'number' && !isNaN(d.absenteeismRate));
    const avgRate =
      validRates.length > 0
        ? validRates.reduce((sum, d) => sum + d.absenteeismRate, 0) / validRates.length
        : 0;
    return {
      totalEmployees: isNaN(totalEmployees) ? 0 : totalEmployees,
      totalLeaveDays: isNaN(totalLeaveDays) ? 0 : totalLeaveDays,
      avgRate: isNaN(avgRate) ? 0 : avgRate,
    };
  }, [absenteeismData]);

  // ── Absenteeism Table Columns ───────────────────────────────────────

  const absenteeismColumns: ColumnsType<AbsenteeismData> = [
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (val: string) => val || "Unassigned",
      sorter: (a, b) => (a.department || "").localeCompare(b.department || ""),
    },
    {
      title: "Total Employees",
      dataIndex: "totalEmployees",
      key: "totalEmployees",
      align: "right",
      render: (val: number) => val ?? 0,
      sorter: (a, b) => (a.totalEmployees || 0) - (b.totalEmployees || 0),
    },
    {
      title: "Leave Days",
      dataIndex: "totalLeaveDays",
      key: "totalLeaveDays",
      align: "right",
      sorter: (a, b) => a.totalLeaveDays - b.totalLeaveDays,
    },
    {
      title: "Absenteeism Rate",
      dataIndex: "absenteeismRate",
      key: "absenteeismRate",
      sorter: (a, b) => a.absenteeismRate - b.absenteeismRate,
      render: (rate: number) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress
            percent={Math.min(rate, 100)}
            size="small"
            format={() => `${rate.toFixed(1)}%`}
            strokeColor={rate > 5 ? "#ff4d4f" : rate > 3 ? "#faad14" : "#52c41a"}
            style={{ minWidth: 120 }}
          />
        </div>
      ),
    },
  ];

  // ── Trend Table: pivot month rows x leave type columns ──────────────

  const leaveTypeCodes = useMemo(() => {
    const codes = Array.from(new Set(trendData.map((d) => d.leaveTypeCode))).sort();
    return codes;
  }, [trendData]);

  const leaveTypeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    trendData.forEach((d) => {
      map[d.leaveTypeCode] = d.leaveTypeName;
    });
    return map;
  }, [trendData]);

  interface TrendRow {
    key: number;
    month: number;
    monthName: string;
    [leaveTypeCode: string]: number | string;
    total: number;
  }

  const trendRows: TrendRow[] = useMemo(() => {
    const rows: TrendRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const row: TrendRow = {
        key: m,
        month: m,
        monthName: MONTH_NAMES[m - 1],
        total: 0,
      };
      leaveTypeCodes.forEach((code) => {
        const entry = trendData.find((d) => d.month === m && d.leaveTypeCode === code);
        const days = entry?.totalDays ?? 0;
        row[code] = days;
        row.total += days;
      });
      rows.push(row);
    }
    return rows;
  }, [trendData, leaveTypeCodes]);

  const trendColumns: ColumnsType<TrendRow> = useMemo(() => {
    const cols: ColumnsType<TrendRow> = [
      {
        title: "Month",
        dataIndex: "monthName",
        key: "monthName",
        fixed: "left",
        width: 110,
      },
    ];
    leaveTypeCodes.forEach((code) => {
      cols.push({
        title: leaveTypeNameMap[code] || code,
        dataIndex: code,
        key: code,
        align: "right",
        width: 100,
        render: (val: number) => (val > 0 ? val : "-"),
      });
    });
    cols.push({
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 80,
      render: (val: number) => <Text strong>{val > 0 ? val : "-"}</Text>,
    });
    return cols;
  }, [leaveTypeCodes, leaveTypeNameMap]);

  // ── Top Absentees Columns ───────────────────────────────────────────

  const topAbsenteesColumns: ColumnsType<TopAbsenteeData> = [
    {
      title: "Employee",
      key: "employee",
      render: (_: unknown, record: TopAbsenteeData) => (
        <div>
          <Text strong>{record.employeeName || record.employeeId || "—"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.employeeNumber || ""}
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.employeeName || "").localeCompare(b.employeeName || ""),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (val: string) => val || "Unassigned",
      sorter: (a, b) => (a.department || "").localeCompare(b.department || ""),
    },
    {
      title: "Total Leave Days",
      dataIndex: "totalLeaveDays",
      key: "totalLeaveDays",
      align: "right",
      sorter: (a, b) => (a.totalLeaveDays || 0) - (b.totalLeaveDays || 0),
      defaultSortOrder: "descend",
      render: (days: number | null | undefined) => (
        <Text strong>{typeof days === "number" && !isNaN(days) ? days.toFixed(1) : "0.0"}</Text>
      ),
    },
  ];

  const expandedRowRender = (record: TopAbsenteeData) => {
    const breakdownColumns: ColumnsType<{ leaveTypeCode: string; days: number }> = [
      {
        title: "Leave Type",
        dataIndex: "leaveTypeCode",
        key: "leaveTypeCode",
      },
      {
        title: "Days",
        dataIndex: "days",
        key: "days",
        align: "right",
      },
    ];
    return (
      <Table
        columns={breakdownColumns}
        dataSource={record.leaveBreakdown}
        rowKey="leaveTypeCode"
        pagination={false}
        size="small"
        style={{ margin: 0 }}
      />
    );
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 16 }}>
      {/* Header / Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Leave Analytics
        </Title>
        <Space>
          <Text>Year:</Text>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
            style={{ width: 100 }}
          />
          <Text>Department:</Text>
          <Select
            allowClear
            placeholder="All Departments"
            value={selectedDept}
            onChange={(val) => setSelectedDept(val)}
            options={departmentOptions}
            style={{ minWidth: 180 }}
          />
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Total Employees"
              value={summaryStats.totalEmployees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Total Leave Days"
              value={summaryStats.totalLeaveDays}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Avg Absenteeism Rate"
              value={summaryStats.avgRate}
              precision={1}
              suffix="%"
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Top Row: Absenteeism + Trend */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card
            title="Absenteeism by Department"
            size="small"
            styles={{ body: { padding: 0 } }}
          >
            {absenteeismLoading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Spin tip="Loading absenteeism data..." />
              </div>
            ) : absenteeismData.length === 0 ? (
              <Empty
                description="No absenteeism data"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 40 }}
              />
            ) : (
              <Table<AbsenteeismData>
                columns={absenteeismColumns}
                dataSource={absenteeismData}
                rowKey="department"
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
              />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="Leave Trend (Monthly)"
            size="small"
            styles={{ body: { padding: 0 } }}
          >
            {trendLoading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Spin tip="Loading trend data..." />
              </div>
            ) : trendData.length === 0 ? (
              <Empty
                description="No trend data"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 40 }}
              />
            ) : (
              <Table<TrendRow>
                columns={trendColumns}
                dataSource={trendRows}
                rowKey="key"
                pagination={false}
                size="small"
                scroll={{ x: "max-content", y: 300 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Bottom: Top 10 Absentees */}
      <Card
        title="Top 10 Absentees"
        size="small"
        styles={{ body: { padding: 0 } }}
      >
        {topAbsenteesLoading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Spin tip="Loading top absentees..." />
          </div>
        ) : topAbsentees.length === 0 ? (
          <Empty
            description="No absentee data"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 40 }}
          />
        ) : (
          <Table<TopAbsenteeData>
            columns={topAbsenteesColumns}
            dataSource={topAbsentees}
            rowKey="employeeId"
            pagination={false}
            size="small"
            expandable={{
              expandedRowRender,
              rowExpandable: (record) =>
                record.leaveBreakdown && record.leaveBreakdown.length > 0,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default LeaveAnalyticsPanel;
