import React from 'react';
import {
  Award,
  BookOpen,
  Crown,
  GraduationCap,
  RefreshCw,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { TINGKATAN_INFO } from '../data/questions';
import type { QuizType, ScoreRecord, StudyMode, UserProfile, ViewName } from '../types';

interface HomeViewProps {
  user: UserProfile;
  recentScores: ScoreRecord[];
  isGeneratingQuiz?: boolean;
  onStartStudy: (quizType: QuizType, mode?: StudyMode, count?: 5 | 10 | 40) => void;
  onStartGuestTrial: () => void;
  onNavigate: (view: ViewName) => void;
  onManageAccount: () => void;
  onLogout: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  recentScores,
  isGeneratingQuiz = false,
  onStartStudy,
  onStartGuestTrial,
  onNavigate,
  onManageAccount,
  onLogout
}) => {
  const isGuest = user.mode === 'guest';

  const userScores = recentScores.filter((s) => {
    if (user.mode === 'santri' && user.kode_santri) {
      return (
        (s.kode_santri || '').trim().toUpperCase() ===
        user.kode_santri.trim().toUpperCase()
      );
    }
    return (
      (!s.kode_santri || s.kode_santri === 'GUEST') &&
      s.nama_santri.trim().toLowerCase() === user.nama.trim().toLowerCase()
    );
  });

  const avgScore =
    userScores.length > 0
      ? Math.round(userScores.reduce((acc, s) => acc + s.skor, 0) / userScores.length)
      : null;

  return (
    <div className="space-y-8">
      {/* Top Banner & Student Identity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-7 border border-[#D4AF37]/30 shadow-lg flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-xs font-semibold text-[#F4D06F] mb-2">
              {isGuest ? 'Mode Uji Coba Pengunjung' : "Alhamdulillah, kamu sudah siap"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-balance mb-3">
              Setiap ilmu adalah langkah kebaikan.
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
              {isGuest
                ? "Silakan mencoba latihan Sambung Ayat pilihan pada Tingkat Uji Coba bersama Markaz Al-Qur'an Abdurrahman bin 'Auf."
                : "Terus semangat muraja'ah, memperbaiki bacaan, dan mengamalkan Al-Qur'an bersama Markaz Al-Qur'an Abdurrahman bin 'Auf."}
            </p>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isGuest && isGeneratingQuiz}
              onClick={() =>
                isGuest
                  ? onStartGuestTrial()
                  : onStartStudy('Sambung Ayat', 'Latihan Bebas', 5)
              }
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e0bd48] disabled:opacity-60 text-[#0A192F] font-bold text-xs sm:text-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              {isGuest && isGeneratingQuiz ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Sambung Ayat...</span>
                </>
              ) : (
                <>
                  <span>
                    {isGuest ? 'Mulai Tingkat Uji Coba' : "Mulai Muraja'ah"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="w-36 h-36 text-[#D4AF37]/10 absolute -bottom-8 -right-8 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="25" y="25" width="70" height="70" />
            <rect
              x="25"
              y="25"
              width="70"
              height="70"
              transform="rotate(45 60 60)"
            />
            <circle cx="60" cy="60" r="22" />
          </svg>
        </section>

        {/* Student Profile & Stats Card */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0A192F] text-[#F4D06F] font-extrabold text-lg flex items-center justify-center shrink-0">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Selamat datang kembali</p>
                  <h2 className="text-xl font-extrabold text-[#0A192F] leading-tight">
                    {user.nama}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Keluar
              </button>
            </div>

            {isGuest ? (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                <span className="font-semibold text-[#7C5D10]">
                  Tingkat Uji Coba
                </span>
                <span aria-hidden="true">·</span>
                <span>Latihan Sambung Ayat Pilihan</span>
                <span aria-hidden="true">·</span>
                <span>Mode Guest</span>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                <span className="font-semibold text-[#7C5D10]">
                  Tingkat {user.tingkatan}
                </span>
                <span aria-hidden="true">·</span>
                <span>{TINGKATAN_INFO[user.tingkatan].desc}</span>
                <span aria-hidden="true">·</span>
                <span>Kode {user.kode_santri}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-xs text-slate-500">Sesi Selesai</p>
              <p className="text-xl font-extrabold text-[#0A192F] tabular-nums mt-0.5">
                {userScores.length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-xs text-slate-500">Rata-rata Nilai</p>
              <p className="text-xl font-extrabold text-[#0A192F] tabular-nums mt-0.5">
                {avgScore !== null ? avgScore : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-3">
            <span className="text-slate-500">
              {isGuest
                ? 'Khusus akun santri resmi untuk rapor & kelas lengkap'
                : 'Nilai otomatis masuk rapor guru'}
            </span>
            <button
              type="button"
              onClick={onManageAccount}
              className="font-bold text-[#0A192F] hover:text-[#7C5D10] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isGuest ? 'Masuk Akun Santri' : 'Ubah akun'}
            </button>
          </div>
        </section>
      </div>

      {/* Ruang Belajar Section */}
      {isGuest ? (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-extrabold text-xl text-[#0A192F]">
              Ruang Latihan Guest
            </h2>
            <span className="text-xs font-medium text-slate-500">
              Khusus Sambung Ayat
            </span>
          </div>

          {/* Single Trial Card for Guest */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#D4AF37]/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-[#0A192F] text-[#F4D06F] border border-[#D4AF37]/60 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C5D10] block">
                  Uji Coba Pengunjung
                </span>
                <h3 className="font-extrabold text-lg sm:text-xl text-[#0A192F]">
                  Tingkat Uji Coba
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Latihan Sambung Ayat Pilihan · Dilengkapi koreksi langsung dan
                  audio murottal.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingQuiz}
              onClick={onStartGuestTrial}
              className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#0A192F] hover:bg-[#112240] disabled:opacity-60 text-[#F4D06F] font-bold text-xs sm:text-sm border border-[#D4AF37]/40 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isGeneratingQuiz ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Sambung Ayat...</span>
                </>
              ) : (
                <>
                  <span>Mulai Tingkat Uji Coba</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Exclusive Navy & Gold Official Santri Info Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-6 sm:p-7 border border-[#D4AF37]/50 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/60 text-[#F4D06F] flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-extrabold text-[#F4D06F] leading-snug">
                  Informasi Eksklusif Santri Resmi
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                  Akses penuh ke Tingkat Dasar, Menengah, hingga Mahir (30 Juz
                  &amp; Pengetahuan Agama Islam), pemantauan Rapor Hafalan,
                  Peringkat Klasemen, serta pengambilan Sertifikat Kelulusan
                  Resmi hanya tersedia bagi santri terdaftar. Silakan daftar
                  menjadi santri Markaz Al-Qur&apos;an Abdurrahman bin
                  &apos;Auf untuk mendapatkan akun resmi.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Sudah memiliki Kode Santri dan PIN resmi?
              </p>
              <button
                type="button"
                onClick={onManageAccount}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e0bd48] text-[#0A192F] font-bold text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <span>Masuk Akun Santri</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-extrabold text-xl text-[#0A192F]">Ruang Belajar</h2>
            <span className="text-xs font-medium text-slate-500">
              Pilih aktivitas belajarmu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Kuis Hafalan */}
            <button
              type="button"
              onClick={() => onStartStudy('Sambung Ayat')}
              className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#D4AF37] text-left transition-colors flex flex-col justify-between gap-4 cursor-pointer group"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#0A192F]/5 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-[#0A192F]" />
                </div>
                <h3 className="font-bold text-base text-[#0A192F]">Kuis Hafalan</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Sambung ayat dan muraja&apos;ah Al-Qur&apos;an ({TINGKATAN_INFO[user.tingkatan].shortDesc}) beserta murottal.
                </p>
              </div>
              <span className="text-xs font-bold text-[#7C5D10] group-hover:text-[#0A192F] inline-flex items-center gap-1">
                <span>Mulai kuis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 2: Pengetahuan Agama */}
            <button
              type="button"
              onClick={() => onStartStudy('Pengetahuan Agama')}
              className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#D4AF37] text-left transition-colors flex flex-col justify-between gap-4 cursor-pointer group"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#0A192F]/5 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5 text-[#7C5D10]" />
                </div>
                <h3 className="font-bold text-base text-[#0A192F]">
                  Pengetahuan Agama
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Latihan soal tajwid, gharib, ulumul Qur&apos;an, sirah, dan adab penuntut ilmu.
                </p>
              </div>
              <span className="text-xs font-bold text-[#7C5D10] group-hover:text-[#0A192F] inline-flex items-center gap-1">
                <span>Mulai kuis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 3: Rapor & Klasemen */}
            <button
              type="button"
              onClick={() => onNavigate('rapor')}
              className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#D4AF37] text-left transition-colors flex flex-col justify-between gap-4 cursor-pointer group"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#0A192F]/5 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5 text-[#7C5D10]" />
                </div>
                <h3 className="font-bold text-base text-[#0A192F]">
                  Rapor &amp; Klasemen
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Pantau riwayat nilai ujian pribadi dan peringkatmu di kelas{' '}
                  {user.tingkatan}.
                </p>
              </div>
              <span className="text-xs font-bold text-[#0A192F] inline-flex items-center gap-1">
                <span>Buka rapor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 4: Tantangan Pekanan */}
            <button
              type="button"
              onClick={() => onStartStudy('Sambung Ayat', 'Ujian / Setoran', 10)}
              className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#D4AF37] text-left transition-colors flex flex-col justify-between gap-4 cursor-pointer group"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#0A192F]/5 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
                  <Trophy className="w-5 h-5 text-[#0A192F]" />
                </div>
                <h3 className="font-bold text-base text-[#0A192F]">
                  Tantangan Pekanan
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Evaluasi setoran pekanan 10 soal mode ujian untuk mengukur kesiapan hafalan.
                </p>
              </div>
              <span className="text-xs font-bold text-[#7C5D10] group-hover:text-[#0A192F] inline-flex items-center gap-1">
                <span>Ujian 10 soal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
