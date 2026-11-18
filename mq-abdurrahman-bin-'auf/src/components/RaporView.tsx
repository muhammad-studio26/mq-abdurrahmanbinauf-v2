import React, { useMemo, useState } from 'react';
import { ArrowLeft, Award, Lock, Trophy } from 'lucide-react';
import type { ScoreRecord, Tingkatan, UserProfile } from '../types';

interface RaporViewProps {
  scores: ScoreRecord[];
  user: UserProfile | null;
  onBack: () => void;
}

function isScoreOwnedByUser(score: ScoreRecord, user: UserProfile): boolean {
  if (user.mode === 'santri' && user.kode_santri) {
    return (
      (score.kode_santri || '').trim().toUpperCase() ===
      user.kode_santri.trim().toUpperCase()
    );
  }
  return (
    (!score.kode_santri || score.kode_santri === 'GUEST') &&
    score.nama_santri.trim().toLowerCase() === user.nama.trim().toLowerCase()
  );
}

function getParticipantKey(score: ScoreRecord): string {
  return score.kode_santri && score.kode_santri !== 'GUEST'
    ? score.kode_santri.trim().toUpperCase()
    : `GUEST:${score.nama_santri.trim().toLowerCase()}`;
}

function getUserKey(user: UserProfile): string {
  return user.mode === 'santri' && user.kode_santri
    ? user.kode_santri.trim().toUpperCase()
    : `GUEST:${user.nama.trim().toLowerCase()}`;
}

