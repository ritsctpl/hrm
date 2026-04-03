'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { profileFormSchema } from '../../types/domain.types';
import ProfilePhotoUpload from '../molecules/ProfilePhotoUpload';
import EmergencyContactForm from '../molecules/EmergencyContactForm';
import { useHrmSettingsStore } from '../../stores/hrmSettingsStore';
import { useSettingsData } from '../../hooks/useSettingsData';
import styles from '../../styles/HrmSettings.module.css';

const ProfileSection: React.FC = () => {
  const { t } = useTranslation();
  const { profileData, loading } = useSettingsData();
  const { profileDraft, setProfileDraft, emergencyContact, setEmergencyContact } = useHrmSettingsStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ecErrors, setEcErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profileData && !profileDraft) {
      setProfileDraft(profileData);
    }
  }, [profileData, profileDraft, setProfileDraft]);

  const currentData = profileDraft || profileData || { name: '', contactNumber: '', personalEmail: '', profilePhoto: '' };

  const handleSave = () => {
    const result = profileFormSchema.safeParse(currentData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    message.success('Profile saved successfully');
  };

  const updateField = (field: string, value: string) => {
    setProfileDraft({ ...currentData, [field]: value });
  };

  if (loading) return <div className={styles.emptyState}>Loading...</div>;

  return (
    <div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <User size={20} strokeWidth={1.5} />
          <div>
            <h2 className={styles.sectionTitle}>{t('settings.profile.title')}</h2>
          </div>
        </div>

        <ProfilePhotoUpload
          photoUrl={currentData.profilePhoto}
          onPhotoChange={(photo) => updateField('profilePhoto', photo)}
        />

        <h4 className={styles.subSectionTitle}>{t('settings.profile.personalInfo')}</h4>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.profile.name')}</label>
            <Input value={currentData.name} onChange={(e) => updateField('name', e.target.value)} />
            {errors.name && <span className={styles.formError}>{errors.name}</span>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.profile.contactNumber')}</label>
            <Input value={currentData.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} />
            {errors.contactNumber && <span className={styles.formError}>{errors.contactNumber}</span>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.profile.personalEmail')}</label>
            <Input value={currentData.personalEmail} onChange={(e) => updateField('personalEmail', e.target.value)} />
            {errors.personalEmail && <span className={styles.formError}>{errors.personalEmail}</span>}
          </div>
        </div>

        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>{t('settings.profile.emergencyContact')}</h4>
          <EmergencyContactForm data={emergencyContact} onChange={setEmergencyContact} errors={ecErrors} />
        </div>

        <Button type="primary" onClick={handleSave} className={styles.saveButton}>
          {t('settings.profile.saveChanges')}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSection;
