import React from 'react';
import { Question } from '../../types';
import { X, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, any>;
  reviewedQuestions: string[];
  onSelectIndex: (index: number) => void;
  onClose?: () => void;
  isDrawer?: boolean;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  answers,
  reviewedQuestions,
  onSelectIndex,
  onClose,
  isDrawer = false,
}) => {
  const isAnswered = (qId: string) => {
    const ans = answers[qId];
    if (ans === undefined || ans === null || ans === '') return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    if (typeof ans === 'object' && !Array.isArray(ans) && Object.keys(ans).length === 0) return false;
    return true;
  };

  const answeredCount = questions.filter(q => isAnswered(q.idSoal)).length;
  const reviewCount = reviewedQuestions.length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col h-full shadow-lg shadow-slate-900/5 border border-white/80">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Daftar Nomor Soal</h4>
          <p className="text-xs text-slate-500 mt-0.5">Total {questions.length} Butir Soal Terstandar</p>
        </div>
        {isDrawer && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-200/60 text-[11px] text-slate-600 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-blue-600 shrink-0" />
          <span>Terjawab ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-amber-400 shrink-0" />
          <span>Ragu ({reviewCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-white border border-slate-300 shrink-0" />
          <span>Belum ({unansweredCount})</span>
        </div>
      </div>

      {/* Grid of question numbers */}
      <div className="grid grid-cols-5 sm:grid-cols-5 gap-2.5 pt-4 overflow-y-auto max-h-[460px] pb-2">
        {questions.map((q, idx) => {
          const answered = isAnswered(q.idSoal);
          const isReview = reviewedQuestions.includes(q.idSoal);
          const isCurrent = idx === currentIndex;

          let btnClass = 'bg-white/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-blue-300';
          if (answered) {
            btnClass = 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs';
          }
          if (isReview) {
            btnClass = 'bg-amber-400 text-amber-950 border-amber-500 font-bold shadow-xs';
          }

          return (
            <button
              key={q.idSoal}
              type="button"
              onClick={() => {
                onSelectIndex(idx);
                if (isDrawer && onClose) onClose();
              }}
              className={`relative min-h-[44px] h-11 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-center transition-all ${btnClass} ${
                isCurrent ? 'ring-2 ring-offset-2 ring-blue-600 scale-105 z-10' : ''
              }`}
            >
              <span>{idx + 1}</span>
              {isReview && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-900" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
