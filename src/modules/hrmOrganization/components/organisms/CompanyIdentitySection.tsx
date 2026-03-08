'use client';

import React, { useCallback } from 'react';
import { Input, Select, DatePicker, Upload, Button, message } from 'antd';
import { CloudUploadOutlined, ShopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import OrgFormField from '../molecules/OrgFormField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { HrmOrganizationService } from '../../services/hrmOrganizationService';
import { INDUSTRY_OPTIONS } from '../../utils/constants';
import type { CompanyIdentitySectionProps } from '../../types/ui.types';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
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
        const cookies = parseCookies();
        const site = cookies.site || '';
        const userId = cookies.rl_user_id || cookies.userId || 'system';
        const companyHandle = companyProfile.data?.handle || '';

        if (companyHandle) {
          const result = await HrmOrganizationService.uploadLogo(
            site,
            companyHandle,
            file,
            userId
          );
          setCompanyDraft({ logoUrl: result.logoUrl });
          message.success('Logo uploaded successfully');
        } else {
          // For new companies, create local URL preview
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setCompanyDraft({ logoUrl: dataUrl });
          };
          reader.readAsDataURL(file);
          message.info('Logo will be uploaded after saving');
        }
      } catch {
        message.error('Failed to upload logo');
      }
      return false; // Prevent default upload behavior
    },
    [companyProfile.data?.handle, setCompanyDraft]
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

        <OrgFormField label="Founded Date" required error={errors.foundedDate || errors.incorporationDate}>
          <DatePicker
            value={(draft?.foundedDate || draft?.incorporationDate) ? dayjs(draft?.foundedDate || draft?.incorporationDate) : null}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            placeholder="Select date"
            disabled={disabled}
            style={{ width: '100%' }}
          />
        </OrgFormField>
      </div>
    </div>
  );
};

export default CompanyIdentitySection;
