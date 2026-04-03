export interface UpdateProfileRequest {
  name: string;
  contactNumber: string;
  personalEmail: string;
  profilePhoto?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

export interface SubmitTicketRequest {
  subject: string;
  category: string;
  description: string;
  priority: string;
}

export interface SubmitTicketResponse {
  ticketId: string;
  status: string;
}
