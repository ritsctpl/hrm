'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button, Spin, Skeleton, message } from 'antd';
import { EditOutlined, CloseOutlined, CheckCircleOutlined, FileTextOutlined, BankOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import CompanyIdentitySection from './CompanyIdentitySection';
import CompanyStatutorySection from './CompanyStatutorySection';
import CompanyBankSection from './CompanyBankSection';
import CompanyAddressSection from './CompanyAddressSection';
import CompanyFinancialYearSection from './CompanyFinancialYearSection';
import OrgSaveButton from '../atoms/OrgSaveButton';
import Can from '../../../hrmAccess/components/Can';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import mainStyles from '../../styles/HrmOrganization.module.css';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: 'identity', title: 'Identity', icon: <CheckCircleOutlined /> },
  { id: 'statutory', title: 'Statutory Details', icon: <FileTextOutlined /> },
  { id: 'addresses', title: 'Addresses', icon: <EnvironmentOutlined /> },
  { id: 'bank', title: 'Bank Accounts', icon: <BankOutlined /> },
  { id: 'financial', title: 'Financial Year', icon: <CalendarOutlined /> },
];

// Helper to check if section is visible based on permissions
const getSectionVisibility = (sectionId: string, permissions: ReturnType<typeof useOrganizationPermissions>) => {
  switch (sectionId) {
    case 'identity': return permissions.canViewIdentity;
    case 'statutory': return permissions.canViewStatutory;
    case 'addresses': return permissions.canViewAddresses;
    case 'bank': return permissions.canViewBankAccounts;
    case 'financial': return permissions.canViewFinancialYear;
    default: return false;
  }
};

