// src/app/page.tsx

"use client";
import "@/utils/i18n";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import jwtDecode from "jwt-decode";
import { decryptToken } from "../utils/encryption";
import { Container, Box, Tabs, Tab } from "@mui/material";
import Tile from "../components/Tile";
import CommonAppBar from "../components/CommonAppBar";
import { setCookie } from "nookies";
import styles from "./HomePage.module.css";

interface DecodedToken {
  preferred_username: string;
}

const HomePage: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [userActivityGroups, setUserActivityGroups] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [site, setSite] = useState<string | null>(null);
  const [allActivities, setAllActivities] = useState<any[]>([]);

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
    if (isAuthenticated && username) {
      api
        .post("/user-service/retrieve_detailed_user", { user: username })
        .then((response) => {
          const groups = response.data.userActivityGroupDetails;
          console.log(response, "cookiesCheck");
          console.log(groups, "cookiesCheck");

          setUserActivityGroups(groups);
          setCookie(null, "site", response.data.site, { path: "/" });
          setSite(response.data.site);
          setFilteredActivities(groups); // Set initial filtered activities
          setCookie(
            null,
            "activities",
            JSON.stringify(response.data.userActivityGroupDetails),
            { path: "/" }
          );

          // Flatten all activities for the search suggestions
          const activities = groups.flatMap((group: any) => group.activityList);
          setAllActivities(activities);
        })
        .catch((error) => {
          console.error("Error fetching user details:", error);
        });
    }
  }, [isAuthenticated, username]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSearchChange = (searchTerm: string) => {
    setActiveTab(0);
    if (searchTerm === "") {
      setFilteredActivities(userActivityGroups); // Reset to full list
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
    // Optionally, handle any additional logic required when the site changes
  };

  return (
    <div>
      <CommonAppBar
        allActivities={allActivities}
        username={username}
        site={site}
        onSearchChange={handleSearchChange}
        appTitle="Welcome to Fenta HRM"
        onSiteChange={handleSiteChange}
      />
      {isAuthenticated && (
        <Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {filteredActivities?.map((group, index) => (
              <Tab key={index} label={group.activityGroupDescription} />
            ))}
          </Tabs>

          {filteredActivities?.map((group, index) => (
            <div
              style={{ height: "85vh", overflow: "scroll" }}
              className="home-tiles"
              key={index}
              role="tabpanel"
              hidden={activeTab !== index}
            >
              {activeTab === index && (
                <Box className={styles.tileWrapper}>
                  {group.activityList.map((activity, activityIndex) => (
                    <Tile
                      key={activityIndex}
                      description={activity.description}
                      url={activity.url}
                      activityId={activity.activityId}
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
