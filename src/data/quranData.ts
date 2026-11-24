import type { MediaItem, Reciter, SurahInfo } from '../types/media.ts';

// Verified HTTP 200 direct CDN endpoints for all 6 reciters (zero redirect hops)
export const RECITERS: Reciter[] = [
  {
    id: 'abdurrahman-el-ussi',
    nameTr: 'Abdurrahman el-Ussi',
    nameAr: 'عبد الرحمن العوسي',
    style: 'Murattel Tilavet',
    country: 'Suudi Arabistan',
    bitrateKbps: 128,
    surahBaseUrl: 'https://cdn.mp3quran.net/audio/abdulrahman-oosi/r1',
    fallbackBaseUrl: 'https://server6.mp3quran.net/aloosi',
    licenseName: 'MP3Quran Açık Dinleme ve İndirme',
  },
  {
    id: 'misari-rasid-el-afasi',
    nameTr: 'Mişari Raşid el-Afasi',
    nameAr: 'مشاري راشد العفاسي',
    style: 'Murattel Tilavet',
    country: 'Kuveyt',
    bitrateKbps: 128,
    surahBaseUrl: 'https://cdn.mp3quran.net/audio/mishary-alafasy/r1',
    fallbackBaseUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee',
    everyAyahFolder: 'Alafasy_128kbps',
    licenseName: 'MP3Quran & EveryAyah Açık Dağıtım',
  },
  {
    id: 'abdurrahman-es-sudeys',
    nameTr: 'Abdurrahman es-Sudeys',
    nameAr: 'عبد الرحمن السديس',
    style: 'Mescid-i Haram Murattel',
    country: 'Suudi Arabistan',
    bitrateKbps: 192,
    surahBaseUrl: 'https://cdn.mp3quran.net/audio/abdulrahman-sudais/r1',
    fallbackBaseUrl: 'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays',
    everyAyahFolder: 'Abdurrahmaan_As-Sudais_192kbps',
    licenseName: 'MP3Quran & EveryAyah Açık Dağıtım',
  },
  {
    id: 'maher-el-muaykili',
    nameTr: 'Maher el-Muaykıli',
    nameAr: 'ماهر المعيقلي',
    style: 'Murattel Tilavet',
    country: 'Suudi Arabistan',
    bitrateKbps: 128,
    surahBaseUrl: 'https://cdn.mp3quran.net/audio/maher-muaiqly/r1',
    fallbackBaseUrl: 'https://download.quranicaudio.com/quran/maher_256',
    everyAyahFolder: 'MaherAlMuaiqly128kbps',
    licenseName: 'MP3Quran & EveryAyah Açık Dağıtım',
  },
  {
    id: 'abdulbasit-abdussamed',
    nameTr: 'Abdülbasit Abdüssamed',
    nameAr: 'عبد الباسط عبد الصمد',
    style: 'Klasik Mısır Murattel',
    country: 'Mısır',
    bitrateKbps: 192,
    surahBaseUrl: 'https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3',
    fallbackBaseUrl: 'https://download.quranicaudio.com/quran/abdul_basit_murattal',
    everyAyahFolder: 'Abdul_Basit_Murattal_192kbps',
    licenseName: 'MP3Quran & EveryAyah Açık Dağıtım',
  },
  {
    id: 'mahmud-halil-el-husari',
    nameTr: 'Mahmud Halil el-Husari',
    nameAr: 'محمود خليل الحصري',
    style: 'Talim ve Tecvid Odaklı',
    country: 'Mısır',
    bitrateKbps: 128,
    surahBaseUrl: 'https://cdn.mp3quran.net/audio/mahmoud-husary/r1',
    fallbackBaseUrl: 'https://download.quranicaudio.com/quran/mahmood_khaleel_al-husaree',
    everyAyahFolder: 'Husary_128kbps',
    licenseName: 'MP3Quran & EveryAyah Açık Dağıtım',
  },
];

