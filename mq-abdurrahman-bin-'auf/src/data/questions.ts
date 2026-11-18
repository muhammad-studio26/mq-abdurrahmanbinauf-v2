import type { QuizQuestion, SantriRecord, Tingkatan } from '../types';

export const TINGKATAN_INFO: Record<
  Tingkatan,
  { label: string; juzRange: number[]; desc: string; shortDesc: string }
> = {
  Dasar: {
    label: 'Dasar',
    juzRange: [29, 30],
    desc: 'Juz 29 & 30 (Juz Tabarak & ’Amma)',
    shortDesc: 'Juz 29–30'
  },
  Menengah: {
    label: 'Menengah',
    juzRange: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    desc: 'Juz 21 – 30 (10 Juz)',
    shortDesc: 'Juz 21–30'
  },
  Mahir: {
    label: 'Mahir',
    juzRange: Array.from({ length: 30 }, (_, i) => i + 1),
    desc: 'Juz 1 – 30 (Lengkap 30 Juz)',
    shortDesc: '30 Juz Lengkap'
  }
};

export const INITIAL_SANTRI_LIST: SantriRecord[] = [
  {
    kode_santri: 'MQ-001',
    pin_santri: '1234',
    nama_lengkap: 'Yasir Abdurrahman',
    tingkatan: 'Dasar'
  },
  {
    kode_santri: 'MQ-002',
    pin_santri: '1234',
    nama_lengkap: 'Ahmad Fauzan',
    tingkatan: 'Menengah'
  },
  {
    kode_santri: 'MQ-003',
    pin_santri: '1234',
    nama_lengkap: 'Zaid bin Tsabit',
    tingkatan: 'Mahir'
  }
];

