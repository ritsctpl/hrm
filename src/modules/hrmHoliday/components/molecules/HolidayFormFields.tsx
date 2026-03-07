'use client';

import { Form, Input, DatePicker, Select, Checkbox, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { holidayFormRules, groupFormRules as _ } from '../../utils/validations';
import { CATEGORY_OPTIONS, VISIBILITY_OPTIONS } from '../../utils/constants';

interface HolidayFormFieldsProps {
  form: FormInstance;
  groupYear: number;
  isCompensatory: boolean;
  isLocal: boolean;
  onCategoryChange: (value: string) => void;
}

export default function HolidayFormFields({
  form: _form,
  groupYear: _groupYear,
  isCompensatory,
  isLocal,
  onCategoryChange,
}: HolidayFormFieldsProps) {
  return (
    <>
      <Form.Item label="Holiday Name" name="name" rules={holidayFormRules.name}>
        <Input placeholder="e.g. Independence Day" maxLength={120} />
      </Form.Item>

      <Form.Item label="Date" name="date" rules={holidayFormRules.date}>
        <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
      </Form.Item>

      <Form.Item label="Category" name="category" rules={holidayFormRules.category}>
        <Select
          options={CATEGORY_OPTIONS}
          placeholder="Select category"
          onChange={onCategoryChange}
        />
      </Form.Item>

      <Form.Item label="Reason" name="reason" rules={holidayFormRules.reason}>
        <Input placeholder="Optional reason" maxLength={256} />
      </Form.Item>

      {isLocal && (
        <Form.Item
          label="Location Scope"
          name="locationScope"
          rules={holidayFormRules.locationScope}
        >
          <Input placeholder="e.g. Maharashtra" />
        </Form.Item>
      )}

      <Form.Item name="compensatory" valuePropName="checked">
        <Checkbox>Compensatory Holiday</Checkbox>
      </Form.Item>

      {isCompensatory && (
        <>
          <Form.Item
            label="Window Start"
            name="compWindowStart"
            rules={holidayFormRules.compWindow}
          >
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>
          <Form.Item
            label="Window End"
            name="compWindowEnd"
            rules={holidayFormRules.compWindow}
          >
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>
        </>
      )}

      <Form.Item name="optional" valuePropName="checked">
        <Checkbox>Optional Holiday</Checkbox>
      </Form.Item>

      <Form.Item label="Visibility" name="visibility">
        <Select options={VISIBILITY_OPTIONS} defaultValue="PUBLIC" />
      </Form.Item>

      <Form.Item label="Notes" name="notes" rules={holidayFormRules.notes}>
        <Input.TextArea rows={2} maxLength={500} placeholder="Additional notes..." />
      </Form.Item>

      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        Day of week will be calculated automatically from date.
      </Typography.Text>
    </>
  );
}
