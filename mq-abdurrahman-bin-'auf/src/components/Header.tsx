import React from 'react';
import { Menu, X, Home, UserCheck, Shield, LogOut, Info, BookOpen, Award } from 'lucide-react';
import type { UserProfile, ViewName } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  logoUrl: string;
  currentView: ViewName;
  isGuruLoggedIn: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  logoUrl,
  currentView,
  isGuruLoggedIn,
  drawerOpen,
  setDrawerOpen,
  onNavigate,
  onLogout
}) => {
  const showGuruPanel = !user || isGuruLoggedIn;
  const isSantri = user?.mode === 'santri';

  const navItems: { label: string; view: ViewName; show: boolean }[] = [
    { label: 'Beranda', view: user ? 'home' : 'auth', show: true },
    { label: 'Ruang Belajar', view: 'study_setup', show: Boolean(user) },
    { label: 'Rapor', view: 'rapor', show: isSantri },
    {
      label: 'Panel Guru',
      view: isGuruLoggedIn ? 'guru_dashboard' : 'guru_login',
      show: showGuruPanel
    },
    { label: 'Tentang', view: 'about', show: true }
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between gap-8">
          {/* Zone 1: Brand lockup (single-line wordmark) */}
          <button
            type="button"
            onClick={() => onNavigate(user ? 'home' : 'auth')}
            className="flex items-center gap-3 text-left shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F] rounded-xl"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Markaz Al-Qur'an"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-contain bg-[#0A192F] p-1 border border-[#D4AF37]/60 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#0A192F] border border-[#D4AF37]/60 flex items-center justify-center shrink-0">
                <span className="text-[#F4D06F] font-arabic text-2xl font-bold leading-none">
                  ق
                </span>
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-[#0A192F] text-sm sm:text-base tracking-tight whitespace-nowrap">
                Markaz Al-Qur'an
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[#7C5D10] tracking-tight whitespace-nowrap">
                Abdurrahman bin 'Auf
              </span>
            </div>
          </button>

          {/* Zone 2: Desktop single-line nav links */}
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive =
                  currentView === item.view ||
                  (item.view === 'home' && currentView === 'auth' && !user) ||
                  (item.view === 'guru_login' && currentView === 'guru_dashboard');
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate(item.view)}
                    className={`py-1.5 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#0A192F] font-semibold border-[#D4AF37]'
                        : 'border-transparent hover:text-[#0A192F] hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
          </nav>

          {/* Zone 3: Single primary action / Mobile menu trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(user ? 'study_setup' : 'auth')}
              className="hidden md:inline-flex items-center justify-center px-4 py-2 min-h-[40px] rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {user ? 'Mulai Kuis' : 'Masuk Santri'}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-[#0A192F] hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0A192F]">
                    Menu Markaz Al-Qur'an
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Abdurrahman bin 'Auf
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 shrink-0"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(user ? 'home' : 'auth');
                    setDrawerOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl border border-slate-200 text-left font-semibold text-sm text-[#0A192F] hover:border-[#D4AF37] hover:bg-slate-50 transition-colors"
                >
                  <Home className="w-4 h-4 text-[#7C5D10]" />
                  <span>Beranda</span>
                </button>

                {user && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('study_setup');
                        setDrawerOpen(false);
                      }}
                      className="w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl border border-slate-200 text-left font-semibold text-sm text-[#0A192F] hover:border-[#D4AF37] hover:bg-slate-50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-[#7C5D10]" />
                      <span>Ruang Belajar</span>
                    </button>

                    {isSantri && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('rapor');
                          setDrawerOpen(false);
                        }}
                        className="w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl border border-slate-200 text-left font-semibold text-sm text-[#0A192F] hover:border-[#D4AF37] hover:bg-slate-50 transition-colors"
                      >
                        <Award className="w-4 h-4 text-[#7C5D10]" />
                        <span>Rapor & Klasemen</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onNavigate('auth');
                    setDrawerOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl border border-slate-200 text-left font-semibold text-sm text-[#0A192F] hover:border-[#D4AF37] hover:bg-slate-50 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-[#7C5D10]" />
                  <span>Ubah identitas santri</span>
                </button>

                {showGuruPanel && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(isGuruLoggedIn ? 'guru_dashboard' : 'guru_login');
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl border border-slate-200 text-left font-semibold text-sm text-[#0A192F] hover:border-[#D4AF37] hover:bg-slate-50 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-[#7C5D10]" />
                    <span>Panel Guru</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onNavigate('about');
                    setDrawerOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl border border-slate-200 text-left font-semibold text-sm text-[#0A192F] hover:border-[#D4AF37] hover:bg-slate-50 transition-colors"
                >
                  <Info className="w-4 h-4 text-[#7C5D10]" />
                  <span>Tentang aplikasi</span>
                </button>

                {user && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl border border-rose-200 text-left font-semibold text-sm text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Keluar akun santri</span>
                  </button>
                )}
              </nav>

              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-[#0A192F] mb-1">
                  {isSantri || isGuruLoggedIn
                    ? 'Bank Sambung Ayat 30 Juz'
                    : 'Tingkat Uji Coba Guest'}
                </p>
                <p>
                  {isSantri || isGuruLoggedIn
                    ? 'Tingkat Dasar (Juz 29–30), Menengah (Juz 21–30), dan Mahir (30 Juz). Pemutaran audio murottal memerlukan koneksi internet.'
                    : 'Mode pengunjung menyediakan latihan Sambung Ayat pilihan. Masuk dengan Akun Santri untuk akses penuh 30 Juz, Pengetahuan Agama, dan Rapor.'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400 mt-6">
              Markaz Al-Qur'an Abdurrahman bin 'Auf
            </p>
          </div>
        </div>
      )}
    </>
  );
};
