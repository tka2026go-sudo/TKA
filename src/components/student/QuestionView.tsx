import React from 'react';
import { Question } from '../../types';
import { Bookmark, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface QuestionViewProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  currentAnswer: any;
  isMarkedForReview: boolean;
  onAnswerChange: (answer: any) => void;
  onToggleReview: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenPalette: () => void;
}

export const QuestionView: React.FC<QuestionViewProps> = ({
  question,
  currentIndex,
  totalQuestions,
  currentAnswer,
  isMarkedForReview,
  onAnswerChange,
  onToggleReview,
  onPrev,
  onNext,
  onOpenPalette,
}) => {
  // Parse options list
  const options: { key: string; text?: string }[] = [
    { key: 'A', text: question.opsiA },
    { key: 'B', text: question.opsiB },
    { key: 'C', text: question.opsiC },
    { key: 'D', text: question.opsiD },
    { key: 'E', text: question.opsiE },
  ].filter(opt => !!opt.text);

  // Parse category choices for PGK-Kategori (e.g., "Benar | Salah" -> ["Benar", "Salah"])
  const categoryChoices = question.kategoriJawaban
    ? question.kategoriJawaban.split('|').map(c => c.trim()).filter(Boolean)
    : ['Benar', 'Salah'];

  const statements = [
    { num: '1', text: question.pernyataan1 },
    { num: '2', text: question.pernyataan2 },
    { num: '3', text: question.pernyataan3 },
  ].filter(s => !!s.text);

  return (
    <div className="flex flex-col gap-5">
      {/* Top Question Info Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="font-bold text-sm text-slate-800">
            Soal {currentIndex + 1}
          </span>
          <span className="text-slate-400">/</span>
          <span>{totalQuestions}</span>
          {question.mataPelajaran && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-700 bg-indigo-50/80 border border-indigo-200/80 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                {question.mataPelajaran}
              </span>
            </>
          )}
          <span className="text-slate-300">·</span>
          <span className="text-slate-700 font-semibold">{question.elemen}</span>
          <span className="text-slate-300">·</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">{question.bentukSoal}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleReview}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
              isMarkedForReview
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isMarkedForReview ? 'fill-amber-600 text-amber-600' : ''}`} />
            <span>{isMarkedForReview ? 'Ragu-ragu' : 'Tandai Ragu'}</span>
          </button>

          <button
            onClick={onOpenPalette}
            className="sm:hidden min-h-[38px] px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            No. Soal
          </button>
        </div>
      </div>

      {/* Stimulus Card (if stimulus is available) */}
      {question.stimulus && (
        <div className="bg-slate-50/70 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          {question.stimulusJudul && (
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
              {question.stimulusJudul}
            </div>
          )}
          <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-normal">
            {question.stimulus}
          </div>
        </div>
      )}

      {/* Question Prompt */}
      <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
        {question.soal}
      </div>

      {/* Answer Inputs based on Bentuk Soal */}
      <div className="mt-1">
        {/* TYPE 1: PG (Single choice) */}
        {question.bentukSoal === 'PG' && (
          <div className="space-y-3">
            {options.map((opt) => {
              const isSelected = currentAnswer === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onAnswerChange(opt.key)}
                  className={`w-full min-h-[52px] p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                    isSelected
                      ? 'bg-blue-50/95 border-blue-600 text-blue-950 ring-1 ring-blue-600 shadow-md shadow-blue-900/5'
                      : 'bg-white/70 backdrop-blur-md border-slate-200/90 hover:border-blue-300 hover:bg-white text-slate-800 shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-bold text-xs mt-0.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {opt.key}
                  </div>
                  <div className="text-sm sm:text-base leading-normal font-normal flex-1 pt-0.5">
                    {opt.text}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 2: PGK-MCMA (Multi choice multi answer) */}
        {question.bentukSoal === 'PGK-MCMA' && (
          <div className="space-y-3">
            <div className="text-xs text-blue-700 bg-blue-50/80 backdrop-blur-md border border-blue-100 px-3 py-2 rounded-xl font-medium">
              Petunjuk: Pilih semua opsi jawaban yang benar (dapat lebih dari satu jawaban).
            </div>
            {options.map((opt) => {
              const selectedList: string[] = Array.isArray(currentAnswer)
                ? currentAnswer
                : (typeof currentAnswer === 'string' && currentAnswer ? currentAnswer.split(',').map(s => s.trim()) : []);
              const isSelected = selectedList.includes(opt.key);

              const handleToggle = () => {
                let updated: string[];
                if (isSelected) {
                  updated = selectedList.filter(k => k !== opt.key);
                } else {
                  updated = [...selectedList, opt.key].sort();
                }
                onAnswerChange(updated);
              };

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={handleToggle}
                  className={`w-full min-h-[52px] p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                    isSelected
                      ? 'bg-blue-50/95 border-blue-600 text-blue-950 ring-1 ring-blue-600 shadow-md shadow-blue-900/5'
                      : 'bg-white/70 backdrop-blur-md border-slate-200/90 hover:border-blue-300 hover:bg-white text-slate-800 shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs mt-0.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : opt.key}
                  </div>
                  <div className="text-sm sm:text-base leading-normal font-normal flex-1 pt-0.5">
                    {opt.text}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 3: PGK-Kategori (Statements with Category choices e.g. Benar / Salah) */}
        {question.bentukSoal === 'PGK-Kategori' && (
          <div className="space-y-4">
            <div className="text-xs text-blue-700 bg-blue-50/70 border border-blue-100 px-3 py-2 rounded-lg font-medium">
              Petunjuk: Tentukan kategori ({categoryChoices.join(' / ')}) untuk setiap pernyataan di bawah ini.
            </div>

            <div className="space-y-3">
              {statements.map((stmt) => {
                const currentAnswerMap = (typeof currentAnswer === 'object' && currentAnswer !== null && !Array.isArray(currentAnswer))
                  ? currentAnswer
                  : {};
                const selectedValue = currentAnswerMap[stmt.num] || '';

                const handlePickCategory = (val: string) => {
                  onAnswerChange({
                    ...currentAnswerMap,
                    [stmt.num]: val,
                  });
                };

                return (
                  <div
                    key={stmt.num}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white/70 backdrop-blur-md shadow-2xs space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {stmt.num}
                      </span>
                      <p className="text-sm sm:text-base text-slate-800 leading-snug flex-1">
                        {stmt.text}
                      </p>
                    </div>

                    {/* Segmented Category Buttons */}
                    <div className="flex items-center flex-wrap gap-2 pt-1 pl-0 sm:pl-9">
                      {categoryChoices.map((choice) => {
                        const isChosen = selectedValue.toLowerCase() === choice.toLowerCase();
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handlePickCategory(choice)}
                            className={`flex-1 sm:flex-none min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all text-center ${
                              isChosen
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-900/10'
                                : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Prev / Next Action Strip */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-3 mt-4">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`min-h-[46px] px-4 py-2.5 rounded-xl border font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors ${
            currentIndex === 0
              ? 'border-slate-100 text-slate-300 cursor-not-allowed'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className={`min-h-[46px] px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
            currentIndex === totalQuestions - 1
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95'
          }`}
        >
          <span>Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
