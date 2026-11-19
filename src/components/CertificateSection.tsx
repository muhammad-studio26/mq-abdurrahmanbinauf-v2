import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Printer,
  Sparkles
} from 'lucide-react';
import type {
  SantriRecord,
  ScoreRecord,
  Tingkatan
} from '../types';

const JABATAN_PENANDATANGAN =
  "Pimpinan Markaz Al-Qur'an Abdurrahman bin 'Auf";
const DEFAULT_NAMA_PENANDATANGAN = 'Abu Kabsyah Muhammad';

interface CertificateSectionProps {
  scores: ScoreRecord[];
  santriList: SantriRecord[];
  logoUrl: string;
  isAdmin: boolean;
}

interface CandidateSummary {
  key: string;
  nama: string;
  kode: string;
  tingkatan: Tingkatan;
  totalSoal: number;
  totalBenar: number;
  sessions: number;
  avgSkor: number;
  bestSkor: number;
  eligible: boolean;
}

function getPredikat(score: number): string {
  if (score >= 90) return 'Mumtaz (Istimewa)';
  if (score >= 80) return 'Jayyid Jiddan (Sangat Baik)';
  if (score >= 70) return 'Jayyid (Baik)';
  return 'Maqbul (Cukup)';
}

function formatTanggalIndonesia(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
  return currentY;
}

