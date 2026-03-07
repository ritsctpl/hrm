import React, { useState, useEffect, useRef, useContext } from 'react';
import styles from '../styles/ActivityMaintenance.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { parseCookies } from 'nookies';
import { Form, Input, message, Button, Modal, Tooltip } from 'antd';
import CopyIcon from '@mui/icons-material/FileCopy'; // Import Copy icon
import DeleteIcon from '@mui/icons-material/Delete'; // Import Delete icon
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ActivityMainForm from './ActivityMainForm';
import dayjs from 'dayjs';
import { createActivity, deleteActivity, updateActivity } from '@services/activityService';
import { useTranslation } from 'react-i18next';
import { ActivityContext } from '../hooks/activityContext';
import RulesTable from './ActivityRules';
import ActivityHooks from './ActivityHooks';

interface CustomData {
    customData: string;
    value: string;
}

interface CustomDataList {
    customData: string;
    value: string;
}

interface ItemData {
    activityId?: string;
    description?: string;
    category?: string;
    status?: string;
    messageType?: string;
    customDataList?: CustomData[];
}

interface DataRow {
    activityId?: string;
    description?: string;
    category?: string;
    status?: string;
    messageType?: string;
    customDataList?: CustomData[];
}

interface ActivityMaintenanceBodyProps {
    isAdding: boolean;
    selectedRowData: any | null; // Allow null

    onClose: () => void;
    setCall: (number) => void;
    setIsAdding: () => void;
    setFullScreen: (boolean) => void;
    setResetValueCall: () => void;
    setCustomDataOnRowSelect: ([]) => void;
    resetValue: boolean;
    oCustomDataList: CustomDataList[];
    customDataForCreate: CustomDataList[];
    itemData: ItemData[];
    itemRowData: ItemData[];
    call: number;
    rowClickCall: number;
    resetValueCall: number;
    availableDocuments: [];
    assignedDocuments: [];
    customDataOnRowSelect: any[];
    availableDocumentForCreate: [];
    username: string;
    addClick: boolean;
    addClickCount: number;
    setAddClick: (boolean) => void;
    fullScreen: boolean;
    payloadData: object;
    setPayloadData: () => void;
    rowSelectedData: any;
}





