'use client';

import React, { useEffect, useState } from 'react';
import styles from '../styles/UserGroup.module.css';
import { useAuth } from '@/context/AuthContext';
import { IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { parseCookies } from 'nookies';
import { decryptToken } from '@/utils/encryption';
import jwtDecode from 'jwt-decode';
import CommonAppBar from '@components/CommonAppBar';
import UserGroupBar from './UserGroupBar';
import { RetriveUserGroupSelectedRow, fetchUserGroupTop50, fetchUserGrpAll } from '@services/userGroupService';
import UserGroupBody from './UserGroupBody';
import { UserGrpContext } from '../hooks/useContext/UserGroupUseContext';
import { UserGroups, defaultUserGroup } from '../types/UserTypes';
import { useTranslation } from 'react-i18next';
import CommonTable from '@components/CommonTable';
import { Modal } from 'antd';

interface DataRow {
  [key: string]: string | number;
}

interface Activity {
  activityId: string;
  enabled: boolean;
}

interface ActivityGroup {
  key: React.ReactNode;
  activityGroupName: string;
  activityGroupDescription?: string;
  enabled: boolean;
  permissionForActivity: Activity[];
}

interface DecodedToken {
  preferred_username: string;
}

interface CustomDataRow {
  customData: string;
  value: any;
}

interface DocumentRow {
  document: string;
}

const UserGroup: React.FC = (): JSX.Element => {
  const [selectedRowData, setSelectedRowData] = useState<UserGroups>(defaultUserGroup);
  const [tableData, setTableData] = useState<ActivityGroup[]>([]);
  const [selectedRowCondition, setSelectedRowCondition] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const { isAuthenticated, token } = useAuth();
  const [itemData, setItemData] = useState<DataRow[]>([]);
  const [filteredData, setFilteredData] = useState<DataRow[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState<boolean>(false);
  const [drag, setDrag] = useState<boolean>(false);
  const [call, setCall] = useState<number>(0);
  const [resetValueCall, setResetValueCall] = useState<number>(0);
  const [rowClickCall, setRowClickCall] = useState<number>(0);
  const { t } = useTranslation()
  const [selected, setSelected] = useState<object>({});
  const [selectedPod, setSelectedPod] = useState<any>('');
  const [userGroupUser, setUserGroupUser] = useState<any[]>([]);
  const [activityGroups, setActivityGroups] = useState<any[]>([]);
  const [customTableDatas, setCustomTableDatas] = useState<any[]>([]);

  const [availableResourceList, setAvailableResourceList] = useState<Document[]>([]);
  const [fullScreen, setFullScreen] = useState<boolean>(false);
  const [formValue, setFormValue] = useState({});
  const [formDatashow, setFormDatashow] = useState<UserGroups>(defaultUserGroup);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchUserGroupData = async () => {
      if (isAuthenticated && token) {
        try {
          const decryptedToken = decryptToken(token);
          const decoded: DecodedToken = jwtDecode(decryptedToken);
          setUsername(decoded.preferred_username);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

      const cookies = parseCookies();
      const site = cookies.site;
      const userId = cookies.rl_user_id;

      try {
        const item = await fetchUserGroupTop50(site);
        console.log(item, 'items');

        setItemData(item);
        setFilteredData(item);
        setCall(0)
      } catch (error) {
        console.error('Error fetching data fields:', error);
      }
    };

    fetchUserGroupData();
  }, [isAuthenticated, username, call]);

  const handleTop50 = async () => {
    const cookies = parseCookies();
    const site = cookies.site;

    try {
      const response = await fetchUserGroupTop50(site);
      setFilteredData(response);
    } catch (error) {
      console.error('Error fetching data fields:', error);
    }
  };

  const handleSearchClick = async (searchTerm: string) => {
    const cookies = parseCookies();
    const site = cookies.site;

    try {
      const userGrp = await fetchUserGrpAll(site);
      const lowercasedTerm = searchTerm.toLowerCase();
      let filtered;

      if (lowercasedTerm) {
        filtered = userGrp.filter(row =>
          Object.values(row).some(value =>
            String(value).toLowerCase().includes(lowercasedTerm)
          )
        );
      } else {
        filtered = itemData;
      }
      setFilteredData(filtered);
    } catch (error) {
      console.error('Error fetching data fields:', error);
    }
  };

  const handleAddClick = async () => {
    const hasUnsavedChanges = JSON.stringify(selectedRowData) !== JSON.stringify(formDatashow);

    if (hasUnsavedChanges && isAdding) {
      Modal.confirm({
        title: t('confirm'),
        content: t('unsavedChangesMessage'),
        okText: t('yes'),
        cancelText: t('no'),
        onOk: () => {
          resetForm();
        }
      });
    } else {
      resetForm();
    }
  };

  const handleRowSelect = (row) => {
    const hasUnsavedChanges = JSON.stringify(selectedRowData) !== JSON.stringify(formDatashow);

    if (hasUnsavedChanges && isAdding) {
      Modal.confirm({
        title: t('confirm'),
        content: t('unsavedChangesMessage'),
        okText: t('yes'),
        cancelText: t('no'),
        onOk: async () => {
          setActiveTab(0);
          setDrag(false);
          SelectRow(row);
          setSelectedRowCondition(true);
        }
      });
    } else {
      setActiveTab(0);
      setDrag(false);
      SelectRow(row);
      setSelectedRowCondition(true);
    }
  };

  const SelectRow = async (row) => {
    const cookies = parseCookies();
    const site = cookies.site;

    try {
      const currentSite = site;
      const rowData = await RetriveUserGroupSelectedRow(site, row, currentSite);

      setRowClickCall(rowClickCall + 1);
      setSelectedRowData(rowData);
      setFormDatashow(rowData);
      setIsAdding(true);
      setResetValue(false);
      setFullScreen(false);
      setSelected(rowData);
      setActiveTab(0);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching data fields:', error);
    }
  };

  const handleClose = () => {
    setIsAdding(false);
    setFullScreen(false);
  };

  const resetForm = () => {
    setActiveTab(0);
    setResetValue(true);
    setSelectedRowData(defaultUserGroup);
    setFormDatashow(defaultUserGroup);
    setIsAdding(true);
    setResetValueCall(resetValueCall + 1);
    setFullScreen(false);
    setDrag(true);
    setFormValue(null);
    setSelectedPod('');
    setUserGroupUser([]);
    setActivityGroups([]);
    setCustomTableDatas([]);
    setHasChanges(false);
  };

  return (
    <UserGrpContext.Provider value={{ 
      tableData, 
      setTableData, 
      selectedRowData, 
      setSelectedRowData, 
      selectedRowCondition, 
      setSelectedRowCondition, 
      selected, 
      setSelected, 
      activeTab, 
      setActiveTab,
      hasChanges,
      setHasChanges,
      formDatashow,
      setFormDatashow
    }}>
      <div className={styles.container}>
        <div className={styles.dataFieldNav}>
          <CommonAppBar
            onSearchChange={() => { }}
            allActivities={[]}
            username={username}
            site={null}
            appTitle={t("userGroupMaintenance")} onSiteChange={function (): void { setCall(call + 1) }} />
        </div>
        <div className={styles.dataFieldBody}>
          <div className={styles.dataFieldBodyContentsBottom}>
            <div className={`${styles.commonTableContainer} ${isAdding ? styles.shrink : ''}`}>
              <UserGroupBar handleSearchClicks={handleSearchClick} handleTop50={handleTop50} />
              <div className={styles.dataFieldBodyContentsTop}>
                <Typography className={styles.dataLength}>
                  {t("userGroup")}({filteredData ? filteredData.length : 0})
                </Typography>

                <IconButton onClick={handleAddClick} className={styles.circleButton}>
                  <AddIcon sx={{ fontSize: 30 }} />
                </IconButton>
              </div>
              <CommonTable data={filteredData} onRowSelect={handleRowSelect} />
            </div>
            <div className={`${styles.formContainer} ${isAdding ? `${styles.show} ${fullScreen ? styles.showFullScreen : styles.show}` : ''}`}>

              <UserGroupBody resetValue={resetValue} fullScreen={fullScreen} drag={drag} call={call} setCall={setCall} onClose={handleClose} isAdding={isAdding}
                setIsAdding={setIsAdding} setFullScreen={setFullScreen}
              />
            </div>
          </div>
        </div>
      </div>
    </UserGrpContext.Provider>
  );
};

export default UserGroup;

