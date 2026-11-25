import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Heart,
  ListEnd,
  ListPlus,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useAutoMusic } from '../context/AutoMusicContext';
import { MediaItem } from '../types/media';
import { ArtworkCover } from './ArtworkCover';

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

const TRACK_TYPE_LABELS: Partial<Record<NonNullable<MediaItem['trackType']>, string>> = {
  live: 'Canlı',
  remix: 'Remix',
  cover: 'Cover',
  karaoke: 'Karaoke',
};

interface TrackRowProps {
  item: MediaItem;
  index?: number;
  queueContext?: MediaItem[];
  rightExtra?: React.ReactNode;
  onOpenDetail?: () => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  item,
  index,
  queueContext,
  rightExtra,
  onOpenDetail,
}) => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    playTrack,
    togglePlay,
    addToQueueNext,
    isTrackFavorite,
    toggleFavoriteTrack,
    isOfflineDownloaded,
    downloadProgressMap,
    triggerDownload,
    playlists,
    addTrackToPlaylist,
    resumePoints,
    hiddenMusicIds,
    hideMusic,
  } = useAutoMusic();

  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const isCurrent = currentTrack?.contentId === item.contentId;
  const isFav = isTrackFavorite(item.contentId);
  const isDownloaded = isOfflineDownloaded(item.contentId);
  const dlProgress = downloadProgressMap[item.contentId];
  const resume = resumePoints[item.contentId];
  const trackTypeLabel = item.trackType ? TRACK_TYPE_LABELS[item.trackType] : undefined;

  if (hiddenMusicIds.includes(item.contentId)) return null;

  const handlePrimaryClick = () => {
    if (isCurrent) {
      void togglePlay();
    } else {
      void playTrack(item, queueContext);
    }
  };

  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors border-b border-white/[0.05] last:border-b-0 ${
        isCurrent ? 'bg-[#191712]' : 'hover:bg-white/[0.03]'
      }`}
    >
      {/* Index or Play Button */}
      <button
        type="button"
        onClick={handlePrimaryClick}
        aria-label={isCurrent && isPlaying ? `${item.title} duraklat` : `${item.title} oynat`}
        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#A19E95] hover:text-[#D4AF37] focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors shrink-0"
      >
        {isCurrent && isBuffering ? (
          <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
        ) : isCurrent && isPlaying ? (
          <Pause className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
        ) : (
          <span className="flex items-center justify-center">
            {typeof index === 'number' ? (
              <>
                <span className="group-hover:hidden text-xs font-mono tabular-nums text-[#7C7970]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Play className="hidden group-hover:block w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
              </>
            ) : (
              <Play className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
            )}
          </span>
        )}
      </button>

      {/* Artwork */}
      <button
        type="button"
        onClick={handlePrimaryClick}
        className="shrink-0 focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded-lg"
      >
        <ArtworkCover motif={item.motif} categoryId={item.categoryId} imageUrl={item.coverUrl} arabicTitle={item.arabicTitle} size="xs" />
      </button>

      {/* Title & Clean Unboxed Metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenDetail ?? handlePrimaryClick}
            className={`text-left text-sm font-medium truncate hover:underline ${
              isCurrent ? 'text-[#E5C158]' : 'text-[#F5F2EB]'
            }`}
          >
            {item.title}
          </button>
          {trackTypeLabel && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[#C9B370] shrink-0">
              {trackTypeLabel}
            </span>
          )}
          {item.arabicTitle && (
            <span className="hidden sm:inline font-arabic text-sm text-[#D4AF37]/80 shrink-0" dir="rtl">
              {item.arabicTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#9B978E] truncate mt-0.5">
          <span className="truncate">{item.artistName}</span>
          {item.year && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums shrink-0">{item.year}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums shrink-0">{item.format}</span>
          {item.bitrateKbps && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums shrink-0">{item.bitrateKbps} kbps</span>
            </>
          )}
          {isDownloaded && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#D4AF37] shrink-0">Çevrimdışı hazır</span>
            </>
          )}
          {resume && resume.positionSec > 10 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#C9B370] font-mono tabular-nums shrink-0">
                Kaldığı yer {formatDuration(resume.positionSec)}
              </span>
            </>
          )}
        </div>

        {/* Active download progress line */}
        {dlProgress && dlProgress.status === 'downloading' && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 max-w-[160px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] transition-all duration-200"
                style={{ width: `${dlProgress.progress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono tabular-nums text-[#D4AF37]">
              İndiriliyor %{dlProgress.progress}
            </span>
          </div>
        )}
      </div>

      {/* Action Controls (Min 40x40 touch targets) */}
      <div className="flex items-center gap-1 shrink-0">
        {resume && resume.positionSec > 10 && (
          <button
            type="button"
            onClick={() => void playTrack(item, queueContext, true)}
            title="Baştan oynat"
            aria-label="Baştan oynat"
            className="hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center rounded-lg text-[#9B978E] hover:text-[#F5F2EB] hover:bg-white/[0.06] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Offline download trigger */}
        {item.downloadAllowed && !item.isLocalFile && (
          <button
            type="button"
            onClick={() => void triggerDownload(item, true)}
            title={isDownloaded ? 'Uygulama arşivinde kayıtlı' : 'Çevrimdışı kaydet'}
            aria-label={isDownloaded ? 'Çevrimdışı kayıtlı' : 'Çevrimdışı indir'}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors ${
              isDownloaded
                ? 'text-[#D4AF37]'
                : 'text-[#8C887F] hover:text-[#F5F2EB] hover:bg-white/[0.06]'
            }`}
          >
            {dlProgress?.status === 'downloading' ? (
              <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
            ) : isDownloaded ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Favorite */}
        <button
          type="button"
          onClick={() => toggleFavoriteTrack(item)}
          title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors ${
            isFav ? 'text-[#D4AF37]' : 'text-[#8C887F] hover:text-[#F5F2EB] hover:bg-white/[0.06]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#D4AF37]' : ''}`} />
        </button>

        {/* Add to Queue Next / Playlist Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPlaylistMenu((v) => !v)}
            title="Sıraya veya listeye ekle"
            aria-label="Sıraya veya listeye ekle"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#8C887F] hover:text-[#F5F2EB] hover:bg-white/[0.06] transition-colors"
          >
            <ListPlus className="w-4 h-4" />
          </button>

          {showPlaylistMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowPlaylistMenu(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-56 rounded-xl bg-[#18181D] border border-white/10 shadow-2xl p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    addToQueueNext(item);
                    setShowPlaylistMenu(false);
                  }}
                  className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[#E5C158] hover:bg-white/[0.08] transition-colors"
                >
                  <ListEnd className="w-3.5 h-3.5 shrink-0" />
                  Sıradaki Olarak Çal
                </button>
                {item.categoryId !== 'kuran' && <button type="button" onClick={() => { hideMusic(item); setShowPlaylistMenu(false); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-red-300 hover:bg-white/[0.08]"><Trash2 className="w-3.5 h-3.5"/>Müziği Kaldır</button>}
                <div className="border-t border-white/[0.08] pt-1">
                  <p className="px-2.5 py-1 text-[11px] font-medium text-[#9B978E]">
                    Çalma Listesine Ekle
                  </p>
                  {playlists.length === 0 ? (
                    <p className="px-2.5 py-1.5 text-xs text-[#7C7970]">
                      Henüz çalma listeniz yok.
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-0.5">
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => {
                            addTrackToPlaylist(pl.id, item);
                            setShowPlaylistMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-[#F5F2EB] hover:bg-white/[0.08] truncate transition-colors"
                        >
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {item.durationSec > 0 && (
          <span className="hidden md:inline-block w-12 text-right text-xs font-mono tabular-nums text-[#8C887F]">
            {formatDuration(item.durationSec)}
          </span>
        )}

        {rightExtra}
      </div>
    </div>
  );
};
