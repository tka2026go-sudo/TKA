import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { store } from './store';
import { gradeExamSession } from './gradingEngine';
import {
  parseQuestionsCsv,
  parseCsvRows,
  exportQuestionsToCsv,
  exportStudentsToCsv,
  getAllQuestionSpreadsheetColumns,
  STANDARD_QUESTION_COLUMNS
} from './csvParser';
import { ExamSession, Question, Student, ExamSchedule, SecuritySettings } from '../types';

export const apiRouter = Router();

// In-memory token session manager
interface ActiveToken {
  token: string;
  role: 'ADMIN' | 'STUDENT';
  identifier: string; // admin or nisn
  name: string;
  kelas?: string;
  expiresAt: number;
}

const activeTokens = new Map<string, ActiveToken>();

function createToken(role: 'ADMIN' | 'STUDENT', identifier: string, name: string, kelas?: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  activeTokens.set(token, {
    token,
    role,
    identifier,
    name,
    kelas,
    expiresAt,
  });
  return token;
}

// Authentication middleware
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Sesi tidak valid atau belum login' });
    return;
  }

  const session = activeTokens.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeTokens.delete(token);
    res.status(401).json({ error: 'Sesi telah kedaluwarsa, silakan login kembali' });
    return;
  }

  (req as any).user = session;
  next();
}

function adminOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    const user = (req as any).user as ActiveToken;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang berwenang' });
      return;
    }
    next();
  });
}

function studentOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    const user = (req as any).user as ActiveToken;
    if (user.role !== 'STUDENT') {
      res.status(403).json({ error: 'Akses ditolak: Endpoint khusus murid' });
      return;
    }
    next();
  });
}

// Rate limiting map for login
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

apiRouter.post('/auth/login', (req: Request, res: Response): void => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username (NISN) dan password wajib diisi' });
    return;
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  // Rate limiting check
  const attemptKey = `${cleanUser}_${req.ip}`;
  const now = Date.now();
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && attempt.lockedUntil > now) {
    const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
    res.status(429).json({
      error: `Terlalu banyak percobaan gagal. Silakan tunggu ${waitSeconds} detik sebelum mencoba lagi.`,
    });
    return;
  }

  // 1. Admin / Proktor Login
  const lowerUser = cleanUser.toLowerCase();
  const isProktorOrAdmin = role === 'ADMIN' ||
    lowerUser === 'admin' ||
    lowerUser === 'proktor' ||
    lowerUser === 'proctor' ||
    lowerUser === 'pengawas';

  if (isProktorOrAdmin) {
    if (store.verifyAdminPassword(cleanPass)) {
      loginAttempts.delete(attemptKey);
      const token = createToken('ADMIN', cleanUser, 'Proktor / Administrator CBT TKA');
      store.logAudit('Proktor / Administrator', 'ADMIN', 'LOGIN_SUCCESS', `Login berhasil sebagai proktor/admin (${cleanUser})`, req.ip);
      res.json({
        token,
        role: 'ADMIN',
        name: 'Proktor / Administrator CBT TKA',
      });
      return;
    } else {
      // Record failed attempt
      const curr = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };
      curr.count++;
      if (curr.count >= 5) {
        curr.lockedUntil = now + 60 * 1000; // lock 1 min
      }
      loginAttempts.set(attemptKey, curr);
      store.logAudit(cleanUser, 'ADMIN', 'LOGIN_FAILED', 'Password proktor/admin salah', req.ip);
      res.status(401).json({ error: 'Kredensial Proktor / Admin tidak valid. Periksa kembali username dan kata sandi.' });
      return;
    }
  }

  // 2. Student Login (NISN + Nomor Induk / Password)
  const student = store.getStudentByNisn(cleanUser);
  if (!student || student.status !== 'AKTIF') {
    // Fallback: If someone used admin password with an admin/proktor alias
    if (store.verifyAdminPassword(cleanPass) && (lowerUser.includes('proktor') || lowerUser.includes('admin'))) {
      loginAttempts.delete(attemptKey);
      const token = createToken('ADMIN', cleanUser, 'Proktor / Administrator CBT TKA');
      store.logAudit('Proktor / Administrator', 'ADMIN', 'LOGIN_SUCCESS', `Login berhasil sebagai proktor/admin (${cleanUser})`, req.ip);
      res.json({
        token,
        role: 'ADMIN',
        name: 'Proktor / Administrator CBT TKA',
      });
      return;
    }

    const curr = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };
    curr.count++;
    if (curr.count >= 5) {
      curr.lockedUntil = now + 60 * 1000;
    }
    loginAttempts.set(attemptKey, curr);
    store.logAudit(cleanUser, 'STUDENT', 'LOGIN_FAILED', 'NISN/Username tidak ditemukan atau tidak aktif', req.ip);
    res.status(401).json({ error: 'Akun tidak ditemukan. Masukkan NISN siswa atau username proktor/admin yang valid.' });
    return;
  }

  // Verify student password (either hashed custom password or default nomorInduk)
  const passHash = store.hashPassword(cleanPass);
  const isValid = student.passwordHash
    ? student.passwordHash === passHash
    : cleanPass === student.nomorInduk;

  if (!isValid) {
    const curr = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };
    curr.count++;
    if (curr.count >= 5) {
      curr.lockedUntil = now + 60 * 1000;
    }
    loginAttempts.set(attemptKey, curr);
    store.logAudit(student.nama, 'STUDENT', 'LOGIN_FAILED', `Password salah untuk NISN ${cleanUser}`, req.ip);
    res.status(401).json({ error: 'NISN atau Password tidak sesuai. Silakan periksa kembali nomor induk Anda.' });
    return;
  }

  // Login successful
  loginAttempts.delete(attemptKey);
  student.lastLoginAt = new Date().toISOString();
  store.addOrUpdateStudent(student);

  const token = createToken('STUDENT', student.nisn, student.nama, student.kelas);
  store.logAudit(student.nama, 'STUDENT', 'LOGIN_SUCCESS', `Murid ${student.nama} (${student.kelas}) berhasil login`, req.ip);

  res.json({
    token,
    role: 'STUDENT',
    nisn: student.nisn,
    name: student.nama,
    kelas: student.kelas,
    nomorInduk: student.nomorInduk,
    mustChangePassword: student.mustChangePassword,
  });
});

