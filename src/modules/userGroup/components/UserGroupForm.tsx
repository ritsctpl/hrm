import React, { useState, useEffect, useContext } from 'react';
import { Form, Input, Modal, Table } from 'antd';
import { UserGrpContext } from '../hooks/useContext/UserGroupUseContext';
import { useTranslation } from 'react-i18next';
import { GrChapterAdd } from 'react-icons/gr';
import { parseCookies } from 'nookies';
import { fetchAllPod, fetchTop50Pod } from '@services/userGroupService';
import { AnyAaaaRecord } from 'dns';

interface PodData {
  id: number;
  // podName: string;
  pod: string,
  description: string;
  status: string;
  defaultResource: string;
}

const UserGroupForm: React.FC = () => {
  const { selectedRowData, setSelectedRowData } = useContext<any>(UserGrpContext);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const [podVisible, setPodVisible] = useState(false);
  const [podData, setPodData] = useState<PodData[]>([]);


  useEffect(() => {
    form.getFieldsValue()
    if (selectedRowData) {
      form.setFieldsValue({
        userGroup: selectedRowData.userGroup,
        description: selectedRowData.description,
        pod: selectedRowData.pod
      });
    }
    // setPod(selectedRowData.pod || '');
  }, [selectedRowData, form]);

  const handleValuesChange = (changedValues: any) => {
    const currentValues = form.getFieldsValue();
    setSelectedRowData((prevData) => ({
      ...prevData,
      ...changedValues
    }));
  };

  console.log(selectedRowData,"selectedRowData");
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    let newValue = e.target.value;

    // Only normalize and apply restrictions for non-description fields
    if (key !== 'description') {
      newValue = newValue.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    }

    const patterns: { [key: string]: RegExp } = {
      userGroup: /^[A-Z0-9_]*$/,
      description: /.*/, // Accept all characters for description
      pod: /^[A-Z0-9_]*$/,
    };

    if (patterns[key]?.test(newValue)) {
      form.setFieldsValue({ [key]: newValue });
      setSelectedRowData((prevData) => ({
        ...prevData,
        [key]: newValue 
      }));
    }
  };

  const handlePodClick = async () => {
    const cookies = parseCookies();
    const site = cookies.site;
    const typedValue = form.getFieldValue('pod');

    const newValue = {
      pod: typedValue,
    }

    try {
      let response;
      if (typedValue) {
        response = await fetchAllPod(site, newValue);

      } else {
        response = await fetchTop50Pod(site);
      }

      if (response && !response.errorCode) {
        const formattedData = response.podList.map((item: any, index: number) => ({
          id: index,
          ...item,
        }));
        setPodData(formattedData);
      } else {
        setPodData([]);
      }
    } catch (error) {
      console.error('Error', error);
    }

    setPodVisible(true);
  };

  const handlePodOk = (selectedRow: any | undefined) => {
    if (selectedRow) {
      console.log();
      
        form.setFieldsValue({
            pod: selectedRow.podName,
        });
        setSelectedRowData((prevData) => ({
            ...prevData,
            pod: selectedRow.podName 
        }));
    }
    setPodVisible(false);
};

  // const handlePodChange = (fieldName: string, value: string) => {
  //   if (fieldName != 'description') {
  //     const convertedValue = value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
  //     form.setFieldsValue({ [fieldName]: convertedValue });
  //   }
  // };

  const PodColumn = [
    {
      title: t("podName"),
      dataIndex: "podName",
      key: "podName",
    },
    {
      title: t("description"),
      dataIndex: "description",
      key: "description",
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
    },
    {
      title: t("defaultResource"),
      dataIndex: "defaultResource",
      key: "defaultResource",
    }
  ]

  const handleCancel = () => {
    setPodVisible(false);
  };
  
  return (
    <Form
      layout="horizontal"
      style={{ width: '100%' }}
      form={form}
      onValuesChange={handleValuesChange}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 24 }}
    >
      <Form.Item
        label={t("userGroup")}
        name="userGroup"
        rules={[{ required: true, message: 'User Group is required' }]}
      >
        <Input
          placeholder=""
          style={{ width: '40%' }}
          onChange={(e) =>
            setTimeout(() => {
              handleInputChange(e,'userGroup')
            })}
        />
      </Form.Item>

      <Form.Item
        label={t("description")}
        name="description"
        initialValue=""
      >
        <Input
          placeholder=""
          style={{ width: '40%' }}
          onChange={(e) => handleInputChange(e,'description')}
        />
      </Form.Item>

      <Form.Item
        label={t("pod")}
        name="pod"
      // initialValue={pod}
      >
        <Input
          style={{ width: '40%' }}
          suffix={
            <GrChapterAdd
              onClick={() =>
                handlePodClick()
              }
            />
          }
          onChange={(e) => setTimeout(() => {
            handleInputChange(e,'pod')
          })}
        />
      </Form.Item>

      <Modal
        title={t("selectPod")}
        open={podVisible}
        onCancel={handleCancel}
        width={1200}
        footer={null}
      >
        <Table
          style={{ overflow: 'auto' }}
          onRow={(record) => ({
            onClick: () => handlePodOk(record),
          })}
          columns={PodColumn}
          dataSource={podData}
          rowKey="list"
          pagination={{ pageSize: 6 }}
        />
      </Modal>
    </Form>
  );
};

export default UserGroupForm;
