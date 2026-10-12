import {
  Question,
  Student,
  ExamSchedule,
  SecuritySettings,
  ExamSession,
  AuditLogEntry,
  GoogleSheetsConfig,
} from '../types';
import { clientStore } from './clientStore';

class ApiService {
  public isStandalone: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Auto-detect Netlify, GitHub Pages, or Vercel static deployments
      if (
        hostname.includes('netlify.app') ||
        hostname.includes('github.io') ||
        hostname.includes('pages.dev') ||
        hostname.includes('vercel.app') ||
        window.location.protocol === 'file:'
      ) {
        this.isStandalone = true;
        console.log('[CBT TKA] Running in Standalone / Netlify Static Mode.');
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('tka_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.isStandalone) {
      throw new Error('STANDALONE_FALLBACK');
    }

    try {
      const res = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...((options.headers as Record<string, string>) || {}),
        },
      });

      // Check if response is HTML (common on Netlify when /api route 404s and redirects to index.html)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        this.isStandalone = true;
        console.warn(`[CBT TKA] /api${endpoint} returned HTML (Netlify static host detected). Switching to standalone mode.`);
        throw new Error('STANDALONE_FALLBACK');
      }

      if (res.status === 404) {
        this.isStandalone = true;
        console.warn(`[CBT TKA] /api${endpoint} returned 404. Switching to standalone mode.`);
        throw new Error('STANDALONE_FALLBACK');
      }

      if (!res.ok) {
        let errorMsg = `HTTP Error ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          // fallback error msg
        }
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (
        err.message === 'STANDALONE_FALLBACK' ||
        err.name === 'TypeError' ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('Load failed')
      ) {
        this.isStandalone = true;
        throw new Error('STANDALONE_FALLBACK');
      }
      throw err;
    }
  }

  // --- Auth ---
  async login(username: string, password: string, role?: string) {
    if (this.isStandalone) {
      return clientStore.login(username, password, role);
    }

    try {
      return await this.request<{
        token: string;
        role: 'ADMIN' | 'STUDENT';
        name: string;
        nisn?: string;
        kelas?: string;
        nomorInduk?: string;
        mustChangePassword?: boolean;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, role }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.login(username, password, role);
      }
      throw err;
    }
  }

  async getMe() {
    const token = localStorage.getItem('tka_token') || '';
    if (this.isStandalone || token.startsWith('standalone_')) {
      return clientStore.getMe(token);
    }

    try {
      return await this.request<{
        role: 'ADMIN' | 'STUDENT';
        name: string;
        nisn?: string;
        kelas?: string;
        nomorInduk?: string;
        mustChangePassword?: boolean;
      }>('/auth/me');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getMe(token);
      }
      throw err;
    }
  }

  async logout() {
    if (this.isStandalone) {
      return { success: true };
    }
    try {
      return await this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } catch {
      return { success: true };
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    if (this.isStandalone) {
      return clientStore.changePassword(newPassword);
    }
    try {
      return await this.request<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.changePassword(newPassword);
      }
      throw err;
    }
  }

  // --- Student Exam ---
  async getStudentExams() {
    if (this.isStandalone) {
      const user = clientStore.getMe(localStorage.getItem('tka_token') || '');
      return clientStore.getStudentExams(user.nisn);
    }
    try {
      return await this.request<{ exams: (ExamSchedule & { questionsCount: number; session: any })[] }>('/student/exams');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        const user = clientStore.getMe(localStorage.getItem('tka_token') || '');
        return clientStore.getStudentExams(user.nisn);
      }
      throw err;
    }
  }

  async startExam(examId: string) {
    if (this.isStandalone) {
      const user = clientStore.getMe(localStorage.getItem('tka_token') || '');
      return clientStore.startExam(user.nisn || '0081234567', examId);
    }
    try {
      return await this.request<{
        sessionId: string;
        status: string;
        startTime: string;
        effectiveEndTime: string;
        alreadyCompleted?: boolean;
        message?: string;
      }>('/student/exam/start', {
        method: 'POST',
        body: JSON.stringify({ examId }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        const user = clientStore.getMe(localStorage.getItem('tka_token') || '');
        return clientStore.startExam(user.nisn || '0081234567', examId);
      }
      throw err;
    }
  }

  async getExamSession(sessionId: string) {
    if (this.isStandalone) {
      return clientStore.getExamSession(sessionId);
    }
    try {
      return await this.request<{
        session: {
          id: string;
          examId: string;
          status: string;
          startTime: string;
          effectiveEndTime: string;
          originalEndTime: string;
          remainingSeconds: number;
          serverTime: string;
          totalPenaltySeconds: number;
          violationsCount: number;
          answers: Record<string, any>;
          reviewedQuestions: string[];
        };
        exam: {
          id: string;
          mataPelajaran?: string;
          title: string;
          description: string;
          durationMinutes: number;
          paketId: string;
        };
        securitySettings: SecuritySettings;
        questions: Question[];
      }>(`/student/exam/session/${sessionId}`);
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getExamSession(sessionId);
      }
      throw err;
    }
  }

  async saveAnswer(sessionId: string, questionId: string, answer: any) {
    if (this.isStandalone) {
      return clientStore.saveAnswer(sessionId, questionId, answer);
    }
    try {
      return await this.request<{ success: boolean; savedAt: string }>('/student/exam/save-answer', {
        method: 'POST',
        body: JSON.stringify({ sessionId, questionId, answer }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.saveAnswer(sessionId, questionId, answer);
      }
      throw err;
    }
  }

  async toggleReview(sessionId: string, questionId: string) {
    if (this.isStandalone) {
      return clientStore.toggleReview(sessionId, questionId);
    }
    try {
      return await this.request<{ success: boolean; isMarked: boolean; reviewedQuestions: string[] }>(
        '/student/exam/toggle-review',
        {
          method: 'POST',
          body: JSON.stringify({ sessionId, questionId }),
        }
      );
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.toggleReview(sessionId, questionId);
      }
      throw err;
    }
  }

  async reportViolation(
    sessionId: string,
    eventId: string,
    eventType: 'visibility_hidden' | 'page_hide' | 'fullscreen_exit',
    eventDescription: string
  ) {
    if (this.isStandalone) {
      return clientStore.reportViolation(sessionId, eventId, eventType, eventDescription);
    }
    try {
      return await this.request<{
        success: boolean;
        penaltyApplied: number;
        totalPenaltySeconds: number;
        remainingSeconds: number;
        effectiveEndTime: string;
        violationsCount: number;
        status: string;
        deduplicated?: boolean;
      }>('/student/exam/report-violation', {
        method: 'POST',
        body: JSON.stringify({ sessionId, eventId, eventType, eventDescription }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.reportViolation(sessionId, eventId, eventType, eventDescription);
      }
      throw err;
    }
  }

  async heartbeat(sessionId: string) {
    if (this.isStandalone) {
      return clientStore.heartbeat(sessionId);
    }
    try {
      return await this.request<{
        status: string;
        serverTime: string;
        remainingSeconds: number;
        totalPenaltySeconds: number;
        violationsCount: number;
        effectiveEndTime: string;
      }>('/student/exam/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.heartbeat(sessionId);
      }
      throw err;
    }
  }

  async submitExam(sessionId: string) {
    if (this.isStandalone) {
      return clientStore.submitExam(sessionId);
    }
    try {
      return await this.request<{ success: boolean; status: string; submittedAt: string }>('/student/exam/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.submitExam(sessionId);
      }
      throw err;
    }
  }

  async getExamResult(sessionId: string) {
    if (this.isStandalone) {
      return clientStore.getExamResult(sessionId);
    }
    try {
      return await this.request<any>(`/student/exam/result/${sessionId}`);
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getExamResult(sessionId);
      }
      throw err;
    }
  }

  // --- Admin ---
  async getAdminOverview() {
    if (this.isStandalone) {
      return clientStore.getAdminOverview();
    }
    try {
      return await this.request<{
        totalQuestions: number;
        paketCounts: Record<string, number>;
        totalStudents: number;
        totalSchedules: number;
        activeSessionsCount: number;
        submittedSessionsCount: number;
        totalViolations: number;
        totalPenaltySeconds: number;
        averagePercentage: number;
      }>('/admin/overview');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getAdminOverview();
      }
      throw err;
    }
  }

  async getAdminMonitoring(examId: string) {
    if (this.isStandalone) {
      return clientStore.getAdminMonitoring(examId);
    }
    try {
      return await this.request<{
        exam: ExamSchedule;
        questionsCount: number;
        participants: any[];
      }>(`/admin/monitoring/${examId}`);
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getAdminMonitoring(examId);
      }
      throw err;
    }
  }

  async forceSubmit(sessionId: string) {
    if (this.isStandalone) {
      return clientStore.forceSubmit(sessionId);
    }
    try {
      return await this.request<{ success: boolean; message: string }>('/admin/monitoring/force-submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.forceSubmit(sessionId);
      }
      throw err;
    }
  }

  async resetSession(sessionId: string) {
    if (this.isStandalone) {
      return clientStore.resetSession(sessionId);
    }
    try {
      return await this.request<{ success: boolean; message: string }>('/admin/monitoring/reset-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.resetSession(sessionId);
      }
      throw err;
    }
  }

  async getAdminQuestions(params: { paket?: string; mapel?: string; elemen?: string; bentuk?: string; search?: string } = {}) {
    if (this.isStandalone) {
      return clientStore.getQuestions(params);
    }
    try {
      const qs = new URLSearchParams(params as any).toString();
      return await this.request<{ questions: Question[] }>(`/admin/questions?${qs}`);
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getQuestions(params);
      }
      throw err;
    }
  }

  async saveQuestion(question: Question) {
    if (this.isStandalone) {
      return clientStore.saveQuestion(question);
    }
    try {
      return await this.request<{ success: boolean; question: Question }>('/admin/questions', {
        method: 'POST',
        body: JSON.stringify(question),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.saveQuestion(question);
      }
      throw err;
    }
  }

  async importQuestionsCsv(csvText: string, mode: 'replace' | 'append' = 'append') {
    if (this.isStandalone) {
      return clientStore.importQuestionsCsv(csvText, mode);
    }
    try {
      return await this.request<{ success: boolean; count: number; message: string }>('/admin/questions/import-csv', {
        method: 'POST',
        body: JSON.stringify({ csvText, mode }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.importQuestionsCsv(csvText, mode);
      }
      throw err;
    }
  }

  async getAdminSchedules() {
    if (this.isStandalone) {
      return clientStore.getSchedules();
    }
    try {
      return await this.request<{ schedules: ExamSchedule[] }>('/admin/schedules');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getSchedules();
      }
      throw err;
    }
  }

  async saveSchedule(schedule: ExamSchedule) {
    if (this.isStandalone) {
      return clientStore.saveSchedule(schedule);
    }
    try {
      return await this.request<{ success: boolean; schedule: ExamSchedule }>('/admin/schedules', {
        method: 'POST',
        body: JSON.stringify(schedule),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.saveSchedule(schedule);
      }
      throw err;
    }
  }

  async getSecuritySettings() {
    if (this.isStandalone) {
      return clientStore.getSecuritySettings();
    }
    try {
      return await this.request<{ settings: SecuritySettings }>('/admin/security-settings');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getSecuritySettings();
      }
      throw err;
    }
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>) {
    if (this.isStandalone) {
      return clientStore.updateSecuritySettings(settings);
    }
    try {
      return await this.request<{ success: boolean; settings: SecuritySettings }>('/admin/security-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.updateSecuritySettings(settings);
      }
      throw err;
    }
  }

  async getAdminStudents() {
    if (this.isStandalone) {
      return clientStore.getStudents();
    }
    try {
      return await this.request<{ students: Student[] }>('/admin/students');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getStudents();
      }
      throw err;
    }
  }

  async saveStudent(student: Partial<Student>) {
    if (this.isStandalone) {
      return clientStore.saveStudent(student);
    }
    try {
      return await this.request<{ success: boolean; student: Student }>('/admin/students', {
        method: 'POST',
        body: JSON.stringify(student),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.saveStudent(student);
      }
      throw err;
    }
  }

  async resetStudentPassword(nisn: string) {
    if (this.isStandalone) {
      return clientStore.resetStudentPassword(nisn);
    }
    try {
      return await this.request<{ success: boolean; message: string }>('/admin/students/reset-password', {
        method: 'POST',
        body: JSON.stringify({ nisn }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.resetStudentPassword(nisn);
      }
      throw err;
    }
  }

  async importStudentsCsv(csvText: string) {
    if (this.isStandalone) {
      return clientStore.importStudentsCsv(csvText);
    }
    try {
      return await this.request<{ success: boolean; count: number; message: string }>('/admin/students/import-csv', {
        method: 'POST',
        body: JSON.stringify({ csvText }),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.importStudentsCsv(csvText);
      }
      throw err;
    }
  }

  async getAdminResults(examId: string) {
    if (this.isStandalone) {
      return clientStore.getAdminResults(examId);
    }
    try {
      return await this.request<{
        exam: ExamSchedule;
        totalQuestions: number;
        totalParticipants: number;
        totalCompleted: number;
        avgScore: number;
        highestScore: number;
        lowestScore: number;
        results: any[];
      }>(`/admin/results/${examId}`);
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getAdminResults(examId);
      }
      throw err;
    }
  }

  async getAuditLogs() {
    if (this.isStandalone) {
      return clientStore.getAuditLogs();
    }
    try {
      return await this.request<{ logs: AuditLogEntry[] }>('/admin/audit-logs');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getAuditLogs();
      }
      throw err;
    }
  }

  async getGoogleSheetsConfig() {
    if (this.isStandalone) {
      return clientStore.getGoogleSheetsConfig();
    }
    try {
      return await this.request<{ config: GoogleSheetsConfig }>('/admin/google-sheets');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getGoogleSheetsConfig();
      }
      throw err;
    }
  }

  async updateGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>) {
    if (this.isStandalone) {
      return clientStore.updateGoogleSheetsConfig(config);
    }
    try {
      return await this.request<{ success: boolean; config: GoogleSheetsConfig }>('/admin/google-sheets/config', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.updateGoogleSheetsConfig(config);
      }
      throw err;
    }
  }

  async testSheetsConnection() {
    const config = (await this.getGoogleSheetsConfig()).config;
    if (!config.spreadsheetUrl) {
      throw new Error('URL Google Sheets belum diatur.');
    }
    let csvUrl = config.spreadsheetUrl;
    if (csvUrl.includes('/edit')) {
      const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }
    try {
      const res = await fetch(csvUrl, { method: 'HEAD' });
      return { success: true, message: `Koneksi ke Google Sheets berhasil diakses (Status: ${res.status}).` };
    } catch {
      // Browser may block HEAD or CORS, but try GET
      try {
        const res = await fetch(csvUrl);
        return { success: true, message: `Koneksi ke Google Sheets berhasil terhubung (Status: ${res.status}).` };
      } catch (err: any) {
        throw new Error(`Gagal terhubung ke Google Sheets: ${err.message || 'Periksa izin bagikan (Anyone with link)'}`);
      }
    }
  }

  async syncQuestionsFromSheets() {
    return clientStore.syncQuestionsFromSheets();
  }

  async getSpreadsheetSchemaStatus() {
    if (this.isStandalone) {
      return clientStore.getSpreadsheetSchemaStatus();
    }
    try {
      return await this.request<{
        totalColumns: number;
        allColumns: string[];
        autoCreatedColumns: string[];
        standardColumnsCount: number;
        hasMataPelajaran: boolean;
        totalQuestions: number;
      }>('/admin/google-sheets/schema-status');
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.getSpreadsheetSchemaStatus();
      }
      throw err;
    }
  }

  async ensureSpreadsheetColumns() {
    if (this.isStandalone) {
      return clientStore.ensureSpreadsheetColumns();
    }
    try {
      return await this.request<{
        success: boolean;
        message: string;
        allColumns: string[];
        autoCreatedColumns: string[];
      }>('/admin/google-sheets/ensure-columns', { method: 'POST' });
    } catch (err: any) {
      if (err.message === 'STANDALONE_FALLBACK') {
        return clientStore.ensureSpreadsheetColumns();
      }
      throw err;
    }
  }

  // Helper to trigger direct client-side CSV download
  downloadCsvFile(filename: string, csvContent: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getExportQuestionsUrl(params: { paket?: string; mapel?: string } = {}) {
    if (this.isStandalone) {
      const csv = clientStore.getExportQuestionsCsv(params.paket, params.mapel);
      return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    }
    const qs = new URLSearchParams(params as any).toString();
    const token = localStorage.getItem('tka_token');
    const tokenParam = token ? `token=${encodeURIComponent(token)}` : '';
    const fullQuery = [tokenParam, qs].filter(Boolean).join('&');
    return `/api/admin/questions/export-csv${fullQuery ? `?${fullQuery}` : ''}`;
  }

  getQuestionsTemplateUrl() {
    if (this.isStandalone) {
      const csv = clientStore.getQuestionsTemplateCsv();
      return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    }
    const token = localStorage.getItem('tka_token');
    return token ? `/api/admin/questions/template-csv?token=${encodeURIComponent(token)}` : '/api/admin/questions/template-csv';
  }

  getExportStudentsUrl() {
    if (this.isStandalone) {
      const csv = clientStore.getExportStudentsCsv();
      return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    }
    const token = localStorage.getItem('tka_token');
    return token ? `/api/admin/students/export-csv?token=${encodeURIComponent(token)}` : '/api/admin/students/export-csv';
  }

  getExportResultsUrl(examId: string) {
    if (this.isStandalone) {
      const csv = clientStore.getExportResultsCsv(examId);
      return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    }
    const token = localStorage.getItem('tka_token');
    return token ? `/api/admin/results/${examId}/export-csv?token=${encodeURIComponent(token)}` : `/api/admin/results/${examId}/export-csv`;
  }
}

export const api = new ApiService();
