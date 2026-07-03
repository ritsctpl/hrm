'use client';

import React, { useEffect, useState } from 'react';
import { Input, Button, List, Popconfirm, Space, Spin, Empty, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { EmployeeLookupService, type EmployeeLookup, type LookupType } from '../../services/employeeLookupService';

interface Props {
  lookupType: LookupType;
  /** Label used in the add box, e.g. "grade" or "designation". */
  noun: string;
  active: boolean; // only fetch when the tab is visible
}

/**
 * Add / remove admin-configurable values for one lookup type (Grade or Designation).
 * The list feeds the employee-form dropdowns via useEmployeeLookups.
 */
const LookupManager: React.FC<Props> = ({ lookupType, noun, active }) => {
  const [rows, setRows] = useState<EmployeeLookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoading(true);
    EmployeeLookupService.list(organizationId, lookupType)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (active) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, lookupType]);

  const handleAdd = async () => {
    const value = newValue.trim();
    if (!value) return;
    if (rows.some((r) => r.value.toLowerCase() === value.toLowerCase())) {
      message.warning(`"${value}" already exists`);
      return;
    }
    setSaving(true);
    try {
      const organizationId = getOrganizationId()!;
      const createdBy = parseCookies().userId ?? 'system';
      await EmployeeLookupService.save({ organizationId, lookupType, value, createdBy });
      message.success(`Added ${noun} "${value}"`);
      setNewValue('');
      load();
    } catch {
      message.error(`Failed to add ${noun}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: EmployeeLookup) => {
    try {
      await EmployeeLookupService.remove(getOrganizationId()!, row.handle);
      message.success(`Removed "${row.value}"`);
      load();
    } catch {
      message.error('Failed to remove');
    }
  };

  return (
    <div>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder={`Add a ${noun} (e.g. ${lookupType === 'GRADE' ? 'L8' : 'Solution Architect'})`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onPressEnter={handleAdd}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} loading={saving}>
          Add
        </Button>
      </Space.Compact>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : rows.length === 0 ? (
        <Empty description={`No ${noun} values configured yet`} />
      ) : (
        <List
          size="small"
          bordered
          dataSource={rows}
          rowKey="handle"
          renderItem={(row) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="del"
                  title={`Remove "${row.value}"?`}
                  description="Existing employees keep this value; it just won't be offered in the dropdown."
                  onConfirm={() => handleDelete(row)}
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              {row.value}
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default LookupManager;
