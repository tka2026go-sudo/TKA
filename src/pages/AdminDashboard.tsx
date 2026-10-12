import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Header } from '../components/common/Header';
import { OverviewTab } from '../components/admin/OverviewTab';
import { MonitoringTab } from '../components/admin/MonitoringTab';
import { QuestionsTab } from '../components/admin/QuestionsTab';
import { SchedulesTab } from '../components/admin/SchedulesTab';
import { SecurityTab } from '../components/admin/SecurityTab';
import { StudentsTab } from '../components/admin/StudentsTab';
import { ResultsTab } from '../components/admin/ResultsTab';
import { GoogleSheetsTab } from '../components/admin/GoogleSheetsTab';
import { AuditLogTab } from '../components/admin/AuditLogTab';
import {
  LayoutDashboard,
  Activity,
  BookOpen,
  Calendar,
  ShieldAlert,
  Users,
  Award,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [overview, setOverview] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBaseData = async () => {
    try {
      const [ovRes, schRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminSchedules(),
      ]);
      setOverview(ovRes);
      setSchedules(schRes.schedules);
    } catch (err) {
      console.error('Error fetching base admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring Ujian', icon: Activity },
    { id: 'security', label: 'Keamanan & Penalti', icon: ShieldAlert },
    { id: 'questions', label: 'Bank Soal', icon: BookOpen },
    { id: 'schedules', label: 'Jadwal & Paket', icon: Calendar },
    { id: 'students', label: 'Data Murid', icon: Users },
    { id: 'results', label: 'Rekap Nilai', icon: Award },
    { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="ADMINISTRASI CBT TKA SMP"
        subtitle="Pusat Kendali Proktor & Manajemen Asesmen Nasional SMP"
      />

      {/* Admin Tab Navigation Bar with Glassmorphism */}
      <div className="glass-header sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md shadow-blue-900/15 border border-white/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 backdrop-blur-sm'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <OverviewTab
            overview={overview}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'monitoring' && (
          <MonitoringTab schedules={schedules} />
        )}

        {activeTab === 'security' && (
          <SecurityTab />
        )}

        {activeTab === 'questions' && (
          <QuestionsTab />
        )}

        {activeTab === 'schedules' && (
          <SchedulesTab
            schedules={schedules}
            onRefresh={fetchBaseData}
          />
        )}

        {activeTab === 'students' && (
          <StudentsTab />
        )}

        {activeTab === 'results' && (
          <ResultsTab schedules={schedules} />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsTab />
        )}

        {activeTab === 'audit' && (
          <AuditLogTab />
        )}
      </main>
    </div>
  );
};
