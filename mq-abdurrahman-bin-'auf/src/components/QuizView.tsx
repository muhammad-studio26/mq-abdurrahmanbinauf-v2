import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Pause,
  Trophy,
  Volume2,
  XCircle
} from 'lucide-react';
import type {
  QuizQuestion,
  ScoreRecord,
  StudyMode,
  UserProfile
} from '../types';

interface QuizActiveViewProps {
  user: UserProfile;
  studyMode: StudyMode;
  questions: QuizQuestion[];
  currentQIndex: number;
  selectedOption: number | null;
  isAnswerSubmitted: boolean;
  onSelectOption: (idx: number) => void;
  onNextQuestion: () => void;
  onCancel: () => void;
}

export const QuizActiveView: React.FC<QuizActiveViewProps> = ({
  user,
  studyMode,
  questions,
  currentQIndex,
  selectedOption,
  isAnswerSubmitted,
  onSelectOption,
  onNextQuestion,
  onCancel
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const q = questions[currentQIndex];

  // Stop audio cleanly whenever question changes or view unmounts
  useEffect(() => {
    setAudioError(false);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentQIndex]);

  if (!q) return null;

  const progressPct = Math.round(((currentQIndex + 1) / questions.length) * 100);

  const toggleAudio = async () => {
    if (!q.audioUrl || !audioRef.current) return;
    setAudioError(false);
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      try {
        if (audioRef.current.src !== q.audioUrl) {
          audioRef.current.src = q.audioUrl;
        }
        await audioRef.current.play();
        setIsPlayingAudio(true);
      } catch {
        setIsPlayingAudio(false);
        setAudioError(true);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => {
          setIsPlayingAudio(false);
          setAudioError(true);
        }}
        className="hidden"
      />

      {/* Top Controls & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onCancel();
            }}
            className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0A192F] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Batalkan sesi</span>
          </button>

          <span className="text-xs font-bold text-[#0A192F] tabular-nums">
            Soal {currentQIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0A192F] transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[#7C5D10]">
            {user.mode === 'guest'
              ? `${studyMode} · Tingkat Uji Coba`
              : `${studyMode} · Tingkat ${user.tingkatan}`}
          </span>
          {q.surahName && (
            <span className="font-medium text-slate-500 tabular-nums">
              {q.surahName} : {q.ayahNumber}
            </span>
          )}
        </div>

        <p className="text-sm sm:text-base font-bold text-[#0A192F] leading-relaxed">
          {q.questionText}
        </p>

        {q.arabicPrompt && (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-right">
            <p
              dir="rtl"
              lang="ar"
              className="font-arabic text-2xl sm:text-3xl leading-[2.2] text-[#0A192F]"
            >
              {q.arabicPrompt}
            </p>
          </div>
        )}

        {q.audioUrl && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={toggleAudio}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] text-xs font-bold transition-colors cursor-pointer"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Jeda Murottal</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Putar Audio Murottal Ayat</span>
                </>
              )}
            </button>
            {audioError && (
              <span className="text-xs text-rose-700 font-medium">
                Audio gagal dimuat. Periksa koneksi internet Anda.
              </span>
            )}
          </div>
        )}
      </section>

      {/* Options A, B, C, D */}
      <div className="space-y-2.5">
        {q.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === q.correctIndex;
          let btnStyle =
            'bg-white border-slate-200 text-[#0A192F] hover:border-[#0A192F]';

          if (studyMode === 'Latihan Bebas' && isAnswerSubmitted) {
            if (isCorrect) {
              btnStyle =
                'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600';
            } else if (isSelected && !isCorrect) {
              btnStyle = 'bg-rose-50 border-rose-600 text-rose-950';
            }
          } else if (isSelected) {
            btnStyle = 'bg-[#0A192F] text-[#F4D06F] border-[#D4AF37]';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectOption(idx)}
              className={`w-full min-h-[54px] p-4 rounded-2xl border text-left transition-colors flex items-center justify-between gap-3.5 cursor-pointer ${btnStyle}`}
            >
              <span className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center font-bold text-xs shrink-0 tabular-nums">
                {String.fromCharCode(65 + idx)}
              </span>
              <span
                dir={q.arabicPrompt ? 'rtl' : 'ltr'}
                lang={q.arabicPrompt ? 'ar' : 'id'}
                className={`flex-1 ${
                  q.arabicPrompt
                    ? 'font-arabic text-xl sm:text-2xl leading-[2] text-right'
                    : 'text-sm font-semibold'
                }`}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Instant Feedback in Latihan Bebas */}
      {studyMode === 'Latihan Bebas' && isAnswerSubmitted && (
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
            selectedOption === q.correctIndex
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {selectedOption === q.correctIndex ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold mb-1">
              {selectedOption === q.correctIndex
                ? 'Mumtaz — Jawabanmu Benar'
                : 'Kurang Tepat — Tetap Semangat Muraja’ah'}
            </p>
            <p>{q.explanation}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={selectedOption === null}
        onClick={() => {
          if (audioRef.current) audioRef.current.pause();
          onNextQuestion();
        }}
        className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-[#0A192F] hover:bg-[#112240] disabled:opacity-40 text-[#F4D06F] font-bold text-sm shadow-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>
          {currentQIndex + 1 === questions.length
            ? 'Selesaikan & Lihat Nilai'
            : 'Soal Berikutnya'}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

interface QuizResultViewProps {
  latest: ScoreRecord | undefined;
  questions: QuizQuestion[];
  userAnswers: number[];
  isGuest?: boolean;
  onRetry: () => void;
  onOpenRapor: () => void;
  onOpenSantriLogin?: () => void;
  onHome: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  latest,
  questions,
  userAnswers,
  isGuest = false,
  onRetry,
  onOpenRapor,
  onOpenSantriLogin,
  onHome
}) => {
  if (!latest) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-8 rounded-3xl border border-[#D4AF37]/40 shadow-lg text-center">
        <Trophy className="w-12 h-12 text-[#F4D06F] mx-auto mb-3" />
        <p className="text-xs font-semibold text-[#F4D06F]">
          Hasil {latest.mode_belajar} · {latest.jenis_kuis}
        </p>
        <h1 className="text-5xl font-extrabold my-3 text-white tabular-nums">
          {latest.skor}
        </h1>
        <p className="text-sm text-slate-200 tabular-nums">
          Benar {latest.benar} dari {latest.jumlah_soal} Soal ·{' '}
          {isGuest ? 'Tingkat Uji Coba' : `Tingkat ${latest.tingkatan}`}
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[48px] py-3 px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs sm:text-sm text-[#0A192F] transition-colors cursor-pointer"
        >
          Ulangi Kuis
        </button>
        {isGuest && onOpenSantriLogin ? (
          <button
            type="button"
            onClick={onOpenSantriLogin}
            className="min-h-[48px] py-3 px-4 rounded-2xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Masuk Akun Santri
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenRapor}
            className="min-h-[48px] py-3 px-4 rounded-2xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Buka Rapor & Klasemen
          </button>
        )}
        <button
          type="button"
          onClick={onHome}
          className="min-h-[48px] py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-xs sm:text-sm text-slate-700 transition-colors cursor-pointer"
        >
          Ke Beranda
        </button>
      </div>

      {/* Pembahasan Soal */}
      {questions.length > 0 && (
        <section className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
          <h2 className="font-extrabold text-base text-[#0A192F]">
            Ringkasan Jawaban
          </h2>
          <div className="divide-y divide-slate-100">
            {questions.map((q, idx) => {
              const userAns = userAnswers[idx];
              const isRight = userAns === q.correctIndex;
              return (
                <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500 tabular-nums">
                      Soal {idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        isRight ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isRight ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Benar</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Perlu Muraja'ah</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0A192F]">
                    {q.questionText}
                  </p>
                  {q.arabicPrompt && (
                    <p
                      dir="rtl"
                      lang="ar"
                      className="font-arabic text-xl leading-[1.9] text-[#0A192F] bg-slate-50 p-3 rounded-xl"
                    >
                      {q.arabicPrompt}
                    </p>
                  )}
                  <p className="text-xs text-slate-600">
                    Jawaban tepat:{' '}
                    <span
                      dir={q.arabicPrompt ? 'rtl' : 'ltr'}
                      className={
                        q.arabicPrompt
                          ? 'font-arabic text-base font-bold text-[#0A192F]'
                          : 'font-bold text-[#0A192F]'
                      }
                    >
                      {q.options[q.correctIndex]}
                    </span>
                  </p>
                  {q.explanation && (
                    <p className="text-xs text-slate-500">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
