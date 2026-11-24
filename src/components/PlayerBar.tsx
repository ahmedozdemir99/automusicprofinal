import React from 'react';
import {
  Car,
  Heart,
  Loader2,
  Maximize2,
  Moon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAutoMusic } from '../context/AutoMusicContext';
import { ArtworkCover } from './ArtworkCover';
import { formatDuration } from './TrackRow';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    isPlayingOfflineFile,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    sleepTimerMode,
    sleepTimerRemainingSec,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    isTrackFavorite,
    toggleFavoriteTrack,
    navigate,
    setCarMode,
  } = useAutoMusic();

  if (!currentTrack) {
    return null;
  }

  const isFav = isTrackFavorite(currentTrack.contentId);
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed left-0 right-0 bottom-16 lg:bottom-0 z-40 bg-[#111115]/95 backdrop-blur-xl border-t border-white/[0.08]">
      {/* Mobile subtle progress hairline */}
      <div className="lg:hidden h-0.5 w-full bg-white/10">
        <div className="h-full bg-[#D4AF37]" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-16 lg:h-20 flex items-center justify-between gap-4">
        {/* Left: Track Info (Click opens Now Playing) */}
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none lg:w-[30%]">
          <button
            type="button"
            onClick={() => navigate({ name: 'now_playing' })}
            className="flex items-center gap-3 min-w-0 text-left group focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded-lg"
          >
            <ArtworkCover
              motif={currentTrack.motif}
              imageUrl={currentTrack.coverUrl}
              arabicTitle={currentTrack.arabicTitle}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F5F2EB] truncate group-hover:text-[#E5C158] transition-colors">
                {currentTrack.title}
              </p>
              <p className="text-xs text-[#9B978E] truncate">
                {currentTrack.artistName}
                {isPlayingOfflineFile ? ' · Çevrimdışı Arşiv' : ''}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleFavoriteTrack(currentTrack)}
            aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            className={`hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center rounded-lg transition-colors ${
              isFav ? 'text-[#D4AF37]' : 'text-[#8C887F] hover:text-[#F5F2EB]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-[#D4AF37]' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls & Desktop Scrubber */}
        <div className="flex flex-col items-center lg:w-[40%] max-w-xl">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Karışık çalma"
              className={`hidden lg:flex min-w-[36px] min-h-[36px] items-center justify-center rounded-lg transition-colors ${
                shuffle ? 'text-[#D4AF37]' : 'text-[#8C887F] hover:text-[#F5F2EB]'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => void prevTrack()}
              aria-label="Önceki parça"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#E5E2D9] hover:text-[#D4AF37] transition-colors"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => void togglePlay()}
              aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
              className="w-10 h-10 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] flex items-center justify-center shadow-md shadow-black/40 transition-transform active:scale-95"
            >
              {isBuffering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => void nextTrack()}
              aria-label="Sonraki parça"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#E5E2D9] hover:text-[#D4AF37] transition-colors"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={cycleRepeatMode}
              aria-label="Tekrar modu"
              className={`hidden lg:flex min-w-[36px] min-h-[36px] items-center justify-center rounded-lg transition-colors ${
                repeatMode !== 'off' ? 'text-[#D4AF37]' : 'text-[#8C887F] hover:text-[#F5F2EB]'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Desktop Progress Scrubber */}
          <div className="hidden lg:flex items-center gap-2.5 w-full mt-1">
            <span className="text-[11px] font-mono tabular-nums text-[#8C887F] w-10 text-right">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.5}
              value={Math.min(currentTime, duration || 100)}
              onChange={(e) => seekTo(Number(e.target.value))}
              aria-label="Oynatma konumu"
              className="gold-slider flex-1"
            />
            <span className="text-[11px] font-mono tabular-nums text-[#8C887F] w-10">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Right: Sleep indicator, EQ, Car Mode, Volume, Expand */}
        <div className="hidden lg:flex items-center justify-end gap-2 w-[30%]">
          {sleepTimerMode !== 'off' && (
            <button
              type="button"
              onClick={() => navigate({ name: 'now_playing' })}
              title="Aktif uyku zamanlayıcısı"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1D190F] border border-[#D4AF37]/40 text-[11px] font-mono text-[#E5C158]"
            >
              <Moon className="w-3 h-3" />
              {sleepTimerMode === 'end_of_track' ? 'Son' : formatDuration(sleepTimerRemainingSec ?? 0)}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate({ name: 'audio_settings' })}
            title="10-Bant Ekolayzır ve Ses Ayarları"
            aria-label="Ses ayarları"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#9B978E] hover:text-[#D4AF37] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCarMode(true)}
            title="Araç Modu"
            aria-label="Araç Modu"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#9B978E] hover:text-[#D4AF37] transition-colors"
          >
            <Car className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 w-28">
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 0.9)}
              aria-label="Sesi kapat veya aç"
              className="text-[#9B978E] hover:text-[#F5F2EB]"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Ses düzeyi"
              className="gold-slider flex-1"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate({ name: 'now_playing' })}
            title="Şimdi Çalıyor ekranını aç"
            aria-label="Şimdi Çalıyor ekranını aç"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#9B978E] hover:text-[#F5F2EB] transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
