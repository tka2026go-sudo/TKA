import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { Question, SecuritySettings } from '../types';
import { QuestionView } from '../components/student/QuestionView';
import { QuestionPalette } from '../components/student/QuestionPalette';
import { ViolationAlertModal } from '../components/student/ViolationAlertModal';
import { Modal } from '../components/common/Modal';
import { BrandLogo } from '../components/common/BrandLogo';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bookmark,
  LogOut,
  Maximize2,
  RefreshCw,
  ShieldAlert,
  Menu,
} from 'lucide-react';

interface ExamRoomProps {
  sessionId: string;
  onFinishExam: (sessionId: string) => void;
  onExit: () => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({ sessionId, onFinishExam, onExit }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Exam and session state
  const [exam, setExam] = useState<{ id: string; title: string; durationMinutes: number; paketId: string; mataPelajaran?: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [reviewedQuestions, setReviewedQuestions] = useState<string[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);

  // Timer and server sync
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [effectiveEndTime, setEffectiveEndTime] = useState<string>('');
  const [totalPenaltySeconds, setTotalPenaltySeconds] = useState<number>(0);
  const [violationsCount, setViolationsCount] = useState<number>(0);

  // Status indicators
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'ERROR'>('SAVED');
  const [paletteDrawerOpen, setPaletteDrawerOpen] = useState<boolean>(false);

  // Finish confirmation modal
  const [finishModalOpen, setFinishModalOpen] = useState<boolean>(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Violation alert modal on return
  const [violationAlertOpen, setViolationAlertOpen] = useState<boolean>(false);
  const [latestPenaltyDeducted, setLatestPenaltyDeducted] = useState<number>(0);

  const isSubmittingRef = useRef(false);
  const lastVisibilityStateRef = useRef<DocumentVisibilityState>('visible');
  const hasLoadedRef = useRef(false);

  // 1. Initial Load Session
  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getExamSession(sessionId);

      setExam(res.exam);
      setQuestions(res.questions);
      setAnswers(res.session.answers || {});
      setReviewedQuestions(res.session.reviewedQuestions || []);
      setSecuritySettings(res.securitySettings);

      setEffectiveEndTime(res.session.effectiveEndTime);
      setRemainingSeconds(res.session.remainingSeconds);
      setTotalPenaltySeconds(res.session.totalPenaltySeconds || 0);
      setViolationsCount(res.session.violationsCount || 0);

      hasLoadedRef.current = true;

      // Check if session is already completed or timed out
      if (res.session.status === 'SUBMITTED' || res.session.status === 'TIME_OUT') {
        onFinishExam(sessionId);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat sesi ujian');
    } finally {
      setLoading(false);
    }
  }, [sessionId, onFinishExam]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // 2. Local 1-second countdown timer
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit('Waktu ujian telah berakhir');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, remainingSeconds]);

  // 3. Periodic server heartbeat sync (every 8s)
  useEffect(() => {
    if (loading || isSubmittingRef.current) return;

    const hbInterval = setInterval(async () => {
      try {
        const hb = await api.heartbeat(sessionId);
        setRemainingSeconds(hb.remainingSeconds);
        setEffectiveEndTime(hb.effectiveEndTime);
        setTotalPenaltySeconds(hb.totalPenaltySeconds);
        setViolationsCount(hb.violationsCount);

        if (hb.status === 'TIME_OUT' || hb.status === 'SUBMITTED') {
          handleAutoSubmit('Batas waktu server telah berakhir');
        }
      } catch (err) {
        // Silently tolerate temporary network drop
      }
    }, 8000);

    return () => clearInterval(hbInterval);
  }, [loading, sessionId]);

