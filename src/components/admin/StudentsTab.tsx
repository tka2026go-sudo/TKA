import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Student } from '../../types';
import { Modal } from '../common/Modal';
import {
  Users,
  Search,
  Plus,
  Upload,
  Key,
  Edit,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download
} from 'lucide-react';

export const StudentsTab: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Modals
  const [editStudent, setEditStudent] = useState<Partial<Student> | null>(null);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminStudents();
      setStudents(res.students);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data murid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent?.nisn || !editStudent?.nama || !editStudent?.nomorInduk) return;

    try {
      await api.saveStudent(editStudent);
      setStatusMsg(`Data murid ${editStudent.nama} berhasil disimpan.`);
      setEditStudent(null);
      fetchStudents();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleResetPassword = async (nisn: string, nama: string) => {
    if (!confirm(`Reset password murid ${nama} (${nisn}) ke Nomor Induk aslinya?`)) return;
    try {
      await api.resetStudentPassword(nisn);
      alert(`Password murid ${nama} berhasil direset ke Nomor Induk.`);
      fetchStudents();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleImportStudentsCsv = async () => {
    if (!importCsvText.trim()) return;
    try {
      setImporting(true);
      const res = await api.importStudentsCsv(importCsvText);
      setStatusMsg(res.message);
      setImportCsvText('');
      setImportModalOpen(false);
      fetchStudents();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const classes = Array.from(new Set(students.map(s => s.kelas))).filter(Boolean);

  const filtered = students.filter(s => {
    if (classFilter !== 'ALL' && s.kelas !== classFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.nama.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q) || s.nomorInduk.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Murid</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik NISN, nama, atau no. induk..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="w-32">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kelas</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 md:pt-0 shrink-0 flex-wrap">
          <a
            href={api.getExportStudentsUrl()}
            download
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Ekspor daftar murid ke format spreadsheet CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor CSV</span>
          </a>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor CSV Murid</span>
          </button>

          <button
            onClick={() => setEditStudent({
              nisn: '',
              nomorInduk: '',
              nama: '',
              kelas: 'IX-A',
              status: 'AKTIF',
              mustChangePassword: false,
            })}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Murid</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">No. Induk (Password Awal)</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Login Terakhir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {students.length === 0
                          ? 'Belum Ada Data Murid Terdaftar'
                          : 'Tidak Ada Murid Sesuai Pencarian'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {students.length === 0
                          ? 'Database bersih dari akun dummy. Proktor dapat mendaftarkan murid satu per satu atau mengimpor data peserta via format CSV.'
                          : 'Coba ubah kata kunci pencarian atau filter kelas Anda.'}
                      </p>
                      {students.length === 0 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            onClick={() => setEditStudent({
                              nisn: '',
                              nomorInduk: '',
                              nama: '',
                              kelas: 'IX-A',
                              status: 'AKTIF',
                              mustChangePassword: false,
                            })}
                            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl"
                          >
                            + Tambah Murid
                          </button>
                          <button
                            onClick={() => setImportModalOpen(true)}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                          >
                            Impor File CSV
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.nisn} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                      {s.nisn}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {s.nomorInduk}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.nama}
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {s.kelas}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-[11px] text-slate-500">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResetPassword(s.nisn, s.nama)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Reset password ke Nomor Induk"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditStudent(s)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit Murid"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <Modal
        isOpen={!!editStudent}
        onClose={() => setEditStudent(null)}
        title={editStudent?.id ? `Edit Murid: ${editStudent.nama}` : 'Tambah Murid Baru'}
        maxWidth="md"
      >
        {editStudent && (
          <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">NISN (10 Digit Angka)</label>
              <input
                type="text"
                required
                value={editStudent.nisn || ''}
                onChange={(e) => setEditStudent({ ...editStudent, nisn: e.target.value.trim() })}
                placeholder="Contoh: 0091234567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nomor Induk / NIPD (Password Awal)</label>
              <input
                type="text"
                required
                value={editStudent.nomorInduk || ''}
                onChange={(e) => setEditStudent({ ...editStudent, nomorInduk: e.target.value.trim() })}
                placeholder="Contoh: 24001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap Murid</label>
              <input
                type="text"
                required
                value={editStudent.nama || ''}
                onChange={(e) => setEditStudent({ ...editStudent, nama: e.target.value })}
                placeholder="Nama murid sesuai dapodik"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kelas</label>
                <input
                  type="text"
                  required
                  value={editStudent.kelas || ''}
                  onChange={(e) => setEditStudent({ ...editStudent, kelas: e.target.value.trim() })}
                  placeholder="Contoh: IX-A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Status</label>
                <select
                  value={editStudent.status || 'AKTIF'}
                  onChange={(e) => setEditStudent({ ...editStudent, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="NONAKTIF">NONAKTIF</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800"
              >
                Simpan Murid
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Impor Data Murid via CSV"
        description="Format kolom: NISN, NAMA, NO_INDUK, KELAS"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            Tempel data CSV dengan baris judul di baris pertama, contoh:
            <br />
            <code className="font-mono text-[11px] block mt-1 bg-white p-2 rounded border border-blue-200">
              NISN,NAMA,NO_INDUK,KELAS<br />
              0091234567,Ahmad Faiz Pratama,24001,IX-A<br />
              0092345678,Nabila Azzahra Putri,24002,IX-A
            </code>
          </div>

          <textarea
            rows={8}
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            placeholder="NISN,NAMA,NO_INDUK,KELAS..."
            className="w-full p-3 font-mono text-[11px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              disabled={importing || !importCsvText.trim()}
              onClick={handleImportStudentsCsv}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white ${
                importing || !importCsvText.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {importing ? 'Mengimpor...' : 'Impor Murid Sekarang'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