export const RaporView: React.FC<RaporViewProps> = ({
  scores,
  user,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'riwayat' | 'klasemen'>('riwayat');
  const [filterTingkatan, setFilterTingkatan] = useState<'Semua' | Tingkatan>(
    'Semua'
  );

  // Rapor pribadi: hanya nilai milik santri yang sedang login
  const personalScores = useMemo(() => {
    if (!user) return [];
    return scores.filter((s) => isScoreOwnedByUser(s, user));
  }, [scores, user]);

  const filteredPersonalScores = useMemo(() => {
    if (filterTingkatan === 'Semua') return personalScores;
    return personalScores.filter((s) => s.tingkatan === filterTingkatan);
  }, [personalScores, filterTingkatan]);

  // Klasemen: hitung ranking terhadap seluruh santri di tingkat kelas yang sama,
  // namun hanya kembalikan data posisi & baris milik santri yang sedang login.
  const personalRankResult = useMemo(() => {
    if (!user) {
      return {
        rank: null as number | null,
        totalParticipants: 0,
        entry: null as {
          key: string;
          nama: string;
          kode: string;
          tingkatan: Tingkatan;
          sessions: number;
          totalSkor: number;
          bestSkor: number;
          avgSkor: number;
        } | null
      };
    }

    const sameLevelScores = scores.filter((s) => s.tingkatan === user.tingkatan);
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

    sameLevelScores.forEach((s) => {
      const key = getParticipantKey(s);
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

    const sortedClassLeaderboard = Array.from(map.values())
      .map((entry) => ({
        ...entry,
        avgSkor: Math.round(entry.totalSkor / entry.sessions)
      }))
      .sort((a, b) => b.avgSkor - a.avgSkor || b.bestSkor - a.bestSkor);

    const myKey = getUserKey(user);
    const foundIdx = sortedClassLeaderboard.findIndex((e) => e.key === myKey);

    return {
      rank: foundIdx !== -1 ? foundIdx + 1 : null,
      totalParticipants: sortedClassLeaderboard.length,
      entry: foundIdx !== -1 ? sortedClassLeaderboard[foundIdx] : null
    };
  }, [scores, user]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[40px] inline-flex items-center gap-2 text-xs font-bold text-[#0A192F] hover:text-[#7C5D10] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke beranda</span>
      </button>

      <section className="bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-6 sm:p-7 rounded-3xl border border-[#D4AF37]/30 shadow-lg">
        <p className="text-xs font-semibold text-[#F4D06F]">
          Rapor & Peringkat Pribadi Santri
        </p>
        <h1 className="text-2xl font-extrabold mt-1">
          {user ? `Rapor ${user.nama}` : 'Rapor & Riwayat Nilai'}
        </h1>
        <p className="text-sm text-slate-200 mt-1.5">
          {user
            ? `Catatan hasil belajar serta posisi peringkat Anda pada Kelas ${user.tingkatan}${user.kode_santri ? ` (${user.kode_santri})` : ''}.`
            : 'Silakan masuk terlebih dahulu untuk melihat riwayat nilai pribadi.'}
        </p>
      </section>

      {/* Controls: Tab Switcher + Contextual Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 sm:w-72">
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`min-h-[42px] py-2 px-3 rounded-xl font-bold text-xs transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-[#0A192F] text-[#F4D06F]'
                : 'text-slate-600 hover:text-[#0A192F]'
            }`}
          >
            Riwayat Nilai
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('klasemen')}
            className={`min-h-[42px] py-2 px-3 rounded-xl font-bold text-xs transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'klasemen'
                ? 'bg-[#0A192F] text-[#F4D06F]'
                : 'text-slate-600 hover:text-[#0A192F]'
            }`}
          >
            Klasemen Saya
          </button>
        </div>

        {activeTab === 'riwayat' ? (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 overflow-x-auto">
            {(['Semua', 'Dasar', 'Menengah', 'Mahir'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilterTingkatan(lvl)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  filterTingkatan === lvl
                    ? 'bg-white text-[#0A192F] shadow-2xs'
                    : 'text-slate-600 hover:text-[#0A192F]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        ) : (
          user && (
            <div className="px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-[#0A192F]">
              Tingkat Kelas {user.tingkatan}
            </div>
          )
        )}
      </div>

      {!user ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
          <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-[#0A192F]">
            Identitas santri belum aktif
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Masuk dengan Akun Santri atau Mode Guest untuk mengakses rapor pribadi Anda.
          </p>
        </div>
      ) : activeTab === 'riwayat' ? (
        filteredPersonalScores.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#0A192F]">
              Belum ada nilai tercatat untuk Anda
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Silakan kerjakan Kuis Hafalan atau Pengetahuan Agama terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {filteredPersonalScores.map((item, idx) => (
              <div
                key={`${item.created_at}-${idx}`}
                className="p-4 sm:p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-bold text-sm text-[#0A192F]">
                      {item.jenis_kuis}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-xs font-semibold text-[#7C5D10]">
                      Tingkat {item.tingkatan}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    {item.mode_belajar} · Benar {item.benar}/{item.jumlah_soal}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#0A192F] text-[#F4D06F] flex items-center justify-center font-extrabold text-base tabular-nums shrink-0">
                  {item.skor}
                </div>
              </div>
            ))}
          </div>
        )
      ) : personalRankResult.entry && personalRankResult.rank !== null ? (
        <div className="space-y-4">
          {/* Position Summary Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-[#7C5D10]">
                  Posisi Klasemen Kelas {user.tingkatan}
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0A192F] mt-0.5 tabular-nums">
                  Peringkat #{personalRankResult.rank} dari{' '}
                  {personalRankResult.totalParticipants} Santri di Kelas{' '}
                  {user.tingkatan}
                </h2>
              </div>
              {personalRankResult.rank <= 3 && (
                <div className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-xs font-extrabold text-[#0A192F] inline-flex items-center gap-1.5 self-start sm:self-center shrink-0">
                  <Trophy className="w-4 h-4 text-[#7C5D10]" />
                  <span>
                    Juara {personalRankResult.rank} Kelas {user.tingkatan}
                  </span>
                </div>
              )}
            </div>

            {/* Only the logged-in student's own leaderboard row */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm tabular-nums shrink-0 ${
                    personalRankResult.rank === 1
                      ? 'bg-[#D4AF37] text-[#0A192F]'
                      : 'bg-[#0A192F] text-[#F4D06F]'
                  }`}
                >
                  {personalRankResult.rank === 1 ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    `#${personalRankResult.rank}`
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base text-[#0A192F] truncate">
                    {personalRankResult.entry.nama}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Tingkat {personalRankResult.entry.tingkatan} ·{' '}
                    {personalRankResult.entry.sessions} sesi · Terbaik{' '}
                    {personalRankResult.entry.bestSkor}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-extrabold text-[#0A192F] tabular-nums">
                  {personalRankResult.entry.avgSkor}
                </p>
                <p className="text-[11px] text-slate-500">Rata-rata</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
            <Lock className="w-4 h-4 text-[#7C5D10] shrink-0 mt-0.5" />
            <p>
              Peringkat Anda dihitung dari seluruh santri pada{' '}
              <strong className="text-[#0A192F]">
                Kelas {user.tingkatan}
              </strong>
              . Demi privasi, daftar nilai dan nama santri lainnya tidak
              ditampilkan di akun santri.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-[#0A192F]">
            Anda belum memiliki peringkat di Kelas {user.tingkatan}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Selesaikan minimal satu sesi kuis pada Tingkat {user.tingkatan}{' '}
            untuk melihat posisi peringkat Anda di kelas.
          </p>
        </div>
      )}
    </div>
  );
};
