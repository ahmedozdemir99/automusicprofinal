import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Download,
  Heart,
  ListPlus,
  Loader2,
  Play,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  Volume2,
} from 'lucide-react';
import { ArtworkCover } from '../components/ArtworkCover';
import { formatDuration } from '../components/TrackRow';
import { useAutoMusic } from '../context/AutoMusicContext';
import { RECITERS, SURAHS, buildSurahMediaItem } from '../data/quranData';
import { normalizeSearchText, quranRepository } from '../services/catalogRepository';
import { AyahItem, MediaItem } from '../types/media';

// ============================================================
// Screen 7 (Kur'an-ı Kerim), Screen 8 (Kari Seçimi), Screen 9 (Sure Listesi)
// ============================================================
export const QuranHubScreen: React.FC<{ initialShowReciters?: boolean }> = ({
  initialShowReciters = false,
}) => {
  const {
    selectedReciterId,
    setSelectedReciterId,
    favoriteSurahNumbers,
    toggleFavoriteSurah,
    favoriteReciterIds,
    toggleFavoriteReciter,
    isOfflineDownloaded,
    downloadProgressMap,
    triggerDownload,
    resumePoints,
    currentTrack,
    isPlaying,
    isBuffering,
    repeatMode,
    cycleRepeatMode,
    playTrack,
    playQueue,
    createPlaylist,
    navigate,
    showToast,
  } = useAutoMusic();

  const [showReciterPanel, setShowReciterPanel] = useState(initialShowReciters);
  const [surahQuery, setSurahQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'downloaded' | 'mekke' | 'medine'>('all');

  const activeReciter = useMemo(
    () => RECITERS.find((r) => r.id === selectedReciterId) ?? RECITERS[0],
    [selectedReciterId]
  );

  const allSurahItems = useMemo(
    () => SURAHS.map((s) => buildSurahMediaItem(s, activeReciter)),
    [activeReciter]
  );

  const filteredSurahs = useMemo(() => {
    const norm = normalizeSearchText(surahQuery);
    return SURAHS.filter((s) => {
      const contentId = `quran:${activeReciter.id}:${String(s.number).padStart(3, '0')}`;
      if (filterMode === 'favorites' && !favoriteSurahNumbers.includes(s.number)) return false;
      if (filterMode === 'downloaded' && !isOfflineDownloaded(contentId)) return false;
      if (filterMode === 'mekke' && s.revelation !== 'Mekke') return false;
      if (filterMode === 'medine' && s.revelation !== 'Medine') return false;
      if (!norm) return true;
      return (
        String(s.number) === norm ||
        normalizeSearchText(s.nameTr).includes(norm) ||
        normalizeSearchText(s.meaningTr).includes(norm) ||
        normalizeSearchText(s.nameAr).includes(norm)
      );
    });
  }, [activeReciter.id, favoriteSurahNumbers, filterMode, isOfflineDownloaded, surahQuery]);

  const handleSaveFavoritesAsQuranPlaylist = () => {
    const items = SURAHS.filter((s) => favoriteSurahNumbers.includes(s.number)).map((s) =>
      buildSurahMediaItem(s, activeReciter)
    );
    if (items.length === 0) {
      showToast('Önce en az bir sureyi favorilere ekleyin.');
      return;
    }
    const pl = createPlaylist(
      `Kur'an Seçkim (${activeReciter.nameTr})`,
      'Favori surelerden oluşan Kur’an çalma listesi',
      items,
      true
    );
    navigate({ name: 'playlist_detail', playlistId: pl.id });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Active Reciter Banner — Strictly Aligned Uniform Buttons */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#19150B] via-[#121216] to-[#0B0B0E] border border-[#D4AF37]/20 space-y-6">
        <div className="flex items-start sm:items-center gap-5">
          <ArtworkCover motif="kuran" arabicTitle="القرآن" size="md" />
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-[#D4AF37]">
              114 Sure · Türkçe Diyanet Meali · İzinli Çevrimdışı Kayıt
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Kur'an-ı Kerim</h1>
            <p className="text-sm text-[#A8A49B]">
              Seçili Kâri: <span className="text-[#F5F2EB] font-medium">{activeReciter.nameTr}</span> ·{' '}
              {activeReciter.style} · {activeReciter.bitrateKbps} kbps
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => void playQueue(allSurahItems, false)}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            Sırayla Dinle
          </button>
          <button
            type="button"
            onClick={() => void playQueue(allSurahItems, true)}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4 text-[#D4AF37] shrink-0" />
            Karışık Dinle
          </button>
          <button
            type="button"
            onClick={cycleRepeatMode}
            className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
              repeatMode !== 'off'
                ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#E5C158]'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-[#CFCBC2]'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4 shrink-0" />
            ) : (
              <Repeat className="w-4 h-4 shrink-0" />
            )}
            {repeatMode === 'one' ? 'Tek Sure Tekrar' : repeatMode === 'all' ? 'Tüm Sureler' : 'Tekrar Kapalı'}
          </button>
          <button
            type="button"
            onClick={() => setShowReciterPanel((v) => !v)}
            className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
              showReciterPanel
                ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#E5C158]'
                : 'bg-[#19181F] hover:bg-[#23212A] border-[#D4AF37]/30 text-[#E5C158]'
            }`}
          >
            Kâri Değiştir (6)
          </button>
        </div>
      </section>

      {/* Screen 8: Kâri Seçimi Grid */}
      {showReciterPanel && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#F5F2EB]">Kâri Seçimi</h2>
            <span className="text-xs text-[#9B978E]">Doğrulanmış açık kaynak MP3 tilavet akışları</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {RECITERS.map((rec) => {
              const isSelected = rec.id === selectedReciterId;
              const isFavReciter = favoriteReciterIds.includes(rec.id);
              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#1D190F] border-[#D4AF37]'
                      : 'bg-[#121216] border-white/[0.07] hover:border-[#D4AF37]/35'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReciterId(rec.id);
                      showToast(`Kâri seçildi: ${rec.nameTr}`);
                    }}
                    className="text-left flex-1 min-w-0 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#F5F2EB] truncate">{rec.nameTr}</p>
                      {isSelected && <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                    </div>
                    <p className="font-arabic text-base text-[#D4AF37]/85" dir="rtl">
                      {rec.nameAr}
                    </p>
                    <p className="text-xs text-[#9B978E]">
                      {rec.style} · {rec.country} · {rec.bitrateKbps} kbps
                    </p>
                    <p className="text-[11px] text-[#7C7970]">
                      {rec.everyAyahFolder ? 'Sure + Ayet ayet dinleme destekli' : 'Tam sure tilaveti destekli'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFavoriteReciter(rec.id)}
                    aria-label={`${rec.nameTr} favori kâri`}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors ${
                      isFavReciter
                        ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                        : 'text-[#7C7970] hover:text-[#F5F2EB] hover:bg-white/[0.05]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavReciter ? 'fill-[#D4AF37]' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Screen 9: 114 Sure Listesi Controls */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C887F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={surahQuery}
              onChange={(e) => setSurahQuery(e.target.value)}
              placeholder="Sure adı, numarası veya Arapça ara (örn: Yasin, 36, يس)..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 h-11 bg-[#141418] border border-white/[0.08] rounded-xl overflow-x-auto">
              {(
                [
                  ['all', 'Tümü (114)'],
                  ['favorites', `Favoriler (${favoriteSurahNumbers.length})`],
                  ['downloaded', 'İndirilenler'],
                  ['mekke', 'Mekke'],
                  ['medine', 'Medine'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterMode(id)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterMode === id
                      ? 'bg-[#D4AF37] text-[#09090B]'
                      : 'text-[#A19E95] hover:text-[#F5F2EB]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveFavoritesAsQuranPlaylist}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-white/10 text-xs font-medium text-[#E5C158] transition-colors whitespace-nowrap"
            >
              <ListPlus className="w-4 h-4 shrink-0" />
              Favorilerden Liste
            </button>
          </div>
        </div>

        {/* 114 Surah Grid/Rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredSurahs.map((surah) => {
            const mediaItem = buildSurahMediaItem(surah, activeReciter);
            const isCurrent = currentTrack?.contentId === mediaItem.contentId;
            const isFav = favoriteSurahNumbers.includes(surah.number);
            const isDownloaded = isOfflineDownloaded(mediaItem.contentId);
            const dl = downloadProgressMap[mediaItem.contentId];
            const resume = resumePoints[mediaItem.contentId];

            return (
              <div
                key={surah.number}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                  isCurrent
                    ? 'bg-[#1A1710] border-[#D4AF37]/50'
                    : 'bg-[#121216] border-white/[0.06] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => void playTrack(mediaItem, allSurahItems)}
                    aria-label={`${surah.nameTr} suresini oynat`}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono tabular-nums text-xs font-semibold shrink-0 transition-colors ${
                      isCurrent && (isPlaying || isBuffering)
                        ? 'bg-[#D4AF37] text-[#09090B]'
                        : 'bg-[#1A191E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#09090B]'
                    }`}
                  >
                    {isCurrent && isBuffering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent && isPlaying ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      String(surah.number).padStart(3, '0')
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        name: 'surah_detail',
                        surahNumber: surah.number,
                        reciterId: activeReciter.id,
                      })
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#F5F2EB] truncate hover:text-[#E5C158]">
                        {surah.nameTr} Suresi
                      </p>
                      <span className="font-arabic text-base text-[#D4AF37]/85 shrink-0" dir="rtl">
                        {surah.nameAr}
                      </span>
                    </div>
                    <p className="text-xs text-[#9B978E] truncate mt-0.5">
                      {surah.meaningTr} · {surah.ayahCount} ayet · {surah.revelation}
                      {resume && resume.positionSec > 10 ? ` · Kaldığı yer ${formatDuration(resume.positionSec)}` : ''}
                    </p>
                  </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        name: 'surah_detail',
                        surahNumber: surah.number,
                        reciterId: activeReciter.id,
                      })
                    }
                    title="Türkçe Meal ve Ayet Dinleme"
                    aria-label={`${surah.nameTr} meali`}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-[#9B978E] hover:text-[#D4AF37] hover:bg-white/[0.05] transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void triggerDownload(mediaItem, true)}
                    title={isDownloaded ? 'Çevrimdışı kayıtlı' : 'Çevrimdışı indir'}
                    aria-label={`${surah.nameTr} indir`}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                      isDownloaded ? 'text-[#D4AF37]' : 'text-[#8C887F] hover:text-[#F5F2EB] hover:bg-white/[0.05]'
                    }`}
                  >
                    {dl?.status === 'downloading' ? (
                      <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                    ) : isDownloaded ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFavoriteSurah(surah.number)}
                    aria-label={`${surah.nameTr} favori`}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                      isFav ? 'text-[#D4AF37]' : 'text-[#8C887F] hover:text-[#F5F2EB] hover:bg-white/[0.05]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-[#D4AF37]' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ============================================================
// Surah Detail Screen: Arabic Uthmani + Official Diyanet Turkish Meal + Ayah-by-Ayah Audio
// ============================================================
export const SurahDetailScreen: React.FC<{ surahNumber: number; reciterId: string }> = ({
  surahNumber,
  reciterId,
}) => {
  const { goBack, playTrack, currentTrack, isPlaying, triggerDownload, isOfflineDownloaded } = useAutoMusic();
  const [ayahs, setAyahs] = useState<AyahItem[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const surah = SURAHS.find((s) => s.number === surahNumber) ?? SURAHS[0];
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  const fullSurahItem = useMemo(() => buildSurahMediaItem(surah, reciter), [reciter, surah]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    quranRepository
      .fetchSurahAyahsWithMeal(surah.number, reciter.id)
      .then((data) => {
        if (!active) return;
        setAyahs(data.ayahs);
        setSourceName(data.source);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Meal yüklenemedi.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reciter.id, surah.number]);

  const ayahMediaItems = useMemo<MediaItem[]>(() => {
    return ayahs
      .filter((a) => Boolean(a.audioUrl))
      .map((a) => ({
        contentId: `quran-ayah:${reciter.id}:${surah.number}:${a.numberInSurah}`,
        title: `${surah.nameTr} Suresi — ${a.numberInSurah}. Ayet`,
        arabicTitle: surah.nameAr,
        artistId: `reciter:${reciter.id}`,
        artistName: reciter.nameTr,
        album: `${surah.nameTr} Suresi (Ayet Ayet)`,
        categoryId: 'kuran',
        language: 'Arapça',
        genre: "Kur'an Tilaveti",
        durationSec: 0,
        streamUrl: a.audioUrl!,
        sourceProvider: 'everyayah',
        downloadAllowed: true,
        licenseName: 'EveryAyah Açık Dağıtım',
        bitrateKbps: reciter.bitrateKbps,
        format: 'MP3',
        motif: 'kuran',
        surahNumber: surah.number,
        reciterId: reciter.id,
        ayahNumber: a.numberInSurah,
      }));
  }, [ayahs, reciter, surah]);

  const isSaved = isOfflineDownloaded(fullSurahItem.contentId);

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 h-9 px-2 -ml-2 rounded-lg text-sm text-[#A19E95] hover:text-[#F5F2EB] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Sure Listesine Dön
      </button>

      <div className="p-6 rounded-3xl bg-[#121216] border border-[#D4AF37]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs text-[#D4AF37]">
            {surah.number}. Sure · {surah.revelation} · {surah.ayahCount} Ayet
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">{surah.nameTr} Suresi</h1>
            <span className="font-arabic text-3xl text-[#E5C158]" dir="rtl">
              {surah.nameAr}
            </span>
          </div>
          <p className="text-sm text-[#9B978E]">
            {surah.meaningTr} · Kâri: {reciter.nameTr}
            {sourceName ? ` · ${sourceName}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => void playTrack(fullSurahItem)}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            Tam Sureyi Dinle
          </button>
          <button
            type="button"
            onClick={() => void triggerDownload(fullSurahItem, true)}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-sm font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
          >
            {isSaved ? (
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-[#D4AF37] shrink-0" />
            )}
            {isSaved ? 'Arşivde Kayıtlı' : 'Çevrimdışı Kaydet'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 rounded-2xl bg-[#121216] border border-white/[0.06] flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          <p className="text-sm text-[#9B978E]">Arapça metin ve Diyanet Türkçe meali yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-sm text-amber-200">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          {ayahs.map((ayah) => {
            const ayahTrack = ayahMediaItems.find((m) => m.ayahNumber === ayah.numberInSurah);
            const isPlayingThisAyah =
              ayahTrack && currentTrack?.contentId === ayahTrack.contentId && isPlaying;

            return (
              <article
                key={ayah.numberInSurah}
                className={`p-5 rounded-2xl border transition-colors space-y-4 ${
                  isPlayingThisAyah
                    ? 'bg-[#19160E] border-[#D4AF37]/50'
                    : 'bg-[#121216] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono tabular-nums text-[#D4AF37]">
                    {surah.number}:{ayah.numberInSurah}
                  </span>
                  {ayahTrack ? (
                    <button
                      type="button"
                      onClick={() => void playTrack(ayahTrack, ayahMediaItems, true)}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.05] hover:bg-[#D4AF37] hover:text-[#09090B] text-xs font-medium text-[#E5C158] transition-colors whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      Ayeti Dinle
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#7C7970]">
                      Ayet ayet ses seçili kâride desteklenmiyor (tam sure çalınabilir)
                    </span>
                  )}
                </div>

                <p
                  className="font-arabic text-2xl sm:text-3xl leading-[2.1] text-right text-[#F5F2EB]"
                  dir="rtl"
                >
                  {ayah.arabicText}
                </p>

                <p className="text-sm sm:text-base text-[#C4C0B6] leading-relaxed border-t border-white/[0.06] pt-3">
                  {ayah.turkishMeal}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
