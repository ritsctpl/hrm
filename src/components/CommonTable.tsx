import React, { useState, useRef } from 'react';
import { Table, Input, Button, InputRef } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import styles from './CommonTable.module.css';
import { useTranslation } from 'react-i18next';

interface DataRow {
  [key: string]: string | number | boolean;
}

interface CommonTableProps {
  data: DataRow[];
  onRowSelect?: (row: DataRow) => void; // Callback function for row selection
}

const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}; 

const CommonTable: React.FC<CommonTableProps> = ({ data, onRowSelect }) => {
  
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const searchInput = useRef<InputRef | null>(null);
  const { t } = useTranslation();

  const handleRowClick = (row: DataRow) => {
    setSelectedRow(row);
    if (onRowSelect) {
      onRowSelect(row); // Call the callback with the selected row data
    }
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: any) => void,
    dataIndex: string
  ) => {
    confirm();
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
  };

  const getColumnSearchProps = (dataIndex: string): ColumnsType<DataRow>[number] => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${capitalizeFirstLetter(dataIndex)}`}
          value={selectedKeys[0] as string}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters!)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      if (typeof recordValue === 'boolean') {
        return recordValue.toString().toLowerCase() === (value as string).toLowerCase();
      }
      return recordValue
        ? recordValue.toString().toLowerCase().includes((value as string).toLowerCase())
        : false;
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  const columns: ColumnsType<DataRow> = data?.length > 0
    ? Object.keys(data[0]).map((column) => ({
        title: t(column),
        dataIndex: column,
        ellipsis: true,
        key: column,
        ...getColumnSearchProps(column),
        render: (text: string | number | boolean) => {
          if (text === null || text === '') {
            return '--'; // Show '--' for null or empty values
          }
          if (typeof text === 'boolean') {
            return text.toString(); // Directly convert boolean values to 'true' or 'false'
          }
          return text;
        },
        sorter: (a, b) => {
          const aValue = a[column];
          const bValue = b[column];

          if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
            return aValue === bValue ? 0 : (aValue ? 1 : -1);
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return aValue - bValue;
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return aValue.localeCompare(bValue);
          }

          return 0;
        },
        sortDirections: ['ascend', 'descend'],
      }))
    : [];

  return (
    <Table
      className={styles.table}
      size='small'
      dataSource={data}
      columns={columns || []}
      rowKey={(record: any) => record.id || JSON.stringify(record)} 
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        className: record === selectedRow ? styles.selectedRow : '',
        style:{
          fontSize: '13.5px', 
        },
      })}
      pagination={false}
      scroll={{ y: 'calc(100vh - 230px)' }}
    />
  );
};

export default CommonTable;
