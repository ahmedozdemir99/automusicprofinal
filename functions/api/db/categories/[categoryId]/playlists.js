import { defaultCategories } from "../../categories.js";
import { fetchVerifiedCategoryTracks } from "../../../catalog/open-music.js";

export async function onRequestGet({ env, params, request }) {
  const categoryId = String(params.categoryId || "");
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(categoryId)) {
    return Response.json({ error: "Geçersiz kategori." }, { status: 400 });
  }

  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  let cached = [];

  if (env.DB) {
    try {
      const r = await env.DB.prepare(
        "SELECT payload FROM catalog_tracks WHERE category_id=? ORDER BY updated_at DESC LIMIT 250"
      )
        .bind(categoryId)
        .all();
      cached = (r.results || [])
        .map((x) => {
          try {
            return JSON.parse(x.payload);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      cached = [];
    }
  }

  if (cached.length && !forceRefresh) {
    return Response.json({
      categoryId,
      playlists: [
        {
          id: `cur-${categoryId}-1`,
          categoryId,
          title: `${defaultCategories.find((c) => c.id === categoryId)?.name || "Seçki"} Listesi`,
          subtitle: "Doğrulanmış Açık Arşiv",
          description: "Doğrudan dinlenebilir tam uzunlukta seçki",
          motif: defaultCategories.find((c) => c.id === categoryId)?.motif || "custom",
          tracks: cached,
          source: "database",
        },
      ],
      tracks: cached,
    });
  }

  const category = defaultCategories.find((c) => c.id === categoryId);
  if (!category || category.isQuran) {
    return Response.json({ categoryId, playlists: [], tracks: cached });
  }

  try {
    const fetched = await fetchVerifiedCategoryTracks(
      categoryId,
      category.language,
      category.genre,
      category.motif
    );
    const tracks = fetched.length ? fetched : cached;

    if (env.DB && fetched.length) {
      try {
        const statements = fetched.map((t) =>
          env.DB.prepare(
            "INSERT INTO catalog_tracks(content_id,category_id,payload,updated_at) VALUES (?,?,?,unixepoch()) ON CONFLICT(content_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at"
          ).bind(t.contentId, categoryId, JSON.stringify(t))
        );
        for (let i = 0; i < statements.length; i += 40) {
          await env.DB.batch(statements.slice(i, i + 40));
        }
      } catch {
        // Non-fatal if D1 table isn't initialized yet
      }
    }

    const playlists = tracks.length
      ? [
          {
            id: `cur-${categoryId}-1`,
            categoryId,
            title: `${category.name} Seçkisi`,
            subtitle: `${tracks.length} Doğrulanmış Parça`,
            description: category.subtitle,
            motif: category.motif,
            tracks,
            source: "database",
          },
        ]
      : [];

    return Response.json(
      {
        categoryId,
        playlists,
        tracks,
        notice: tracks.length
          ? undefined
          : "Bu kategoride açık arşivden eşleşen kayıt bulunamadı. Yerel ses dosyalarınızı ekleyebilirsiniz.",
      },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch {
    return Response.json({
      categoryId,
      playlists: [],
      tracks: cached,
      notice: "Kategori listeleri yüklenirken geçici bir bağlantı sorunu oluştu.",
    });
  }
}
