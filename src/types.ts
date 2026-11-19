export type Tingkatan = 'Dasar' | 'Menengah' | 'Mahir';

export type ViewName =
  | 'auth'
  | 'home'
  | 'study_setup'
  | 'quiz_active'
  | 'quiz_result'
  | 'rapor'
  | 'guru_login'
  | 'guru_dashboard'
  | 'about';

export type StudyMode = 'Latihan Bebas' | 'Ujian / Setoran';
export type QuizType = 'Sambung Ayat' | 'Pengetahuan Agama';

export interface UserProfile {
  mode: 'guest' | 'santri';
  kode_santri?: string;
  nama: string;
  tingkatan: Tingkatan;
}

export interface PengajarRecord {
  id: string | number;
  nama: string;
  email: string;
  peran: string;
}

export interface QuizQuestion {
  id: string;
  surahName?: string;
  ayahNumber?: number;
  questionText: string;
  arabicPrompt?: string;
  audioUrl?: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface ScoreRecord {
  id?: string | number;
  kode_santri: string;
  nama_santri: string;
  tingkatan: Tingkatan;
  mode_belajar: StudyMode;
  jenis_kuis: QuizType;
  jumlah_soal: number;
  benar: number;
  skor: number;
  created_at: string;
}

export interface SantriRecord {
  kode_santri: string;
  pin_santri: string;
  nama_lengkap: string;
  tingkatan: Tingkatan;
  created_at?: string;
}

export interface NoticeBanner {
  type: 'success' | 'error' | 'info';
  message: string;
}
