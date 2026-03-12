'use client';

import React, { useEffect, useMemo } from 'react';
import { Table, Button, Input, Tag, Popconfirm, Select, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { MdDelete } from 'react-icons/md';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import styles from '../../styles/HrmOrganization.module.css';

const OrganizationListTemplate: React.FC = () => {
  const {
    companyList,
    fetchCompanyList,
    setCompanyListSearch,
    setCompanyListStatusFilter,
    navigateToDetail,
    deleteCompany,
  } = useHrmOrganizationStore();

  useEffect(() => {
    fetchCompanyList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteCompany = async (handle: string) => {
    try {
      await deleteCompany(handle);
      message.success('Company deleted successfully');
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete company';
      message.error(errorMsg);
    }
  };

  const filteredItems = useMemo(() => {
    let items = companyList.items;
    if (companyList.searchText) {
      const q = companyList.searchText.toLowerCase();
      items = items.filter(
        (c) =>
          c.legalName?.toLowerCase().includes(q) ||
          c.companyName?.toLowerCase().includes(q) ||
          (c.industryType || c.industry)?.toLowerCase().includes(q)
      );
    }
    if (companyList.statusFilter === 'active') {
      items = items.filter((c) => c.active === 1);
    } else if (companyList.statusFilter === 'inactive') {
      items = items.filter((c) => c.active !== 1);
    }
    return items;
  }, [companyList.items, companyList.searchText, companyList.statusFilter]);

  const columns = [
    {
      title: 'Legal Name',
      dataIndex: 'legalName',
      key: 'legalName',
      render: (text: string, record: typeof companyList.items[number]) => (
        <a onClick={() => navigateToDetail(record.handle)}>{text}</a>
      ),
    },
    // {
    //   title: 'Trade Name',
    //   dataIndex: 'tradeName',
    //   key: 'tradeName',
    // },
    {
      title: 'Industry',
      dataIndex: 'industryType',
      key: 'industryType',
    },
    {
      title: 'Email',
      dataIndex: 'officialEmail',
      key: 'officialEmail',
    },
    {
      title: 'Phone',
      dataIndex: 'officialPhone',
      key: 'officialPhone',
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active: number) => (
        <Tag color={active === 1 ? 'green' : 'red'}>
          {active === 1 ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: typeof companyList.items[number]) => (
        <div data-actions-column onClick={(e) => e.stopPropagation()}>
          <Popconfirm 
            title="Delete this company?" 
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteCompany(record.handle);
            }}
          >
            <Button 
              size="small" 
              danger 
              icon={<MdDelete />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.listViewContainer}>
      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeft}>
          <span className={styles.listTitle}>Companies ({filteredItems.length})</span>
          <Input
            placeholder="Search companies..."
            prefix={<SearchOutlined />}
            value={companyList.searchText}
            onChange={(e) => setCompanyListSearch(e.target.value)}
            style={{ width: 240 }}
            size="small"
            allowClear
          />
          <Select
            value={companyList.statusFilter}
            onChange={setCompanyListStatusFilter}
            size="small"
            style={{ width: 120 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
        <Button
          type="primary"
          size="small"
          // icon={<PlusOutlined />}
          onClick={() => navigateToDetail('new')}
        >
          New Company
        </Button>
      </div>
      <Table
        dataSource={filteredItems}
        columns={columns}
        rowKey="handle"
        loading={companyList.isLoading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: (e: React.MouseEvent) => {
            // Don't navigate if clicking on actions column
            const target = e.target as HTMLElement;
            if (target.closest('[data-actions-column]')) {
              return;
            }
            navigateToDetail(record.handle);
          },
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
};

export default OrganizationListTemplate;