export const SURAHS: SurahInfo[] = [
  { number: 1, nameTr: 'Fâtiha', nameAr: 'الفاتحة', meaningTr: 'Açılış', ayahCount: 7, revelation: 'Mekke' },
  { number: 2, nameTr: 'Bakara', nameAr: 'البقرة', meaningTr: 'İnek', ayahCount: 286, revelation: 'Medine' },
  { number: 3, nameTr: 'Âl-i İmrân', nameAr: 'آل عمران', meaningTr: 'İmrân Ailesi', ayahCount: 200, revelation: 'Medine' },
  { number: 4, nameTr: 'Nisâ', nameAr: 'النساء', meaningTr: 'Kadınlar', ayahCount: 176, revelation: 'Medine' },
  { number: 5, nameTr: 'Mâide', nameAr: 'المائدة', meaningTr: 'Sofra', ayahCount: 120, revelation: 'Medine' },
  { number: 6, nameTr: 'En‘âm', nameAr: 'الأنعام', meaningTr: 'Hayvanlar', ayahCount: 165, revelation: 'Mekke' },
  { number: 7, nameTr: 'A‘râf', nameAr: 'الأعراف', meaningTr: 'Yüksek Yerler', ayahCount: 206, revelation: 'Mekke' },
  { number: 8, nameTr: 'Enfâl', nameAr: 'الأنفال', meaningTr: 'Ganimetler', ayahCount: 75, revelation: 'Medine' },
  { number: 9, nameTr: 'Tevbe', nameAr: 'التوبة', meaningTr: 'Tövbe', ayahCount: 129, revelation: 'Medine' },
  { number: 10, nameTr: 'Yûnus', nameAr: 'يونس', meaningTr: 'Hz. Yûnus', ayahCount: 109, revelation: 'Mekke' },
  { number: 11, nameTr: 'Hûd', nameAr: 'هود', meaningTr: 'Hz. Hûd', ayahCount: 123, revelation: 'Mekke' },
  { number: 12, nameTr: 'Yûsuf', nameAr: 'يوسف', meaningTr: 'Hz. Yûsuf', ayahCount: 111, revelation: 'Mekke' },
  { number: 13, nameTr: 'Ra‘d', nameAr: 'الرعد', meaningTr: 'Gök Gürültüsü', ayahCount: 43, revelation: 'Medine' },
  { number: 14, nameTr: 'İbrâhîm', nameAr: 'ابراهيم', meaningTr: 'Hz. İbrâhîm', ayahCount: 52, revelation: 'Mekke' },
  { number: 15, nameTr: 'Hicr', nameAr: 'الحجر', meaningTr: 'Hicr Vadisi', ayahCount: 99, revelation: 'Mekke' },
  { number: 16, nameTr: 'Nahl', nameAr: 'النحل', meaningTr: 'Bal Arısı', ayahCount: 128, revelation: 'Mekke' },
  { number: 17, nameTr: 'İsrâ', nameAr: 'الإسراء', meaningTr: 'Gece Yürüyüşü', ayahCount: 111, revelation: 'Mekke' },
  { number: 18, nameTr: 'Kehf', nameAr: 'الكهف', meaningTr: 'Mağara', ayahCount: 110, revelation: 'Mekke' },
  { number: 19, nameTr: 'Meryem', nameAr: 'مريم', meaningTr: 'Hz. Meryem', ayahCount: 98, revelation: 'Mekke' },
  { number: 20, nameTr: 'Tâhâ', nameAr: 'طه', meaningTr: 'Tâ-Hâ', ayahCount: 135, revelation: 'Mekke' },
  { number: 21, nameTr: 'Enbiyâ', nameAr: 'الأنبياء', meaningTr: 'Peygamberler', ayahCount: 112, revelation: 'Mekke' },
  { number: 22, nameTr: 'Hac', nameAr: 'الحج', meaningTr: 'Hac', ayahCount: 78, revelation: 'Medine' },
  { number: 23, nameTr: 'Mü’minûn', nameAr: 'المؤمنون', meaningTr: 'Müminler', ayahCount: 118, revelation: 'Mekke' },
  { number: 24, nameTr: 'Nûr', nameAr: 'النور', meaningTr: 'Nur', ayahCount: 64, revelation: 'Medine' },
  { number: 25, nameTr: 'Furkân', nameAr: 'الفرقان', meaningTr: 'Hak ile Batılı Ayıran', ayahCount: 77, revelation: 'Mekke' },
  { number: 26, nameTr: 'Şuarâ', nameAr: 'الشعراء', meaningTr: 'Şairler', ayahCount: 227, revelation: 'Mekke' },
  { number: 27, nameTr: 'Neml', nameAr: 'النمل', meaningTr: 'Karınca', ayahCount: 93, revelation: 'Mekke' },
  { number: 28, nameTr: 'Kasas', nameAr: 'القصص', meaningTr: 'Kıssalar', ayahCount: 88, revelation: 'Mekke' },
  { number: 29, nameTr: 'Ankebût', nameAr: 'العنكبوت', meaningTr: 'Örümcek', ayahCount: 69, revelation: 'Mekke' },
  { number: 30, nameTr: 'Rûm', nameAr: 'الروم', meaningTr: 'Romalılar', ayahCount: 60, revelation: 'Mekke' },
  { number: 31, nameTr: 'Lokmân', nameAr: 'لقمان', meaningTr: 'Hz. Lokmân', ayahCount: 34, revelation: 'Mekke' },
  { number: 32, nameTr: 'Secde', nameAr: 'السجدة', meaningTr: 'Secde', ayahCount: 30, revelation: 'Mekke' },
  { number: 33, nameTr: 'Ahzâb', nameAr: 'الأحزاب', meaningTr: 'Gruplar', ayahCount: 73, revelation: 'Medine' },
  { number: 34, nameTr: 'Sebe’', nameAr: 'سبإ', meaningTr: 'Sebe Halkı', ayahCount: 54, revelation: 'Mekke' },
  { number: 35, nameTr: 'Fâtır', nameAr: 'فاطر', meaningTr: 'Yaratan', ayahCount: 45, revelation: 'Mekke' },
  { number: 36, nameTr: 'Yâsîn', nameAr: 'يس', meaningTr: 'Yâ-Sîn', ayahCount: 83, revelation: 'Mekke' },
  { number: 37, nameTr: 'Sâffât', nameAr: 'الصافات', meaningTr: 'Sıra Sıra Dizilenler', ayahCount: 182, revelation: 'Mekke' },
  { number: 38, nameTr: 'Sâd', nameAr: 'ص', meaningTr: 'Sâd', ayahCount: 88, revelation: 'Mekke' },
  { number: 39, nameTr: 'Zümer', nameAr: 'الزمر', meaningTr: 'Zümreler', ayahCount: 75, revelation: 'Mekke' },
  { number: 40, nameTr: 'Mü’min', nameAr: 'غافر', meaningTr: 'Bağışlayan', ayahCount: 85, revelation: 'Mekke' },
  { number: 41, nameTr: 'Fussilet', nameAr: 'فصلت', meaningTr: 'Genişçe Açıklanan', ayahCount: 54, revelation: 'Mekke' },
  { number: 42, nameTr: 'Şûrâ', nameAr: 'الشورى', meaningTr: 'Danışma', ayahCount: 53, revelation: 'Mekke' },
  { number: 43, nameTr: 'Zuhruf', nameAr: 'الزخرف', meaningTr: 'Mücevher', ayahCount: 89, revelation: 'Mekke' },
  { number: 44, nameTr: 'Duhân', nameAr: 'الدخان', meaningTr: 'Duman', ayahCount: 59, revelation: 'Mekke' },
  { number: 45, nameTr: 'Câsiye', nameAr: 'الجاثية', meaningTr: 'Diz Çökenler', ayahCount: 37, revelation: 'Mekke' },
  { number: 46, nameTr: 'Ahkâf', nameAr: 'الأحقاف', meaningTr: 'Kum Tepeleri', ayahCount: 35, revelation: 'Mekke' },
  { number: 47, nameTr: 'Muhammed', nameAr: 'محمد', meaningTr: 'Hz. Muhammed', ayahCount: 38, revelation: 'Medine' },
  { number: 48, nameTr: 'Fetih', nameAr: 'الفتح', meaningTr: 'Fetih', ayahCount: 29, revelation: 'Medine' },
  { number: 49, nameTr: 'Hucurât', nameAr: 'الحجرات', meaningTr: 'Odalar', ayahCount: 18, revelation: 'Medine' },
  { number: 50, nameTr: 'Kâf', nameAr: 'ق', meaningTr: 'Kâf', ayahCount: 45, revelation: 'Mekke' },
  { number: 51, nameTr: 'Zâriyât', nameAr: 'الذاريات', meaningTr: 'Savuran Rüzgarlar', ayahCount: 60, revelation: 'Mekke' },
  { number: 52, nameTr: 'Tûr', nameAr: 'الطور', meaningTr: 'Tûr Dağı', ayahCount: 49, revelation: 'Mekke' },
  { number: 53, nameTr: 'Necm', nameAr: 'النجم', meaningTr: 'Yıldız', ayahCount: 62, revelation: 'Mekke' },
  { number: 54, nameTr: 'Kamer', nameAr: 'القمر', meaningTr: 'Ay', ayahCount: 55, revelation: 'Mekke' },
  { number: 55, nameTr: 'Rahmân', nameAr: 'الرحمن', meaningTr: 'Rahmân', ayahCount: 78, revelation: 'Medine' },
  { number: 56, nameTr: 'Vâkıa', nameAr: 'الواقعة', meaningTr: 'Kıyamet Olayı', ayahCount: 96, revelation: 'Mekke' },
  { number: 57, nameTr: 'Hadîd', nameAr: 'الحديد', meaningTr: 'Demir', ayahCount: 29, revelation: 'Medine' },
  { number: 58, nameTr: 'Mücâdele', nameAr: 'المجادلة', meaningTr: 'Tartışma', ayahCount: 22, revelation: 'Medine' },
  { number: 59, nameTr: 'Haşr', nameAr: 'الحشر', meaningTr: 'Toplanma', ayahCount: 24, revelation: 'Medine' },
  { number: 60, nameTr: 'Mümtehine', nameAr: 'الممتحنة', meaningTr: 'İmtihan Edilen', ayahCount: 13, revelation: 'Medine' },
  { number: 61, nameTr: 'Saf', nameAr: 'الصف', meaningTr: 'Saf Tutmak', ayahCount: 14, revelation: 'Medine' },
  { number: 62, nameTr: 'Cuma', nameAr: 'الجمعة', meaningTr: 'Cuma Günü', ayahCount: 11, revelation: 'Medine' },
  { number: 63, nameTr: 'Münâfikûn', nameAr: 'المنافقون', meaningTr: 'Münafıklar', ayahCount: 11, revelation: 'Medine' },
  { number: 64, nameTr: 'Teğâbün', nameAr: 'التغابن', meaningTr: 'Aldanma', ayahCount: 18, revelation: 'Medine' },
  { number: 65, nameTr: 'Talâk', nameAr: 'الطلاق', meaningTr: 'Boşanma', ayahCount: 12, revelation: 'Medine' },
  { number: 66, nameTr: 'Tahrîm', nameAr: 'التحريم', meaningTr: 'Haram Kılma', ayahCount: 12, revelation: 'Medine' },
  { number: 67, nameTr: 'Mülk', nameAr: 'الملك', meaningTr: 'Hükümranlık', ayahCount: 30, revelation: 'Mekke' },
  { number: 68, nameTr: 'Kalem', nameAr: 'القلم', meaningTr: 'Kalem', ayahCount: 52, revelation: 'Mekke' },
  { number: 69, nameTr: 'Hâkka', nameAr: 'الحاقة', meaningTr: 'Gerçekleşecek Olan', ayahCount: 52, revelation: 'Mekke' },
  { number: 70, nameTr: 'Meâric', nameAr: 'المعارج', meaningTr: 'Yükselme Yolları', ayahCount: 44, revelation: 'Mekke' },
  { number: 71, nameTr: 'Nûh', nameAr: 'نوح', meaningTr: 'Hz. Nûh', ayahCount: 28, revelation: 'Mekke' },
  { number: 72, nameTr: 'Cin', nameAr: 'الجن', meaningTr: 'Cinler', ayahCount: 28, revelation: 'Mekke' },
  { number: 73, nameTr: 'Müzzemmil', nameAr: 'المزمل', meaningTr: 'Örtüsüne Bürünen', ayahCount: 20, revelation: 'Mekke' },
  { number: 74, nameTr: 'Müddessir', nameAr: 'المدثر', meaningTr: 'Bürünen', ayahCount: 56, revelation: 'Mekke' },
  { number: 75, nameTr: 'Kıyâmet', nameAr: 'القيامة', meaningTr: 'Kıyamet', ayahCount: 40, revelation: 'Mekke' },
  { number: 76, nameTr: 'İnsân', nameAr: 'الانسان', meaningTr: 'İnsan', ayahCount: 31, revelation: 'Medine' },
  { number: 77, nameTr: 'Mürselât', nameAr: 'المرسلات', meaningTr: 'Gönderilenler', ayahCount: 50, revelation: 'Mekke' },
  { number: 78, nameTr: 'Nebe’', nameAr: 'النبإ', meaningTr: 'Büyük Haber', ayahCount: 40, revelation: 'Mekke' },
  { number: 79, nameTr: 'Nâziât', nameAr: 'النازعات', meaningTr: 'Söküp Çıkaranlar', ayahCount: 46, revelation: 'Mekke' },
  { number: 80, nameTr: 'Abese', nameAr: 'عبس', meaningTr: 'Yüzünü Ekşitti', ayahCount: 42, revelation: 'Mekke' },
  { number: 81, nameTr: 'Tekvîr', nameAr: 'التكوير', meaningTr: 'Dürülüp Bükülme', ayahCount: 29, revelation: 'Mekke' },
  { number: 82, nameTr: 'İnfitâr', nameAr: 'الإنفطار', meaningTr: 'Yarılma', ayahCount: 19, revelation: 'Mekke' },
  { number: 83, nameTr: 'Mutaffifîn', nameAr: 'المطففين', meaningTr: 'Ölçüde Hile Yapanlar', ayahCount: 36, revelation: 'Mekke' },
  { number: 84, nameTr: 'İnşikâk', nameAr: 'الإنشقاق', meaningTr: 'Yarılıp Açılma', ayahCount: 25, revelation: 'Mekke' },
  { number: 85, nameTr: 'Burûc', nameAr: 'البروج', meaningTr: 'Burçlar', ayahCount: 22, revelation: 'Mekke' },
  { number: 86, nameTr: 'Târık', nameAr: 'الطارق', meaningTr: 'Gece Gelen Yıldız', ayahCount: 17, revelation: 'Mekke' },
  { number: 87, nameTr: 'A‘lâ', nameAr: 'الأعلى', meaningTr: 'En Yüce', ayahCount: 19, revelation: 'Mekke' },
  { number: 88, nameTr: 'Gâşiye', nameAr: 'الغاشية', meaningTr: 'Bürüyen', ayahCount: 26, revelation: 'Mekke' },
  { number: 89, nameTr: 'Fecr', nameAr: 'الفجر', meaningTr: 'Şafak Vakti', ayahCount: 30, revelation: 'Mekke' },
  { number: 90, nameTr: 'Beled', nameAr: 'البلد', meaningTr: 'Şehir', ayahCount: 20, revelation: 'Mekke' },
  { number: 91, nameTr: 'Şems', nameAr: 'الشمس', meaningTr: 'Güneş', ayahCount: 15, revelation: 'Mekke' },
  { number: 92, nameTr: 'Leyl', nameAr: 'الليل', meaningTr: 'Gece', ayahCount: 21, revelation: 'Mekke' },
  { number: 93, nameTr: 'Duhâ', nameAr: 'الضحى', meaningTr: 'Kuşluk Vakti', ayahCount: 11, revelation: 'Mekke' },
  { number: 94, nameTr: 'İnşirâh', nameAr: 'الشرح', meaningTr: 'Göğsü Açmak', ayahCount: 8, revelation: 'Mekke' },
  { number: 95, nameTr: 'Tîn', nameAr: 'التين', meaningTr: 'İncir', ayahCount: 8, revelation: 'Mekke' },
  { number: 96, nameTr: 'Alak', nameAr: 'العلق', meaningTr: 'Alak / Oku', ayahCount: 19, revelation: 'Mekke' },
  { number: 97, nameTr: 'Kadir', nameAr: 'القدر', meaningTr: 'Kadir Gecesi', ayahCount: 5, revelation: 'Mekke' },
  { number: 98, nameTr: 'Beyyine', nameAr: 'البينة', meaningTr: 'Apaçık Delil', ayahCount: 8, revelation: 'Medine' },
  { number: 99, nameTr: 'Zilzâl', nameAr: 'الزلزلة', meaningTr: 'Sarsıntı', ayahCount: 8, revelation: 'Medine' },
  { number: 100, nameTr: 'Âdiyât', nameAr: 'العاديات', meaningTr: 'Koşan Atlar', ayahCount: 11, revelation: 'Mekke' },
  { number: 101, nameTr: 'Kâria', nameAr: 'القارعة', meaningTr: 'Çarpıcı Felaket', ayahCount: 11, revelation: 'Mekke' },
  { number: 102, nameTr: 'Tekâsür', nameAr: 'التكاثر', meaningTr: 'Çoğaltma Yarışı', ayahCount: 8, revelation: 'Mekke' },
  { number: 103, nameTr: 'Asr', nameAr: 'العصر', meaningTr: 'İkindi / Zaman', ayahCount: 3, revelation: 'Mekke' },
  { number: 104, nameTr: 'Hümeze', nameAr: 'الهمزة', meaningTr: 'Kınayan', ayahCount: 9, revelation: 'Mekke' },
  { number: 105, nameTr: 'Fîl', nameAr: 'الفيل', meaningTr: 'Fil', ayahCount: 5, revelation: 'Mekke' },
  { number: 106, nameTr: 'Kureyş', nameAr: 'قريش', meaningTr: 'Kureyş', ayahCount: 4, revelation: 'Mekke' },
  { number: 107, nameTr: 'Mâûn', nameAr: 'الماعون', meaningTr: 'Yardımlaşma', ayahCount: 7, revelation: 'Mekke' },
  { number: 108, nameTr: 'Kevser', nameAr: 'الكوثر', meaningTr: 'Bol Nimet', ayahCount: 3, revelation: 'Mekke' },
  { number: 109, nameTr: 'Kâfirûn', nameAr: 'الكافرون', meaningTr: 'İnkârcılar', ayahCount: 6, revelation: 'Mekke' },
  { number: 110, nameTr: 'Nasr', nameAr: 'النصر', meaningTr: 'Yardım', ayahCount: 3, revelation: 'Medine' },
  { number: 111, nameTr: 'Tebbet', nameAr: 'المسد', meaningTr: 'Bükülmüş Hurma Lifi', ayahCount: 5, revelation: 'Mekke' },
  { number: 112, nameTr: 'İhlâs', nameAr: 'الإخلاص', meaningTr: 'Samimiyet', ayahCount: 4, revelation: 'Mekke' },
  { number: 113, nameTr: 'Felak', nameAr: 'الفلق', meaningTr: 'Sabah Aydınlığı', ayahCount: 5, revelation: 'Mekke' },
  { number: 114, nameTr: 'Nâs', nameAr: 'الناس', meaningTr: 'İnsanlar', ayahCount: 6, revelation: 'Mekke' },
];

