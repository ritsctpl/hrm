import React, { useContext, useEffect } from 'react';
import { Form, Input, Switch, Select, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import { UserContext } from '../hooks/userContext';
import { parseCookies } from 'nookies';

interface FormValues {
  [key: string]: any;
  workCenter?: string;
  resourceType?: string;
  operationType?: string;
  status?: string;
  defaultResource?: string;
  hireDate?: string;
  userId?: string; // Assuming userId field based on your rules
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  employeePersonalNumber?: string;
  disabled?: boolean;
}

interface DynamicFormProps {
  data: FormValues;
  fields: string[];
  onValuesChange: (changedValues: FormValues) => void;
  disabled?: boolean;
  username?: string;
}

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'InActive', label: 'InActive' }
];

const { Option } = Select;

const DynamicForm: React.FC<DynamicFormProps> = ({ data, fields, onValuesChange, username }) => {
  const{isEditing,erpShift, isModalVisible, setIsAletered, isPlusClicked } = useContext(UserContext);
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const cookies = parseCookies();
const roles = cookies.role;

  const hasRequiredRole = (roles) => {
    return roles.includes('Add Credential') && roles.includes('USER');
  };

  useEffect(() => {
    form.setFieldsValue({
      ...data,
      hireDate: data.hireDate ? dayjs(data.hireDate, "YYYY-MM-DD") : null,
      // confirmPassword: data?.password
    });
  }, [data, form]);

  useEffect(() => {
    if(isPlusClicked > 0){
      setIsAletered(false);
    }
  }, [isPlusClicked]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    let newValue = e.target.value.trimStart();
    setIsAletered(true);
    // Define regex patterns for validation
    const patterns: { [key: string]: RegExp } = {
        userId: /^[a-z0-9_]*$/,
        firstName: /^[A-Z0-9_]*$/,
        lastName: /^[A-Z0-9_]*$/,
        employeeNumber: /^\d*$/,
        employeePersonalNumber: /^\d*$/,
        emailAddress: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };

    // Remove special characters except underscores for most cases
    newValue = newValue.replace(/[^a-zA-Z0-9_]/g, '');

    switch (key) {
        case 'user':
            // if (patterns.userId.test(newValue)) {
              newValue = newValue.toLowerCase();
                form.setFieldsValue({ [key]: newValue });
                onValuesChange({ [key]: newValue });
            // }
            break;
        case 'firstName':
        case 'lastName':
        case 'erpUser':
            newValue = newValue.toUpperCase();
            if (patterns.firstName.test(newValue)) {
                form.setFieldsValue({ [key]: newValue });
                onValuesChange({ [key]: newValue });
            }
            break;
        case 'employeeNumber':
        case 'employeePersonalNumber':
            if (patterns.employeeNumber.test(newValue)) {
                form.setFieldsValue({ [key]: newValue });
                onValuesChange({ [key]: newValue });
            }
            break;
        case 'emailAddress':
            if (patterns.emailAddress.test(newValue)) {
                form.setFieldsValue({ [key]: newValue });
                onValuesChange({ [key]: newValue });
            }
            break;
        default:
            // For keys that don't need special validation, you might want to apply default handling
            form.setFieldsValue({ [key]: newValue });
            onValuesChange({ [key]: newValue });
            break;
    }
};

const handleDateChange = (date: dayjs.Dayjs | null, key: string) => {
  const dateString =date;
  form.setFieldsValue({ [key]: dateString });
  onValuesChange({ [key]: dateString });
  setIsAletered(true);
};


  return (
    <Form
      form={form}
      layout="horizontal"
      onValuesChange={(changedValues) => onValuesChange(changedValues as FormValues)}
      style={{ width: '70%' }}
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 14 }}
      disabled={!hasRequiredRole(roles)}
    >
      {fields.map((key) => {
        const value = data[key];
        if (value === undefined) {
          return null;
        }

        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());

        if (key === 'status') {
          return (
            <Form.Item
              key={key}
              name={key}
              label={t(`${key}`)}
            >
              <Select defaultValue={value}>
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        }

        if (key === 'password' || key === 'confirmPassword') {
          return (
            <Form.Item
              key={key}
              name={key}
              label={t(`${key}`)}
              required
            >
              <Input.Password autoComplete='off'  visibilityToggle={false}/>
            </Form.Item>
          );
        }
        if (key === 'emailAddress') {
          return (
            <Form.Item
              key={key}
              name={key}
              label={t(`${key}`)}
              rules={[
                { 
                  required: false, 
                  message: 'Please enter your email address' 
                },
                { 
                  type: 'email', 
                  message: 'Please enter a valid email address' 
                }
              ]}
            >
              <Input placeholder="Enter your email address" />
            </Form.Item>
          );
        }
        

        if (key === 'hireDate') {
          return (
            <Form.Item
            key={key}
            name={key}
            label={t(`${key}`)}
          >
            <DatePicker
              defaultValue={value ? dayjs(value) : null}
              onChange={(date) => handleDateChange(date, key)}
              style={{ width: "100%" }}
            />
          </Form.Item>
          );
        }

        if (typeof value === 'boolean') {
          return (
            <Form.Item
              key={key}
              name={key}
              label={t(`${key}`)}
              valuePropName="checked"
            >
              <Switch checked={value} onChange={(checked) => onValuesChange({ [key]: checked })} />
            </Form.Item>
          );
        }

        if (['employeeNumber', 'erpPersonnelNumber'].includes(key)) {
          const inputType = key === 'employeeNumber' || key === 'erpPersonnelNumber' ? 'number' : 'text';
          return (
            <Form.Item
              key={key}
              name={key}
              label={t(`${key}`)}
            >
              <Input 
                type='number'
                defaultValue={value}
                onChange={(e) => handleInputChange(e, key)}
              />
            </Form.Item>
          );
        }
        if (['firstName', 'lastName'].includes(key)) {
          return (
            <Form.Item
              key={key}
              name={key}
              label={t(`${key}`)}
              required
            >
              <Input 
                defaultValue={value}
                onChange={(e) => handleInputChange(e, key)}
              />
            </Form.Item>
          );
        }
        if (['user'].includes(key)) {
          return (
            <Form.Item
              key={key}
              name={key}
              label={t(`${key}`)}
              required
            >
              <Input 
                disabled={isEditing && erpShift || !hasRequiredRole(roles)}
                defaultValue={value}
                autoComplete='off'
                onChange={(e) => handleInputChange(e, key)}
              />
            </Form.Item>
          );
        }


        return (
          <Form.Item
            key={key}
            name={key}
            label={t(`${key}`)}
          >
            <Input defaultValue={value} autoComplete='off' onChange={(e) => handleInputChange(e, key)} />
          </Form.Item>
        );
      })}
    </Form>
  );
};

export default DynamicForm;
