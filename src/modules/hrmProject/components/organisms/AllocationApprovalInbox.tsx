'use client';
import { useEffect, useMemo, useState } from 'react';
import { Table, Input, Radio, Button, Space, Tag, Modal, Spin, Typography, Divider, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { formatDate } from '../../utils/projectHelpers';
import type { ResourceAllocation } from '../../types/domain.types';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import DelegateApprovalModal from './DelegateApprovalModal';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectDetail.module.css';

const { Text } = Typography;

// Match the Reports smart-table: sticky header, body scrolls, no pagination.
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 300px)' };
const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

export default function AllocationApprovalInbox() {
  const { pendingAllocations, loadingApprovals, approvingAllocation } = useHrmProjectStore();
  const { loadPendingAllocations } = useProjectData();
  const { approveAllocations, reassignAllocation } = useProjectMutations();
  const { employeeCode, isReady } = useEmployeeIdentity();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MEMBERSHIP' | 'TASK'>('ALL');
  const [rejectTarget, setRejectTarget] = useState<ResourceAllocation | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  // Bulk selection (§9)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRemarks, setBulkRemarks] = useState('');
  // Reject-and-reassign (§10) — optional new owner when rejecting a single task allocation
  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [reassignToId, setReassignToId] = useState('');
  const [reassignToName, setReassignToName] = useState('');
  const [delegateOpen, setDelegateOpen] = useState(false);

  useEffect(() => {
    loadPendingAllocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 })
      .then((res) => setEmployees(res?.employees ?? []))
      .catch(() => {/* directory is optional here */});
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

  const closeReject = () => {
    setRejectTarget(null);
    setRejectRemarks('');
    setReassignToId('');
    setReassignToName('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const actor = resolveActor();
    if (!actor) return;
    await approveAllocations(handlesFor(rejectTarget), 'REJECTED', rejectRemarks, actor);
    // §10: optionally hand the work straight to another resource
    if (reassignToId && rejectTarget.taskId) {
      await reassignAllocation(
        rejectTarget.projectHandle,
        { allocationHandle: rejectTarget.handle, newEmployeeId: reassignToId, newEmployeeName: reassignToName, remarks: rejectRemarks },
        actor,
      );
    }
    closeReject();
  };

  // §9 — bulk approve / reject across the current selection (cascades membership → tasks)
  const selectedRows = useMemo(() => rows.filter((r) => selectedKeys.includes(r.handle)), [rows, selectedKeys]);
  const expandSelection = () => {
    const set = new Set<string>();
    selectedRows.forEach((a) => handlesFor(a).forEach((h) => set.add(h)));
    return Array.from(set);
  };
  const bulkApprove = async () => {
    const actor = resolveActor();
    if (!actor) return;
    await approveAllocations(expandSelection(), 'APPROVED', '', actor);
    setSelectedKeys([]);
  };
  const confirmBulkReject = async () => {
    const actor = resolveActor();
    if (!actor) return;
    await approveAllocations(expandSelection(), 'REJECTED', bulkRemarks, actor);
    setBulkRejectOpen(false);
    setBulkRemarks('');
    setSelectedKeys([]);
  };

  const columns: ColumnsType<ResourceAllocation> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName', render: (n: string) => <Text strong>{n}</Text> },
    {
      title: 'Item', key: 'item',
      filters: [{ text: 'Membership', value: 'MEMBERSHIP' }, { text: 'Task', value: 'TASK' }],
      onFilter: (v, a) => (a.taskId ? 'TASK' : 'MEMBERSHIP') === v,
      render: (_, a) => (a.taskName
        ? <Tag color="blue">{a.taskName}</Tag>
        : (
          <Space size={6}>
            <Tag>Membership</Tag>
            {tasksOf(a).length > 0 && <Text type="secondary" style={{ fontSize: 12 }}>+{tasksOf(a).length} task(s) auto-approve</Text>}
          </Space>
        )),
    },
    { title: 'Hours/Day', dataIndex: 'hoursPerDay', key: 'hoursPerDay', width: 90, align: 'right', sorter: (a, b) => (a.hoursPerDay || 0) - (b.hoursPerDay || 0) },
    {
      title: 'Project', dataIndex: 'projectCode', key: 'projectCode', width: 160,
      filters: uniq(submitted.map((a) => a.projectCode).filter(Boolean) as string[]).map((c) => ({ text: c, value: c })),
      onFilter: (v, a) => a.projectCode === v,
    },
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
            <Space>
              <Input.Search placeholder="Search by employee" allowClear value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
              <Can I="edit"><Button size="small" onClick={() => setDelegateOpen(true)}>Delegate approvals</Button></Can>
            </Space>
          </div>

          {selectedKeys.length > 0 && (
            <Can I="edit">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Text strong>{selectedKeys.length} selected</Text>
                <Button size="small" type="primary" loading={approvingAllocation} onClick={bulkApprove}>Approve selected</Button>
                <Button size="small" danger loading={approvingAllocation} onClick={() => setBulkRejectOpen(true)}>Reject selected</Button>
                <Button size="small" type="link" onClick={() => setSelectedKeys([])}>Clear</Button>
              </div>
            </Can>
          )}

          <Table<ResourceAllocation>
            rowKey="handle"
            size="middle"
            columns={columns}
            dataSource={rows}
            rowSelection={{ selectedRowKeys: selectedKeys, onChange: (keys) => setSelectedKeys(keys as string[]) }}
            pagination={false}
            scroll={TABLE_SCROLL}
            sticky
            locale={{ emptyText: 'No pending allocations' }}
          />
        </>
      )}

      <Modal
        title="Reject allocation"
        open={!!rejectTarget}
        onCancel={closeReject}
        onOk={confirmReject}
        okText={reassignToId ? 'Reject & reassign' : 'Reject'}
        okButtonProps={{ danger: !reassignToId, disabled: !rejectRemarks.trim(), loading: approvingAllocation }}
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
        {/* §10: a rejected task allocation can be handed straight to the right person */}
        {rejectTarget?.taskId && (
          <>
            <Divider style={{ margin: '12px 0 8px' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Reassign this task to (optional)</Text>
            <div style={{ marginTop: 6 }}>
              <HrmEmployeePicker
                value={reassignToId}
                options={employees
                  .filter((e) => e.employeeCode !== rejectTarget.employeeId)
                  .map((e) => ({ handle: e.employeeCode, name: e.fullName, employeeCode: e.employeeCode }))}
                onSelect={(emp) => { setReassignToId(emp.employeeCode); setReassignToName(emp.name); }}
              />
            </div>
          </>
        )}
      </Modal>

      <Modal
        title={`Reject ${selectedKeys.length} selected`}
        open={bulkRejectOpen}
        onCancel={() => { setBulkRejectOpen(false); setBulkRemarks(''); }}
        onOk={confirmBulkReject}
        okText="Reject selected"
        okButtonProps={{ danger: true, disabled: !bulkRemarks.trim(), loading: approvingAllocation }}
        destroyOnHidden
      >
        <Text type="secondary">Membership rejections also reject that member&apos;s task allocations.</Text>
        <Input.TextArea
          rows={3}
          style={{ marginTop: 8 }}
          placeholder="Reason for rejection (required)"
          value={bulkRemarks}
          onChange={(e) => setBulkRemarks(e.target.value)}
        />
      </Modal>

      <DelegateApprovalModal open={delegateOpen} onClose={() => setDelegateOpen(false)} />
    </div>
  );
}
