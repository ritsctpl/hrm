'use client';

import React, { useState } from 'react';
import { Drawer, Form, Button, Space, message, Typography } from 'antd';
import { parseCookies } from 'nookies';
import dayjs from 'dayjs';
import HolidayFormFields from '../molecules/HolidayFormFields';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { HolidayFormPanelProps } from '../../types/ui.types';
import type { Holiday } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HolidayForm.module.css';

export default function HolidayFormPanel({
  open,
  groupHandle,
  groupYear,
  groupStatus,
  holiday,
  onClose,
  onSaved,
}: HolidayFormPanelProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [isCompensatory, setIsCompensatory] = useState(holiday?.compensatory ?? false);
  const [isLocal, setIsLocal] = useState(holiday?.category === 'LOCAL');
  const isEdit = !!holiday;

  const initialValues = holiday
    ? {
        name: holiday.name,
        date: dayjs(holiday.date),
        category: holiday.category,
        reason: holiday.reason,
        compensatory: holiday.compensatory,
        compWindowStart: holiday.compWindowStart ? dayjs(holiday.compWindowStart) : undefined,
        compWindowEnd: holiday.compWindowEnd ? dayjs(holiday.compWindowEnd) : undefined,
        locationScope: holiday.locationScope,
        optional: holiday.optional,
        visibility: holiday.visibility,
        notes: holiday.notes,
      }
    : { visibility: 'PUBLIC', compensatory: false, optional: false };

  // Reset form when holiday changes or drawer opens
  React.useEffect(() => {
    if (open) {
      form.resetFields();
      setIsCompensatory(holiday?.compensatory ?? false);
      setIsLocal(holiday?.category === 'LOCAL');
    }
  }, [open, holiday, form]);

  const handleSubmit = async () => {
    const cookies = parseCookies();
    const site = cookies.site ?? '';
    const userId = cookies.userId ?? '';

    try {
      const values = await form.validateFields();
      setSaving(true);

      const dateStr = values.date ? dayjs(values.date).format('YYYY-MM-DD') : '';

      if (isEdit && holiday) {
        const res = await HrmHolidayService.updateHoliday({
          site,
          handle: holiday.handle,
          name: values.name,
          date: dateStr,
          category: values.category,
          reason: values.reason,
          compensatory: values.compensatory,
          compWindowStart: values.compWindowStart
            ? dayjs(values.compWindowStart).format('YYYY-MM-DD')
            : undefined,
          compWindowEnd: values.compWindowEnd
            ? dayjs(values.compWindowEnd).format('YYYY-MM-DD')
            : undefined,
          locationScope: values.locationScope,
          optional: values.optional,
          visibility: values.visibility,
          notes: values.notes,
          modifiedBy: userId,
        });
        if (res && res.success) {
          message.success(res.message || 'Holiday updated successfully');
          const updated: Holiday = { ...holiday, ...values, date: dateStr };
          onSaved(updated);
        } else {
          message.error(res?.message || 'Failed to update holiday');
        }
      } else {
        const res = await HrmHolidayService.createHoliday({
          site,
          groupHandle,
          name: values.name,
          date: dateStr,
          category: values.category,
          reason: values.reason,
          compensatory: values.compensatory,
          compWindowStart: values.compWindowStart
            ? dayjs(values.compWindowStart).format('YYYY-MM-DD')
            : undefined,
          compWindowEnd: values.compWindowEnd
            ? dayjs(values.compWindowEnd).format('YYYY-MM-DD')
            : undefined,
          locationScope: values.locationScope,
          optional: values.optional,
          visibility: values.visibility,
          notes: values.notes,
          createdBy: userId,
        });
        if (res && res.success) {
          message.success(res.message || 'Holiday created successfully');
          const created: Holiday = {
            ...res.data,
            compensatory: res.data.compensatory ?? false,
            optional: res.data.optional ?? false,
          };
          onSaved(created);
        } else {
          message.error(res.message || 'Failed to create holiday');
        }
      }
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = 
        error?.response?.data?.message_details?.msg || 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to save holiday';
      message.error(errorMessage);
      console.error('Save holiday error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <Typography.Text strong>
          {isEdit ? 'Edit Holiday' : 'Add Holiday'}
        </Typography.Text>
      }
      width={480}
      destroyOnHidden
      footer={
        <div className={styles.drawerFooter}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Can I={isEdit ? 'edit' : 'add'}>
              <Button
                type="primary"
                loading={saving}
                onClick={handleSubmit}
                disabled={groupStatus === 'LOCKED'}
              >
                Save Holiday
              </Button>
            </Can>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={(changed) => {
          if ('compensatory' in changed) setIsCompensatory(changed.compensatory);
          if ('category' in changed) setIsLocal(changed.category === 'LOCAL');
        }}
      >
        <HolidayFormFields
          form={form}
          groupYear={groupYear}
          isCompensatory={isCompensatory}
          isLocal={isLocal}
          onCategoryChange={(val) => setIsLocal(val === 'LOCAL')}
        />
      </Form>
    </Drawer>
  );
}
