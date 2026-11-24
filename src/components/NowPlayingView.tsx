import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Car,
  CheckCircle2,
  ChevronLeft,
  Download,
  Heart,
  Loader2,
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
  X,
} from 'lucide-react';
import { useAutoMusic } from '../context/AutoMusicContext';
import { sharedAudioEngine } from '../services/audioEngine';
import { SleepTimerMode } from '../types/media';
import { ArtworkCover } from './ArtworkCover';
import { formatDuration } from './TrackRow';

const TRACK_TYPE_LABEL: Record<string, string> = {
  live: 'Canlı Kayıt',
  remix: 'Remix',
  cover: 'Cover',
  karaoke: 'Karaoke',
};

const SLEEP_OPTIONS: Array<{ mode: SleepTimerMode; label: string }> = [
  { mode: 'off', label: 'Kapalı' },
  { mode: '15', label: '15 dk' },
  { mode: '30', label: '30 dk' },
  { mode: '45', label: '45 dk' },
  { mode: '60', label: '60 dk' },
  { mode: 'end_of_track', label: 'Parça Bitince' },
];

export const NowPlayingView: React.FC = () => {
  const {
    currentTrack,
    currentIndex,
    queue,
    isPlaying,
    isBuffering,
    isPlayingOfflineFile,
    currentTime,
    duration,
    shuffle,
    repeatMode,
    playbackError,
    sleepTimerMode,
    sleepTimerRemainingSec,
    setSleepTimer,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    seekBy,
    toggleShuffle,
    cycleRepeatMode,
    jumpToQueueIndex,
    removeFromQueue,
    moveQueueItem,
    isTrackFavorite,
    toggleFavoriteTrack,
    isOfflineDownloaded,
    downloadProgressMap,
    triggerDownload,
    goBack,
    navigate,
    setCarMode,
  } = useAutoMusic();

  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    const renderBars = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          const levels = isPlaying ? sharedAudioEngine.getFrequencyLevels(24) : new Array(24).fill(0.06);
          const gap = 4;
          const barW = Math.max(3, (w - gap * (levels.length - 1)) / levels.length);
          levels.forEach((lvl, i) => {
            const barH = Math.max(4, Math.min(h, lvl * h * 0.95));
            const x = i * (barW + gap);
            const y = h - barH;
            ctx.fillStyle = lvl > 0.55 ? '#E5C158' : 'rgba(212, 175, 55, 0.52)';
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, 2);
            ctx.fill();
          });
        }
      }
      rafId = requestAnimationFrame(renderBars);
    };
    rafId = requestAnimationFrame(renderBars);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  if (!currentTrack) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#F5F2EB]">Şimdi Çalıyor</h1>
        <p className="text-sm text-[#9B978E]">
          Henüz bir parça veya sure seçilmedi. Ana sayfadan ya da Kur'an bölümünden dinlemeye başlayın.
        </p>
        <button
          type="button"
          onClick={() => navigate({ name: 'quran' })}
          className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#09090B] text-sm font-semibold hover:bg-[#E5C158] transition-colors"
        >
          Kur'an-ı Kerim Bölümüne Git
        </button>
      </div>
    );
  }

  const isFav = isTrackFavorite(currentTrack.contentId);
  const isDownloaded = isOfflineDownloaded(currentTrack.contentId);
  const dlProgress = downloadProgressMap[currentTrack.contentId];
  const nonStudioLabel = currentTrack.trackType ? TRACK_TYPE_LABEL[currentTrack.trackType] : undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB] min-h-[40px] px-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          Geri
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {currentTrack.surahNumber && currentTrack.reciterId && (
            <button
              type="button"
              onClick={() =>
                navigate({
                  name: 'surah_detail',
                  surahNumber: currentTrack.surahNumber!,
                  reciterId: currentTrack.reciterId!,
                })
              }
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#16161B] border border-white/10 text-xs font-medium text-[#E5C158] hover:bg-[#1E1D22] transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              Türkçe Meal
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSleepMenu((s) => !s)}
            className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
              sleepTimerMode !== 'off'
                ? 'bg-[#1D190F] border-[#D4AF37] text-[#E5C158]'
                : 'bg-[#16161B] border-white/10 text-[#F5F2EB] hover:bg-[#1E1D22]'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            {sleepTimerMode === 'off'
              ? 'Uyku'
              : sleepTimerMode === 'end_of_track'
                ? 'Parça Sonu'
                : formatDuration(sleepTimerRemainingSec ?? 0)}
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'audio_settings' })}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#16161B] border border-white/10 text-xs font-medium text-[#F5F2EB] hover:bg-[#1E1D22] transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            10-Bant EQ
          </button>
          <button
            type="button"
            onClick={() => setCarMode(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#16161B] border border-white/10 text-xs font-medium text-[#F5F2EB] hover:bg-[#1E1D22] transition-colors whitespace-nowrap"
          >
            <Car className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            Araç Modu
          </button>
        </div>
      </div>

      {/* Sleep Timer Quick Bar */}
      {showSleepMenu && (
        <div className="p-4 rounded-2xl bg-[#141418] border border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-[#E5C158]">Uyku Zamanlayıcısı:</span>
          <div className="flex flex-wrap gap-2">
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  setSleepTimer(opt.mode);
                  setShowSleepMenu(false);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                  sleepTimerMode === opt.mode
                    ? 'bg-[#D4AF37] text-[#09090B]'
                    : 'bg-[#1D1D24] text-[#E5E2D9] hover:bg-[#262630]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Studio Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#121216] border border-white/[0.07] rounded-3xl p-6 sm:p-8">
        <div className="lg:col-span-5 flex flex-col items-center">
          <ArtworkCover
            motif={currentTrack.motif}
            arabicTitle={currentTrack.arabicTitle}
            imageUrl={currentTrack.coverUrl}
            size="xl"
            className="shadow-2xl shadow-black/70"
          />
          <canvas
            ref={canvasRef}
            width={260}
            height={36}
            className="mt-5 w-64 h-9 opacity-90"
            aria-hidden="true"
          />
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs text-[#9B978E]">
              {currentTrack.album}
              {currentTrack.year ? ` (${currentTrack.year})` : ''} · {currentTrack.format}
              {currentTrack.bitrateKbps ? ` · ${currentTrack.bitrateKbps} kbps` : ''}
              {isPlayingOfflineFile ? ' · Çevrimdışı Arşivden Çalıyor' : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB] tracking-tight text-balance">
                {currentTrack.title}
              </h1>
              {nonStudioLabel && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[11px] font-medium text-[#E5C158]">
                  {nonStudioLabel}
                </span>
              )}
            </div>
            <p className="text-base text-[#D4AF37] font-medium">{currentTrack.artistName}</p>
            <p className="text-xs text-[#7C7970]">{currentTrack.licenseName}</p>
          </div>

          {playbackError && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
              {playbackError}
            </div>
          )}

          {/* Scrubber */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.5}
              value={Math.min(currentTime, duration || 100)}
              onChange={(e) => seekTo(Number(e.target.value))}
              aria-label="İlerleme çubuğu"
              className="gold-slider w-full"
            />
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#9B978E]">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Primary Transport Controls with ±15s Seek */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-3.5">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Karışık çalma"
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors ${
                shuffle ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-[#8C887F] hover:text-[#F5F2EB]'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => void prevTrack()}
              aria-label="Önceki parça"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#F5F2EB] hover:text-[#D4AF37] transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => seekBy(-15)}
              title="15 saniye geri sar"
              aria-label="15 saniye geri sar"
              className="min-w-[40px] min-h-[40px] flex flex-col items-center justify-center rounded-xl text-[#C8C5BC] hover:text-[#D4AF37] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[9px] font-mono leading-none mt-0.5">15</span>
            </button>

            <button
              type="button"
              onClick={() => void togglePlay()}
              aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
              className="w-16 h-16 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 transition-transform active:scale-95 shrink-0"
            >
              {isBuffering ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekBy(15)}
              title="15 saniye ileri sar"
              aria-label="15 saniye ileri sar"
              className="min-w-[40px] min-h-[40px] flex flex-col items-center justify-center rounded-xl text-[#C8C5BC] hover:text-[#D4AF37] transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[9px] font-mono leading-none mt-0.5">15</span>
            </button>

            <button
              type="button"
              onClick={() => void nextTrack()}
              aria-label="Sonraki parça"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#F5F2EB] hover:text-[#D4AF37] transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={cycleRepeatMode}
              aria-label="Tekrar modu"
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors ${
                repeatMode !== 'off' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-[#8C887F] hover:text-[#F5F2EB]'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Secondary Utility Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => toggleFavoriteTrack(currentTrack)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
            >
              <Heart className={`w-4 h-4 shrink-0 ${isFav ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#9B978E]'}`} />
              {isFav ? 'Favorilerimde' : 'Favorilere Ekle'}
            </button>

            {currentTrack.downloadAllowed && !currentTrack.isLocalFile && (
              <button
                type="button"
                onClick={() => void triggerDownload(currentTrack, true)}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
              >
                {dlProgress?.status === 'downloading' ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin shrink-0" />
                    İndiriliyor %{dlProgress.progress}
                  </>
                ) : isDownloaded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    Uygulama Arşivinde Kayıtlı
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    Çevrimdışı Kaydet
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Queue Section with Reorder & Remove */}
      {queue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F2EB]">Oynatma Kuyruğu</h2>
            <span className="text-xs font-mono tabular-nums text-[#8C887F]">{queue.length} kayıt</span>
          </div>
          <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2 divide-y divide-white/[0.04]">
            {queue.slice(0, 30).map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={`${item.contentId}-${idx}`}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl transition-colors ${
                    isCurrent ? 'bg-[#1D190F]/80' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void jumpToQueueIndex(idx)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <span className={`w-6 text-center text-xs font-mono ${isCurrent ? 'text-[#D4AF37] font-bold' : 'text-[#7C7970]'}`}>
                      {idx + 1}
                    </span>
                    <ArtworkCover motif={item.motif} imageUrl={item.coverUrl} arabicTitle={item.arabicTitle} size="sm" />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isCurrent ? 'text-[#E5C158]' : 'text-[#F5F2EB]'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-[#9B978E] truncate">{item.artistName}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQueueItem(idx, idx - 1)}
                      aria-label="Yukarı taşı"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8C887F] hover:text-[#F5F2EB] disabled:opacity-25"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === queue.length - 1}
                      onClick={() => moveQueueItem(idx, idx + 1)}
                      aria-label="Aşağı taşı"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8C887F] hover:text-[#F5F2EB] disabled:opacity-25"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => removeFromQueue(idx)}
                        aria-label="Kuyruktan çıkar"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8C887F] hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
