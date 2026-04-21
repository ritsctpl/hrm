/**
 * TrainingCertTab - Training and certification entries with expiry alerts.
 * Supports Add / View / Edit / Delete (gated by employee_training RBAC).
 */

'use client';

import React, { useCallback, useState } from 'react';
import { Button, Empty, Form, Input, Modal, Popconfirm, Table, Tag, DatePicker, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import { useEmployeePermissions } from '../../hooks/useEmployeePermissions';
import { formatDate, isExpiringSoon, isExpired } from '../../utils/transformations';
import type { ProfileTabProps } from '../../types/ui.types';
import type { TrainingCert } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const resolveName = (t: TrainingCert) => t.trainingName || t.name || '';
const resolveProvider = (t: TrainingCert) => t.provider || t.issuer || '';
const resolveValidityFrom = (t: TrainingCert) => t.validityFrom || t.issueDate || '';
const resolveValidityTo = (t: TrainingCert) => t.validityTo || t.expiryDate;
const resolveCertUrl = (t: TrainingCert) => t.certificateDocUrl || t.certificateUrl;

const TrainingCertTab: React.FC<ProfileTabProps & { onRefresh: () => void }> = ({
  profile,
  onRefresh,
}) => {
  const { trainingCerts } = profile;
  const permissions = useEmployeePermissions();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<TrainingCert | null>(null);
  const [loading, setLoading] = useState(false);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const buildCertFromValues = (values: Record<string, unknown>): TrainingCert => ({
    trainingName: values.trainingName as string,
    provider: values.provider as string,
    validityFrom: values.validityFrom ? (values.validityFrom as dayjs.Dayjs).format('YYYY-MM-DD') : '',
    validityTo: values.validityTo ? (values.validityTo as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
    certificateDocUrl: (values.certificateDocUrl as string) || undefined,
  });

  const handleAdd = useCallback(async () => {
    try {
      const values = await addForm.validateFields();
      setLoading(true);
      const organizationId = getOrganizationId();
      const cookies = parseCookies();
      const modifiedBy = cookies.username || 'system';
      await HrmEmployeeService.addTraining(organizationId, profile.handle, buildCertFromValues(values), modifiedBy);
      message.success('Training / certification added');
      addForm.resetFields();
      setAddOpen(false);
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [addForm, profile.handle, onRefresh]);

  const handleView = (cert: TrainingCert) => {
    setSelected(cert);
    setViewOpen(true);
  };

  const handleEdit = (cert: TrainingCert) => {
    setSelected(cert);
    const vFrom = resolveValidityFrom(cert);
    const vTo = resolveValidityTo(cert);
    editForm.setFieldsValue({
      trainingName: resolveName(cert),
      provider: resolveProvider(cert),
      validityFrom: vFrom ? dayjs(vFrom) : undefined,
      validityTo: vTo ? dayjs(vTo) : undefined,
      certificateDocUrl: resolveCertUrl(cert),
    });
    setEditOpen(true);
  };

  const handleEditSave = useCallback(async () => {
    if (!selected) return;
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      const organizationId = getOrganizationId();
      const cookies = parseCookies();
      const modifiedBy = cookies.username || 'system';
      const updated = buildCertFromValues(values);
      if (selected.trainId) {
        await HrmEmployeeService.updateTraining(organizationId, profile.handle, updated, selected.trainId, modifiedBy);
      } else {
        await HrmEmployeeService.addTraining(organizationId, profile.handle, updated, modifiedBy);
      }
      message.success('Training / certification updated');
      editForm.resetFields();
      setEditOpen(false);
      setSelected(null);
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [editForm, profile.handle, onRefresh, selected]);

  const handleDelete = useCallback(async (cert: TrainingCert) => {
    try {
      if (!cert.trainId) {
        message.error('Cannot delete: training ID not found');
        return;
      }
      setLoading(true);
      const organizationId = getOrganizationId();
      const cookies = parseCookies();
      const modifiedBy = cookies.username || 'system';
      await HrmEmployeeService.removeTraining(organizationId, profile.handle, cert.trainId, modifiedBy);
      message.success('Training / certification deleted');
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile.handle, onRefresh]);

  const columns: ColumnsType<TrainingCert> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, row) => <span style={{ fontWeight: 500 }}>{resolveName(row)}</span>,
      ellipsis: true,
    },
    {
      title: 'Provider',
      key: 'provider',
      render: (_, row) => resolveProvider(row) || '--',
      ellipsis: true,
    },
    {
      title: 'Valid From',
      key: 'validityFrom',
      render: (_, row) => formatDate(resolveValidityFrom(row)),
      width: 130,
    },
    {
      title: 'Valid To',
      key: 'validityTo',
      width: 180,
      render: (_, row) => {
        const d = resolveValidityTo(row);
        if (!d) return '--';
        const expired = isExpired(d);
        const expiring = isExpiringSoon(d);
        return (
          <span>
            {formatDate(d)}{' '}
            {expired && <Tag color="red" style={{ fontSize: 10, marginLeft: 4 }}>Expired</Tag>}
            {expiring && <Tag color="orange" style={{ fontSize: 10, marginLeft: 4 }}>Expiring Soon</Tag>}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(row)}
          />
          {permissions.canEditTraining && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(row)}
            />
          )}
          {permissions.canDeleteTraining && (
            <Popconfirm
              title="Delete entry"
              description="Are you sure you want to delete this training / certification?"
              onConfirm={() => handleDelete(row)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={loading}
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        {permissions.canAddTraining && (
          <Button
            type="primary"
            size="small"
            onClick={() => setAddOpen(true)}
          >
            Add Training / Certification
          </Button>
        )}
      </div>

      {trainingCerts.length === 0 ? (
        <Empty description="No training or certifications recorded" />
      ) : (
        <Table<TrainingCert>
          columns={columns}
          dataSource={trainingCerts}
          rowKey={(row, idx) => row.trainId || String(idx)}
          size="small"
          pagination={false}
          tableLayout="fixed"
          scroll={{ x: 800 }}
        />
      )}

      <Modal
        title="Add Training / Certification"
        open={addOpen}
        onOk={handleAdd}
        onCancel={() => {
          setAddOpen(false);
          addForm.resetFields();
        }}
        confirmLoading={loading}
        okText="Add"
        destroyOnHidden
      >
        <Form form={addForm} layout="vertical" style={{ padding: '8px 0' }}>
          <Form.Item
            name="trainingName"
            label="Training / Certification Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., AWS Certified Solutions Architect" />
          </Form.Item>
          <Form.Item
            name="provider"
            label="Provider / Issuer"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Amazon Web Services" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="validityFrom"
              label="Valid From"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="validityTo" label="Valid To" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <Form.Item name="certificateDocUrl" label="Certificate URL">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Training / Certification"
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Name</label>
              <div style={{ fontSize: 14, marginTop: 4 }}>{resolveName(selected)}</div>
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Provider</label>
              <div style={{ fontSize: 14, marginTop: 4 }}>{resolveProvider(selected) || '--'}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Valid From</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{formatDate(resolveValidityFrom(selected))}</div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Valid To</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{formatDate(resolveValidityTo(selected)) || '--'}</div>
              </div>
            </div>
            {resolveCertUrl(selected) && (
              <div>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Certificate</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  <a href={resolveCertUrl(selected)} target="_blank" rel="noopener noreferrer">
                    {resolveCertUrl(selected)}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Edit Training / Certification"
        open={editOpen}
        onOk={handleEditSave}
        onCancel={() => {
          setEditOpen(false);
          editForm.resetFields();
          setSelected(null);
        }}
        confirmLoading={loading}
        okText="Save"
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ padding: '8px 0' }}>
          <Form.Item
            name="trainingName"
            label="Training / Certification Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="provider"
            label="Provider / Issuer"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="validityFrom"
              label="Valid From"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="validityTo" label="Valid To" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <Form.Item name="certificateDocUrl" label="Certificate URL">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TrainingCertTab;
