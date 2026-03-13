'use client';

import React, { useCallback } from 'react';
import { Input, Select, DatePicker, Upload, Button, message } from 'antd';
import { CloudUploadOutlined, ShopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import OrgFormField from '../molecules/OrgFormField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { INDUSTRY_OPTIONS } from '../../utils/constants';
import type { CompanyIdentitySectionProps } from '../../types/ui.types';
import type { RcFile } from 'antd/es/upload/interface';
import mainStyles from '../../styles/HrmOrganization.module.css';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const CompanyIdentitySection: React.FC<CompanyIdentitySectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, setCompanyDraft } = useHrmOrganizationStore();
  const draft = companyProfile.draft;
  const errors = companyProfile.errors;

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      setCompanyDraft({ [field]: value });
    },
    [setCompanyDraft]
  );

  const handleDateChange = useCallback(
    (_date: dayjs.Dayjs | null, dateString: string | string[]) => {
      const value = Array.isArray(dateString) ? dateString[0] : dateString;
      setCompanyDraft({ foundedDate: value });
    },
    [setCompanyDraft]
  );

  const handleLogoUpload = useCallback(
    async (file: RcFile): Promise<boolean> => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Only image files are allowed');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB');
        return false;
      }

      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          // Store base64 in logoUrl (will be sent in msmeUdyam field during save)
          setCompanyDraft({ logoUrl: base64String });
          message.success('Logo uploaded successfully');
        };
        reader.readAsDataURL(file);
      } catch {
        message.error('Failed to upload logo');
      }
      return false; // Prevent default upload behavior
    },
    [setCompanyDraft]
  );

  return (
    <div>
      {/* Logo Upload */}
      <div className={mainStyles.logoSection}>
        {draft?.logoUrl ? (
          <img src={draft.logoUrl} alt="Company Logo" className={mainStyles.logoPreview} />
        ) : (
          <div className={mainStyles.logoPlaceholder}>
            <ShopOutlined />
          </div>
        )}
        <div className={mainStyles.logoInfo}>
          <Upload
            showUploadList={false}
            beforeUpload={handleLogoUpload as unknown as (file: RcFile, fileList: RcFile[]) => boolean}
            accept="image/*"
            disabled={disabled}
          >
            <Button icon={<CloudUploadOutlined />} disabled={disabled}>
              Upload Logo
            </Button>
          </Upload>
          <div className={mainStyles.logoInfoText}>
            Recommended: 200x200px, PNG or JPG, max 2MB
          </div>
        </div>
      </div>

      {/* Identity Fields */}
      <div className={formStyles.identityGrid}>
        <OrgFormField label="Legal Name" required error={errors.legalName}>
          <Input
            value={draft?.legalName || ''}
            onChange={(e) => handleFieldChange('legalName', e.target.value)}
            placeholder="Enter legal name"
            disabled={disabled}
          />
        </OrgFormField>

        <OrgFormField label="Trade Name" error={errors.companyName}>
          <Input
            value={draft?.companyName || ''}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            placeholder="Enter trade name"
            disabled={disabled}
          />
        </OrgFormField>

        <OrgFormField label="Industry" required error={errors.industryType || errors.industry}>
          <Select
            value={draft?.industryType || draft?.industry || undefined}
            onChange={(val) => handleFieldChange('industryType', val)}
            placeholder="Select industry"
            options={[...INDUSTRY_OPTIONS]}
            showSearch
            optionFilterProp="label"
            disabled={disabled}
            style={{ width: '100%' }}
          />
        </OrgFormField>

        <OrgFormField label="Founded Date" error={errors.foundedDate || errors.incorporationDate}>
          <DatePicker
            value={(draft?.foundedDate || draft?.incorporationDate) ? dayjs(draft?.foundedDate || draft?.incorporationDate) : null}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            placeholder="Select date"
            disabled={disabled}
            style={{ width: '100%' }}
          />
        </OrgFormField>

        {/* Contact Information Fields */}
        <OrgFormField label="Official Email" required error={errors.officialEmail}>
          <Input
            value={draft?.officialEmail || ''}
            onChange={(e) => handleFieldChange('officialEmail', e.target.value)}
            placeholder="Enter official email"
            type="email"
            disabled={disabled}
          />
        </OrgFormField>

        <OrgFormField label="Official Phone" required error={errors.officialPhone}>
          <Input
            value={draft?.officialPhone || ''}
            onChange={(e) => handleFieldChange('officialPhone', e.target.value)}
            placeholder="Enter official phone"
            disabled={disabled}
          />
        </OrgFormField>
      </div>
    </div>
  );
};

export default CompanyIdentitySection;
