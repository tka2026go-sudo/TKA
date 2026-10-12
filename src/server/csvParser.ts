import { Question, QuestionType } from '../types';

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        // Handle CRLF
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export function parseQuestionsCsv(csvText: string): Question[] {
  const rows = parseCsvRows(csvText.trim());
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toUpperCase());
  const headerMap = new Map<string, number>();
  headers.forEach((h, idx) => headerMap.set(h, idx));

  const questions: Question[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

    const getVal = (colName: string): string => {
      const idx = headerMap.get(colName.toUpperCase());
      return idx !== undefined && idx < row.length ? row[idx].trim() : '';
    };

    const noVal = parseInt(getVal('NO_SOAL'), 10) || r;
    const idSoal = getVal('ID_SOAL') || `SOAL_${r}`;
    const idStimulus = getVal('ID_STIMULUS');
    const idKompetensi = getVal('ID_KOMPETENSI');
    const elemen = getVal('ELEMEN') || 'Umum';
    const indikator = getVal('INDIKATOR');
    const konteks = getVal('KONTEKS');
    const proses = getVal('PROSES');
    const bentukTeks = getVal('BENTUK_TEKS');
    const bentukSoal = (getVal('BENTUK_SOAL') || 'PG') as QuestionType;
    const tingkatKesulitan = getVal('TINGKAT_KESULITAN') || 'Sedang';
    const stimulusJudul = getVal('STIMULUS_JUDUL');
    const stimulus = getVal('STIMULUS');
    const soal = getVal('SOAL');

    const opsiA = getVal('OPSI_A');
    const opsiB = getVal('OPSI_B');
    const opsiC = getVal('OPSI_C');
    const opsiD = getVal('OPSI_D');
    const opsiE = getVal('OPSI_E');

    const pernyataan1 = getVal('PERNYATAAN_1');
    const pernyataan2 = getVal('PERNYATAAN_2');
    const pernyataan3 = getVal('PERNYATAAN_3');
    const kategoriJawaban = getVal('KATEGORI_JAWABAN');

    const kunciJawaban = getVal('KUNCI_JAWABAN');
    let kunciTerstruktur: any = null;
    const rawTerstruktur = getVal('KUNCI_TERSTRUKTUR');
    if (rawTerstruktur) {
      try {
        kunciTerstruktur = JSON.parse(rawTerstruktur);
      } catch {
        kunciTerstruktur = { raw: rawTerstruktur };
      }
    }

    const skorMaksimal = parseFloat(getVal('SKOR_MAKSIMAL')) || 1;
    const pembahasan = getVal('PEMBAHASAN');
    const kataKunci = getVal('KATA_KUNCI');

    // Extract or default Mata Pelajaran
    let mataPelajaran = getVal('MATA_PELAJARAN') || getVal('MAPEL');
    if (!mataPelajaran) {
      if (kataKunci && kataKunci.toLowerCase().includes('matematika')) {
        mataPelajaran = 'Matematika';
      } else if (kataKunci && kataKunci.toLowerCase().includes('bahasa indonesia')) {
        mataPelajaran = 'Bahasa Indonesia';
      } else if (kataKunci && kataKunci.toLowerCase().includes('ipa')) {
        mataPelajaran = 'Ilmu Pengetahuan Alam (IPA)';
      } else if (kataKunci && kataKunci.toLowerCase().includes('bahasa inggris')) {
        mataPelajaran = 'Bahasa Inggris';
      } else {
        mataPelajaran = 'Matematika'; // Default for current TKA curriculum
      }
    }

    const status = (getVal('STATUS').toUpperCase() === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF') as 'AKTIF' | 'NONAKTIF';
    const durasiTargetDetik = parseInt(getVal('DURASI_TARGET_DETIK'), 10) || 90;
    const catatanPengembang = getVal('CATATAN_PENGEMBANG');
    const kelas = getVal('KELAS') || 'SMP';
    const materiKelas = getVal('MATERI_KELAS');
    const babAcuan = getVal('BAB_ACUAN');
    const nomorIndikatorSumber = getVal('NOMOR_INDIKATOR_SUMBER');
    const statusPemetaan = getVal('STATUS_PEMETAAN');
    const paketTryout = getVal('PAKET_TRYOUT') || 'A';
    const urutanPaket = parseInt(getVal('URUTAN_PAKET'), 10) || r;
    const versiIndikator = getVal('VERSI_INDIKATOR');
    const modeAssesmen = getVal('MODE_ASSESMEN') || 'TRY OUT TKA SMP';

    // Check for any extra/custom columns in the CSV not in standard set
    const knownCols = new Set([
      'NO_SOAL', 'ID_SOAL', 'ID_STIMULUS', 'ID_KOMPETENSI', 'MATA_PELAJARAN', 'MAPEL', 'ELEMEN', 'INDIKATOR',
      'KONTEKS', 'PROSES', 'BENTUK_TEKS', 'BENTUK_SOAL', 'TINGKAT_KESULITAN', 'STIMULUS_JUDUL', 'STIMULUS',
      'SOAL', 'OPSI_A', 'OPSI_B', 'OPSI_C', 'OPSI_D', 'OPSI_E', 'PERNYATAAN_1', 'PERNYATAAN_2', 'PERNYATAAN_3',
      'KATEGORI_JAWABAN', 'KUNCI_JAWABAN', 'KUNCI_TERSTRUKTUR', 'SKOR_MAKSIMAL', 'PEMBAHASAN', 'KATA_KUNCI',
      'STATUS', 'DURASI_TARGET_DETIK', 'CATATAN_PENGEMBANG', 'KELAS', 'MATERI_KELAS', 'BAB_ACUAN',
      'NOMOR_INDIKATOR_SUMBER', 'STATUS_PEMETAAN', 'PAKET_TRYOUT', 'URUTAN_PAKET', 'VERSI_INDIKATOR', 'MODE_ASSESMEN'
    ]);

    const customFields: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (!knownCols.has(h) && idx < row.length && row[idx].trim()) {
        customFields[h] = row[idx].trim();
      }
    });

    questions.push({
      no: noVal,
      idSoal,
      idStimulus,
      idKompetensi,
      mataPelajaran,
      elemen,
      indikator,
      konteks,
      proses,
      bentukTeks,
      bentukSoal,
      tingkatKesulitan,
      stimulusJudul,
      stimulus,
      soal,
      opsiA: opsiA || undefined,
      opsiB: opsiB || undefined,
      opsiC: opsiC || undefined,
      opsiD: opsiD || undefined,
      opsiE: opsiE || undefined,
      pernyataan1: pernyataan1 || undefined,
      pernyataan2: pernyataan2 || undefined,
      pernyataan3: pernyataan3 || undefined,
      kategoriJawaban: kategoriJawaban || undefined,
      kunciJawaban,
      kunciTerstruktur,
      skorMaksimal,
      pembahasan,
      kataKunci: kataKunci || undefined,
      status,
      durasiTargetDetik,
      catatanPengembang: catatanPengembang || undefined,
      kelas,
      materiKelas,
      babAcuan,
      nomorIndikatorSumber: nomorIndikatorSumber || undefined,
      statusPemetaan: statusPemetaan || undefined,
      paketTryout,
      urutanPaket,
      versiIndikator: versiIndikator || undefined,
      modeAssesmen,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    });
  }

  return questions;
}

