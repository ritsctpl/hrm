'use client';

import '@/utils/i18n';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tabs, Skeleton, Alert } from 'antd';
import CommonAppBar from '../components/CommonAppBar';
import ModuleCategoryGroup from '../components/molecules/ModuleCategoryGroup';
import { CATEGORY_ORDER } from '@/config/dashboardConfig';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [site, setSite] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isReady = useHrmRbacStore(s => s.isReady);
  const isLoading = useHrmRbacStore(s => s.isLoading);
  const error = useHrmRbacStore(s => s.error);
  const modulesByCategory = useHrmRbacStore(s => s.modulesByCategory);

  // Build categories from RBAC API data (modulesByCategory comes pre-grouped by backend)
  const allCategories = useMemo(() => {
    if (!isReady) return [];
    const categories: Array<{
      category: string;
      modules: Array<{
        moduleCode: string;
        moduleName: string;
        appUrl: string;
        subLabel: string;
      }>;
    }> = [];

    // Ordered categories first
    for (const cat of CATEGORY_ORDER) {
      const mods = modulesByCategory[cat];
      if (mods && mods.length > 0) {
        categories.push({
          category: cat,
          modules: mods.map(m => ({
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            appUrl: m.appUrl,
            subLabel: m.description || m.moduleCategory || '',
          })),
        });
      }
    }

    // Any extra categories from API not in CATEGORY_ORDER
    for (const [cat, mods] of Object.entries(modulesByCategory)) {
      if (!CATEGORY_ORDER.includes(cat) && mods.length > 0) {
        categories.push({
          category: cat,
          modules: mods.map(m => ({
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            appUrl: m.appUrl,
            subLabel: m.description || m.moduleCategory || '',
          })),
        });
      }
    }

    return categories;
  }, [isReady, modulesByCategory]);

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

  // Show loading state
  if (isLoading || !isReady) {
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
        <div className={styles.contentWrapper}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
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
        <div className={styles.contentWrapper}>
          <Alert
            message="Failed to Load Modules"
            description={error}
            type="error"
            showIcon
          />
        </div>
      </div>
    );
  }

  // Show empty state if no modules accessible
  if (filteredCategories.length === 0 && !searchTerm) {
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
        <div className={styles.contentWrapper}>
          <Alert
            message="No Modules Accessible"
            description="You don't have access to any modules. Please contact your administrator."
            type="info"
            showIcon
          />
        </div>
      </div>
    );
  }

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
