import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PickerView from './pages/PickerView';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';

export default function App() {
  const { user, loading, login, loginError, logout, isAuthenticated } =
    useAuth();

  return (
    <BrowserRouter>
      <InstallPrompt />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/coordinacion" replace />
            ) : (
              <Login onLogin={login} loginError={loginError} />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to="/coordinacion" replace />}
        />
        <Route
          path="/coordinacion"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              loading={loading}
            >
              <Dashboard user={user} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/picker"
          element={<PickerView />}
        />
        <Route path="*" element={<Navigate to="/coordinacion" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
