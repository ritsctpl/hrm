'use client';
import { useEffect, useMemo } from 'react';
import { Button, Select, Space, Spin, Tooltip, Alert, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AllocationRow from '../molecules/AllocationRow';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { ALLOCATION_STATUS_OPTIONS } from '../../utils/projectConstants';
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
  const { submitAllocation, cancelAllocation } = useProjectMutations();

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
            const totalTaskHours = g.tasks.reduce((s, t) => s + (t.hoursPerDay || 0), 0);
            return (
              <div key={g.employeeId} className={styles.memberGroup}>
                {g.membership ? (
                  <AllocationRow
                    allocation={g.membership}
                    hideHours
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    onAssignTask={handleAssignTask}
                  />
                ) : (
                  <div style={{ padding: '8px 0' }}><Text strong>{g.employeeName}</Text></div>
                )}

                <div className={styles.memberTasks}>
                  {g.tasks.length > 0 ? (
                    <>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {g.tasks.length} task{g.tasks.length > 1 ? 's' : ''} · {totalTaskHours}h/day total
                      </Text>
                      {g.tasks.map((t) => (
                        <AllocationRow
                          key={t.handle}
                          allocation={t}
                          hideEmployee
                          onSubmit={handleSubmit}
                          onCancel={handleCancel}
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
    </div>
  );
}
