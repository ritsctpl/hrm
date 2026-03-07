'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  Drawer,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
} from 'antd';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import styles from '../styles/HrmShared.module.css';

const { RangePicker } = DatePicker;

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'dateRange' | 'text' | 'multiSelect';
  options?: FilterOption[];
}

interface HrmFilterDrawerProps {
  filters: FilterConfig[];
  values: Record<string, unknown>;
  onApply: (values: Record<string, unknown>) => void;
  onReset: () => void;
  open: boolean;
  onClose: () => void;
}

/**
 * HrmFilterDrawer
 *
 * Side drawer that renders dynamic filter controls based on the
 * provided filter configuration. Supports text inputs, single select,
 * multi-select, and date range pickers.
 *
 * @param filters - Array of filter definitions
 * @param values  - Current filter values (keyed by filter key)
 * @param onApply - Called with the current form values on Apply
 * @param onReset - Called when Reset is clicked
 * @param open    - Controls drawer visibility
 * @param onClose - Called to close the drawer
 */
const HrmFilterDrawer: React.FC<HrmFilterDrawerProps> = ({
  filters,
  values,
  onApply,
  onReset,
  open,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [localValues, setLocalValues] = useState<Record<string, unknown>>(values);

  useEffect(() => {
    setLocalValues(values);
    form.setFieldsValue(values);
  }, [values, form]);

  const handleApply = useCallback(() => {
    const formValues = form.getFieldsValue();
    onApply(formValues);
    onClose();
  }, [form, onApply, onClose]);

  const handleReset = useCallback(() => {
    form.resetFields();
    setLocalValues({});
    onReset();
  }, [form, onReset]);

  const renderFilterControl = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'text':
        return <Input placeholder={`Enter ${filter.label.toLowerCase()}`} allowClear />;

      case 'select':
        return (
          <Select
            placeholder={`Select ${filter.label.toLowerCase()}`}
            options={filter.options}
            allowClear
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        );

      case 'multiSelect':
        return (
          <Select
            mode="multiple"
            placeholder={`Select ${filter.label.toLowerCase()}`}
            options={filter.options}
            allowClear
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        );

      case 'dateRange':
        return <RangePicker style={{ width: '100%' }} />;

      default:
        return <Input allowClear />;
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <FilterListOutlined style={{ fontSize: 18 }} />
          <span>Filters</span>
        </Space>
      }
      placement="right"
      width={360}
      open={open}
      onClose={onClose}
      footer={
        <div className={styles.filterDrawerFooter}>
          <Button onClick={handleReset}>Reset</Button>
          <Button type="primary" onClick={handleApply}>
            Apply
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={localValues}
      >
        {filters.map((filter) => (
          <Form.Item key={filter.key} name={filter.key} label={filter.label}>
            {renderFilterControl(filter)}
          </Form.Item>
        ))}
      </Form>
    </Drawer>
  );
};

export default HrmFilterDrawer;
