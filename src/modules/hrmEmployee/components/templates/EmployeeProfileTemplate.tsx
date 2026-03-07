/**
 * EmployeeProfileTemplate - Template layout for the full-page employee profile
 * Renders the header with avatar + name and the Ant Design Tabs for each section.
 */

'use client';

import React from 'react';
import { Tabs, Button, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
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
import { PROFILE_TABS } from '../../utils/constants';
import type { EmployeeProfile } from '../../types/domain.types';
import type { EmployeeStatus } from '../../types/domain.types';
import type { ProfileTabKey } from '../../types/ui.types';
import styles from '../../styles/HrmEmployee.module.css';

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

  const { basicDetails, officialDetails, employeeCode } = profile;

  const tabProps = { profile, isEditing, isSaving, onSave };

  const tabItems = PROFILE_TABS.map((tab) => {
    let content: React.ReactNode = null;

    switch (tab.key) {
      case 'basic':
        content = <BasicDetailsTab {...tabProps} />;
        break;
      case 'official':
        content = <OfficialDetailsTab {...tabProps} />;
        break;
      case 'personal':
        content = <PersonalDetailsTab {...tabProps} />;
        break;
      case 'contact':
        content = <ContactDetailsTab {...tabProps} />;
        break;
      case 'skills':
        content = <SkillsTab {...tabProps} onRefresh={onRefresh} />;
        break;
      case 'jobHistory':
        content = <JobHistoryTab {...tabProps} />;
        break;
      case 'experience':
        content = <PreviousExperienceTab {...tabProps} onRefresh={onRefresh} />;
        break;
      case 'education':
        content = <EducationTab {...tabProps} onRefresh={onRefresh} />;
        break;
      case 'training':
        content = <TrainingCertTab {...tabProps} />;
        break;
      case 'documents':
        content = <DocumentsTab {...tabProps} onRefresh={onRefresh} />;
        break;
      case 'assets':
        content = <AssetsTab {...tabProps} />;
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
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginRight: 8 }}
        />
        <EmpAvatar
          name={basicDetails.fullName}
          photoUrl={basicDetails.photoUrl}
          size={52}
        />
        <div className={styles.profileHeaderInfo}>
          <h2 className={styles.profileName}>{basicDetails.fullName}</h2>
          <div className={styles.profileMeta}>
            <span>{employeeCode}</span>
            <span>{officialDetails.designation}</span>
            <span>{officialDetails.department}</span>
            <EmpStatusBadge status={basicDetails.status as EmployeeStatus} size="small" />
          </div>
        </div>
        <div className={styles.profileActions}>
          <Button icon={<EditOutlined />} onClick={onEdit}>
            Edit
          </Button>
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
