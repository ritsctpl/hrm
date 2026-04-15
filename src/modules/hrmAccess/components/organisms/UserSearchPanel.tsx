import React from 'react';
import { List, Avatar, Empty, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { UserSearchPanelProps } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

const UserSearchPanel: React.FC<UserSearchPanelProps> = ({
  searchText,
  searchResults,
  isSearching,
  selectedUserId,
  onSelectUser,
}) => {
  if (searchResults.length === 0 && !isSearching) {
    if (!searchText.trim()) {
      return (
        <Empty
          description="Enter a name or email to search"
          style={{ marginTop: 40 }}
        />
      );
    }
    return (
      <Empty
        description="No users found"
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <List
      className={styles.userSearchList}
      dataSource={searchResults}
      renderItem={(user) => (
        <List.Item
          className={`${styles.userSearchItem} ${selectedUserId === user.id ? styles.selected : ''}`}
        >
          <List.Item.Meta
            avatar={
              <Avatar
                src={
                  user.photoBase64
                    ? user.photoBase64.startsWith('data:')
                      ? user.photoBase64
                      : `data:image/jpeg;base64,${user.photoBase64}`
                    : undefined
                }
                icon={!user.photoBase64 ? <UserOutlined /> : undefined}
                style={{ backgroundColor: '#1890ff' }}
              >
                {!user.photoBase64 && user.avatarInitials}
              </Avatar>
            }
            title={user.displayName}
            description={user.email}
          />
          <Button
            type={selectedUserId === user.id ? 'primary' : 'default'}
            onClick={() => {
              onSelectUser(user.id, user.displayName, user.email);
            }}
          >
            {selectedUserId === user.id ? 'Selected' : 'Select'}
          </Button>
        </List.Item>
      )}
    />
  );
};

export default UserSearchPanel;
