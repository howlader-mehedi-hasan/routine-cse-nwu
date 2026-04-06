import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import RoutineView from './components/RoutineView';
import WeekRoutineView from './components/WeekRoutineView';
import AdminPanel from './components/AdminPanel';
import ContactPage from './components/ContactPage';
import AuthPage from './components/AuthPage';
import UserManagement from './components/UserManagement';
import UserDashboard from './components/UserDashboard';
import RegistrationSettings from './components/RegistrationSettings';
import ProfileSettings from './components/ProfileSettings';
import PasswordSettings from './components/PasswordSettings';
import NameChangeSettings from './components/NameChangeSettings';
import ActivityLogs from './components/ActivityLogs';
import About from './components/About';
import BugReportPage from './components/BugReportPage';
import SettingsLayout from './components/layout/SettingsLayout';
import { ThemeProvider } from './components/ui/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { getSettings, updateSettings } from './services/api';

const ProtectedRoute = ({ children, allowedRoles, requiredPermission, requiredAnyPermission }) => {
  const { user, loading, hasPermission, hasAnyPermission } = useAuth();

  if (loading) return <div>Loading...</div>;

  // Unauthenticated -> Force login
  if (!user) return <Navigate to="/auth" replace />;

  // Check specific permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  if (requiredAnyPermission && !hasAnyPermission(requiredAnyPermission)) {
    return <Navigate to="/" replace />;
  }

  // Insufficient permissions -> Route to Home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  const [overtimeVisibility, setOvertimeVisibility] = React.useState({
    "Monday": false, "Tuesday": false, "Wednesday": false, "Thursday": false, "Friday": false, "Saturday": false
  });

  // Load initial overtime settings
  React.useEffect(() => {
    getSettings('overtime_settings').then(res => {
      if (res.data.success && res.data.data && Object.keys(res.data.data).length > 0) {
        setOvertimeVisibility(res.data.data);
      }
    }).catch(err => console.error("Failed to fetch overtime settings:", err));
  }, []);

  // Wrapper for setOvertimeVisibility to persist changes
  const handleToggleOvertime = (value) => {
    setOvertimeVisibility(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      updateSettings(next, 'overtime_settings').catch(err => 
        console.error("Failed to save overtime settings:", err)
      );
      return next;
    });
  };

  return (
    <Routes>
      <Route path="/auth" element={<DashboardLayout><AuthPage /></DashboardLayout>} />

      <Route path="/" element={<DashboardLayout><RoutineView overtimeVisibility={overtimeVisibility} setOvertimeVisibility={handleToggleOvertime} /></DashboardLayout>} />
      <Route path="/week-routine" element={<DashboardLayout fullWidth={true}><WeekRoutineView overtimeVisibility={overtimeVisibility} setOvertimeVisibility={handleToggleOvertime} /></DashboardLayout>} />
      <Route path="/contact" element={<DashboardLayout><ContactPage /></DashboardLayout>} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout><SettingsLayout><UserDashboard /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requiredAnyPermission={['manage_faculty', 'manage_courses', 'manage_rooms', 'manage_batches']}>
          <DashboardLayout><SettingsLayout><AdminPanel /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute requiredPermission="assign_permissions">
          <DashboardLayout><SettingsLayout><UserManagement /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout><SettingsLayout>&nbsp;</SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/registration-settings" element={
        <ProtectedRoute requiredAnyPermission={['assign_permissions', 'manage_faculty', 'manage_courses']}>
          <DashboardLayout><SettingsLayout><RegistrationSettings /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout><SettingsLayout><ProfileSettings /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/password" element={
        <ProtectedRoute>
          <DashboardLayout><SettingsLayout><PasswordSettings /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/name-change" element={
        <ProtectedRoute>
          <DashboardLayout><SettingsLayout><NameChangeSettings /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/activity-log" element={
        <ProtectedRoute requiredPermission="view_activity_logs">
          <DashboardLayout><SettingsLayout><ActivityLogs /></SettingsLayout></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/bug-reports" element={
        <ProtectedRoute>
          <DashboardLayout><BugReportPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/about" element={<DashboardLayout><About /></DashboardLayout>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <AppRoutes />
        </Router>
        <Toaster position="bottom-right" />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
