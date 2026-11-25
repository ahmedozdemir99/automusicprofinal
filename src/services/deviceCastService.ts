import { MediaItem } from '../types/media';

export interface TvCastPlaybackState {
  track: MediaItem | null;
  isPlaying: boolean;
  positionSec: number;
  volume: number;
  seekNonce?: number;
  updatedAt: number;
}

export interface TvTelemetry {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export type TvRemoteAction = 'play' | 'pause' | 'toggle' | 'next' | 'prev' | 'seek';

export interface TvCommandMessage {
  action: TvRemoteAction;
  positionSec?: number;
}

export function formatTvCode(code: string): string {
  const clean = code.replace(/[^0-9]/g, '').slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

function getTvCastWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/tv-cast`;
}

// ============================================================
// 1. Google Cast Web Sender SDK (Cover Art + Metadata) & Remote Playback Fallback
// ============================================================
type RemoteCastState = 'connecting' | 'connected' | 'disconnected';

type RemoteCapableAudio = HTMLAudioElement & {
  remote?: {
    state: RemoteCastState;
    watchAvailability?: (cb: (available: boolean) => void) => Promise<number>;
    cancelWatchAvailability?: (id?: number) => Promise<void>;
    prompt: () => Promise<void>;
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
  };
};

interface CastImageLike {
  url: string;
}

interface CastMusicMetadataLike {
  metadataType: number;
  title: string;
  artist: string;
  albumName: string;
  images: CastImageLike[];
}

interface CastMediaInfoLike {
  contentId: string;
  contentType: string;
  streamType: string;
  metadata: CastMusicMetadataLike;
}

interface CastSessionLike {
  loadMedia: (request: unknown) => Promise<void>;
  getMediaSession?: () => {
    pause?: (req: unknown, ok?: () => void, err?: () => void) => void;
    play?: (req: unknown, ok?: () => void, err?: () => void) => void;
  } | null;
}

interface CastWindowLike extends Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  cast?: {
    framework?: {
      CastContext: {
        getInstance: () => {
          setOptions: (opts: Record<string, unknown>) => void;
          requestSession: () => Promise<void>;
          getCurrentSession: () => CastSessionLike | null;
          addEventListener: (type: string, handler: (ev: { sessionState?: string }) => void) => void;
        };
      };
      CastContextEventType?: {
        SESSION_STATE_CHANGED: string;
      };
    };
  };
  chrome?: {
    cast?: {
      Image: new (url: string) => CastImageLike;
      AutoJoinPolicy: { ORIGIN_SCOPED: string };
      media: {
        DEFAULT_MEDIA_RECEIVER_APP_ID: string;
        StreamType: { BUFFERED: string };
        MusicTrackMediaMetadata: new () => CastMusicMetadataLike;
        MediaInfo: new (contentId: string, contentType: string) => CastMediaInfoLike;
        LoadRequest: new (mediaInfo: CastMediaInfoLike) => { currentTime: number; autoplay: boolean };
        PauseRequest: new () => Record<string, unknown>;
        PlayRequest: new () => Record<string, unknown>;
      };
    };
  };
}

let castSdkInitialized = false;
let castSdkLoadAttempted = false;

export function getAbsoluteArtworkUrl(coverUrl?: string): string {
  if (coverUrl && /^https?:\/\//i.test(coverUrl)) {
    return coverUrl;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/pwa-512x512.png`;
  }
  return '/pwa-512x512.png';
}

function getCastContentType(format?: MediaItem['format']): string {
  if (format === 'FLAC') return 'audio/flac';
  if (format === 'OGG') return 'audio/ogg';
  if (format === 'WAV') return 'audio/wav';
  if (format === 'AAC') return 'audio/mp4';
  return 'audio/mpeg';
}

function configureGoogleCastContext(): boolean {
  if (typeof window === 'undefined') return false;
  const cw = window as CastWindowLike;
  if (!cw.cast?.framework || !cw.chrome?.cast?.media) return false;
  if (castSdkInitialized) return true;
  try {
    const ctx = cw.cast.framework.CastContext.getInstance();
    ctx.setOptions({
      receiverApplicationId: cw.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: cw.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });
    castSdkInitialized = true;
    return true;
  } catch {
    return false;
  }
}

