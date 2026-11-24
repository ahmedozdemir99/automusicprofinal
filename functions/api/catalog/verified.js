// Metadata only. MusicBrainz does not grant streaming rights.
const ARTISTS = {
  arabesk: [
    "Müslüm Gürses",
    "Ferdi Tayfur",
    "Orhan Gencebay",
    "İbrahim Tatlıses",
    "Bergen",
    "Hakkı Bulut",
    "Kibariye",
    "Ebru Gündeş",
    "Hakan Taşıyan",
    "Cengiz Kurtoğlu",
    "Ümit Besen",
    "Güllü",
  ],
  fantezi: [
    "Yıldız Tilbe",
    "Ebru Gündeş",
    "Sibel Can",
    "İbrahim Tatlıses",
    "Ferdi Tayfur",
    "Orhan Gencebay",
    "Cengiz Kurtoğlu",
    "Linet",
    "Funda Arar",
    "Hakan Altun",
    "Muazzez Ersoy",
  ],
  turk_pop: [
    "Sezen Aksu",
    "Nilüfer",
    "Yıldız Tilbe",
    "Tarkan",
    "Ajda Pekkan",
    "Sertab Erener",
    "Kenan Doğulu",
    "Mustafa Sandal",
    "Hande Yener",
    "Gülşen",
    "Sıla",
    "Mabel Matiz",
    "Teoman",
    "Göksel",
  ],
  nostalji: [
    "Barış Manço",
    "Cem Karaca",
    "Erkin Koray",
    "Zeki Müren",
    "Müzeyyen Senar",
    "Nilüfer",
    "Sezen Aksu",
    "Kayahan",
    "MFÖ",
    "İlhan İrem",
    "Edip Akbayram",
    "Fikret Kızılok",
    "Bülent Ortaçgil",
    "Selda Bağcan",
  ],
  turkuler: [
    "Neşet Ertaş",
    "Aşık Veysel",
    "Arif Sağ",
    "Musa Eroğlu",
    "Sabahat Akkiraz",
    "Muharrem Ertaş",
    "Yavuz Top",
    "Belkıs Akkale",
    "Zara",
    "İzzet Altınmeşe",
    "Tolga Sağ",
    "Erdal Erzincan",
    "Güler Duman",
  ],
  karadeniz: [
    "Kazım Koyuncu",
    "Volkan Konak",
    "Birol Topaloğlu",
    "Resul Dindar",
    "Selçuk Balcı",
    "İsmail Türüt",
    "Fuat Saka",
    "Ekin Uzunlar",
    "Şevval Sam",
    "Cimilli İbo",
    "Apolas Lermi",
    "Marsis",
  ],
  turk_sanat: [
    "Zeki Müren",
    "Müzeyyen Senar",
    "Münir Nurettin Selçuk",
    "Safiye Ayla",
    "Bülent Ersoy",
    "Emel Sayın",
    "Muazzez Ersoy",
    "Ahmet Özhan",
  ],
  turk_rock: [
    "Erkin Koray",
    "Barış Manço",
    "Cem Karaca",
    "Duman",
    "mor ve ötesi",
    "maNga",
    "Şebnem Ferah",
    "Teoman",
    "Athena",
    "Gripin",
    "Pentagram",
    "Kurban",
    "Kargo",
  ],
  ozgun: [
    "Ahmet Kaya",
    "Zülfü Livaneli",
    "Grup Yorum",
    "Ferhat Tunç",
    "Onur Akın",
    "Yeni Türkü",
    "Ezginin Günlüğü",
    "Edip Akbayram",
  ],
  ilahi: [
    "Abdurrahman Önül",
    "Mustafa Demirci",
    "Sedat Uçan",
    "Mehmet Emin Ay",
    "Eşref Ziya Terzi",
    "Ömer Karaoğlu",
  ],
  ezgi: [
    "Mustafa Cihat",
    "Eşref Ziya Terzi",
    "Ömer Karaoğlu",
    "Mustafa Demirci",
    "Grup Genç",
  ],
  nesid: ["Maher Zain", "Sami Yusuf", "Mesut Kurtis", "Ahmed Bukhatir"],
  zikirli_ilahiler: ["Abdurrahman Önül", "Ahmet Özhan", "Mustafa Demirci", "Mehmet Emin Ay"],
  tasavvuf: ["Ahmet Özhan", "Kudsi Erguner", "Ömer Faruk Tekbilek", "Necdet Yaşar"],
  azerice: ["Alim Qasimov", "Rashid Behbudov", "Brilliant Dadaşova", "Aygün Kazımova"],
  arapca: ["Fairuz", "Umm Kulthum", "Abdel Halim Hafez", "Amr Diab", "Nancy Ajram"],
  lazca: ["Kazım Koyuncu", "Birol Topaloğlu", "Marsis", "Zuğaşi Berepe"],
};

