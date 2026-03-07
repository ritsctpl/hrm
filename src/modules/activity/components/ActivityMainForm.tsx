import React, { useState, useEffect, useContext } from "react";
import { Form, Input, Select, Button, Switch, Modal, Table, Checkbox, Tooltip } from "antd";
import { GrChapterAdd } from "react-icons/gr";
import { parseCookies } from "nookies";

import { fetchAllActivityGroup, retrieveAllBOMBySite } from "@services/activityService";
import { useTranslation } from "react-i18next";
import { ActivityContext } from "../hooks/activityContext";
import { SearchOutlined } from "@mui/icons-material";

const { Option } = Select;
const { TextArea } = Input;



interface ActivityMaintenanceFormProps {
  onChange: (values: Record<string, any>) => void;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: { span: number };
  wrapperCol?: { span: number };
  rowSelectedData: [];
}



interface FormField {
  checked: boolean;
  type: 'input' | 'number' | 'select' | 'switch' | 'checkbox' | 'browse' | 'selectBrowse';
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  uppercase?: boolean;
  noSpaces?: boolean;
  noSpecialChars?: boolean;
  width?: string;
  icon?: boolean;
  correspondingVersion?: string;
  tableColumns?: any[]; // Added to handle columns in browse fields
  tableData?: any[]; // Added to handle data in browse fields
  disabled?: boolean;
  addClickCount: number;

}

