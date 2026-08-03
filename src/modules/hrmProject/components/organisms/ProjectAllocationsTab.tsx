'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Space, Spin, Tooltip, Alert, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AllocationRow from '../molecules/AllocationRow';
import ResourceMoveModal from './ResourceMoveModal';
import ReviseAllocationModal from './ReviseAllocationModal';
import EditAllocationModal from './EditAllocationModal';
import TemporaryCoverModal from './TemporaryCoverModal';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { parseCookies } from 'nookies';
import { ALLOCATION_STATUS_OPTIONS } from '../../utils/projectConstants';
import type { ResourceAllocation } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectDetail.module.css';

const { Text } = Typography;

export default function ProjectAllocationsTab() {
  const {
    selectedProject,
    projectAllocations,
    loadingAllocations,
    openAllocationForm,
    filterStatus,
    setFilterStatus,
  } = useHrmProjectStore();
  const { loadAllocations } = useProjectData();
  const { submitAllocation, cancelAllocation, recallAllocation } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();

  // Resource lifecycle modals (reassign / replace / release member / revise)
  const [moveModal, setMoveModal] = useState<{ mode: 'reassign' | 'replace' | 'release'; allocation: ResourceAllocation; taskCount: number } | null>(null);
  const [editTarget, setEditTarget] = useState<ResourceAllocation | null>(null);
  const [reviseTarget, setReviseTarget] = useState<ResourceAllocation | null>(null);
  const [coverTarget, setCoverTarget] = useState<ResourceAllocation | null>(null);

  useEffect(() => {
    if (selectedProject) {
      loadAllocations(selectedProject.handle);
    }
  }, [selectedProject?.handle]);

  const filtered = filterStatus
    ? projectAllocations.filter((a) => a.status === filterStatus)
    : projectAllocations;

  // Group allocations by employee: one membership (project-level) row + nested task rows
  const groups = useMemo(() => {
    const map = new Map<string, {
      employeeId: string;
      employeeName: string;
      membership: typeof projectAllocations[number] | null;
      tasks: typeof projectAllocations[number][];
    }>();
    for (const a of filtered) {
      const g = map.get(a.employeeId) ?? { employeeId: a.employeeId, employeeName: a.employeeName, membership: null, tasks: [] };
      if (a.employeeName) g.employeeName = a.employeeName;
      if (!a.taskId) g.membership = a;
      else g.tasks.push(a);
      map.set(a.employeeId, g);
    }
    return Array.from(map.values());
  }, [filtered]);

  const handleSubmit = (a: typeof projectAllocations[number]) => {
    if (selectedProject) submitAllocation(a.handle, selectedProject.handle);
  };

  const handleCancel = (a: typeof projectAllocations[number]) => {
    if (selectedProject) cancelAllocation(a.handle, selectedProject.handle);
  };

  const handleAssignTask = (a: typeof projectAllocations[number]) => {
    openAllocationForm({
      employeeId: a.employeeId,
      employeeName: a.employeeName,
      role: a.role,
      bookingType: String(a.bookingType),
      startDate: a.startDate,
      endDate: a.endDate,
    });
  };

  const activeTaskCount = (employeeId: string) => {
    const grp = groups.find((g) => g.employeeId === employeeId);
    return grp ? grp.tasks.filter((t) => t.status !== 'CANCELLED' && t.status !== 'REJECTED').length : 0;
  };
  // DRAFT / REJECTED rows edit in place; approved ones go through Revise.
  const handleEdit = (a: ResourceAllocation) => setEditTarget(a);
  const handleReassign = (a: ResourceAllocation) => setMoveModal({ mode: 'reassign', allocation: a, taskCount: 0 });
  const handleReplace = (a: ResourceAllocation) => setMoveModal({ mode: 'replace', allocation: a, taskCount: activeTaskCount(a.employeeId) });
  const handleRelease = (a: ResourceAllocation) => setMoveModal({ mode: 'release', allocation: a, taskCount: activeTaskCount(a.employeeId) });
  const handleRevise = (a: ResourceAllocation) => setReviseTarget(a);
  const handleCover = (a: ResourceAllocation) => setCoverTarget(a);
  const handleRecall = (a: ResourceAllocation) => {
    if (!selectedProject) return;
    const actor = employeeCode || parseCookies().employeeCode || parseCookies().rl_user_id || parseCookies().user || '';
    if (!actor) return;
    recallAllocation(a.handle, selectedProject.handle, actor);
  };

  const projectStatus = selectedProject?.status;
  const blockedStatuses = new Set(['ON_HOLD', 'COMPLETED', 'CANCELLED']);
  const canAddAllocation = !!projectStatus && !blockedStatuses.has(projectStatus);
  const inactiveReason =
    projectStatus && blockedStatuses.has(projectStatus)
      ? `Allocations cannot be added to ${projectStatus.replace('_', ' ')} projects`
      : '';

  return (
    <div className={styles.allocationsTab}>
      {!canAddAllocation && projectStatus && (
        <Alert
          type="info"
          showIcon
          message={inactiveReason}
          style={{ marginBottom: 12 }}
        />
      )}
      <div className={styles.allocationsHeader}>
        <Space>
          <Text strong>{groups.length} member{groups.length === 1 ? '' : 's'}</Text>
          <Select
            placeholder="Status filter"
            value={filterStatus || undefined}
            onChange={setFilterStatus}
            allowClear
            style={{ width: 140 }}
            options={ALLOCATION_STATUS_OPTIONS}
          />
        </Space>
        <Can I="add">
          <Tooltip title={canAddAllocation ? '' : inactiveReason}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openAllocationForm()}
              disabled={!canAddAllocation}
            >
              Add Allocation
            </Button>
          </Tooltip>
        </Can>
      </div>

      {loadingAllocations ? (
        <Spin />
      ) : (
        <div className={styles.allocationsList}>
          {groups.map((g) => {
            // Summary counts only active task allocations — exclude cancelled / rejected.
            const activeTasks = g.tasks.filter((t) => t.status !== 'CANCELLED' && t.status !== 'REJECTED');
            const totalTaskHours = activeTasks.reduce((s, t) => s + (t.hoursPerDay || 0), 0);
            return (
              <div key={g.employeeId} className={styles.memberGroup}>
                {g.membership ? (
                  <AllocationRow
                    allocation={g.membership}
                    hideHours
                    onEdit={handleEdit}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    onAssignTask={handleAssignTask}
                    onReplace={handleReplace}
                    onRelease={handleRelease}
                    onRevise={handleRevise}
                    onRecall={handleRecall}
                  />
                ) : (
                  <div style={{ padding: '8px 0' }}><Text strong>{g.employeeName}</Text></div>
                )}

                <div className={styles.memberTasks}>
                  {g.tasks.length > 0 ? (
                    <>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {activeTasks.length} active task{activeTasks.length === 1 ? '' : 's'} · {totalTaskHours}h/day total
                      </Text>
                      {g.tasks.map((t) => (
                        <AllocationRow
                          key={t.handle}
                          allocation={t}
                          hideEmployee
                          onEdit={handleEdit}
                          onSubmit={handleSubmit}
                          onCancel={handleCancel}
                          onReassign={handleReassign}
                          onRevise={handleRevise}
                          onRecall={handleRecall}
                          onCover={handleCover}
                        />
                      ))}
                    </>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>No tasks assigned yet</Text>
                  )}
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className={styles.emptyList}>No allocations found</div>
          )}
        </div>
      )}

      <EditAllocationModal
        open={!!editTarget}
        allocation={editTarget}
        projectHandle={selectedProject.handle}
        onClose={() => setEditTarget(null)}
      />
      <ResourceMoveModal
        open={!!moveModal}
        mode={moveModal?.mode ?? 'reassign'}
        allocation={moveModal?.allocation ?? null}
        taskCount={moveModal?.taskCount ?? 0}
        projectHandle={selectedProject?.handle ?? ''}
        onClose={() => setMoveModal(null)}
      />
      <ReviseAllocationModal
        open={!!reviseTarget}
        allocation={reviseTarget}
        projectHandle={selectedProject?.handle ?? ''}
        onClose={() => setReviseTarget(null)}
      />
      <TemporaryCoverModal
        open={!!coverTarget}
        allocation={coverTarget}
        projectHandle={selectedProject?.handle ?? ''}
        onClose={() => setCoverTarget(null)}
      />
    </div>
  );
}
