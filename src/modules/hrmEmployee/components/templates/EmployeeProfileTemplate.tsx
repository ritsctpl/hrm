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
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import CommonAppBar from '@/components/CommonAppBar';
import EmpAvatar from '../atoms/EmpAvatar';
import EmpStatusBadge from '../atoms/EmpStatusBadge';
import BasicDetailsTab from '../organisms/BasicDetailsTab';
import OfficialDetailsTab from '../organisms/OfficialDetailsTab';
import PersonalDetailsTab from '../organisms/PersonalDetailsTab';
import ContactDetailsTab from '../organisms/ContactDetailsTab';
import SkillsTab from '../organisms/SkillsTab';
import PreviousExperienceTab from '../organisms/PreviousExperienceTab';
import EducationTab from '../organisms/EducationTab';
import TrainingCertTab from '../organisms/TrainingCertTab';
import DocumentsTab from '../organisms/DocumentsTab';
import AssetsTab from '../organisms/AssetsTab';
import RemunerationTab from './RemunerationTab';
import LeaveSummaryTab from './LeaveSummaryTab';
import { useEmployeePermissions } from '../../hooks/useEmployeePermissions';
import Can from '../../../hrmAccess/components/Can';
import { useCan } from '../../../hrmAccess/hooks/useCan';
import { useIsSelf } from '../../../hrmAccess/hooks/useIsSelf';
import { PROFILE_TABS } from '../../utils/constants';
import type { EmployeeProfile } from '../../types/domain.types';
import type { EmployeeStatus } from '../../types/domain.types';
import type { ProfileTabKey } from '../../types/ui.types';
import type { BasicDetailsTabHandle } from '../organisms/BasicDetailsTab';
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
  onSave?: (section: string, data?: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  tabRef?: React.RefObject<BasicDetailsTabHandle>;
  /** Object-level RBAC name controlling who can save this section. */
  editObject?: string;
  /** Self-service bypass: when true the user can save even without the RBAC grant. */
  editPassIf?: boolean;
}> = ({ title, children, action, sectionKey, onEditSection, isEditing, isSaving, onSave, onCancel, tabRef, editObject, editPassIf }) => (
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
            <Can I="edit" object={editObject} passIf={editPassIf}>
              <Button
                type="primary"
                size="small"
                loading={isSaving}
                onClick={() => {
                  if (tabRef?.current?.save) {
                    tabRef.current.save();
                  } else {
                    sectionKey && onSave?.(sectionKey);
                  }
                }}
              >
                Save
              </Button>
            </Can>
            <Button
              size="small"
              onClick={() => {
                if (tabRef?.current?.cancel) {
                  tabRef.current.cancel();
                }
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
  onCancel?: () => void;
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
  onCancel,
  onSave,
  onBack,
  onRefresh,
}) => {
  // Get object-level permissions
  const permissions = useEmployeePermissions();
  
  // Track which section within a tab is being edited (for Overview tab with multiple sections)
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Refs for tab components to call their save methods
  const basicDetailsRef = useRef<BasicDetailsTabHandle>(null);
  const officialDetailsRef = useRef<BasicDetailsTabHandle>(null);
  const personalDetailsRef = useRef<BasicDetailsTabHandle>(null);
  const contactDetailsRef = useRef<BasicDetailsTabHandle>(null);

  // Self-service: a regular employee viewing their OWN profile sees the
  // Contact / Career / Documents / Compensation tabs even without the
  // corresponding object permissions, but can only EDIT their own contact.
  const isSelf = useIsSelf(
    profile?.basicDetails?.workEmail,
    profile?.employeeCode,
    profile?.handle,
  );

  // Module-level perms — used as the "admin" bypass: anyone with ADD or
  // DELETE on the module is treated as an admin and can see every tab,
  // matching the rule "yaruku ellamey iruko avanga ellamey pannulam".
  const modulePerms = useCan('HRM_EMPLOYEE');
  const isAdmin = modulePerms.canAdd || modulePerms.canDelete;

  // Self-service edit requires BOTH being yourself AND having module-level
  // EDIT. A VIEW-only user must NOT be able to edit anything, not even
  // their own contact.
  const canSelfEdit = isSelf && modulePerms.canEdit;

  // Tab visibility — strict rule per user requirement:
  //   - Overview: always visible to anyone past the access gate.
  //   - All other tabs (Contact, Career, Documents, Compensation): only
  //     ADMINS (canAdd/canDelete) or the user themselves (isSelf).
  // VIEW-only or VIEW+EDIT users viewing OTHER employees see ONLY Overview.
  const canSeeOverview = true;
  const canSeeContact = isAdmin || isSelf;
  const canSeeCareer = isAdmin || isSelf;
  const canSeeDocs = isAdmin || isSelf;
  const canSeeComp = isAdmin || isSelf;

  const visibleTabKeys = new Set<string>();
  if (canSeeOverview) visibleTabKeys.add('overview');
  if (canSeeContact) visibleTabKeys.add('contactFamily');
  if (canSeeCareer) visibleTabKeys.add('career');
  if (canSeeDocs) visibleTabKeys.add('documentsAssets');
  if (canSeeComp) visibleTabKeys.add('compensation');

  const handleCancelSection = () => {
    setEditingSection(null);
    onCancel?.();
  };

  const handleSaveSection = async (section: string, data: Record<string, unknown>) => {
    await onSave(section, data);
    setEditingSection(null); // Exit edit mode after successful save
    onCancel?.(); // Reset parent's isEditing state
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

  const tabProps = { profile, isEditing, isSaving, onSave, editingSection };

  /** Build consolidated tab content */
  const tabItems = PROFILE_TABS.map((tab) => {
    let content: React.ReactNode = null;
    let hasVisibleContent = false;

    switch (tab.key) {
      /* ---- Overview: Basic + Official + Personal ---- */
      case 'overview':
        // Check if any section in Overview tab is visible
        hasVisibleContent = permissions.canViewEmployee || 
                           permissions.canViewOfficialDetails || 
                           permissions.canViewPersonalDetails;
        
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection 
              title="Basic Details"
              sectionKey="basic"
              onEditSection={setEditingSection}
              isEditing={isEditing && editingSection === 'basic'}
              isSaving={isSaving}
              onSave={handleSaveSection}
              onCancel={handleCancelSection}
              tabRef={basicDetailsRef}
              editObject="employee_record"
              editPassIf={isAdmin || canSelfEdit}
              action={
                <Can I="edit" object="employee_record" passIf={isAdmin || canSelfEdit}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      onEdit();
                      setEditingSection('basic');
                    }}
                  >
                    Edit
                  </Button>
                </Can>
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
              onSave={handleSaveSection}
              onCancel={handleCancelSection}
              tabRef={officialDetailsRef}
              action={
                permissions.canEditOfficialDetails && (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      onEdit();
                      setEditingSection('official');
                    }}
                  >
                    Edit
                  </Button>
                )
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
              onSave={handleSaveSection}
              onCancel={handleCancelSection}
              tabRef={personalDetailsRef}
              action={
                permissions.canEditPersonalDetails && (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      onEdit();
                      setEditingSection('personal');
                    }}
                  >
                    Edit
                  </Button>
                )
              }
            >
              <PersonalDetailsTab ref={personalDetailsRef} {...tabProps} onEdit={onEdit} />
            </ProfileSection>
          </div>
        );
        break;

      /* ---- Contact & Family ---- */
      case 'contactFamily':
        // Check if any section in Contact & Family tab is visible
        hasVisibleContent = permissions.canViewEmergencyContact;
        
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <ProfileSection 
              title="Contact Details"
              sectionKey="contact"
              onEditSection={setEditingSection}
              isEditing={isEditing && editingSection === 'contact'}
              isSaving={isSaving}
              onSave={handleSaveSection}
              onCancel={handleCancelSection}
              tabRef={contactDetailsRef}
              action={
                permissions.canEditEmergencyContact && (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      onEdit();
                      setEditingSection('contact');
                    }}
                  >
                    Edit
                  </Button>
                )
              }
            >
              <ContactDetailsTab ref={contactDetailsRef} {...tabProps} onEdit={onEdit} />
            </ProfileSection>
          </div>
        );
        break;

      /* ---- Career: Skills + Job History + Experience + Education + Training ---- */
      case 'career':
        // Check if any section in Career tab is visible
        hasVisibleContent = permissions.canViewEmploymentDetails || 
                           permissions.canViewExperience || 
                           permissions.canViewEducation;
        
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            {/* Skills - uses employmentDetails object permission */}
            {permissions.canViewEmploymentDetails && (
              <ProfileSection title="Skills">
                <SkillsTab {...tabProps} onRefresh={onRefresh} />
              </ProfileSection>
            )}
            
            {/* Previous Experience - uses experience object permission */}
            {permissions.canViewExperience && (
              <ProfileSection title="Previous Experience">
                <PreviousExperienceTab {...tabProps} onRefresh={onRefresh} />
              </ProfileSection>
            )}
            
            {/* Education - uses education object permission */}
            {permissions.canViewEducation && (
              <ProfileSection title="Education">
                <EducationTab {...tabProps} onRefresh={onRefresh} />
              </ProfileSection>
            )}
            
            {/* Training & Certifications - uses employmentDetails object permission */}
            {permissions.canViewEmploymentDetails && (
              <ProfileSection title="Training & Certifications">
                <TrainingCertTab {...tabProps} />
              </ProfileSection>
            )}
          </div>
        );
        break;

      /* ---- Documents & Assets ---- */
      case 'documentsAssets':
        // Check if any section in Documents & Assets tab is visible
        hasVisibleContent = permissions.canViewDocuments || 
                           permissions.canViewEmploymentDetails;
        
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            {/* Documents - uses documents object permission */}
            {permissions.canViewDocuments && (
              <ProfileSection title="Documents">
                <DocumentsTab {...tabProps} onRefresh={onRefresh} />
              </ProfileSection>
            )}
            
            {/* Assets - uses employmentDetails object permission */}
            {permissions.canViewEmploymentDetails && (
              <ProfileSection title="Assets">
                <AssetsTab {...tabProps} />
              </ProfileSection>
            )}
          </div>
        );
        break;

      /* ---- Compensation: Remuneration + Leave Summary ---- */
      case 'compensation':
        // Check if any section in Compensation tab is visible
        hasVisibleContent = permissions.canViewCompensation || 
                           permissions.canViewEmploymentDetails;
        
        content = (
          <div style={{ padding: 16, overflowY: 'auto' }}>
            {/* Remuneration - uses compensation object permission */}
            {permissions.canViewCompensation && (
              <ProfileSection title="Remuneration">
                <RemunerationTab profile={profile} onRefresh={onRefresh} />
              </ProfileSection>
            )}
            
            {/* Leave Summary - uses employmentDetails object permission */}
            {permissions.canViewEmploymentDetails && (
              <ProfileSection title="Leave Summary">
                <LeaveSummaryTab profile={profile} />
              </ProfileSection>
            )}
          </div>
        );
        break;
    }

    // Only return tab if it has visible content
    if (!hasVisibleContent) {
      return null;
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
                Reports to: {officialDetails.reportingManagerName}
              </Text>
            )}
            <EmpStatusBadge 
              status={(profile?.isActive !== undefined ? (profile.isActive ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE') as EmployeeStatus} 
              size="small" 
            />
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
          items={tabItems.filter(Boolean)}
          size="small"
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>
    </div>
  );
};

export default EmployeeProfileTemplate;
