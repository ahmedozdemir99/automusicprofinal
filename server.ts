import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { catalogDb } from './src/server/catalogDb.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Strict SSRF allowlist for verified open-licensed Quran and open audio CDNs (including CDN redirect targets)
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
]);

function isAllowedAudioUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.port && parsed.port !== '443') return null;

    const host = parsed.hostname.toLowerCase();
    // Block raw IPv4 / IPv6 / localhost
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host === 'localhost') {
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

    return null;
  } catch {
    return null;
  }
}

interface SurahCacheEntry {
  fetchedAt: number;
  data: unknown;
}
const surahCache = new Map<number, SurahCacheEntry>();

async function fetchWithSafeRedirects(
  initialUrl: URL,
  headers: Record<string, string>,
  maxRedirects = 5
): Promise<globalThis.Response> {
  let currentUrl = initialUrl;
  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl.toString(), {
      method: 'GET',
      headers,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return response;
      const nextRaw = new URL(location, currentUrl).toString();
      const validatedNext = isAllowedAudioUrl(nextRaw);
      if (!validatedNext) {
        throw new Error('Yönlendirme adresi izin verilen açık ses kaynakları dışında.');
      }
      currentUrl = validatedNext;
      continue;
    }

    return response;
  }
  throw new Error('Çok fazla yönlendirme.');
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. Catalog Provider Status (never exposes secrets)
  app.get('/api/catalog/status', (_req: Request, res: Response) => {
    res.json({
      databaseConnected: true,
      quranApiConnected: true,
      internetArchiveConnected: true,
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
      const upstream = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
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

  // 4. Live Search across Turkish-weighted Open Audio Archive
  app.get('/api/catalog/open-music', async (req: Request, res: Response) => {
    const query = String(req.query.q ?? '').trim().slice(0, 120);
    const categoryId = String(req.query.categoryId ?? 'turkuler').trim().slice(0, 40);
    const language = String(req.query.language ?? 'Türkçe').trim().slice(0, 40);
    const genre = String(req.query.genre ?? 'Müzik').trim().slice(0, 40);
    const motif = String(req.query.motif ?? 'turkuler').trim().slice(0, 24);

    if (!query) {
      res.json({ tracks: [], notice: 'Arama sorgusu belirtilmedi.' });
      return;
    }

    try {
      const searchUrl = new URL('https://archive.org/advancedsearch.php');
      searchUrl.searchParams.set(
        'q',
        `title:(${query}) AND mediatype:(audio) AND format:(VBR MP3 OR MP3) AND NOT access-restricted-item:true`
      );
      searchUrl.searchParams.append('fl[]', 'identifier');
      searchUrl.searchParams.append('fl[]', 'title');
      searchUrl.searchParams.append('fl[]', 'creator');
      searchUrl.searchParams.set('rows', '5');
      searchUrl.searchParams.set('output', 'json');

      const iaRes = await fetch(searchUrl.toString(), {
        headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro/1.0' },
      });

      const tracks: Array<Record<string, unknown>> = [];
      if (iaRes.ok) {
        const iaJson = (await iaRes.json()) as {
          response?: {
            docs?: Array<{ identifier: string; title?: string | string[]; creator?: string | string[] }>;
          };
        };
        const docs = (iaJson.response?.docs ?? []).slice(0, 4);
        const settled = await Promise.allSettled(
          docs.map(async (doc) => {
            const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, {
              headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro/1.0' },
            });
            if (!metaRes.ok) return null;
            const metaJson = (await metaRes.json()) as {
              result?: Array<{ name?: string; length?: string; bitrate?: string; title?: string; artist?: string; album?: string }>;
            };
            const files = (metaJson.result ?? [])
              .filter((f) => f.name && /\.(mp3|ogg|flac)$/i.test(f.name) && !f.name.includes('_64kb') && !f.name.startsWith('__'))
              .slice(0, 3);
            return { doc, files };
          })
        );

        for (const entry of settled) {
          if (entry.status !== 'fulfilled' || !entry.value) continue;
          const { doc, files } = entry.value;
          const docTitle = Array.isArray(doc.title) ? doc.title[0] : doc.title ?? doc.identifier;
          const docCreator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator ?? 'Açık Arşiv';
          for (const file of files) {
            if (!file.name) continue;
            const encodedPath = file.name.split('/').map((s) => encodeURIComponent(s)).join('/');
            const directUrl = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodedPath}`;
            if (!isAllowedAudioUrl(directUrl)) continue;
            const ext = file.name.split('.').pop()?.toUpperCase();
            const cleanTitle =
              file.title ||
              file.name.replace(/^.*\//, '').replace(/\.(mp3|ogg|flac)$/i, '').replace(/[_-]+/g, ' ').trim();
            tracks.push({
              contentId: `ia:${doc.identifier}:${file.name}`,
              title: cleanTitle || docTitle,
              artistId: `artist:${(file.artist || docCreator).toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '-')}`,
              artistName: file.artist || docCreator,
              album: file.album || docTitle,
              categoryId,
              language,
              genre,
              durationSec: file.length ? Math.round(Number.parseFloat(file.length)) || 0 : 0,
              streamUrl: directUrl,
              sourceProvider: 'internet_archive',
              downloadAllowed: true,
              licenseName: 'Internet Archive Açık Arşiv',
              bitrateKbps: file.bitrate ? Math.round(Number.parseFloat(file.bitrate)) || 192 : 192,
              format: ext === 'FLAC' ? 'FLAC' : ext === 'OGG' ? 'OGG' : 'MP3',
              motif,
            });
          }
        }
      }

      res.json({
        tracks,
        notice: tracks.length === 0 ? 'Aramanızla eşleşen açık arşiv kaydı bulunamadı.' : undefined,
      });
    } catch {
      res.status(502).json({ tracks: [], notice: 'Çevrimiçi arama şu an tamamlanamadı.' });
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

  // 5. SSRF-hardened Range-supporting Audio Streaming Proxy (Quran + Open Archive)
  const handleAudioProxy = async (req: Request, res: Response): Promise<void> => {
    const rawUrl = String(req.query.url ?? '');
    const validatedUrl = isAllowedAudioUrl(rawUrl);
    if (!validatedUrl) {
      res.status(400).json({ error: 'Yalnızca izin verilen açık lisanslı ses kaynakları desteklenir.' });
      return;
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        'User-Agent': 'AutoMusicPro/1.0',
        Accept: 'audio/*,*/*;q=0.8',
      };
      if (typeof req.headers.range === 'string') {
        upstreamHeaders.Range = req.headers.range;
      }

      const upstream = await fetchWithSafeRedirects(validatedUrl, upstreamHeaders);
      if (!upstream.ok && upstream.status !== 206) {
        res.status(upstream.status).json({ error: 'Ses dosyası kaynaktan alınamadı.' });
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

      if (req.method === 'HEAD' || !upstream.body) {
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
    } catch {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Ses akışı aktarılırken hata oluştu.' });
      }
    }
  };

  app.get('/api/audio/proxy', (req: Request, res: Response) => {
    void handleAudioProxy(req, res);
  });
  app.head('/api/audio/proxy', (req: Request, res: Response) => {
    void handleAudioProxy(req, res);
  });

  // Pre-warm SQLite category tracks gently in background so Spotify-style playlists are ready immediately
  catalogDb.warmPopularCategoriesInBackground();

  // Vite dev middleware vs production dist (HMR disabled cleanly to eliminate proxy WebSocket errors)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoMusic Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
