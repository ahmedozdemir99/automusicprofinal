import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  LogOut,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Smartphone,
  Tv,
  Volume2,
  Wifi,
} from 'lucide-react';
import { useAutoMusic } from '../context/AutoMusicContext';
import { getFallbackStreamUrl, getProxiedAudioUrl } from '../data/quranData';
import {
  TvCastPlaybackState,
  TvCastReceiverClient,
  formatTvCode,
} from '../services/deviceCastService';
import { ArtworkCover } from './ArtworkCover';
import { formatDuration } from './TrackRow';

const TV_CODE_SESSION_KEY = 'amp_tv_receiver_code_v1';

export const GoogleTvReceiverScreen: React.FC = () => {
  const { exitTvReceiverMode } = useAutoMusic();
  const [tvCode, setTvCode] = useState<string>('');
  const [controllerCount, setControllerCount] = useState<number>(0);
  const [castState, setCastState] = useState<TvCastPlaybackState | null>(null);
  const [wsStatus, setWsStatus] = useState<string>('TV bağlantı kodu hazırlanıyor...');
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [localPlaying, setLocalPlaying] = useState<boolean>(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState<boolean>(false);
  const [audioError, setAudioError] = useState('');

  const clientRef = useRef<TvCastReceiverClient | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);
  const lastSeekNonceRef = useRef<number | undefined>(undefined);
  const lastTelemetryRef = useRef(0);
  const playButtonRef = useRef<HTMLButtonElement | null>(null);
  const exitButtonRef = useRef<HTMLButtonElement | null>(null);
  const usedFallbackRef = useRef<boolean>(false);

  useEffect(() => {
    let savedCode: string | undefined;
    try {
      savedCode = sessionStorage.getItem(TV_CODE_SESSION_KEY) || undefined;
    } catch {
      savedCode = undefined;
    }

    const client = new TvCastReceiverClient(savedCode, {
      onRegistered: (code, controllers, initialState) => {
        setTvCode(code);
        setControllerCount(controllers);
        setWsStatus('');
        try {
          sessionStorage.setItem(TV_CODE_SESSION_KEY, code);
        } catch {
          // ignore
        }
        if (initialState) {
          setCastState(initialState);
        }
      },
      onPresence: (controllers) => {
        setControllerCount(controllers);
        if (controllers === 0) { audioRef.current?.pause(); setCastState(null); }
      },
      onState: (nextState) => {
        setCastState(nextState);
      },
      onStatusError: (msg) => {
        setWsStatus(msg);
      },
    });
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

  // Sync incoming cast state to the TV's audio element
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !castState) return;

    audioEl.muted = false;
    audioEl.volume = Math.max(0, Math.min(1, castState.volume ?? 0.9));

    const track = castState.track;
    if (!track) {
      audioEl.pause();
      loadedTrackIdRef.current = null;
      setLocalPlaying(false);
      return;
    }

    const trackChanged = loadedTrackIdRef.current !== track.contentId;
    const seekTriggered =
      typeof castState.seekNonce === 'number' &&
      castState.seekNonce !== lastSeekNonceRef.current;

    if (trackChanged) {
      loadedTrackIdRef.current = track.contentId;
      lastSeekNonceRef.current = castState.seekNonce;
      usedFallbackRef.current = false;
      setAudioError('');
      setNeedsAudioUnlock(false);
      audioEl.src = getProxiedAudioUrl(track.streamUrl);
      audioEl.load();
      if (castState.positionSec > 0.5) {
        const applyInitialSeek = () => {
          audioEl.currentTime = castState.positionSec;
          audioEl.removeEventListener('loadedmetadata', applyInitialSeek);
        };
        audioEl.addEventListener('loadedmetadata', applyInitialSeek);
      }
    } else if (seekTriggered) {
      lastSeekNonceRef.current = castState.seekNonce;
      audioEl.currentTime = Math.max(0, castState.positionSec || 0);
    }

    if (castState.isPlaying && audioEl.paused) {
      void audioEl
        .play()
        .then(() => {
          setNeedsAudioUnlock(false);
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          setNeedsAudioUnlock(true);
          if (err?.name !== 'NotAllowedError') setAudioError('TV sesi başlatılamadı. Tekrar deneyin.');
        });
    } else if (!castState.isPlaying) {
      audioEl.pause();
    }
  }, [castState]);

  // Wire audio element events + telemetry back to paired phone
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const pushTelemetry = () => {
      const now = Date.now();
      if (now - lastTelemetryRef.current < 900) return;
      lastTelemetryRef.current = now;
      const cur = audioEl.currentTime || 0;
      const dur = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
      setAudioCurrentTime(cur);
      setAudioDuration(dur);
      setLocalPlaying(!audioEl.paused);
      clientRef.current?.sendTelemetry({
        currentTime: cur,
        duration: dur,
        isPlaying: !audioEl.paused,
      });
    };

    const onError = () => {
      const track = castState?.track;
      if (track && !usedFallbackRef.current) {
        const fallback = getFallbackStreamUrl(track);
        if (fallback && fallback !== track.streamUrl) {
          usedFallbackRef.current = true;
          audioEl.src = getProxiedAudioUrl(fallback);
          audioEl.load();
          if (castState?.isPlaying) {
            void audioEl.play().catch(() => setNeedsAudioUnlock(true));
          }
          return;
        }
      }
      setAudioError('Ses kaynağı TV’de açılamadı.');
      setNeedsAudioUnlock(true);
    };

    const onEnded = () => {
      clientRef.current?.sendCommand({ action: 'next' });
    };

    const telemetryInterval = window.setInterval(() => {
      if (!audioEl.paused) {
        pushTelemetry();
      }
    }, 1000);

    audioEl.addEventListener('playing', pushTelemetry);
    audioEl.addEventListener('durationchange', pushTelemetry);
    audioEl.addEventListener('play', pushTelemetry);
    audioEl.addEventListener('pause', pushTelemetry);
    audioEl.addEventListener('ended', onEnded);
    audioEl.addEventListener('error', onError);

    return () => {
      window.clearInterval(telemetryInterval);
      audioEl.removeEventListener('playing', pushTelemetry);
      audioEl.removeEventListener('durationchange', pushTelemetry);
      audioEl.removeEventListener('play', pushTelemetry);
      audioEl.removeEventListener('pause', pushTelemetry);
      audioEl.removeEventListener('ended', onEnded);
      audioEl.removeEventListener('error', onError);
    };
  }, [castState]);

  // TV Remote / Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tv-root] button:not(:disabled)'));
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (buttons.length) { e.preventDefault(); buttons[index < 0 ? 0 : (index + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length].focus(); }
        return;
      }
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
        e.preventDefault();
        exitTvReceiverMode();
      } else if (e.key === 'MediaPlayPause' || (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON')) {
        e.preventDefault();
        clientRef.current?.sendCommand({ action: 'toggle' });
      } else if (e.key === 'MediaTrackNext') {
        e.preventDefault();
        clientRef.current?.sendCommand({ action: 'next' });
      } else if (e.key === 'MediaTrackPrevious') {
        e.preventDefault();
        clientRef.current?.sendCommand({ action: 'prev' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exitTvReceiverMode]);

  const handleUnlockAudio = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.muted = false;
    if (audioEl.volume === 0) audioEl.volume = 0.8;
    if (audioEl.error) audioEl.load();
    void audioEl.play()
      .then(() => { setNeedsAudioUnlock(false); setAudioError(''); })
      .catch(() => { setNeedsAudioUnlock(true); setAudioError('TV sesi açılamadı. Ses kaynağını veya TV tarayıcısını kontrol edin.'); });
  };

  const track = castState?.track ?? null;
  useEffect(() => { (track ? playButtonRef.current : exitButtonRef.current)?.focus(); }, [Boolean(track)]);
  const effectiveDuration = audioDuration > 0 ? audioDuration : track?.durationSec ?? 0;
  const progressPct =
    effectiveDuration > 0 ? Math.min(100, (audioCurrentTime / effectiveDuration) * 100) : 0;

  return (
    <div data-tv-root className="fixed inset-0 z-50 bg-[#070709] text-[#F5F2EB] flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none">
      <audio ref={audioRef} preload="auto" />
      {audioError && <p role="alert" className="relative z-20 px-3 py-2 text-center text-xs text-[#E5C158]">{audioError}</p>}

      {/* Subtle Ambient Backdrop */}
      {track?.coverUrl && (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10 bg-center bg-cover pointer-events-none"
          style={{ backgroundImage: `url(${track.coverUrl})` }}
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#070709]/85 via-[#070709]/70 to-[#070709] pointer-events-none"
      />

      {/* Top TV Header */}
      <header className="relative z-10 px-3 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
            <Tv className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-[#D4AF37]">
              AutoMusic Pro · Google TV
            </p>
            <p className="text-xs text-[#A19E95]">
              Büyük Ekran Alıcı Modu
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Pairing Status & 6-Digit Code Badge */}
          <div className="px-4 py-2 rounded-2xl bg-[#141419]/90 border border-white/10 flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                controllerCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs sm:text-sm text-[#CFCBC2]">
              {controllerCount > 0 ? 'Telefon Bağlı' : 'Eşleşme Bekleniyor'}
            </span>
            {tvCode && (
              <span className="px-3 py-1 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 font-mono text-base sm:text-lg font-bold tracking-[0.2em] text-[#E5C158]">
                {formatTvCode(tvCode)}
              </span>
            )}
          </div>

          <button
            type="button"
            ref={exitButtonRef}
            onClick={exitTvReceiverMode}
            className="h-11 px-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs sm:text-sm font-semibold text-[#F5F2EB] inline-flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#D4AF37]" />
            TV Modundan Çık
          </button>
        </div>
      </header>

      {/* Center Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-8 py-3">
        {!track ? (
          <div className="max-w-[min(90vw,110rem)] w-full text-center space-y-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs text-[#CFCBC2]">
                <Wifi className="w-3.5 h-3.5 text-[#D4AF37]" />
                YouTube TV Eşleştirme Mantığı ile Anında Bağlanın
              </div>
              <h1 className="text-[clamp(1.5rem,3vw,4.5rem)] font-bold tracking-tight text-[#F5F2EB]">
                Google TV Kodunuz
              </h1>
              <p className="text-sm sm:text-base text-[#A19E95] max-w-xl mx-auto">
                Telefonunuzdaki AutoMusic Pro uygulamasından &ldquo;TV’ye Yansıt&rdquo; butonuna
                basıp aşağıdaki 6 haneli kodu girin.
              </p>
            </div>

            <div className="inline-flex flex-col items-center gap-3 px-5 sm:px-10 py-4 rounded-3xl bg-[#121217]/95 border border-[#D4AF37]/40 shadow-2xl">
              <span className="font-mono text-[clamp(2.5rem,6vw,7rem)] font-extrabold tracking-[0.22em] text-[#E5C158]">
                {tvCode ? formatTvCode(tvCode) : '------'}
              </span>
              {wsStatus && (
                <span className="text-xs text-amber-300">{wsStatus}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-[#121217]/80 border border-white/[0.08] space-y-1">
                <p className="text-xs font-bold text-[#D4AF37]">1. Telefondan Açın</p>
                <p className="text-xs text-[#A19E95]">
                  Oynatıcıdaki TV simgesine veya Ayarlar &gt; Google TV bölümüne dokunun.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#121217]/80 border border-white/[0.08] space-y-1">
                <p className="text-xs font-bold text-[#D4AF37]">2. Kodu Girin</p>
                <p className="text-xs text-[#A19E95]">
                  Yukarıdaki 6 haneli kodu telefonunuza yazıp &ldquo;TV’ye Bağlan&rdquo; deyin.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#121217]/80 border border-white/[0.08] space-y-1">
                <p className="text-xs font-bold text-[#D4AF37]">3. Kumanda ile Yönetin</p>
                <p className="text-xs text-[#A19E95]">
                  Telefonunuzdan veya TV kumandanızdan müzik ve Kur’an akışını kontrol edin.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[min(94vw,140rem)] w-full grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-center">
            <div className="md:col-span-5 flex justify-center">
              <ArtworkCover
                motif={track.motif}
                imageUrl={track.coverUrl}
                arabicTitle={track.arabicTitle}
                size="xl"
                className="shadow-2xl shadow-black/70 ring-1 ring-white/10"
              />
            </div>

            <div className="md:col-span-7 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.07] border border-white/10 text-xs text-[#E5C158]">
                  {track.surahNumber || track.categoryId === 'kuran' ? (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      Kur’an-ı Kerim Tilaveti
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Telefondan Yansıtılıyor
                    </>
                  )}
                </div>

                {track.arabicTitle && (
                  <p className="text-2xl sm:text-4xl font-serif text-[#E5C158] pt-1" dir="rtl">
                    {track.arabicTitle}
                  </p>
                )}
                <h1 className="text-[clamp(1.5rem,3vw,4.5rem)] font-bold tracking-tight text-[#F5F2EB] leading-tight">
                  {track.title}
                </h1>
                <p className="text-lg sm:text-2xl text-[#B8B3A8]">
                  {track.artistName}
                  {track.album ? ` · ${track.album}` : ''}
                </p>
              </div>

              {needsAudioUnlock && (
                <button
                  type="button"
                  onClick={handleUnlockAudio}
                  className="inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#09090B] text-sm font-bold shadow-lg transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                  TV Sesini Başlat (Kumanda / Tıklayın)
                </button>
              )}

              {/* Live TV Spectrum Visualizer */}
              <div className="flex items-end justify-center md:justify-start gap-1.5 h-8" aria-hidden="true">
                {[0.45, 0.8, 0.6, 0.95, 0.5, 0.85, 0.7, 0.9, 0.55, 0.75, 0.4, 0.65].map((scale, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      localPlaying ? 'bg-[#D4AF37]' : 'bg-white/20'
                    }`}
                    style={{
                      height: localPlaying ? `${Math.round(scale * 30)}px` : '6px',
                      animationDelay: `${idx * 90}ms`,
                    }}
                  />
                ))}
              </div>

              {/* TV Progress Bar */}
              <div className="space-y-2">
                <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#D4AF37] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono tabular-nums text-[#A19E95]">
                  <span>{formatDuration(audioCurrentTime)}</span>
                  <span>{formatDuration(effectiveDuration)}</span>
                </div>
              </div>

              {/* TV Remote Friendly Controls */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => clientRef.current?.sendCommand({ action: 'prev' })}
                  aria-label="Önceki parça"
                  className="focus-visible:ring-4 focus-visible:ring-[#D4AF37] w-14 h-14 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 flex items-center justify-center text-[#F5F2EB] transition-colors"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => clientRef.current?.sendCommand({ action: 'toggle' })}
                  ref={playButtonRef}
                  aria-label={localPlaying ? 'Duraklat' : 'Oynat'}
                  className="focus-visible:ring-4 focus-visible:ring-white w-16 h-16 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] flex items-center justify-center shadow-xl transition-transform active:scale-95"
                >
                  {localPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => clientRef.current?.sendCommand({ action: 'next' })}
                  aria-label="Sonraki parça"
                  className="focus-visible:ring-4 focus-visible:ring-[#D4AF37] w-14 h-14 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 flex items-center justify-center text-[#F5F2EB] transition-colors"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Hint Bar */}
      <footer className="relative z-10 px-3 sm:px-8 py-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8C887F]">
        <span>Kumanda: Ok tuşları ile seçin · OK ile çalıştırın · Geri ile çıkın</span>
        <span>AutoMusic Pro 4 TV Receiver</span>
      </footer>
    </div>
  );
};
