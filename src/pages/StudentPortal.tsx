import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ExamSchedule } from '../types';
import { Header } from '../components/common/Header';
import { Modal } from '../components/common/Modal';
import {
  BookOpen,
  Clock,
  HelpCircle,
  ShieldAlert,
  Play,
  RotateCcw,
  Award,
  Key,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface StudentPortalProps {
  onStartExam: (sessionId: string) => void;
  onViewResult: (sessionId: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ onStartExam, onViewResult }) => {
  const { user, refreshUser } = useAuth();
  const [exams, setExams] = useState<(ExamSchedule & { questionsCount: number; session: any })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pre-exam instruction modal
  const [selectedExam, setSelectedExam] = useState<ExamSchedule | null>(null);
  const [agreeRules, setAgreeRules] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);

  // Profile / change password modal
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getStudentExams();
      setExams(res.exams);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat jadwal ujian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleStartExamConfirm = async () => {
    if (!selectedExam) return;
    try {
      setStarting(true);
      const res = await api.startExam(selectedExam.id);
      setSelectedExam(null);
      onStartExam(res.sessionId);
    } catch (err: any) {
      setError(err.message || 'Gagal memulai ujian');
    } finally {
      setStarting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);
    try {
      await api.changePassword(currentPass, newPass);
      setPassSuccess('Password berhasil diubah!');
      setCurrentPass('');
      setNewPass('');
      refreshUser();
    } catch (err: any) {
      setPassError(err.message || 'Gagal mengubah password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="PORTAL CBT MURID"
        subtitle="Sistem Tes Kemampuan Akademik (TKA) SMP"
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Student Welcome Banner with Glassmorphic Gradient */}
        <div className="glass-card-dark rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/20">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium tracking-wide">
              <span>Semester Genap · Persiapan TKA SMP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Datang, {user?.name}
            </h2>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-blue-100/90 flex-wrap">
              <span>NISN: <span className="font-mono font-bold text-white">{user?.nisn}</span></span>
              <span>·</span>
              <span>Kelas: <span className="font-semibold text-white">{user?.kelas}</span></span>
              <span>·</span>
              <span>Status: <span className="text-emerald-300 font-semibold">Aktif Mengikuti Ujian</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-xs active:scale-98"
            >
              <Key className="w-4 h-4" />
              <span>Ganti Password</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50/90 backdrop-blur-md border border-red-200 rounded-2xl text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Terjadi Kesalahan</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={fetchExams} className="text-xs font-semibold text-red-700 underline hover:no-underline">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Exams List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Daftar Paket Try Out Tersedia
              </h3>
              <p className="text-xs text-slate-500">
                Pilih paket ujian yang ditugaskan untuk kelas Anda
              </p>
            </div>
            <button
              onClick={fetchExams}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/80 hover:bg-white transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-panel rounded-3xl p-6 animate-pulse space-y-4">
                  <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Belum Ada Ujian Terjadwal</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Saat ini belum ada paket try out yang dibuka untuk kelas Anda. Silakan hubungi proktor atau administrator sekolah.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam) => {
                const session = exam.session;
                const isCompleted = session && (session.status === 'SUBMITTED' || session.status === 'TIME_OUT');
                const isInProgress = session && session.status === 'IN_PROGRESS';

                return (
                  <div
                    key={exam.id}
                    className="glass-panel rounded-3xl hover:border-blue-300 shadow-md hover:shadow-xl transition-all p-5 sm:p-6 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/80 border border-blue-200/80 px-2.5 py-1 rounded-xl">
                            Paket {exam.paketId}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 px-2.5 py-1 rounded-xl">
                            {exam.mataPelajaran || 'Matematika'}
                          </span>
                        </div>

                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl backdrop-blur-md ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInProgress
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100/80 text-slate-600 border border-slate-200/60'
                        }`}>
                          {isCompleted ? 'Selesai' : isInProgress ? 'Sedang Dikerjakan' : 'Siap Dikerjakan'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {exam.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {exam.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5" /> Durasi
                          </span>
                          <span className="font-semibold text-slate-800">{exam.durationMinutes} Menit</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <HelpCircle className="w-3.5 h-3.5" /> Jumlah Soal
                          </span>
                          <span className="font-semibold text-slate-800">{exam.questionsCount} Butir</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5" /> Periode
                          </span>
                          <span className="text-slate-800">{exam.startTime} – {exam.endTime} WIB</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-3 border-t border-slate-100">
                      {isCompleted ? (
                        <div className="space-y-2">
                          {exam.publishScores && session.hasScore ? (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-800">Skor Akhir:</span>
                              <span className="text-sm font-bold text-emerald-700 font-mono">
                                {session.totalScore} ({session.percentage}%)
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                              Jawaban telah tersimpan di server
                            </div>
                          )}

                          <button
                            onClick={() => onViewResult(session.id)}
                            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                          >
                            <Award className="w-4 h-4" />
                            <span>Lihat Hasil & Pembahasan</span>
                          </button>
                        </div>
                      ) : isInProgress ? (
                        <button
                          onClick={() => onStartExam(session.id)}
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                        >
                          <Play className="w-4 h-4" />
                          <span>Lanjutkan Pengerjaan</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedExam(exam);
                            setAgreeRules(false);
                          }}
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                        >
                          <Play className="w-4 h-4" />
                          <span>Mulai Ujian</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Pre-Exam Rules Modal */}
      <Modal
        isOpen={!!selectedExam}
        onClose={() => setSelectedExam(null)}
        title={selectedExam ? `Petunjuk Pengerjaan — Paket ${selectedExam.paketId}` : ''}
        description="Harap baca dan pahami tata tertib berikut sebelum memulai ujian."
        maxWidth="lg"
      >
        {selectedExam && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs sm:text-sm text-blue-950">
              <div className="font-bold text-blue-900">Peraturan & Ketentuan Integritas CBT TKA:</div>
              <ul className="list-disc pl-5 space-y-1.5 text-blue-900/90 text-xs sm:text-sm">
                <li>Durasi pengerjaan adalah <strong>{selectedExam.durationMinutes} menit</strong> terhitung sejak tombol mulai ditekan.</li>
                <li>Waktu ujian dikontrol oleh <strong>server</strong> secara akurat dan tidak dapat dimanipulasi dengan mengubah jam perangkat.</li>
                <li><strong>SISTEM PEMANTAUAN LAYAR AKTIF:</strong> Dilarang keras berpindah tab, meminimalkan browser, atau membuka aplikasi lain saat ujian.</li>
                <li>Setiap kali Anda meninggalkan layar ujian, sistem server akan melakukan <strong>pengurangan waktu penalti secara otomatis (60 detik per pelanggaran)</strong> dan dicatat ke log proktor.</li>
                <li>Jawaban tersimpan secara otomatis setiap kali Anda memilih opsi.</li>
              </ul>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Pastikan daya baterai perangkat Anda mencukupi dan koneksi internet stabil sebelum menekan tombol mulai.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeRules}
                onChange={(e) => setAgreeRules(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                Saya telah membaca, memahami, dan menyetujui seluruh tata tertib serta konsekuensi pengurangan waktu jika meninggalkan layar ujian.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedExam(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!agreeRules || starting}
                onClick={handleStartExamConfirm}
                className={`min-h-[44px] px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  agreeRules && !starting
                    ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {starting ? (
                  <span>Menyiapkan Sesi...</span>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Mulai Kerjakan Ujian Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Profile & Change Password Modal */}
      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Profil Murid & Pengaturan Akun"
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Nama Lengkap</span>
              <span className="font-semibold text-slate-900">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">NISN</span>
              <span className="font-mono font-semibold text-slate-900">{user?.nisn}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Kelas</span>
              <span className="font-semibold text-slate-900">{user?.kelas}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Nomor Induk / NIPD</span>
              <span className="font-mono text-slate-900">{user?.nomorInduk || '-'}</span>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ganti Password Akun
            </h4>

            {passError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Password Saat Ini (Nomor Induk awal)
              </label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Masukkan password lama"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[42px] py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Simpan Password Baru
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
