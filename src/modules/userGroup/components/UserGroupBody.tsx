import React, { useState, useEffect, useContext } from 'react';
import styles from '../styles/UserGroup.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { parseCookies } from 'nookies';
import { Form, Input, message, Modal, Tooltip } from 'antd';
import CopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Tabs, Tab, Button } from '@mui/material';
import dayjs from 'dayjs';
import CustomData from './CustomData';
import UserGroupForm from './UserGroupForm';
import UserGroupUser from './UserGroupUser';
import ActivityGroup from './ActivityGroup';
import { CreateUserGroup, UpdateUserGroup, createCopyUserGroup, deleteUserGroup } from '@services/userGroupService';
import { useTranslation } from 'react-i18next';
import { UserGrpContext } from '../hooks/useContext/UserGroupUseContext';
import ActivityGroupTab from './ActivityGroupTab';



interface AlternateComponent {
}

interface CustomData {
    customData: string;
    value: string;
}

interface PrintDocument {
    document: string;
}

interface ItemMaintenanceBodyProps {
    isAdding: boolean;
    drag: boolean;
    fullScreen: boolean;
    onClose: () => void;
    setCall: (val: number) => void;
    setIsAdding: (val: boolean) => void;
    setFullScreen: (val: boolean) => void;
    resetValue: boolean;
    call: number;
}

