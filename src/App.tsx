import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const DEFAULT_LOGO_BUCKETS = [
  'assets',
  'logo',
  'logos',
  'images',
  'public',
  'markaz'
];
const LOGO_IMAGE_FILE_REGEX = /\.(png|jpe?g|webp|svg|gif)$/i;

function normalizeSupabaseBaseUrl(sbUrl: string): string {
  return sbUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '');
}

function resolveSupabaseLogoUrl(
  sbUrl: string,
  sbKey: string,
  rawLogoInput: string
): string {
  const trimmed = rawLogoInput.trim();
  if (!trimmed) return '';

  if (/^data:image\//i.test(trimmed)) {
    return trimmed;
  }

  const cleanSbUrl = normalizeSupabaseBaseUrl(sbUrl);

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      parsed.pathname = parsed.pathname
        .replace(/\/rest\/v1\/storage\/v1\//i, '/storage/v1/')
        .replace(/\/{2,}/g, '/');
      return parsed.toString();
    } catch {
      return '';
    }
  }

  if (/^\/?storage\/v1\/object\//i.test(trimmed)) {
    if (!cleanSbUrl) return '';
    const cleanPath = trimmed.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
    return `${cleanSbUrl}/${cleanPath}`;
  }

  const cleanRelative = trimmed.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
  if (!cleanRelative || cleanRelative.includes(' ')) return '';

  const segments = cleanRelative.split('/').filter(Boolean);
  const bucket = segments.length > 1 ? segments[0] : DEFAULT_LOGO_BUCKETS[0];
  const objectPath =
    segments.length > 1 ? segments.slice(1).join('/') : segments[0];

  if (!bucket || !objectPath) return '';

  const client = getSupabaseClient(sbUrl, sbKey);
  if (client) {
    const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  }

  if (cleanSbUrl) {
    return `${cleanSbUrl}/storage/v1/object/public/${encodeURIComponent(
      bucket
    )}/${objectPath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/')}`;
  }

  return '';
}

async function discoverSupabaseStorageLogoUrl(
  sbUrl: string,
  sbKey: string
): Promise<string> {
  const client = getSupabaseClient(sbUrl, sbKey);
  if (!client) return '';

  const candidateBuckets = new Set<string>(DEFAULT_LOGO_BUCKETS);

  try {
    const { data: buckets } = await client.storage.listBuckets();
    if (Array.isArray(buckets)) {
      buckets.forEach((b) => {
        if (b?.name) candidateBuckets.add(b.name);
      });
    }
  } catch {
    // Anon key may not have listBuckets permission; probe default bucket names
  }

  for (const bucket of candidateBuckets) {
    try {
      const { data: files, error } = await client.storage
        .from(bucket)
        .list('', { limit: 50 });

      if (error || !Array.isArray(files) || files.length === 0) continue;

      const imageFiles = files.filter(
        (f) =>
          f && typeof f.name === 'string' && LOGO_IMAGE_FILE_REGEX.test(f.name)
      );
      if (imageFiles.length === 0) continue;

      const preferred =
        imageFiles.find((f) => /logo|markaz/i.test(f.name)) || imageFiles[0];

      const { data } = client.storage.from(bucket).getPublicUrl(preferred.name);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch {
      // Ignore inaccessible bucket and continue probing
    }
  }

  return '';
}

// ============================================================================
// Sambung Ayat & Pengetahuan Agama Quiz Engine (Inlined for Reliable Builds)
// ============================================================================

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

interface ValidAyahEntry {
  juzNumber: number;
  surahNumber: number;
  currentAyah: AlQuranAyah;
  nextAyah: AlQuranAyah;
  prevAyah?: AlQuranAyah;
  audioUrl: string;
}

interface CachedJuzData {
  juzNumber: number;
  entriesBySurah: Map<number, ValidAyahEntry[]>;
  allTexts: string[];
  allWordLists: string[][];
}

const SEEN_QUESTIONS_STORAGE_KEY = 'mq_quiz_seen_questions_v1';
const SEEN_JUZ_STORAGE_KEY = 'mq_quiz_seen_juz_v1';
const MAX_STORED_IDS_PER_BUCKET = 6500;

const juzCache = new Map<number, CachedJuzData>();

function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function readQuizStorageMap<T>(storageKey: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, T>;
    }
  } catch {
    // Ignore corrupted storage entries
  }
  return {};
}