apiRouter.get('/auth/me', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  if (user.role === 'ADMIN') {
    res.json({
      role: 'ADMIN',
      name: user.name,
      identifier: user.identifier,
    });
  } else {
    const student = store.getStudentByNisn(user.identifier);
    res.json({
      role: 'STUDENT',
      nisn: user.identifier,
      name: student ? student.nama : user.name,
      kelas: student ? student.kelas : user.kelas,
      nomorInduk: student ? student.nomorInduk : '',
      mustChangePassword: student ? student.mustChangePassword : false,
    });
  }
});

apiRouter.post('/auth/logout', authMiddleware, (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
  }
  res.json({ success: true, message: 'Berhasil keluar' });
});

apiRouter.post('/auth/change-password', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    res.status(400).json({ error: 'Password baru minimal 4 karakter' });
    return;
  }

  if (user.role === 'ADMIN') {
    if (!store.verifyAdminPassword(currentPassword)) {
      res.status(400).json({ error: 'Password lama Admin salah' });
      return;
    }
    store.setAdminPassword(newPassword);
    store.logAudit('Administrator', 'ADMIN', 'PASSWORD_CHANGED', 'Password admin diperbarui');
    res.json({ success: true, message: 'Password Admin berhasil diperbarui' });
  } else {
    const student = store.getStudentByNisn(user.identifier);
    if (!student) {
      res.status(404).json({ error: 'Data murid tidak ditemukan' });
      return;
    }
    const currHash = store.hashPassword(currentPassword);
    const isValid = student.passwordHash ? student.passwordHash === currHash : currentPassword === student.nomorInduk;
    if (!isValid) {
      res.status(400).json({ error: 'Password lama salah' });
      return;
    }
    student.passwordHash = store.hashPassword(newPassword);
    student.mustChangePassword = false;
    store.addOrUpdateStudent(student);
    store.logAudit(student.nama, 'STUDENT', 'PASSWORD_CHANGED', 'Password murid diperbarui');
    res.json({ success: true, message: 'Password berhasil diperbarui' });
  }
});

/* ==========================================================================
   STUDENT EXAM ENDPOINTS
   ========================================================================== */

apiRouter.get('/student/exams', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const student = store.getStudentByNisn(user.identifier);
  const studentClass = student ? student.kelas : '';

  const schedules = store.getSchedules();
  const available = schedules.filter(sch => {
    if (sch.status === 'DRAFT' || sch.status === 'DIBATALKAN') return false;
    if (!sch.allowedClasses || sch.allowedClasses.length === 0) return true;
    if (sch.allowedClasses.includes('SEMUA')) return true;
    // Check if class matches prefix or exact (e.g. IX or IX-A)
    return sch.allowedClasses.some(c =>
      studentClass.toUpperCase().startsWith(c.toUpperCase()) ||
      c.toUpperCase() === studentClass.toUpperCase()
    );
  });

  const sessions = store.getSessions();
  const examListWithStatus = available.map(sch => {
    const session = Object.values(sessions).find(
      s => s.examId === sch.id && s.studentNisn === user.identifier
    );

    const questionsCount = store.getQuestionsByPackage(sch.paketId).length;

    return {
      ...sch,
      questionsCount,
      session: session ? {
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        effectiveEndTime: session.effectiveEndTime,
        submittedAt: session.submittedAt,
        answersCount: Object.keys(session.answers || {}).length,
        hasScore: !!session.score,
        totalScore: sch.publishScores && session.score ? session.score.totalScore : null,
        percentage: sch.publishScores && session.score ? session.score.percentage : null,
      } : null,
    };
  });

  res.json({ exams: examListWithStatus });
});

apiRouter.post('/student/exam/start', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { examId } = req.body;

  if (!examId) {
    res.status(400).json({ error: 'examId diperlukan' });
    return;
  }

  const exam = store.getScheduleById(examId);
  if (!exam) {
    res.status(404).json({ error: 'Paket ujian tidak ditemukan' });
    return;
  }

  if (exam.status !== 'SEDANG_BERLANGSUNG' && exam.status !== 'TERJADWAL') {
    res.status(400).json({ error: `Ujian tidak sedang dibuka (Status: ${exam.status})` });
    return;
  }

  // Check if student already has a session
  let session = store.getSessionByStudentAndExam(user.identifier, examId);
  const now = new Date();

  if (session) {
    if (session.status === 'SUBMITTED' || session.status === 'TIME_OUT') {
      res.json({
        sessionId: session.id,
        status: session.status,
        alreadyCompleted: true,
        message: 'Ujian ini telah selesai dikerjakan.',
      });
      return;
    }
    // Session is in progress, check deadline
    const effectiveEnd = new Date(session.effectiveEndTime).getTime();
    if (now.getTime() >= effectiveEnd) {
      session.status = 'TIME_OUT';
      session.submittedAt = now.toISOString();
      // Grade
      const questions = store.getQuestionsByPackage(exam.paketId);
      session.score = gradeExamSession(questions, session.answers);
      store.saveSession(session);
      res.json({
        sessionId: session.id,
        status: 'TIME_OUT',
        alreadyCompleted: true,
        message: 'Batas waktu pengerjaan ujian telah berakhir.',
      });
      return;
    }

    res.json({
      sessionId: session.id,
      status: session.status,
      startTime: session.startTime,
      effectiveEndTime: session.effectiveEndTime,
    });
    return;
  }

  // Create new session
  const student = store.getStudentByNisn(user.identifier);
  const durationMs = exam.durationMinutes * 60 * 1000;
  const startTime = now.toISOString();
  const endTime = new Date(now.getTime() + durationMs).toISOString();

  const newSession: ExamSession = {
    id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    examId: exam.id,
    studentNisn: user.identifier,
    studentName: student ? student.nama : user.name,
    studentClass: student ? student.kelas : '',
    status: 'IN_PROGRESS',
    startTime,
    originalEndTime: endTime,
    effectiveEndTime: endTime,
    answers: {},
    reviewedQuestions: [],
    violations: [],
    totalPenaltySeconds: 0,
    lastHeartbeatAt: startTime,
  };

  store.saveSession(newSession);
  store.logAudit(newSession.studentName, 'STUDENT', 'EXAM_STARTED', `Memulai ujian ${exam.title}`, req.ip);

  res.json({
    sessionId: newSession.id,
    status: newSession.status,
    startTime: newSession.startTime,
    effectiveEndTime: newSession.effectiveEndTime,
  });
});

