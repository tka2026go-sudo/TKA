import React from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ViolationAlertModalProps {
  isOpen: boolean;
  penaltySeconds: number;
  totalPenaltySeconds: number;
  remainingSeconds: number;
  onClose: () => void;
}

export const ViolationAlertModal: React.FC<ViolationAlertModalProps> = ({
  isOpen,
  penaltySeconds,
  totalPenaltySeconds,
  remainingSeconds,
  onClose,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} menit ${s} detik`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Peringatan Integritas Layar Ujian"
      preventBackdropClick={true}
      maxWidth="md"
    >
      <div className="space-y-4 text-center sm:text-left">
        <div className="mx-auto sm:mx-0 w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-700 font-medium">
            Sistem mendeteksi bahwa Anda telah berpindah tab, meminimalkan jendela, atau membuka aplikasi lain saat ujian berlangsung.
          </p>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
            <div className="flex items-center justify-between font-semibold">
              <span>Pengurangan Waktu:</span>
              <span className="text-red-700 font-bold">-{penaltySeconds} Detik</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Penalti Akumulasi:</span>
              <span>{totalPenaltySeconds} Detik</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 font-medium">
              <span>Sisa Waktu Tersinkronisasi:</span>
              <span className="font-mono">{formatTime(remainingSeconds)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Peristiwa ini telah dicatat pada sistem log proktor sekolah. Dilarang meninggalkan layar ujian kembali agar waktu Anda tidak berkurang hingga habis.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[46px] px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-transform active:scale-98"
          >
            Saya Mengerti & Lanjutkan Pengerjaan
          </button>
        </div>
      </div>
    </Modal>
  );
};
