'use client';

import React, { useState, useCallback } from 'react';
import { Modal, Input, Select, Switch, message, Button, AutoComplete, Spin } from 'antd';
import Can from '../../../hrmAccess/components/Can';
import { SearchOutlined, CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import OrgBankAccountList from '../molecules/OrgBankAccountList';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { ACCOUNT_TYPE_OPTIONS, EMPTY_BANK_ACCOUNT } from '../../utils/constants';
import { INDIAN_BANKS } from '../../utils/bankMaster';
import type { CompanyBankSectionProps } from '../../types/ui.types';
import type { BankAccount } from '../../types/domain.types';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const CompanyBankSection: React.FC<CompanyBankSectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, setCompanyDraft } = useHrmOrganizationStore();
  const bankAccounts = companyProfile.draft?.bankAccounts || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<BankAccount>({ ...EMPTY_BANK_ACCOUNT });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscLookupLoading, setIfscLookupLoading] = useState(false);
  const [ifscVerified, setIfscVerified] = useState(false);
  // Enabled when IFSC lookup returns "not found" — lets the user enter
  // bank/branch manually without silent bypass of the IFSC gate.
  const [ifscManualOverride, setIfscManualOverride] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_BANK_ACCOUNT });
    setFormErrors({});
    setEditingIndex(null);
    setConfirmAccountNumber('');
    setIfscVerified(false);
    setIfscManualOverride(false);
    setIfscLookupLoading(false);
  }, []);

  const handleAdd = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback(
    (index: number) => {
      const account = bankAccounts[index];
      setFormData({
        bankName: account.bankName || '',
        branchName: account.branchName || account.branch || '',
        accountNumber: account.accountNumber || '',
        ifscCode: account.ifscCode || account.ifsc || '',
        accountType: account.accountType || '',
        isPrimary: account.isPrimary || false,
        // Keep API field names for compatibility
        branch: account.branch || account.branchName || '',
        ifsc: account.ifsc || account.ifscCode || '',
      } as BankAccount);
      setEditingIndex(index);
      setFormErrors({});
      setModalOpen(true);
    },
    [bankAccounts]
  );

  const handleDelete = useCallback(
    (index: number) => {
      const updated = bankAccounts.filter((_, i) => i !== index);
      setCompanyDraft({ bankAccounts: updated });
      message.success('Bank account removed');
    },
    [bankAccounts, setCompanyDraft]
  );

  const handleSetPrimary = useCallback(
    (index: number) => {
      const updated = bankAccounts.map((acc, i) => ({
        ...acc,
        isPrimary: i === index,
      }));
      setCompanyDraft({ bankAccounts: updated });
    },
    [bankAccounts, setCompanyDraft]
  );

  const validateForm = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.bankName.trim()) errs.bankName = 'Bank name is required';
    if (!(formData.branchName || '').trim()) errs.branchName = 'Branch name is required';

    const acctNum = formData.accountNumber.trim();
    if (!acctNum) {
      errs.accountNumber = 'Account number is required';
    } else if (!/^[0-9]{10,18}$/.test(acctNum)) {
      // Aligned with backend rule — bank save was silently accepted by the
      // modal but rejected at final company create, confusing users.
      errs.accountNumber = 'Account number must be 10-18 digits';
    }

    if (acctNum && confirmAccountNumber !== acctNum) {
      errs.confirmAccountNumber = 'Account numbers do not match';
    }

    const ifsc = (formData.ifscCode || '').trim().toUpperCase();
    if (!ifsc) {
      errs.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      errs.ifscCode = 'IFSC format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)';
    }

    if (!formData.accountType) errs.accountType = 'Account type is required';

    // Require IFSC verification (or explicit manual-override after "not found")
    // so bank + branch can't be fabricated and passed to the backend.
    if (ifsc && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) && !ifscVerified && !ifscManualOverride) {
      errs.ifscCode = 'Verify IFSC (click the search button) before saving';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData, confirmAccountNumber, ifscVerified, ifscManualOverride]);

  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    // Normalize field names to API format
    const normalizedData: BankAccount = {
      bankName: formData.bankName,
      branch: formData.branchName || formData.branch || '',
      ifsc: formData.ifscCode?.toUpperCase() || formData.ifsc || '',
      accountNumber: formData.accountNumber,
      accountType: formData.accountType,
      isPrimary: formData.isPrimary || false,
      // Keep backward compat fields
      branchName: formData.branchName || formData.branch,
      ifscCode: formData.ifscCode?.toUpperCase() || formData.ifsc,
    };

    let updated: BankAccount[];
    if (editingIndex !== null) {
      updated = bankAccounts.map((acc, i) =>
        i === editingIndex ? normalizedData : acc
      );
    } else {
      // If this is the first account, make it primary
      if (bankAccounts.length === 0) {
        normalizedData.isPrimary = true;
      }
      updated = [...bankAccounts, normalizedData];
    }

    setCompanyDraft({ bankAccounts: updated });
    setModalOpen(false);
    resetForm();
    message.success(editingIndex !== null ? 'Bank account updated' : 'Bank account added');
  }, [validateForm, formData, editingIndex, bankAccounts, setCompanyDraft, resetForm]);

  const handleFormChange = useCallback(
    (field: keyof BankAccount | 'confirmAccountNumber', value: string | boolean) => {
      if (field === 'confirmAccountNumber') {
        setConfirmAccountNumber(value as string);
        setFormErrors((prev) => { const next = { ...prev }; delete next.confirmAccountNumber; return next; });
        return;
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

      // Reset IFSC verification gates when IFSC changes — both auto-verify
      // and manual-override must be re-established against the new code.
      if (field === 'ifscCode') {
        setIfscVerified(false);
        setIfscManualOverride(false);
      }
    },
    []
  );

  const handleIFSCLookup = useCallback(async () => {
    const ifsc = (formData.ifscCode || '').trim().toUpperCase();
    if (!ifsc || ifsc.length !== 11) {
      setFormErrors((prev) => ({ ...prev, ifscCode: 'Enter a valid 11-character IFSC code first' }));
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      setFormErrors((prev) => ({ ...prev, ifscCode: 'Invalid IFSC format' }));
      return;
    }

    setIfscLookupLoading(true);
    try {
      const { lookupIFSC } = await import('../../utils/bankMaster');
      const result = await lookupIFSC(ifsc);
      if (result) {
        setFormData((prev) => ({
          ...prev,
          bankName: result.bank,
          branchName: result.branch,
          branch: result.branch,
        }));
        setIfscVerified(true);
        setIfscManualOverride(false);
        setFormErrors((prev) => { const next = { ...prev }; delete next.ifscCode; delete next.bankName; delete next.branchName; return next; });
        message.success(`Found: ${result.bank} — ${result.branch}, ${result.city}`);
      } else {
        // Unknown IFSC — allow manual entry with explicit user acknowledgement
        // rather than silent bypass.
        setIfscVerified(false);
        setIfscManualOverride(true);
        setFormErrors((prev) => { const next = { ...prev }; delete next.ifscCode; return next; });
        message.warning('IFSC not found in lookup — enter bank & branch manually.');
      }
    } catch {
      setFormErrors((prev) => ({ ...prev, ifscCode: 'Lookup failed — enter bank details manually' }));
    } finally {
      setIfscLookupLoading(false);
    }
  }, [formData.ifscCode]);

  const bankNameOptions = INDIAN_BANKS
    .filter((b) => b.toLowerCase().includes((formData.bankName || '').toLowerCase()))
    .map((b) => ({ value: b, label: b }));

  return (
    <div>
      <OrgBankAccountList
        accounts={bankAccounts}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetPrimary={handleSetPrimary}
        disabled={disabled}
      />

      <Modal
        title={editingIndex !== null ? 'Edit Bank Account' : 'Add Bank Account'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          resetForm();
        }}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => {
            setModalOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>,
          <Can key="submit" I={editingIndex !== null ? 'edit' : 'add'}>
            <Button type="primary" onClick={handleSave}>
              {editingIndex !== null ? 'Update' : 'Save'}
            </Button>
          </Can>,
        ]}
      >
        <div className={formStyles.bankFormGrid}>
          <OrgFormField label="IFSC Code" required error={formErrors.ifscCode}>
            <Input.Search
              value={formData.ifscCode}
              onChange={(e) => handleFormChange('ifscCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onSearch={handleIFSCLookup}
              placeholder="e.g., SBIN0001234"
              maxLength={11}
              enterButton={
                ifscLookupLoading
                  ? <Spin indicator={<LoadingOutlined style={{ fontSize: 14, color: '#fff' }} />} />
                  : <SearchOutlined />
              }
              suffix={ifscVerified ? <CheckCircleFilled style={{ color: '#52c41a' }} /> : undefined}
              onBlur={() => {
                const ifsc = (formData.ifscCode || '').trim();
                if (ifsc.length === 11 && !ifscVerified) handleIFSCLookup();
              }}
            />
          </OrgFormField>

          <OrgFormField label="Bank Name" required error={formErrors.bankName}>
            <AutoComplete
              value={formData.bankName}
              onChange={(val) => handleFormChange('bankName', val)}
              options={bankNameOptions}
              placeholder="Type to search bank..."
              filterOption={false}
              style={{ width: '100%' }}
              disabled={ifscVerified && !ifscManualOverride}
            />
          </OrgFormField>

          <OrgFormField label="Branch Name" required error={formErrors.branchName}>
            <Input
              value={formData.branchName}
              onChange={(e) => handleFormChange('branchName', e.target.value)}
              placeholder="Enter branch name"
              disabled={ifscVerified && !ifscManualOverride}
            />
          </OrgFormField>

          <OrgFormField label="Account Number" required error={formErrors.accountNumber}>
            <Input.Password
              value={formData.accountNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                handleFormChange('accountNumber', digits);
              }}
              placeholder="10-18 digits"
              maxLength={18}
              visibilityToggle
            />
          </OrgFormField>

          <OrgFormField label="Re-enter Account Number" required error={formErrors.confirmAccountNumber}>
            <Input.Password
              value={confirmAccountNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                handleFormChange('confirmAccountNumber', digits);
              }}
              placeholder="Confirm account number"
              maxLength={18}
              visibilityToggle
            />
            {confirmAccountNumber && confirmAccountNumber === formData.accountNumber && (
              <div style={{ marginTop: 2, fontSize: 12, color: '#52c41a' }}>
                <CheckCircleFilled /> Account numbers match
              </div>
            )}
          </OrgFormField>

          <OrgFormField label="Account Type" required error={formErrors.accountType}>
            <Select
              value={formData.accountType || undefined}
              onChange={(val) => handleFormChange('accountType', val)}
              options={[...ACCOUNT_TYPE_OPTIONS]}
              placeholder="Select type"
              style={{ width: '100%' }}
            />
          </OrgFormField>

          <OrgFormField label="Primary Account">
            <Switch
              checked={formData.isPrimary}
              onChange={(checked) => handleFormChange('isPrimary', checked)}
            />
          </OrgFormField>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyBankSection;
