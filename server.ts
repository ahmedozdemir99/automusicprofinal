import { randomInt } from 'node:crypto';
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import {
  catalogDb,
  cleanTrackTitle,
  detectTrackType,
  VERIFIED_ARTISTS_BY_CATEGORY,
} from './src/server/catalogDb.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// Strict allowlist for verified open-licensed Quran and free legal audio CDNs (no open proxy)
const EXACT_ALLOWED_AUDIO_HOSTS = new Set<string>([
  'cdn.mp3quran.net',
  'download.quranicaudio.com',
  'everyayah.com',
  'www.everyayah.com',
  'cdn.islamic.network',
  'archive.org',
  'prod-1.storage.jamendo.com',
  'mp3d.jamendo.com',
  'mp3l.jamendo.com',
  'discoveryprovider.audius.co',
  'upload.wikimedia.org',
]);

function isAllowedAudioUrl(rawUrl: string, allowAudiusCdnRedirect = false): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.port && parsed.port !== '443') return null;

    const host = parsed.hostname.toLowerCase();
    // Block raw IPv4 / IPv6 / localhost / internal domains
    if (
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
      host.includes(':') ||
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return null;
    }

    if (EXACT_ALLOWED_AUDIO_HOSTS.has(host)) {
      return parsed;
    }

    // Verified MP3Quran mirror nodes (server6..server16.mp3quran.net)
    if (/^server\d+\.mp3quran\.net$/.test(host)) {
      return parsed;
    }

    // Verified Internet Archive storage nodes (ia*.us/ca/eu.archive.org & dn*.ca/us/eu.archive.org)
    if (/^(ia|dn)\d+\.(us|ca|eu)\.archive\.org$/.test(host)) {
      return parsed;
    }

    // Verified Audius decentralized open music content & discovery nodes
    if (
      /^[a-z0-9-]+\.audius\.co$/.test(host) ||
      /^audius-content-\d+\.figment\.io$/.test(host) ||
      /^blockdaemon-audius-content-\d+\.bdnodes\.net$/.test(host) ||
      /^cn\d*\.audius\./.test(host)
    ) {
      return parsed;
    }

    // Audius creator nodes issue signed 307 redirects to Cloudflare R2 / validator audio storage
    if (
      allowAudiusCdnRedirect &&
      /^[a-z0-9-]+\.[a-f0-9]+\.r2\.cloudflarestorage\.com$/.test(host)
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

function parseDurationSec(raw?: string | number): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.round(raw) : 0;
  if (!raw) return 0;
  const s = String(raw).trim();
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => Number.parseFloat(p));
    if (parts.every((n) => Number.isFinite(n))) {
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }
  }
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

interface CacheEntry<T> {
  fetchedAt: number;
  data: T;
}

const surahCache = new Map<number, CacheEntry<unknown>>();
const verifiedAlbumsCache = new Map<string, CacheEntry<unknown>>();
const albumTracksCache = new Map<string, CacheEntry<unknown>>();
const searchCache = new Map<string, CacheEntry<unknown>>();

async function fetchWithSafeRedirects(
  initialUrl: URL,
  headers: Record<string, string>,
  method: 'GET' | 'HEAD' = 'GET',
  maxRedirects = 6
): Promise<globalThis.Response> {
  let currentUrl = initialUrl;
  const isAudiusOrigin =
    currentUrl.hostname.toLowerCase().endsWith('.audius.co') ||
    currentUrl.hostname.toLowerCase() === 'audius.co';

  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl.toString(), {
      method,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return response;
      const nextRaw = new URL(location, currentUrl).toString();
      const validatedNext = isAllowedAudioUrl(nextRaw, isAudiusOrigin);
      if (!validatedNext) {
        throw new Error('UNTRUSTED_REDIRECT');
      }
      currentUrl = validatedNext;
      continue;
    }

    return response;
  }
  throw new Error('TOO_MANY_REDIRECTS');
}

function isLikelyUploaderHandle(name: string): boolean {
  const s = name.trim();
  if (!s) return true;
  if (/^(unknown|internet archive|user\d+|admin|uploader|anon|anonymous)$/i.test(s)) return true;
  if (/@|\.(com|net|org|tr)$/i.test(s)) return true;
  if (/^[a-z0-9_.-]{4,}$/.test(s) && /\d{2,}/.test(s) && !s.includes(' ')) return true;
  return false;
}

function getSearchAudioQualityScore(filename: string, rawBitrate?: string): number {
  const lower = filename.toLowerCase();
  if (/(?:_64kb|_32kb|_48kb|64kbps|32kbps|48kbps)/.test(lower)) return -1;
  const parsedBitrate = rawBitrate ? Number.parseFloat(rawBitrate) : 0;
  if (Number.isFinite(parsedBitrate) && parsedBitrate > 0 && parsedBitrate < 96) {
    return -1;
  }
  const bitrateBonus = Number.isFinite(parsedBitrate) && parsedBitrate >= 96 ? Math.min(320, Math.round(parsedBitrate)) : 160;
  if (lower.endsWith('.mp3')) return 3000 + bitrateBonus;
  if (lower.endsWith('.flac')) return 2500 + bitrateBonus;
  if (lower.endsWith('.ogg')) return 1500 + bitrateBonus;
  return 0;
}

