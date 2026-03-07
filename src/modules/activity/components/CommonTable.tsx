import React, { useState, useRef, useEffect } from 'react';
import { Table, Input, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../styles/CommonTable.module.css';
import { useTranslation } from 'react-i18next';


interface DataRow {
  [key: string]: string | number;
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
  // const searchInput = useRef<Input | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);


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
          // ref={searchInput}
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
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes((value as string).toLowerCase())
        : false,
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  const {t} = useTranslation();


  const columns: ColumnsType<DataRow> = data?.length > 0
    ? Object.keys(data[0]).map((column) => ({
        title: t(column),
        dataIndex: column,
        key: column,
        ...getColumnSearchProps(column),
        sorter: (a, b) => {
          const aValue = a[column];
          const bValue = b[column];
        
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return aValue - bValue;
          }
        
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return aValue.localeCompare(bValue);
          }
        
          return 0; // If the values are neither numbers nor strings, they are considered equal
        },
        
        sortDirections: ['ascend', 'descend'],
      }))
    : [];

  return (
    <Table
      className={styles.table}
      dataSource={data}
      columns={columns}
      rowKey={(record) => record.id || JSON.stringify(record)} // A unique key to identify each row, you may use a specific field or combination of fields
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        className: record === selectedRow ? styles.selectedRow : '',
        style: { fontSize: '13.5px' }
      })}
      // pagination={{ pageSize: 8 }} // Configuring pagination with 10 rows per page
      pagination={false}
      scroll={{ y: 'calc(100vh - 225px)' }}
       size="small"
    />
  );
};

export default CommonTable;
