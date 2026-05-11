'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Select,
  Input,
  Checkbox,
  Button,
  Form,
  Alert,
  Tag,
  message,
  Tooltip,
} from 'antd';
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import {
  HrmOrganizationService,
  type InitializeOrgResponse,
} from '../../services/hrmOrganizationService';
import { EmployeeKeycloakService } from '../../../hrmEmployee/services/keycloakService';

interface InitializeOrgModalProps {
  open: boolean;
  onClose: () => void;
}

const InitializeOrgModal: React.FC<InitializeOrgModalProps> = ({ open, onClose }) => {
  const companyList = useHrmOrganizationStore((s) => s.companyList);
  const initializedOrgIds = useHrmOrganizationStore((s) => s.initializedOrgIds);
  const markOrgInitialized = useHrmOrganizationStore((s) => s.markOrgInitialized);

  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InitializeOrgResponse | null>(null);

  // Active companies only — inactive ones shouldn't be bootstrapped.
  const eligibleCompanies = useMemo(
    () => companyList.items.filter((c) => c.active === 1),
    [companyList.items],
  );

  const initializedSet = useMemo(
    () => new Set(initializedOrgIds.map((x) => x.toUpperCase())),
    [initializedOrgIds],
  );

  const selectedCompany = useMemo(
    () => eligibleCompanies.find((c) => c.handle === selectedHandle) ?? null,
    [eligibleCompanies, selectedHandle],
  );

  // organizationId convention used by BE init endpoint = legalName trimmed,
  // whitespace runs collapsed to underscores, uppercased server-side.
  const deriveOrgId = (legalName: string): string =>
    legalName.trim().replace(/\s+/g, '_').toUpperCase();

  const selectedOrgId = selectedCompany ? deriveOrgId(selectedCompany.legalName) : '';
  const isAlreadyInitialized =
    !!selectedOrgId && initializedSet.has(selectedOrgId.toUpperCase());

  // Auto-fill admin email from the selected company's officialEmail.
  useEffect(() => {
    if (selectedCompany) {
      setAdminEmail(selectedCompany.officialEmail || '');
    } else {
      setAdminEmail('');
    }
  }, [selectedCompany]);

  // Reset form on close so the next open is clean.
  useEffect(() => {
    if (!open) {
      setSelectedHandle(null);
      setAdminEmail('');
      setPassword('');
      setSendCredentialsEmail(true);
      setResult(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleGeneratePassword = () => {
    setPassword(EmployeeKeycloakService.generateTemporaryPassword());
  };

  const handleSubmit = async () => {
    if (!selectedCompany || !selectedOrgId) {
      message.error('Select an organization first.');
      return;
    }
    if (isAlreadyInitialized) {
      message.warning('This organization is already initialized.');
      return;
    }
    if (!adminEmail.trim()) {
      message.error('Admin email is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await HrmOrganizationService.initializeOrganization({
        organizationId: selectedOrgId,
        adminEmail: adminEmail.trim(),
        password: password || undefined,
        sendCredentialsEmail,
      });
      setResult(res);

      if (res.alreadyInitialized) {
        markOrgInitialized(selectedOrgId);
        message.warning(res.message || 'Organization is already initialized.');
        return;
      }

      if (res.success) {
        markOrgInitialized(selectedOrgId);
        message.success(res.message || 'Organization initialized successfully.');
      } else {
        message.error(res.message || 'Initialization failed.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Initialization failed.';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    !selectedHandle || !adminEmail.trim() || isAlreadyInitialized || submitting;

  return (
    <Modal
      title={
        <span>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#faad14' }} />
          Initialize Organization
        </span>
      }
      open={open}
      onCancel={submitting ? undefined : onClose}
      maskClosable={!submitting}
      width={560}
      footer={
        result?.success && !result?.alreadyInitialized ? (
          <Button type="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitDisabled}
              icon={<ThunderboltOutlined />}
            >
              Initialize
            </Button>
          </>
        )
      }
    >
      {result?.success && !result?.alreadyInitialized ? (
        <Alert
          type="success"
          showIcon
          message="Initialization complete"
          description={
            <div>
              <p style={{ margin: '4px 0' }}>{result.message}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {result.adminUserId && (
                  <Tag color="blue">Admin: {result.adminUserId}</Tag>
                )}
                {result.roleAssigned && (
                  <Tag color="purple">Role: {result.roleAssigned}</Tag>
                )}
                {result.modulesRegistered != null && (
                  <Tag color="cyan">{result.modulesRegistered} modules</Tag>
                )}
                {result.permissionsCreated != null && (
                  <Tag color="geekblue">{result.permissionsCreated} permissions</Tag>
                )}
                {result.keycloakUserCreated && <Tag color="green">Keycloak user created</Tag>}
              </div>
            </div>
          }
        />
      ) : (
        <Form layout="vertical">
          <Form.Item
            label="Organization"
            required
            tooltip="Active companies only. Already-initialized ones are disabled."
          >
            <Select
              placeholder="Select an organization to initialize"
              value={selectedHandle ?? undefined}
              onChange={(v) => setSelectedHandle(v)}
              showSearch
              optionFilterProp="label"
              loading={companyList.isLoading}
              options={eligibleCompanies.map((c) => {
                const orgId = deriveOrgId(c.legalName);
                const initialized = initializedSet.has(orgId.toUpperCase());
                return {
                  value: c.handle,
                  label: c.legalName,
                  disabled: initialized,
                  data: { orgId, initialized },
                };
              })}
              optionRender={(opt) => {
                const data = (opt.data as { data?: { orgId: string; initialized: boolean } })
                  ?.data;
                return (
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{opt.label}</span>
                    {data?.initialized && (
                      <Tag color="default" style={{ marginRight: 0 }}>
                        Already initialized
                      </Tag>
                    )}
                  </span>
                );
              }}
            />
          </Form.Item>

          {selectedCompany && (
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: -12, marginBottom: 12 }}>
              Org ID: <code>{selectedOrgId}</code>
            </div>
          )}

          {isAlreadyInitialized && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message="This organization is already initialized. Pick a different one."
            />
          )}

          <Form.Item
            label="Admin Email"
            required
            extra="Used as the admin login (username) in Keycloak."
          >
            <Input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@company.com"
            />
          </Form.Item>

          <Form.Item
            label="Temporary Password"
            extra="Leave empty to auto-generate a secure password."
          >
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Auto-generated if empty"
              addonAfter={
                <Tooltip title="Generate secure password">
                  <Button
                    size="small"
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={handleGeneratePassword}
                  >
                    Generate
                  </Button>
                </Tooltip>
              }
            />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={sendCredentialsEmail}
              onChange={(e) => setSendCredentialsEmail(e.target.checked)}
            >
              Send credentials to admin email
            </Checkbox>
          </Form.Item>

          {result?.success === false && !result?.alreadyInitialized && (
            <Alert
              type="error"
              showIcon
              message="Initialization failed"
              description={result.message}
            />
          )}
        </Form>
      )}
    </Modal>
  );
};

export default InitializeOrgModal;
