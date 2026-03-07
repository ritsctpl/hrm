"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/ActivityMaintenance.module.css";

import CommonAppBar from "@components/CommonAppBar";
import { useAuth } from "@/context/AuthContext";
import { IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CommonTable from "./CommonTable";
import { parseCookies } from "nookies";
import { decryptToken } from "@/utils/encryption";
import jwtDecode from "jwt-decode";
import { useTranslation } from 'react-i18next';

import {
  fetchTop50Activity,
  retrieveActivity,
  retrieveAllActivity,

} from "@services/activityService";
import { Modal, notification } from "antd";

import ActivityCommonBar from "./ActivityCommonBar";
import { ActivityContext } from "../hooks/activityContext";
import ActivityMaintenanceBody from "./ActivityMaintenanceBody";


interface DataRow {
  [key: string]: string | number;

}

interface DecodedToken {
  preferred_username: string;
}

interface CustomDataRow {
  customData: string;
  value: any;
}





const ActivityMaintenance: React.FC = () => {
  const cookies = parseCookies();
  const { isAuthenticated, token } = useAuth();
  const [top50Data, setTop50Data] = useState<DataRow[]>([]);
  const [rowData, setRowData] = useState<DataRow[]>([]);
  const [itemRowData, setItemRowData] = useState<DataRow[]>([]);
  const [filteredData, setFilteredData] = useState<DataRow[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<DataRow | null>(null);
  const [resetValue, setResetValue] = useState<boolean>(false);
  const [site, setSite] = useState<string | null>(cookies.site);
  const [call, setCall] = useState<number>(0);
  const [resetValueCall, setResetValueCall] = useState<number>(0);
  const [rowClickCall, setRowClickCall] = useState<number>(0);
  const [mainSchema, setMainSchema] = useState<any>();
  const [customDataForCreate, setCustomDataForCreate] = useState<
    CustomDataRow[]
  >([]);


  const [customDataOnRowSelect, setCustomDataOnRowSelect] = useState<
    any[]
  >([]);
  const [fullScreen, setFullScreen] = useState<boolean>(false);
  const [addClick, setAddClick] = useState<boolean>(false);
  const [addClickCount, setAddClickCount] = useState<number>(0);

  const [payloadData, setPayloadData] = useState<any>();
  // const [rowSelectedData, setRowSelectedData] = useState<any>();
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const [showMessage, setShowMessage] = useState<boolean>(true);

  const { t } = useTranslation();

  let oCustomDataList;

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

      setTimeout(async () => {

        try {
          // debugger;
          const item = await fetchTop50Activity(site);
          setTop50Data(item);
          setFilteredData(item); // Initialize filtered data
        } catch (error) {
          console.error("Error fetching data fields:", error);
        }
      }, 1000);
    };

    fetchItemData();
  }, [isAuthenticated, username, call]);

  const fetchItemList = async () => {
    const cookies = parseCookies();
    const site = cookies.site;

    try {
      const activities = await fetchTop50Activity(site);
      setTop50Data(activities);
    } catch (error) {
      console.error("Error fetching data fields:", error);
    }
  };



  const handleSearch = async (searchTerm: string) => {
    const cookies = parseCookies();
    const site = cookies.site;
    const userId = username;
    debugger
    try {
      // Fetch the item list and wait for it to complete
      const lowercasedTerm = searchTerm.toLowerCase();
      const oAllItem = await retrieveAllActivity(site, searchTerm);
      console.log("reatrieve all", oAllItem)
      // Once the item list is fetched, filter the data
      let filtered;

      if (lowercasedTerm) {
        filtered = oAllItem.filter(row =>
          Object.values(row).some(value =>
            String(value).toLowerCase().includes(lowercasedTerm)
          )
        );
      } else {
        filtered = top50Data; // If no search term, show all items
      }

      // Update the filtered data state
      setFilteredData(filtered);

    } catch (error) {
      console.error('Error fetching activity on search:', error);
    }
  };



  const documentTableColumns = [
    { title: t('method'), dataIndex: 'method', key: 'method' },
    { title: t('description'), dataIndex: 'description', key: 'description' },
  ];

  const documentList = [];


  let schemaData = [

    {
      type: 'input',
      label: 'activityId',
      name: 'activityId',
      placeholder: '',
      required: true,
      width: "70%",
      uppercase: true,
      noSpaces: true,
      noSpecialChars: true
    },
    {
      type: 'input',
      label: 'description',
      name: 'description',
      placeholder: '',
      required: false,
      width: "70%",
    },
    {
      type: 'selectBrowse',
      label: 'activityGroup',
      name: 'activityGroup',
      placeholder: '',
      required: false,
      defaultValue: [],
      width: "70%",

    },
    {
      type: 'switch',
      label: 'enabled',
      name: 'enabled',
      placeholder: '',
      required: false,

      width: "70%",
    }, {
      type: 'switch',
      label: 'visibleInActivityManager',
      name: 'visibleInActivityManager',
      placeholder: '',
      required: false,

      width: "70%",
    },
    {
      type: 'select',
      label: 'type',
      name: 'type',
      placeholder: '',
      required: false,
      width: "70%",
      defaultValue: "Service",
      options: [
        { value: 'Service', label: 'Service' },
        { value: 'UI', label: 'UI' },
        { value: 'Hooks', label: 'Hooks' },
      ],
    },

    {
      type: 'input',
      label: 'classOrProgram',
      name: 'url',
      placeholder: '',
      icon: false,
      correspondingVersion: '',
      required: true,
      width: "70%",
      uppercase: false,
      noSpaces: true,
      noSpecialChars: false
    },

    {
      type: 'browse',
      label: 'listOfMethod',
      name: 'listOfMethod',
      placeholder: '',
      icon: true,
      correspondingVersion: '',
      required: false,
      tableColumns: documentTableColumns,
      tableData: documentList,
      width: "70%",
      uppercase: true,
      noSpaces: true,
      noSpecialChars: true
    },

  ];




  const handleAddClick = () => {
    setAddClick(true);
    setResetValue(true);
    setSelectedRowData(null);
    setIsAdding(true);
    //setResetValueCall(resetValueCall + 1);
    setFullScreen(false);
    setAddClickCount(addClickCount + 1)


    setPayloadData((prevData) => ({
      // ...prevData,
      activityId: "",
      description: "",
      activityGroupList: [],
      enabled: false,
      visibleInActivityManager: false,
      type: "Service", // This remains the same
      url: "",
      listOfMethod: "",
      activityRules: [],
      activityHookList: []
    }));
    setShowAlert(false)
  };

  const handleRowSelect = (row: DataRow) => {
    setIsAdding(true);
    setResetValue(false);
    setFullScreen(false);
    setAddClick(false);

    const fetchActivityData = async () => {
      const cookies = parseCookies();
      const site = cookies.site;
      const activityId = row.activityId as string;
      const currentSite = site;

      try {
        const oActivity = await retrieveActivity(site, activityId, currentSite); // Fetch the item data
        console.log("Retrieved Activity: ", oActivity);

        if (!oActivity.errorCode) {
          const activityGroupNames = oActivity.activityGroupList.map(group => group.activityGroupName);

          schemaData = schemaData.map(field => {
            if (field.name === 'activityGroup') {
              return {
                ...field,
                defaultValue: activityGroupNames
              };
            }
            return field;
          });

          setMainSchema(schemaData);

          setSelectedRowData(oActivity);
          setRowData(oActivity);
          setItemRowData(oActivity);
          setPayloadData(oActivity);
          console.log("Schema data changed: ", schemaData);
        }
      } catch (error) {
        console.error("Error fetching reason code:", error);
      }
    };

    if (showAlert == true && isAdding == true) {
      Modal.confirm({
        title: t('confirm'),
        content: t('rowSelectionMsg'),
        okText: t('ok'),
        cancelText: t('cancel'),
        onOk: async () => {
          // Proceed with the API call if confirmed
          await fetchActivityData();
          setShowAlert(false)
        },
        onCancel() {
          console.log('Action canceled');
        },
      });
    } else {
      // If no data to confirm, proceed with the API call
      fetchActivityData();
    }
    setIsAdding(true);

  };


  const handleClose = () => {
    setIsAdding(false);
    setFullScreen(false);
  };
  const handleSiteChange = (newSite: string) => {
    setSite(newSite);
    setCall(call + 1);
  };


  return (
    <ActivityContext.Provider value={{ payloadData, setPayloadData, schemaData, addClickCount, mainSchema, showAlert, setShowAlert }}>
      <div className={styles.container}>
        <div className={styles.dataFieldNav}>
          <CommonAppBar
            onSearchChange={() => { }}
            allActivities={[]}
            username={username}
            site={null}
            appTitle={t("activityAppTitle")} onSiteChange={handleSiteChange} />
        </div>
        <div className={styles.dataFieldBody}>
          <div className={styles.dataFieldBodyContentsBottom}>
            <div
              className={`${styles.commonTableContainer} ${isAdding ? styles.shrink : ""
                }`}
            >

              {/* <FluentProvider theme={webLightTheme}
              style={{marginTop: '4px'}}
              >
                {showMessage && (
                  <MessageBar intent="success"
                    style={{ minHeight: '5px', padding: '2px 0px 2px 5px' }}
                  >
                    <MessageBarBody>
                      Success: Activity updated Successfully
                    </MessageBarBody>
                    <MessageBarActions
                      containerAction={
                        <Button
                          aria-label="dismiss"
                          appearance="transparent"
                          icon={<DismissRegular />}
                          onClick={() => setShowMessage(false)}
                        />
                      }
                    />
                  </MessageBar>
                )}
              </FluentProvider> */}



              <ActivityCommonBar
                onSearch={handleSearch}
                setFilteredData={setFilteredData}
              />
              <div className={styles.dataFieldBodyContentsTop}>
                <Typography className={styles.dataLength}>
                  {t("activity")} ({filteredData ? filteredData.length : 0})
                </Typography>

                <IconButton
                  onClick={handleAddClick}
                  className={styles.circleButton}
                >
                  <AddIcon sx={{ fontSize: 30 }} />
                </IconButton>
              </div>
              <CommonTable data={filteredData} onRowSelect={handleRowSelect} />
            </div>
            <div
              className={`${styles.formContainer} ${isAdding
                ? `${styles.show} ${fullScreen ? styles.showFullScreen : styles.show
                }`
                : ""
                }`}
            >
              <ActivityMaintenanceBody
                call={call}
                setCall={setCall}
                resetValueCall={resetValueCall}
                onClose={handleClose}
                selectedRowData={selectedRowData}
                rowSelectedData={selectedRowData}
                resetValue={resetValue}
                oCustomDataList={oCustomDataList}
                isAdding={isAdding}
                customDataForCreate={customDataForCreate}
                customDataOnRowSelect={customDataOnRowSelect}
                rowClickCall={rowClickCall}
                setFullScreen={setFullScreen}
                username={username}
                setCustomDataOnRowSelect={setCustomDataOnRowSelect}
                addClick={addClick}
                addClickCount={addClickCount}
                setAddClick={setAddClick}
                itemRowData={itemRowData}
                fullScreen={fullScreen} setIsAdding={function (): void {
                  throw new Error("Function not implemented.");
                }} setResetValueCall={function (): void {
                  throw new Error("Function not implemented.");
                }} itemData={[]} availableDocuments={[]} assignedDocuments={[]} availableDocumentForCreate={[]} payloadData={undefined} setPayloadData={function (): void {
                  throw new Error("Function not implemented.");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ActivityContext.Provider>
  );
};

export default ActivityMaintenance;


