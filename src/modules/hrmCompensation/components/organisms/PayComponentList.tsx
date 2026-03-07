'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button, Input, Spin, Typography } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { PayComponent } from '../../types/domain.types';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import PayComponentListRow from '../molecules/PayComponentListRow';
import styles from '../../styles/Compensation.module.css';

const PayComponentList: React.FC = () => {
  const payComponents = useHrmCompensationStore((s) => s.payComponents);
  const selectedComponent = useHrmCompensationStore((s) => s.selectedComponent);
  const componentsLoading = useHrmCompensationStore((s) => s.componentsLoading);
  const selectComponent = useHrmCompensationStore((s) => s.selectComponent);
  const fetchPayComponents = useHrmCompensationStore((s) => s.fetchPayComponents);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return payComponents;
    return payComponents.filter(
      (c) =>
        c.componentCode.toLowerCase().includes(q) ||
        c.componentName.toLowerCase().includes(q) ||
        c.componentType.toLowerCase().includes(q),
    );
  }, [payComponents, search]);

  const handleNew = useCallback(() => {
    selectComponent(null);
  }, [selectComponent]);

  const handleSelect = useCallback(
    (component: PayComponent) => {
      selectComponent(component);
    },
    [selectComponent],
  );

  return (
    <div>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Pay Components</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<RefreshIcon style={{ fontSize: 14 }} />}
            onClick={() => fetchPayComponents()}
          />
          <Button
            type="primary"
            size="small"
            icon={<AddIcon style={{ fontSize: 14 }} />}
            onClick={handleNew}
          >
            New
          </Button>
        </div>
      </div>

      <Input.Search
        placeholder="Search components..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="small"
        style={{ marginBottom: 12 }}
      />

      {componentsLoading ? (
        <div className={styles.loadingContainer}>
          <Spin />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyContainer}>
          <Typography.Text type="secondary">No components found</Typography.Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((component) => (
            <PayComponentListRow
              key={component.componentCode}
              component={component}
              selected={selectedComponent?.componentCode === component.componentCode}
              onClick={() => handleSelect(component)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
        {filtered.length} of {payComponents.length} components
      </div>
    </div>
  );
};

export default PayComponentList;