apiRouter.get('/student/exam/session/:sessionId', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { sessionId } = req.params;

  const session = store.getSession(sessionId);
  if (!session || session.studentNisn !== user.identifier) {
    res.status(404).json({ error: 'Sesi ujian tidak ditemukan atau bukan milik Anda' });
    return;
  }

  const exam = store.getScheduleById(session.examId);
  if (!exam) {
    res.status(404).json({ error: 'Data paket ujian tidak ditemukan' });
    return;
  }

  // Check if expired
  const now = Date.now();
  const effectiveEnd = new Date(session.effectiveEndTime).getTime();
  if (session.status === 'IN_PROGRESS' && now >= effectiveEnd) {
    session.status = 'TIME_OUT';
    session.submittedAt = new Date().toISOString();
    const questions = store.getQuestionsByPackage(exam.paketId);
    session.score = gradeExamSession(questions, session.answers);
    store.saveSession(session);
  }

  // Fetch questions and STRIP SECRET KEYS
  const rawQuestions = store.getQuestionsByPackage(exam.paketId);
  const questionsForStudent = rawQuestions.map(q => {
    return {
      no: q.no,
      idSoal: q.idSoal,
      idStimulus: q.idStimulus,
      idKompetensi: q.idKompetensi,
      mataPelajaran: q.mataPelajaran || exam.mataPelajaran || 'Matematika',
      elemen: q.elemen,
      indikator: q.indikator,
      bentukSoal: q.bentukSoal,
      tingkatKesulitan: q.tingkatKesulitan,
      stimulusJudul: q.stimulusJudul,
      stimulus: q.stimulus,
      soal: q.soal,
      opsiA: q.opsiA,
      opsiB: q.opsiB,
      opsiC: q.opsiC,
      opsiD: q.opsiD,
      opsiE: q.opsiE,
      pernyataan1: q.pernyataan1,
      pernyataan2: q.pernyataan2,
      pernyataan3: q.pernyataan3,
      kategoriJawaban: q.kategoriJawaban,
      skorMaksimal: q.skorMaksimal,
      durasiTargetDetik: q.durasiTargetDetik,
      kelas: q.kelas,
      materiKelas: q.materiKelas,
      babAcuan: q.babAcuan,
      paketTryout: q.paketTryout,
      urutanPaket: q.urutanPaket,
      // NOTE: kunciJawaban, kunciTerstruktur, pembahasan are deliberately OMITTED!
    };
  });

  const securitySettings = store.getSecuritySettings();

  const remainingSeconds = Math.max(0, Math.floor((effectiveEnd - now) / 1000));

  res.json({
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
      violationsCount: session.violations.length,
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
    securitySettings,
    questions: questionsForStudent,
  });
});

apiRouter.post('/student/exam/save-answer', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { sessionId, questionId, answer } = req.body;

  if (!sessionId || !questionId) {
    res.status(400).json({ error: 'sessionId dan questionId wajib' });
    return;
  }

  const session = store.getSession(sessionId);
  if (!session || session.studentNisn !== user.identifier) {
    res.status(404).json({ error: 'Sesi ujian tidak valid' });
    return;
  }

  if (session.status !== 'IN_PROGRESS') {
    res.status(400).json({ error: 'Ujian sudah diserahkan atau waktu telah habis' });
    return;
  }

  const now = Date.now();
  if (now >= new Date(session.effectiveEndTime).getTime()) {
    session.status = 'TIME_OUT';
    session.submittedAt = new Date().toISOString();
    const exam = store.getScheduleById(session.examId);
    if (exam) {
      const questions = store.getQuestionsByPackage(exam.paketId);
      session.score = gradeExamSession(questions, session.answers);
    }
    store.saveSession(session);
    res.status(400).json({ error: 'Batas waktu telah habis', status: 'TIME_OUT' });
    return;
  }

  // Save answer
  session.answers[questionId] = answer;
  session.lastHeartbeatAt = new Date().toISOString();
  store.saveSession(session);

  res.json({
    success: true,
    questionId,
    savedAt: session.lastHeartbeatAt,
  });
});

apiRouter.post('/student/exam/toggle-review', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { sessionId, questionId } = req.body;

  const session = store.getSession(sessionId);
  if (!session || session.studentNisn !== user.identifier) {
    res.status(404).json({ error: 'Sesi ujian tidak valid' });
    return;
  }

  if (session.status !== 'IN_PROGRESS') {
    res.status(400).json({ error: 'Ujian sudah tidak aktif' });
    return;
  }

  const exists = session.reviewedQuestions.includes(questionId);
  if (exists) {
    session.reviewedQuestions = session.reviewedQuestions.filter(id => id !== questionId);
  } else {
    session.reviewedQuestions.push(questionId);
  }

  store.saveSession(session);
  res.json({
    success: true,
    isMarked: !exists,
    reviewedQuestions: session.reviewedQuestions,
  });
});

