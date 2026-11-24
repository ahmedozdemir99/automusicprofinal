import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Car,
  Disc3,
  Download,
  ListMusic,
  Play,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { ArtworkCover } from '../components/ArtworkCover';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { TrackRow } from '../components/TrackRow';
import { useAutoMusic } from '../context/AutoMusicContext';
import { RECITERS, SURAHS, buildSurahMediaItem } from '../data/quranData';
import { formatBytesGb } from '../services/offlineDb';

export const HomeScreen: React.FC = () => {
  const {
    categories,
    featuredPlaylistsSummary,
    selectedReciterId,
    recentlyPlayed,
    playlists,
    downloads,
    storageEstimate,
    navigate,
    playQueue,
    setCarMode,
  } = useAutoMusic();

  const activeReciter = useMemo(
    () => RECITERS.find((r) => r.id === selectedReciterId) ?? RECITERS[0],
    [selectedReciterId]
  );

  const featuredSurahs = useMemo(() => {
    const picks = [0, 35, 54, 66, 93, 111]; // Fatiha, Yasin, Rahman, Mulk, Insirah, Ihlas
    return picks.map((i) => buildSurahMediaItem(SURAHS[i], activeReciter));
  }, [activeReciter]);

  // One Spotify-style database curated playlist per key category for the home showcase
  const spotlightLists = useMemo(() => {
    const seen = new Set<string>();
    return featuredPlaylistsSummary
      .filter((p) => {
        if (seen.has(p.categoryId)) return false;
        seen.add(p.categoryId);
        return true;
      })
      .slice(0, 8);
  }, [featuredPlaylistsSummary]);

  return (
    <div className="space-y-10 pb-10">
      {/* Focal Hero Banner — Strictly Aligned & Proportional Action Buttons */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#17150F] via-[#111115] to-[#0B0B0E] border border-white/[0.08] p-6 sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.45) 0%, rgba(212,175,55,0) 70%)',
          }}
        />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-xs font-medium text-[#D4AF37]">
              PWA &amp; Bluetooth Araç Medya · Çevrimiçi ve Çevrimdışı Ses Deneyimi
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F2EB] tracking-tight leading-tight text-balance">
              Yolda ve her an saf ses kalitesiyle müzik ve Kur'an-ı Kerim
            </h1>
            <p className="text-sm sm:text-base text-[#A8A49B] max-w-2xl leading-relaxed">
              {categories.length} müzik kategorisi, 114 surelik Kur'an-ı Kerim arşivi, akıllı çevrimdışı kayıt ve gerçek 10 bantlı ekolayzır tek çatı altında.
            </p>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => void playQueue(featuredSurahs, false)}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                Dinlemeye Başla
              </button>
              <button
                type="button"
                onClick={() => setCarMode(true)}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
              >
                <Car className="w-4 h-4 text-[#D4AF37] shrink-0" />
                Araç Modu
              </button>
              <PWAInstallButton variant="primary" />
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate({ name: 'categories' })}
              className="h-full p-4 rounded-2xl bg-[#0D0D11]/90 border border-white/[0.07] hover:border-[#D4AF37]/40 text-left transition-colors flex flex-col justify-between"
            >
              <Disc3 className="w-5 h-5 text-[#D4AF37] mb-3" />
              <div>
                <p className="text-xl font-bold font-mono tabular-nums text-[#F5F2EB]">
                  {categories.length}
                </p>
                <p className="text-xs text-[#9B978E] mt-0.5">Müzik Kategorisi</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'quran' })}
              className="h-full p-4 rounded-2xl bg-[#0D0D11]/90 border border-white/[0.07] hover:border-[#D4AF37]/40 text-left transition-colors flex flex-col justify-between"
            >
              <BookOpen className="w-5 h-5 text-[#D4AF37] mb-3" />
              <div>
                <p className="text-xl font-bold font-mono tabular-nums text-[#F5F2EB]">114</p>
                <p className="text-xs text-[#9B978E] mt-0.5">Sure · 6 Kari</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'downloads' })}
              className="h-full p-4 rounded-2xl bg-[#0D0D11]/90 border border-white/[0.07] hover:border-[#D4AF37]/40 text-left transition-colors flex flex-col justify-between"
            >
              <Download className="w-5 h-5 text-[#D4AF37] mb-3" />
              <div>
                <p className="text-xl font-bold font-mono tabular-nums text-[#F5F2EB]">
                  {downloads.length}
                </p>
                <p className="text-xs text-[#9B978E] mt-0.5 truncate">
                  {formatBytesGb(storageEstimate.archiveUsedBytes)} Arşiv
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'audio_settings' })}
              className="h-full p-4 rounded-2xl bg-[#0D0D11]/90 border border-white/[0.07] hover:border-[#D4AF37]/40 text-left transition-colors flex flex-col justify-between"
            >
              <SlidersHorizontal className="w-5 h-5 text-[#D4AF37] mb-3" />
              <div>
                <p className="text-xl font-bold font-mono tabular-nums text-[#F5F2EB]">320</p>
                <p className="text-xs text-[#9B978E] mt-0.5">kbps Tercih &amp; EQ</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-[#F5F2EB]">Son Dinlenenler</h2>
            <button
              type="button"
              onClick={() => void playQueue(recentlyPlayed, false)}
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              Tümünü Sıralı Çal
            </button>
          </div>
          <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
            {recentlyPlayed.slice(0, 5).map((item, idx) => (
              <TrackRow key={item.contentId} item={item} index={idx} queueContext={recentlyPlayed} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Preview Grid (All 17 with Bespoke Category Symbols) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#F5F2EB]">Müzik Kategorileri</h2>
            <p className="text-xs text-[#9B978E] mt-0.5">
              Türkçe ağırlıklı {categories.length} özel kategori · Her kategoriye özgün sembol ve hazır listeler
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'categories' })}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
          >
            Tümünü Gör ({categories.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {categories.slice(0, 12).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                cat.isQuran
                  ? navigate({ name: 'quran' })
                  : navigate({ name: 'track_list', categoryId: cat.id, title: cat.name })
              }
              className="group h-full p-4 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.06] hover:border-[#D4AF37]/30 text-left transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between w-full">
                <ArtworkCover motif={cat.motif} size="sm" />
                <span className="text-xs font-mono tabular-nums text-[#6F6C64] group-hover:text-[#D4AF37]">
                  {String(cat.order).padStart(2, '0')}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F5F2EB] truncate">{cat.name}</p>
                <p className="text-xs text-[#8C887F] truncate mt-0.5">{cat.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Spotify-style Database Curated Playlists Showcase */}
      {spotlightLists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#F5F2EB]">Öne Çıkan Kategori Listeleri</h2>
              <p className="text-xs text-[#9B978E] mt-0.5">
                Veritabanından hazırlanan Türkçe ve seçkin kategori çalma listeleri
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ name: 'categories' })}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              Kategorileri Keşfet
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {spotlightLists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() =>
                  pl.categoryId === 'kuran'
                    ? navigate({ name: 'quran' })
                    : navigate({ name: 'track_list', categoryId: pl.categoryId, title: pl.categoryName })
                }
                className="group h-full p-4 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.06] hover:border-[#D4AF37]/30 text-left transition-colors flex items-center gap-3.5"
              >
                <ArtworkCover motif={pl.motif} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#D4AF37] truncate">{pl.categoryName}</p>
                  <p className="text-sm font-semibold text-[#F5F2EB] truncate mt-0.5 group-hover:text-[#E5C158] transition-colors">
                    {pl.title}
                  </p>
                  <p className="text-xs text-[#8C887F] truncate mt-0.5">{pl.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Quran Quick Highlights & Personal Playlists Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#F5F2EB]">Kur'an-ı Kerim Seçkisi</h2>
              <p className="text-xs text-[#9B978E] mt-0.5">
                Aktif Kari: {activeReciter.nameTr} · Türkçe meal ve çevrimdışı kayıt destekli
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ name: 'quran' })}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              114 Sure
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
            {featuredSurahs.map((item, idx) => (
              <TrackRow
                key={item.contentId}
                item={item}
                index={idx}
                queueContext={featuredSurahs}
                onOpenDetail={() =>
                  navigate({
                    name: 'surah_detail',
                    surahNumber: item.surahNumber!,
                    reciterId: item.reciterId!,
                  })
                }
              />
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-[#F5F2EB]">Çalma Listelerim</h2>
            <button
              type="button"
              onClick={() => navigate({ name: 'create_playlist' })}
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              Yeni Liste Oluştur
            </button>
          </div>

          <div className="space-y-3">
            {playlists.slice(0, 4).map((pl) => (
              <div
                key={pl.id}
                className="p-4 rounded-2xl bg-[#121216] border border-white/[0.06] hover:border-[#D4AF37]/30 flex items-center justify-between gap-3 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => navigate({ name: 'playlist_detail', playlistId: pl.id })}
                  className="flex items-center gap-3.5 min-w-0 text-left flex-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1A1812] border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                    <ListMusic className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#F5F2EB] truncate">{pl.name}</p>
                    <p className="text-xs text-[#9B978E] truncate mt-0.5">
                      {pl.items.length} kayıt · {pl.description}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void playQueue(pl.items, false)}
                  aria-label={`${pl.name} listesini oynat`}
                  className="w-10 h-10 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] flex items-center justify-center shrink-0 transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            ))}

            {/* Quick Artists Shortcut */}
            <button
              type="button"
              onClick={() => navigate({ name: 'artists' })}
              className="w-full p-4 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F5F2EB] truncate">Sanatçılar ve Kariler</p>
                  <p className="text-xs text-[#9B978E] truncate">Sanatçı adına göre filtrele ve tüm kayıtları dinle</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8C887F] shrink-0" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
