import React from 'react';
import { ArrowRight, Crown } from 'lucide-react';
import { TINGKATAN_INFO } from '../data/questions';
import type { Tingkatan } from '../types';

interface AuthViewProps {
  authTab: 'guest' | 'santri';
  setAuthTab: (tab: 'guest' | 'santri') => void;
  guestName: string;
  setGuestName: (name: string) => void;
  guestTingkatan: Tingkatan;
  setGuestTingkatan: (lvl: Tingkatan) => void;
  kodeSantriInput: string;
  setKodeSantriInput: (kode: string) => void;
  pinSantriInput: string;
  setPinSantriInput: (pin: string) => void;
  authError: string;
  clearAuthError: () => void;
  isLoading: boolean;
  onGuestSubmit: (e: React.FormEvent) => void;
  onSantriLogin: (e: React.FormEvent) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  authTab,
  setAuthTab,
  guestName,
  setGuestName,
  guestTingkatan,
  setGuestTingkatan,
  kodeSantriInput,
  setKodeSantriInput,
  pinSantriInput,
  setPinSantriInput,
  authError,
  clearAuthError,
  isLoading,
  onGuestSubmit,
  onSantriLogin
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Welcome Hero Banner & Curriculum Tiers */}
      <div className="lg:col-span-5 space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-7 sm:p-8 border border-[#D4AF37]/30 shadow-lg">
          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-wide text-[#F4D06F] mb-2">
              Assalamu'alaikum, Sahabat Al-Qur'an
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-balance mb-3">
              Belajar dan Muraja'ah jadi lebih terarah.
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Kenali tingkatan hafalanmu terlebih dahulu. Setelah itu, kita siap
              muraja'ah sambung ayat dan evaluasi ilmu syar'i bersama Markaz
              Al-Qur'an Abdurrahman bin 'Auf.
            </p>
          </div>

          {/* Subtle geometric Islamic 8-point ornament */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="w-32 h-32 text-[#D4AF37]/10 absolute -bottom-6 -right-6 pointer-events-none"
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

        {authTab === 'guest' ? (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3">
            <h2 className="text-sm font-bold text-[#0A192F]">
              Mode Uji Coba Pengunjung
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-[#0A192F]">
                  Tingkat Uji Coba
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latihan Sambung Ayat Pilihan
                </p>
              </div>
              <span className="text-xs font-semibold text-[#7C5D10] whitespace-nowrap">
                Akses Guest
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ingin mengakses kelas lengkap (Dasar, Menengah, Mahir) dan materi
              Pengetahuan Agama Islam? Silakan masuk pada tab{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthTab('santri');
                  clearAuthError();
                }}
                className="font-bold text-[#0A192F] underline underline-offset-2 cursor-pointer"
              >
                Akun Santri
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-[#0A192F]">
              Cakupan Tingkatan Hafalan Resmi
            </h2>
            <div className="divide-y divide-slate-100">
              {(['Dasar', 'Menengah', 'Mahir'] as Tingkatan[]).map((lvl) => (
                <div
                  key={lvl}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <span className="font-semibold text-sm text-[#0A192F]">
                    Tingkat {lvl}
                  </span>
                  <span className="text-xs text-slate-500 text-right">
                    {TINGKATAN_INFO[lvl].desc} · Sambung Ayat &amp; Agama
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Mode Switcher & Identity Form */}
      <div className="lg:col-span-7 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-[#0A192F] text-lg">
              Masuk sebagai siapa?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih mode Guest untuk uji coba Sambung Ayat atau masuk dengan Akun Santri.
            </p>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setAuthTab('guest');
              clearAuthError();
            }}
            className={`min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
              authTab === 'guest'
                ? 'bg-[#0A192F] text-[#F4D06F] shadow-xs'
                : 'text-slate-600 hover:text-[#0A192F] hover:bg-white/70'
            }`}
          >
            Mode Guest
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('santri');
              clearAuthError();
            }}
            className={`min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
              authTab === 'santri'
                ? 'bg-[#0A192F] text-[#F4D06F] shadow-xs'
                : 'text-slate-600 hover:text-[#0A192F] hover:bg-white/70'
            }`}
          >
            Akun Santri
          </button>
        </div>

        {authTab === 'guest' ? (
          <form
            onSubmit={onGuestSubmit}
            className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5"
          >
            <div>
              <label
                htmlFor="guest-name"
                className="block text-xs font-bold text-[#0A192F] mb-2"
              >
                Nama lengkap pengunjung
              </label>
              <input
                id="guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Tuliskan nama lengkapmu..."
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl border border-slate-300 text-sm text-[#0A192F] focus:outline-none focus:border-[#0A192F] focus:ring-2 focus:ring-[#D4AF37]/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-[#0A192F]">
                  Pilihan latihan Mode Guest
                </span>
                <span className="text-xs text-[#7C5D10] font-semibold">
                  Khusus Sambung Ayat
                </span>
              </div>

              <button
                type="button"
                onClick={() => setGuestTingkatan('Dasar')}
                className="w-full p-4 rounded-2xl border border-[#0A192F] bg-[#0A192F]/5 ring-1 ring-[#D4AF37] text-left cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <span className="font-bold text-sm text-[#0A192F] block">
                    Tingkat Uji Coba
                  </span>
                  <span className="text-xs text-slate-600 mt-1 block">
                    Latihan Sambung Ayat Pilihan
                  </span>
                </div>
                <span className="w-4 h-4 rounded-full border border-[#0A192F] bg-[#0A192F] flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4D06F]" />
                </span>
              </button>
            </div>

            {authError && (
              <p
                role="alert"
                className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-xl"
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 border border-[#D4AF37]/40 cursor-pointer"
            >
              <span>Mulai Tingkat Uji Coba</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Exclusive Navy & Gold Official Santri Info Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-5 sm:p-6 border border-[#D4AF37]/50 shadow-md space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/60 text-[#F4D06F] flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#F4D06F] leading-snug">
                    Informasi Eksklusif Santri Resmi
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed">
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
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Sudah memiliki Kode Santri dan PIN resmi?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('santri');
                    clearAuthError();
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e0bd48] text-[#0A192F] font-bold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <span>Masuk Akun Santri</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form
            onSubmit={onSantriLogin}
            className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4"
          >
            <div>
              <h3 className="font-bold text-base text-[#0A192F]">
                Masuk akun santri
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Silakan masuk menggunakan Kode Santri dan PIN resmi yang telah
                diberikan oleh Ustadz/Guru. Setiap hasil ujian akan otomatis
                tercatat pada rapor evaluasi belajarmu.
              </p>
            </div>

            <div>
              <label
                htmlFor="kode-santri"
                className="block text-xs font-bold text-[#0A192F] mb-1.5"
              >
                Kode santri
              </label>
              <input
                id="kode-santri"
                type="text"
                value={kodeSantriInput}
                onChange={(e) => setKodeSantriInput(e.target.value)}
                placeholder="Masukkan Kode Santri"
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl border border-slate-300 text-sm text-[#0A192F] focus:outline-none focus:border-[#0A192F]"
              />
            </div>

            <div>
              <label
                htmlFor="pin-santri"
                className="block text-xs font-bold text-[#0A192F] mb-1.5"
              >
                PIN santri
              </label>
              <input
                id="pin-santri"
                type="password"
                value={pinSantriInput}
                onChange={(e) => setPinSantriInput(e.target.value)}
                placeholder="Masukkan 4 digit PIN"
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl border border-slate-300 text-sm text-[#0A192F] focus:outline-none focus:border-[#0A192F]"
              />
            </div>

            {authError && (
              <p
                role="alert"
                className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-xl"
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#0A192F] hover:bg-[#112240] disabled:opacity-60 text-[#F4D06F] font-bold text-sm shadow-sm transition-colors border border-[#D4AF37]/40 cursor-pointer"
            >
              {isLoading ? 'Memeriksa Akun...' : 'Masuk akun santri'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