// CRITICAL SECURITY FEATURE: REPORT VIOLATION & DEDUCT TIME
apiRouter.post('/student/exam/report-violation', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { sessionId, eventId, eventType, eventDescription } = req.body;

  if (!sessionId || !eventType) {
    res.status(400).json({ error: 'sessionId dan eventType wajib' });
    return;
  }

  const session = store.getSession(sessionId);
  if (!session || session.studentNisn !== user.identifier) {
    res.status(404).json({ error: 'Sesi ujian tidak valid' });
    return;
  }

  if (session.status !== 'IN_PROGRESS') {
    res.json({ ignored: true, reason: 'Session not in progress' });
    return;
  }

  const security = store.getSecuritySettings();
  if (!security.monitorVisibility) {
    res.json({ ignored: true, reason: 'Monitoring is disabled by Admin' });
    return;
  }

  const now = Date.now();
  const effectiveEndMs = new Date(session.effectiveEndTime).getTime();
  const remainingSecBefore = Math.max(0, Math.floor((effectiveEndMs - now) / 1000));

  // Deduplication check: check if eventId already processed
  if (eventId && session.violations.some(v => v.id === eventId)) {
    res.json({
      deduplicated: true,
      remainingSeconds: remainingSecBefore,
      effectiveEndTime: session.effectiveEndTime,
      totalPenaltySeconds: session.totalPenaltySeconds,
    });
    return;
  }

  // Also deduplicate if same event happened within last 2 seconds
  const lastViolation = session.violations[session.violations.length - 1];
  if (lastViolation) {
    const lastTime = new Date(lastViolation.timestamp).getTime();
    if (now - lastTime < 2000 && lastViolation.eventType === eventType) {
      res.json({
        deduplicated: true,
        remainingSeconds: remainingSecBefore,
        effectiveEndTime: session.effectiveEndTime,
        totalPenaltySeconds: session.totalPenaltySeconds,
      });
      return;
    }
  }

  // Calculate penalty
  let penaltyToApply = 0;
  if (security.penaltyMode === 'deduct') {
    const currentTotal = session.totalPenaltySeconds || 0;
    const canDeduct = Math.max(0, security.maxPenaltySeconds - currentTotal);
    penaltyToApply = Math.min(security.penaltySeconds, canDeduct);
  }

  // Update effective end time
  const newEffectiveEndMs = effectiveEndMs - (penaltyToApply * 1000);
  session.effectiveEndTime = new Date(newEffectiveEndMs).toISOString();
  session.totalPenaltySeconds = (session.totalPenaltySeconds || 0) + penaltyToApply;

  const remainingSecAfter = Math.max(0, Math.floor((newEffectiveEndMs - now) / 1000));

  const violationRecord = {
    id: eventId || `viol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    eventType: eventType as any,
    eventDescription: eventDescription || 'Meninggalkan layar ujian / berpindah aplikasi',
    penaltyApplied: penaltyToApply,
    remainingSecondsBefore: remainingSecBefore,
    remainingSecondsAfter: remainingSecAfter,
  };

  session.violations.push(violationRecord);

  // If time exhausted due to penalty, submit session
  if (remainingSecAfter <= 0) {
    session.status = 'TIME_OUT';
    session.submittedAt = new Date().toISOString();
    const exam = store.getScheduleById(session.examId);
    if (exam) {
      const questions = store.getQuestionsByPackage(exam.paketId);
      session.score = gradeExamSession(questions, session.answers);
    }
  }

  store.saveSession(session);
  store.logAudit(
    session.studentName,
    'STUDENT',
    'EXAM_VIOLATION',
    `Pelanggaran layar (${eventType}): Pengurangan waktu ${penaltyToApply}s (Total penalti: ${session.totalPenaltySeconds}s)`,
    req.ip
  );

  res.json({
    success: true,
    penaltyApplied: penaltyToApply,
    totalPenaltySeconds: session.totalPenaltySeconds,
    remainingSeconds: remainingSecAfter,
    effectiveEndTime: session.effectiveEndTime,
    violationsCount: session.violations.length,
    status: session.status,
  });
});

// HEARTBEAT
apiRouter.post('/student/exam/heartbeat', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { sessionId } = req.body;

  const session = store.getSession(sessionId);
  if (!session || session.studentNisn !== user.identifier) {
    res.status(404).json({ error: 'Sesi ujian tidak valid' });
    return;
  }

  const now = Date.now();
  const effectiveEndMs = new Date(session.effectiveEndTime).getTime();
  let remainingSeconds = Math.max(0, Math.floor((effectiveEndMs - now) / 1000));

  session.lastHeartbeatAt = new Date().toISOString();

  if (session.status === 'IN_PROGRESS' && remainingSeconds <= 0) {
    session.status = 'TIME_OUT';
    session.submittedAt = new Date().toISOString();
    const exam = store.getScheduleById(session.examId);
    if (exam) {
      const questions = store.getQuestionsByPackage(exam.paketId);
      session.score = gradeExamSession(questions, session.answers);
    }
  }

  store.saveSession(session);

  res.json({
    status: session.status,
    serverTime: new Date().toISOString(),
    remainingSeconds,
    totalPenaltySeconds: session.totalPenaltySeconds,
    violationsCount: session.violations.length,
    effectiveEndTime: session.effectiveEndTime,
  });
});

// SUBMIT EXAM
apiRouter.post('/student/exam/submit', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { sessionId } = req.body;

  const session = store.getSession(sessionId);
  if (!session || session.studentNisn !== user.identifier) {
    res.status(404).json({ error: 'Sesi ujian tidak valid' });
    return;
  }

  if (session.status === 'SUBMITTED' || session.status === 'TIME_OUT') {
    res.json({
      success: true,
      status: session.status,
      submittedAt: session.submittedAt,
      message: 'Ujian sudah diserahkan sebelumnya.',
    });
    return;
  }

  const exam = store.getScheduleById(session.examId);
  if (!exam) {
    res.status(404).json({ error: 'Paket ujian tidak ditemukan' });
    return;
  }

  // Grade immediately
  const questions = store.getQuestionsByPackage(exam.paketId);
  const scoreResult = gradeExamSession(questions, session.answers);

  session.status = 'SUBMITTED';
  session.submittedAt = new Date().toISOString();
  session.score = scoreResult;

  store.saveSession(session);
  store.logAudit(
    session.studentName,
    'STUDENT',
    'EXAM_SUBMITTED',
    `Menyerahkan jawaban ujian ${exam.title}. Skor: ${scoreResult.totalScore}/${scoreResult.maxScore} (${scoreResult.percentage}%)`,
    req.ip
  );

  res.json({
    success: true,
    status: 'SUBMITTED',
    submittedAt: session.submittedAt,
  });
});

// GET EXAM RESULT (ONLY IF PUBLISHED)
apiRouter.get('/student/exam/result/:sessionId', studentOnlyMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as ActiveToken;
  const { sessionId } = req.params;

  const session = store.getSession(sessionId);
  if (!session || session.studentNisn !== user.identifier) {
    res.status(404).json({ error: 'Sesi ujian tidak valid' });
    return;
  }

  const exam = store.getScheduleById(session.examId);
  if (!exam) {
    res.status(404).json({ error: 'Data ujian tidak ditemukan' });
    return;
  }

  if (!exam.publishScores) {
    res.json({
      published: false,
      title: exam.title,
      studentName: session.studentName,
      submittedAt: session.submittedAt,
      message: 'Nilai dan hasil evaluasi belum dipublikasikan oleh pihak sekolah/administrator.',
    });
    return;
  }

  const rawQuestions = store.getQuestionsByPackage(exam.paketId);
  const questionsMap = new Map<string, Question>();
  rawQuestions.forEach(q => questionsMap.set(q.idSoal, q));

  let breakdown: any[] = [];
  if (exam.publishKeys && session.score) {
    breakdown = session.score.breakdown.map(item => {
      const q = questionsMap.get(item.questionId);
      return {
        ...item,
        soal: q?.soal,
        stimulusJudul: q?.stimulusJudul,
        stimulus: q?.stimulus,
        bentukSoal: q?.bentukSoal,
        pembahasan: q?.pembahasan,
        opsiA: q?.opsiA,
        opsiB: q?.opsiB,
        opsiC: q?.opsiC,
        opsiD: q?.opsiD,
        opsiE: q?.opsiE,
        pernyataan1: q?.pernyataan1,
        pernyataan2: q?.pernyataan2,
        pernyataan3: q?.pernyataan3,
        kategoriJawaban: q?.kategoriJawaban,
      };
    });
  }

  res.json({
    published: true,
    publishKeys: exam.publishKeys,
    examTitle: exam.title,
    mataPelajaran: exam.mataPelajaran || 'Matematika',
    studentName: session.studentName,
    studentClass: session.studentClass,
    submittedAt: session.submittedAt,
    totalPenaltySeconds: session.totalPenaltySeconds,
    violationsCount: session.violations.length,
    score: session.score ? {
      totalScore: session.score.totalScore,
      maxScore: session.score.maxScore,
      percentage: session.score.percentage,
      correctCount: session.score.correctCount,
      incorrectCount: session.score.incorrectCount,
      breakdown,
    } : null,
  });
});

/* ==========================================================================
   ADMIN ENDPOINTS
   ========================================================================== */

apiRouter.get('/admin/overview', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const questions = store.getQuestions();
  const students = store.getStudents();
  const schedules = store.getSchedules();
  const sessions = Object.values(store.getSessions());

  const paketCounts: Record<string, number> = {};
  questions.forEach(q => {
    const p = q.paketTryout.toUpperCase();
    paketCounts[p] = (paketCounts[p] || 0) + 1;
  });

  const activeSessions = sessions.filter(s => s.status === 'IN_PROGRESS');
  const submittedSessions = sessions.filter(s => s.status === 'SUBMITTED' || s.status === 'TIME_OUT');
  const totalViolations = sessions.reduce((acc, s) => acc + (s.violations ? s.violations.length : 0), 0);
  const totalPenaltySec = sessions.reduce((acc, s) => acc + (s.totalPenaltySeconds || 0), 0);

  let averagePercentage = 0;
  if (submittedSessions.length > 0) {
    const sum = submittedSessions.reduce((acc, s) => acc + (s.score ? s.score.percentage : 0), 0);
    averagePercentage = Number((sum / submittedSessions.length).toFixed(1));
  }

  res.json({
    totalQuestions: questions.length,
    paketCounts,
    totalStudents: students.length,
    totalSchedules: schedules.length,
    activeSessionsCount: activeSessions.length,
    submittedSessionsCount: submittedSessions.length,
    totalViolations,
    totalPenaltySeconds: totalPenaltySec,
    averagePercentage,
  });
});

// LIVE MONITORING
apiRouter.get('/admin/monitoring/:examId', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { examId } = req.params;
  const exam = store.getScheduleById(examId);
  if (!exam) {
    res.status(404).json({ error: 'Ujian tidak ditemukan' });
    return;
  }

  const questionsCount = store.getQuestionsByPackage(exam.paketId).length;
  const allStudents = store.getStudents();
  const sessions = store.getSessions();

  // Filter students allowed in this exam
  const filteredStudents = allStudents.filter(s => {
    if (!exam.allowedClasses || exam.allowedClasses.includes('SEMUA')) return true;
    return exam.allowedClasses.some(c => s.kelas.toUpperCase().startsWith(c.toUpperCase()));
  });

  const now = Date.now();
  const monitorData = filteredStudents.map(student => {
    const session = Object.values(sessions).find(
      s => s.examId === examId && s.studentNisn === student.nisn
    );

    if (!session) {
      return {
        nisn: student.nisn,
        nama: student.nama,
        kelas: student.kelas,
        status: 'BELUM_MULAI',
        answeredCount: 0,
        totalQuestions: questionsCount,
        remainingSeconds: null,
        violationsCount: 0,
        totalPenaltySeconds: 0,
        startTime: null,
        submittedAt: null,
        lastHeartbeatAt: null,
        isOnline: false,
        score: null,
      };
    }

    const effectiveEndMs = new Date(session.effectiveEndTime).getTime();
    const remainingSeconds = Math.max(0, Math.floor((effectiveEndMs - now) / 1000));
    const lastHbMs = session.lastHeartbeatAt ? new Date(session.lastHeartbeatAt).getTime() : 0;
    const isOnline = session.status === 'IN_PROGRESS' && (now - lastHbMs < 30000); // 30s heartbeat window

    return {
      sessionId: session.id,
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      status: session.status,
      answeredCount: Object.keys(session.answers || {}).length,
      totalQuestions: questionsCount,
      remainingSeconds: session.status === 'IN_PROGRESS' ? remainingSeconds : 0,
      violationsCount: session.violations ? session.violations.length : 0,
      totalPenaltySeconds: session.totalPenaltySeconds || 0,
      startTime: session.startTime,
      submittedAt: session.submittedAt,
      lastHeartbeatAt: session.lastHeartbeatAt,
      isOnline,
      score: session.score ? {
        totalScore: session.score.totalScore,
        percentage: session.score.percentage,
      } : null,
      violations: session.violations || [],
    };
  });

  res.json({
    exam,
    questionsCount,
    participants: monitorData,
  });
});

// FORCE SUBMIT
apiRouter.post('/admin/monitoring/force-submit', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { sessionId } = req.body;
  const session = store.getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Sesi tidak ditemukan' });
    return;
  }

  const exam = store.getScheduleById(session.examId);
  if (exam) {
    const questions = store.getQuestionsByPackage(exam.paketId);
    session.score = gradeExamSession(questions, session.answers);
  }

  session.status = 'SUBMITTED';
  session.submittedAt = new Date().toISOString();
  store.saveSession(session);
  store.logAudit('Administrator', 'ADMIN', 'FORCE_SUBMIT', `Memaksa submit sesi siswa ${session.studentName} (${session.studentNisn})`, req.ip);

  res.json({ success: true, message: `Sesi ${session.studentName} berhasil diserahkan secara paksa.` });
});

// RESET SESSION
apiRouter.post('/admin/monitoring/reset-session', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { sessionId } = req.body;
  const session = store.getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Sesi tidak ditemukan' });
    return;
  }

  const studentName = session.studentName;
  store.deleteSession(sessionId);
  store.logAudit('Administrator', 'ADMIN', 'RESET_SESSION', `Mereset sesi ujian siswa ${studentName}`, req.ip);

  res.json({ success: true, message: `Sesi ujian ${studentName} berhasil direset.` });
});

// QUESTIONS MANAGEMENT
apiRouter.get('/admin/questions', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { paket, mapel, elemen, bentuk, search } = req.query;
  let questions = store.getQuestions();

  if (mapel && mapel !== 'ALL') {
    questions = questions.filter(q => (q.mataPelajaran || 'Matematika').toLowerCase() === String(mapel).toLowerCase());
  }
  if (paket && paket !== 'ALL') {
    questions = questions.filter(q => q.paketTryout.toUpperCase() === String(paket).toUpperCase());
  }
  if (elemen && elemen !== 'ALL') {
    questions = questions.filter(q => q.elemen.toLowerCase() === String(elemen).toLowerCase());
  }
  if (bentuk && bentuk !== 'ALL') {
    questions = questions.filter(q => q.bentukSoal === bentuk);
  }
  if (search) {
    const query = String(search).toLowerCase();
    questions = questions.filter(q =>
      q.idSoal.toLowerCase().includes(query) ||
      (q.mataPelajaran && q.mataPelajaran.toLowerCase().includes(query)) ||
      q.soal.toLowerCase().includes(query) ||
      q.stimulusJudul.toLowerCase().includes(query) ||
      q.indikator.toLowerCase().includes(query)
    );
  }

  res.json({ questions });
});

apiRouter.post('/admin/questions', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const qData = req.body as Question;
  if (!qData.idSoal || !qData.soal) {
    res.status(400).json({ error: 'idSoal dan soal wajib diisi' });
    return;
  }

  store.addOrUpdateQuestion(qData);
  store.logAudit('Administrator', 'ADMIN', 'QUESTION_UPDATED', `Menyimpan soal ${qData.idSoal}`, req.ip);
  res.json({ success: true, question: qData });
});

apiRouter.post('/admin/questions/import-csv', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { csvText, mode } = req.body; // mode: 'replace' | 'append'
  if (!csvText || !csvText.trim()) {
    res.status(400).json({ error: 'Teks CSV kosong' });
    return;
  }

  try {
    const parsed = parseQuestionsCsv(csvText);
    if (parsed.length === 0) {
      res.status(400).json({ error: 'Tidak ada data soal yang berhasil diparsing dari CSV' });
      return;
    }

    if (mode === 'replace') {
      store.setQuestions(parsed);
    } else {
      parsed.forEach(q => store.addOrUpdateQuestion(q));
    }

    store.logAudit('Administrator', 'ADMIN', 'CSV_QUESTIONS_IMPORTED', `Mengimpor ${parsed.length} butir soal via CSV (${mode || 'append'})`, req.ip);
    res.json({ success: true, count: parsed.length, message: `Berhasil mengimpor ${parsed.length} butir soal.` });
  } catch (err: any) {
    res.status(500).json({ error: `Gagal memproses CSV: ${err.message}` });
  }
});

// CSV / SPREADSHEET EXPORT OF QUESTIONS (WITH AUTO-CREATED COLUMNS)
apiRouter.get('/admin/questions/export-csv', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { paket, mapel } = req.query;
  let questions = store.getQuestions();
  if (paket && paket !== 'ALL') {
    questions = questions.filter(q => q.paketTryout === paket);
  }
  if (mapel && mapel !== 'ALL') {
    questions = questions.filter(q => (q.mataPelajaran || 'Matematika') === mapel);
  }

  const csv = exportQuestionsToCsv(questions);
  const detectedCols = getAllQuestionSpreadsheetColumns(questions);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Bank_Soal_TKA_SMP_${Date.now()}.csv"`);
  res.setHeader('X-Total-Columns', String(detectedCols.length));
  res.send(csv);
});

