'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notification, Button, Input, Spin } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import UserSearchPanel from '../organisms/UserSearchPanel';
import UserAssignmentTable from '../organisms/UserAssignmentTable';
import UserAssignmentDetail from '../organisms/UserAssignmentDetail';
import RbacEmptyState from '../atoms/RbacEmptyState';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import { HrmAccessService } from '../../services/hrmAccessService';
import type { UserRoleAssignmentTemplateProps, KeycloakUserSummaryUI } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

const UserRoleAssignmentTemplate: React.FC<UserRoleAssignmentTemplateProps> = ({ organizationId, user }) => {
  const store = useHrmAccessStore();
  const { userAssignment } = store;
  const [selectedAssignmentHandle, setSelectedAssignmentHandle] = useState<string | null>(null);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState<KeycloakUserSummaryUI[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const roles = await HrmAccessService.fetchAllRoles(organizationId);
        setAllRoles(roles);
      } catch (err) {
        notification.error({ message: 'Failed to load roles.' });
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, [organizationId]);

  // Load ALL employees ONCE on mount - cache locally
  useEffect(() => {
    if (!organizationId) return;
    const loadAllEmployees = async () => {
      store.setSearchingUsers(true);
      try {
        const response = await HrmAccessService.fetchEmployeeDirectory({ organizationId,
          page: 0,
          size: 1000,
          searchTerm: '',
          status: 'ACTIVE',
        });

        if (response.employees && response.employees.length > 0) {
          const mapped: KeycloakUserSummaryUI[] = response.employees.map((emp) => ({
            id: emp.handle,
            displayName: emp.fullName,
            email: emp.workEmail,
            avatarInitials: (emp.fullName || '')
              .split(' ')
              .map((n: string) => n[0])
              .filter(Boolean)
              .join('')
              .substring(0, 2)
              .toUpperCase(),
            employeeCode: emp.employeeCode,
            department: emp.department,
            role: emp.role,
            location: emp.location,
            status: emp.status,
            photoBase64: emp.photoBase64,
          }));

          setAllEmployees(mapped);
          store.setUserSearchResults(mapped);
        } else {
          setAllEmployees([]);
          store.setUserSearchResults([]);
        }
      } catch (err) {
        notification.error({ message: 'Failed to load employees.' });
      } finally {
        store.setSearchingUsers(false);
      }
    };

    loadAllEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Local filter helper
  const filterEmployees = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      store.setUserSearchResults(allEmployees);
      return;
    }
    const filtered = allEmployees.filter((emp) => {
      return (
        (emp.displayName ?? '').toLowerCase().includes(trimmed) ||
        (emp.email ?? '').toLowerCase().includes(trimmed) ||
        (emp.employeeCode ?? '').toLowerCase().includes(trimmed)
      );
    });
    store.setUserSearchResults(filtered);
  };

  // Debounced search change
  const handleSearchChange = (value: string) => {
    store.setUserSearchText(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      filterEmployees(value);
    }, 300);
  };

  const handleSelectUser = async (userId: string, userName: string, userEmail: string) => {
    store.selectUser(userId, userName, userEmail);
    setSelectedAssignmentHandle(null);

    store.setLoadingAssignments(true);
    try {
      const userAssignments = await HrmAccessService.fetchAssignmentsForUser(organizationId, userEmail);
      store.setUserAssignments(userAssignments);
    } catch (err) {
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
        organizationId,
        userId: userAssignment.selectedUserEmail,  // Backend expects email in userId field
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
      const updated = await HrmAccessService.fetchAssignmentsForUser(organizationId, userAssignment.selectedUserEmail);  // Use email
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
      await HrmAccessService.revokeRoleFromUser(organizationId, handle, user?.id ?? 'system');
      notification.success({ message: 'Role revoked successfully.' });
      
      // Reload assignments for selected user
      if (userAssignment.selectedUserEmail) {
        const updated = await HrmAccessService.fetchAssignmentsForUser(organizationId, userAssignment.selectedUserEmail);  // Use email
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
            placeholder="Search employees by name, code, or email..."
            prefix={<SearchOutlined />}
            value={userAssignment.userSearchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
          />
        </div>

        <div className={styles.userListContainer}>
          <Spin spinning={userAssignment.isSearchingUsers}>
            <UserSearchPanel
              searchText={userAssignment.userSearchText}
              onSearchChange={(text) => handleSearchChange(text)}
              searchResults={userAssignment.userSearchResults}
              isSearching={userAssignment.isSearchingUsers}
              selectedUserId={userAssignment.selectedUserId}
              onSelectUser={handleSelectUser}
            />
          </Spin>
        </div>
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