function writeQuizStorageMap<T>(storageKey: string, map: Record<string, T>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

function buildQuizHistoryBucketKey(
  user: UserProfile,
  tingkatan: Tingkatan,
  quizType: QuizType
): string {
  const participant =
    user.mode === 'santri' && user.kode_santri
      ? `SANTRI:${user.kode_santri.trim().toUpperCase()}`
      : `GUEST:${user.nama.trim().toLowerCase() || 'anon'}`;
  return `${participant}::${tingkatan}::${quizType}`;
}

function loadSeenQuestionIds(bucketKey: string): string[] {
  const map = readQuizStorageMap<string[]>(SEEN_QUESTIONS_STORAGE_KEY);
  return Array.isArray(map[bucketKey]) ? map[bucketKey] : [];
}

function saveSeenQuestionIds(bucketKey: string, ids: string[]): void {
  const map = readQuizStorageMap<string[]>(SEEN_QUESTIONS_STORAGE_KEY);
  const deduped = Array.from(new Set(ids));
  map[bucketKey] =
    deduped.length > MAX_STORED_IDS_PER_BUCKET
      ? deduped.slice(-MAX_STORED_IDS_PER_BUCKET)
      : deduped;
  writeQuizStorageMap(SEEN_QUESTIONS_STORAGE_KEY, map);
}

function loadSeenJuzNumbers(bucketKey: string): number[] {
  const map = readQuizStorageMap<number[]>(SEEN_JUZ_STORAGE_KEY);
  return Array.isArray(map[bucketKey]) ? map[bucketKey] : [];
}

function saveSeenJuzNumbers(bucketKey: string, juzNumbers: number[]): void {
  const map = readQuizStorageMap<number[]>(SEEN_JUZ_STORAGE_KEY);
  map[bucketKey] = Array.from(new Set(juzNumbers));
  writeQuizStorageMap(SEEN_JUZ_STORAGE_KEY, map);
}

function planJuzQuotas(
  tingkatan: Tingkatan,
  totalCount: number,
  historyBucketKey: string
): { quotas: Map<number, number>; nextSeenJuz: number[] } {
  const quotas = new Map<number, number>();
  const allowedJuz = TINGKATAN_INFO[tingkatan].juzRange;

  if (tingkatan === 'Dasar' && allowedJuz.length === 2) {
    const [juzA, juzB] = allowedJuz;
    const base = Math.floor(totalCount / 2);
    const remainder = totalCount % 2;
    const extraToFirst = remainder === 1 && Math.random() < 0.5 ? 1 : 0;
    const extraToSecond = remainder - extraToFirst;

    if (base + extraToFirst > 0) quotas.set(juzA, base + extraToFirst);
    if (base + extraToSecond > 0) quotas.set(juzB, base + extraToSecond);
    return { quotas, nextSeenJuz: [juzA, juzB] };
  }

  const prevSeenJuz = loadSeenJuzNumbers(historyBucketKey).filter((j) =>
    allowedJuz.includes(j)
  );
  const seenSet = new Set<number>(prevSeenJuz);
  const unseenJuz = shuffleArray(allowedJuz.filter((j) => !seenSet.has(j)));
  const seenShuffled = shuffleArray(allowedJuz.filter((j) => seenSet.has(j)));

  if (totalCount <= allowedJuz.length) {
    let selectedJuz: number[];
    let nextSeenJuz: number[];

    if (unseenJuz.length >= totalCount) {
      selectedJuz = unseenJuz.slice(0, totalCount);
      const combined = [...prevSeenJuz, ...selectedJuz];
      nextSeenJuz = combined.length >= allowedJuz.length ? [] : combined;
    } else {
      const neededAfterReset = totalCount - unseenJuz.length;
      const fromReset = seenShuffled.slice(0, neededAfterReset);
      selectedJuz = [...unseenJuz, ...fromReset];
      nextSeenJuz = [...fromReset];
    }

    selectedJuz.forEach((juz) => quotas.set(juz, 1));
    return { quotas, nextSeenJuz };
  }

  const orderedJuz = [...unseenJuz, ...seenShuffled];
  const base = Math.floor(totalCount / orderedJuz.length);
  const remainder = totalCount % orderedJuz.length;

  orderedJuz.forEach((juz, idx) => {
    quotas.set(juz, base + (idx < remainder ? 1 : 0));
  });

  const extraRecipients = orderedJuz.slice(0, remainder);
  return { quotas, nextSeenJuz: extraRecipients };
}

async function fetchJuzOnce(juzNumber: number): Promise<CachedJuzData> {
  const [arabRes, audioRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`),
    fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/ar.alafasy`)
  ]);

  if (!arabRes.ok || !audioRes.ok) {
    throw new Error(`Gagal memuat Juz ${juzNumber} dari server Al-Qur’an.`);
  }

  const arabData = (await arabRes.json()) as {
    data?: { ayahs?: AlQuranAyah[] };
  };
  const audioData = (await audioRes.json()) as {
    data?: { ayahs?: AlQuranAyah[] };
  };

  const ayahsArab = arabData?.data?.ayahs || [];
  const ayahsAudio = audioData?.data?.ayahs || [];

  const audioByGlobalNumber = new Map<number, string>();
  ayahsAudio.forEach((item) => {
    if (item.audio) {
      audioByGlobalNumber.set(item.number, item.audio);
    }
  });

  const entriesBySurah = new Map<number, ValidAyahEntry[]>();
  const textSet = new Set<string>();
  const allWordLists: string[][] = [];

  for (let idx = 0; idx < ayahsArab.length; idx++) {
    const current = ayahsArab[idx];
    if (current.text) {
      textSet.add(current.text);
      const words = current.text.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 4) {
        allWordLists.push(words);
      }
    }

    if (idx < ayahsArab.length - 1) {
      const next = ayahsArab[idx + 1];
      if (current.surah.number === next.surah.number) {
        const prev =
          idx > 0 && ayahsArab[idx - 1].surah.number === current.surah.number
            ? ayahsArab[idx - 1]
            : undefined;

        const entry: ValidAyahEntry = {
          juzNumber,
          surahNumber: current.surah.number,
          currentAyah: current,
          nextAyah: next,
          prevAyah: prev,
          audioUrl:
            audioByGlobalNumber.get(current.number) ||
            ayahsAudio[idx]?.audio ||
            ''
        };

        const list = entriesBySurah.get(current.surah.number);
        if (list) {
          list.push(entry);
        } else {
          entriesBySurah.set(current.surah.number, [entry]);
        }
      }
    }
  }

  if (entriesBySurah.size === 0) {
    throw new Error(`Data ayat untuk Juz ${juzNumber} tidak mencukupi.`);
  }

  return {
    juzNumber,
    entriesBySurah,
    allTexts: Array.from(textSet),
    allWordLists
  };
}

