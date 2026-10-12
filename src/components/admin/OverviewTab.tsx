import React from 'react';
import {
  Users,
  BookOpen,
  Clock,
  ShieldAlert,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

interface OverviewTabProps {
  overview: any;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ overview, onNavigateTab }) => {
  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner with Glassmorphic Luxury Style */}
      <div className="glass-card-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-white/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold tracking-wide border border-white/20 backdrop-blur-md">
            <Activity className="w-3.5 h-3.5 text-blue-300" />
            <span>Pusat Kendali Ujian TKA SMP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Dashboard Proktor & Administrator
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 max-w-xl leading-relaxed">
            Kelola jalannya Tes Kemampuan Akademik (TKA) SMP secara terpusat dengan pemantauan integritas layar real-time, bank soal terstandar, dan penilaian otomatis.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigateTab('monitoring')}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-900/20 border border-white/20 active:scale-98"
          >
            <span>Live Monitoring</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigateTab('security')}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all active:scale-98"
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>Keamanan & Penalti</span>
          </button>
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Murid Terdaftar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {overview.totalStudents}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Peserta kelas VII, VIII, IX
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Butir Soal</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {overview.totalQuestions}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Paket A: {overview.paketCounts?.A || 0} · B: {overview.paketCounts?.B || 0} · C: {overview.paketCounts?.C || 0}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sedang Mengerjakan</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 font-mono">
            {overview.activeSessionsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overview.submittedSessionsCount} murid sudah selesai
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pelanggaran Layar</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-2 font-mono">
            {overview.totalViolations}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total {overview.totalPenaltySeconds}s penalti waktu diterapkan
          </div>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Package Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <h4 className="text-sm font-bold text-slate-900">Paket Ujian Terpasang</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tiga paket ujian matematika TKA SMP terstandar telah siap digunakan dengan komposisi seimbang.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Paket A (Standar Nasional)</span>
                <span className="font-mono text-blue-700 font-bold">{overview.paketCounts?.A || 30} Soal</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Paket B (Variasi Stimulus)</span>
                <span className="font-mono text-blue-700 font-bold">{overview.paketCounts?.B || 30} Soal</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-700">Paket C (Penalaran Kompleks)</span>
                <span className="font-mono text-blue-700 font-bold">{overview.paketCounts?.C || 30} Soal</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('questions')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Kelola Bank Soal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Security Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-slate-900">Integritas & Anti-Curang</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem memantau perpindahan tab dan aplikasi. Setiap pelanggaran memicu pemotongan waktu tersisa dari server.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex justify-between">
                <span>Status Pemantauan:</span>
                <span className="font-bold text-emerald-700">AKTIF</span>
              </div>
              <div className="flex justify-between">
                <span>Penalti per Pelanggaran:</span>
                <span className="font-bold">60 Detik</span>
              </div>
              <div className="flex justify-between">
                <span>Peringatan Murid:</span>
                <span className="font-bold">Aktif Saat Kembali</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('security')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Ubah Parameter Penalti</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Average Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Performa Peserta</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rata-rata persentase capaian peserta yang telah menyelesaikan ujian.
            </p>
            <div className="text-center py-2">
              <div className="text-4xl font-extrabold text-slate-900 font-mono">
                {overview.averagePercentage}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Berdasarkan {overview.submittedSessionsCount} peserta telah submit
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('results')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Buka Rekap Lengkap & CSV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
