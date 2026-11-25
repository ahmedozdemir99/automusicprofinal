import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_CATEGORIES } from '../data/categories.ts';
import { RECITERS, SURAHS, buildSurahMediaItem } from '../data/quranData.ts';
import type { CategorySymbolId, CuratedPlaylist, MediaItem, MusicCategory } from '../types/media.ts';

interface CuratedPlaylistBlueprint {
  id: string;
  categoryId: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface VerifiedArchiveSource {
  identifier: string;
  artistDisplay: string;
  albumDisplay: string;
  year?: string;
  maxFiles?: number;
}

const CATALOG_DATA_VERSION = '5';

// Verified HTTP-200 Turkish, Karadeniz, Arabesk, Fantezi, Rock, Pop, Spiritual & Arabic Internet Archive collections
export const VERIFIED_CATEGORY_ARCHIVES: Record<string, VerifiedArchiveSource[]> = {
  nostalji: [
    { identifier: 'OBenimteMZeyyenSenar', artistDisplay: 'Müzeyyen Senar', albumDisplay: 'Taş Plak Seçkisi', year: '1960' },
    { identifier: 'SafiyeAyla', artistDisplay: 'Safiye Ayla', albumDisplay: 'Eski Plaklar', year: '1958' },
    { identifier: 'hamiyet-yuceses-bakmiyor-cesmi-siyah-tas-plak', artistDisplay: 'Hamiyet Yüceses', albumDisplay: 'Taş Plak Arşivi', year: '1955' },
    { identifier: 'hayat-genclik-boyunca', artistDisplay: 'Münir Nurettin Selçuk', albumDisplay: 'Nostalji Klasikleri', year: '1952' },
    { identifier: 'Nilufer', artistDisplay: 'Nilüfer', albumDisplay: 'Klasik Seçki', year: '1978', maxFiles: 4 },
  ],
  karadeniz: [
    { identifier: 'kazim-koyuncu-hayde', artistDisplay: 'Kazım Koyuncu', albumDisplay: 'Hayde', year: '2004', maxFiles: 4 },
    { identifier: 'VolkanKonak', artistDisplay: 'Volkan Konak', albumDisplay: 'Karadeniz Seçkisi', maxFiles: 6 },
    { identifier: '2011BirolTopaloglu-kiyiBoyuKaradeniz', artistDisplay: 'Birol Topaloğlu', albumDisplay: 'Kıyı Boyu Karadeniz', year: '2011', maxFiles: 8 },
    { identifier: 'gun-gelir', artistDisplay: 'Karadeniz Akustik', albumDisplay: 'Yayla Ezgileri', maxFiles: 4 },
  ],
  arapca: [
    { identifier: 'y-2mate.com-haq-beladak-umm-kulthum', artistDisplay: 'Ümmü Gülsüm (Umm Kulthum)', albumDisplay: 'Klasik Arap Makamları' },
    { identifier: '442010-10-04.halim_408', artistDisplay: 'Abdel Halim Hafez', albumDisplay: 'Klasik Arap Müziği' },
    { identifier: 'hussein-abdel-halim', artistDisplay: 'Abdel Halim Hafez', albumDisplay: 'Seçme Arapça Eserler', maxFiles: 6 },
  ],
  azerice: [
    { identifier: 'HetGebouw-Azerbaijan_mugam', artistDisplay: 'Azerbaycan Muğam Topluluğu', albumDisplay: 'Muğam & Tar' },
    { identifier: 'azerbaijanradio4', artistDisplay: 'Azerbaycan Radyo Arşivi', albumDisplay: 'Bakü Seçkisi' },
    { identifier: 'azerbaijanradio5', artistDisplay: 'Azerbaycan Halk Müziği', albumDisplay: 'Geleneksel Ezgiler' },
  ],
  lazca: [
    { identifier: 'TunannBeriYann01.07.2000BirolTopaloglu', artistDisplay: 'Birol Topaloğlu', albumDisplay: 'Lazca & Doğu Karadeniz', year: '2000' },
    { identifier: 'kazim-koyuncu-hayde', artistDisplay: 'Kazım Koyuncu', albumDisplay: 'Hayde (Karadeniz & Lazuri)', year: '2004', maxFiles: 4 },
    { identifier: 'TulumHoron', artistDisplay: 'Karadeniz Tulum Topluluğu', albumDisplay: 'Tulum & Horon' },
    { identifier: '2011BirolTopaloglu-kiyiBoyuKaradeniz', artistDisplay: 'Birol Topaloğlu', albumDisplay: 'Kıyı Boyu Lazuri', year: '2011', maxFiles: 6 },
  ],
  turkuler: [
    { identifier: 'NesetErtasAcemKizi_201511', artistDisplay: 'Neşet Ertaş', albumDisplay: 'Bozkırın Tezenesi', maxFiles: 8 },
    { identifier: 'AltinTurkuler05.HerSabahHerSeher', artistDisplay: 'Anadolu Türkü Şenliği', albumDisplay: 'Altın Türküler' },
    { identifier: '20Nisan2018TrkDiyar', artistDisplay: 'Türkü Diyarı', albumDisplay: 'Bağlama Seçkisi' },
    { identifier: '25Mays2018TrkDiyar', artistDisplay: 'Türkü Diyarı', albumDisplay: 'Anadolu Halk Ezgileri' },
  ],
  arabesk: [
    { identifier: 'MslmGrsesSevYeterBalamalUzunVersiyon', artistDisplay: 'Müslüm Gürses', albumDisplay: 'Arabesk Klasikleri' },
    { identifier: '001.-ferdi-tayfur-haram-oldu-full-album-1986-orijinal-kaset-kayit', artistDisplay: 'Ferdi Tayfur', albumDisplay: 'Haram Oldu', year: '1986', maxFiles: 6 },
    { identifier: '001.-ferdi-tayfur-bende-ozledim-turkuola-1618-1982-ful-album', artistDisplay: 'Ferdi Tayfur', albumDisplay: 'Ben de Özledim', year: '1982', maxFiles: 6 },
    { identifier: 'YlddzTilbeAKmkSakla2012OrjinalOrhanGencebayEleBirEmBr_201406', artistDisplay: 'Orhan Gencebay & Yıldız Tilbe', albumDisplay: 'Özel Arabesk' },
    { identifier: 'seviyorum-seni-arabesk-pilakanto', artistDisplay: 'Türkçe Arabesk Seçkisi', albumDisplay: 'Gece Yolculuğu' },
  ],
  fantezi: [
    { identifier: 'YlddzTilbeAKmkSakla2012OrjinalOrhanGencebayEleBirEmBr_201406', artistDisplay: 'Yıldız Tilbe & Orhan Gencebay', albumDisplay: 'Fantezi Seçkisi', year: '2012' },
    { identifier: '001.-ferdi-tayfur-bende-ozledim-turkuola-1618-1982-ful-album', artistDisplay: 'Ferdi Tayfur', albumDisplay: 'Ben de Özledim (Fantezi Klasik)', year: '1982', maxFiles: 4 },
    { identifier: 'Nilufer', artistDisplay: 'Nilüfer', albumDisplay: 'Duygusal Fantezi & Pop', maxFiles: 4 },
    { identifier: 'Sezen_Aksu_Fon_Mzikleri', artistDisplay: 'Sezen Aksu', albumDisplay: 'Duygusal Enstrümantal Seçki', maxFiles: 5 },
  ],
  turk_sanat: [
    { identifier: 'hayat-genclik-boyunca', artistDisplay: 'Münir Nurettin Selçuk', albumDisplay: 'Klasik Türk Sanat Müziği' },
    { identifier: 'birgamlihazaninseherinde', artistDisplay: 'Münir Nurettin Selçuk', albumDisplay: 'Fasıl Makamları' },
    { identifier: 'OBenimteMZeyyenSenar', artistDisplay: 'Müzeyyen Senar', albumDisplay: 'Fasıl Seçkisi' },
    { identifier: 'SafiyeAyla', artistDisplay: 'Safiye Ayla', albumDisplay: 'Klasik Makamlar' },
  ],
  turk_pop: [
    { identifier: 'Sezen_Aksu_Fon_Mzikleri', artistDisplay: 'Sezen Aksu', albumDisplay: 'Sezen Aksu Seçkisi', maxFiles: 8 },
    { identifier: 'Nilufer', artistDisplay: 'Nilüfer', albumDisplay: 'Nilüfer Seçkisi', maxFiles: 4 },
    { identifier: 'tarkan-vay-anam-vay_202305', artistDisplay: 'Tarkan', albumDisplay: 'Türkçe Pop Seçkisi' },
    { identifier: 'tarkan-ft.-mahmut-orhan-her-sey-fani', artistDisplay: 'Tarkan & Mahmut Orhan', albumDisplay: 'Modern Türkçe Pop' },
  ],
  turk_rock: [
    { identifier: 'erkinkoray-elektronikturkuler1974', artistDisplay: 'Erkin Koray', albumDisplay: 'Elektronik Türküler', year: '1974', maxFiles: 8 },
    { identifier: '0888-tur8ku', artistDisplay: 'Erkin Koray', albumDisplay: 'Elektronik Türküler & Singles', year: '1974', maxFiles: 8 },
    { identifier: 'erkin-koray-1973-lp', artistDisplay: 'Erkin Koray', albumDisplay: 'Erkin Koray (1973 LP)', year: '1973', maxFiles: 8 },
    { identifier: 'cemkaraca_edirdahan-safinaz', artistDisplay: 'Cem Karaca & Edirdahan', albumDisplay: 'Safinaz', year: '1978', maxFiles: 4 },
    { identifier: 'barismancocemkaracauzunincebiryoldayim', artistDisplay: 'Barış Manço & Cem Karaca', albumDisplay: 'Uzun İnce Bir Yoldayım', maxFiles: 4 },
    { identifier: 'baris-manco-sozum-meclisten-disari-flac', artistDisplay: 'Barış Manço', albumDisplay: 'Sözüm Meclisten Dışarı', year: '1981', maxFiles: 8 },
    { identifier: 'baris-manco-2023-2023-1975', artistDisplay: 'Barış Manço', albumDisplay: '2023 Anadolu Rock', year: '1975', maxFiles: 6 },
  ],
  ozgun: [
    { identifier: 'AhmetKayaSoyle', artistDisplay: 'Ahmet Kaya', albumDisplay: 'Özgün Seçki' },
    { identifier: 'AhmetKayaKafamaSAkarGiderim', artistDisplay: 'Ahmet Kaya', albumDisplay: 'Seçme Eserler' },
    { identifier: '03.-zulfu-livaneli-buyuk-insanlik', artistDisplay: 'Zülfü Livaneli', albumDisplay: 'Özgün Klasikler', maxFiles: 6 },
    { identifier: 'zulfu-livaneli-gozlerin', artistDisplay: 'Zülfü Livaneli', albumDisplay: 'Akustik Özgün' },
  ],
  ilahi: [
    { identifier: 'Abdurrahmannl-ZahidSultan', artistDisplay: 'Abdurrahman Önül', albumDisplay: 'Gönülden Gönüle', maxFiles: 8 },
    { identifier: 'ne-olur-gel-hele-abdurrahman-onul-ilahi', artistDisplay: 'Abdurrahman Önül', albumDisplay: 'Seçkin İlahiler' },
    { identifier: 'NefseUyup-M.eminAy', artistDisplay: 'Mehmet Emin Ay', albumDisplay: 'Türkçe İlahi Seçkisi' },
  ],
  ezgi: [
    { identifier: 'MustafaCihat-HepsiOndadr', artistDisplay: 'Mustafa Cihat', albumDisplay: 'Özgün Türkçe Ezgiler' },
    { identifier: 'SehidTahdndaOmerKaraoglu', artistDisplay: 'Ömer Karaoğlu', albumDisplay: 'Klasik Ezgiler' },
    { identifier: 'MustafaCihatGrddkKiEditByEnderHafazm', artistDisplay: 'Mustafa Cihat', albumDisplay: 'Akustik Ezgiler' },
  ],
  nesid: [
    { identifier: 'y-2mate.com-maher-zain-rahmatun-lil-alameen-official-music-video', artistDisplay: 'Maher Zain', albumDisplay: 'Seçkin Neşidler' },
    { identifier: 'emad--almansery--mp3--anasheed----37--nasheed---from-el-moslem.com', artistDisplay: 'Emad Al-Mansery', albumDisplay: 'Enstrümansız Vokal Neşid', maxFiles: 8 },
  ],
  zikirli_ilahiler: [
    { identifier: 'Abdurrahmannl-ZahidSultan', artistDisplay: 'Abdurrahman Önül', albumDisplay: 'Zikirli İlahiler', maxFiles: 8 },
    { identifier: 'NefseUyup-M.eminAy', artistDisplay: 'Mehmet Emin Ay', albumDisplay: 'Manevi Zikir Seçkisi' },
  ],
  tasavvuf: [
    { identifier: 'NeyTaksimiMystery', artistDisplay: 'Ney Taksimi Seçkisi', albumDisplay: 'Tasavvuf & Sükûnet' },
    { identifier: 'Tasavvuf2', artistDisplay: 'Tasavvuf Topluluğu', albumDisplay: 'Mevlevi & Ney Arşivi' },
  ],
};

// Verified real artist roster per category for MusicBrainz artist -> album -> tracklist explorer
export const VERIFIED_ARTISTS_BY_CATEGORY: Record<string, string[]> = {
  arabesk: [
    'Müslüm Gürses',
    'Ferdi Tayfur',
    'Orhan Gencebay',
    'İbrahim Tatlıses',
    'Bergen',
    'Hakkı Bulut',
    'Kibariye',
    'Ebru Gündeş',
    'Hakan Taşıyan',
    'Cengiz Kurtoğlu',
    'Ümit Besen',
    'Güllü',
  ],
  fantezi: [
    'Yıldız Tilbe',
    'Ebru Gündeş',
    'Sibel Can',
    'İbrahim Tatlıses',
    'Ferdi Tayfur',
    'Orhan Gencebay',
    'Cengiz Kurtoğlu',
    'Linet',
    'Funda Arar',
    'Hakan Altun',
    'Muazzez Ersoy',
  ],
  turk_pop: [
    'Sezen Aksu',
    'Nilüfer',
    'Yıldız Tilbe',
    'Tarkan',
    'Ajda Pekkan',
    'Sertab Erener',
    'Kenan Doğulu',
    'Mustafa Sandal',
    'Hande Yener',
    'Gülşen',
    'Sıla',
    'Mabel Matiz',
    'Teoman',
    'Göksel',
  ],
  nostalji: [
    'Barış Manço',
    'Cem Karaca',
    'Erkin Koray',
    'Zeki Müren',
    'Müzeyyen Senar',
    'Nilüfer',
    'Sezen Aksu',
    'Kayahan',
    'MFÖ',
    'İlhan İrem',
    'Edip Akbayram',
    'Fikret Kızılok',
    'Bülent Ortaçgil',
    'Selda Bağcan',
  ],
  turkuler: [
    'Neşet Ertaş',
    'Aşık Veysel',
    'Arif Sağ',
    'Musa Eroğlu',
    'Sabahat Akkiraz',
    'Muharrem Ertaş',
    'Yavuz Top',
    'Belkıs Akkale',
    'Zara',
    'İzzet Altınmeşe',
    'Tolga Sağ',
    'Erdal Erzincan',
    'Güler Duman',
  ],
  karadeniz: [
    'Kazım Koyuncu',
    'Volkan Konak',
    'Birol Topaloğlu',
    'Resul Dindar',
    'Selçuk Balcı',
    'İsmail Türüt',
    'Fuat Saka',
    'Ekin Uzunlar',
    'Şevval Sam',
    'Cimilli İbo',
    'Apolas Lermi',
    'Marsis',
  ],
  turk_sanat: [
    'Zeki Müren',
    'Müzeyyen Senar',
    'Münir Nurettin Selçuk',
    'Safiye Ayla',
    'Bülent Ersoy',
    'Emel Sayın',
    'Muazzez Ersoy',
    'Ahmet Özhan',
  ],
  turk_rock: [
    'Erkin Koray',
    'Barış Manço',
    'Cem Karaca',
    'Duman',
    'mor ve ötesi',
    'maNga',
    'Şebnem Ferah',
    'Teoman',
    'Athena',
    'Gripin',
    'Pentagram',
    'Kurban',
    'Kargo',
  ],
  ozgun: [
    'Ahmet Kaya',
    'Zülfü Livaneli',
    'Grup Yorum',
    'Ferhat Tunç',
    'Onur Akın',
    'Yeni Türkü',
    'Ezginin Günlüğü',
    'Edip Akbayram',
  ],
  ilahi: [
    'Abdurrahman Önül',
    'Mustafa Demirci',
    'Sedat Uçan',
    'Mehmet Emin Ay',
    'Eşref Ziya Terzi',
    'Ömer Karaoğlu',
  ],
  ezgi: [
    'Mustafa Cihat',
    'Eşref Ziya Terzi',
    'Ömer Karaoğlu',
    'Mustafa Demirci',
    'Grup Genç',
  ],
  nesid: [
    'Maher Zain',
    'Sami Yusuf',
    'Mesut Kurtis',
    'Ahmed Bukhatir',
  ],
  zikirli_ilahiler: [
    'Abdurrahman Önül',
    'Ahmet Özhan',
    'Mustafa Demirci',
    'Mehmet Emin Ay',
  ],
  tasavvuf: [
    'Ahmet Özhan',
    'Kudsi Erguner',
    'Ömer Faruk Tekbilek',
    'Necdet Yaşar',
  ],
  azerice: [
    'Alim Qasimov',
    'Rashid Behbudov',
    'Brilliant Dadaşova',
    'Aygün Kazımova',
  ],
  arapca: [
    'Fairuz',
    'Umm Kulthum',
    'Abdel Halim Hafez',
    'Amr Diab',
    'Nancy Ajram',
  ],
  lazca: [
    'Kazım Koyuncu',
    'Birol Topaloğlu',
    'Marsis',
    'Zuğaşi Berepe',
  ],
};

// Spotify-style curated playlists stored in SQLite for EVERY SINGLE ONE of the 18 categories
const CURATED_PLAYLIST_BLUEPRINTS: CuratedPlaylistBlueprint[] = [
  { id: 'cur-nostalji-1', categoryId: 'nostalji', title: 'Taş Plak Seçkisi', subtitle: 'Müzeyyen Senar · Safiye Ayla · Hamiyet Yüceses', description: 'Türk müziğinin altın yıllarından unutulmaz dönem kayıtları' },
  { id: 'cur-nostalji-2', categoryId: 'nostalji', title: 'Eski İstanbul Akşamları', subtitle: 'Münir Nurettin Selçuk · Nilüfer · Nostaljik Klasikler', description: 'Sakin yolculuklar için seçilmiş nostaljik eserler' },

  { id: 'cur-karadeniz-1', categoryId: 'karadeniz', title: 'Karadeniz Efsaneleri & Horon', subtitle: 'Kazım Koyuncu · Volkan Konak · Birol Topaloğlu', description: 'Doğu Karadeniz’in unutulmaz sesleri, kemençe ve tulum seçkisi' },
  { id: 'cur-karadeniz-2', categoryId: 'karadeniz', title: 'Karadeniz Akustik', subtitle: 'Kıyı Boyu & Yayla Ezgileri', description: 'Sisli dağlar ve uzun yollar için akustik Karadeniz eserleri' },

  { id: 'cur-arapca-1', categoryId: 'arapca', title: 'Klasik Arap Makamları', subtitle: 'Ümmü Gülsüm · Abdel Halim Hafez', description: 'Doğu müziğinin en seçkin Arap sanatçıları ve klasik eserler' },
  { id: 'cur-arapca-2', categoryId: 'arapca', title: 'Ud ve Doğu Akustik', subtitle: 'Seçkin Arapça Eserler', description: 'Geleneksel ud taksimleri ve klasik Arapça vokaller' },

  { id: 'cur-azerice-1', categoryId: 'azerice', title: 'Azerbaycan Muğam Seçkisi', subtitle: 'Geleneksel Tar & Muğam', description: 'Bakü’den gönüllere ulaşan seçkin Azerbaycan muğamları' },
  { id: 'cur-azerice-2', categoryId: 'azerice', title: 'Bakü Ezgileri', subtitle: 'Azerbaycan Radyo Arşivi', description: 'Klasik Azerice halk ve sanat eserleri' },

  { id: 'cur-lazca-1', categoryId: 'lazca', title: 'Lazuri & Kıyı Boyu', subtitle: 'Kazım Koyuncu · Birol Topaloğlu · Tulum Topluluğu', description: 'Doğu Karadeniz’in özgün Lazca sözlü ve tulumlu eserleri' },
  { id: 'cur-lazca-2', categoryId: 'lazca', title: 'Tulum ve Yayla Sesleri', subtitle: 'Geleneksel Horon & Lazca', description: 'Doğal yayla ritimleriyle tulum kayıtları' },

  { id: 'cur-turkuler-1', categoryId: 'turkuler', title: 'Bozkırın Tezenesi & Bağlama', subtitle: 'Neşet Ertaş · Altın Türküler', description: 'Yedi bölgeden seçme Anadolu halk müziği ve bağlama eserleri' },
  { id: 'cur-turkuler-2', categoryId: 'turkuler', title: 'Uzun Yol Türküleri', subtitle: 'Türkü Diyarı · Bozlak Seçkisi', description: 'Yolda dinlemek için derlenmiş samimi Türkçe türküler' },

  { id: 'cur-arabesk-1', categoryId: 'arabesk', title: 'Arabesk Ustaları', subtitle: 'Müslüm Gürses · Ferdi Tayfur · Orhan Gencebay', description: 'Türk arabesk müziğinin unutulmaz ustalarından seçkiler' },
  { id: 'cur-arabesk-2', categoryId: 'arabesk', title: 'Gece Yolculuğu Arabesk', subtitle: 'Ferdi Tayfur · Yıldız Tilbe · Yaylılar', description: 'Akşam sürüşleri için özenle seçilmiş arabesk eserler' },

  { id: 'cur-fantezi-1', categoryId: 'fantezi', title: 'Fantezi Klasikleri', subtitle: 'Yıldız Tilbe · Orhan Gencebay · Ferdi Tayfur', description: 'Duygusal yaylılar ve güçlü vokallerle Türkçe fantezi seçkisi' },
  { id: 'cur-fantezi-2', categoryId: 'fantezi', title: 'Akşam Fantezi & Duygusal', subtitle: 'Nilüfer · Sezen Aksu · Özel Seçki', description: 'Gece sürüşleri için melodik fantezi ve enstrümantal eserler' },

  { id: 'cur-sanat-1', categoryId: 'turk_sanat', title: 'Fasıl ve Makam Seçkisi', subtitle: 'Münir Nurettin Selçuk · Müzeyyen Senar', description: 'Hicaz, Nihavend ve Hüzzam makamlarında klasik eserler' },
  { id: 'cur-sanat-2', categoryId: 'turk_sanat', title: 'Kanun, Ud ve Tambur', subtitle: 'Safiye Ayla · Klasik Sanat Müziği', description: 'Saf enstrümantal ve vokal sanat müziği seçkisi' },

  { id: 'cur-pop-1', categoryId: 'turk_pop', title: 'Türkçe Pop Seçkisi', subtitle: 'Sezen Aksu · Nilüfer · Tarkan', description: 'Enerjik ve akıcı klasik ile modern Türkçe pop kayıtları' },
  { id: 'cur-pop-2', categoryId: 'turk_pop', title: 'Şehir İçi Pop Akışı', subtitle: 'Türkçe Pop Klasikleri', description: 'Günlük sürüşler için seçme Türkçe pop listesi' },

  { id: 'cur-rock-1', categoryId: 'turk_rock', title: 'Anadolu Rock Efsaneleri', subtitle: 'Erkin Koray · Barış Manço · Cem Karaca', description: 'Türk rock tarihine damga vuran ölümsüz Anadolu Rock albümleri' },
  { id: 'cur-rock-2', categoryId: 'turk_rock', title: 'Elektronik Türküler & 70ler Rock', subtitle: 'Erkin Koray · Cem Karaca · Barış Manço', description: 'Klasik elektro gitar, bağlama ve Anadolu ritimleri bir arada' },

  { id: 'cur-ozgun-1', categoryId: 'ozgun', title: 'Şiirsel Özgün Seçki', subtitle: 'Ahmet Kaya · Zülfü Livaneli', description: 'Türkçe özgün müziğin güçlü sözlü ve akustik kayıtları' },
  { id: 'cur-ozgun-2', categoryId: 'ozgun', title: 'Anadolu Akustik', subtitle: 'Seçme Özgün Eserler', description: 'Yalın gitar ve bağlama eşliğinde derin Türkçe sözler' },

  { id: 'cur-ilahi-1', categoryId: 'ilahi', title: 'Seçkin Türkçe İlahiler', subtitle: 'Abdurrahman Önül · Mehmet Emin Ay', description: 'Gönül dünyasına hitap eden en sevilen Türkçe ilahiler' },
  { id: 'cur-ilahi-2', categoryId: 'ilahi', title: 'Huzur İlahileri', subtitle: 'Gönülden Gönüle', description: 'Sakin ve manevi atmosferli ilahi seçkisi' },

  { id: 'cur-ezgi-1', categoryId: 'ezgi', title: 'Özgün Türkçe Ezgiler', subtitle: 'Mustafa Cihat · Ömer Karaoğlu', description: 'Manevi temalı modern ve klasik Türkçe ezgi eserleri' },
  { id: 'cur-ezgi-2', categoryId: 'ezgi', title: 'Akustik Ezgi Seçkisi', subtitle: 'Seçkin Ezgi Sanatçıları', description: 'Yolculukta dinlenecek dingin Türkçe ezgiler' },

  { id: 'cur-nesid-1', categoryId: 'nesid', title: 'Seçkin Neşid Listesi', subtitle: 'Maher Zain · Emad Al-Mansery', description: 'Duru vokal ve manevi temalı seçkin neşid kayıtları' },
  { id: 'cur-nesid-2', categoryId: 'nesid', title: 'Enstrümansız Vokal Neşidler', subtitle: 'Saf Vokal Seçki', description: 'Yalnızca insan sesiyle icra edilmiş neşidler' },

  { id: 'cur-zikir-1', categoryId: 'zikirli_ilahiler', title: 'Def ve Zikirli İlahiler', subtitle: 'Abdurrahman Önül · Mehmet Emin Ay', description: 'Ritimli, defli ve zikir eşlikli Türkçe ilahi seçkisi' },
  { id: 'cur-zikir-2', categoryId: 'zikirli_ilahiler', title: 'Tevhid ve Kaside Seçkisi', subtitle: 'Manevi Zikir Arşivi', description: 'Kaside ve zikirli manevi eserlerden özel derleme' },

  { id: 'cur-tasavvuf-1', categoryId: 'tasavvuf', title: 'Ney Taksimleri ve Sükûnet', subtitle: 'Geleneksel Ney & Bendir', description: 'Zihni dinlendiren ney taksimleri ve tasavvuf musikisi' },
  { id: 'cur-tasavvuf-2', categoryId: 'tasavvuf', title: 'Mevlevi & Tasavvuf Seçkisi', subtitle: 'Klasik Tasavvuf Arşivi', description: 'Kadim Anadolu tasavvuf geleneğinden huzurlu kayıtlar' },

  { id: 'cur-kuran-1', categoryId: 'kuran', title: '114 Sure Tam Hatim', subtitle: '6 Seçkin Kâri · Sıralı Tilavet', description: 'Fatiha’dan Nas suresine kadar kesintisiz Kur’an-ı Kerim tilaveti' },
  { id: 'cur-kuran-2', categoryId: 'kuran', title: 'Sabah & Akşam Sureleri', subtitle: 'Yasin · Rahman · Mülk · Vakıa · Kehf', description: 'Günlük okunan faziletli surelerden özel seçki' },
  { id: 'cur-kuran-3', categoryId: 'kuran', title: 'Kısa Sureler & Namaz Sureleri', subtitle: 'Duha’dan Nas Suresine', description: 'Ezber ve kısa yolculuklar için seçkin kısa sureler' },
];

export function detectTrackType(title: string, album = ''): MediaItem['trackType'] {
  const text = `${title} ${album}`.toLocaleLowerCase('tr-TR');
  if (/\bkaraoke\b|\benstrümantal karaoke\b|\bbacking track\b/.test(text)) return 'karaoke';
  if (/\bremix\b|\bclub mix\b|\bdj\s|\bmashup\b|\bbootleg\b/.test(text)) return 'remix';
  if (/\bcover\b|\btribute\b|\byorum\b/.test(text)) return 'cover';
  if (/\blive\b|\bcanlı\b|\bkonser\b|\bunplugged\b/.test(text)) return 'live';
  return 'studio';
}

export function cleanTrackTitle(raw: string, fallback: string): string {
  const cleaned = raw
    .replace(/^.*\//, '')
    .replace(/\.(mp3|ogg|flac|m4a|wav)$/i, '')
    .replace(/^y-?2mate\.com\s*[-_]\s*/i, '')
    .replace(/www\.[a-z0-9.-]+/gi, '')
    .replace(/^\d{1,3}[\s._-]+(?=[a-zA-ZğüşöçıİĞÜŞÖÇ])/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+-\s+/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 2 ? cleaned : fallback;
}

function getFormatPriority(filename: string): number {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp3')) return 3;
  if (lower.endsWith('.flac')) return 2;
  if (lower.endsWith('.ogg')) return 1;
  return 0;
}

function resolveWritableDbPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data', 'automusic.sqlite'),
    path.join(os.tmpdir(), 'automusic-pro-data', 'automusic.sqlite'),
  ];
  for (const candidate of candidates) {
    try {
      const dir = path.dirname(candidate);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.accessSync(dir, fs.constants.W_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return ':memory:';
}

class AutoMusicDatabase {
  private db: DatabaseSync;
  private syncingPromises = new Map<string, Promise<void>>();

  constructor() {
    const dbPath = resolveWritableDbPath();
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
    this.seedDefaults();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        display_order INTEGER NOT NULL,
        name TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        language TEXT NOT NULL,
        genre TEXT NOT NULL,
        motif TEXT NOT NULL,
        accent_hex TEXT NOT NULL,
        archive_query TEXT NOT NULL,
        is_quran INTEGER NOT NULL DEFAULT 0,
        is_custom INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS curated_playlists (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        description TEXT NOT NULL,
        motif TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tracks (
        content_id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        title TEXT NOT NULL,
        arabic_title TEXT,
        artist_id TEXT NOT NULL,
        artist_name TEXT NOT NULL,
        album TEXT NOT NULL,
        language TEXT NOT NULL,
        genre TEXT NOT NULL,
        duration_sec INTEGER NOT NULL DEFAULT 0,
        stream_url TEXT NOT NULL,
        source_provider TEXT NOT NULL,
        download_allowed INTEGER NOT NULL DEFAULT 1,
        license_name TEXT NOT NULL,
        bitrate_kbps INTEGER,
        format TEXT NOT NULL DEFAULT 'MP3',
        motif TEXT NOT NULL,
        cover_url TEXT,
        year TEXT,
        track_type TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tracks_category ON tracks(category_id);
      CREATE INDEX IF NOT EXISTS idx_playlists_category ON curated_playlists(category_id);
    `);

    // Add newer columns safely if upgrading an existing SQLite DB
    const existingCols = new Set(
      (this.db.prepare('PRAGMA table_info(tracks)').all() as Array<{ name: string }>).map((c) => c.name)
    );
    if (!existingCols.has('cover_url')) {
      this.db.exec('ALTER TABLE tracks ADD COLUMN cover_url TEXT');
    }
    if (!existingCols.has('year')) {
      this.db.exec('ALTER TABLE tracks ADD COLUMN year TEXT');
    }
    if (!existingCols.has('track_type')) {
      this.db.exec('ALTER TABLE tracks ADD COLUMN track_type TEXT');
    }

    const verRow = this.db.prepare("SELECT value FROM app_meta WHERE key = 'catalog_version'").get() as
      | { value: string }
      | undefined;
    if (verRow?.value !== CATALOG_DATA_VERSION) {
      this.db.exec('DELETE FROM tracks');
      this.db
        .prepare("INSERT INTO app_meta (key, value) VALUES ('catalog_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .run(CATALOG_DATA_VERSION);
    }
  }

  private seedDefaults(): void {
    const upsertCat = this.db.prepare(`
      INSERT INTO categories (id, display_order, name, subtitle, language, genre, motif, accent_hex, archive_query, is_quran, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_order = excluded.display_order,
        name = excluded.name,
        subtitle = excluded.subtitle,
        language = excluded.language,
        genre = excluded.genre,
        motif = excluded.motif,
        accent_hex = excluded.accent_hex,
        archive_query = excluded.archive_query
    `);

    for (const cat of DEFAULT_CATEGORIES) {
      upsertCat.run(
        cat.id,
        cat.order,
        cat.name,
        cat.subtitle,
        cat.language,
        cat.genre,
        cat.motif,
        cat.accentHex,
        cat.archiveQuery,
        cat.isQuran ? 1 : 0,
        cat.isCustom ? 1 : 0
      );
    }

    const upsertPl = this.db.prepare(`
      INSERT INTO curated_playlists (id, category_id, title, subtitle, description, motif)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        subtitle = excluded.subtitle,
        description = excluded.description,
        motif = excluded.motif
    `);

    for (const bp of CURATED_PLAYLIST_BLUEPRINTS) {
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === bp.categoryId);
      upsertPl.run(
        bp.id,
        bp.categoryId,
        bp.title,
        bp.subtitle,
        bp.description,
        cat?.motif ?? 'custom'
      );
    }
  }

  getCategories(): MusicCategory[] {
    const rows = this.db
      .prepare('SELECT * FROM categories ORDER BY display_order ASC')
      .all() as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r.id),
      order: Number(r.display_order),
      name: String(r.name),
      subtitle: String(r.subtitle),
      language: String(r.language),
      genre: String(r.genre),
      motif: String(r.motif) as CategorySymbolId,
      accentHex: String(r.accent_hex),
      archiveQuery: String(r.archive_query),
      isQuran: Boolean(r.is_quran),
      isCustom: Boolean(r.is_custom),
    }));
  }

  addCustomCategory(name: string, subtitle: string, language: string, genre: string): MusicCategory {
    const cleanName = name.trim().slice(0, 60);
    const id = `custom_${cleanName.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '_')}_${Date.now().toString(36)}`;
    const countRow = this.db.prepare('SELECT COUNT(*) as cnt FROM categories').get() as { cnt: number };
    const order = Number(countRow.cnt) + 1;

    this.db
      .prepare(
        `INSERT INTO categories (id, display_order, name, subtitle, language, genre, motif, accent_hex, archive_query, is_quran, is_custom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`
      )
      .run(
        id,
        order,
        cleanName,
        subtitle.trim().slice(0, 120) || 'Kişisel müzik kategorisi',
        language.trim().slice(0, 40) || 'Türkçe',
        genre.trim().slice(0, 40) || cleanName,
        'custom',
        '#D4AF37',
        cleanName
      );

    this.db
      .prepare(
        `INSERT INTO curated_playlists (id, category_id, title, subtitle, description, motif)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        `cur-${id}-1`,
        id,
        `${cleanName} Seçkisi`,
        'Özel Kategori Listesi',
        'Bu kategori için veritabanı ve yerel arşiv çalma listesi',
        'custom'
      );

    return {
      id,
      order,
      name: cleanName,
      subtitle: subtitle.trim() || 'Kişisel müzik kategorisi',
      language: language.trim() || 'Türkçe',
      genre: genre.trim() || cleanName,
      motif: 'custom',
      accentHex: '#D4AF37',
      archiveQuery: cleanName,
      isCustom: true,
    };
  }

  private mapTrackRow(r: Record<string, unknown>): MediaItem {
    return {
      contentId: String(r.content_id),
      categoryId: String(r.category_id),
      title: String(r.title),
      arabicTitle: r.arabic_title ? String(r.arabic_title) : undefined,
      artistId: String(r.artist_id),
      artistName: String(r.artist_name),
      album: String(r.album),
      language: String(r.language),
      genre: String(r.genre),
      durationSec: Number(r.duration_sec) || 0,
      streamUrl: String(r.stream_url),
      sourceProvider: String(r.source_provider) as MediaItem['sourceProvider'],
      downloadAllowed: Boolean(r.download_allowed),
      licenseName: String(r.license_name),
      bitrateKbps: r.bitrate_kbps ? Number(r.bitrate_kbps) : undefined,
      format: (String(r.format) as MediaItem['format']) || 'MP3',
      motif: String(r.motif) as CategorySymbolId,
      coverUrl: r.cover_url ? String(r.cover_url) : undefined,
      year: r.year ? String(r.year) : undefined,
      trackType: (r.track_type ? String(r.track_type) : undefined) as MediaItem['trackType'],
    };
  }

  getTracksByCategoryFromDb(categoryId: string): MediaItem[] {
    const rows = this.db
      .prepare('SELECT * FROM tracks WHERE category_id = ? ORDER BY created_at ASC')
      .all(categoryId) as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapTrackRow(r));
  }

  getAllCachedTracksFromDb(): MediaItem[] {
    const rows = this.db
      .prepare('SELECT * FROM tracks ORDER BY category_id ASC, created_at ASC')
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapTrackRow(r));
  }

  private saveTracksToDb(categoryId: string, items: MediaItem[], replaceCategory = false): void {
    if (replaceCategory) {
      this.db.prepare('DELETE FROM tracks WHERE category_id = ?').run(categoryId);
    }

    const stmt = this.db.prepare(`
      INSERT INTO tracks (
        content_id, category_id, title, arabic_title, artist_id, artist_name, album,
        language, genre, duration_sec, stream_url, source_provider, download_allowed,
        license_name, bitrate_kbps, format, motif, cover_url, year, track_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_id) DO UPDATE SET
        title = excluded.title,
        artist_name = excluded.artist_name,
        album = excluded.album,
        stream_url = excluded.stream_url,
        duration_sec = excluded.duration_sec,
        bitrate_kbps = excluded.bitrate_kbps,
        cover_url = excluded.cover_url,
        year = excluded.year,
        track_type = excluded.track_type
    `);

    const now = Date.now();
    items.forEach((item, idx) => {
      stmt.run(
        item.contentId,
        item.categoryId,
        item.title,
        item.arabicTitle ?? null,
        item.artistId,
        item.artistName,
        item.album,
        item.language,
        item.genre,
        item.durationSec,
        item.streamUrl,
        item.sourceProvider,
        item.downloadAllowed ? 1 : 0,
        item.licenseName,
        item.bitrateKbps ?? null,
        item.format,
        item.motif,
        item.coverUrl ?? null,
        item.year ?? null,
        item.trackType ?? 'studio',
        now + idx
      );
    });
  }

  private async fetchArchiveMetadataTracks(
    source: VerifiedArchiveSource,
    category: MusicCategory
  ): Promise<MediaItem[]> {
    try {
      const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(source.identifier)}/files`, {
        headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro4/1.0' },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) return [];
      const json = (await res.json()) as {
        result?: Array<{
          name?: string;
          format?: string;
          length?: string;
          bitrate?: string;
          title?: string;
          artist?: string;
          album?: string;
        }>;
      };

      const rawAudioFiles = (json.result ?? []).filter(
        (f) =>
          f.name &&
          /\.(mp3|ogg|flac)$/i.test(f.name) &&
          !f.name.includes('_64kb') &&
          !f.name.startsWith('__') &&
          !/(sample|preview|spectrogram|_meta)/i.test(f.name)
      );

      // Deduplicate same track stored in multiple formats (.mp3 + .ogg + .flac), preferring MP3 for universal fast streaming
      const bestByStem = new Map<string, (typeof rawAudioFiles)[number]>();
      for (const file of rawAudioFiles) {
        if (!file.name) continue;
        const stem = file.name.replace(/\.(mp3|ogg|flac)$/i, '').toLowerCase();
        const existing = bestByStem.get(stem);
        if (!existing || getFormatPriority(file.name) > getFormatPriority(existing.name ?? '')) {
          bestByStem.set(stem, file);
        }
      }

      const limit = source.maxFiles ?? 6;
      const files = Array.from(bestByStem.values()).slice(0, limit);
      const coverUrl = `https://archive.org/services/img/${encodeURIComponent(source.identifier)}`;

      const items: MediaItem[] = [];
      for (const file of files) {
        if (!file.name) continue;
        const encodedPath = file.name
          .split('/')
          .map((seg) => encodeURIComponent(seg))
          .join('/');
        const streamUrl = `https://archive.org/download/${encodeURIComponent(source.identifier)}/${encodedPath}`;
        const ext = file.name.split('.').pop()?.toUpperCase();
        const format: MediaItem['format'] = ext === 'FLAC' ? 'FLAC' : ext === 'OGG' ? 'OGG' : 'MP3';
        const dur = (() => {
          if (!file.length) return 0;
          const s = String(file.length).trim();
          if (s.includes(':')) {
            const parts = s.split(':').map((p) => Number.parseFloat(p));
            if (parts.every((n) => Number.isFinite(n))) {
              if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
              if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
            }
          }
          const n = Number.parseFloat(s);
          return Number.isFinite(n) ? Math.round(n) : 0;
        })();
        const br = file.bitrate ? Math.round(Number.parseFloat(file.bitrate)) : 192;

        // Skip short previews/clips when duration metadata is present and under 40s
        if (dur > 0 && dur < 40) continue;

        const preferredTitle =
          file.title && file.title.trim().length > 2 && !/^track\s*\d+$/i.test(file.title.trim())
            ? cleanTrackTitle(file.title, source.albumDisplay)
            : cleanTrackTitle(file.name, source.albumDisplay);

        const artistName = source.artistDisplay;
        const artistSlug = artistName.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '-');

        items.push({
          contentId: `db:${category.id}:${source.identifier}:${file.name}`,
          title: preferredTitle,
          artistId: `artist:${artistSlug}`,
          artistName,
          album: source.albumDisplay,
          categoryId: category.id,
          language: category.language,
          genre: category.genre,
          durationSec: Number.isFinite(dur) && dur > 0 ? dur : 0,
          streamUrl,
          sourceProvider: 'internet_archive',
          downloadAllowed: true,
          licenseName: 'Internet Archive Açık Arşiv',
          bitrateKbps: Number.isFinite(br) && br > 0 ? br : 192,
          format,
          motif: category.motif,
          coverUrl,
          year: source.year,
          trackType: detectTrackType(preferredTitle, source.albumDisplay),
        });
      }
      return items;
    } catch {
      return [];
    }
  }

  async ensureCategorySynced(categoryId: string, forceRefresh = false): Promise<MediaItem[]> {
    const categories = this.getCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return [];

    if (category.isQuran) {
      return SURAHS.map((s) => buildSurahMediaItem(s, RECITERS[0]));
    }

    const existing = this.getTracksByCategoryFromDb(categoryId);
    if (!forceRefresh && existing.length > 0) {
      return existing;
    }

    if (this.syncingPromises.has(categoryId)) {
      await this.syncingPromises.get(categoryId);
      return this.getTracksByCategoryFromDb(categoryId);
    }

    const syncJob = (async () => {
      const curatedSources = VERIFIED_CATEGORY_ARCHIVES[categoryId] ?? [];
      const fetched: MediaItem[] = [];

      if (curatedSources.length > 0) {
        const settled = await Promise.allSettled(
          curatedSources.map((src) => this.fetchArchiveMetadataTracks(src, category))
        );
        for (const r of settled) {
          if (r.status === 'fulfilled') {
            fetched.push(...r.value);
          }
        }
      }

      if (fetched.length > 0) {
        // Deduplicate by normalized artist + title so the same song never appears twice in a category
        const seenTitle = new Set<string>();
        const deduped = fetched.filter((item) => {
          const key = `${item.artistName.toLocaleLowerCase('tr-TR')}::${item.title.toLocaleLowerCase('tr-TR')}`;
          if (seenTitle.has(key)) return false;
          seenTitle.add(key);
          return true;
        });
        this.saveTracksToDb(categoryId, deduped, forceRefresh);
      }
    })();

    this.syncingPromises.set(categoryId, syncJob);
    try {
      await syncJob;
    } finally {
      this.syncingPromises.delete(categoryId);
    }

    return this.getTracksByCategoryFromDb(categoryId);
  }

  // Gently pre-warm core categories in background AFTER the HTTP server is listening
  warmPopularCategoriesInBackground(): void {
    const categoryIds = Object.keys(VERIFIED_CATEGORY_ARCHIVES);
    void (async () => {
      for (let i = 0; i < categoryIds.length; i += 4) {
        const batch = categoryIds.slice(i, i + 4);
        await Promise.allSettled(batch.map((id) => this.ensureCategorySynced(id, false)));
      }
    })();
  }

  async getCuratedPlaylistsForCategory(categoryId: string, forceRefresh = false): Promise<{
    playlists: CuratedPlaylist[];
    tracks: MediaItem[];
  }> {
    const categories = this.getCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return { playlists: [], tracks: [] };

    const plRows = this.db
      .prepare('SELECT * FROM curated_playlists WHERE category_id = ? ORDER BY id ASC')
      .all(categoryId) as Array<Record<string, unknown>>;

    if (category.isQuran) {
      const defaultReciter = RECITERS[0];
      const allSurahs = SURAHS.map((s) => buildSurahMediaItem(s, defaultReciter));
      const dailyNumbers = new Set([1, 18, 36, 55, 56, 67, 78]);
      const shortSurahs = allSurahs.filter((s) => (s.surahNumber ?? 0) >= 93);
      const dailySurahs = allSurahs.filter((s) => dailyNumbers.has(s.surahNumber ?? 0));

      const playlists: CuratedPlaylist[] = plRows.map((row, idx) => ({
        id: String(row.id),
        categoryId,
        title: String(row.title),
        subtitle: String(row.subtitle),
        description: String(row.description),
        motif: 'kuran',
        tracks: idx === 0 ? allSurahs : idx === 1 ? dailySurahs : shortSurahs,
        source: 'database',
      }));
      return { playlists, tracks: allSurahs };
    }

    const tracks = await this.ensureCategorySynced(categoryId, forceRefresh);

    const playlists: CuratedPlaylist[] = plRows.map((row, idx) => {
      const subset =
        tracks.length <= 4
          ? tracks
          : idx === 0
            ? tracks.slice(0, Math.ceil(tracks.length * 0.65))
            : [...tracks.slice(Math.floor(tracks.length * 0.35)), ...tracks.slice(0, 2)].filter(
                (t, i, arr) => arr.findIndex((x) => x.contentId === t.contentId) === i
              );

      return {
        id: String(row.id),
        categoryId,
        title: String(row.title),
        subtitle: String(row.subtitle),
        description: String(row.description),
        motif: String(row.motif) as CategorySymbolId,
        tracks: subset,
        source: 'database',
      };
    });

    return { playlists, tracks };
  }

  getFeaturedCuratedPlaylistsSummary(): Array<{
    id: string;
    categoryId: string;
    categoryName: string;
    title: string;
    subtitle: string;
    description: string;
    motif: CategorySymbolId;
    trackCount: number;
  }> {
    const rows = this.db
      .prepare(`
        SELECT cp.*, c.name as category_name,
          (SELECT COUNT(*) FROM tracks t WHERE t.category_id = cp.category_id) as track_count
        FROM curated_playlists cp
        JOIN categories c ON c.id = cp.category_id
        ORDER BY c.display_order ASC, cp.id ASC
      `)
      .all() as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r.id),
      categoryId: String(r.category_id),
      categoryName: String(r.category_name),
      title: String(r.title),
      subtitle: String(r.subtitle),
      description: String(r.description),
      motif: String(r.motif) as CategorySymbolId,
      trackCount: String(r.category_id) === 'kuran' ? 114 : Number(r.track_count) || 0,
    }));
  }
}

export const catalogDb = new AutoMusicDatabase();
