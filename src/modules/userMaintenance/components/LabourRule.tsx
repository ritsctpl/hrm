import React, { useContext, useState, useEffect } from 'react';
import { Table, Button, Input, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserContext } from '../hooks/userContext';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';

// Define the type for your data
interface LabourRule {
  key: number;
  labourRule: string;
  currentValue: number;
}

const LabourRuleTable: React.FC = () => {
  const { formData, setFormData, setIsAletered } = useContext(UserContext);
  const { t } = useTranslation();

  const [dataSource, setDataSource] = useState<LabourRule[]>(() =>
    (formData.labourRules || []).map((item, index) => ({
      key: index + 1,
      labourRule: item.labourRule,
      currentValue: item.currentValue,
    }))
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    if (formData.labourRules) {
      const updatedDataSource = formData.labourRules.map((item, index) => ({
        key: index + 1,
        labourRule: item.labourRule,
        currentValue: item.currentValue,
      }));
      setDataSource(updatedDataSource);
    }
  }, [formData.labourRules]);

  const handleAdd = () => {
    setIsAletered(true);
    const newKey = dataSource.length ? Math.max(...dataSource.map((item) => item.key)) + 1 : 1;
    const newData = [
      ...dataSource,
      { key: newKey, labourRule: '', currentValue: 0 },
    ];
    setDataSource(newData);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourRules: newData,
    }));
  };

  const handleDeleteAll = () => {
    setIsAletered(true);
    setDataSource([]);
    setSelectedRowKeys([]);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourRules: [],
    }));
  };

  const handleRemoveSelected = () => {
    setIsAletered(true);
    const newDataSource = dataSource.filter((item) => !selectedRowKeys.includes(item.key));
    setDataSource(newDataSource);
    setSelectedRowKeys([]);
    setFormData((prevFormData) => ({
      ...prevFormData,
      labourRules: newDataSource,
    }));
  };

  const debounceHandleChange = debounce((newValue: string | number, key: number, field: 'labourRule' | 'currentValue') => {
    setIsAletered(true);
    if (field === 'labourRule') {
      // Convert value to uppercase
      const uppercasedValue = (newValue as string).toUpperCase();

      // Check if the value contains only uppercase letters and underscores
      if (!/^[A-Z_]*$/.test(uppercasedValue)) {
        return;
      }

      if (dataSource.some((item) => item.labourRule === uppercasedValue && item.key !== key)) {
        return;
      }

      // Update dataSource with the valid value
      const updatedDataSource = dataSource.map((item) =>
        item.key === key ? { ...item, labourRule: uppercasedValue } : item
      );
      setDataSource(updatedDataSource);
      setFormData((prevFormData) => ({
        ...prevFormData,
        labourRules: updatedDataSource,
      }));
    } else {
      // Handle currentValue changes
      const updatedDataSource = dataSource.map((item) =>
        item.key === key ? { ...item, currentValue: newValue as number } : item
      );
      setDataSource(updatedDataSource);
      setFormData((prevFormData) => ({
        ...prevFormData,
        labourRules: updatedDataSource,
      }));
    }
  });

  const columns: ColumnsType<LabourRule> = [
    {
      title: (
        <span>
         <span style={{ color: 'red' }}>*</span>  {t('labourRule')}
        </span>
      ),
      dataIndex: 'labourRule',
      render: (_, record) => (
        <Input
          value={record.labourRule}
          onChange={(e) => debounceHandleChange(e.target.value, record.key, 'labourRule')}
        />
      ),
    },
    {
      title: 'Current Value',
      dataIndex: 'currentValue',
      render: (_, record) => (
        <Input
          type="number"
          value={record.currentValue}
          onChange={(e) => debounceHandleChange(Number(e.target.value), record.key, 'currentValue')}
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

export default LabourRuleTable;
