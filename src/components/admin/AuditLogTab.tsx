import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLogEntry } from '../../types';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  User,
  Activity,
  RefreshCw
} from 'lucide-react';

export const AuditLogTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditLogs();
      setLogs(res.logs);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (roleFilter !== 'ALL' && l.actorRole !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Cari Log Aktivitas
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari aktor, aksi, atau detail..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="w-36">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Peran Aktor
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Peran</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STUDENT">MURID</option>
              <option value="SYSTEM">SISTEM</option>
            </select>
          </div>
        </div>

        <div className="pt-2 md:pt-0 shrink-0">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Segarkan Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-44">Waktu</th>
                <th className="py-3 px-3">Aktor</th>
                <th className="py-3 px-3">Peran</th>
                <th className="py-3 px-3">Aksi</th>
                <th className="py-3 px-4">Detail Peristiwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    Tidak ada catatan audit yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const roleBadge = {
                    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
                    STUDENT: 'bg-blue-50 text-blue-700 border-blue-200',
                    SYSTEM: 'bg-slate-100 text-slate-600 border-slate-200',
                  }[l.actorRole] || 'bg-slate-100 text-slate-600';

                  const isViolation = l.action === 'EXAM_VIOLATION';

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {l.actor}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadge}`}>
                          {l.actorRole}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[11px]">
                        <span className={isViolation ? 'text-red-700' : 'text-slate-800'}>
                          {l.action}
                        </span>
                      </td>

                      <td className={`py-3 px-4 text-xs leading-relaxed ${isViolation ? 'text-red-900 font-medium' : 'text-slate-600'}`}>
                        {l.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
