'use client';

import '@/utils/i18n';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tabs, Skeleton, Alert } from 'antd';
import CommonAppBar from '../components/CommonAppBar';
import ModuleCategoryGroup from '../components/molecules/ModuleCategoryGroup';
import { SIDEBAR_ITEMS, filterDashboardByPermissions } from '@/config/dashboardConfig';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [site, setSite] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use RBAC store instead of separate hook
  const isReady = useHrmRbacStore(s => s.isReady);
  const isLoading = useHrmRbacStore(s => s.isLoading);
  const error = useHrmRbacStore(s => s.error);
  const organizations = useHrmRbacStore(s => s.organizations);
  const currentSite = useHrmRbacStore(s => s.currentSite);

  // Build user modules response format for filtering
  const userModules = useMemo(() => {
    if (!isReady || organizations.length === 0) return null;
    
    return {
      userId: '',
      organizations: organizations,
      evaluatedAt: new Date().toISOString(),
    };
  }, [isReady, organizations]);

  // Filter all sidebar items based on user permissions
  const permissionFilteredItems = useMemo(() => {
    return filterDashboardByPermissions(SIDEBAR_ITEMS, userModules);
  }, [userModules]);

  // Build categories from permission-filtered config
  const allCategories = useMemo(() => {
    const categories: Array<{
      category: string;
      modules: Array<{
        moduleCode: string;
        moduleName: string;
        appUrl: string;
        subLabel: string;
      }>;
    }> = [];

    permissionFilteredItems.forEach((item) => {
      if (item.type === 'flyout' && item.apps) {
        // Flyout items - add as category
        categories.push({
          category: item.label,
          modules: item.apps.map((app) => ({
            moduleCode: app.key,
            moduleName: app.label,
            appUrl: app.route,
            subLabel: app.subLabel,
          })),
        });
      } else if (item.type === 'direct-nav' && item.route) {
        // Direct-nav items - add as standalone category
        categories.push({
          category: item.label,
          modules: [{
            moduleCode: item.key,
            moduleName: item.label,
            appUrl: item.route,
            subLabel: `Access ${item.label.toLowerCase()}`,
          }],
        });
      }
    });

    return categories;
  }, [permissionFilteredItems]);

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
