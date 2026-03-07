import React, { useContext, useState, useEffect } from 'react';
import { Table, Button, Input, Space, DatePicker, Select, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserContext } from '../hooks/userContext';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface LabourTracking {
  key?: number;
  current: number;
  validFrom: string;
  validTo: string;
  userType: string;
  primaryShift: string;
  secondaryShift: string;
  costCenter: string;
  defaultLCC: string;
  department: string;
  details: string;
}

const LabourTracking: React.FC = () => {
  const { formData, setFormData, setIsAletered } = useContext(UserContext);
  const { t } = useTranslation();

  const [dataSource, setDataSource] = useState<LabourTracking[]>(() =>
    (formData.labourTracking || []).map((item, index) => ({
      key: index + 1,
      ...item,
    }))
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    if (formData.labourTracking) {
      const updatedDataSource = formData.labourTracking.map((item, index) => ({
        key: index + 1,
        ...item,
      }));
      setDataSource(updatedDataSource);
    }
  }, [formData.labourTracking]);

  useEffect(() => {
    const updatedDataSource = dataSource.map((item, index) => ({
      ...item,
      key: index + 1,
    }));
    setDataSource(updatedDataSource);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourTracking: updatedDataSource,
    }));
  }, [dataSource.length]);

  const handleAdd = () => {
    setIsAletered(true);
    const newKey = dataSource.length ? Math.max(...dataSource.map((item) => item.key)) + 1 : 1;
    const newData = [
      ...dataSource,
      { key: newKey, current: dataSource.length + 1, validFrom: '', validTo: '', userType: '', primaryShift: '', secondaryShift: '', costCenter: '', defaultLCC: '', department: '', details: '' },
    ];
    const updatedDataSource = newData.map((item, index) => ({
      ...item,
      current: index + 1,
    }));
    setDataSource(updatedDataSource);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourTracking: updatedDataSource,
    }));
  };

  const handleDeleteAll = () => {
    setIsAletered(true);
    setDataSource([]);
    setSelectedRowKeys([]);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourTracking: [],
    }));
  };

  const handleRemoveSelected = () => {
    setIsAletered(true);
    const newDataSource = dataSource.filter((item) => !selectedRowKeys.includes(item.key));
    const updatedDataSource = newDataSource.map((item, index) => ({
      ...item,
      current: index + 1,
    }));
    setDataSource(updatedDataSource);
    setSelectedRowKeys([]);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourTracking: updatedDataSource,
    }));
  };

  const debounceHandleChange = debounce((newValue: any, key: number, field: keyof LabourTracking) => {
    setIsAletered(true);
    const updatedDataSource = dataSource.map((item) =>
      item.key === key ? { ...item, [field]: newValue } : item
    );

    // Validate date fields if they are updated
    if (field === 'validFrom' || field === 'validTo') {
      const updatedItem = updatedDataSource.find(item => item.key === key);
      if (updatedItem && updatedItem.validFrom && updatedItem.validTo) {
        const validFrom = dayjs(updatedItem.validFrom);
        const validTo = dayjs(updatedItem.validTo);

        if (validTo.isBefore(validFrom)) {
          message.error('The "Valid To" date must be after the "Valid From" date.');
          return; // Stop the update if validation fails
        }
      }
    }

    setDataSource(updatedDataSource);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourTracking: updatedDataSource,
    }));
  }); // Debounce time can be adjusted as needed

  const handleDateChange = (date: dayjs.Dayjs | null, key: number, field: keyof LabourTracking) => {
    setIsAletered(true);
    if (date) {
      debounceHandleChange(date.format('YYYY-MM-DD HH:mm:ss'), key, field);
    } else {
      debounceHandleChange('', key, field); // Handle case where date is cleared
    }
  };

  const handleUserTypeChange = (value: string, key: number) => {
    setIsAletered(true);
    debounceHandleChange(value, key, 'userType');
  };

  const handleShiftChange = (value: string, key: number, field: 'primaryShift' | 'secondaryShift') => {
    setIsAletered(true);
    // Check if the value matches the regex pattern
    if (/^[A-Z0-9_]*$/.test(value)) {
        debounceHandleChange(value, key, field);
    } else {
        // Handle cases where the value does not match the regex pattern
        console.warn('Invalid input:', value);
    }
};

  const columns: ColumnsType<LabourTracking> = [
    {
      title: 'Current',
      dataIndex: 'current',
      render: (_, record) => (
        <Input
          type="number"
          value={record.current}
          disabled 
        />
      ),
    },
    {
      title: 'Valid From',
      dataIndex: 'validFrom',
      render: (_, record) => (
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          value={record.validFrom ? dayjs(record.validFrom) : null}
          onChange={(date) => handleDateChange(date, record.key, 'validFrom')}
          required
        />
      ),
    },
    {
      title: 'Valid To',
      dataIndex: 'validTo',
      render: (_, record) => (
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          value={record.validTo ? dayjs(record.validTo) : null}
          onChange={(date) => handleDateChange(date, record.key, 'validTo')}
        />
      ),
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      render: (_, record) => (
        <Select
          value={record.userType}
          onChange={(value) => handleUserTypeChange(value, record.key)}
          placeholder="Select User Type"
          defaultValue='Exempt'
        >
          <Option value="Exempt">Exempt</Option>
          <Option value="Contract">Contract</Option>
          <Option value="Non-Exempt">Non-Exempt</Option>
          <Option value="Temp">Temp</Option>
        </Select>
      ),
    },
    {
      title: 'Primary Shift',
      dataIndex: 'primaryShift',
      render: (_, record) => (
        <Input
          value={record.primaryShift}
          onChange={(e) => handleShiftChange(e.target.value.toUpperCase(), record.key, 'primaryShift')}
        />
      ),
    },
    {
      title: 'Secondary Shift',
      dataIndex: 'secondaryShift',
      render: (_, record) => (
        <Input
          value={record.secondaryShift}
          onChange={(e) => handleShiftChange(e.target.value.toUpperCase(), record.key, 'secondaryShift')}
        />
      ),
    },
    {
      title: 'Cost Center',
      dataIndex: 'costCenter',
      render: (_, record) => (
        <Input
          value={record.costCenter}
          onChange={(e) => debounceHandleChange(e.target.value, record.key, 'costCenter')}
        />
      ),
    },
    {
      title: 'Default LCC',
      dataIndex: 'defaultLCC',
      render: (_, record) => (
        <Input
          value={record.defaultLCC}
          onChange={(e) => debounceHandleChange(e.target.value, record.key, 'defaultLCC')}
        />
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      render: (_, record) => (
        <Input
          value={record.department}
          onChange={(e) => debounceHandleChange(e.target.value, record.key, 'department')}
        />
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      render: (_, record) => (
        <Input
          value={record.details}
          onChange={(e) => debounceHandleChange(e.target.value, record.key, 'details')}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: number[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'end' }}>
      <Button onClick={handleAdd}>
          {t('insert')}
        </Button>
        <Button onClick={handleDeleteAll}>
        {t('removeAll')}
        </Button>
        <Button onClick={handleRemoveSelected}>
        {t('removeSelected')}
        </Button>
      </Space>
      <Table
        bordered
        rowSelection={rowSelection}
        dataSource={dataSource}
        columns={columns}
        rowKey="key"
        // pagination={{ pageSize: 5 }} 
        pagination={false}
        scroll={{ y: 'calc(100vh - 420px)' }}
      />
    </div>
  );
};

export default LabourTracking;
