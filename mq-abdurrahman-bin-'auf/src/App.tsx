import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Info,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-react';
import { Header } from './components/Header';
import { AuthView } from './components/AuthView';
import { HomeView } from './components/HomeView';
import { StudySetupView } from './components/StudySetupView';
import { QuizActiveView, QuizResultView } from './components/QuizView';
import { RaporView } from './components/RaporView';
import { GuruDashboardView, GuruLoginView } from './components/GuruView';
import {
  DEFAULT_AGAMA_QUESTIONS,
  INITIAL_SANTRI_LIST,
  TINGKATAN_INFO
} from './data/questions';
import {
  formatSupabaseError,
  getSupabaseClient,
  supabaseFetch
} from './utils/supabase';
import type {
  NoticeBanner,
  PengajarRecord,
  QuizQuestion,
  QuizType,
  SantriRecord,
  ScoreRecord,
  StudyMode,
  Tingkatan,
  UserProfile,
  ViewName
} from './types';

const DEFAULT_SUPABASE_URL = 'https://apkgfohyuelocrmedbts.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwa2dmb2h5dWVsb2NybWVkYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4NDI0ODgsImV4cCI6MjExMDQxODQ4OH0.gzE9rlawqk5eEIFD-Vp_qmNSs_K71oHQbtJSbYRyeSs';
const DEFAULT_LOGO_URL = '';

const GURU_SESSION_KEY = 'mq_guru_session';

interface AlQuranAyah {
  number: number;
  numberInSurah: number;
  text: string;
  audio?: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('auth');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeBanner | null>(null);

  // Auth / Onboarding State
  const [authTab, setAuthTab] = useState<'guest' | 'santri'>('guest');
  const [guestName, setGuestName] = useState('');
  const [guestTingkatan, setGuestTingkatan] = useState<Tingkatan>('Dasar');
  const [kodeSantriInput, setKodeSantriInput] = useState('');
  const [pinSantriInput, setPinSantriInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Active User State
  const [user, setUser] = useState<UserProfile | null>(null);

  // Study Setup State
  const [studyMode, setStudyMode] = useState<StudyMode>('Latihan Bebas');
  const [quizType, setQuizType] = useState<QuizType>('Sambung Ayat');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 40>(5);

  // Active Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Persistence & Supabase State
  const [sbUrl, setSbUrl] = useState(
    () => localStorage.getItem('mq_sb_url') || DEFAULT_SUPABASE_URL
  );
  const [sbKey, setSbKey] = useState(
    () => localStorage.getItem('mq_sb_key') || DEFAULT_SUPABASE_KEY
  );
  const [logoUrl, setLogoUrl] = useState(
    () => localStorage.getItem('mq_logo_url') || DEFAULT_LOGO_URL
  );
  const [localScores, setLocalScores] = useState<ScoreRecord[]>([]);
  const [santriList, setSantriList] = useState<SantriRecord[]>([]);
  const [allScores, setAllScores] = useState<ScoreRecord[]>([]);

  // Teacher Panel Auth & Pengajar Management State
  const [guruEmail, setGuruEmail] = useState('');
  const [guruLoginError, setGuruLoginError] = useState('');
  const [isVerifyingGuru, setIsVerifyingGuru] = useState(false);
  const [guruSession, setGuruSession] = useState<PengajarRecord | null>(() => {
    const saved = localStorage.getItem(GURU_SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as PengajarRecord;
    } catch {
      localStorage.removeItem(GURU_SESSION_KEY);
      return null;
    }
  });
  const [pengajarList, setPengajarList] = useState<PengajarRecord[]>([]);
  const [isLoadingPengajar, setIsLoadingPengajar] = useState(false);
  const [isSubmittingPengajar, setIsSubmittingPengajar] = useState(false);

  const isSupabaseConfigured = Boolean(sbUrl.trim() && sbKey.trim());
  const isGuruLoggedIn = Boolean(guruSession);
  const isGuruAdmin = Boolean(
    guruSession && guruSession.peran.trim().toLowerCase() === 'admin'
  );

  const showNotice = useCallback(
    (type: NoticeBanner['type'], message: string) => {
      setNotice({ type, message });
    },
    []
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Initial load from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('mq_user_profile');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as UserProfile;
        if (parsed.mode === 'guest') {
          parsed.tingkatan = 'Dasar';
        }
        setUser(parsed);
        setCurrentView('home');
      } catch {
        localStorage.removeItem('mq_user_profile');
      }
    }

