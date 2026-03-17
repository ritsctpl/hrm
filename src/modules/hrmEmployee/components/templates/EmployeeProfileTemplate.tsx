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

import React, { useState, useRef } from 'react';
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
import type { BasicDetailsTabHandle } from '../organisms/BasicDetailsTab';
import type { OfficialDetailsTabHandle } from '../organisms/OfficialDetailsTab';
import type { PersonalDetailsTabHandle } from '../organisms/PersonalDetailsTab';
import type { ContactDetailsTabHandle } from '../organisms/ContactDetailsTab';
import styles from '../../styles/HrmEmployee.module.css';

const { Text } = Typography;

/** Shared card-style section wrapper used inside consolidated tabs */
const ProfileSection: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  action?: React.ReactNode; 
  sectionKey?: string; 
  onEditSection?: (section: string) => void;
  isEditing?: boolean;
  isSaving?: boolean;
  onSave?: (section: string) => void;
  onCancel?: () => void;
  tabRef?: React.RefObject<BasicDetailsTabHandle>;
}> = ({ title, children, action, sectionKey, onEditSection, isEditing, isSaving, onSave, onCancel, tabRef }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      border: '1px solid #e2e8f0',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h4
        style={{
          margin: 0,
          paddingBottom: 8,
          borderBottom: '1px solid #e2e8f0',
          fontSize: 15,
          fontWeight: 600,
          color: '#1e293b',
          flex: 1,
        }}
      >
        {title}
      </h4>
      <div style={{ marginLeft: 12, display: 'flex', gap: 8 }}>
        {isEditing ? (
          <>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              loading={isSaving}
              onClick={() => {
                // Call the ref's save method if available
                if (tabRef?.current?.save) {
                  tabRef.current.save();
                } else {
                  // Fallback: call onSave directly
                  sectionKey && onSave?.(sectionKey);
                }
              }}
            >
              Save
            </Button>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={() => {
                // Call the ref's cancel method if available
                if (tabRef?.current?.cancel) {
                  tabRef.current.cancel();
                }
                // Then call onCancel to update template state
                onCancel?.();
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          action && (
            <div 
              onClick={() => sectionKey && onEditSection?.(sectionKey)}
            >
              {action}
            </div>
          )
        )}
      </div>
    </div>
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
  // Track which section within a tab is being edited (for Overview tab with multiple sections)
  const [editingSection, setEditingSection] = useState<string | null>(null);
  
  // Refs for tab components to call their save methods
  const basicDetailsRef = useRef<BasicDetailsTabHandle>(null);
  const officialDetailsRef = useRef<BasicDetailsTabHandle>(null);
  const personalDetailsRef = useRef<BasicDetailsTabHandle>(null);
  const contactDetailsRef = useRef<BasicDetailsTabHandle>(null);

  const handleCancelSection = () => {
    setEditingSection(null);
  };

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
            <ProfileSection 
              title="Basic Details"
              sectionKey="basic"
              onEditSection={setEditingSection}
              isEditing={isEditing && editingSection === 'basic'}
              isSaving={isSaving}
              onSave={(section) => onSave(section, {})}
              onCancel={handleCancelSection}
              tabRef={basicDetailsRef}
              action={
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={onEdit}
                >
                  Edit
                </Button>
              }
            >
              <BasicDetailsTab ref={basicDetailsRef} {...tabProps} onEdit={onEdit} />
            </ProfileSection>
            <ProfileSection 
              title="Official Details"
              sectionKey="official"
              onEditSection={setEditingSection}
              isEditing={isEditing && editingSection === 'official'}
              isSaving={isSaving}
              onSave={(section) => onSave(section, {})}
              onCancel={handleCancelSection}
              tabRef={officialDetailsRef}
              action={
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={onEdit}
                >
                  Edit
                </Button>
              }
            >
              <OfficialDetailsTab ref={officialDetailsRef} {...tabProps} onEdit={onEdit} />
            </ProfileSection>
            <ProfileSection 
              title="Personal Details"
              sectionKey="personal"
              onEditSection={setEditingSection}
              isEditing={isEditing && editingSection === 'personal'}
              isSaving={isSaving}
              onSave={(section) => onSave(section, {})}
              onCancel={handleCancelSection}
              tabRef={personalDetailsRef}
              action={
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={onEdit}
                >
                  Edit
                </Button>
              }
            >
              <PersonalDetailsTab ref={personalDetailsRef} {...tabProps} onEdit={onEdit} />
            </ProfileSection>
          </div>
        );
        break;

      /* ---- Contact & Family ---- */
      case 'contactFamily':
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection 
              title="Contact Details"
              sectionKey="contact"
              onEditSection={setEditingSection}
              isEditing={isEditing && editingSection === 'contact'}
              isSaving={isSaving}
              onSave={(section) => onSave(section, {})}
              onCancel={handleCancelSection}
              tabRef={contactDetailsRef}
              action={
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={onEdit}
                >
                  Edit
                </Button>
              }
            >
              <ContactDetailsTab ref={contactDetailsRef} {...tabProps} onEdit={onEdit} />
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
          photoBase64={basicDetails.photoBase64}
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
