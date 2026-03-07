"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/ApiConfigurationMaintenance.module.css";
import CommonAppBar from "@components/CommonAppBar";
import { useAuth } from "@/context/AuthContext";
import { decryptToken } from "@/utils/encryption";
import jwtDecode from "jwt-decode";
import { useTranslation } from 'react-i18next';
import { parseCookies } from "nookies";
import UserCredentialForm from "./UserCredentialForm";


interface DecodedToken {
  preferred_username: string;
}


const UserCredentialMain: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [call, setCall] = useState<number>(0);

  const { t } = useTranslation();



  useEffect(() => {
    const fetchItemData = async () => {
      // debugger;
      if (isAuthenticated && token) {
        try {
          const decryptedToken = decryptToken(token);
          const decoded: DecodedToken = jwtDecode(decryptedToken);
          setUsername(decoded.preferred_username);
          console.log("user name: ", username);
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }


    };

    fetchItemData();
  }, [isAuthenticated, username, call]);


  return (
    <div className={styles.container}>
      <div className={styles.dataFieldNav}>
        <CommonAppBar
          onSearchChange={() => { }}
          allActivities={[]}
          username={username}
          site={null}
          appTitle={t("User Credentials")} onSiteChange={function (newSite: string): void {
            setCall(call + 1);
          }} />
      </div>
      <div className={styles.dataFieldBody}>
        <div>
          <UserCredentialForm />
        </div>
      </div>
    </div>
  );
};

export default UserCredentialMain;


