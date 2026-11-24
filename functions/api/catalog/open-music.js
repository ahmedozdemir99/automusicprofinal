const VERIFIED_CATEGORY_ARCHIVES = {
  nostalji: [
    { identifier: "OBenimteMZeyyenSenar", artistDisplay: "Müzeyyen Senar", albumDisplay: "Taş Plak Seçkisi", year: "1960" },
    { identifier: "SafiyeAyla", artistDisplay: "Safiye Ayla", albumDisplay: "Eski Plaklar", year: "1958" },
    { identifier: "hamiyet-yuceses-bakmiyor-cesmi-siyah-tas-plak", artistDisplay: "Hamiyet Yüceses", albumDisplay: "Taş Plak Arşivi", year: "1955" },
    { identifier: "hayat-genclik-boyunca", artistDisplay: "Münir Nurettin Selçuk", albumDisplay: "Nostalji Klasikleri", year: "1952" },
    { identifier: "Nilufer", artistDisplay: "Nilüfer", albumDisplay: "Klasik Seçki", year: "1978", maxFiles: 4 },
  ],
  karadeniz: [
    { identifier: "kazim-koyuncu-hayde", artistDisplay: "Kazım Koyuncu", albumDisplay: "Hayde", year: "2004", maxFiles: 4 },
    { identifier: "VolkanKonak", artistDisplay: "Volkan Konak", albumDisplay: "Karadeniz Seçkisi", maxFiles: 6 },
    { identifier: "2011BirolTopaloglu-kiyiBoyuKaradeniz", artistDisplay: "Birol Topaloğlu", albumDisplay: "Kıyı Boyu Karadeniz", year: "2011", maxFiles: 8 },
    { identifier: "gun-gelir", artistDisplay: "Karadeniz Akustik", albumDisplay: "Yayla Ezgileri", maxFiles: 4 },
  ],
  arapca: [
    { identifier: "y-2mate.com-haq-beladak-umm-kulthum", artistDisplay: "Ümmü Gülsüm (Umm Kulthum)", albumDisplay: "Klasik Arap Makamları" },
    { identifier: "442010-10-04.halim_408", artistDisplay: "Abdel Halim Hafez", albumDisplay: "Klasik Arap Müziği" },
    { identifier: "hussein-abdel-halim", artistDisplay: "Abdel Halim Hafez", albumDisplay: "Seçme Arapça Eserler", maxFiles: 6 },
  ],
  azerice: [
    { identifier: "HetGebouw-Azerbaijan_mugam", artistDisplay: "Azerbaycan Muğam Topluluğu", albumDisplay: "Muğam & Tar" },
    { identifier: "azerbaijanradio4", artistDisplay: "Azerbaycan Radyo Arşivi", albumDisplay: "Bakü Seçkisi" },
    { identifier: "azerbaijanradio5", artistDisplay: "Azerbaycan Halk Müziği", albumDisplay: "Geleneksel Ezgiler" },
  ],
  lazca: [
    { identifier: "TunannBeriYann01.07.2000BirolTopaloglu", artistDisplay: "Birol Topaloğlu", albumDisplay: "Lazca & Doğu Karadeniz", year: "2000" },
    { identifier: "kazim-koyuncu-hayde", artistDisplay: "Kazım Koyuncu", albumDisplay: "Hayde (Karadeniz & Lazuri)", year: "2004", maxFiles: 4 },
    { identifier: "TulumHoron", artistDisplay: "Karadeniz Tulum Topluluğu", albumDisplay: "Tulum & Horon" },
    { identifier: "2011BirolTopaloglu-kiyiBoyuKaradeniz", artistDisplay: "Birol Topaloğlu", albumDisplay: "Kıyı Boyu Lazuri", year: "2011", maxFiles: 6 },
  ],
  turkuler: [
    { identifier: "NesetErtasAcemKizi_201511", artistDisplay: "Neşet Ertaş", albumDisplay: "Bozkırın Tezenesi", maxFiles: 8 },
    { identifier: "AltinTurkuler05.HerSabahHerSeher", artistDisplay: "Anadolu Türkü Şenliği", albumDisplay: "Altın Türküler" },
    { identifier: "20Nisan2018TrkDiyar", artistDisplay: "Türkü Diyarı", albumDisplay: "Bağlama Seçkisi" },
    { identifier: "25Mays2018TrkDiyar", artistDisplay: "Türkü Diyarı", albumDisplay: "Anadolu Halk Ezgileri" },
  ],
  arabesk: [
    { identifier: "MslmGrsesSevYeterBalamalUzunVersiyon", artistDisplay: "Müslüm Gürses", albumDisplay: "Arabesk Klasikleri" },
    { identifier: "001.-ferdi-tayfur-haram-oldu-full-album-1986-orijinal-kaset-kayit", artistDisplay: "Ferdi Tayfur", albumDisplay: "Haram Oldu", year: "1986", maxFiles: 6 },
    { identifier: "001.-ferdi-tayfur-bende-ozledim-turkuola-1618-1982-ful-album", artistDisplay: "Ferdi Tayfur", albumDisplay: "Ben de Özledim", year: "1982", maxFiles: 6 },
    { identifier: "YlddzTilbeAKmkSakla2012OrjinalOrhanGencebayEleBirEmBr_201406", artistDisplay: "Orhan Gencebay & Yıldız Tilbe", albumDisplay: "Özel Arabesk" },
    { identifier: "seviyorum-seni-arabesk-pilakanto", artistDisplay: "Türkçe Arabesk Seçkisi", albumDisplay: "Gece Yolculuğu" },
  ],
  fantezi: [
    { identifier: "YlddzTilbeAKmkSakla2012OrjinalOrhanGencebayEleBirEmBr_201406", artistDisplay: "Yıldız Tilbe & Orhan Gencebay", albumDisplay: "Fantezi Seçkisi", year: "2012" },
    { identifier: "001.-ferdi-tayfur-bende-ozledim-turkuola-1618-1982-ful-album", artistDisplay: "Ferdi Tayfur", albumDisplay: "Ben de Özledim (Fantezi Klasik)", year: "1982", maxFiles: 4 },
    { identifier: "Nilufer", artistDisplay: "Nilüfer", albumDisplay: "Duygusal Fantezi & Pop", maxFiles: 4 },
    { identifier: "Sezen_Aksu_Fon_Mzikleri", artistDisplay: "Sezen Aksu", albumDisplay: "Duygusal Enstrümantal Seçki", maxFiles: 5 },
  ],
  turk_sanat: [
    { identifier: "hayat-genclik-boyunca", artistDisplay: "Münir Nurettin Selçuk", albumDisplay: "Klasik Türk Sanat Müziği" },
    { identifier: "birgamlihazaninseherinde", artistDisplay: "Münir Nurettin Selçuk", albumDisplay: "Fasıl Makamları" },
    { identifier: "OBenimteMZeyyenSenar", artistDisplay: "Müzeyyen Senar", albumDisplay: "Fasıl Seçkisi" },
    { identifier: "SafiyeAyla", artistDisplay: "Safiye Ayla", albumDisplay: "Klasik Makamlar" },
  ],
  turk_pop: [
    { identifier: "Sezen_Aksu_Fon_Mzikleri", artistDisplay: "Sezen Aksu", albumDisplay: "Sezen Aksu Seçkisi", maxFiles: 8 },
    { identifier: "Nilufer", artistDisplay: "Nilüfer", albumDisplay: "Nilüfer Seçkisi", maxFiles: 4 },
    { identifier: "tarkan-vay-anam-vay_202305", artistDisplay: "Tarkan", albumDisplay: "Türkçe Pop Seçkisi" },
    { identifier: "tarkan-ft.-mahmut-orhan-her-sey-fani", artistDisplay: "Tarkan & Mahmut Orhan", albumDisplay: "Modern Türkçe Pop" },
  ],
  turk_rock: [
    { identifier: "erkinkoray-elektronikturkuler1974", artistDisplay: "Erkin Koray", albumDisplay: "Elektronik Türküler", year: "1974", maxFiles: 8 },
    { identifier: "0888-tur8ku", artistDisplay: "Erkin Koray", albumDisplay: "Elektronik Türküler & Singles", year: "1974", maxFiles: 8 },
    { identifier: "erkin-koray-1973-lp", artistDisplay: "Erkin Koray", albumDisplay: "Erkin Koray (1973 LP)", year: "1973", maxFiles: 8 },
    { identifier: "cemkaraca_edirdahan-safinaz", artistDisplay: "Cem Karaca & Edirdahan", albumDisplay: "Safinaz", year: "1978", maxFiles: 4 },
    { identifier: "barismancocemkaracauzunincebiryoldayim", artistDisplay: "Barış Manço & Cem Karaca", albumDisplay: "Uzun İnce Bir Yoldayım", maxFiles: 4 },
    { identifier: "baris-manco-sozum-meclisten-disari-flac", artistDisplay: "Barış Manço", albumDisplay: "Sözüm Meclisten Dışarı", year: "1981", maxFiles: 8 },
    { identifier: "baris-manco-2023-2023-1975", artistDisplay: "Barış Manço", albumDisplay: "2023 Anadolu Rock", year: "1975", maxFiles: 6 },
  ],
  ozgun: [
    { identifier: "AhmetKayaSoyle", artistDisplay: "Ahmet Kaya", albumDisplay: "Özgün Seçki" },
    { identifier: "AhmetKayaKafamaSAkarGiderim", artistDisplay: "Ahmet Kaya", albumDisplay: "Seçme Eserler" },
    { identifier: "03.-zulfu-livaneli-buyuk-insanlik", artistDisplay: "Zülfü Livaneli", albumDisplay: "Özgün Klasikler", maxFiles: 6 },
    { identifier: "zulfu-livaneli-gozlerin", artistDisplay: "Zülfü Livaneli", albumDisplay: "Akustik Özgün" },
  ],
  ilahi: [
    { identifier: "Abdurrahmannl-ZahidSultan", artistDisplay: "Abdurrahman Önül", albumDisplay: "Gönülden Gönüle", maxFiles: 8 },
    { identifier: "ne-olur-gel-hele-abdurrahman-onul-ilahi", artistDisplay: "Abdurrahman Önül", albumDisplay: "Seçkin İlahiler" },
    { identifier: "NefseUyup-M.eminAy", artistDisplay: "Mehmet Emin Ay", albumDisplay: "Türkçe İlahi Seçkisi" },
  ],
  ezgi: [
    { identifier: "MustafaCihat-HepsiOndadr", artistDisplay: "Mustafa Cihat", albumDisplay: "Özgün Türkçe Ezgiler" },
    { identifier: "SehidTahdndaOmerKaraoglu", artistDisplay: "Ömer Karaoğlu", albumDisplay: "Klasik Ezgiler" },
    { identifier: "MustafaCihatGrddkKiEditByEnderHafazm", artistDisplay: "Mustafa Cihat", albumDisplay: "Akustik Ezgiler" },
  ],
  nesid: [
    { identifier: "y-2mate.com-maher-zain-rahmatun-lil-alameen-official-music-video", artistDisplay: "Maher Zain", albumDisplay: "Seçkin Neşidler" },
    { identifier: "emad--almansery--mp3--anasheed----37--nasheed---from-el-moslem.com", artistDisplay: "Emad Al-Mansery", albumDisplay: "Enstrümansız Vokal Neşid", maxFiles: 8 },
  ],
  zikirli_ilahiler: [
    { identifier: "Abdurrahmannl-ZahidSultan", artistDisplay: "Abdurrahman Önül", albumDisplay: "Zikirli İlahiler", maxFiles: 8 },
    { identifier: "NefseUyup-M.eminAy", artistDisplay: "Mehmet Emin Ay", albumDisplay: "Manevi Zikir Seçkisi" },
  ],
  tasavvuf: [
    { identifier: "NeyTaksimiMystery", artistDisplay: "Ney Taksimi Seçkisi", albumDisplay: "Tasavvuf & Sükûnet" },
    { identifier: "Tasavvuf2", artistDisplay: "Tasavvuf Topluluğu", albumDisplay: "Mevlevi & Ney Arşivi" },
  ],
};

