/**
 * Employee Keycloak Service
 * Handles Keycloak user operations for employees
 */

import { CreateKeycloakUser, UpdateKeycloakUser, DeleteKeycloakUser } from '@/app/api/auth/keycloakCredentials';

interface EmployeeKeycloakData {
  workEmail: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export class EmployeeKeycloakService {
  /**
   * Create Keycloak user for employee
   */
  static async createUserForEmployee(employeeData: EmployeeKeycloakData) {
    const keycloakPayload = {
      data: {
        user: employeeData.workEmail,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        emailAddress: employeeData.workEmail,
        password: employeeData.password || this.generateTemporaryPassword(),
      }
    };
    
    return await CreateKeycloakUser(keycloakPayload);
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