    const savedScores = localStorage.getItem('mq_local_scores');
    if (savedScores) {
      try {
        setLocalScores(JSON.parse(savedScores) as ScoreRecord[]);
      } catch {
        localStorage.removeItem('mq_local_scores');
      }
    }

    const savedSantri = localStorage.getItem('mq_local_santri');
    if (!savedSantri) {
      localStorage.setItem(
        'mq_local_santri',
        JSON.stringify(INITIAL_SANTRI_LIST)
      );
      setSantriList(INITIAL_SANTRI_LIST);
    } else {
      try {
        setSantriList(JSON.parse(savedSantri) as SantriRecord[]);
      } catch {
        setSantriList(INITIAL_SANTRI_LIST);
      }
    }
  }, []);

  const syncFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const sData = await supabaseFetch<SantriRecord[]>(
        sbUrl,
        sbKey,
        'mq_santri',
        { method: 'GET' },
        '?select=*&order=created_at.desc'
      );
      if (sData) setSantriList(sData);

      const nData = await supabaseFetch<ScoreRecord[]>(
        sbUrl,
        sbKey,
        'mq_nilai',
        { method: 'GET' },
        '?select=*&order=created_at.desc'
      );
      if (nData) setAllScores(nData);
    } catch {
      showNotice(
        'info',
        'Sinkronisasi Supabase belum tersedia; aplikasi menggunakan penyimpanan lokal.'
      );
    }
  }, [isSupabaseConfigured, sbUrl, sbKey, showNotice]);

  const fetchPengajarList = useCallback(async () => {
    const client = getSupabaseClient(sbUrl, sbKey);
    if (!client) return;

    setIsLoadingPengajar(true);
    try {
      const { data, error } = await client
        .from('pengajar')
        .select('id, nama, email, peran')
        .order('nama', { ascending: true });

      if (error) throw error;
      setPengajarList((data as PengajarRecord[]) || []);
    } catch (err) {
      showNotice(
        'error',
        `Gagal memuat tabel pengajar: ${formatSupabaseError(err)}`
      );
    } finally {
      setIsLoadingPengajar(false);
    }
  }, [sbUrl, sbKey, showNotice]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      syncFromSupabase();
    }
  }, [isSupabaseConfigured, syncFromSupabase]);

  useEffect(() => {
    if (isSupabaseConfigured && isGuruAdmin) {
      fetchPengajarList();
    }
  }, [isSupabaseConfigured, isGuruAdmin, fetchPengajarList]);

  // Guest Submit
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setAuthError('Silakan tuliskan nama lengkapmu terlebih dahulu.');
      return;
    }
    const newProfile: UserProfile = {
      mode: 'guest',
      nama: guestName.trim(),
      tingkatan: 'Dasar'
    };
    setGuestTingkatan('Dasar');
    setQuizType('Sambung Ayat');
    setStudyMode('Latihan Bebas');
    setQuestionCount(5);
    setUser(newProfile);
    localStorage.setItem('mq_user_profile', JSON.stringify(newProfile));
    setAuthError('');
    setCurrentView('home');
  };

  // Santri Login
  const handleSantriLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!kodeSantriInput.trim() || !pinSantriInput.trim()) {
      setAuthError('Masukkan Kode Santri dan PIN terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      let foundSantri: SantriRecord | undefined;

      if (isSupabaseConfigured) {
        const res = await supabaseFetch<SantriRecord[]>(
          sbUrl,
          sbKey,
          'mq_santri',
          { method: 'GET' },
          `?kode_santri=eq.${encodeURIComponent(
            kodeSantriInput.trim().toUpperCase()
          )}&pin_santri=eq.${encodeURIComponent(pinSantriInput.trim())}&select=*`
        );
        if (res && res.length > 0) foundSantri = res[0];
      }

      if (!foundSantri) {
        foundSantri = santriList.find(
          (s) =>
            s.kode_santri.toUpperCase() ===
              kodeSantriInput.trim().toUpperCase() &&
            s.pin_santri === pinSantriInput.trim()
        );
      }

      if (!foundSantri) {
        setAuthError(
          'Kode santri atau PIN tidak ditemukan. Silakan periksa kembali data dari Ustadz/Guru.'
        );
        return;
      }

      const newProfile: UserProfile = {
        mode: 'santri',
        kode_santri: foundSantri.kode_santri,
        nama: foundSantri.nama_lengkap,
        tingkatan: foundSantri.tingkatan
      };
      setUser(newProfile);
      localStorage.setItem('mq_user_profile', JSON.stringify(newProfile));
      setCurrentView('home');
    } catch {
      setAuthError('Terjadi gangguan saat memeriksa akun santri.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mq_user_profile');
    setUser(null);
    setDrawerOpen(false);
    setCurrentView('auth');
  };

  // Quiz Generator
  const startQuiz = async (
    overrideQuizType?: QuizType,
    overrideStudyMode?: StudyMode,
    overrideCount?: 5 | 10 | 40
  ) => {
    if (!user) return;
    const isGuest = user.mode === 'guest';
    const activeQuizType: QuizType = isGuest
      ? 'Sambung Ayat'
      : (overrideQuizType ?? quizType);
    const activeStudyMode: StudyMode = isGuest
      ? 'Latihan Bebas'
      : (overrideStudyMode ?? studyMode);
    const activeCount: 5 | 10 | 40 = overrideCount ?? questionCount;

    if (quizType !== activeQuizType) setQuizType(activeQuizType);
    if (studyMode !== activeStudyMode) setStudyMode(activeStudyMode);
    if (questionCount !== activeCount) setQuestionCount(activeCount);

    setIsGeneratingQuiz(true);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCurrentQIndex(0);
    setUserAnswers([]);

    try {
      if (activeQuizType === 'Pengetahuan Agama') {
        const bank = [
          ...(DEFAULT_AGAMA_QUESTIONS[user.tingkatan] ||
            DEFAULT_AGAMA_QUESTIONS.Dasar)
        ];
        for (let i = bank.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bank[i], bank[j]] = [bank[j], bank[i]];
        }
        const generated: QuizQuestion[] = [];
        for (let i = 0; i < activeCount; i++) {
          const item = bank[i % bank.length];
          generated.push({ ...item, id: `${item.id}-${i}` });
        }
        setQuestions(generated);
        setCurrentView('quiz_active');
        return;
      }

      const allowedJuz = TINGKATAN_INFO[user.tingkatan].juzRange;
      const randomJuz =
        allowedJuz[Math.floor(Math.random() * allowedJuz.length)];

      const [arabRes, audioRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/juz/${randomJuz}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/juz/${randomJuz}/ar.alafasy`)
      ]);

      if (!arabRes.ok || !audioRes.ok) {
        throw new Error('Server Al-Qur’an tidak merespons.');
      }

      const arabData = (await arabRes.json()) as {
        data?: { ayahs?: AlQuranAyah[] };
      };
      const audioData = (await audioRes.json()) as {
        data?: { ayahs?: AlQuranAyah[] };
      };

      const ayahsArab = arabData?.data?.ayahs || [];
      const ayahsAudio = audioData?.data?.ayahs || [];

      const validIndices: number[] = [];
      for (let idx = 0; idx < ayahsArab.length - 1; idx++) {
        if (ayahsArab[idx].surah.number === ayahsArab[idx + 1].surah.number) {
          validIndices.push(idx);
        }
      }

      if (validIndices.length < 4) {
        throw new Error('Data ayat pada juz terpilih tidak mencukupi.');
      }

      for (let i = validIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validIndices[i], validIndices[j]] = [validIndices[j], validIndices[i]];
      }

      const targetCount = Math.min(activeCount, validIndices.length);
      const generatedQuestions: QuizQuestion[] = [];

      for (let i = 0; i < targetCount; i++) {
        const idx = validIndices[i];
        const currentAyah = ayahsArab[idx];
        const nextAyah = ayahsArab[idx + 1];
        const audioItem = ayahsAudio[idx];

        const distractors: string[] = [];
        let attempts = 0;
        while (distractors.length < 3 && attempts < 80) {
          attempts++;
          const randIdx = Math.floor(Math.random() * ayahsArab.length);
          const candidateText = ayahsArab[randIdx].text;
          if (
            randIdx !== idx &&
            randIdx !== idx + 1 &&
            candidateText !== nextAyah.text &&
            !distractors.includes(candidateText)
          ) {
            distractors.push(candidateText);
          }
        }

        const allOptions = [nextAyah.text, ...distractors];
        for (let j = allOptions.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
        }

        const correctIdx = allOptions.indexOf(nextAyah.text);

        generatedQuestions.push({
          id: `q-${i}-${currentAyah.number}`,
          surahName: `${currentAyah.surah.englishName} (${currentAyah.surah.name})`,
          ayahNumber: currentAyah.numberInSurah,
          questionText: `Lanjutkan potongan ayat dari QS. ${currentAyah.surah.englishName} ayat ${currentAyah.numberInSurah} berikut ini:`,
          arabicPrompt: currentAyah.text,
          audioUrl: audioItem?.audio || '',
          options: allOptions,
          correctIndex: correctIdx,
          explanation: `Jawaban yang tepat adalah QS. ${nextAyah.surah.englishName} ayat ${nextAyah.numberInSurah}.`
        });
      }

      setQuestions(generatedQuestions);
      setCurrentView('quiz_active');
    } catch {
      showNotice(
        'error',
        'Gagal memuat ayat dari server Al-Qur’an. Pastikan koneksi internet aktif lalu coba kembali.'
      );
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (studyMode === 'Latihan Bebas' && isAnswerSubmitted) return;
    setSelectedOption(idx);
    if (studyMode === 'Latihan Bebas') {
      setIsAnswerSubmitted(true);
    }
  };

  const handleNextQuestion = async () => {
    if (selectedOption === null) return;

    const updatedAnswers = [...userAnswers, selectedOption];
    setUserAnswers(updatedAnswers);

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      return;
    }

    let correctCount = 0;
    questions.forEach((q, i) => {
      if (updatedAnswers[i] === q.correctIndex) correctCount++;
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);

    const newRecord: ScoreRecord = {
      kode_santri: user?.kode_santri || 'GUEST',
      nama_santri: user?.nama || 'Santri Guest',
      tingkatan: user?.tingkatan || 'Dasar',
      mode_belajar: user?.mode === 'guest' ? 'Latihan Bebas' : studyMode,
      jenis_kuis: user?.mode === 'guest' ? 'Sambung Ayat' : quizType,
      jumlah_soal: questions.length,
      benar: correctCount,
      skor: finalScore,
      created_at: new Date().toISOString()
    };

    const updatedLocal = [newRecord, ...localScores];
    setLocalScores(updatedLocal);
    localStorage.setItem('mq_local_scores', JSON.stringify(updatedLocal));

    if (isSupabaseConfigured) {
      try {
        await supabaseFetch(sbUrl, sbKey, 'mq_nilai', {
          method: 'POST',
          body: JSON.stringify(newRecord)
        });
        syncFromSupabase();
      } catch {
        showNotice(
          'info',
          'Nilai tersimpan di perangkat lokal. Sinkronisasi ke Supabase gagal.'
        );
      }
    }

    setCurrentView('quiz_result');
  };

  // Teacher Panel Email Verification against Supabase `pengajar` table
  const handleGuruLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuruLoginError('');

    const inputEmail = guruEmail.trim();
    if (!inputEmail) {
      setGuruLoginError('Masukkan alamat email pengajar terlebih dahulu.');
      return;
    }

    const client = getSupabaseClient(sbUrl, sbKey);
    if (!client) {
      setGuruLoginError(
        'Konfigurasi Supabase belum diatur. Pastikan URL dan Anon Key Supabase tersedia.'
      );
      return;
    }

    setIsVerifyingGuru(true);
    try {
      const { data, error } = await client
        .from('pengajar')
        .select('id, nama, email, peran')
        .ilike('email', inputEmail)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setGuruLoginError(
          'Email tidak ditemukan atau belum terdaftar di tabel pengajar.'
        );
        return;
      }

      const teacher = data[0] as PengajarRecord;
      setGuruSession(teacher);
      localStorage.setItem(GURU_SESSION_KEY, JSON.stringify(teacher));
      setGuruEmail('');
      setCurrentView('guru_dashboard');
      showNotice(
        'success',
        `Selamat datang, ${teacher.nama} (${teacher.peran}).`
      );
      syncFromSupabase();
      if (teacher.peran.trim().toLowerCase() === 'admin') {
        fetchPengajarList();
      }
    } catch (err) {
      setGuruLoginError(
        `Gagal membaca tabel pengajar di Supabase: ${formatSupabaseError(err)}`
      );
    } finally {
      setIsVerifyingGuru(false);
    }
  };

  const handleGuruLogout = () => {
    localStorage.removeItem(GURU_SESSION_KEY);
    setGuruSession(null);
    setGuruEmail('');
    setGuruLoginError('');
    setPengajarList([]);
    setCurrentView(user ? 'home' : 'guru_login');
    showNotice('info', 'Anda telah keluar dari Panel Guru.');
  };

  // Kelola Pengajar CRUD Handlers (Supabase `pengajar` table)
  const handleAddPengajar = async (item: {
    nama: string;
    email: string;
    peran: string;
  }): Promise<boolean> => {
    if (!isGuruAdmin) {
      showNotice(
        'error',
        'Akses ditolak: hanya pengajar dengan peran Admin yang dapat menambah pengajar.'
      );
      return false;
    }

    const client = getSupabaseClient(sbUrl, sbKey);
    if (!client) {
      showNotice('error', 'Konfigurasi Supabase belum tersedia.');
      return false;
    }

    setIsSubmittingPengajar(true);
    try {
      const { data: existing, error: checkError } = await client
        .from('pengajar')
        .select('id')
        .ilike('email', item.email.trim())
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        showNotice(
          'error',
          `Email ${item.email} sudah terdaftar sebagai pengajar.`
        );
        return false;
      }

      const { data, error } = await client
        .from('pengajar')
        .insert([
          {
            nama: item.nama.trim(),
            email: item.email.trim().toLowerCase(),
            peran: item.peran
          }
        ])
        .select('id, nama, email, peran');

      if (error) throw error;

      if (data && data.length > 0) {
        setPengajarList((prev) =>
          [...prev, ...(data as PengajarRecord[])].sort((a, b) =>
            a.nama.localeCompare(b.nama)
          )
        );
      } else {
        await fetchPengajarList();
      }

      showNotice(
        'success',
        `Pengajar ${item.nama} (${item.peran}) berhasil ditambahkan.`
      );
      return true;
    } catch (err) {
      showNotice(
        'error',
        `Gagal menambahkan pengajar: ${formatSupabaseError(err)}`
      );
      return false;
    } finally {
      setIsSubmittingPengajar(false);
    }
  };

  const handleDeletePengajar = async (id: string | number) => {
    if (!isGuruAdmin) {
      showNotice(
        'error',
        'Akses ditolak: hanya pengajar dengan peran Admin yang dapat menghapus pengajar.'
      );
      return;
    }

    if (guruSession && String(guruSession.id) === String(id)) {
      showNotice(
        'error',
        'Tidak dapat menghapus akun pengajar yang sedang digunakan pada sesi aktif.'
      );
      return;
    }

    const client = getSupabaseClient(sbUrl, sbKey);
    if (!client) {
      showNotice('error', 'Konfigurasi Supabase belum tersedia.');
      return;
    }

    try {
      const { error } = await client.from('pengajar').delete().eq('id', id);
      if (error) throw error;

      setPengajarList((prev) => prev.filter((p) => String(p.id) !== String(id)));
      showNotice('info', 'Data pengajar berhasil dihapus.');
    } catch (err) {
      showNotice(
        'error',
        `Gagal menghapus pengajar: ${formatSupabaseError(err)}`
      );
    }
  };

  const handleAddSantri = async (item: SantriRecord) => {
    const duplicate = santriList.some(
      (s) => s.kode_santri.toUpperCase() === item.kode_santri.toUpperCase()
    );
    if (duplicate) {
      showNotice('error', `Kode santri ${item.kode_santri} sudah terdaftar.`);
      return;
    }

    const updated = [item, ...santriList];
    setSantriList(updated);
    localStorage.setItem('mq_local_santri', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabaseFetch(sbUrl, sbKey, 'mq_santri', {
          method: 'POST',
          body: JSON.stringify(item)
        });
        syncFromSupabase();
        showNotice(
          'success',
          `Santri ${item.nama_lengkap} berhasil ditambahkan ke cloud.`
        );
      } catch {
        showNotice(
          'info',
          'Tersimpan di perangkat lokal. Pastikan tabel mq_santri sudah dibuat di Supabase.'
        );
      }
    } else {
      showNotice('success', `Santri ${item.nama_lengkap} berhasil ditambahkan.`);
    }
  };

  const handleDeleteSantri = async (kode: string) => {
    const updated = santriList.filter((s) => s.kode_santri !== kode);
    setSantriList(updated);
    localStorage.setItem('mq_local_santri', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabaseFetch(
          sbUrl,
          sbKey,
          'mq_santri',
          { method: 'DELETE' },
          `?kode_santri=eq.${encodeURIComponent(kode)}`
        );
      } catch {
        // Local deletion already applied
      }
    }
    showNotice('info', `Akun santri ${kode} telah dihapus.`);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGuruAdmin) {
      showNotice(
        'error',
        'Akses ditolak: hanya pengajar dengan peran Admin yang dapat mengubah pengaturan.'
      );
      return;
    }
    localStorage.setItem('mq_sb_url', sbUrl.trim());
    localStorage.setItem('mq_sb_key', sbKey.trim());
    localStorage.setItem('mq_logo_url', logoUrl.trim());
    showNotice(
      'success',
      'Pengaturan Supabase & Logo Markaz berhasil disimpan.'
    );
    syncFromSupabase();
    fetchPengajarList();
  };

  const combinedScores =
    isSupabaseConfigured && allScores.length > 0 ? allScores : localScores;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0A192F] flex flex-col">
      <Header
        user={user}
        logoUrl={logoUrl}
        currentView={currentView}
        isGuruLoggedIn={isGuruLoggedIn}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        onNavigate={(view) => {
          if (
            (view === 'guru_login' || view === 'guru_dashboard') &&
            user &&
            !guruSession
          ) {
            showNotice(
              'error',
              'Akses ditolak: Silakan keluar dari akun santri terlebih dahulu untuk membuka Panel Guru.'
            );
            return;
          }
          if (view === 'guru_login' && guruSession) {
            setCurrentView('guru_dashboard');
            return;
          }
          if (view === 'guru_dashboard' && !guruSession) {
            setCurrentView('guru_login');
            return;
          }
          if (user?.mode === 'guest' && view === 'study_setup') {
            setQuizType('Sambung Ayat');
            setStudyMode('Latihan Bebas');
          }
          if (user?.mode === 'guest' && view === 'rapor') {
            setAuthTab('santri');
            setCurrentView('auth');
            return;
          }
          setCurrentView(view);
        }}
        onLogout={handleLogout}
      />

      {/* Non-blocking In-App Notification Banner */}
      {notice && (
        <div className="no-print max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div
            role="status"
            className={`rounded-2xl p-3.5 px-4 border flex items-center justify-between gap-3 text-xs font-medium ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : notice.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-[#0A192F]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : notice.type === 'error' ? (
                <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-[#7C5D10] shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="p-1 rounded-lg hover:bg-black/5 shrink-0 cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === 'auth' && (
          <AuthView
            authTab={authTab}
            setAuthTab={setAuthTab}
            guestName={guestName}
            setGuestName={setGuestName}
            guestTingkatan={guestTingkatan}
            setGuestTingkatan={setGuestTingkatan}
            kodeSantriInput={kodeSantriInput}
            setKodeSantriInput={setKodeSantriInput}
            pinSantriInput={pinSantriInput}
            setPinSantriInput={setPinSantriInput}
            authError={authError}
            clearAuthError={() => setAuthError('')}
            isLoading={isLoading}
            onGuestSubmit={handleGuestSubmit}
            onSantriLogin={handleSantriLogin}
          />
        )}

        {currentView === 'home' && user && (
          <HomeView
            user={user}
            recentScores={combinedScores}
            isGeneratingQuiz={isGeneratingQuiz}
            onStartStudy={(type, mode, count) => {
              const isGuest = user.mode === 'guest';
              setQuizType(isGuest ? 'Sambung Ayat' : type);
              if (mode) setStudyMode(isGuest ? 'Latihan Bebas' : mode);
              if (count) setQuestionCount(count);
              setCurrentView('study_setup');
            }}
            onStartGuestTrial={() => startQuiz('Sambung Ayat', 'Latihan Bebas', 5)}
            onNavigate={(view) => setCurrentView(view)}
            onManageAccount={() => {
              setAuthTab('santri');
              setCurrentView('auth');
            }}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'study_setup' && user && (
          <StudySetupView
            user={user}
            studyMode={studyMode}
            setStudyMode={setStudyMode}
            quizType={quizType}
            setQuizType={setQuizType}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            isGeneratingQuiz={isGeneratingQuiz}
            onBack={() => setCurrentView('home')}
            onStartQuiz={() => startQuiz()}
          />
        )}

        {currentView === 'quiz_active' && user && (
          <QuizActiveView
            user={user}
            studyMode={studyMode}
            questions={questions}
            currentQIndex={currentQIndex}
            selectedOption={selectedOption}
            isAnswerSubmitted={isAnswerSubmitted}
            onSelectOption={handleSelectOption}
            onNextQuestion={handleNextQuestion}
            onCancel={() => setCurrentView('study_setup')}
          />
        )}

        {currentView === 'quiz_result' && (
          <QuizResultView
            latest={localScores[0]}
            questions={questions}
            userAnswers={userAnswers}
            isGuest={user?.mode === 'guest'}
            onRetry={() => setCurrentView('study_setup')}
            onOpenRapor={() => setCurrentView('rapor')}
            onOpenSantriLogin={() => {
              setAuthTab('santri');
              setCurrentView('auth');
            }}
            onHome={() => setCurrentView(user ? 'home' : 'auth')}
          />
        )}

        {currentView === 'rapor' && (
          <RaporView
            scores={combinedScores}
            user={user}
            onBack={() => setCurrentView(user ? 'home' : 'auth')}
          />
        )}

        {currentView === 'guru_login' && !guruSession && !user && (
          <GuruLoginView
            guruEmail={guruEmail}
            setGuruEmail={setGuruEmail}
            loginError={guruLoginError}
            isVerifying={isVerifyingGuru}
            onLogin={handleGuruLogin}
            onBack={() => setCurrentView('auth')}
          />
        )}

        {currentView === 'guru_login' && !guruSession && user && (
          <section className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-4">
            <h1 className="text-lg font-extrabold text-[#0A192F]">
              Akses Panel Guru Dibatasi
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menu Panel Guru tidak tersedia selama akun santri sedang aktif.
              Silakan keluar dari akun santri terlebih dahulu apabila Anda
              adalah pengajar.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] text-xs font-bold cursor-pointer"
            >
              Kembali ke Beranda Santri
            </button>
          </section>
        )}

        {(currentView === 'guru_dashboard' ||
          (currentView === 'guru_login' && guruSession)) &&
          guruSession && (
            <GuruDashboardView
              guruSession={guruSession}
              scores={combinedScores}
              santriList={santriList}
              pengajarList={pengajarList}
              isLoadingPengajar={isLoadingPengajar}
              isSubmittingPengajar={isSubmittingPengajar}
              sbUrl={sbUrl}
              setSbUrl={setSbUrl}
              sbKey={sbKey}
              setSbKey={setSbKey}
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              onSyncSupabase={syncFromSupabase}
              onRefreshPengajar={fetchPengajarList}
              onAddSantri={handleAddSantri}
              onDeleteSantri={handleDeleteSantri}
              onAddPengajar={handleAddPengajar}
              onDeletePengajar={handleDeletePengajar}
              onSaveConfig={handleSaveSupabaseConfig}
              onLogoutGuru={handleGuruLogout}
              onBack={() => setCurrentView(user ? 'home' : 'auth')}
            />
          )}

        {currentView === 'about' && (
          <section className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#7C5D10] mb-1">
                Tentang Aplikasi
              </p>
              <h1 className="font-extrabold text-xl text-[#0A192F]">
                Markaz Al-Qur'an Abdurrahman bin 'Auf
              </h1>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aplikasi evaluasi hafalan Al-Qur'an (Sambung Ayat 30 Juz) dan
              Pengetahuan Agama Islam dengan pembagian tingkatan{' '}
              <strong className="text-[#0A192F]">Dasar</strong> (Juz 29–30),{' '}
              <strong className="text-[#0A192F]">Menengah</strong> (Juz 21–30),
              dan <strong className="text-[#0A192F]">Mahir</strong> (30 Juz
              lengkap).
            </p>

            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#7C5D10]">
                Fitur Unggulan
              </p>

              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0A192F] text-[#F4D06F] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-[#0A192F]">
                    Latihan Mandiri & Muraja'ah
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dilengkapi koreksi jawaban otomatis serta audio murottal
                    untuk memperlancar hafalan.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0A192F] text-[#F4D06F] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-[#0A192F]">
                    Ujian & Setoran Terpadu
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hasil evaluasi terhubung langsung ke Rapor dan Peringkat
                    Klasemen masing-masing santri secara real-time.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0A192F] text-[#F4D06F] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-[#0A192F]">
                    Panel Kendali Ustadz & Pengajar
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memudahkan pengelolaan data santri, bank soal evaluasi, dan
                    pemantauan perkembangan hafalan secara terpusat.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentView(user ? 'home' : 'auth')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#F4D06F] text-xs font-bold cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="no-print py-6 px-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="font-semibold text-[#0A192F]">
          Markaz Al-Qur'an Abdurrahman bin 'Auf · Belajar, Muraja'ah, Bertumbuh
        </p>
      </footer>
    </div>
  );
}