async function fetchJuzWithRetry(
  juzNumber: number,
  retries = 1
): Promise<CachedJuzData> {
  const cached = juzCache.get(juzNumber);
  if (cached) return cached;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetchJuzOnce(juzNumber);
      juzCache.set(juzNumber, data);
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 250 * (attempt + 1))
        );
      }
    }
  }
  throw lastError;
}

async function loadJuzBatch(
  juzNumbers: number[],
  concurrency = 5,
  retries = 1
): Promise<Map<number, CachedJuzData>> {
  const loaded = new Map<number, CachedJuzData>();
  const toFetch: number[] = [];

  for (const juz of juzNumbers) {
    const cached = juzCache.get(juz);
    if (cached) {
      loaded.set(juz, cached);
    } else {
      toFetch.push(juz);
    }
  }

  for (let i = 0; i < toFetch.length; i += concurrency) {
    const batch = toFetch.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map((juz) => fetchJuzWithRetry(juz, retries))
    );
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        loaded.set(res.value.juzNumber, res.value);
      }
    });
  }

  return loaded;
}

function pickEntriesSurahFirst(
  juzData: CachedJuzData,
  quota: number,
  usedInSession: Set<number>,
  seenAyahIds: Set<string>
): { picked: ValidAyahEntry[]; juzWasReset: boolean } {
  if (quota <= 0) return { picked: [], juzWasReset: false };

  const drawFromFilter = (
    targetQuota: number,
    predicate: (entry: ValidAyahEntry) => boolean
  ): ValidAyahEntry[] => {
    const buckets = new Map<number, ValidAyahEntry[]>();
    juzData.entriesBySurah.forEach((entries, surahNum) => {
      const eligible = entries.filter(
        (e) => !usedInSession.has(e.currentAyah.number) && predicate(e)
      );
      if (eligible.length > 0) {
        buckets.set(surahNum, shuffleArray(eligible));
      }
    });

    const selected: ValidAyahEntry[] = [];
    let activeSurahs = shuffleArray(Array.from(buckets.keys()));

    while (selected.length < targetQuota && activeSurahs.length > 0) {
      const nextRoundSurahs: number[] = [];
      for (const surahNum of activeSurahs) {
        if (selected.length >= targetQuota) break;
        const list = buckets.get(surahNum);
        if (!list || list.length === 0) continue;

        const entry = list.pop();
        if (entry && !usedInSession.has(entry.currentAyah.number)) {
          usedInSession.add(entry.currentAyah.number);
          selected.push(entry);
        }
        if (list.length > 0) {
          nextRoundSurahs.push(surahNum);
        }
      }
      activeSurahs = shuffleArray(nextRoundSurahs);
    }

    return selected;
  };

  const unseenPicked = drawFromFilter(
    quota,
    (e) => !seenAyahIds.has(String(e.currentAyah.number))
  );

  if (unseenPicked.length >= quota) {
    return { picked: unseenPicked, juzWasReset: false };
  }

  const remainingNeeded = quota - unseenPicked.length;
  const resetPicked = drawFromFilter(remainingNeeded, () => true);

  return {
    picked: [...unseenPicked, ...resetPicked],
    juzWasReset: true
  };
}

