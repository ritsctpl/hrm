'use client';

import { Avatar, Button } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
import { EmployeeProfile } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

interface WelcomeBannerProps {
  profile: EmployeeProfile;
  onCustomize?: () => void;
}

export default function WelcomeBanner({ profile, onCustomize }: WelcomeBannerProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={styles.welcomeBanner}>
      <Avatar
        size={56}
        src={profile.photoUrl}
        icon={<UserOutlined />}
        className={styles.welcomeAvatar}
      />
      <div className={styles.welcomeText}>
        <div className={styles.welcomeGreeting}>{greeting}, {profile.name.split(' ')[0]}!</div>
        <div className={styles.welcomeSub}>{profile.designation} &middot; {profile.department}</div>
        {profile.tenure && (
          <div className={styles.welcomeTenure}>Tenure: {profile.tenure}</div>
        )}
      </div>
      <div className={styles.welcomeCode}>
        <span className={styles.welcomeCodeLabel}>Employee ID</span>
        <span className={styles.welcomeCodeValue}>{profile.employeeCode}</span>
        {onCustomize && (
          <Button
            type="default"
            size="small"
            icon={<SettingOutlined />}
            onClick={onCustomize}
            style={{ marginTop: 8, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', background: 'transparent' }}
          >
            Customize
          </Button>
        )}
      </div>
    </div>
  );
}