export function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

export function buildSurahMediaItem(surah: SurahInfo, reciter: Reciter): MediaItem {
  const padded = pad3(surah.number);
  const directUrl = `${reciter.surahBaseUrl}/${padded}.mp3`;
  return {
    contentId: `quran:${reciter.id}:${padded}`,
    title: `${surah.number}. ${surah.nameTr} Suresi`,
    arabicTitle: surah.nameAr,
    artistId: `reciter:${reciter.id}`,
    artistName: reciter.nameTr,
    album: `Kur'an-ı Kerim · ${reciter.style}`,
    categoryId: 'kuran',
    language: 'Arapça',
    genre: "Kur'an Tilaveti",
    durationSec: 0,
    streamUrl: directUrl,
    sourceProvider: 'mp3quran',
    downloadAllowed: true,
    licenseName: reciter.licenseName,
    bitrateKbps: reciter.bitrateKbps,
    format: 'MP3',
    motif: 'kuran',
    surahNumber: surah.number,
    reciterId: reciter.id,
  };
}

export function buildAyahAudioUrl(reciter: Reciter, surahNumber: number, ayahNumber: number): string | undefined {
  if (!reciter.everyAyahFolder) return undefined;
  return `https://everyayah.com/data/${reciter.everyAyahFolder}/${pad3(surahNumber)}${pad3(ayahNumber)}.mp3`;
}

