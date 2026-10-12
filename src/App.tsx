import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { StudentPortal } from './pages/StudentPortal';
import { ExamRoom } from './pages/ExamRoom';
import { ExamResultPage } from './pages/ExamResultPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CinematicIntro } from './components/common/CinematicIntro';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [activeExamSessionId, setActiveExamSessionId] = useState<string | null>(null);
  const [viewResultSessionId, setViewResultSessionId] = useState<string | null>(null);

  // Cinematic 5-Second Intro Loading
  if (showIntro) {
    return (
      <CinematicIntro
        durationSeconds={5}
        onComplete={() => setShowIntro(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Menyiapkan Lingkungan Ujian CBT...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Admin Role
  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Student Role Views
  if (activeExamSessionId) {
    return (
      <ExamRoom
        sessionId={activeExamSessionId}
        onFinishExam={(sessionId) => {
          setActiveExamSessionId(null);
          setViewResultSessionId(sessionId);
        }}
        onExit={() => setActiveExamSessionId(null)}
      />
    );
  }

  if (viewResultSessionId) {
    return (
      <ExamResultPage
        sessionId={viewResultSessionId}
        onBack={() => setViewResultSessionId(null)}
      />
    );
  }

  return (
    <StudentPortal
      onStartExam={(sessionId) => setActiveExamSessionId(sessionId)}
      onViewResult={(sessionId) => setViewResultSessionId(sessionId)}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
