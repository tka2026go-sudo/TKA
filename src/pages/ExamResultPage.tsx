import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Header } from '../components/common/Header';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';

interface ExamResultPageProps {
  sessionId: string;
  onBack: () => void;
}

export const ExamResultPage: React.FC<ExamResultPageProps> = ({ sessionId, onBack }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getExamResult(sessionId);
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat hasil ujian');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [sessionId]);

  const toggleExpand = (qId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Memuat Hasil Evaluasi Ujian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="HASIL UJIAN TKA SMP"
        subtitle="Laporan Penilaian & Pembahasan Soal"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Ujian</span>
        </button>

        {error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-3">
            <XCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Gagal Memuat Hasil</h3>
            <p className="text-xs text-slate-600">{error}</p>
          </div>
        ) : !result?.published ? (
          /* When results are not yet published by admin */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Ujian Berhasil Diserahkan
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Jawaban Anda telah tersimpan dengan aman pada server.
              {result?.message || 'Nilai dan pembahasan soal akan dipublikasikan oleh pihak sekolah sesuai jadwal pengumuman.'}
            </p>
            <div className="pt-2 text-xs text-slate-400">
              Waktu Pengiriman: {result?.submittedAt ? new Date(result.submittedAt).toLocaleString('id-ID') : '-'}
            </div>
          </div>
        ) : (
          /* Full Published Result */
          <div className="space-y-6">
            {/* Score Summary Card with Glassmorphic Elevation */}
            <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 border border-white/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60">
                      Hasil Resmi Evaluasi TKA
                    </span>
                    {result.mataPelajaran && (
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50/90 px-2.5 py-1 rounded-lg border border-indigo-200/80">
                        {result.mataPelajaran}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                    {result.examTitle}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1">
                    Peserta: <strong className="text-slate-800">{result.studentName}</strong> ({result.studentClass})
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <div className="text-4xl sm:text-5xl font-extrabold text-blue-700 font-mono tracking-tight">
                    {result.score?.percentage}%
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    Skor: {result.score?.totalScore} / {result.score?.maxScore}
                  </div>
                </div>
              </div>

              {/* Stat Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-center">
                <div className="p-3.5 bg-emerald-50/80 backdrop-blur-md border border-emerald-200/80 rounded-2xl shadow-2xs">
                  <div className="text-xl font-bold text-emerald-700 font-mono">
                    {result.score?.correctCount}
                  </div>
                  <div className="text-xs text-emerald-900 font-medium">Jawaban Tepat</div>
                </div>

                <div className="p-3.5 bg-red-50/80 backdrop-blur-md border border-red-200/80 rounded-2xl shadow-2xs">
                  <div className="text-xl font-bold text-red-700 font-mono">
                    {result.score?.incorrectCount}
                  </div>
                  <div className="text-xs text-red-900 font-medium">Kurang Tepat</div>
                </div>

                <div className="p-3.5 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xs">
                  <div className="text-xl font-bold text-slate-700 font-mono">
                    {result.violationsCount || 0}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">Pelanggaran Layar</div>
                </div>

                <div className="p-3.5 bg-amber-50/80 backdrop-blur-md border border-amber-200/80 rounded-2xl shadow-2xs">
                  <div className="text-xl font-bold text-amber-800 font-mono">
                    {result.totalPenaltySeconds || 0}s
                  </div>
                  <div className="text-xs text-amber-900 font-medium">Waktu Dipotong</div>
                </div>
              </div>
            </div>

            {/* Questions Breakdown and Explanations */}
            {result.publishKeys && result.score?.breakdown && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Pembahasan & Evaluasi Tiap Soal
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pelajari penjelasan kunci jawaban untuk persiapan akademik Anda
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.score.breakdown.map((item: any, idx: number) => {
                    const isExpanded = !!expandedQuestions[item.questionId];
                    return (
                      <div
                        key={item.questionId}
                        className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                          item.isCorrect ? 'border-slate-200' : 'border-red-200'
                        }`}
                      >
                        {/* Header bar */}
                        <div
                          onClick={() => toggleExpand(item.questionId)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                item.isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-slate-800">
                                Soal {idx + 1} ({item.questionId})
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {item.soal}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                                item.isCorrect
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              Skor: {item.earnedScore} / {item.maxScore}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs sm:text-sm">
                            {item.stimulus && (
                              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                                {item.stimulusJudul && (
                                  <div className="font-bold text-xs text-blue-700 mb-1">
                                    {item.stimulusJudul}
                                  </div>
                                )}
                                <p className="whitespace-pre-line text-xs sm:text-sm">{item.stimulus}</p>
                              </div>
                            )}

                            <div>
                              <div className="font-semibold text-slate-900 mb-1">Pertanyaan:</div>
                              <p className="text-slate-800 leading-relaxed">{item.soal}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="p-3 rounded-xl bg-white border border-slate-200">
                                <span className="text-xs text-slate-500 font-semibold block mb-1">
                                  Jawaban Anda:
                                </span>
                                <span className="font-mono text-xs font-bold text-slate-800">
                                  {item.studentAnswer !== null
                                    ? JSON.stringify(item.studentAnswer)
                                    : '(Tidak dijawab)'}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                                <span className="text-xs text-blue-700 font-semibold block mb-1">
                                  Kunci Jawaban Sah:
                                </span>
                                <span className="font-mono text-xs font-bold text-blue-950">
                                  {JSON.stringify(item.correctAnswer)}
                                </span>
                              </div>
                            </div>

                            {item.pembahasan && (
                              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
                                <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                                  <BookOpen className="w-3.5 h-3.5" /> Pembahasan Lengkap:
                                </div>
                                <p className="leading-relaxed text-xs sm:text-sm text-emerald-900/90 whitespace-pre-line">
                                  {item.pembahasan}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
