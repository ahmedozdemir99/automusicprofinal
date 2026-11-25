import { EqPresetId, EqualizerSettings } from '../types/media';

// Professional 10-band ISO graphic equalizer frequencies (Hz)
export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export const EQ_FREQ_LABELS = ['31', '62', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'] as const;

export interface EqPresetDefinition {
  label: string;
  description: string;
  bandsDb: number[]; // length 10
  preampDb: number;
  bassBoostDb: number;
  trebleBoostDb: number;
}

export const EQ_PRESETS: Record<EqPresetId, EqPresetDefinition> = {
  flat: {
    label: 'Düz (Stüdyo)',
    description: 'Doğal, işlenmemiş referans ses çıkışı',
    bandsDb: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    preampDb: 0,
    bassBoostDb: 0,
    trebleBoostDb: 0,
  },
  car: {
    label: 'Araç Profili',
    description: 'Yol gürültüsünü dengeleyen temiz bas ve net vokal',
    bandsDb: [2.5, 3, 2, 0.5, 0, 1, 2, 2.5, 1.5, 1],
    preampDb: 0,
    bassBoostDb: 1.5,
    trebleBoostDb: 1,
  },
  headphones: {
    label: 'Kulaklık',
    description: 'Geniş sahne ve berrak üst frekans detayları',
    bandsDb: [1.5, 2, 1, 0, 0, 0.5, 1.5, 2, 2.5, 2],
    preampDb: 0,
    bassBoostDb: 1,
    trebleBoostDb: 1,
  },
  pop: {
    label: 'Pop',
    description: 'Parlak vokal ve dengeli ritim vurgusu',
    bandsDb: [-0.5, 1.5, 2.5, 3, 1.5, 0, -0.5, 1.5, 2.5, 2.5],
    preampDb: 0,
    bassBoostDb: 1,
    trebleBoostDb: 1,
  },
  rock: {
    label: 'Rock',
    description: 'Güçlü elektro gitar, tok davul ve net orta frekans',
    bandsDb: [3.5, 3, 1.5, 0, -1, 0.5, 2, 3, 3.5, 2.5],
    preampDb: -0.5,
    bassBoostDb: 1.5,
    trebleBoostDb: 1.5,
  },
  arabesk: {
    label: 'Arabesk',
    description: 'Sıcak yaylılar, derin bas ve duygulu vokal vurgusu',
    bandsDb: [2, 3, 2, 1, 0.5, 2, 2.5, 1.5, 1, 0.5],
    preampDb: -0.5,
    bassBoostDb: 2,
    trebleBoostDb: 0.5,
  },
  vocal: {
    label: 'Vokal',
    description: 'İnsan sesini öne çıkaran berrak orta frekans dengesi',
    bandsDb: [-2, -1, 0, 2, 3.5, 4, 3, 1.5, 1, 0],
    preampDb: 0,
    bassBoostDb: 0,
    trebleBoostDb: 1,
  },
  classic: {
    label: 'Klasik',
    description: 'Enstrümantal derinlik ve doğal salon tınısı',
    bandsDb: [2, 2, 1, 0.5, 0, 0, 1, 1.5, 2.5, 3],
    preampDb: 0,
    bassBoostDb: 0.5,
    trebleBoostDb: 1,
  },
  vocal_quran: {
    label: "Kur'an Tilaveti",
    description: 'Tilavet ve harf mahreçleri için kristal vokal netliği',
    bandsDb: [-2, -1, 0, 1.5, 3, 3.5, 2.5, 1.5, 1, 0],
    preampDb: 0,
    bassBoostDb: 0,
    trebleBoostDb: 1,
  },
  tasavvuf: {
    label: 'Tasavvuf',
    description: 'Ney, ud ve bendir için sıcak akustik denge',
    bandsDb: [1, 2, 2, 1.5, 1, 1.5, 1.5, 1, 1.5, 1],
    preampDb: 0,
    bassBoostDb: 1,
    trebleBoostDb: 0.5,
  },
  bass_boost: {
    label: 'Bas Güçlendirici',
    description: 'Alt frekanslarda kontrollü ve güçlü vurgu',
    bandsDb: [4.5, 4, 3, 1.5, 0, 0, 0.5, 1, 1, 0.5],
    preampDb: -1.5,
    bassBoostDb: 3.5,
    trebleBoostDb: 0,
  },
  custom: {
    label: 'Özel Profil',
    description: 'Kullanıcı tanımlı 10 bantlı ekolayzır eğrisi',
    bandsDb: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    preampDb: 0,
    bassBoostDb: 0,
    trebleBoostDb: 0,
  },
};

export function normalizeEqualizerSettings(raw: Partial<EqualizerSettings> | null | undefined): EqualizerSettings {
  const preset: EqPresetId =
    raw?.preset && raw.preset in EQ_PRESETS ? (raw.preset as EqPresetId) : 'car';
  const presetDef = EQ_PRESETS[preset];

  let bandsDb: number[];
  if (Array.isArray(raw?.bandsDb) && raw.bandsDb.length === 10) {
    bandsDb = raw.bandsDb.map((v) => Math.max(-12, Math.min(12, Number(v) || 0)));
  } else if (Array.isArray(raw?.bandsDb) && raw.bandsDb.length === 5) {
    // Smoothly upgrade legacy 5-band saved values into 10-band curve
    const b = raw.bandsDb.map((v) => Math.max(-12, Math.min(12, Number(v) || 0)));
    bandsDb = [
      b[0],
      Math.round(((b[0] + b[1]) / 2) * 10) / 10,
      b[1],
      Math.round(((b[1] + b[2]) / 2) * 10) / 10,
      b[2],
      Math.round(((b[2] + b[3]) / 2) * 10) / 10,
      b[3],
      Math.round(((b[3] + b[4]) / 2) * 10) / 10,
      b[4],
      b[4],
    ];
  } else {
    bandsDb = [...presetDef.bandsDb];
  }

  return {
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : true,
    preset,
    bandsDb,
    preampDb: Math.max(-12, Math.min(12, Number(raw?.preampDb ?? presetDef.preampDb) || 0)),
    bassBoostDb: Math.max(0, Math.min(12, Number(raw?.bassBoostDb ?? presetDef.bassBoostDb) || 0)),
    trebleBoostDb: Math.max(-6, Math.min(12, Number(raw?.trebleBoostDb ?? presetDef.trebleBoostDb) || 0)),
    volumeLeveler: typeof raw?.volumeLeveler === 'boolean' ? raw.volumeLeveler : true,
    crossfadeSec: Math.max(0, Math.min(8, Number(raw?.crossfadeSec ?? 0) || 0)),
    customProfiles: Array.isArray(raw?.customProfiles) ? raw.customProfiles : [],
  };
}

function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export class AutoMusicAudioEngine {
  private audioEl: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preampNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private dspSupported: boolean;
  private dspConnected = false;
  private lastAppliedSettings: EqualizerSettings | null = null;
  private baseVolume = 0.9;
  private fadeFrameId: number | null = null;
  private rebuffering = false;
  private rebufferingTimer: number | null = null;
  private onBufferingChange: ((buffering: boolean) => void) | null = null;

  constructor() {
    this.audioEl = new Audio();
    // Always use anonymous CORS on same-origin proxy & blob URLs so Web Audio DSP works cleanly
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.preload = 'metadata';
    this.audioEl.volume = this.baseVolume;
    const AudioCtx =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    this.dspSupported = Boolean(AudioCtx);
  }

  get element(): HTMLAudioElement {
    return this.audioEl;
  }

  get isDspSupported(): boolean {
    return this.dspSupported;
  }

  get isDspActive(): boolean {
    return this.dspConnected && this.ctx?.state === 'running';
  }

  /**
   * Checks whether a URL is CORS-safe for Web Audio API processing.
   * Same-origin proxy (/api/audio/proxy) and blob: URLs are always CORS-safe.
   */
  isCorsSafeUrl(url: string): boolean {
    if (!url) return false;
    if (url.startsWith('blob:') || url.startsWith('/api/')) return true;
    try {
      const u = new URL(url, window.location.origin);
      return u.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Prepare crossOrigin attribute safely BEFORE setting audioEl.src.
   * If Web Audio isn't bound yet and a direct cross-origin fallback URL is played,
   * clearing crossOrigin allows native HTMLAudioElement playback without CORS blocking.
   */
  prepareForSource(url: string): void {
    this.resetBufferingState();
    if (this.dspConnected || this.isCorsSafeUrl(url)) {
      this.audioEl.crossOrigin = 'anonymous';
    } else {
      this.audioEl.removeAttribute('crossorigin');
    }
  }

  /**
   * Resets any pending buffer refill timers and rebuffering flags.
   */
  resetBufferingState(): void {
    if (this.rebufferingTimer !== null) {
      window.clearTimeout(this.rebufferingTimer);
      this.rebufferingTimer = null;
    }
    if (this.rebuffering) {
      this.rebuffering = false;
      this.onBufferingChange?.(false);
    }
  }

  private buildAudioGraph(): boolean {
    if (this.dspConnected) return true;
    if (!this.dspSupported || !this.ctx) return false;

    try {
      if (!this.sourceNode) {
        this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);
      }

      // Subsonic rumble and 50/60 Hz electrical hum elimination high-pass filter (28 Hz, Q = 0.707)
      this.highPassFilter = this.ctx.createBiquadFilter();
      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.value = 28;
      this.highPassFilter.Q.value = 0.707;

      this.preampNode = this.ctx.createGain();
      this.preampNode.gain.value = 1.0;

      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 80;
      this.bassFilter.gain.value = 0;

      this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = idx === 0 ? 'lowshelf' : idx === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = idx === 0 || idx === EQ_FREQUENCIES.length - 1 ? 0.8 : 1.2;
        filter.gain.value = 0;
        return filter;
      });

      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 10000;
      this.trebleFilter.gain.value = 0;

      // Anti-hiss gentle low-pass filter at 18kHz to remove digital high-frequency MP3 compression noise
      const antiHissFilter = this.ctx.createBiquadFilter();
      antiHissFilter.type = 'lowpass';
      antiHissFilter.frequency.value = 18200;
      antiHissFilter.Q.value = 0.65;

      // Ultra-transparent volume leveler (gentle musical mastering compression without bass pumping)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -15;
      this.compressor.knee.value = 24;
      this.compressor.ratio.value = 1.9;
      this.compressor.attack.value = 0.02;
      this.compressor.release.value = 0.28;

      // Fast peak compressor with extra headroom; not a true brickwall limiter.
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -2;
      this.limiter.knee.value = 2;
      this.limiter.ratio.value = 24;
      this.limiter.attack.value = 0.001;
      this.limiter.release.value = 0.05;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;

      // Signal chain: Source -> HighPass (Sub-Bass Rumble & Hum Filter) -> Preamp -> Bass -> 10-Band EQ -> Treble -> AntiHiss -> Leveler -> Limiter -> Analyser -> Destination
      let node: AudioNode = this.sourceNode;
      node.connect(this.highPassFilter);
      node = this.highPassFilter;

      node.connect(this.preampNode);
      node = this.preampNode;

      node.connect(this.bassFilter);
      node = this.bassFilter;

      for (const band of this.eqFilters) {
        node.connect(band);
        node = band;
      }

      node.connect(this.trebleFilter);
      this.trebleFilter.connect(antiHissFilter);
      antiHissFilter.connect(this.compressor);
      this.compressor.connect(this.limiter);
      this.limiter.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.dspConnected = true;
      if (this.lastAppliedSettings) {
        this.applyEqualizer(this.lastAppliedSettings);
      }
      return true;
    } catch {
      this.dspSupported = false;
      this.dspConnected = false;
      return false;
    }
  }

  /**
   * Safe lazy AudioContext activation:
   * Only attaches MediaElementAudioSourceNode AFTER AudioContext.resume() confirms 'running'
   * AND only when playing a CORS-safe URL. If AudioContext cannot run (e.g. restricted WebView),
   * native HTMLAudioElement continues playing uninterrupted with full audio output.
   */
  async resumeContext(sourceUrl?: string): Promise<boolean> {
    if (!this.dspSupported) return false;
    if (sourceUrl && !this.isCorsSafeUrl(sourceUrl) && !this.dspConnected) {
      return false;
    }
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          this.dspSupported = false;
          return false;
        }
        this.ctx = new AudioCtx({ latencyHint: 'playback' });
      }
      if (this.ctx.state === 'suspended') {
        await Promise.race([
          this.ctx.resume(),
          new Promise<void>((resolve) => window.setTimeout(resolve, 600)),
        ]);
      }
      if (this.ctx.state === 'running') {
        if (!this.dspConnected) {
          return this.buildAudioGraph();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  applyEqualizer(rawSettings: EqualizerSettings): void {
    const settings = normalizeEqualizerSettings(rawSettings);
    this.lastAppliedSettings = settings;

    if (!this.dspConnected || !this.ctx) return;
    const now = this.ctx.currentTime;
    const active = settings.enabled;

    // Cumulative headroom compensation accounting for stacked bass/treble shelves + 10-band EQ
    const lowCumulative = (settings.bandsDb[0] ?? 0) + settings.bassBoostDb;
    const midLowCumulative = (settings.bandsDb[1] ?? 0) + settings.bassBoostDb * 0.7;
    const highCumulative = (settings.bandsDb[9] ?? 0) + settings.trebleBoostDb;
    const peakBoostDb = active
      ? Math.max(0, ...settings.bandsDb, lowCumulative, midLowCumulative, highCumulative)
      : 0;
    // Reserve headroom for overlapping filters and positive preamp settings.
    const totalPreampDb = active
      ? Math.min(settings.preampDb, -peakBoostDb - 2)
      : -1;

    if (this.preampNode) {
      this.preampNode.gain.setTargetAtTime(dbToLinear(totalPreampDb), now, 0.03);
    }

    this.eqFilters.forEach((filter, idx) => {
      const targetGain = active ? settings.bandsDb[idx] ?? 0 : 0;
      filter.gain.setTargetAtTime(targetGain, now, 0.03);
    });

    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(active ? settings.bassBoostDb : 0, now, 0.03);
    }

    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(active ? settings.trebleBoostDb : 0, now, 0.03);
    }

    if (this.compressor) {
      if (active && settings.volumeLeveler) {
        this.compressor.threshold.setTargetAtTime(-15, now, 0.05);
        this.compressor.ratio.setTargetAtTime(2.1, now, 0.05);
      } else {
        // Effectively transparent bypass
        this.compressor.threshold.setTargetAtTime(0, now, 0.05);
        this.compressor.ratio.setTargetAtTime(1, now, 0.05);
      }
    }
  }

  getFrequencyLevels(barCount = 20): number[] {
    if (!this.analyser || !this.dspConnected || this.ctx?.state !== 'running') {
      return new Array(barCount).fill(0);
    }
    if (!this.frequencyData || this.frequencyData.length !== this.analyser.frequencyBinCount) {
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    const data = this.frequencyData;
    this.analyser.getByteFrequencyData(data);
    const usableBins = Math.min(data.length, 48);
    const levels: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const start = Math.floor((i / barCount) * usableBins);
      const end = Math.max(start + 1, Math.floor(((i + 1) / barCount) * usableBins));
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += data[j] ?? 0;
      }
      levels.push(sum / ((end - start) * 255));
    }
    return levels;
  }

  setVolume(volume01: number): void {
    if (!Number.isFinite(volume01)) return;
    this.baseVolume = Math.max(0, Math.min(1, volume01));
    if (this.fadeFrameId !== null) {
      cancelAnimationFrame(this.fadeFrameId);
      this.fadeFrameId = null;
    }
    this.audioEl.volume = this.baseVolume;
  }

  /**
   * Smooth volume fade for crossfade / sleep timer fade-out.
   * Never used for Kur'an-ı Kerim unless sleep timer expires.
   */
  fadeVolume(from01: number, to01: number, durationMs: number): void {
    if (this.fadeFrameId !== null) {
      cancelAnimationFrame(this.fadeFrameId);
      this.fadeFrameId = null;
    }
    const start = Math.max(0, Math.min(1, from01));
    const end = Math.max(0, Math.min(1, to01));
    if (durationMs <= 30) {
      this.audioEl.volume = end;
      return;
    }
    const startTime = performance.now();
    this.audioEl.volume = start;
    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      this.audioEl.volume = start + (end - start) * progress;
      if (progress < 1) {
        this.fadeFrameId = requestAnimationFrame(step);
      } else {
        this.fadeFrameId = null;
      }
    };
    this.fadeFrameId = requestAnimationFrame(step);
  }

  /**
   * Status of the high-pass filter.
   */
  get isHighPassActive(): boolean {
    return Boolean(this.highPassFilter && this.dspConnected);
  }

  /**
   * Returns honest, real-time audio engine diagnostics for the Audio Settings screen.
   */
  getDspTelemetry(): {
    dspActive: boolean;
    sampleRate: number;
    highPassHz: number;
    antiHissHz: number;
    limiterThresholdDb: number;
    bufferedAheadSec: number;
  } {
    return {
      dspActive: this.isDspActive,
      sampleRate: this.ctx?.sampleRate ?? 48000,
      highPassHz: this.highPassFilter?.frequency.value ?? 28,
      antiHissHz: 18200,
      limiterThresholdDb: this.limiter?.threshold.value ?? -2,
      bufferedAheadSec: Math.round(this.getBufferedAheadSeconds() * 10) / 10,
    };
  }

  /**
   * Adjusts the high-pass filter cutoff frequency (default 28 Hz).
   * Eliminates sub-audible DC rumble, turntable motor noise, and 50Hz/60Hz AC electrical hum harmonics.
   */
  setHighPassCutoff(frequencyHz: number): void {
    if (this.highPassFilter && this.ctx) {
      const clamped = Math.max(10, Math.min(80, frequencyHz));
      this.highPassFilter.frequency.setTargetAtTime(clamped, this.ctx.currentTime, 0.04);
    }
  }

  /**
   * Registers a listener to react to buffer refill state changes (buffering true/false).
   */
  setBufferingListener(listener: ((buffering: boolean) => void) | null): void {
    this.onBufferingChange = listener;
  }

  /**
   * Calculates how many seconds of audio are currently buffered ahead of the playback position.
   */
  getBufferedAheadSeconds(): number {
    const cur = this.audioEl.currentTime;
    const buffered = this.audioEl.buffered;
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      if (start <= cur + 0.15 && cur <= end) {
        return Math.max(0, end - cur);
      }
    }
    return 0;
  }

  /**
   * Pre-fills the audio buffer ahead of starting playback to prevent initial stuttering.
   */
  async waitForBufferRefill(targetSeconds = 1.8, maxTimeoutMs = 4000): Promise<boolean> {
    if (!this.audioEl.src || this.audioEl.src.startsWith('blob:')) {
      return true; // Local / offline blobs are already complete
    }

    const duration = Number.isFinite(this.audioEl.duration) ? this.audioEl.duration : 0;
    const cur = this.audioEl.currentTime;
    const remaining = duration > cur ? duration - cur : 10;
    const requiredBuffer = Math.min(targetSeconds, remaining);

    if (this.getBufferedAheadSeconds() >= requiredBuffer) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      let settled = false;

      const cleanup = () => {
        if (timeoutId) window.clearTimeout(timeoutId);
        if (checkInterval) window.clearInterval(checkInterval);
        this.audioEl.removeEventListener('canplaythrough', onCanPlayThrough);
        this.audioEl.removeEventListener('progress', onProgress);
      };

      const finish = (ok: boolean) => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(ok);
        }
      };

      const onCanPlayThrough = () => finish(true);
      const onProgress = () => {
        if (this.getBufferedAheadSeconds() >= requiredBuffer) {
          finish(true);
        }
      };

      const checkInterval = window.setInterval(() => {
        if (this.getBufferedAheadSeconds() >= requiredBuffer) {
          finish(true);
        }
      }, 100);

      this.audioEl.addEventListener('canplaythrough', onCanPlayThrough);
      this.audioEl.addEventListener('progress', onProgress);

      const timeoutId = window.setTimeout(() => {
        finish(this.getBufferedAheadSeconds() > 0.4 || this.audioEl.readyState >= 2);
      }, maxTimeoutMs);
    });
  }

  /**
   * Intelligent buffer re-filling logic:
   * When network lag causes playback to stall ('waiting' or 'stalled'),
   * this pauses audio output temporarily to accumulate a safe buffer cushion (target 2.5s),
   * preventing audio hardware crackle and stutter, then smoothly resumes playback.
   */
  handlePlaybackStall(targetBufferSeconds = 2.5): void {
    if (this.rebuffering || this.audioEl.paused || this.audioEl.ended || this.audioEl.seeking) return;
    if (!this.audioEl.src || this.audioEl.src.startsWith('blob:')) return;

    this.rebuffering = true;
    this.onBufferingChange?.(true);

    const wasPlaying = !this.audioEl.paused;
    if (wasPlaying) {
      this.audioEl.pause();
    }

    const startTime = Date.now();
    const duration = Number.isFinite(this.audioEl.duration) ? this.audioEl.duration : 0;
    const cur = this.audioEl.currentTime;
    const remaining = duration > cur ? duration - cur : 10;
    const requiredBuffer = Math.min(targetBufferSeconds, remaining);

    const checkRefill = () => {
      const ahead = this.getBufferedAheadSeconds();
      const elapsed = Date.now() - startTime;
      const isRefilled = ahead >= requiredBuffer || this.audioEl.readyState >= 4;

      if (isRefilled || elapsed >= 5000) {
        this.rebuffering = false;
        this.onBufferingChange?.(false);
        if (this.rebufferingTimer !== null) {
          window.clearTimeout(this.rebufferingTimer);
          this.rebufferingTimer = null;
        }

        if (wasPlaying) {
          void this.audioEl.play().catch(() => {});
        }
      } else {
        this.rebufferingTimer = window.setTimeout(checkRefill, 120);
      }
    };

    checkRefill();
  }
}

export const sharedAudioEngine = new AutoMusicAudioEngine();