export function ensureGoogleCastSdkLoaded(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const cw = window as CastWindowLike;
  if (configureGoogleCastContext()) return;
  if (castSdkLoadAttempted) return;
  castSdkLoadAttempted = true;

  cw.__onGCastApiAvailable = (isAvailable: boolean) => {
    if (isAvailable) {
      configureGoogleCastContext();
    }
  };

  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
  script.async = true;
  script.onerror = () => {
    // Offline or blocked; RemotePlayback / 6-digit TV code remain fully functional
  };
  document.head.appendChild(script);
}

export function hasActiveGoogleCastSession(): boolean {
  if (typeof window === 'undefined') return false;
  const cw = window as CastWindowLike;
  if (!configureGoogleCastContext()) return false;
  try {
    return Boolean(cw.cast?.framework?.CastContext.getInstance().getCurrentSession());
  } catch {
    return false;
  }
}

export async function syncTrackToActiveGoogleCastSession(
  track: MediaItem,
  positionSec = 0,
  autoplay = true
): Promise<boolean> {
  if (typeof window === 'undefined' || track.isLocalFile || !track.streamUrl) return false;
  const cw = window as CastWindowLike;
  if (!configureGoogleCastContext() || !cw.chrome?.cast?.media) return false;

  const session = cw.cast?.framework?.CastContext.getInstance().getCurrentSession();
  if (!session) return false;

  try {
    const castStreamUrl = /^https?:\/\//i.test(track.streamUrl)
      ? track.streamUrl
      : `${window.location.origin}${track.streamUrl}`;
    const mediaInfo = new cw.chrome.cast.media.MediaInfo(castStreamUrl, getCastContentType(track.format));
    mediaInfo.streamType = cw.chrome.cast.media.StreamType.BUFFERED;

    const meta = new cw.chrome.cast.media.MusicTrackMediaMetadata();
    meta.title = track.arabicTitle ? `${track.title} · ${track.arabicTitle}` : track.title;
    meta.artist = track.artistName;
    meta.albumName = track.album || (track.surahNumber ? "Kur'an-ı Kerim" : 'AutoMusic Pro 4');

    const primaryArt = getAbsoluteArtworkUrl(track.coverUrl);
    const fallbackArt = `${window.location.origin}/pwa-512x512.png`;
    meta.images =
      primaryArt === fallbackArt
        ? [new cw.chrome.cast.Image(primaryArt)]
        : [new cw.chrome.cast.Image(primaryArt), new cw.chrome.cast.Image(fallbackArt)];
    mediaInfo.metadata = meta;

    const req = new cw.chrome.cast.media.LoadRequest(mediaInfo);
    req.currentTime = Math.max(0, positionSec);
    req.autoplay = autoplay;
    await session.loadMedia(req);
    return true;
  } catch {
    return false;
  }
}

export function isRemotePlaybackSupported(audioEl?: HTMLAudioElement): boolean {
  const target = (audioEl ?? (typeof document !== 'undefined' ? document.createElement('audio') : null)) as
    | RemoteCapableAudio
    | null;
  const hasCastSdk = typeof window !== 'undefined' && Boolean((window as CastWindowLike).cast?.framework);
  return hasCastSdk || Boolean(target?.remote && typeof target.remote.prompt === 'function');
}

export function watchRemotePlaybackState(
  audioEl: HTMLAudioElement,
  onChange: (state: RemoteCastState) => void
): () => void {
  const remote = (audioEl as RemoteCapableAudio).remote;
  if (!remote || !remote.addEventListener || !remote.removeEventListener) {
    return () => {};
  }
  onChange(remote.state || 'disconnected');
  const handler = () => {
    onChange(remote.state || 'disconnected');
  };
  remote.addEventListener('connecting', handler);
  remote.addEventListener('connect', handler);
  remote.addEventListener('disconnect', handler);
  return () => {
    remote.removeEventListener?.('connecting', handler);
    remote.removeEventListener?.('connect', handler);
    remote.removeEventListener?.('disconnect', handler);
  };
}

