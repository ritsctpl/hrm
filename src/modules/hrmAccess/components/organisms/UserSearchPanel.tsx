'use client';

import React from 'react';
import { Avatar, List, Spin, Typography } from 'antd';
import RbacSearchBar from '../molecules/RbacSearchBar';
import type { UserSearchPanelProps } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

const { Text } = Typography;

const UserSearchPanel: React.FC<UserSearchPanelProps> = ({
  searchText,
  onSearchChange,
  searchResults,
  isSearching,
  selectedUserId,
  onSelectUser,
}) => {
  return (
    <div className={styles.userPanel}>
      <div className={styles.userPanelHeader}>
        <Text strong>Users</Text>
      </div>
      <div className={styles.userSearch}>
        <RbacSearchBar
          value={searchText}
          onChange={onSearchChange}
          placeholder="Search users by name or email..."
        />
      </div>

      {isSearching ? (
        <div className={styles.userSearchSpinner}>
          <Spin size="small" />
        </div>
      ) : (
        <List
          dataSource={searchResults}
          locale={{ emptyText: searchText ? 'No users found.' : 'Type to search users.' }}
          renderItem={(user) => (
            <List.Item
              className={`${styles.userListItem} ${
                user.id === selectedUserId ? styles.userListItemSelected : ''
              }`}
              onClick={() => onSelectUser(user.id, user.displayName, user.email)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: '#1976d2' }}>
                    {user.avatarInitials}
                  </Avatar>
                }
                title={<Text ellipsis>{user.displayName}</Text>}
                description={<Text type="secondary" ellipsis>{user.email}</Text>}
              />
            </List.Item>
          )}
          className={styles.userList}
        />
      )}
    </div>
  );
};

export default UserSearchPanel;
