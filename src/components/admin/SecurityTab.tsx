import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SecuritySettings } from '../../types';
import {
  ShieldAlert,
  Clock,
  Bell,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  HelpCircle
} from 'lucide-react';

export const SecurityTab: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>({
    monitorVisibility: true,
    penaltySeconds: 60,
    maxPenaltySeconds: 600,
    alertOnReturn: true,
    allowContinueAfterPenalty: true,
    penaltyMode: 'deduct',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.getSecuritySettings();
        setSettings(res.settings);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat pengaturan keamanan');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      await api.updateSecuritySettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 animate-pulse">
        Memuat parameter keamanan ujian...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            PENGATURAN KEAMANAN UJIAN
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Konfigurasi sistem pengawasan integritas layar, deteksi alih aplikasi, dan mekanisme penalti pengurangan waktu otomatis pada browser murid.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan keamanan ujian berhasil diperbarui dan diterapkan ke seluruh sesi pengerjaan aktif.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Toggle 1: Monitor Visibility */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900 cursor-pointer">
              Aktifkan Pemantauan Perpindahan Layar Ujian
            </label>
            <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
              Mendeteksi saat murid meminimalkan browser, berpindah ke tab lain, membuka aplikasi obrolan, atau keluar dari jendela ujian melalui Page Visibility API dan Pagehide event.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.monitorVisibility}
            onChange={(e) => setSettings({ ...settings, monitorVisibility: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer mt-1"
          />
        </div>

        {/* Setting 2: Penalty Mode */}
        <div className="pb-6 border-b border-slate-100 space-y-3">
          <div>
            <label className="text-sm font-bold text-slate-900">
              Metode Penalti Pelanggaran
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih apakah pelanggaran langsung memotong sisa waktu pengerjaan murid atau hanya dicatat di sistem audit proktor.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                settings.penaltyMode === 'deduct'
                  ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600 text-blue-950'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="penaltyMode"
                value="deduct"
                checked={settings.penaltyMode === 'deduct'}
                onChange={() => setSettings({ ...settings, penaltyMode: 'deduct' })}
                className="mt-0.5 text-blue-600"
              />
              <div className="text-xs">
                <span className="font-bold block text-sm">Potong Waktu Otomatis</span>
                <span className="text-slate-500 block mt-0.5">
                  Waktu tersisa murid di server langsung dikurangi secara instan setiap pelanggaran terdeteksi.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                settings.penaltyMode === 'log_only'
                  ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600 text-blue-950'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="penaltyMode"
                value="log_only"
                checked={settings.penaltyMode === 'log_only'}
                onChange={() => setSettings({ ...settings, penaltyMode: 'log_only' })}
                className="mt-0.5 text-blue-600"
              />
              <div className="text-xs">
                <span className="font-bold block text-sm">Hanya Catat Log (Tanpa Potong Waktu)</span>
                <span className="text-slate-500 block mt-0.5">
                  Peristiwa dicatat ke riwayat monitoring proktor tanpa mengubah sisa waktu pengerjaan murid.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Setting 3 & 4: Deductions in seconds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Pengurangan Waktu per Pelanggaran (Detik)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Contoh: 60 detik (1 menit) setiap kali murid keluar layar.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={3600}
                step={5}
                required
                value={settings.penaltySeconds}
                onChange={(e) => setSettings({ ...settings, penaltySeconds: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-slate-500 shrink-0">detik</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Batas Maksimum Total Penalti (Detik)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Contoh: 600 detik (10 menit) akumulasi pemotongan maksimal per sesi.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={7200}
                step={30}
                required
                value={settings.maxPenaltySeconds}
                onChange={(e) => setSettings({ ...settings, maxPenaltySeconds: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-slate-500 shrink-0">detik</span>
            </div>
          </div>
        </div>

        {/* Setting 5: Alert on Return */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900 cursor-pointer">
              Tampilkan Peringatan Edukatif Saat Murid Kembali
            </label>
            <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
              Ketika murid membuka kembali layar ujian, tampilkan modal peringatan elegan yang memberitahukan bahwa waktu pengerjaan telah dipotong dan dicatat ke server.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.alertOnReturn}
            onChange={(e) => setSettings({ ...settings, alertOnReturn: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer mt-1"
          />
        </div>

        {/* Setting 6: Allow Continue */}
        <div className="flex items-start justify-between gap-4 pb-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-900 cursor-pointer">
              Izinkan Murid Melanjutkan Setelah Pelanggaran
            </label>
            <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
              Jika aktif, murid tetap diperbolehkan menyelesaikan ujian dengan sisa waktu yang berkurang. Jika nonaktif, murid akan langsung dikunci.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.allowContinueAfterPenalty}
            onChange={(e) => setSettings({ ...settings, allowContinueAfterPenalty: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer mt-1"
          />
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
