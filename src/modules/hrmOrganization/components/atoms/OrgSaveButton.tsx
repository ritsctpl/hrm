'use client';

import React from 'react';
import { Button } from 'antd';
import SaveIcon from '@mui/icons-material/Save';
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
      icon={<SaveIcon fontSize="small" />}
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
