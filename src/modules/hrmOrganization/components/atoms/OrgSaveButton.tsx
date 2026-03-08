'use client';

import React from 'react';
import { Button } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { OrgSaveButtonProps } from '../../types/ui.types';
import styles from '../../styles/HrmOrganizationForm.module.css';

const OrgSaveButton: React.FC<OrgSaveButtonProps> = ({
  loading,
  disabled = false,
  onClick,
  label = 'Save',
}) => {
  return (
    <Button
      type="primary"
      icon={<SaveOutlined />}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      className={styles.saveButton}
    >
      {label}
    </Button>
  );
};

export default OrgSaveButton;
