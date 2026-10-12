import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ExamSchedule } from '../../types';
import { Modal } from '../common/Modal';
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Eye,
  Activity
} from 'lucide-react';

interface MonitoringTabProps {
  schedules: ExamSchedule[];
}

export const MonitoringTab: React.FC<MonitoringTabProps> = ({ schedules }) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(schedules[0]?.id || '');
  const [participants, setParticipants] = useState<any[]>([]);
  const [questionsCount, setQuestionsCount] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Violation modal
  const [selectedViolations, setSelectedViolations] = useState<{ studentName: string; list: any[] } | null>(null);

  const fetchMonitoring = async () => {
    if (!selectedExamId) return;
    try {
      setError(null);
      const res = await api.getAdminMonitoring(selectedExamId);
      setParticipants(res.participants);
      setQuestionsCount(res.questionsCount);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMonitoring();
  }, [selectedExamId]);

  // Auto-refresh interval (5s)
  useEffect(() => {
    if (!autoRefresh || !selectedExamId) return;
    const interval = setInterval(() => {
      fetchMonitoring();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedExamId]);

  const handleForceSubmit = async (sessionId: string, studentName: string) => {
    if (!confirm(`Apakah Anda yakin ingin memaksa submit sesi ujian untuk ${studentName}?`)) return;
    try {
      await api.forceSubmit(sessionId);
      fetchMonitoring();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleResetSession = async (sessionId: string, studentName: string) => {
    if (!confirm(`PERINGATAN: Mereset sesi akan menghapus jawaban aktif ${studentName} dan mengizinkannya memulai ulang dari awal. Lanjutkan?`)) return;
    try {
      await api.resetSession(sessionId);
      fetchMonitoring();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const formatSeconds = (sec: number | null) => {
    if (sec === null) return '-';
    if (sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filter participants
  const classesList = Array.from(new Set(participants.map(p => p.kelas))).filter(Boolean);

  const filtered = participants.filter(p => {
    if (classFilter !== 'ALL' && p.kelas !== classFilter) return false;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_PROGRESS' && p.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'SUBMITTED' && (p.status !== 'SUBMITTED' && p.status !== 'TIME_OUT')) return false;
      if (statusFilter === 'NOT_STARTED' && p.status !== 'BELUM_MULAI') return false;
      if (statusFilter === 'VIOLATION' && (p.violationsCount || 0) === 0) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.nama.toLowerCase().includes(q) || p.nisn.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedSchedule = schedules.find(s => s.id === selectedExamId);

  return (
    <div className="space-y-5">
      {/* Current Exam Info Bar */}
      {selectedSchedule && (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 flex items-center justify-between text-xs flex-wrap gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-900 text-sm">{selectedSchedule.title}</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-xs">
              {selectedSchedule.mataPelajaran || 'Matematika'}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-xs">
              Paket {selectedSchedule.paketId}
            </span>
          </div>
          <div className="text-slate-500 font-medium">
            Total Soal: <strong className="text-slate-800">{questionsCount}</strong> butir · Durasi: <strong className="text-slate-800">{selectedSchedule.durationMinutes}</strong> menit
          </div>
        </div>
      )}

      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Select Exam Schedule */}
          <div className="w-full sm:w-64">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Pilih Paket Ujian
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {schedules.map(sch => (
                <option key={sch.id} value={sch.id}>
                  [{sch.mataPelajaran || 'Matematika'}] {sch.title} (Paket {sch.paketId})
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Cari Murid / NISN
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik nama atau NISN..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Class Filter */}
          <div className="w-28">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Kelas
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua</option>
              {classesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Status Pengerjaan
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Status</option>
              <option value="IN_PROGRESS">Mengerjakan</option>
              <option value="SUBMITTED">Sudah Selesai</option>
              <option value="NOT_STARTED">Belum Mulai</option>
              <option value="VIOLATION">Ada Pelanggaran</option>
            </select>
          </div>
        </div>

        {/* Live status badge & manual refresh */}
        <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-3.5 h-3.5 text-blue-600 rounded"
            />
            <span>Auto-refresh (5s)</span>
          </label>

          <button
            onClick={fetchMonitoring}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Segarkan data sekarang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Monitoring Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
          <span className="text-slate-500 font-medium">Total Peserta:</span>
          <span className="font-bold text-slate-900 font-mono text-sm">{participants.length}</span>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-amber-900">
          <span className="font-medium">Sedang Ujian:</span>
          <span className="font-bold font-mono text-sm">
            {participants.filter(p => p.status === 'IN_PROGRESS').length}
          </span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-emerald-900">
          <span className="font-medium">Sudah Selesai:</span>
          <span className="font-bold font-mono text-sm">
            {participants.filter(p => p.status === 'SUBMITTED' || p.status === 'TIME_OUT').length}
          </span>
        </div>
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex justify-between items-center text-red-900">
          <span className="font-medium">Ada Pelanggaran:</span>
          <span className="font-bold font-mono text-sm">
            {participants.filter(p => (p.violationsCount || 0) > 0).length}
          </span>
        </div>
      </div>

      {/* Main Monitoring Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Terjawab</th>
                <th className="py-3 px-3">Sisa Waktu</th>
                <th className="py-3 px-3">Pelanggaran</th>
                <th className="py-3 px-3">Nilai</th>
                <th className="py-3 px-4 text-right">Aksi Proktor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Tidak ada data peserta yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isInProgress = p.status === 'IN_PROGRESS';
                  const isSubmitted = p.status === 'SUBMITTED';
                  const isTimeOut = p.status === 'TIME_OUT';
                  const isNotStarted = p.status === 'BELUM_MULAI';
                  const hasViolations = (p.violationsCount || 0) > 0;

                  return (
                    <tr key={p.nisn} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {p.nama}
                        </div>
                        {isInProgress && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${p.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span>{p.isOnline ? 'Aktif' : 'Heartbeat tertunda'}</span>
                          </div>
                        )}
                      </td>

                      {/* NISN */}
                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        {p.nisn}
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {p.kelas}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Mengerjakan
                          </span>
                        )}
                        {isSubmitted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Diserahkan
                          </span>
                        )}
                        {isTimeOut && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Waktu Habis
                          </span>
                        )}
                        {isNotStarted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Belum Mulai
                          </span>
                        )}
                      </td>

                      {/* Answered */}
                      <td className="py-3.5 px-3 font-mono font-medium">
                        {p.status === 'BELUM_MULAI' ? '-' : (
                          <span className={p.answeredCount === p.totalQuestions ? 'text-emerald-700 font-bold' : 'text-slate-800'}>
                            {p.answeredCount} / {p.totalQuestions}
                          </span>
                        )}
                      </td>

                      {/* Remaining Time */}
                      <td className="py-3.5 px-3 font-mono font-bold">
                        {isInProgress ? (
                          <span className={p.remainingSeconds < 300 ? 'text-red-600' : 'text-slate-800'}>
                            {formatSeconds(p.remainingSeconds)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* Violations */}
                      <td className="py-3.5 px-3">
                        {hasViolations ? (
                          <button
                            onClick={() => setSelectedViolations({ studentName: p.nama, list: p.violations })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-semibold transition-colors"
                            title="Klik untuk melihat detail peristiwa pelanggaran"
                          >
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                            <span>{p.violationsCount}x (-{p.totalPenaltySeconds}s)</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-3 font-mono">
                        {p.score ? (
                          <span className="font-bold text-slate-900">
                            {p.score.totalScore} ({p.score.percentage}%)
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isInProgress && (
                            <button
                              onClick={() => handleForceSubmit(p.sessionId, p.nama)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                              title="Paksa kirim jawaban murid"
                            >
                              Paksa Selesai
                            </button>
                          )}
                          {(isSubmitted || isTimeOut || isInProgress) && (
                            <button
                              onClick={() => handleResetSession(p.sessionId, p.nama)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                              title="Reset sesi jika terjadi masalah teknis"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Violations Log Modal */}
      <Modal
        isOpen={!!selectedViolations}
        onClose={() => setSelectedViolations(null)}
        title={selectedViolations ? `Riwayat Pelanggaran: ${selectedViolations.studentName}` : ''}
        description="Daftar peristiwa perpindahan layar yang terdeteksi oleh sistem selama pengerjaan."
        maxWidth="md"
      >
        {selectedViolations && (
          <div className="space-y-3">
            {selectedViolations.list.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Tidak ada catatan pelanggaran.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {selectedViolations.list.map((v, i) => (
                  <div key={v.id || i} className="p-3 bg-red-50/70 border border-red-100 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-900 capitalize">
                        {v.eventType.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-red-700 font-bold">
                        -{v.penaltyApplied} Detik
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{v.eventDescription}</p>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>Waktu: {new Date(v.timestamp).toLocaleTimeString('id-ID')}</span>
                      <span>Sisa Waktu Setelahnya: {formatSeconds(v.remainingSecondsAfter)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedViolations(null)}
                className="w-full py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
