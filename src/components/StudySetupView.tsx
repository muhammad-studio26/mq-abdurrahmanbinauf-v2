import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardCheck, FileText, RefreshCw, Sprout } from 'lucide-react';
import { TINGKATAN_INFO } from '../data/questions';
import type { QuizType, StudyMode, UserProfile } from '../types';

interface StudySetupViewProps {
  user: UserProfile;
  studyMode: StudyMode;
  setStudyMode: (mode: StudyMode) => void;
  quizType: QuizType;
  setQuizType: (type: QuizType) => void;
  questionCount: 5 | 10 | 40;
  setQuestionCount: (count: 5 | 10 | 40) => void;
  isGeneratingQuiz: boolean;
  onBack: () => void;
  onStartQuiz: () => void;
}

export const StudySetupView: React.FC<StudySetupViewProps> = ({
  user,
  studyMode,
  setStudyMode,
  quizType,
  setQuizType,
  questionCount,
  setQuestionCount,
  isGeneratingQuiz,
  onBack,
  onStartQuiz
}) => {
  const isGuest = user.mode === 'guest';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[40px] inline-flex items-center gap-2 text-xs font-bold text-[#0A192F] hover:text-[#7C5D10] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke beranda</span>
      </button>

      {/* Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-6 sm:p-7 border border-[#D4AF37]/30 shadow-lg">
        <p className="text-xs font-semibold text-[#F4D06F] mb-1.5">
          {isGuest
            ? 'Ruang Latihan Guest · Tingkat Uji Coba'
            : `Ruang Belajar · Tingkat ${user.tingkatan}`}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-balance">
          {isGuest ? 'Latihan Sambung Ayat Pilihan.' : 'Pilih cara belajarmu.'}
        </h1>
        <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
          {isGuest ? (
            <>
              Mode pengunjung umum hanya menyediakan{' '}
              <strong className="text-white">Tingkat Uji Coba</strong> untuk
              latihan Sambung Ayat pilihan.
            </>
          ) : (
            <>
              Belajar dengan tenang, teliti, dan penuh semangat. Cakupan
              hafalanmu:{' '}
              <strong className="text-white">
                {TINGKATAN_INFO[user.tingkatan].desc}
              </strong>
              .
            </>
          )}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Mode Belajar */}
        <section className="space-y-3">
          <h2 className="font-extrabold text-base text-[#0A192F]">Mode belajar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setStudyMode('Latihan Bebas')}
              className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                studyMode === 'Latihan Bebas'
                  ? 'border-[#0A192F] bg-[#0A192F]/5 ring-1 ring-[#D4AF37]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <Sprout className="w-4 h-4 text-[#7C5D10]" />
                <span className="font-bold text-sm text-[#0A192F]">
                  Latihan Bebas
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jawaban langsung dikoreksi di setiap soal beserta penjelasannya.
                Cocok untuk muraja'ah mandiri.
              </p>
            </button>

            {!isGuest && (
              <button
                type="button"
                onClick={() => setStudyMode('Ujian / Setoran')}
                className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                  studyMode === 'Ujian / Setoran'
                    ? 'border-[#0A192F] bg-[#0A192F]/5 ring-1 ring-[#D4AF37]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <ClipboardCheck className="w-4 h-4 text-[#0A192F]" />
                  <span className="font-bold text-sm text-[#0A192F]">
                    Ujian / Setoran
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kunci jawaban dan evaluasi ditampilkan di akhir sesi. Nilai
                  otomatis masuk ke rapor santri.
                </p>
              </button>
            )}
          </div>
        </section>

        {/* Jenis Kuis & Jumlah Soal */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-extrabold text-base text-[#0A192F]">
              {isGuest ? 'Tingkat & Jenis Latihan' : 'Jenis kuis'}
            </h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setQuizType('Sambung Ayat')}
                className={`w-full p-4 rounded-2xl border text-left transition-colors flex items-start gap-3.5 cursor-pointer ${
                  isGuest || quizType === 'Sambung Ayat'
                    ? 'border-[#0A192F] bg-[#0A192F]/5 ring-1 ring-[#D4AF37]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#0A192F]/5 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#0A192F]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0A192F]">
                    {isGuest
                      ? 'Tingkat Uji Coba — Sambung Ayat'
                      : 'Kuis Hafalan — Sambung Ayat'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isGuest
                      ? "Latihan Sambung Ayat Pilihan dilengkapi audio murottal Syekh Mishary Al-Afasy."
                      : `Melanjutkan ayat Al-Qur'an (${TINGKATAN_INFO[user.tingkatan].desc}) dilengkapi audio murottal Syekh Mishary Al-Afasy.`}
                  </p>
                </div>
              </button>

              {!isGuest && (
                <button
                  type="button"
                  onClick={() => setQuizType('Pengetahuan Agama')}
                  className={`w-full p-4 rounded-2xl border text-left transition-colors flex items-start gap-3.5 cursor-pointer ${
                    quizType === 'Pengetahuan Agama'
                      ? 'border-[#0A192F] bg-[#0A192F]/5 ring-1 ring-[#D4AF37]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0A192F]/5 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#7C5D10]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0A192F]">
                      Kuis Pengetahuan Agama
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Soal tajwid, gharib, ulumul Qur'an, sirah nabawiyah, dan adab
                      sesuai tingkatanmu.
                    </p>
                  </div>
                </button>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-extrabold text-base text-[#0A192F]">
                Jumlah soal
              </h2>
              <span className="text-xs text-slate-500">
                {isGuest
                  ? 'Latihan Sambung Ayat Pilihan'
                  : quizType === 'Pengetahuan Agama'
                    ? 'Bank soal 10+ materi per tingkat'
                    : TINGKATAN_INFO[user.tingkatan].shortDesc}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {([5, 10, 40] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`min-h-[48px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm border transition-colors tabular-nums whitespace-nowrap cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-[#0A192F] text-[#F4D06F] border-[#D4AF37]'
                      : 'bg-white text-[#0A192F] border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cnt} Soal
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStartQuiz}
          disabled={isGeneratingQuiz}
          className="w-full min-h-[52px] py-4 px-6 rounded-2xl bg-[#0A192F] hover:bg-[#112240] disabled:opacity-60 text-[#F4D06F] font-extrabold text-sm shadow-md border border-[#D4AF37]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {isGeneratingQuiz ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                {isGuest
                  ? 'Menyiapkan Ayat & Audio (Tingkat Uji Coba)...'
                  : `Menyiapkan Ayat & Audio (${user.tingkatan})...`}
              </span>
            </>
          ) : (
            <>
              <span>
                {isGuest
                  ? 'Mulai Latihan Sambung Ayat Sekarang'
                  : `Mulai ${studyMode} Sekarang`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
