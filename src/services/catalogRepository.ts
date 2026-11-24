import { AyahItem, CatalogProviderStatus, CuratedPlaylist, MediaItem, MusicCategory, Reciter } from '../types/media';
import { RECITERS, SURAHS, buildAyahAudioUrl, buildSurahMediaItem } from '../data/quranData';

// Turkish & Arabic accent-insensitive search normalizer
export function normalizeSearchText(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/[âàáä]/g, 'a')
    .replace(/[îìíïı]/g, 'i')
    .replace(/[ûùúü]/g, 'u')
    .replace(/[ôòóö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ş]/g, 's')
    .replace(/['’‘`]/g, '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

// Fast Levenshtein edit distance for typo-tolerant Turkish search
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/**
 * Returns a match score (0 = no match, higher = better match) supporting exact substrings,
 * Turkish character folding, and 1-2 character typo tolerance per word.
 */
export function fuzzyMatchScore(rawQuery: string, rawTarget: string): number {
  const q = normalizeSearchText(rawQuery);
  const t = normalizeSearchText(rawTarget);
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  if (t.includes(q)) return 70;

  const qWords = q.split(/\s+/).filter((w) => w.length >= 2);
  const tWords = t.split(/[\s—\-.,/()]+/).filter((w) => w.length >= 2);
  if (qWords.length === 0 || tWords.length === 0) return 0;

  let matchedWords = 0;
  let totalScore = 0;
  for (const qw of qWords) {
    let bestWordScore = 0;
    for (const tw of tWords) {
      if (tw.includes(qw)) {
        bestWordScore = Math.max(bestWordScore, 55);
      } else if (qw.length >= 4) {
        const dist = editDistance(qw, tw);
        const maxDist = qw.length >= 7 ? 2 : 1;
        if (dist <= maxDist) {
          bestWordScore = Math.max(bestWordScore, dist === 1 ? 42 : 28);
        }
      }
    }
    if (bestWordScore > 0) {
      matchedWords++;
      totalScore += bestWordScore;
    }
  }
  return matchedWords === qWords.length ? totalScore / qWords.length : 0;
}

export interface VerifiedAlbum {
  id: string;
  title: string;
  year: string;
  artist: string;
  coverUrl: string;
  sourceUrl: string;
}

export interface VerifiedAlbumTrack {
  position: number;
  disc: number;
  title: string;
  durationSec: number;
  recordingId?: string;
}

export class QuranCatalogRepository {
  getReciters(): Reciter[] {
    return RECITERS;
  }

  getReciterById(reciterId: string): Reciter {
    return RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  }

  getSurahTracksForReciter(reciterId: string): MediaItem[] {
    const reciter = this.getReciterById(reciterId);
    return SURAHS.map((surah) => buildSurahMediaItem(surah, reciter));
  }

  async fetchSurahAyahsWithMeal(surahNumber: number, reciterId: string): Promise<{ ayahs: AyahItem[]; source: string }> {
    const reciter = this.getReciterById(reciterId);
    const res = await fetch(`/api/quran/surah/${surahNumber}`);
    if (!res.ok) {
      throw new Error("Sure meali şu anda yüklenemedi. İnternet bağlantınızı kontrol edin.");
    }
    const json = (await res.json()) as {
      source: string;
      ayahs: Array<{ numberInSurah: number; globalNumber: number; arabicText: string; turkishMeal: string }>;
    };
    const ayahs: AyahItem[] = json.ayahs.map((a) => ({
      ...a,
      audioUrl: buildAyahAudioUrl(reciter, surahNumber, a.numberInSurah),
    }));
    return { ayahs, source: json.source };
  }
}

export interface DbCategoriesPayload {
  categories: MusicCategory[];
  playlistsSummary: Array<{
    id: string;
    categoryId: string;
    categoryName: string;
    title: string;
    subtitle: string;
    description: string;
    motif: MusicCategory['motif'];
    trackCount: number;
  }>;
}

export class DatabaseCatalogRepository {
  async fetchCategoriesAndPlaylists(): Promise<DbCategoriesPayload | null> {
    try {
      const res = await fetch('/api/db/categories');
      if (!res.ok) return null;
      return (await res.json()) as DbCategoriesPayload;
    } catch {
      return null;
    }
  }

  async createCategory(name: string, subtitle: string, language: string, genre: string): Promise<MusicCategory | null> {
    try {
      const res = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subtitle, language, genre }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { category: MusicCategory };
      return data.category;
    } catch {
      return null;
    }
  }

  async getCategoryPlaylistsAndTracks(
    categoryId: string,
    forceRefresh = false
  ): Promise<{ playlists: CuratedPlaylist[]; tracks: MediaItem[]; notice?: string }> {
    let dbTracks: MediaItem[] = [];
    let dbPlaylists: CuratedPlaylist[] = [];
    let dbNotice = '';
    try {
      const qs = forceRefresh ? '?refresh=1' : '';
      const res = await fetch(`/api/db/categories/${encodeURIComponent(categoryId)}/playlists${qs}`);
      if (res.ok) {
        const data = (await res.json()) as { playlists?: CuratedPlaylist[]; tracks?: MediaItem[]; notice?: string };
        dbTracks = data.tracks ?? [];
        dbPlaylists = data.playlists ?? [];
        dbNotice = data.notice ?? '';
      }
    } catch {
      // Fallback to open-music discovery below
    }

    if (dbTracks.length > 0 && !forceRefresh) {
      return { playlists: dbPlaylists, tracks: dbTracks, notice: dbNotice };
    }

    const category = (await import('../data/categories')).DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    if (!category || category.isQuran) {
      return {
        playlists: dbPlaylists,
        tracks: dbTracks,
        notice: dbNotice || 'Bu kategori için çevrimiçi katalog tanımlı değil.',
      };
    }

    try {
      const params = new URLSearchParams({
        categoryId: category.id,
        language: category.language,
        genre: category.genre,
        motif: category.motif,
      });
      if (forceRefresh) params.set('refresh', String(Date.now()));
      const res = await fetch(`/api/catalog/open-music?${params.toString()}`);
      if (!res.ok) throw new Error('catalog unavailable');
      const data = (await res.json()) as { tracks?: MediaItem[]; notice?: string };
      const discovered = (data.tracks ?? []).filter((t) => !!t.streamUrl);
      const seen = new Set<string>();
      const tracks = [...dbTracks, ...discovered].filter((t) => {
        if (!t.contentId || seen.has(t.contentId)) return false;
        seen.add(t.contentId);
        return true;
      });
      return {
        playlists: dbPlaylists,
        tracks,
        notice: tracks.length
          ? undefined
          : data.notice || dbNotice || 'Bu kategoride doğrulanmış açık lisanslı kayıt bulunamadı.',
      };
    } catch {
      return {
        playlists: dbPlaylists,
        tracks: dbTracks,
        notice: dbNotice || 'Müzik kataloğuna şu anda ulaşılamıyor.',
      };
    }
  }

  async fetchAllCachedTracks(): Promise<MediaItem[]> {
    try {
      const res = await fetch('/api/db/tracks');
      if (!res.ok) return [];
      const data = (await res.json()) as { tracks?: MediaItem[] };
      return data.tracks ?? [];
    } catch {
      return [];
    }
  }

  async searchTracks(
    query: string,
    category?: MusicCategory,
    offset = 0
  ): Promise<{ tracks: MediaItem[]; notice?: string; hasMore?: boolean }> {
    const params = new URLSearchParams({
      q: query,
      categoryId: category?.id ?? 'turkuler',
      language: category?.language ?? 'Türkçe',
      genre: category?.genre ?? 'Müzik',
      motif: category?.motif ?? 'turkuler',
      searchMode: '1',
      offset: String(offset),
    });
    const res = await fetch(`/api/catalog/open-music?${params.toString()}`);
    if (!res.ok) {
      return { tracks: [], hasMore: false, notice: 'Çevrimiçi katalog araması tamamlanamadı.' };
    }
    const data = (await res.json()) as { tracks?: MediaItem[]; notice?: string; hasMore?: boolean };
    return { tracks: data.tracks ?? [], notice: data.notice, hasMore: Boolean(data.hasMore) };
  }

  async fetchVerifiedArtistsAndAlbums(
    categoryId: string,
    artist?: string
  ): Promise<{ artists: string[]; albums: VerifiedAlbum[]; notice?: string }> {
    const params = new URLSearchParams({ categoryId });
    if (artist) params.set('artist', artist);
    const res = await fetch(`/api/catalog/verified?${params.toString()}`);
    if (!res.ok) {
      return { artists: [], albums: [], notice: 'Sanatçı ve albüm bilgilerine şu an ulaşılamıyor.' };
    }
    const data = (await res.json()) as { artists?: string[]; albums?: VerifiedAlbum[]; notice?: string };
    return {
      artists: data.artists ?? [],
      albums: data.albums ?? [],
      notice: data.notice,
    };
  }

  async fetchAlbumTracklist(
    albumId: string
  ): Promise<{ tracks: VerifiedAlbumTrack[]; releaseDate?: string; notice?: string }> {
    const res = await fetch(`/api/catalog/verified?albumId=${encodeURIComponent(albumId)}`);
    if (!res.ok) {
      return { tracks: [], notice: 'Albüm parça listesi şu anda alınamıyor.' };
    }
    const data = (await res.json()) as {
      tracks?: VerifiedAlbumTrack[];
      releaseDate?: string;
      notice?: string;
    };
    return {
      tracks: data.tracks ?? [],
      releaseDate: data.releaseDate,
      notice: data.notice,
    };
  }
}

export async function fetchCatalogProviderStatus(): Promise<CatalogProviderStatus> {
  try {
    const res = await fetch('/api/catalog/status');
    if (!res.ok) throw new Error('status unavailable');
    return (await res.json()) as CatalogProviderStatus;
  } catch {
    return {
      databaseConnected: false,
      quranApiConnected: true,
      internetArchiveConnected: false,
      audiusConnected: false,
      wikimediaConnected: false,
      jamendoConfigured: false,
      localArchiveReady: true,
    };
  }
}

export const quranRepository = new QuranCatalogRepository();
export const openMusicRepository = new DatabaseCatalogRepository();