const ActivityMaintenanceForm: React.FC<ActivityMaintenanceFormProps> = ({
  onChange,
  layout = 'horizontal',
  labelCol = { span: 10 },
  wrapperCol = { span: 20 },
  rowSelectedData
}) => {
  const { payloadData, setPayloadData, schemaData, addClickCount, mainSchema, showAlert, setShowAlert } = useContext<any>(ActivityContext);
  const [form] = Form.useForm();

  const [formattedData, setFormattedData] = useState<{ [key: string]: any }[]>([]);

  const [visible, setVisible] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activityGroupValue, setActivityGroupValue] = useState();
  const [schema, setSchema] = useState(schemaData);
  const [activityGroupList, setActivityGroupList] = useState([]);





  useEffect(() => {
    if (rowSelectedData) {
      form.setFieldsValue(rowSelectedData)

    }
  }, [rowSelectedData]);

  useEffect(() => {
    if (!payloadData) return;
    form.setFieldsValue(payloadData);

    form.setFieldsValue({
      activityGroup: payloadData.activityGroupList?.map(group => group.activityGroupName), // Set default values
      // Set other fields similarly
    });


  }, [payloadData]);




  useEffect(() => {
    const changedSchemaData = schemaData.map(field => {
      if (field.name === "activityGroup") {
        return {
          ...field,
          defaultValue: []
        };
      }
      return field;
    });

    setSchema(changedSchemaData);

  }, [addClickCount]);


  const onFormChange = (value: any, version?: any) => {
    if (currentField) {
      form.setFieldsValue({
        [currentField]: value,
        ...(version ? { [schema.find(field => field.name === currentField)?.correspondingVersion as string]: version } : {}),
      });

    }
  };

  const handleSelectChange = (value: string, fieldName: string) => {
    // Update the form field value
    form.setFieldsValue({ [fieldName]: value });

    setShowAlert(true)
    setPayloadData(prevPayloadData => {
      

      return {
        ...prevPayloadData,

        [fieldName]: value, // Update other fields
      };
    });

  };


  const handleSwitchChange = (checked: boolean, fieldName: string) => {
    // Update the form field value
    form.setFieldsValue({ [fieldName]: checked });
    setShowAlert(true)
   
    setPayloadData(prevPayloadData => {
      
      return {
        ...prevPayloadData,
        [fieldName]: checked, // Update other fields
      };
    });
  };

  

  const handleSelectBrowseChange = (value: any, fieldName: string) => {
    // Update form values

    const selectedGroups = activityGroupList.filter(group => value.includes(group.activityGroupName));

    setPayloadData(prevPayloadData => ({
      ...prevPayloadData,
      activityGroupList: selectedGroups, // Update other fields
    }));

    // Ensure the form instance is correct
  
    
    form.setFieldsValue({
      [fieldName]: value,
    });
    setShowAlert(true)
    // Optionally, you can perform additional actions based on the new value

};

  


  const handleInputChange = (value: string, field: FormField) => {
    debugger;
    let newValue = value;
    setShowAlert(true)
    if (field.uppercase) {
      newValue = newValue.toUpperCase();
    }
    if (field.noSpaces) {
      newValue = newValue.replace(/\s+/g, '');
    }
    if (field.noSpecialChars) {
      newValue = newValue.replace(/[^a-zA-Z0-9_]/g, '');
    }

    // Update the form field with the transformed value
    form.setFieldsValue({ [field.name]: newValue });

    // Get the updated form values
    const updatedFormValues = form.getFieldsValue();

    // Extract the relevant fields for routingStepList


    // Handle update for both routingStepList and other fields
    setPayloadData(prevPayloadData => ({

      ...prevPayloadData,

      [field.name]: newValue, // Update other fields

    }));
    

    return newValue;
  };

  const handleModalOk = () => {
    if (selectedRow) {
      const fieldSchema = schema.find(field => field.name === currentField);

      if (fieldSchema) {
        const updatedFields = {
          [currentField]: selectedRow[fieldSchema.name],
          ...(fieldSchema.correspondingVersion
            ? { [fieldSchema.correspondingVersion]: selectedRow[fieldSchema.correspondingVersion] }
            : {}),
        };

        // Update form fields with selected data
        form.setFieldsValue(updatedFields);

        // Update the payload data
        setPayloadData(prevPayloadData => ({
          ...prevPayloadData,
          ...updatedFields,
        }));
        setShowAlert(true)

        // Reset modal states
        setSelectedRow(null);
        setVisible(false);
        setCurrentField(null);
      }
    }
  };


  const handleLiveChange = (fieldName: string, value: any) => {
    // Convert the value to uppercase, remove spaces, and allow only underscores
    const sanitizedValue = value
      .toUpperCase()                  // Convert to uppercase
      .replace(/\s+/g, '')            // Remove all spaces
      .replace(/[^A-Z0-9_]/g, '');    // Remove all special characters except underscores

    // Update the form field with the sanitized value
    form.setFieldsValue({ [fieldName]: sanitizedValue });
    setShowAlert(true)


    // Handle update for both routingStepList and other fields
    setPayloadData(prevPayloadData => {
      return {
        ...prevPayloadData,

        [fieldName]: sanitizedValue,
      };
    });

    // Notify about the form change (if needed)
    onFormChange(sanitizedValue, undefined);
  };


  const handleDataFormatted = (data: Array<Record<string, any>>) => {
    setFormattedData(data);


    // You can now use the formatted data as needed
  };

  const openModal = async (fieldName: string) => {
    try {
      const cookies = parseCookies();
      const site = cookies.site ;
      const oBomList = await retrieveAllBOMBySite(site);
      const formattedBomList = oBomList.map((item, index) => ({
        ...item,
        key: index,
        id: index
      }));

    } catch (error) {
      console.error("Error fetching all BOM list:", error);
    }

    setCurrentField(fieldName);
    const fieldSchema = schema.find(field => field.name === fieldName);
    const oTableColumns = [
      { title: t('method'), dataIndex: 'method', key: 'method' },
      { title: t('description'), dataIndex: 'description', key: 'description' },
    ]
    if (oTableColumns && fieldSchema?.tableData) {
      setTableColumns(oTableColumns);
      setTableData(fieldSchema.tableData);
    }

    setVisible(true);
  };


  const handleModalCancel = () => {
    setVisible(false);
  };

  const handleRowSelection = (record: any) => {
    setSelectedRow(record);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const filteredData = tableData.filter(item =>
    Object.values(item).some(value =>
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const handleClick = () => {
    const fetchActivityGroupData = async () => {
      const cookies = parseCookies();
      const site = cookies.site ;

      try {
        const response = await fetchAllActivityGroup(site);
        if (!response.errorCode) {
          // Map over the response data to add an index as a key
          const dataWithKeys = response.map((item: any, index: number) => ({
            key: index, // Add an index as key
            ...item,    // Spread the original item data
          }));
          setActivityGroupList(dataWithKeys);
        }
      } catch (error) {
        console.error('Error fetching all activity group data:', error);
      }
    };

    fetchActivityGroupData();
  }


  const { t } = useTranslation();


  const renderField = (field: FormField) => {
    const fieldStyle = { width: field.width || '100%' };
  
    switch (field.type) {
      case 'input':
        return (
          <Form.Item
            key={field.name}
            label={t(field.label)}
            name={field.name}
            rules={[{ required: field.required, message: `${field.label} is required` }]}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            style={fieldStyle}
          >
            <Input
              placeholder={field.placeholder}
              onChange={e =>
                form.setFieldsValue({
                  [field.name]: handleInputChange(e.target.value, field),
                })
              }
            />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item
            key={field.name}
            label={t(field.label)}
            name={field.name}
            rules={[{ required: field.required, message: `${field.label} is required` }]}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            style={fieldStyle}
          >
            <Input
              type="number"
              placeholder={field.placeholder}
              onChange={e =>
                form.setFieldsValue({
                  [field.name]: handleInputChange(e.target.value, field),
                })
              }
            />
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item
            key={field.name}
            label={t(field.label)}
            name={field.name}
            rules={[{ required: field.required, message: `${field.label} is required` }]}
            initialValue={field.defaultValue}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            style={fieldStyle}
          >
            <Select placeholder={field.placeholder} defaultValue={field.defaultValue}
              onChange={(value) => handleSelectChange(value, field.name)} >
              {field.options?.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
  
      case 'selectBrowse':
        return (
          <Form.Item
            key={field.name}
            label={t(field.label)}
            name={field.name}
            rules={[{ required: field.required, message: `${field.label} is required` }]}
            initialValue={field.defaultValue}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            style={fieldStyle}
          >
            <Select
              placeholder={field.placeholder}
              mode="multiple"
              onClick={handleClick}
              defaultValue={field.defaultValue}
              onChange={(value) => handleSelectBrowseChange(value, field.name)}
            >
              {activityGroupList.map(group => (
                <Select.Option key={group.activityGroupName} value={group.activityGroupName}>
                  {group.activityGroupName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
  
      case 'switch':
        return (
          <Form.Item
            key={field.name}
            label={t(field.label)}
            name={field.name}
            valuePropName="checked"
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            style={fieldStyle}
          >
            <Switch
              checked={field.checked} // Ensure this is bound to your state or form
              onChange={(checked) => handleSwitchChange(checked, field.name)} // Add onChange event handler
            />
          </Form.Item>
        );
      case 'checkbox':
        return (
          <Form.Item
            key={field.name}
            name={field.name}
            label={t(field.label)}
            valuePropName="checked"
            rules={[{ required: field.required, message: `${field.label} is required` }]}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            style={fieldStyle}
          >
            <Checkbox />
          </Form.Item>
        );
      case 'browse':
        return (
          <Form.Item
            key={field.name}
            label={t(field.label)}
            name={field.name}
            rules={[{ required: field.required, message: `${t(field.label)} is required` }]}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            style={fieldStyle}
          >
            <Input
              placeholder={field.placeholder}
              disabled={field.disabled}
              suffix={field.icon ? (
                <Tooltip title="Search">
                  <GrChapterAdd onClick={() => openModal(field.name)} />
                </Tooltip>
              ) : null}
              value={form.getFieldValue(field.name)}
              onChange={(e) => {
                const value = e.target.value;
                form.setFieldsValue({ [field.name]: value });
                // Call your live change handler here
                handleLiveChange(field.name, value);
              }}
            />
          </Form.Item>
        );
      default:
        return null;
    }
  };
  

  const handleSubmit = (values: any) => {
    // console.log('Form Values:', {
    //   ...values,
    //   ...schema.reduce((acc, field) => {
    //     if (field.type === 'switch' && values[field.name] === undefined) {
    //       acc[field.name] = false;
    //     }
    //     if (field.type === 'checkbox' && values[field.name] === undefined) {
    //       acc[field.name] = false;
    //     }
    //     return acc;
    //   }, {}),
    // });
  };



  return (
    <>
      {/* <Form form={form} layout={layout} onFinish={handleSubmit}
        style={{
          width: '100%',
          // paddingLeft: '20px',
          maxHeight: '100vh', // Limit the form height
          overflowY: 'auto',
        }}>
        {schema.map(field => renderField(field))}
       
      </Form> */}

      <Form
        form={form}
        layout={layout}
        onFinish={handleSubmit}
        style={{
          width: '100%',
          // maxHeight: '100vh', // Limit the form height
          // overflowY: 'auto',
        }}
      >
        {schema?.map(field => renderField(field))}
      </Form>


      <Modal
        title={
          <>
            {t('selectMethod')}
            {/* <Tooltip title="Search">
              <SearchOutlined
                onClick={() => setSearchVisible(!searchVisible)}
                style={{ marginLeft: 8 }}
              />
            </Tooltip> */}
            {searchVisible && (
              <Input
                style={{ marginTop: 16 }}
                value={searchText}
                onChange={handleSearchChange}
              />
            )}
          </>
        }
        open={visible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        footer={null}
        // footer={[
        //   <Button key="cancel" onClick={handleModalCancel}>
        //     t{('cancel')}
        //   </Button>,
        //   <Button key="ok" type="primary" onClick={handleModalOk}>
        //     t{('ok')}
        //   </Button>,
        // ]}
      >
        <Table
          columns={tableColumns}
          dataSource={filteredData}
          rowSelection={{
            type: 'radio',
            onSelect: handleRowSelection,
          }}
          onRow={(record) => ({
            onClick: () => handleRowSelection(record),
          })}
          pagination={{
            pageSize: 6,
          }}
        />
      </Modal>

    </>
  );
};

export default ActivityMaintenanceForm;