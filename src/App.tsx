import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Quiz from './pages/Quiz';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Navbar from './components/Navbar';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  // Only block on initial load, not subsequent transitions if user is already known
  if (loading && !user) return <div className="min-h-screen flex items-center justify-center text-white font-black tracking-widest animate-pulse">PREP...</div>;
  if (!user && !loading) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col text-slate-200 selection:bg-teal-500/30">
          <Navbar />
          <main className="flex-1 flex flex-col min-h-0 transition-opacity duration-300">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/interview/:id" element={<PrivateRoute><Interview /></PrivateRoute>} />
              <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