const ActivityMaintenanceBody: React.FC<ActivityMaintenanceBodyProps> = ({ call, setCall,
    isAdding, selectedRowData, onClose,
    customDataOnRowSelect, itemRowData,
    setFullScreen, username, setCustomDataOnRowSelect, addClickCount, setAddClick, fullScreen, rowSelectedData }) => {

    const { payloadData, setPayloadData, setShowAlert } = useContext<any>(ActivityContext);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [customData, setCustomData] = useState<CustomData[]>(selectedRowData?.customDataList || []); // Ensure it's an array
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isCopyModalVisible, setIsCopyModalVisible] = useState<boolean>(false);
    // State for copy modal input values
    const [form] = Form.useForm();
    // const [formValues, setFormValues] = useState<{ user: string; mail: string }>({ user: '', mail: '' });
    const [formValues, setFormValues] = useState<DataRow[]>([]);

    const tableRef = useRef<{ getData: () => any[] }>(null);

    useEffect(() => {
        if (customDataOnRowSelect) {
            // Handle customDataList
            if (customDataOnRowSelect) {

                setCustomData(customDataOnRowSelect);
            }

            setActiveTab(0);
        }
    }, [customDataOnRowSelect]);

    useEffect(() => {
        setActiveTab(0);

    }, [addClickCount])



    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCustomData(customData);
        setCustomDataOnRowSelect(customData)
        setActiveTab(newValue);
        setAddClick(false);
        // debugger;
    };




    useEffect(() => {

        setFormValues(itemRowData);
        setActiveTab(0);
    }, [itemRowData]);






    const handleOpenChange = () => {

        if (fullScreen == false)
            setFullScreen(true);
        else
            setFullScreen(false);

    }


    const handleClose = () => {
        onClose();
    };


    const handleSave = (oEvent) => {
        const cookies = parseCookies();
        const site = cookies.site;
        let flagToSave = true;

        const updatedRowData = {
            ...payloadData,
            userId: username,
            site: site,
            currentSite: site
        };

        // Perform the save operation with updatedRowData
        console.log("Request:", updatedRowData);

        if (payloadData.activityId == undefined || payloadData.activityId == null || payloadData.activityId == "") {
            message.error("Activity cannot be empty");
            flagToSave = false;
            return;
        }
        if (updatedRowData.url == undefined || updatedRowData.url == null || updatedRowData.url == "") {
            message.error("Class cannot be empty");
            flagToSave = false;

            return;
        }

        payloadData.activityHookList.forEach((hook) => {
            if (!hook.activity) {
                message.error("Activity cannot be empty");
                flagToSave = false;
                return;
                // Handle the case where activity is "" or undefined or null
            }
        });



        const oCreateActivity = async () => { // Rename the inner function to avoid recursion


            try {
                if (oEvent.currentTarget.innerText == "Create" || oEvent.currentTarget.innerText == "बनाएं"
                    || oEvent.currentTarget.innerText == "ರಚಿಸಿ" || oEvent.currentTarget.innerText == "உருவாக்க") {
                    const createResponse = await createActivity(updatedRowData);
                    console.log("Created response: ", createResponse);
                    if (createResponse) {
                        if (createResponse.errorCode) {
                            message.error(createResponse.message);
                        }
                        else {
                            message.success(createResponse.message_details.msg);
                            setCall(call + 1);
                            setShowAlert(false);
                            onClose();
                        }
                    }
                }

                else if (oEvent.currentTarget.innerText == "Save" || oEvent.currentTarget.innerText == "सहेजें" || oEvent.currentTarget.innerText == "ಉಳಿಸಿ" || oEvent.currentTarget.innerText == "சேமிக்க") {
                    const updateResponse = await updateActivity(updatedRowData);
                    console.log("Updated reason Code response: ", updateResponse);
                    if (updateResponse) {
                        if (updateResponse.errorCode) {
                            message.error(updateResponse.message);
                        }
                        else {
                            message.success(updateResponse.message_details.msg);
                            setCall(call + 1);
                            setShowAlert(false);
                            // onClose();
                        }
                    }

                }


            } catch (error) {
                console.error('Error creating Activity:', error);
            }
        };

        if (flagToSave == true)
            oCreateActivity();


    };




    const handleCancel = () => {
        Modal.confirm({
            title: t('confirm'),
            content: t('closePageMsg'),
            okText: t('ok'),
            cancelText: t('cancel'),
            onOk: async () => {
                // Proceed with the API call if confirmed
                onClose();
            },
            onCancel() {
                //   console.log('Action canceled');
            },
        });


    };





    const handleOpenModal = () => {
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    const handleConfirmDelete = () => {
        const oDeleteActivity = async () => { // Rename the inner function to avoid recursion
            const cookies = parseCookies();
            const site = cookies.site;

            try {
                const activityId: string = selectedRowData.activityId;
                const userId = username;
                const currentSite = site;
                debugger
                const response = await deleteActivity(site, activityId, userId, currentSite); // Assuming retrieveItem is an API call or a data fetch function
                if (!response.errorCode) {
                    message.success(response.message);
                    setCall(call + 1);
                    onClose();
                }
                else {
                    console.log("Deleted activity: ", response);
                }
            } catch (error) {
                console.error('Error deleteign activity:', error);
            }
        };

        oDeleteActivity();
        setIsModalVisible(false);
    };

    const handleOpenCopyModal = () => {
        // debugger
        setIsCopyModalVisible(true);
        // Optionally reset form fields
        form.resetFields();
        form.setFieldsValue({
            activityId: selectedRowData.activityId + "_COPY" || '',
            description: ''
        });
    };

    const handleCloseCopyModal = () => {
        setIsCopyModalVisible(false);
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const { value } = e.target;
        let formattedValue = value;

        if (fieldName != 'description') {
            formattedValue = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        }

        // Set field value
        form.setFieldsValue({ [fieldName]: formattedValue });
    };



    const handleConfirmCopy = () => {
        form
            .validateFields()
            .then((values) => {
                // Add your copy logic here with the form values
                const cookies = parseCookies();
                const site = cookies.site;
                const updatedRowData: any = {
                    ...payloadData,
                    site: site,
                    userId: username,
                    currentSite: site
                };
                updatedRowData.activityId = values.activityId;
                updatedRowData.description = values.description;
                // Perform the save operation with updatedRowData
                delete updatedRowData.createdDateTime;
                delete updatedRowData.modifiedDateTime;
                console.log("Copy request:", updatedRowData);

                if (updatedRowData.activityId == null || updatedRowData.activityId == "" || updatedRowData.activityId == undefined) {
                    message.error("Activity Id cannot be empty");
                    return;
                }

                const oCopyActivity = async () => { // Rename the inner function to avoid recursion

                    try {

                        const copyResponse = await createActivity(updatedRowData);
                        console.log("Copy activity id response: ", copyResponse);
                        if (copyResponse.errorCode) {
                            message.error(copyResponse.message);
                        }
                        else {
                            setCall(call + 1);
                            message.success(copyResponse.message_details.msg);
                            setShowAlert(false);
                            onClose();
                        }



                    } catch (error) {
                        console.error('Error copying activity:', error);
                    }
                };

                oCopyActivity();
                setIsCopyModalVisible(false);
            })
            .catch((errorInfo) => {
                console.log('Validation Failed:', errorInfo);
            });
    };


    const { t } = useTranslation();


    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 250px',  }}>
                        <ActivityMainForm rowSelectedData={rowSelectedData} onChange={function (values: Record<string, any>): void {
                            throw new Error('Function not implemented.');
                        }} />
                    </div>
                )



            case 1:
                return (
                    <RulesTable payloadData={undefined} setPayloadData={function (): void {
                        throw new Error('Function not implemented.');
                    }}
                    />
                );

            case 2:
                return (
                    <ActivityHooks
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <div className={styles.dataFieldBodyContents}>
                    <div className={isAdding ? styles.heading : styles.headings}>
                        <div className={styles.split}>
                            <div>
                                <p className={styles.headingtext}>
                                    {selectedRowData ? selectedRowData.activityId : t('createActivity')}
                                </p>
                                {selectedRowData && (
                                    <>

                                        <p className={styles.dateText}>
                                            {t('createdDate')}
                                            <span className={styles.fadedText}>
                                                {selectedRowData.createdDateTime
                                                    ? dayjs(selectedRowData.createdDateTime).format('DD-MM-YYYY HH:mm:ss')
                                                    : 'N/A'}
                                            </span>
                                        </p>
                                        <p className={styles.dateText}>
                                            {t('modifiedTime')}
                                            <span className={styles.fadedText}>
                                                {selectedRowData.modifiedDateTime
                                                    ? dayjs(selectedRowData.modifiedDateTime).format('DD-MM-YYYY HH:mm:ss')
                                                    : 'N/A'}
                                            </span>
                                        </p>

                                    </>
                                )}
                            </div>

                            <div className={styles.actionButtons}>
                                <Tooltip title={fullScreen ? "Exit Full Screen" : "Enter Full Screen"}>
                                    <Button
                                        onClick={handleOpenChange}
                                        className={styles.actionButton}
                                    >
                                        {fullScreen ? <CloseFullscreenIcon sx={{ color: '#1874CE' }} /> : <OpenInFullIcon sx={{ color: '#1874CE' }} />}
                                    </Button>
                                </Tooltip>

                                {selectedRowData && (
                                    <>
                                        <Tooltip title="Copy">
                                            <Button onClick={handleOpenCopyModal} className={styles.actionButton}>
                                                <CopyIcon sx={{ color: '#1874CE' }} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <Button onClick={handleOpenModal} className={styles.actionButton}>
                                                <DeleteIcon sx={{ color: '#1874CE' }} />
                                            </Button>
                                        </Tooltip>
                                    </>
                                )}

                                <Tooltip title="Close">
                                    <Button onClick={handleClose} className={styles.actionButton}>
                                        <CloseIcon sx={{ color: '#1874CE' }} />
                                    </Button>
                                </Tooltip>
                            </div>


                        </div>
                    </div>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Item Maintenance Tabs">
                            <Tab label={t("main")} />
                            <Tab label={t("activityRules")} />
                            <Tab label={t("activityHooks")} />
                        </Tabs>
                    </Box>
                    <Box sx={{ padding: 2 }}>
                        {renderTabContent()}
                    </Box>
                </div>
            </div>
            <footer className={styles.footer}>
                <div className={styles.floatingButtonContainer}
                    style={{ position: 'fixed', bottom: '40px', right: '20px', display: 'flex', flexDirection: 'row', gap: '10px' }}
                >
                    <Button type='primary'
                        // className={`${styles.floatingButton}`}
                        onClick={handleSave}
                        style={{ width: 'auto', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {selectedRowData ? t("save") : t("create")}
                    </Button>
                    <Button
                        className={` ${styles.cancelButton}`}
                        onClick={handleCancel}
                        style={{ width: 'auto', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {t("cancel")}
                    </Button>
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
                <p>{t("deleteMessage")}: <strong>{selectedRowData?.activityId}</strong>?</p>
            </Modal>
            <Modal
                title={t("confirmCopy")}
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
                    initialValues={{
                        activityId: selectedRowData?.activityId || '',
                        description: ''
                    }}
                >
                    <Form.Item
                        label={t("activityId")}
                        name="activityId"
                        rules={[{ required: true, message: 'Please enter the activity' }]}
                    >
                        <Input placeholder="" onChange={(e) => handleFieldChange(e, 'activityId')} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={t("description")}
                    >
                        <Input placeholder="" onChange={(e) => handleFieldChange(e, 'description')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>



    );
};

export default ActivityMaintenanceBody;