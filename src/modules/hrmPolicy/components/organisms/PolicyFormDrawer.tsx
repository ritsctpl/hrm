"use client";

import React, { useEffect } from "react";
import { Drawer, Form, Input, Select, DatePicker, Button, Space, message, Upload } from "antd";
import { UploadOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { PolicyFormDrawerProps } from "../../types/ui.types";
import { HrmPolicyService } from "../../services/hrmPolicyService";
import { POLICY_DOC_TYPE_LABELS } from "../../utils/constants";
import { useHrmPolicyStore } from "../../stores/hrmPolicyStore";
import Can from "../../../hrmAccess/components/Can";

const { Option } = Select;
const { TextArea } = Input;

const PolicyFormDrawer: React.FC<PolicyFormDrawerProps> = ({
  open,
  editPolicy,
  categories,
  site,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const { saving, setSaving } = useHrmPolicyStore();
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfFileList, setPdfFileList] = React.useState<UploadFile[]>([]);
  const [existingPdfName, setExistingPdfName] = React.useState<string>("");

  useEffect(() => {
    if (open) {
      if (editPolicy) {
        form.setFieldsValue({
          title: editPolicy.title,
          documentType: editPolicy.documentType,
          categoryHandle: editPolicy.categoryHandle,
          description: editPolicy.description,
          textContent: editPolicy.textContent,
          effectiveFrom: editPolicy.effectiveFrom ? dayjs(editPolicy.effectiveFrom) : undefined,
          reviewDate: editPolicy.reviewDate ? dayjs(editPolicy.reviewDate) : undefined,
          tags: editPolicy.tags,
        });
        // Show existing PDF if available
        if (editPolicy.pdfBase64) {
          setExistingPdfName(`${editPolicy.policyCode || 'policy'}.pdf`);
        } else {
          setExistingPdfName("");
        }
        setPdfFile(null);
        setPdfFileList([]);
      } else {
        form.resetFields();
        setExistingPdfName("");
        setPdfFile(null);
        setPdfFileList([]);
      }
    }
  }, [open, editPolicy, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate PDF is uploaded for new policies
      if (!editPolicy && !pdfFile) {
        message.error('Please upload a PDF document');
        return;
      }

      setSaving(true);
      const cookies = parseCookies();
      const userId = cookies.userId ?? "system";
      
      const payload = {
        ...values,
        site,
        effectiveFrom: values.effectiveFrom?.format("YYYY-MM-DD"),
        reviewDate: values.reviewDate?.format("YYYY-MM-DD"),
      };
      
      if (editPolicy) {
        // Update policy basic info (without PDF)
        await HrmPolicyService.updatePolicy({ ...payload, policyHandle: editPolicy.handle });
        
        // If new PDF uploaded, call separate updatePdf endpoint
        if (pdfFile) {
          const pdfBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64String = reader.result as string;
              // Remove data URL prefix to get pure base64
              const base64 = base64String.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfFile);
          });
          
          await HrmPolicyService.updatePdf({
            site,
            policyHandle: editPolicy.handle,
            fileName: pdfFile.name,
            pdfBase64,
            updatedBy: userId,
          });
        }
      } else {
        // For create, first create the policy without PDF
        const createdPolicy = await HrmPolicyService.createPolicy({ 
          ...payload, 
          createdBy: userId,
        });
        
        // Then upload PDF if provided
        if (pdfFile) {
          const pdfBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64String = reader.result as string;
              const base64 = base64String.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfFile);
          });
          
          await HrmPolicyService.updatePdf({
            site,
            policyHandle: createdPolicy.handle,
            fileName: pdfFile.name,
            pdfBase64,
            updatedBy: userId,
          });
        }
      }
      
      message.success(editPolicy ? "Policy updated successfully" : "Policy created successfully");
      onSaved();
    } catch (error: any) {
      // Extract error message from API response
      let errorMessage = "Failed to save policy";
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        // Check for message_details.msg format
        if (errorData.message_details?.msg) {
          errorMessage = errorData.message_details.msg;
        }
        // Check for direct message field
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      // Check if error itself has a message
      else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      console.error("Policy save failed:", errorMessage, error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editPolicy ? "Edit Policy" : "New Policy"}
      open={open}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Can I={editPolicy ? "edit" : "add"}>
            <Button type="primary" onClick={handleSubmit} loading={saving}>
              {editPolicy ? "Update" : "Create"}
            </Button>
          </Can>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Please enter policy title' },
            { min: 3, message: 'Title must be at least 3 characters' },
          ]}
        >
          <Input placeholder="Policy title (minimum 3 characters)" />
        </Form.Item>
        <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
          <Select placeholder="Select type">
            {Object.entries(POLICY_DOC_TYPE_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="categoryHandle" label="Category" rules={[{ required: true }]}>
          <Select placeholder="Select category">
            {categories.map((cat) => (
              <Option key={cat.handle} value={cat.handle}>{cat.categoryName}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="description" label="Summary">
          <TextArea rows={2} placeholder="Brief summary of this policy" />
        </Form.Item>
        <Form.Item name="textContent" label="Content">
          <TextArea rows={6} placeholder="Policy content (HTML supported)" />
        </Form.Item>
        <Form.Item name="effectiveFrom" label="Effective Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item name="reviewDate" label="Next Review Date">
          <DatePicker style={{ width: "100%" }} format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="Add tags" />
        </Form.Item>
        
        <Form.Item
          label={
            <span>
              PDF Document
              {!editPolicy && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
            </span>
          }
          required={!editPolicy}
          help={!editPolicy && !pdfFile ? "PDF document is required for new policies" : undefined}
          validateStatus={!editPolicy && !pdfFile ? "error" : undefined}
        >
          {existingPdfName && !pdfFile && (
            <Space style={{ marginBottom: 8 }}>
              <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
              <span style={{ color: '#595959' }}>Current: {existingPdfName}</span>
            </Space>
          )}
          <Upload
            accept=".pdf"
            maxCount={1}
            fileList={pdfFileList}
            beforeUpload={(file) => {
              // Validate file type
              if (file.type !== 'application/pdf') {
                message.error('You can only upload PDF files!');
                return Upload.LIST_IGNORE;
              }
              // Validate file size (max 10MB)
              const isLt10M = file.size / 1024 / 1024 < 10;
              if (!isLt10M) {
                message.error('PDF must be smaller than 10MB!');
                return Upload.LIST_IGNORE;
              }
              setPdfFile(file);
              setPdfFileList([file as UploadFile]);
              return false; // Prevent auto upload
            }}
            onRemove={() => {
              setPdfFile(null);
              setPdfFileList([]);
            }}
          >
            <Button icon={<UploadOutlined />}>
              {existingPdfName ? 'Replace PDF' : 'Upload PDF'}
            </Button>
          </Upload>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
            {!editPolicy ? 'Required. ' : 'Optional. '}Max size: 10MB. Format: PDF only.
          </div>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default PolicyFormDrawer;
