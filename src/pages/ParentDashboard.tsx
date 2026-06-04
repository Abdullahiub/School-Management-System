import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../lib/api.js';
import { pdfExporter } from '../lib/pdfExporter.js';
import { Student, Attendance, StudentResult, Exam } from '../types.js';
import {
  Heart,
  CalendarCheck,
  Award,
  Download,
  Info,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  PhoneCall,
  AlertCircle
} from 'lucide-react';

export default function ParentDashboard() {
  const { user, showToast } = useApp();
  const [childRegNo, setChildRegNo] = useState(user?.linkedId || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChildRecords = async (regNo: string) => {
    if (!regNo.trim()) return;
    setLoading(true);
    try {
      const [studentsRes, attendanceRes, resultsRes, examsRes] = await Promise.all([
        api.get<Student[]>('/api/students'),
        api.get<Attendance[]>('/api/attendance'),
        api.get<StudentResult[]>('/api/results'),
        api.get<Exam[]>('/api/exams')
      ]);

      const foundChild = studentsRes.find(s => s.regNo.toLowerCase() === regNo.toLowerCase());

      if (!foundChild) {
        showToast(`Child registration ID ${regNo} could not be found.`, 'error');
        setStudent(null);
        setLoading(false);
        return;
      }

      setStudent(foundChild);
      setExams(examsRes);

      // Filter attendance
      const childAtt = attendanceRes.filter(att =>
        att.records.some(rec => rec.studentId.toLowerCase() === regNo.toLowerCase())
      );
      setAttendance(childAtt);

      // Filter results
      const childResults = resultsRes.filter(res => res.studentId.toLowerCase() === regNo.toLowerCase());
      setResults(childResults);

      showToast(`Pulled Guardian Dashboard folder for ${foundChild.fullName}.`);
    } catch {
      showToast('Error mapping student database folder.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.linkedId) {
      fetchChildRecords(user.linkedId);
    }
  }, [user]);

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChildRecords(childRegNo);
  };

  const downloadReportCard = () => {
    if (!student) return;
    pdfExporter.exportStudentReportCard(student.fullName, student.regNo, student.classId, results);
    showToast('Downloaded student report card.');
  };

  // Stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter(att =>
    att.records.some(r => r.studentId.toLowerCase() === student?.regNo.toLowerCase() && r.status === 'Present')
  ).length;
  const lateDays = attendance.filter(att =>
    att.records.some(r => r.studentId.toLowerCase() === student?.regNo.toLowerCase() && r.status === 'Late')
  ).length;

  const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 100;

  // Average Score
  const totalScoreObtained = results.reduce((sum, r) => sum + r.score, 0);
  const totalMaxScore = results.reduce((sum, r) => sum + r.maxMarks, 0);
  const averagePct = totalMaxScore > 0 ? (totalScoreObtained / totalMaxScore) * 100 : 0;

  return (
    <div id="parent-dashboard-root" className="space-y-6 animate-fade-in text-xs">

      {/* Roster Child search */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-sm text-slate-950 dark:text-slate-100 flex items-center gap-1">
            <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
            Guardian Portal & Children Synchronization
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Filter school files using your child's Registration ID folder to check academic schedules, grade sheets, and metrics.</p>
        </div>

        <form onSubmit={handleQuery} className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="e.g. STU001, STU002"
              value={childRegNo}
              onChange={e => setChildRegNo(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition"
          >
            Pull Student Files
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
          <span>Syncing student registers...</span>
        </div>
      )}

      {!loading && student && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Child Metadata Card */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-5 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <img src={student.photoUrl} alt="student" className="h-16 w-16 mb-2 rounded-full object-cover border-2 border-indigo-500 shadow" />
              <h5 className="font-bold text-sm text-slate-955 leading-none">{student.fullName}</h5>
              <span className="text-[10px] text-indigo-500 font-bold font-mono mt-1">{student.regNo}</span>
            </div>

            <div className="space-y-2 border-y py-4 border-dashed border-gray-150 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Grade Enrolled:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200 uppercase">{student.classId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Birth Calendar:</span>
                <span>{student.dob}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Postal Location:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[155px]" title={student.address}>{student.address}</span>
              </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/25 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h6 className="font-bold text-emerald-800 dark:text-emerald-400">Class Progress Summary</h6>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  Your child averages <strong>{averagePct.toFixed(0)}%</strong> across subject evaluations with a compliant {attendanceRate.toFixed(0)}% attendance rate. Keep it up!
                </p>
              </div>
            </div>
          </div>

          {/* Middle detail widgets column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 border border-gray-150 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <CalendarCheck className="h-4.5 w-4.5 mx-auto text-indigo-500" />
                <span className="text-[10px] text-slate-450 uppercase block">Roster Roll</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">{attendanceRate.toFixed(0)}%</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 border border-gray-150 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <CheckCircle className="h-4.5 w-4.5 mx-auto text-emerald-500" />
                <span className="text-[10px] text-slate-450 uppercase block">Present Days</span>
                <span className="text-base font-bold text-emerald-600">{presentDays}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 border border-gray-150 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <XCircle className="h-4.5 w-4.5 mx-auto text-rose-500" />
                <span className="text-[10px] text-slate-450 uppercase block">Absent Days</span>
                <span className="text-base font-bold text-rose-600">{attendance.length - presentDays - lateDays}</span>
              </div>
            </div>

            {/* Result grid slip list */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">Terminal Scores & Grade Slips</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Monitor and audit child's graded examination scores and average class criteria.</p>
                </div>
                <button
                  onClick={downloadReportCard}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> PDF Report Card
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {results.map(res => (
                  <div key={res.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">{res.subject}</h5>
                      <p className="text-[9px] text-slate-400">Term examinations score evaluation</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{res.score} / {res.maxMarks}</span>
                        <div className="text-[9px] text-slate-400">Pass minimum 50%</div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        res.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                        res.grade === 'F' ? 'bg-rose-50 text-rose-700' :
                        'bg-indigo-50 text-indigo-700'
                      }`}>
                        Grade {res.grade}
                      </span>
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    No results have been processed yet for this student exam.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {!student && !loading && (
        <div className="p-10 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-rose-405 mb-2" />
          <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100">No Child Record Selected</h5>
          <p className="text-slate-400 mt-1 max-w-sm">
            Please enter your child's Registration ID folder into search block to check attendance diaries, grade sheets, and progress sliders.
          </p>
        </div>
      )}

    </div>
  );
}