export function getProxiedAudioUrl(rawUrl: string): string {
  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('/api/')) {
    return rawUrl;
  }
  return `/api/audio/proxy?url=${encodeURIComponent(rawUrl)}`;
}

export function getFallbackStreamUrl(item: MediaItem): string | null {
  if (!item.surahNumber || !item.reciterId || item.ayahNumber) return null;
  const reciter = RECITERS.find((r) => r.id === item.reciterId);
  if (!reciter?.fallbackBaseUrl) return null;
  return `${reciter.fallbackBaseUrl}/${pad3(item.surahNumber)}.mp3`;
}

const VALID_MOTIFS = new Set<string>([
  'nostalji',
  'karadeniz',
  'arapca',
  'azerice',
  'lazca',
  'turkuler',
  'arabesk',
  'fantezi',
  'turk_sanat',
  'turk_pop',
  'turk_rock',
  'ozgun',
  'ilahi',
  'ezgi',
  'nesid',
  'zikirli_ilahiler',
  'tasavvuf',
  'kuran',
  'custom',
]);

export function normalizeMotif(motif: string | undefined): MediaItem['motif'] {
  if (!motif) return 'custom';
  if (motif === 'quran') return 'kuran';
  if (motif === 'studio') return 'custom';
  return (VALID_MOTIFS.has(motif) ? motif : 'custom') as MediaItem['motif'];
}

/**
 * Heals stale cached MediaItems from older localStorage sessions:
 * - Refreshes Quran surah streamUrl to the latest verified CDN URL
 * - Migrates legacy motif strings ('quran' -> 'kuran', 'studio' -> 'custom')
 */
export function healMediaItem(item: MediaItem): MediaItem {
  const motif = normalizeMotif(item.motif as unknown as string);
  if (item.surahNumber && item.reciterId && !item.ayahNumber) {
    const reciter = RECITERS.find((r) => r.id === item.reciterId);
    if (reciter) {
      return {
        ...item,
        motif: 'kuran',
        streamUrl: `${reciter.surahBaseUrl}/${pad3(item.surahNumber)}.mp3`,
      };
    }
  }
  if (motif !== item.motif) {
    return { ...item, motif };
  }
  return item;
}
