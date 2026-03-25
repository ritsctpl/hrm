'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { parseCookies } from 'nookies';
import dayjs from 'dayjs';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { HolidayGroup } from '../../types/domain.types';
import type { HolidayResponse } from '../../types/api.types';

interface HolidayCreateModalProps {
  open: boolean;
  groups: HolidayGroup[];
  onClose: () => void;
  onCreated: () => void;
}

export default function HolidayCreateModal({ open, groups, onClose, onCreated }: HolidayCreateModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleOk = async () => {
    const cookies = parseCookies();
    const site = cookies.site ?? '';
    const userId = cookies.userId ?? '';

    try {
      const values = await form.validateFields();
      setSaving(true);
      
      const dateStr = values.date ? dayjs(values.date).format('YYYY-MM-DD') : '';
      const groupHandles = Array.isArray(values.groupHandle) ? values.groupHandle : [values.groupHandle];
      
      // Create holiday for each selected group
      const results = await Promise.allSettled(
        groupHandles.map(groupHandle =>
          HrmHolidayService.createHoliday({
            site,
            groupHandle,
            name: values.name,
            date: dateStr,
            category: values.category || 'NATIONAL',
            reason: values.description,
            createdBy: userId,
          })
        )
      );
      
      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      
      if (successes > 0) {
        if (failures === 0) {
          message.success(`Holiday created successfully in ${successes} group${successes > 1 ? 's' : ''}`);
        } else {
          message.warning(`Holiday created in ${successes} group${successes > 1 ? 's' : ''}, failed in ${failures}`);
        }
        form.resetFields();
        onCreated();
      } else {
        message.error('Failed to create holiday in all selected groups');
      }
    } catch (error) {
      message.error('Failed to create holiday');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create Holiday"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={saving}
      destroyOnClose
      okText="Create Holiday"
      width={500}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="Holiday Group"
          name="groupHandle"
          rules={[{ required: true, message: 'Please select at least one holiday group' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select holiday group(s)"
            options={groups.map(g => ({
              value: g.handle,
              label: `${g.groupName} (${g.year})`,
            }))}
            maxTagCount="responsive"
          />
        </Form.Item>
        
        <Form.Item
          label="Holiday Name"
          name="name"
          rules={[{ required: true, message: 'Holiday name is required' }]}
        >
          <Input placeholder="e.g. Republic Day" maxLength={120} />
        </Form.Item>
        
        <Form.Item
          label="Date"
          name="date"
          rules={[{ required: true, message: 'Date is required' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
        </Form.Item>
        
        <Form.Item
          label="Category"
          name="category"
          initialValue="NATIONAL"
        >
          <Select
            options={[
              { value: 'NATIONAL', label: 'National' },
              { value: 'FESTIVAL', label: 'Festival' },
              { value: 'LOCAL', label: 'Local' },
              { value: 'COMPENSATORY', label: 'Compensatory' },
            ]}
          />
        </Form.Item>
        
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={2} maxLength={512} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
