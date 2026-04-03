// src/app/page.tsx

"use client";
import "@/utils/i18n";
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Container, Box, Tabs, Tab } from "@mui/material";
import Tile from "../components/Tile";
import CommonAppBar from "../components/CommonAppBar";
import styles from "./HomePage.module.css";

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [userActivityGroups, setUserActivityGroups] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [site, setSite] = useState<string | null>(null);
  const [allActivities, setAllActivities] = useState<any[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSearchChange = (searchTerm: string) => {
    setActiveTab(0);
    if (searchTerm === "") {
      setFilteredActivities(userActivityGroups);
      return;
    }

    const filtered = userActivityGroups
      ?.map((group: any) => {
        const filteredList = group.activityList.filter((activity: any) =>
          activity.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { ...group, activityList: filteredList };
      })
      .filter((group: any) => group.activityList.length > 0);

    setFilteredActivities(filtered);
  };

  const handleSiteChange = (newSite: string) => {
    setSite(newSite);
  };

  return (
    <div>
      <CommonAppBar
        allActivities={allActivities}
        site={site}
        onSearchChange={handleSearchChange}
        appTitle="Fenta HRM"
        onSiteChange={handleSiteChange}
        setUserDetails={(data: any) => {
          const groups = data.userActivityGroupDetails;
          setUserActivityGroups(groups);
          setFilteredActivities(groups);
          const activities = groups?.flatMap((g: any) => g.activityList);
          setAllActivities(activities);
          setSite(data.currentSite || data.site);
        }}
      />
      {isAuthenticated && (
        <Box className={styles.homeContainer}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 42,
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
              px: 3,
              '& .MuiTab-root': {
                minHeight: 42,
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                color: '#64748b',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s ease',
                mx: 0.5,
                '&:hover': {
                  color: '#6366f1',
                  background: 'rgba(99, 102, 241, 0.04)',
                },
                '&.Mui-selected': {
                  color: '#6366f1',
                  fontWeight: 700,
                },
              },
              '& .MuiTabs-indicator': {
                height: 2.5,
                borderRadius: '2px 2px 0 0',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              },
            }}
          >
            {filteredActivities?.map((group, index) => (
              <Tab key={index} label={group.activityGroupDescription} />
            ))}
          </Tabs>

          {filteredActivities?.map((group, index) => (
            <div
              className={styles.tabPanel}
              key={index}
              role="tabpanel"
              hidden={activeTab !== index}
            >
              {activeTab === index && (
                <Box className={styles.tileWrapper}>
                  {group.activityList.map(
                    (activity: any, activityIndex: number) => (
                      <Tile
                        key={activityIndex}
                        description={activity.description}
                        url={activity.url}
                        activityId={activity.activityId}
                      />
                    )
                  )}
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
