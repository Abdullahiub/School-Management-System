import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import Sidebar from './components/Sidebar.js';
import Header from './components/Header.js';
import ToastContainer from './components/ToastContainer.js';
import Login from './pages/Login.js';
import AdminDashboard from './pages/AdminDashboard.js';
import TeacherDashboard from './pages/TeacherDashboard.js';
import StudentDashboard from './pages/StudentDashboard.js';
import ParentDashboard from './pages/ParentDashboard.js';

function DashboardRouter() {
  const { user, isAuthenticated, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-reset activeTab to 'dashboard' when profile role switches
  useEffect(() => {
    setActiveTab('dashboard');
  }, [user?.role]);

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    );
  }

  return (
    <div id="school-app-layout" className="min-h-screen relative bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex transition-colors duration-200">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(at_top_right,rgba(99,102,241,0.06),transparent_50%),radial-gradient(at_bottom_left,rgba(99,102,241,0.04),transparent_50%)] pointer-events-none z-0" />

      {/* Role-based Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 z-10">
        {/* Unified Top Navbar */}
        <Header
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isLoading={isLoading}
        />

        {/* Primary Dashboard Mount grids */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {user?.role === 'admin' && (
            <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {user?.role === 'teacher' && (
            <TeacherDashboard />
          )}

          {user?.role === 'student' && (
            <StudentDashboard />
          )}

          {user?.role === 'parent' && (
            <ParentDashboard />
          )}
        </main>
      </div>

      {/* Toast Overlay stack */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardRouter />
    </AppProvider>
  );
}
