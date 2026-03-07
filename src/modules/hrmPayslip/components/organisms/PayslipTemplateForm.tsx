'use client';

import React, { useEffect } from "react";
import { Button, Divider, Form, Input, Switch } from "antd";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import TemplateSectionConfig from "./TemplateSectionConfig";
import type { PayslipTemplate } from "../../types/domain.types";
import styles from "../../styles/TemplateDesigner.module.css";

const PayslipTemplateForm: React.FC = () => {
  const [form] = Form.useForm<PayslipTemplate>();
  const { selectedTemplate, saveTemplate, selectTemplate, setTemplatePreviewData } =
    useHrmPayslipStore();

  useEffect(() => {
    if (selectedTemplate) {
      form.setFieldsValue(selectedTemplate);
    } else {
      form.resetFields();
    }
  }, [selectedTemplate, form]);

  if (!selectedTemplate) {
    return (
      <div className={styles.templateForm}>
        <div style={{ textAlign: "center", padding: "48px 0", color: "#999" }}>
          Select a template from the list or create a new one.
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await saveTemplate({ ...selectedTemplate, ...values });
    } catch {
      // validation errors shown inline
    }
  };

  const handlePreview = async () => {
    const values = form.getFieldsValue();
    setTemplatePreviewData({ ...selectedTemplate, ...values });
  };

  return (
    <div className={styles.templateForm}>
      <Form form={form} layout="vertical" size="small">
        <Form.Item name="templateCode" label="Template Code" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="templateName" label="Template Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="isActive" label="Set as Active Template" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Divider orientation="left">Company Header</Divider>
        <Form.Item name="companyName" label="Company Name">
          <Input />
        </Form.Item>
        <Form.Item name="companyAddress" label="Address">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="cin" label="CIN">
          <Input />
        </Form.Item>
        <Form.Item name="gstin" label="GSTIN">
          <Input />
        </Form.Item>
        <Form.Item name="companyLogoPath" label="Logo Path">
          <Input placeholder="/logos/company.png" />
        </Form.Item>

        <Divider orientation="left">Section Visibility</Divider>
        <TemplateSectionConfig />

        <Divider orientation="left">Section Labels</Divider>
        <Form.Item name="earningsSectionLabel" label="Earnings Label">
          <Input />
        </Form.Item>
        <Form.Item name="deductionsSectionLabel" label="Deductions Label">
          <Input />
        </Form.Item>

        <Divider orientation="left">Footer</Divider>
        <Form.Item name="footerNote" label="Footer Note">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="signatureLabel" label="Signature Label">
          <Input />
        </Form.Item>

        <div className={styles.formActions}>
          <Button onClick={handlePreview}>Preview Template</Button>
          <Button onClick={() => selectTemplate(null)}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PayslipTemplateForm;
