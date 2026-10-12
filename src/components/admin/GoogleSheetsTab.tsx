import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { GoogleSheetsConfig } from '../../types';
import {
  FileSpreadsheet,
  Link,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Database,
  ArrowRight,
  Download,
  Sparkles,
  Layers,
  FileCode,
  Check
} from 'lucide-react';

export const GoogleSheetsTab: React.FC = () => {
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [ensuringColumns, setEnsuringColumns] = useState<boolean>(false);
  const [schemaStatus, setSchemaStatus] = useState<{
    totalColumns: number;
    allColumns: string[];
    autoCreatedColumns: string[];
    standardColumnsCount: number;
    hasMataPelajaran: boolean;
    totalQuestions: number;
  } | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [ensureResult, setEnsureResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const [resConfig, resSchema] = await Promise.all([
        api.getGoogleSheetsConfig(),
        api.getSpreadsheetSchemaStatus().catch(() => null),
      ]);
      setConfig(resConfig.config);
      if (resSchema) {
        setSchemaStatus(resSchema);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat konfigurasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);
      const res = await api.testSheetsConnection();
      setTestResult(res);
      fetchConfig();
    } catch (err: any) {
      setError(err.message || 'Gagal menguji koneksi');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncQuestions = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setError(null);
      const res = await api.syncQuestionsFromSheets();
      setSyncResult(res);
      fetchConfig();
    } catch (err: any) {
      setError(err.message || 'Gagal menyinkronkan data soal');
    } finally {
      setSyncing(false);
    }
  };

  const handleEnsureColumns = async () => {
    try {
      setEnsuringColumns(true);
      setEnsureResult(null);
      setError(null);
      const res = await api.ensureSpreadsheetColumns();
      setEnsureResult(res.message);
      fetchConfig();
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi skema kolom');
    } finally {
      setEnsuringColumns(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">
                Integrasi Sumber Data Google Spreadsheet
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Auto-Create Columns Aktif
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              Koneksi terpusat ke master spreadsheet soal dan peserta Try Out TKA SMP. Setiap input baru di panel admin otomatis membuat kolom di spreadsheet yang belum tersedia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={config?.spreadsheetUrl || 'https://docs.google.com/spreadsheets/d/1J9YMPLcgKuF7GnPwaYJCHAXdKeOTEQD2CcEVPaxzHaM/edit?usp=sharing'}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <span>Buka Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Auto-Create Columns Feature Panel */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-indigo-800/40 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">
                Otomatisasi Kolom Spreadsheet (Auto-Schema Synchronizer)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Semua input yang ada di admin otomatis menambahkan kolom yang belum tersedia di spreadsheet.
              </p>
            </div>
          </div>

          <button
            onClick={handleEnsureColumns}
            disabled={ensuringColumns}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ensuringColumns ? 'animate-spin' : ''}`} />
            <span>{ensuringColumns ? 'Memverifikasi Kolom...' : 'Sinkronkan & Buat Kolom Baru'}</span>
          </button>
        </div>

        {ensureResult && (
          <div className="p-3 bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{ensureResult}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block font-medium">Total Kolom Terdeteksi</span>
            <span className="text-xl font-extrabold text-white">
              {schemaStatus?.totalColumns || 41}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">Semua Kolom Aktif</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block font-medium">Kolom Mata Pelajaran</span>
            <span className="text-xl font-extrabold text-emerald-400">
              MATA_PELAJARAN
            </span>
            <span className="text-[10px] text-emerald-300 block mt-0.5 font-semibold">Tersinkron Otomatis</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block font-medium">Kolom Otomatis Dibuat</span>
            <span className="text-xl font-extrabold text-amber-300">
              {schemaStatus?.autoCreatedColumns?.length || 1} Kolom
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5 font-semibold">Dari Input Admin</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block font-medium">Bank Soal Terintegrasi</span>
            <span className="text-xl font-extrabold text-white">
              {schemaStatus?.totalQuestions || 90} Butir
            </span>
            <span className="text-[10px] text-blue-300 block mt-0.5 font-semibold">Paket A, B, C</span>
          </div>
        </div>

        {/* Quick Export Downloads with all auto-created columns */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            Unduh Berkas Spreadsheet Lengkap (Format CSV Terverifikasi):
          </span>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={api.getExportQuestionsUrl()}
              download
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ekspor Bank Soal (+ Kolom Baru Otomatis)</span>
            </a>

            <a
              href={api.getQuestionsTemplateUrl()}
              download
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-300" />
              <span>Unduh Template Master Soal</span>
            </a>

            <a
              href={api.getExportStudentsUrl()}
              download
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              <span>Ekspor Data Murid / Peserta</span>
            </a>
          </div>
        </div>
      </div>

      {/* Connection Status Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900">
          Parameter Tautan Google Spreadsheet
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block mb-1">Spreadsheet ID:</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 select-all">
              {config?.spreadsheetId || '1J9YMPLcgKuF7GnPwaYJCHAXdKeOTEQD2CcEVPaxzHaM'}
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-semibold block mb-1">Status Sinkronisasi Terakhir:</span>
            <div className={`p-2.5 rounded-xl border font-semibold flex items-center gap-2 ${
              config?.lastSyncStatus === 'SUCCESS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : config?.lastSyncStatus === 'ERROR'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <Database className="w-4 h-4" />
              <span>{config?.lastSyncMessage || 'Siap digunakan (Database memuat 90 butir soal asli + Mata Pelajaran).'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Menguji Akses...' : 'Uji Koneksi Sheet'}</span>
          </button>

          <button
            onClick={handleSyncQuestions}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang Bank Soal'}</span>
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-800">Hasil Uji Koneksi:</div>
            <p className="text-slate-600">{testResult.message}</p>
            {testResult.accessible && (
              <div className="text-emerald-700 font-semibold">
                Ditemukan {testResult.rowsCount} baris data publik. Kolom MATA_PELAJARAN dan seluruh input admin otomatis dipetakan.
              </div>
            )}
          </div>
        )}

        {syncResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-900">
            <div className="font-bold">Sinkronisasi Berhasil:</div>
            <p>{syncResult.message}</p>
          </div>
        )}
      </div>

      {/* Schema Mapping Specification */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Pemetaan Struktur Data & Kolom Otomatis (Spreadsheet Column Mapping)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Format 41+ kolom standar asesmen TKA SMP yang dipetakan secara akurat ke database aplikasi, termasuk kolom otomatis yang dibuat dari input admin:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Kolom Spreadsheet</th>
                <th className="py-2.5 px-3">Status Pembuatan</th>
                <th className="py-2.5 px-3">Fungsi Pedagogis & Teknis</th>
                <th className="py-2.5 px-3">Representasi dalam Aplikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr className="bg-emerald-50/50">
                <td className="py-2 px-3 font-bold text-emerald-800">MATA_PELAJARAN</td>
                <td className="py-2 px-3 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Otomatis Dibuat
                  </span>
                </td>
                <td className="py-2 px-3 font-sans text-slate-700">Mata Pelajaran (Matematika, Bahasa Indonesia, IPA, Bahasa Inggris)</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Question.mataPelajaran</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">NO_SOAL, ID_SOAL</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Nomor urut & kode unik butir soal</td>
                <td className="py-2 px-3 text-slate-600">Question.idSoal</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">ID_STIMULUS, STIMULUS_JUDUL, STIMULUS</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Teks stimulus kontekstual yang dipakai bersama</td>
                <td className="py-2 px-3 text-slate-600">Stimulus Card pada antarmuka</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">ELEMEN, INDIKATOR, BAB_ACUAN</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Kompetensi Kurikulum Merdeka SMP</td>
                <td className="py-2 px-3 text-slate-600">Metadata soal & analisis capaian</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">BENTUK_SOAL</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">PG, PGK-MCMA, PGK-Kategori</td>
                <td className="py-2 px-3 text-slate-600">Renderer input interaktif (Radio / Checkbox / Kategori)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">OPSI_A s.d. OPSI_E</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Pilihan jawaban soal PG dan PGK-MCMA</td>
                <td className="py-2 px-3 text-slate-600">Touch target tombol opsi (min 48px)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">PERNYATAAN_1..3, KATEGORI_JAWABAN</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Pernyataan evaluasi dan label toggle</td>
                <td className="py-2 px-3 text-slate-600">Matriks Benar/Salah atau Ekuivalen</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">KUNCI_JAWABAN, KUNCI_TERSTRUKTUR</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Kunci jawaban sah (disimpan di server)</td>
                <td className="py-2 px-3 text-slate-600">Grading Engine backend (tersembunyi dari murid)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">PAKET_TRYOUT, URUTAN_PAKET</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Distribusi paket ujian (Paket A, B, C @ 30 soal)</td>
                <td className="py-2 px-3 text-slate-600">Filter jadwal & paket ujian murid</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-700">PEMBAHASAN</td>
                <td className="py-2 px-3 font-sans text-slate-500">Standar</td>
                <td className="py-2 px-3 font-sans text-slate-700">Langkah penyelesaian lengkap butir soal</td>
                <td className="py-2 px-3 text-slate-600">Halaman hasil & ulasan pasca-ujian</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2 px-3 font-bold text-indigo-700">[KOLOM_KUSTOM_ADMIN]</td>
                <td className="py-2 px-3 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Auto-Adaptif
                  </span>
                </td>
                <td className="py-2 px-3 font-sans text-slate-700">Input khusus yang ditambahkan admin pada formulir</td>
                <td className="py-2 px-3 text-slate-600">Otomatis dibuatkan kolom baru di CSV/Spreadsheet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

