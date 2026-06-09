'use client';
import React from 'react';
import { Descriptions, Progress, Card, Space, Button, Popconfirm, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { Project, ProjectStatus } from '../../types/domain.types';
import { parseCookies } from 'nookies';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { formatDate } from '../../utils/projectHelpers';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectDetail.module.css';

const TYPE_LABELS: Record<string, string> = {
  BILLABLE: 'Billable', NON_BILLABLE: 'Non-Billable', REVENUE_GENERATION: 'Revenue Generation',
};

const STATUS_LABELS: Record<string, string> = {
  INITIATED: 'Initiated', DRAFT: 'Draft', IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

interface ProjectOverviewTabProps {
  project: Project;
}

const STATUS_TRANSITIONS: Record<string, ProjectStatus[]> = {
  INITIATED: ['DRAFT', 'CANCELLED'],
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project }) => {
  const store = useHrmProjectStore();
  const { deleteProject, updateProjectStatus } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();
  const util = Math.min(project.utilizationPercentage ?? 0, 100);

  // Project status is progress tracking (no approval). Only the project manager moves stages.
  const isPM = !!employeeCode && employeeCode === project.projectManagerId;
  const nextStages = STATUS_TRANSITIONS[project.status] ?? [];

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    const user = parseCookies().rl_user_id ?? parseCookies().user ?? '';
    await updateProjectStatus(project.handle, newStatus, '', user);
  };

  const handleEdit = () => {
    store.openProjectForm(project);
  };

  const handleDelete = async () => {
    await deleteProject(project.handle);
  };

  return (
    <div className={styles.overviewGrid}>
      <Card size="small" title="Project Identity">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Code">{project.projectCode}</Descriptions.Item>
          <Descriptions.Item label="Name">{project.projectName}</Descriptions.Item>
          <Descriptions.Item label="Status"><ProjectStatusBadge status={project.status} /></Descriptions.Item>
          <Descriptions.Item label="Type">{TYPE_LABELS[project.projectType] ?? project.projectType}</Descriptions.Item>
          <Descriptions.Item label="BU">{project.buCode}</Descriptions.Item>
          {project.departmentCode && (
            <Descriptions.Item label="Department">{project.departmentCode}</Descriptions.Item>
          )}
          {project.clientName && (
            <Descriptions.Item label="Client">{project.clientName}</Descriptions.Item>
          )}
          {project.currency && (
            <Descriptions.Item label="Currency">{project.currency}</Descriptions.Item>
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

        <Card size="small" title="Actions">
          <Space wrap>
            <Can I="edit">
              <Button size="small" icon={<EditOutlined />} onClick={handleEdit}>Edit Project</Button>
            </Can>
            {isPM && nextStages.length > 0 && (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: nextStages.map((s) => ({
                    key: s,
                    label: STATUS_LABELS[s] ?? s,
                    danger: s === 'CANCELLED',
                  })),
                  onClick: ({ key }) => handleStatusChange(key as ProjectStatus),
                }}
              >
                <Button size="small">Move to next stage <DownOutlined /></Button>
              </Dropdown>
            )}
            <Can I="delete">
              <Popconfirm title="Delete this project?" onConfirm={handleDelete} okText="Delete" okType="danger">
                <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
              </Popconfirm>
            </Can>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverviewTab;
