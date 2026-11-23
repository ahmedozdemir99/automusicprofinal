import { EqPresetId, EqualizerSettings } from '../types/media';

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000] as const;

export const EQ_PRESETS: Record<
  EqPresetId,
  { label: string; description: string; bandsDb: [number, number, number, number, number]; bassBoostDb: number; trebleBoostDb: number }
> = {
  flat: {
    label: 'Düz (Stüdyo)',
    description: 'Doğal, işlenmemiş referans ses çıkışı',
    bandsDb: [0, 0, 0, 0, 0],
    bassBoostDb: 0,
    trebleBoostDb: 0,
  },
  car: {
    label: 'Araba Profili',
    description: 'Yol gürültüsünü dengeleyen derin bas ve net vokal',
    bandsDb: [4, 2, 1, 3, 2],
    bassBoostDb: 5,
    trebleBoostDb: 2,
  },
  headphones: {
    label: 'Kulaklık Profili',
    description: 'Geniş sahne ve dengeli üst frekans detayları',
    bandsDb: [2, 1, 0, 2, 3],
    bassBoostDb: 2,
    trebleBoostDb: 2,
  },
  bass_boost: {
    label: 'Bas Güçlendirici',
    description: 'Alt frekanslarda güçlü ve tok vurgu',
    bandsDb: [6, 4, 0, 1, 1],
    bassBoostDb: 8,
    trebleBoostDb: 0,
  },
  vocal_quran: {
    label: "Vokal / Kur'an",
    description: 'Tilavet ve insan sesi için kristal netlik',
    bandsDb: [-1, 1, 4, 3, 1],
    bassBoostDb: 0,
    trebleBoostDb: 2,
  },
  tasavvuf: {
    label: 'Tasavvuf Akustik',
    description: 'Ney, ud ve bendir için sıcak akustik denge',
    bandsDb: [2, 3, 2, 1, 2],
    bassBoostDb: 2,
    trebleBoostDb: 1,
  },
  custom: {
    label: 'Özel Ayar',
    description: 'Kullanıcı tanımlı ekolayzır eğrisi',
    bandsDb: [0, 0, 0, 0, 0],
    bassBoostDb: 0,
    trebleBoostDb: 0,
  },
};

export class AutoMusicAudioEngine {
  private audioEl: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  // Keep native audio output: Android WebView can report playback while a suspended WebAudio graph is silent.
  private dspSupported = false;
  private dspConnected = false;

  constructor() {
    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.preload = 'metadata';
  }

  get element(): HTMLAudioElement {
    return this.audioEl;
  }

  get isDspSupported(): boolean {
    return this.dspSupported;
  }

  private ensureAudioContext(): void {
    if (this.dspConnected || !this.dspSupported) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        this.dspSupported = false;
        return;
      }
      this.ctx = new AudioCtx();
      this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);

      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 80;
      this.bassFilter.gain.value = 0;

      this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = idx === 0 ? 'lowshelf' : idx === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.1;
        filter.gain.value = 0;
        return filter;
      });

      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 10000;
      this.trebleFilter.gain.value = 0;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.82;

      let chain: AudioNode = this.sourceNode;
      chain.connect(this.bassFilter);
      chain = this.bassFilter;

      for (const band of this.eqFilters) {
        chain.connect(band);
        chain = band;
      }

      chain.connect(this.trebleFilter);
      this.trebleFilter.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.dspConnected = true;
    } catch {
      this.dspSupported = false;
    }
  }

  async resumeContext(): Promise<void> {
    this.ensureAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Ignore autoplay restriction until user gesture
      }
    }
  }

  applyEqualizer(settings: EqualizerSettings): void {
    if (!this.dspConnected || !this.ctx) return;
    const now = this.ctx.currentTime;
    const active = settings.enabled;
    this.eqFilters.forEach((filter, idx) => {
      const targetGain = active ? settings.bandsDb[idx] ?? 0 : 0;
      filter.gain.setTargetAtTime(targetGain, now, 0.04);
    });
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(active ? settings.bassBoostDb : 0, now, 0.04);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(active ? settings.trebleBoostDb : 0, now, 0.04);
    }
  }

  getFrequencyLevels(barCount = 16): number[] {
    if (!this.analyser) return new Array(barCount).fill(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const step = Math.max(1, Math.floor(data.length / barCount));
    const levels: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const val = data[Math.min(data.length - 1, i * step)] ?? 0;
      levels.push(val / 255);
    }
    return levels;
  }

  setVolume(volume01: number): void {
    this.audioEl.volume = Math.max(0, Math.min(1, volume01));
  }
}

export const sharedAudioEngine = new AutoMusicAudioEngine();
