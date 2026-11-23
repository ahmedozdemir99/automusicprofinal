import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  Disc3,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Smartphone,
  Users,
} from 'lucide-react';
import { useAutoMusic } from '../context/AutoMusicContext';
import { RECITERS, SURAHS, buildSurahMediaItem } from '../data/quranData';
import { ArtworkCover } from './ArtworkCover';
import { formatDuration } from './TrackRow';

type AutoSection = 'categories' | 'artists' | 'favorites' | 'playlists' | 'quran' | 'recent';

export const AndroidAutoMode: React.FC = () => {
  const {
    setCarMode,
    categories,
    catalogTracksByCategory,
    loadCategoryTracks,
    favoriteTracks,
    playlists,
    recentlyPlayed,
    selectedReciterId,
    setSelectedReciterId,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    shuffle,
    repeatMode,
    playTrack,
    playQueue,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    cycleRepeatMode,
  } = useAutoMusic();

  const [section, setSection] = useState<AutoSection>('categories');
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const selectedReciter = useMemo(
    () => RECITERS.find((r) => r.id === selectedReciterId) ?? RECITERS[0],
    [selectedReciterId]
  );

  const quranItems = useMemo(
    () => SURAHS.map((s) => buildSurahMediaItem(s, selectedReciter)),
    [selectedReciter]
  );

  const navItems: Array<{ id: AutoSection; label: string; icon: React.ReactNode }> = [
    { id: 'categories', label: 'Ana Kategoriler', icon: <Disc3 className="w-5 h-5" /> },
    { id: 'artists', label: 'Sanatçılar', icon: <Users className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favoriler', icon: <Heart className="w-5 h-5" /> },
    { id: 'playlists', label: 'Çalma Listeleri', icon: <ListMusic className="w-5 h-5" /> },
    { id: 'quran', label: "Kur'an Bölümü", icon: <BookOpen className="w-5 h-5" /> },
    { id: 'recent', label: 'Son Dinlenenler', icon: <Clock className="w-5 h-5" /> },
  ];

  const handlePlayCategory = async (categoryId: string, catName: string) => {
    setStatusNote(`${catName} yükleniyor...`);
    const tracks = await loadCategoryTracks(categoryId);
    if (tracks.length > 0) {
      setStatusNote(null);
      await playQueue(tracks, false);
    } else {
      setStatusNote(`${catName} için çevrimiçi veya yerel kayıt bulunamadı.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050507] text-[#F5F2EB] flex flex-col">
      {/* Android Auto Top Car Bar (Distraction-Free Driving Template) */}
      <header className="h-16 px-5 border-b border-white/10 bg-[#0B0B0F] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg font-bold tracking-tight text-[#D4AF37] whitespace-nowrap">
            AutoMusic Pro
          </span>
          <span className="text-xs text-[#9B978E] whitespace-nowrap">
            Android Auto Sürüş Modu · Direksiyon Kumandası Hazır
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCarMode(false)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A21] hover:bg-[#24242D] text-sm font-medium text-[#F5F2EB] border border-white/10 whitespace-nowrap"
        >
          <Smartphone className="w-4 h-4 text-[#D4AF37]" />
          Telefon Modu
        </button>
      </header>

      {/* Main Car Head Unit Layout: Browse Rail + Content + Now Playing Deck */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Navigation Rail (Large Touch Targets) */}
        <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0B0B0F] p-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                setStatusNote(null);
              }}
              className={`min-h-[56px] px-4 rounded-2xl flex items-center gap-3 text-left text-base font-medium whitespace-nowrap transition-colors shrink-0 ${
                section === item.id
                  ? 'bg-[#D4AF37] text-[#09090B]'
                  : 'bg-[#14141A] text-[#E5E2D9] hover:bg-[#1D1D25]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Center Browse Grid (Official Android Auto Media Grid/List Template) */}
        <main className="lg:col-span-5 p-5 overflow-y-auto space-y-4">
          {statusNote && (
            <div className="p-4 rounded-2xl bg-[#171612] border border-[#D4AF37]/30 text-sm text-[#E5C158]">
              {statusNote}
            </div>
          )}

          {section === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => void handlePlayCategory(cat.id, cat.name)}
                  className="min-h-[72px] p-4 rounded-2xl bg-[#131318] hover:bg-[#1D1C22] border border-white/[0.08] text-left flex items-center gap-3.5 transition-colors"
                >
                  <ArtworkCover motif={cat.motif} size="sm" />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[#F5F2EB] truncate">{cat.name}</p>
                    <p className="text-xs text-[#9B978E] truncate">{cat.language}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {section === 'artists' && (
            <div className="space-y-3">
              <p className="text-xs text-[#9B978E]">Kariler ve Katalog Sanatçıları</p>
              {RECITERS.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    setSelectedReciterId(rec.id);
                    void playQueue(
                      SURAHS.map((s) => buildSurahMediaItem(s, rec)),
                      false
                    );
                  }}
                  className="w-full min-h-[68px] px-4 py-3 rounded-2xl bg-[#131318] hover:bg-[#1D1C22] border border-white/[0.08] flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-base font-semibold text-[#F5F2EB]">{rec.nameTr}</p>
                    <p className="text-xs text-[#9B978E]">Kur'an Karisi · {rec.style}</p>
                  </div>
                  <Play className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                </button>
              ))}
              {Object.values(catalogTracksByCategory)
                .flat()
                .reduce<Array<{ name: string; tracks: typeof favoriteTracks }>>((acc, t) => {
                  const found = acc.find((a) => a.name === t.artistName);
                  if (found) found.tracks.push(t);
                  else acc.push({ name: t.artistName, tracks: [t] });
                  return acc;
                }, [])
                .slice(0, 12)
                .map((art) => (
                  <button
                    key={art.name}
                    type="button"
                    onClick={() => void playQueue(art.tracks, false)}
                    className="w-full min-h-[68px] px-4 py-3 rounded-2xl bg-[#131318] hover:bg-[#1D1C22] border border-white/[0.08] flex items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-base font-semibold text-[#F5F2EB]">{art.name}</p>
                      <p className="text-xs text-[#9B978E]">{art.tracks.length} kayıt</p>
                    </div>
                    <Play className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                  </button>
                ))}
            </div>
          )}

          {section === 'favorites' && (
            <div className="space-y-3">
              {favoriteTracks.length === 0 ? (
                <p className="text-sm text-[#9B978E] p-4">Henüz favori parça eklenmedi.</p>
              ) : (
                <>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => void playQueue(favoriteTracks, false)}
                      className="flex-1 min-h-[56px] rounded-2xl bg-[#D4AF37] text-[#09090B] font-semibold text-sm"
                    >
                      Sıralı Çal
                    </button>
                    <button
                      type="button"
                      onClick={() => void playQueue(favoriteTracks, true)}
                      className="flex-1 min-h-[56px] rounded-2xl bg-[#191920] text-[#F5F2EB] font-semibold text-sm border border-white/10"
                    >
                      Karışık Çal
                    </button>
                  </div>
                  {favoriteTracks.map((t) => (
                    <button
                      key={t.contentId}
                      type="button"
                      onClick={() => void playTrack(t, favoriteTracks)}
                      className="w-full min-h-[64px] px-4 py-3 rounded-2xl bg-[#131318] hover:bg-[#1D1C22] border border-white/[0.08] text-left"
                    >
                      <p className="text-base font-semibold truncate">{t.title}</p>
                      <p className="text-xs text-[#9B978E] truncate">{t.artistName}</p>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {section === 'playlists' && (
            <div className="space-y-3">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => void playQueue(pl.items, false)}
                  className="w-full min-h-[72px] px-4 py-3 rounded-2xl bg-[#131318] hover:bg-[#1D1C22] border border-white/[0.08] flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-base font-semibold">{pl.name}</p>
                    <p className="text-xs text-[#9B978E]">{pl.items.length} kayıt</p>
                  </div>
                  <Play className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                </button>
              ))}
            </div>
          )}

          {section === 'quran' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void playQueue(quranItems, false)}
                  className="flex-1 min-h-[56px] rounded-2xl bg-[#D4AF37] text-[#09090B] font-semibold text-sm"
                >
                  Sıralı Dinle
                </button>
                <button
                  type="button"
                  onClick={() => void playQueue(quranItems, true)}
                  className="flex-1 min-h-[56px] rounded-2xl bg-[#191920] text-[#F5F2EB] font-semibold text-sm border border-white/10"
                >
                  Karışık Dinle
                </button>
              </div>
              <p className="text-xs text-[#D4AF37]">Aktif Kari: {selectedReciter.nameTr}</p>
              {quranItems.slice(0, 36).map((item) => (
                <button
                  key={item.contentId}
                  type="button"
                  onClick={() => void playTrack(item, quranItems)}
                  className="w-full min-h-[64px] px-4 py-3 rounded-2xl bg-[#131318] hover:bg-[#1D1C22] border border-white/[0.08] flex items-center justify-between text-left"
                >
                  <span className="text-base font-semibold">{item.title}</span>
                  <span className="font-arabic text-lg text-[#D4AF37]" dir="rtl">
                    {item.arabicTitle}
                  </span>
                </button>
              ))}
            </div>
          )}

          {section === 'recent' && (
            <div className="space-y-3">
              {recentlyPlayed.length === 0 ? (
                <p className="text-sm text-[#9B978E] p-4">Son dinlenen kayıt henüz yok.</p>
              ) : (
                recentlyPlayed.map((t) => (
                  <button
                    key={t.contentId}
                    type="button"
                    onClick={() => void playTrack(t, recentlyPlayed)}
                    className="w-full min-h-[64px] px-4 py-3 rounded-2xl bg-[#131318] hover:bg-[#1D1C22] border border-white/[0.08] text-left"
                  >
                    <p className="text-base font-semibold truncate">{t.title}</p>
                    <p className="text-xs text-[#9B978E] truncate">{t.artistName}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </main>

        {/* Right Side: Oversized Driving-Safe Media Playback Deck */}
        <section className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0D0D12] p-6 flex flex-col items-center justify-center text-center gap-5">
          {currentTrack ? (
            <>
              <ArtworkCover
                motif={currentTrack.motif}
                arabicTitle={currentTrack.arabicTitle}
                size="lg"
              />
              <div className="space-y-1 max-w-xs">
                <h2 className="text-xl font-bold text-[#F5F2EB] truncate">{currentTrack.title}</h2>
                <p className="text-sm text-[#D4AF37] truncate">{currentTrack.artistName}</p>
                <p className="text-xs font-mono tabular-nums text-[#8C887F]">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => void prevTrack()}
                  aria-label="Önceki parça"
                  className="w-16 h-16 rounded-2xl bg-[#191922] hover:bg-[#242430] flex items-center justify-center text-[#F5F2EB]"
                >
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
                  className="w-20 h-20 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] flex items-center justify-center shadow-xl"
                >
                  {isPlaying ? (
                    <Pause className="w-9 h-9 fill-current" />
                  ) : (
                    <Play className="w-9 h-9 fill-current ml-1" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void nextTrack()}
                  aria-label="Sonraki parça"
                  className="w-16 h-16 rounded-2xl bg-[#191922] hover:bg-[#242430] flex items-center justify-center text-[#F5F2EB]"
                >
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={`min-h-[48px] px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 ${
                    shuffle ? 'bg-[#D4AF37] text-[#09090B]' : 'bg-[#191922] text-[#C8C5BC]'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  Karışık
                </button>
                <button
                  type="button"
                  onClick={cycleRepeatMode}
                  className={`min-h-[48px] px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 ${
                    repeatMode !== 'off' ? 'bg-[#D4AF37] text-[#09090B]' : 'bg-[#191922] text-[#C8C5BC]'
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  {repeatMode === 'one' ? 'Tek Tekrar' : repeatMode === 'all' ? 'Tüm Tekrar' : 'Tekrar'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 text-[#8C887F]">
              <p className="text-base font-medium text-[#F5F2EB]">Oynatıcı Hazır</p>
              <p className="text-sm">Sol menüden bir kategori, liste veya sure seçin.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
