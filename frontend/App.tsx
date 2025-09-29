import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ApiStatus } from './components/ApiStatus';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <ApiStatus />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;