export const CertificateSection: React.FC<CertificateSectionProps> = ({
  scores,
  santriList,
  logoUrl,
  isAdmin
}) => {
  const [logoImgError, setLogoImgError] = useState(false);

  useEffect(() => {
    setLogoImgError(false);
  }, [logoUrl]);

  const showLogoImage = Boolean(logoUrl.trim()) && !logoImgError;

  const candidates = useMemo<CandidateSummary[]>(() => {
    const santriMap = new Map<string, SantriRecord>();
    santriList.forEach((s) => {
      santriMap.set(s.kode_santri.trim().toUpperCase(), s);
    });

    const agg = new Map<
      string,
      {
        key: string;
        nama: string;
        kode: string;
        tingkatan: Tingkatan;
        totalSoal: number;
        totalBenar: number;
        sessions: number;
        totalSkor: number;
        bestSkor: number;
      }
    >();

    scores.forEach((s) => {
      const hasKode = Boolean(s.kode_santri && s.kode_santri !== 'GUEST');
      const key = hasKode
        ? s.kode_santri.trim().toUpperCase()
        : `GUEST:${s.nama_santri.trim().toLowerCase()}`;
      const matchedSantri = hasKode ? santriMap.get(key) : undefined;

      const existing = agg.get(key);
      if (!existing) {
        agg.set(key, {
          key,
          nama: matchedSantri?.nama_lengkap || s.nama_santri,
          kode: hasKode ? key : 'GUEST',
          tingkatan: matchedSantri?.tingkatan || s.tingkatan,
          totalSoal: s.jumlah_soal,
          totalBenar: s.benar,
          sessions: 1,
          totalSkor: s.skor,
          bestSkor: s.skor
        });
      } else {
        existing.totalSoal += s.jumlah_soal;
        existing.totalBenar += s.benar;
        existing.sessions += 1;
        existing.totalSkor += s.skor;
        existing.bestSkor = Math.max(existing.bestSkor, s.skor);
      }
    });

    return Array.from(agg.values())
      .map((entry) => {
        const avgSkor = Math.round(entry.totalSkor / entry.sessions);
        return {
          key: entry.key,
          nama: entry.nama,
          kode: entry.kode,
          tingkatan: entry.tingkatan,
          totalSoal: entry.totalSoal,
          totalBenar: entry.totalBenar,
          sessions: entry.sessions,
          avgSkor,
          bestSkor: entry.bestSkor,
          eligible: entry.totalSoal >= 40
        };
      })
      .sort((a, b) => {
        if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
        return b.totalSoal - a.totalSoal || b.avgSkor - a.avgSkor;
      });
  }, [scores, santriList]);

  const eligibleCandidates = useMemo(
    () => candidates.filter((c) => c.eligible),
    [candidates]
  );

  const [showAllForPreview, setShowAllForPreview] = useState(false);
  const selectableCandidates = showAllForPreview
    ? candidates
    : eligibleCandidates;

  const initialCandidate = eligibleCandidates[0] || candidates[0] || null;

  const [selectedKey, setSelectedKey] = useState<string>(
    initialCandidate?.key || ''
  );
  const [customNama, setCustomNama] = useState<string>(
    initialCandidate?.nama || 'Nama Lengkap Santri'
  );
  const [customTingkatan, setCustomTingkatan] = useState<Tingkatan>(
    initialCandidate?.tingkatan || 'Dasar'
  );
  const [customTotalSoal, setCustomTotalSoal] = useState<number>(
    initialCandidate ? Math.max(40, initialCandidate.totalSoal) : 40
  );
  const [customNilai, setCustomNilai] = useState<number>(
    initialCandidate?.avgSkor ?? 90
  );
  const [customPredikat, setCustomPredikat] = useState<string>(
    getPredikat(initialCandidate?.avgSkor ?? 90)
  );
  const [tanggalTerbit, setTanggalTerbit] = useState<string>(() =>
    formatTanggalIndonesia(new Date())
  );
  const [namaPenandatangan, setNamaPenandatangan] = useState<string>(
    DEFAULT_NAMA_PENANDATANGAN
  );
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);

  const effectivePenandatangan = isAdmin
    ? namaPenandatangan.trim() || DEFAULT_NAMA_PENANDATANGAN
    : DEFAULT_NAMA_PENANDATANGAN;

  const handleSelectCandidate = (key: string) => {
    setSelectedKey(key);
    const found = candidates.find((c) => c.key === key);
    if (!found) return;
    setCustomNama(found.nama);
    setCustomTingkatan(found.tingkatan);
    setCustomTotalSoal(found.totalSoal);
    setCustomNilai(found.avgSkor);
    setCustomPredikat(getPredikat(found.avgSkor));
  };

  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    try {
      const width = 1600;
      const height = 1131;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background ivory cream
      ctx.fillStyle = '#FFFDF7';
      ctx.fillRect(0, 0, width, height);

      // Navy header band accent & subtle top/bottom bars
      ctx.fillStyle = '#0A192F';
      ctx.fillRect(0, 0, width, 24);
      ctx.fillRect(0, height - 24, width, 24);

      // Outer navy border
      ctx.strokeStyle = '#0A192F';
      ctx.lineWidth = 10;
      ctx.strokeRect(48, 48, width - 96, height - 96);

      // Inner gold double border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(66, 66, width - 132, height - 132);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(76, 76, width - 152, height - 152);

      // Corner gold geometric accents
      const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * 42);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * 42, cy);
        ctx.stroke();

        ctx.fillStyle = '#0A192F';
        ctx.fillRect(cx - 5, cy - 5, 10, 10);
      };
      drawCorner(86, 86, 1, 1);
      drawCorner(width - 86, 86, -1, 1);
      drawCorner(86, height - 86, 1, -1);
      drawCorner(width - 86, height - 86, -1, -1);

      // Plain transparent Logo / Emblem at top center (no circle, no navy box, no border)
      const centerX = width / 2;
      let logoDrawn = false;
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('logo load failed'));
            img.src = logoUrl;
          });
          const maxLogoW = 140;
          const maxLogoH = 92;
          const scale = Math.min(
            maxLogoW / (img.naturalWidth || img.width || 1),
            maxLogoH / (img.naturalHeight || img.height || 1)
          );
          const drawW = (img.naturalWidth || img.width) * scale;
          const drawH = (img.naturalHeight || img.height) * scale;
          ctx.drawImage(
            img,
            centerX - drawW / 2,
            152 - drawH / 2,
            drawW,
            drawH
          );
          logoDrawn = true;
        } catch {
          logoDrawn = false;
        }
      }

      if (!logoDrawn) {
        ctx.fillStyle = '#0A192F';
        ctx.font = 'bold 72px "Amiri", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ق', centerX, 152);
      }

      // Kop Markaz
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#7C5D10';
      ctx.font = 'bold 20px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText("MARKAZ AL-QUR'AN ABDURRAHMAN BIN 'AUF", centerX, 228);

      // Certificate Main Title
      ctx.fillStyle = '#0A192F';
      ctx.font = '800 50px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText('SERTIFIKAT APRESIASI & KELULUSAN', centerX, 294);

      // Gold divider line
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 240, 318);
      ctx.lineTo(centerX + 240, 318);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '600 22px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText(
        'Diberikan dengan penuh penghargaan dan doa keberkahan kepada:',
        centerX,
        372
      );

      // Student Full Name
      ctx.fillStyle = '#0A192F';
      ctx.font = '800 58px Georgia, "Times New Roman", serif';
      ctx.fillText(customNama || 'Nama Lengkap Santri', centerX, 452);

      // Subtle underline below student name
      const nameWidth = Math.min(
        820,
        Math.max(420, ctx.measureText(customNama || 'Nama Lengkap Santri').width + 80)
      );
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - nameWidth / 2, 474);
      ctx.lineTo(centerX + nameWidth / 2, 474);
      ctx.stroke();

      // Achievement Narrative
      ctx.fillStyle = '#334155';
      ctx.font = '500 23px "Plus Jakarta Sans", Arial, sans-serif';
      wrapCanvasText(
        ctx,
        `Telah menyelesaikan evaluasi hafalan Al-Qur'an dan Pengetahuan Agama Islam pada Tingkat Kelas ${customTingkatan} sebanyak ${customTotalSoal} soal dengan pencapaian hasil sebagai berikut:`,
        centerX,
        526,
        1120,
        34
      );

      // 3 Summary Boxes (Tingkat Kelas, Total Soal, Nilai & Predikat)
      const boxY = 602;
      const boxH = 128;
      const boxW = 340;
      const gap = 36;
      const startX = centerX - (boxW * 3 + gap * 2) / 2;

      const metricsBoxes = [
        {
          label: 'TINGKAT KELAS',
          value: `Kelas ${customTingkatan}`,
          sub:
            customTingkatan === 'Dasar'
              ? 'Juz 29 & 30'
              : customTingkatan === 'Menengah'
                ? 'Juz 21 – 30'
                : '30 Juz Lengkap'
        },
        {
          label: 'TOTAL EVALUASI',
          value: `${customTotalSoal} Soal`,
          sub: 'Evaluasi / Ujian Terselesaikan'
        },
        {
          label: 'NILAI & PREDIKAT',
          value: `${customNilai} / 100`,
          sub: customPredikat
        }
      ];

      metricsBoxes.forEach((box, idx) => {
        const bx = startX + idx * (boxW + gap);
        ctx.fillStyle = idx === 2 ? '#0A192F' : '#F8FAFC';
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, boxY, boxW, boxH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = idx === 2 ? '#F4D06F' : '#7C5D10';
        ctx.font = 'bold 15px "Plus Jakarta Sans", Arial, sans-serif';
        ctx.fillText(box.label, bx + boxW / 2, boxY + 34);

        ctx.fillStyle = idx === 2 ? '#FFFFFF' : '#0A192F';
        ctx.font = '800 30px "Plus Jakarta Sans", Arial, sans-serif';
        ctx.fillText(box.value, bx + boxW / 2, boxY + 76);

        ctx.fillStyle = idx === 2 ? '#E2E8F0' : '#64748B';
        ctx.font = '600 16px "Plus Jakarta Sans", Arial, sans-serif';
        ctx.fillText(box.sub, bx + boxW / 2, boxY + 106);
      });

      // Footer Signature & Issue Date
      const footerY = 850;

      // Left: Tanggal Terbit
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = '600 17px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText('Diterbitkan pada tanggal:', 170, footerY);

      ctx.fillStyle = '#0A192F';
      ctx.font = 'bold 22px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText(tanggalTerbit, 170, footerY + 34);

      ctx.fillStyle = '#7C5D10';
      ctx.font = 'italic 18px Georgia, serif';
      ctx.fillText(
        "Barakallahu fiikum, teruslah menjaga kalamullah.",
        170,
        footerY + 76
      );

      // Right: Signature block (permanent official signer, balanced at bottom-right)
      const sigX = width - 350;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = '600 16px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText(JABATAN_PENANDATANGAN, sigX, footerY);

      ctx.strokeStyle = '#0A192F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sigX - 155, footerY + 88);
      ctx.lineTo(sigX + 155, footerY + 88);
      ctx.stroke();

      ctx.fillStyle = '#0A192F';
      ctx.font = '800 22px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText(effectivePenandatangan, sigX, footerY + 120);

      // Export PNG
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (customNama || 'Santri')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      link.download = `Sertifikat-${safeName}-${customTingkatan}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Card (hidden during print) */}
      <section className="no-print bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-[#0A192F] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#7C5D10]" />
              <span>Sertifikat & Apresiasi Santri</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sertifikat diberikan bagi santri tingkat Dasar, Menengah, maupun
              Mahir yang telah menyelesaikan minimal{' '}
              <strong className="text-[#0A192F]">40 soal evaluasi/ujian</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-[#D4AF37]/50 text-xs font-bold text-[#7C5D10] tabular-nums">
              {eligibleCandidates.length} Santri Memenuhi Syarat
            </span>
          </div>
        </div>

        {/* Eligible Students Selector */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0A192F]">
              Pilih Santri Penerima Sertifikat
            </span>
            {candidates.length > eligibleCandidates.length && (
              <button
                type="button"
                onClick={() => setShowAllForPreview((prev) => !prev)}
                className="text-xs font-semibold text-[#7C5D10] hover:text-[#0A192F] underline underline-offset-4 cursor-pointer"
              >
                {showAllForPreview
                  ? 'Tampilkan yang ≥ 40 soal saja'
                  : 'Tampilkan semua santri (mode pratinjau)'}
              </button>
            )}
          </div>

          {selectableCandidates.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Belum ada santri yang mencapai total minimal{' '}
              <strong className="text-[#0A192F]">40 soal</strong> evaluasi. Anda
              tetap dapat menyesuaikan nama dan pratinjau sertifikat di bawah
              ini, atau aktifkan mode pratinjau untuk memilih santri yang ada.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectableCandidates.map((c) => {
                const isSelected = selectedKey === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleSelectCandidate(c.key)}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'bg-white hover:border-[#D4AF37] border-slate-200 text-[#0A192F]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{c.nama}</p>
                      <p
                        className={`text-[11px] mt-0.5 tabular-nums ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Kelas {c.tingkatan} · {c.totalSoal} soal · Nilai{' '}
                        {c.avgSkor}
                      </p>
                    </div>
                    {c.eligible && (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isSelected ? 'text-[#F4D06F]' : 'text-emerald-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Certificate Details Editor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Santri
            </label>
            <input
              type="text"
              value={customNama}
              onChange={(e) => setCustomNama(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0A192F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tingkat Kelas
            </label>
            <select
              value={customTingkatan}
              onChange={(e) => setCustomTingkatan(e.target.value as Tingkatan)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-[#0A192F] bg-white"
            >
              <option value="Dasar">Kelas Dasar (Juz 29–30)</option>
              <option value="Menengah">Kelas Menengah (Juz 21–30)</option>
              <option value="Mahir">Kelas Mahir (30 Juz)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Soal Diselesaikan
            </label>
            <input
              type="number"
              min={1}
              value={customTotalSoal}
              onChange={(e) =>
                setCustomTotalSoal(Math.max(1, Number(e.target.value) || 40))
              }
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0A192F] tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nilai / Predikat Pencapaian
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={customNilai}
                onChange={(e) => {
                  const val = Math.min(
                    100,
                    Math.max(0, Number(e.target.value) || 0)
                  );
                  setCustomNilai(val);
                  setCustomPredikat(getPredikat(val));
                }}
                className="w-20 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-[#0A192F] tabular-nums"
              />
              <input
                type="text"
                value={customPredikat}
                onChange={(e) => setCustomPredikat(e.target.value)}
                className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0A192F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Terbit
            </label>
            <input
              type="text"
              value={tanggalTerbit}
              onChange={(e) => setTanggalTerbit(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0A192F]"
            />
          </div>

          <div>
            <label
              htmlFor="cert-penandatangan"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Penandatangan ({JABATAN_PENANDATANGAN})
            </label>
            {isAdmin ? (
              <input
                id="cert-penandatangan"
                type="text"
                value={namaPenandatangan}
                onChange={(e) => setNamaPenandatangan(e.target.value)}
                placeholder={DEFAULT_NAMA_PENANDATANGAN}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#0A192F] focus:outline-none focus:border-[#0A192F]"
              />
            ) : (
              <>
                <input
                  id="cert-penandatangan"
                  type="text"
                  readOnly
                  disabled
                  value={DEFAULT_NAMA_PENANDATANGAN}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-[#0A192F] cursor-not-allowed opacity-90"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hanya dapat diubah oleh Admin
                </p>
              </>
            )}
          </div>
        </div>

        {/* Download / Print Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-[#7C5D10] shrink-0" />
            <span>
              Unduh gambar PNG resolusi tinggi atau cetak / simpan sebagai PDF.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isDownloadingPng}
              onClick={handleDownloadPng}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#112240] disabled:opacity-60 text-[#F4D06F] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isDownloadingPng
                  ? 'Menyiapkan PNG...'
                  : 'Unduh Sertifikat (PNG)'}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D4AF37] bg-amber-50/70 hover:bg-amber-100/70 text-[#0A192F] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#7C5D10]" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Certificate Preview & Print Target */}
      <div className="print-certificate-sheet relative overflow-hidden rounded-3xl bg-[#FFFDF7] border-[6px] border-[#0A192F] shadow-xl p-3 sm:p-4">
        <div className="border-2 border-[#D4AF37] rounded-2xl p-6 sm:p-10 relative">
          {/* Corner Ornaments */}
          <div
            aria-hidden="true"
            className="w-8 h-8 border-t-[3px] border-l-[3px] border-[#D4AF37] absolute top-3 left-3 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="w-8 h-8 border-t-[3px] border-r-[3px] border-[#D4AF37] absolute top-3 right-3 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="w-8 h-8 border-b-[3px] border-l-[3px] border-[#D4AF37] absolute bottom-3 left-3 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="w-8 h-8 border-b-[3px] border-r-[3px] border-[#D4AF37] absolute bottom-3 right-3 pointer-events-none"
          />

          {/* Top Emblem & Kop */}
          <div className="text-center space-y-2.5">
            <div className="flex items-center justify-center mb-1">
              {showLogoImage ? (
                <img
                  src={logoUrl}
                  alt="Logo Markaz Al-Qur'an Abdurrahman bin 'Auf"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoImgError(true)}
                  className="h-16 w-auto max-w-[160px] object-contain bg-transparent"
                />
              ) : (
                <span className="text-[#0A192F] font-arabic text-5xl font-bold leading-none select-none">
                  ق
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#7C5D10]">
              Markaz Al-Qur'an Abdurrahman bin 'Auf
            </p>

            <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#0A192F]">
              SERTIFIKAT APRESIASI & KELULUSAN
            </h3>

            <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto" />
          </div>

          {/* Recipient Name & Narrative */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Diberikan dengan penuh penghargaan dan doa keberkahan kepada:
            </p>
            <p
              className="text-2xl sm:text-4xl font-extrabold text-[#0A192F] tracking-tight pb-2 border-b-2 border-[#D4AF37]/60 inline-block px-6"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {customNama || 'Nama Lengkap Santri'}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed pt-1">
              Telah menyelesaikan evaluasi hafalan Al-Qur'an dan Pengetahuan
              Agama Islam pada{' '}
              <strong className="text-[#0A192F]">
                Tingkat Kelas {customTingkatan}
              </strong>{' '}
              sebanyak{' '}
              <strong className="text-[#0A192F] tabular-nums">
                {customTotalSoal} soal
              </strong>{' '}
              dengan pencapaian hasil sebagai berikut:
            </p>
          </div>

          {/* Achievement Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-7 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-50 border border-[#D4AF37]/60 text-center">
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#7C5D10]">
                Tingkat Kelas
              </p>
              <p className="text-lg font-extrabold text-[#0A192F] mt-1">
                Kelas {customTingkatan}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {customTingkatan === 'Dasar'
                  ? 'Juz 29 & 30'
                  : customTingkatan === 'Menengah'
                    ? 'Juz 21 – 30'
                    : '30 Juz Lengkap'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-[#D4AF37]/60 text-center">
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#7C5D10]">
                Total Evaluasi
              </p>
              <p className="text-lg font-extrabold text-[#0A192F] mt-1 tabular-nums">
                {customTotalSoal} Soal
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluasi / Ujian Terselesaikan
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A192F] border border-[#D4AF37] text-center text-white">
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#F4D06F]">
                Nilai & Predikat
              </p>
              <p className="text-lg font-extrabold text-white mt-1 tabular-nums">
                {customNilai} / 100
              </p>
              <p className="text-[11px] text-slate-200 mt-0.5 font-medium">
                {customPredikat}
              </p>
            </div>
          </div>

          {/* Date & Signature */}
          <div className="mt-9 pt-6 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">
                Diterbitkan pada tanggal:
              </p>
              <p className="text-sm font-bold text-[#0A192F]">{tanggalTerbit}</p>
              <p
                className="text-xs text-[#7C5D10] italic pt-1"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Barakallahu fiikum, teruslah menjaga kalamullah.
              </p>
            </div>

            <div className="min-w-[260px] sm:text-center">
              <p className="text-xs font-semibold text-slate-600">
                {JABATAN_PENANDATANGAN}
              </p>
              <div className="h-12" />
              <div className="border-t-2 border-[#0A192F] pt-1.5">
                <p className="text-sm font-extrabold text-[#0A192F]">
                  {effectivePenandatangan}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
