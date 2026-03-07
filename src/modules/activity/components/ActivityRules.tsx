import React, { useState, useContext, useEffect } from 'react';
import { Modal, Button, Input, Table, Form } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { ActivityContext } from '../hooks/activityContext';
import { useTranslation } from 'react-i18next';
import { SearchOutlined } from '@mui/icons-material';
import styles from '../styles/ActivityMaintenance.module.css';


interface RuleData {
    key: string;
    rule: string;
    setting: string;
}

interface ActivityRulesProps {
    
    payloadData: object;
    setPayloadData: () => void;
  }

const RulesTable: React.FC<ActivityRulesProps> = () => {
    const { payloadData, setPayloadData, setShowAlert } = useContext<any>(ActivityContext); // Use the context
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [data, setData] = useState<RuleData[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        if (payloadData && payloadData.activityRules) {
          const keyedData = payloadData.activityRules.map((item, index) => ({
            ...item,
            key: index, // or use a unique identifier if available
          }));
          setData(keyedData);
        }
      }, [payloadData]);

    const columns: ColumnsType<RuleData> = [
        {
            title: t('rules'),
            dataIndex: 'ruleName',
            key: 'ruleName',
        },
        {
            title: t('setting'),
            dataIndex: 'setting',
            key: 'setting',
            filterIcon: <SearchOutlined style={{ fontSize: '12px' }} />,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        value={selectedKeys[0] as string}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={()=>confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Button
                        type="primary"
                        onClick={()=>confirm()}
                        // icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90, marginRight: 8 }}
                    >
                        {t('search')}
                    </Button>
                    <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                        {t('reset')}
                    </Button>
                </div>
            ),
            onFilter: (value, record) =>
                record.setting
                    .toString()
                    .toLowerCase()
                    .includes((value as string).toLowerCase()),
            render: (text, record) => <Input value={text} onChange={(e) => handleInputChange(e, record.key)} />,
        },
    ];

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleAddRule = () => {
        form.validateFields().then((values) => {
            const newData: any = {
                key: `${data.length + 1}`,
                ruleName: values.ruleName,
                setting: values.setting,
            };
            const updatedData = [...data, newData];
            setData(updatedData);

            // Update the payloadData with the new rule in the activityRules array
            const updatedPayload = {
                ...payloadData,
                activityRules: updatedData, // Ensure activityRules exists in payloadData
            };
            setPayloadData(updatedPayload); // Set the updated payload data

            closeModal();
            form.resetFields();
        });
        setShowAlert(true)
    };

    const handleRestoreDefaults = () => {
        const updatedData = data.map((item) => ({
            ...item,
            setting: '', // Clear the setting value
        }));
        setData(updatedData);

        // Update the payloadData with the cleared settings in the activityRules array
        const updatedPayload = {
            ...payloadData,
            activityRules: updatedData,
        };
        setPayloadData(updatedPayload);
        setShowAlert(true)
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const newData = data.map(item =>
            item.key === key ? { ...item, setting: e.target.value } : item
        );
        setData(newData);

        // Update the payloadData with the changed setting in the activityRules array
        const updatedPayload = {
            ...payloadData,
            activityRules: newData,
        };
        setPayloadData(updatedPayload);
        setShowAlert(true)
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button className={styles.cancelButton} onClick={openModal} style={{ marginRight: '8px' }}>
                    {t("addRules")}
                </Button>
                <Button className={styles.cancelButton} onClick={handleRestoreDefaults}>{t("restoreDefault")}</Button>
            </div>
            <Table columns={columns} dataSource={data}
            //  pagination={{pageSize: 5}}
            pagination={false}
            scroll={{ y: 'calc(100vh - 450px)' }}
              />
            <Modal
                title={t("addRule")}
                open={isModalOpen}
                onCancel={closeModal}
                footer={[
                    <Button key={t("cancel")} onClick={closeModal}>
                        {t("cancel")}
                    </Button>,
                    <Button key={t("add")} type="primary" onClick={handleAddRule}>
                        {t("add")}
                    </Button>,
                ]}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label={t("rules")}
                        name="ruleName"
                        rules={[{ required: true, message: 'Please input the rule!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t("setting")}
                        name="setting"
                        rules={[{ required: false, message: 'Please input the setting!' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RulesTable;
