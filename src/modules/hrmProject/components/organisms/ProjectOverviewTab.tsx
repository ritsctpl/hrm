'use client';
import React, { useState } from 'react';
import { Descriptions, Progress, Card, Button, Dropdown, Tag, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { Project, ProjectStatus } from '../../types/domain.types';
import { parseCookies } from 'nookies';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { formatDate } from '../../utils/projectHelpers';
import { ALLOCATION_OVER_THRESHOLD_PCT } from '../../utils/projectConstants';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import ChangeManagerModal from './ChangeManagerModal';
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
  // Re-open: a wrongly closed project can be brought back.
  COMPLETED: ['IN_PROGRESS'],
  CANCELLED: ['DRAFT'],
};

// Terminal states get a "Re-open" label instead of "Move to next stage".
const TERMINAL_STATUSES = new Set<string>(['COMPLETED', 'CANCELLED']);

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project }) => {
  const { updateProjectStatus } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();
  const [changeManagerOpen, setChangeManagerOpen] = useState(false);

  const estimate = project.estimateHours || 0;
  // committed work = approved task allocations (excludes membership); fall back to total if absent
  const committed = project.committedWorkHours ?? project.totalAllocatedHours ?? 0;
  const actual = project.totalActualHours || 0;
  const remaining = Math.max(estimate - actual, 0);
  const actualPct = estimate > 0 ? Math.round((actual / estimate) * 100) : 0;
  const allowed = estimate * (ALLOCATION_OVER_THRESHOLD_PCT / 100);
  const overCommitted = estimate > 0 && committed > allowed;

  // Project status is progress tracking (no approval). Only the project manager moves stages.
  // Edit / delete live on the list row's Actions — not duplicated here.
  const isPM = !!employeeCode && employeeCode === project.projectManagerId;
  const nextStages = STATUS_TRANSITIONS[project.status] ?? [];

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    const user = parseCookies().rl_user_id ?? parseCookies().user ?? '';
    await updateProjectStatus(project.handle, newStatus, '', user);
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
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Estimated</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{estimate} h</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Actual (timesheet)</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{actual} h</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Remaining</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: remaining === 0 && estimate > 0 ? '#ff4d4f' : undefined }}>{remaining} h</div>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#595959', marginBottom: 2 }}>
              <span>Progress — actual vs estimate</span><span>{actual} h / {estimate} h · {actualPct}%</span>
            </div>
            <Progress
              percent={Math.min(actualPct, 100)}
              size="small"
              showInfo={false}
              strokeColor={actualPct > 100 ? '#ff4d4f' : '#52c41a'}
            />
          </div>

          <div style={{ fontSize: 12, color: '#595959' }}>
            Committed work: <strong>{committed} h</strong> of {estimate} h
            {overCommitted && (
              <Tag color="red" style={{ marginLeft: 8 }}>exceeds {ALLOCATION_OVER_THRESHOLD_PCT}% ({allowed.toFixed(0)} h allowed)</Tag>
            )}
          </div>
        </Card>

        {isPM && (
          <Card size="small" title="Project Actions">
            <Space wrap>
              {nextStages.length > 0 && (
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
                  <Button size="small">
                    {TERMINAL_STATUSES.has(project.status) ? 'Re-open' : 'Move to next stage'} <DownOutlined />
                  </Button>
                </Dropdown>
              )}
              <Button size="small" onClick={() => setChangeManagerOpen(true)}>Change Manager</Button>
            </Space>
          </Card>
        )}
      </div>

      <ChangeManagerModal open={changeManagerOpen} project={project} onClose={() => setChangeManagerOpen(false)} />
    </div>
  );
};

export default ProjectOverviewTab;
