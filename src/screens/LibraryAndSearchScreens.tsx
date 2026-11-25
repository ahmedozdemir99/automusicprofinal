import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  Clock,
  Edit3,
  Globe,
  Heart,
  History,
  ListMusic,
  Loader2,
  Play,
  Plus,
  Search,
  Shuffle,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { ArtworkCover } from '../components/ArtworkCover';
import { TrackRow } from '../components/TrackRow';
import { useAutoMusic } from '../context/AutoMusicContext';
import { RECITERS, SURAHS, buildSurahMediaItem } from '../data/quranData';
import { fuzzyMatchScore, normalizeSearchText, openMusicRepository } from '../services/catalogRepository';
import { MediaItem } from '../types/media';

// ============================================================
// Screen 10 (Favoriler) & Screen 11 (Çalma Listelerim) Hub ("Kütüphanem")
// ============================================================
export const LibraryHubScreen: React.FC<{ initialTab?: 'playlists' | 'favorites' | 'downloads' }> = ({
  initialTab = 'playlists',
}) => {
  const {
    playlists,
    favoriteTracks,
    favoriteArtistIds,
    favoriteSurahNumbers,
    favoriteReciterIds,
    recentlyPlayed,
    playCounts,
    catalogTracksByCategory,
    selectedReciterId,
    downloads,
    navigate,
    playQueue,
    deletePlaylist,
    toggleFavoriteSurah,
    toggleFavoriteReciter,
  } = useAutoMusic();

  const [tab, setTab] = useState<'playlists' | 'favorites' | 'most_played' | 'recent'>(
    initialTab === 'favorites' ? 'favorites' : 'playlists'
  );
  const [favSubTab, setFavSubTab] = useState<'tracks' | 'surahs' | 'reciters' | 'artists'>('tracks');

  const activeReciter = RECITERS.find((r) => r.id === selectedReciterId) ?? RECITERS[0];

  const favoriteSurahItems = useMemo(
    () =>
      SURAHS.filter((s) => favoriteSurahNumbers.includes(s.number)).map((s) =>
        buildSurahMediaItem(s, activeReciter)
      ),
    [activeReciter, favoriteSurahNumbers]
  );

  const mostPlayedTracks = useMemo(() => {
    const byId = new Map<string, MediaItem>();
    for (const item of recentlyPlayed) byId.set(item.contentId, item);
    for (const item of favoriteTracks) byId.set(item.contentId, item);
    for (const pl of playlists) {
      for (const item of pl.items) byId.set(item.contentId, item);
    }
    for (const list of Object.values(catalogTracksByCategory)) {
      for (const item of list) byId.set(item.contentId, item);
    }
    return Object.entries(playCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ item: byId.get(id), count }))
      .filter((entry): entry is { item: MediaItem; count: number } => Boolean(entry.item))
      .slice(0, 40);
  }, [catalogTracksByCategory, favoriteTracks, playCounts, playlists, recentlyPlayed]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Kütüphanem</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            {playlists.length} çalma listesi · {favoriteTracks.length} favori parça · {downloads.length} çevrimdışı kayıt
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate({ name: 'downloads' })}
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-white/10 text-xs font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
          >
            İndirilenler ({downloads.length})
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'create_playlist' })}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Yeni Liste Oluştur
          </button>
        </div>
      </div>

      {/* Primary Library Segmented Control */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#141418] border border-white/[0.08] rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('playlists')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'playlists' ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
          }`}
        >
          Çalma Listelerim ({playlists.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('favorites')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'favorites' ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
          }`}
        >
          Favorilerim
        </button>
        <button
          type="button"
          onClick={() => setTab('most_played')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'most_played' ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          En Çok Dinlenenler ({mostPlayedTracks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('recent')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'recent' ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Son Dinlenenler ({recentlyPlayed.length})
        </button>
      </div>

      {tab === 'playlists' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="p-5 rounded-2xl bg-[#121216] border border-white/[0.07] hover:border-[#D4AF37]/30 flex flex-col justify-between gap-4 transition-colors"
            >
              <button
                type="button"
                onClick={() => navigate({ name: 'playlist_detail', playlistId: pl.id })}
                className="text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#1A1811] border border-[#D4AF37]/20 flex items-center justify-center">
                    <ListMusic className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#8C887F]">
                    {pl.items.length} kayıt
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[#F5F2EB] truncate pt-1">{pl.name}</h2>
                <p className="text-xs text-[#9B978E] line-clamp-2">{pl.description}</p>
              </button>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => void playQueue(pl.items, false)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    Oynat
                  </button>
                  <button
                    type="button"
                    onClick={() => void playQueue(pl.items, true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#F5F2EB] text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    Karışık
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => deletePlaylist(pl.id)}
                  aria-label={`${pl.name} listesini sil`}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8C887F] hover:text-red-400 hover:bg-white/[0.05] transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#141418] border border-white/[0.08] rounded-xl w-fit">
            {(
              [
                ['tracks', `Parçalar (${favoriteTracks.length})`],
                ['surahs', `Sureler (${favoriteSurahNumbers.length})`],
                ['reciters', `Kâriler (${favoriteReciterIds.length})`],
                ['artists', `Sanatçılar (${favoriteArtistIds.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFavSubTab(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  favSubTab === id ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {favSubTab === 'tracks' && (
            <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
              {favoriteTracks.length === 0 ? (
                <p className="p-6 text-sm text-[#9B978E]">
                  Henüz favori şarkı, ilahi, ezgi veya neşid eklemediniz.
                </p>
              ) : (
                favoriteTracks.map((t, idx) => (
                  <TrackRow key={t.contentId} item={t} index={idx} queueContext={favoriteTracks} />
                ))
              )}
            </div>
          )}

          {favSubTab === 'surahs' && (
            <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
              {favoriteSurahItems.length === 0 ? (
                <p className="p-6 text-sm text-[#9B978E]">Henüz favori sure eklemediniz.</p>
              ) : (
                favoriteSurahItems.map((item, idx) => (
                  <TrackRow
                    key={item.contentId}
                    item={item}
                    index={idx}
                    queueContext={favoriteSurahItems}
                    rightExtra={
                      <button
                        type="button"
                        onClick={() => toggleFavoriteSurah(item.surahNumber!)}
                        title="Favori surelerden çıkar"
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8C887F] hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    }
                  />
                ))
              )}
            </div>
          )}

          {favSubTab === 'reciters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECITERS.filter((r) => favoriteReciterIds.includes(r.id)).map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-[#121216] border border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'artist_detail', artistId: `reciter:${rec.id}` })}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="text-sm font-semibold text-[#F5F2EB] truncate">{rec.nameTr}</p>
                    <p className="text-xs text-[#9B978E]">{rec.style}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavoriteReciter(rec.id)}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center text-[#D4AF37]"
                  >
                    <Heart className="w-4 h-4 fill-[#D4AF37]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {favSubTab === 'artists' && (
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-3">
              {favoriteArtistIds.length === 0 ? (
                <p className="text-sm text-[#9B978E]">
                  Henüz favori sanatçı eklemediniz. Sanatçılar ekranından ekleyebilirsiniz.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {favoriteArtistIds.map((aid) => (
                    <button
                      key={aid}
                      type="button"
                      onClick={() => navigate({ name: 'artist_detail', artistId: aid })}
                      className="px-4 py-2 rounded-xl bg-[#191920] hover:bg-[#24242E] text-sm text-[#F5F2EB]"
                    >
                      {aid.replace(/^(reciter|ia-artist|jamendo-artist|local-artist):/, '')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'most_played' && (
        <div className="space-y-3">
          {mostPlayedTracks.length > 0 && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => void playQueue(mostPlayedTracks.map((x) => x.item), false)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                En Çok Dinlenenleri Çal
              </button>
            </div>
          )}
          <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
            {mostPlayedTracks.length === 0 ? (
              <p className="p-6 text-sm text-[#9B978E]">
                Henüz dinleme istatistiği oluşmadı. Müzik veya sure dinledikçe en çok dinledikleriniz burada sıralanır.
              </p>
            ) : (
              mostPlayedTracks.map(({ item, count }, idx) => (
                <TrackRow
                  key={item.contentId}
                  item={item}
                  index={idx}
                  queueContext={mostPlayedTracks.map((x) => x.item)}
                  rightExtra={
                    <span className="text-[11px] font-mono tabular-nums text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/10">
                      {count}×
                    </span>
                  }
                />
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'recent' && (
        <div className="space-y-3">
          {recentlyPlayed.length > 0 && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => void playQueue(recentlyPlayed, false)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Son Dinlenenleri Çal
              </button>
            </div>
          )}
          <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
            {recentlyPlayed.length === 0 ? (
              <p className="p-6 text-sm text-[#9B978E]">Henüz son dinlenen kayıt bulunmuyor.</p>
            ) : (
              recentlyPlayed.map((item, idx) => (
                <TrackRow key={item.contentId} item={item} index={idx} queueContext={recentlyPlayed} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Playlist Detail Screen (Rename, Reorder Up/Down, Remove, Sequential/Shuffle Play)
// ============================================================
export const PlaylistDetailScreen: React.FC<{ playlistId: string }> = ({ playlistId }) => {
  const {
    playlists,
    renamePlaylist,
    removeTrackFromPlaylist,
    moveTrackInPlaylist,
    playQueue,
    goBack,
  } = useAutoMusic();

  const playlist = playlists.find((p) => p.id === playlistId);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(playlist?.name ?? '');

  if (!playlist) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-[#9B978E]">Çalma listesi bulunamadı.</p>
        <button type="button" onClick={goBack} className="text-sm text-[#D4AF37] underline">
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB]"
      >
        <ChevronLeft className="w-4 h-4" />
        Çalma Listelerim
      </button>

      <div className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs text-[#D4AF37]">
              {playlist.isQuranPlaylist ? "Kur'an Çalma Listesi" : 'Kişisel Çalma Listesi'} · {playlist.items.length} kayıt
            </p>
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  renamePlaylist(playlist.id, draftName);
                  setEditing(false);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#09090B] border border-[#D4AF37] text-lg font-bold text-[#F5F2EB]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#09090B] text-xs font-semibold"
                >
                  Kaydet
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">{playlist.name}</h1>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(playlist.name);
                    setEditing(true);
                  }}
                  aria-label="Listeyi yeniden adlandır"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#9B978E] hover:text-[#D4AF37]"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-[#9B978E]">{playlist.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
            <button
              type="button"
              disabled={playlist.items.length === 0}
              onClick={() => void playQueue(playlist.items, false)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              Sıralı Oynat
            </button>
            <button
              type="button"
              disabled={playlist.items.length === 0}
              onClick={() => void playQueue(playlist.items, true)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4 text-[#D4AF37] shrink-0" />
              Karışık Oynat
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
        {playlist.items.length === 0 ? (
          <p className="p-6 text-sm text-[#9B978E]">
            Bu liste henüz boş. Herhangi bir şarkı veya sure satırındaki listeye ekle düğmesinden parça ekleyebilirsiniz.
          </p>
        ) : (
          playlist.items.map((item, idx) => (
            <TrackRow
              key={item.contentId}
              item={item}
              index={idx}
              queueContext={playlist.items}
              rightExtra={
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveTrackInPlaylist(playlist.id, idx, idx - 1)}
                    aria-label="Yukarı taşı"
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-[#8C887F] hover:text-[#F5F2EB] disabled:opacity-25"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === playlist.items.length - 1}
                    onClick={() => moveTrackInPlaylist(playlist.id, idx, idx + 1)}
                    aria-label="Aşağı taşı"
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-[#8C887F] hover:text-[#F5F2EB] disabled:opacity-25"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTrackFromPlaylist(playlist.id, item.contentId)}
                    aria-label="Listeden çıkar"
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-[#8C887F] hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// Screen 12: Yeni Liste Oluştur
// ============================================================
export const CreatePlaylistScreen: React.FC = () => {
  const { createPlaylist, navigate, goBack } = useAutoMusic();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isQuranPlaylist, setIsQuranPlaylist] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = createPlaylist(name, description, [], isQuranPlaylist);
    navigate({ name: 'playlist_detail', playlistId: pl.id });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-10">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB]"
      >
        <ChevronLeft className="w-4 h-4" />
        Geri
      </button>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#121216] border border-white/[0.08] space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F2EB]">Yeni Çalma Listesi Oluştur</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            Sınırsız sayıda kişisel müzik veya Kur'an çalma listesi oluşturabilirsiniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="playlist-name" className="text-xs font-medium text-[#CFCBC2]">
              Liste Adı
            </label>
            <input
              id="playlist-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Benim Yolculuk Listem"
              className="w-full px-4 py-3 rounded-xl bg-[#09090B] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="playlist-desc" className="text-xs font-medium text-[#CFCBC2]">
              Açıklama (İsteğe bağlı)
            </label>
            <textarea
              id="playlist-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Uzun yol için türküler, ilahiler ve seçkin sureler"
              className="w-full px-4 py-3 rounded-xl bg-[#09090B] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0D0D11] border border-white/[0.07] cursor-pointer">
            <input
              type="checkbox"
              checked={isQuranPlaylist}
              onChange={(e) => setIsQuranPlaylist(e.target.checked)}
              className="w-4 h-4 accent-[#D4AF37]"
            />
            <span className="text-sm text-[#E5E2D9]">Bu listeyi Kur'an çalma listesi olarak işaretle</span>
          </label>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors"
          >
            Listeyi Oluştur
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// Screen 13: Gelişmiş Arama (Yazım Hatası Toleranslı Türkçe & Arapça Arama + Geçmiş + Sayfalama)
// ============================================================
export const SearchScreen: React.FC = () => {
  const {
    categories,
    catalogTracksByCategory,
    selectedReciterId,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
    navigate,
  } = useAutoMusic();
  const [query, setQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<MediaItem[]>([]);
  const [searchingOnline, setSearchingOnline] = useState(false);
  const [loadingMoreOnline, setLoadingMoreOnline] = useState(false);
  const [onlineOffset, setOnlineOffset] = useState(0);
  const [hasMoreOnline, setHasMoreOnline] = useState(false);
  const [onlineNotice, setOnlineNotice] = useState<string | null>(null);

  const activeReciter = RECITERS.find((r) => r.id === selectedReciterId) ?? RECITERS[0];
  const norm = normalizeSearchText(query);

  const matchedCategories = useMemo(() => {
    if (!norm) return [];
    return categories
      .map((c) => ({
        c,
        score: Math.max(
          fuzzyMatchScore(query, c.name),
          fuzzyMatchScore(query, c.subtitle),
          fuzzyMatchScore(query, c.language),
          fuzzyMatchScore(query, c.genre)
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
  }, [categories, norm, query]);

  const matchedReciters = useMemo(() => {
    if (!norm) return [];
    return RECITERS.filter(
      (r) =>
        fuzzyMatchScore(query, r.nameTr) > 0 ||
        normalizeSearchText(r.nameAr).includes(norm) ||
        fuzzyMatchScore(query, r.style) > 0
    );
  }, [norm, query]);

  const matchedSurahs = useMemo(() => {
    if (!norm) return [];
    return SURAHS.filter(
      (s) =>
        String(s.number) === norm ||
        fuzzyMatchScore(query, s.nameTr) > 0 ||
        fuzzyMatchScore(query, s.meaningTr) > 0 ||
        normalizeSearchText(s.nameAr).includes(norm)
    ).slice(0, 12);
  }, [norm, query]);

  const matchedLocalCatalogTracks = useMemo(() => {
    if (!norm) return [];
    const all = Object.values(catalogTracksByCategory).flat();
    return all
      .map((t) => ({
        t,
        score: Math.max(
          fuzzyMatchScore(query, t.title),
          fuzzyMatchScore(query, t.artistName),
          fuzzyMatchScore(query, t.album),
          fuzzyMatchScore(query, t.genre)
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.t);
  }, [catalogTracksByCategory, norm, query]);

  // Quick autocomplete suggestions from local artists, categories, and surahs
  const quickSuggestions = useMemo(() => {
    if (!norm || norm.length < 2) return [];
    const pool = new Set<string>();
    for (const c of matchedCategories.slice(0, 3)) pool.add(c.name);
    for (const t of matchedLocalCatalogTracks.slice(0, 4)) pool.add(t.artistName);
    for (const s of matchedSurahs.slice(0, 3)) pool.add(`${s.nameTr} Suresi`);
    return Array.from(pool).slice(0, 6);
  }, [matchedCategories, matchedLocalCatalogTracks, matchedSurahs, norm]);

  const runOnlineSearch = async (rawQuery: string, nextOffset = 0) => {
    const clean = rawQuery.trim();
    if (!clean) return;
    if (nextOffset === 0) {
      setSearchingOnline(true);
      setOnlineResults([]);
      setOnlineOffset(0);
      setHasMoreOnline(false);
      setOnlineNotice(null);
      addSearchHistory(clean);
    } else {
      setLoadingMoreOnline(true);
    }

    try {
      const { tracks, notice, hasMore } = await openMusicRepository.searchTracks(clean, undefined, nextOffset);
      if (nextOffset === 0) {
        setOnlineResults(tracks);
      } else {
        setOnlineResults((prev) => {
          const seen = new Set(prev.map((x) => x.contentId));
          return [...prev, ...tracks.filter((x) => !seen.has(x.contentId))];
        });
      }
      setOnlineOffset(nextOffset + tracks.length);
      setHasMoreOnline(Boolean(hasMore));
      if (nextOffset === 0 && tracks.length === 0) {
        setOnlineNotice(notice || 'Açık lisanslı çevrimiçi katalogda eşleşen kayıt bulunamadı.');
      }
    } finally {
      setSearchingOnline(false);
      setLoadingMoreOnline(false);
    }
  };

  const handleOnlineSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void runOnlineSearch(query, 0);
  };

  const combinedTrackResults = useMemo(
    () =>
      [...matchedLocalCatalogTracks, ...onlineResults].filter(
        (t, i, arr) => arr.findIndex((x) => x.contentId === t.contentId) === i
      ),
    [matchedLocalCatalogTracks, onlineResults]
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Gelişmiş Arama</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            Şarkı, sanatçı, albüm, kategori, ilahi, ezgi, neşid, sure ve kârileri Türkçe veya Arapça tek kutudan arayın.
          </p>
        </div>

        <form onSubmit={handleOnlineSearch} className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Örn: Erkin Koray, Kazım Koyuncu, Ferdi Tayfur, Yasin, يس, Karadeniz..."
              className="w-full h-11 pl-11 pr-9 rounded-xl bg-[#121216] border border-white/15 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setOnlineResults([]);
                  setOnlineNotice(null);
                  setHasMoreOnline(false);
                }}
                aria-label="Aramayı temizle"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8C887F] hover:text-[#F5F2EB]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || searchingOnline}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] disabled:opacity-40 hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {searchingOnline ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Globe className="w-4 h-4 shrink-0" />}
            Çoklu Kaynakta Ara
          </button>
        </form>

        {/* Live Autocomplete Chips */}
        {quickSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 max-w-2xl">
            <span className="text-[11px] text-[#8C887F]">Öneriler:</span>
            {quickSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  void runOnlineSearch(s, 0);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#16161C] hover:bg-[#22212A] border border-white/10 text-xs text-[#E5E2D9] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {!norm ? (
        <div className="space-y-8">
          {/* Search History */}
          {searchHistory.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#A8A49B] inline-flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#D4AF37]" />
                  Arama Geçmişi
                </h2>
                <button
                  type="button"
                  onClick={clearSearchHistory}
                  className="text-xs text-[#8C887F] hover:text-red-400 transition-colors"
                >
                  Geçmişi Temizle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      void runOnlineSearch(item, 0);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.08] text-xs text-[#F5F2EB] transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Quick Popular Artists */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#A8A49B]">Popüler Sanatçı Aramaları</h2>
            <div className="flex flex-wrap gap-2">
              {[
                'Erkin Koray',
                'Barış Manço',
                'Cem Karaca',
                'Kazım Koyuncu',
                'Ferdi Tayfur',
                'Nilüfer',
                'Neşet Ertaş',
                'Aşık Veysel',
                'Yasin',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setQuery(preset);
                    void runOnlineSearch(preset, 0);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#17150F] hover:bg-[#221E13] border border-[#D4AF37]/25 text-xs font-medium text-[#E5C158] transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#A8A49B]">Hızlı Kategori Erişimi</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    cat.isQuran
                      ? navigate({ name: 'quran' })
                      : navigate({ name: 'track_list', categoryId: cat.id, title: cat.name })
                  }
                  className="p-3.5 rounded-xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.06] text-left transition-colors"
                >
                  <p className="text-sm font-medium text-[#F5F2EB] truncate">{cat.name}</p>
                  <p className="text-xs text-[#8C887F] truncate mt-0.5">{cat.language}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group 1: Sureler */}
          {matchedSurahs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#D4AF37]">Sureler ({matchedSurahs.length})</h2>
              <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
                {matchedSurahs.map((s) => {
                  const item = buildSurahMediaItem(s, activeReciter);
                  return (
                    <TrackRow
                      key={item.contentId}
                      item={item}
                      onOpenDetail={() =>
                        navigate({
                          name: 'surah_detail',
                          surahNumber: s.number,
                          reciterId: activeReciter.id,
                        })
                      }
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Group 2: Kariler */}
          {matchedReciters.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#D4AF37]">Kâriler ({matchedReciters.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchedReciters.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => navigate({ name: 'artist_detail', artistId: `reciter:${rec.id}` })}
                    className="p-4 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.06] flex items-center gap-3 text-left"
                  >
                    <ArtworkCover motif="kuran" arabicTitle={rec.nameAr} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F2EB] truncate">{rec.nameTr}</p>
                      <p className="text-xs text-[#9B978E] truncate">{rec.style}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Group 3: Müzik Kategorileri */}
          {matchedCategories.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#D4AF37]">
                Müzik Kategorileri ({matchedCategories.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      cat.isQuran
                        ? navigate({ name: 'quran' })
                        : navigate({ name: 'track_list', categoryId: cat.id, title: cat.name })
                    }
                    className="p-4 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.06] flex items-center gap-3 text-left"
                  >
                    <ArtworkCover motif={cat.motif} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F2EB] truncate">{cat.name}</p>
                      <p className="text-xs text-[#9B978E] truncate">{cat.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Group 4: Yüklü & Çevrimiçi Şarkılar / İlahi / Ezgi / Neşid */}
          {combinedTrackResults.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#D4AF37]">
                Şarkılar, İlahiler, Ezgiler ve Açık Arşiv Kayıtları ({combinedTrackResults.length})
              </h2>
              <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
                {combinedTrackResults.map((t, idx) => (
                  <TrackRow key={t.contentId} item={t} index={idx} queueContext={combinedTrackResults} />
                ))}
              </div>

              {hasMoreOnline && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMoreOnline}
                    onClick={() => void runOnlineSearch(query, onlineOffset)}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-[#D4AF37]/35 text-xs font-medium text-[#D4AF37] disabled:opacity-50 transition-colors"
                  >
                    {loadingMoreOnline && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Daha Fazla Sonuç Yükle
                  </button>
                </div>
              )}
            </section>
          )}

          {onlineNotice && (
            <p className="text-sm text-[#9B978E] p-4 rounded-xl bg-[#121216] border border-white/[0.06]">
              {onlineNotice}
            </p>
          )}

          {matchedSurahs.length === 0 &&
            matchedReciters.length === 0 &&
            matchedCategories.length === 0 &&
            combinedTrackResults.length === 0 &&
            !searchingOnline && (
              <div className="p-8 rounded-2xl bg-[#121216] border border-white/[0.06] text-center space-y-2">
                <BookOpen className="w-6 h-6 text-[#D4AF37] mx-auto" />
                <p className="text-sm text-[#F5F2EB]">Yerel dizinde eşleşme bulunamadı.</p>
                <p className="text-xs text-[#9B978E]">
                  Internet Archive, Audius, Wikimedia ve Jamendo kaynaklarında arama yapmak için yukarıdaki "Çoklu Kaynakta Ara" düğmesine basın.
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
