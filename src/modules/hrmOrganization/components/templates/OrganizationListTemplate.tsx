'use client';

import React, { useEffect, useMemo } from 'react';
import { Button, Input, Popconfirm, Skeleton, message, Tooltip } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApartmentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HrmOrganization.module.css';

const OrganizationListTemplate: React.FC = () => {
  const {
    companyList,
    fetchCompanyList,
    setCompanyListSearch,
    navigateToDetail,
    deleteCompany,
  } = useHrmOrganizationStore();

  useEffect(() => {
    fetchCompanyList();
  }, [fetchCompanyList]);

  const handleDeleteCompany = async (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdDateTime || 0).getTime();
      const dateB = new Date(b.createdDateTime || 0).getTime();
      return dateB - dateA;
    });
  }, [companyList.items, companyList.searchText]);

  const totalCount = companyList.items.length;
  const activeCount = companyList.items.filter((c) => c.active === 1).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className={styles.listViewContainer}>
      {/* ───── Stats Bar ───── */}
      <div className={styles.statsBar}>
        <div className={styles.statPill}>
          <span className={styles.statPillIconWrap} style={{ background: 'rgba(24,144,255,0.1)' }}>
            <BankOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          </span>
          <div>
            <div className={styles.statPillValue}>{totalCount}</div>
            <div className={styles.statPillLabel}>Total Companies</div>
          </div>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statPillIconWrap} style={{ background: 'rgba(82,196,26,0.1)' }}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          </span>
          <div>
            <div className={styles.statPillValue}>{activeCount}</div>
            <div className={styles.statPillLabel}>Active</div>
          </div>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statPillIconWrap} style={{ background: 'rgba(255,77,79,0.08)' }}>
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
          </span>
          <div>
            <div className={styles.statPillValue}>{inactiveCount}</div>
            <div className={styles.statPillLabel}>Inactive</div>
          </div>
        </div>
      </div>

      {/* ───── Header: Title + Search + Add ───── */}
      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeft}>
          <span className={styles.listTitle}>Companies ({filteredItems.length})</span>
        </div>
        <Input
          placeholder="Search by name, industry..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={companyList.searchText}
          onChange={(e) => setCompanyListSearch(e.target.value)}
          className={styles.searchInput}
          allowClear
        />
        <Can I="add">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigateToDetail('new')}>
            Add Company
          </Button>
        </Can>
      </div>

      {/* ───── Content ───── */}
      {companyList.isLoading ? (
        <div className={styles.cardListScroll}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.companyCardH} style={{ cursor: 'default' }}>
              <Skeleton active avatar={{ shape: 'square', size: 48 }} paragraph={{ rows: 1 }} />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyIllustration}>
            <ShopOutlined />
          </div>
          <h3 className={styles.emptyTitle}>
            {companyList.searchText ? 'No companies match your search' : 'No companies yet'}
          </h3>
          <p className={styles.emptySubtitle}>
            {companyList.searchText
              ? 'Try a different search term'
              : 'Set up your first company to get started with organization management'}
          </p>
          {!companyList.searchText && (
            <Can I="add">
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigateToDetail('new')}>
                Create First Company
              </Button>
            </Can>
          )}
        </div>
      ) : (
        <div className={styles.cardListScroll}>
          {filteredItems.map((company) => {
            const initials = (company.legalName || 'C').substring(0, 2).toUpperCase();
            const isActive = company.active === 1;
            const logoSrc = company.logoUrl || company.logoBase64 || '';

            return (
              <div
                key={company.handle}
                className={styles.companyCardH}
                onClick={() => navigateToDetail(company.handle)}
              >
                {/* Left: Avatar or Logo */}
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={company.legalName}
                    className={styles.cardHLogo}
                  />
                ) : (
                  <div className={styles.cardHAvatar}>{initials}</div>
                )}

                {/* Center: Info */}
                <div className={styles.cardHBody}>
                  <div className={styles.cardHRow1}>
                    <span className={styles.cardHName}>{company.legalName}</span>
                    <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    {(company.industryType || company.industry) && (
                      <span className={styles.industryTag}>{company.industryType || company.industry}</span>
                    )}
                  </div>

                  <div className={styles.cardHRow2}>
                    {company.officialEmail && (
                      <span className={styles.metaItem}>
                        <MailOutlined className={styles.metaIcon} />
                        {company.officialEmail}
                      </span>
                    )}
                    {company.officialPhone && (
                      <span className={styles.metaItem}>
                        <PhoneOutlined className={styles.metaIcon} />
                        {company.officialPhone}
                      </span>
                    )}
                    {company.tradeName && (
                      <span className={styles.metaItem} style={{ color: '#8c8c8c', fontStyle: 'italic' }}>
                        {company.tradeName}
                      </span>
                    )}
                  </div>

                  {/* Counters - show if available from API */}
                  {(company.businessUnitCount || company.departmentCount || company.employeeCount) && (
                    <div className={styles.cardHRow2} style={{ marginTop: 2 }}>
                      {company.businessUnitCount != null && (
                        <span className={styles.counterChip}>
                          <BankOutlined className={styles.metaIcon} />{company.businessUnitCount} BUs
                        </span>
                      )}
                      {company.departmentCount != null && (
                        <span className={styles.counterChip}>
                          <ApartmentOutlined className={styles.metaIcon} />{company.departmentCount} Depts
                        </span>
                      )}
                      {company.employeeCount != null && (
                        <span className={styles.counterChip}>
                          <TeamOutlined className={styles.metaIcon} />{company.employeeCount} Employees
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Quick Actions (always visible) */}
                <div className={styles.cardHActions} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="View">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigateToDetail(company.handle)}
                    />
                  </Tooltip>
                  <Can I="edit">
                    <Tooltip title="Edit">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => navigateToDetail(company.handle)}
                      />
                    </Tooltip>
                  </Can>
                  <Can I="delete">
                    <Popconfirm
                      title="Delete this company?"
                      description="This action cannot be undone."
                      onConfirm={(e) => handleDeleteCompany(company.handle, e as unknown as React.MouseEvent)}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Tooltip title="Delete">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>
                  </Can>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizationListTemplate;