function buildFullAyahDistractors(
  forbiddenTexts: string[],
  combinedPool: string[]
): string[] {
  const distractors: string[] = [];
  const forbidden = new Set<string>(forbiddenTexts);

  if (combinedPool.length <= 12) {
    for (const candidate of shuffleArray(combinedPool)) {
      if (distractors.length >= 3) break;
      if (!forbidden.has(candidate)) {
        forbidden.add(candidate);
        distractors.push(candidate);
      }
    }
    return distractors;
  }

  let attempts = 0;
  while (distractors.length < 3 && attempts < 140) {
    attempts++;
    const candidate =
      combinedPool[Math.floor(Math.random() * combinedPool.length)];
    if (!forbidden.has(candidate)) {
      forbidden.add(candidate);
      distractors.push(candidate);
    }
  }

  return distractors;
}

function buildSegmentDistractors(
  correctSegment: string,
  promptSegment: string,
  targetWordCount: number,
  combinedWordLists: string[][]
): string[] {
  const distractors: string[] = [];
  const forbidden = new Set<string>([correctSegment, promptSegment]);
  const minWords = Math.max(2, targetWordCount - 2);
  const maxWords = targetWordCount + 2;

  let attempts = 0;
  while (
    distractors.length < 3 &&
    attempts < 160 &&
    combinedWordLists.length > 0
  ) {
    attempts++;
    const words =
      combinedWordLists[Math.floor(Math.random() * combinedWordLists.length)];
    if (words.length < minWords + 1) continue;

    const sliceLen = Math.min(
      words.length - 1,
      Math.max(
        minWords,
        Math.min(maxWords, targetWordCount + Math.floor(Math.random() * 3) - 1)
      )
    );
    const segment = `... ${words.slice(words.length - sliceLen).join(' ')}`;
    if (!forbidden.has(segment)) {
      forbidden.add(segment);
      distractors.push(segment);
    }
  }

  return distractors;
}

