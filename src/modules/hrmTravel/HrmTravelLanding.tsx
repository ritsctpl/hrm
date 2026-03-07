"use client";

import React, { useEffect } from "react";
import { Button, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmTravelStore } from "./stores/hrmTravelStore";
import { useTravelData } from "./hooks/useTravelData";
import TravelSearchBar from "./components/molecules/TravelSearchBar";
import TravelListTable from "./components/organisms/TravelListTable";
import TravelMasterDetailTemplate from "./components/templates/TravelMasterDetailTemplate";
import TravelScreenHeader from "./components/organisms/TravelScreenHeader";
import HrmTravelScreen from "./HrmTravelScreen";
import styles from "./styles/Travel.module.css";

const { Text } = Typography;

const HrmTravelLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";

  const {
    myRequests,
    listLoading,
    selectedRequest,
    screenMode,
    setSelectedRequest,
    setScreenMode,
    resetFormState,
  } = useHrmTravelStore();

  const { loadMyRequests } = useTravelData();

  useEffect(() => {
    loadMyRequests();
  }, [site]);

  const handleNewRequest = () => {
    setSelectedRequest(null);
    resetFormState();
    setScreenMode("create");
  };

  const handleRowClick = (request: typeof myRequests[0]) => {
    setSelectedRequest(request);
    setScreenMode("view");
  };

  const handleBack = () => {
    setScreenMode("list");
    setSelectedRequest(null);
  };

  const handleActionComplete = () => {
    loadMyRequests();
    setSelectedRequest(null);
    setScreenMode("list");
  };

  const detailPanel =
    screenMode === "create" || (screenMode !== "list" && selectedRequest) ? (
      <HrmTravelScreen
        request={selectedRequest}
        mode={screenMode === "create" ? "create" : "view"}
        onBack={handleBack}
        onActionComplete={handleActionComplete}
      />
    ) : (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <span style={{ fontSize: 48 }}>✈</span>
        </div>
        <Text type="secondary">Select a request to view details</Text>
      </div>
    );

  return (
    <div className={styles.landing}>
      <CommonAppBar appTitle="Travel Requests" />
      <TravelScreenHeader
        title="My Travel Requests"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewRequest}>
            New Request
          </Button>
        }
      />
      <TravelSearchBar onSearch={loadMyRequests} />
      <TravelMasterDetailTemplate
        listPanel={
          <TravelListTable
            requests={myRequests}
            loading={listLoading}
            selectedHandle={selectedRequest?.handle}
            onRowClick={handleRowClick}
            onNewRequest={handleNewRequest}
          />
        }
        detailPanel={detailPanel}
      />
    </div>
  );
};

export default HrmTravelLanding;
