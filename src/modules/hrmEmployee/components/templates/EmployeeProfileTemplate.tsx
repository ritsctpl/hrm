/**
 * EmployeeProfileTemplate - Template layout for the full-page employee profile
 * Renders CommonAppBar, a compact header with avatar + name, and consolidated Ant Design Tabs.
 *
 * Consolidated tabs (from 13 → 5):
 *   1. Overview       — Basic + Official + Personal
 *   2. Contact & Family — Contact details
 *   3. Career          — Skills + Job History + Experience + Education + Training
 *   4. Documents & Assets — Documents + Assets
 *   5. Compensation    — Remuneration + Leave Summary
 */

'use client';

import React from 'react';
import { Tabs, Button, Spin, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import CommonAppBar from '@/components/CommonAppBar';
import EmpAvatar from '../atoms/EmpAvatar';
import EmpStatusBadge from '../atoms/EmpStatusBadge';
import BasicDetailsTab from '../organisms/BasicDetailsTab';
import OfficialDetailsTab from '../organisms/OfficialDetailsTab';
import PersonalDetailsTab from '../organisms/PersonalDetailsTab';
import ContactDetailsTab from '../organisms/ContactDetailsTab';
import SkillsTab from '../organisms/SkillsTab';
import JobHistoryTab from '../organisms/JobHistoryTab';
import PreviousExperienceTab from '../organisms/PreviousExperienceTab';
import EducationTab from '../organisms/EducationTab';
import TrainingCertTab from '../organisms/TrainingCertTab';
import DocumentsTab from '../organisms/DocumentsTab';
import AssetsTab from '../organisms/AssetsTab';
import RemunerationTab from './RemunerationTab';
import LeaveSummaryTab from './LeaveSummaryTab';
import { PROFILE_TABS } from '../../utils/constants';
import type { EmployeeProfile } from '../../types/domain.types';
import type { EmployeeStatus } from '../../types/domain.types';
import type { ProfileTabKey } from '../../types/ui.types';
import styles from '../../styles/HrmEmployee.module.css';

const { Text } = Typography;

/** Shared card-style section wrapper used inside consolidated tabs */
const ProfileSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      border: '1px solid #e2e8f0',
    }}
  >
    <h4
      style={{
        margin: '0 0 12px 0',
        paddingBottom: 8,
        borderBottom: '1px solid #e2e8f0',
        fontSize: 15,
        fontWeight: 600,
        color: '#1e293b',
      }}
    >
      {title}
    </h4>
    {children}
  </div>
);

interface EmployeeProfileTemplateProps {
  profile: EmployeeProfile;
  isLoading: boolean;
  isEditing: boolean;
  isSaving: boolean;
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
  onEdit: () => void;
  onSave: (section: string, data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  onRefresh: () => void;
}

const EmployeeProfileTemplate: React.FC<EmployeeProfileTemplateProps> = ({
  profile,
  isLoading,
  isEditing,
  isSaving,
  activeTab,
  onTabChange,
  onEdit,
  onSave,
  onBack,
  onRefresh,
}) => {
  if (isLoading || !profile) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const basicDetails = profile.basicDetails || { fullName: '', workEmail: '', phone: '', status: 'ACTIVE' };
  const officialDetails = profile.officialDetails || { firstName: '', lastName: '', title: '', department: '', designation: '', businessUnits: [], joiningDate: '' };
  const employeeCode = profile.employeeCode || '';

  const tabProps = { profile, isEditing, isSaving, onSave };

  /** Build consolidated tab content */
  const tabItems = PROFILE_TABS.map((tab) => {
    let content: React.ReactNode = null;

    switch (tab.key) {
      /* ---- Overview: Basic + Official + Personal ---- */
      case 'overview':
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection title="Basic Details">
              <BasicDetailsTab {...tabProps} />
            </ProfileSection>
            <ProfileSection title="Official Details">
              <OfficialDetailsTab {...tabProps} />
            </ProfileSection>
            <ProfileSection title="Personal Details">
              <PersonalDetailsTab {...tabProps} />
            </ProfileSection>
          </div>
        );
        break;

      /* ---- Contact & Family ---- */
      case 'contactFamily':
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection title="Contact Details">
              <ContactDetailsTab {...tabProps} />
            </ProfileSection>
          </div>
        );
        break;

      /* ---- Career: Skills + Job History + Experience + Education + Training ---- */
      case 'career':
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection title="Skills">
              <SkillsTab {...tabProps} onRefresh={onRefresh} />
            </ProfileSection>
            <ProfileSection title="Job History">
              <JobHistoryTab {...tabProps} />
            </ProfileSection>
            <ProfileSection title="Previous Experience">
              <PreviousExperienceTab {...tabProps} onRefresh={onRefresh} />
            </ProfileSection>
            <ProfileSection title="Education">
              <EducationTab {...tabProps} onRefresh={onRefresh} />
            </ProfileSection>
            <ProfileSection title="Training & Certifications">
              <TrainingCertTab {...tabProps} />
            </ProfileSection>
          </div>
        );
        break;

      /* ---- Documents & Assets ---- */
      case 'documentsAssets':
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection title="Documents">
              <DocumentsTab {...tabProps} onRefresh={onRefresh} />
            </ProfileSection>
            <ProfileSection title="Assets">
              <AssetsTab {...tabProps} />
            </ProfileSection>
          </div>
        );
        break;

      /* ---- Compensation: Remuneration + Leave Summary ---- */
      case 'compensation':
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection title="Remuneration">
              <RemunerationTab profile={profile} onRefresh={onRefresh} />
            </ProfileSection>
            <ProfileSection title="Leave Summary">
              <LeaveSummaryTab profile={profile} />
            </ProfileSection>
          </div>
        );
        break;
    }

    return {
      key: tab.key,
      label: tab.label,
      children: content,
    };
  });

  return (
    <div className={styles.profileWrapper}>
      {/* App Bar */}
      <CommonAppBar appTitle="Employee Profile" />

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginRight: 8 }}
        >
          Back
        </Button>
        <EmpAvatar
          name={basicDetails.fullName}
          photoUrl={basicDetails.photoUrl}
          size={64}
        />
        <div className={styles.profileHeaderInfo}>
          <h2 className={styles.profileName}>{basicDetails.fullName}</h2>
          <div className={styles.profileMeta}>
            <span>{employeeCode}</span>
            <span>{officialDetails.designation}</span>
            <span>{officialDetails.department}</span>
            {officialDetails.reportingManager && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Reports to: {officialDetails.reportingManager}
              </Text>
            )}
            <EmpStatusBadge status={basicDetails.status as EmployeeStatus} size="small" />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 2, fontSize: 12, color: '#64748b' }}>
            <span>{basicDetails.workEmail}</span>
            <span>{basicDetails.phone}</span>
            {officialDetails.businessUnits?.length > 0 && (
              <span>{officialDetails.businessUnits.join(', ')}</span>
            )}
          </div>
        </div>
        <div className={styles.profileActions}>
          {isEditing ? (
            <>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={isSaving}
                onClick={() => onSave(activeTab, {})}
              >
                Save
              </Button>
              <Button icon={<CloseOutlined />} onClick={onBack}>
                Cancel
              </Button>
            </>
          ) : (
            <Button icon={<EditOutlined />} onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.profileTabsWrapper}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => onTabChange(key as ProfileTabKey)}
          items={tabItems}
          size="small"
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>
    </div>
  );
};

export default EmployeeProfileTemplate;
