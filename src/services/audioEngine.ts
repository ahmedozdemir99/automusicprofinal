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
    description: 'Yol gürültüsünü dengeleyen derin bas ve net vokal',
    bandsDb: [3.5, 4, 2.5, 1, 0, 1, 2.5, 3, 2, 1.5],
    preampDb: 0,
    bassBoostDb: 3.5,
    trebleBoostDb: 1.5,
  },
  headphones: {
    label: 'Kulaklık',
    description: 'Geniş sahne ve dengeli üst frekans detayları',
    bandsDb: [2, 2.5, 1.5, 0.5, 0, 0.5, 1.5, 2.5, 3, 2.5],
    preampDb: 0,
    bassBoostDb: 1.5,
    trebleBoostDb: 2,
  },
  pop: {
    label: 'Pop',
    description: 'Parlak vokal ve enerjik alt-üst frekans dengesi',
    bandsDb: [-1, 1.5, 3.5, 4, 2, -0.5, -1, 1.5, 3, 3.5],
    preampDb: 0,
    bassBoostDb: 2,
    trebleBoostDb: 2,
  },
  rock: {
    label: 'Rock',
    description: 'Güçlü elektro gitar, tok davul ve canlı orta frekans',
    bandsDb: [4.5, 3.5, 2, 0.5, -1, 0.5, 2.5, 4, 4.5, 3.5],
    preampDb: -0.5,
    bassBoostDb: 3,
    trebleBoostDb: 2.5,
  },
  arabesk: {
    label: 'Arabesk',
    description: 'Sıcak yaylılar, derin bas ve duygulu vokal vurgusu',
    bandsDb: [3, 4, 3, 1.5, 1, 2.5, 3, 2, 1.5, 1],
    preampDb: -0.5,
    bassBoostDb: 3.5,
    trebleBoostDb: 1,
  },
  vocal: {
    label: 'Vokal',
    description: 'İnsan sesini öne çıkaran berrak orta frekans dengesi',
    bandsDb: [-2, -1, 0, 2, 4, 4.5, 3.5, 2, 1, 0],
    preampDb: 0,
    bassBoostDb: 0,
    trebleBoostDb: 1,
  },
  classic: {
    label: 'Klasik',
    description: 'Enstrümantal derinlik ve doğal salon tınısı',
    bandsDb: [3, 2.5, 1.5, 1, 0, 0, 1, 2, 3, 3.5],
    preampDb: 0,
    bassBoostDb: 1,
    trebleBoostDb: 1.5,
  },
  vocal_quran: {
    label: "Kur'an Tilaveti",
    description: 'Tilavet ve harf mahreçleri için kristal vokal netliği',
    bandsDb: [-2, -1, 0, 1.5, 3.5, 4, 3, 2, 1, 0],
    preampDb: 0,
    bassBoostDb: 0,
    trebleBoostDb: 1.5,
  },
  tasavvuf: {
    label: 'Tasavvuf',
    description: 'Ney, ud ve bendir için sıcak akustik denge',
    bandsDb: [1.5, 2.5, 2.5, 2, 1.5, 2, 1.5, 1, 2, 1.5],
    preampDb: 0,
    bassBoostDb: 1.5,
    trebleBoostDb: 1,
  },
  bass_boost: {
    label: 'Bas Güçlendirici',
    description: 'Alt frekanslarda güçlü ve tok vurgu',
    bandsDb: [6, 5.5, 4, 2, 0, 0, 0.5, 1, 1.5, 1],
    preampDb: -1.5,
    bassBoostDb: 6,
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
  private compressor: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dspSupported: boolean;
  private dspConnected = false;
  private lastAppliedSettings: EqualizerSettings | null = null;
  private baseVolume = 0.9;
  private fadeFrameId: number | null = null;

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
    if (this.dspConnected || this.isCorsSafeUrl(url)) {
      this.audioEl.crossOrigin = 'anonymous';
    } else {
      this.audioEl.removeAttribute('crossorigin');
    }
  }

  private buildAudioGraph(): boolean {
    if (this.dspConnected) return true;
    if (!this.dspSupported || !this.ctx) return false;

    try {
      this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);

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
        filter.Q.value = idx === 0 || idx === EQ_FREQUENCIES.length - 1 ? 0.85 : 1.4;
        filter.gain.value = 0;
        return filter;
      });

      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 10000;
      this.trebleFilter.gain.value = 0;

      // Volume leveler (gentle musical compression)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 24;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.008;
      this.compressor.release.value = 0.18;

      // Always-on brickwall anti-clipping safety limiter (-0.5 dB ceiling)
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -1.0;
      this.limiter.knee.value = 3;
      this.limiter.ratio.value = 16;
      this.limiter.attack.value = 0.002;
      this.limiter.release.value = 0.08;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      // Signal chain: Source -> Preamp -> Bass -> 10-Band EQ -> Treble -> Leveler -> Limiter -> Analyser -> Destination
      let node: AudioNode = this.sourceNode;
      node.connect(this.preampNode);
      node = this.preampNode;

      node.connect(this.bassFilter);
      node = this.bassFilter;

      for (const band of this.eqFilters) {
        node.connect(band);
        node = band;
      }

      node.connect(this.trebleFilter);
      this.trebleFilter.connect(this.compressor);
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
        this.ctx = new AudioCtx();
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

    // Auto-headroom compensation when user boosts heavily so distortion/clipping is prevented
    const maxBandBoost = active ? Math.max(0, ...settings.bandsDb, settings.bassBoostDb) : 0;
    const autoHeadroomDb = active && maxBandBoost > 4 ? -(maxBandBoost - 4) * 0.35 : 0;
    const totalPreampDb = active ? Math.max(-12, Math.min(10, settings.preampDb + autoHeadroomDb)) : 0;

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
        this.compressor.threshold.setTargetAtTime(-18, now, 0.05);
        this.compressor.ratio.setTargetAtTime(3.2, now, 0.05);
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
    const data = new Uint8Array(this.analyser.frequencyBinCount);
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
}

export const sharedAudioEngine = new AutoMusicAudioEngine();
