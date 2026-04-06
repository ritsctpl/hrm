'use client';

import '@/utils/i18n';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tabs } from 'antd';
import CommonAppBar from '../components/CommonAppBar';
import ModuleCategoryGroup from '../components/molecules/ModuleCategoryGroup';
import { CENTER_GRID_GROUPS } from '@/config/dashboardConfig';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [site, setSite] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Build categories from frontend config
  const allCategories = useMemo(() => {
    return CENTER_GRID_GROUPS.map((group) => ({
      category: group.label,
      modules: (group.apps || []).map((app) => ({
        moduleCode: app.key,
        moduleName: app.label,
        appUrl: app.route,
        subLabel: app.subLabel,
      })),
    }));
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return allCategories;
    return allCategories
      .map((group) => ({
        ...group,
        modules: group.modules.filter((m) =>
          m.moduleName.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((group) => group.modules.length > 0);
  }, [allCategories, searchTerm]);

  const tabItems = filteredCategories.map((group) => ({
    key: group.category,
    label: group.category,
    children: (
      <div className={styles.tabContent}>
        <ModuleCategoryGroup
          category={group.category}
          modules={group.modules}
        />
      </div>
    ),
  }));

  return (
    <div className={styles.pageRoot}>
      <CommonAppBar
        appTitle="Fenta HRM"
        site={site}
        onSearchChange={(term: string) => setSearchTerm(term)}
        onSiteChange={(newSite: string) => setSite(newSite)}
        setUserDetails={(data: any) => {
          setSite(data.currentSite || data.site);
        }}
      />
      {isAuthenticated && (
        <div className={styles.contentWrapper}>
          {filteredCategories.length > 0 && (
            <Tabs items={tabItems} className={styles.categoryTabs} />
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