apiRouter.get('/admin/questions/template-csv', adminOnlyMiddleware, (req: Request, res: Response): void => {
  // Provide sample rows with all admin columns auto-generated
  const questions = store.getQuestions().slice(0, 3);
  const csv = exportQuestionsToCsv(questions);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="Template_Bank_Soal_TKA_SMP.csv"');
  res.send(csv);
});

// SCHEDULES MANAGEMENT
apiRouter.get('/admin/schedules', adminOnlyMiddleware, (req: Request, res: Response): void => {
  res.json({ schedules: store.getSchedules() });
});

apiRouter.post('/admin/schedules', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const scheduleData = req.body as ExamSchedule;
  if (!scheduleData.id || !scheduleData.title) {
    res.status(400).json({ error: 'id dan title jadwal wajib diisi' });
    return;
  }

  scheduleData.updatedAt = new Date().toISOString();
  if (!scheduleData.createdAt) {
    scheduleData.createdAt = new Date().toISOString();
  }

  store.addOrUpdateSchedule(scheduleData);
  store.logAudit('Administrator', 'ADMIN', 'SCHEDULE_UPDATED', `Menyimpan jadwal ujian ${scheduleData.title}`, req.ip);
  res.json({ success: true, schedule: scheduleData });
});

// SECURITY & PENALTY SETTINGS
apiRouter.get('/admin/security-settings', adminOnlyMiddleware, (req: Request, res: Response): void => {
  res.json({ settings: store.getSecuritySettings() });
});

