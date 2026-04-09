'use client';

import '@/utils/i18n';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tabs } from 'antd';
import CommonAppBar from '../components/CommonAppBar';
import ModuleCategoryGroup from '../components/molecules/ModuleCategoryGroup';
import { CATEGORY_ORDER } from '@/config/dashboardConfig';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [site, setSite] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const modulesByCategory = useHrmRbacStore((s) => s.modulesByCategory);
  const isRbacReady = useHrmRbacStore((s) => s.isReady);

  // Build categories from RBAC API data
  const allCategories = useMemo(() => {
    if (!isRbacReady) return [];
    const categories: { category: string; modules: { moduleCode: string; moduleName: string; appUrl: string; subLabel?: string }[] }[] = [];
    // Ordered categories first
    for (const cat of CATEGORY_ORDER) {
      const mods = modulesByCategory[cat];
      if (mods && mods.length > 0) {
        categories.push({
          category: cat,
          modules: mods.map((m) => ({
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            appUrl: m.appUrl,
            subLabel: m.description || m.moduleCategory,
          })),
        });
      }
    }
    // Any extra categories from API not in CATEGORY_ORDER
    for (const [cat, mods] of Object.entries(modulesByCategory)) {
      if (!CATEGORY_ORDER.includes(cat) && mods.length > 0) {
        categories.push({
          category: cat,
          modules: mods.map((m) => ({
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            appUrl: m.appUrl,
            subLabel: m.description || m.moduleCategory,
          })),
        });
      }
    }
    return categories;
  }, [isRbacReady, modulesByCategory]);

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