async function searchInternetArchive(
  query: string,
  categoryId: string,
  language: string,
  genre: string,
  motif: string,
  offset: number
): Promise<Array<Record<string, unknown>>> {
  const page = Math.floor(offset / 8) + 1;
  const searchUrl = new URL('https://archive.org/advancedsearch.php');
  const safeQ = query.replace(/["\\():]/g, ' ').trim();
  searchUrl.searchParams.set(
    'q',
    `(title:(${safeQ}) OR creator:(${safeQ})) AND mediatype:(audio) AND format:(VBR MP3 OR MP3) AND NOT access-restricted-item:true`
  );
  searchUrl.searchParams.append('fl[]', 'identifier');
  searchUrl.searchParams.append('fl[]', 'title');
  searchUrl.searchParams.append('fl[]', 'creator');
  searchUrl.searchParams.append('fl[]', 'year');
  searchUrl.searchParams.set('rows', '8');
  searchUrl.searchParams.set('page', String(page));
  searchUrl.searchParams.set('output', 'json');

  const iaRes = await fetch(searchUrl.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro4/1.0' },
    signal: AbortSignal.timeout(9000),
  });
  if (!iaRes.ok) return [];

  const iaJson = (await iaRes.json()) as {
    response?: {
      docs?: Array<{ identifier: string; title?: string | string[]; creator?: string | string[]; year?: string | number }>;
    };
  };
  const docs = (iaJson.response?.docs ?? []).slice(0, 7);
  const settled = await Promise.allSettled(
    docs.map(async (doc) => {
      const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, {
        headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro4/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!metaRes.ok) return null;
      const metaJson = (await metaRes.json()) as {
        result?: Array<{ name?: string; length?: string; bitrate?: string; title?: string; artist?: string; album?: string }>;
      };

      const bestByStem = new Map<
        string,
        { file: { name?: string; length?: string; bitrate?: string; title?: string; artist?: string; album?: string }; score: number }
      >();

      for (const f of metaJson.result ?? []) {
        if (!f.name || !/\.(mp3|ogg|flac)$/i.test(f.name) || f.name.startsWith('__')) continue;
        if (/(sample|preview|spectrogram|_meta)/i.test(f.name)) continue;
        const score = getSearchAudioQualityScore(f.name, f.bitrate);
        if (score < 0) continue;
        const stem = f.name.replace(/_(vbr|64kb|128kb|192kb|256kb|320kb)?\.(mp3|ogg|flac)$/i, '').toLowerCase();
        const prev = bestByStem.get(stem);
        if (!prev || score > prev.score) {
          bestByStem.set(stem, { file: f, score });
        }
      }

      const files = Array.from(bestByStem.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((x) => x.file);
      return { doc, files };
    })
  );

  const tracks: Array<Record<string, unknown>> = [];
  for (const entry of settled) {
    if (entry.status !== 'fulfilled' || !entry.value) continue;
    const { doc, files } = entry.value;
    const docTitle = Array.isArray(doc.title) ? doc.title[0] : doc.title ?? doc.identifier;
    const rawCreator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator ?? '';
    const coverUrl = `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`;
    for (const file of files) {
      if (!file.name) continue;
      const dur = parseDurationSec(file.length);
      if (dur > 0 && dur < 45) continue; // Skip short previews/clips
      const encodedPath = file.name.split('/').map((s) => encodeURIComponent(s)).join('/');
      const directUrl = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodedPath}`;
      if (!isAllowedAudioUrl(directUrl)) continue;
      const ext = file.name.split('.').pop()?.toUpperCase();
      const title = cleanTrackTitle(file.title || file.name, docTitle);
      const rawArtist = file.artist || rawCreator;
      const artistName = isLikelyUploaderHandle(rawArtist) ? (docTitle.split(/[-—]/)[0]?.trim() || 'Açık Arşiv') : rawArtist.trim();
      const parsedBitrate = file.bitrate ? Math.round(Number.parseFloat(file.bitrate)) : 0;
      tracks.push({
        contentId: `ia:${doc.identifier}:${file.name}`,
        title,
        artistId: `artist:${artistName.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '-')}`,
        artistName,
        album: file.album || docTitle,
        categoryId,
        language,
        genre,
        durationSec: dur,
        streamUrl: directUrl,
        sourceProvider: 'internet_archive',
        downloadAllowed: true,
        licenseName: 'Internet Archive Açık Arşiv',
        bitrateKbps: parsedBitrate >= 96 ? parsedBitrate : 192,
        format: ext === 'FLAC' ? 'FLAC' : ext === 'OGG' ? 'OGG' : 'MP3',
        motif,
        coverUrl,
        year: doc.year ? String(doc.year).slice(0, 4) : undefined,
        trackType: detectTrackType(title, file.album || docTitle),
      });
    }
  }
  return tracks;
}

async function searchAudius(
  query: string,
  categoryId: string,
  language: string,
  genre: string,
  motif: string,
  offset: number
): Promise<Array<Record<string, unknown>>> {
  try {
    const endpoint = new URL('https://discoveryprovider.audius.co/v1/tracks/search');
    endpoint.searchParams.set('query', query);
    endpoint.searchParams.set('limit', '12');
    if (offset > 0) endpoint.searchParams.set('offset', String(offset));

    const res = await fetch(endpoint.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro4/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as {
      data?: Array<{
        id?: string;
        title?: string;
        duration?: number;
        genre?: string;
        release_date?: string;
        is_streamable?: boolean;
        artwork?: { '480x480'?: string; '150x150'?: string };
        user?: { id?: string; name?: string; handle?: string };
      }>;
    };

    const items: Array<Record<string, unknown>> = [];
    for (const t of payload.data ?? []) {
      if (!t.id || !t.title || t.is_streamable === false) continue;
      const dur = Number(t.duration) || 0;
      if (dur > 0 && dur < 45) continue; // Full-length priority
      const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${encodeURIComponent(t.id)}/stream`;
      const artistName = t.user?.name?.trim() || t.user?.handle?.trim() || 'Audius Sanatçısı';
      items.push({
        contentId: `audius:${t.id}`,
        title: t.title.trim(),
        artistId: `audius-artist:${t.user?.id || artistName.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '-')}`,
        artistName,
        album: t.genre ? `Audius · ${t.genre}` : 'Audius Açık Katalog',
        categoryId,
        language,
        genre: t.genre || genre,
        durationSec: dur,
        streamUrl,
        sourceProvider: 'audius',
        downloadAllowed: false,
        licenseName: 'Audius Açık Dinleme',
        bitrateKbps: 320,
        format: 'MP3',
        motif,
        coverUrl: t.artwork?.['480x480'] || t.artwork?.['150x150'],
        year: t.release_date ? String(t.release_date).slice(0, 4) : undefined,
        trackType: detectTrackType(t.title),
      });
    }
    return items;
  } catch {
    return [];
  }
}