const UserGroupBody: React.FC<ItemMaintenanceBodyProps> = ({ fullScreen, setIsAdding, drag, call, setCall, isAdding, onClose, resetValue, setFullScreen }) => {

    const { selectedRowData, setSelectedRowData, selected, setSelected, activeTab, setActiveTab } = useContext<any>(UserGrpContext)

    const { t } = useTranslation()
    const [form] = Form.useForm();
    const [userGroupUsers, setUserGroupUsers] = useState<AlternateComponent[]>([]);
    const [activityGroup, setActivityGroup] = useState<AlternateComponent[]>([]);
    const [customTableData, setCustomTableData] = useState<AlternateComponent[]>([]);
    
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isCopyModalVisible, setIsCopyModalVisible] = useState<boolean>(false);
    const [formValues, setFormValues] = useState([]);
    const [oper, setOper] = useState<boolean>(false);

    useEffect(() => {
        if (resetValue) {
            setUserGroupUsers([])
            setActivityGroup([])
            setCustomTableData([])
        }
    }, [resetValue]);

    const handleOpenChange = () => {
        setFullScreen(true);
    }

    const handleCloseChange = () => {
        setFullScreen(false);
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleClose = () => {
        onClose();
    };

    const handleSave = async () => {

        const errors = [];

        if (!selectedRowData?.userGroup) {
            errors.push('User Group');
        }

        if (errors.length > 0) {
            message.error(`Please fill in the following required fields: ${errors.join(', ')}.`);
            return;
        }

        try {
            if (selectedRowData?.createdDateTime || selectedRowData?.handle) {
                const cookies = parseCookies();
                const site = cookies.site;
                const userId = cookies.rl_user_id

                const payload = {
                    ...selectedRowData,
                    pod: selectedRowData?.pod,
                    site: site,
                    currentSite: site,
                }
                const response = await UpdateUserGroup(site, userId, payload);
                console.log(response, 'response');

                if (response.message) {
                    message.error(response.message)
                }
                else {
                    message.success(response.message_details.msg)
                    setSelectedRowData(response.response)
                    setSelected(response.response)
                    setCall(call + 1);
                    setActiveTab(0)
                }
            } else {
                const cookies = parseCookies();
                const site = cookies.site;
                const userId = cookies.rl_user_id;
                
                const { availableusers, currentSite, ...dataWithoutExcludedFields } = selectedRowData;
                const payload = {
                    ...dataWithoutExcludedFields,
                    site: site
                }
                
                console.log(payload, 'CreateUserGrouppayload');
                const response = await CreateUserGroup(site, userId, payload);
                console.log(response, 'CreateUserGroup');
                
                if (response.message) {
                    message.error(response.message)
                }
                else {
                    message.success(response.message_details.msg)
                    setIsAdding(false);
                    setCall(call + 1);
                }
            }
        } catch (error) {
            message.error('An error occurred while saving the User Group.');
        }
    }

    const handleCancel = () => {
        onClose();
        setOper(true)
    };

    const handleOpenModal = () => {
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
    };


    const handleConfirmDelete = () => {
        const deleteUserGroups = async () => {
            const cookies = parseCookies();
            const site = cookies.site;
            const userId = cookies.rl_user_id;

            try {
                const payload = selectedRowData;
                const currentSite = site;
                const oDeleteUserGroup = await deleteUserGroup(site, userId, payload, currentSite);

                setCall(call + 1);
                onClose();
                if (!oDeleteUserGroup.errorCode) {
                    message.success(oDeleteUserGroup.message_details.msg);
                    setCall(call + 1);
                    onClose();
                    setIsModalVisible(false);
                    setIsAdding(false)
                }
                else {
                    setCall(call + 1);
                    setIsAdding(false)
                }
            } catch (error) {
                console.error('Error fetching data fields:', error);
            }
        };

        deleteUserGroups();
        setIsModalVisible(false);
    };

    const handleOpenCopyModal = () => {
        setIsCopyModalVisible(true);
        form.resetFields();
        form.setFieldsValue({
            userGroup: selectedRowData?.userGroup ? `${selectedRowData?.userGroup}_COPY` : '',
            description: selectedRowData?.description || '',
        });
    };

    const handleCloseCopyModal = () => {
        setIsCopyModalVisible(false);
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const { value } = e.target;
        const formattedValue = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        form.setFieldsValue({ [fieldName]: formattedValue });
    };

    console.log(selectedRowData,"selectedRowData");
    


    const handleConfirmCopy = async () => {
        const cookies = parseCookies();
        const site = cookies.site;
        const userId = 'senthil';
        try {
            const values = await form.validateFields();

            const updatedRowData = {
                ...selectedRowData,
                site: site,
                userGroup: values?.userGroup,
                description: values?.description,
                pod: selectedRowData?.pod
            };
            const response = await createCopyUserGroup(site, userId, updatedRowData);
            setCall(call + 1);
            onClose();

            handleCloseCopyModal();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleFormValuesChange = (values) => {
        setFormValues(values);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <UserGroupForm />
                );
            case 1:
                return (
                    <UserGroupUser drag={drag} />
                ); 
            // case 2:
            //     return (
            //         <ActivityGroup drag={drag} />
            //     );
            case 2:
                return (
                    <ActivityGroupTab />
                );
            case 3:
                return (
                    <CustomData />
                );
            default:
                return null;
        }
    };

    console.log(selected, 'selected');


    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <div className={styles.dataFieldBodyContents}>
                    <div className={isAdding ? styles.heading : styles.headings}>
                        <div className={styles.split}>
                            <div>
                                <p className={styles.headingtext}>
                                    {selectedRowData?.createdDateTime || selectedRowData?.handle ? selected?.userGroup : t("createUserGroup")}
                                </p>
                                {(selectedRowData?.createdDateTime || selectedRowData?.handle) && (
                                    <>
                                        <p className={styles.dateText}>
                                            {t('description')} :
                                            <span className={styles.fadedText}>{selected?.description || ''}</span>
                                        </p>
                                        <p className={styles.dateText}>
                                            {t('createdOn')} :
                                            <span className={styles.fadedText}>
                                                {dayjs(selectedRowData?.createdDateTime).format('DD-MM-YYYY HH:mm:ss') || ''}
                                            </span>
                                        </p>
                                        <p className={styles.dateText}>
                                            {t('modifiedOn')} :
                                            <span className={styles.fadedText}>
                                                {dayjs(selectedRowData?.modifiedDateTime).format('DD-MM-YYYY HH:mm:ss') || ''}
                                            </span>
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className={styles.actionButtons}>
                                {
                                    fullScreen ?
                                        <Tooltip title="Exit Ful Screen">
                                            <Button onClick={handleCloseChange} className={styles.actionButton}>
                                                <CloseFullscreenIcon />
                                            </Button>
                                        </Tooltip> :
                                        <Tooltip title="Enter Full Screen">
                                            <Button onClick={handleOpenChange} className={styles.actionButton}>
                                                <OpenInFullIcon />
                                            </Button>
                                        </Tooltip>
                                }

                                {(selectedRowData?.createdDateTime || selectedRowData?.handle) && (
                                    <>
                                        <Tooltip title="Copy">
                                            <Button onClick={handleOpenCopyModal} className={styles.actionButton}>
                                                <CopyIcon />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <Button onClick={handleOpenModal} className={styles.actionButton}>
                                                <DeleteIcon />
                                            </Button>
                                        </Tooltip>
                                    </>
                                )}

                                <Tooltip title="Close">
                                    <Button onClick={handleClose} className={styles.actionButton}>
                                        <CloseIcon />
                                    </Button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label="User Group Tabs">
                            <Tab label={t("main")} />
                            <Tab label={t("users")} />
                            {/* <Tab label={t("activityGroup")} /> */}
                            <Tab label={t("activityGroup")} />
                            <Tab label={t("customData")} />
                        </Tabs>
                    </Box>
                    <Box sx={{ padding: 2 }}>
                        {renderTabContent()}
                    </Box>
                </div>
            </div>
            <footer className={styles.footer}>
                <div className={styles.floatingButtonContainer}>
                    <button
                        className={`${styles.floatingButton} ${styles.saveButton}`}
                        onClick={handleSave}
                    >
                        {(selectedRowData?.createdDateTime || selectedRowData?.handle) ? t("save") : t("create")}
                    </button>
                    <button
                        className={`${styles.floatingButton} ${styles.cancelButton}`}
                        onClick={handleCancel}
                    >
                        {t("cancel")}
                    </button>
                </div>
            </footer>
            <Modal
                title={t("confirmDelete")}
                open={isModalVisible}
                onOk={handleConfirmDelete}
                onCancel={handleCloseModal}
                okText={t("delete")}
                cancelText={t("cancel")}
                centered
            >
                <p>{t("deleteConfirmation")} <strong>{selectedRowData?.userGroup}</strong>?</p>
            </Modal>
            <Modal
                title={t("copyUserGroup")}
                open={isCopyModalVisible}
                onOk={handleConfirmCopy}
                onCancel={handleCloseCopyModal}
                okText={t("copy")}
                cancelText={t("cancel")}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        label={t("userGroup")}
                        name="userGroup"
                        rules={[{ required: true, message: 'Please enter the User Group' }]}
                    >
                        <Input placeholder="Enter User Group" onChange={(e) => handleFieldChange(e, 'userGroup')} />
                    </Form.Item>
                    <Form.Item
                        label={t("description")}
                        name="description"
                        rules={[{ required: true, message: 'Please enter the description' }]}
                    >
                        <Input placeholder="Enter description" onChange={(e) => handleFieldChange(e, 'description')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserGroupBody;