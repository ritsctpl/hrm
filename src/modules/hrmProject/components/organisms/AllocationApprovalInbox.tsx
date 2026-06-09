'use client';
import { useEffect, useMemo, useState } from 'react';
import { Table, Input, Radio, Button, Space, Tag, Modal, Spin, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { parseCookies } from 'nookies';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { formatDate } from '../../utils/projectHelpers';
import type { ResourceAllocation } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectDetail.module.css';

const { Text } = Typography;

export default function AllocationApprovalInbox() {
  const { pendingAllocations, loadingApprovals, approvingAllocation } = useHrmProjectStore();
  const { loadPendingAllocations } = useProjectData();
  const { approveAllocations } = useProjectMutations();
  const { employeeCode, isReady } = useEmployeeIdentity();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MEMBERSHIP' | 'TASK'>('ALL');
  const [rejectTarget, setRejectTarget] = useState<ResourceAllocation | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  useEffect(() => {
    loadPendingAllocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitted = useMemo(
    () => pendingAllocations.filter((a) => a.status === 'SUBMITTED'),
    [pendingAllocations],
  );

  // Task allocations that cascade when a membership (project-level) row is actioned
  const tasksOf = (a: ResourceAllocation) =>
    submitted.filter((x) => x.employeeId === a.employeeId && x.projectHandle === a.projectHandle && x.taskId).map((x) => x.handle);
  const handlesFor = (a: ResourceAllocation) => (a.taskId ? [a.handle] : [a.handle, ...tasksOf(a)]);

  const rows = useMemo(() => submitted.filter((a) => {
    if (typeFilter === 'MEMBERSHIP' && a.taskId) return false;
    if (typeFilter === 'TASK' && !a.taskId) return false;
    if (search && !a.employeeName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [submitted, typeFilter, search]);

  const resolveActor = () => {
    const cookies = parseCookies();
    const actor =
      employeeCode || cookies.employeeCode || cookies.employeeId || cookies.userId || cookies.user || cookies.rl_user_id || '';
    if (!actor) {
      message.error('Could not identify the signed-in user — please sign in again');
      return '';
    }
    if (actor.includes('@')) {
      console.warn('[AllocationApprovalInbox] sending email-shaped actor; backend may reject', { actor, isReady });
    }
    return actor;
  };

  const handleApprove = (a: ResourceAllocation) => {
    const actor = resolveActor();
    if (!actor) return;
    approveAllocations(handlesFor(a), 'APPROVED', '', actor);
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    const actor = resolveActor();
    if (!actor) return;
    approveAllocations(handlesFor(rejectTarget), 'REJECTED', rejectRemarks, actor);
    setRejectTarget(null);
    setRejectRemarks('');
  };

  const columns: ColumnsType<ResourceAllocation> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName', render: (n: string) => <Text strong>{n}</Text> },
    {
      title: 'Item', key: 'item',
      render: (_, a) => (a.taskName
        ? <Tag color="blue">{a.taskName}</Tag>
        : (
          <Space size={6}>
            <Tag>Membership</Tag>
            {tasksOf(a).length > 0 && <Text type="secondary" style={{ fontSize: 12 }}>+{tasksOf(a).length} task(s) auto-approve</Text>}
          </Space>
        )),
    },
    { title: 'Hours/Day', dataIndex: 'hoursPerDay', key: 'hoursPerDay', width: 90, align: 'right' },
    { title: 'Project', dataIndex: 'projectCode', key: 'projectCode', width: 160 },
    {
      title: 'Period', key: 'period', width: 200,
      render: (_, a) => <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(a.startDate)} – {formatDate(a.endDate)}</Text>,
    },
    {
      title: 'Actions', key: 'actions', width: 170, align: 'right',
      render: (_, a) => (
        <Can I="edit">
          <Space size={4}>
            <Button size="small" type="primary" onClick={() => handleApprove(a)} loading={approvingAllocation}>Approve</Button>
            <Button size="small" danger onClick={() => setRejectTarget(a)}>Reject</Button>
          </Space>
        </Can>
      ),
    },
  ];

  return (
    <div className={styles.approvalInbox}>
      {loadingApprovals ? (
        <Spin />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <Radio.Group value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} optionType="button" size="small">
              <Radio.Button value="ALL">All ({submitted.length})</Radio.Button>
              <Radio.Button value="MEMBERSHIP">Membership</Radio.Button>
              <Radio.Button value="TASK">Tasks</Radio.Button>
            </Radio.Group>
            <Input.Search placeholder="Search by employee" allowClear value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          </div>

          <Table<ResourceAllocation>
            rowKey="handle"
            size="middle"
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            locale={{ emptyText: 'No pending allocations' }}
          />
        </>
      )}

      <Modal
        title="Reject allocation"
        open={!!rejectTarget}
        onCancel={() => { setRejectTarget(null); setRejectRemarks(''); }}
        onOk={confirmReject}
        okText="Reject"
        okButtonProps={{ danger: true, disabled: !rejectRemarks.trim(), loading: approvingAllocation }}
        destroyOnHidden
      >
        {rejectTarget && !rejectTarget.taskId && tasksOf(rejectTarget).length > 0 && (
          <Text type="secondary">This will also reject {tasksOf(rejectTarget).length} task allocation(s) for {rejectTarget.employeeName}.</Text>
        )}
        <Input.TextArea
          rows={3}
          style={{ marginTop: 8 }}
          placeholder="Reason for rejection (required)"
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
        />
      </Modal>
    </div>
  );
}