async function searchWikimediaAudio(
  query: string,
  categoryId: string,
  language: string,
  genre: string,
  motif: string,
  offset: number
): Promise<Array<Record<string, unknown>>> {
  try {
    const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
    endpoint.searchParams.set('action', 'query');
    endpoint.searchParams.set('generator', 'search');
    endpoint.searchParams.set('gsrsearch', `${query} filetype:audio`);
    endpoint.searchParams.set('gsrnamespace', '6');
    endpoint.searchParams.set('gsrlimit', '6');
    if (offset > 0) endpoint.searchParams.set('gsroffset', String(offset));
    endpoint.searchParams.set('prop', 'imageinfo');
    endpoint.searchParams.set('iiprop', 'url|mime|duration|extmetadata');
    endpoint.searchParams.set('format', 'json');

    const res = await fetch(endpoint.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)' },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            pageid: number;
            title?: string;
            imageinfo?: Array<{
              url?: string;
              mime?: string;
              duration?: number;
              extmetadata?: {
                Artist?: { value?: string };
                LicenseShortName?: { value?: string };
              };
            }>;
          }
        >;
      };
    };

    const items: Array<Record<string, unknown>> = [];
    for (const page of Object.values(json.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      if (!info?.url || !isAllowedAudioUrl(info.url)) continue;
      if (!/\.(mp3|ogg|oga|flac|wav)$/i.test(info.url)) continue;
      const dur = Math.round(Number(info.duration) || 0);
      if (dur > 0 && dur < 40) continue;

      const rawTitle = (page.title || '').replace(/^File:/i, '');
      const title = cleanTrackTitle(rawTitle, query);
      const rawArtist = (info.extmetadata?.Artist?.value || '').replace(/<[^>]+>/g, '').trim();
      const artistName = rawArtist && !isLikelyUploaderHandle(rawArtist) ? rawArtist.slice(0, 80) : 'Wikimedia Commons';
      const ext = info.url.split('.').pop()?.toUpperCase();

      items.push({
        contentId: `wiki:${page.pageid}`,
        title,
        artistId: `wiki-artist:${artistName.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '-')}`,
        artistName,
        album: 'Wikimedia Commons Ses Arşivi',
        categoryId,
        language,
        genre,
        durationSec: dur,
        streamUrl: info.url,
        sourceProvider: 'wikimedia',
        downloadAllowed: true,
        licenseName: info.extmetadata?.LicenseShortName?.value || 'Wikimedia Açık Lisans',
        format: ext === 'FLAC' ? 'FLAC' : ext === 'WAV' ? 'WAV' : ext === 'MP3' ? 'MP3' : 'OGG',
        motif,
        trackType: detectTrackType(title),
      });
    }
    return items;
  } catch {
    return [];
  }
}