type SambungPattern = 'next_ayah' | 'prev_ayah' | 'mid_split';

function pickQuestionPattern(entry: ValidAyahEntry): SambungPattern {
  const words = entry.currentAyah.text.trim().split(/\s+/).filter(Boolean);
  const canMidSplit = words.length >= 7;
  const canPrevAyah = Boolean(entry.prevAyah);

  const roll = Math.random();
  if (canMidSplit && roll < 0.22) {
    return 'mid_split';
  }
  if (canPrevAyah && roll < 0.45) {
    return 'prev_ayah';
  }
  return 'next_ayah';
}

const NEXT_AYAH_PROMPTS = [
  (surah: string, num: number) =>
    `Lanjutkan ayat berikutnya setelah QS. ${surah} ayat ${num} berikut ini:`,
  (surah: string, num: number) =>
    `Manakah lanjutan yang tepat untuk QS. ${surah} ayat ${num} berikut ini?`,
  (surah: string, num: number) =>
    `Sambunglah potongan QS. ${surah} ayat ${num} berikut ke ayat selanjutnya:`
];

const PREV_AYAH_PROMPTS = [
  (surah: string, num: number) =>
    `Ayat manakah yang terletak tepat SEBELUM QS. ${surah} ayat ${num} berikut ini?`,
  (surah: string, num: number) =>
    `Tentukan ayat yang mendahului QS. ${surah} ayat ${num} berikut ini:`
];

const MID_SPLIT_PROMPTS = [
  (surah: string, num: number) =>
    `Lengkapi lanjutan penggalan QS. ${surah} ayat ${num} berikut ini:`,
  (surah: string, num: number) =>
    `Sambunglah potongan pertengahan QS. ${surah} ayat ${num} berikut hingga selesai:`
];

