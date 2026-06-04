import React, { useState, useEffect, useTransition } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../lib/api.js';
import { pdfExporter } from '../lib/pdfExporter.js';
import {
  Student,
  Staff,
  Exam,
  StudentResult,
  SchoolClass,
  ActivityLog,
  DashboardStats
} from '../types.js';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Notebook,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Activity,
  UserCheck,
  Building,
  Upload,
  User,
  X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminDashboard({ activeTab, setActiveTab }: AdminDashboardProps) {
  const { showToast } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Search & Filtering States
  const [searchStudent, setSearchStudent] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [searchStaff, setSearchStaff] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  // --- CRUD Modals & Form States ---
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    regNo: '',
    fullName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    classId: '',
    parentName: '',
    parentPhone: '',
    address: '',
    photoUrl: ''
  });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState({
    staffId: '',
    fullName: '',
    department: '',
    role: 'Teacher' as 'Admin' | 'Teacher' | 'Staff',
    phone: '',
    email: '',
    photoUrl: ''
  });

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    classId: '',
    subject: '',
    date: '',
    maxMarks: 100,
    passMarks: 50,
    status: 'Scheduled' as 'Scheduled' | 'Completed'
  });

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    id: '',
    name: '',
    teacherId: '',
    room: ''
  });

  // --- Attendance Marker Panel States ---
  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStudents, setAttendanceStudents] = useState<{ id: string; name: string; status: 'Present' | 'Absent' | 'Late' }[]>([]);

  // --- Result/Grading Input Panel States ---
  const [gradingExam, setGradingExam] = useState('');
  const [gradingScores, setGradingScores] = useState<{ [studentId: string]: number }>({});

  // --- Delete Confirmations ---
  const [deleteConf, setDeleteConf] = useState<{ type: 'student' | 'staff' | 'exam'; id: string } | null>(null);

  // --- Details Peek Modals ---
  const [peekStudent, setPeekStudent] = useState<Student | null>(null);

  // Load dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes, staffRes, classesRes, examsRes, resultsRes] = await Promise.all([
        api.get<DashboardStats>('/api/dashboard/stats'),
        api.get<Student[]>('/api/students'),
        api.get<Staff[]>('/api/staff'),
        api.get<SchoolClass[]>('/api/classes'),
        api.get<Exam[]>('/api/exams'),
        api.get<StudentResult[]>('/api/results'),
      ]);

      setStats(statsRes);
      setStudents(studentsRes);
      setStaff(staffRes);
      setClasses(classesRes);
      setExams(examsRes);
      setResults(resultsRes);

      // Setup default lists for selectors
      if (classesRes.length > 0) {
        setAttendanceClass(classesRes[0].id);
      }
      if (examsRes.length > 0) {
        setGradingExam(examsRes[0].id);
      }
    } catch (err: any) {
      showToast('Error fetching administrator dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Load students for marked classroom roll
  useEffect(() => {
    if (!attendanceClass) return;
    const classRoster = students.filter(s => s.classId === attendanceClass);

    // Fetch existing roll if any
    const checkExistingAttendance = async () => {
      try {
        const attList = await api.get<any[]>(`/api/attendance?date=${attendanceDate}&classId=${attendanceClass}`);
        if (attList.length > 0 && attList[0].records) {
          setAttendanceStudents(
            attList[0].records.map((r: any) => ({
              id: r.studentId,
              name: r.name,
              status: r.status
            }))
          );
        } else {
          // Fill Default
          setAttendanceStudents(
            classRoster.map(s => ({
              id: s.regNo,
              name: s.fullName,
              status: 'Present'
            }))
          );
        }
      } catch {
        // Fallback
        setAttendanceStudents(
          classRoster.map(s => ({
            id: s.regNo,
            name: s.fullName,
            status: 'Present'
          }))
        );
      }
    };

    checkExistingAttendance();
  }, [attendanceClass, attendanceDate, students]);

  // Load results for grading grid
  useEffect(() => {
    if (!gradingExam) return;
    const exam = exams.find(e => e.id === gradingExam);
    if (!exam) return;

    const classStudents = students.filter(s => s.classId === exam.classId);
    const existingScores: { [key: string]: number } = {};

    results.forEach(res => {
      if (res.examId === gradingExam) {
        existingScores[res.studentId] = res.score;
      }
    });

    // Populate default scores to 0 if not set
    classStudents.forEach(s => {
      if (existingScores[s.regNo] === undefined) {
        existingScores[s.regNo] = 0;
      }
    });

    setGradingScores(existingScores);
  }, [gradingExam, results, exams, students]);

  // --- CRUD Handlers ---

  // Passport Photo Upload simulation (reads local file as base64 and puts in State)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'staff') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'student') {
        setStudentForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      } else {
        setStaffForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      }
      showToast('Passport Photo uploaded successfully.');
    };
    reader.readAsDataURL(file);
  };

  // Student Create / Edit
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.regNo.trim() || !studentForm.fullName.trim() || !studentForm.classId) {
      showToast('Please enter registration code, name, and class.', 'error');
      return;
    }

    try {
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, studentForm);
        showToast('Student details updated.');
      } else {
        await api.post('/api/students', studentForm);
        showToast('New student admitted successfully. Credentials auto-generated.');
      }
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const startEditStudent = (s: Student) => {
    setEditingStudent(s);
    setStudentForm({
      regNo: s.regNo,
      fullName: s.fullName,
      gender: s.gender,
      dob: s.dob,
      classId: s.classId,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      address: s.address,
      photoUrl: s.photoUrl || ''
    });
    setIsStudentModalOpen(true);
  };

  // Staff Create / Edit
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.staffId.trim() || !staffForm.fullName.trim() || !staffForm.role) {
      showToast('Enter Staff ID, full name and role.', 'error');
      return;
    }

    try {
      if (editingStaff) {
        await api.put(`/api/staff/${editingStaff.id}`, staffForm);
        showToast('Staff profile modified.');
      } else {
        await api.post('/api/staff', staffForm);
        showToast('New staff registered successfully.');
      }
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const startEditStaff = (st: Staff) => {
    setEditingStaff(st);
    setStaffForm({
      staffId: st.staffId,
      fullName: st.fullName,
      department: st.department,
      role: st.role,
      phone: st.phone,
      email: st.email,
      photoUrl: st.photoUrl || ''
    });
    setIsStaffModalOpen(true);
  };

  // Exam Schedule
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.classId || !examForm.subject || !examForm.date) {
      showToast('Subject, class, and schedule date are required.', 'error');
      return;
    }

    try {
      if (editingExam) {
        await api.put(`/api/exams/${editingExam.id}`, examForm);
        showToast('Exam schedule updated.');
      } else {
        await api.post('/api/exams', examForm);
        showToast('Examination drafted successfully.');
      }
      setIsExamModalOpen(false);
      setEditingExam(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const startEditExam = (ex: Exam) => {
    setEditingExam(ex);
    setExamForm({
      classId: ex.classId,
      subject: ex.subject,
      date: ex.date,
      maxMarks: ex.maxMarks,
      passMarks: ex.passMarks,
      status: ex.status
    });
    setIsExamModalOpen(true);
  };

  // Class Unit Creation
  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.id.trim() || !classForm.name.trim()) {
      showToast('Enter code and level name.', 'error');
      return;
    }

    try {
      await api.post('/api/classes', classForm);
      showToast('New Class unit created.');
      setIsClassModalOpen(false);
      setClassForm({ id: '', name: '', teacherId: '', room: '' });
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Executing Deletes after confirmation dialogs
  const confirmDelete = async () => {
    if (!deleteConf) return;
    try {
      if (deleteConf.type === 'student') {
        await api.delete(`/api/students/${deleteConf.id}`);
        showToast('Student profile deleted completely.');
      } else if (deleteConf.type === 'staff') {
        await api.delete(`/api/staff/${deleteConf.id}`);
        showToast('Staff member decommissioned.');
      } else if (deleteConf.type === 'exam') {
        await api.delete(`/api/exams/${deleteConf.id}`);
        showToast('Exam scheduled record canceled.');
      }
      setDeleteConf(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Track daily attendance action
  const saveAttendance = async () => {
    try {
      await api.post('/api/attendance', {
        date: attendanceDate,
        classId: attendanceClass,
        records: attendanceStudents.map(as => ({
          studentId: as.id,
          name: as.name,
          status: as.status
        }))
      });
      showToast('Class attendance roster committed successfully.');
      fetchData();
    } catch (err: any) {
      showToast('Fail saving classroom rolls.', 'error');
    }
  };

  // Save bulk scores grid down to server
  const saveGradingScores = async () => {
    try {
      const promises = Object.entries(gradingScores).map(([studentId, score]) => {
        return api.post('/api/results', {
          examId: gradingExam,
          studentId,
          score
        });
      });

      await Promise.all(promises);
      showToast('Classroom exam scores uploaded and graded.');
      fetchData();
    } catch (err: any) {
      showToast('Failed to commit student outcomes.', 'error');
    }
  };

  // PDF Download helpers
  const downloadClassReport = (classId: string) => {
    const classStudents = students.filter(s => s.classId === classId);
    const cls = classes.find(c => c.id === classId);
    pdfExporter.exportStudentReport(classStudents, cls ? cls.name : classId);
    showToast('Downloaded Class report.');
  };

  const downloadStaffReport = () => {
    pdfExporter.exportStaffReport(staff);
    showToast('Downloaded Staff directory.');
  };

  const downloadAttendanceReport = () => {
    const targetClass = classes.find(c => c.id === attendanceClass);
    pdfExporter.exportAttendanceReport(attendanceDate, targetClass ? targetClass.name : attendanceClass, attendanceStudents);
    showToast('Downloaded attendance sheet.');
  };

  const downloadIndividualReportCard = (student: Student) => {
    const sResults = results.filter(r => r.studentId === student.regNo);
    const cls = classes.find(c => c.id === student.classId);
    pdfExporter.exportStudentReportCard(student.fullName, student.regNo, cls ? cls.name : student.classId, sResults);
    showToast(`PDF Report Card generated for ${student.fullName}.`);
  };

  const handleActiveTab = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  // Filtering criteria datasets
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
                          s.regNo.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesClass = filterClass === 'all' || s.classId === filterClass;
    return matchesSearch && matchesClass;
  });

  const filteredStaffList = staff.filter(st => {
    const matchesSearch = st.fullName.toLowerCase().includes(searchStaff.toLowerCase()) ||
                          st.staffId.toLowerCase().includes(searchStaff.toLowerCase());
    const matchesDept = filterDept === 'all' || st.department.toLowerCase() === filterDept.toLowerCase();
    return matchesSearch && matchesDept;
  });

  if (loading || !stats) {
    return (
      <div id="loader-panel" className="flex flex-col items-center justify-center min-h-[500px] text-gray-400 gap-3">
        <Activity className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Loading Aegis Systems...</span>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-root" className="space-y-8 animate-fade-in">

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-2xl text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">Students</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalStudents}</span>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">Teachers</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalStaff}</span>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl text-amber-600 dark:text-amber-500 hover:scale-105 transition-all">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">Roll (Today)</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-bold text-emerald-600">{stats.attendanceSummary.present} Present</span>
                  <span className="text-xs text-rose-500 font-medium">{stats.attendanceSummary.absent} Absent</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="bg-purple-50 dark:bg-purple-950/40 p-3.5 rounded-2xl text-purple-600 dark:text-purple-400 hover:scale-105 transition-all">
                <Notebook className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">Exams Drafted</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalExams}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-indigo-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-600/10">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold tracking-tight">Administrative Terminal Access</h3>
              <p className="text-xs text-indigo-100 max-w-lg">
                Quickly admitting a student, marked rolls, input exam markings, or download compliance PDF directories recursively.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setStudentForm({
                    regNo: `STU${Math.floor(100 + Math.random() * 900)}`,
                    fullName: '',
                    gender: 'Male',
                    dob: '2012-05-15',
                    classId: classes[0]?.id || '',
                    parentName: '',
                    parentPhone: '',
                    address: '',
                    photoUrl: ''
                  });
                  setIsStudentModalOpen(true);
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Enroll Student
              </button>
              <button
                onClick={() => handleActiveTab('attendance')}
                className="px-4 py-2.5 bg-white text-indigo-700 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <CalendarCheck className="h-4 w-4" />
                Keep Today's Roll
              </button>
            </div>
          </div>

          {/* Attendance Trend Charts & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recharts chart */}
            <div className="lg:col-span-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    Student Attendance Analytics
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">7-Day consecutive class registration present limits</p>
                </div>
                <div className="flex gap-4 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Absent</span>
                </div>
              </div>

              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.attendanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false}/>
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false}/>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#presentGrad)" />
                    <Area type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#absentGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Timeline Feed logs */}
            <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Activity Logs Feed
                </h3>
                <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                  {stats.recentActivity.map(log => (
                    <div key={log.id} className="relative pl-5 border-l border-slate-200 dark:border-slate-850 pb-1 text-xs">
                      <div className="absolute left-[-4.5px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                        <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">{log.role}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-slate-200">{log.action}</h4>
                      <p className="text-gray-500 mt-0.5 leading-relaxed">{log.details}</p>
                    </div>
                  ))}
                  {stats.recentActivity.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">
                      No system events logged today.
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleActiveTab('classes')}
                className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mt-4 cursor-pointer"
              >
                Inspect Classes Setup →
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2. STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search name, class or reg. number..."
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="all">All Class Units</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setStudentForm({
                    regNo: `STU${Math.floor(100 + Math.random() * 900)}`,
                    fullName: '',
                    gender: 'Male',
                    dob: '2012-05-15',
                    classId: classes[0]?.id || '',
                    parentName: '',
                    parentPhone: '',
                    address: '',
                    photoUrl: ''
                  });
                  setIsStudentModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" /> Add Student
              </button>

              <button
                onClick={() => {
                  if (filterClass === 'all') {
                    showToast('Please select a specific Class Unit first to download.', 'info');
                    return;
                  }
                  downloadClassReport(filterClass);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="h-4 w-4" /> PDF Report
              </button>
            </div>
          </div>

          {/* Student Grid / Tables */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-150 dark:border-slate-800">
                    <th className="py-4 px-6">Passport</th>
                    <th className="py-4 px-6">Reg Number</th>
                    <th className="py-4 px-6">Full Name</th>
                    <th className="py-4 px-6">Class Level</th>
                    <th className="py-4 px-6">Guardian Info</th>
                    <th className="py-4 px-6 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {filteredStudents.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="py-3 px-6">
                          <img
                            src={s.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={s.fullName}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 rounded-full object-cover border border-slate-100 shadow-inner"
                          />
                        </td>
                        <td className="py-3 px-6 font-mono font-medium text-indigo-600 dark:text-indigo-400">{s.regNo}</td>
                        <td className="py-3 px-6 font-semibold">{s.fullName}</td>
                        <td className="py-3 px-6">
                          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold">
                            {cls ? cls.name : s.classId}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{s.parentName}</div>
                            <div className="text-[10px] text-slate-400">{s.parentPhone}</div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setPeekStudent(s)}
                            title="Quick details view"
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => startEditStudent(s)}
                            title="Edit details"
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => downloadIndividualReportCard(s)}
                            title="Generate Full Report Card PDF"
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConf({ type: 'student', id: s.id })}
                            title="Remove student"
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-xs text-gray-400">
                        No students profiles registered matching current configurations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search staff, specialty, email..."
                  value={searchStaff}
                  onChange={e => setSearchStaff(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="all">All Departments</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Administration">Administration</option>
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setStaffForm({
                    staffId: `TCH${Math.floor(100 + Math.random() * 900)}`,
                    fullName: '',
                    department: 'Mathematics',
                    role: 'Teacher',
                    phone: '',
                    email: '',
                    photoUrl: ''
                  });
                  setIsStaffModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" /> Add Staff Member
              </button>

              <button
                onClick={downloadStaffReport}
                className="w-full sm:w-auto px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="h-4 w-4" /> PDF Report
              </button>
            </div>
          </div>

          {/* Staff Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredStaffList.map(st => (
              <div key={st.id} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none transition-all flex flex-col justify-between relative group">
                <div className="absolute right-3.5 top-3.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditStaff(st)}
                    className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConf({ type: 'staff', id: st.id })}
                    className="p-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={st.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                      alt={st.fullName}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-800"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{st.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{st.department}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-650 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] font-semibold">Staff Identity:</span>
                      <span className="font-mono text-[10px] font-bold text-indigo-500">{st.staffId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] font-semibold">Responsibility:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{st.role}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 text-[11px] text-slate-400 truncate">
                  {st.email}
                </div>
              </div>
            ))}
            {filteredStaffList.length === 0 && (
              <div className="col-span-full text-center py-16 text-xs text-gray-400 bg-white dark:bg-slate-900 rounded-3xl">
                No staff profiles found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex flex-col gap-1 sm:w-48">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Class</span>
                <select
                  value={attendanceClass}
                  onChange={e => setAttendanceClass(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 sm:w-48">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Record Date</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0 self-end">
              <button
                onClick={saveAttendance}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <CheckCircle className="h-4 w-4" /> Save Marked Roll
              </button>

              <button
                onClick={downloadAttendanceReport}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="h-4 w-4" /> Download Sheet
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-150 dark:border-slate-800">
                    <th className="py-4 px-6">S.No.</th>
                    <th className="py-4 px-6">Student Reg</th>
                    <th className="py-4 px-6">Full Name</th>
                    <th className="py-4 px-6 text-center">Roster Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {attendanceStudents.map((as, idx) => (
                    <tr key={as.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                      <td className="py-4 px-6 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-4 px-6 font-mono font-medium text-indigo-500">{as.id}</td>
                      <td className="py-4 px-6 font-semibold">{as.name}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center gap-4">
                          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`att-${as.id}`}
                              checked={as.status === 'Present'}
                              onChange={() => {
                                setAttendanceStudents(prev =>
                                  prev.map(p => (p.id === as.id ? { ...p, status: 'Present' } : p))
                                );
                              }}
                              className="accent-emerald-600"
                            />
                            <span className="text-[11px] font-semibold text-emerald-600">Present</span>
                          </label>

                          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`att-${as.id}`}
                              checked={as.status === 'Absent'}
                              onChange={() => {
                                setAttendanceStudents(prev =>
                                  prev.map(p => (p.id === as.id ? { ...p, status: 'Absent' } : p))
                                );
                              }}
                              className="accent-rose-600"
                            />
                            <span className="text-[11px] font-semibold text-rose-600">Absent</span>
                          </label>

                          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`att-${as.id}`}
                              checked={as.status === 'Late'}
                              onChange={() => {
                                setAttendanceStudents(prev =>
                                  prev.map(p => (p.id === as.id ? { ...p, status: 'Late' } : p))
                                );
                              }}
                              className="accent-amber-500"
                            />
                            <span className="text-[11px] font-semibold text-amber-500">Late</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {attendanceStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-xs text-gray-400">
                        No students are mapped to this Class. Add students to Grade roster first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Institutional Exams</h3>
            <button
              onClick={() => {
                setEditingExam(null);
                setExamForm({
                  classId: classes[0]?.id || '',
                  subject: '',
                  date: new Date().toISOString().split('T')[0],
                  maxMarks: 100,
                  passMarks: 50,
                  status: 'Scheduled'
                });
                setIsExamModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Draft Exam Sheet
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-150 dark:border-slate-800">
                    <th className="py-4 px-6">Class Room</th>
                    <th className="py-4 px-6">Course Specialty</th>
                    <th className="py-4 px-6">Examination Date</th>
                    <th className="py-4 px-6">Evaluation Criteria</th>
                    <th className="py-4 px-6">Status Details</th>
                    <th className="py-4 px-6 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {exams.map(ex => {
                    const cls = classes.find(c => c.id === ex.classId);
                    return (
                      <tr key={ex.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                        <td className="py-4 px-6 font-semibold">{cls ? cls.name : ex.classId}</td>
                        <td className="py-4 px-6 font-medium text-slate-950 dark:text-slate-200">{ex.subject}</td>
                        <td className="py-4 px-6">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {ex.date}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                            Passing: {ex.passMarks}/{ex.maxMarks} Marks
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {ex.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold dark:bg-emerald-950/30 dark:text-emerald-400">
                              Completed/Graded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-semibold dark:bg-indigo-950/30 dark:text-indigo-400">
                              Upcoming Slot
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-1.5">
                          <button
                            onClick={() => startEditExam(ex)}
                            className="p-1 px-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-medium text-[10px]"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => setDeleteConf({ type: 'exam', id: ex.id })}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-xs text-gray-400">
                        No examinations scheduled. Create schedules.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. RESULTS PROCESSING */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col gap-1 w-full sm:w-64">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Examination Sheet</span>
              <select
                value={gradingExam}
                onChange={e => setGradingExam(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.subject} ({classes.find(c => c.id === e.classId)?.name || e.classId})</option>
                ))}
              </select>
            </div>

            <button
              onClick={saveGradingScores}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all self-end"
            >
              <CheckCircle className="h-4 w-4" /> Save Score Outcomes
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-150 dark:border-slate-800">
                    <th className="py-4 px-6">Student ID</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Evaluation Score Code (0 - 100)</th>
                    <th className="py-4 px-6">Computed Grade Criteria</th>
                    <th className="py-4 px-6">Roll Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {students.filter(s => s.classId === exams.find(e => e.id === gradingExam)?.classId).map(s => {
                    const currentScore = gradingScores[s.regNo] || 0;
                    // Auto grade indicators
                    const percentage = (currentScore / (exams.find(e => e.id === gradingExam)?.maxMarks || 100)) * 100;
                    const letter = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
                    const passState = percentage >= 50;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                        <td className="py-4 px-6 font-mono font-bold text-indigo-500">{s.regNo}</td>
                        <td className="py-4 px-6 font-semibold">{s.fullName}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={currentScore}
                              onChange={e => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                setGradingScores(prev => ({ ...prev, [s.regNo]: val }));
                              }}
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border-b border-indigo-200 outline-none text-center font-bold"
                            />
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={currentScore}
                              onChange={e => {
                                setGradingScores(prev => ({ ...prev, [s.regNo]: Number(e.target.value) }));
                              }}
                              className="w-48 xl:w-64 accent-indigo-600 h-1 rounded"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            letter === 'A' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                            letter === 'F' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20'
                          }`}>
                            Grade {letter} ({percentage.toFixed(0)}%)
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {passState ? (
                            <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-0.5"><CheckCircle className="h-3.5 w-3.5" /> Pass</span>
                          ) : (
                            <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-0.5"><XCircle className="h-3.5 w-3.5" /> Fail Criteria</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. CLASSES TAB */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Classes Designated Units</h3>
            <button
              onClick={() => {
                setClassForm({
                  id: `class-${Math.floor(10 + Math.random() * 89)}b`,
                  name: '',
                  teacherId: staff.find(st => st.role === 'Teacher')?.staffId || '',
                  room: ''
                });
                setIsClassModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Class Unit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {classes.map(c => {
              const studentsInClass = students.filter(s => s.classId === c.id);
              return (
                <div key={c.id} className="p-6 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm relative group hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold uppercase">
                      Class: {c.id}
                    </span>
                    <button
                      onClick={() => downloadClassReport(c.id)}
                      title="Download Class list PDF"
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{c.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" />
                      Assigned Room: <strong>{c.room}</strong>
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-850">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[11px]">Academic Advisor:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-350">{c.teacherName}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[11px]">Roster Count:</span>
                      <span className="font-bold text-indigo-600">{studentsInClass.length} Enrolled</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================= MODAL FORMS & DIALOGS ======================================================= */}

      {/* Student Admission Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingStudent ? 'Edit Student Details' : 'Student Enrollment Register'}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="p-1.5 hover:bg-slate-55 border rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold">Reg Number</label>
                  <input
                    type="text"
                    disabled={!!editingStudent}
                    value={studentForm.regNo}
                    onChange={e => setStudentForm(prev => ({ ...prev, regNo: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={studentForm.fullName}
                    onChange={e => setStudentForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold">Gender</label>
                  <select
                    value={studentForm.gender}
                    onChange={e => setStudentForm(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Date of birth</label>
                  <input
                    type="date"
                    value={studentForm.dob}
                    onChange={e => setStudentForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold">Assign Class Unit</label>
                  <select
                    value={studentForm.classId}
                    onChange={e => setStudentForm(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold">Guardian / Parent Name</label>
                  <input
                    type="text"
                    value={studentForm.parentName}
                    onChange={e => setStudentForm(prev => ({ ...prev, parentName: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Guardian Phone</label>
                  <input
                    type="text"
                    value={studentForm.parentPhone}
                    onChange={e => setStudentForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Residential Address</label>
                <input
                  type="text"
                  value={studentForm.address}
                  onChange={e => setStudentForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              {/* Photo Upload with live preview */}
              <div className="space-y-1.5 pt-2">
                <label className="font-semibold block">Passport Identity Photo</label>
                <div className="flex items-center gap-4">
                  {studentForm.photoUrl ? (
                    <img src={studentForm.photoUrl} alt="Preview" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-slate-50 dark:bg-slate-800 border border-dashed flex items-center justify-center text-slate-400">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                  <label className="px-3.5 py-2 border border-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-all">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span>Upload Student Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'student')} />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs flex justify-center mt-6 cursor-pointer hover:bg-indigo-700 transition"
              >
                {editingStudent ? 'Update Enrolled Student' : 'Commit Enrollment Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Staff Registration Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingStaff ? 'Edit Staff Profile' : 'Staff Onboarding Directory'}
              </h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="p-1.5 border rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold">Staff ID Code</label>
                  <input
                    type="text"
                    disabled={!!editingStaff}
                    value={staffForm.staffId}
                    onChange={e => setStaffForm(prev => ({ ...prev, staffId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={staffForm.fullName}
                    onChange={e => setStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold">Department</label>
                  <select
                    value={staffForm.department}
                    onChange={e => setStaffForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Corporate Role</label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer"
                  >
                    <option value="Teacher">Teaching Class Instructor</option>
                    <option value="Admin">System Administrator</option>
                    <option value="Staff">Administrative Office Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold">Phone Contact</label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={e => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Email Directory</label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={e => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs flex justify-center mt-6 cursor-pointer hover:bg-indigo-700 transition"
              >
                {editingStaff ? 'Update Corporate Profile' : 'Complete Staff Hiring'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Exam Scheduling Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {editingExam ? 'Reschedule Exam' : 'Draft Examination Slot'}
              </h3>
              <button onClick={() => setIsExamModalOpen(false)} className="p-1 border rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">Choose Class</label>
                <select
                  value={examForm.classId}
                  onChange={e => setExamForm(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer outline-none focus:ring-1"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Course Subject Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics II (Trigonometry)"
                  value={examForm.subject}
                  onChange={e => setExamForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Calendar Date Slot</label>
                <input
                  type="date"
                  value={examForm.date}
                  onChange={e => setExamForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Maximum Marks</label>
                  <input
                    type="number"
                    value={examForm.maxMarks}
                    onChange={e => setExamForm(prev => ({ ...prev, maxMarks: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Passing Threshold</label>
                  <input
                    type="number"
                    value={examForm.passMarks}
                    onChange={e => setExamForm(prev => ({ ...prev, passMarks: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs mt-4 transition cursor-pointer"
              >
                Save Examination Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Class Create Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Generate School Class Unit</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="p-1 border rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleClassSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Class Identifier ID</label>
                <input
                  type="text"
                  placeholder="e.g. class-12a"
                  value={classForm.id}
                  onChange={e => setClassForm(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Academic Title Level</label>
                <input
                  type="text"
                  placeholder="e.g. Grade 12A (Honors)"
                  value={classForm.name}
                  onChange={e => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Assign Class Advisor</label>
                <select
                  value={classForm.teacherId}
                  onChange={e => setClassForm(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl cursor-pointer"
                >
                  {staff.filter(st => st.role === 'Teacher').map(t => (
                    <option key={t.staffId} value={t.staffId}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Designated Classroom Room</label>
                <input
                  type="text"
                  placeholder="e.g. Room 402"
                  value={classForm.room}
                  onChange={e => setClassForm(prev => ({ ...prev, room: e.target.value }))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs mt-4 transition cursor-pointer"
              >
                Deploy Classroom Unit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Details View Modal */}
      {peekStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center">
            <button onClick={() => setPeekStudent(null)} className="p-1 border rounded-lg self-end mb-2 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            <img
              src={peekStudent.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={peekStudent.fullName}
              className="h-20 w-20 rounded-full object-cover border-2 border-indigo-500 shadow mb-3"
            />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{peekStudent.fullName}</h4>
            <span className="text-[10px] font-mono text-indigo-500 font-semibold">{peekStudent.regNo}</span>

            <div className="w-full text-left space-y-2 mt-4 text-xs bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-dashed">
              <div><strong>Date of Birth:</strong> {peekStudent.dob}</div>
              <div><strong>Parent/Guardian:</strong> {peekStudent.parentName}</div>
              <div><strong>Contact Number:</strong> {peekStudent.parentPhone}</div>
              <div><strong>Residential Address:</strong> {peekStudent.address}</div>
            </div>
            <button
              onClick={() => { downloadIndividualReportCard(peekStudent); setPeekStudent(null); }}
              className="mt-4 w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Result Card Sheet
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConf && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-200/50 shadow-xl flex flex-col items-center text-center">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Irreversible Action Warning</h4>
            <p className="text-xs text-slate-400 mt-1">
              You are deleting this record from backend databases completely. Continue?
            </p>
            <div className="grid grid-cols-2 gap-2 w-full mt-4">
              <button
                onClick={() => setDeleteConf(null)}
                className="py-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl cursor-pointer"
              >
                Abort
              </button>
              <button
                onClick={confirmDelete}
                className="py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Erase Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