async function searchJamendo(
  query: string,
  categoryId: string,
  language: string,
  genre: string,
  motif: string,
  offset: number
): Promise<Array<Record<string, unknown>>> {
  const clientId = process.env.JAMENDO_CLIENT_ID?.trim();
  if (!clientId) return [];
  try {
    const endpoint = new URL('https://api.jamendo.com/v3.0/tracks/');
    endpoint.searchParams.set('client_id', clientId);
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('limit', '12');
    endpoint.searchParams.set('offset', String(offset));
    endpoint.searchParams.set('search', query);
    endpoint.searchParams.set('audioformat', 'mp32');
    endpoint.searchParams.set('include', 'licenses');
    endpoint.searchParams.set('imagesize', '300');

    const res = await fetch(endpoint.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<{
        id: string;
        name: string;
        artist_id: string;
        artist_name: string;
        album_name?: string;
        duration?: number;
        audio?: string;
        audiodownload_allowed?: boolean;
        license_ccurl?: string;
        image?: string;
        album_image?: string;
      }>;
    };

    return (data.results ?? [])
      .filter((t) => t.audio?.startsWith('https://') && (Number(t.duration) || 0) >= 45)
      .map((t) => ({
        contentId: `jamendo:${t.id}`,
        title: t.name,
        artistId: `jamendo-artist:${t.artist_id}`,
        artistName: t.artist_name,
        album: t.album_name || genre,
        categoryId,
        language,
        genre,
        durationSec: Number(t.duration) || 0,
        streamUrl: t.audio,
        sourceProvider: 'jamendo',
        downloadAllowed: Boolean(t.audiodownload_allowed),
        licenseName: t.license_ccurl || 'Jamendo CC',
        bitrateKbps: 192,
        format: 'MP3',
        motif,
        coverUrl: t.image || t.album_image || undefined,
        trackType: detectTrackType(t.name, t.album_name || ''),
      }));
  } catch {
    return [];
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 0. Health check endpoint for Cloud Run & uptime checks
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      service: 'automusic-pro-4',
      port: PORT,
      uptimeSec: Math.round(process.uptime()),
    });
  });

  // 1. Catalog Provider Status (never exposes secrets)
  app.get('/api/catalog/status', (_req: Request, res: Response) => {
    res.json({
      databaseConnected: true,
      quranApiConnected: true,
      internetArchiveConnected: true,
      audiusConnected: true,
      wikimediaConnected: true,
      jamendoConfigured: Boolean(process.env.JAMENDO_CLIENT_ID && process.env.JAMENDO_CLIENT_ID.trim().length > 0),
      localArchiveReady: true,
    });
  });

  // 2. Database-Driven Categories & Spotify-style Curated Playlists
  app.get('/api/db/categories', (_req: Request, res: Response) => {
    try {
      const categories = catalogDb.getCategories();
      const playlistsSummary = catalogDb.getFeaturedCuratedPlaylistsSummary();
      res.json({ categories, playlistsSummary });
    } catch {
      res.status(500).json({ error: 'Veritabanı kategorileri okunamadı.' });
    }
  });

  app.post('/api/db/categories', (req: Request, res: Response) => {
    const body = req.body as { name?: unknown; subtitle?: unknown; language?: unknown; genre?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 60) {
      res.status(400).json({ error: 'Geçerli bir kategori adı girin.' });
      return;
    }
    const created = catalogDb.addCustomCategory(
      name,
      typeof body.subtitle === 'string' ? body.subtitle : '',
      typeof body.language === 'string' ? body.language : 'Türkçe',
      typeof body.genre === 'string' ? body.genre : name
    );
    res.status(201).json({ category: created });
  });

  app.get('/api/db/categories/:id/playlists', async (req: Request, res: Response) => {
    const categoryId = String(req.params.id ?? '').trim().slice(0, 64);
    const forceRefresh = req.query.refresh === '1';
    if (!categoryId) {
      res.status(400).json({ error: 'Geçersiz kategori kimliği.' });
      return;
    }

    try {
      const data = await catalogDb.getCuratedPlaylistsForCategory(categoryId, forceRefresh);
      res.json({
        categoryId,
        playlists: data.playlists,
        tracks: data.tracks,
        notice:
          data.tracks.length === 0
            ? 'Bu kategoride açık arşivden eşleşen kayıt bulunamadı. Telefonunuzdaki MP3/AAC/FLAC dosyalarını hemen yükleyebilirsiniz.'
            : undefined,
      });
    } catch {
      res.status(502).json({
        categoryId,
        playlists: [],
        tracks: [],
        notice: 'Kategori listeleri yüklenirken bağlantı sorunu oluştu. Telefonunuzdan ses dosyası yükleyebilirsiniz.',
      });
    }
  });

  // 3. Real Quran Surah Arabic + Turkish Diyanet Meal (api.alquran.cloud)
  app.get('/api/quran/surah/:number', async (req: Request, res: Response) => {
    const num = Number.parseInt(String(req.params.number), 10);
    if (!Number.isInteger(num) || num < 1 || num > 114) {
      res.status(400).json({ error: 'Geçersiz sure numarası (1-114 arası olmalıdır).' });
      return;
    }

    const cached = surahCache.get(num);
    if (cached && Date.now() - cached.fetchedAt < 1000 * 60 * 60 * 12) {
      res.json(cached.data);
      return;
    }

    try {
      const apiUrl = `https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,tr.diyanet`;
      const upstream = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!upstream.ok) {
        res.status(502).json({ error: "Kur'an meal servisi geçici olarak yanıt vermiyor." });
        return;
      }
      const payload = (await upstream.json()) as {
        code: number;
        data?: Array<{
          number: number;
          name: string;
          ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
        }>;
      };

      const arabicEdition = payload.data?.[0];
      const turkishEdition = payload.data?.[1];
      if (!arabicEdition || !turkishEdition) {
        res.status(502).json({ error: 'Sure verisi eksik alındı.' });
        return;
      }

      const ayahs = arabicEdition.ayahs.map((ar, idx) => ({
        numberInSurah: ar.numberInSurah,
        globalNumber: ar.number,
        arabicText: ar.text,
        turkishMeal: turkishEdition.ayahs[idx]?.text ?? '',
      }));

      const result = {
        surahNumber: num,
        arabicName: arabicEdition.name,
        ayahCount: ayahs.length,
        source: 'AlQuran Cloud (Diyanet İşleri Meali)',
        ayahs,
      };

      surahCache.set(num, { fetchedAt: Date.now(), data: result });
      res.json(result);
    } catch {
      res.status(502).json({ error: "Kur'an metni alınırken bağlantı hatası oluştu." });
    }
  });

  // 4. Multi-Provider Live Search (Internet Archive + Audius + Wikimedia + Jamendo) with pagination & deduplication
  app.get('/api/catalog/open-music', async (req: Request, res: Response) => {
    const query = String(req.query.q ?? '').trim().slice(0, 120);
    const categoryId = String(req.query.categoryId ?? 'turkuler').trim().slice(0, 40);
    const language = String(req.query.language ?? 'Türkçe').trim().slice(0, 40);
    const genre = String(req.query.genre ?? 'Müzik').trim().slice(0, 40);
    const motif = String(req.query.motif ?? 'turkuler').trim().slice(0, 24);
    const offset = Math.min(200, Math.max(0, Number.parseInt(String(req.query.offset ?? '0'), 10) || 0));

    if (!query) {
      res.json({ tracks: [], hasMore: false, notice: 'Arama sorgusu belirtilmedi.' });
      return;
    }

    const cacheKey = `${query.toLocaleLowerCase('tr-TR')}::${categoryId}::${offset}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < 1000 * 60 * 5) {
      res.json(cached.data);
      return;
    }

    try {
      const [iaSettled, audiusSettled, wikiSettled, jamendoSettled] = await Promise.allSettled([
        searchInternetArchive(query, categoryId, language, genre, motif, offset),
        searchAudius(query, categoryId, language, genre, motif, offset),
        searchWikimediaAudio(query, categoryId, language, genre, motif, offset),
        searchJamendo(query, categoryId, language, genre, motif, offset),
      ]);

      const merged = [
        ...(iaSettled.status === 'fulfilled' ? iaSettled.value : []),
        ...(audiusSettled.status === 'fulfilled' ? audiusSettled.value : []),
        ...(jamendoSettled.status === 'fulfilled' ? jamendoSettled.value : []),
        ...(wikiSettled.status === 'fulfilled' ? wikiSettled.value : []),
      ];

      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      const tracks = merged.filter((item) => {
        const id = String(item.contentId || '');
        const normKey = `${String(item.artistName || '').toLocaleLowerCase('tr-TR')}::${String(item.title || '').toLocaleLowerCase('tr-TR')}`;
        if (!id || seenIds.has(id) || seenKeys.has(normKey)) return false;
        seenIds.add(id);
        seenKeys.add(normKey);
        return true;
      });

      const payload = {
        tracks,
        offset,
        hasMore: tracks.length >= 8,
        providersQueried: ['internet_archive', 'audius', 'wikimedia', ...(process.env.JAMENDO_CLIENT_ID ? ['jamendo'] : [])],
        notice:
          tracks.length === 0
            ? 'Aramanızla eşleşen ücretsiz açık lisanslı tam parça bulunamadı.'
            : undefined,
      };

      searchCache.set(cacheKey, { fetchedAt: Date.now(), data: payload });
      res.json(payload);
    } catch {
      res.status(502).json({ tracks: [], hasMore: false, notice: 'Çevrimiçi arama şu an tamamlanamadı.' });
    }
  });

  // 5. Verified Real Artists -> Albums -> Real Tracklists (MusicBrainz Metadata)
  app.get('/api/catalog/verified', async (req: Request, res: Response) => {
    const categoryId = String(req.query.categoryId ?? '').trim().slice(0, 64);
    const requestedArtist = String(req.query.artist ?? '').trim().slice(0, 100);
    const albumId = String(req.query.albumId ?? '').trim().slice(0, 80);

    // Optional: fetch real ordered album tracklist when albumId (release-group MBID) is provided
    if (albumId) {
      const cachedAlbum = albumTracksCache.get(albumId);
      if (cachedAlbum && Date.now() - cachedAlbum.fetchedAt < 1000 * 60 * 60 * 6) {
        res.json(cachedAlbum.data);
        return;
      }
      try {
        const relUrl = `https://musicbrainz.org/ws/2/release?release-group=${encodeURIComponent(albumId)}&inc=recordings&fmt=json&limit=5`;
        const relRes = await fetch(relUrl, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)',
          },
          signal: AbortSignal.timeout(9000),
        });
        if (!relRes.ok) {
          res.status(502).json({ tracks: [], notice: 'Albüm parça listesi şu anda alınamıyor.' });
          return;
        }
        const relData = (await relRes.json()) as {
          releases?: Array<{
            id: string;
            title?: string;
            date?: string;
            media?: Array<{
              position?: number;
              tracks?: Array<{
                position?: number;
                number?: string;
                title?: string;
                length?: number | null;
                recording?: { id?: string; title?: string; length?: number | null };
              }>;
            }>;
          }>;
        };

        // Pick the release with the most complete tracklist
        const bestRelease = (relData.releases ?? [])
          .filter((r) => (r.media ?? []).some((m) => (m.tracks?.length ?? 0) > 0))
          .sort((a, b) => {
            const countA = (a.media ?? []).reduce((acc, m) => acc + (m.tracks?.length ?? 0), 0);
            const countB = (b.media ?? []).reduce((acc, m) => acc + (m.tracks?.length ?? 0), 0);
            return countB - countA;
          })[0];

        const tracklist: Array<{
          position: number;
          disc: number;
          title: string;
          durationSec: number;
          recordingId?: string;
        }> = [];

        if (bestRelease) {
          for (const medium of bestRelease.media ?? []) {
            const disc = medium.position ?? 1;
            for (const tr of medium.tracks ?? []) {
              const title = tr.title || tr.recording?.title;
              if (!title) continue;
              const lenMs = tr.length ?? tr.recording?.length ?? 0;
              tracklist.push({
                position: tr.position ?? tracklist.length + 1,
                disc,
                title,
                durationSec: lenMs > 0 ? Math.round(lenMs / 1000) : 0,
                recordingId: tr.recording?.id,
              });
            }
          }
        }

        const result = {
          albumId,
          releaseDate: bestRelease?.date?.slice(0, 4) || '',
          tracks: tracklist,
          notice:
            tracklist.length === 0
              ? 'Bu albüm için MusicBrainz parça sıralaması bulunamadı.'
              : undefined,
        };
        albumTracksCache.set(albumId, { fetchedAt: Date.now(), data: result });
        res.json(result);
        return;
      } catch {
        res.status(502).json({ tracks: [], notice: 'Albüm parça listesi alınırken bağlantı zaman aşımına uğradı.' });
        return;
      }
    }

    const names = VERIFIED_ARTISTS_BY_CATEGORY[categoryId] ?? [];
    if (names.length === 0) {
      res.json({
        artists: [],
        albums: [],
        notice: 'Bu kategori için doğrulanmış sanatçı seçkisi henüz hazırlanmadı.',
      });
      return;
    }

    if (!requestedArtist) {
      res.json({ artists: names, albums: [], metadataOnly: true });
      return;
    }

    if (!names.includes(requestedArtist)) {
      res.status(400).json({ error: 'Sanatçı bu kategori seçkisinde bulunamadı.' });
      return;
    }

    const albumCacheKey = `${categoryId}::${requestedArtist}`;
    const cached = verifiedAlbumsCache.get(albumCacheKey);
    if (cached && Date.now() - cached.fetchedAt < 1000 * 60 * 60 * 6) {
      res.json(cached.data);
      return;
    }

    try {
      const q = `artist:"${requestedArtist.replace(/["\\]/g, '')}" AND primarytype:album`;
      const endpoint = new URL('https://musicbrainz.org/ws/2/release-group/');
      endpoint.searchParams.set('query', q);
      endpoint.searchParams.set('fmt', 'json');
      endpoint.searchParams.set('limit', '60');

      const mbRes = await fetch(endpoint.toString(), {
        headers: {
          'User-Agent': 'AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(9000),
      });
      if (!mbRes.ok) {
        res.json({
          artists: names,
          albums: [],
          metadataOnly: true,
          notice: 'MusicBrainz albüm servisi geçici olarak meşgul. Biraz sonra tekrar deneyin.',
        });
        return;
      }

      const data = (await mbRes.json()) as {
        'release-groups'?: Array<{
          id: string;
          title: string;
          'primary-type'?: string;
          'first-release-date'?: string;
          'artist-credit'?: Array<{ name?: string; artist?: { name?: string } }>;
        }>;
      };

      const norm = (s: string) => s.toLocaleLowerCase('tr-TR').trim();
      const seenTitles = new Set<string>();
      const albums = (data['release-groups'] ?? [])
        .filter(
          (x) =>
            (x['artist-credit'] ?? []).some((a) => norm(a.artist?.name || a.name || '') === norm(requestedArtist)) &&
            x['primary-type'] === 'Album'
        )
        .filter((x) => {
          const k = norm(x.title);
          if (seenTitles.has(k)) return false;
          seenTitles.add(k);
          return true;
        })
        .sort((a, b) => (b['first-release-date'] || '').localeCompare(a['first-release-date'] || ''))
        .map((x) => ({
          id: x.id,
          title: x.title,
          year: (x['first-release-date'] || '').slice(0, 4),
          artist: requestedArtist,
          coverUrl: `https://coverartarchive.org/release-group/${encodeURIComponent(x.id)}/front-250`,
          sourceUrl: `https://musicbrainz.org/release-group/${encodeURIComponent(x.id)}`,
        }));

      const payload = {
        artists: names,
        albums,
        metadataOnly: true,
        notice:
          'Albüm ve parça bilgileri MusicBrainz kaynağındandır. Bir albüme tıklayarak parça listesini görebilir ve ücretsiz açık ses kaynaklarında eşleştirme arayabilirsiniz.',
      };
      verifiedAlbumsCache.set(albumCacheKey, { fetchedAt: Date.now(), data: payload });
      res.json(payload);
    } catch {
      res.json({
        artists: names,
        albums: [],
        metadataOnly: true,
        notice: 'Albüm veritabanına şu anda ulaşılamıyor. Daha sonra yeniden deneyin.',
      });
    }
  });

  app.get('/api/db/tracks', (_req: Request, res: Response) => {
    try {
      const tracks = catalogDb.getAllCachedTracksFromDb();
      res.json({ tracks });
    } catch {
      res.status(500).json({ tracks: [] });
    }
  });

  // 6. Security-hardened Range-supporting Audio Streaming Proxy (Quran + Archive + Audius + Wikimedia + Jamendo)
  const handleAudioProxy = async (req: Request, res: Response): Promise<void> => {
    const rawUrl = String(req.query.url ?? '');
    const validatedUrl = isAllowedAudioUrl(rawUrl);
    if (!validatedUrl) {
      res.status(400).json({ error: 'Yalnızca izin verilen açık lisanslı ses kaynakları desteklenir.' });
      return;
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        'User-Agent': 'AutoMusicPro4/1.0',
        Accept: 'audio/*,*/*;q=0.8',
      };
      if (typeof req.headers.range === 'string') {
        upstreamHeaders.Range = req.headers.range;
      }

      const method = req.method === 'HEAD' ? 'HEAD' : 'GET';
      const upstream = await fetchWithSafeRedirects(validatedUrl, upstreamHeaders, method);
      if (!upstream.ok && upstream.status !== 206) {
        const msg =
          upstream.status === 403
            ? 'Ses kaynağı erişimi reddetti (HTTP 403).'
            : upstream.status === 404
              ? 'Ses dosyası kaynakta bulunamadı (HTTP 404).'
              : upstream.status === 429
                ? 'Ses sağlayıcısı istek sınırına ulaştı (HTTP 429). Biraz sonra tekrar deneyin.'
                : `Ses dosyası kaynaktan alınamadı (HTTP ${upstream.status}).`;
        res.status(upstream.status).json({ error: msg, status: upstream.status });
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
      res.status(upstream.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      const contentLength = upstream.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      if (method === 'HEAD' || !upstream.body) {
        if (upstream.body) {
          void upstream.body.cancel().catch(() => {});
        }
        res.end();
        return;
      }

      const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
      res.on('close', () => {
        if (!nodeStream.destroyed) nodeStream.destroy();
      });
      nodeStream.on('error', () => {
        if (!res.headersSent) res.status(502).end();
        else res.end();
      });
      nodeStream.pipe(res);
    } catch (err) {
      if (!res.headersSent) {
        const message = err instanceof Error ? err.message : '';
        if (message === 'UNTRUSTED_REDIRECT') {
          res.status(400).json({ error: 'Ses yönlendirmesi izin verilen açık kaynaklar dışında.' });
        } else if (err instanceof DOMException && err.name === 'TimeoutError') {
          res.status(504).json({ error: 'Ses kaynağı zaman aşımına uğradı.' });
        } else {
          res.status(502).json({ error: 'Ses akışı aktarılırken bağlantı hatası oluştu.' });
        }
      }
    }
  };

  app.get('/api/audio/proxy', (req: Request, res: Response) => {
    void handleAudioProxy(req, res);
  });
  app.head('/api/audio/proxy', (req: Request, res: Response) => {
    void handleAudioProxy(req, res);
  });

  // 7. Real-Time Google TV Cast & Pairing Room State & REST Check (before Vite/SPA fallback)
  interface TvCastRoom {
    code: string;
    receivers: Set<WebSocket>;
    controllers: Set<WebSocket>;
    state: Record<string, unknown> | null;
    lastUpdated: number;
  }

  const tvRooms = new Map<string, TvCastRoom>();
  const normalizeTvCode = (raw: unknown): string =>
    String(raw ?? '')
      .replace(/[^0-9]/g, '')
      .slice(0, 6);

  const allocateTvCode = (preferred?: string): string => {
    const cleanPref = normalizeTvCode(preferred);
    if (cleanPref.length === 6) return cleanPref;
    for (let i = 0; i < 20; i++) {
      const candidate = String(randomInt(100000, 1000000));
      if (!tvRooms.has(candidate)) return candidate;
    }
    throw new Error('TV pairing code allocation exhausted');
  };

  const sendWs = (ws: WebSocket, payload: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  // Prune stale empty TV rooms every 10 minutes
  const tvCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of tvRooms.entries()) {
      if (room.receivers.size === 0 && room.controllers.size === 0 && now - room.lastUpdated > 1000 * 60 * 15) {
        tvRooms.delete(code);
      }
    }
  }, 1000 * 60 * 10);
  tvCleanupTimer.unref();

  app.get('/api/tv-cast/room/:code', (req: Request, res: Response) => {
    const code = normalizeTvCode(req.params.code);
    const room = tvRooms.get(code);
    res.json({
      exists: Boolean(room && room.receivers.size > 0),
      receiverCount: room?.receivers.size ?? 0,
      controllerCount: room?.controllers.size ?? 0,
    });
  });

  // Vite dev middleware vs production dist (HMR & WS disabled cleanly in middlewareMode)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });

    // Prevent Vite 8's /@vite/client from opening a failing WebSocket when HMR/WS are disabled
    app.get('/@vite/client', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  }
  style.textContent = content;
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) { return url; }
export class ErrorOverlay extends HTMLElement {}
`);
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // 8. Real-Time Google TV Cast & Pairing WebSocket Relay (/ws/tv-cast)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/tv-cast', maxPayload: 64 * 1024 });

  wss.on('connection', (ws: WebSocket) => {
    let joinedCode: string | null = null;
    let role: 'receiver' | 'controller' | null = null;

    const detach = () => {
      if (!joinedCode || !role) return;
      const room = tvRooms.get(joinedCode);
      if (!room) return;
      if (role === 'receiver') room.receivers.delete(ws);
      else room.controllers.delete(ws);
      room.lastUpdated = Date.now();

      const presence = {
        type: 'cast:presence',
        code: joinedCode,
        receiverCount: room.receivers.size,
        controllerCount: room.controllers.size,
      };
      room.receivers.forEach((r) => sendWs(r, presence));
      room.controllers.forEach((c) => sendWs(c, presence));

      joinedCode = null;
      role = null;
    };

    let windowStart = Date.now();
    let messageCount = 0;
    let pairAttempts = 0;
    ws.on('message', (rawBuf) => {
      if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); messageCount = 0; pairAttempts = 0; }
      if (++messageCount > 600) { ws.close(1008, 'Rate limit'); return; }
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(rawBuf.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;
      if (msg.type === 'ping') {
        sendWs(ws, { type: 'pong', ts: Date.now() });
        return;
      }

      if (msg.type === 'tv:register') {
        detach();
        let code: string;
        try { code = allocateTvCode(typeof msg.code === 'string' ? msg.code : undefined); }
        catch { sendWs(ws, { type: 'cast:error', message: 'TV kodu oluşturulamadı.' }); return; }
        let room = tvRooms.get(code);
        if (!room) {
          room = { code, receivers: new Set(), controllers: new Set(), state: null, lastUpdated: Date.now() };
          tvRooms.set(code, room);
        }
        room.receivers.add(ws);
        room.lastUpdated = Date.now();
        joinedCode = code;
        role = 'receiver';

        sendWs(ws, {
          type: 'tv:registered',
          code,
          receiverCount: room.receivers.size,
          controllerCount: room.controllers.size,
          state: room.state,
        });
        room.controllers.forEach((c) =>
          sendWs(c, {
            type: 'cast:presence',
            code,
            receiverCount: room!.receivers.size,
            controllerCount: room!.controllers.size,
          })
        );
        return;
      }

      if (msg.type === 'controller:pair') {
        if (++pairAttempts > 10) { ws.close(1008, 'Pairing rate limit'); return; }
        const code = normalizeTvCode(msg.code);
        if (code.length !== 6) {
          sendWs(ws, { type: 'cast:error', message: 'Lütfen Google TV ekranındaki 6 haneli kodu girin.' });
          return;
        }
        const room = tvRooms.get(code);
        if (!room || room.receivers.size === 0) {
          sendWs(ws, {
            type: 'cast:error',
            message: `${code.slice(0, 3)}-${code.slice(3)} kodlu aktif Google TV alıcısı bulunamadı. TV ekranında Alıcı Modu'nun açık olduğundan emin olun.`,
          });
          return;
        }
        detach();
        room.controllers.add(ws);
        room.lastUpdated = Date.now();
        joinedCode = code;
        role = 'controller';

        const pairedPayload = {
          type: 'cast:paired',
          code,
          receiverCount: room.receivers.size,
          controllerCount: room.controllers.size,
          state: room.state,
        };
        sendWs(ws, pairedPayload);
        room.receivers.forEach((r) => sendWs(r, pairedPayload));
        return;
      }

      if (msg.type === 'cast:sync_state' && joinedCode && role === 'controller') {
        const room = tvRooms.get(joinedCode);
        if (!room) return;
        const nextState = (msg.state && typeof msg.state === 'object' ? msg.state : null) as Record<
          string,
          unknown
        > | null;
        if (!nextState || Array.isArray(nextState)) return;
        room.state = nextState;
        room.lastUpdated = Date.now();
        room.receivers.forEach((r) => sendWs(r, { type: 'cast:state', state: nextState }));
        return;
      }

      if (msg.type === 'tv:telemetry' && joinedCode && role === 'receiver') {
        const room = tvRooms.get(joinedCode);
        if (!room) return;
        room.lastUpdated = Date.now();
        room.controllers.forEach((c) =>
          sendWs(c, {
            type: 'tv:telemetry',
            currentTime: Number(msg.currentTime) || 0,
            duration: Number(msg.duration) || 0,
            isPlaying: Boolean(msg.isPlaying),
          })
        );
        return;
      }

      if (msg.type === 'tv:command' && joinedCode && role === 'receiver') {
        const room = tvRooms.get(joinedCode);
        if (!room) return;
        room.lastUpdated = Date.now();
        room.controllers.forEach((c) =>
          sendWs(c, {
            type: 'tv:command',
            action: msg.action,
            positionSec: msg.positionSec,
          })
        );
      }
    });

    ws.on('close', detach);
    ws.on('error', detach);
  });

  // Listen immediately on process.env.PORT and 0.0.0.0 so Cloud Run health checks pass right away
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoMusic Pro 4 server running on http://0.0.0.0:${PORT}`);
    // Gently pre-warm SQLite category tracks AFTER listening so startup is never delayed
    catalogDb.warmPopularCategoriesInBackground();
  });
}

startServer().catch((err) => {
  console.error('AutoMusic Pro 4 failed to start:', err);
  process.exit(1);
});
