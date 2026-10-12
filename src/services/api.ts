import {
  Question,
  Student,
  ExamSchedule,
  SecuritySettings,
  ExamSession,
  AuditLogEntry,
  GoogleSheetsConfig,
} from '../types';

class ApiService {
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
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...((options.headers as Record<string, string>) || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {
        // use fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth
  async login(username: string, password: string, role?: string) {
    return this.request<{
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
  }

  async getMe() {
    return this.request<{
      role: 'ADMIN' | 'STUDENT';
      name: string;
      nisn?: string;
      kelas?: string;
      nomorInduk?: string;
      mustChangePassword?: boolean;
    }>('/auth/me');
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Student Exam
  async getStudentExams() {
    return this.request<{ exams: (ExamSchedule & { questionsCount: number; session: any })[] }>('/student/exams');
  }

  async startExam(examId: string) {
    return this.request<{
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
  }

  async getExamSession(sessionId: string) {
    return this.request<{
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
  }

  async saveAnswer(sessionId: string, questionId: string, answer: any) {
    return this.request<{ success: boolean; savedAt: string }>('/student/exam/save-answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionId, answer }),
    });
  }

  async toggleReview(sessionId: string, questionId: string) {
    return this.request<{ success: boolean; isMarked: boolean; reviewedQuestions: string[] }>(
      '/student/exam/toggle-review',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, questionId }),
      }
    );
  }

  async reportViolation(
    sessionId: string,
    eventId: string,
    eventType: 'visibility_hidden' | 'page_hide' | 'fullscreen_exit',
    eventDescription: string
  ) {
    return this.request<{
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
  }

  async heartbeat(sessionId: string) {
    return this.request<{
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
  }

  async submitExam(sessionId: string) {
    return this.request<{ success: boolean; status: string; submittedAt: string }>('/student/exam/submit', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async getExamResult(sessionId: string) {
    return this.request<any>(`/student/exam/result/${sessionId}`);
  }

  // Admin
  async getAdminOverview() {
    return this.request<{
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
  }

  async getAdminMonitoring(examId: string) {
    return this.request<{
      exam: ExamSchedule;
      questionsCount: number;
      participants: any[];
    }>(`/admin/monitoring/${examId}`);
  }

  async forceSubmit(sessionId: string) {
    return this.request<{ success: boolean; message: string }>('/admin/monitoring/force-submit', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async resetSession(sessionId: string) {
    return this.request<{ success: boolean; message: string }>('/admin/monitoring/reset-session', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async getAdminQuestions(params: { paket?: string; mapel?: string; elemen?: string; bentuk?: string; search?: string } = {}) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ questions: Question[] }>(`/admin/questions?${qs}`);
  }

  async saveQuestion(question: Question) {
    return this.request<{ success: boolean; question: Question }>('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    });
  }

  async importQuestionsCsv(csvText: string, mode: 'replace' | 'append' = 'append') {
    return this.request<{ success: boolean; count: number; message: string }>('/admin/questions/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvText, mode }),
    });
  }

  async getAdminSchedules() {
    return this.request<{ schedules: ExamSchedule[] }>('/admin/schedules');
  }

  async saveSchedule(schedule: ExamSchedule) {
    return this.request<{ success: boolean; schedule: ExamSchedule }>('/admin/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  }

  async getSecuritySettings() {
    return this.request<{ settings: SecuritySettings }>('/admin/security-settings');
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>) {
    return this.request<{ success: boolean; settings: SecuritySettings }>('/admin/security-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getAdminStudents() {
    return this.request<{ students: Student[] }>('/admin/students');
  }

  async saveStudent(student: Partial<Student>) {
    return this.request<{ success: boolean; student: Student }>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  async resetStudentPassword(nisn: string) {
    return this.request<{ success: boolean; message: string }>('/admin/students/reset-password', {
      method: 'POST',
      body: JSON.stringify({ nisn }),
    });
  }

  async importStudentsCsv(csvText: string) {
    return this.request<{ success: boolean; count: number; message: string }>('/admin/students/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvText }),
    });
  }

  async getAdminResults(examId: string) {
    return this.request<{
      exam: ExamSchedule;
      totalQuestions: number;
      totalParticipants: number;
      totalCompleted: number;
      avgScore: number;
      highestScore: number;
      lowestScore: number;
      results: any[];
    }>(`/admin/results/${examId}`);
  }

  async getAuditLogs() {
    return this.request<{ logs: AuditLogEntry[] }>('/admin/audit-logs');
  }

  async getGoogleSheetsConfig() {
    return this.request<{ config: GoogleSheetsConfig }>('/admin/google-sheets');
  }

  async updateGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>) {
    return this.request<{ success: boolean; config: GoogleSheetsConfig }>('/admin/google-sheets/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async testSheetsConnection() {
    return this.request<any>('/admin/google-sheets/test-connection', { method: 'POST' });
  }

  async syncQuestionsFromSheets() {
    return this.request<any>('/admin/google-sheets/sync-questions', { method: 'POST' });
  }

  async getSpreadsheetSchemaStatus() {
    return this.request<{
      totalColumns: number;
      allColumns: string[];
      autoCreatedColumns: string[];
      standardColumnsCount: number;
      hasMataPelajaran: boolean;
      totalQuestions: number;
    }>('/admin/google-sheets/schema-status');
  }

  async ensureSpreadsheetColumns() {
    return this.request<{
      success: boolean;
      message: string;
      allColumns: string[];
      autoCreatedColumns: string[];
    }>('/admin/google-sheets/ensure-columns', { method: 'POST' });
  }

  getExportQuestionsUrl(params: { paket?: string; mapel?: string } = {}) {
    const qs = new URLSearchParams(params as any).toString();
    const token = localStorage.getItem('tka_token');
    const tokenParam = token ? `token=${encodeURIComponent(token)}` : '';
    const fullQuery = [tokenParam, qs].filter(Boolean).join('&');
    return `/api/admin/questions/export-csv${fullQuery ? `?${fullQuery}` : ''}`;
  }

  getQuestionsTemplateUrl() {
    const token = localStorage.getItem('tka_token');
    return token ? `/api/admin/questions/template-csv?token=${encodeURIComponent(token)}` : '/api/admin/questions/template-csv';
  }

  getExportStudentsUrl() {
    const token = localStorage.getItem('tka_token');
    return token ? `/api/admin/students/export-csv?token=${encodeURIComponent(token)}` : '/api/admin/students/export-csv';
  }

  getExportResultsUrl(examId: string) {
    const token = localStorage.getItem('tka_token');
    return token ? `/api/admin/results/${examId}/export-csv?token=${encodeURIComponent(token)}` : `/api/admin/results/${examId}/export-csv`;
  }
}

export const api = new ApiService();