export const STANDARD_QUESTION_COLUMNS = [
  'NO_SOAL',
  'ID_SOAL',
  'ID_STIMULUS',
  'ID_KOMPETENSI',
  'MATA_PELAJARAN',
  'ELEMEN',
  'INDIKATOR',
  'KONTEKS',
  'PROSES',
  'BENTUK_TEKS',
  'BENTUK_SOAL',
  'TINGKAT_KESULITAN',
  'STIMULUS_JUDUL',
  'STIMULUS',
  'SOAL',
  'OPSI_A',
  'OPSI_B',
  'OPSI_C',
  'OPSI_D',
  'OPSI_E',
  'PERNYATAAN_1',
  'PERNYATAAN_2',
  'PERNYATAAN_3',
  'KATEGORI_JAWABAN',
  'KUNCI_JAWABAN',
  'KUNCI_TERSTRUKTUR',
  'SKOR_MAKSIMAL',
  'PEMBAHASAN',
  'KATA_KUNCI',
  'STATUS',
  'DURASI_TARGET_DETIK',
  'CATATAN_PENGEMBANG',
  'KELAS',
  'MATERI_KELAS',
  'BAB_ACUAN',
  'NOMOR_INDIKATOR_SUMBER',
  'STATUS_PEMETAAN',
  'PAKET_TRYOUT',
  'URUTAN_PAKET',
  'VERSI_INDIKATOR',
  'MODE_ASSESMEN',
];

