import React, { useEffect, useRef } from 'react';
import {
  BookOpen,
  Car,
  CheckCircle2,
  ChevronLeft,
  Download,
  Heart,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
} from 'lucide-react';
import { useAutoMusic } from '../context/AutoMusicContext';
import { sharedAudioEngine } from '../services/audioEngine';
import { ArtworkCover } from './ArtworkCover';
import { TrackRow, formatDuration } from './TrackRow';

export const NowPlayingView: React.FC = () => {
  const {
    currentTrack,
    queue,
    isPlaying,
    isBuffering,
    isPlayingOfflineFile,
    currentTime,
    duration,
    shuffle,
    repeatMode,
    playbackError,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    toggleShuffle,
    cycleRepeatMode,
    isTrackFavorite,
    toggleFavoriteTrack,
    isOfflineDownloaded,
    downloadProgressMap,
    triggerDownload,
    goBack,
    navigate,
    setCarMode,
  } = useAutoMusic();

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Top Action Row */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB] min-h-[40px] px-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          Geri
        </button>

        <div className="flex items-center gap-2">
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
            onClick={() => navigate({ name: 'audio_settings' })}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#16161B] border border-white/10 text-xs font-medium text-[#F5F2EB] hover:bg-[#1E1D22] transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            Ekolayzır
          </button>
          <button
            type="button"
            onClick={() => setCarMode(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#16161B] border border-white/10 text-xs font-medium text-[#F5F2EB] hover:bg-[#1E1D22] transition-colors whitespace-nowrap"
          >
            <Car className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            Araba Modu
          </button>
        </div>
      </div>

      {/* Main Two-Column Studio Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#121216] border border-white/[0.07] rounded-3xl p-6 sm:p-8">
        <div className="lg:col-span-5 flex flex-col items-center">
          <ArtworkCover
            motif={currentTrack.motif}
            arabicTitle={currentTrack.arabicTitle}
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
              {currentTrack.album} · {currentTrack.format}
              {currentTrack.bitrateKbps ? ` · ${currentTrack.bitrateKbps} kbps` : ''}
              {isPlayingOfflineFile ? ' · Çevrimdışı Arşivden Çalıyor' : ''}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB] tracking-tight text-balance">
              {currentTrack.title}
            </h1>
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

          {/* Primary Transport Controls */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-5">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Karışık çalma"
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
                shuffle ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-[#8C887F] hover:text-[#F5F2EB]'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => void prevTrack()}
              aria-label="Önceki parça"
              className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-[#F5F2EB] hover:text-[#D4AF37] transition-colors"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => void togglePlay()}
              aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
              className="w-16 h-16 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 transition-transform active:scale-95"
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
              onClick={() => void nextTrack()}
              aria-label="Sonraki parça"
              className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-[#F5F2EB] hover:text-[#D4AF37] transition-colors"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            <button
              type="button"
              onClick={cycleRepeatMode}
              aria-label="Tekrar modu"
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
                repeatMode !== 'off' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-[#8C887F] hover:text-[#F5F2EB]'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
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

      {/* Queue Section */}
      {queue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F2EB]">Çalma Sırası</h2>
            <span className="text-xs font-mono tabular-nums text-[#8C887F]">{queue.length} kayıt</span>
          </div>
          <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
            {queue.slice(0, 20).map((item, idx) => (
              <TrackRow key={item.contentId} item={item} index={idx} queueContext={queue} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
