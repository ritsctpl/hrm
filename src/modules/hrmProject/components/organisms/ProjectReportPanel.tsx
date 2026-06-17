'use client';
import { useState } from 'react';
import { Radio, Select, DatePicker, Button, Table, Space, Descriptions, Statistic, Row, Col, Spin, Empty, Typography, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmProjectService } from '../../services/hrmProjectService';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { REPORT_TYPE_OPTIONS } from '../../utils/projectConstants';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import { exportToExcel, exportToPdf } from '../../utils/reportExport';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { Project, ProjectAllocationVsActual, ResourceUtilizationReport } from '../../types/domain.types';
import type { CapacityDemandReport, ResourceWorkloadReport, ResourceWorkloadEmployee } from '../../types/api.types';
import styles from '../../styles/HrmProject.module.css';

const { Text } = Typography;
type ReportType = 'projectHealth' | 'resourceWorkload' | 'allocationVsActual' | 'utilization' | 'capacityDemand';
type WorkloadFilter = 'ALL' | 'BILLABLE' | 'NON_BILLABLE' | 'UNASSIGNED' | 'UNDER' | 'OVER';

const HEALTH_COLOR: Record<string, string> = {
  'On Track': 'green', 'At Risk': 'orange', 'Off Track': 'red', Completed: 'blue', Cancelled: 'default',
};

// Fit to screen vertically; let wide tables scroll horizontally instead of squishing.
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 320px)' };

function computeHealth(p: Project): { pct: number; health: string } {
  const est = p.estimateHours || 0;
  const act = p.totalActualHours || 0;
  const pct = est > 0 ? Math.round((act / est) * 100) : 0;
  const overdue = !!p.endDate && dayjs(p.endDate).isBefore(dayjs(), 'day') && p.status !== 'COMPLETED' && p.status !== 'CANCELLED';
  const overBudget = est > 0 && act > est;
  let health = 'On Track';
  if (p.status === 'COMPLETED') health = 'Completed';
  else if (p.status === 'CANCELLED') health = 'Cancelled';
  else if (overBudget || overdue) health = 'Off Track';
  else if (pct >= 80) health = 'At Risk';
  return { pct, health };
}