export function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Automatically detects all columns across all question objects,
 * ensuring any input/custom field from admin automatically creates a new column in the spreadsheet!
 */
export function getAllQuestionSpreadsheetColumns(questions: Question[]): string[] {
  const columnSet = new Set<string>(STANDARD_QUESTION_COLUMNS);
  const dynamicColumns: string[] = [];

  questions.forEach(q => {
    // Check customFields
    if (q.customFields) {
      Object.keys(q.customFields).forEach(k => {
        const colName = k.trim().toUpperCase();
        if (!columnSet.has(colName)) {
          columnSet.add(colName);
          dynamicColumns.push(colName);
        }
      });
    }

    // Check any additional non-standard properties on q
    const knownKeys = new Set([
      'no', 'idSoal', 'idStimulus', 'idKompetensi', 'mataPelajaran', 'elemen', 'indikator',
      'konteks', 'proses', 'bentukTeks', 'bentukSoal', 'tingkatKesulitan', 'stimulusJudul',
      'stimulus', 'soal', 'opsiA', 'opsiB', 'opsiC', 'opsiD', 'opsiE', 'pernyataan1',
      'pernyataan2', 'pernyataan3', 'kategoriJawaban', 'kunciJawaban', 'kunciTerstruktur',
      'skorMaksimal', 'pembahasan', 'kataKunci', 'status', 'durasiTargetDetik',
      'catatanPengembang', 'kelas', 'materiKelas', 'babAcuan', 'nomorIndikatorSumber',
      'statusPemetaan', 'paketTryout', 'urutanPaket', 'versiIndikator', 'modeAssesmen',
      'customFields'
    ]);

    Object.keys(q).forEach(prop => {
      if (!knownKeys.has(prop)) {
        const colName = prop.replace(/([A-Z])/g, '_$1').toUpperCase();
        if (!columnSet.has(colName)) {
          columnSet.add(colName);
          dynamicColumns.push(colName);
        }
      }
    });
  });

  return [...STANDARD_QUESTION_COLUMNS, ...dynamicColumns];
}

/**
 * Exports questions into standard spreadsheet CSV format with auto-created columns.
 */