const clean = (s) => String(s || "").trim().slice(0, 100);

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const albumId = clean(url.searchParams.get("albumId"));

  if (albumId) {
    try {
      const relUrl = `https://musicbrainz.org/ws/2/release?release-group=${encodeURIComponent(albumId)}&inc=recordings&fmt=json&limit=5`;
      const relRes = await fetch(relUrl, {
        headers: {
          "User-Agent": "AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(9000),
      });
      if (!relRes.ok) throw Error("MB " + relRes.status);
      const data = await relRes.json();
      const bestRelease = (data.releases || [])
        .filter((r) => (r.media || []).some((m) => (m.tracks || []).length > 0))
        .sort(
          (a, b) =>
            (b.media || []).reduce((acc, m) => acc + (m.tracks?.length || 0), 0) -
            (a.media || []).reduce((acc, m) => acc + (m.tracks?.length || 0), 0)
        )[0];

      const tracks = [];
      if (bestRelease) {
        for (const medium of bestRelease.media || []) {
          const disc = medium.position || 1;
          for (const tr of medium.tracks || []) {
            const title = tr.title || tr.recording?.title;
            if (!title) continue;
            const lenMs = tr.length ?? tr.recording?.length ?? 0;
            tracks.push({
              position: tr.position || tracks.length + 1,
              disc,
              title,
              durationSec: lenMs > 0 ? Math.round(lenMs / 1000) : 0,
              recordingId: tr.recording?.id,
            });
          }
        }
      }
      return Response.json(
        {
          albumId,
          releaseDate: (bestRelease?.date || "").slice(0, 4),
          tracks,
          notice: tracks.length ? undefined : "Bu albüm için parça sıralaması bulunamadı.",
        },
        { headers: { "Cache-Control": "public, max-age=3600" } }
      );
    } catch {
      return Response.json({ albumId, tracks: [], notice: "Albüm parça listesi şu anda alınamıyor." });
    }
  }

  const category = clean(url.searchParams.get("categoryId"));
  const names = ARTISTS[category] || [];
  if (!names.length) {
    return Response.json({
      artists: [],
      albums: [],
      notice: "Bu kategori için doğrulanmış sanatçı seçkisi henüz hazırlanmadı.",
    });
  }

  const requested = clean(url.searchParams.get("artist"));
  if (!requested) return Response.json({ artists: names, albums: [], metadataOnly: true });
  if (!names.includes(requested)) return Response.json({ error: "Sanatçı bu seçkide yok." }, { status: 400 });

  const q = `artist:"${requested.replace(/["\\]/g, "")}" AND primarytype:album`;
  const endpoint = new URL("https://musicbrainz.org/ws/2/release-group/");
  endpoint.searchParams.set("query", q);
  endpoint.searchParams.set("fmt", "json");
  endpoint.searchParams.set("limit", "60");

  try {
    const res = await fetch(endpoint.toString(), {
      headers: {
        "User-Agent": "AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw Error("MusicBrainz " + res.status);
    const data = await res.json();
    const norm = (s) => String(s || "").toLocaleLowerCase("tr-TR").trim();
    const seen = new Set();
    const albums = (data["release-groups"] || [])
      .filter(
        (x) =>
          (x["artist-credit"] || []).some((a) => norm(a.artist?.name || a.name) === norm(requested)) &&
          x["primary-type"] === "Album"
      )
      .filter((x) => {
        const k = norm(x.title);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => (b["first-release-date"] || "").localeCompare(a["first-release-date"] || ""))
      .map((x) => ({
        id: x.id,
        title: x.title,
        year: (x["first-release-date"] || "").slice(0, 4),
        artist: requested,
        coverUrl: "https://coverartarchive.org/release-group/" + encodeURIComponent(x.id) + "/front-250",
        sourceUrl: "https://musicbrainz.org/release-group/" + encodeURIComponent(x.id),
      }));

    return Response.json(
      {
        artists: names,
        albums,
        metadataOnly: true,
        notice:
          "Albüm ve parça bilgileri MusicBrainz kaynağındandır. Albüme tıklayarak parça listesini görebilir ve ücretsiz açık ses kaynaklarında eşleştirme arayabilirsiniz.",
      },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch {
    return Response.json({
      artists: names,
      albums: [],
      metadataOnly: true,
      notice: "Albüm veritabanına şu anda ulaşılamıyor. Daha sonra yeniden deneyin.",
    });
  }
}