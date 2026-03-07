import React from 'react';
import { Table, Input } from 'antd';
import { ColumnType, TableRowSelection, Key, RowSelectMethod } from 'antd/es/table/interface';
import styles from './CommonTable.module.css';

interface DynamicTableProps<T> {
  dataSource: T[];
  columns: Array<ColumnType<T>>;
  rowSelection: TableRowSelection<T>;
  onRowSelect: (id: string, value: string | null) => void;
  uiConfig: {
    multiSelect: boolean;
    pagination?: false | { current: number; pageSize: number; total: number };
  };
}

const DynamicTable = <T extends { id: string }>({
  dataSource,
  columns,
  rowSelection,
  onRowSelect,
  uiConfig
}: DynamicTableProps<T>) => {

  const handleRowClick = (record: T) => {
    const { selectedRowKeys = [], onChange } = rowSelection;
    const isSelected = selectedRowKeys.includes(record.id);
  
    // Define info with a proper type assertion
    const info: { type: 'checkbox' | 'radio' } = {
      type: uiConfig.multiSelect ? 'checkbox' : 'radio'
    };
  
    let newSelectedRowKeys: Key[] = [];
    let newSelectedRows: T[] = [];
  
    if (uiConfig.multiSelect) {
      // Multi-select logic
      if (!isSelected) {
        newSelectedRowKeys = [...selectedRowKeys, record.id];
        newSelectedRows = dataSource.filter(row => newSelectedRowKeys.includes(row.id));
      } else {
        // If already selected, keep current selection
        newSelectedRowKeys = selectedRowKeys;
        newSelectedRows = dataSource.filter(row => selectedRowKeys.includes(row.id));
      }
    } else {
      if (!isSelected) {
        newSelectedRowKeys = [record.id];
        newSelectedRows = [record];
      } else {
        // If already selected, keep current selection
        newSelectedRowKeys = selectedRowKeys;
        newSelectedRows = dataSource.filter(row => selectedRowKeys.includes(row.id));
      }
    }
  
    // Call onChange to update row selection state
    if (onChange) {
      onChange(newSelectedRowKeys, newSelectedRows, info as unknown as { type: RowSelectMethod });
    }
  
    // Update selection and call onRowSelect
    const nextKey = Object.keys(record).find(key => key !== 'id') as keyof T;
    if (uiConfig.multiSelect && nextKey) {
      const newValues = newSelectedRows.map(row => row[nextKey] as unknown as string || '');
      onRowSelect(record.id, newValues.join(', '));
    } else if (!uiConfig.multiSelect) {
      // onRowSelect(newSelectedRowKeys[0] || '', newSelectedRows.length > 0 ? (newSelectedRows[0] as unknown as string) : null);
    }
  };
  

  const enhancedColumns = columns.reduce<Array<ColumnType<T>>>((acc, col) => {
    if (col.dataIndex === 'sequence') {
        // Add the 'sequence' column first
        acc.unshift(col); // Add 'sequence' as the first column
    } else if (col.dataIndex === 'id') {
        acc.push(col); // Keep the 'id' column

        // Find the next column to use for 'Value'
        const nextKey = columns.find(column => column.dataIndex !== 'id')?.dataIndex;

        if (nextKey) {
            acc.push({
                title: 'Value',
                dataIndex: nextKey,
                render: (text: any, record: T) => (
                    <Input
                        defaultValue={record[nextKey as keyof T] as string}
                        onChange={(e) => onRowSelect(record.id, e.target.value)}
                    />
                ),
            });
        }
    } else {
        acc.push(col); // Keep other columns as they are
    }
    return acc;
  }, []);
  return (
    <Table
      className={styles.tableContain}
      columns={enhancedColumns}
      dataSource={dataSource}
      rowSelection={{ type: uiConfig.multiSelect ? 'checkbox' : 'radio', ...rowSelection }}
      rowKey={(record: T) => record.id}
      // pagination={uiConfig.pagination}
      pagination={false}
      scroll={{ y: 'calc(100vh - 400px)' }}
      onRow={(record: T) => ({
        onDoubleClick: () => handleRowClick(record),
      })}
    />
  );
};

export default DynamicTable;
