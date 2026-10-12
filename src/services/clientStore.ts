import {
  Question,
  Student,
  ExamSchedule,
  SecuritySettings,
  ExamSession,
  AuditLogEntry,
  GoogleSheetsConfig,
  ViolationEvent,
} from '../types';
import { RAW_QUESTIONS_CSV } from '../server/rawCsvData';
import {
  parseQuestionsCsv,
  exportQuestionsToCsv,
  exportStudentsToCsv,
  getAllQuestionSpreadsheetColumns,
  STANDARD_QUESTION_COLUMNS,
} from '../server/csvParser';
import { gradeExamSession } from '../server/gradingEngine';

const LOCAL_STORAGE_KEY = 'cbt_tka_client_store_v1';

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

const DEMO_STUDENTS: Student[] = [
  {
    id: 'std_demo_1',
    nisn: '0081234567',
    nomorInduk: '2401',
    nama: 'Ahmad Fauzan',
    kelas: 'IX-A',
    status: 'AKTIF',
    registeredAt: new Date().toISOString(),
  },
  {
    id: 'std_demo_2',
    nisn: '0082345678',
    nomorInduk: '2402',
    nama: 'Siti Rahmawati',
    kelas: 'IX-A',
    status: 'AKTIF',
    registeredAt: new Date().toISOString(),
  },
  {
    id: 'std_demo_3',
    nisn: '0083456789',
    nomorInduk: '2403',
    nama: 'Budi Pratama',
    kelas: 'IX-B',
    status: 'AKTIF',
    registeredAt: new Date().toISOString(),
  },
];

interface ClientStoreState {
  questions: Question[];
  students: Student[];
  examSchedules: ExamSchedule[];
  securitySettings: SecuritySettings;
  examSessions: Record<string, ExamSession>;
  auditLogs: AuditLogEntry[];
  googleSheetsConfig: GoogleSheetsConfig;
  adminPassword: string;
}

export class ClientStore {
  private state: ClientStoreState;

  constructor() {
    this.state = this.loadOrInit();
  }