function buildSambungQuestion(
  entry: ValidAyahEntry,
  index: number,
  combinedTextPool: string[],
  combinedWordLists: string[][]
): QuizQuestion {
  const pattern = pickQuestionPattern(entry);
  const surahEnglish = entry.currentAyah.surah.englishName;
  const surahArabic = entry.currentAyah.surah.name;
  const ayahNum = entry.currentAyah.numberInSurah;

  if (pattern === 'mid_split') {
    const words = entry.currentAyah.text.trim().split(/\s+/).filter(Boolean);
    const minCut = Math.max(3, Math.floor(words.length * 0.35));
    const maxCut = Math.min(words.length - 3, Math.ceil(words.length * 0.58));
    const cutPoint =
      maxCut > minCut
        ? minCut + Math.floor(Math.random() * (maxCut - minCut + 1))
        : Math.floor(words.length / 2);

    const firstHalf = `${words.slice(0, cutPoint).join(' ')} ...`;
    const secondHalfWords = words.slice(cutPoint);
    const secondHalf = `... ${secondHalfWords.join(' ')}`;

    const distractors = buildSegmentDistractors(
      secondHalf,
      firstHalf,
      secondHalfWords.length,
      combinedWordLists
    );

    if (distractors.length === 3) {
      const allOptions = shuffleArray([secondHalf, ...distractors]);
      const promptFn =
        MID_SPLIT_PROMPTS[Math.floor(Math.random() * MID_SPLIT_PROMPTS.length)];

      return {
        id: `q-mid-${index}-${entry.currentAyah.number}`,
        surahName: `${surahEnglish} (${surahArabic})`,
        ayahNumber: ayahNum,
        questionText: promptFn(surahEnglish, ayahNum),
        arabicPrompt: firstHalf,
        audioUrl: '',
        options: allOptions,
        correctIndex: allOptions.indexOf(secondHalf),
        explanation: `Lanjutan utuh QS. ${surahEnglish} ayat ${ayahNum}: ${entry.currentAyah.text}`
      };
    }
  }

  if (pattern === 'prev_ayah' && entry.prevAyah) {
    const distractors = buildFullAyahDistractors(
      [entry.currentAyah.text, entry.prevAyah.text, entry.nextAyah.text],
      combinedTextPool
    );
    const allOptions = shuffleArray([entry.prevAyah.text, ...distractors]);
    const promptFn =
      PREV_AYAH_PROMPTS[Math.floor(Math.random() * PREV_AYAH_PROMPTS.length)];

    return {
      id: `q-prev-${index}-${entry.currentAyah.number}`,
      surahName: `${surahEnglish} (${surahArabic})`,
      ayahNumber: ayahNum,
      questionText: promptFn(surahEnglish, ayahNum),
      arabicPrompt: entry.currentAyah.text,
      audioUrl: entry.audioUrl,
      options: allOptions,
      correctIndex: allOptions.indexOf(entry.prevAyah.text),
      explanation: `Ayat sebelum QS. ${surahEnglish} ayat ${ayahNum} adalah ayat ${entry.prevAyah.numberInSurah}.`
    };
  }

  const distractors = buildFullAyahDistractors(
    [entry.currentAyah.text, entry.nextAyah.text],
    combinedTextPool
  );
  const allOptions = shuffleArray([entry.nextAyah.text, ...distractors]);
  const promptFn =
    NEXT_AYAH_PROMPTS[Math.floor(Math.random() * NEXT_AYAH_PROMPTS.length)];

  return {
    id: `q-next-${index}-${entry.currentAyah.number}`,
    surahName: `${surahEnglish} (${surahArabic})`,
    ayahNumber: ayahNum,
    questionText: promptFn(surahEnglish, ayahNum),
    arabicPrompt: entry.currentAyah.text,
    audioUrl: entry.audioUrl,
    options: allOptions,
    correctIndex: allOptions.indexOf(entry.nextAyah.text),
    explanation: `Jawaban yang tepat adalah QS. ${entry.nextAyah.surah.englishName} ayat ${entry.nextAyah.numberInSurah}.`
  };
}

