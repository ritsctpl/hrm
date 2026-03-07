import React, { useState } from 'react';
import { Form, Input, Button, Typography, Row, Col, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import loginPage from '../../../images/password.jpg'
import loginPage1 from '../../../images/userPassword2.jpg'
import { fetchUserAll, updateUser } from '@services/userService';
const { Link } = Typography;
import {
    CreateKeycloakUser,
    UpdateKeycloakUser,
} from "@/app/api/auth/keycloakCredentials";
import { useMyContext } from '../hooks/UserCredentialContext';

const UserCredentialForm = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm();

    const { payloadData, setPayloadData, setShowAlert } = useMyContext();
    const [passwordError, setPasswordError] = useState('');

    const handleInputChange = (fieldName: string, value: string) => {
        setPayloadData((prev) => ({
            ...prev,
            [fieldName]: value
        }));
        setShowAlert(true);
    };

    const handleSubmit = async () => {
        form.validateFields()
            .then(async (values) => {
                if (values.password !== values.confirmPassword) {
                    setPasswordError(t('passwordMismatch'));
                    return;
                }

                // Reset password error if passwords match
                setPasswordError('');

                const retrieveResponse = await fetchUserAll(values?.username);
                if (!retrieveResponse?.errorCode) {
                    const keyCloakUser = {
                        data: {
                            user: retrieveResponse?.user,
                            firstName: retrieveResponse?.firstName,
                            lastName: retrieveResponse?.lastName,
                            emailAddress: retrieveResponse?.emailAddress,
                            password: values?.password,
                        },
                    };

                    const result = await UpdateKeycloakUser(keyCloakUser);
                    console.log("Keycloak update response: ", result);
                    if (!result.succes && !(result.error === "User exists with same username")) {
                        throw new Error(result.error);
                    }

                    const updateRequest = {
                        ...retrieveResponse,
                        password: values?.password
                    }
                    const updateResponse = await updateUser(updateRequest);
                    if (!updateResponse?.errorCode) {
                        message.success(updateResponse?.message_details?.msg);
                    }
                    else {
                        message.error(updateResponse?.message);
                    }
                }
                else {
                    message.error(retrieveResponse?.message);
                }
                // Here you would typically handle login logic
                console.log('Retrieved user', retrieveResponse);
            })
            .catch(errorInfo => {
                console.log('Validation Failed:', errorInfo);
            });
    };

    const handleForgotPassword = () => {
        // Implement forgot password logic
        console.log('Forgot Password clicked');
    };

    return (
        <LoginPageLayout>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                style={{
                    maxWidth: 400,
                    width: '100%',
                    padding: '0 20px',
                }}
            >
                <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
                    {t('Reset password')}
                </h1>

                <Form.Item
                    name="username"
                    label={t('username')}
                    rules={[{
                        required: true,
                        message: t('Username Required')
                    }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        value={payloadData?.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={t('password')}
                    rules={[{
                        required: true,
                        message: t('Password Required')
                    }]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        value={payloadData?.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label={t('confirmPassword')}
                    dependencies={['password']}
                    rules={[
                        {
                            required: true,
                            message: t('Confirm Password Required')
                        },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error(t('Password Mismatch')));
                            },
                        }),
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                    />
                </Form.Item>

                {passwordError && (
                    <div style={{ color: 'red', marginBottom: 16 }}>
                        {passwordError}
                    </div>
                )}

                {/* <Form.Item>
                    <Link onClick={handleForgotPassword} style={{ float: 'right' }}>
                        {t('Forgot Password')}
                    </Link>
                </Form.Item> */}

                <Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                style={{ width: '100%' }}
                            >
                                {t('submit')}
                            </Button>
                        </Col>
                        <Col span={12}>
                            <Button
                                type="default"
                                onClick={() => form.resetFields()}
                                style={{ width: '100%' }}
                            >
                                {t('clear')}
                            </Button>
                        </Col>
                    </Row>
                </Form.Item>
            </Form>
        </LoginPageLayout>
    );
};

// New component to handle layout with images
const LoginPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <Row style={{
            height: '100vh',
            overflow: 'hidden'
        }}>
            {/* Left Image Column - 60% width */}
            <Col
                xs={0}
                sm={0}
                md={14}  // Changed from 10 to 14 to represent 60%
                lg={14}  // Changed from 12 to 14 to represent 60%
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white'
                }}
            >
                <img
                    src={loginPage1.src}
                    alt="Login Illustration"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                    }}
                />
            </Col>

            {/* Form Column - 40% width */}
            <Col
                xs={24}
                sm={24}
                md={10}  // Changed from 14 to 10 to represent 40%
                lg={10}  // Changed from 12 to 10 to represent 40%
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff'
                }}
            >
                {children}
            </Col>
        </Row>
    );
};

export default UserCredentialForm;