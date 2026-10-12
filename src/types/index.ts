export type QuestionType = 'PG' | 'PGK-MCMA' | 'PGK-Kategori';

export interface Question {
  no: number;
  idSoal: string;
  idStimulus: string;
  idKompetensi: string;
  mataPelajaran?: string; // e.g. "Matematika", "Bahasa Indonesia", "IPA", "Bahasa Inggris"
  elemen: string;
  indikator: string;
  konteks: string;
  proses: string;
  bentukTeks: string;
  bentukSoal: QuestionType;
  tingkatKesulitan: string;
  stimulusJudul: string;
  stimulus: string;
  soal: string;
  opsiA?: string;
  opsiB?: string;
  opsiC?: string;
  opsiD?: string;
  opsiE?: string;
  pernyataan1?: string;
  pernyataan2?: string;
  pernyataan3?: string;
  kategoriJawaban?: string; // e.g. "Benar | Salah", "Ekuivalen | Tidak Ekuivalen"
  kunciJawaban: string;
  kunciTerstruktur: any; // { correct: "C" } or { correct: ["A","B"] } or { "1": "Benar", "2": "Salah" }
  skorMaksimal: number;
  pembahasan: string;
  kataKunci?: string;
  status: 'AKTIF' | 'NONAKTIF';
  durasiTargetDetik: number;
  catatanPengembang?: string;
  kelas: string;
  materiKelas: string;
  babAcuan: string;
  nomorIndikatorSumber?: string;
  statusPemetaan?: string;
  paketTryout: 'A' | 'B' | 'C' | string;
  urutanPaket: number;
  versiIndikator?: string;
  modeAssesmen?: string;
  customFields?: Record<string, string>;
  [key: string]: any;
}

export interface Student {
  id: string;
  nisn: string;
  nomorInduk: string;
  nama: string;
  kelas: string;
  password?: string;
  passwordHash?: string;
  mustChangePassword?: boolean;
  status: 'AKTIF' | 'NONAKTIF';
  registeredAt: string;
  lastLoginAt?: string;
}

export interface SecuritySettings {
  monitorVisibility: boolean;
  penaltySeconds: number; // default 60
  maxPenaltySeconds: number; // default 600
  alertOnReturn: boolean;
  allowContinueAfterPenalty: boolean;
  penaltyMode: 'deduct' | 'log_only';
}

export interface ExamSchedule {
  id: string;
  paketId: string; // 'A' | 'B' | 'C'
  mataPelajaran?: string; // e.g. "Matematika", "Bahasa Indonesia", "IPA", "Bahasa Inggris"
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number; // e.g. 60 or 90
  status: 'DRAFT' | 'TERJADWAL' | 'SEDANG_BERLANGSUNG' | 'DIJEDA' | 'SELESAI' | 'DIBATALKAN';
  allowedClasses: string[]; // e.g. ['VII', 'VIII', 'IX', 'SEMUA']
  maxAttempts: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  publishScores: boolean;
  publishKeys: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ViolationEvent {
  id: string;
  timestamp: string;
  eventType: 'visibility_hidden' | 'page_hide' | 'fullscreen_exit';
  eventDescription: string;
  penaltyApplied: number; // seconds
  remainingSecondsBefore: number;
  remainingSecondsAfter: number;
}

export interface ExamSessionAnswer {
  questionId: string;
  answer: any; // e.g. "C", ["A", "B"], { "1": "Benar", "2": "Salah", "3": "Benar" }
  answeredAt: string;
  isMarkedForReview?: boolean;
}

export interface ExamScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  breakdown: {
    questionId: string;
    earnedScore: number;
    maxScore: number;
    isCorrect: boolean;
    studentAnswer: any;
    correctAnswer: any;
  }[];
}

export interface ExamSession {
  id: string;
  examId: string;
  studentNisn: string;
  studentName: string;
  studentClass: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'TIME_OUT';
  startTime: string; // ISO string
  originalEndTime: string; // ISO string
  effectiveEndTime: string; // ISO string (adjusted by penalties)
  submittedAt?: string;
  answers: Record<string, any>; // questionId -> answer
  reviewedQuestions: string[]; // questionId list
  violations: ViolationEvent[];
  totalPenaltySeconds: number;
  lastHeartbeatAt: string;
  score?: ExamScoreResult;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: 'ADMIN' | 'STUDENT' | 'SYSTEM';
  action: string;
  details: string;
  ip?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetUrl: string;
  spreadsheetId: string;
  apiKey: string;
  serviceAccountEmail: string;
  privateKeyConfigured: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: 'SUCCESS' | 'ERROR' | 'IDLE';
  lastSyncMessage?: string;
  detectedColumns?: string[];
  autoCreatedColumns?: string[];
}

export interface UserSession {
  token: string;
  role: 'ADMIN' | 'STUDENT';
  nisn?: string;
  name: string;
  kelas?: string;
  expiresAt: string;
}
