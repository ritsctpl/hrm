import React, { useContext, useState, useEffect } from 'react';
import { Table, Button, Input, Space, DatePicker, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserContext } from '../hooks/userContext';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface SupervisionTracking {
  key?: number;
  current: number;
  validFrom: string;
  validTo: string;
  supervisedCcs: string;
}

const SupervisionTracking: React.FC = () => {
  const { formData, setFormData, setIsAletered } = useContext(UserContext);
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState<SupervisionTracking[]>(() =>
    (formData.supervisor || []).map((item, index) => ({
      key: index + 1,
      ...item,
    }))
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    if (formData.supervisor) {
      const updatedDataSource = formData.supervisor.map((item, index) => ({
        key: index + 1,
        ...item,
      }));
      setDataSource(updatedDataSource);
    }
  }, [formData.supervisor]);

  const handleAdd = () => {
    setIsAletered(true);
    const newKey = dataSource.length ? Math.max(...dataSource.map((item) => item.key)) + 1 : 1;
    const newData = [
      ...dataSource,
      { key: newKey, current: dataSource.length + 1, validFrom: '', validTo: '', supervisedCcs: '' },
    ];
    setDataSource(newData.map((item, index) => ({
      ...item,
      current: index + 1,
    })));
    setFormData((prevFormData) => ({
      ...prevFormData,
      supervisor: newData.map((item, index) => ({
        ...item,
        current: index + 1,
      })),
    }));
  };

  const handleDeleteAll = () => {
    setIsAletered(true);
    setDataSource([]);
    setSelectedRowKeys([]);
    setFormData((prevFormData) => ({
      ...prevFormData,
      supervisor: [],
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
      supervisor: updatedDataSource,
    }));
  };

  const  debounceHandleChange = debounce((newValue: any, key: number, field: keyof SupervisionTracking) => {
    setIsAletered(true);
    const updatedDataSource = dataSource.map((item) =>
      item.key === key ? { ...item, [field]: newValue } : item
    );

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
      supervisor: updatedDataSource,
    }));
  }); 

  const handleDateChange = (date: dayjs.Dayjs | null, key: number, field: keyof SupervisionTracking) => {
    setIsAletered(true);
    if (date) {
      debounceHandleChange(date.format('YYYY-MM-DD HH:mm:ss'), key, field);
    } else {
      debounceHandleChange('', key, field);
    }
  };

  const columns: ColumnsType<SupervisionTracking> = [
    {
      title: 'Current',
      dataIndex: 'current',
      render: (_, record) => (
        <Input
          type='number'
          value={record.current}
          onChange={(e) => debounceHandleChange(e.target.value, record.key, 'current')}
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
      title: 'Supervised CCS',
      dataIndex: 'supervisedCcs',
      render: (_, record) => (
        <Input
          value={record.supervisedCcs}
          onChange={(e) => debounceHandleChange(e.target.value, record.key, 'supervisedCcs')}
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

export default SupervisionTracking;
