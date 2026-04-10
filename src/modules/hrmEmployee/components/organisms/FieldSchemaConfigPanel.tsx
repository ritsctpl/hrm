'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Select, Table, Switch, Button, Spin, Empty, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import Can from '../../../hrmAccess/components/Can';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  required: boolean;
  sensitive: boolean;
  pii: boolean;
  mask: string | null;
  visible: boolean;
}

interface GroupSchema {
  groupKey: string;
  groupName: string;
  order: number;
  visible: boolean;
  visibleToRoles: string[];
  fields: FieldSchema[];
}

const GROUP_OPTIONS = [
  { label: 'Basic Details', value: 'basic' },
  { label: 'Official Details', value: 'official' },
  { label: 'Personal Details', value: 'personal' },
  { label: 'Contact Details', value: 'contact' },
  { label: 'Skills', value: 'skills' },
  { label: 'Job History', value: 'jobHistory' },
  { label: 'Experience', value: 'experience' },
  { label: 'Education', value: 'education' },
  { label: 'Training', value: 'training' },
  { label: 'Documents', value: 'documents' },
  { label: 'Assets', value: 'assets' },
  { label: 'Remuneration', value: 'remuneration' },
  { label: 'Leave Summary', value: 'leaveSummary' },
];

const FieldSchemaConfigPanel: React.FC<Props> = ({ open, onClose }) => {
  const [schemas, setSchemas] = useState<GroupSchema[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const cookies = parseCookies();
    const site = cookies.site;
    if (site) {
      HrmEmployeeService.fetchFieldSchemas(site)
        .then((data) => setSchemas(data as GroupSchema[]))
        .catch(() => {
          // No schema config available, use defaults
          setSchemas([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const currentGroup = schemas.find((s) => s.groupKey === selectedGroup);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cookies = parseCookies();
      await HrmEmployeeService.saveFieldSchema(cookies.site, currentGroup);
      message.success('Schema saved');
    } catch {
      message.error('Failed to save schema');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<FieldSchema> = [
    { title: 'Key', dataIndex: 'key', width: 140 },
    { title: 'Label', dataIndex: 'label' },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 90,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Required',
      dataIndex: 'required',
      width: 80,
      align: 'center',
      render: (v: boolean) => <Switch size="small" checked={v} />,
    },
    {
      title: 'Sensitive',
      dataIndex: 'sensitive',
      width: 80,
      align: 'center',
      render: (v: boolean) => <Switch size="small" checked={v} />,
    },
    {
      title: 'PII',
      dataIndex: 'pii',
      width: 60,
      align: 'center',
      render: (v: boolean) => <Switch size="small" checked={v} />,
    },
    {
      title: 'Mask',
      dataIndex: 'mask',
      width: 90,
      render: (v: string | null) => v ?? '--',
    },
  ];

  return (
    <Drawer
      title="Field Schema Configuration"
      open={open}
      onClose={onClose}
      width={800}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Group:</span>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={GROUP_OPTIONS}
              style={{ width: 220 }}
            />
            <Can I="edit">
              <Button type="primary" onClick={handleSave} loading={saving} style={{ marginLeft: 'auto' }}>
                Save Schema
              </Button>
            </Can>
          </div>

          {currentGroup ? (
            <Table
              dataSource={currentGroup.fields}
              columns={columns}
              rowKey="key"
              size="small"
              pagination={false}
            />
          ) : (
            <Empty description={`No schema configuration found for "${selectedGroup}". The system uses default field settings.`} />
          )}
        </>
      )}
    </Drawer>
  );
};

export default FieldSchemaConfigPanel;