const CompanyProfileForm: React.FC = () => {
  const {
    companyProfile,
    setCompanyEditing,
    saveCompanyProfile,
  } = useHrmOrganizationStore();
  
  const permissions = useOrganizationPermissions();
  const get = useHrmOrganizationStore.getState;

  const { isLoading, isSaving, isEditing, data, errors } = companyProfile;
  const [activeSection, setActiveSection] = useState<string>('identity');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleEdit = useCallback(() => {
    setCompanyEditing(true);
  }, [setCompanyEditing]);

  const handleCancel = useCallback(() => {
    setCompanyEditing(false);
  }, [setCompanyEditing]);

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      await saveCompanyProfile();

      const updatedState = get().companyProfile;
      const errorKeys = Object.keys(updatedState.errors).filter(key => key !== '_general');

      if (errorKeys.length > 0) {
        const errorMessages = errorKeys.map(key => `${key}: ${updatedState.errors[key]}`).join('\n');
        message.error(errorMessages);
      } else if (updatedState.errors._general) {
        message.error(updatedState.errors._general);
      } else {
        message.success('Company profile saved successfully');
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 1500);
      }
    } catch {
      message.error('Failed to save company profile');
    }
  }, [saveCompanyProfile]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      
      for (const section of SECTIONS) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active title={{ width: '30%' }} paragraph={false} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid #f0f0f0' }}>
            <Skeleton active title={{ width: '20%' }} paragraph={{ rows: 3, width: ['60%', '80%', '40%'] }} />
          </div>
        ))}
      </div>
    );
  }

  const isNew = !data;
  const isDisabled = !isEditing && !isNew;

  // Filter sections based on permissions
  const visibleSections = SECTIONS.filter(section => getSectionVisibility(section.id, permissions));

  // Section-specific disabled states based on permissions
  // When creating new company (isNew), check ADD permission
  // When editing existing company, check EDIT permission
  const sectionDisabled = {
    identity: isNew ? !permissions.canAddIdentity : (isDisabled || !permissions.canEditIdentity),
    statutory: isNew ? !permissions.canAddStatutory : (isDisabled || !permissions.canEditStatutory),
    addresses: isNew ? !permissions.canAddAddresses : (isDisabled || !permissions.canEditAddresses),
    bank: isNew ? !permissions.canAddBankAccounts : (isDisabled || !permissions.canEditBankAccounts),
    financial: isNew ? !permissions.canAddFinancialYear : (isDisabled || !permissions.canEditFinancialYear),
  };

  return (
    <div style={{ display: 'flex', gap: '0', height: '100%', minHeight: 0, position: 'relative' }}>
      {/* Save success flash */}
      {showSaveSuccess && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(82, 196, 26, 0.08)',
          zIndex: 50,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeOut 1.5s ease forwards',
        }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', opacity: 0.6 }} />
        </div>
      )}
      {/* Left Vertical Timeline - Fixed to content area */}
      <div style={{
        width: '220px',
        position: 'sticky',
        top: '0',
        height: '100%',
        overflowY: 'auto',
        padding: '24px 16px',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #f0f0f0',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#8c8c8c', marginBottom: '16px', textTransform: 'uppercase' }}>
          Sections
        </div>

        {visibleSections.map((section, index) => {
          const d = companyProfile.draft || companyProfile.data;
          const dr = d as Record<string, unknown> | null | undefined;
          const sectionCompletion: Record<string, [number, number]> = {
            identity: [['legalName', 'officialEmail', 'officialPhone'].filter(f => !!dr?.[f]).length, 3],
            statutory: [['pan', 'tan', 'cin'].filter(f => !!dr?.[f]).length, 3],
            addresses: [
              (d?.registeredOfficeAddress?.line1 || d?.registeredAddress?.line1) ? 1 : 0, 
              1
            ],
            bank: [Math.min(d?.bankAccounts?.length ?? 0, 1), 1],
            financial: [['financialYearStartMonth', 'financialYearEndMonth'].filter(f => !!dr?.[f]).length, 2],
          };
          const [filled, total] = sectionCompletion[section.id] || [0, 1];
          const pct = Math.round((filled / total) * 100);
          return (
          <div key={section.id} style={{ position: 'relative', marginBottom: '4px' }}>
            {/* Timeline line */}
            {index < visibleSections.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '31px',
                top: '48px',
                width: '2px',
                height: '32px',
                backgroundColor: activeSection === section.id || visibleSections.slice(0, index + 1).some(s => s.id === activeSection) ? '#1890ff' : '#d9d9d9',
                transition: 'background-color 0.3s ease',
              }} />
            )}

            {/* Section item */}
            <div
              onClick={() => handleSectionClick(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeSection === section.id ? '#e6f7ff' : 'transparent',
                border: activeSection === section.id ? '1px solid #91d5ff' : '1px solid transparent',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Icon circle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: activeSection === section.id ? '#1890ff' : '#d9d9d9',
                color: activeSection === section.id ? '#fff' : '#666',
                fontSize: '14px',
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}>
                {section.icon}
              </div>

              {/* Title + completion */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: activeSection === section.id ? '600' : '500',
                  color: activeSection === section.id ? '#1890ff' : '#666',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {section.title}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: pct === 100 ? '#52c41a' : '#8c8c8c',
                  fontWeight: pct === 100 ? 600 : 400,
                  marginTop: 1,
                }}>
                  {pct}%
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* Main Content - Offset by sidebar width */}
      <div className={mainStyles.companyProfileContainer} style={{ flex: 1, paddingRight: '24px', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {/* Header with title only */}
        <div className={mainStyles.companyFormHeader}>
          <h2 className={mainStyles.companyFormTitle}>Company Profile</h2>
        </div>

        {errors._general && (
          <div style={{ color: '#ff4d4f', marginBottom: 12 }}>{errors._general}</div>
        )}

        {/* Section 1: Identity */}
        {permissions.canViewIdentity && (
          <div
            ref={(el) => { if (el) sectionRefs.current['identity'] = el; }}
            className={mainStyles.profileSection}
          >
            <div className={mainStyles.profileSectionTitle}>Identity</div>
            <CompanyIdentitySection disabled={sectionDisabled.identity} />
          </div>
        )}

        {/* Section 2: Statutory Details */}
        {permissions.canViewStatutory && (
          <div
            ref={(el) => { if (el) sectionRefs.current['statutory'] = el; }}
            className={mainStyles.profileSection}
          >
            <div className={mainStyles.profileSectionTitle}>Statutory Details</div>
            <CompanyStatutorySection disabled={sectionDisabled.statutory} />
          </div>
        )}

        {/* Section 3: Addresses */}
        {permissions.canViewAddresses && (
          <div
            ref={(el) => { if (el) sectionRefs.current['addresses'] = el; }}
            className={mainStyles.profileSection}
          >
            <div className={mainStyles.profileSectionTitle}>Addresses</div>
            <CompanyAddressSection disabled={sectionDisabled.addresses} />
          </div>
        )}

        {/* Section 4: Bank Accounts */}
        {permissions.canViewBankAccounts && (
          <div
            ref={(el) => { if (el) sectionRefs.current['bank'] = el; }}
            className={mainStyles.profileSection}
          >
            <div className={mainStyles.profileSectionTitle}>Bank Accounts</div>
            <CompanyBankSection disabled={sectionDisabled.bank} />
          </div>
        )}

        {/* Section 5: Financial Year */}
        {permissions.canViewFinancialYear && (
          <div
            ref={(el) => { if (el) sectionRefs.current['financial'] = el; }}
            className={mainStyles.profileSection}
          >
            <div className={mainStyles.profileSectionTitle}>Financial Year</div>
            <CompanyFinancialYearSection disabled={sectionDisabled.financial} />
          </div>
        )}

        {/* Bottom actions for long form */}
        {(isEditing || isNew) && permissions.canEditIdentity && (
          <div className={mainStyles.companyActions}>
            {data && (
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                size="small"
              >
                Cancel
              </Button>
            )}
            <Can I={isNew ? 'add' : 'edit'}>
              <OrgSaveButton
                loading={isSaving}
                onClick={handleSave}
                label={data ? 'Update' : 'Create'}
              />
            </Can>
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      {(isEditing || isNew) && (
        <Can I={isNew ? 'add' : 'edit'}>
          <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
          }}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={isSaving}
              onClick={handleSave}
              style={{
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
              }}
              title={data ? 'Update' : 'Create'}
            />
          </div>
        </Can>
      )}
    </div>
  );
};

export default CompanyProfileForm;
