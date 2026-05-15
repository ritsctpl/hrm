'use client';
import React, { useEffect, useState } from 'react';
import { Input, Select, Button, message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { PROJECT_STATUS_OPTIONS, PROJECT_TYPES } from '../../utils/projectConstants';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import type { BusinessUnit } from '@/modules/hrmOrganization/types/domain.types';
import styles from '../../styles/ProjectList.module.css';

const ProjectSearchBar: React.FC = () => {
  const {
    searchQuery, filterBU, filterType, filterStatus,
    setSearchQuery, setFilterBU, setFilterType, setFilterStatus,
  } = useHrmProjectStore();

  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loadingBUs, setLoadingBUs] = useState(false);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoadingBUs(true);
    HrmOrganizationService.fetchBusinessUnitsBySite(organizationId)
      .then((data) => setBusinessUnits(data ?? []))
      .catch(() => message.error('Failed to load business units'))
      .finally(() => setLoadingBUs(false));
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterBU('');
    setFilterType('');
    setFilterStatus('');
  };

  return (
    <div className={styles.filterBar}>
      <Input.Search
        placeholder="Search code or name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
        allowClear
      />
      <Select
        value={filterBU || undefined}
        onChange={(v) => setFilterBU(v ?? '')}
        placeholder="Business Unit"
        allowClear
        showSearch
        loading={loadingBUs}
        style={{ width: 160 }}
        filterOption={(input, option) =>
          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={businessUnits.map((bu) => ({
          value: bu.buCode,
          label: `${bu.buCode} - ${bu.buName}`,
        }))}
      />
      <Select
        value={filterType || undefined}
        onChange={setFilterType}
        placeholder="Type"
        allowClear
        style={{ width: 120 }}
        options={PROJECT_TYPES}
      />
      <Select
        value={filterStatus || undefined}
        onChange={setFilterStatus}
        placeholder="Status"
        allowClear
        style={{ width: 130 }}
        options={PROJECT_STATUS_OPTIONS}
      />
      <Button onClick={clearFilters} size="small">Clear</Button>
    </div>
  );
};

export default ProjectSearchBar;
