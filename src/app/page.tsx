// src/app/page.tsx

"use client";
import "@/utils/i18n";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import jwtDecode from "jwt-decode";
import { decryptToken } from "../utils/encryption";
import { Tabs } from "antd";
import CommonAppBar from "../components/CommonAppBar";
import ModuleTileSkeleton from "../components/atoms/ModuleTileSkeleton";
import HrmEmptyState from "../components/atoms/HrmEmptyState";
import ModuleCategoryGroup from "../components/molecules/ModuleCategoryGroup";
import { setCookie } from "nookies";
import styles from "./HomePage.module.css";
import { useRbacContext } from "../modules/hrmAccess/context/RbacContext";
import { useTranslation } from "react-i18next";

interface DecodedToken {
  preferred_username: string;
}

const HomePage: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const {
    currentSite,
    currentOrgModules,
    modulesByCategory,
    isReady,
    isLoading,
    switchOrganization,
  } = useRbacContext();
  const { t } = useTranslation();

  const [username, setUsername] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isAuthenticated && token) {
      try {
        const decryptedToken = decryptToken(token);
        const decoded: DecodedToken = jwtDecode<DecodedToken>(decryptedToken);
        setUsername(decoded.preferred_username);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isReady && currentSite) {
      setCookie(null, "site", currentSite, { path: "/" });
    }
  }, [isReady, currentSite]);

  const filteredCategories = useMemo(() => {
    const categories = Object.entries(modulesByCategory).map(
      ([category, modules]) => ({ category, modules })
    );

    if (!searchTerm) return categories;

    return categories
      .map((group) => ({
        ...group,
        modules: group.modules.filter((m) =>
          m.moduleName.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((group) => group.modules.length > 0);
  }, [modulesByCategory, searchTerm]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleSiteChange = (newSite: string) => {
    switchOrganization(newSite);
  };

  const tabItems = filteredCategories.map((group) => ({
    key: group.category,
    label: group.category,
    children: (
      <div className={styles.tabContent} data-testid={`tab-panel-${group.category}`}>
        <ModuleCategoryGroup
          category={group.category}
          modules={group.modules}
        />
      </div>
    ),
  }));

  return (
    <div className={styles.pageRoot} data-testid="hrm-home-page">
      <CommonAppBar
        username={username}
        site={currentSite}
        onSearchChange={handleSearchChange}
        appTitle="Welcome to Fenta HRM"
        onSiteChange={handleSiteChange}
      />
      <div className={styles.contentWrapper}>
        {isLoading && !isReady && (
          <ModuleTileSkeleton count={12} />
        )}

        {isReady && filteredCategories.length === 0 && (
          <HrmEmptyState
            title={t("hrmHomeEmpty", "No modules available")}
            subtext={t(
              "hrmHomeEmptySubtext",
              "You don't have access to any modules. Contact your administrator."
            )}
          />
        )}

        {isReady && filteredCategories.length > 0 && (
          <Tabs
            data-testid="category-tabs"
            items={tabItems}
            className={styles.categoryTabs}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