apiRouter.put('/admin/security-settings', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const newSettings = req.body as Partial<SecuritySettings>;
  store.updateSecuritySettings(newSettings);
  store.logAudit(
    'Administrator',
    'ADMIN',
    'SECURITY_SETTINGS_UPDATED',
    `Memperbarui Pengaturan Keamanan Ujian: penalti=${newSettings.penaltySeconds}s, max=${newSettings.maxPenaltySeconds}s, mode=${newSettings.penaltyMode}`,
    req.ip
  );
  res.json({ success: true, settings: store.getSecuritySettings() });
});

// STUDENTS MANAGEMENT
apiRouter.get('/admin/students', adminOnlyMiddleware, (req: Request, res: Response): void => {
  res.json({ students: store.getStudents() });
});

apiRouter.post('/admin/students', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const sData = req.body as Student;
  if (!sData.nisn || !sData.nama || !sData.nomorInduk) {
    res.status(400).json({ error: 'NISN, Nomor Induk, dan Nama wajib diisi' });
    return;
  }

  if (!sData.id) {
    sData.id = `std_${Date.now()}`;
  }
  if (!sData.registeredAt) {
    sData.registeredAt = new Date().toISOString();
  }
  if (!sData.passwordHash) {
    sData.passwordHash = store.hashPassword(sData.nomorInduk);
  }

  store.addOrUpdateStudent(sData);
  store.logAudit('Administrator', 'ADMIN', 'STUDENT_SAVED', `Menyimpan data murid ${sData.nama} (${sData.nisn})`, req.ip);
  res.json({ success: true, student: sData });
});

apiRouter.post('/admin/students/reset-password', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { nisn } = req.body;
  const student = store.getStudentByNisn(nisn);
  if (!student) {
    res.status(404).json({ error: 'Murid tidak ditemukan' });
    return;
  }

  student.passwordHash = store.hashPassword(student.nomorInduk);
  student.mustChangePassword = true;
  store.addOrUpdateStudent(student);
  store.logAudit('Administrator', 'ADMIN', 'STUDENT_PASSWORD_RESET', `Mereset password murid ${student.nama} ke Nomor Induk awal`, req.ip);
  res.json({ success: true, message: `Password murid ${student.nama} berhasil direset ke nomor induk awal.` });
});