export const DEFAULT_AGAMA_QUESTIONS: Record<Tingkatan, QuizQuestion[]> = {
  Dasar: [
    {
      id: 'ag-d1',
      questionText: 'Berapakah jumlah surah di dalam Al-Qur’an?',
      options: ['112 Surah', '114 Surah', '116 Surah', '30 Surah'],
      correctIndex: 1,
      explanation:
        'Al-Qur’an terdiri dari 30 Juz dan 114 Surah, dimulai dari Surah Al-Fatihah hingga An-Nas.'
    },
    {
      id: 'ag-d2',
      questionText:
        'Hukum bacaan apabila terdapat Nun Sukun (نْ) atau Tanwin bertemu huruf Ba (ب) disebut...',
      options: ['Idzhar Halqi', 'Idgham Bighunnah', 'Iqlab', 'Ikhfa Haqiqi'],
      correctIndex: 2,
      explanation:
        'Iqlab berarti membalik atau mengganti bunyi nun sukun/tanwin menjadi mim disertai dengung.'
    },
    {
      id: 'ag-d3',
      questionText:
        'Sahabat Nabi ﷺ yang termasuk dalam 10 orang yang dijamin masuk surga dan terkenal sangat dermawan adalah...',
      options: [
        'Abdurrahman bin ’Auf',
        'Abu Jahal',
        'Khalid bin Walid',
        'Bilal bin Rabah'
      ],
      correctIndex: 0,
      explanation:
        'Abdurrahman bin ’Auf radhiyallahu ’anhu termasuk As-Sabiqunal Awwalun dan Al-Asyarah Al-Mubasysyarun bil Jannah.'
    },
    {
      id: 'ag-d4',
      questionText: 'Surah apakah yang wajib dibaca pada setiap rakaat shalat?',
      options: ['Al-Ikhlas', 'Al-Baqarah', 'Al-Fatihah', 'An-Nas'],
      correctIndex: 2,
      explanation:
        'Membaca Surah Al-Fatihah merupakan salah satu rukun shalat di setiap rakaat.'
    },
    {
      id: 'ag-d5',
      questionText:
        'Tempat keluarnya huruf-huruf hijaiyah ketika dibaca disebut...',
      options: [
        'Sifatul Huruf',
        'Makharijul Huruf',
        'Ahkamul Huruf',
        'Mad Far’i'
      ],
      correctIndex: 1,
      explanation:
        'Makharijul Huruf adalah tempat-tempat keluarnya huruf hijaiyah.'
    },
    {
      id: 'ag-d6',
      questionText: 'Surah terpendek di dalam Al-Qur’an adalah...',
      options: ['Al-Ikhlas', 'Al-Kautsar', 'Al-’Ashr', 'An-Nashr'],
      correctIndex: 1,
      explanation:
        'Surah Al-Kautsar hanya terdiri atas 3 ayat dan menjadi surah terpendek dalam Al-Qur’an.'
    },
    {
      id: 'ag-d7',
      questionText:
        'Malaikat yang bertugas menyampaikan wahyu Al-Qur’an kepada Nabi Muhammad ﷺ adalah...',
      options: ['Malaikat Mikail', 'Malaikat Israfil', 'Malaikat Jibril', 'Malaikat Malik'],
      correctIndex: 2,
      explanation:
        'Malaikat Jibril ’alaihis salam (Ar-Ruh Al-Amin) bertugas menyampaikan wahyu kepada para nabi dan rasul.'
    },
    {
      id: 'ag-d8',
      questionText: 'Berapa harakat panjang bacaan Mad Thabi’i (Mad Asli)?',
      options: ['1 Harakat', '2 Harakat', '4 Harakat', '6 Harakat'],
      correctIndex: 1,
      explanation: 'Mad Thabi’i dibaca sepanjang 2 harakat (1 alif).'
    },
    {
      id: 'ag-d9',
      questionText: 'Wahyu pertama yang diturunkan kepada Nabi Muhammad ﷺ adalah...',
      options: [
        'Al-Fatihah ayat 1–7',
        'Al-’Alaq ayat 1–5',
        'Al-Muddatstsir ayat 1–5',
        'Al-Baqarah ayat 1–5'
      ],
      correctIndex: 1,
      explanation:
        'Lima ayat pertama Surah Al-’Alaq (Iqra’ bismi rabbikalladzi khalaq) turun di Gua Hira.'
    },
    {
      id: 'ag-d10',
      questionText:
        'Huruf Idzhar Halqi berjumlah enam yang keluar dari tenggorokan, manakah yang termasuk di dalamnya?',
      options: ['ق ط ب ج د', 'ء هـ ع ح غ خ', 'ي ن م و', 'ل ر'],
      correctIndex: 1,
      explanation:
        'Enam huruf Idzhar Halqi adalah Hamzah, Ha, ’Ain, Ha, Ghain, dan Kha (ء هـ ع ح غ خ).'
    }
  ],
  Menengah: [
    {
      id: 'ag-m1',
      questionText:
        'Berapa panjang harakat bacaan Mad Wajib Muttashil menurut riwayat Hafsh ’an ’Ashim?',
      options: ['2 Harakat', '4 atau 5 Harakat', '6 Harakat', '1 Harakat'],
      correctIndex: 1,
      explanation: 'Mad Wajib Muttashil dibaca 4 atau 5 harakat ketika washal.'
    },
    {
      id: 'ag-m2',
      questionText:
        'Siapakah ketua tim kodifikasi (pengumpulan) mushaf Al-Qur’an pada masa Khalifah Abu Bakar dan Utsman bin Affan?',
      options: [
        'Zaid bin Tsabit',
        'Abdullah bin Mas’ud',
        'Mu’adz bin Jabal',
        'Ubay bin Ka’ab'
      ],
      correctIndex: 0,
      explanation:
        'Zaid bin Tsabit radhiyallahu ’anhu adalah penulis wahyu utama yang memimpin pengumpulan mushaf.'
    },
    {
      id: 'ag-m3',
      questionText:
        'Huruf Qalqalah berjumlah lima, yang dikumpulkan dalam kalimat...',
      options: [
        'Yanmu (ينمو)',
        'Quthbu Jadin (قطب جد)',
        'Khashsha Dhaqthin Qizh (خص ضغط قظ)',
        'Lin ’Umar (لن عمر)'
      ],
      correctIndex: 1,
      explanation:
        'Lima huruf Qalqalah adalah Qaf, Tha, Ba, Jim, dan Dal (قطب جد).'
    },
    {
      id: 'ag-m4',
      questionText:
        'Surah di dalam Al-Qur’an yang tidak diawali dengan lafaz Basmalah adalah...',
      options: [
        'Surah Al-Anfal',
        'Surah At-Taubah',
        'Surah An-Naml',
        'Surah Yasin'
      ],
      correctIndex: 1,
      explanation:
        'Surah At-Taubah (Bara’ah) adalah satu-satunya surah yang tidak diawali dengan Basmalah.'
    },
    {
      id: 'ag-m5',
      questionText:
        'Berhenti sejenak tanpa mengambil napas saat membaca ayat tertentu dalam Al-Qur’an disebut...',
      options: ['Waqaf Tam', 'Saktah', 'Imalah', 'Isymam'],
      correctIndex: 1,
      explanation:
        'Saktah adalah berhenti sejenak sekitar 2 harakat tanpa bernapas.'
    },
    {
      id: 'ag-m6',
      questionText:
        'Surah apakah yang memiliki dua bacaan Basmalah (di awal surah dan di pertengahan ayat)?',
      options: ['Surah An-Naml', 'Surah Al-Kahfi', 'Surah Yusuf', 'Surah Maryam'],
      correctIndex: 0,
      explanation:
        'Surah An-Naml diawali Basmalah dan memiliki Basmalah lagi di ayat ke-30 dalam surat Nabi Sulaiman.'
    },
    {
      id: 'ag-m7',
      questionText:
        'Hukum bacaan apabila Mim Sukun (مْ) bertemu dengan huruf Ba (ب) disertai dengung disebut...',
      options: ['Idzhar Syafawi', 'Ikhfa Syafawi', 'Idgham Mimi', 'Iqlab'],
      correctIndex: 1,
      explanation:
        'Mim Sukun bertemu huruf Ba dibaca Ikhfa Syafawi dengan dengung 2 harakat.'
    },
    {
      id: 'ag-m8',
      questionText:
        'Ayat yang paling agung di dalam Al-Qur’an menurut sabda Rasulullah ﷺ adalah...',
      options: [
        'Ayat Kursi (Al-Baqarah: 255)',
        'Akhir Surah Al-Baqarah',
        'Surah Al-Ikhlas',
        'Surah Al-Fatihah'
      ],
      correctIndex: 0,
      explanation:
        'Dalam hadits shahih riwayat Muslim, Nabi ﷺ menegaskan Ayat Kursi sebagai ayat paling agung dalam Kitabullah.'
    },
    {
      id: 'ag-m9',
      questionText:
        'Tujuh huruf isti’la yang selalu dibaca tebal (tafkhim) terkumpul dalam ungkapan...',
      options: [
        'خص ضغط قظ',
        'فحثه شخص سكت',
        'أجد قط بكت',
        'يرملون'
      ],
      correctIndex: 0,
      explanation:
        'Huruf isti’la berjumlah tujuh: خ، ص، ض، غ، ط، ق، ظ.'
    },
    {
      id: 'ag-m10',
      questionText:
        'Ilmu yang membahas tentang sebab-sebab turunnya suatu ayat atau surah Al-Qur’an disebut...',
      options: ['Nasikh Mansukh', 'Asbabun Nuzul', 'Muhkam Mutasyabih', 'Qira’at'],
      correctIndex: 1,
      explanation:
        'Asbabun Nuzul membantu mufasir memahami konteks sejarah dan hikmah turunnya ayat Al-Qur’an.'
    }
  ],
  Mahir: [
    {
      id: 'ag-h1',
      questionText:
        'Pada Surah Hud ayat 41, kata "مَجْر۪ىهَا" dibaca dengan memiringkan fathah ke arah kasrah yang disebut...',
      options: ['Tashil', 'Imalah', 'Isymam', 'Naql'],
      correctIndex: 1,
      explanation:
        'Imalah Kubra pada lafaz Majreha adalah satu-satunya bacaan Imalah dalam riwayat Hafsh.'
    },
    {
      id: 'ag-h2',
      questionText:
        'Pada Surah Yusuf ayat 11, kata "لَا تَأْمَنَّا" memiliki hukum bacaan gharib yaitu...',
      options: ['Isymam / Raum', 'Saktah', 'Naql', 'Badal'],
      correctIndex: 0,
      explanation:
        'Pada lafaz Laa Ta’mannaa terdapat bacaan Isymam (memoncongkan bibir tanpa suara) atau Raum.'
    },
    {
      id: 'ag-h3',
      questionText:
        'Pada Surah Al-Hujurat ayat 11, kata "بِئْسَ الِاسْمُ" dibaca "Bi’sal-ismu" karena terjadi proses...',
      options: ['Naql', 'Tashil', 'Ibdal', 'Saktah'],
      correctIndex: 0,
      explanation:
        'Naql adalah memindahkan harakat hamzah ke huruf sukun sebelumnya.'
    },
    {
      id: 'ag-h4',
      questionText:
        'Berapakah jumlah tempat السَّكْتَة (Saktah) yang disepakati pada riwayat Hafsh ’an ’Ashim jalur Syathibiyyah?',
      options: ['2 Tempat', '4 Tempat', '6 Tempat', '7 Tempat'],
      correctIndex: 1,
      explanation:
        'Terdapat 4 tempat saktah wajib/masyhur: Al-Kahfi: 1-2, Yasin: 52, Al-Qiyamah: 27, dan Al-Muthaffifin: 14.'
    },
    {
      id: 'ag-h5',
      questionText:
        'Bacaan Tashil dalam riwayat Hafsh ’an ’Ashim hanya terdapat pada satu tempat, yaitu...',
      options: [
        'QS. Fushshilat Ayat 44 (ءَأَعْجَمِيٌّ)',
        'QS. Al-Ahqaf Ayat 4',
        'QS. Al-Baqarah Ayat 245',
        'QS. Maryam Ayat 1'
      ],
      correctIndex: 0,
      explanation:
        'Tashil (meringankan hamzah kedua) terdapat pada lafaz A’a’jamiyyun di QS. Fushshilat ayat 44.'
    },
    {
      id: 'ag-h6',
      questionText:
        'Berapakah panjang bacaan Mad Lazim Mutsaqqal Kalimi seperti pada kata وَلَا الضَّالِّينَ?',
      options: ['2 Harakat', '4 Harakat', '5 Harakat', '6 Harakat'],
      correctIndex: 3,
      explanation:
        'Mad Lazim Mutsaqqal Kalimi wajib dibaca panjang 6 harakat secara mutlak sebelum huruf bertasydid.'
    },
    {
      id: 'ag-h7',
      questionText:
        'Pada kata يَبْصُطُ (QS. Al-Baqarah: 245) dan بَصْطَةً (QS. Al-A’raf: 69), huruf Shad yang bertanda Sin kecil dibaca sebagai...',
      options: ['Sin murni (يَبْسُطُ)', 'Shad murni', 'Tawassuth antara Sin dan Zay', 'Imalah'],
      correctIndex: 0,
      explanation:
        'Pada dua tempat tersebut dalam riwayat Hafsh jalur Syathibiyyah dibaca dengan huruf Sin murni.'
    },
    {
      id: 'ag-h8',
      questionText:
        'Apakah istilah untuk huruf-huruf pembuka surah seperti الم، حم، كهيعص dalam ilmu Al-Qur’an?',
      options: ['Fawatihus Suwar / Huruf Muqaththa’ah', 'Asbabun Nuzul', 'Gharibul Qur’an', 'Qira’at Sab’ah'],
      correctIndex: 0,
      explanation:
        'Huruf Muqaththa’ah (Fawatihus Suwar) membuka 29 surah dalam Al-Qur’an.'
    },
    {
      id: 'ag-h9',
      questionText:
        'Dalam riwayat Hafsh jalur Syathibiyyah, lafaz سَلَاسِلَاْ (QS. Al-Insan: 4) ketika waqaf boleh dibaca dengan dua wajah, yaitu...',
      options: [
        'Lam sukun atau Lam berharakat fathah panjang 2 harakat',
        'Imalah atau Isymam',
        'Saktah atau Naql',
        'Tashil atau Ibdal'
      ],
      correctIndex: 0,
      explanation:
        'Ketika waqaf pada سَلَاسِلَاْ terdapat dua wajah: itsbat alif (dibaca Salaasilaa) atau hadzf alif (dibaca Salaasil).'
    },
    {
      id: 'ag-h10',
      questionText:
        'Siapakah dua perawi terkenal dari Imam ’Ashim bin Abi An-Najud Al-Kufi?',
      options: [
        'Syu’bah dan Hafsh',
        'Qalun dan Warsy',
        'Al-Bazzi dan Qunbul',
        'Ad-Duri dan As-Susi'
      ],
      correctIndex: 0,
      explanation:
        'Dua perawi Imam ’Ashim adalah Abu Bakr Syu’bah bin ’Ayyasy dan Abu ’Umar Hafsh bin Sulaiman.'
    }
  ]
};
