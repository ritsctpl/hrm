'use client';

import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '../../utils/constants';
import styles from '../../styles/HrmSettings.module.css';
import type { PasswordStrengthBarProps } from '../../types/ui.types';

const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password }) => {
  const results = useMemo(
    () => PASSWORD_REQUIREMENTS.map((req) => ({ ...req, met: req.test(password) })),
    [password]
  );

  const metCount = results.filter((r) => r.met).length;
  const strength = metCount <= 1 ? 'weak' : metCount <= 3 ? 'medium' : 'strong';

  const strengthClass =
    strength === 'weak' ? styles.strengthWeak :
    strength === 'medium' ? styles.strengthMedium :
    styles.strengthStrong;

  return (
    <div>
      <div className={styles.strengthBar}>
        <div className={`${styles.strengthFill} ${strengthClass}`} />
      </div>
      <ul className={styles.requirementsList}>
        {results.map((req) => (
          <li key={req.key} className={`${styles.requirementItem} ${req.met ? styles.requirementMet : styles.requirementUnmet}`}>
            {req.met ? <Check size={12} /> : <X size={12} />}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthBar;