function cleanTitle(raw, fallback) {
  const s = String(raw || "")
    .replace(/^.*\//, "")
    .replace(/\.(mp3|ogg|flac|m4a|wav)$/i, "")
    .replace(/^y-?2mate\.com\s*[-_]\s*/i, "")
    .replace(/www\.[a-z0-9.-]+/gi, "")
    .replace(/^\d{1,3}[\s._-]+(?=[a-zA-ZğüşöçıİĞÜŞÖÇ])/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.length >= 2 ? s : fallback;
}

function detectTrackType(title, album = "") {
  const text = `${title} ${album}`.toLocaleLowerCase("tr-TR");
  if (/\bkaraoke\b|\bbacking track\b/.test(text)) return "karaoke";
  if (/\bremix\b|\bclub mix\b|\bmashup\b/.test(text)) return "remix";
  if (/\bcover\b|\btribute\b/.test(text)) return "cover";
  if (/\blive\b|\bcanlı\b|\bkonser\b|\bunplugged\b/.test(text)) return "live";
  return "studio";
}

function formatPriority(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.endsWith(".mp3")) return 3;
  if (lower.endsWith(".flac")) return 2;
  if (lower.endsWith(".ogg")) return 1;
  return 0;
}

function parseDurationSec(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw) : 0;
  if (!raw) return 0;
  const s = String(raw).trim();
  if (s.includes(":")) {
    const parts = s.split(":").map((p) => Number.parseFloat(p));
    if (parts.every((n) => Number.isFinite(n))) {
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }
  }
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export async function fetchVerifiedCategoryTracks(categoryId, lang, genre, motif) {
  const sources = VERIFIED_CATEGORY_ARCHIVES[categoryId] || [];
  if (!sources.length) return [];
  const settled = await Promise.allSettled(
    sources.map(async (src) => {
      const res = await fetch(
        `https://archive.org/metadata/${encodeURIComponent(src.identifier)}/files`,
        {
          headers: { Accept: "application/json", "User-Agent": "AutoMusicPro4/1.0" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const rawAudio = (data.result || []).filter(
        (f) =>
          f.name &&
          /\.(mp3|ogg|flac)$/i.test(f.name) &&
          !f.name.includes("_64kb") &&
          !f.name.startsWith("__") &&
          !/(sample|preview|spectrogram|_meta)/i.test(f.name)
      );
      const bestByStem = new Map();
      for (const f of rawAudio) {
        const stem = f.name.replace(/\.(mp3|ogg|flac)$/i, "").toLowerCase();
        const prev = bestByStem.get(stem);
        if (!prev || formatPriority(f.name) > formatPriority(prev.name)) {
          bestByStem.set(stem, f);
        }
      }
      const coverUrl = `https://archive.org/services/img/${encodeURIComponent(src.identifier)}`;
      return Array.from(bestByStem.values())
        .slice(0, src.maxFiles || 6)
        .flatMap((f) => {
          const dur = parseDurationSec(f.length);
          if (dur > 0 && dur < 40) return [];
          const encodedPath = f.name.split("/").map(encodeURIComponent).join("/");
          const title = cleanTitle(
            f.title && f.title.trim().length > 2 && !/^track\s*\d+$/i.test(f.title.trim())
              ? f.title
              : f.name,
            src.albumDisplay
          );
          const ext = f.name.split(".").pop()?.toUpperCase();
          return [
            {
              contentId: `db:${categoryId}:${src.identifier}:${f.name}`,
              title,
              artistId: `artist:${src.artistDisplay.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, "-")}`,
              artistName: src.artistDisplay,
              album: src.albumDisplay,
              categoryId,
              language: lang,
              genre,
              durationSec: Number.isFinite(dur) && dur > 0 ? dur : 0,
              streamUrl: `https://archive.org/download/${encodeURIComponent(src.identifier)}/${encodedPath}`,
              sourceProvider: "internet_archive",
              downloadAllowed: true,
              licenseName: "Internet Archive Açık Arşiv",
              bitrateKbps: f.bitrate ? Math.round(Number.parseFloat(f.bitrate)) || 192 : 192,
              format: ext === "FLAC" ? "FLAC" : ext === "OGG" ? "OGG" : "MP3",
              motif,
              coverUrl,
              year: src.year,
              trackType: detectTrackType(title, src.albumDisplay),
            },
          ];
        });
    })
  );
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

async function searchArchive(q, categoryId, lang, genre, motif, offset) {
  const page = Math.floor(offset / 6) + 1;
  const u = new URL("https://archive.org/advancedsearch.php");
  const safeQ = q.replace(/["\\():]/g, " ").trim();
  u.searchParams.set(
    "q",
    `(title:(${safeQ}) OR creator:(${safeQ})) AND mediatype:(audio) AND format:(VBR MP3 OR MP3) AND NOT access-restricted-item:true`
  );
  for (const field of ["identifier", "title", "creator", "year"]) u.searchParams.append("fl[]", field);
  u.searchParams.set("rows", "6");
  u.searchParams.set("page", String(page));
  u.searchParams.set("output", "json");
  const res = await fetch(u.toString(), {
    headers: { Accept: "application/json", "User-Agent": "AutoMusicPro4/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const docs = (data.response?.docs || []).slice(0, 5);
  const settled = await Promise.allSettled(
    docs.map(async (doc) => {
      const r = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, {
        headers: { Accept: "application/json", "User-Agent": "AutoMusicPro4/1.0" },
        signal: AbortSignal.timeout(7000),
      });
      if (!r.ok) return [];
      const meta = await r.json();
      const docTitle = Array.isArray(doc.title) ? doc.title[0] : doc.title || doc.identifier;
      const docCreator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || "Açık Arşiv";
      const coverUrl = `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`;
      return (meta.result || [])
        .filter(
          (f) =>
            f.name &&
            /\.(mp3|ogg|flac)$/i.test(f.name) &&
            !f.name.includes("_64kb") &&
            !f.name.startsWith("__") &&
            !/(sample|preview|spectrogram|_meta)/i.test(f.name)
        )
        .slice(0, 4)
        .flatMap((f) => {
          const dur = parseDurationSec(f.length);
          if (dur > 0 && dur < 45) return [];
          const encodedPath = f.name.split("/").map(encodeURIComponent).join("/");
          const title = cleanTitle(f.title || f.name, docTitle);
          const artistName = String(f.artist || docCreator || "Açık Arşiv").trim();
          const ext = f.name.split(".").pop()?.toUpperCase();
          return [
            {
              contentId: `ia:${doc.identifier}:${f.name}`,
              title,
              artistId: `artist:${artistName.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, "-")}`,
              artistName,
              album: f.album || docTitle,
              categoryId,
              language: lang,
              genre,
              durationSec: Number.isFinite(dur) ? dur : 0,
              streamUrl: `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodedPath}`,
              sourceProvider: "internet_archive",
              downloadAllowed: true,
              licenseName: "Internet Archive Açık Arşiv",
              bitrateKbps: f.bitrate ? Math.round(Number.parseFloat(f.bitrate)) || 192 : 192,
              format: ext === "FLAC" ? "FLAC" : ext === "OGG" ? "OGG" : "MP3",
              motif,
              coverUrl,
              year: doc.year ? String(doc.year).slice(0, 4) : undefined,
              trackType: detectTrackType(title, f.album || docTitle),
            },
          ];
        });
    })
  );
  return settled.flatMap((x) => (x.status === "fulfilled" ? x.value : []));
}

async function searchAudius(q, categoryId, lang, genre, motif, offset) {
  try {
    const u = new URL("https://discoveryprovider.audius.co/v1/tracks/search");
    u.searchParams.set("query", q);
    u.searchParams.set("limit", "12");
    if (offset > 0) u.searchParams.set("offset", String(offset));
    const res = await fetch(u.toString(), {
      headers: { Accept: "application/json", "User-Agent": "AutoMusicPro4/1.0" },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((t) => t.id && t.title && t.is_streamable !== false && (!t.duration || t.duration >= 45))
      .map((t) => ({
        contentId: `audius:${t.id}`,
        title: String(t.title).trim(),
        artistId: `audius-artist:${t.user?.id || "audius"}`,
        artistName: t.user?.name || t.user?.handle || "Audius Sanatçısı",
        album: t.genre ? `Audius · ${t.genre}` : "Audius Açık Katalog",
        categoryId,
        language: lang,
        genre: t.genre || genre,
        durationSec: Number(t.duration) || 0,
        streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${encodeURIComponent(t.id)}/stream`,
        sourceProvider: "audius",
        downloadAllowed: false,
        licenseName: "Audius Açık Dinleme",
        bitrateKbps: 320,
        format: "MP3",
        motif,
        coverUrl: t.artwork?.["480x480"] || t.artwork?.["150x150"],
        year: t.release_date ? String(t.release_date).slice(0, 4) : undefined,
        trackType: detectTrackType(t.title),
      }));
  } catch {
    return [];
  }
}

async function searchWikimedia(q, categoryId, lang, genre, motif, offset) {
  try {
    const u = new URL("https://commons.wikimedia.org/w/api.php");
    u.searchParams.set("action", "query");
    u.searchParams.set("generator", "search");
    u.searchParams.set("gsrsearch", `${q} filetype:audio`);
    u.searchParams.set("gsrnamespace", "6");
    u.searchParams.set("gsrlimit", "6");
    if (offset > 0) u.searchParams.set("gsroffset", String(offset));
    u.searchParams.set("prop", "imageinfo");
    u.searchParams.set("iiprop", "url|mime|duration|extmetadata");
    u.searchParams.set("format", "json");
    const res = await fetch(u.toString(), {
      headers: { Accept: "application/json", "User-Agent": "AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)" },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const out = [];
    for (const page of Object.values(data.query?.pages || {})) {
      const info = page.imageinfo?.[0];
      if (!info?.url || !info.url.startsWith("https://upload.wikimedia.org/")) continue;
      if (!/\.(mp3|ogg|oga|flac|wav)$/i.test(info.url)) continue;
      const dur = Math.round(Number(info.duration) || 0);
      if (dur > 0 && dur < 40) continue;
      const title = cleanTitle(String(page.title || "").replace(/^File:/i, ""), q);
      const rawArtist = String(info.extmetadata?.Artist?.value || "").replace(/<[^>]+>/g, "").trim();
      const artistName = rawArtist ? rawArtist.slice(0, 80) : "Wikimedia Commons";
      const ext = info.url.split(".").pop()?.toUpperCase();
      out.push({
        contentId: `wiki:${page.pageid}`,
        title,
        artistId: `wiki-artist:${artistName.toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, "-")}`,
        artistName,
        album: "Wikimedia Commons Ses Arşivi",
        categoryId,
        language: lang,
        genre,
        durationSec: dur,
        streamUrl: info.url,
        sourceProvider: "wikimedia",
        downloadAllowed: true,
        licenseName: info.extmetadata?.LicenseShortName?.value || "Wikimedia Açık Lisans",
        format: ext === "FLAC" ? "FLAC" : ext === "WAV" ? "WAV" : ext === "MP3" ? "MP3" : "OGG",
        motif,
        trackType: detectTrackType(title),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function searchJamendo(env, q, categoryId, lang, genre, motif, offset) {
  if (!env?.JAMENDO_CLIENT_ID) return [];
  try {
    const u = new URL("https://api.jamendo.com/v3.0/tracks/");
    for (const [k, v] of Object.entries({
      client_id: env.JAMENDO_CLIENT_ID,
      format: "json",
      limit: "12",
      offset: String(offset),
      search: q,
      audioformat: "mp32",
      include: "licenses",
      imagesize: "300",
    })) {
      u.searchParams.set(k, v);
    }
    const res = await fetch(u.toString(), { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter((t) => t.audio?.startsWith("https://") && (Number(t.duration) || 0) >= 45)
      .map((t) => ({
        contentId: `jamendo:${t.id}`,
        title: t.name,
        artistId: `jamendo-artist:${t.artist_id}`,
        artistName: t.artist_name,
        album: t.album_name || genre,
        categoryId,
        language: lang,
        genre,
        durationSec: Number(t.duration) || 0,
        streamUrl: t.audio,
        sourceProvider: "jamendo",
        downloadAllowed: Boolean(t.audiodownload_allowed),
        licenseName: t.license_ccurl || "Jamendo CC",
        bitrateKbps: 192,
        format: "MP3",
        motif,
        coverUrl: t.image || t.album_image || undefined,
        trackType: detectTrackType(t.name, t.album_name || ""),
      }));
  } catch {
    return [];
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const category = (url.searchParams.get("categoryId") || "turkuler").slice(0, 40);
  const lang = (url.searchParams.get("language") || "Türkçe").slice(0, 40);
  const genre = (url.searchParams.get("genre") || "Müzik").slice(0, 40);
  const motif = (url.searchParams.get("motif") || "turkuler").slice(0, 30);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const offset = Math.min(200, Math.max(0, Number(url.searchParams.get("offset")) || 0));

  let merged = [];
  if (!q && VERIFIED_CATEGORY_ARCHIVES[category]) {
    merged = await fetchVerifiedCategoryTracks(category, lang, genre, motif);
  } else if (q) {
    const [ia, aud, wiki, jam] = await Promise.allSettled([
      searchArchive(q, category, lang, genre, motif, offset),
      searchAudius(q, category, lang, genre, motif, offset),
      searchWikimedia(q, category, lang, genre, motif, offset),
      searchJamendo(env, q, category, lang, genre, motif, offset),
    ]);
    merged = [
      ...(ia.status === "fulfilled" ? ia.value : []),
      ...(aud.status === "fulfilled" ? aud.value : []),
      ...(jam.status === "fulfilled" ? jam.value : []),
      ...(wiki.status === "fulfilled" ? wiki.value : []),
    ];
  }

  const seenIds = new Set();
  const seenKeys = new Set();
  const tracks = merged.filter((t) => {
    const key = `${String(t.artistName || "").toLocaleLowerCase("tr-TR")}::${String(t.title || "").toLocaleLowerCase("tr-TR")}`;
    if (!t.contentId || seenIds.has(t.contentId) || seenKeys.has(key)) return false;
    seenIds.add(t.contentId);
    seenKeys.add(key);
    return true;
  });

  return Response.json(
    {
      tracks,
      offset,
      hasMore: tracks.length >= 8,
      total: tracks.length,
      categoryId: category,
      notice: tracks.length ? undefined : "Aramanızla eşleşen ücretsiz açık lisanslı tam parça bulunamadı.",
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
