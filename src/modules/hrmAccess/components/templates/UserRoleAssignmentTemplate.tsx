'use client';

import React, { useState, useEffect } from 'react';
import { notification, Button, Input, Spin } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import UserSearchPanel from '../organisms/UserSearchPanel';
import UserAssignmentTable from '../organisms/UserAssignmentTable';
import UserAssignmentDetail from '../organisms/UserAssignmentDetail';
import RbacEmptyState from '../atoms/RbacEmptyState';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import { HrmAccessService } from '../../services/hrmAccessService';
import type { UserRoleAssignmentTemplateProps } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

const UserRoleAssignmentTemplate: React.FC<UserRoleAssignmentTemplateProps> = ({ site, user }) => {
  const store = useHrmAccessStore();
  const { userAssignment } = store;
  const [selectedAssignmentHandle, setSelectedAssignmentHandle] = useState<string | null>(null);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Load all roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const roles = await HrmAccessService.fetchAllRoles(site);
        setAllRoles(roles);
      } catch (err) {
        notification.error({ message: 'Failed to load roles.' });
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
    
    // Load initial user list (top 50)
    handleSearchUsers('');
  }, [site]);

  const handleSearchUsers = async (query: string) => {
    store.setSearchingUsers(true);
    try {
      const results = await HrmAccessService.searchKeycloakUsers(site, query);
      const mapped = results.map((u) => ({
        id: u.id,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
        email: u.email || u.username,
        avatarInitials: `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || u.username?.substring(0, 2).toUpperCase(),
      }));
      store.setUserSearchResults(mapped);
    } catch (err) {
      console.error('Search error:', err);
      notification.error({ message: 'Failed to search users.' });
    } finally {
      store.setSearchingUsers(false);
    }
  };

  const handleSelectUser = async (userId: string, userName: string, userEmail: string) => {
    console.log('handleSelectUser called with:', { userId, userName, userEmail });
    store.selectUser(userId, userName, userEmail);
    setSelectedAssignmentHandle(null);
    
    // Load assignments for selected user
    store.setLoadingAssignments(true);
    try {
      console.log('Calling fetchAssignmentsForUser with site:', site, 'userId:', userId);
      const userAssignments = await HrmAccessService.fetchAssignmentsForUser(site, userId);
      console.log('Assignments received:', userAssignments);
      store.setUserAssignments(userAssignments);
    } catch (err) {
      console.error('Error loading assignments:', err);
      notification.error({ message: 'Failed to load user assignments.' });
      store.setLoadingAssignments(false);
    }
  };

  const handleAssignRole = async () => {
    if (!userAssignment.selectedUserId || !userAssignment.assignmentDraft) return;

    const errors: Record<string, string> = {};
    if (!userAssignment.assignmentDraft.roleCode) errors.roleCode = 'Role is required';
    if (!userAssignment.assignmentDraft.effectiveFrom) errors.effectiveFrom = 'Effective From is required';

    if (Object.keys(errors).length > 0) {
      store.setAssignmentErrors(errors);
      return;
    }

    store.setAssigning(true);
    try {
      const payload = {
        site,
        userId: userAssignment.selectedUserId,
        userDisplayName: userAssignment.selectedUserName,
        userEmail: userAssignment.selectedUserEmail,
        roleCode: userAssignment.assignmentDraft.roleCode!,
        effectiveFrom: userAssignment.assignmentDraft.effectiveFrom!,
        effectiveTo: userAssignment.assignmentDraft.effectiveTo ?? null,
        assignmentNotes: userAssignment.assignmentDraft.assignmentNotes ?? null,
        assignedBy: user?.id ?? 'system',
      };
      await HrmAccessService.assignRoleToUser(payload);
      notification.success({ message: 'Role assigned successfully.' });
      store.clearAssignmentDraft();
      
      // Reload assignments for selected user
      const updated = await HrmAccessService.fetchAssignmentsForUser(site, userAssignment.selectedUserId);
      store.setUserAssignments(updated);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to assign role.' });
    } finally {
      store.setAssigning(false);
    }
  };

  const handleRevokeAssignment = async (handle: string) => {
    store.setRevoking(true);
    try {
      await HrmAccessService.revokeRoleFromUser(site, handle, user?.id ?? 'system');
      notification.success({ message: 'Role revoked successfully.' });
      
      // Reload assignments for selected user
      if (userAssignment.selectedUserId) {
        const updated = await HrmAccessService.fetchAssignmentsForUser(site, userAssignment.selectedUserId);
        store.setUserAssignments(updated);
      }
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to revoke role.' });
    } finally {
      store.setRevoking(false);
    }
  };

  const showRightPanel = userAssignment.selectedUserId !== null;

  return (
    <div className={styles.userAssignmentTemplate}>
      <div className={styles.leftPanel}>
        <div className={styles.searchSection}>
          <Input
            placeholder="Search users by name or email..."
            prefix={<SearchOutlined />}
            value={userAssignment.userSearchText}
            onChange={(e) => {
              store.setUserSearchText(e.target.value);
              handleSearchUsers(e.target.value);
            }}
            allowClear
          />
        </div>

        <Spin spinning={userAssignment.isSearchingUsers}>
          <UserSearchPanel
            searchText={userAssignment.userSearchText}
            onSearchChange={(text) => {
              store.setUserSearchText(text);
              handleSearchUsers(text);
            }}
            searchResults={userAssignment.userSearchResults}
            isSearching={userAssignment.isSearchingUsers}
            selectedUserId={userAssignment.selectedUserId}
            onSelectUser={handleSelectUser}
          />
        </Spin>
      </div>

      <div className={styles.rightPanel}>
        {showRightPanel ? (
          <Spin spinning={userAssignment.isLoadingAssignments}>
            <div className={styles.rightContent}>
              <div className={styles.userHeader}>
                <div>
                  <h3>{userAssignment.selectedUserName}</h3>
                  <p>{userAssignment.selectedUserEmail}</p>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => store.updateAssignmentDraft({ roleCode: '', effectiveFrom: '', effectiveTo: null, assignmentNotes: null })}
                >
                  Assign Role
                </Button>
              </div>

              {userAssignment.assignmentDraft && (
                <UserAssignmentDetail
                  roles={allRoles}
                  draft={userAssignment.assignmentDraft}
                  isAssigning={userAssignment.isAssigning}
                  errors={userAssignment.errors}
                  onChange={store.updateAssignmentDraft}
                  onAssign={handleAssignRole}
                  onCancel={() => store.clearAssignmentDraft()}
                />
              )}

              <UserAssignmentTable
                assignments={userAssignment.assignments}
                isLoading={userAssignment.isLoadingAssignments}
                isRevoking={userAssignment.isRevoking}
                selectedHandle={selectedAssignmentHandle}
                onRowClick={setSelectedAssignmentHandle}
                onRevoke={handleRevokeAssignment}
              />
            </div>
          </Spin>
        ) : (
          <RbacEmptyState
            icon={<SearchOutlined style={{ fontSize: 40, color: '#8c8c8c' }} />}
            title="No User Selected"
            description="Search and select a user to view and manage their role assignments."
          />
        )}
      </div>
    </div>
  );
};

export default UserRoleAssignmentTemplate;
