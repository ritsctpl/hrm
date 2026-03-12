'use client';

import React, { useState, useCallback } from 'react';
import { Modal, Input, Select, Switch, message, Button } from 'antd';
import OrgFormField from '../molecules/OrgFormField';
import OrgBankAccountList from '../molecules/OrgBankAccountList';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { ACCOUNT_TYPE_OPTIONS, EMPTY_BANK_ACCOUNT } from '../../utils/constants';
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

  const resetForm = useCallback(() => {
    setFormData({ ...EMPTY_BANK_ACCOUNT });
    setFormErrors({});
    setEditingIndex(null);
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
    if (!formData.branchName.trim()) errs.branchName = 'Branch name is required';
    if (!formData.accountNumber.trim()) errs.accountNumber = 'Account number is required';
    if (!formData.ifscCode.trim()) errs.ifscCode = 'IFSC code is required';
    if (!formData.accountType) errs.accountType = 'Account type is required';

    if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      errs.ifscCode = 'Invalid IFSC code format';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

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
    (field: keyof BankAccount, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

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
          <Button key="submit" type="primary" onClick={handleSave}>
            {editingIndex !== null ? 'Update' : 'Save'}
          </Button>,
        ]}
      >
        <div className={formStyles.bankFormGrid}>
          <OrgFormField label="Bank Name" required error={formErrors.bankName}>
            <Input
              value={formData.bankName}
              onChange={(e) => handleFormChange('bankName', e.target.value)}
              placeholder="Enter bank name"
            />
          </OrgFormField>

          <OrgFormField label="Branch Name" required error={formErrors.branchName}>
            <Input
              value={formData.branchName}
              onChange={(e) => handleFormChange('branchName', e.target.value)}
              placeholder="Enter branch name"
            />
          </OrgFormField>

          <OrgFormField label="Account Number" required error={formErrors.accountNumber}>
            <Input
              value={formData.accountNumber}
              onChange={(e) => handleFormChange('accountNumber', e.target.value)}
              placeholder="Enter account number"
            />
          </OrgFormField>

          <OrgFormField label="IFSC Code" required error={formErrors.ifscCode}>
            <Input
              value={formData.ifscCode}
              onChange={(e) => handleFormChange('ifscCode', e.target.value.toUpperCase())}
              placeholder="e.g., SBIN0001234"
              maxLength={11}
            />
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