export default function ProjectReportPanel() {
  const { projects, loadingReport, setLoadingReport } = useHrmProjectStore();
  const organizationId = getOrganizationId();
  // Client lookups so every report can show client even when its API row omits it.
  const clientByHandle = new Map(projects.map((p) => [p.handle, p.clientName]));
  const clientByCode = new Map(projects.map((p) => [p.projectCode, p.clientName]));
  const [reportType, setReportType] = useState<ReportType>('projectHealth');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [allocationReport, setAllocationReport] = useState<ProjectAllocationVsActual | null>(null);
  const [utilizationReport, setUtilizationReport] = useState<ResourceUtilizationReport | null>(null);
  const [capacityReport, setCapacityReport] = useState<CapacityDemandReport | null>(null);
  const [workloadReport, setWorkloadReport] = useState<ResourceWorkloadReport | null>(null);
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>('ALL');
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (reportType === 'allocationVsActual' && !selectedProject) {
      message.warning('Select a project first');
      return;
    }
    setLoadingReport(true);
    setHasGenerated(true);
    setAllocationReport(null);
    setUtilizationReport(null);
    setCapacityReport(null);
    setWorkloadReport(null);
    try {
      if (reportType === 'allocationVsActual') {
        const data = await HrmProjectService.getAllocationVsActual(organizationId, selectedProject);
        setAllocationReport(data);
      } else if (reportType === 'utilization') {
        const data = await HrmProjectService.getResourceUtilization(organizationId, startDate, endDate);
        setUtilizationReport(data);
      } else if (reportType === 'capacityDemand') {
        const data = await HrmProjectService.getCapacityDemand(organizationId, startDate, endDate);
        setCapacityReport(data);
      } else if (reportType === 'resourceWorkload') {
        const data = await HrmProjectService.getResourceWorkload(organizationId, startDate, endDate);
        setWorkloadReport(data);
      }
    } catch (err) {
      message.error('Failed to generate report');
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Column-filter option helpers (declared before column defs that use them)
  const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));
  const statusFilters = [
    { text: 'UNDER', value: 'UNDER' }, { text: 'OPTIMAL', value: 'OPTIMAL' }, { text: 'OVER', value: 'OVER' },
  ];

  const breakdownColumns: ColumnsType<ProjectAllocationVsActual['employeeBreakdown'][number]> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'name' },
    { title: 'Allocated (h)', dataIndex: 'allocatedHours', key: 'alloc', align: 'right', render: (v) => v.toFixed(1) },
    { title: 'Actual (h)', dataIndex: 'actualHours', key: 'actual', align: 'right', render: (v) => v.toFixed(1) },
    { title: 'Adherence %', dataIndex: 'adherencePercentage', key: 'adh', align: 'right', render: (v) => `${v.toFixed(1)}%` },
  ];

  const utilColumns: ColumnsType<ResourceUtilizationReport['employees'][number]> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'name' },
    {
      title: 'Department', dataIndex: 'department', key: 'dept',
      filters: uniq((utilizationReport?.employees ?? []).map((e) => e.department)).filter(Boolean).map((d) => ({ text: d, value: d })),
      onFilter: (v, e) => e.department === v,
    },
    { title: 'Capacity (h)', dataIndex: 'totalCapacityHours', key: 'cap', align: 'right', render: (v) => v.toFixed(1) },
    { title: 'Allocated (h)', dataIndex: 'allocatedHours', key: 'alloc', align: 'right', render: (v) => v.toFixed(1) },
    { title: 'Actual (h)', dataIndex: 'actualHours', key: 'act', align: 'right', render: (v) => v.toFixed(1) },
    { title: 'Utilization %', dataIndex: 'utilizationPercentage', key: 'util', align: 'right', sorter: (a, b) => a.utilizationPercentage - b.utilizationPercentage, render: (v) => `${v.toFixed(1)}%` },
    {
      title: 'Status', dataIndex: 'utilizationStatus', key: 'status',
      filters: statusFilters,
      onFilter: (v, e) => e.utilizationStatus === v,
    },
  ];

  const capacityColumns: ColumnsType<CapacityDemandReport['byDepartment'][number]> = [
    { title: 'Department', dataIndex: 'department', key: 'dept' },
    { title: 'Headcount', dataIndex: 'headcount', key: 'hc', align: 'right' },
    { title: 'Capacity (h)', dataIndex: 'capacityHours', key: 'cap', align: 'right', render: (v) => v.toFixed(1) },
    { title: 'Demand (h)', dataIndex: 'demandHours', key: 'dem', align: 'right', render: (v) => v.toFixed(1) },
    {
      title: 'Gap (h)', dataIndex: 'gapHours', key: 'gap', align: 'right',
      render: (v: number) => <Text style={{ color: v < 0 ? '#ff4d4f' : '#52c41a' }}>{v.toFixed(1)}</Text>,
    },
  ];

  const healthColumns: ColumnsType<Project> = [
    {
      title: 'Project', key: 'project',
      render: (_, p) => (
        <div><Text strong>{p.projectName}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>{p.projectCode}</Text></div></div>
      ),
    },
    {
      title: 'Status', key: 'status', width: 120,
      filters: uniq(projects.map((p) => p.status)).map((s) => ({ text: s, value: s })),
      onFilter: (v, p) => p.status === v,
      render: (_, p) => <ProjectStatusBadge status={p.status} />,
    },
    {
      title: 'Type', dataIndex: 'projectType', key: 'type', width: 130,
      filters: [{ text: 'Billable', value: 'BILLABLE' }, { text: 'Non-Billable', value: 'NON_BILLABLE' }, { text: 'Revenue Gen', value: 'REVENUE_GENERATION' }],
      onFilter: (v, p) => p.projectType === v,
      render: (t: string) => (t === 'BILLABLE' ? 'Billable' : t === 'NON_BILLABLE' ? 'Non-Billable' : 'Revenue Gen'),
    },
    {
      title: 'Client', dataIndex: 'clientName', key: 'client', width: 140,
      filters: uniq(projects.map((p) => p.clientName).filter(Boolean) as string[]).map((c) => ({ text: c, value: c })),
      onFilter: (v, p) => p.clientName === v,
      render: (c?: string) => c || <Text type="secondary">—</Text>,
    },
    { title: 'Est (h)', dataIndex: 'estimateHours', key: 'est', width: 80, align: 'right', sorter: (a, b) => (a.estimateHours || 0) - (b.estimateHours || 0) },
    { title: 'Actual (h)', dataIndex: 'totalActualHours', key: 'act', width: 90, align: 'right', sorter: (a, b) => (a.totalActualHours || 0) - (b.totalActualHours || 0), render: (v?: number) => (v ?? 0).toFixed(1) },
    { title: 'Progress', key: 'pct', width: 100, align: 'right', sorter: (a, b) => computeHealth(a).pct - computeHealth(b).pct, render: (_, p) => `${computeHealth(p).pct}%` },
    { title: 'End', dataIndex: 'endDate', key: 'end', width: 120, render: (d?: string) => (d ? dayjs(d).format('DD MMM YYYY') : '—') },
    {
      title: 'Health', key: 'health', width: 120,
      filters: ['On Track', 'At Risk', 'Off Track', 'Completed', 'Cancelled'].map((h) => ({ text: h, value: h })),
      onFilter: (v, p) => computeHealth(p).health === v,
      render: (_, p) => { const h = computeHealth(p).health; return <Tag color={HEALTH_COLOR[h]}>{h}</Tag>; },
    },
  ];

  const workloadColumns: ColumnsType<ResourceWorkloadEmployee> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
    {
      title: 'Department', dataIndex: 'department', key: 'dept',
      filters: uniq((workloadReport?.employees ?? []).map((e) => e.department)).filter(Boolean).map((d) => ({ text: d, value: d })),
      onFilter: (v, e) => e.department === v,
    },
    {
      title: 'Projects', key: 'projects',
      render: (_, e) => (e.unassigned ? <Tag>Unassigned</Tag> : (
        <Space size={4} wrap>
          {e.assignedProjects.map((p) => {
            const cl = clientByCode.get(p.projectCode);
            return (
              <Tooltip key={p.projectCode} title={`${p.projectName}${cl ? ` · ${cl}` : ''}`}>
                <Tag color={p.projectType === 'BILLABLE' ? 'green' : p.projectType === 'NON_BILLABLE' ? 'default' : 'gold'}>{p.projectCode}</Tag>
              </Tooltip>
            );
          })}
        </Space>
      )),
    },
    { title: 'Capacity', dataIndex: 'capacityHours', key: 'cap', width: 90, align: 'right', render: (v: number) => v.toFixed(1) },
    { title: 'Allocated', dataIndex: 'allocatedHours', key: 'alloc', width: 90, align: 'right', render: (v: number) => v.toFixed(1) },
    { title: 'Actual', dataIndex: 'actualHours', key: 'act', width: 80, align: 'right', render: (v: number) => v.toFixed(1) },
    { title: 'Util %', dataIndex: 'utilizationPercentage', key: 'util', width: 90, align: 'right', sorter: (a, b) => a.utilizationPercentage - b.utilizationPercentage, render: (v: number) => `${v.toFixed(0)}%` },
    {
      title: 'Status', dataIndex: 'utilizationStatus', key: 'status', width: 100,
      filters: statusFilters,
      onFilter: (v, e) => e.utilizationStatus === v,
      render: (s: string) => <Tag color={s === 'OVER' ? 'red' : s === 'UNDER' ? 'orange' : 'green'}>{s}</Tag>,
    },
  ];

  const workloadRows = (workloadReport?.employees ?? []).filter((e) => {
    switch (workloadFilter) {
      case 'BILLABLE': return e.onBillable;
      case 'NON_BILLABLE': return e.onNonBillable;
      case 'UNASSIGNED': return e.unassigned;
      case 'UNDER': return e.utilizationStatus === 'UNDER';
      case 'OVER': return e.utilizationStatus === 'OVER';
      default: return true;
    }
  });

  const hasResult = !!(allocationReport || utilizationReport || capacityReport || workloadReport);

  const buildExport = (): { title: string; headers: string[]; rows: (string | number)[][] } | null => {
    if (reportType === 'projectHealth') {
      return {
        title: 'Project Health',
        headers: ['Code', 'Project', 'Client', 'Status', 'Type', 'Est (h)', 'Actual (h)', 'Progress %', 'End', 'Health'],
        rows: projects.map((p) => {
          const { pct, health } = computeHealth(p);
          return [p.projectCode, p.projectName, p.clientName || '', p.status, p.projectType, p.estimateHours || 0, (p.totalActualHours || 0).toFixed(1), pct, p.endDate ? dayjs(p.endDate).format('YYYY-MM-DD') : '', health];
        }),
      };
    }
    if (reportType === 'resourceWorkload' && workloadReport) {
      return {
        title: 'Resource Workload',
        headers: ['Employee', 'Department', 'Projects', 'Capacity', 'Allocated', 'Actual', 'Util %', 'Status'],
        rows: workloadRows.map((e) => [e.employeeName, e.department, e.unassigned ? 'Unassigned' : e.assignedProjects.map((p) => `${p.projectCode}(${p.projectType})`).join('; '), e.capacityHours.toFixed(1), e.allocatedHours.toFixed(1), e.actualHours.toFixed(1), e.utilizationPercentage.toFixed(0), e.utilizationStatus]),
      };
    }
    if (reportType === 'allocationVsActual' && allocationReport) {
      return {
        title: `Allocation vs Actual — ${allocationReport.projectCode}`,
        headers: ['Employee', 'Allocated (h)', 'Actual (h)', 'Adherence %'],
        rows: allocationReport.employeeBreakdown.map((b) => [b.employeeName, b.allocatedHours.toFixed(1), b.actualHours.toFixed(1), b.adherencePercentage.toFixed(1)]),
      };
    }
    if (reportType === 'utilization' && utilizationReport) {
      return {
        title: 'Resource Utilization',
        headers: ['Employee', 'Department', 'Capacity', 'Allocated', 'Actual', 'Util %', 'Status'],
        rows: utilizationReport.employees.map((e) => [e.employeeName, e.department, e.totalCapacityHours.toFixed(1), e.allocatedHours.toFixed(1), e.actualHours.toFixed(1), e.utilizationPercentage.toFixed(1), e.utilizationStatus]),
      };
    }
    if (reportType === 'capacityDemand' && capacityReport) {
      return {
        title: 'Capacity Demand',
        headers: ['Department', 'Headcount', 'Capacity', 'Demand', 'Gap'],
        rows: capacityReport.byDepartment.map((d) => [d.department, d.headcount, d.capacityHours.toFixed(1), d.demandHours.toFixed(1), d.gapHours.toFixed(1)]),
      };
    }
    return null;
  };

  const canExport = reportType === 'projectHealth' ? projects.length > 0 : hasResult;

  const doExport = (fmt: 'excel' | 'pdf') => {
    const data = buildExport();
    if (!data || data.rows.length === 0) { message.warning('Nothing to export'); return; }
    const fname = `${data.title.replace(/[^a-z0-9]+/gi, '_')}_${dayjs().format('YYYYMMDD')}`;
    if (fmt === 'excel') exportToExcel(fname, data.headers, data.rows);
    else exportToPdf(fname, data.title, data.headers, data.rows);
  };

  return (
    <div className={styles.reportPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Radio.Group value={reportType} onChange={(e) => { setReportType(e.target.value); setHasGenerated(false); }} optionType="button" buttonStyle="solid">
          {REPORT_TYPE_OPTIONS.map((r) => (
            <Radio.Button key={r.value} value={r.value}>{r.label}</Radio.Button>
          ))}
        </Radio.Group>
        {canExport && (
          <Space>
            <Button size="small" icon={<FileExcelOutlined />} onClick={() => doExport('excel')}>Excel</Button>
            <Button size="small" icon={<FilePdfOutlined />} onClick={() => doExport('pdf')}>PDF</Button>
          </Space>
        )}
      </div>

      {reportType === 'projectHealth' && (
        <>
          <Space wrap style={{ marginBottom: 12 }}>
            {['On Track', 'At Risk', 'Off Track', 'Completed', 'Cancelled'].map((h) => {
              const n = projects.filter((p) => computeHealth(p).health === h).length;
              return n > 0 ? <Tag key={h} color={HEALTH_COLOR[h]}>{h}: {n}</Tag> : null;
            })}
          </Space>
          <Table columns={healthColumns} dataSource={projects} rowKey="handle" size="small" pagination={false} scroll={TABLE_SCROLL} sticky locale={{ emptyText: 'No projects' }} />
        </>
      )}

      {reportType !== 'projectHealth' && (
      <>
      <Space wrap style={{ marginBottom: 16, display: 'flex' }}>
        {reportType === 'allocationVsActual' ? (
          <Select
            placeholder="Select project"
            value={selectedProject || undefined}
            onChange={setSelectedProject}
            showSearch
            optionFilterProp="label"
            style={{ width: 260 }}
            options={projects.map((p) => ({ label: `${p.projectCode} — ${p.projectName}`, value: p.handle }))}
          />
        ) : (
          <>
            <DatePicker value={dayjs(startDate)} onChange={(d) => setStartDate(d?.format('YYYY-MM-DD') ?? startDate)} />
            <span>to</span>
            <DatePicker value={dayjs(endDate)} onChange={(d) => setEndDate(d?.format('YYYY-MM-DD') ?? endDate)} />
          </>
        )}
        <Button type="primary" onClick={handleGenerate} loading={loadingReport}>
          Generate Report
        </Button>
      </Space>

      {loadingReport ? (
        <Spin />
      ) : (
        <>
          {allocationReport && reportType === 'allocationVsActual' && (
            <>
              <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }} title={`${allocationReport.projectCode} — ${allocationReport.projectName}`}>
                <Descriptions.Item label="Client">{clientByHandle.get(allocationReport.projectHandle) || clientByCode.get(allocationReport.projectCode) || '—'}</Descriptions.Item>
                <Descriptions.Item label="Estimate">{allocationReport.estimateHours.toFixed(1)} h</Descriptions.Item>
                <Descriptions.Item label="Allocated">{allocationReport.allocatedHours.toFixed(1)} h</Descriptions.Item>
                <Descriptions.Item label="Actual">{allocationReport.actualHours.toFixed(1)} h</Descriptions.Item>
                <Descriptions.Item label="Schedule Variance">{allocationReport.scheduleVariance.toFixed(1)} h</Descriptions.Item>
                <Descriptions.Item label="Adherence">{allocationReport.allocationAdherence.toFixed(1)}%</Descriptions.Item>
                <Descriptions.Item label="Forecast Accuracy">{allocationReport.forecastAccuracy.toFixed(1)}%</Descriptions.Item>
              </Descriptions>
              <Table columns={breakdownColumns} dataSource={allocationReport.employeeBreakdown} rowKey="employeeId" size="small" pagination={false} scroll={TABLE_SCROLL} sticky locale={{ emptyText: 'No employee data' }} />
            </>
          )}

          {utilizationReport && reportType === 'utilization' && (
            <Table columns={utilColumns} dataSource={utilizationReport.employees} rowKey="employeeId" size="small" pagination={false} scroll={TABLE_SCROLL} sticky locale={{ emptyText: 'No utilization data' }} />
          )}

          {capacityReport && reportType === 'capacityDemand' && (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col><Statistic title="Total Capacity (h)" value={capacityReport.totalCapacityHours.toFixed(1)} /></Col>
                <Col><Statistic title="Total Demand (h)" value={capacityReport.totalDemandHours.toFixed(1)} /></Col>
                <Col>
                  <Statistic
                    title="Gap (h)"
                    value={capacityReport.gapHours.toFixed(1)}
                    valueStyle={{ color: capacityReport.gapHours < 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Col>
              </Row>
              <Table columns={capacityColumns} dataSource={capacityReport.byDepartment} rowKey="department" size="small" pagination={false} scroll={TABLE_SCROLL} sticky locale={{ emptyText: 'No department data' }} />
            </>
          )}

          {workloadReport && reportType === 'resourceWorkload' && (
            <>
              <Space wrap style={{ marginBottom: 12 }}>
                <Radio.Group value={workloadFilter} onChange={(e) => setWorkloadFilter(e.target.value)} size="small">
                  <Radio.Button value="ALL">All ({workloadReport.totalEmployees})</Radio.Button>
                  <Radio.Button value="BILLABLE">Billable ({workloadReport.billableCount})</Radio.Button>
                  <Radio.Button value="NON_BILLABLE">Non-Billable ({workloadReport.nonBillableCount})</Radio.Button>
                  <Radio.Button value="UNASSIGNED">Unassigned ({workloadReport.unassignedCount})</Radio.Button>
                  <Radio.Button value="UNDER">Underutilized ({workloadReport.underUtilizedCount})</Radio.Button>
                  <Radio.Button value="OVER">Overloaded ({workloadReport.overloadedCount})</Radio.Button>
                </Radio.Group>
              </Space>
              <Table columns={workloadColumns} dataSource={workloadRows} rowKey="employeeId" size="small" pagination={false} scroll={TABLE_SCROLL} sticky locale={{ emptyText: 'No employees in this bucket' }} />
            </>
          )}

          {hasGenerated && !hasResult && (
            <Empty description="No data for the selected criteria" />
          )}
          {!hasGenerated && (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Choose a report and press Generate" />
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}
