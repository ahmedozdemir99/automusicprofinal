import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Download,
  Heart,
  Layers,
  ListMusic,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shuffle,
  Upload,
  X,
} from 'lucide-react';
import { ArtworkCover } from '../components/ArtworkCover';
import { TrackRow, formatDuration } from '../components/TrackRow';
import { useAutoMusic } from '../context/AutoMusicContext';
import { RECITERS, SURAHS, buildSurahMediaItem } from '../data/quranData';
import {
  VerifiedAlbum,
  VerifiedAlbumTrack,
  fuzzyMatchScore,
  normalizeSearchText,
  openMusicRepository,
} from '../services/catalogRepository';
import { ArtistSummary, MediaItem } from '../types/media';

// ============================================================
// Screen 2: Müzik Kategorileri (All 17 + Multi-Category Joint Playlist + Add Category)
// ============================================================
export const CategoriesScreen: React.FC = () => {
  const {
    categories,
    addCategory,
    navigate,
    loadCategoryTracks,
    discoverMoreCategoryTracks,
    downloadCategoryTracks,
    isOfflineDownloaded,
    catalogTracksByCategory,
    loadingCategories,
    playQueue,
    createPlaylist,
    showToast,
  } = useAutoMusic();
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newLanguage, setNewLanguage] = useState('Türkçe');
  const [buildingCombined, setBuildingCombined] = useState(false);
  const [discoveringCatId, setDiscoveringCatId] = useState<string | null>(null);
  const [downloadingCatId, setDownloadingCatId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleAccordion = async (catId: string, isQuran?: boolean) => {
    if (expandedCategoryId === catId) {
      setExpandedCategoryId(null);
      return;
    }
    setExpandedCategoryId(catId);
    if (!isQuran && !catalogTracksByCategory[catId]) {
      await loadCategoryTracks(catId);
    }
  };

  const handleCreateCombinedPlaylist = async () => {
    if (selectedIds.length < 2) {
      showToast('Ortak liste için en az 2 kategori seçin.');
      return;
    }
    setBuildingCombined(true);
    try {
      const combinedTracks: MediaItem[] = [];
      for (const cid of selectedIds) {
        const items = await loadCategoryTracks(cid);
        combinedTracks.push(...items.slice(0, 12));
      }
      const names = categories
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => c.name);
      const pl = createPlaylist(
        `Karma: ${names.slice(0, 2).join(' + ')}${names.length > 2 ? ` (+${names.length - 2})` : ''}`,
        `${names.join(', ')} kategorilerinden ortak çalma listesi`,
        combinedTracks,
        false,
        selectedIds
      );
      setMultiSelectMode(false);
      setSelectedIds([]);
      navigate({ name: 'playlist_detail', playlistId: pl.id });
    } finally {
      setBuildingCombined(false);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addCategory(newName, newSubtitle, newLanguage, newName);
    setNewName('');
    setNewSubtitle('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Müzik Kategorileri</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            {categories.length} ayrı kategori · Her kategoriye özel simge ve hazır veritabanı listeleri
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMultiSelectMode((v) => !v);
              setSelectedIds([]);
            }}
            className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
              multiSelectMode
                ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                : 'bg-[#141418] text-[#F5F2EB] border-white/10 hover:border-[#D4AF37]/40'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            {multiSelectMode ? 'Seçimi İptal Et' : 'Ortak Liste Seç'}
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-white/10 text-xs font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#D4AF37] shrink-0" />
            Yeni Kategori
          </button>
        </div>
      </div>

      {multiSelectMode && (
        <div className="p-4 rounded-2xl bg-[#17150F] border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-[#F5F2EB]">
            <span className="font-mono tabular-nums font-semibold text-[#D4AF37]">{selectedIds.length}</span>{' '}
            kategori seçildi. Birden fazla kategori seçerek ortak çalma listesi oluşturabilirsiniz.
          </div>
          <button
            type="button"
            disabled={selectedIds.length < 2 || buildingCombined}
            onClick={() => void handleCreateCombinedPlaylist()}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#D4AF37] disabled:opacity-40 text-[#09090B] text-xs font-semibold whitespace-nowrap shrink-0"
          >
            {buildingCombined && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Ortak Çalma Listesi Oluştur
          </button>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddCategory}
          className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div className="space-y-1.5">
            <label className="text-xs text-[#9B978E]">Kategori Adı</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Örn: Klasik Enstrümantal"
              className="w-full h-11 px-3.5 rounded-xl bg-[#0B0B0E] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#9B978E]">Açıklama</label>
            <input
              type="text"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              placeholder="Kısa kategori açıklaması"
              className="w-full h-11 px-3.5 rounded-xl bg-[#0B0B0E] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#9B978E]">Dil</label>
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#0B0B0E] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors"
          >
            Kategoriyi Kaydet
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          const isExpanded = expandedCategoryId === cat.id;
          const catTracks = cat.isQuran
            ? SURAHS.slice(0, 16).map((s) => buildSurahMediaItem(s, RECITERS[0]))
            : catalogTracksByCategory[cat.id] ?? [];
          const isLoading = Boolean(loadingCategories[cat.id]);

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-[#1D1A10] border-[#D4AF37]'
                  : isExpanded
                  ? 'bg-[#15141A] border-[#D4AF37]/50 shadow-lg'
                  : 'bg-[#121216] border-white/[0.06] hover:border-[#D4AF37]/30'
              }`}
            >
              <div className="p-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (multiSelectMode) {
                      toggleSelect(cat.id);
                    } else {
                      void handleToggleAccordion(cat.id, cat.isQuran);
                    }
                  }}
                  className="flex items-center gap-3.5 min-w-0 text-left flex-1"
                >
                  <ArtworkCover motif={cat.motif} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono tabular-nums text-[#D4AF37]">
                        {String(cat.order).padStart(2, '0')}
                      </span>
                      {multiSelectMode ? (
                        <span
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isSelected ? 'bg-[#D4AF37] border-[#D4AF37] text-[#09090B]' : 'border-white/25'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#7C7970] truncate">{cat.language}</span>
                      )}
                    </div>
                    <p className="text-base font-semibold text-[#F5F2EB] truncate mt-0.5">{cat.name}</p>
                    <p className="text-xs text-[#9B978E] truncate mt-0.5">{cat.subtitle}</p>
                  </div>
                </button>

                {!multiSelectMode && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleAccordion(cat.id, cat.isQuran)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        isExpanded
                          ? 'bg-[#D4AF37] text-[#09090B]'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#D4AF37]'
                      }`}
                      title={isExpanded ? 'Akordion Kapat' : 'Akordion Aç'}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Kapat</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Şarkılar</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (cat.isQuran) navigate({ name: 'quran' });
                        else navigate({ name: 'track_list', categoryId: cat.id, title: cat.name });
                      }}
                      className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#F5F2EB] transition-colors"
                      title="Detay Sayfası"
                    >
                      Detay
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion Inline Drawer */}
              {isExpanded && !multiSelectMode && (() => {
                const downloadableRemaining = catTracks.filter(
                  (t) => t.downloadAllowed && !t.isLocalFile && !isOfflineDownloaded(t.contentId)
                ).length;
                const isDiscovering = discoveringCatId === cat.id;
                const isDownloadingCat = downloadingCatId === cat.id;

                return (
                  <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-[#D4AF37] font-medium">
                        {cat.name} {cat.isQuran ? 'Örnek Sureler' : 'Kayıtları'} ({catTracks.length})
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={catTracks.length === 0}
                          onClick={() => void playQueue(catTracks, false)}
                          className="h-7 px-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-[#09090B] text-xs font-semibold flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Sıralı
                        </button>
                        <button
                          type="button"
                          disabled={catTracks.length === 0}
                          onClick={() => void playQueue(catTracks, true)}
                          className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-[#F5F2EB] text-xs font-medium flex items-center gap-1"
                        >
                          <Shuffle className="w-3 h-3 text-[#D4AF37]" />
                          Karışık
                        </button>
                        <button
                          type="button"
                          disabled={catTracks.length === 0 || isDownloadingCat || downloadableRemaining === 0}
                          onClick={async () => {
                            setDownloadingCatId(cat.id);
                            try {
                              await downloadCategoryTracks(cat.id);
                            } finally {
                              setDownloadingCatId(null);
                            }
                          }}
                          title="Kategorideki tüm indirilebilir parçaları çevrimdışı arşive kaydet"
                          className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-[#F5F2EB] text-xs font-medium flex items-center gap-1"
                        >
                          {isDownloadingCat ? (
                            <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
                          ) : (
                            <Download className="w-3 h-3 text-[#D4AF37]" />
                          )}
                          {downloadableRemaining > 0 ? `İndir (${downloadableRemaining})` : 'İndirildi'}
                        </button>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-xs text-[#9B978E]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        Parçalar yükleniyor...
                      </div>
                    ) : catTracks.length === 0 ? (
                      <p className="p-3 text-center text-xs text-[#8C887F]">Bu kategori için kayıt bulunamadı.</p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto bg-[#0C0C0F] rounded-xl p-1 divide-y divide-white/[0.04]">
                        {catTracks.map((item, idx) => (
                          <TrackRow
                            key={item.contentId}
                            item={item}
                            index={idx}
                            queueContext={catTracks}
                          />
                        ))}
                      </div>
                    )}

                    {!cat.isQuran && (
                      <button
                        type="button"
                        disabled={isDiscovering}
                        onClick={async () => {
                          setDiscoveringCatId(cat.id);
                          try {
                            await discoverMoreCategoryTracks(cat.id);
                          } finally {
                            setDiscoveringCatId(null);
                          }
                        }}
                        className="w-full h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-[#D4AF37] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isDiscovering ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Çevrimiçi Katalogdan Daha Fazla Parça Bul
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// Screen 3: Sanatçı Listesi & Screen 4: Sanatçı Detayları
// ============================================================
export const ArtistsScreen: React.FC = () => {
  const { catalogTracksByCategory, favoriteArtistIds, toggleFavoriteArtist, navigate, playQueue } = useAutoMusic();
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const artists = useMemo<ArtistSummary[]>(() => {
    const map = new Map<string, ArtistSummary>();

    // Include all 6 Quran reciters as authentic artists
    for (const rec of RECITERS) {
      map.set(`reciter:${rec.id}`, {
        id: `reciter:${rec.id}`,
        name: rec.nameTr,
        categoryIds: ['kuran'],
        language: 'Arapça',
        genre: "Kur'an Tilaveti",
        trackCount: 114,
        motif: 'kuran',
        isReciter: true,
      });
    }

    // Aggregate database & local archive tracks by artist
    for (const tracks of Object.values(catalogTracksByCategory)) {
      for (const t of tracks) {
        const existing = map.get(t.artistId);
        if (existing) {
          existing.trackCount += 1;
          if (!existing.categoryIds.includes(t.categoryId)) {
            existing.categoryIds.push(t.categoryId);
          }
        } else {
          map.set(t.artistId, {
            id: t.artistId,
            name: t.artistName,
            categoryIds: [t.categoryId],
            language: t.language,
            genre: t.genre,
            trackCount: 1,
            motif: t.motif,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [catalogTracksByCategory]);

  const filtered = useMemo(() => {
    const norm = normalizeSearchText(query);
    return artists.filter((a) => {
      if (onlyFavorites && !favoriteArtistIds.includes(a.id)) return false;
      if (!norm) return true;
      return (
        normalizeSearchText(a.name).includes(norm) ||
        normalizeSearchText(a.genre).includes(norm) ||
        normalizeSearchText(a.language).includes(norm)
      );
    });
  }, [artists, favoriteArtistIds, onlyFavorites, query]);

  const [expandedArtistId, setExpandedArtistId] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Sanatçılar ve Kâriler</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            Sanatçı veya kâri kartına tıklayarak akordion çekmeceden kayıtları anında açıp dinleyebilirsiniz
          </p>
        </div>
        <div className="inline-flex items-center gap-1 p-1 bg-[#141418] border border-white/[0.08] rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setOnlyFavorites(false)}
            className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              !onlyFavorites ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
            }`}
          >
            Tümü ({artists.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyFavorites(true)}
            className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              onlyFavorites ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
            }`}
          >
            Favoriler
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#8C887F] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sanatçı veya kâri adına göre ara..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((artist) => {
          const isFav = favoriteArtistIds.includes(artist.id);
          const isExpanded = expandedArtistId === artist.id;
          const isReciter = artist.id.startsWith('reciter:');
          const reciter = isReciter ? RECITERS.find((r) => `reciter:${r.id}` === artist.id) : undefined;
          
          const artistTracks = isReciter
            ? SURAHS.map((s) => buildSurahMediaItem(s, reciter!))
            : Object.values(catalogTracksByCategory)
                .flat()
                .filter((t) => t.artistId === artist.id);

          return (
            <div
              key={artist.id}
              className={`rounded-2xl border transition-all ${
                isExpanded ? 'bg-[#161510] border-[#D4AF37]/50 shadow-lg' : 'bg-[#121216] border-white/[0.06] hover:border-[#D4AF37]/30'
              }`}
            >
              <div className="p-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedArtistId(isExpanded ? null : artist.id)}
                  className="flex items-center gap-3.5 min-w-0 text-left flex-1"
                >
                  <ArtworkCover motif={artist.motif} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#F5F2EB] truncate">{artist.name}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#D4AF37]/15 text-[#D4AF37] font-medium shrink-0">
                        {isExpanded ? 'Akordion Kapat' : 'Akordion Aç'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9B978E] truncate mt-0.5">
                      {artist.genre} · {artist.trackCount} kayıt
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteArtist(artist.id)}
                    aria-label="Sanatçıyı favorilere ekle"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                      isFav ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-[#8C887F] hover:text-[#F5F2EB] hover:bg-white/[0.05]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-[#D4AF37]' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate({ name: 'artist_detail', artistId: artist.id })}
                    className="h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#F5F2EB] transition-colors whitespace-nowrap hidden sm:inline-flex items-center"
                  >
                    Detay Sayfası
                  </button>
                </div>
              </div>

              {/* Accordion Inline Drawer */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#D4AF37] font-medium">Akordion Kayıt Listesi ({artistTracks.length})</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void playQueue(artistTracks, false)}
                        className="h-8 px-3 rounded-lg bg-[#D4AF37] text-[#09090B] text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Sıralı Çal
                      </button>
                      <button
                        type="button"
                        onClick={() => void playQueue(artistTracks, true)}
                        className="h-8 px-3 rounded-lg bg-white/10 text-[#F5F2EB] text-xs font-medium flex items-center gap-1.5"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Karışık
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto bg-[#0E0E12] rounded-xl p-1 divide-y divide-white/[0.04]">
                    {artistTracks.map((item, idx) => (
                      <TrackRow
                        key={item.contentId}
                        item={item}
                        index={idx}
                        queueContext={artistTracks}
                        onOpenDetail={
                          item.surahNumber && item.reciterId
                            ? () =>
                                navigate({
                                  name: 'surah_detail',
                                  surahNumber: item.surahNumber!,
                                  reciterId: item.reciterId!,
                                })
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ArtistDetailScreen: React.FC<{ artistId: string }> = ({ artistId }) => {
  const { catalogTracksByCategory, favoriteArtistIds, toggleFavoriteArtist, playQueue, goBack, navigate } =
    useAutoMusic();

  const isReciter = artistId.startsWith('reciter:');
  const reciter = isReciter ? RECITERS.find((r) => `reciter:${r.id}` === artistId) : undefined;

  const tracks = useMemo<MediaItem[]>(() => {
    if (reciter) {
      return SURAHS.map((s) => buildSurahMediaItem(s, reciter));
    }
    return Object.values(catalogTracksByCategory)
      .flat()
      .filter((t) => t.artistId === artistId);
  }, [artistId, catalogTracksByCategory, reciter]);

  const artistName = reciter?.nameTr ?? tracks[0]?.artistName ?? 'Sanatçı';
  const motif = reciter ? 'kuran' : tracks[0]?.motif ?? 'custom';
  const isFav = favoriteArtistIds.includes(artistId);

  return (
    <div className="space-y-6 pb-10">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 h-9 px-2 -ml-2 rounded-lg text-sm text-[#A19E95] hover:text-[#F5F2EB] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Geri
      </button>

      <div className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ArtworkCover motif={motif} arabicTitle={reciter?.nameAr} size="lg" />
        <div className="space-y-3 flex-1 min-w-0">
          <p className="text-xs text-[#D4AF37]">{reciter ? "Kur'an-ı Kerim Kârisi" : 'Sanatçı'}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">{artistName}</h1>
          <p className="text-sm text-[#9B978E]">
            {tracks.length} kayıt{reciter ? ` · ${reciter.style} · ${reciter.country}` : ''}
          </p>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => void playQueue(tracks, false)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              Sıralı Çal
            </button>
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => void playQueue(tracks, true)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4 text-[#D4AF37] shrink-0" />
              Karışık Çal
            </button>
            <button
              type="button"
              onClick={() => toggleFavoriteArtist(artistId)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
            >
              <Heart className={`w-4 h-4 shrink-0 ${isFav ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#9B978E]'}`} />
              {isFav ? 'Favori Sanatçı' : 'Favorilere Ekle'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
        {tracks.map((item, idx) => (
          <TrackRow
            key={item.contentId}
            item={item}
            index={idx}
            queueContext={tracks}
            onOpenDetail={
              item.surahNumber && item.reciterId
                ? () =>
                    navigate({
                      name: 'surah_detail',
                      surahNumber: item.surahNumber!,
                      reciterId: item.reciterId!,
                    })
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Screen 5: Şarkı Listesi (Spotify-style DB Playlists + Filters + Phone Upload)
// ============================================================

const AlbumCover: React.FC<{ imageUrl: string; title: string; categoryId?: string }> = ({
  imageUrl,
  title,
  categoryId,
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUrl]);

  if (!failed && imageUrl) {
    return (
      <div className="aspect-square bg-[#121216] relative overflow-hidden">
        <img
          src={imageUrl}
          alt={`${title} albüm kapağı`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="aspect-square bg-gradient-to-br from-[#231D14] via-[#151419] to-[#0B0B0E] flex items-center justify-center relative overflow-hidden">
      <ArtworkCover motif="nostalji" categoryId={categoryId} size="xl" className="!w-full !h-full !rounded-none !border-0" />
    </div>
  );
};

const VerifiedAndEmbeddedCatalog: React.FC<{ categoryId: string }> = ({ categoryId }) => {
  const { catalogTracksByCategory, playTrack, showToast } = useAutoMusic();
  const supported = categoryId !== 'kuran' && categoryId !== 'custom';
  const [artists, setArtists] = useState<string[]>([]);
  const [artist, setArtist] = useState('');
  const [albums, setAlbums] = useState<VerifiedAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);
  const [albumPage, setAlbumPage] = useState(0);
  const [notice, setNotice] = useState('');

  // Selected album & ordered MusicBrainz tracklist
  const [selectedAlbum, setSelectedAlbum] = useState<VerifiedAlbum | null>(null);
  const [albumTracks, setAlbumTracks] = useState<VerifiedAlbumTrack[]>([]);
  const [loadingTracklist, setLoadingTracklist] = useState(false);
  const [tracklistNotice, setTracklistNotice] = useState('');
  const [matchingTrackKey, setMatchingTrackKey] = useState<string | null>(null);
  const [unmatchedTrackKeys, setUnmatchedTrackKeys] = useState<Record<string, boolean>>({});

  // Embedded YouTube section
  const [videoLink, setVideoLink] = useState('');
  const [videoId, setVideoId] = useState('');
  const [videoError, setVideoError] = useState('');

  useEffect(() => {
    requestRef.current += 1;
    setArtist('');
    setAlbums([]);
    setArtists([]);
    setSelectedAlbum(null);
    setAlbumTracks([]);
    setTracklistNotice('');
    setUnmatchedTrackKeys({});
    setVideoId('');
    setVideoLink('');
    setAlbumPage(0);
    if (!supported) return;
    let active = true;
    openMusicRepository
      .fetchVerifiedArtistsAndAlbums(categoryId)
      .then((d) => {
        if (active) setArtists(d.artists || []);
      })
      .catch(() => {
        if (active) setNotice('Sanatçılar yüklenemedi.');
      });
    return () => {
      active = false;
    };
  }, [categoryId, supported]);

  const chooseArtist = async (name: string) => {
    const requestId = ++requestRef.current;
    setArtist(name);
    setAlbums([]);
    setSelectedAlbum(null);
    setAlbumTracks([]);
    setTracklistNotice('');
    setUnmatchedTrackKeys({});
    setAlbumPage(0);
    setNotice('');
    setLoading(true);
    try {
      const data = await openMusicRepository.fetchVerifiedArtistsAndAlbums(categoryId, name);
      if (requestId !== requestRef.current) return;
      setAlbums(data.albums || []);
      setNotice(data.notice || '');
    } catch {
      if (requestId === requestRef.current) setNotice('Albüm bilgileri şu anda yüklenemedi.');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  const openAlbumTracklist = async (album: VerifiedAlbum) => {
    if (selectedAlbum?.id === album.id) {
      setSelectedAlbum(null);
      return;
    }
    setSelectedAlbum(album);
    setAlbumTracks([]);
    setTracklistNotice('');
    setUnmatchedTrackKeys({});
    setLoadingTracklist(true);
    try {
      const data = await openMusicRepository.fetchAlbumTracklist(album.id);
      setAlbumTracks(data.tracks || []);
      if (data.notice) setTracklistNotice(data.notice);
      else if ((data.tracks || []).length === 0) {
        setTracklistNotice('Bu albüm için doğrulanmış parça sırası bulunamadı.');
      }
    } catch {
      setTracklistNotice('Albüm parça listesi şu anda yüklenemedi.');
    } finally {
      setLoadingTracklist(false);
    }
  };

  const matchAndPlayAlbumTrack = async (track: VerifiedAlbumTrack) => {
    const key = `${selectedAlbum?.id}:${track.disc}:${track.position}`;
    setMatchingTrackKey(key);
    try {
      // 1. Check already loaded local/category catalog first
      const allLoaded = Object.values(catalogTracksByCategory).flat();
      let bestLocal: { item: MediaItem; score: number } | null = null;
      for (const item of allLoaded) {
        const titleScore = fuzzyMatchScore(track.title, item.title);
        const artistScore = artist ? fuzzyMatchScore(artist, item.artistName) : 40;
        if (titleScore >= 55 && artistScore >= 40) {
          const total = titleScore + artistScore;
          if (!bestLocal || total > bestLocal.score) {
            bestLocal = { item, score: total };
          }
        }
      }
      if (bestLocal) {
        showToast(`Açık arşiv eşleşmesi bulundu: ${bestLocal.item.title}`);
        void playTrack(bestLocal.item);
        return;
      }

      // 2. Live search across open-licensed audio providers (Archive + Audius + Wikimedia + Jamendo)
      const query = `${artist} ${track.title}`.trim();
      const { tracks } = await openMusicRepository.searchTracks(query);
      let bestOnline: { item: MediaItem; score: number } | null = null;
      for (const item of tracks) {
        const titleScore = fuzzyMatchScore(track.title, item.title);
        const artistScore = artist ? fuzzyMatchScore(artist, `${item.artistName} ${item.title}`) : 40;
        if (titleScore >= 42 && artistScore >= 35) {
          const total = titleScore + artistScore;
          if (!bestOnline || total > bestOnline.score) {
            bestOnline = { item, score: total };
          }
        }
      }

      if (bestOnline) {
        showToast(`Açık kaynak eşleşmesi oynatılıyor: ${bestOnline.item.title}`);
        void playTrack(bestOnline.item);
      } else {
        setUnmatchedTrackKeys((prev) => ({ ...prev, [key]: true }));
        showToast('Bu parça için ücretsiz ve izinli ses kaynağı bulunamadı.');
      }
    } finally {
      setMatchingTrackKey(null);
    }
  };

  const playVideo = () => {
    try {
      const url = new URL(videoLink.trim());
      const host = url.hostname.toLowerCase();
      let id = '';
      if (['youtu.be', 'www.youtu.be'].includes(host)) id = url.pathname.split('/')[1] || '';
      else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host))
        id =
          url.pathname === '/watch'
            ? url.searchParams.get('v') || ''
            : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || '';
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw Error();
      setVideoId(id);
      setVideoError('');
    } catch {
      setVideoError('Geçerli bir YouTube video bağlantısı girin.');
    }
  };

  return (
    <div className="space-y-4">
      {supported && (
        <section className="p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/20 bg-[#121216] space-y-3.5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#F5F2EB]">Gerçek Sanatçılar ve Albüm Diskografisi</h2>
            <p className="text-xs text-[#9B978E]">
              Sanatçı seçin, albüme tıklayarak gerçek parça sırasını görüntüleyin ve ücretsiz izinli ses kaynağı eşleştirmesi yapın.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {artists.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => void chooseArtist(name)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  artist === name
                    ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                    : 'border-white/15 text-[#F5F2EB] hover:border-[#D4AF37]/40'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {loading && (
            <p className="text-xs text-[#D4AF37] inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Albümler yükleniyor…
            </p>
          )}
          {notice && <p className="text-xs text-[#9B978E]">{notice}</p>}
          <p className="text-xs text-[#D4AF37]">
            {artist ? `${artist} · ${albums.length} albüm bulundu` : `${artists.length} doğrulanmış sanatçı`}
          </p>

          {albums.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {albums.slice(0, (albumPage + 1) * 15).map((a) => {
                const isSelected = selectedAlbum?.id === a.id;
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => void openAlbumTracklist(a)}
                    className={`group text-left rounded-xl overflow-hidden border transition-colors ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#1B1810]'
                        : 'border-white/10 hover:border-[#D4AF37]/40 bg-[#0E0E12]'
                    }`}
                  >
                    <AlbumCover imageUrl={a.coverUrl} title={a.title} categoryId={categoryId} />
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-[#F5F2EB] line-clamp-2">{a.title}</p>
                      <p className="text-[11px] font-mono tabular-nums text-[#9B978E] mt-0.5">
                        {a.year || 'Yıl bilinmiyor'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {albums.length > (albumPage + 1) * 15 && (
            <button
              type="button"
              onClick={() => setAlbumPage((p) => p + 1)}
              className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
            >
              Daha fazla albüm göster ({albums.length - (albumPage + 1) * 15} kaldı)
            </button>
          )}

          {/* Selected Album Ordered Tracklist Drawer */}
          {selectedAlbum && (
            <div className="mt-4 p-4 rounded-2xl bg-[#0D0D11] border border-[#D4AF37]/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                    <AlbumCover imageUrl={selectedAlbum.coverUrl} title={selectedAlbum.title} categoryId={categoryId} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#D4AF37] font-medium">
                      MusicBrainz Albüm Parça Listesi · {selectedAlbum.year || 'Yıl bilinmiyor'}
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-[#F5F2EB] truncate">
                      {selectedAlbum.title}
                    </h3>
                    <p className="text-xs text-[#9B978E] truncate">{artist}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAlbum(null)}
                  aria-label="Albüm listesini kapat"
                  className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-[#A19E95] shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingTracklist ? (
                <div className="py-4 flex items-center gap-2 text-xs text-[#D4AF37]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Albüm parça sırası yükleniyor...
                </div>
              ) : albumTracks.length === 0 ? (
                <p className="text-xs text-[#9B978E]">
                  {tracklistNotice || 'Bu albüm için parça listesi bulunamadı.'}
                </p>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {albumTracks.map((tr) => {
                    const key = `${selectedAlbum.id}:${tr.disc}:${tr.position}`;
                    const isMatching = matchingTrackKey === key;
                    const isUnmatched = Boolean(unmatchedTrackKeys[key]);
                    return (
                      <div key={key} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 text-right text-xs font-mono tabular-nums text-[#7C7970] shrink-0">
                            {String(tr.position).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-[#F5F2EB] truncate">{tr.title}</p>
                            {isUnmatched && (
                              <p className="text-[11px] text-amber-300/85">
                                Ücretsiz izinli ses kaynağı bulunamadı
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {tr.durationSec > 0 && (
                            <span className="hidden sm:inline text-xs font-mono tabular-nums text-[#8C887F]">
                              {formatDuration(tr.durationSec)}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={isMatching}
                            onClick={() => void matchAndPlayAlbumTrack(tr)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1A1812] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#09090B] border border-[#D4AF37]/30 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            {isMatching ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                            {isUnmatched ? 'Tekrar Ara' : 'Açık Kaynakta Ara'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="p-4 rounded-2xl border border-white/10 bg-[#121216] space-y-3">
        <h2 className="text-base font-semibold text-[#F5F2EB]">Uygulama içinde YouTube oynat</h2>
        <p className="text-xs text-[#9B978E]">
          Resmî video bağlantısını yapıştırın. Gömülmeye izin verilen videolar burada açılır; oynatıcı görünür kalmalıdır.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            playVideo();
          }}
        >
          <input
            type="url"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            aria-label="YouTube video bağlantısı"
            placeholder="YouTube video bağlantısı"
            className="flex-1 min-w-0 rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-white"
          />
          <button type="submit" className="rounded-lg bg-[#D4AF37] text-black font-semibold text-sm px-4 py-2">
            Uygulamada oynat
          </button>
        </form>
        {videoError && (
          <p role="alert" className="text-xs text-amber-400">
            {videoError}
          </p>
        )}
        {videoId && (
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
            <iframe
              key={videoId}
              title="YouTube oynatıcı"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )}
      </section>
    </div>
  );
};

export const TrackListScreen: React.FC<{ categoryId?: string; title: string }> = ({ categoryId, title }) => {
  const {
    categories,
    catalogTracksByCategory,
    curatedPlaylistsByCategory,
    catalogNotices,
    loadingCategories,
    loadCategoryTracks,
    discoverMoreCategoryTracks,
    downloadCategoryTracks,
    isOfflineDownloaded,
    importLocalAudioFiles,
    playQueue,
    goBack,
  } = useAutoMusic();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filterText, setFilterText] = useState('');
  const [artistFilter, setArtistFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(25);
  const [discoveringMore, setDiscoveringMore] = useState(false);
  const [downloadingCategory, setDownloadingCategory] = useState(false);

  const category = categories.find((c) => c.id === categoryId);
  const allTracks = categoryId ? catalogTracksByCategory[categoryId] ?? [] : [];
  const curatedPlaylists = categoryId ? curatedPlaylistsByCategory[categoryId] ?? [] : [];
  const isLoading = categoryId ? Boolean(loadingCategories[categoryId]) : false;
  const notice = categoryId ? catalogNotices[categoryId] : undefined;

  useEffect(() => {
    setActivePlaylistId(null);
    setArtistFilter('all');
    setFormatFilter('all');
    setFilterText('');
    setVisibleCount(25);
    if (categoryId && (!curatedPlaylistsByCategory[categoryId] || allTracks.length === 0)) {
      void loadCategoryTracks(categoryId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const activeCuratedPlaylist = curatedPlaylists.find((p) => p.id === activePlaylistId) ?? null;
  const sourceTracks = activeCuratedPlaylist ? activeCuratedPlaylist.tracks : allTracks;

  const artistOptions = useMemo(() => {
    const set = new Set<string>();
    sourceTracks.forEach((t) => set.add(t.artistName));
    return Array.from(set).sort();
  }, [sourceTracks]);

  const filteredTracks = useMemo(() => {
    const norm = normalizeSearchText(filterText);
    return sourceTracks.filter((t) => {
      if (artistFilter !== 'all' && t.artistName !== artistFilter) return false;
      if (formatFilter !== 'all' && t.format !== formatFilter) return false;
      if (!norm) return true;
      return (
        normalizeSearchText(t.title).includes(norm) ||
        normalizeSearchText(t.artistName).includes(norm) ||
        normalizeSearchText(t.album).includes(norm)
      );
    });
  }, [artistFilter, filterText, formatFilter, sourceTracks]);

  const downloadableTracks = useMemo(
    () => filteredTracks.filter((t) => t.downloadAllowed && !t.isLocalFile && Boolean(t.streamUrl)),
    [filteredTracks]
  );
  const remainingDownloadCount = useMemo(
    () => downloadableTracks.filter((t) => !isOfflineDownloaded(t.contentId)).length,
    [downloadableTracks, isOfflineDownloaded]
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 h-9 px-2 -ml-2 rounded-lg text-sm text-[#A19E95] hover:text-[#F5F2EB] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Kategoriler
        </button>

        {categoryId && (
          <button
            type="button"
            onClick={() => void loadCategoryTracks(categoryId, true)}
            className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-white/10 text-xs font-medium text-[#CFCBC2] hover:text-[#D4AF37] transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            Listeyi Yenile
          </button>
        )}
      </div>

      {/* Category Header */}
      <div className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ArtworkCover motif={category?.motif ?? 'custom'} categoryId={categoryId} title={title} size="lg" />
        <div className="space-y-3 flex-1 min-w-0">
          <p className="text-xs font-medium text-[#D4AF37]">
            {category ? `${category.language} · ${category.genre}` : 'Müzik Listesi'} · {allTracks.length} kayıt
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">{title}</h1>
          {category && <p className="text-sm text-[#9B978E]">{category.subtitle}</p>}

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={filteredTracks.length === 0}
              onClick={() => void playQueue(filteredTracks, false)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] disabled:opacity-40 hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              Sıralı Çal
            </button>
            <button
              type="button"
              disabled={filteredTracks.length === 0}
              onClick={() => void playQueue(filteredTracks, true)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.05] disabled:opacity-40 hover:bg-white/[0.1] border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4 text-[#D4AF37] shrink-0" />
              Karışık Çal
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.aac,.m4a,.flac,.wav,.ogg"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0 && categoryId) {
                  void importLocalAudioFiles(e.target.files, categoryId);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4 text-[#D4AF37] shrink-0" />
              Telefondan Ses Yükle
            </button>

            {categoryId && downloadableTracks.length > 0 && (
              <button
                type="button"
                disabled={downloadingCategory || remainingDownloadCount === 0}
                onClick={async () => {
                  setDownloadingCategory(true);
                  try {
                    await downloadCategoryTracks(categoryId);
                  } finally {
                    setDownloadingCategory(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] disabled:opacity-50 border border-[#D4AF37]/30 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
              >
                {downloadingCategory ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37] shrink-0" />
                ) : (
                  <Download className="w-4 h-4 text-[#D4AF37] shrink-0" />
                )}
                {remainingDownloadCount > 0
                  ? `Kategoriyi İndir (${remainingDownloadCount})`
                  : 'Tümü Çevrimdışı İndirildi'}
              </button>
            )}
          </div>
        </div>
      </div>

      {categoryId && categoryId !== 'kuran' && <VerifiedAndEmbeddedCatalog key={categoryId} categoryId={categoryId} />}

      {/* Spotify-style Curated Database Playlists for this Category */}
      {curatedPlaylists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-[#F5F2EB] inline-flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-[#D4AF37]" />
              Hazır Kategori Çalma Listeleri
            </h2>
            {activePlaylistId && (
              <button
                type="button"
                onClick={() => setActivePlaylistId(null)}
                className="text-xs font-medium text-[#D4AF37] hover:underline whitespace-nowrap"
              >
                Tüm Parçaları Göster
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {curatedPlaylists.map((pl) => {
              const isSelected = activePlaylistId === pl.id;
              return (
                <div
                  key={pl.id}
                  className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-3.5 ${
                    isSelected
                      ? 'bg-[#1B1810] border-[#D4AF37]/60'
                      : 'bg-[#121216] border-white/[0.06] hover:border-[#D4AF37]/30'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActivePlaylistId(isSelected ? null : pl.id)}
                    className="flex items-center gap-3.5 min-w-0 text-left flex-1"
                  >
                    <ArtworkCover motif={pl.motif} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F2EB] truncate">{pl.title}</p>
                      <p className="text-xs text-[#D4AF37]/85 truncate mt-0.5">{pl.subtitle}</p>
                      <p className="text-[11px] text-[#8C887F] truncate mt-0.5">
                        {pl.tracks.length} kayıt · {pl.description}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={pl.tracks.length === 0}
                      onClick={() => void playQueue(pl.tracks, false)}
                      aria-label={`${pl.title} listesini oynat`}
                      className="w-10 h-10 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-[#09090B] flex items-center justify-center transition-transform active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                    <button
                      type="button"
                      disabled={pl.tracks.length === 0}
                      onClick={() => void playQueue(pl.tracks, true)}
                      aria-label={`${pl.title} karışık oynat`}
                      className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 text-[#F5F2EB] flex items-center justify-center transition-colors"
                    >
                      <Shuffle className="w-4 h-4 text-[#D4AF37]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filters Row (Sanatçı, Albüm, Format — Uniform h-11 Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C887F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Şarkı, sanatçı veya albüm filtrele..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
        <select
          value={artistFilter}
          onChange={(e) => setArtistFilter(e.target.value)}
          aria-label="Sanatçıya göre filtrele"
          className="h-11 px-3.5 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
        >
          <option value="all">Tüm Sanatçılar ({artistOptions.length})</option>
          {artistOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          aria-label="Ses formatına göre filtrele"
          className="h-11 px-3.5 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
        >
          <option value="all">Tüm Formatlar (MP3 / AAC / FLAC / OGG)</option>
          <option value="MP3">MP3</option>
          <option value="FLAC">FLAC</option>
          <option value="AAC">AAC</option>
          <option value="OGG">OGG</option>
        </select>
      </div>

      {/* Track List or Transparent Upload Fallback */}
      {isLoading ? (
        <div className="p-12 rounded-2xl bg-[#121216] border border-white/[0.06] flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          <p className="text-sm text-[#9B978E]">Veritabanı listeleri ve kayıtlar yükleniyor...</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-4">
          <p className="text-base font-semibold text-[#F5F2EB]">
            Bu listede eşleşen çevrimiçi kayıt bulunamadı
          </p>
          <p className="text-sm text-[#9B978E] max-w-2xl leading-relaxed">
            {notice ||
              'Telefonunuzdaki veya cihazınızdaki MP3, AAC, FLAC ya da OGG dosyalarını doğrudan bu kategoriye ekleyerek çevrimdışı arşivde yüksek kalitede dinleyebilirsiniz.'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors"
          >
            <Upload className="w-4 h-4 shrink-0" />
            Telefondan Ses Dosyası Yükle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
            {filteredTracks.slice(0, visibleCount).map((item, idx) => (
              <TrackRow key={item.contentId} item={item} index={idx} queueContext={filteredTracks} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {filteredTracks.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 25)}
                className="h-10 px-5 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-[#D4AF37]/30 text-xs font-medium text-[#D4AF37] transition-colors"
              >
                Daha Fazla Göster ({filteredTracks.length - visibleCount} kayıt kaldı)
              </button>
            )}
            {categoryId && categoryId !== 'kuran' && (
              <button
                type="button"
                disabled={discoveringMore}
                onClick={async () => {
                  setDiscoveringMore(true);
                  try {
                    const added = await discoverMoreCategoryTracks(categoryId);
                    if (added > 0) setVisibleCount((prev) => prev + added);
                  } finally {
                    setDiscoveringMore(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#141418] hover:bg-[#1C1C22] disabled:opacity-50 border border-white/15 text-xs font-medium text-[#F5F2EB] transition-colors"
              >
                {discoveringMore ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                )}
                Çevrimiçi Katalogdan Daha Fazla Parça Keşfet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
