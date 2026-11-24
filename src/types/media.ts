export type RepeatMode = 'off' | 'all' | 'one';

export type SleepTimerMode = 'off' | '15' | '30' | '45' | '60' | 'end_of_track';

export type EqPresetId =
  | 'flat'
  | 'car'
  | 'headphones'
  | 'pop'
  | 'rock'
  | 'arabesk'
  | 'vocal'
  | 'classic'
  | 'vocal_quran'
  | 'tasavvuf'
  | 'bass_boost'
  | 'custom';

export interface CustomEqProfile {
  id: string;
  name: string;
  bandsDb: number[];
  preampDb: number;
  bassBoostDb: number;
  trebleBoostDb: number;
  volumeLeveler?: boolean;
}

export type NavTabId = 'home' | 'search' | 'quran' | 'library' | 'settings';

export type AppScreen =
  | { name: 'home' }
  | { name: 'categories' }
  | { name: 'artists' }
  | { name: 'artist_detail'; artistId: string }
  | { name: 'track_list'; categoryId?: string; categoryIds?: string[]; title: string }
  | { name: 'now_playing' }
  | { name: 'quran' }
  | { name: 'reciter_select' }
  | { name: 'surah_list'; reciterId: string }
  | { name: 'surah_detail'; surahNumber: number; reciterId: string }
  | { name: 'favorites' }
  | { name: 'playlists' }
  | { name: 'playlist_detail'; playlistId: string }
  | { name: 'create_playlist' }
  | { name: 'search' }
  | { name: 'downloads' }
  | { name: 'storage' }
  | { name: 'audio_settings' }
  | { name: 'general_settings' };

export type CategorySymbolId =
  | 'nostalji'
  | 'karadeniz'
  | 'arapca'
  | 'azerice'
  | 'lazca'
  | 'turkuler'
  | 'arabesk'
  | 'fantezi'
  | 'turk_sanat'
  | 'turk_pop'
  | 'turk_rock'
  | 'ozgun'
  | 'ilahi'
  | 'ezgi'
  | 'nesid'
  | 'zikirli_ilahiler'
  | 'tasavvuf'
  | 'kuran'
  | 'custom';

export type ArtworkMotif = CategorySymbolId;

export interface MusicCategory {
  id: string;
  order: number;
  name: string;
  subtitle: string;
  language: string;
  genre: string;
  motif: CategorySymbolId;
  accentHex: string;
  archiveQuery: string;
  isQuran?: boolean;
  isCustom?: boolean;
}

export interface MediaItem {
  contentId: string;
  title: string;
  arabicTitle?: string;
  artistId: string;
  artistName: string;
  album: string;
  categoryId: string;
  language: string;
  genre: string;
  durationSec: number;
  streamUrl: string;
  coverUrl?: string;
  year?: string;
  trackType?: 'studio' | 'live' | 'remix' | 'cover' | 'karaoke';
  sourceProvider: 'mp3quran' | 'everyayah' | 'internet_archive' | 'jamendo' | 'audius' | 'wikimedia' | 'local_file';
  downloadAllowed: boolean;
  licenseName: string;
  bitrateKbps?: number;
  format: 'MP3' | 'AAC' | 'FLAC' | 'OGG' | 'WAV';
  motif: CategorySymbolId;
  surahNumber?: number;
  reciterId?: string;
  ayahNumber?: number;
  isLocalFile?: boolean;
}

export interface CuratedPlaylist {
  id: string;
  categoryId: string;
  title: string;
  subtitle: string;
  description: string;
  motif: CategorySymbolId;
  tracks: MediaItem[];
  source: 'database';
}

export interface ArtistSummary {
  id: string;
  name: string;
  categoryIds: string[];
  language: string;
  genre: string;
  trackCount: number;
  motif: CategorySymbolId;
  isReciter?: boolean;
}

export interface Reciter {
  id: string;
  nameTr: string;
  nameAr: string;
  style: string;
  country: string;
  bitrateKbps: number;
  surahBaseUrl: string;
  fallbackBaseUrl?: string;
  everyAyahFolder?: string;
  licenseName: string;
}

export interface SurahInfo {
  number: number;
  nameTr: string;
  nameAr: string;
  meaningTr: string;
  ayahCount: number;
  revelation: 'Mekke' | 'Medine';
}

export interface AyahItem {
  numberInSurah: number;
  globalNumber: number;
  arabicText: string;
  turkishMeal: string;
  audioUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  items: MediaItem[];
  categoryFilterIds?: string[];
  isQuranPlaylist?: boolean;
}

export interface DownloadSettings {
  autoSaveOnPlay: boolean;
  wifiOnly: boolean;
  allowMobileData: boolean;
  preferredBitrateKbps: 128 | 192 | 256 | 320;
  storageLocation: 'app_archive';
  userQuotaGb: number | null;
  preventDuplicateDownload: boolean;
  minFreeSpaceGb: number;
}

export interface DownloadRecord {
  contentId: string;
  item: MediaItem;
  sizeBytes: number;
  savedAt: number;
  mimeType: string;
}

export interface DownloadProgress {
  contentId: string;
  title: string;
  progress: number;
  status: 'queued' | 'downloading' | 'completed' | 'paused_low_storage' | 'error';
  errorMessage?: string;
}

export interface EqualizerSettings {
  enabled: boolean;
  preset: EqPresetId;
  bandsDb: number[];
  preampDb: number;
  bassBoostDb: number;
  trebleBoostDb: number;
  volumeLeveler: boolean;
  crossfadeSec?: number;
  customProfiles?: CustomEqProfile[];
}

export interface PlaybackResumePoint {
  contentId: string;
  positionSec: number;
  updatedAt: number;
}

export interface CatalogProviderStatus {
  databaseConnected: boolean;
  quranApiConnected: boolean;
  internetArchiveConnected: boolean;
  jamendoConfigured: boolean;
  audiusConnected?: boolean;
  wikimediaConnected?: boolean;
  localArchiveReady: boolean;
}