export function exportQuestionsToCsv(questions: Question[]): string {
  const columns = getAllQuestionSpreadsheetColumns(questions);
  const rows: string[] = [];

  // Header row
  rows.push(columns.join(','));

  // Data rows
  questions.forEach(q => {
    const rowValues = columns.map(col => {
      switch (col) {
        case 'NO_SOAL':
          return escapeCsvCell(q.no);
        case 'ID_SOAL':
          return escapeCsvCell(q.idSoal);
        case 'ID_STIMULUS':
          return escapeCsvCell(q.idStimulus);
        case 'ID_KOMPETENSI':
          return escapeCsvCell(q.idKompetensi);
        case 'MATA_PELAJARAN':
          return escapeCsvCell(q.mataPelajaran || 'Matematika');
        case 'ELEMEN':
          return escapeCsvCell(q.elemen);
        case 'INDIKATOR':
          return escapeCsvCell(q.indikator);
        case 'KONTEKS':
          return escapeCsvCell(q.konteks);
        case 'PROSES':
          return escapeCsvCell(q.proses);
        case 'BENTUK_TEKS':
          return escapeCsvCell(q.bentukTeks);
        case 'BENTUK_SOAL':
          return escapeCsvCell(q.bentukSoal);
        case 'TINGKAT_KESULITAN':
          return escapeCsvCell(q.tingkatKesulitan);
        case 'STIMULUS_JUDUL':
          return escapeCsvCell(q.stimulusJudul);
        case 'STIMULUS':
          return escapeCsvCell(q.stimulus);
        case 'SOAL':
          return escapeCsvCell(q.soal);
        case 'OPSI_A':
          return escapeCsvCell(q.opsiA || '');
        case 'OPSI_B':
          return escapeCsvCell(q.opsiB || '');
        case 'OPSI_C':
          return escapeCsvCell(q.opsiC || '');
        case 'OPSI_D':
          return escapeCsvCell(q.opsiD || '');
        case 'OPSI_E':
          return escapeCsvCell(q.opsiE || '');
        case 'PERNYATAAN_1':
          return escapeCsvCell(q.pernyataan1 || '');
        case 'PERNYATAAN_2':
          return escapeCsvCell(q.pernyataan2 || '');
        case 'PERNYATAAN_3':
          return escapeCsvCell(q.pernyataan3 || '');
        case 'KATEGORI_JAWABAN':
          return escapeCsvCell(q.kategoriJawaban || '');
        case 'KUNCI_JAWABAN':
          return escapeCsvCell(q.kunciJawaban);
        case 'KUNCI_TERSTRUKTUR':
          return escapeCsvCell(q.kunciTerstruktur ? JSON.stringify(q.kunciTerstruktur) : '');
        case 'SKOR_MAKSIMAL':
          return escapeCsvCell(q.skorMaksimal);
        case 'PEMBAHASAN':
          return escapeCsvCell(q.pembahasan);
        case 'KATA_KUNCI':
          return escapeCsvCell(q.kataKunci || '');
        case 'STATUS':
          return escapeCsvCell(q.status);
        case 'DURASI_TARGET_DETIK':
          return escapeCsvCell(q.durasiTargetDetik);
        case 'CATATAN_PENGEMBANG':
          return escapeCsvCell(q.catatanPengembang || '');
        case 'KELAS':
          return escapeCsvCell(q.kelas);
        case 'MATERI_KELAS':
          return escapeCsvCell(q.materiKelas);
        case 'BAB_ACUAN':
          return escapeCsvCell(q.babAcuan);
        case 'NOMOR_INDIKATOR_SUMBER':
          return escapeCsvCell(q.nomorIndikatorSumber || '');
        case 'STATUS_PEMETAAN':
          return escapeCsvCell(q.statusPemetaan || '');
        case 'PAKET_TRYOUT':
          return escapeCsvCell(q.paketTryout);
        case 'URUTAN_PAKET':
          return escapeCsvCell(q.urutanPaket);
        case 'VERSI_INDIKATOR':
          return escapeCsvCell(q.versiIndikator || '');
        case 'MODE_ASSESMEN':
          return escapeCsvCell(q.modeAssesmen || 'TRY OUT TKA SMP');
        default:
          // Check customFields or direct property
          if (q.customFields && q.customFields[col] !== undefined) {
            return escapeCsvCell(q.customFields[col]);
          }
          if ((q as any)[col] !== undefined) {
            return escapeCsvCell((q as any)[col]);
          }
          return '';
      }
    });

    rows.push(rowValues.join(','));
  });

  return rows.join('\n');
}

export function exportStudentsToCsv(students: any[]): string {
  const headers = ['NO', 'ID', 'NISN', 'NOMOR_INDUK', 'NAMA', 'KELAS', 'STATUS', 'TERDAFTAR_PADA', 'LOGIN_TERAKHIR'];
  const rows = [headers.join(',')];

  students.forEach((s, idx) => {
    rows.push([
      idx + 1,
      escapeCsvCell(s.id),
      escapeCsvCell(s.nisn),
      escapeCsvCell(s.nomorInduk),
      escapeCsvCell(s.nama),
      escapeCsvCell(s.kelas),
      escapeCsvCell(s.status),
      escapeCsvCell(s.registeredAt),
      escapeCsvCell(s.lastLoginAt || '-'),
    ].join(','));
  });

  return rows.join('\n');
}
