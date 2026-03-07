'use client';

import React from 'react';
import { Checkbox, Tooltip } from 'antd';
import type { RbacPermissionCheckboxProps } from '../../types/ui.types';

const RbacPermissionCheckbox: React.FC<RbacPermissionCheckboxProps> = ({
  checked,
  disabled,
  onChange,
  label,
}) => {
  return (
    <Tooltip title={disabled ? 'System role permissions are read-only' : label}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </Tooltip>
  );
};

export default RbacPermissionCheckbox;
