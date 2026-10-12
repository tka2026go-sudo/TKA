import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExamSchedule } from '../../types';
import { Modal } from '../common/Modal';
import {
  Calendar,
  Clock,
  Layers,
  Edit,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings
} from 'lucide-react';

interface SchedulesTabProps {
  schedules: ExamSchedule[];
  onRefresh: () => void;
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({ schedules, onRefresh }) => {
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      setSaving(true);
      await api.saveSchedule(editingSchedule);
      setSuccessMsg('Jadwal ujian berhasil disimpan');
      setEditingSchedule(null);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Gagal menyimpan jadwal: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Jadwal Pelaksanaan & Pengaturan Ujian
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur tanggal, jendela waktu (WIB), durasi, batas pengerjaan, kelas sasaran, dan publikasi nilai.
          </p>
        </div>

        <button
          onClick={() => setEditingSchedule({
            id: `sch_${Date.now()}`,
            paketId: 'A',
            mataPelajaran: 'Matematika',
            title: 'Try Out TKA SMP Matematika — Paket Baru',
            description: 'Ujian kemampuan akademik terjadwal untuk peserta didik SMP.',
            date: new Date().toISOString().split('T')[0],
            startTime: '07:30',
            endTime: '12:00',
            durationMinutes: 90,
            status: 'SEDANG_BERLANGSUNG',
            allowedClasses: ['VII', 'VIII', 'IX', 'SEMUA'],
            maxAttempts: 1,
            randomizeQuestions: false,
            randomizeOptions: false,
            publishScores: true,
            publishKeys: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Jadwal Baru</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schedules.map((sch) => {
          const statusColors = {
            SEDANG_BERLANGSUNG: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            TERJADWAL: 'bg-blue-50 text-blue-700 border-blue-200',
            DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
            DIJEDA: 'bg-amber-50 text-amber-700 border-amber-200',
            SELESAI: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            DIBATALKAN: 'bg-red-50 text-red-700 border-red-200',
          }[sch.status] || 'bg-slate-100 text-slate-600';

          return (
            <div
              key={sch.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs uppercase px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      Paket {sch.paketId}
                    </span>
                    <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {sch.mataPelajaran || 'Matematika'}
                    </span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusColors}`}>
                    {sch.status.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {sch.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {sch.description}
                </p>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal:</span>
                    <span className="font-semibold text-slate-800">{sch.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu (WIB):</span>
                    <span className="font-semibold text-slate-800">{sch.startTime} – {sch.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Durasi Pengerjaan:</span>
                    <span className="font-semibold text-blue-700 font-mono">{sch.durationMinutes} Menit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sasaran Kelas:</span>
                    <span className="text-slate-800 font-medium">
                      {sch.allowedClasses.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100/60">
                    <span className="text-slate-500">Publikasi Nilai:</span>
                    <span className={sch.publishScores ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {sch.publishScores ? 'Dibuka' : 'Ditutup'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Publikasi Kunci/Bahasan:</span>
                    <span className={sch.publishKeys ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {sch.publishKeys ? 'Dibuka' : 'Ditutup'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingSchedule(sch)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Edit Pengaturan Jadwal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={!!editingSchedule}
        onClose={() => setEditingSchedule(null)}
        title={editingSchedule?.title ? `Pengaturan: ${editingSchedule.title}` : 'Jadwal Ujian'}
        maxWidth="lg"
      >
        {editingSchedule && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Judul Ujian</label>
              <input
                type="text"
                required
                value={editingSchedule.title}
                onChange={(e) => setEditingSchedule({ ...editingSchedule, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Deskripsi Singkat</label>
              <textarea
                rows={2}
                value={editingSchedule.description}
                onChange={(e) => setEditingSchedule({ ...editingSchedule, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mata Pelajaran</label>
                <select
                  value={editingSchedule.mataPelajaran || 'Matematika'}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, mataPelajaran: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-xs text-indigo-700 bg-indigo-50/50"
                >
                  <option value="Matematika">Matematika</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Ilmu Pengetahuan Alam (IPA)">IPA</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Paket Soal Sumber</label>
                <select
                  value={editingSchedule.paketId}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, paketId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-xs"
                >
                  <option value="A">Paket A (30 Soal)</option>
                  <option value="B">Paket B (30 Soal)</option>
                  <option value="C">Paket C (30 Soal)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Status Ujian</label>
                <select
                  value={editingSchedule.status}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-xs"
                >
                  <option value="SEDANG_BERLANGSUNG">SEDANG BERLANGSUNG</option>
                  <option value="TERJADWAL">TERJADWAL</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="DIJEDA">DIJEDA (Pause)</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="DIBATALKAN">DIBATALKAN</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={editingSchedule.date}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Jam Buka (WIB)</label>
                <input
                  type="time"
                  required
                  value={editingSchedule.startTime}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Jam Tutup (WIB)</label>
                <input
                  type="time"
                  required
                  value={editingSchedule.endTime}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Durasi Pengerjaan (Menit)</label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  required
                  value={editingSchedule.durationMinutes}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, durationMinutes: parseInt(e.target.value, 10) || 90 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Batas Percobaan Pengerjaan</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editingSchedule.maxAttempts}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, maxAttempts: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            {/* Checkbox options */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSchedule.publishScores}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, publishScores: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-800">
                  Publikasikan Nilai Akhir ke Murid setelah Ujian Selesai
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSchedule.publishKeys}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, publishKeys: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-800">
                  Publikasikan Kunci Jawaban & Pembahasan Lengkap ke Murid
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-xs"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
