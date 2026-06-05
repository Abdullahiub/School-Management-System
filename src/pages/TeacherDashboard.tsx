import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../lib/api.js';
import { pdfExporter } from '../lib/pdfExporter.js';
import { Student, Exam, StudentResult, SchoolClass, AttendanceRecord } from '../types.js';
import {
  Notebook,
  CalendarCheck,
  Search,
  CheckCircle,
  Download,
  Award,
  Users,
  Building,
  Activity,
  UserCheck,
  Eye,
  Loader2,
  X
} from 'lucide-react';

interface TeacherDashboardProps {
  activeTab: string;
}

export default function TeacherDashboard({ activeTab }: TeacherDashboardProps) {
  const { user, showToast } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Focus Advisor Class variables
  const [myClass, setMyClass] = useState<SchoolClass | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStudents, setAttendanceStudents] = useState<AttendanceRecord[]>([]);

  // Results grading states
  const [activeGradingExam, setActiveGradingExam] = useState('');
  const [gradingScores, setGradingScores] = useState<{ [studentId: string]: number }>({});

  const [peekStudent, setPeekStudent] = useState<Student | null>(null);
  const isDashboardTab = activeTab === 'dashboard';
  const isStudentsTab = activeTab === 'students';
  const isAttendanceTab = activeTab === 'attendance';
  const isResultsTab = activeTab === 'results';

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [studentsRes, classesRes, examsRes, resultsRes] = await Promise.all([
        api.get<Student[]>('/api/students'),
        api.get<SchoolClass[]>('/api/classes'),
        api.get<Exam[]>('/api/exams'),
        api.get<StudentResult[]>('/api/results')
      ]);

      setStudents(studentsRes);
      setClasses(classesRes);
      setExams(examsRes);
      setResults(resultsRes);

      // Find which class belongs to current teacher user (staffId is linkedId)
      const adviserClass = classesRes.find(c => c.teacherId === user.linkedId);
      if (adviserClass) {
        setMyClass(adviserClass);
      } else {
        // Fallback or assign first mapped class
        const fallback = classesRes.find(c => c.teacherId === 'TCH101') || classesRes[0];
        setMyClass(fallback || null);
      }

      const activeEx = examsRes.find(e => e.classId === (adviserClass?.id || classesRes[0]?.id));
      if (activeEx) {
        setActiveGradingExam(activeEx.id);
      }
    } catch {
      showToast('Error syncing educator dashboard matrices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Load attendance rolls
  useEffect(() => {
    if (!myClass) return;
    const classRoster = students.filter(s => s.classId === myClass.id);

    const checkExistingAttendance = async () => {
      try {
        const attList = await api.get<any[]>(`/api/attendance?date=${attendanceDate}&classId=${myClass.id}`);
        if (attList.length > 0 && attList[0].records) {
          setAttendanceStudents(
            attList[0].records.map((r: any) => ({
              studentId: r.studentId,
              name: r.name,
              status: r.status
            }))
          );
        } else {
          setAttendanceStudents(
            classRoster.map(s => ({
              studentId: s.regNo,
              name: s.fullName,
              status: 'Present'
            }))
          );
        }
      } catch {
        setAttendanceStudents(
          classRoster.map(s => ({
            studentId: s.regNo,
            name: s.fullName,
            status: 'Present'
          }))
        );
      }
    };

    checkExistingAttendance();
  }, [myClass, attendanceDate, students]);

  // Load results grading
  useEffect(() => {
    if (!activeGradingExam) return;
    const ex = exams.find(e => e.id === activeGradingExam);
    if (!ex) return;

    const roster = students.filter(s => s.classId === ex.classId);
    const scoresMap: { [key: string]: number } = {};

    results.forEach(res => {
      if (res.examId === activeGradingExam) {
        scoresMap[res.studentId] = res.score;
      }
    });

    roster.forEach(s => {
      if (scoresMap[s.regNo] === undefined) {
        scoresMap[s.regNo] = 0;
      }
    });

    setGradingScores(scoresMap);
  }, [activeGradingExam, results, exams, students]);

  const saveTodayAttendance = async () => {
    if (!myClass) return;
    try {
      await api.post('/api/attendance', {
        date: attendanceDate,
        classId: myClass.id,
        records: attendanceStudents.map(as => ({
          studentId: as.studentId,
          name: as.name,
          status: as.status
        }))
      });
      showToast('Daily Attendance record committed securely.');
      fetchData();
    } catch {
      showToast('Failed to save marked list.', 'error');
    }
  };

  const saveExamGrades = async () => {
    try {
      const promises = Object.entries(gradingScores).map(([studentId, score]) => {
        return api.post('/api/results', {
          examId: activeGradingExam,
          studentId,
          score
        });
      });
      await Promise.all(promises);
      showToast('Student examination outcomes compiled and graded.');
      fetchData();
    } catch {
      showToast('Failed to save graded database rows.', 'error');
    }
  };

  // Printable exporters
  const downloadClassListPDF = () => {
    if (!myClass) return;
    const roster = students.filter(s => s.classId === myClass.id);
    pdfExporter.exportStudentReport(roster, myClass.name);
  };

  const downloadDailyAttendancePDF = () => {
    if (!myClass) return;
    pdfExporter.exportAttendanceReport(attendanceDate, myClass.name, attendanceStudents);
  };

  const filterStudents = students.filter(s => {
    if (!myClass) return false;
    const matchesQuery = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.regNo.toLowerCase().includes(searchQuery.toLowerCase());
    return s.classId === myClass.id && matchesQuery;
  });

  if (loading || !myClass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 gap-2">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span>Loading Teacher Dashboard Assets...</span>
      </div>
    );
  }

  return (
    <div id="teacher-dashboard-root" className="space-y-8 animate-fade-in text-xs">

      {/* Hero Welcome banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-slate-100">Advisor Portal Summary</h3>
          <p className="text-slate-400 text-xs">
            You are currently teaching <strong>{myClass.name}</strong> out of room <strong>{myClass.room}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadClassListPDF}
            className="px-4 py-2 hover:bg-slate-800 text-slate-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-800"
          >
            <Download className="h-3.5 w-3.5" /> Course Roster PDF
          </button>
        </div>
      </div>

      {/* Split Roster grid and Roll checker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {(isDashboardTab || isStudentsTab) && (
          <div className={`bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between ${isStudentsTab ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">Classroom Roster ({filterStudents.length})</h4>
                <p className="text-[10px] text-slate-400 font-semibold">{myClass.name}</p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Roster search by name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {filterStudents.map(s => (
                  <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-between border border-gray-100/50 dark:border-slate-800/40">
                    <div className="flex items-center gap-3">
                      <img src={s.photoUrl} alt="Photo" className="h-8 w-8 rounded-full object-cover shadow-sm" />
                      <div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-200">{s.fullName}</h5>
                        <span className="text-[10px] font-mono font-semibold text-slate-400">{s.regNo}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPeekStudent(s)}
                      className="p-1 px-2 border hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-indigo-600 transition"
                    >
                      View Card
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 text-[10px] text-slate-400 select-none">
              Roster updates are synced dynamically with the Academic Office.
            </div>
          </div>
        )}

        {(isDashboardTab || isAttendanceTab) && (
          <div className={`bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm ${isAttendanceTab ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-950 dark:text-slate-100">Daily Register Tracker</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Check and mark daily present/absent student records</p>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="px-2 py-1.5 border rounded-xl bg-slate-50 dark:bg-slate-800 max-w-[130px]"
                />
                <button
                  onClick={downloadDailyAttendancePDF}
                  title="Print Roll sheet PDF"
                  className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-350 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {attendanceStudents.map((as, index) => (
                <div key={as.studentId} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-between">
                  <div className="font-medium">
                    <span className="text-slate-400 font-mono mr-2">{index + 1}.</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{as.name}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceStudents(prev =>
                          prev.map(p => (p.studentId === as.studentId ? { ...p, status: 'Present' } : p))
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        as.status === 'Present' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceStudents(prev =>
                          prev.map(p => (p.studentId === as.studentId ? { ...p, status: 'Absent' } : p))
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        as.status === 'Absent' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceStudents(prev =>
                          prev.map(p => (p.studentId === as.studentId ? { ...p, status: 'Late' } : p))
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        as.status === 'Late' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveTodayAttendance}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4 cursor-pointer"
            >
              Save Classroom Daily Attendance Roll
            </button>
          </div>
        )}
      </div>

      {(isDashboardTab || isResultsTab) && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-950 dark:text-slate-100">Student Examination Outcomes</h4>
              <p className="text-[10px] text-slate-400">Process, score and auto-grade subject course examinations</p>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-64">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Select Active Evaluation</span>
              <select
                value={activeGradingExam}
                onChange={e => setActiveGradingExam(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold outline-none focus:ring-1"
              >
                {exams.filter(e => e.classId === myClass.id).map(e => (
                  <option key={e.id} value={e.id}>{e.subject}</option>
                ))}
              </select>
            </div>
          </div>

          {activeGradingExam ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-850 p-4 border rounded-3xl text-slate-700 dark:text-slate-300 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.filter(s => s.classId === myClass.id).map(s => {
                    const currentScore = gradingScores[s.regNo] || 0;
                    const percent = currentScore;
                    const grade = percent >= 90 ? 'A' : percent >= 80 ? 'B' : percent >= 70 ? 'C' : percent >= 60 ? 'D' : 'F';

                    return (
                      <div key={s.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{s.fullName}</h5>
                            <span className="text-[9px] font-mono font-semibold text-slate-400">{s.regNo}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                            grade === 'F' ? 'bg-rose-50 text-rose-700' :
                            'bg-indigo-50 text-indigo-700'
                          }`}>
                            Grade {grade}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span>Enter Score Marks:</span>
                            <span className="font-bold text-indigo-600">{currentScore} / 100</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={currentScore}
                            onChange={e => {
                              setGradingScores(prev => ({ ...prev, [s.regNo]: Number(e.target.value) }));
                            }}
                            className="w-full accent-indigo-600 h-1 rounded"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={saveExamGrades}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition"
              >
                Committed Exam Results Sheet
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              No examinations drafted for your assigned Grade Level. Contact Office to set dates.
            </div>
          )}
        </div>
      )}

      {/* Roster detail peek */}
      {peekStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-xl flex flex-col items-center">
            <button onClick={() => setPeekStudent(null)} className="p-1 border rounded-lg self-end mb-2 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            <img src={peekStudent.photoUrl} alt="Photo" referrerPolicy="no-referrer" className="h-20 w-20 rounded-full object-cover border mb-3 shadow" />
            <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100">{peekStudent.fullName}</h4>
            <span className="text-[10px] font-mono text-indigo-500 font-bold">{peekStudent.regNo}</span>

            <div className="w-full space-y-1.5 text-left text-xs bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-dashed mt-4">
              <div><strong>Guardian / Mother:</strong> {peekStudent.parentName}</div>
              <div><strong>Contact Phone:</strong> {peekStudent.parentPhone}</div>
              <div><strong>Core Address:</strong> {peekStudent.address}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
