import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  Disc3,
  Heart,
  ListMusic,
  Moon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Smartphone,
  Sun,
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
    eqSettings,
    applyEqPreset,
    playTrack,
    playQueue,
    togglePlay,
    nextTrack,
    prevTrack,
    seekBy,
    toggleShuffle,
    cycleRepeatMode,
  } = useAutoMusic();

  const [section, setSection] = useState<AutoSection>('categories');
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [dayMode, setDayMode] = useState(false);

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

  const isCarEqActive = eqSettings.enabled && eqSettings.preset === 'car';

  const bgRoot = dayMode ? 'bg-[#F4EFE4] text-[#141310]' : 'bg-[#050507] text-[#F5F2EB]';
  const bgHeader = dayMode ? 'bg-[#EAE2D0] border-[#141310]/15' : 'bg-[#0B0B0F] border-white/10';
  const bgDeck = dayMode ? 'bg-[#EFE8D8] border-[#141310]/15' : 'bg-[#0D0D12] border-white/10';
  const cardSurface = dayMode
    ? 'bg-white hover:bg-[#FAF6EC] border-[#141310]/12 text-[#141310]'
    : 'bg-[#131318] hover:bg-[#1D1C22] border-white/[0.08] text-[#F5F2EB]';
  const mutedText = dayMode ? 'text-[#5C5649]' : 'text-[#9B978E]';
  const btnSecondary = dayMode
    ? 'bg-[#E2D8C3] hover:bg-[#D7CAAF] text-[#141310] border-[#141310]/15'
    : 'bg-[#191922] hover:bg-[#242430] text-[#F5F2EB] border-white/10';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col transition-colors ${bgRoot}`}>
      {/* Car Mode Top Bar (Honest Distraction-Free Driving Interface) */}
      <header className={`h-16 px-4 sm:px-5 border-b flex items-center justify-between gap-3 shrink-0 ${bgHeader}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-lg font-bold tracking-tight whitespace-nowrap ${dayMode ? 'text-[#8C6D14]' : 'text-[#D4AF37]'}`}>
            AutoMusic Pro 4
          </span>
          <span className={`hidden sm:inline text-xs whitespace-nowrap ${mutedText}`}>
            Araç Modu · Bluetooth Medya Kumandası
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyEqPreset(isCarEqActive ? 'flat' : 'car')}
            className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
              isCarEqActive
                ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                : btnSecondary
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Araç EQ</span>
          </button>

          <button
            type="button"
            onClick={() => setDayMode((d) => !d)}
            aria-label={dayMode ? 'Gece moduna geç' : 'Gündüz moduna geç'}
            className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${btnSecondary}`}
          >
            {dayMode ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 text-[#D4AF37] shrink-0" />}
            <span className="hidden sm:inline">{dayMode ? 'Gece' : 'Gündüz'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCarMode(false)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold border whitespace-nowrap ${btnSecondary}`}
          >
            <Smartphone className={`w-4 h-4 ${dayMode ? 'text-[#8C6D14]' : 'text-[#D4AF37]'}`} />
            Normal Mod
          </button>
        </div>
      </header>

      {/* Main Car Layout: Browse Rail + Content + Oversized Playback Deck (supports portrait & landscape) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12">
        {/* Left Navigation Rail (Large Touch Targets) */}
        <aside className={`md:col-span-3 border-b md:border-b-0 md:border-r p-3 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto ${bgHeader}`}>
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
                  : dayMode
                    ? 'bg-white text-[#141310] hover:bg-[#FAF6EC] border border-[#141310]/10'
                    : 'bg-[#14141A] text-[#E5E2D9] hover:bg-[#1D1D25]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Center Browse Grid */}
        <main className="md:col-span-5 p-4 sm:p-5 overflow-y-auto space-y-4">
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
                  className={`min-h-[72px] p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-colors ${cardSurface}`}
                >
                  <ArtworkCover motif={cat.motif} size="sm" />
                  <div className="min-w-0">
                    <p className="text-base font-semibold truncate">{cat.name}</p>
                    <p className={`text-xs truncate ${mutedText}`}>{cat.language}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {section === 'artists' && (
            <div className="space-y-3">
              <p className={`text-xs ${mutedText}`}>Kariler ve Katalog Sanatçıları</p>
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
                  className={`w-full min-h-[68px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left ${cardSurface}`}
                >
                  <div>
                    <p className="text-base font-semibold">{rec.nameTr}</p>
                    <p className={`text-xs ${mutedText}`}>Kur'an Karisi · {rec.style}</p>
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
                .slice(0, 14)
                .map((art) => (
                  <button
                    key={art.name}
                    type="button"
                    onClick={() => void playQueue(art.tracks, false)}
                    className={`w-full min-h-[68px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left ${cardSurface}`}
                  >
                    <div>
                      <p className="text-base font-semibold">{art.name}</p>
                      <p className={`text-xs ${mutedText}`}>{art.tracks.length} kayıt</p>
                    </div>
                    <Play className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                  </button>
                ))}
            </div>
          )}

          {section === 'favorites' && (
            <div className="space-y-3">
              {favoriteTracks.length === 0 ? (
                <p className={`text-sm p-4 ${mutedText}`}>Henüz favori parça eklenmedi.</p>
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
                      className={`flex-1 min-h-[56px] rounded-2xl font-semibold text-sm border ${btnSecondary}`}
                    >
                      Karışık Çal
                    </button>
                  </div>
                  {favoriteTracks.map((t) => (
                    <button
                      key={t.contentId}
                      type="button"
                      onClick={() => void playTrack(t, favoriteTracks)}
                      className={`w-full min-h-[64px] px-4 py-3 rounded-2xl border text-left ${cardSurface}`}
                    >
                      <p className="text-base font-semibold truncate">{t.title}</p>
                      <p className={`text-xs truncate ${mutedText}`}>{t.artistName}</p>
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
                  className={`w-full min-h-[72px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left ${cardSurface}`}
                >
                  <div>
                    <p className="text-base font-semibold">{pl.name}</p>
                    <p className={`text-xs ${mutedText}`}>{pl.items.length} kayıt</p>
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
                  className={`flex-1 min-h-[56px] rounded-2xl font-semibold text-sm border ${btnSecondary}`}
                >
                  Karışık Dinle
                </button>
              </div>
              <p className="text-xs font-medium text-[#D4AF37]">Aktif Kari: {selectedReciter.nameTr}</p>
              {quranItems.slice(0, 36).map((item) => (
                <button
                  key={item.contentId}
                  type="button"
                  onClick={() => void playTrack(item, quranItems)}
                  className={`w-full min-h-[64px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left ${cardSurface}`}
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
                <p className={`text-sm p-4 ${mutedText}`}>Son dinlenen kayıt henüz yok.</p>
              ) : (
                recentlyPlayed.map((t) => (
                  <button
                    key={t.contentId}
                    type="button"
                    onClick={() => void playTrack(t, recentlyPlayed)}
                    className={`w-full min-h-[64px] px-4 py-3 rounded-2xl border text-left ${cardSurface}`}
                  >
                    <p className="text-base font-semibold truncate">{t.title}</p>
                    <p className={`text-xs truncate ${mutedText}`}>{t.artistName}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </main>

        {/* Right Side: Oversized Driving-Safe Media Playback Deck */}
        <section className={`md:col-span-4 border-t md:border-t-0 md:border-l p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-4 ${bgDeck}`}>
          {currentTrack ? (
            <>
              <ArtworkCover
                motif={currentTrack.motif}
                imageUrl={currentTrack.coverUrl}
                arabicTitle={currentTrack.arabicTitle}
                size="lg"
              />
              <div className="space-y-1 max-w-xs">
                <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
                <p className={`text-sm font-medium truncate ${dayMode ? 'text-[#8C6D14]' : 'text-[#D4AF37]'}`}>
                  {currentTrack.artistName}
                </p>
                <p className={`text-xs font-mono tabular-nums ${mutedText}`}>
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => seekBy(-15)}
                  aria-label="15 saniye geri"
                  className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center ${btnSecondary}`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px] font-mono leading-none mt-0.5">15</span>
                </button>
                <button
                  type="button"
                  onClick={() => void prevTrack()}
                  aria-label="Önceki parça"
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${btnSecondary}`}
                >
                  <SkipBack className="w-6 h-6 fill-current" />
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
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${btnSecondary}`}
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => seekBy(15)}
                  aria-label="15 saniye ileri"
                  className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center ${btnSecondary}`}
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[10px] font-mono leading-none mt-0.5">15</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={`min-h-[48px] px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 border ${
                    shuffle ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]' : btnSecondary
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  Karışık
                </button>
                <button
                  type="button"
                  onClick={cycleRepeatMode}
                  className={`min-h-[48px] px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 border ${
                    repeatMode !== 'off' ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]' : btnSecondary
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  {repeatMode === 'one' ? 'Tek Tekrar' : repeatMode === 'all' ? 'Tüm Tekrar' : 'Tekrar'}
                </button>
              </div>
            </>
          ) : (
            <div className={`space-y-2 ${mutedText}`}>
              <p className="text-base font-medium">Oynatıcı Hazır</p>
              <p className="text-sm">Sol menüden bir kategori, liste veya sure seçin.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
