'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from 'antd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import type { UserGuide } from '../../types/domain.types';
import type { GuideFormValues } from '../../types/ui.types';
import {
  ACCEPTED_FILE_TYPES,
  AUDIENCE_OPTIONS,
  GUIDE_TARGET_MODULES,
  MAX_FILE_SIZE_BYTES,
} from '../../utils/guideConstants';
import { formatFileSize } from '../../utils/guideHelpers';
import { validateGuideFile } from '../../utils/guideValidations';

interface GuideFormDrawerProps {
  open: boolean;
  editGuide: UserGuide | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: GuideFormValues, file?: File) => Promise<boolean>;
  /** Pre-selected target module, e.g. when uploading from a module's own help. */
  defaultModuleCode?: string;
}

const GuideFormDrawer: React.FC<GuideFormDrawerProps> = ({
  open,
  editGuide,
  saving,
  onClose,
  onSubmit,
  defaultModuleCode,
}) => {
  const [form] = Form.useForm<GuideFormValues>();
  const [file, setFile] = useState<File | null>(null);
  const isEdit = Boolean(editGuide);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    if (editGuide) {
      form.setFieldsValue({
        moduleCode: editGuide.moduleCode,
        title: editGuide.title,
        description: editGuide.description,
        version: editGuide.version,
        audience: editGuide.audience ?? 'ALL',
        displayOrder: editGuide.displayOrder,
        tags: editGuide.tags,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        audience: 'ALL',
        version: '1.0',
        ...(defaultModuleCode ? { moduleCode: defaultModuleCode } : {}),
      });
    }
  }, [open, editGuide, defaultModuleCode, form]);

  // The file is mandatory on create (a guide record with no document is
  // useless) and optional on edit, where omitting it keeps the existing PDF.
  const handleFinish = async (values: GuideFormValues) => {
    if (!isEdit && !file) {
      message.warning('Attach the guide PDF before saving.');
      return;
    }
    const ok = await onSubmit(values, file ?? undefined);
    if (ok) {
      setFile(null);
      form.resetFields();
      onClose();
    }
  };

  return (
    <Drawer
      title={isEdit ? 'Edit guide' : 'Upload user guide'}
      open={open}
      onClose={onClose}
      width={480}
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {isEdit ? 'Save changes' : 'Upload'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        <Form.Item
          name="moduleCode"
          label="Module"
          rules={[{ required: true, message: 'Pick the module this guide documents' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Which module does this guide document?"
            options={GUIDE_TARGET_MODULES.map((m) => ({ value: m.code, label: m.label }))}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Title is required' },
            { max: 120, message: 'Keep the title to 120 characters or fewer' },
          ]}
        >
          <Input placeholder="e.g. Applying for Leave" />
        </Form.Item>

        <Form.Item name="description" label="Description" rules={[{ max: 300 }]}>
          <Input.TextArea
            rows={3}
            maxLength={300}
            showCount
            placeholder="One or two lines describing what this guide covers"
          />
        </Form.Item>

        <Space size={12} style={{ display: 'flex' }}>
          <Form.Item name="version" label="Version" style={{ flex: 1 }}>
            <Input placeholder="1.0" />
          </Form.Item>
          <Form.Item
            name="displayOrder"
            label="Display order"
            style={{ flex: 1 }}
            tooltip="Lower numbers appear first within the module"
          >
            <InputNumber min={1} max={999} style={{ width: '100%' }} placeholder="1" />
          </Form.Item>
        </Space>

        <Form.Item name="audience" label="Audience">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={AUDIENCE_OPTIONS.map((a) => ({ value: a.value, label: a.label }))}
          />
        </Form.Item>

        <Form.Item name="tags" label="Tags">
          <Select mode="tags" tokenSeparators={[',']} placeholder="onboarding, approvals…" />
        </Form.Item>

        <Form.Item
          label={isEdit ? 'Replace document (optional)' : 'Guide document'}
          required={!isEdit}
        >
          <Upload.Dragger
            accept={ACCEPTED_FILE_TYPES}
            maxCount={1}
            showUploadList={false}
            beforeUpload={(f) => {
              const error = validateGuideFile(f as File);
              if (error) {
                message.error(error);
              } else {
                setFile(f as File);
              }
              // We upload with the form submit, not on drop.
              return false;
            }}
          >
            <p style={{ margin: 0 }}>
              <UploadFileIcon style={{ fontSize: 28, color: '#1890ff' }} />
            </p>
            <p style={{ margin: '8px 0 0' }}>Click or drag the PDF here</p>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              PDF only, up to {formatFileSize(MAX_FILE_SIZE_BYTES)}
            </Typography.Text>
          </Upload.Dragger>

          {file ? (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PictureAsPdfIcon style={{ fontSize: 18, color: '#d4380d' }} />
              <Typography.Text ellipsis style={{ flex: 1 }}>
                {file.name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {formatFileSize(file.size)}
              </Typography.Text>
              <Button size="small" type="link" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          ) : (
            isEdit &&
            editGuide?.fileName && (
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Current file: {editGuide.fileName} ({formatFileSize(editGuide.fileSizeBytes)})
              </Typography.Text>
            )
          )}
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default GuideFormDrawer;
