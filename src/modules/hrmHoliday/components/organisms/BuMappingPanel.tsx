'use client';

import { useState } from 'react';
import { Drawer, Button, Select, Checkbox, Divider, Space, message, Typography, Spin } from 'antd';
import { parseCookies } from 'nookies';
import BuMappingRow from '../molecules/BuMappingRow';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import { useHrmHolidayStore } from '../../stores/hrmHolidayStore';
import type { BuMappingPanelProps } from '../../types/ui.types';
import styles from '../../styles/HolidayForm.module.css';

export default function BuMappingPanel({
  open,
  groupHandle,
  mappings,
  onClose,
  onMappingChanged,
}: BuMappingPanelProps) {
  const [buHandle, setBuHandle] = useState<string | undefined>();
  const [deptHandle, setDeptHandle] = useState<string | undefined>();
  const [primaryFlag, setPrimaryFlag] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const { addMapping, removeMapping } = useHrmHolidayStore();

  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const userId = cookies.userId ?? '';

  const handleAdd = async () => {
    if (!buHandle) {
      message.warning('Please select a Business Unit');
      return;
    }
    setAdding(true);
    try {
      const res = await HrmHolidayService.addMapping({
        site,
        groupHandle,
        buHandle,
        deptHandle,
        primaryFlag,
        mappedBy: userId,
      });
      if (res.success) {
        addMapping({
          ...res.data,
          buHandle: buHandle,
          buName: res.data.buName ?? buHandle,
          primaryFlag,
          mappedAt: res.data.mappedAt ?? new Date().toISOString(),
          mappedBy: userId,
        });
        setBuHandle(undefined);
        setDeptHandle(undefined);
        setPrimaryFlag(false);
        message.success('Mapping added');
        onMappingChanged();
      } else {
        message.error(res.message || 'Failed to add mapping');
      }
    } catch {
      message.error('Failed to add mapping');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (mappingHandle: string) => {
    setRemoving(mappingHandle);
    try {
      const res = await HrmHolidayService.removeMapping({
        site,
        groupHandle,
        mappingHandle,
        removedBy: userId,
      });
      if (res.success) {
        removeMapping(mappingHandle);
        message.success('Mapping removed');
        onMappingChanged();
      } else {
        message.error(res.message || 'Failed to remove mapping');
      }
    } catch {
      message.error('Failed to remove mapping');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Manage BU / Dept Mappings"
      width={520}
      destroyOnClose
      footer={
        <div className={styles.drawerFooter}>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <Typography.Text strong>Add New Mapping</Typography.Text>
      <div style={{ marginTop: 12 }}>
        <Select
          placeholder="Select Business Unit..."
          value={buHandle}
          onChange={setBuHandle}
          style={{ width: '100%', marginBottom: 8 }}
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
        <Select
          placeholder="Select Department (optional)..."
          value={deptHandle}
          onChange={setDeptHandle}
          allowClear
          style={{ width: '100%', marginBottom: 8 }}
        />
        <Checkbox
          checked={primaryFlag}
          onChange={(e) => setPrimaryFlag(e.target.checked)}
          style={{ marginBottom: 12 }}
        >
          Set as Primary
        </Checkbox>
        <div>
          <Button type="primary" onClick={handleAdd} loading={adding} block>
            Add Mapping
          </Button>
        </div>
      </div>

      <Divider />

      <Typography.Text strong>Current Mappings ({mappings.length})</Typography.Text>
      <div style={{ marginTop: 8 }}>
        {mappings.length === 0 && (
          <Typography.Text type="secondary">No mappings yet.</Typography.Text>
        )}
        {mappings.map((m) => (
          <Spin key={m.handle} spinning={removing === m.handle} size="small">
            <BuMappingRow mapping={m} onRemove={handleRemove} canRemove />
          </Spin>
        ))}
      </div>
    </Drawer>
  );
}
