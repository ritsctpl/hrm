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
  Tag,
  Switch,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BarChartOutlined,
  TeamOutlined,
  CalendarOutlined,
  LaptopOutlined,
  TableOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import {
  AbsenteeismData,
  LeaveTrendData,
  TopAbsenteeData,
} from "../../types/api.types";
import { buildYearOptions } from "../../utils/transformations";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";

const formatDept = (val: string | undefined | null): string => {
  const trimmed = (val ?? "").trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") {
    return "Unassigned";
  }
  return trimmed;
};

const { Title, Text } = Typography;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Pie chart colour palette — enough for most department lists
const PIE_COLORS = [
  "#4F81BD", "#C0504D", "#9BBB59", "#8064A2",
  "#4BACC6", "#F79646", "#2E75B6", "#843C0C",
  "#375623", "#17375E", "#7030A0", "#00B0F0",
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

  // Toggle: show BarChart vs pivot table for monthly trend
  const [showTrendTable, setShowTrendTable] = useState(false);

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
        // Department filter must narrow the trend too, not just absenteeism.
        deptId: selectedDept,
      });
      setTrendData(res);
    } catch {
      message.error("Failed to load leave trend data");
    } finally {
      setTrendLoading(false);
    }
  }, [organizationId, selectedYear, selectedDept]);

  const fetchTopAbsentees = useCallback(async () => {
    setTopAbsenteesLoading(true);
    try {
      const res = await HrmLeaveService.getTopAbsentees({
        organizationId,
        year: selectedYear,
        limit: 10,
        // Department filter also scopes top-absentees (and the WFH summary
        // derived from it).
        deptId: selectedDept,
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
  }, [organizationId, selectedYear, selectedDept]);

  useEffect(() => {
    fetchAbsenteeism();
    fetchTrend();
    fetchTopAbsentees();
  }, [fetchAbsenteeism, fetchTrend, fetchTopAbsentees]);

  // ── Department options ───────────────────────────────────────────────
  const { employees: directoryEmployees } = useEmployeeOptions();
  const departmentOptions = useMemo(() => {
    const depts = new Set<string>();
    for (const row of absenteeismData) {
      const d = (row.department ?? "").trim();
      if (d && d.toLowerCase() !== "unknown") depts.add(d);
    }
    for (const emp of directoryEmployees) {
      const d = (emp.department ?? "").trim();
      if (d && d.toLowerCase() !== "unknown") depts.add(d);
    }
    return Array.from(depts).sort().map((d) => ({ value: d, label: d }));
  }, [absenteeismData, directoryEmployees]);

  // ── Summary Stats ───────────────────────────────────────────────────

  const summaryStats = useMemo(() => {
    const totalEmployees = absenteeismData.reduce((sum, d) => sum + (d.totalEmployees || 0), 0);
    const totalLeaveDays = absenteeismData.reduce((sum, d) => sum + (d.totalLeaveDays || 0), 0);
    const validRates = absenteeismData.filter(
      (d) => typeof d.absenteeismRate === "number" && !isNaN(d.absenteeismRate)
    );
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

  // ── WFH Summary ─────────────────────────────────────────────────────
  // Count WFH days from top-absentees breakdown entries.
  const wfhStats = useMemo(() => {
    let totalWfhDays = 0;
    let wfhEmployeeCount = 0;
    for (const emp of topAbsentees) {
      const breakdown = emp.leaveBreakdown ?? [];
      const wfhEntry = breakdown.find(
        (b) => (b.leaveTypeCode ?? "").toUpperCase() === "WFH"
      );
      if (wfhEntry && (wfhEntry.days ?? 0) > 0) {
        totalWfhDays += wfhEntry.days;
        wfhEmployeeCount += 1;
      }
    }
    return { totalWfhDays, wfhEmployeeCount };
  }, [topAbsentees]);

  // ── Monthly Trend BarChart data ──────────────────────────────────────
  // Aggregate all leave-type entries per month into a single "total days" value.
  // Only include months where total > 0 so the chart isn't padded with empty bars.
  const monthlyBarData = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const entry of trendData) {
      const month = entry?.month;
      const days = Number(entry?.totalDays ?? 0);
      if (month >= 1 && month <= 12 && !isNaN(days)) {
        totals[month] = (totals[month] ?? 0) + days;
      }
    }
    return SHORT_MONTH_NAMES
      .map((name, idx) => ({ month: name, days: totals[idx + 1] ?? 0 }))
      .filter((row) => row.days > 0);
  }, [trendData]);

  // ── Trend pivot-table data (kept as secondary/expandable view) ───────

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

  // ── Department Pie Chart data ─────────────────────────────────────────
  // Use absenteeism data (totalLeaveDays per department) as the slice value.
  const deptPieData = useMemo(() => {
    return absenteeismData
      .filter((d) => (d.totalLeaveDays ?? 0) > 0)
      .map((d) => ({
        name: formatDept(d.department),
        value: d.totalLeaveDays ?? 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [absenteeismData]);

  // ── Absenteeism Table Columns ───────────────────────────────────────

  const absenteeismColumns: ColumnsType<AbsenteeismData> = [
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (val: string) => formatDept(val),
      sorter: (a, b) => formatDept(a.department).localeCompare(formatDept(b.department)),
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

  // ── Top Absentees Columns ───────────────────────────────────────────

  const topAbsenteesColumns: ColumnsType<TopAbsenteeData> = [
    {
      title: "#",
      key: "rank",
      width: 48,
      render: (_: unknown, __: TopAbsenteeData, index: number) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: "Employee",
      key: "employee",
      render: (_: unknown, record: TopAbsenteeData) => {
        const name = record.employeeName?.trim() || "";
        const code = record.employeeNumber?.trim() || "";
        return (
          <div>
            <Text strong>{name || code || "—"}</Text>
            {code && name && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {code}
                </Text>
              </>
            )}
          </div>
        );
      },
      sorter: (a, b) => (a.employeeName || "").localeCompare(b.employeeName || ""),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (val: string) => formatDept(val),
      sorter: (a, b) => formatDept(a.department).localeCompare(formatDept(b.department)),
    },
    {
      title: "Total Leave Days",
      dataIndex: "totalLeaveDays",
      key: "totalLeaveDays",
      align: "right",
      sorter: (a, b) => (a.totalLeaveDays || 0) - (b.totalLeaveDays || 0),
      defaultSortOrder: "descend",
      render: (days: number | null | undefined) => (
        <Text strong>
          {typeof days === "number" && !isNaN(days) ? days.toFixed(1) : "0.0"}
        </Text>
      ),
    },
    {
      title: "WFH",
      key: "wfh",
      align: "right",
      width: 80,
      render: (_: unknown, record: TopAbsenteeData) => {
        const wfhEntry = (record.leaveBreakdown ?? []).find(
          (b) => (b.leaveTypeCode ?? "").toUpperCase() === "WFH"
        );
        const days = wfhEntry?.days ?? 0;
        return days > 0 ? (
          <Tag color="blue" style={{ margin: 0 }}>
            {days}d
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
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

  // ── Custom Pie tooltip ───────────────────────────────────────────────
  const PieCustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0];
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 13,
        }}
      >
        <Text strong>{entry.name}</Text>
        <br />
        <Text>{entry.value} day{entry.value !== 1 ? "s" : ""}</Text>
      </div>
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
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Employees"
              value={summaryStats.totalEmployees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Leave Days"
              value={summaryStats.totalLeaveDays}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
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
        <Col span={6}>
          {/* WFH Analytics card */}
          <Card size="small" style={{ borderColor: "#91caff", background: "#f0f7ff" }}>
            <Statistic
              title={
                <Space size={4}>
                  <LaptopOutlined style={{ color: "#1677ff" }} />
                  <span>WFH Days (Top 10)</span>
                </Space>
              }
              value={wfhStats.totalWfhDays}
              suffix={
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                  &nbsp;across {wfhStats.wfhEmployeeCount} emp
                </Text>
              }
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 1: Monthly Trend BarChart (left) | Department Pie Chart (right) */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Monthly Leave Trend */}
        <Col span={12}>
          <Card
            title="Monthly Leave Trend"
            size="small"
            extra={
              <Space size={6}>
                <TableOutlined style={{ color: showTrendTable ? "#1677ff" : "#bfbfbf" }} />
                <Switch
                  size="small"
                  checked={showTrendTable}
                  onChange={setShowTrendTable}
                  title="Toggle pivot table"
                />
                <Text style={{ fontSize: 12, color: "#8c8c8c" }}>Table</Text>
              </Space>
            }
            styles={{ body: { padding: showTrendTable ? 0 : "12px 12px 4px" } }}
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
            ) : showTrendTable ? (
              /* Secondary: pivot table */
              <Table<TrendRow>
                columns={trendColumns}
                dataSource={trendRows}
                rowKey="key"
                pagination={false}
                size="small"
                scroll={{ x: "max-content", y: 280 }}
              />
            ) : (
              /* Primary: BarChart */
              monthlyBarData.length === 0 ? (
                <Empty
                  description="No monthly data with leave days > 0"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: 40 }}
                />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={monthlyBarData}
                    margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#595959" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#595959" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={36}
                    />
                    <RechartTooltip
                      cursor={{ fill: "#f5f5f5" }}
                      formatter={(value: number) => [`${value} days`, "Leave Days"]}
                    />
                    <Bar
                      dataKey="days"
                      fill="#4F81BD"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </Card>
        </Col>

        {/* Department Pie Chart */}
        <Col span={12}>
          <Card
            title="Leave Days by Department"
            size="small"
            styles={{ body: { padding: "12px 12px 4px" } }}
          >
            {absenteeismLoading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Spin tip="Loading department data..." />
              </div>
            ) : deptPieData.length === 0 ? (
              <Empty
                description="No department leave data"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 40 }}
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deptPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    outerRadius={100}
                    innerRadius={48}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {deptPieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartTooltip content={<PieCustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 2: Top 10 Absentees (full width) */}
      <Card
        title="Top 10 Absentees"
        size="small"
        styles={{ body: { padding: 0 } }}
        style={{ marginBottom: 16 }}
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

      {/* Row 3: Absenteeism Progress Table (full width) */}
      <Card
        title="Absenteeism Rate by Department"
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
    </div>
  );
};

export default LeaveAnalyticsPanel;
