export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface UserSession {
  username: string;
  role: UserRole;
  fullName: string;
  linkedId?: string;
}

export interface Student {
  id: string; // matches regNo
  regNo: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  address: string;
  photoUrl?: string;
}

export interface Staff {
  id: string; // matches staffId
  staffId: string;
  fullName: string;
  department: string;
  role: 'Admin' | 'Teacher' | 'Staff';
  phone: string;
  email: string;
  photoUrl?: string;
}

export interface AttendanceRecord {
  studentId: string;
  name: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  records: AttendanceRecord[];
}

export interface Exam {
  id: string;
  classId: string;
  subject: string;
  date: string;
  maxMarks: number;
  passMarks: number;
  status: 'Scheduled' | 'Completed';
}

export interface StudentResult {
  id: string;
  examId: string;
  studentId: string; // regNo
  studentName: string;
  classId: string;
  subject: string;
  score: number;
  maxMarks: number;
  grade: string;
  status: 'Pass' | 'Fail';
}

export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  room: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
  };
  totalExams: number;
  recentActivity: ActivityLog[];
  attendanceTrend: {
    date: string;
    present: number;
    absent: number;
    late: number;
  }[];
}
