import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/ShiftForm.module.css';
import { parseCookies } from 'nookies';
import CommonAppBar from '@components/CommonAppBar';
import { useAuth } from '@/context/AuthContext';
import ShiftForm from './TabNavigation';
import jwtDecode from 'jwt-decode';
import { Input, Button, Modal, message, Form } from 'antd';
import { ColumnsType } from 'antd/es/table';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CopyIcon from '@mui/icons-material/FileCopy';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import AddIcon from '@mui/icons-material/Add';
import DynamicTable from './DynamicTable';
import { decryptToken } from '@/utils/encryption';
import { UserContext } from '../hooks/userContext';
import { User, DecodedToken, OperationData, DefaultUserData } from '../types/userTypes';
import FilterCommonBar from './FilterCommonBar';
import { IconButton, Tooltip, Typography } from '@mui/material';
import { copyAllUser, deleteUser, fetchUserAll, fetchUserGroup, fetchUserTop50 } from '@services/userService';
import { CreateKeycloakUser, DeleteKeycloakUser } from '@/app/api/auth/keycloakCredentials';
import dayjs from 'dayjs';
import CryptoJS from 'crypto-js';
import { log } from 'console';

const UserMaintenance = () => {
  const { t } = useTranslation()
  const { isAuthenticated, token } = useAuth();
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<User>(DefaultUserData);
  const [formDatashow, setFormDatashow] = useState<User>(DefaultUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [call, setCall] = useState(0);
  const [callUser, setCallUser] = useState(0);
  const [filter, setFilter] = useState('');
  const [data, setData] = useState<OperationData[]>([]);
  const [shifts, setShifts] = useState<OperationData[]>([]);
  const [erpShift, setErpShift] = useState(false);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isModalVisibleCopy, setIsModalVisibleCopy] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [copyUser, setCopyUser] = useState('');
  const [description, setDescription] = useState('');
  const [isAltered, setIsAletered] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [isPlusClicked, setIsPlusClicked] = useState<number>(0);
  const [availableUG, setAvailableUG] = useState<any>();
  const [assignedUG, setAssignedUG] = useState<any>();
  const [selectedSites, setSelectedSites] = useState<any>([]);
  const [copyUserDetails, setCopyUserDetails] = useState<any>();

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const cookies = parseCookies();
  const roles = cookies.role;
  const ENCRYPTION_KEY = 'fenta@123';

  // console.log(roles, "roles");
  

  const hasRequiredRole = (roles) => {
    return roles?.includes('Add Credential') && roles?.includes('USER');
  };

  useEffect(() => {
    const fetchShiftData = async () => {
      {
        isEditing && !erpShift ?
          handleCancel() : null
      }
      if (isAuthenticated && token) {
        try {
          const decryptedToken = decryptToken(token);
          const decoded: DecodedToken = jwtDecode(decryptedToken);
          console.log(decoded, "decoded");

          setUsername(decoded.preferred_username);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
      const cookies = parseCookies();
      const site = cookies.site;
      setSite(site);
      try {
        const userData = await fetchUserTop50();

        const extractedData = userData.map(({ user,firstName, lastName, status }) => ({
          user,
          firstName,
          lastName,
          status
        }));

        setShifts(extractedData);
        setData(extractedData || []);
      } catch (error) {
        console.error('Error fetching shifts:', error);
      }

    };

    fetchShiftData();
    // console.log("From datas: ",formData)
  }, [call, isAuthenticated, token, site]);




  const handleConfirm = async () => {
    setIsModalVisible(false); // Close the modal
    setIsAletered(false);
    try {
      await fetchShiftData(selectedRowKey);
    } catch (error) {
      console.error('Error fetching shift details:', error);
    }
  };

  const fetchShiftData = async (user) => {
    try {
      const currentSite = site;
      let userData = await fetchUserAll(user);
      // debugger
      const encryptedPassword = userData?.password;
      const decryptPassword = (encryptedPassword: string): string => {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
          return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
          console.error('Decryption error:', error);
          throw new Error('Failed to decrypt password');
        }
      };

      userData.password = decryptPassword(encryptedPassword) || encryptedPassword;
      

      setSelectedSites(userData.site);
      // Update the form data with the data returned from the API
      setFormData(userData);
      setFormDatashow(userData)
      setCopyUser(`${userData.user}_copy`)

      // Set ERP shift and editing states to true
      setErpShift(true);
      setIsEditing(true);

      // Trigger the animation by setting the appropriate class
      setAnimationClass('showing');
    } catch (error) {
      console.error('Error fetching shift details:', error);
    }
  };

  const handleCancel = () => {
    setTimeout(() => {
      setSelectedRowKey(null);
      setFormData(DefaultUserData);
      setIsEditing(false);
      setErpShift(false);
      setAnimationClass('');
      setIsFullScreen(false)
      setSelectedSites([]);
    }, 1000);
  };

  const handleCancelClick = () => {
    Modal.confirm({
      title: t('closePageMsg'),
      okText: t('yes'),
      cancelText: t('no'),
      onOk() {
        setTimeout(() => {
          setSelectedRowKey(null);
          setFormData(DefaultUserData);
          setIsEditing(false);
          setErpShift(false);
          setAnimationClass('');
          setIsFullScreen(false);
          setSelectedSites([]);
        }, 1000);
      },
      onCancel() {
        // Optional: Handle actions if the user cancels
      },
    });
  };


  const handleFilter = async () => {
    const response = await fetchUserTop50()
    const filteredData = response.filter(row =>
      row.shiftName.toLowerCase().includes(filter.toLowerCase()) ||
      row.description.toLowerCase().includes(filter.toLowerCase()) ||
      row.shiftType.toLowerCase().includes(filter.toLowerCase())
    );
    setData(filteredData);


    setCurrentPage(1);
  };

  const handleRowClick = async (record) => {
    setSelectedRowKey(record.user);
    setActiveTab('1');

    if (isAltered)
      setIsModalVisible(true);
    else {
      setIsModalVisible(false);
      await fetchShiftData(record.user);
    }

    const cookies = parseCookies();
    const site = cookies.site;
    let response = null;
    // console.log("From data for user group: ", formData);
    if (formData.user == "") {
      let payLoadUser = ""
      response = await fetchUserGroup(site, payLoadUser);
    }
    else {
      response = await fetchUserGroup(site, formData.user);
    }
    // const response = await fetchUserGroup(site, payLoadUser,isEditing,erpShift)
    console.log(response);

    let availableUserGroupList = response.availableUserGroupList;
    availableUserGroupList = availableUserGroupList?.map((item, index) => ({
      ...item,
      id: index
    }))
    setAvailableUG(availableUserGroupList);
    setAssignedUG([]);

  };

  const handleAdd = async () => {
    setSelectedRowKey(null);
    setFormData(DefaultUserData);
    setIsEditing(true);
    setErpShift(false);
    setCallUser(callUser + 1)
    setActiveTab('1');
    setIsPlusClicked(isPlusClicked + 1);
    setIsAletered(false);
    setSelectedSites([]);

    const cookies = parseCookies();
    const site = cookies.site;
    let response = null;
    // console.log("From data for user group: ", formData);
    if (formData.user == "") {
      let payLoadUser = ""
      response = await fetchUserGroup(site, payLoadUser);
    }
    else {
      response = await fetchUserGroup(site, formData.user);
    }
    // const response = await fetchUserGroup(site, payLoadUser,isEditing,erpShift)
    console.log(response);

    const availableUserGroupList = response.availableUserGroupList;
    setAvailableUG(availableUserGroupList);
    setAssignedUG([]);
  };

  const handleDelete = async () => {
    if (selectedRowKey) {
      Modal.confirm({
        title: `${t('areYouSure')} ${selectedRowKey}?`,
        okText: t('delete'),
        okType: 'danger',
        cancelText: t('cancel'),
        onOk: async () => {
          debugger
          const cookies = parseCookies();
          const site = cookies.site;
          const userId = cookies.rl_user_id;
          const user = formData.user
          const siteArray = formData.site
          try {
            const keyCloakUser = {
              data: {
                user: formData.user
              }
            };
            const keyres = await DeleteKeycloakUser(keyCloakUser);
            if (keyres.succes) {
              const currentSite = site;
              const userGroups = formData?.userGroups as any
              const res = await deleteUser( siteArray, userId, { user }, currentSite, userGroups);

              if (res.message) {
                message.error(res.message)
              }
              else {
                message.success(res.message_details.msg);
                handleCancel();
                setCall(call + 1);
              }
            } else {
              message.error(keyres.error)
            }
          } catch (error) {
            message.error('Error deleting user.');
          }
        },
      });
    }
  };

  const handleCancelCopy = () => {
    setIsModalVisibleCopy(false);
    // setCopyUser('')
    setDescription('')
  };

  const handleCopyAll = async () => {
    message.destroy();
    if (!copyUser) {
      message.error('User cannot be empty.');
      return
    }
    if (!copyUserDetails?.firstName) {
      message.error('First Name cannot be empty.');
      return
    }
    if (!copyUserDetails?.lastName) {
      message.error('Last Name cannot be empty.');
      return
    }
    if (!copyUserDetails?.password) {
      message.error('Password cannot be empty.');
      return
    }
    if (!copyUserDetails?.confirmPassword) {
      message.error('Confirm Password cannot be empty.');
      return
    }

    if (copyUserDetails?.password !== copyUserDetails?.confirmPassword) {
      message.error('Password and Confirm Password do not match.');
      return;
    }

    setIsModalVisible(false);
    const cookies = parseCookies();
    const site = cookies.site;
    const userId = cookies.rl_user_id;

    const payload = {
      ...formData,
      user: copyUser,

      firstName: copyUserDetails?.firstName,
      lastName: copyUserDetails?.lastName,
      password: copyUserDetails?.password,
      confirmPassword: copyUserDetails?.confirmPassword,

      localDateTime: new Date().toISOString(),
    };

    console.log("Copy Request: ", payload);
    try {
      const response = await copyAllUser(site, userId, payload);
      // const response = [] as any;
      if(!response?.errorCode){
      const ResponseMessage = response?.message_details?.msg;
      message.success(ResponseMessage);
      setIsModalVisibleCopy(false);
      setCall(call + 1);

      const keyCloakUser = {
        data: {
          user: copyUser,
          firstName: copyUserDetails?.firstName,
          lastName: copyUserDetails?.lastName,
          emailAddress: formData.emailAddress,
          password: copyUserDetails?.password,
        },
      };
      const keyres = await CreateKeycloakUser(keyCloakUser);
      console.log("Keycloak user creation response: ", keyres);

    }
    else{
      message.error(response?.errorMessage);
    }
    } catch (error) {
      message.error('Error copying shifts.');
    }
  };

  const handleTableChange = (pagination: any) => setCurrentPage(pagination.current);

  // const handleSelectChange = (value: string, name: string) => setFormData(prevFormData => ({ ...prevFormData, [name]: value }));

  const columnTitleMap: { [key: string]: string } = {
    operation: t('operation'),
    revision: t('revision'),
    description: t('description'),
    status: t('status'),
    operationType: t('operationType'),
    currentVersion: t('currentVersion'),
  };

  // Create columns based on the data
  const createDynamicColumns = (data: OperationData[]): ColumnsType<OperationData> => {


    if (data.length === 0) {
      return [];
    }

    const keys = Object.keys(data[0]);

    return keys.map(key => ({
      title: t(columnTitleMap[key] || key), // Use the mapping for column titles
      dataIndex: key,
      ellipsis: true,
      key: key,
      render: (text: any) => {
        // Handle rendering boolean values
        if (typeof text === 'boolean') {
          return text ? t('yes') : t('no');
        }
        return text;
      },
    }));
  };

  const columns = createDynamicColumns(data);

  const handleSiteChange = (newSite: string) => {
    setSite(newSite);
    // Optionally, handle any additional logic required when the site changes
  };
  const handleSetData = (data: OperationData[]) => {
    setData(data);
  };

  const handleCopyLiveChange = (field: string, value: string) => {
    // debugger


    setCopyUserDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <UserContext.Provider value={{
      callUser, isFullScreen, setIsFullScreen, erpShift, isEditing, setErpShift, setIsEditing,
      formData, setFormData, call, setCall, isModalVisible, setIsModalVisible, isAltered, setIsAletered, activeTab, setActiveTab,
      isPlusClicked, setIsPlusClicked, availableUG, setAvailableUG, assignedUG, setAssignedUG, selectedSites, setSelectedSites
    }}>
      <CommonAppBar
        allActivities={allActivities}
        username={username}
        site={site}
        appTitle={`${t("userHeaderTitle")}`}
        // onSiteChange={handleSiteChange}
        onSiteChange={function (): void { setCall(call + 1) }}
        onSearchChange={function (): void { }} />

      <div className={styles.container}>
        <div className={`${styles.tableContainer} ${isFullScreen ? styles.fullScreenFirst : styles.halfScreen} ${isEditing ? styles.shrink : ''}`}>

         
          <FilterCommonBar onSearch={handleFilter} setData={handleSetData} />
          <div className={styles.dataFieldBodyContentsTop}>
            <Typography className={styles.dataLength}>
              {t("user")} ({data ? data.length : 0})
            </Typography>

            <IconButton onClick={handleAdd} className={styles.circleButton}>
              <AddIcon sx={{ fontSize: 30 }} />
            </IconButton>
          </div>

          <DynamicTable
            columns={columns}
            data={data}
            currentPage={currentPage}
            pageSize={pageSize}
            handleRowClick={(handleRowClick)}
            handleTableChange={handleTableChange}
            setCurrentPage={setCurrentPage}
            selectedRowKey={selectedRowKey}
            pagination={false}
            scroll={{ y: 'calc(100vh - 300px)' }}
          />
        </div>
        {(selectedRowKey || isEditing) && (
          <div className={`${styles.detailsAndFormContainer} ${isFullScreen ? styles.fullScreen : styles.halfScreen} ${animationClass}`}>
            <div className={styles.topHeaderIcon}>
              {(selectedRowKey && isEditing) ? (
                <div className={`${styles.detailsContainers} ${styles.compactSpacing}`}>
                  <div><h4>{formDatashow.user}</h4><p>{t('status')}: <span>{formDatashow.status}</span></p> </div>
                  <div>
                    <p>{t('createdOn')}: <span>{formData.createdDateTime ? dayjs(formData.createdDateTime).format('DD-MM-YYYY HH:mm:ss') : 'N/A'}</span></p>
                    <p>{t('modifiedOn')}: <span>{formData.modifiedDateTime ? dayjs(formData.modifiedDateTime).format('DD-MM-YYYY HH:mm:ss') : 'N/A'}</span></p>
                  </div>
                </div>
              ) : (
                <h3 className={styles.createShiftTitle}>{`${t('create')} ${t('user')}`}</h3>
              )}
              {isEditing && (
                <div className={styles.formHeader}>
                  <Button
                    onClick={toggleFullScreen}
                    className={styles.actionButton}
                    aria-label={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                  >
                    <Tooltip title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}>
                      {isFullScreen ? (
                        <CloseFullscreenIcon sx={{ color: '#1874CE' }} />
                      ) : (
                        <OpenInFullIcon sx={{ color: '#1874CE' }} />
                      )}
                    </Tooltip></Button>

                  {erpShift ? (
                    <>

                      <Tooltip title="Copy">
                        <Button
                          onClick={() => { setIsModalVisibleCopy(true); setCopyUser(`${formData.user}_copy`);  
                          setCopyUserDetails(prev => ({
                            ...formData,
                            user: '',
                            firstName: '',
                            lastName: '',
                            password: '',
                            confirmPassword: ''
                          }));
                         }}
                          disabled={!hasRequiredRole(roles)}
                          className={styles.actionButton}
                        >
                          <CopyIcon sx={{ color: '#1874CE' }} />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <Button
                          onClick={handleDelete}
                          disabled={!hasRequiredRole(roles)}
                          className={styles.actionButton}
                        >
                          <DeleteIcon sx={{ color: '#1874CE' }} />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Close">
                        <Button onClick={handleCancel} className={styles.actionButton}>
                          <CloseIcon sx={{ color: '#1874CE' }} />
                        </Button>
                      </Tooltip>
                    </>
                  ) : (

                    <Tooltip title="Close">
                      <Button onClick={handleCancelClick} className={styles.actionButton}>
                        <CloseIcon sx={{ color: '#1874CE' }} />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
            {isEditing && (
              <ShiftForm onCancel={handleCancelClick} username={username} />
            )}
          </div>
        )}
        <Modal
          title={t('confirmation')}
          open={isModalVisible}
          onOk={handleConfirm}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedRowKey(null); // Clear the selected row key
          }}
          okText={t('confirm')}
          cancelText={t('cancel')}
        >
          <p>{t('alertRow')}</p>
        </Modal>

        <Modal
          title={<div style={{ textAlign: 'center' }}>{`${t('copy')} ${t('user')}`}</div>}
          open={isModalVisibleCopy}
          onOk={handleCopyAll}
          onCancel={handleCancelCopy}
          okText={t('confirm')}
          cancelText={t('cancel')}
        >

          <Form layout="vertical" style={{ width: '100%' }}>
            <Form.Item label={t('user')} required>
              <Input
                value={copyUser}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\s+/g, '') // Remove spaces
                    .toLowerCase() // Convert to lowercase
                    .replace(/[^a-z0-9_]/g, ''); // Allow only lowercase letters, numbers, and underscores
                  setCopyUser(value);
                  handleCopyLiveChange('user', value); // Call function on change
                }}
                placeholder={t('enter') + ' ' + t('user')}
              />
            </Form.Item>
            <Form.Item label={t('firstName')} required>
              <Input
                value={copyUserDetails?.firstName}
                onChange={(e) => {
                  const value = e.target.value
                  .replace(/\s+/g, '') // Remove spaces
                  .replace(/[^a-zA-Z0-9_]/g, ''); // Allow only letters, numbers, and underscores
                  handleCopyLiveChange('firstName', value.toUpperCase()); // Call function on change
                }}
                placeholder={t('enter') + ' ' + t('firstName')}
              />
            </Form.Item>
                <Form.Item label={t('lastName')} required>
              <Input
                value={copyUserDetails?.lastName}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\s+/g, '') // Remove spaces
                    .replace(/[^a-zA-Z0-9_]/g, ''); // Allow only letters, numbers, and underscores
                  handleCopyLiveChange('lastName', value.toUpperCase()); // Convert to uppercase and call function on change
                }}
                placeholder={t('enter') + ' ' + t('lastName')}
              />
            </Form.Item>
            <Form.Item label={t('password')} required>
              <Input.Password
                value={copyUserDetails?.password}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s+/g, '');
                  handleCopyLiveChange('password', value); // Call function on change
                }}
                placeholder={t('enter') + ' ' + t('password')}
              />
            </Form.Item>
            <Form.Item label={t('confirmPassword')} required>
              <Input.Password
                value={copyUserDetails?.confirmPassword}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s+/g, '');
                  handleCopyLiveChange('confirmPassword', value); // Call function on change
                }}
                placeholder={t('enter') + ' ' + t('confirmPassword')}
              />
            </Form.Item>
          </Form>


        </Modal>

      </div>
    </UserContext.Provider>
  );
};

export default UserMaintenance;
