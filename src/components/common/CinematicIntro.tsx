import React, { useState, useEffect } from 'react';
import { APP_LOGO_URL } from './BrandLogo';
import { ShieldCheck, Cpu, Database, CheckCircle2 } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
  durationSeconds?: number;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  durationSeconds = 5,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const totalMs = durationSeconds * 1000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setProgress(currentProgress);

      if (elapsed >= totalMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 600); // Smooth fade-out transition
      }
    }, 35);

    return () => clearInterval(interval);
  }, [totalMs, onComplete]);

  // Phase text based on percentage
  const getStatusText = (pct: number) => {
    if (pct < 24) return 'Menginisialisasi Protokol Keamanan & Enkripsi CBT...';
    if (pct < 48) return 'Memuat Bank Soal & Pemetaan Kompetensi Asesmen...';
    if (pct < 72) return 'Menghubungkan Server Ujian & Parameter Jadwal Sesi...';
    if (pct < 92) return 'Mempersiapkan Lingkungan Antarmuka Asesmen Interaktif...';
    return 'Sistem Terverifikasi Penuh. Membuka Halaman Utama...';
  };

  const getStatusIcon = (pct: number) => {
    if (pct < 24) return <ShieldCheck className="w-4 h-4 text-blue-300 animate-pulse" />;
    if (pct < 48) return <Database className="w-4 h-4 text-blue-400 animate-pulse" />;
    if (pct < 72) return <Cpu className="w-4 h-4 text-blue-300 animate-pulse" />;
    if (pct < 92) return <ShieldCheck className="w-4 h-4 text-blue-200 animate-pulse" />;
    return <CheckCircle2 className="w-4 h-4 text-blue-200" />;
  };

  const remainingSeconds = Math.max(0, ((100 - progress) / 100) * durationSeconds).toFixed(1);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, #0e2f63 0%, #07193a 58%, #030c1e 100%)',
      }}
    >
      {/* Background ambient logo blue glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-800/25 blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* Top Header branding pill */}
      <div className="w-full max-w-4xl flex items-center justify-center z-10 pt-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/40 border border-blue-400/20 backdrop-blur-md shadow-inner">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span className="text-[11px] font-semibold tracking-wider text-blue-200 uppercase">
            Sistem CBT TKA SMP 2026
          </span>
        </div>
      </div>

      {/* Center Cinematic Spinning Logo & Branding */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 px-4 max-w-md w-full">
        {/* Animated Rotating 3D/Orbit Logo Wrapper */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer glowing pulsing orb based on logo blue */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-blue-700/40 via-blue-500/30 to-blue-400/40 blur-xl animate-pulse" />

          {/* Outer rotating dashed tech ring */}
          <div
            className="absolute -inset-4 sm:-inset-5 rounded-full border border-dashed border-blue-400/40 pointer-events-none"
            style={{ animation: 'spin-slow 12s linear infinite' }}
          />

          {/* Counter-rotating gradient thin ring */}
          <div
            className="absolute -inset-2 rounded-full border border-blue-300/30 pointer-events-none"
            style={{ animation: 'spin-slow 8s linear infinite reverse' }}
          />

          {/* Center Rotating Brand Logo container */}
          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-900/30 p-2 shadow-2xl shadow-blue-950/80 border border-blue-300/35 backdrop-blur-xl flex items-center justify-center animate-spin-3d"
          >
            <div className="w-full h-full rounded-2xl bg-white p-2 shadow-inner overflow-hidden flex items-center justify-center border border-white/60">
              <img
                src={APP_LOGO_URL}
                alt="Logo TKA SMP"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Title & Tagline with Cinematic Glow */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm flex items-center justify-center gap-2">
            <span>TRY OUT TKA SMP</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-blue-100/90 max-w-xs mx-auto leading-relaxed">
            Sistem Komputerisasi Tes Kemampuan Akademik Berbasis Standar Nasional
          </p>
        </div>

        {/* 5-Second Circular/Step Countdown Indicator */}
        <div className="mt-8 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-950/50 border border-blue-400/30 backdrop-blur-md shadow-sm">
          {getStatusIcon(progress)}
          <span className="text-xs font-mono font-bold text-blue-200 tracking-wide">
            {remainingSeconds}s
          </span>
          <span className="text-[11px] text-blue-300/80 font-mono">
            ({progress}%)
          </span>
        </div>
      </div>

      {/* Bottom Loading Progress Bar & Dynamic Status Messages */}
      <div className="w-full max-w-md z-10 pb-4 sm:pb-6 space-y-3">
        {/* Status text */}
        <div className="flex items-center justify-between text-xs text-blue-200 px-1">
          <span className="truncate pr-2 font-medium text-blue-100">
            {getStatusText(progress)}
          </span>
          <span className="font-mono font-bold text-blue-300 shrink-0">
            {progress}%
          </span>
        </div>

        {/* Cinematic Progress Bar based on logo blue */}
        <div className="w-full h-2 rounded-full bg-blue-950/70 border border-blue-400/25 p-0.5 overflow-hidden backdrop-blur-md relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-400 transition-all duration-75 ease-out shadow-sm shadow-blue-500/50 relative"
            style={{ width: `${progress}%` }}
          >
            {/* Leading shine light on the progress bar head */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full blur-[1px] opacity-80" />
          </div>
        </div>

        {/* Footer subtext */}
        <p className="text-[10px] text-center text-blue-300/70 tracking-wider uppercase font-medium">
          Aman · Terintegrasi · Kurikulum Merdeka
        </p>
      </div>
    </div>
  );
};

