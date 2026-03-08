'use client';
import { useEffect } from 'react';
import { Button, Select, Space, Spin, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AllocationRow from '../molecules/AllocationRow';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { ALLOCATION_STATUS_OPTIONS } from '../../utils/projectConstants';
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

  return (
    <div className={styles.allocationsTab}>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={openAllocationForm}>
          Add Allocation
        </Button>
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
