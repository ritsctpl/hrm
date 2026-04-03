import { z } from 'zod';

export type SettingsSection = 'profile' | 'security' | 'notifications' | 'preferences' | 'support';

export const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactNumber: z.string().min(10, 'Valid phone number required'),
  personalEmail: z.string().email('Valid email required'),
  profilePhoto: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(10, 'Valid phone number required'),
});

export type EmergencyContactData = z.infer<typeof emergencyContactSchema>;

export interface NotificationPreferences {
  push: {
    salaryCredit: boolean;
    leaveApproval: boolean;
    generalAnnouncements: boolean;
    holidayAlerts: boolean;
    appraisalUpdates: boolean;
  };
  email: {
    payslipAvailable: boolean;
    policyUpdates: boolean;
    expenseApproval: boolean;
    projectAssignments: boolean;
  };
  dnd: {
    enabled: boolean;
    startTime: string | null;
    endTime: string | null;
  };
}

export type TicketCategory = 'general' | 'technical' | 'hr' | 'payroll' | 'leave';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'pending' | 'resolved';

export const ticketFormSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high']),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;

export interface SupportTicket extends TicketFormData {
  id: string;
  status: TicketStatus;
  createdAt: string;
}

export interface CalendarSyncPrefs {
  googleCalendar: boolean;
  outlookCalendar: boolean;
}
