'use client';
import React from 'react';
import { Input, Select, Button } from 'antd';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { PROJECT_STATUS_OPTIONS, PROJECT_TYPES } from '../../utils/projectConstants';
import styles from '../../styles/ProjectList.module.css';

const ProjectSearchBar: React.FC = () => {
  const {
    searchQuery, filterBU, filterType, filterStatus,
    setSearchQuery, setFilterBU, setFilterType, setFilterStatus,
  } = useHrmProjectStore();

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
