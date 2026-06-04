import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Database schema structures represented in typescript
export interface User {
  id: string;
  username: string;
  passwordHash: string; // Plain-text or simple base64 for mockup validation
  role: 'admin' | 'teacher' | 'student' | 'parent';
  linkedId?: string; // registration number of student, or staff ID
  fullName: string;
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

export interface Result {
  id: string;
  examId: string;
  studentId: string; // regNo
  studentName: string;
  classId: string;
  subject: string;
  score: number;
  maxMarks: number;
  grade: string;
  average?: number;
  status: 'Pass' | 'Fail';
}

export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string; // advisor
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

// Ensure the directory exists
function initDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read database collections helper
export function readCollection<T>(collectionName: string): T[] {
  initDir();
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T[];
  } catch (error) {
    console.error(`Error reading collection ${collectionName}:`, error);
    return [];
  }
}

// Write database collections helper
export function writeCollection<T>(collectionName: string, data: T[]): void {
  initDir();
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing collection ${collectionName}:`, error);
  }
}

// Helper to auto-calculate grade
export function getGradeAndStatus(score: number, maxMarks: number): { grade: string; status: 'Pass' | 'Fail' } {
  const percentage = (score / maxMarks) * 100;
  let grade = 'F';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';

  const status = percentage >= 50 ? 'Pass' : 'Fail';
  return { grade, status };
}

// Initialize and seed database if empty
export function initDB() {
  initDir();

  const collections = ['users', 'students', 'staff', 'attendance', 'exams', 'results', 'classes', 'logs'];

  const needsSeeding = collections.some(col => {
    const p = path.join(DATA_DIR, `${col}.json`);
    return !fs.existsSync(p) || fs.readFileSync(p, 'utf-8').trim() === '';
  });

  if (!needsSeeding) {
    console.log('Database already initialized.');
    return;
  }

  console.log('Database empty or missing. Initializing standard seed data...');

  // 1. Seed Classes
  const classes: SchoolClass[] = [
    { id: 'class-10b', name: 'Grade 10B', teacherId: 'TCH101', teacherName: 'David Miller', room: 'Room 204' },
    { id: 'class-9a', name: 'Grade 9A', teacherId: 'TCH102', teacherName: 'Sarah Jenkins', room: 'Room 101' },
    { id: 'class-11a', name: 'Grade 11A', teacherId: 'TCH103', teacherName: 'Robert Garcia', room: 'Room 302' }
  ];
  writeCollection('classes', classes);

  // 2. Seed Staff
  const staff: Staff[] = [
    { id: 'TCH101', staffId: 'TCH101', fullName: 'David Miller', department: 'Mathematics', role: 'Teacher', phone: '+1 555-0101', email: 'david.miller@school.edu', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'TCH102', staffId: 'TCH102', fullName: 'Sarah Jenkins', department: 'Science', role: 'Teacher', phone: '+1 555-0102', email: 'sarah.jenkins@school.edu', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 'TCH103', staffId: 'TCH103', fullName: 'Robert Garcia', department: 'English', role: 'Teacher', phone: '+1 555-0103', email: 'robert.garcia@school.edu', photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { id: 'ADM101', staffId: 'ADM101', fullName: 'Jennifer Lopez', department: 'Administration', role: 'Admin', phone: '+1 555-0100', email: 'jennifer.admin@school.edu', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' }
  ];
  writeCollection('staff', staff);

  // 3. Seed Students
  const students: Student[] = [
    { id: 'STU001', regNo: 'STU001', fullName: 'Alex Mercer', gender: 'Male', dob: '2011-04-12', classId: 'class-10b', parentName: 'John Mercer', parentPhone: '+1 555-0111', address: '123 Maple Street, Sector-4', photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
    { id: 'STU002', regNo: 'STU002', fullName: 'Emma Watson', gender: 'Female', dob: '2011-09-24', classId: 'class-10b', parentName: 'Richard Watson', parentPhone: '+1 555-0112', address: '456 Oak Avenue, Sector-2', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
    { id: 'STU003', regNo: 'STU003', fullName: 'Liam Neeson', gender: 'Male', dob: '2012-01-15', classId: 'class-9a', parentName: 'Patrick Neeson', parentPhone: '+1 555-0113', address: '789 Pine Road, Sector-9', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'STU004', regNo: 'STU004', fullName: 'Sophia Loren', gender: 'Female', dob: '2010-06-30', classId: 'class-11a', parentName: 'Mario Loren', parentPhone: '+1 555-0114', address: '321 Elm Drive, Sector-11', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
  ];
  writeCollection('students', students);

  // 4. Seed Users (with passwords plain text or encrypted; here plain text is simple and robust)
  const users: User[] = [
    { id: 'usr-1', username: 'admin', passwordHash: 'admin123', role: 'admin', fullName: 'Jennifer Lopez', linkedId: 'ADM101' },
    { id: 'usr-2', username: 'teacher', passwordHash: 'teacher123', role: 'teacher', fullName: 'David Miller', linkedId: 'TCH101' },
    { id: 'usr-3', username: 'student', passwordHash: 'student123', role: 'student', fullName: 'Alex Mercer', linkedId: 'STU001' },
    { id: 'usr-4', username: 'parent', passwordHash: 'parent123', role: 'parent', fullName: 'John Mercer', linkedId: 'STU001' }
  ];
  writeCollection('users', users);

  // 5. Seed Attendance for the past 7 days (to provide authentic metrics and charts!)
  const attendance: Attendance[] = [];
  const pastDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    pastDates.push(d.toISOString().split('T')[0]);
  }

  pastDates.forEach((dateString, idx) => {
    // Grade 10B attendance
    attendance.push({
      id: `att-10b-${idx}`,
      date: dateString,
      classId: 'class-10b',
      records: [
        { studentId: 'STU001', name: 'Alex Mercer', status: idx === 3 ? 'Absent' : idx === 5 ? 'Late' : 'Present' },
        { studentId: 'STU002', name: 'Emma Watson', status: idx === 1 ? 'Absent' : 'Present' }
      ]
    });
    // Grade 9A attendance
    attendance.push({
      id: `att-9a-${idx}`,
      date: dateString,
      classId: 'class-9a',
      records: [
        { studentId: 'STU003', name: 'Liam Neeson', status: idx === 2 ? 'Absent' : 'Present' }
      ]
    });
    // Grade 11A attendance
    attendance.push({
      id: `att-11a-${idx}`,
      date: dateString,
      classId: 'class-11a',
      records: [
        { studentId: 'STU004', name: 'Sophia Loren', status: 'Present' }
      ]
    });
  });
  writeCollection('attendance', attendance);

  // 6. Seed Examinations
  const exams: Exam[] = [
    { id: 'ex-001', classId: 'class-10b', subject: 'Mathematics (Algebra)', date: '2026-05-15', maxMarks: 100, passMarks: 50, status: 'Completed' },
    { id: 'ex-002', classId: 'class-10b', subject: 'Science (Biology)', date: '2026-05-18', maxMarks: 100, passMarks: 50, status: 'Completed' },
    { id: 'ex-003', classId: 'class-11a', subject: 'Physics (Mechanics)', date: '2026-05-20', maxMarks: 100, passMarks: 50, status: 'Completed' },
    { id: 'ex-004', classId: 'class-10b', subject: 'English (Literature)', date: '2026-06-10', maxMarks: 100, passMarks: 50, status: 'Scheduled' }
  ];
  writeCollection('exams', exams);

  // 7. Seed Results
  const results: Result[] = [
    { id: 'res-1', examId: 'ex-001', studentId: 'STU001', studentName: 'Alex Mercer', classId: 'class-10b', subject: 'Mathematics (Algebra)', score: 85, maxMarks: 100, grade: 'B', average: 85, status: 'Pass' },
    { id: 'res-2', examId: 'ex-001', studentId: 'STU002', studentName: 'Emma Watson', classId: 'class-10b', subject: 'Mathematics (Algebra)', score: 92, maxMarks: 100, grade: 'A', average: 92, status: 'Pass' },
    { id: 'res-3', examId: 'ex-002', studentId: 'STU001', studentName: 'Alex Mercer', classId: 'class-10b', subject: 'Science (Biology)', score: 78, maxMarks: 100, grade: 'C', average: 78, status: 'Pass' },
    { id: 'res-4', examId: 'ex-002', studentId: 'STU002', studentName: 'Emma Watson', classId: 'class-10b', subject: 'Science (Biology)', score: 96, maxMarks: 100, grade: 'A', average: 96, status: 'Pass' },
    { id: 'res-5', examId: 'ex-003', studentId: 'STU004', studentName: 'Sophia Loren', classId: 'class-11a', subject: 'Physics (Mechanics)', score: 88, maxMarks: 100, grade: 'B', average: 88, status: 'Pass' }
  ];
  writeCollection('results', results);

  // 8. Seed Activity Logs
  const logs: ActivityLog[] = [
    { id: 'log-1', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), user: 'admin', role: 'Admin', action: 'Staff Record Generated', details: 'Added Robert Garcia (Teacher) to staff database' },
    { id: 'log-2', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), user: 'teacher', role: 'Teacher', action: 'Attendance Recorded', details: 'Marked today\'s attendance for Grade 10B' },
    { id: 'log-3', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), user: 'admin', role: 'Admin', action: 'Result Processed', details: 'Uploaded and graded scores for Exam ex-001 (Mathematics)' },
    { id: 'log-4', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), user: 'teacher', role: 'Teacher', action: 'Exam Created', details: 'Scheduled English (Literature) for 2026-06-10' }
  ];
  writeCollection('logs', logs);

  console.log('Seed data setup successfully.');
}
