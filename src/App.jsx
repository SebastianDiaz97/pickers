import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PickerView from './pages/PickerView';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const { session, user, loading, login, loginError, logout, isAuthenticated } =
    useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={login} loginError={loginError} />
            )
          }
        />
        <Route
          path="/"
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
