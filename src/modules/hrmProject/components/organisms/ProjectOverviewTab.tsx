'use client';
import React from 'react';
import { Descriptions, Progress, Card, Space, Button, Popconfirm } from 'antd';
import { message } from 'antd';
import type { Project, ProjectStatus } from '../../types/domain.types';
import { parseCookies } from 'nookies';
import { HrmProjectService } from '../../services/hrmProjectService';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { formatDate } from '../../utils/projectHelpers';
import styles from '../../styles/ProjectDetail.module.css';

interface ProjectOverviewTabProps {
  project: Project;
}

const STATUS_TRANSITIONS: Record<string, ProjectStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project }) => {
  const store = useHrmProjectStore();
  const util = Math.min(project.utilizationPercentage ?? 0, 100);

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    const site = parseCookies().site ?? '';
    const user = parseCookies().user ?? '';
    try {
      await HrmProjectService.updateProjectStatus({
        site,
        handle: project.handle,
        status: newStatus,
        modifiedBy: user,
      });
      store.updateProjectInList({ ...project, status: newStatus });
      message.success(`Project status changed to ${newStatus}`);
    } catch {
      message.error('Failed to update project status');
    }
  };

  return (
    <div className={styles.overviewGrid}>
      <Card size="small" title="Project Identity">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Code">{project.projectCode}</Descriptions.Item>
          <Descriptions.Item label="Name">{project.projectName}</Descriptions.Item>
          <Descriptions.Item label="Type">{project.projectType}</Descriptions.Item>
          <Descriptions.Item label="BU">{project.buCode}</Descriptions.Item>
          {project.departmentCode && (
            <Descriptions.Item label="Department">{project.departmentCode}</Descriptions.Item>
          )}
          {project.clientName && (
            <Descriptions.Item label="Client">{project.clientName}</Descriptions.Item>
          )}
          <Descriptions.Item label="PM">{project.projectManagerName}</Descriptions.Item>
          <Descriptions.Item label="Start">{formatDate(project.startDate)}</Descriptions.Item>
          <Descriptions.Item label="End">{formatDate(project.endDate)}</Descriptions.Item>
          {project.description && (
            <Descriptions.Item label="Description">{project.description}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <div>
        <Card size="small" title="Effort & Progress" className={styles.progressCard} style={{ marginBottom: 12 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Estimate">{project.estimateHours} h</Descriptions.Item>
            <Descriptions.Item label="Allocated">{project.totalAllocatedHours} h</Descriptions.Item>
            <Descriptions.Item label="Actual">{project.totalActualHours} h</Descriptions.Item>
            <Descriptions.Item label="Utilization">{util}%</Descriptions.Item>
            <Descriptions.Item label="Variance">
              {project.scheduleVariance >= 0
                ? `${project.scheduleVariance}h ahead`
                : `${Math.abs(project.scheduleVariance)}h behind`}
            </Descriptions.Item>
          </Descriptions>
          <Progress percent={util} size="small" style={{ marginTop: 8 }} />
        </Card>

        {STATUS_TRANSITIONS[project.status]?.length > 0 && (
          <Card size="small" title="Status Actions">
            <Space wrap>
              {STATUS_TRANSITIONS[project.status].map((nextStatus) => (
                <Popconfirm
                  key={nextStatus}
                  title={`Change status to ${nextStatus}?`}
                  onConfirm={() => handleStatusChange(nextStatus)}
                  okText="Confirm"
                >
                  <Button size="small">{nextStatus.replace('_', ' ')}</Button>
                </Popconfirm>
              ))}
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectOverviewTab;