async function generateSambungAyatQuestions(
  user: UserProfile,
  tingkatan: Tingkatan,
  totalCount: number
): Promise<QuizQuestion[]> {
  const historyBucketKey = buildQuizHistoryBucketKey(
    user,
    tingkatan,
    'Sambung Ayat'
  );

  const { quotas: plannedQuotas, nextSeenJuz } = planJuzQuotas(
    tingkatan,
    totalCount,
    historyBucketKey
  );
  const requestedJuz = Array.from(plannedQuotas.keys());

  const loadedJuzMap = await loadJuzBatch(
    requestedJuz,
    5,
    tingkatan === 'Dasar' ? 2 : 1
  );

  if (tingkatan === 'Dasar') {
    const missingDasarJuz = requestedJuz.filter((j) => !loadedJuzMap.has(j));
    if (missingDasarJuz.length > 0) {
      throw new Error(
        `Gagal memuat seluruh cakupan Juz 29 dan Juz 30 (Juz ${missingDasarJuz.join(', ')} tidak merespons).`
      );
    }
  }

  if (loadedJuzMap.size === 0) {
    throw new Error('Server Al-Qur’an tidak merespons.');
  }

  const effectiveQuotas = new Map<number, number>();
  let missingQuota = 0;
  plannedQuotas.forEach((q, juz) => {
    if (loadedJuzMap.has(juz)) {
      effectiveQuotas.set(juz, q);
    } else {
      missingQuota += q;
    }
  });

  if (missingQuota > 0) {
    const availableJuz = shuffleArray(Array.from(effectiveQuotas.keys()));
    for (let i = 0; i < missingQuota; i++) {
      const targetJuz = availableJuz[i % availableJuz.length];
      effectiveQuotas.set(targetJuz, (effectiveQuotas.get(targetJuz) || 0) + 1);
    }
  }

  const prevSeenIds = loadSeenQuestionIds(historyBucketKey);
  const seenAyahIds = new Set<string>(prevSeenIds);
  const usedInSession = new Set<number>();
  const selectedEntries: ValidAyahEntry[] = [];
  const resetJuzNumbers = new Set<number>();

  for (const [juzNum, quota] of effectiveQuotas.entries()) {
    const juzData = loadedJuzMap.get(juzNum);
    if (!juzData) continue;
    const { picked, juzWasReset } = pickEntriesSurahFirst(
      juzData,
      quota,
      usedInSession,
      seenAyahIds
    );
    if (juzWasReset) resetJuzNumbers.add(juzNum);
    selectedEntries.push(...picked);
  }

  if (selectedEntries.length < totalCount) {
    const loadedList = shuffleArray(Array.from(loadedJuzMap.values()));
    for (const juzData of loadedList) {
      if (selectedEntries.length >= totalCount) break;
      const needed = totalCount - selectedEntries.length;
      const { picked, juzWasReset } = pickEntriesSurahFirst(
        juzData,
        needed,
        usedInSession,
        seenAyahIds
      );
      if (juzWasReset) resetJuzNumbers.add(juzData.juzNumber);
      selectedEntries.push(...picked);
    }
  }

  if (selectedEntries.length === 0) {
    throw new Error('Data ayat pada juz terpilih tidak mencukupi.');
  }

  const resetAyahIdSet = new Set<string>();
  resetJuzNumbers.forEach((juzNum) => {
    const juzData = loadedJuzMap.get(juzNum);
    juzData?.entriesBySurah.forEach((entries) => {
      entries.forEach((e) => resetAyahIdSet.add(String(e.currentAyah.number)));
    });
  });

  const finalEntries = shuffleArray(selectedEntries).slice(0, totalCount);
  const newlyShownIds = finalEntries.map((e) => String(e.currentAyah.number));
  const retainedPrevIds = prevSeenIds.filter((id) => !resetAyahIdSet.has(id));
  saveSeenQuestionIds(historyBucketKey, [...retainedPrevIds, ...newlyShownIds]);

  if (tingkatan !== 'Dasar') {
    saveSeenJuzNumbers(historyBucketKey, nextSeenJuz);
  }

  const textPoolSet = new Set<string>();
  const combinedWordLists: string[][] = [];
  loadedJuzMap.forEach((juzData) => {
    juzData.allTexts.forEach((t) => textPoolSet.add(t));
    combinedWordLists.push(...juzData.allWordLists);
  });
  const combinedTextPool = Array.from(textPoolSet);

  return finalEntries.map((entry, idx) =>
    buildSambungQuestion(entry, idx, combinedTextPool, combinedWordLists)
  );
}

