/**
 * Employee Keycloak Service
 * Handles Keycloak user operations for employees
 */

import { CreateKeycloakUser, UpdateKeycloakUser, DeleteKeycloakUser } from '@/app/api/auth/keycloakCredentials';
import api from '@/services/api';

interface EmployeeKeycloakData {
  workEmail: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export class EmployeeKeycloakService {
  /**
   * Create Keycloak user for employee — SERVER-SIDE via hrm-service
   * (POST /account/create-user), replacing the previous browser-side Keycloak
   * Admin API call. Returns { succes, error } to match the onboarding wizard.
   */
  static async createUserForEmployee(
    employeeData: EmployeeKeycloakData
  ): Promise<{ succes: boolean; error?: string }> {
    try {
      const res = await api.post('/hrm-service/account/create-user', {
        username: employeeData.workEmail,
        email: employeeData.workEmail,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        password: employeeData.password || this.generateTemporaryPassword(),
      });
      return { succes: !!res.data?.success, error: res.data?.error };
    } catch (e: any) {
      return {
        succes: false,
        error: e?.response?.data?.error || e?.response?.data?.message || 'Failed to create Keycloak user',
      };
    }
  }
  
  /**
   * Update Keycloak user for employee
   */
  static async updateUserForEmployee(employeeData: EmployeeKeycloakData) {
    const keycloakPayload = {
      data: {
        user: employeeData.workEmail,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        emailAddress: employeeData.workEmail,
        password: employeeData.password || '',
      }
    };
    
    return await UpdateKeycloakUser(keycloakPayload);
  }
  
  /**
   * Delete Keycloak user for employee
   */
  static async deleteUserForEmployee(workEmail: string) {
    const keycloakPayload = {
      data: {
        user: workEmail,
      }
    };
    
    return await DeleteKeycloakUser(keycloakPayload);
  }
  
  /**
   * Generate secure temporary password
   * Format: 8 random chars + @1 (to meet password requirements)
   */
  static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '@1';
  }
}
