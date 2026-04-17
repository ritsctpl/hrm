'use client';
import { useState } from 'react';
import { Radio, Select, DatePicker, Button, Table, Space, Descriptions, Statistic, Row, Col, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmProjectService } from '../../services/hrmProjectService';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { REPORT_TYPE_OPTIONS } from '../../utils/projectConstants';
import type { ProjectAllocationVsActual, ResourceUtilizationReport } from '../../types/domain.types';
import styles from '../../styles/HrmProject.module.css';

export default function ProjectReportPanel() {
  const { projects, loadingReport, setLoadingReport } = useHrmProjectStore();
  const organizationId = getOrganizationId();
  const [reportType, setReportType] = useState<'allocationVsActual' | 'utilization' | 'capacityDemand'>('allocationVsActual');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [allocationReport, setAllocationReport] = useState<ProjectAllocationVsActual | null>(null);
  const [utilizationReport, setUtilizationReport] = useState<ResourceUtilizationReport | null>(null);

  const handleGenerate = async () => {
    setLoadingReport(true);
    try {
      if (reportType === 'allocationVsActual' && selectedProject) {
        const data = await HrmProjectService.getAllocationVsActual(organizationId, selectedProject);
        setAllocationReport({
          projectHandle: data.projectHandle,
          projectCode: data.projectCode,
          projectName: data.projectName,
          estimateHours: data.estimateHours,
          allocatedHours: data.allocatedHours,
          actualHours: data.actualHours,
          scheduleVariance: data.scheduleVariance,
          allocationAdherence: data.allocationAdherence,
          forecastAccuracy: data.forecastAccuracy,
          employeeBreakdown: data.employeeBreakdown,
        });
      } else if (reportType === 'utilization') {
        const data = await HrmProjectService.getResourceUtilization(organizationId, startDate, endDate);
        setUtilizationReport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const breakdownColumns: ColumnsType<ProjectAllocationVsActual['employeeBreakdown'][number]> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'name' },
    { title: 'Allocated (h)', dataIndex: 'allocatedHours', key: 'alloc', render: (v) => v.toFixed(1) },
    { title: 'Actual (h)', dataIndex: 'actualHours', key: 'actual', render: (v) => v.toFixed(1) },
    { title: 'Adherence %', dataIndex: 'adherencePercentage', key: 'adh', render: (v) => `${v.toFixed(1)}%` },
  ];

  const utilColumns: ColumnsType<ResourceUtilizationReport['employees'][number]> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'name' },
    { title: 'Department', dataIndex: 'department', key: 'dept' },
    { title: 'Capacity (h)', dataIndex: 'totalCapacityHours', key: 'cap', render: (v) => v.toFixed(1) },
    { title: 'Allocated (h)', dataIndex: 'allocatedHours', key: 'alloc', render: (v) => v.toFixed(1) },
    { title: 'Utilization %', dataIndex: 'utilizationPercentage', key: 'util', render: (v) => `${v.toFixed(1)}%` },
    { title: 'Status', dataIndex: 'utilizationStatus', key: 'status' },
  ];

  return (
    <div className={styles.reportPanel}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Radio.Group value={reportType} onChange={(e) => setReportType(e.target.value)}>
          {REPORT_TYPE_OPTIONS.map((r) => (
            <Radio key={r.value} value={r.value}>{r.label}</Radio>
          ))}
        </Radio.Group>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        {reportType === 'allocationVsActual' && (
          <Select
            placeholder="Select Project"
            value={selectedProject || undefined}
            onChange={setSelectedProject}
            style={{ width: 220 }}
            options={projects.map((p) => ({ label: `${p.projectCode} — ${p.projectName}`, value: p.handle }))}
          />
        )}
        {reportType !== 'allocationVsActual' && (
          <>
            <DatePicker value={dayjs(startDate)} onChange={(d) => setStartDate(d?.format('YYYY-MM-DD') ?? startDate)} />
            <DatePicker value={dayjs(endDate)} onChange={(d) => setEndDate(d?.format('YYYY-MM-DD') ?? endDate)} />
          </>
        )}
        <Button type="primary" onClick={handleGenerate} loading={loadingReport}>
          Generate Report
        </Button>
      </Space>

      {loadingReport && <Spin />}

      {allocationReport && reportType === 'allocationVsActual' && (
        <>
          <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Estimate">{allocationReport.estimateHours.toFixed(1)} h</Descriptions.Item>
            <Descriptions.Item label="Allocated">{allocationReport.allocatedHours.toFixed(1)} h</Descriptions.Item>
            <Descriptions.Item label="Actual">{allocationReport.actualHours.toFixed(1)} h</Descriptions.Item>
            <Descriptions.Item label="Schedule Variance">{allocationReport.scheduleVariance.toFixed(1)} h</Descriptions.Item>
            <Descriptions.Item label="Adherence">{allocationReport.allocationAdherence.toFixed(1)}%</Descriptions.Item>
            <Descriptions.Item label="Forecast Accuracy">{allocationReport.forecastAccuracy.toFixed(1)}%</Descriptions.Item>
          </Descriptions>
          <Table
            columns={breakdownColumns}
            dataSource={allocationReport.employeeBreakdown}
            rowKey="employeeId"
            size="small"
            pagination={false}
          />
        </>
      )}

      {utilizationReport && reportType === 'utilization' && (
        <Table
          columns={utilColumns}
          dataSource={utilizationReport.employees}
          rowKey="employeeId"
          size="small"
        />
      )}
    </div>
  );
}