function generateAgamaQuestions(
  user: UserProfile,
  tingkatan: Tingkatan,
  totalCount: number
): QuizQuestion[] {
  const bank = [
    ...(DEFAULT_AGAMA_QUESTIONS[tingkatan] || DEFAULT_AGAMA_QUESTIONS.Dasar)
  ];
  const historyBucketKey = buildQuizHistoryBucketKey(
    user,
    tingkatan,
    'Pengetahuan Agama'
  );
  const prevSeenIds = loadSeenQuestionIds(historyBucketKey);
  const seenSet = new Set<string>(prevSeenIds);

  const unseen = shuffleArray(bank.filter((q) => !seenSet.has(q.id)));
  const seen = shuffleArray(bank.filter((q) => seenSet.has(q.id)));

  const chosenBase: QuizQuestion[] = [];
  const usedInSessionIds = new Set<string>();
  let didResetCycle = false;

  for (const item of unseen) {
    if (chosenBase.length >= totalCount) break;
    chosenBase.push(item);
    usedInSessionIds.add(item.id);
  }

  if (chosenBase.length < totalCount) {
    didResetCycle = true;
    for (const item of seen) {
      if (chosenBase.length >= totalCount) break;
      if (!usedInSessionIds.has(item.id)) {
        chosenBase.push(item);
        usedInSessionIds.add(item.id);
      }
    }
  }

  while (chosenBase.length < totalCount && bank.length > 0) {
    didResetCycle = true;
    const cycle = shuffleArray(bank);
    for (const item of cycle) {
      if (chosenBase.length >= totalCount) break;
      chosenBase.push(item);
    }
  }

  const chosenIds = Array.from(new Set(chosenBase.map((q) => q.id)));
  if (didResetCycle) {
    const remainingCycleIds =
      chosenIds.length >= bank.length
        ? chosenIds.slice(-Math.min(5, chosenIds.length))
        : chosenIds;
    saveSeenQuestionIds(historyBucketKey, remainingCycleIds);
  } else {
    const updated = [...prevSeenIds, ...chosenIds];
    saveSeenQuestionIds(
      historyBucketKey,
      updated.length >= bank.length ? [] : updated
    );
  }

  return shuffleArray(chosenBase).map((item, idx) => {
    const indexedOptions = item.options.map((text, optIdx) => ({
      text,
      isCorrect: optIdx === item.correctIndex
    }));
    const shuffledOptions = shuffleArray(indexedOptions);
    const newCorrectIndex = shuffledOptions.findIndex((o) => o.isCorrect);

    return {
      ...item,
      id: `${item.id}-${idx}-${Date.now()}`,
      options: shuffledOptions.map((o) => o.text),
      correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
    };
  });
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
  const [discoveredLogoUrl, setDiscoveredLogoUrl] = useState('');
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
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

  // Resolve manual logo input (full URL or Supabase Storage bucket/path) or auto-discovered Supabase Storage public URL
  const resolvedLogoUrl = useMemo(() => {
    const manualResolved = resolveSupabaseLogoUrl(sbUrl, sbKey, logoUrl);
    return manualResolved || discoveredLogoUrl;
  }, [sbUrl, sbKey, logoUrl, discoveredLogoUrl]);

  const effectiveLogoUrl = logoLoadFailed ? '' : resolvedLogoUrl;

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [resolvedLogoUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured || logoUrl.trim()) {
      return;
    }

    discoverSupabaseStorageLogoUrl(sbUrl, sbKey).then((publicUrl) => {
      if (!cancelled && publicUrl) {
        setDiscoveredLogoUrl(publicUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isSupabaseConfigured, sbUrl, sbKey, logoUrl]);

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
        const generated = generateAgamaQuestions(
          user,
          user.tingkatan,
          activeCount
        );
        setQuestions(generated);
        setCurrentView('quiz_active');
        return;
      }

      const effectiveTingkatan: Tingkatan = isGuest ? 'Dasar' : user.tingkatan;
      const generatedQuestions = await generateSambungAyatQuestions(
        user,
        effectiveTingkatan,
        activeCount
      );

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
    const cleanSbUrl = sbUrl.trim();
    const cleanSbKey = sbKey.trim();
    const rawLogo = logoUrl.trim();
    const normalizedLogo = rawLogo
      ? resolveSupabaseLogoUrl(cleanSbUrl, cleanSbKey, rawLogo)
      : '';

    if (rawLogo && !normalizedLogo) {
      showNotice(
        'error',
        'Format URL atau path logo tidak valid. Gunakan URL publik lengkap atau path bucket Supabase Storage (misalnya assets/logo.png).'
      );
      return;
    }

    localStorage.setItem('mq_sb_url', cleanSbUrl);
    localStorage.setItem('mq_sb_key', cleanSbKey);
    localStorage.setItem('mq_logo_url', normalizedLogo);
    setLogoUrl(normalizedLogo);
    setLogoLoadFailed(false);
    if (!normalizedLogo) {
      setDiscoveredLogoUrl('');
    }
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
        logoUrl={effectiveLogoUrl}
        onLogoError={() => setLogoLoadFailed(true)}
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
              resolvedLogoUrl={effectiveLogoUrl}
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
