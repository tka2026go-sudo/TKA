import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenProfile }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand with custom image logo */}
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" className="shadow-xs" />
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              {title || 'TRY OUT TKA SMP'}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: User info & logout */}
        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 text-left p-1.5 rounded-xl bg-white/60 hover:bg-white/90 border border-white/80 backdrop-blur-md shadow-2xs transition-all"
              title="Profil Pengguna"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50/80 border border-blue-200/80 text-blue-700 flex items-center justify-center text-xs font-semibold">
                {user.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {user.role === 'ADMIN' ? 'Proktor Administrator' : `${user.kelas || 'Murid'} · ${user.nisn}`}
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white/60 hover:bg-red-50/80 border border-white/80 hover:border-red-200 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 shadow-2xs"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
