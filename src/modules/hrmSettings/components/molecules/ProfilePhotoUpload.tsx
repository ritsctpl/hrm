'use client';

import React, { useRef } from 'react';
import { Button } from 'antd';
import { Camera, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/HrmSettings.module.css';
import type { ProfilePhotoUploadProps } from '../../types/ui.types';

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ photoUrl, onPhotoChange }) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onPhotoChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.photoUpload}>
      <div className={styles.photoPreview}>
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" />
        ) : (
          <User size={32} color="#94a3b8" />
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button icon={<Camera size={14} />} onClick={() => fileRef.current?.click()}>
        {t('settings.profile.uploadPhoto')}
      </Button>
    </div>
  );
};

export default ProfilePhotoUpload;
