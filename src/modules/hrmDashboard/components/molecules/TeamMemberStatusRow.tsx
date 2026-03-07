'use client';

import { Avatar, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { TeamMember } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

const STATUS_COLOR: Record<string, string> = {
  PRESENT: '#52c41a',
  ON_LEAVE: '#faad14',
  REMOTE: '#1890ff',
  ABSENT: '#ff4d4f',
};

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Present',
  ON_LEAVE: 'On Leave',
  REMOTE: 'Remote',
  ABSENT: 'Absent',
};

interface TeamMemberStatusRowProps {
  member: TeamMember;
}

export default function TeamMemberStatusRow({ member }: TeamMemberStatusRowProps) {
  return (
    <div className={styles.teamMemberRow}>
      <Badge dot color={STATUS_COLOR[member.status] ?? '#d9d9d9'} offset={[-4, 4]}>
        <Avatar src={member.avatarUrl} icon={<UserOutlined />} size={32} />
      </Badge>
      <div className={styles.memberInfo}>
        <span className={styles.memberName}>{member.name}</span>
        <span className={styles.memberDesig}>{member.designation}</span>
      </div>
      <span
        className={styles.memberStatus}
        style={{ color: STATUS_COLOR[member.status] ?? '#666' }}
      >
        {STATUS_LABEL[member.status] ?? member.status}
      </span>
    </div>
  );
}