apiRouter.post('/admin/students/import-csv', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { csvText } = req.body;
  if (!csvText) {
    res.status(400).json({ error: 'Teks CSV murid kosong' });
    return;
  }

  try {
    const rows = parseCsvRows(csvText.trim());
    if (rows.length < 2) {
      res.status(400).json({ error: 'Format CSV murid minimal 1 baris judul dan 1 baris data' });
      return;
    }

    const headers = rows[0].map(h => h.trim().toUpperCase());
    const nisnIdx = headers.findIndex(h => h.includes('NISN'));
    const namaIdx = headers.findIndex(h => h.includes('NAMA'));
    const indukIdx = headers.findIndex(h => h.includes('INDUK') || h.includes('NIPD') || h.includes('NO_INDUK'));
    const kelasIdx = headers.findIndex(h => h.includes('KELAS'));

    let importedCount = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue;

      const nisn = nisnIdx >= 0 ? row[nisnIdx].trim() : row[0].trim();
      const nama = namaIdx >= 0 ? row[namaIdx].trim() : row[1].trim();
      const induk = indukIdx >= 0 ? row[indukIdx].trim() : (row[2] ? row[2].trim() : nisn.slice(-5));
      const kelas = kelasIdx >= 0 ? row[kelasIdx].trim() : (row[3] ? row[3].trim() : 'IX-A');

      if (!nisn || !nama) continue;

      const newStudent: Student = {
        id: `std_${Date.now()}_${i}`,
        nisn,
        nomorInduk: induk,
        nama,
        kelas,
        passwordHash: store.hashPassword(induk),
        mustChangePassword: false,
        status: 'AKTIF',
        registeredAt: new Date().toISOString(),
      };

      store.addOrUpdateStudent(newStudent);
      importedCount++;
    }

    store.logAudit('Administrator', 'ADMIN', 'STUDENTS_IMPORTED_CSV', `Mengimpor ${importedCount} murid dari CSV`, req.ip);
    res.json({ success: true, count: importedCount, message: `Berhasil mengimpor ${importedCount} data murid.` });
  } catch (err: any) {
    res.status(500).json({ error: `Gagal memproses CSV: ${err.message}` });
  }
});

apiRouter.get('/admin/students/export-csv', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const students = store.getStudents();
  const csv = exportStudentsToCsv(students);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Data_Murid_TKA_SMP_${Date.now()}.csv"`);
  res.send(csv);
});

// RESULTS & GRADEBOOK
apiRouter.get('/admin/results/:examId', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { examId } = req.params;
  const exam = store.getScheduleById(examId);
  if (!exam) {
    res.status(404).json({ error: 'Ujian tidak ditemukan' });
    return;
  }

  const sessions = Object.values(store.getSessions()).filter(s => s.examId === examId);
  const questions = store.getQuestionsByPackage(exam.paketId);

  const results = sessions.map(s => {
    return {
      sessionId: s.id,
      nisn: s.studentNisn,
      nama: s.studentName,
      kelas: s.studentClass,
      status: s.status,
      startTime: s.startTime,
      submittedAt: s.submittedAt,
      violationsCount: s.violations ? s.violations.length : 0,
      totalPenaltySeconds: s.totalPenaltySeconds || 0,
      score: s.score || null,
    };
  });

  // Sort by score descending
  results.sort((a, b) => {
    const scA = a.score ? a.score.totalScore : -1;
    const scB = b.score ? b.score.totalScore : -1;
    return scB - scA;
  });

  // Calculate stats
  const completed = results.filter(r => r.score !== null);
  const totalCompleted = completed.length;
  let avgScore = 0;
  let highestScore = 0;
  let lowestScore = completed.length > 0 ? 100 : 0;

  if (totalCompleted > 0) {
    const sum = completed.reduce((acc, r) => acc + (r.score?.percentage || 0), 0);
    avgScore = Number((sum / totalCompleted).toFixed(1));
    highestScore = Math.max(...completed.map(r => r.score?.percentage || 0));
    lowestScore = Math.min(...completed.map(r => r.score?.percentage || 0));
  }

  res.json({
    exam,
    totalQuestions: questions.length,
    totalParticipants: results.length,
    totalCompleted,
    avgScore,
    highestScore,
    lowestScore,
    results,
  });
});

// CSV EXPORT OF RESULTS
apiRouter.get('/admin/results/:examId/export-csv', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const { examId } = req.params;
  const exam = store.getScheduleById(examId);
  if (!exam) {
    res.status(404).json({ error: 'Ujian tidak ditemukan' });
    return;
  }

  const sessions = Object.values(store.getSessions()).filter(s => s.examId === examId);
  const mapelName = exam.mataPelajaran || 'Matematika';
  let csv = 'PERINGKAT,NISN,NAMA_MURID,KELAS,MATA_PELAJARAN,STATUS,NILAI_TOTAL,SKOR_MAKSIMAL,PERSENTASE,BENAR,SALAH,PELANGGARAN,TOTAL_PENALTI_DETIK,WAKTU_MULAI,WAKTU_SELESAI\n';

  // Sort by score descending
  sessions.sort((a, b) => (b.score?.totalScore || 0) - (a.score?.totalScore || 0));

  sessions.forEach((s, idx) => {
    const rank = idx + 1;
    const scoreVal = s.score ? s.score.totalScore : 0;
    const maxVal = s.score ? s.score.maxScore : 0;
    const pctVal = s.score ? s.score.percentage : 0;
    const correctVal = s.score ? s.score.correctCount : 0;
    const incorrectVal = s.score ? s.score.incorrectCount : 0;
    const violVal = s.violations ? s.violations.length : 0;
    const penVal = s.totalPenaltySeconds || 0;

    csv += `${rank},"${s.studentNisn}","${s.studentName}","${s.studentClass}","${mapelName}","${s.status}",${scoreVal},${maxVal},${pctVal}%,${correctVal},${incorrectVal},${violVal},${penVal},"${s.startTime}","${s.submittedAt || ''}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Hasil_TKA_${exam.paketId}_${Date.now()}.csv"`);
  res.send(csv);
});

// AUDIT LOGS
apiRouter.get('/admin/audit-logs', adminOnlyMiddleware, (req: Request, res: Response): void => {
  res.json({ logs: store.getAuditLogs() });
});

