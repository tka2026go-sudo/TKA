import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ExamSchedule } from '../../types';
import {
  Award,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface ResultsTabProps {
  schedules: ExamSchedule[];
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ schedules }) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(schedules[0]?.id || '');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const fetchResults = async () => {
    if (!selectedExamId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminResults(selectedExamId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat rekap nilai');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedExamId]);

  const handleExportCsv = async () => {
    if (!selectedExamId) return;
    try {
      const token = localStorage.getItem('tka_token');
      const res = await fetch(`/api/admin/results/${selectedExamId}/export-csv?token=${token}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Gagal mengunduh file CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hasil_TKA_${selectedExamId}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Gagal mengekspor CSV');
    }
  };

  const resultsList = data?.results || [];
  const filtered = resultsList.filter((r: any) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.nama.toLowerCase().includes(q) || r.nisn.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Filter and Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
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

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Cari Nama Murid / NISN
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
        </div>

        <div className="pt-2 md:pt-0 shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={!data || data.totalCompleted === 0}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs ${
              !data || data.totalCompleted === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Hasil ke CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Total Selesai</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {data.totalCompleted} / {data.totalParticipants}
            </div>
            <span className="text-[11px] text-slate-400">Peserta ujian</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Rata-rata Nilai</span>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
              {data.avgScore}%
            </div>
            <span className="text-[11px] text-slate-400">Skor rata-rata kelas</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Nilai Tertinggi</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              {data.highestScore}%
            </div>
            <span className="text-[11px] text-slate-400">Peringkat 1</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Nilai Terendah</span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
              {data.lowestScore}%
            </div>
            <span className="text-[11px] text-slate-400">Batas evaluasi</span>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Nilai</th>
                <th className="py-3 px-3">Persentase</th>
                <th className="py-3 px-3">Benar / Salah</th>
                <th className="py-3 px-3">Pelanggaran</th>
                <th className="py-3 px-4">Waktu Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500">
                    Memuat hasil penilaian...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500">
                    Belum ada murid yang menyelesaikan ujian pada paket ini.
                  </td>
                </tr>
              ) : (
                filtered.map((r: any, idx: number) => {
                  const score = r.score;
                  const isFinished = r.status === 'SUBMITTED' || r.status === 'TIME_OUT';

                  return (
                    <tr key={r.sessionId || r.nisn} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.nama}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        {r.nisn}
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {r.kelas}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isFinished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {score ? `${score.totalScore} / ${score.maxScore}` : '-'}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-extrabold text-blue-700">
                        {score ? `${score.percentage}%` : '-'}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        {score ? (
                          <span>
                            <span className="text-emerald-700 font-bold">{score.correctCount}</span>
                            <span className="mx-1">/</span>
                            <span className="text-red-700 font-bold">{score.incorrectCount}</span>
                          </span>
                        ) : '-'}
                      </td>

                      <td className="py-3.5 px-3">
                        {r.violationsCount > 0 ? (
                          <span className="text-red-700 font-semibold font-mono">
                            {r.violationsCount}x (-{r.totalPenaltySeconds}s)
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString('id-ID') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
