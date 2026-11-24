const defs = [
  ["nostalji", "Nostalji", "Eski plaklar ve dönem kayıtları", "Türkçe", "Nostalji"],
  ["karadeniz", "Karadeniz", "Kemençe, tulum ve yayla ezgileri", "Türkçe", "Karadeniz"],
  ["arapca", "Arapça müzik", "Klasik ud ve Arap sanatçılar", "Arapça", "Arapça müzik"],
  ["azerice", "Azerice müzik", "Muğam ve Azerbaycan eserleri", "Azerice", "Azerice müzik"],
  ["lazca", "Lazca müzik", "Doğu Karadeniz geleneksel ezgileri", "Lazca / Türkçe", "Lazca müzik"],
  ["turkuler", "Türküler", "Anadolu halk müziği", "Türkçe", "Türkü"],
  ["arabesk", "Arabesk", "Arabesk müzik", "Türkçe", "Arabesk"],
  ["fantezi", "Fantezi", "Duygusal yaylılar, güçlü vokaller ve fantezi klasikleri", "Türkçe", "Fantezi"],
  ["turk_sanat", "Türk sanat müziği", "Fasıl ve klasik Türk müziği", "Türkçe", "Türk sanat müziği"],
  ["turk_pop", "Türk pop", "Türkçe pop müzik", "Türkçe", "Pop"],
  ["turk_rock", "Türk rock", "Anadolu rock ve modern rock", "Türkçe", "Rock"],
  ["ozgun", "Özgün müzik", "Özgün müzik eserleri", "Türkçe", "Özgün müzik"],
  ["ilahi", "İlahi", "Türkçe ilahiler", "Türkçe", "İlahi"],
  ["ezgi", "Ezgi", "Manevi ezgiler", "Türkçe", "Ezgi"],
  ["nesid", "Neşid", "Vokal neşid kayıtları", "Türkçe / Arapça", "Neşid"],
  ["zikirli_ilahiler", "Zikirli ilahiler", "Zikirli ilahiler", "Türkçe", "Zikirli ilahi"],
  ["tasavvuf", "Tasavvuf müziği", "Ney ve tasavvuf eserleri", "Türkçe", "Tasavvuf"],
  ["kuran", "Kur'an-ı Kerim", "114 sure ve 6 kari", "Arapça", "Kur'an Tilaveti"],
];

export const defaultCategories = defs.map(([id, name, subtitle, language, genre], i) => ({
  id,
  name,
  subtitle,
  language,
  genre,
  order: i + 1,
  motif: id,
  accentHex: "#D4AF37",
  archiveQuery: "",
  isQuran: id === "kuran",
}));

export async function onRequestGet({ env }) {
  let custom = [];
  if (env.DB) {
    try {
      const result = await env.DB.prepare("SELECT payload FROM catalog_categories ORDER BY id LIMIT 100").all();
      custom = (result.results || [])
        .map((r) => {
          try {
            return JSON.parse(r.payload);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      custom = [];
    }
  }
  return Response.json(
    {
      categories: [...defaultCategories, ...custom.filter((c) => !defaultCategories.some((d) => d.id === c.id))],
      playlistsSummary: [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function onRequestPost({ env, request }) {
  try {
    const input = await request.json();
    const name = String(input.name || "").trim().slice(0, 70);
    if (name.length < 2) return Response.json({ error: "Geçerli bir kategori adı girin." }, { status: 400 });
    const id = "custom_" + crypto.randomUUID();
    const category = {
      id,
      name,
      subtitle: String(input.subtitle || "").slice(0, 150) || "Kişisel müzik kategorisi",
      language: String(input.language || "Türkçe").slice(0, 40),
      genre: String(input.genre || name).slice(0, 50),
      order: 100,
      motif: "custom",
      accentHex: "#D4AF37",
      archiveQuery: name,
      isCustom: true,
    };
    if (env.DB) {
      try {
        await env.DB.prepare("INSERT INTO catalog_categories (id,payload) VALUES (?,?)")
          .bind(id, JSON.stringify(category))
          .run();
      } catch {
        // Fallback: return created category so client localStorage persists it gracefully
      }
    }
    return Response.json({ category }, { status: 201 });
  } catch {
    return Response.json({ error: "Kategori kaydedilemedi." }, { status: 400 });
  }
}
