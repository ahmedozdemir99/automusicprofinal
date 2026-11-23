import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../data/categories';
import {
  RECITERS,
  SURAHS,
  buildSurahMediaItem,
  getFallbackStreamUrl,
  getProxiedAudioUrl,
  healMediaItem,
  normalizeMotif,
} from '../data/quranData';
import { EQ_PRESETS, sharedAudioEngine } from '../services/audioEngine';
import {
  DbCategoriesPayload,
  fetchCatalogProviderStatus,
  openMusicRepository,
  quranRepository,
} from '../services/catalogRepository';
import {
  DeviceStorageEstimate,
  clearAllOfflineAudio,
  deleteOfflineAudio,
  getOfflineAudioBlob,
  getStorageEstimate,
  hasOfflineAudio,
  listOfflineRecords,
  saveOfflineAudio,
} from '../services/offlineDb';
import {
  AppScreen,
  CatalogProviderStatus,
  CuratedPlaylist,
  DownloadProgress,
  DownloadRecord,
  DownloadSettings,
  EqPresetId,
  EqualizerSettings,
  MediaItem,
  MusicCategory,
  PlaybackResumePoint,
  Playlist,
  RepeatMode,
} from '../types/media';

const STORAGE_KEYS = {
  CATEGORIES: 'amp_categories_v2',
  FAVORITE_TRACKS: 'amp_fav_tracks_v1',
  FAVORITE_ARTISTS: 'amp_fav_artists_v1',
  FAVORITE_SURAHS: 'amp_fav_surahs_v1',
  FAVORITE_RECITERS: 'amp_fav_reciters_v1',
  PLAYLISTS: 'amp_playlists_v1',
  RECENTLY_PLAYED: 'amp_recent_v1',
  RESUME_POINTS: 'amp_resume_v1',
  DOWNLOAD_SETTINGS: 'amp_dl_settings_v1',
  EQ_SETTINGS: 'amp_eq_settings_v1',
  SELECTED_RECITER: 'amp_reciter_v1',
  LOADED_CATALOG: 'amp_catalog_tracks_v2',
};

const DEFAULT_DOWNLOAD_SETTINGS: DownloadSettings = {
  autoSaveOnPlay: true,
  wifiOnly: false,
  allowMobileData: true,
  preferredBitrateKbps: 320,
  storageLocation: 'app_archive',
  userQuotaGb: null,
  preventDuplicateDownload: true,
  minFreeSpaceGb: 2,
};