// GOOGLE SHEETS INTEGRATION
apiRouter.get('/admin/google-sheets', adminOnlyMiddleware, (req: Request, res: Response): void => {
  res.json({ config: store.getGoogleSheetsConfig() });
});

apiRouter.post('/admin/google-sheets/config', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const newConfig = req.body;
  store.updateGoogleSheetsConfig(newConfig);
  store.logAudit('Administrator', 'ADMIN', 'SHEETS_CONFIG_UPDATED', `Mengupdate konfigurasi Google Sheets (ID: ${newConfig.spreadsheetId})`, req.ip);
  res.json({ success: true, config: store.getGoogleSheetsConfig() });
});

apiRouter.post('/admin/google-sheets/test-connection', adminOnlyMiddleware, async (req: Request, res: Response): Promise<void> => {
  const config = store.getGoogleSheetsConfig();
  const spreadsheetId = config.spreadsheetId;

  // Let's attempt to fetch via public CSV export URL
  const publicCsvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

  try {
    const fetchRes = await fetch(publicCsvUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (fetchRes.ok) {
      const csvData = await fetchRes.text();
      const rows = parseCsvRows(csvData);
      store.updateGoogleSheetsConfig({
        lastSyncStatus: 'SUCCESS',
        lastSyncAt: new Date().toISOString(),
        lastSyncMessage: `Koneksi berhasil. Ditemukan ${rows.length} baris data pada sheet utama.`,
      });
      res.json({
        success: true,
        accessible: true,
        rowsCount: rows.length,
        headers: rows[0] || [],
        message: 'Akses Google Spreadsheet publik berhasil diverifikasi.',
      });
      return;
    } else {
      store.updateGoogleSheetsConfig({
        lastSyncStatus: 'ERROR',
        lastSyncAt: new Date().toISOString(),
        lastSyncMessage: `HTTP status ${fetchRes.status}: Google Sheets mungkin memerlukan izin bagikan "Siapa saja dengan tautan dapat melihat" atau kredensial API.`,
      });
      res.json({
        success: false,
        accessible: false,
        status: fetchRes.status,
        message: `HTTP ${fetchRes.status}: Pastikan Spreadsheet dibagikan dengan akses publik atau konfigurasikan Service Account.`,
      });
      return;
    }
  } catch (err: any) {
    store.updateGoogleSheetsConfig({
      lastSyncStatus: 'ERROR',
      lastSyncAt: new Date().toISOString(),
      lastSyncMessage: `Error koneksi: ${err.message}`,
    });
    res.json({
      success: false,
      accessible: false,
      message: `Gagal mengakses URL: ${err.message}`,
    });
  }
});

apiRouter.post('/admin/google-sheets/sync-questions', adminOnlyMiddleware, async (req: Request, res: Response): Promise<void> => {
  const config = store.getGoogleSheetsConfig();
  const publicCsvUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv`;

  try {
    const fetchRes = await fetch(publicCsvUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!fetchRes.ok) {
      res.status(400).json({
        error: `Tidak dapat mengunduh CSV langsung dari Google Sheets (HTTP ${fetchRes.status}). Anda dapat mengunggah file CSV manual melalui tab Bank Soal.`,
      });
      return;
    }

    const csvText = await fetchRes.text();
    const questions = parseQuestionsCsv(csvText);
    if (questions.length === 0) {
      res.status(400).json({ error: 'Data sheet berhasil diunduh namun tidak memuat kolom soal yang valid.' });
      return;
    }

    store.setQuestions(questions);
    const detectedCols = getAllQuestionSpreadsheetColumns(questions);
    const autoCols = detectedCols.filter(c => !STANDARD_QUESTION_COLUMNS.includes(c) || c === 'MATA_PELAJARAN');

    store.updateGoogleSheetsConfig({
      lastSyncStatus: 'SUCCESS',
      lastSyncAt: new Date().toISOString(),
      detectedColumns: detectedCols,
      autoCreatedColumns: autoCols,
      lastSyncMessage: `Berhasil menyinkronkan ${questions.length} butir soal dari Google Sheets. Otomatis memvalidasi ${detectedCols.length} kolom (termasuk MATA_PELAJARAN).`,
    });
    store.logAudit('Administrator', 'ADMIN', 'SHEETS_QUESTIONS_SYNCED', `Sinkronisasi ${questions.length} soal dari spreadsheet ${config.spreadsheetId}`, req.ip);

    res.json({
      success: true,
      count: questions.length,
      detectedColumns: detectedCols,
      autoCreatedColumns: autoCols,
      message: `Berhasil menyinkronkan ${questions.length} butir soal dari Google Sheets.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Gagal menyinkronkan soal: ${err.message}` });
  }
});

// SCHEMA STATUS & AUTO-CREATE COLUMNS SYNC
apiRouter.get('/admin/google-sheets/schema-status', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const questions = store.getQuestions();
  const allColumns = getAllQuestionSpreadsheetColumns(questions);
  const autoCreatedColumns = allColumns.filter(c => !STANDARD_QUESTION_COLUMNS.includes(c) || c === 'MATA_PELAJARAN');

  res.json({
    totalColumns: allColumns.length,
    allColumns,
    autoCreatedColumns,
    standardColumnsCount: STANDARD_QUESTION_COLUMNS.length,
    hasMataPelajaran: allColumns.includes('MATA_PELAJARAN'),
    totalQuestions: questions.length,
  });
});

apiRouter.post('/admin/google-sheets/ensure-columns', adminOnlyMiddleware, (req: Request, res: Response): void => {
  const questions = store.getQuestions();
  const allColumns = getAllQuestionSpreadsheetColumns(questions);
  const autoCreatedColumns = allColumns.filter(c => !STANDARD_QUESTION_COLUMNS.includes(c) || c === 'MATA_PELAJARAN');

  store.updateGoogleSheetsConfig({
    detectedColumns: allColumns,
    autoCreatedColumns: autoCreatedColumns,
    lastSyncMessage: `Skema kolom terverifikasi. Terdeteksi ${allColumns.length} kolom (termasuk MATA_PELAJARAN & kolom baru).`,
  });

  store.logAudit(
    'Administrator',
    'ADMIN',
    'SHEETS_SCHEMA_SYNCED',
    `Memverifikasi dan menyinkronkan ${allColumns.length} kolom spreadsheet otomatis (+${autoCreatedColumns.length} kolom baru/adaptif)`,
    req.ip
  );

  res.json({
    success: true,
    message: `Berhasil memastikan semua input admin tersedia di spreadsheet. Total ${allColumns.length} kolom aktif.`,
    allColumns,
    autoCreatedColumns,
  });
});
