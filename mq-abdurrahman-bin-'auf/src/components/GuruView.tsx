import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Trophy,
  UserCheck
} from 'lucide-react';
import type {
  PengajarRecord,
  SantriRecord,
  ScoreRecord,
  Tingkatan
} from '../types';
import { CertificateSection } from './CertificateSection';

const GURU_ARCHIVE_KEY = 'mq_guru_archived_scores';

function getScoreArchiveId(r: ScoreRecord): string {
  if (r.id !== undefined && r.id !== null && String(r.id).trim() !== '') {
    return `id:${String(r.id)}`;
  }
  return `sig:${(r.kode_santri || 'GUEST').trim().toUpperCase()}|${r.nama_santri.trim()}|${r.created_at}|${r.jenis_kuis}|${r.skor}`;
}

function getSantriArchiveKey(r: ScoreRecord): string {
  return r.kode_santri && r.kode_santri !== 'GUEST'
    ? r.kode_santri.trim().toUpperCase()
    : `GUEST:${r.nama_santri.trim().toLowerCase()}`;
}

interface GuruLoginViewProps {
  guruEmail: string;
  setGuruEmail: (val: string) => void;
  loginError: string;
  isVerifying: boolean;
  onLogin: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const GuruLoginView: React.FC<GuruLoginViewProps> = ({
  guruEmail,
  setGuruEmail,
  loginError,
  isVerifying,
  onLogin,
  onBack
}) => {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[40px] inline-flex items-center gap-2 text-xs font-bold text-[#0A192F] hover:text-[#7C5D10] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke beranda</span>
      </button>

      <section className="rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-6 sm:p-7 border border-[#D4AF37]/30 shadow-lg">
        <p className="text-xs font-semibold text-[#F4D06F] mb-1.5">
          Ruang Pengajar
        </p>
        <h1 className="text-2xl font-extrabold mb-2">Panel Guru & Admin</h1>
        <p className="text-sm text-slate-200 leading-relaxed">
          Pantau perkembangan belajar, kelola data santri, dan atur akses
          pengajar Markaz Al-Qur'an Abdurrahman bin 'Auf.
        </p>
      </section>

      <form
        onSubmit={onLogin}
        className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4"
      >
        <div>
          <h2 className="font-extrabold text-lg text-[#0A192F]">
            Masuk dengan Email Pengajar
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Masukkan email pengajar yang telah terdaftar untuk mengakses Panel
            Guru.
          </p>
        </div>

        <div>
          <label
            htmlFor="guru-email"
            className="block text-xs font-bold text-[#0A192F] mb-1.5"
          >
            Email pengajar
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="guru-email"
              type="email"
              required
              autoComplete="email"
              value={guruEmail}
              onChange={(e) => setGuruEmail(e.target.value)}
              placeholder="ustadz@markaz.id"
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-sm text-[#0A192F] focus:outline-none focus:border-[#0A192F] focus:ring-2 focus:ring-[#D4AF37]/30"
            />
          </div>
        </div>

        {loginError && (
          <div
            role="alert"
            className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-1"
          >
            <p className="font-bold">Verifikasi Gagal</p>
            <p className="font-mono text-[11px] break-words leading-relaxed">
              {loginError}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#0A192F] hover:bg-[#112240] disabled:opacity-60 text-[#F4D06F] font-bold text-sm shadow-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memverifikasi Email...</span>
            </>
          ) : (
            <span>Verifikasi & Masuk Panel Guru</span>
          )}
        </button>
      </form>
    </div>
  );
};

interface GuruDashboardViewProps {
  guruSession: PengajarRecord;
  scores: ScoreRecord[];
  santriList: SantriRecord[];
  pengajarList: PengajarRecord[];
  isLoadingPengajar: boolean;
  isSubmittingPengajar: boolean;
  sbUrl: string;
  setSbUrl: (val: string) => void;
  sbKey: string;
  setSbKey: (val: string) => void;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
  onSyncSupabase: () => void;
  onRefreshPengajar: () => void;
  onAddSantri: (item: SantriRecord) => Promise<void>;
  onDeleteSantri: (kode: string) => void;
  onAddPengajar: (item: {
    nama: string;
    email: string;
    peran: string;
  }) => Promise<boolean>;
  onDeletePengajar: (id: string | number) => Promise<void>;
  onSaveConfig: (e: React.FormEvent) => void;
  onLogoutGuru: () => void;
  onBack: () => void;
}

export const GuruDashboardView: React.FC<GuruDashboardViewProps> = ({
  guruSession,
  scores,
  santriList,
  pengajarList,
  isLoadingPengajar,
  isSubmittingPengajar,
  sbUrl,
  setSbUrl,
  sbKey,
  setSbKey,
  logoUrl,
  setLogoUrl,
  onSyncSupabase,
  onRefreshPengajar,
  onAddSantri,
  onDeleteSantri,
  onAddPengajar,
  onDeletePengajar,
  onSaveConfig,
  onLogoutGuru,
  onBack
}) => {
  const isAdmin = guruSession.peran.trim().toLowerCase() === 'admin';

  const [guruTab, setGuruTab] = useState<
    'rapor' | 'santri' | 'sertifikat' | 'pengajar' | 'pengaturan'
  >('rapor');
  const [filterLvl, setFilterLvl] = useState<'Semua' | Tingkatan>('Semua');
  const [raporSubTab, setRaporSubTab] = useState<'riwayat' | 'klasemen'>(
    'riwayat'
  );
  const [archivedScoreIds, setArchivedScoreIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(GURU_ARCHIVE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedArchiveSantri, setSelectedArchiveSantri] = useState('');
  const [confirmClearAllRiwayat, setConfirmClearAllRiwayat] = useState(false);
  const [confirmDeleteLeaderboardKey, setConfirmDeleteLeaderboardKey] =
    useState<string | null>(null);
  const [confirmResetKlasemen, setConfirmResetKlasemen] = useState(false);

  const activeTab =
    !isAdmin && (guruTab === 'pengajar' || guruTab === 'pengaturan')
      ? 'rapor'
      : guruTab;

  // Form Data Santri
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newTingkatan, setNewTingkatan] = useState<Tingkatan>('Dasar');
  const [confirmDeleteKode, setConfirmDeleteKode] = useState<string | null>(
    null
  );

  // Form Kelola Pengajar
  const [pengajarNama, setPengajarNama] = useState('');
  const [pengajarEmail, setPengajarEmail] = useState('');
  const [pengajarPeran, setPengajarPeran] = useState<'Admin' | 'Pengajar'>(
    'Pengajar'
  );
  const [confirmDeletePengajarId, setConfirmDeletePengajarId] = useState<
    string | number | null
  >(null);

  const filteredScores =
    filterLvl === 'Semua'
      ? scores
      : scores.filter((s) => s.tingkatan === filterLvl);

  const archivedIdSet = useMemo(
    () => new Set(archivedScoreIds),
    [archivedScoreIds]
  );

  const visibleScores = useMemo(
    () =>
      filteredScores.filter((s) => !archivedIdSet.has(getScoreArchiveId(s))),
    [filteredScores, archivedIdSet]
  );

  const visibleSantriOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; nama: string; kode: string; count: number }
    >();
    visibleScores.forEach((s) => {
      const key = getSantriArchiveKey(s);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          nama: s.nama_santri,
          kode: s.kode_santri || 'GUEST',
          count: 1
        });
      } else {
        existing.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama)
    );
  }, [visibleScores]);

  const persistArchivedIds = (nextIds: string[]) => {
    setArchivedScoreIds(nextIds);
    if (nextIds.length === 0) {
      localStorage.removeItem(GURU_ARCHIVE_KEY);
    } else {
      localStorage.setItem(GURU_ARCHIVE_KEY, JSON.stringify(nextIds));
    }
  };

  const handleArchiveSingleScore = (record: ScoreRecord) => {
    const id = getScoreArchiveId(record);
    if (archivedIdSet.has(id)) return;
    persistArchivedIds([...archivedScoreIds, id]);
  };

  const handleArchiveBySantri = () => {
    if (!selectedArchiveSantri) return;
    const idsToAdd = visibleScores
      .filter((s) => getSantriArchiveKey(s) === selectedArchiveSantri)
      .map(getScoreArchiveId);
    if (idsToAdd.length === 0) return;
    const merged = Array.from(new Set([...archivedScoreIds, ...idsToAdd]));
    persistArchivedIds(merged);
    setSelectedArchiveSantri('');
  };

  const handleArchiveAllVisible = () => {
    const idsToAdd = visibleScores.map(getScoreArchiveId);
    if (idsToAdd.length === 0) {
      setConfirmClearAllRiwayat(false);
      setConfirmResetKlasemen(false);
      return;
    }
    const merged = Array.from(new Set([...archivedScoreIds, ...idsToAdd]));
    persistArchivedIds(merged);
    setSelectedArchiveSantri('');
    setConfirmClearAllRiwayat(false);
    setConfirmResetKlasemen(false);
    setConfirmDeleteLeaderboardKey(null);
  };

  const handleArchiveByLeaderboardKey = (santriKey: string) => {
    const idsToAdd = visibleScores
      .filter((s) => getSantriArchiveKey(s) === santriKey)
      .map(getScoreArchiveId);
    if (idsToAdd.length > 0) {
      const merged = Array.from(new Set([...archivedScoreIds, ...idsToAdd]));
      persistArchivedIds(merged);
    }
    setConfirmDeleteLeaderboardKey(null);
  };

  const handleRestoreArchivedScores = () => {
    persistArchivedIds([]);
    setConfirmClearAllRiwayat(false);
    setConfirmResetKlasemen(false);
    setConfirmDeleteLeaderboardKey(null);
  };

  const fullLeaderboard = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        nama: string;
        kode: string;
        tingkatan: Tingkatan;
        sessions: number;
        totalSkor: number;
        bestSkor: number;
      }
    >();

    visibleScores.forEach((s) => {
      const key =
        s.kode_santri && s.kode_santri !== 'GUEST'
          ? s.kode_santri.trim().toUpperCase()
          : `GUEST:${s.nama_santri.trim().toLowerCase()}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          nama: s.nama_santri,
          kode: s.kode_santri || 'GUEST',
          tingkatan: s.tingkatan,
          sessions: 1,
          totalSkor: s.skor,
          bestSkor: s.skor
        });
      } else {
        existing.sessions += 1;
        existing.totalSkor += s.skor;
        existing.bestSkor = Math.max(existing.bestSkor, s.skor);
      }
    });

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        avgSkor: Math.round(entry.totalSkor / entry.sessions)
      }))
      .sort((a, b) => b.avgSkor - a.avgSkor || b.bestSkor - a.bestSkor);
  }, [visibleScores]);

  const handleCreateSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKode.trim() || !newNama.trim() || !newPin.trim()) return;
    await onAddSantri({
      kode_santri: newKode.toUpperCase().trim(),
      nama_lengkap: newNama.trim(),
      pin_santri: newPin.trim(),
      tingkatan: newTingkatan
    });
    setNewKode('');
    setNewNama('');
    setNewPin('');
  };

  const handleCreatePengajar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengajarNama.trim() || !pengajarEmail.trim()) return;
    const ok = await onAddPengajar({
      nama: pengajarNama.trim(),
      email: pengajarEmail.trim().toLowerCase(),
      peran: pengajarPeran
    });
    if (ok) {
      setPengajarNama('');
      setPengajarEmail('');
      setPengajarPeran('Pengajar');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action & Logged-in Teacher Session Header */}
      <div className="no-print bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A192F] hover:bg-slate-50 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0A192F] text-[#F4D06F] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-[#0A192F] truncate">
                {guruSession.nama}
              </p>
              <p className="text-xs text-slate-500 truncate">
                <span className="font-semibold text-[#7C5D10]">
                  {guruSession.peran}
                </span>{' '}
                · {guruSession.email}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogoutGuru}
          className="min-h-[42px] px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Guru</span>
        </button>
      </div>

      {/* Tab Navigasi Guru */}
      <div
        className={`no-print grid gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 ${
          isAdmin ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-3'
        }`}
      >
        <button
          type="button"
          onClick={() => setGuruTab('rapor')}
          className={`min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'rapor'
              ? 'bg-[#0A192F] text-[#F4D06F]'
              : 'text-slate-600 hover:text-[#0A192F]'
          }`}
        >
          Rapor Nilai
        </button>
        <button
          type="button"
          onClick={() => setGuruTab('santri')}
          className={`min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'santri'
              ? 'bg-[#0A192F] text-[#F4D06F]'
              : 'text-slate-600 hover:text-[#0A192F]'
          }`}
        >
          Data Santri
        </button>
        <button
          type="button"
          onClick={() => setGuruTab('sertifikat')}
          className={`min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'sertifikat'
              ? 'bg-[#0A192F] text-[#F4D06F]'
              : 'text-slate-600 hover:text-[#0A192F]'
          }`}
        >
          Sertifikat
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setGuruTab('pengajar');
              onRefreshPengajar();
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'pengajar'
                ? 'bg-[#0A192F] text-[#F4D06F]'
                : 'text-slate-600 hover:text-[#0A192F]'
            }`}
          >
            Kelola Pengajar
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setGuruTab('pengaturan')}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'pengaturan'
                ? 'bg-[#0A192F] text-[#F4D06F]'
                : 'text-slate-600 hover:text-[#0A192F]'
            }`}
          >
            Pengaturan
          </button>
        )}
      </div>

      {/* Tab 1: Rekap Rapor & Klasemen Lengkap Santri */}
      {activeTab === 'rapor' && (
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-[#0A192F]">
                {raporSubTab === 'riwayat'
                  ? 'Riwayat Penilaian Santri'
                  : 'Klasemen Lengkap Seluruh Santri'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {raporSubTab === 'riwayat'
                  ? `Menampilkan ${visibleScores.length} catatan penilaian${
                      archivedScoreIds.length > 0
                        ? ` (${archivedScoreIds.length} disembunyikan)`
                        : ''
                    }`
                  : `Total ${fullLeaderboard.length} peserta aktif`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setRaporSubTab('riwayat')}
                  className={`min-h-[34px] px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    raporSubTab === 'riwayat'
                      ? 'bg-[#0A192F] text-[#F4D06F]'
                      : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  Riwayat Penilaian
                </button>
                <button
                  type="button"
                  onClick={() => setRaporSubTab('klasemen')}
                  className={`min-h-[34px] px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    raporSubTab === 'klasemen'
                      ? 'bg-[#0A192F] text-[#F4D06F]'
                      : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  Klasemen Lengkap
                </button>
              </div>

              <select
                aria-label="Filter tingkatan"
                value={filterLvl}
                onChange={(e) =>
                  setFilterLvl(e.target.value as 'Semua' | Tingkatan)
                }
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#0A192F] bg-white"
              >
                <option value="Semua">Semua Tingkatan</option>
                <option value="Dasar">Dasar</option>
                <option value="Menengah">Menengah</option>
                <option value="Mahir">Mahir</option>
              </select>

              <button
                type="button"
                onClick={onSyncSupabase}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#7C5D10] hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {raporSubTab === 'riwayat' &&
            (visibleScores.length > 0 || archivedScoreIds.length > 0) && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Pembersihan riwayat hanya menyembunyikan daftar di{' '}
                    <strong className="text-[#0A192F]">Panel Guru</strong>. Data
                    nilai, rapor, dan klasemen pada akun masing-masing santri
                    tetap aman tersimpan.
                  </p>

                  {archivedScoreIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRestoreArchivedScores}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[#D4AF37]/60 bg-white hover:bg-amber-50 text-[#0A192F] font-bold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#7C5D10]" />
                      <span>Pulihkan Riwayat ({archivedScoreIds.length})</span>
                    </button>
                  )}
                </div>

                {visibleScores.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                    {/* Hapus per Santri */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Pilih santri untuk dihapus riwayat tampilannya"
                        value={selectedArchiveSantri}
                        onChange={(e) =>
                          setSelectedArchiveSantri(e.target.value)
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-[#0A192F] bg-white"
                      >
                        <option value="">Pilih santri...</option>
                        {visibleSantriOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.nama} ({opt.kode}) · {opt.count} riwayat
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={!selectedArchiveSantri}
                        onClick={handleArchiveBySantri}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 disabled:opacity-45 disabled:hover:bg-white text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus per Santri</span>
                      </button>
                    </div>

                    {/* Hapus Semua Riwayat */}
                    {confirmClearAllRiwayat ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleArchiveAllVisible}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
                        >
                          Ya, Bersihkan Semua ({visibleScores.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAllRiwayat(false)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearAllRiwayat(true)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Semua Riwayat</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

          {raporSubTab === 'riwayat' ? (
            visibleScores.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  {filteredScores.length > 0 && archivedScoreIds.length > 0
                    ? 'Semua riwayat penilaian pada tampilan ini telah dibersihkan dari Panel Guru.'
                    : 'Belum ada data nilai santri yang masuk pada filter ini.'}
                </p>
                {archivedScoreIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreArchivedScores}
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-[#D4AF37]/60 bg-slate-50 hover:bg-amber-50 text-[#0A192F] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#7C5D10]" />
                    <span>Pulihkan Riwayat ({archivedScoreIds.length})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleScores.map((r, i) => (
                  <div
                    key={`${getScoreArchiveId(r)}-${i}`}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#0A192F] truncate">
                        {r.nama_santri}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ({r.kode_santri || 'GUEST'})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Tingkat {r.tingkatan} · {r.jenis_kuis} ·{' '}
                        {r.mode_belajar} · Benar {r.benar}/{r.jumlah_soal}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-12 h-11 rounded-xl bg-[#0A192F] text-[#F4D06F] font-extrabold text-sm flex items-center justify-center tabular-nums">
                        {r.skor}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleArchiveSingleScore(r)}
                        title="Hapus satuan dari tampilan Panel Guru"
                        aria-label={`Hapus tampilan riwayat penilaian ${r.nama_santri}`}
                        className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 text-slate-500 hover:text-rose-700 hover:border-rose-200 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {(fullLeaderboard.length > 0 || archivedScoreIds.length > 0) && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Menghapus atau mereset klasemen di sini hanya membersihkan
                    tampilan skor/klasemen di{' '}
                    <strong className="text-[#0A192F]">Panel Guru</strong> tanpa
                    merusak akun santri di <code>mq_santri</code> maupun rapor
                    pribadi santri.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {archivedScoreIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRestoreArchivedScores}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D4AF37]/60 bg-white hover:bg-amber-50 text-[#0A192F] font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#7C5D10]" />
                        <span>Pulihkan Data ({archivedScoreIds.length})</span>
                      </button>
                    )}

                    {fullLeaderboard.length > 0 &&
                      (confirmResetKlasemen ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleArchiveAllVisible}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
                          >
                            Ya, Reset Klasemen ({fullLeaderboard.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmResetKlasemen(false)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmResetKlasemen(true)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset / Hapus Semua Klasemen</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {fullLeaderboard.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    {filteredScores.length > 0 && archivedScoreIds.length > 0
                      ? 'Tampilan klasemen di Panel Guru telah direset. Akun santri tetap aktif.'
                      : 'Belum ada data nilai santri yang masuk pada filter ini.'}
                  </p>
                  {archivedScoreIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRestoreArchivedScores}
                      className="min-h-[40px] px-4 py-2 rounded-xl border border-[#D4AF37]/60 bg-slate-50 hover:bg-amber-50 text-[#0A192F] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#7C5D10]" />
                      <span>Pulihkan Klasemen ({archivedScoreIds.length})</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {fullLeaderboard.map((row, rankIdx) => (
                    <div
                      key={row.key}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm tabular-nums shrink-0 ${
                            rankIdx === 0
                              ? 'bg-[#D4AF37] text-[#0A192F]'
                              : 'bg-slate-100 text-[#0A192F]'
                          }`}
                        >
                          {rankIdx === 0 ? (
                            <Trophy className="w-4 h-4" />
                          ) : (
                            `#${rankIdx + 1}`
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#0A192F] truncate">
                            {row.nama}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              ({row.kode})
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                            Tingkat {row.tingkatan} · {row.sessions} sesi ·
                            Terbaik {row.bestSkor}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-base font-extrabold text-[#0A192F] tabular-nums">
                            {row.avgSkor}
                          </p>
                          <p className="text-[11px] text-slate-500">Rata-rata</p>
                        </div>

                        {confirmDeleteLeaderboardKey === row.key ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleArchiveByLeaderboardKey(row.key)
                              }
                              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteLeaderboardKey(null)
                              }
                              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteLeaderboardKey(row.key)
                            }
                            title="Hapus santri dari tampilan klasemen Panel Guru"
                            aria-label={`Hapus ${row.nama} dari klasemen`}
                            className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 text-slate-500 hover:text-rose-700 hover:border-rose-200 flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Sertifikat & Apresiasi Santri */}
      {activeTab === 'sertifikat' && (
        <CertificateSection
          scores={scores}
          santriList={santriList}
          logoUrl={logoUrl}
          isAdmin={isAdmin}
        />
      )}

      {/* Tab 2: Kelola Kode & PIN Santri */}
      {activeTab === 'santri' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateSantri}
            className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4"
          >
            <h2 className="font-bold text-base text-[#0A192F]">
              Tambah Akun Santri Baru
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Santri
                </label>
                <input
                  type="text"
                  required
                  placeholder="MQ-004"
                  value={newKode}
                  onChange={(e) => setNewKode(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN
                </label>
                <input
                  type="text"
                  required
                  placeholder="1234"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Santri
              </label>
              <input
                type="text"
                required
                placeholder="Nama lengkap"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkatan Kelas
              </label>
              <select
                value={newTingkatan}
                onChange={(e) => setNewTingkatan(e.target.value as Tingkatan)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#0A192F] bg-white"
              >
                <option value="Dasar">Tingkat Dasar (Juz 29 & 30)</option>
                <option value="Menengah">Tingkat Menengah (Juz 21 – 30)</option>
                <option value="Mahir">Tingkat Mahir (30 Juz)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Akun Santri</span>
            </button>
          </form>

          <section className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-3">
            <h2 className="font-bold text-base text-[#0A192F] tabular-nums">
              Daftar Akun Santri Aktif ({santriList.length})
            </h2>
            <div className="divide-y divide-slate-100">
              {santriList.map((s) => (
                <div
                  key={s.kode_santri}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-sm text-[#0A192F]">
                      {s.nama_lengkap}
                    </p>
                    <p className="text-slate-500 mt-0.5 tabular-nums">
                      Kode:{' '}
                      <strong className="text-[#0A192F]">{s.kode_santri}</strong>{' '}
                      · PIN:{' '}
                      <strong className="text-[#0A192F]">{s.pin_santri}</strong>{' '}
                      · Tingkat{' '}
                      <strong className="text-[#7C5D10]">{s.tingkatan}</strong>
                    </p>
                  </div>

                  {confirmDeleteKode === s.kode_santri ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteSantri(s.kode_santri);
                          setConfirmDeleteKode(null);
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs cursor-pointer"
                      >
                        Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteKode(null)}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteKode(s.kode_santri)}
                      aria-label={`Hapus santri ${s.nama_lengkap}`}
                      className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 text-slate-500 hover:text-rose-700 hover:border-rose-200 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Tab 3: Kelola Pengajar (Khusus peran Admin) */}
      {activeTab === 'pengajar' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreatePengajar}
            className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4"
          >
            <div>
              <h2 className="font-bold text-base text-[#0A192F]">
                Tambah Data Pengajar
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Email yang ditambahkan dapat langsung digunakan untuk masuk ke
                Panel Guru.
              </p>
            </div>

            <div>
              <label
                htmlFor="pengajar-nama"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nama Lengkap
              </label>
              <input
                id="pengajar-nama"
                type="text"
                required
                placeholder="Contoh: Ustadz Abdurrahman"
                value={pengajarNama}
                onChange={(e) => setPengajarNama(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0A192F]"
              />
            </div>

            <div>
              <label
                htmlFor="pengajar-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Pengajar
              </label>
              <input
                id="pengajar-email"
                type="email"
                required
                placeholder="pengajar@markaz.id"
                value={pengajarEmail}
                onChange={(e) => setPengajarEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0A192F]"
              />
            </div>

            <div>
              <label
                htmlFor="pengajar-peran"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Peran
              </label>
              <select
                id="pengajar-peran"
                value={pengajarPeran}
                onChange={(e) =>
                  setPengajarPeran(e.target.value as 'Admin' | 'Pengajar')
                }
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#0A192F] bg-white focus:outline-none focus:border-[#0A192F]"
              >
                <option value="Pengajar">Pengajar (Ustadz/Ustadzah)</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmittingPengajar}
              className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#0A192F] hover:bg-[#112240] disabled:opacity-60 text-[#F4D06F] font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmittingPengajar ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengajar</span>
                </>
              )}
            </button>
          </form>

          <section className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-base text-[#0A192F] tabular-nums">
                Daftar Pengajar Terdaftar ({pengajarList.length})
              </h2>
              <button
                type="button"
                onClick={onRefreshPengajar}
                disabled={isLoadingPengajar}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#7C5D10] hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoadingPengajar ? 'animate-spin' : ''
                  }`}
                />
                <span>Segarkan</span>
              </button>
            </div>

            {isLoadingPengajar && pengajarList.length === 0 ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-14 rounded-2xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : pengajarList.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Belum ada data pengajar ditemukan di tabel{' '}
                <code>pengajar</code>.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pengajarList.map((p) => {
                  const isCurrentSession =
                    String(p.id) === String(guruSession.id) ||
                    p.email.toLowerCase() === guruSession.email.toLowerCase();

                  return (
                    <div
                      key={p.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#0A192F] truncate">
                          {p.nama}
                        </p>
                        <p className="text-slate-500 mt-0.5 truncate">
                          <span className="font-semibold text-[#7C5D10]">
                            {p.peran}
                          </span>{' '}
                          · {p.email}
                        </p>
                      </div>

                      {isCurrentSession ? (
                        <span className="text-[11px] font-bold text-[#0A192F] whitespace-nowrap shrink-0">
                          Sesi Aktif
                        </span>
                      ) : confirmDeletePengajarId === p.id ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeletePengajar(p.id);
                              setConfirmDeletePengajarId(null);
                            }}
                            className="min-h-[36px] px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs cursor-pointer"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePengajarId(null)}
                            className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePengajarId(p.id)}
                          aria-label={`Hapus pengajar ${p.nama}`}
                          className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 text-slate-500 hover:text-rose-700 hover:border-rose-200 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 4: Pengaturan Logo & Sinkronisasi Supabase */}
      {activeTab === 'pengaturan' && isAdmin && (
        <form
          onSubmit={onSaveConfig}
          className="max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 space-y-4"
        >
          <div>
            <h2 className="font-bold text-base text-[#0A192F]">
              Konfigurasi Database Supabase & Logo Markaz
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hubungkan proyek Supabase Anda untuk sinkronisasi tabel{' '}
              <code>pengajar</code>, <code>mq_santri</code>, dan{' '}
              <code>mq_nilai</code> antar perangkat.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Logo Markaz (Opsional)
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://.../logo.png"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supabase Anon Public Key
            </label>
            <input
              type="password"
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <button
            type="submit"
            className="min-h-[46px] px-6 py-3 rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] font-bold text-xs cursor-pointer"
          >
            Simpan Konfigurasi
          </button>
        </form>
      )}
    </div>
  );
};