export async function promptNativeGoogleCast(
  audioEl: HTMLAudioElement,
  track?: MediaItem | null,
  positionSec = 0,
  autoplay = true
): Promise<{ ok: boolean; mode?: 'cast_sdk' | 'remote_audio_only'; message: string }> {
  ensureGoogleCastSdkLoaded();
  const cw = typeof window !== 'undefined' ? (window as CastWindowLike) : null;

  // 1. Prefer Google Cast SDK when available (renders cover art, title & artist on Google TV)
  if (cw && configureGoogleCastContext() && cw.cast?.framework) {
    try {
      await cw.cast.framework.CastContext.getInstance().requestSession();
      if (track) {
        const loaded = await syncTrackToActiveGoogleCastSession(track, positionSec, autoplay);
        if (!loaded) {
          return { ok: false, message: 'Medya TV’ye yüklenemedi. Telefon oynatımı korunuyor.' };
        }
        audioEl.pause();
      }
      return {
        ok: true,
        mode: 'cast_sdk',
        message: 'Google TV Cast bağlandı — kapak görseli ve parça bilgisi TV ekranına gönderildi.',
      };
    } catch (err) {
      if (err === 'cancel') {
        return { ok: false, message: 'Google Cast seçimi iptal edildi.' };
      }
      // Fall through to RemotePlayback if Cast SDK session failed
    }
  }

  // 2. Fallback: W3C Remote Playback API (sends audio stream only -> shows Chrome icon on Google TV)
  const remote = (audioEl as RemoteCapableAudio).remote;
  if (!remote || typeof remote.prompt !== 'function') {
    return {
      ok: false,
      message:
        'Bu tarayıcı doğrudan Cast penceresini desteklemiyor. Google TV tarayıcısından /?tv=1 adresini açıp 6 haneli TV Kodu ile hem ses hem tam görüntü paylaşabilirsiniz.',
    };
  }
  try {
    await remote.prompt();
    return {
      ok: true,
      mode: 'remote_audio_only',
      message:
        'Chrome Ses Cast bağlandı (bu mod TV’de yalnızca Chrome simgesi ve ses gösterir). TV ekranında kapak ve tam görüntü için 6 haneli TV Kodu (/?tv=1) ile eşleşin.',
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'NotAllowedError') {
      return { ok: false, message: 'Cast izni verilmedi veya kullanıcı tarafından iptal edildi.' };
    }
    if (err instanceof Error && err.name === 'NotFoundError') {
      return {
        ok: false,
        message:
          'Aynı Wi-Fi ağında uyumlu Chromecast / Google TV bulunamadı. TV tarayıcısından /?tv=1 açıp 6 haneli TV Kodu ile her ağdan bağlanabilirsiniz.',
      };
    }
    return {
      ok: false,
      message:
        'Doğrudan Cast başlatılamadı (önce bir parça başlatmayı veya 6 haneli TV Bağlantı Kodu ile tam ekran eşleşmeyi deneyin).',
    };
  }
}

// ============================================================
// 2. YouTube-style Real-Time TV Link Code WebSocket Clients
// ============================================================
export class TvCastControllerClient {
  private ws: WebSocket | null = null;
  private pingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private closedManually = false;
  private code: string;

  constructor(
    code: string,
    private readonly callbacks: {
      onPaired: (receiverCount: number) => void;
      onPresence: (receiverCount: number) => void;
      onTelemetry: (telemetry: TvTelemetry) => void;
      onCommand: (cmd: TvCommandMessage) => void;
      onError: (msg: string) => void;
      onClose: () => void;
    }
  ) {
    this.code = code.replace(/[^0-9]/g, '').slice(0, 6);
    this.connect();
  }

