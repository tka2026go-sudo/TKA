import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Question,
  Student,
  ExamSchedule,
  SecuritySettings,
  ExamSession,
  AuditLogEntry,
  GoogleSheetsConfig,
} from '../types';
import { RAW_QUESTIONS_CSV } from './rawCsvData';
import { parseQuestionsCsv } from './csvParser';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.resolve(DATA_DIR, 'cbt_store.json');

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  monitorVisibility: true,
  penaltySeconds: 60,
  maxPenaltySeconds: 600,
  alertOnReturn: true,
  allowContinueAfterPenalty: true,
  penaltyMode: 'deduct',
};

const DEFAULT_GOOGLE_SHEETS_CONFIG: GoogleSheetsConfig = {
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1J9YMPLcgKuF7GnPwaYJCHAXdKeOTEQD2CcEVPaxzHaM/edit?usp=sharing',
  spreadsheetId: '1J9YMPLcgKuF7GnPwaYJCHAXdKeOTEQD2CcEVPaxzHaM',
  apiKey: '',
  serviceAccountEmail: '',
  privateKeyConfigured: false,
  lastSyncStatus: 'IDLE',
  lastSyncMessage: 'Belum dilakukan sinkronisasi.',
};

export interface AppStoreData {
  questions: Question[];
  students: Student[];
  examSchedules: ExamSchedule[];
  securitySettings: SecuritySettings;
  examSessions: Record<string, ExamSession>;
  auditLogs: AuditLogEntry[];
  googleSheetsConfig: GoogleSheetsConfig;
  adminPasswordHash: string;
}

export class AppStore {
  private data: AppStoreData;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  public hashPassword(raw: string): string {
    const salt = 'tka_smp_salt_2026';
    return crypto.createHash('sha256').update(raw + salt).digest('hex');
  }