  // 4. Auto Submit Handler
  const handleAutoSubmit = async (reason?: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await api.submitExam(sessionId);
      onFinishExam(sessionId);
    } catch {
      onFinishExam(sessionId);
    }
  };

  // 5. SCREEN VISIBILITY & ANTI-CHEAT MONITORING
  useEffect(() => {
    if (!securitySettings?.monitorVisibility || !hasLoadedRef.current) return;

    const reportViolationEvent = async (type: 'visibility_hidden' | 'page_hide' | 'fullscreen_exit', desc: string) => {
      if (isSubmittingRef.current) return;
      const eventId = `viol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      try {
        const res = await api.reportViolation(sessionId, eventId, type, desc);
        if (res.success && !res.deduplicated) {
          setTotalPenaltySeconds(res.totalPenaltySeconds);
          setEffectiveEndTime(res.effectiveEndTime);
          setRemainingSeconds(res.remainingSeconds);
          setViolationsCount(res.violationsCount);

          if (res.penaltyApplied > 0) {
            setLatestPenaltyDeducted(res.penaltyApplied);
            if (securitySettings.alertOnReturn) {
              setViolationAlertOpen(true);
            }
          }

          if (res.status === 'TIME_OUT' || res.remainingSeconds <= 0) {
            handleAutoSubmit('Waktu habis karena penalti pelanggaran');
          }
        }
      } catch (err) {
        console.warn('Failed to send violation telemetry:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastVisibilityStateRef.current = 'hidden';
        reportViolationEvent('visibility_hidden', 'Berpindah tab atau meminimalkan browser ujian');
      } else if (document.visibilityState === 'visible' && lastVisibilityStateRef.current === 'hidden') {
        lastVisibilityStateRef.current = 'visible';
        // Tab is visible again, sync heartbeat immediately
        api.heartbeat(sessionId).then((hb) => {
          setRemainingSeconds(hb.remainingSeconds);
          setEffectiveEndTime(hb.effectiveEndTime);
          setTotalPenaltySeconds(hb.totalPenaltySeconds);
          setViolationsCount(hb.violationsCount);
        }).catch(() => {});
      }
    };

    const handlePageHide = () => {
      reportViolationEvent('page_hide', 'Meninggalkan halaman ujian (pagehide)');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Exited fullscreen
        reportViolationEvent('fullscreen_exit', 'Keluar dari mode layar penuh ujian');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [securitySettings, sessionId]);

  // Request fullscreen trigger for user
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 6. Handle Answer Change & Autosave
  const handleAnswerChange = async (newAnswer: any) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    // Optimistic local update
    const updatedAnswers = {
      ...answers,
      [currentQ.idSoal]: newAnswer,
    };
    setAnswers(updatedAnswers);
    setSaveStatus('SAVING');

    try {
      await api.saveAnswer(sessionId, currentQ.idSoal, newAnswer);
      setSaveStatus('SAVED');
    } catch (err) {
      setSaveStatus('ERROR');
      // Retry once after 2 seconds
      setTimeout(async () => {
        try {
          await api.saveAnswer(sessionId, currentQ.idSoal, newAnswer);
          setSaveStatus('SAVED');
        } catch {
          setSaveStatus('ERROR');
        }
      }, 2000);
    }
  };

  // 7. Toggle Question Review Mark
  const handleToggleReview = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const exists = reviewedQuestions.includes(currentQ.idSoal);
    const updated = exists
      ? reviewedQuestions.filter(id => id !== currentQ.idSoal)
      : [...reviewedQuestions, currentQ.idSoal];
    setReviewedQuestions(updated);

    try {
      await api.toggleReview(sessionId, currentQ.idSoal);
    } catch {
      // ignore
    }
  };

  // 8. Manual Submit by Student
  const handleSubmitExam = async () => {
    if (isSubmittingRef.current) return;
    try {
      setSubmitting(true);
      isSubmittingRef.current = true;
      await api.submitExam(sessionId);
      setFinishModalOpen(false);
      onFinishExam(sessionId);
    } catch (err: any) {
      setError(err.message || 'Gagal menyerahkan ujian');
      isSubmittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  // Format Timer mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Menyiapkan Lembar Ujian TKA...</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-6 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Gagal Membuka Ujian</h3>
          <p className="text-xs text-slate-600">{error}</p>
          <button
            onClick={onExit}
            className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Kembali ke Portal
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isTimeCritical = remainingSeconds < 300; // < 5 minutes
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* CBT Fixed Header with Glassmorphism */}
      <header className="sticky top-0 z-30 glass-header shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo, Exam Info & Question Counter */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <BrandLogo size="sm" className="shadow-xs shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50/80 border border-blue-200/80 px-2 py-0.5 rounded-md">
                  Paket {exam?.paketId || 'A'}
                </span>
                {exam?.mataPelajaran && (
                  <span className="text-[10px] sm:text-xs font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 px-2 py-0.5 rounded-md truncate max-w-[120px] sm:max-w-none">
                    {exam.mataPelajaran}
                  </span>
                )}
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {exam?.title}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 mt-0.5">
                <span>Soal {currentIndex + 1}/{questions.length}</span>
                {currentQuestion?.elemen && (
                  <>
                    <span>·</span>
                    <span className="hidden sm:inline font-medium text-slate-600">{currentQuestion.elemen}</span>
                  </>
                )}
                <span>·</span>
                <span>
                  {saveStatus === 'SAVED' && (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium" title="Jawaban tersimpan di server">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span className="hidden sm:inline">Tersimpan</span>
                    </span>
                  )}
                  {saveStatus === 'SAVING' && (
                    <span className="text-amber-700 flex items-center gap-1 animate-pulse" title="Sedang menyimpan ke server">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      <span className="hidden sm:inline">Menyimpan...</span>
                    </span>
                  )}
                  {saveStatus === 'ERROR' && (
                    <span className="text-red-700 flex items-center gap-1 font-medium" title="Koneksi terganggu, mencoba simpan ulang">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      <span className="hidden sm:inline">Offline / Menyimpan Ulang</span>
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Timer, Fullscreen, Finish Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Countdown Timer Display */}
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm transition-colors shadow-2xs backdrop-blur-md ${
                isTimeCritical
                  ? 'bg-red-50/90 border-red-300 text-red-700 animate-pulse'
                  : 'bg-white/80 border-slate-200/90 text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setPaletteDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200/90 bg-white/70 backdrop-blur-md text-slate-700 hover:bg-white transition-colors"
              title="Daftar Soal"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Fullscreen button (desktop & supported mobile) */}
            <button
              onClick={handleToggleFullscreen}
              className="hidden sm:flex p-2 rounded-xl border border-slate-200/90 bg-white/70 backdrop-blur-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Layar Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Finish Exam Button */}
            <button
              onClick={() => {
                setConfirmCheckbox(false);
                setFinishModalOpen(true);
              }}
              className="min-h-[36px] px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-95 flex items-center gap-1.5 border border-white/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Akhiri Ujian</span>
              <span className="sm:hidden">Selesai</span>
            </button>
          </div>
        </div>

        {/* Penalty bar (if student has penalties) */}
        {totalPenaltySeconds > 0 && (
          <div className="bg-amber-500/10 border-t border-amber-200 px-4 py-1 text-[11px] text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              Tercatat {violationsCount} kali pelanggaran layar
            </span>
            <span className="font-semibold text-red-700">
              Total Penalti: -{totalPenaltySeconds} Detik
            </span>
          </div>
        )}
      </header>

      {/* Main Exam Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Column with Glassmorphic Elevation */}
          <div className="lg:col-span-8 glass-panel-elevated rounded-3xl p-4 sm:p-7 shadow-lg shadow-slate-900/5">
            {currentQuestion ? (
              <QuestionView
                question={currentQuestion}
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                currentAnswer={answers[currentQuestion.idSoal]}
                isMarkedForReview={reviewedQuestions.includes(currentQuestion.idSoal)}
                onAnswerChange={handleAnswerChange}
                onToggleReview={handleToggleReview}
                onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                onNext={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                onOpenPalette={() => setPaletteDrawerOpen(true)}
              />
            ) : (
              <div className="p-8 text-center text-slate-500">Soal tidak ditemukan.</div>
            )}
          </div>

          {/* Desktop Right Column: Question Palette */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24">
              <QuestionPalette
                questions={questions}
                currentIndex={currentIndex}
                answers={answers}
                reviewedQuestions={reviewedQuestions}
                onSelectIndex={(idx) => setCurrentIndex(idx)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Drawer for Question Palette */}
      {paletteDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm lg:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setPaletteDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl z-10 flex flex-col p-4 animate-in slide-in-from-right duration-200">
            <QuestionPalette
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              reviewedQuestions={reviewedQuestions}
              onSelectIndex={(idx) => setCurrentIndex(idx)}
              onClose={() => setPaletteDrawerOpen(false)}
              isDrawer={true}
            />
          </div>
        </div>
      )}

      {/* Violation Alert Modal */}
      <ViolationAlertModal
        isOpen={violationAlertOpen}
        penaltySeconds={latestPenaltyDeducted}
        totalPenaltySeconds={totalPenaltySeconds}
        remainingSeconds={remainingSeconds}
        onClose={() => setViolationAlertOpen(false)}
      />

      {/* End Exam Confirmation Modal */}
      <Modal
        isOpen={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        title="Konfirmasi Pengumpulan Ujian"
        description="Periksa kembali ringkasan jawaban Anda sebelum mengirim."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="text-xl font-bold text-blue-700 font-mono">{answeredCount}</div>
              <div className="text-[11px] text-blue-900 font-medium">Terjawab</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="text-xl font-bold text-amber-700 font-mono">{reviewedQuestions.length}</div>
              <div className="text-[11px] text-amber-900 font-medium">Ragu-ragu</div>
            </div>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="text-xl font-bold text-slate-700 font-mono">{unansweredCount}</div>
              <div className="text-[11px] text-slate-600 font-medium">Belum Dijawab</div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Masih terdapat <strong>{unansweredCount} soal</strong> yang belum Anda jawab. Anda masih memiliki sisa waktu <strong>{formatTimer(remainingSeconds)}</strong>.
              </span>
            </div>
          )}

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmCheckbox}
              onChange={(e) => setConfirmCheckbox(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs text-slate-700 font-medium leading-snug">
              Saya yakin ingin menyelesaikan ujian dan mengirim seluruh jawaban ke server sekarang. Jawaban tidak dapat diubah setelah dikirim.
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFinishModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Kembali Mengerjakan
            </button>
            <button
              type="button"
              disabled={!confirmCheckbox || submitting}
              onClick={handleSubmitExam}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                confirmCheckbox && !submitting
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Mengirim Jawaban...' : 'Kirim Jawaban Sekarang'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
