'use client';

import React, { useState, useCallback } from 'react';
import { Input, Button, Typography } from 'antd';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import { validateFormula } from '../../utils/formulaValidator';
import styles from '../../styles/PayComponent.module.css';

interface FormulaEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({ value, onChange, disabled = false }) => {
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleValidate = useCallback(() => {
    const result = validateFormula(value);
    setIsValid(result.valid);
    setValidationMsg(result.valid ? 'Formula is valid' : (result.error ?? 'Invalid formula'));
  }, [value]);

  return (
    <div className={styles.formulaEditorWrapper}>
      <Input.TextArea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsValid(null);
          setValidationMsg(null);
        }}
        placeholder="e.g. BASIC * 0.4"
        rows={3}
        disabled={disabled}
        className={styles.formulaTextarea}
        status={isValid === false ? 'error' : undefined}
      />
      {!disabled && (
        <Button size="small" onClick={handleValidate} style={{ alignSelf: 'flex-start' }}>
          Validate Formula
        </Button>
      )}
      {validationMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isValid ? (
            <CheckCircleOutlinedIcon style={{ fontSize: 14, color: '#52c41a' }} />
          ) : (
            <ErrorOutlinedIcon style={{ fontSize: 14, color: '#ff4d4f' }} />
          )}
          <Typography.Text
            style={{ fontSize: 12, color: isValid ? '#52c41a' : '#ff4d4f' }}
          >
            {validationMsg}
          </Typography.Text>
        </div>
      )}
    </div>
  );
};

export default FormulaEditor;
