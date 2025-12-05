export enum Role {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin',
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  department?: string;
  // Student specific
  roll_no?: string;
  hostel_name?: string;
  room_no?: string;
  parent_mobile?: string;
  year?: string;
}

export interface LeaveRequest {
  id: string;
  student_id: string;
  student_name: string;
  department: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: RequestStatus;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  // Optional fields for UI compatibility if needed
  student_roll_no?: string;
  hostel_name?: string;
  room_no?: string;
  parent_mobile?: string;
  year?: string;
}