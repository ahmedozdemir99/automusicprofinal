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
import {
  EQ_PRESETS,
  normalizeEqualizerSettings,
  sharedAudioEngine,
} from '../services/audioEngine';
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
  CustomEqProfile,
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
  SleepTimerMode,
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
  PLAY_COUNTS: 'amp_play_counts_v1',
  SEARCH_HISTORY: 'amp_search_history_v1',
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

const DEFAULT_EQ_SETTINGS: EqualizerSettings = normalizeEqualizerSettings({
  enabled: true,
  preset: 'car',
  bandsDb: [...EQ_PRESETS.car.bandsDb],
  preampDb: EQ_PRESETS.car.preampDb,
  bassBoostDb: EQ_PRESETS.car.bassBoostDb,
  trebleBoostDb: EQ_PRESETS.car.trebleBoostDb,
  volumeLeveler: true,
  crossfadeSec: 0,
  customProfiles: [],
});

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
    description: 'Seçkin kârilerden favori sureler',
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

function mergeDefaultAndSavedCategories(saved: MusicCategory[]): MusicCategory[] {
  const map = new Map<string, MusicCategory>();
  for (const def of DEFAULT_CATEGORIES) {
    map.set(def.id, def);
  }
  for (const cat of saved) {
    if (!cat?.id) continue;
    if (cat.isCustom || !map.has(cat.id)) {
      map.set(cat.id, { ...cat, motif: normalizeMotif(cat.motif as unknown as string) });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
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
  discoverMoreCategoryTracks: (categoryId: string) => Promise<number>;
  importLocalAudioFiles: (files: FileList, categoryId: string, artistName?: string) => Promise<number>;

  // Quran
  selectedReciterId: string;
  setSelectedReciterId: (id: string) => void;

  // Playback & Queue
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
  seekBy: (deltaSec: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  jumpToQueueIndex: (idx: number) => Promise<void>;
  removeFromQueue: (idx: number) => void;
  moveQueueItem: (fromIdx: number, toIdx: number) => void;
  addToQueueNext: (item: MediaItem) => void;

  // Sleep Timer
  sleepTimerMode: SleepTimerMode;
  sleepTimerRemainingSec: number | null;
  setSleepTimer: (mode: SleepTimerMode) => void;

  // Favorites, Playlists, Recent, Most Played, Resume, Search History
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
  playCounts: Record<string, number>;
  resumePoints: Record<string, PlaybackResumePoint>;
  searchHistory: string[];
  addSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;

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
  completeMissingDownloads: () => Promise<void>;
  downloadCategoryTracks: (categoryId: string) => Promise<void>;

  // Equalizer (10-Band DSP + Custom Profiles)
  eqSettings: EqualizerSettings;
  isEqSupported: boolean;
  updateEqSettings: (patch: Partial<EqualizerSettings>) => void;
  applyEqPreset: (preset: EqPresetId) => void;
  setEqBand: (index: number, db: number) => void;
  saveCustomEqProfile: (name: string) => void;
  deleteCustomEqProfile: (id: string) => void;
  applyCustomEqProfile: (id: string) => void;

  // Backup & Restore
  exportUserBackupJson: () => string;
  importUserBackupJson: (jsonText: string) => { ok: boolean; message: string };

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

  // Categories & Database Catalog (always ensures all 18 defaults including Fantezi are present)
  const [categories, setCategories] = useState<MusicCategory[]>(() => {
    const saved = readJson<MusicCategory[]>(STORAGE_KEYS.CATEGORIES, []);
    return mergeDefaultAndSavedCategories(saved);
  });

  const [providerStatus, setProviderStatus] = useState<CatalogProviderStatus>({
    databaseConnected: true,
    quranApiConnected: true,
    internetArchiveConnected: true,
    audiusConnected: true,
    wikimediaConnected: true,
    jamendoConfigured: false,
    localArchiveReady: true,
  });

  const [catalogTracksByCategory, setCatalogTracksByCategory] = useState<Record<string, MediaItem[]>>(() => {
    const raw = readJson<Record<string, MediaItem[]>>(STORAGE_KEYS.LOADED_CATALOG, {});
    const healed: Record<string, MediaItem[]> = {};
    for (const [k, list] of Object.entries(raw)) {
      if (Array.isArray(list)) healed[k] = list.map(healMediaItem);
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

  // Sleep Timer
  const [sleepTimerMode, setSleepTimerMode] = useState<SleepTimerMode>('off');
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number | null>(null);

  // Favorites, Playlists, Recent, Most Played, Resume, Search History
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
      items: (pl.items ?? []).map(healMediaItem),
    }))
  );
  const [recentlyPlayed, setRecentlyPlayed] = useState<MediaItem[]>(() =>
    readJson<MediaItem[]>(STORAGE_KEYS.RECENTLY_PLAYED, []).map(healMediaItem)
  );
  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() =>
    readJson<Record<string, number>>(STORAGE_KEYS.PLAY_COUNTS, {})
  );
  const [resumePoints, setResumePoints] = useState<Record<string, PlaybackResumePoint>>(() =>
    readJson<Record<string, PlaybackResumePoint>>(STORAGE_KEYS.RESUME_POINTS, {})
  );
  const [searchHistory, setSearchHistory] = useState<string[]>(() =>
    readJson<string[]>(STORAGE_KEYS.SEARCH_HISTORY, [])
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

  // Equalizer (auto-migrates older 5-band saved configs to 10-band cleanly)
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(() =>
    normalizeEqualizerSettings(readJson<Partial<EqualizerSettings>>(STORAGE_KEYS.EQ_SETTINGS, DEFAULT_EQ_SETTINGS))
  );

  // Toast & internal refs
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);
  const activeDownloadIdsRef = useRef<Set<string>>(new Set());
  const playRequestSeqRef = useRef<number>(0);
  // Circuit breaker: remembers dead URLs for 10 minutes so we don't retry broken links endlessly
  const failedUrlsRef = useRef<Map<string, number>>(new Map());
  const categoryDiscoveryOffsetsRef = useRef<Record<string, number>>({});
  const sleepTimerModeRef = useRef<SleepTimerMode>('off');
  const volumeRef = useRef<number>(0.9);

  useEffect(() => { sleepTimerModeRef.current = sleepTimerMode; }, [sleepTimerMode]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3400);
  }, []);

  // Persist user data safely
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_TRACKS, JSON.stringify(favoriteTracks)); }, [favoriteTracks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_ARTISTS, JSON.stringify(favoriteArtistIds)); }, [favoriteArtistIds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_SURAHS, JSON.stringify(favoriteSurahNumbers)); }, [favoriteSurahNumbers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITE_RECITERS, JSON.stringify(favoriteReciterIds)); }, [favoriteReciterIds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(recentlyPlayed)); }, [recentlyPlayed]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PLAY_COUNTS, JSON.stringify(playCounts)); }, [playCounts]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RESUME_POINTS, JSON.stringify(resumePoints)); }, [resumePoints]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DOWNLOAD_SETTINGS, JSON.stringify(downloadSettings)); }, [downloadSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EQ_SETTINGS, JSON.stringify(eqSettings)); }, [eqSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SELECTED_RECITER, JSON.stringify(selectedReciterId)); }, [selectedReciterId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory)); }, [searchHistory]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOADED_CATALOG, JSON.stringify(catalogTracksByCategory));
    } catch {
      // Ignore quota exceeded on catalog cache
    }
  }, [catalogTracksByCategory]);

  // Initial load: Provider status + DB Categories & Curated Playlists + IndexedDB offline archive records
  const refreshStorageStats = useCallback(async () => {
    try {
      const records = await listOfflineRecords();
      setDownloads(records.map((r) => ({ ...r, item: healMediaItem(r.item) })));
      const est = await getStorageEstimate(records, downloadSettings.minFreeSpaceGb);
      setStorageEstimate(est);
    } catch {
      // IndexedDB unavailable
    }
  }, [downloadSettings.minFreeSpaceGb]);

  useEffect(() => {
    refreshStorageStats();
    fetchCatalogProviderStatus().then(setProviderStatus);

    openMusicRepository.fetchCategoriesAndPlaylists().then((payload) => {
      if (!payload) return;
      if (payload.categories.length >= 17) {
        setCategories((prev) => mergeDefaultAndSavedCategories([...payload.categories, ...prev.filter((c) => c.isCustom)]));
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

  // Apply EQ settings whenever changed (also lazily engages Web Audio if user adjusts EQ while playing)
  useEffect(() => {
    sharedAudioEngine.applyEqualizer(eqSettings);
    if (eqSettings.enabled && isPlaying && sharedAudioEngine.element.src) {
      void sharedAudioEngine.resumeContext(sharedAudioEngine.element.src).then((ok) => {
        if (ok) sharedAudioEngine.applyEqualizer(eqSettings);
      });
    }
  }, [eqSettings, isPlaying]);

  // Sleep Timer countdown interval
  useEffect(() => {
    if (sleepTimerMode === 'off' || sleepTimerMode === 'end_of_track') {
      return;
    }
    const timer = window.setInterval(() => {
      setSleepTimerRemainingSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          window.clearInterval(timer);
          // Smooth 1.2s fade-out before pausing
          const audioEl = sharedAudioEngine.element;
          sharedAudioEngine.fadeVolume(audioEl.volume, 0, 1200);
          window.setTimeout(() => {
            audioEl.pause();
            sharedAudioEngine.setVolume(volumeRef.current);
            setIsPlaying(false);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            showToast('Uyku zamanlayıcısı tamamlandı. Oynatma duraklatıldı.');
          }, 1250);
          setSleepTimerMode('off');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sleepTimerMode, showToast]);

  const setSleepTimer = useCallback(
    (mode: SleepTimerMode) => {
      setSleepTimerMode(mode);
      if (mode === 'off') {
        setSleepTimerRemainingSec(null);
        showToast('Uyku zamanlayıcısı kapatıldı.');
      } else if (mode === 'end_of_track') {
        setSleepTimerRemainingSec(null);
        showToast('Uyku zamanlayıcısı: Mevcut parça bitince duracak.');
      } else {
        const mins = Number.parseInt(mode, 10);
        setSleepTimerRemainingSec(mins * 60);
        showToast(`Uyku zamanlayıcısı ${mins} dakika olarak ayarlandı.`);
      }
    },
    [showToast]
  );

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

  // Category creation (extensible + persisted in DB & localStorage)
  const addCategory = useCallback(
    (name: string, subtitle: string, language: string, genre: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      void openMusicRepository.createCategory(trimmed, subtitle, language, genre).then((dbCat) => {
        if (dbCat) {
          setCategories((prev) => [...prev.filter((c) => c.id !== dbCat.id), dbCat]);
          showToast(`"${dbCat.name}" kategorisi eklendi.`);
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

  // Load curated playlists & real tracks from DB + local phone files
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

  // Live online discovery for additional category tracks from open archives
  const discoverMoreCategoryTracks = useCallback(
    async (categoryId: string): Promise<number> => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category || category.isQuran) return 0;

      const currentOffset = categoryDiscoveryOffsetsRef.current[categoryId] ?? 0;
      const { tracks: discovered, notice } = await openMusicRepository.discoverMoreCategoryTracks(
        category,
        currentOffset
      );
      categoryDiscoveryOffsetsRef.current[categoryId] = currentOffset + 8;

      if (discovered.length === 0) {
        showToast(notice || 'Bu kategori için şu anda yeni açık arşiv kaydı bulunamadı.');
        return 0;
      }

      let addedCount = 0;
      setCatalogTracksByCategory((prev) => {
        const existing = prev[categoryId] ?? [];
        const seenIds = new Set(existing.map((t) => t.contentId));
        const seenKeys = new Set(
          existing.map(
            (t) => `${t.artistName.toLocaleLowerCase('tr-TR')}::${t.title.toLocaleLowerCase('tr-TR')}`
          )
        );
        const fresh: MediaItem[] = [];
        for (const t of discovered) {
          const key = `${t.artistName.toLocaleLowerCase('tr-TR')}::${t.title.toLocaleLowerCase('tr-TR')}`;
          if (!t.contentId || seenIds.has(t.contentId) || seenKeys.has(key)) continue;
          seenIds.add(t.contentId);
          seenKeys.add(key);
          fresh.push(t);
        }
        addedCount = fresh.length;
        if (addedCount === 0) return prev;
        return { ...prev, [categoryId]: [...existing, ...fresh] };
      });

      if (addedCount > 0) {
        showToast(`${category.name} kategorisine ${addedCount} yeni parça eklendi.`);
      } else {
        showToast('Yeni sayfada eklenmemiş parça bulunamadı. Tekrar deneyerek sonraki sayfaya geçebilirsiniz.');
      }
      return addedCount;
    },
    [categories, showToast]
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

      let success = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          let response = await fetch(getProxiedAudioUrl(item.streamUrl));
          if (!response.ok) {
            const fallbackUrl = getFallbackStreamUrl(item);
            if (fallbackUrl) {
              response = await fetch(getProxiedAudioUrl(fallbackUrl));
            }
          }
          if (!response.ok && item.streamUrl) {
            response = await fetch(item.streamUrl);
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

          success = true;
          break;
        } catch {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      if (!success) {
        setDownloadProgressMap((prev) => ({
          ...prev,
          [item.contentId]: {
            contentId: item.contentId,
            title: item.title,
            progress: 0,
            status: 'error',
            errorMessage: 'İndirilemedi. Tekrar deneyebilirsiniz.',
          },
        }));
      }
      activeDownloadIdsRef.current.delete(item.contentId);
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

  const completeMissingDownloads = useCallback(async () => {
    const pool = new Map<string, MediaItem>();
    for (const t of favoriteTracks) pool.set(t.contentId, t);
    for (const pl of playlists) {
      for (const t of pl.items) pool.set(t.contentId, t);
    }
    for (const t of recentlyPlayed) pool.set(t.contentId, t);

    for (const r of RECITERS) {
      for (const s of SURAHS) {
        const item = buildSurahMediaItem(s, r);
        pool.set(item.contentId, item);
      }
    }

    const itemsToCheck = Array.from(pool.values());
    let count = 0;
    showToast('Eksik ve inmeyen ses dosyaları taranıyor ve indiriliyor...');

    for (const item of itemsToCheck) {
      if (isOfflineDownloaded(item.contentId)) continue;
      if (activeDownloadIdsRef.current.has(item.contentId)) continue;
      try {
        await triggerDownload(item, false);
        count++;
      } catch {
        // continue
      }
    }
    showToast(`Eksik dosyaları tamamlama tamamlandı. ${count} yeni kayıt arşive eklendi.`);
  }, [favoriteTracks, playlists, recentlyPlayed, isOfflineDownloaded, triggerDownload, showToast]);

  // Batch download all downloadable tracks in a category (with concurrency 2 + storage/Wi-Fi safety)
  const downloadCategoryTracks = useCallback(
    async (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId);
      let pool: MediaItem[] = [];
      if (category?.isQuran) {
        pool = quranRepository.getSurahTracksForReciter(selectedReciterId);
      } else {
        pool = catalogTracksByCategory[categoryId] ?? [];
        if (pool.length === 0) {
          pool = await loadCategoryTracks(categoryId, false);
        }
      }

      const downloadable = pool.filter(
        (item) =>
          item.downloadAllowed &&
          !item.isLocalFile &&
          Boolean(item.streamUrl) &&
          !isOfflineDownloaded(item.contentId) &&
          !activeDownloadIdsRef.current.has(item.contentId)
      );

      if (downloadable.length === 0) {
        showToast('Bu kategorideki indirilebilir tüm parçalar zaten çevrimdışı arşivinizde.');
        return;
      }

      const navConn = (navigator as unknown as { connection?: { type?: string } }).connection;
      if (downloadSettings.wifiOnly && navConn?.type === 'cellular') {
        showToast('Yalnızca Wi-Fi ayarı açık. İndirme Wi-Fi bağlantısı bekliyor.');
        return;
      }

      const est = await getStorageEstimate(downloads, downloadSettings.minFreeSpaceGb);
      setStorageEstimate(est);
      if (est.isBelowTwoGbThreshold) {
        showToast(`Boş depolama alanı ${downloadSettings.minFreeSpaceGb} GB altında. İndirme durduruldu.`);
        return;
      }

      const catTitle = category?.name ?? 'Kategori';
      showToast(`${catTitle}: ${downloadable.length} parça çevrimdışı arşive indiriliyor...`);

      let nextIndex = 0;
      let completedCount = 0;
      const concurrency = 2;

      const worker = async () => {
        while (nextIndex < downloadable.length) {
          const idx = nextIndex++;
          const item = downloadable[idx];
          try {
            await triggerDownload(item, false);
            if (await hasOfflineAudio(item.contentId)) {
              completedCount++;
            }
          } catch {
            // Continue with next track
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(concurrency, downloadable.length) }, () => worker()));
      await refreshStorageStats();
      showToast(`${catTitle}: ${completedCount}/${downloadable.length} parça çevrimdışı arşive kaydedildi.`);
    },
    [
      categories,
      catalogTracksByCategory,
      downloadSettings.minFreeSpaceGb,
      downloadSettings.wifiOnly,
      downloads,
      isOfflineDownloaded,
      loadCategoryTracks,
      refreshStorageStats,
      selectedReciterId,
      showToast,
      triggerDownload,
    ]
  );

  const updateDownloadSettings = useCallback((patch: Partial<DownloadSettings>) => {
    setDownloadSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.wifiOnly === true) next.allowMobileData = false;
      if (patch.allowMobileData === true) next.wifiOnly = false;
      return next;
    });
  }, []);

  // Resilient Real Audio Playback Core
  // Offline First -> Primary Proxy -> Fallback Mirror Proxy -> Alternative Provider Auto-Search -> Clear Real Error Cause
  const loadAndPlayItem = useCallback(
    async (rawItem: MediaItem, startFromZero = false) => {
      const item = healMediaItem(rawItem);
      const seq = ++playRequestSeqRef.current;

      setPlaybackError(null);
      setIsBuffering(true);

      const audioEl = sharedAudioEngine.element;

      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }

      const isCircuitBroken = (url: string): boolean => {
        const failedAt = failedUrlsRef.current.get(url);
        if (!failedAt) return false;
        if (Date.now() - failedAt > 10 * 60 * 1000) {
          failedUrlsRef.current.delete(url);
          return false;
        }
        return true;
      };

      const tryPlaySource = async (srcUrl: string): Promise<void> => {
        audioEl.pause();
        sharedAudioEngine.prepareForSource(srcUrl);
        audioEl.src = srcUrl;
        audioEl.load();

        // Engage 10-band Web Audio DSP safely ONLY for CORS-safe URLs when EQ is enabled
        if (eqSettings.enabled && sharedAudioEngine.isCorsSafeUrl(srcUrl)) {
          const dspReady = await sharedAudioEngine.resumeContext(srcUrl);
          if (dspReady) {
            sharedAudioEngine.applyEqualizer(eqSettings);
          }
        }

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

        // Crossfade fade-in (strictly disabled for Kur'an-ı Kerim)
        const crossfadeMs =
          item.categoryId !== 'kuran' && (eqSettings.crossfadeSec ?? 0) > 0
            ? Math.round((eqSettings.crossfadeSec ?? 0) * 1000)
            : 0;
        if (crossfadeMs > 0) {
          audioEl.volume = 0.05;
        } else {
          audioEl.volume = volumeRef.current;
        }

        // Buffer pre-filling logic: ensure safe buffer cushion ahead before issuing play()
        if (!srcUrl.startsWith('blob:')) {
          await sharedAudioEngine.waitForBufferRefill(1.5, 3500);
        }

        // 12-second playback start timeout so stalled servers never hang UI
        let timeoutId: number | null = null;
        try {
          await Promise.race([
            audioEl.play(),
            new Promise<never>((_, reject) => {
              timeoutId = window.setTimeout(() => {
                reject(new Error('PLAYBACK_TIMEOUT'));
              }, 12000);
            }),
          ]);
        } finally {
          if (timeoutId !== null) window.clearTimeout(timeoutId);
        }

        if (crossfadeMs > 0) {
          sharedAudioEngine.fadeVolume(0.05, volumeRef.current, Math.min(crossfadeMs, 3500));
        }
      };

      const diagnoseProxyFailure = async (proxiedUrl: string): Promise<string | null> => {
        if (!proxiedUrl.startsWith('/api/audio/proxy')) return null;
        try {
          const probe = await fetch(proxiedUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
          if (probe.ok || probe.status === 206) return null;
          if (probe.status === 403) return 'Ses kaynağı erişimi kısıtladı (HTTP 403).';
          if (probe.status === 404) return 'Ses dosyası kaynak sunucuda bulunamadı (HTTP 404).';
          if (probe.status === 429) return 'Sağlayıcı istek sınırına ulaştı (HTTP 429). Kısa süre sonra deneyin.';
          if (probe.status === 504) return 'Ses kaynağı yanıt vermedi (zaman aşımı).';
          return `Ses akışı sunucudan alınamadı (HTTP ${probe.status}).`;
        } catch {
          return null;
        }
      };

      try {
        const offlineBlob = await getOfflineAudioBlob(item.contentId);
        if (seq !== playRequestSeqRef.current) return;

        let playingOffline = false;
        let diagnosedReason: string | null = null;

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
          const primaryProxy = getProxiedAudioUrl(item.streamUrl);
          const candidateSources = [
            primaryProxy,
            ...(isQuran && !sharedAudioEngine.isDspActive ? [item.streamUrl] : []),
            ...(fallbackUrl ? [getProxiedAudioUrl(fallbackUrl)] : []),
            ...(fallbackUrl && !sharedAudioEngine.isDspActive ? [fallbackUrl] : []),
          ].filter((u, idx, arr) => arr.indexOf(u) === idx);

          // Skip circuit-broken URLs unless all are broken (then try primary once)
          const viableSources = candidateSources.filter((u) => !isCircuitBroken(u));
          const sourcesToTry = viableSources.length > 0 ? viableSources : [primaryProxy];

          let lastError: unknown;
          let succeeded = false;

          for (const source of sourcesToTry) {
            if (seq !== playRequestSeqRef.current) return;
            try {
              await tryPlaySource(source);
              failedUrlsRef.current.delete(source);
              succeeded = true;
              break;
            } catch (error) {
              lastError = error;
              if (error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
                throw error;
              }
              failedUrlsRef.current.set(source, Date.now());
            }
          }

          // Automatic alternative provider search if primary music stream failed
          if (!succeeded && !isQuran && !item.isLocalFile && navigator.onLine) {
            try {
              const altQuery = `${item.artistName} ${item.title}`.trim();
              const altRes = await openMusicRepository.searchTracks(altQuery);
              const altTrack = altRes.tracks.find(
                (t) =>
                  t.streamUrl &&
                  t.streamUrl !== item.streamUrl &&
                  !isCircuitBroken(getProxiedAudioUrl(t.streamUrl))
              );
              if (altTrack && seq === playRequestSeqRef.current) {
                const altProxy = getProxiedAudioUrl(altTrack.streamUrl);
                try {
                  await tryPlaySource(altProxy);
                  succeeded = true;
                  showToast('Alternatif ücretsiz ses kaynağından oynatılıyor.');
                } catch {
                  failedUrlsRef.current.set(altProxy, Date.now());
                }
              }
            } catch {
              // Ignore fallback search failure
            }
          }

          if (!succeeded) {
            diagnosedReason = await diagnoseProxyFailure(primaryProxy);
            throw lastError ?? new Error(diagnosedReason || 'Ses kaynağına ulaşılamadı.');
          }
        } else {
          throw new Error('NO_AUDIO_SOURCE');
        }

        if (seq !== playRequestSeqRef.current) return;

        setIsPlaying(true);
        setIsBuffering(false);

        setRecentlyPlayed((prev) => {
          const filtered = prev.filter((p) => p.contentId !== item.contentId);
          return [item, ...filtered].slice(0, 40);
        });

        setPlayCounts((prev) => ({
          ...prev,
          [item.contentId]: (prev[item.contentId] ?? 0) + 1,
        }));

        if ('mediaSession' in navigator) {
          const artwork: MediaImage[] = item.coverUrl
            ? [
                { src: item.coverUrl, sizes: '256x256', type: 'image/jpeg' },
                { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
              ]
            : [{ src: '/pwa-512.png', sizes: '512x512', type: 'image/png' }];
          navigator.mediaSession.metadata = new MediaMetadata({
            title: item.title,
            artist: item.artistName,
            album: item.album,
            artwork,
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

        let message: string;
        if (!navigator.onLine) {
          message = 'İnternet bağlantısı yok. Çevrimdışı arşivdeki indirilen kayıtları dinleyebilirsiniz.';
        } else if (err instanceof Error && err.name === 'NotAllowedError') {
          message = 'Tarayıcı otomatik oynatmayı engelledi. Devam etmek için Oynat düğmesine dokunun.';
        } else if (err instanceof Error && err.message === 'PLAYBACK_TIMEOUT') {
          message = 'Ses akışı zaman aşımına uğradı. Sağlayıcı şu an yavaş yanıt veriyor.';
        } else if (err instanceof Error && err.message === 'NO_AUDIO_SOURCE') {
          message = 'Bu kayıt için oynatılabilir ses dosyası bulunamadı.';
        } else if (err instanceof Error && err.message.startsWith('Ses ')) {
          message = err.message;
        } else {
          message = 'Ses akışı başlatılamadı. Kaynak geçici olarak erişilemiyor veya desteklenmeyen formatta.';
        }
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
    if (eqSettings.enabled && audioEl.src) {
      await sharedAudioEngine.resumeContext(audioEl.src);
    }
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
  }, [currentTrack, eqSettings.enabled, loadAndPlayItem, queue]);

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
    const clamped = Math.max(0, Math.min(Number.isFinite(audioEl.duration) ? audioEl.duration : sec, sec));
    audioEl.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const seekBy = useCallback((deltaSec: number) => {
    const audioEl = sharedAudioEngine.element;
    const dur = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
    const nextPos = Math.max(0, dur > 0 ? Math.min(dur, audioEl.currentTime + deltaSec) : Math.max(0, audioEl.currentTime + deltaSec));
    audioEl.currentTime = nextPos;
    setCurrentTime(nextPos);
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

  // Queue management actions
  const jumpToQueueIndex = useCallback(
    async (idx: number) => {
      if (idx < 0 || idx >= queue.length) return;
      setCurrentIndex(idx);
      await loadAndPlayItem(queue[idx], true);
    },
    [loadAndPlayItem, queue]
  );

  const removeFromQueue = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= queue.length || idx === currentIndex) return;
      setQueue((prev) => prev.filter((_, i) => i !== idx));
      if (idx < currentIndex) {
        setCurrentIndex((ci) => Math.max(0, ci - 1));
      }
    },
    [currentIndex, queue.length]
  );

  const moveQueueItem = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= queue.length || toIdx >= queue.length) return;
      setQueue((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(fromIdx, 1);
        copy.splice(toIdx, 0, moved);
        return copy;
      });
      setCurrentIndex((ci) => {
        if (ci === fromIdx) return toIdx;
        if (fromIdx < ci && toIdx >= ci) return ci - 1;
        if (fromIdx > ci && toIdx <= ci) return ci + 1;
        return ci;
      });
    },
    [queue.length]
  );

  const addToQueueNext = useCallback(
    (rawItem: MediaItem) => {
      const item = healMediaItem(rawItem);
      setQueue((prev) => {
        const filtered = prev.filter((t) => t.contentId !== item.contentId);
        const insertAt = Math.min(filtered.length, Math.max(0, currentIndex + 1));
        filtered.splice(insertAt, 0, item);
        return filtered;
      });
      showToast(`"${item.title}" sıradaki parça olarak eklendi.`);
    },
    [currentIndex, showToast]
  );

  // Wire HTMLAudioElement & Full MediaSession API events
  const nextTrackRef = useRef(nextTrack);
  const prevTrackRef = useRef(prevTrack);
  const seekByRef = useRef(seekBy);
  const repeatModeRef = useRef(repeatMode);
  const currentTrackRef = useRef(currentTrack);

  useEffect(() => { nextTrackRef.current = nextTrack; }, [nextTrack]);
  useEffect(() => { prevTrackRef.current = prevTrack; }, [prevTrack]);
  useEffect(() => { seekByRef.current = seekBy; }, [seekBy]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  useEffect(() => {
    const audioEl = sharedAudioEngine.element;
    let lastResumeSave = 0;

    const syncPositionState = () => {
      if ('mediaSession' in navigator && typeof navigator.mediaSession.setPositionState === 'function') {
        const dur = Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : 0;
        if (dur > 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: dur,
              playbackRate: audioEl.playbackRate || 1,
              position: Math.min(dur, Math.max(0, audioEl.currentTime || 0)),
            });
          } catch {
            // Ignore unsupported MediaSession position state
          }
        }
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audioEl.currentTime || 0);
      const track = currentTrackRef.current;
      const now = Date.now();
      if (track && audioEl.currentTime > 3 && now - lastResumeSave > 4000) {
        lastResumeSave = now;
        syncPositionState();
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

    const onDurationChange = () => {
      setDuration(Number.isFinite(audioEl.duration) ? audioEl.duration : 0);
      syncPositionState();
    };
    const onWaiting = () => {
      setIsBuffering(true);
      sharedAudioEngine.handlePlaybackStall(2.5);
    };
    const onStalled = () => {
      if (!audioEl.paused) {
        sharedAudioEngine.handlePlaybackStall(2.5);
      }
    };
    const onCanPlay = () => setIsBuffering(false);
    const onCanPlayThrough = () => setIsBuffering(false);
    const onPlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      syncPositionState();
    };
    const onPause = () => {
      sharedAudioEngine.resetBufferingState();
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      syncPositionState();
    };
    const onEnded = () => {
      sharedAudioEngine.resetBufferingState();
      if (sleepTimerModeRef.current === 'end_of_track') {
        setSleepTimerMode('off');
        setSleepTimerRemainingSec(null);
        setIsPlaying(false);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        showToast('Uyku zamanlayıcısı: Parça tamamlandı, oynatma durduruldu.');
        return;
      }
      if (repeatModeRef.current === 'one') {
        audioEl.currentTime = 0;
        void audioEl.play();
      } else {
        void nextTrackRef.current();
      }
    };

    // Buffer state sync from audio engine
    sharedAudioEngine.setBufferingListener((buffering) => {
      setIsBuffering(buffering);
    });

    audioEl.addEventListener('timeupdate', onTimeUpdate);
    audioEl.addEventListener('durationchange', onDurationChange);
    audioEl.addEventListener('waiting', onWaiting);
    audioEl.addEventListener('stalled', onStalled);
    audioEl.addEventListener('canplay', onCanPlay);
    audioEl.addEventListener('canplaythrough', onCanPlayThrough);
    audioEl.addEventListener('play', onPlay);
    audioEl.addEventListener('pause', onPause);
    audioEl.addEventListener('ended', onEnded);

    if ('mediaSession' in navigator) {
      const safeSetHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Action not supported on this browser
        }
      };
      safeSetHandler('play', () => void audioEl.play());
      safeSetHandler('pause', () => {
        sharedAudioEngine.resetBufferingState();
        audioEl.pause();
      });
      safeSetHandler('stop', () => {
        sharedAudioEngine.resetBufferingState();
        audioEl.pause();
        audioEl.currentTime = 0;
        setCurrentTime(0);
      });
      safeSetHandler('nexttrack', () => void nextTrackRef.current());
      safeSetHandler('previoustrack', () => void prevTrackRef.current());
      safeSetHandler('seekbackward', (details) => seekByRef.current(-(details.seekOffset ?? 15)));
      safeSetHandler('seekforward', (details) => seekByRef.current(details.seekOffset ?? 15));
      safeSetHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          audioEl.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
          syncPositionState();
        }
      });
    }

    return () => {
      sharedAudioEngine.setBufferingListener(null);
      audioEl.removeEventListener('timeupdate', onTimeUpdate);
      audioEl.removeEventListener('durationchange', onDurationChange);
      audioEl.removeEventListener('waiting', onWaiting);
      audioEl.removeEventListener('stalled', onStalled);
      audioEl.removeEventListener('canplay', onCanPlay);
      audioEl.removeEventListener('canplaythrough', onCanPlayThrough);
      audioEl.removeEventListener('play', onPlay);
      audioEl.removeEventListener('pause', onPause);
      audioEl.removeEventListener('ended', onEnded);
    };
  }, [showToast]);

  // Search history handlers
  const addSearchHistory = useCallback((term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setSearchHistory((prev) => [clean, ...prev.filter((x) => x.toLocaleLowerCase('tr-TR') !== clean.toLocaleLowerCase('tr-TR'))].slice(0, 12));
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    showToast('Arama geçmişi temizlendi.');
  }, [showToast]);

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

  // Equalizer handlers (10-band + Custom Profiles)
  const updateEqSettings = useCallback((patch: Partial<EqualizerSettings>) => {
    setEqSettings((prev) => normalizeEqualizerSettings({ ...prev, ...patch }));
  }, []);

  const applyEqPreset = useCallback((preset: EqPresetId) => {
    const def = EQ_PRESETS[preset] ?? EQ_PRESETS.flat;
    setEqSettings((prev) =>
      normalizeEqualizerSettings({
        ...prev,
        enabled: true,
        preset,
        bandsDb: [...def.bandsDb],
        preampDb: def.preampDb,
        bassBoostDb: def.bassBoostDb,
        trebleBoostDb: def.trebleBoostDb,
      })
    );
  }, []);

  const setEqBand = useCallback((index: number, db: number) => {
    setEqSettings((prev) => {
      const nextBands = [...prev.bandsDb];
      while (nextBands.length < 10) nextBands.push(0);
      nextBands[index] = Math.max(-12, Math.min(12, db));
      return { ...prev, enabled: true, preset: 'custom', bandsDb: nextBands };
    });
  }, []);

  const saveCustomEqProfile = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 40);
      if (!trimmed) return;
      const profile: CustomEqProfile = {
        id: `eq-${Date.now().toString(36)}`,
        name: trimmed,
        bandsDb: [...eqSettings.bandsDb],
        preampDb: eqSettings.preampDb,
        bassBoostDb: eqSettings.bassBoostDb,
        trebleBoostDb: eqSettings.trebleBoostDb,
        volumeLeveler: eqSettings.volumeLeveler,
      };
      setEqSettings((prev) => ({
        ...prev,
        customProfiles: [profile, ...(prev.customProfiles ?? []).filter((p) => p.name !== trimmed)].slice(0, 12),
      }));
      showToast(`"${trimmed}" ekolayzır profili kaydedildi.`);
    },
    [eqSettings, showToast]
  );

  const deleteCustomEqProfile = useCallback(
    (id: string) => {
      setEqSettings((prev) => ({
        ...prev,
        customProfiles: (prev.customProfiles ?? []).filter((p) => p.id !== id),
      }));
      showToast('Özel ekolayzır profili silindi.');
    },
    [showToast]
  );

  const applyCustomEqProfile = useCallback(
    (id: string) => {
      const prof = (eqSettings.customProfiles ?? []).find((p) => p.id === id);
      if (!prof) return;
      setEqSettings((prev) =>
        normalizeEqualizerSettings({
          ...prev,
          enabled: true,
          preset: 'custom',
          bandsDb: [...prof.bandsDb],
          preampDb: prof.preampDb,
          bassBoostDb: prof.bassBoostDb,
          trebleBoostDb: prof.trebleBoostDb,
          volumeLeveler: prof.volumeLeveler,
        })
      );
      showToast(`"${prof.name}" profili uygulandı.`);
    },
    [eqSettings.customProfiles, showToast]
  );

  // JSON Backup & Restore (preserves user favorites, playlists, categories, EQ, settings)
  const exportUserBackupJson = useCallback((): string => {
    return JSON.stringify(
      {
        app: 'AutoMusic Pro 4',
        version: 4,
        exportedAt: new Date().toISOString(),
        data: {
          customCategories: categories.filter((c) => c.isCustom),
          favoriteTracks,
          favoriteArtistIds,
          favoriteSurahNumbers,
          favoriteReciterIds,
          playlists,
          recentlyPlayed,
          playCounts,
          resumePoints,
          downloadSettings,
          eqSettings,
          selectedReciterId,
          searchHistory,
        },
      },
      null,
      2
    );
  }, [
    categories,
    downloadSettings,
    eqSettings,
    favoriteArtistIds,
    favoriteReciterIds,
    favoriteSurahNumbers,
    favoriteTracks,
    playCounts,
    playlists,
    recentlyPlayed,
    resumePoints,
    searchHistory,
    selectedReciterId,
  ]);

  const importUserBackupJson = useCallback(
    (jsonText: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(jsonText) as { app?: string; data?: Record<string, unknown> };
        if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
          return { ok: false, message: 'Geçersiz yedek dosyası formatı.' };
        }
        const d = parsed.data;
        if (Array.isArray(d.customCategories)) {
          setCategories((prev) => mergeDefaultAndSavedCategories([...prev, ...(d.customCategories as MusicCategory[])]));
        }
        if (Array.isArray(d.favoriteTracks)) {
          setFavoriteTracks((d.favoriteTracks as MediaItem[]).map(healMediaItem));
        }
        if (Array.isArray(d.favoriteArtistIds)) setFavoriteArtistIds(d.favoriteArtistIds as string[]);
        if (Array.isArray(d.favoriteSurahNumbers)) setFavoriteSurahNumbers(d.favoriteSurahNumbers as number[]);
        if (Array.isArray(d.favoriteReciterIds)) setFavoriteReciterIds(d.favoriteReciterIds as string[]);
        if (Array.isArray(d.playlists)) {
          setPlaylists(
            (d.playlists as Playlist[]).map((pl) => ({ ...pl, items: (pl.items ?? []).map(healMediaItem) }))
          );
        }
        if (Array.isArray(d.recentlyPlayed)) {
          setRecentlyPlayed((d.recentlyPlayed as MediaItem[]).map(healMediaItem));
        }
        if (d.playCounts && typeof d.playCounts === 'object') {
          setPlayCounts(d.playCounts as Record<string, number>);
        }
        if (d.resumePoints && typeof d.resumePoints === 'object') {
          setResumePoints(d.resumePoints as Record<string, PlaybackResumePoint>);
        }
        if (d.downloadSettings && typeof d.downloadSettings === 'object') {
          setDownloadSettings((prev) => ({ ...prev, ...(d.downloadSettings as Partial<DownloadSettings>) }));
        }
        if (d.eqSettings && typeof d.eqSettings === 'object') {
          setEqSettings(normalizeEqualizerSettings(d.eqSettings as Partial<EqualizerSettings>));
        }
        if (typeof d.selectedReciterId === 'string') setSelectedReciterId(d.selectedReciterId);
        if (Array.isArray(d.searchHistory)) setSearchHistory(d.searchHistory as string[]);

        showToast('Yedek başarıyla geri yüklendi.');
        return { ok: true, message: 'Tüm favoriler, listeler ve ayarlar geri yüklendi.' };
      } catch {
        return { ok: false, message: 'JSON dosyası okunamadı. Lütfen geçerli bir AutoMusic yedeği seçin.' };
      }
    },
    [showToast]
  );

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
    discoverMoreCategoryTracks,
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
    seekBy,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    jumpToQueueIndex,
    removeFromQueue,
    moveQueueItem,
    addToQueueNext,
    sleepTimerMode,
    sleepTimerRemainingSec,
    setSleepTimer,
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
    playCounts,
    resumePoints,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
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
    completeMissingDownloads,
    downloadCategoryTracks,
    eqSettings,
    isEqSupported: sharedAudioEngine.isDspSupported,
    updateEqSettings,
    applyEqPreset,
    setEqBand,
    saveCustomEqProfile,
    deleteCustomEqProfile,
    applyCustomEqProfile,
    exportUserBackupJson,
    importUserBackupJson,
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
