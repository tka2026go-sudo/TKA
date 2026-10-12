import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question, QuestionType } from '../../types';
import { Modal } from '../common/Modal';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Trash2,
  Sparkles
} from 'lucide-react';

export const QuestionsTab: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMapel, setSelectedMapel] = useState<string>('ALL');
  const [selectedPaket, setSelectedPaket] = useState<string>('ALL');
  const [selectedElemen, setSelectedElemen] = useState<string>('ALL');
  const [selectedBentuk, setSelectedBentuk] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [previewQ, setPreviewQ] = useState<Question | null>(null);
  const [editQ, setEditQ] = useState<Partial<Question> | null>(null);
  const [customFieldKey, setCustomFieldKey] = useState<string>('');
  const [customFieldValue, setCustomFieldValue] = useState<string>('');
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importing, setImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminQuestions({
        mapel: selectedMapel,
        paket: selectedPaket,
        elemen: selectedElemen,
        bentuk: selectedBentuk,
        search,
      });
      setQuestions(res.questions);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat bank soal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedMapel, selectedPaket, selectedElemen, selectedBentuk]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQ || !editQ.idSoal || !editQ.soal) return;

    try {
      await api.saveQuestion(editQ as Question);
      setEditQ(null);
      fetchQuestions();
    } catch (err: any) {
      alert(`Gagal menyimpan soal: ${err.message}`);
    }
  };

  const handleImportCsv = async () => {
    if (!importCsvText.trim()) return;
    try {
      setImporting(true);
      setImportStatus(null);
      const res = await api.importQuestionsCsv(importCsvText, importMode);
      setImportStatus(res.message);
      setImportCsvText('');
      fetchQuestions();
      setTimeout(() => setImportModalOpen(false), 2000);
    } catch (err: any) {
      setImportStatus(`Gagal: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleAddCustomField = () => {
    if (!customFieldKey.trim()) return;
    const normalizedKey = customFieldKey.trim().toUpperCase().replace(/\s+/g, '_');
    setEditQ(prev => {
      if (!prev) return prev;
      const current = prev.customFields || {};
      return {
        ...prev,
        customFields: {
          ...current,
          [normalizedKey]: customFieldValue.trim()
        }
      };
    });
    setCustomFieldKey('');
    setCustomFieldValue('');
  };

  const handleRemoveCustomField = (key: string) => {
    setEditQ(prev => {
      if (!prev || !prev.customFields) return prev;
      const updated = { ...prev.customFields };
      delete updated[key];
      return {
        ...prev,
        customFields: Object.keys(updated).length > 0 ? updated : undefined
      };
    });
  };

  const elemenList = ['Bilangan', 'Aljabar', 'Geometri dan Pengukuran', 'Data dan Peluang'];

  return (
    <div className="space-y-5">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-wrap flex-1">
          {/* Mapel filter */}
          <div className="w-36">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full text-xs font-bold text-indigo-700 px-3 py-2 bg-indigo-50/60 border border-indigo-200/80 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            >
              <option value="ALL">Semua Mapel</option>
              <option value="Matematika">Matematika</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="Ilmu Pengetahuan Alam (IPA)">IPA</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
            </select>
          </div>

          {/* Paket filter */}
          <div className="w-28">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Paket</label>
            <select
              value={selectedPaket}
              onChange={(e) => setSelectedPaket(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="ALL">Semua Paket</option>
              <option value="A">Paket A</option>
              <option value="B">Paket B</option>
              <option value="C">Paket C</option>
            </select>
          </div>

          {/* Elemen filter */}
          <div className="w-40">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Elemen Capaian</label>
            <select
              value={selectedElemen}
              onChange={(e) => setSelectedElemen(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="ALL">Semua Elemen</option>
              {elemenList.map(el => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>
          </div>

          {/* Bentuk Soal filter */}
          <div className="w-36">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bentuk Soal</label>
            <select
              value={selectedBentuk}
              onChange={(e) => setSelectedBentuk(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="ALL">Semua Bentuk</option>
              <option value="PG">Pilihan Ganda (PG)</option>
              <option value="PGK-MCMA">PGK (Multi Jawaban)</option>
              <option value="PGK-Kategori">PGK (Kategori Benar/Salah)</option>
            </select>
          </div>

          {/* Search box */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kata Kunci</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID, mapel, soal, stimulus..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-5">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Buttons: Add Question, Export CSV, Import CSV */}
        <div className="flex items-center gap-2 pt-2 md:pt-0 shrink-0 flex-wrap">
          <a
            href={api.getExportQuestionsUrl({ paket: selectedPaket, mapel: selectedMapel })}
            download
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Ekspor spreadsheet otomatis dengan seluruh kolom input admin"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Spreadsheet</span>
          </a>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor CSV</span>
          </button>

          <button
            onClick={() => setEditQ({
              idSoal: `TOMAT${String(questions.length + 1).padStart(3, '0')}`,
              mataPelajaran: selectedMapel !== 'ALL' ? selectedMapel : 'Matematika',
              paketTryout: selectedPaket !== 'ALL' ? selectedPaket : 'A',
              urutanPaket: questions.length + 1,
              elemen: 'Bilangan',
              bentukSoal: 'PG',
              tingkatKesulitan: 'Sedang',
              soal: '',
              kunciJawaban: 'A',
              skorMaksimal: 1,
              status: 'AKTIF',
              durasiTargetDetik: 90,
              pembahasan: '',
            })}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Soal</span>
          </button>
        </div>
      </div>

      {/* Summary Tag */}
      <div className="text-xs text-slate-500 flex items-center justify-between px-1">
        <span>Menampilkan <strong className="text-slate-800">{questions.length}</strong> butir soal</span>
        <span>Komposisi: Paket A (30) · Paket B (30) · Paket C (30)</span>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-3">ID Soal</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3">Paket</th>
                <th className="py-3 px-3">Elemen</th>
                <th className="py-3 px-3">Bentuk</th>
                <th className="py-3 px-4">Stimulus & Teks Pertanyaan</th>
                <th className="py-3 px-3">Kunci Sah</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Tidak ada soal yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                questions.map((q, idx) => (
                  <tr key={q.idSoal} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                      {q.idSoal}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px]">
                        {q.mataPelajaran || 'Matematika'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[11px]">
                        Paket {q.paketTryout} (#{q.urutanPaket})
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {q.elemen}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-[11px] text-slate-600 font-mono">
                        {q.bentukSoal}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      {q.stimulusJudul && (
                        <div className="text-[11px] font-bold text-slate-900 truncate">
                          {q.stimulusJudul}
                        </div>
                      )}
                      <div className="text-slate-600 truncate text-[11px]">
                        {q.soal}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-semibold text-emerald-700 max-w-[130px] truncate" title={q.kunciJawaban}>
                      {q.kunciJawaban}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewQ(q)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Pratinjau Soal & Pembahasan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditQ(q)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Edit Butir Soal"
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

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewQ}
        onClose={() => setPreviewQ(null)}
        title={previewQ ? `Detail Soal: ${previewQ.idSoal} (Paket ${previewQ.paketTryout} · #${previewQ.urutanPaket})` : ''}
        maxWidth="2xl"
      >
        {previewQ && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-xs text-slate-500 pb-2 border-b border-slate-100 flex-wrap">
              <span>Mapel: <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{previewQ.mataPelajaran || 'Matematika'}</strong></span>
              <span>·</span>
              <span>Elemen: <strong className="text-slate-800">{previewQ.elemen}</strong></span>
              <span>·</span>
              <span>Bentuk: <strong className="text-slate-800">{previewQ.bentukSoal}</strong></span>
              <span>·</span>
              <span>Kesulitan: <strong className="text-slate-800">{previewQ.tingkatKesulitan}</strong></span>
              <span>·</span>
              <span>Skor Max: <strong className="text-slate-800">{previewQ.skorMaksimal}</strong></span>
            </div>

            {previewQ.stimulus && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                {previewQ.stimulusJudul && (
                  <div className="font-bold text-xs text-blue-700 uppercase tracking-wide">
                    {previewQ.stimulusJudul}
                  </div>
                )}
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{previewQ.stimulus}</p>
              </div>
            )}

            <div>
              <div className="font-bold text-slate-900 mb-1">Pertanyaan:</div>
              <p className="text-slate-800 leading-relaxed font-medium">{previewQ.soal}</p>
            </div>

            {/* Options or Statements preview */}
            {previewQ.bentukSoal === 'PG' && (
              <div className="space-y-1.5 pt-2">
                <div className="font-semibold text-slate-600 text-xs">Pilihan Jawaban:</div>
                {[
                  { k: 'A', text: previewQ.opsiA },
                  { k: 'B', text: previewQ.opsiB },
                  { k: 'C', text: previewQ.opsiC },
                  { k: 'D', text: previewQ.opsiD },
                  { k: 'E', text: previewQ.opsiE },
                ].filter(o => !!o.text).map(o => (
                  <div key={o.k} className={`p-2 rounded-lg border text-xs flex gap-2 ${previewQ.kunciJawaban === o.k ? 'bg-emerald-50 border-emerald-200 font-semibold text-emerald-900' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold font-mono">{o.k}.</span>
                    <span>{o.text}</span>
                  </div>
                ))}
              </div>
            )}

            {previewQ.bentukSoal === 'PGK-Kategori' && (
              <div className="space-y-2 pt-2">
                <div className="font-semibold text-slate-600 text-xs">Pernyataan & Kategori:</div>
                {[
                  { n: '1', text: previewQ.pernyataan1 },
                  { n: '2', text: previewQ.pernyataan2 },
                  { n: '3', text: previewQ.pernyataan3 },
                ].filter(s => !!s.text).map(s => (
                  <div key={s.n} className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex justify-between gap-3">
                    <span>{s.n}. {s.text}</span>
                    <span className="font-bold text-blue-700 font-mono shrink-0">
                      {previewQ.kunciTerstruktur ? previewQ.kunciTerstruktur[s.n] : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
              <div className="font-bold text-xs text-emerald-900">Kunci Jawaban & Pembahasan:</div>
              <div className="font-mono text-xs font-bold text-emerald-800">
                Kunci: {previewQ.kunciJawaban}
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed whitespace-pre-line pt-1">
                {previewQ.pembahasan}
              </p>
            </div>

            {previewQ.customFields && Object.keys(previewQ.customFields).length > 0 && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-1.5">
                <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kolom & Atribut Kustom (Otomatis Masuk Spreadsheet):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewQ.customFields).map(([k, v]) => (
                    <span key={k} className="px-2 py-1 rounded-md bg-white border border-indigo-200 text-xs font-mono">
                      <strong className="text-indigo-700">{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit / Add Modal */}
      <Modal
        isOpen={!!editQ}
        onClose={() => setEditQ(null)}
        title={editQ?.idSoal ? `Edit Soal: ${editQ.idSoal}` : 'Tambah Soal Baru'}
        maxWidth="2xl"
      >
        {editQ && (
          <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Mata Pelajaran</label>
                <select
                  value={editQ.mataPelajaran || 'Matematika'}
                  onChange={(e) => setEditQ({ ...editQ, mataPelajaran: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-indigo-700 bg-indigo-50/50"
                >
                  <option value="Matematika">Matematika</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Ilmu Pengetahuan Alam (IPA)">IPA</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">ID Soal</label>
                <input
                  type="text"
                  required
                  value={editQ.idSoal || ''}
                  onChange={(e) => setEditQ({ ...editQ, idSoal: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Paket Try Out</label>
                <select
                  value={editQ.paketTryout || 'A'}
                  onChange={(e) => setEditQ({ ...editQ, paketTryout: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="A">Paket A</option>
                  <option value="B">Paket B</option>
                  <option value="C">Paket C</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Urutan Paket</label>
                <input
                  type="number"
                  value={editQ.urutanPaket || 1}
                  onChange={(e) => setEditQ({ ...editQ, urutanPaket: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Elemen</label>
                <select
                  value={editQ.elemen || 'Bilangan'}
                  onChange={(e) => setEditQ({ ...editQ, elemen: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {elemenList.map(el => (
                    <option key={el} value={el}>{el}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bentuk Soal</label>
                <select
                  value={editQ.bentukSoal || 'PG'}
                  onChange={(e) => setEditQ({ ...editQ, bentukSoal: e.target.value as QuestionType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="PG">PG</option>
                  <option value="PGK-MCMA">PGK-MCMA</option>
                  <option value="PGK-Kategori">PGK-Kategori</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Judul Stimulus (Opsional)</label>
              <input
                type="text"
                value={editQ.stimulusJudul || ''}
                onChange={(e) => setEditQ({ ...editQ, stimulusJudul: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Teks Stimulus (Opsional)</label>
              <textarea
                rows={3}
                value={editQ.stimulus || ''}
                onChange={(e) => setEditQ({ ...editQ, stimulus: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Pertanyaan / Soal</label>
              <textarea
                rows={3}
                required
                value={editQ.soal || ''}
                onChange={(e) => setEditQ({ ...editQ, soal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
              />
            </div>

            {/* If PG or PGK-MCMA: Options */}
            {editQ.bentukSoal !== 'PGK-Kategori' ? (
              <div className="space-y-2">
                <div className="font-semibold text-slate-700">Pilihan Opsi:</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Opsi A"
                    value={editQ.opsiA || ''}
                    onChange={(e) => setEditQ({ ...editQ, opsiA: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Opsi B"
                    value={editQ.opsiB || ''}
                    onChange={(e) => setEditQ({ ...editQ, opsiB: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Opsi C"
                    value={editQ.opsiC || ''}
                    onChange={(e) => setEditQ({ ...editQ, opsiC: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Opsi D"
                    value={editQ.opsiD || ''}
                    onChange={(e) => setEditQ({ ...editQ, opsiD: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-semibold text-slate-700">Pernyataan Kategori:</div>
                <input
                  type="text"
                  placeholder="Pernyataan 1"
                  value={editQ.pernyataan1 || ''}
                  onChange={(e) => setEditQ({ ...editQ, pernyataan1: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Pernyataan 2"
                  value={editQ.pernyataan2 || ''}
                  onChange={(e) => setEditQ({ ...editQ, pernyataan2: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Pernyataan 3"
                  value={editQ.pernyataan3 || ''}
                  onChange={(e) => setEditQ({ ...editQ, pernyataan3: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Kunci Jawaban</label>
              <input
                type="text"
                required
                placeholder="Contoh: C atau A, B, C atau 1 Benar; 2 Benar; 3 Salah"
                value={editQ.kunciJawaban || ''}
                onChange={(e) => setEditQ({ ...editQ, kunciJawaban: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Pembahasan</label>
              <textarea
                rows={3}
                value={editQ.pembahasan || ''}
                onChange={(e) => setEditQ({ ...editQ, pembahasan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Indikator Soal</label>
                <input
                  type="text"
                  placeholder="Contoh: Menyelesaikan operasi bilangan bentuk pangkat"
                  value={editQ.indikator || ''}
                  onChange={(e) => setEditQ({ ...editQ, indikator: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bab Acuan</label>
                <input
                  type="text"
                  placeholder="Contoh: Bab 1 — Bilangan Berpangkat"
                  value={editQ.babAcuan || ''}
                  onChange={(e) => setEditQ({ ...editQ, babAcuan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tingkat Kesulitan</label>
                <select
                  value={editQ.tingkatKesulitan || 'Sedang'}
                  onChange={(e) => setEditQ({ ...editQ, tingkatKesulitan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Skor Maksimal</label>
                <input
                  type="number"
                  step="0.5"
                  value={editQ.skorMaksimal !== undefined ? editQ.skorMaksimal : 1}
                  onChange={(e) => setEditQ({ ...editQ, skorMaksimal: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kata Kunci</label>
                <input
                  type="text"
                  placeholder="Contoh: Matematika, Eksponen"
                  value={editQ.kataKunci || ''}
                  onChange={(e) => setEditQ({ ...editQ, kataKunci: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Custom Input Fields (Auto-Creates Columns in Spreadsheet) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kolom / Input Tambahan Kustom</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Setiap input yang Anda tambahkan di sini otomatis dibuatkan kolom baru di spreadsheet.
                  </p>
                </div>
              </div>

              {/* Existing custom fields list */}
              {editQ.customFields && Object.keys(editQ.customFields).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {Object.entries(editQ.customFields).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">{key}:</span>
                        <span className="text-slate-700">{val}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(key)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus kolom ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom field row */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Nama Kolom (misal: KOMPETENSI_DASAR)"
                  value={customFieldKey}
                  onChange={(e) => setCustomFieldKey(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 bg-white rounded-lg font-mono"
                />
                <input
                  type="text"
                  placeholder="Nilai Kolom"
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 bg-white rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  disabled={!customFieldKey.trim()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    customFieldKey.trim()
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tambah Kolom</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditQ(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800"
              >
                Simpan Soal
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Impor Butir Soal via CSV"
        description="Salin dan tempel data teks CSV berisi 41 kolom standar TKA SMP."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {importStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              {importStatus}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mode Impor:
            </label>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                />
                <span>Tambahkan ke Bank Soal (Merge / Update)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                <span className="text-red-700 font-medium">Gantikan Seluruh Soal (Replace)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tempel Teks CSV:
            </label>
            <textarea
              rows={8}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder="NO_SOAL,ID_SOAL,ID_STIMULUS,ID_KOMPETENSI,ELEMEN,..."
              className="w-full p-3 font-mono text-[11px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              disabled={importing || !importCsvText.trim()}
              onClick={handleImportCsv}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white ${
                importing || !importCsvText.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {importing ? 'Memproses CSV...' : 'Mulai Impor Sekarang'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