  private connect() {
    if (this.closedManually) return;
    try {
      const ws = new WebSocket(getTvCastWsUrl());
      this.ws = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'controller:pair', code: this.code }));
        this.pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
          if (msg.type === 'cast:paired') {
            this.callbacks.onPaired(Number(msg.receiverCount) || 1);
          } else if (msg.type === 'cast:presence') {
            this.callbacks.onPresence(Number(msg.receiverCount) || 0);
          } else if (msg.type === 'tv:telemetry') {
            this.callbacks.onTelemetry({
              currentTime: Number(msg.currentTime) || 0,
              duration: Number(msg.duration) || 0,
              isPlaying: Boolean(msg.isPlaying),
            });
          } else if (msg.type === 'tv:command') {
            this.callbacks.onCommand({
              action: msg.action as TvRemoteAction,
              positionSec: typeof msg.positionSec === 'number' ? msg.positionSec : undefined,
            });
          } else if (msg.type === 'cast:error') {
            this.callbacks.onError(String(msg.message || 'TV bağlantısı kurulamadı.'));
          }
        } catch {
          // ignore malformed payload
        }
      };

      ws.onerror = () => {
        this.callbacks.onError('TV bağlantı sunucusuna erişilemedi.');
      };

      ws.onclose = (event) => {
        if (this.pingTimer) {
          window.clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
        if (!this.closedManually) {
          this.callbacks.onPresence(0);
          if (event.code !== 1008) this.reconnectTimer = window.setTimeout(() => this.connect(), 3000);
        }
      };
    } catch {
      this.callbacks.onError('WebSocket bağlantısı başlatılamadı.');
    }
  }

  sendState(state: TvCastPlaybackState): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'cast:sync_state', state }));
    }
  }

  disconnect(): void {
    this.closedManually = true;
    if (this.pingTimer) window.clearInterval(this.pingTimer);
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.onClose();
  }
}

export class TvCastReceiverClient {
  private ws: WebSocket | null = null;
  private pingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private closedManually = false;
  private preferredCode?: string;

  constructor(
    preferredCode: string | undefined,
    private readonly callbacks: {
      onRegistered: (code: string, controllerCount: number, initialState: TvCastPlaybackState | null) => void;
      onPresence: (controllerCount: number) => void;
      onState: (state: TvCastPlaybackState) => void;
      onStatusError: (msg: string) => void;
    }
  ) {
    this.preferredCode = preferredCode;
    this.connect();
  }

  private connect() {
    if (this.closedManually) return;
    try {
      const ws = new WebSocket(getTvCastWsUrl());
      this.ws = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'tv:register', code: this.preferredCode }));
        this.pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
          if (msg.type === 'tv:registered') {
            const code = String(msg.code || '');
            this.preferredCode = code;
            this.callbacks.onRegistered(
              code,
              Number(msg.controllerCount) || 0,
              (msg.state as TvCastPlaybackState | null) ?? null
            );
          } else if (msg.type === 'cast:paired' || msg.type === 'cast:presence') {
            this.callbacks.onPresence(Number(msg.controllerCount) || 0);
          } else if (msg.type === 'cast:error') {
            this.callbacks.onStatusError(String(msg.message || 'TV alıcısı bağlanamadı.'));
          } else if (msg.type === 'cast:state' && msg.state) {
            this.callbacks.onState(msg.state as TvCastPlaybackState);
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        this.callbacks.onStatusError('Sunucu bağlantısı bekleniyor...');
      };

      ws.onclose = () => {
        if (this.pingTimer) {
          window.clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
        if (!this.closedManually) {
          this.callbacks.onPresence(0);
          this.callbacks.onStatusError('TV bağlantısı yeniden kuruluyor...');
          this.reconnectTimer = window.setTimeout(() => this.connect(), 2500);
        }
      };
    } catch {
      this.callbacks.onStatusError('TV alıcısı bağlanamadı.');
    }
  }

  sendTelemetry(telemetry: TvTelemetry): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'tv:telemetry', ...telemetry }));
    }
  }

  sendCommand(cmd: TvCommandMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'tv:command', ...cmd }));
    }
  }

  disconnect(): void {
    this.closedManually = true;
    if (this.pingTimer) window.clearInterval(this.pingTimer);
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ============================================================
// 3. Real Web Bluetooth (BLE GATT) & Audio Output Routing for Car Screens
// ============================================================
interface BluetoothRemoteGATTServerLike {
  connected: boolean;
  connect: () => Promise<BluetoothRemoteGATTServerLike>;
  disconnect: () => void;
  getPrimaryService: (service: string) => Promise<{
    getCharacteristic: (char: string) => Promise<{
      readValue: () => Promise<DataView>;
    }>;
  }>;
}

export interface BluetoothDeviceLike {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServerLike;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

type NavigatorWithBluetooth = Navigator & {
  bluetooth?: {
    requestDevice: (options: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
    }) => Promise<BluetoothDeviceLike>;
  };
};

type MediaDevicesWithOutput = MediaDevices & {
  selectAudioOutput?: (options?: { deviceId?: string }) => Promise<MediaDeviceInfo>;
};

type AudioElementWithSinkId = HTMLAudioElement & {
  sinkId?: string;
  setSinkId?: (sinkId: string) => Promise<void>;
};

export function isWebBluetoothSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as NavigatorWithBluetooth;
  return Boolean(nav.bluetooth && typeof nav.bluetooth.requestDevice === 'function');
}

