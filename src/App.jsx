/**
 * Main App Component
 * 
 * Sets up routing for the entire application.
 * Handles role-based navigation (student vs admin).
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import Results from './components/student/Results';
import AcademicPage from './components/student/AcademicPage';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';

// Common Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Landing from './components/common/Landing';
import AuthenticatedLayout from './components/common/AuthenticatedLayout';

/**
 * Dashboard Router Component
 * 
 * Automatically redirects users to the appropriate dashboard based on their role.
 */
const DashboardRouter = () => {
  const { userProfile } = useAuth();

  if (userProfile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <StudentDashboard />;
};

const App = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student Routes */}
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Results />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AuthenticatedLayout>
                <AdminDashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <DashboardRouter />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Academic Route */}
        <Route
          path="/academic"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <AcademicPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
