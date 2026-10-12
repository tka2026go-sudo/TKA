import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  Info,
  Sparkles
} from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cleanUser = username.trim().toLowerCase();
  const isProctorHint = cleanUser === 'proktor' || cleanUser === 'admin' || cleanUser === 'proctor' || cleanUser === 'pengawas';
  const isStudentHint = /^\d{5,10}$/.test(username.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Harap isi Nama Pengguna / NISN dan Kata Sandi');
      return;
    }

    try {
      setLoading(true);
      // Auto-detect role
      const detectedRole = isProctorHint ? 'ADMIN' : undefined;
      await login(username.trim(), password.trim(), detectedRole);
    } catch (err: any) {
      setError(err.message || 'Kredensial tidak cocok. Silakan periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 pb-safe relative overflow-hidden">
      {/* Decorative ambient glass light orbs in the background */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-indigo-300/25 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="flex justify-center">
            <BrandLogo size="lg" className="shadow-lg shadow-blue-800/10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              TRY OUT TKA SMP
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Sistem Komputerisasi Tes Kemampuan Akademik (CBT)
            </p>
          </div>
        </div>

        {/* Glassmorphic Elevated Card */}
        <div className="glass-panel-elevated py-6 sm:py-8 px-5 sm:px-8 rounded-3xl space-y-5">
          <div className="text-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">
              Masuk ke Sistem Asesmen CBT
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Satu portal terpadu untuk Peserta Ujian dan Proktor Pengawas
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-red-50/90 backdrop-blur-md border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  NISN / Nama Pengguna
                </label>
                {isProctorHint && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    <span>Akses Proktor</span>
                  </span>
                )}
                {isStudentHint && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-blue-600" />
                    <span>Akses Murid</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {isProctorHint ? (
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan NISN siswa atau username 'proktor'"
                  className="w-full min-h-[48px] pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-white/70 backdrop-blur-md border border-slate-200/90 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/80 font-medium text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Nomor Induk siswa atau kata sandi proktor"
                  className="w-full min-h-[48px] pl-10 pr-11 py-3 text-xs sm:text-sm bg-white/70 backdrop-blur-md border border-slate-200/90 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/80 font-medium text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 min-w-[44px] justify-center"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full min-h-[50px] mt-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 shadow-blue-700/25 border border-white/20'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>
                {loading
                  ? 'Memverifikasi Akses...'
                  : isProctorHint
                  ? 'Masuk ke Dashboard Proktor'
                  : 'Masuk ke Sistem CBT'}
              </span>
            </button>
          </form>

          {/* Instructional helper */}
          <div className="pt-3 border-t border-slate-200/60">
            <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span>
                  Sistem otomatis mengarahkan peran: Masukkan <strong>10 digit NISN</strong> untuk peserta ujian, atau ketik <strong>proktor</strong> untuk pengawas ujian.
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 font-medium">
          Dilengkapi sistem pemantauan layar real-time & sinkronisasi server akurat
        </p>
      </div>
    </div>
  );
};

