import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../lib/api.js';
import { pdfExporter } from '../lib/pdfExporter.js';
import { Student, Attendance, Exam, StudentResult } from '../types.js';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, showToast } = useApp();
  const [queryRegNo, setQueryRegNo] = useState(user?.linkedId || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudentData = async (regNoToFetch: string) => {
    if (!regNoToFetch.trim()) return;
    setLoading(true);
    try {
      // 1. Fetch Students, Exams, Results
      const [studentsRes, attendanceRes, resultsRes, examsRes] = await Promise.all([
        api.get<Student[]>('/api/students'),
        api.get<Attendance[]>('/api/attendance'),
        api.get<StudentResult[]>('/api/results'),
        api.get<Exam[]>('/api/exams')
      ]);

      const foundStudent = studentsRes.find(s => s.regNo.toLowerCase() === regNoToFetch.toLowerCase());

      if (!foundStudent) {
        showToast(`Registration Number ${regNoToFetch} not found in database.`, 'error');
        setStudent(null);
        setLoading(false);
        return;
      }

      setStudent(foundStudent);
      setExams(examsRes);

      // Filter attendance records specific to this student
      const studentAttendance = attendanceRes.filter(att =>
        att.records.some(rec => rec.studentId.toLowerCase() === regNoToFetch.toLowerCase())
      );
      setAttendance(studentAttendance);

      // Filter results specific to student
      const studentResults = resultsRes.filter(res => res.studentId.toLowerCase() === regNoToFetch.toLowerCase());
      setResults(studentResults);

      showToast(`Pulled Academic Profile folder for ${foundStudent.fullName}`);
    } catch {
      showToast('Offline state or failed syncing student records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.linkedId) {
      fetchStudentData(user.linkedId);
    }
  }, [user]);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudentData(queryRegNo);
  };

  // Compute stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter(att =>
    att.records.some(r => r.studentId.toLowerCase() === student?.regNo.toLowerCase() && r.status === 'Present')
  ).length;
  const lateDays = attendance.filter(att =>
    att.records.some(r => r.studentId.toLowerCase() === student?.regNo.toLowerCase() && r.status === 'Late')
  ).length;

  const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 100;

  const downloadPDFReport = () => {
    if (!student) return;
    pdfExporter.exportStudentReportCard(student.fullName, student.regNo, student.classId, results);
    showToast('Student results slips saved successfully code.');
  };

  return (
    <div id="student-portal-root" className="space-y-6 animate-fade-in text-xs">

      {/* Query Search Panel */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-sm text-slate-950 dark:text-slate-100 flex items-center gap-1">
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            Query Academic Profiles Archive
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Enter school-assigned Registration Number to verify schedules, grades, and logs.</p>
        </div>

        <form onSubmit={handleQuerySubmit} className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="e.g. STU001, STU002"
              value={queryRegNo}
              onChange={e => setQueryRegNo(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border rounded-xl outline-none text-xs font-semibold focus:ring-1"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition"
          >
            Pull Academic Folder
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-12 flex flex-col items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
          <span>Syncing Profile folder...</span>
        </div>
      )}

      {!loading && student && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* 1. Left Student Bio Column */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-5 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <img
                src={student.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                referrerPolicy="no-referrer"
                alt={student.fullName}
                className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow mb-3"
              />
              <h5 className="font-bold text-sm text-slate-900 dark:text-slate-200 leading-snug">{student.fullName}</h5>
              <span className="font-mono text-[10px] text-indigo-500 font-semibold">{student.regNo}</span>
            </div>

            <div className="space-y-2 border-t border-dashed pt-4">
              <div className="flex justify-between items-center py-0.5 border-b border-gray-50 dark:border-slate-850">
                <span className="text-slate-400 font-semibold">Class Assigned:</span>
                <span className="font-bold uppercase text-slate-700 dark:text-slate-350">{student.classId}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-gray-50 dark:border-slate-850">
                <span className="text-slate-400 font-semibold">Gender Identity:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{student.gender}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-gray-50 dark:border-slate-850">
                <span className="text-slate-400 font-semibold">Date of birth:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{student.dob}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-gray-50 dark:border-slate-850">
                <span className="text-slate-400 font-semibold">Residential core:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350 truncate max-w-[150px]" title={student.address}>{student.address}</span>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <h6 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Guardian Details:</h6>
              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-gray-100 text-[11px] space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Name: {student.parentName}</div>
                <div className="text-slate-500">Call Phone: {student.parentPhone}</div>
              </div>
            </div>
          </div>

          {/* 2. Middle Attendance Check Summary & Roster Results Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Attendance indicator summary */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-3">
                <CalendarCheck className="h-5 w-5 text-indigo-500" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Roster Attendance</span>
                  <span className="text-lg font-bold text-slate-850 dark:text-slate-200">{attendanceRate.toFixed(0)}% Rate</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Present Days</span>
                  <span className="text-lg font-bold text-emerald-600">{presentDays} recorded</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-3">
                <XCircle className="h-5 w-5 text-rose-500" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Absent Days</span>
                  <span className="text-lg font-bold text-rose-600">{attendance.length - presentDays - lateDays} missed</span>
                </div>
              </div>
            </div>

            {/* Detailed Examination Card scores */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-gray-150">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">Academic Score Grades Chart</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Subject course evaluations and automatic grade calculation metrics.</p>
                </div>
                <button
                  onClick={downloadPDFReport}
                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-indigo-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> PDF Report Card
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {results.map(res => (
                  <div key={res.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">{res.subject}</h5>
                      <span className="text-[9px] text-slate-400">Class unit criteria evaluation</span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{res.score} / {res.maxMarks}</span>
                        <div className="text-[9px] text-slate-400">Passing threshold {50}</div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        res.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                        res.grade === 'F' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-50 text-slate-700 dark:bg-slate-800'
                      }`}>
                        Grade {res.grade}
                      </span>
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    No results have been processed yet for this session exam term.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {!student && !loading && (
        <div className="p-10 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-indigo-500 mb-2" />
          <h5 className="font-bold text-sm">No Student Roster Selected</h5>
          <p className="text-slate-400 mt-1 max-w-sm">
            Please enter your registration code folder into search bar to display attendance sheets, evaluations, and grading cards.
          </p>
        </div>
      )}

    </div>
  );
}
