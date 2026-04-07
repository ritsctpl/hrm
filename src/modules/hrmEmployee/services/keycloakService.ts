/**
 * Employee Keycloak Service
 * Handles Keycloak user operations for employees
 */

import api from '@services/api';

interface EmployeeKeycloakData {
  workEmail: string;
  firstName: string;
  lastName: string;
  password?: string;
  username?: string;
}

export class EmployeeKeycloakService {
  private static readonly KEYCLOAK_BASE_URL = 'http://49.206.228.110:18181/admin/realms/spring-boot-microservices-realm';

  /**
   * Create Keycloak user for employee
   */
  static async createUserForEmployee(employeeData: EmployeeKeycloakData) {
    try {
      const payload = {
        username: employeeData.username || employeeData.workEmail,
        enabled: true,
        emailVerified: true,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.workEmail || null,
        credentials: [
          {
            type: 'password',
            value: employeeData.password || this.generateTemporaryPassword(),
            temporary: false,
          }
        ],
      };

      const response = await api.post(`${this.KEYCLOAK_BASE_URL}/users`, payload);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message || 'Failed to create Keycloak user',
      };
    }
  }
  
  /**
   * Update Keycloak user for employee
   */
  static async updateUserForEmployee(employeeData: EmployeeKeycloakData) {
    try {
      const username = employeeData.username || employeeData.workEmail;
      
      const payload = {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.workEmail || null,
      };

      // If password is provided, update it
      if (employeeData.password) {
        (payload as any).credentials = [
          {
            type: 'password',
            value: employeeData.password,
            temporary: false,
          }
        ];
      }

      const response = await api.put(`${this.KEYCLOAK_BASE_URL}/users/${username}`, payload);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message || 'Failed to update Keycloak user',
      };
    }
  }
  
  /**
   * Delete Keycloak user for employee
   */
  static async deleteUserForEmployee(username: string) {
    try {
      const response = await api.delete(`${this.KEYCLOAK_BASE_URL}/users/${username}`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message || 'Failed to delete Keycloak user',
      };
    }
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
