// src/app/page.tsx

"use client";
import "@/utils/i18n";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import jwtDecode from "jwt-decode";
import { decryptToken } from "../utils/encryption";
import { Container, Box, Tabs, Tab } from "@mui/material";
import Tile from "../components/Tile";
import CommonAppBar from "../components/CommonAppBar";
import { setCookie } from "nookies";
import styles from "./HomePage.module.css";
import { useRbacContext } from "../modules/hrmAccess/context/RbacContext";

interface DecodedToken {
  preferred_username: string;
}

const HomePage: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const {
    currentSite,
    currentOrgModules,
    modulesByCategory,
    organizations,
    isReady,
    switchOrganization,
  } = useRbacContext();

  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filteredModules, setFilteredModules] = useState<
    { category: string; modules: typeof currentOrgModules }[]
  >([]);

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

  useEffect(() => {
    if (isReady) {
      const categories = Object.entries(modulesByCategory).map(
        ([category, modules]) => ({ category, modules })
      );
      setFilteredModules(categories);
    }
  }, [isReady, modulesByCategory]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSearchChange = (searchTerm: string) => {
    setActiveTab(0);
    if (searchTerm === "") {
      const categories = Object.entries(modulesByCategory).map(
        ([category, modules]) => ({ category, modules })
      );
      setFilteredModules(categories);
      return;
    }

    const filtered = Object.entries(modulesByCategory)
      .map(([category, modules]) => ({
        category,
        modules: modules.filter((m) =>
          m.moduleName.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((group) => group.modules.length > 0);

    setFilteredModules(filtered);
  };

  const handleSiteChange = (newSite: string) => {
    switchOrganization(newSite);
  };

  // Build allActivities from currentOrgModules for CommonAppBar search
  const allActivities = currentOrgModules.map((m) => ({
    description: m.moduleName,
    url: m.appUrl,
    activityId: m.moduleCode,
  }));

  return (
    <div>
      <CommonAppBar
        allActivities={allActivities}
        username={username}
        site={currentSite}
        onSearchChange={handleSearchChange}
        appTitle="Welcome to Fenta HRM"
        onSiteChange={handleSiteChange}
      />
      {isAuthenticated && isReady && (
        <Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {filteredModules.map((group, index) => (
              <Tab key={index} label={group.category} />
            ))}
          </Tabs>

          {filteredModules.map((group, index) => (
            <div
              style={{ height: "85vh", overflow: "scroll" }}
              className="home-tiles"
              key={index}
              role="tabpanel"
              hidden={activeTab !== index}
            >
              {activeTab === index && (
                <Box className={styles.tileWrapper}>
                  {group.modules.map((mod, modIndex) => (
                    <Tile
                      key={modIndex}
                      description={mod.moduleName}
                      url={mod.appUrl}
                      activityId={mod.moduleCode}
                    />
                  ))}
                </Box>
              )}
            </div>
          ))}
        </Box>
      )}
    </div>
  );
};

export default HomePage;
