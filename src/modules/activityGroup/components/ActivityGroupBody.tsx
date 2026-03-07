import React, { useState, useEffect, useContext } from 'react';
import styles from '../styles/activityGroup.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { parseCookies } from 'nookies';
import { Form, Input, message, Modal, Tooltip } from 'antd';
import CopyIcon from '@mui/icons-material/FileCopy'; // Import Copy icon
import DeleteIcon from '@mui/icons-material/Delete'; // Import Delete icon
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Tabs, Tab, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ActivityGrpContext } from '../hooks/ActivityGrpUseContext';
import ActivityGroupTransfer from './ActivityGroupTransfer';
import dayjs from 'dayjs';
import { CreateActivityGroup, UpdateActivityGroup, createCopyActivityGroup, deleteActivityGroup } from '@services/activityGroupService';
import { defaultActivityGroupRequest } from '../types/activityGrpTpes';

interface ActivityGroupBodyProps {
    isAdding: boolean;
    selected: any;
    drag: boolean;
    fullScreen: boolean;
    resetValue: boolean;
    call: number;
    onClose: () => void;
    setCall: (val: number) => void;
    setIsAdding: (val: boolean) => void;
    setFullScreen: (val: boolean) => void;
}

const ActivityGroupBody: React.FC<ActivityGroupBodyProps> = ({ selected,
    fullScreen, setIsAdding, drag, call, setCall, isAdding, onClose,
    resetValue, setFullScreen }) => {

    const { formData, setFormData, activeTab, setActiveTab, setFormChange, formChange } = useContext<any>(ActivityGrpContext)
    const { t } = useTranslation()
    const [form] = Form.useForm();
    const [forms] = Form.useForm();
    const [userGroupUsers, setUserGroupUsers] = useState<any>([]);
    const [activityGroup, setActivityGroup] = useState<any>([]);
    const [customTableData, setCustomTableData] = useState<any>([]);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isCopyModalVisible, setIsCopyModalVisible] = useState<boolean>(false);
    const [oper, setOper] = useState<boolean>(false);

    useEffect(() => {
        if (formData) {
            forms.setFieldsValue(formData)
        }
    }, [formData]);

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
        if (formChange) {
            Modal.confirm({
                title: t('confirm'),
                content: t('closePageMsg'),
                okText: t('ok'),
                cancelText: t('cancel'),
                onOk: async () => {
                    onClose();
                    setFormChange(false);
                },
                onCancel() { },
            });
        }
        else {
            onClose();
            setFormChange(false);
        }
    };

    const handleSave = async () => {

        const errors = [];

        if (!formData?.activityGroupName) {
            errors.push('Activity Group Name');
        }

        if (errors.length > 0) {
            message.error(`Please fill in the following required fields: ${errors.join(', ')}.`);
            return;
        }

        try {
            if (selected?.createdDateTime) {
                const cookies = parseCookies();
                const site = cookies.site;
                const userId = cookies.rl_user_id;
                const payload = {
                    ...formData,
                    site: site,
                    currentSite: site,
                }
                const response = await UpdateActivityGroup(site, userId, payload);
                if (response.message) {
                    message.error(response.message)
                }
                else {
                    message.success(response.message_details.msg)
                    setFormData(response.response)
                    setCall(call + 1);
                    setFormChange(false);
                    setActiveTab(0)
                }
            } else {
                const cookies = parseCookies();
                const site = cookies.site;
                const payload = {
                    ...formData,
                    site: site,
                    currentSite: site,
                }
                const response = await CreateActivityGroup(site, payload);
                if (response.message) {
                    message.error(response.message)
                }
                else {
                    message.success(response.message_details.msg)
                    setIsAdding(false);
                    setCall(call + 1);
                    setFormChange(false)
                    setActiveTab(0)
                    setFormData(defaultActivityGroupRequest)
                }
            }
        } catch (error) {
            message.error('An error occurred while saving the User Group.');
        }
    }


    const handleCancel = () => {
        if (formChange) {
            Modal.confirm({
                title: t('confirm'),
                content: t('closePageMsg'),
                okText: t('ok'),
                cancelText: t('cancel'),
                onOk: async () => {
                    onClose();
                    setOper(true)
                    setFormChange(false);
                },
                onCancel() { },
            });
        }
        else {
            onClose();
            setFormChange(false);
        }
    };

    const handleOpenModal = () => {
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
    };


    const handleConfirmDelete = () => {
        const deleteActivityGroups = async () => {
            const cookies = parseCookies();
            const site = cookies.site;
            const userId = cookies.rl_user_id;
            const currentSite = site;

            try {
                const payload = formData;
                const oDeleteUserGroup = await deleteActivityGroup(site, userId, payload, currentSite);

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
        deleteActivityGroups();
    };

    const handleOpenCopyModal = () => {
        setIsCopyModalVisible(true);
        form.resetFields();
        form.setFieldsValue({
            activityGroupName: formData?.activityGroupName ? `${formData?.activityGroupName}_COPY` : '',
            activityGroupDescription: formData?.activityGroupDescription || '',
        });
    };

    const handleCloseCopyModal = () => {
        setIsCopyModalVisible(false);
    };



    const handleActivityGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        console.log(value, 'value');

        const patterns: { [key: string]: RegExp } = {
            activityGroupName: /^[A-Z0-9_]*$/,
        };
        if (patterns.activityGroupName?.test(value)) {
            // For other fields, use normalized value with pattern validation
            form.setFieldsValue({ activityGroupName: value });
            setFormData((prevData) => ({
                ...prevData,
                activityGroupName: value
            }));
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const { value } = e.target;
        const formattedValue = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        form.setFieldsValue({ [fieldName]: formattedValue });
    };

    const handleConfirmCopy = async () => {
        const cookies = parseCookies();
        const site = cookies.site;
        const userId = cookies.rl_user_id;
        try {
            const values = await form.validateFields();
            const updatedRowData = {
                ...formData,
                activityGroupName: values?.activityGroupName,
                activityGroupDescription: values?.activityGroupDescription,
                currentSite: site,
            };
            const response = await createCopyActivityGroup(site, userId, updatedRowData);
            setCall(call + 1);
            onClose();

            handleCloseCopyModal();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleChange = (changedValues) => {
        setFormData(prevData => ({
            ...prevData,
            ...changedValues,
        }));
        setFormChange(true)
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <Form
                        layout="horizontal"
                        style={{ width: '100%' }}
                        form={forms}
                        onValuesChange={handleChange}
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 24 }}
                    >
                        <Form.Item
                            label={t('activityGroupName')}
                            name="activityGroupName"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the activity group!',
                                },
                            ]}
                        >
                            <Input
                                style={{ width: '40%' }}
                                placeholder="Enter activity group"
                                onChange={handleActivityGroupNameChange}
                            />
                        </Form.Item>

                        <Form.Item
                            label={t("activityGroupDescription")}
                            name="activityGroupDescription"
                        >
                            <Input style={{ width: '40%' }} placeholder="Enter description" />
                        </Form.Item>
                    </Form>
                );
            case 1:
                return (
                    <ActivityGroupTransfer drag={drag} />
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
                                    {selected?.activityGroupName ? selected?.activityGroupName : t("createActivityGroup")}
                                </p>
                                {selected?.activityGroupName && (
                                    <>
                                        <p className={styles.dateText}>
                                            {t('description')} :
                                            <span className={styles.fadedText}>{selected?.activityGroupDescription || ''}</span>
                                        </p>
                                        <p className={styles.dateText}>
                                            {t('createdOn')} :
                                            <span className={styles.fadedText}>
                                                {dayjs(formData?.createdDateTime).format('DD-MM-YYYY HH:mm:ss') || ''}
                                            </span>
                                        </p>
                                        <p className={styles.dateText}>
                                            {t('modifiedOn')} :
                                            <span className={styles.fadedText}>
                                                {formData?.modifiedDateTime ? dayjs(formData.modifiedDateTime).format('DD-MM-YYYY HH:mm:ss') : 'N/A'}
                                            </span>
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className={styles.actionButtons}>
                                {
                                    fullScreen ?
                                        <Tooltip title={t("exitFullScreen")}>
                                            <Button onClick={handleCloseChange} className={styles.actionButton}>
                                                <CloseFullscreenIcon />
                                            </Button>
                                        </Tooltip> :
                                        <Tooltip title={t("enterFullScreen")}>
                                            <Button onClick={handleOpenChange} className={styles.actionButton}>
                                                <OpenInFullIcon />
                                            </Button>
                                        </Tooltip>
                                }

                                {selected?.activityGroupName && (
                                    <>
                                        <Tooltip title={t("copy")}>
                                            <Button onClick={handleOpenCopyModal} className={styles.actionButton}>
                                                <CopyIcon />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={t("delete")}>
                                            <Button onClick={handleOpenModal} className={styles.actionButton}>
                                                <DeleteIcon />
                                            </Button>
                                        </Tooltip>
                                    </>
                                )}

                                <Tooltip title={t("close")}>
                                    <Button onClick={handleClose} className={styles.actionButton}>
                                        <CloseIcon />
                                    </Button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Activity Group Tabs">
                            <Tab label={t("main")} />
                            <Tab label={t("activities")} />
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
                        {selected?.activityGroupName ? t("save") : t("create")}
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
                <p>{t("deleteConfirmation")} <strong>{formData?.activityGroupName}</strong>?</p>
            </Modal>
            <Modal
                title={t("copyActivityGroup")}
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
                        label={t("activityGroupName")}
                        name="activityGroupName"
                        rules={[{ required: true, message: 'Please enter the Activity Group Name' }]}
                    >
                        <Input placeholder="Enter Activity Group" onChange={(e) => handleFieldChange(e, 'activityGroupName')} />
                    </Form.Item>
                    <Form.Item
                        label={t("activityGroupDescription")}
                        name="activityGroupDescription"
                    >
                        <Input placeholder="Enter activityGroupDescription" onChange={(e) => handleFieldChange(e, 'activityGroupDescription')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ActivityGroupBody;