const DEFAULT_EQ_SETTINGS: EqualizerSettings = {
  enabled: true,
  preset: 'car',
  bandsDb: [...EQ_PRESETS.car.bandsDb],
  bassBoostDb: EQ_PRESETS.car.bassBoostDb,
  trebleBoostDb: EQ_PRESETS.car.trebleBoostDb,
};

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-yolculuk',
    name: 'Benim Yolculuk Listem',
    description: 'Uzun yol ve şehir içi sürüşler için kişisel karma liste',
    createdAt: Date.now() - 86400000,
    items: [
      buildSurahMediaItem(SURAHS[0], RECITERS[1]),
      buildSurahMediaItem(SURAHS[35], RECITERS[0]),
      buildSurahMediaItem(SURAHS[66], RECITERS[3]),
    ],
  },
  {
    id: 'pl-kuran-huzur',
    name: 'Sabah Tilavet Seçkisi',
    description: 'Seçkin karilerden favori sureler',
    createdAt: Date.now() - 43200000,
    isQuranPlaylist: true,
    items: [
      buildSurahMediaItem(SURAHS[54], RECITERS[0]),
      buildSurahMediaItem(SURAHS[55], RECITERS[4]),
      buildSurahMediaItem(SURAHS[93], RECITERS[2]),
    ],
  },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface AutoMusicContextValue {
  // Navigation & Car Mode
  screen: AppScreen;
  screenHistory: AppScreen[];
  navigate: (next: AppScreen) => void;
  goBack: () => void;
  carMode: boolean;
  setCarMode: (enabled: boolean) => void;

  // Categories & Database Catalog
  categories: MusicCategory[];
  addCategory: (name: string, subtitle: string, language: string, genre: string) => void;
  providerStatus: CatalogProviderStatus;
  catalogTracksByCategory: Record<string, MediaItem[]>;
  curatedPlaylistsByCategory: Record<string, CuratedPlaylist[]>;
  featuredPlaylistsSummary: DbCategoriesPayload['playlistsSummary'];
  catalogNotices: Record<string, string | undefined>;
  loadingCategories: Record<string, boolean>;
  loadCategoryTracks: (categoryId: string, forceRefresh?: boolean) => Promise<MediaItem[]>;
  importLocalAudioFiles: (files: FileList, categoryId: string, artistName?: string) => Promise<number>;

  // Quran
  selectedReciterId: string;
  setSelectedReciterId: (id: string) => void;

  // Playback
  queue: MediaItem[];
  currentIndex: number;
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isPlayingOfflineFile: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  playbackError: string | null;
  playTrack: (item: MediaItem, newQueue?: MediaItem[], startFromZero?: boolean) => Promise<void>;
  playQueue: (items: MediaItem[], shuffleStart?: boolean) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  seekTo: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;

  // Favorites, Playlists, Recent, Resume
  favoriteTracks: MediaItem[];
  favoriteArtistIds: string[];
  favoriteSurahNumbers: number[];
  favoriteReciterIds: string[];
  toggleFavoriteTrack: (item: MediaItem) => void;
  toggleFavoriteArtist: (artistId: string) => void;
  toggleFavoriteSurah: (surahNumber: number) => void;
  toggleFavoriteReciter: (reciterId: string) => void;
  isTrackFavorite: (contentId: string) => boolean;

  playlists: Playlist[];
  createPlaylist: (
    name: string,
    description: string,
    initialItems?: MediaItem[],
    isQuranPlaylist?: boolean,
    categoryFilterIds?: string[]
  ) => Playlist;
  renamePlaylist: (playlistId: string, newName: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, item: MediaItem) => void;
  removeTrackFromPlaylist: (playlistId: string, contentId: string) => void;
  moveTrackInPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;

  recentlyPlayed: MediaItem[];
  resumePoints: Record<string, PlaybackResumePoint>;

  // Smart One-Time Download & Storage
  downloadSettings: DownloadSettings;
  updateDownloadSettings: (patch: Partial<DownloadSettings>) => void;
  downloads: DownloadRecord[];
  downloadProgressMap: Record<string, DownloadProgress>;
  storageEstimate: DeviceStorageEstimate;
  isOfflineDownloaded: (contentId: string) => boolean;
  triggerDownload: (item: MediaItem, manual?: boolean) => Promise<void>;
  removeDownload: (contentId: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  refreshStorageStats: () => Promise<void>;

  // Equalizer
  eqSettings: EqualizerSettings;
  isEqSupported: boolean;
  updateEqSettings: (patch: Partial<EqualizerSettings>) => void;
  applyEqPreset: (preset: EqPresetId) => void;
  setEqBand: (index: number, db: number) => void;

  // Toast Notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AutoMusicContext = createContext<AutoMusicContextValue | null>(null);

export function AutoMusicProvider({ children }: { children: React.ReactNode }) {
  // Navigation
  const [screen, setScreen] = useState<AppScreen>({ name: 'home' });
  const [screenHistory, setScreenHistory] = useState<AppScreen[]>([]);
  const [carMode, setCarMode] = useState(false);

  // Categories & Database Catalog
  const [categories, setCategories] = useState<MusicCategory[]>(() => {
    const saved = readJson<MusicCategory[]>(STORAGE_KEYS.CATEGORIES, []);
    if (saved.length >= 17) {
      return saved.map((c) => ({ ...c, motif: normalizeMotif(c.motif as unknown as string) }));
    }
    return DEFAULT_CATEGORIES;
  });

  const [providerStatus, setProviderStatus] = useState<CatalogProviderStatus>({
    databaseConnected: true,
    quranApiConnected: true,
    internetArchiveConnected: true,
    jamendoConfigured: false,
    localArchiveReady: true,
  });

  const [catalogTracksByCategory, setCatalogTracksByCategory] = useState<Record<string, MediaItem[]>>(() => {
    const raw = readJson<Record<string, MediaItem[]>>(STORAGE_KEYS.LOADED_CATALOG, {});
    const healed: Record<string, MediaItem[]> = {};
    for (const [k, list] of Object.entries(raw)) {
      healed[k] = list.map(healMediaItem);
    }
    return healed;
  });

  const [curatedPlaylistsByCategory, setCuratedPlaylistsByCategory] = useState<Record<string, CuratedPlaylist[]>>({});
  const [featuredPlaylistsSummary, setFeaturedPlaylistsSummary] = useState<DbCategoriesPayload['playlistsSummary']>([]);
  const [catalogNotices, setCatalogNotices] = useState<Record<string, string | undefined>>({});
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});

  // Quran
  const [selectedReciterId, setSelectedReciterId] = useState<string>(() =>
    readJson<string>(STORAGE_KEYS.SELECTED_RECITER, RECITERS[0].id)
  );

  // Playback
  const [queue, setQueue] = useState<MediaItem[]>(() =>
    quranRepository.getSurahTracksForReciter(RECITERS[0].id).slice(0, 10)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlayingOfflineFile, setIsPlayingOfflineFile] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Favorites, Playlists, Recent, Resume (auto-healed from stale URLs/motifs)
  const [favoriteTracks, setFavoriteTracks] = useState<MediaItem[]>(() =>
    readJson<MediaItem[]>(STORAGE_KEYS.FAVORITE_TRACKS, []).map(healMediaItem)
  );
  const [favoriteArtistIds, setFavoriteArtistIds] = useState<string[]>(() =>
    readJson<string[]>(STORAGE_KEYS.FAVORITE_ARTISTS, [])
  );
  const [favoriteSurahNumbers, setFavoriteSurahNumbers] = useState<number[]>(() =>
    readJson<number[]>(STORAGE_KEYS.FAVORITE_SURAHS, [1, 36, 55, 67])
  );
  const [favoriteReciterIds, setFavoriteReciterIds] = useState<string[]>(() =>
    readJson<string[]>(STORAGE_KEYS.FAVORITE_RECITERS, [RECITERS[0].id, RECITERS[1].id])
  );
  const [playlists, setPlaylists] = useState<Playlist[]>(() =>
    readJson<Playlist[]>(STORAGE_KEYS.PLAYLISTS, DEFAULT_PLAYLISTS).map((pl) => ({
      ...pl,
      items: pl.items.map(healMediaItem),
    }))
  );
  const [recentlyPlayed, setRecentlyPlayed] = useState<MediaItem[]>(() =>
    readJson<MediaItem[]>(STORAGE_KEYS.RECENTLY_PLAYED, []).map(healMediaItem)
  );
  const [resumePoints, setResumePoints] = useState<Record<string, PlaybackResumePoint>>(() =>
    readJson<Record<string, PlaybackResumePoint>>(STORAGE_KEYS.RESUME_POINTS, {})
  );

  // Downloads & Storage
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings>(() =>
    readJson<DownloadSettings>(STORAGE_KEYS.DOWNLOAD_SETTINGS, DEFAULT_DOWNLOAD_SETTINGS)
  );
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [downloadProgressMap, setDownloadProgressMap] = useState<Record<string, DownloadProgress>>({});
  const [storageEstimate, setStorageEstimate] = useState<DeviceStorageEstimate>({
    archiveUsedBytes: 0,
    deviceQuotaBytes: null,
    deviceUsageBytes: null,
    estimatedFreeGb: null,
    isBelowTwoGbThreshold: false,
  });

  // Equalizer
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(() =>
    readJson<EqualizerSettings>(STORAGE_KEYS.EQ_SETTINGS, DEFAULT_EQ_SETTINGS)
  );

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);
  const activeDownloadIdsRef = useRef<Set<string>>(new Set());
  const playRequestSeqRef = useRef<number>(0);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Persist user data
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_TRACKS, JSON.stringify(favoriteTracks)); }, [favoriteTracks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_ARTISTS, JSON.stringify(favoriteArtistIds)); }, [favoriteArtistIds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_SURAHS, JSON.stringify(favoriteSurahNumbers)); }, [favoriteSurahNumbers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_RECITERS, JSON.stringify(favoriteReciterIds)); }, [favoriteReciterIds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(recentlyPlayed)); }, [recentlyPlayed]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RESUME_POINTS, JSON.stringify(resumePoints)); }, [resumePoints]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DOWNLOAD_SETTINGS, JSON.stringify(downloadSettings)); }, [downloadSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EQ_SETTINGS, JSON.stringify(eqSettings)); }, [eqSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SELECTED_RECITER, JSON.stringify(selectedReciterId)); }, [selectedReciterId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LOADED_CATALOG, JSON.stringify(catalogTracksByCategory)); }, [catalogTracksByCategory]);

  // Initial load: Provider status + SQLite DB Categories & Curated Playlists + IndexedDB offline archive records
  const refreshStorageStats = useCallback(async () => {
    try {
      const records = await listOfflineRecords();
      setDownloads(records.map((r) => ({ ...r, item: healMediaItem(r.item) })));
      const est = await getStorageEstimate(records, downloadSettings.minFreeSpaceGb);
      setStorageEstimate(est);
    } catch {
      // IndexedDB unavailable in private sandbox
    }
  }, [downloadSettings.minFreeSpaceGb]);

  useEffect(() => {
    refreshStorageStats();
    fetchCatalogProviderStatus().then(setProviderStatus);

    openMusicRepository.fetchCategoriesAndPlaylists().then((payload) => {
      if (!payload) return;
      if (payload.categories.length >= 17) {
        setCategories(payload.categories);
      }
      setFeaturedPlaylistsSummary(payload.playlistsSummary);
    });

    openMusicRepository.fetchAllCachedTracks().then((dbTracks) => {
      if (dbTracks.length === 0) return;
      setCatalogTracksByCategory((prev) => {
        const next = { ...prev };
        const grouped: Record<string, MediaItem[]> = {};
        for (const t of dbTracks) {
          if (!grouped[t.categoryId]) grouped[t.categoryId] = [];
          grouped[t.categoryId].push(t);
        }
        for (const [cid, list] of Object.entries(grouped)) {
          const existingLocals = (next[cid] ?? []).filter((x) => x.isLocalFile);
          next[cid] = [...existingLocals, ...list.filter((t) => !existingLocals.some((l) => l.contentId === t.contentId))];
        }
        return next;
      });
    });
  }, [refreshStorageStats]);

  // Apply EQ settings whenever changed
  useEffect(() => {
    sharedAudioEngine.applyEqualizer(eqSettings);
  }, [eqSettings]);

  // Navigation helpers
  const navigate = useCallback((next: AppScreen) => {
    setScreen((prev) => {
      if (prev.name !== next.name || JSON.stringify(prev) !== JSON.stringify(next)) {
        setScreenHistory((hist) => [...hist.slice(-20), prev]);
      }
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setScreenHistory((hist) => {
      if (hist.length === 0) {
        setScreen({ name: 'home' });
        return [];
      }
      const prev = hist[hist.length - 1];
      setScreen(prev);
      return hist.slice(0, -1);
    });
  }, []);

  // Category creation (extensible + persisted in SQLite)
  const addCategory = useCallback(
    (name: string, subtitle: string, language: string, genre: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      void openMusicRepository.createCategory(trimmed, subtitle, language, genre).then((dbCat) => {
        if (dbCat) {
          setCategories((prev) => [...prev.filter((c) => c.id !== dbCat.id), dbCat]);
          showToast(`"${dbCat.name}" kategorisi veritabanına eklendi.`);
        } else {
          const id = `custom_${trimmed.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '_')}_${Date.now().toString(36)}`;
          setCategories((prev) => [
            ...prev,
            {
              id,
              order: prev.length + 1,
              name: trimmed,
              subtitle: subtitle.trim() || 'Özel müzik kategorisi',
              language: language.trim() || 'Türkçe',
              genre: genre.trim() || trimmed,
              motif: 'custom',
              accentHex: '#D4AF37',
              archiveQuery: trimmed,
              isCustom: true,
            },
          ]);
          showToast(`"${trimmed}" kategorisi eklendi.`);
        }
      });
    },
    [showToast]
  );

  // Load Spotify-style curated playlists & real tracks from SQLite DB + local phone files
  const loadCategoryTracks = useCallback(
    async (categoryId: string, forceRefresh = false): Promise<MediaItem[]> => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) return [];
      if (category.isQuran) {
        return quranRepository.getSurahTracksForReciter(selectedReciterId);
      }

      setLoadingCategories((prev) => ({ ...prev, [categoryId]: true }));
      try {
        const { playlists: dbPlaylists, tracks, notice } = await openMusicRepository.getCategoryPlaylistsAndTracks(
          categoryId,
          forceRefresh
        );
        const localMatching = downloads
          .filter((d) => d.item.categoryId === categoryId && d.item.isLocalFile)
          .map((d) => d.item);
        const merged = [
          ...localMatching,
          ...tracks.filter((t) => !localMatching.some((l) => l.contentId === t.contentId)),
        ];
        setCatalogTracksByCategory((prev) => ({ ...prev, [categoryId]: merged }));
        setCuratedPlaylistsByCategory((prev) => ({ ...prev, [categoryId]: dbPlaylists }));
        setCatalogNotices((prev) => ({ ...prev, [categoryId]: notice }));
        return merged;
      } finally {
        setLoadingCategories((prev) => ({ ...prev, [categoryId]: false }));
      }
    },
    [categories, downloads, selectedReciterId]
  );

  // Import real user audio files (MP3/AAC/FLAC/WAV/OGG) from phone/device into IndexedDB archive
  const importLocalAudioFiles = useCallback(
    async (files: FileList, categoryId: string, artistName = 'Yerel Arşiv'): Promise<number> => {
      const category = categories.find((c) => c.id === categoryId);
      let added = 0;
      const newItems: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('audio/') && !/\.(mp3|aac|m4a|flac|wav|ogg)$/i.test(file.name)) continue;
        const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
        const ext = file.name.split('.').pop()?.toUpperCase();
        const format: MediaItem['format'] =
          ext === 'FLAC' ? 'FLAC' : ext === 'AAC' || ext === 'M4A' ? 'AAC' : ext === 'WAV' ? 'WAV' : ext === 'OGG' ? 'OGG' : 'MP3';

        const contentId = `local:${categoryId}:${file.name}:${file.size}`;
        const item: MediaItem = {
          contentId,
          title: cleanName || file.name,
          artistId: `local-artist:${artistName.toLowerCase().replace(/\s+/g, '-')}`,
          artistName: artistName.trim() || 'Yerel Arşiv',
          album: category?.name ?? 'Yerel Müziklerim',
          categoryId,
          language: category?.language ?? 'Türkçe',
          genre: category?.genre ?? 'Müzik',
          durationSec: 0,
          streamUrl: '',
          sourceProvider: 'local_file',
          downloadAllowed: true,
          licenseName: 'Kullanıcı Yerel Dosyası',
          format,
          motif: category?.motif ?? 'custom',
          isLocalFile: true,
        };
        await saveOfflineAudio(item, file);
        newItems.push(item);
        added++;
      }

      if (added > 0) {
        setCatalogTracksByCategory((prev) => {
          const existing = prev[categoryId] ?? [];
          const uniqueNew = newItems.filter((n) => !existing.some((e) => e.contentId === n.contentId));
          return { ...prev, [categoryId]: [...uniqueNew, ...existing] };
        });
        await refreshStorageStats();
        showToast(`${added} ses dosyası cihazınızdan uygulama arşivine kaydedildi.`);
      }
      return added;
    },
    [categories, refreshStorageStats, showToast]
  );

  const downloadedIdsSet = useMemo(() => new Set(downloads.map((d) => d.contentId)), [downloads]);
  const isOfflineDownloaded = useCallback((contentId: string) => downloadedIdsSet.has(contentId), [downloadedIdsSet]);

  // Smart One-Time Download Engine
  const triggerDownload = useCallback(
    async (rawItem: MediaItem, manual = false) => {
      const item = healMediaItem(rawItem);
      if (!item.downloadAllowed || !item.streamUrl) {
        if (manual) showToast('Bu içerik sağlayıcı lisansı nedeniyle indirilemez.');
        return;
      }

      if (activeDownloadIdsRef.current.has(item.contentId)) return;

      if (downloadSettings.preventDuplicateDownload) {
        const exists = await hasOfflineAudio(item.contentId);
        if (exists) {
          if (manual) showToast('Bu kayıt zaten çevrimdışı arşivinizde bulunuyor.');
          return;
        }
      }

      const est = await getStorageEstimate(downloads, downloadSettings.minFreeSpaceGb);
      setStorageEstimate(est);
      if (est.isBelowTwoGbThreshold) {
        setDownloadProgressMap((prev) => ({
          ...prev,
          [item.contentId]: {
            contentId: item.contentId,
            title: item.title,
            progress: 0,
            status: 'paused_low_storage',
            errorMessage: `Boş alan ${downloadSettings.minFreeSpaceGb} GB altında olduğu için indirme durduruldu.`,
          },
        }));
        showToast(`Boş depolama alanı ${downloadSettings.minFreeSpaceGb} GB altında. Yeni indirmeler durduruldu.`);
        return;
      }

      const navConn = (navigator as unknown as { connection?: { type?: string } }).connection;
      if (downloadSettings.wifiOnly && navConn?.type === 'cellular') {
        if (manual) showToast('Yalnızca Wi-Fi ayarı açık. İndirme Wi-Fi bağlantısı bekliyor.');
        return;
      }

      activeDownloadIdsRef.current.add(item.contentId);
      setDownloadProgressMap((prev) => ({
        ...prev,
        [item.contentId]: {
          contentId: item.contentId,
          title: item.title,
          progress: 2,
          status: 'downloading',
        },
      }));

      try {
        let response = await fetch(getProxiedAudioUrl(item.streamUrl));
        if (!response.ok) {
          const fallbackUrl = getFallbackStreamUrl(item);
          if (fallbackUrl) {
            response = await fetch(getProxiedAudioUrl(fallbackUrl));
          }
        }
        if (!response.ok) throw new Error('Ses dosyası indirilemedi.');

        const contentLength = Number(response.headers.get('content-length') || 0);
        const contentType = response.headers.get('content-type') || 'audio/mpeg';

        let blob: Blob;
        if (response.body && contentLength > 0) {
          const reader = response.body.getReader();
          const chunks: BlobPart[] = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              received += value.length;
              const pct = Math.min(99, Math.round((received / contentLength) * 100));
              setDownloadProgressMap((prev) => ({
                ...prev,
                [item.contentId]: {
                  contentId: item.contentId,
                  title: item.title,
                  progress: pct,
                  status: 'downloading',
                },
              }));
            }
          }
          blob = new Blob(chunks, { type: contentType });
        } else {
          blob = await response.blob();
        }

        await saveOfflineAudio(item, blob);
        await refreshStorageStats();

        setDownloadProgressMap((prev) => ({
          ...prev,
          [item.contentId]: {
            contentId: item.contentId,
            title: item.title,
            progress: 100,
            status: 'completed',
          },
        }));

        if (manual) {
          showToast(`"${item.title}" çevrimdışı arşive kaydedildi.`);
        }

        window.setTimeout(() => {
          setDownloadProgressMap((prev) => {
            const copy = { ...prev };
            if (copy[item.contentId]?.status === 'completed') {
              delete copy[item.contentId];
            }
            return copy;
          });
        }, 2800);
      } catch {
        setDownloadProgressMap((prev) => ({
          ...prev,
          [item.contentId]: {
            contentId: item.contentId,
            title: item.title,
            progress: 0,
            status: 'error',
            errorMessage: 'İndirme yarıda kesildi. Tekrar deneyebilirsiniz.',
          },
        }));
      } finally {
        activeDownloadIdsRef.current.delete(item.contentId);
      }
    },
    [downloadSettings, downloads, refreshStorageStats, showToast]
  );

  const removeDownload = useCallback(
    async (contentId: string) => {
      await deleteOfflineAudio(contentId);
      await refreshStorageStats();
      showToast('Kayıt uygulama arşivinden silindi.');
    },
    [refreshStorageStats, showToast]
  );

  const clearAllDownloads = useCallback(async () => {
    await clearAllOfflineAudio();
    await refreshStorageStats();
    showToast('Tüm çevrimdışı arşiv temizlendi.');
  }, [refreshStorageStats, showToast]);

  const updateDownloadSettings = useCallback((patch: Partial<DownloadSettings>) => {
    setDownloadSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.wifiOnly === true) next.allowMobileData = false;
      if (patch.allowMobileData === true) next.wifiOnly = false;
      return next;
    });
  }, []);

  // Resilient Real Audio Playback Core (Offline First -> Primary Proxy -> Fallback Mirror Proxy)
  const loadAndPlayItem = useCallback(
    async (rawItem: MediaItem, startFromZero = false) => {
      const item = healMediaItem(rawItem);
      const seq = ++playRequestSeqRef.current;

      setPlaybackError(null);
      setIsBuffering(true);
      await sharedAudioEngine.resumeContext();
      sharedAudioEngine.applyEqualizer(eqSettings);

      const audioEl = sharedAudioEngine.element;

      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }

      const tryPlaySource = async (srcUrl: string) => {
        audioEl.pause();
        audioEl.src = srcUrl;
        audioEl.load();

        const savedResume = resumePoints[item.contentId];
        if (!startFromZero && savedResume && savedResume.positionSec > 5) {
          const onLoaded = () => {
            if (audioEl.duration && savedResume.positionSec < audioEl.duration - 8) {
              audioEl.currentTime = savedResume.positionSec;
            }
            audioEl.removeEventListener('loadedmetadata', onLoaded);
          };
          audioEl.addEventListener('loadedmetadata', onLoaded);
        }

        await audioEl.play();
      };

      try {
        const offlineBlob = await getOfflineAudioBlob(item.contentId);
        if (seq !== playRequestSeqRef.current) return;

        let playingOffline = false;

        if (offlineBlob) {
          const blobUrl = URL.createObjectURL(offlineBlob);
          activeObjectUrlRef.current = blobUrl;
          playingOffline = true;
          setIsPlayingOfflineFile(true);
          await tryPlaySource(blobUrl);
        } else if (item.streamUrl) {
          setIsPlayingOfflineFile(false);
          const fallbackUrl = getFallbackStreamUrl(item);
          const isQuran = item.categoryId === 'kuran' || item.sourceProvider === 'mp3quran';
          const sources = [
            getProxiedAudioUrl(item.streamUrl),
            ...(isQuran ? [item.streamUrl] : []),
            ...(fallbackUrl ? [getProxiedAudioUrl(fallbackUrl), fallbackUrl] : []),
          ];
          let lastError: unknown;
          let succeeded = false;
          for (const source of [...new Set(sources)]) {
            if (seq !== playRequestSeqRef.current) return;
            try {
              await tryPlaySource(source);
              succeeded = true;
              break;
            } catch (error) {
              lastError = error;
              if (error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) throw error;
            }
          }
          if (!succeeded) throw lastError ?? new Error('Ses kaynağına ulaşılamadı.');
        } else {
          throw new Error('Bu kayıt için oynatılabilir ses dosyası bulunamadı.');
        }

        if (seq !== playRequestSeqRef.current) return;

        setIsPlaying(true);
        setIsBuffering(false);

        setRecentlyPlayed((prev) => {
          const filtered = prev.filter((p) => p.contentId !== item.contentId);
          return [item, ...filtered].slice(0, 30);
        });

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: item.title,
            artist: item.artistName,
            album: item.album,
          });
          navigator.mediaSession.playbackState = 'playing';
        }

        if (!playingOffline && item.downloadAllowed && downloadSettings.autoSaveOnPlay) {
          void triggerDownload(item, false);
        }
      } catch (err) {
        if (seq !== playRequestSeqRef.current) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setIsBuffering(false);
        setIsPlaying(false);
        const message =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Tarayıcı otomatik oynatmayı engelledi. Oynat düğmesine dokunun.'
            : 'Ses akışı başlatılamadı. İnternet bağlantınızı kontrol edin veya çevrimdışı indirilenleri dinleyin.';
        setPlaybackError(message);
        showToast(message);
      }
    },
    [downloadSettings.autoSaveOnPlay, eqSettings, resumePoints, showToast, triggerDownload]
  );

  const playTrack = useCallback(
    async (rawItem: MediaItem, newQueue?: MediaItem[], startFromZero = false) => {
      const item = healMediaItem(rawItem);
      const healedQueue = newQueue?.map(healMediaItem);

      if (healedQueue && healedQueue.length > 0) {
        const idx = healedQueue.findIndex((t) => t.contentId === item.contentId);
        if (idx >= 0) {
          setQueue(healedQueue);
          setCurrentIndex(idx);
        } else {
          setQueue([item, ...healedQueue]);
          setCurrentIndex(0);
        }
      } else {
        const existingIdx = queue.findIndex((t) => t.contentId === item.contentId);
        if (existingIdx >= 0) {
          setCurrentIndex(existingIdx);
        } else {
          setQueue((prev) => [item, ...prev]);
          setCurrentIndex(0);
        }
      }
      await loadAndPlayItem(item, startFromZero);
    },
    [loadAndPlayItem, queue]
  );

  const playQueue = useCallback(
    async (items: MediaItem[], shuffleStart = false) => {
      if (items.length === 0) {
        showToast('Bu listede oynatılacak parça bulunmuyor.');
        return;
      }
      const healed = items.map(healMediaItem);
      setShuffle(shuffleStart);
      const startIndex = shuffleStart ? Math.floor(Math.random() * healed.length) : 0;
      setQueue(healed);
      setCurrentIndex(startIndex);
      await loadAndPlayItem(healed[startIndex], false);
    },
    [loadAndPlayItem, showToast]
  );

  const togglePlay = useCallback(async () => {
    const audioEl = sharedAudioEngine.element;
    if (!currentTrack) {
      if (queue.length > 0) {
        setCurrentIndex(0);
        await loadAndPlayItem(queue[0], false);
      }
      return;
    }
    await sharedAudioEngine.resumeContext();
    if (audioEl.paused) {
      try {
        if (!audioEl.src) {
          await loadAndPlayItem(currentTrack, false);
          return;
        }
        await audioEl.play();
        setIsPlaying(true);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      } catch {
        await loadAndPlayItem(currentTrack, false);
      }
    } else {
      audioEl.pause();
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
  }, [currentTrack, loadAndPlayItem, queue]);

  const nextTrack = useCallback(async () => {
    if (queue.length === 0) return;
    let nextIdx: number;
    if (shuffle && queue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === currentIndex);
    } else if (currentIndex + 1 < queue.length) {
      nextIdx = currentIndex + 1;
    } else if (repeatMode === 'all') {
      nextIdx = 0;
    } else {
      setIsPlaying(false);
      return;
    }
    setCurrentIndex(nextIdx);
    await loadAndPlayItem(queue[nextIdx], true);
  }, [currentIndex, loadAndPlayItem, queue, repeatMode, shuffle]);

  const prevTrack = useCallback(async () => {
    const audioEl = sharedAudioEngine.element;
    if (audioEl.currentTime > 4) {
      audioEl.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (queue.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : repeatMode === 'all' ? queue.length - 1 : 0;
    setCurrentIndex(prevIdx);
    await loadAndPlayItem(queue[prevIdx], true);
  }, [currentIndex, loadAndPlayItem, queue, repeatMode]);

  const seekTo = useCallback((sec: number) => {
    const audioEl = sharedAudioEngine.element;
    if (!Number.isFinite(sec)) return;
    audioEl.currentTime = Math.max(0, Math.min(audioEl.duration || sec, sec));
    setCurrentTime(audioEl.currentTime);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    sharedAudioEngine.setVolume(clamped);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
  }, []);

  // Wire HTMLAudioElement & MediaSession events
  const nextTrackRef = useRef(nextTrack);
  const prevTrackRef = useRef(prevTrack);
  const repeatModeRef = useRef(repeatMode);
  const currentTrackRef = useRef(currentTrack);

  useEffect(() => { nextTrackRef.current = nextTrack; }, [nextTrack]);
  useEffect(() => { prevTrackRef.current = prevTrack; }, [prevTrack]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  useEffect(() => {
    const audioEl = sharedAudioEngine.element;
    let lastResumeSave = 0;

    const onTimeUpdate = () => {
      setCurrentTime(audioEl.currentTime || 0);
      const track = currentTrackRef.current;
      const now = Date.now();
      if (track && audioEl.currentTime > 3 && now - lastResumeSave > 4000) {
        lastResumeSave = now;
        setResumePoints((prev) => ({
          ...prev,
          [track.contentId]: {
            contentId: track.contentId,
            positionSec: Math.floor(audioEl.currentTime),
            updatedAt: now,
          },
        }));
      }
    };
    const onDurationChange = () => setDuration(Number.isFinite(audioEl.duration) ? audioEl.duration : 0);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeatModeRef.current === 'one') {
        audioEl.currentTime = 0;
        void audioEl.play();
      } else {
        void nextTrackRef.current();
      }
    };

    audioEl.addEventListener('timeupdate', onTimeUpdate);
    audioEl.addEventListener('durationchange', onDurationChange);
    audioEl.addEventListener('waiting', onWaiting);
    audioEl.addEventListener('canplay', onCanPlay);
    audioEl.addEventListener('play', onPlay);
    audioEl.addEventListener('pause', onPause);
    audioEl.addEventListener('ended', onEnded);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => void audioEl.play());
      navigator.mediaSession.setActionHandler('pause', () => audioEl.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => void nextTrackRef.current());
      navigator.mediaSession.setActionHandler('previoustrack', () => void prevTrackRef.current());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          audioEl.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }

    return () => {
      audioEl.removeEventListener('timeupdate', onTimeUpdate);
      audioEl.removeEventListener('durationchange', onDurationChange);
      audioEl.removeEventListener('waiting', onWaiting);
      audioEl.removeEventListener('canplay', onCanPlay);
      audioEl.removeEventListener('play', onPlay);
      audioEl.removeEventListener('pause', onPause);
      audioEl.removeEventListener('ended', onEnded);
    };
  }, []);

  // Favorites handlers
  const toggleFavoriteTrack = useCallback(
    (item: MediaItem) => {
      setFavoriteTracks((prev) => {
        const exists = prev.some((t) => t.contentId === item.contentId);
        if (exists) {
          showToast('Favorilerden çıkarıldı.');
          return prev.filter((t) => t.contentId !== item.contentId);
        }
        showToast('Favorilere eklendi.');
        return [healMediaItem(item), ...prev];
      });
    },
    [showToast]
  );

  const toggleFavoriteArtist = useCallback((artistId: string) => {
    setFavoriteArtistIds((prev) =>
      prev.includes(artistId) ? prev.filter((id) => id !== artistId) : [artistId, ...prev]
    );
  }, []);

  const toggleFavoriteSurah = useCallback((surahNumber: number) => {
    setFavoriteSurahNumbers((prev) =>
      prev.includes(surahNumber) ? prev.filter((n) => n !== surahNumber) : [surahNumber, ...prev]
    );
  }, []);

  const toggleFavoriteReciter = useCallback((reciterId: string) => {
    setFavoriteReciterIds((prev) =>
      prev.includes(reciterId) ? prev.filter((id) => id !== reciterId) : [reciterId, ...prev]
    );
  }, []);

  const isTrackFavorite = useCallback(
    (contentId: string) => favoriteTracks.some((t) => t.contentId === contentId),
    [favoriteTracks]
  );

  // Playlists handlers
  const createPlaylist = useCallback(
    (
      name: string,
      description: string,
      initialItems: MediaItem[] = [],
      isQuranPlaylist = false,
      categoryFilterIds?: string[]
    ): Playlist => {
      const pl: Playlist = {
        id: `pl-${Date.now().toString(36)}`,
        name: name.trim() || 'Yeni Çalma Listem',
        description: description.trim() || 'Kişisel çalma listesi',
        createdAt: Date.now(),
        items: initialItems.map(healMediaItem),
        isQuranPlaylist,
        categoryFilterIds,
      };
      setPlaylists((prev) => [pl, ...prev]);
      showToast(`"${pl.name}" listesi oluşturuldu.`);
      return pl;
    },
    [showToast]
  );

  const renamePlaylist = useCallback(
    (playlistId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? { ...p, name: trimmed } : p)));
      showToast('Liste adı güncellendi.');
    },
    [showToast]
  );

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      showToast('Çalma listesi silindi.');
    },
    [showToast]
  );

  const addTrackToPlaylist = useCallback(
    (playlistId: string, item: MediaItem) => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          if (p.items.some((i) => i.contentId === item.contentId)) return p;
          return { ...p, items: [...p.items, healMediaItem(item)] };
        })
      );
      showToast('Parça çalma listesine eklendi.');
    },
    [showToast]
  );

  const removeTrackFromPlaylist = useCallback((playlistId: string, contentId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, items: p.items.filter((i) => i.contentId !== contentId) } : p))
    );
  }, []);

  const moveTrackInPlaylist = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        if (toIndex < 0 || toIndex >= p.items.length) return p;
        const nextItems = [...p.items];
        const [moved] = nextItems.splice(fromIndex, 1);
        nextItems.splice(toIndex, 0, moved);
        return { ...p, items: nextItems };
      })
    );
  }, []);

  // Equalizer handlers
  const updateEqSettings = useCallback((patch: Partial<EqualizerSettings>) => {
    setEqSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyEqPreset = useCallback((preset: EqPresetId) => {
    const def = EQ_PRESETS[preset];
    setEqSettings((prev) => ({
      ...prev,
      enabled: true,
      preset,
      bandsDb: [...def.bandsDb],
      bassBoostDb: def.bassBoostDb,
      trebleBoostDb: def.trebleBoostDb,
    }));
  }, []);

  const setEqBand = useCallback((index: number, db: number) => {
    setEqSettings((prev) => {
      const nextBands = [...prev.bandsDb] as [number, number, number, number, number];
      nextBands[index] = Math.max(-12, Math.min(12, db));
      return { ...prev, enabled: true, preset: 'custom', bandsDb: nextBands };
    });
  }, []);

  const value: AutoMusicContextValue = {
    screen,
    screenHistory,
    navigate,
    goBack,
    carMode,
    setCarMode,
    categories,
    addCategory,
    providerStatus,
    catalogTracksByCategory,
    curatedPlaylistsByCategory,
    featuredPlaylistsSummary,
    catalogNotices,
    loadingCategories,
    loadCategoryTracks,
    importLocalAudioFiles,
    selectedReciterId,
    setSelectedReciterId,
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    isBuffering,
    isPlayingOfflineFile,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    playbackError,
    playTrack,
    playQueue,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    favoriteTracks,
    favoriteArtistIds,
    favoriteSurahNumbers,
    favoriteReciterIds,
    toggleFavoriteTrack,
    toggleFavoriteArtist,
    toggleFavoriteSurah,
    toggleFavoriteReciter,
    isTrackFavorite,
    playlists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    moveTrackInPlaylist,
    recentlyPlayed,
    resumePoints,
    downloadSettings,
    updateDownloadSettings,
    downloads,
    downloadProgressMap,
    storageEstimate,
    isOfflineDownloaded,
    triggerDownload,
    removeDownload,
    clearAllDownloads,
    refreshStorageStats,
    eqSettings,
    isEqSupported: sharedAudioEngine.isDspSupported,
    updateEqSettings,
    applyEqPreset,
    setEqBand,
    toastMessage,
    showToast,
  };

  return <AutoMusicContext.Provider value={value}>{children}</AutoMusicContext.Provider>;
}

export function useAutoMusic(): AutoMusicContextValue {
  const ctx = useContext(AutoMusicContext);
  if (!ctx) throw new Error('useAutoMusic must be used inside AutoMusicProvider');
  return ctx;
}
