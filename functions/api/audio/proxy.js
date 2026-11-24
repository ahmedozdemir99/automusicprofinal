const EXACT_ALLOWED_HOSTS = new Set([
  "cdn.mp3quran.net",
  "cdn.islamic.network",
  "download.quranicaudio.com",
  "everyayah.com",
  "www.everyayah.com",
  "archive.org",
  "prod-1.storage.jamendo.com",
  "mp3d.jamendo.com",
  "mp3l.jamendo.com",
  "discoveryprovider.audius.co",
  "upload.wikimedia.org",
]);

function allowed(raw, allowAudiusCdnRedirect = false) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    if (u.port && u.port !== "443") return null;
    const host = u.hostname.toLowerCase();
    if (
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
      host.includes(":") ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return null;
    }
    if (
      EXACT_ALLOWED_HOSTS.has(host) ||
      /^server\d+\.mp3quran\.net$/.test(host) ||
      /^(ia|dn)\d+\.(us|ca|eu)\.archive\.org$/.test(host) ||
      /^[a-z0-9-]+\.audius\.co$/.test(host) ||
      /^audius-content-\d+\.figment\.io$/.test(host) ||
      /^blockdaemon-audius-content-\d+\.bdnodes\.net$/.test(host) ||
      /^cn\d*\.audius\./.test(host) ||
      (allowAudiusCdnRedirect && /^[a-z0-9-]+\.[a-f0-9]+\.r2\.cloudflarestorage\.com$/.test(host))
    ) {
      return u;
    }
    return null;
  } catch {
    return null;
  }
}

async function handleProxy(request, method) {
  const raw = new URL(request.url).searchParams.get("url");
  let target = allowed(raw, false);
  if (!target) {
    return Response.json(
      { error: "Yalnızca izin verilen açık lisanslı ses kaynakları desteklenir." },
      { status: 400 }
    );
  }
  const isAudiusOrigin =
    target.hostname.toLowerCase().endsWith(".audius.co") ||
    target.hostname.toLowerCase() === "audius.co";

  try {
    let upstream = null;
    for (let i = 0; i < 6; i++) {
      const headers = {
        "User-Agent": "AutoMusicPro4/1.0",
        Accept: "audio/*,*/*;q=0.8",
      };
      if (request.headers.has("range")) {
        headers.Range = request.headers.get("range");
      }
      upstream = await fetch(target.toString(), {
        method,
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
      });
      if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get("location");
        if (!location) break;
        const next = allowed(new URL(location, target).toString(), isAudiusOrigin);
        if (!next) {
          return Response.json(
            { error: "Ses yönlendirmesi izin verilen açık kaynaklar dışında." },
            { status: 400 }
          );
        }
        target = next;
        continue;
      }
      break;
    }

    if (!upstream || (!upstream.ok && upstream.status !== 206)) {
      const status = upstream?.status || 502;
      const msg =
        status === 403
          ? "Ses kaynağı erişimi reddetti (HTTP 403)."
          : status === 404
            ? "Ses dosyası kaynakta bulunamadı (HTTP 404)."
            : status === 429
              ? "Ses sağlayıcısı istek sınırına ulaştı (HTTP 429)."
              : `Ses kaynağına erişilemedi (HTTP ${status}).`;
      return Response.json({ error: msg, status }, { status });
    }

    const headers = new Headers();
    for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      if (upstream.headers.has(h)) headers.set(h, upstream.headers.get(h));
    }
    if (!headers.has("content-type")) headers.set("content-type", "audio/mpeg");
    if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    if (err && err.name === "TimeoutError") {
      return Response.json({ error: "Ses kaynağı zaman aşımına uğradı." }, { status: 504 });
    }
    return Response.json({ error: "Ses akışı aktarılırken bağlantı hatası oluştu." }, { status: 502 });
  }
}

export async function onRequestGet({ request }) {
  return handleProxy(request, "GET");
}

export async function onRequestHead({ request }) {
  return handleProxy(request, "HEAD");
}