export function isAudioOutputPickerSupported(audioEl?: HTMLAudioElement): boolean {
  if (typeof navigator === 'undefined') return false;
  const md = navigator.mediaDevices as MediaDevicesWithOutput | undefined;
  const target = (audioEl ?? (typeof document !== 'undefined' ? document.createElement('audio') : null)) as
    | AudioElementWithSinkId
    | null;
  return Boolean(md && typeof md.selectAudioOutput === 'function' && target && typeof target.setSinkId === 'function');
}

export async function connectBluetoothCarDevice(
  onDisconnected: () => void
): Promise<{
  ok: boolean;
  device?: BluetoothDeviceLike;
  name?: string;
  batteryLevel?: number | null;
  message: string;
}> {
  const nav = navigator as NavigatorWithBluetooth;
  if (!nav.bluetooth || typeof nav.bluetooth.requestDevice !== 'function') {
    return {
      ok: false,
      message:
        'Bu tarayıcı Web Bluetooth BLE taramasını kısıtlıyor. Telefon/PC Bluetooth ayarlarından aracınıza bağlanıp "Araç Modu"nu açtığınızda ses (A2DP) ve direksiyon/ekran tuşları (AVRCP) doğrudan çalışır.',
    };
  }

  try {
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['battery_service', 'device_information', 'generic_access'],
    });

    const deviceName = device.name?.trim() || 'Bluetooth Araç Cihazı';
    let batteryLevel: number | null = null;

    if (device.gatt) {
      try {
        const server = await device.gatt.connect();
        try {
          const batterySvc = await server.getPrimaryService('battery_service');
          const batteryChar = await batterySvc.getCharacteristic('battery_level');
          const val = await batteryChar.readValue();
          batteryLevel = val.getUint8(0);
        } catch {
          // Optional service; many car head units don't expose GATT battery
        }
      } catch {
        // Classic Bluetooth audio/display paired device may decline BLE GATT while staying paired at OS level
      }
    }

    device.addEventListener('gattserverdisconnected', onDisconnected);

    return {
      ok: true,
      device,
      name: deviceName,
      batteryLevel,
      message: `"${deviceName}" cihazı ile Bluetooth eşleştirmesi kuruldu.`,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'NotFoundError') {
      return { ok: false, message: 'Bluetooth cihaz seçimi iptal edildi.' };
    }
    if (err instanceof Error && err.name === 'SecurityError') {
      return {
        ok: false,
        message:
          'Tarayıcı güvenlik politikası / iframe nedeniyle Web Bluetooth engellendi. Cihazınızın Bluetooth ayarlarından araca bağlanıp Araç Modunu kullanabilirsiniz.',
      };
    }
    return {
      ok: false,
      message: 'Bluetooth bağlantısı başlatılamadı. Cihazınızın Bluetooth özelliğinin açık olduğunu kontrol edin.',
    };
  }
}

export async function selectBluetoothAudioOutput(
  audioEl: HTMLAudioElement
): Promise<{ ok: boolean; label?: string; message: string }> {
  const md = navigator.mediaDevices as MediaDevicesWithOutput | undefined;
  const sinkAudio = audioEl as AudioElementWithSinkId;
  if (!md?.selectAudioOutput || !sinkAudio.setSinkId) {
    return {
      ok: false,
      message:
        'Bu tarayıcıda uygulama içi hoparlör seçici yok. Cihazınızın ses/Bluetooth ayarlarından aracınızı seçmeniz yeterlidir.',
    };
  }
  try {
    const chosen = await md.selectAudioOutput();
    await sinkAudio.setSinkId(chosen.deviceId);
    const label = chosen.label || 'Bluetooth / Araç Ses Çıkışı';
    return {
      ok: true,
      label,
      message: `Ses çıkışı "${label}" olarak yönlendirildi.`,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'NotAllowedError') {
      return { ok: false, message: 'Ses çıkışı seçimi iptal edildi.' };
    }
    return { ok: false, message: 'Ses çıkışı değiştirilemedi.' };
  }
}
