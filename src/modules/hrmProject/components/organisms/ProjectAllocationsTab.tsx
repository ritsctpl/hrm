'use client';
import { useEffect } from 'react';
import { Button, Select, Space, Spin, Popconfirm, Tooltip, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AllocationRow from '../molecules/AllocationRow';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { ALLOCATION_STATUS_OPTIONS } from '../../utils/projectConstants';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectDetail.module.css';

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

  const handleSubmit = (a: typeof projectAllocations[number]) => {
    if (selectedProject) submitAllocation(a.handle, selectedProject.handle);
  };

  const handleCancel = (a: typeof projectAllocations[number]) => {
    if (selectedProject) cancelAllocation(a.handle, selectedProject.handle);
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
              onClick={openAllocationForm}
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
          {filtered.map((a) => (
            <AllocationRow
              key={a.handle}
              allocation={a}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ))}
          {filtered.length === 0 && (
            <div className={styles.emptyList}>No allocations found</div>
          )}
        </div>
      )}
    </div>
  );
}
