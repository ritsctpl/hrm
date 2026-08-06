'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Drawer, Form, Input, Select, Space, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined } from '@ant-design/icons';
import type { Ticket, TicketCategory } from '../../types/domain.types';
import type { TicketFormValues } from '../../types/ui.types';
import {
  MAX_ATTACHMENTS_PER_POST,
  MAX_ATTACHMENT_BYTES,
  PRIORITY_OPTIONS,
} from '../../utils/ticketConstants';
import { flattenCategoryOptions, formatBytes, previewLocalFile } from '../../utils/ticketHelpers';
import { useTicketEmployeeOptions } from '../../hooks/useTicketEmployeeOptions';
import { HrmTicketService } from '../../services/hrmTicketService';
import { getOrganizationId } from '@/utils/cookieUtils';

interface Props {
  open: boolean;
  categories: TicketCategory[];
  editTicket?: Ticket | null;
  saving: boolean;
  /** True when the viewer may set CRITICAL and file on someone else's behalf. */
  isAgent?: boolean;
  onClose: () => void;
  onSubmit: (values: TicketFormValues, files: File[]) => Promise<boolean>;
}

const RaiseTicketDrawer: React.FC<Props> = ({
  open,
  categories,
  editTicket,
  saving,
  isAgent = false,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<TicketFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [agentOptions, setAgentOptions] = useState<{ value: string; label: string }[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const {
    options: employeeOptions,
    loading: employeesLoading,
    toCompositeList,
  } = useTicketEmployeeOptions();

  // Re-runs when the directory arrives so stored bare codes resolve to the composite values the
  // picker offers — otherwise an edit opened first shows raw codes it cannot match.
  useEffect(() => {
    if (!open) return;
    if (editTicket) {
      form.setFieldsValue({
        categoryCode: editTicket.categoryCode,
        subject: editTicket.subject,
        description: editTicket.description,
        priority: editTicket.priority,
        tags: editTicket.tags,
        watcherCodes: toCompositeList(editTicket.watcherCodes),
      });
      setSelectedCategory(editTicket.categoryCode);
    } else {
      form.resetFields();
      setSelectedCategory(undefined);
    }
  }, [open, editTicket, form, employeeOptions, toCompositeList]);

  // Attachments are cleared only on open, not on every directory refresh — folding this into the
  // effect above would drop the user's chosen files when the employee list resolves.
  useEffect(() => {
    if (open) setFileList([]);
  }, [open]);

  /**
   * Who can take this ticket, for the category currently chosen.
   *
   * Fetched per category rather than from the shared store: the assignee list is the serving
   * group's membership, so it changes with the category, and reusing the detail panel's copy would
   * offer agents from whichever ticket was open last. Kept local for the same reason.
   */
  useEffect(() => {
    if (!open || !isAgent || !selectedCategory) {
      setAgentOptions([]);
      return;
    }
    let cancelled = false;
    setAgentsLoading(true);
    HrmTicketService.assignableAgents({ organizationId: getOrganizationId(), code: selectedCategory })
      .then((agents) => {
        if (!cancelled) setAgentOptions(agents.map((a) => ({ value: a, label: a })));
      })
      .catch(() => {
        // A category whose group has been removed has nobody to assign to. The field simply shows
        // no options — raising unassigned still works, which is the useful fallback.
        if (!cancelled) setAgentOptions([]);
      })
      .finally(() => {
        if (!cancelled) setAgentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isAgent, selectedCategory]);

  /** The guidance an administrator attached to the chosen category ("include your asset tag"). */
  const guidance = React.useMemo(() => {
    const flat = categories.flatMap((c) => [c, ...(c.children ?? [])]);
    return flat.find((c) => c.categoryCode === selectedCategory)?.requesterGuidance;
  }, [categories, selectedCategory]);

  const handleFinish = async (values: TicketFormValues) => {
    const files = fileList
      .map((item) => item.originFileObj as File)
      .filter((file): file is File => Boolean(file));
    const ok = await onSubmit(values, files);
    if (ok) {
      form.resetFields();
      setFileList([]);
      onClose();
    }
  };

  return (
    <Drawer
      title={editTicket ? `Edit ${editTicket.ticketNumber}` : 'Raise a ticket'}
      open={open}
      onClose={onClose}
      width={520}
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {editTicket ? 'Save changes' : 'Raise ticket'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        <Form.Item
          name="categoryCode"
          label="Category"
          rules={[{ required: true, message: 'Choose the category this issue belongs to' }]}
          extra="The category decides which support team picks this up."
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="What is this about?"
            options={flattenCategoryOptions(categories)}
            onChange={(value) => {
              setSelectedCategory(value);
              // The queue changed, so last pick may not be on the new one — clearing beats
              // submitting an assignee the backend will reject.
              form.setFieldValue('assignedToCode', undefined);
            }}
          />
        </Form.Item>

        {guidance ? (
          <Alert type="info" showIcon message={guidance} style={{ marginBottom: 16 }} />
        ) : null}

        <Form.Item
          name="subject"
          label="Subject"
          rules={[
            { required: true, message: 'A one-line summary is required' },
            { max: 200, message: 'Keep the subject under 200 characters' },
          ]}
        >
          <Input placeholder="Short summary — e.g. Laptop will not power on" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Describe what is wrong' }]}
          extra="What happened, what you expected, and anything you have already tried."
        >
          <Input.TextArea rows={6} />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          extra={
            isAgent
              ? undefined
              : 'Critical is reserved for the support team; a critical request is raised as High.'
          }
        >
          <Select
            allowClear
            placeholder="Leave blank to use the category default"
            options={
              isAgent ? PRIORITY_OPTIONS : PRIORITY_OPTIONS.filter((o) => o.value !== 'CRITICAL')
            }
          />
        </Form.Item>

        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="Optional labels" tokenSeparators={[',']} />
        </Form.Item>

        {isAgent && !editTicket ? (
          <Form.Item
            name="assignedToCode"
            label="Assign to"
            extra="Optional — leave blank to let the ticket sit in the queue for an agent to claim."
          >
            <Select
              showSearch
              allowClear
              loading={agentsLoading}
              optionFilterProp="label"
              placeholder={
                selectedCategory ? 'Choose an agent from this queue' : 'Pick a category first'
              }
              disabled={!selectedCategory}
              options={agentOptions}
              notFoundContent={
                agentsLoading ? 'Loading agents…' : 'No agents in this category\u2019s support group'
              }
            />
          </Form.Item>
        ) : null}

        <Form.Item
          name="watcherCodes"
          label="Keep informed"
          extra="Colleagues copied on every update to this ticket."
        >
          <Select
            mode="multiple"
            showSearch
            allowClear
            loading={employeesLoading}
            optionFilterProp="label"
            maxTagCount="responsive"
            placeholder="Search by name or employee code"
            options={employeeOptions}
            notFoundContent={employeesLoading ? 'Loading employees…' : 'No matching employee'}
          />
        </Form.Item>

        {isAgent && !editTicket ? (
          <Form.Item
            name="onBehalfOfCode"
            label="Raise on behalf of"
            extra="The ticket belongs to this employee; you stay recorded as the person who filed it."
          >
            <Select
              showSearch
              allowClear
              loading={employeesLoading}
              optionFilterProp="label"
              placeholder="Leave blank to raise for yourself"
              options={employeeOptions}
              notFoundContent={employeesLoading ? 'Loading employees…' : 'No matching employee'}
            />
          </Form.Item>
        ) : null}

        <Form.Item label="Attachments">
          <Upload
            multiple
            // picture list so an attached screenshot is recognisable before it is sent; clicking
            // one opens it, so a wrong file is caught here rather than after the ticket is raised.
            listType="picture"
            onPreview={(file) => previewLocalFile(file.originFileObj as File)}
            fileList={fileList}
            // Held in memory and encoded on submit — the backend takes base64 inline, matching the
            // Asset and User Guide contract rather than a multipart upload.
            beforeUpload={(file) => {
              if (file.size > MAX_ATTACHMENT_BYTES) {
                message.error(
                  `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_ATTACHMENT_BYTES)}`,
                );
                return Upload.LIST_IGNORE;
              }
              if (fileList.length >= MAX_ATTACHMENTS_PER_POST) {
                message.error(`Up to ${MAX_ATTACHMENTS_PER_POST} files per ticket`);
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            onChange={({ fileList: next }) => setFileList(next)}
            onRemove={(file) => {
              setFileList((current) => current.filter((item) => item.uid !== file.uid));
              return true;
            }}
          >
            <Button icon={<UploadOutlined />} size="small">
              Add files
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default RaiseTicketDrawer;