  private loadOrInitialize(): AppStoreData {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.questions && parsed.questions.length > 0) {
          // Remove all dummy test students and their dummy sessions
          const DUMMY_NISNS = ['0091234567', '0092345678', '0093456789', '0094567890', '0085678901', '0076789012'];
          parsed.students = (parsed.students || []).filter(
            (s: Student) => !s.id.startsWith('std_0') && !DUMMY_NISNS.includes(s.nisn)
          );
          if (parsed.examSessions) {
            for (const [key, session] of Object.entries(parsed.examSessions)) {
              if (DUMMY_NISNS.includes((session as ExamSession).studentNisn)) {
                delete parsed.examSessions[key];
              }
            }
          }

          // Ensure all questions have mataPelajaran
          parsed.questions.forEach((q: Question) => {
            if (!q.mataPelajaran) {
              q.mataPelajaran = 'Matematika';
            }
          });

          // Ensure all examSchedules have mataPelajaran
          if (parsed.examSchedules) {
            parsed.examSchedules.forEach((sch: ExamSchedule) => {
              if (!sch.mataPelajaran) {
                sch.mataPelajaran = 'Matematika';
              }
            });
          }

          return parsed;
        }
      } catch (err) {
        console.error('Error reading store file, re-initializing:', err);
      }
    }

    // Initialize with real questions from CSV
    const parsedQuestions = parseQuestionsCsv(RAW_QUESTIONS_CSV);
    console.log(`Parsed ${parsedQuestions.length} real questions from CSV seed.`);

    const todayStr = new Date().toISOString().split('T')[0];

    const initialSchedules: ExamSchedule[] = [
      {
        id: 'sch_paket_a',
        paketId: 'A',
        mataPelajaran: 'Matematika',
        title: 'Try Out TKA SMP Matematika — Paket A (Standar Nasional)',
        description: 'Ujian Kemampuan Akademik Matematika SMP (30 Butir Soal Terstandar: Bilangan, Aljabar, Geometri, Data & Peluang)',
        date: todayStr,
        startTime: '07:00',
        endTime: '23:59',
        durationMinutes: 90,
        status: 'SEDANG_BERLANGSUNG',
        allowedClasses: ['VII', 'VIII', 'IX', 'SEMUA', 'IX-A', 'IX-B', 'VIII-A', 'VII-A'],
        maxAttempts: 1,
        randomizeQuestions: false,
        randomizeOptions: false,
        publishScores: true,
        publishKeys: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sch_paket_b',
        paketId: 'B',
        mataPelajaran: 'Matematika',
        title: 'Try Out TKA SMP Matematika — Paket B (Variasi Stimulus)',
        description: 'Ujian Kemampuan Akademik Matematika SMP (30 Butir Soal: Bilangan Berpangkat, Pertidaksamaan, Teorema Pythagoras, Peluang)',
        date: todayStr,
        startTime: '07:00',
        endTime: '23:59',
        durationMinutes: 90,
        status: 'SEDANG_BERLANGSUNG',
        allowedClasses: ['VII', 'VIII', 'IX', 'SEMUA', 'IX-A', 'IX-B', 'VIII-A', 'VII-A'],
        maxAttempts: 1,
        randomizeQuestions: false,
        randomizeOptions: false,
        publishScores: true,
        publishKeys: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sch_paket_c',
        paketId: 'C',
        mataPelajaran: 'Matematika',
        title: 'Try Out TKA SMP Matematika — Paket C (Penalaran Kompleks)',
        description: 'Ujian Kemampuan Akademik Matematika SMP (30 Butir Soal Tingkat Tinggi: Pemodelan Aljabar, Transformasi, Analisis Ruang)',
        date: todayStr,
        startTime: '07:00',
        endTime: '23:59',
        durationMinutes: 90,
        status: 'SEDANG_BERLANGSUNG',
        allowedClasses: ['VII', 'VIII', 'IX', 'SEMUA', 'IX-A', 'IX-B', 'VIII-A', 'VII-A'],
        maxAttempts: 1,
        randomizeQuestions: false,
        randomizeOptions: false,
        publishScores: true,
        publishKeys: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const initialData: AppStoreData = {
      questions: parsedQuestions,
      students: [], // No dummy students
      examSchedules: initialSchedules,
      securitySettings: DEFAULT_SECURITY_SETTINGS,
      examSessions: {},
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Sistem Inisialisasi',
          actorRole: 'SYSTEM',
          action: 'STORE_INITIALIZED',
          details: `Memuat 90 butir soal autentik TKA SMP dan 3 paket ujian (Paket A, B, C). Akun proktor siap digunakan.`,
        },
      ],
      googleSheetsConfig: DEFAULT_GOOGLE_SHEETS_CONFIG,
      adminPasswordHash: this.hashPassword('admin123'), // initial admin password
    };

    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write initial store:', e);
    }

    return initialData;
  }

  public save(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to persist store:', err);
      }
    }, 100);
  }

  // Getters
  public getQuestions(): Question[] {
    return this.data.questions;
  }

  public getQuestionById(id: string): Question | undefined {
    return this.data.questions.find(q => q.idSoal === id);
  }

  public getQuestionsByPackage(paket: string): Question[] {
    return this.data.questions
      .filter(q => q.paketTryout.toUpperCase() === paket.toUpperCase() && q.status === 'AKTIF')
      .sort((a, b) => a.urutanPaket - b.urutanPaket);
  }

  public setQuestions(questions: Question[]): void {
    this.data.questions = questions;
    this.save();
  }

  public addOrUpdateQuestion(question: Question): void {
    const idx = this.data.questions.findIndex(q => q.idSoal === question.idSoal);
    if (idx >= 0) {
      this.data.questions[idx] = question;
    } else {
      this.data.questions.push(question);
    }
    this.save();
  }

  public getStudents(): Student[] {
    return this.data.students;
  }

  public getStudentByNisn(nisn: string): Student | undefined {
    return this.data.students.find(s => s.nisn === nisn);
  }

  public addOrUpdateStudent(student: Student): void {
    const idx = this.data.students.findIndex(s => s.nisn === student.nisn);
    if (idx >= 0) {
      this.data.students[idx] = student;
    } else {
      this.data.students.push(student);
    }
    this.save();
  }

  public getSchedules(): ExamSchedule[] {
    return this.data.examSchedules;
  }

  public getScheduleById(id: string): ExamSchedule | undefined {
    return this.data.examSchedules.find(s => s.id === id);
  }

  public addOrUpdateSchedule(schedule: ExamSchedule): void {
    const idx = this.data.examSchedules.findIndex(s => s.id === schedule.id);
    if (idx >= 0) {
      this.data.examSchedules[idx] = schedule;
    } else {
      this.data.examSchedules.push(schedule);
    }
    this.save();
  }

  public getSecuritySettings(): SecuritySettings {
    return this.data.securitySettings;
  }

  public updateSecuritySettings(settings: Partial<SecuritySettings>): void {
    this.data.securitySettings = {
      ...this.data.securitySettings,
      ...settings,
    };
    this.save();
  }

  public getSessions(): Record<string, ExamSession> {
    return this.data.examSessions;
  }

  public getSession(sessionId: string): ExamSession | undefined {
    return this.data.examSessions[sessionId];
  }

  public getSessionByStudentAndExam(studentNisn: string, examId: string): ExamSession | undefined {
    return Object.values(this.data.examSessions).find(
      s => s.studentNisn === studentNisn && s.examId === examId
    );
  }

  public saveSession(session: ExamSession): void {
    this.data.examSessions[session.id] = session;
    this.save();
  }

  public deleteSession(sessionId: string): void {
    delete this.data.examSessions[sessionId];
    this.save();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.data.auditLogs;
  }

  public logAudit(actor: string, actorRole: 'ADMIN' | 'STUDENT' | 'SYSTEM', action: string, details: string, ip?: string): void {
    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor,
      actorRole,
      action,
      details,
      ip,
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
  }

  public getGoogleSheetsConfig(): GoogleSheetsConfig {
    return this.data.googleSheetsConfig;
  }

  public updateGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>): void {
    this.data.googleSheetsConfig = {
      ...this.data.googleSheetsConfig,
      ...config,
    };
    this.save();
  }

  public verifyAdminPassword(raw: string): boolean {
    return this.hashPassword(raw) === this.data.adminPasswordHash;
  }

  public setAdminPassword(newPassword: string): void {
    this.data.adminPasswordHash = this.hashPassword(newPassword);
    this.save();
  }
}

export const store = new AppStore();