  private loadOrInit(): ClientStoreState {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            // Ensure mataPelajaran is populated
            parsed.questions.forEach((q: Question) => {
              if (!q.mataPelajaran) q.mataPelajaran = 'Matematika';
            });
            if (parsed.examSchedules) {
              parsed.examSchedules.forEach((sch: ExamSchedule) => {
                if (!sch.mataPelajaran) sch.mataPelajaran = 'Matematika';
              });
            }
            if (!parsed.adminPassword) {
              parsed.adminPassword = 'admin123';
            }
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[ClientStore] Failed to read from localStorage:', e);
      }
    }

    // Default seed
    const questions = parseQuestionsCsv(RAW_QUESTIONS_CSV);
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

    const initial: ClientStoreState = {
      questions,
      students: DEMO_STUDENTS,
      examSchedules: initialSchedules,
      securitySettings: DEFAULT_SECURITY_SETTINGS,
      examSessions: {},
      auditLogs: [
        {
          id: `log_init_${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Sistem Standalone (Netlify)',
          actorRole: 'SYSTEM',
          action: 'CLIENT_STORE_INITIALIZED',
          details: `Memuat ${questions.length} butir soal autentik dan 3 paket ujian. Siap digunakan secara mandiri.`,
        },
      ],
      googleSheetsConfig: DEFAULT_GOOGLE_SHEETS_CONFIG,
      adminPassword: 'admin123',
    };

    this.save(initial);
    return initial;
  }

  private save(stateToSave?: ClientStoreState): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave || this.state));
      } catch (e) {
        console.warn('[ClientStore] Failed to save state to localStorage:', e);
      }
    }
  }

  public logAudit(actor: string, actorRole: 'ADMIN' | 'STUDENT' | 'SYSTEM', action: string, details: string): void {
    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor,
      actorRole,
      action,
      details,
    };
    this.state.auditLogs.unshift(entry);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
    this.save();
  }

  // --- Auth ---
  public login(username: string, password: string, role?: string) {
    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();
    const lowerUser = cleanUser.toLowerCase();

    const isProktorOrAdmin =
      role === 'ADMIN' ||
      lowerUser === 'admin' ||
      lowerUser === 'proktor' ||
      lowerUser === 'proctor' ||
      lowerUser === 'pengawas';

    if (isProktorOrAdmin) {
      // Check password against stored password or default admin123
      const validPass = this.state.adminPassword || 'admin123';
      if (cleanPass === validPass || cleanPass === 'admin123') {
        const token = `standalone_admin_${Date.now()}`;
        this.logAudit('Proktor / Administrator', 'ADMIN', 'LOGIN_SUCCESS', `Login berhasil sebagai proktor/admin (${cleanUser})`);
        return {
          token,
          role: 'ADMIN' as const,
          name: 'Proktor / Administrator CBT TKA',
        };
      } else {
        this.logAudit(cleanUser, 'ADMIN', 'LOGIN_FAILED', 'Password proktor/admin salah');
        throw new Error('Kredensial Proktor / Admin tidak valid. Periksa kembali username dan kata sandi.');
      }
    }

    // Student Login
    let student = this.state.students.find(s => s.nisn === cleanUser);
    if (!student) {
      // Auto-register student if logging in with valid NISN format
      if (/^\d{5,10}$/.test(cleanUser)) {
        student = {
          id: `std_${Date.now()}`,
          nisn: cleanUser,
          nomorInduk: cleanPass || '1001',
          nama: `Peserta CBT (${cleanUser})`,
          kelas: 'IX-A',
          status: 'AKTIF',
          registeredAt: new Date().toISOString(),
        };
        this.state.students.push(student);
        this.save();
      }
    }

    if (!student || student.status !== 'AKTIF') {
      // Fallback: If someone used admin password with admin username
      if ((cleanPass === this.state.adminPassword || cleanPass === 'admin123') && (lowerUser.includes('admin') || lowerUser.includes('proktor'))) {
        const token = `standalone_admin_${Date.now()}`;
        return {
          token,
          role: 'ADMIN' as const,
          name: 'Proktor / Administrator CBT TKA',
        };
      }
      throw new Error('Data siswa dengan NISN tersebut tidak ditemukan atau berstatus nonaktif.');
    }

    // Verify student password/nomorInduk
    const expectedPass = student.password || student.nomorInduk;
    if (expectedPass && cleanPass !== expectedPass && cleanPass !== student.nomorInduk) {
      throw new Error('Kata sandi / Nomor Induk siswa tidak cocok.');
    }

    student.lastLoginAt = new Date().toISOString();
    this.save();
    const token = `standalone_student_${student.nisn}_${Date.now()}`;
    this.logAudit(student.nama, 'STUDENT', 'LOGIN_SUCCESS', `Siswa login dengan NISN ${student.nisn}`);

    return {
      token,
      role: 'STUDENT' as const,
      name: student.nama,
      nisn: student.nisn,
      kelas: student.kelas,
      nomorInduk: student.nomorInduk,
      mustChangePassword: student.mustChangePassword,
    };
  }

  public getMe(token: string) {
    if (token.startsWith('standalone_admin_') || token.startsWith('token_admin_')) {
      return {
        role: 'ADMIN' as const,
        name: 'Proktor / Administrator CBT TKA',
      };
    }

    // Student token
    const parts = token.split('_');
    const nisn = parts[2];
    const student = this.state.students.find(s => s.nisn === nisn);
    if (student) {
      return {
        role: 'STUDENT' as const,
        name: student.nama,
        nisn: student.nisn,
        kelas: student.kelas,
        nomorInduk: student.nomorInduk,
        mustChangePassword: student.mustChangePassword,
      };
    }

    // Default admin fallback
    return {
      role: 'ADMIN' as const,
      name: 'Proktor / Administrator CBT TKA',
    };
  }

  public changePassword(newPassword: string) {
    this.state.adminPassword = newPassword;
    this.save();
    this.logAudit('Administrator', 'ADMIN', 'PASSWORD_CHANGED', 'Kata sandi proktor berhasil diperbarui');
    return { success: true, message: 'Kata sandi berhasil diperbarui.' };
  }

  // --- Questions ---
  public getQuestions(params: { paket?: string; mapel?: string; elemen?: string; bentuk?: string; search?: string } = {}) {
    let list = [...this.state.questions];

    if (params.paket && params.paket !== 'SEMUA') {
      list = list.filter(q => q.paketTryout === params.paket);
    }
    if (params.mapel && params.mapel !== 'SEMUA') {
      list = list.filter(q => (q.mataPelajaran || 'Matematika').toLowerCase() === params.mapel!.toLowerCase());
    }
    if (params.elemen && params.elemen !== 'SEMUA') {
      list = list.filter(q => q.elemen === params.elemen);
    }
    if (params.bentuk && params.bentuk !== 'SEMUA') {
      list = list.filter(q => q.bentukSoal === params.bentuk);
    }
    if (params.search) {
      const qLower = params.search.toLowerCase();
      list = list.filter(q =>
        q.idSoal.toLowerCase().includes(qLower) ||
        q.soal.toLowerCase().includes(qLower) ||
        (q.stimulusJudul && q.stimulusJudul.toLowerCase().includes(qLower)) ||
        (q.indikator && q.indikator.toLowerCase().includes(qLower))
      );
    }

    return { questions: list };
  }

  public saveQuestion(question: Question) {
    if (!question.mataPelajaran) {
      question.mataPelajaran = 'Matematika';
    }
    const idx = this.state.questions.findIndex(q => q.idSoal === question.idSoal);
    if (idx >= 0) {
      this.state.questions[idx] = question;
      this.logAudit('Administrator', 'ADMIN', 'QUESTION_UPDATED', `Memperbarui soal ${question.idSoal} (${question.mataPelajaran})`);
    } else {
      this.state.questions.push(question);
      this.logAudit('Administrator', 'ADMIN', 'QUESTION_CREATED', `Menambah butir soal baru ${question.idSoal} (${question.mataPelajaran})`);
    }
    this.save();
    return { success: true, question };
  }

  public importQuestionsCsv(csvText: string, mode: 'replace' | 'append' = 'append') {
    const parsed = parseQuestionsCsv(csvText);
    if (parsed.length === 0) {
      throw new Error('Tidak ada data butir soal yang valid dalam berkas CSV.');
    }

    if (mode === 'replace') {
      this.state.questions = parsed;
    } else {
      const existingMap = new Map(this.state.questions.map(q => [q.idSoal, q]));
      for (const q of parsed) {
        existingMap.set(q.idSoal, q);
      }
      this.state.questions = Array.from(existingMap.values());
    }

    this.save();
    this.logAudit('Administrator', 'ADMIN', 'CSV_QUESTIONS_IMPORTED', `Mengimpor ${parsed.length} butir soal via CSV (${mode})`);
    return {
      success: true,
      count: parsed.length,
      message: `Berhasil mengimpor ${parsed.length} butir soal (${mode === 'replace' ? 'menimpa data lama' : 'menambahkan/memperbarui'}).`,
    };
  }

  public getExportQuestionsCsv(paket?: string, mapel?: string): string {
    let questions = this.state.questions;
    if (paket && paket !== 'SEMUA') {
      questions = questions.filter(q => q.paketTryout === paket);
    }
    if (mapel && mapel !== 'SEMUA') {
      questions = questions.filter(q => (q.mataPelajaran || 'Matematika').toLowerCase() === mapel.toLowerCase());
    }
    return exportQuestionsToCsv(questions);
  }

  public getQuestionsTemplateCsv(): string {
    return exportQuestionsToCsv(this.state.questions.slice(0, 3));
  }

  // --- Schedules ---
  public getSchedules() {
    return { schedules: this.state.examSchedules };
  }

  public saveSchedule(schedule: ExamSchedule) {
    if (!schedule.mataPelajaran) {
      schedule.mataPelajaran = 'Matematika';
    }
    const idx = this.state.examSchedules.findIndex(s => s.id === schedule.id);
    if (idx >= 0) {
      this.state.examSchedules[idx] = schedule;
      this.logAudit('Administrator', 'ADMIN', 'SCHEDULE_UPDATED', `Memperbarui jadwal ujian: ${schedule.title} (${schedule.mataPelajaran})`);
    } else {
      this.state.examSchedules.push(schedule);
      this.logAudit('Administrator', 'ADMIN', 'SCHEDULE_CREATED', `Membuat jadwal ujian baru: ${schedule.title} (${schedule.mataPelajaran})`);
    }
    this.save();
    return { success: true, schedule };
  }

  // --- Security Settings ---
  public getSecuritySettings() {
    return { settings: this.state.securitySettings };
  }

  public updateSecuritySettings(settings: Partial<SecuritySettings>) {
    this.state.securitySettings = {
      ...this.state.securitySettings,
      ...settings,
    };
    this.save();
    this.logAudit('Administrator', 'ADMIN', 'SECURITY_UPDATED', 'Pengaturan keamanan dan deteksi kecurangan diperbarui');
    return { success: true, settings: this.state.securitySettings };
  }

  // --- Students ---
  public getStudents() {
    return { students: this.state.students };
  }

  public saveStudent(studentData: Partial<Student>) {
    if (studentData.id) {
      const idx = this.state.students.findIndex(s => s.id === studentData.id);
      if (idx >= 0) {
        this.state.students[idx] = { ...this.state.students[idx], ...studentData } as Student;
        this.save();
        return { success: true, student: this.state.students[idx] };
      }
    }
    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nisn: studentData.nisn || '',
      nomorInduk: studentData.nomorInduk || '',
      nama: studentData.nama || '',
      kelas: studentData.kelas || 'IX-A',
      status: studentData.status || 'AKTIF',
      registeredAt: new Date().toISOString(),
    };
    this.state.students.push(newStudent);
    this.save();
    return { success: true, student: newStudent };
  }

  public resetStudentPassword(nisn: string) {
    const student = this.state.students.find(s => s.nisn === nisn);
    if (student) {
      student.password = student.nomorInduk;
      this.save();
    }
    return { success: true, message: 'Kata sandi siswa berhasil direset ke nomor induk.' };
  }

  public importStudentsCsv(csvText: string) {
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      throw new Error('Berkas CSV kosong atau tidak memiliki baris data.');
    }
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 3) {
        const nisn = cols[1] || cols[0];
        const nama = cols[3] || cols[2] || `Siswa ${nisn}`;
        const nomorInduk = cols[2] || cols[1] || '1001';
        const kelas = cols[4] || 'IX-A';
        const existing = this.state.students.find(s => s.nisn === nisn);
        if (existing) {
          existing.nama = nama;
          existing.nomorInduk = nomorInduk;
          existing.kelas = kelas;
        } else {
          this.state.students.push({
            id: `std_${Date.now()}_${count}`,
            nisn,
            nomorInduk,
            nama,
            kelas,
            status: 'AKTIF',
            registeredAt: new Date().toISOString(),
          });
        }
        count++;
      }
    }
    this.save();
    return { success: true, count, message: `Berhasil mengimpor ${count} data murid.` };
  }

  public getExportStudentsCsv(): string {
    return exportStudentsToCsv(this.state.students);
  }

  public getExportResultsCsv(examId: string): string {
    const exam = this.state.examSchedules.find(e => e.id === examId) || this.state.examSchedules[0];
    const sessions = Object.values(this.state.examSessions).filter(s => s.examId === examId);
    const mapelName = exam.mataPelajaran || 'Matematika';
    let csv = 'PERINGKAT,NISN,NAMA_MURID,KELAS,MATA_PELAJARAN,STATUS,NILAI_TOTAL,SKOR_MAKSIMAL,PERSENTASE,BENAR,SALAH,PELANGGARAN,TOTAL_PENALTI_DETIK,WAKTU_MULAI,WAKTU_SELESAI\n';

    sessions.sort((a, b) => (b.score?.totalScore || 0) - (a.score?.totalScore || 0));

    sessions.forEach((s, idx) => {
      const student = this.state.students.find(st => st.nisn === s.studentNisn);
      const studentName = student?.nama || `Peserta ${s.studentNisn}`;
      const studentClass = student?.kelas || 'IX-A';
      const rank = idx + 1;
      const scoreVal = s.score ? s.score.totalScore : 0;
      const maxVal = s.score ? s.score.maxScore : 30;
      const pctVal = s.score ? s.score.percentage : 0;
      const correctVal = s.score ? s.score.correctCount : 0;
      const incorrectVal = s.score ? s.score.incorrectCount : 0;
      const violVal = s.violations ? s.violations.length : 0;
      const penVal = s.totalPenaltySeconds || 0;

      csv += `${rank},"${s.studentNisn}","${studentName}","${studentClass}","${mapelName}","${s.status}",${scoreVal},${maxVal},${pctVal}%,${correctVal},${incorrectVal},${violVal},${penVal},"${s.startTime}","${s.submittedAt || ''}"\n`;
    });

    return csv;
  }

  // --- Overview & Results ---
  public getAdminOverview() {
    const paketCounts: Record<string, number> = {};
    for (const q of this.state.questions) {
      paketCounts[q.paketTryout] = (paketCounts[q.paketTryout] || 0) + 1;
    }

    const sessions = Object.values(this.state.examSessions);
    const activeSessions = sessions.filter(s => s.status === 'IN_PROGRESS');
    const submittedSessions = sessions.filter(s => s.status === 'SUBMITTED');

    let totalViolations = 0;
    let totalPenaltySeconds = 0;
    let sumPercentages = 0;
    let scoreCount = 0;

    for (const s of sessions) {
      totalViolations += s.violations?.length || 0;
      totalPenaltySeconds += s.totalPenaltySeconds || 0;
      if (s.score) {
        sumPercentages += s.score.percentage;
        scoreCount++;
      }
    }

    return {
      totalQuestions: this.state.questions.length,
      paketCounts,
      totalStudents: this.state.students.length,
      totalSchedules: this.state.examSchedules.length,
      activeSessionsCount: activeSessions.length,
      submittedSessionsCount: submittedSessions.length,
      totalViolations,
      totalPenaltySeconds,
      averagePercentage: scoreCount > 0 ? Math.round(sumPercentages / scoreCount) : 0,
    };
  }

  public getAdminMonitoring(examId: string) {
    const exam = this.state.examSchedules.find(e => e.id === examId) || this.state.examSchedules[0];
    const questions = this.state.questions.filter(q => q.paketTryout === exam.paketId);
    const sessions = Object.values(this.state.examSessions).filter(s => s.examId === examId);

    const participants = sessions.map(s => {
      const student = this.state.students.find(st => st.nisn === s.studentNisn);
      return {
        sessionId: s.id,
        studentNisn: s.studentNisn,
        studentName: student?.nama || `Siswa ${s.studentNisn}`,
        kelas: student?.kelas || 'IX-A',
        status: s.status,
        startTime: s.startTime,
        remainingSeconds: Math.max(0, Math.floor((new Date(s.effectiveEndTime).getTime() - Date.now()) / 1000)),
        answeredCount: Object.keys(s.answers || {}).length,
        totalQuestions: questions.length,
        violationsCount: s.violations?.length || 0,
        totalPenaltySeconds: s.totalPenaltySeconds || 0,
        scoreResult: s.score,
      };
    });

    return {
      exam,
      questionsCount: questions.length,
      participants,
    };
  }

  public getAdminResults(examId: string) {
    const exam = this.state.examSchedules.find(e => e.id === examId) || this.state.examSchedules[0];
    const questions = this.state.questions.filter(q => q.paketTryout === exam.paketId);
    const sessions = Object.values(this.state.examSessions).filter(s => s.examId === examId && s.status === 'SUBMITTED');

    let sum = 0;
    let highest = 0;
    let lowest = 100;

    const results = sessions.map(s => {
      const student = this.state.students.find(st => st.nisn === s.studentNisn);
      const score = s.score?.percentage || 0;
      sum += score;
      if (score > highest) highest = score;
      if (score < lowest) lowest = score;

      return {
        sessionId: s.id,
        nisn: s.studentNisn,
        nama: student?.nama || `Siswa ${s.studentNisn}`,
        kelas: student?.kelas || 'IX-A',
        mataPelajaran: exam.mataPelajaran || 'Matematika',
        paketId: exam.paketId,
        score: s.score ? {
          totalScore: s.score.totalScore,
          maxScore: s.score.maxScore,
          percentage: s.score.percentage,
          correctCount: s.score.correctCount,
          incorrectCount: s.score.incorrectCount,
        } : null,
        violationsCount: s.violations?.length || 0,
        penaltySeconds: s.totalPenaltySeconds || 0,
        submittedAt: s.submittedAt || s.startTime,
      };
    });

    return {
      exam,
      totalQuestions: questions.length,
      totalParticipants: sessions.length,
      totalCompleted: sessions.length,
      avgScore: sessions.length > 0 ? Math.round(sum / sessions.length) : 0,
      highestScore: sessions.length > 0 ? highest : 0,
      lowestScore: sessions.length > 0 ? lowest : 0,
      results,
    };
  }

  public forceSubmit(sessionId: string) {
    const session = this.state.examSessions[sessionId];
    if (session) {
      session.status = 'SUBMITTED';
      session.submittedAt = new Date().toISOString();
      const exam = this.state.examSchedules.find(e => e.id === session.examId);
      const questions = this.state.questions.filter(q => q.paketTryout === exam?.paketId);
      session.score = gradeExamSession(questions, session.answers || {});
      this.save();
    }
    return { success: true, message: 'Sesi ujian berhasil diselesaikan paksa.' };
  }

  public resetSession(sessionId: string) {
    delete this.state.examSessions[sessionId];
    this.save();
    return { success: true, message: 'Sesi ujian berhasil direset.' };
  }

  // --- Audit Logs ---
  public getAuditLogs() {
    return { logs: this.state.auditLogs };
  }

  // --- Google Sheets ---
  public getGoogleSheetsConfig() {
    return { config: this.state.googleSheetsConfig };
  }

  public updateGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>) {
    this.state.googleSheetsConfig = {
      ...this.state.googleSheetsConfig,
      ...config,
    };
    this.save();
    return { success: true, config: this.state.googleSheetsConfig };
  }

  public getSpreadsheetSchemaStatus() {
    const allCols = getAllQuestionSpreadsheetColumns(this.state.questions);
    const autoCols = allCols.filter(c => !STANDARD_QUESTION_COLUMNS.includes(c) || c === 'MATA_PELAJARAN');

    return {
      totalColumns: allCols.length,
      allColumns: allCols,
      autoCreatedColumns: autoCols,
      standardColumnsCount: STANDARD_QUESTION_COLUMNS.length,
      hasMataPelajaran: allCols.includes('MATA_PELAJARAN'),
      totalQuestions: this.state.questions.length,
    };
  }

  public ensureSpreadsheetColumns() {
    const allCols = getAllQuestionSpreadsheetColumns(this.state.questions);
    const autoCols = allCols.filter(c => !STANDARD_QUESTION_COLUMNS.includes(c) || c === 'MATA_PELAJARAN');

    this.state.googleSheetsConfig.detectedColumns = allCols;
    this.state.googleSheetsConfig.autoCreatedColumns = autoCols;
    this.save();

    this.logAudit(
      'Administrator',
      'ADMIN',
      'SPREADSHEET_SCHEMA_SYNCED',
      `Sinkronisasi schema otomatis berhasil: ${allCols.length} kolom terdeteksi, ${autoCols.length} kolom auto-create (termasuk MATA_PELAJARAN)`
    );

    return {
      success: true,
      message: `Berhasil memastikan seluruh ${allCols.length} kolom input admin tersedia di spreadsheet.`,
      allColumns: allCols,
      autoCreatedColumns: autoCols,
    };
  }

  public async syncQuestionsFromSheets() {
    const config = this.state.googleSheetsConfig;
    if (!config.spreadsheetUrl) {
      throw new Error('URL Google Sheets belum dikonfigurasi.');
    }

    let csvUrl = config.spreadsheetUrl;
    if (csvUrl.includes('/edit')) {
      const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    try {
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`HTTP Error ${res.status} saat mengunduh CSV Google Sheets`);
      const csvText = await res.text();
      const questions = parseQuestionsCsv(csvText);
      if (questions.length === 0) {
        throw new Error('Tidak ada data butir soal valid yang ditemukan dalam Google Sheets.');
      }

      this.state.questions = questions;
      this.state.googleSheetsConfig.lastSyncStatus = 'SUCCESS';
      this.state.googleSheetsConfig.lastSyncAt = new Date().toISOString();
      this.state.googleSheetsConfig.lastSyncMessage = `Berhasil menyinkronkan ${questions.length} butir soal dari Google Sheets.`;

      const allCols = getAllQuestionSpreadsheetColumns(questions);
      this.state.googleSheetsConfig.detectedColumns = allCols;
      this.state.googleSheetsConfig.autoCreatedColumns = allCols.filter(c => !STANDARD_QUESTION_COLUMNS.includes(c) || c === 'MATA_PELAJARAN');

      this.save();
      this.logAudit('Administrator', 'ADMIN', 'SHEETS_SYNC_SUCCESS', `Menyinkronkan ${questions.length} butir soal dari Google Sheets`);

      return {
        success: true,
        count: questions.length,
        message: `Berhasil menyinkronkan ${questions.length} butir soal dari Google Sheets.`,
      };
    } catch (err: any) {
      this.state.googleSheetsConfig.lastSyncStatus = 'ERROR';
      this.state.googleSheetsConfig.lastSyncMessage = err.message || 'Gagal menyinkronkan dengan Google Sheets';
      this.save();
      throw err;
    }
  }

  // --- Student Exam ---
  public getStudentExams(studentNisn?: string) {
    const exams = this.state.examSchedules.map(sch => {
      const qCount = this.state.questions.filter(q => q.paketTryout === sch.paketId).length;
      let session: any = null;
      if (studentNisn) {
        session = Object.values(this.state.examSessions).find(
          s => s.studentNisn === studentNisn && s.examId === sch.id
        ) || null;
      }
      return {
        ...sch,
        questionsCount: qCount,
        session,
      };
    });
    return { exams };
  }

  public startExam(studentNisn: string, examId: string) {
    const exam = this.state.examSchedules.find(e => e.id === examId);
    if (!exam) throw new Error('Jadwal ujian tidak ditemukan.');

    const student = this.state.students.find(s => s.nisn === studentNisn);
    const studentName = student?.nama || `Peserta ${studentNisn}`;
    const studentClass = student?.kelas || 'IX-A';

    let existingSession = Object.values(this.state.examSessions).find(
      s => s.studentNisn === studentNisn && s.examId === examId
    );

    if (existingSession) {
      if (existingSession.status === 'SUBMITTED' || existingSession.status === 'TIME_OUT') {
        return {
          sessionId: existingSession.id,
          status: existingSession.status,
          startTime: existingSession.startTime,
          effectiveEndTime: existingSession.effectiveEndTime,
          alreadyCompleted: true,
          message: 'Anda telah menyelesaikan ujian ini.',
        };
      }
      return {
        sessionId: existingSession.id,
        status: existingSession.status,
        startTime: existingSession.startTime,
        effectiveEndTime: existingSession.effectiveEndTime,
      };
    }

    const durationSec = exam.durationMinutes * 60;
    const now = new Date();
    const endTime = new Date(now.getTime() + durationSec * 1000);

    const newSession: ExamSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentNisn,
      studentName,
      studentClass,
      examId,
      startTime: now.toISOString(),
      originalEndTime: endTime.toISOString(),
      effectiveEndTime: endTime.toISOString(),
      totalPenaltySeconds: 0,
      status: 'IN_PROGRESS',
      answers: {},
      reviewedQuestions: [],
      violations: [],
      lastHeartbeatAt: now.toISOString(),
    };

    this.state.examSessions[newSession.id] = newSession;
    this.save();

    return {
      sessionId: newSession.id,
      status: newSession.status,
      startTime: newSession.startTime,
      effectiveEndTime: newSession.effectiveEndTime,
    };
  }

  public getExamSession(sessionId: string) {
    const session = this.state.examSessions[sessionId];
    if (!session) throw new Error('Sesi ujian tidak ditemukan.');

    const exam = this.state.examSchedules.find(e => e.id === session.examId) || this.state.examSchedules[0];
    const questions = this.state.questions.filter(q => q.paketTryout === exam.paketId);

    // Calculate remaining seconds
    const now = Date.now();
    const end = new Date(session.effectiveEndTime).getTime();
    const remainingSeconds = Math.max(0, Math.floor((end - now) / 1000));

    return {
      session: {
        id: session.id,
        examId: session.examId,
        status: session.status,
        startTime: session.startTime,
        effectiveEndTime: session.effectiveEndTime,
        originalEndTime: session.originalEndTime,
        remainingSeconds,
        serverTime: new Date().toISOString(),
        totalPenaltySeconds: session.totalPenaltySeconds,
        violationsCount: session.violations?.length || 0,
        answers: session.answers,
        reviewedQuestions: session.reviewedQuestions,
      },
      exam: {
        id: exam.id,
        mataPelajaran: exam.mataPelajaran || 'Matematika',
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        paketId: exam.paketId,
      },
      securitySettings: this.state.securitySettings,
      questions,
    };
  }

  public saveAnswer(sessionId: string, questionId: string, answer: any) {
    const session = this.state.examSessions[sessionId];
    if (!session) throw new Error('Sesi tidak ditemukan.');
    session.answers[questionId] = answer;
    session.lastHeartbeatAt = new Date().toISOString();
    this.save();
    return { success: true, savedAt: session.lastHeartbeatAt };
  }

  public toggleReview(sessionId: string, questionId: string) {
    const session = this.state.examSessions[sessionId];
    if (!session) throw new Error('Sesi tidak ditemukan.');
    const idx = session.reviewedQuestions.indexOf(questionId);
    let isMarked = false;
    if (idx >= 0) {
      session.reviewedQuestions.splice(idx, 1);
    } else {
      session.reviewedQuestions.push(questionId);
      isMarked = true;
    }
    this.save();
    return { success: true, isMarked, reviewedQuestions: session.reviewedQuestions };
  }

  public reportViolation(sessionId: string, eventId: string, eventType: string, eventDescription: string) {
    const session = this.state.examSessions[sessionId];
    if (!session) throw new Error('Sesi tidak ditemukan.');

    const penalty = this.state.securitySettings.penaltySeconds || 60;
    session.totalPenaltySeconds += penalty;
    const currentEnd = new Date(session.effectiveEndTime).getTime();
    session.effectiveEndTime = new Date(currentEnd - penalty * 1000).toISOString();

    const now = Date.now();
    const remainingBefore = Math.max(0, Math.floor((currentEnd - now) / 1000));
    const remainingAfter = Math.max(0, Math.floor((new Date(session.effectiveEndTime).getTime() - now) / 1000));

    const violation: ViolationEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      eventType: eventType as any,
      eventDescription,
      penaltyApplied: penalty,
      remainingSecondsBefore: remainingBefore,
      remainingSecondsAfter: remainingAfter,
    };

    session.violations.push(violation);
    this.save();

    return {
      success: true,
      penaltyApplied: penalty,
      totalPenaltySeconds: session.totalPenaltySeconds,
      remainingSeconds: remainingAfter,
      effectiveEndTime: session.effectiveEndTime,
      violationsCount: session.violations.length,
      status: session.status,
      deduplicated: false,
    };
  }

  public heartbeat(sessionId: string) {
    const session = this.state.examSessions[sessionId];
    if (!session) throw new Error('Sesi tidak ditemukan.');

    const end = new Date(session.effectiveEndTime).getTime();
    const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
    session.lastHeartbeatAt = new Date().toISOString();

    return {
      status: session.status,
      serverTime: session.lastHeartbeatAt,
      remainingSeconds: remaining,
      totalPenaltySeconds: session.totalPenaltySeconds,
      violationsCount: session.violations.length,
      effectiveEndTime: session.effectiveEndTime,
    };
  }

  public submitExam(sessionId: string) {
    const session = this.state.examSessions[sessionId];
    if (!session) throw new Error('Sesi tidak ditemukan.');

    const exam = this.state.examSchedules.find(e => e.id === session.examId);
    const questions = this.state.questions.filter(q => q.paketTryout === exam?.paketId);

    session.status = 'SUBMITTED';
    session.submittedAt = new Date().toISOString();
    session.score = gradeExamSession(questions, session.answers || {});
    this.save();

    return {
      success: true,
      status: session.status,
      submittedAt: session.submittedAt,
    };
  }

  public getExamResult(sessionId: string) {
    const session = this.state.examSessions[sessionId];
    if (!session) throw new Error('Sesi ujian tidak ditemukan.');

    const exam = this.state.examSchedules.find(e => e.id === session.examId) || this.state.examSchedules[0];
    const questions = this.state.questions.filter(q => q.paketTryout === exam.paketId);

    if (!session.score) {
      session.score = gradeExamSession(questions, session.answers || {});
      this.save();
    }

    const student = this.state.students.find(st => st.nisn === session.studentNisn);

    return {
      session,
      exam,
      student: {
        nisn: session.studentNisn,
        nama: student?.nama || `Peserta ${session.studentNisn}`,
        kelas: student?.kelas || 'IX-A',
      },
      scoreResult: session.score,
      questions,
    };
  }
}

export const clientStore = new ClientStore();
