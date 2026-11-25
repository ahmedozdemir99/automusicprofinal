import React, { useEffect, useRef, useState } from 'react';
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  Download,
  HardDrive,
  Headphones,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  Waves,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { TrackRow } from '../components/TrackRow';
import { useAutoMusic } from '../context/AutoMusicContext';
import { EQ_FREQ_LABELS, EQ_FREQUENCIES, EQ_PRESETS, sharedAudioEngine } from '../services/audioEngine';
import { formatBytesGb } from '../services/offlineDb';
import { EqPresetId } from '../types/media';

// ============================================================
// Screen 14: İndirilenler
// ============================================================
export const DownloadsScreen: React.FC = () => {
  const {
    downloads,
    downloadProgressMap,
    storageEstimate,
    playQueue,
    removeDownload,
    navigate,
  } = useAutoMusic();

  const activeList = Object.values(downloadProgressMap);
  const downloadedItems = downloads.map((d) => d.item);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">İndirilenler (Çevrimdışı Arşiv)</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            {downloads.length} kayıt · {formatBytesGb(storageEstimate.archiveUsedBytes)} · İnternet yokken doğrudan oynatılır
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
          <button
            type="button"
            disabled={downloadedItems.length === 0}
            onClick={() => void playQueue(downloadedItems, false)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-[#09090B] text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            Çevrimdışı Oynat
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'storage' })}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-white/10 text-xs font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
          >
            <HardDrive className="w-4 h-4 text-[#D4AF37] shrink-0" />
            Depolama Yönetimi
          </button>
        </div>
      </div>

      {/* Active Downloads Progress */}
      {activeList.length > 0 && (
        <section className="p-4 rounded-2xl bg-[#161510] border border-[#D4AF37]/30 space-y-3">
          <h2 className="text-sm font-semibold text-[#E5C158]">Devam Eden İndirmeler</h2>
          {activeList.map((dl) => (
            <div key={dl.contentId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F5F2EB] truncate">{dl.title}</span>
                <span className="font-mono tabular-nums text-[#D4AF37]">
                  {dl.status === 'error' || dl.status === 'paused_low_storage'
                    ? dl.errorMessage
                    : `%${dl.progress}`}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${dl.progress}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Saved Offline Archive List */}
      <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
        {downloads.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Download className="w-6 h-6 text-[#D4AF37] mx-auto" />
            <p className="text-sm font-medium text-[#F5F2EB]">Uygulama arşivinizde henüz indirilen kayıt yok.</p>
            <p className="text-xs text-[#9B978E] max-w-md mx-auto">
              Akıllı tek seferlik indirme açıkken bir sureye veya izinli müzik kaydına dokunduğunuzda arka planda otomatik olarak arşivinize kaydedilir.
            </p>
          </div>
        ) : (
          downloads.map((rec, idx) => (
            <TrackRow
              key={rec.contentId}
              item={rec.item}
              index={idx}
              queueContext={downloadedItems}
              rightExtra={
                <div className="flex items-center gap-2 ml-2">
                  <span className="hidden sm:inline text-[11px] font-mono tabular-nums text-[#8C887F]">
                    {formatBytesGb(rec.sizeBytes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeDownload(rec.contentId)}
                    title="Kullanıcı izniyle arşivden sil"
                    aria-label={`${rec.item.title} kaydını sil`}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#8C887F] hover:text-red-400 hover:bg-white/[0.05]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// Screen 15: Depolama Yönetimi & Akıllı Tek Seferlik İndirme Ayarları
// ============================================================
export const StorageManagementScreen: React.FC = () => {
  const {
    downloadSettings,
    updateDownloadSettings,
    downloads,
    storageEstimate,
    clearAllDownloads,
    completeMissingDownloads,
    goBack,
  } = useAutoMusic();

  const [confirmClear, setConfirmClear] = useState(false);
  const archiveGb = (storageEstimate.archiveUsedBytes / 1024 ** 3).toFixed(3);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB]"
      >
        <ChevronLeft className="w-4 h-4" />
        Geri
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Depolama Yönetimi ve Akıllı İndirme</h1>
        <p className="text-sm text-[#9B978E] mt-1">
          Yalnızca lisansı indirmeye izin veren içerikler uygulama arşivine tek seferlik kaydedilir. Kullanıcının izni olmadan hiçbir kayıt silinmez.
        </p>
      </div>

      {/* Storage Metrics in GB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.07]">
          <p className="text-xs text-[#9B978E]">Uygulama Arşivi Kullanımı</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#D4AF37] mt-1.5">
            {archiveGb} GB
          </p>
          <p className="text-xs text-[#7C7970] mt-1">{downloads.length} benzersiz ses dosyası</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.07]">
          <p className="text-xs text-[#9B978E]">Tahmini Boş Depolama Alanı</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#F5F2EB] mt-1.5">
            {storageEstimate.estimatedFreeGb !== null
              ? `${storageEstimate.estimatedFreeGb.toFixed(2)} GB`
              : 'Ölçülüyor'}
          </p>
          <p className="text-xs text-[#7C7970] mt-1">
            2 GB güvenlik eşiği: {storageEstimate.isBelowTwoGbThreshold ? 'İndirme durduruldu' : 'Uygun'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.07]">
          <p className="text-xs text-[#9B978E]">Kullanıcı Depolama Kotası</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#F5F2EB] mt-1.5">
            {downloadSettings.userQuotaGb === null ? 'YOK' : `${downloadSettings.userQuotaGb} GB`}
          </p>
          <p className="text-xs text-[#7C7970] mt-1">Konum: Uygulama özel arşivi</p>
        </div>
      </div>

      {/* Smart One-Time Download Controls */}
      <section className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-5">
        <h2 className="text-lg font-semibold text-[#F5F2EB]">Akıllı Tek Seferlik İndirme Kuralları</h2>

        <div className="divide-y divide-white/[0.06]">
          <ToggleRow
            label="Otomatik kayıt (Oynatırken arka planda indir)"
            description="İzinli içerikler çalınmaya başladığında otomatik olarak uygulama arşivine kaydedilir."
            checked={downloadSettings.autoSaveOnPlay}
            onChange={(v) => updateDownloadSettings({ autoSaveOnPlay: v })}
          />
          <ToggleRow
            label="Yalnızca Wi-Fi üzerinden indir"
            description="Varsayılan olarak kapalıdır; açıldığında mobil veriyle indirme duraklatılır."
            checked={downloadSettings.wifiOnly}
            onChange={(v) => updateDownloadSettings({ wifiOnly: v })}
          />
          <ToggleRow
            label="Mobil veriyle indirme"
            description="Yoldayken ve araç içinde mobil ağ üzerinden çevrimdışı arşive kaydetmeye izin verir."
            checked={downloadSettings.allowMobileData}
            onChange={(v) => updateDownloadSettings({ allowMobileData: v })}
          />
          <ToggleRow
            label="Aynı dosyayı tekrar indirme engeli"
            description="Her dosya benzersiz içerik kimliği (contentId) ile tutulur; kayıtlı dosya ikinci kez indirilmez."
            checked={downloadSettings.preventDuplicateDownload}
            onChange={(v) => updateDownloadSettings({ preventDuplicateDownload: v })}
          />
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#F5F2EB]">Tercih Edilen Ses Kalitesi</p>
            <p className="text-xs text-[#9B978E]">
              320 kbps yalnızca kaynak sağladığında kullanılır; düşük kaliteli ses yapay olarak yükseltilmez.
            </p>
          </div>
          <select
            value={downloadSettings.preferredBitrateKbps}
            onChange={(e) =>
              updateDownloadSettings({
                preferredBitrateKbps: Number(e.target.value) as 128 | 192 | 256 | 320,
              })
            }
            aria-label="Tercih edilen ses kalitesi"
            className="px-4 py-2.5 rounded-xl bg-[#09090B] border border-white/15 text-sm font-mono text-[#D4AF37]"
          >
            <option value={320}>320 kbps (Öncelikli)</option>
            <option value={256}>256 kbps</option>
            <option value={192}>192 kbps</option>
            <option value={128}>128 kbps</option>
          </select>
        </div>

        {/* Missing / Failed download auto completion */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#F5F2EB]">Eksik ve İnmeyen Dosyalar</p>
            <p className="text-xs text-[#9B978E] mt-0.5">
              İndirilemeyen veya yarım kalan tüm favori, sure ve liste kayıtlarını otomatik olarak tekrar dener ve tamamlar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void completeMissingDownloads()}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4 shrink-0" />
            Eksik/İnmeyen Dosyaları Otomatik Tamamla
          </button>
        </div>

        {/* Manual Explicit Clear */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#9B978E]">
            Kayıtlar siz onay vermeden asla otomatik silinmez.
          </div>
          {!confirmClear ? (
            <button
              type="button"
              disabled={downloads.length === 0}
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/70 disabled:opacity-40 border border-red-500/30 text-xs font-medium text-red-200 transition-colors"
            >
              Arşivi Manuel Temizle
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await clearAllDownloads();
                  setConfirmClear(false);
                }}
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Evet, Tüm Kayıtları Sil
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-[#F5F2EB] transition-colors"
              >
                Vazgeç
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// ============================================================
// Screen 16: Ses Ayarları & Profesyonel 10-Bant Web Audio DSP Ekolayzır
// ============================================================
export const AudioSettingsScreen: React.FC = () => {
  const {
    eqSettings,
    isEqSupported,
    isPlaying,
    updateEqSettings,
    applyEqPreset,
    setEqBand,
    saveCustomEqProfile,
    deleteCustomEqProfile,
    applyCustomEqProfile,
    goBack,
  } = useAutoMusic();

  const [newProfileName, setNewProfileName] = useState('');
  const spectrumRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    const draw = () => {
      const canvas = spectrumRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          const levels = isPlaying ? sharedAudioEngine.getFrequencyLevels(32) : new Array(32).fill(0.04);
          const gap = 3;
          const barW = Math.max(3, (w - gap * (levels.length - 1)) / levels.length);
          levels.forEach((lvl, i) => {
            const barH = Math.max(4, Math.min(h - 2, lvl * h * 0.96));
            const x = i * (barW + gap);
            const y = h - barH;
            ctx.fillStyle = lvl > 0.6 ? '#E5C158' : eqSettings.enabled ? 'rgba(212, 175, 55, 0.58)' : 'rgba(155, 151, 142, 0.35)';
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, 2);
            ctx.fill();
          });
        }
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [eqSettings.enabled, isPlaying]);

  const presetKeys: EqPresetId[] = [
    'flat',
    'car',
    'headphones',
    'pop',
    'rock',
    'arabesk',
    'vocal',
    'classic',
    'vocal_quran',
    'tasavvuf',
    'bass_boost',
  ];

  const customProfiles = eqSettings.customProfiles ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB]"
      >
        <ChevronLeft className="w-4 h-4" />
        Geri
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Profesyonel 10-Bant Ekolayzır &amp; DSP</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            Gerçek zamanlı Web Audio API DSP motoru · Preamp · Clipping önleyici sınırlayıcı · Canlı spektrum
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => applyEqPreset('flat')}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#141418] hover:bg-[#1E1E24] border border-white/10 text-xs font-medium text-[#C8C5BC]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
            Sıfırla
          </button>

          <label className="inline-flex items-center gap-2.5 h-10 px-4 rounded-xl bg-[#141418] border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={eqSettings.enabled}
              disabled={!isEqSupported}
              onChange={(e) => updateEqSettings({ enabled: e.target.checked })}
              className="w-4 h-4 accent-[#D4AF37]"
            />
            <span className="text-sm font-medium text-[#F5F2EB]">Ekolayzır Aktif</span>
          </label>
        </div>
      </div>

      {!isEqSupported && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-sm text-amber-200">
          Bu tarayıcıda Web Audio DSP desteklenmiyor; oynatma kesintisiz olarak doğal donanım ses çıkışıyla devam eder.
        </div>
      )}

      {/* Live Real-Time Spectrum Analyzer + 10-Band Parametric Sliders */}
      <section className="p-5 sm:p-7 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#D4AF37]">Gerçek Zamanlı Spektrum Analizörü</p>
            <p className="text-[11px] text-[#8C887F]">
              {eqSettings.enabled
                ? `Aktif profil: ${EQ_PRESETS[eqSettings.preset]?.label ?? 'Özel'} · Clipping Koruması Açık`
                : 'Ekolayzır devre dışı — doğal düz ses çıkışı'}
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#8C887F]">31 Hz — 16 kHz</span>
        </div>

        <canvas
          ref={spectrumRef}
          width={640}
          height={64}
          className="w-full h-16 rounded-xl bg-[#09090B] border border-white/[0.06] px-2 py-1"
          aria-hidden="true"
        />

        {/* 10-Band Graphic Equalizer */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-10 gap-2 min-w-[560px] justify-items-center">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const val = eqSettings.bandsDb[idx] ?? 0;
              return (
                <div key={freq} className="flex flex-col items-center gap-2.5">
                  <span className="text-[11px] font-mono tabular-nums text-[#D4AF37]">
                    {val > 0 ? `+${val}` : val}
                  </span>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={val}
                    disabled={!eqSettings.enabled || !isEqSupported}
                    onChange={(e) => setEqBand(idx, Number(e.target.value))}
                    aria-label={`${freq} Hz bandı`}
                    className="eq-slider"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-[#9B978E]">
                    {EQ_FREQ_LABELS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preamp, Bass Boost, Treble & Crossfade Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-white/[0.06]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#F5F2EB]">Preamp (Ön Yükseltme)</span>
              <span className="font-mono tabular-nums text-[#D4AF37]">
                {eqSettings.preampDb > 0 ? `+${eqSettings.preampDb}` : eqSettings.preampDb} dB
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={eqSettings.preampDb}
              disabled={!eqSettings.enabled || !isEqSupported}
              onChange={(e) => updateEqSettings({ preampDb: Number(e.target.value), preset: 'custom' })}
              className="gold-slider w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#F5F2EB]">Bas Güçlendirme (80 Hz)</span>
              <span className="font-mono tabular-nums text-[#D4AF37]">+{eqSettings.bassBoostDb} dB</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={eqSettings.bassBoostDb}
              disabled={!eqSettings.enabled || !isEqSupported}
              onChange={(e) => updateEqSettings({ bassBoostDb: Number(e.target.value), preset: 'custom' })}
              className="gold-slider w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#F5F2EB]">Tiz Parlaklığı (10 kHz)</span>
              <span className="font-mono tabular-nums text-[#D4AF37]">
                {eqSettings.trebleBoostDb > 0 ? `+${eqSettings.trebleBoostDb}` : eqSettings.trebleBoostDb} dB
              </span>
            </div>
            <input
              type="range"
              min={-6}
              max={12}
              step={0.5}
              value={eqSettings.trebleBoostDb}
              disabled={!eqSettings.enabled || !isEqSupported}
              onChange={(e) => updateEqSettings({ trebleBoostDb: Number(e.target.value), preset: 'custom' })}
              className="gold-slider w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#F5F2EB]">Yumuşak Geçiş (Fade-in)</span>
              <span className="font-mono tabular-nums text-[#D4AF37]">
                {(eqSettings.crossfadeSec ?? 0) === 0 ? 'Kapalı' : `${eqSettings.crossfadeSec} sn`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={eqSettings.crossfadeSec ?? 0}
              onChange={(e) => updateEqSettings({ crossfadeSec: Number(e.target.value) })}
              className="gold-slider w-full"
            />
            <p className="text-[11px] text-[#7C7970]">Kur'an-ı Kerim tilavetinde geçiş efekti otomatik kapalı tutulur.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.06]">
          <ToggleRow
            label="Ses Seviyesi Dengeleme ve Distorsiyon Koruması"
            description="Yüksek bas/preamp ayarlarında ses patlamasını (clipping) önler ve parçalar arası ses yüksekliğini dengeler."
            checked={eqSettings.volumeLeveler}
            onChange={(v) => updateEqSettings({ volumeLeveler: v })}
          />
        </div>
      </section>

      {/* Real-time DSP Acoustic Filters & Flow Stability */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-4">
        <div className="flex items-center gap-2.5">
          <Waves className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h2 className="text-base font-semibold text-[#F5F2EB]">Dahili DSP Filtreleri ve Kesintisiz Akış Motoru</h2>
            <p className="text-xs text-[#9B978E]">
              Doğrudan Web Audio API donanım hızlandırmalı ses işleme hattına entegre koruyucular
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-[#0E0E12] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F5F2EB]">28 Hz Subsonik &amp; Uğultu (Hum) Filtresi</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                High-Pass Aktif
              </span>
            </div>
            <p className="text-xs text-[#9B978E]">
              Duyulamayan 28 Hz altı alt-frekans titreşimlerini, mikrofon dip gürültülerini ve 50/60 Hz şebeke uğultusunu temizler; bas seslerin netliğini korur.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E0E12] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F5F2EB]">Akıllı Tampon Yenileme (Buffer Cushion)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                2.5s Güvenlik Payı
              </span>
            </div>
            <p className="text-xs text-[#9B978E]">
              Ağ dalgalanmalarında parçanın anlık takılmasını ve çıtırtısını engeller. 2.5 saniyelik güvenli tampon dolumu tamamlanana kadar oynatmayı yumuşakça korur.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E0E12] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F5F2EB]">18 kHz Anti-Hiss Filtresi</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Low-Pass Aktif
              </span>
            </div>
            <p className="text-xs text-[#9B978E]">
              MP3 kodlamasından kaynaklı yüksek frekanslı dijital hışırtıları ve yapay parazitleri sese zarar vermeden şeffafça süzer.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E0E12] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F5F2EB]">Brickwall Anti-Clipping Sınırlayıcı</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                -0.4 dB Tavan
              </span>
            </div>
            <p className="text-xs text-[#9B978E]">
              Yüksek bas ve preamp kullanımlarında sinyalin 0 dB&apos;yi aşarak hoparlörde veya kulaklıkta patlama/çatlama yapmasını matematiksel olarak engeller.
            </p>
          </div>
        </div>
      </section>

      {/* Ready Audio Profiles */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[#F5F2EB]">Hazır Ses Profilleri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presetKeys.map((key) => {
            const p = EQ_PRESETS[key];
            const active = eqSettings.preset === key && eqSettings.enabled;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyEqPreset(key)}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  active
                    ? 'bg-[#1D190F] border-[#D4AF37]'
                    : 'bg-[#121216] border-white/[0.07] hover:border-[#D4AF37]/35'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#F5F2EB]">{p.label}</span>
                  {key === 'car' && <Car className="w-4 h-4 text-[#D4AF37]" />}
                  {key === 'headphones' && <Headphones className="w-4 h-4 text-[#D4AF37]" />}
                </div>
                <p className="text-xs text-[#9B978E] mt-1">{p.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom User Saved EQ Profiles */}
      <section className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#F5F2EB]">Özel Ekolayzır Profillerim</h2>
          <p className="text-xs text-[#9B978E] mt-0.5">
            Mevcut 10 bant, preamp ve bas/tiz ayarlarınızı kendi profil adınızla kaydedin.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newProfileName.trim()) return;
            saveCustomEqProfile(newProfileName);
            setNewProfileName('');
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="Profil adı (ör. Gece Sürüşü, Bluetooth Hoparlör)"
            maxLength={40}
            className="flex-1 h-11 px-4 rounded-xl bg-[#09090B] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newProfileName.trim()}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-[#09090B] text-xs font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Profili Kaydet
          </button>
        </form>

        {customProfiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {customProfiles.map((prof) => (
              <div
                key={prof.id}
                className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-[#17171D] border border-white/[0.07]"
              >
                <button
                  type="button"
                  onClick={() => applyCustomEqProfile(prof.id)}
                  className="text-left min-w-0 flex-1"
                >
                  <p className="text-sm font-semibold text-[#F5F2EB] truncate hover:text-[#E5C158]">{prof.name}</p>
                  <p className="text-[11px] font-mono text-[#8C887F]">
                    Preamp {prof.preampDb > 0 ? `+${prof.preampDb}` : prof.preampDb} dB · Bas +{prof.bassBoostDb} dB
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => deleteCustomEqProfile(prof.id)}
                  aria-label={`${prof.name} profilini sil`}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#8C887F] hover:text-red-400 hover:bg-white/[0.05]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// ============================================================
// Screen 17: Genel Ayarlar (with JSON Backup & Restore)
// ============================================================
export const GeneralSettingsScreen: React.FC = () => {
  const {
    providerStatus,
    downloads,
    storageEstimate,
    eqSettings,
    navigate,
    setCarMode,
    exportUserBackupJson,
    importUserBackupJson,
    showToast,
  } = useAutoMusic();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleExportBackup = () => {
    const json = exportUserBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automusic-pro4-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Kullanıcı verileri yedek dosyası olarak indirildi.');
  };

  const handleImportBackup = async (file: File) => {
    const text = await file.text();
    const res = importUserBackupJson(text);
    setBackupStatus(res.message);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Ayarlar</h1>
        <p className="text-sm text-[#9B978E] mt-1">
          10 bant ekolayzır, akıllı tek seferlik indirme, depolama, Araç Modu, veri yedeği ve PWA kurulumu
        </p>
      </div>

      {/* Navigation Cards to Settings Sub-Screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate({ name: 'audio_settings' })}
          className="p-5 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.07] text-left space-y-2 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5 text-[#D4AF37]" />
          <p className="text-base font-semibold text-[#F5F2EB]">10-Bant Ekolayzır ve Ses Ayarları</p>
          <p className="text-xs text-[#9B978E]">
            Aktif profil: {EQ_PRESETS[eqSettings.preset]?.label ?? 'Özel'} · Preamp, Bas/Tiz ve Özel Profiller
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate({ name: 'storage' })}
          className="p-5 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.07] text-left space-y-2 transition-colors"
        >
          <HardDrive className="w-5 h-5 text-[#D4AF37]" />
          <p className="text-base font-semibold text-[#F5F2EB]">Depolama Yönetimi ve İndirme</p>
          <p className="text-xs text-[#9B978E]">
            {downloads.length} kayıt · {formatBytesGb(storageEstimate.archiveUsedBytes)} · 2 GB boş alan koruması
          </p>
        </button>

        <button
          type="button"
          onClick={() => setCarMode(true)}
          className="p-5 rounded-2xl bg-[#121216] hover:bg-[#19181F] border border-white/[0.07] text-left space-y-2 transition-colors"
        >
          <Car className="w-5 h-5 text-[#D4AF37]" />
          <p className="text-base font-semibold text-[#F5F2EB]">Araç Modunu Aç</p>
          <p className="text-xs text-[#9B978E]">
            Sürüşe uygun büyük dokunmatik arayüz, gece/gündüz teması ve Bluetooth medya tuşları
          </p>
        </button>

        <PWAInstallButton variant="card" />
      </div>

      {/* Backup & Restore User Data */}
      <section className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#F5F2EB]">Veri Yedekleme ve Geri Yükleme</h2>
            <p className="text-xs text-[#9B978E] mt-0.5">
              Favorileriniz, çalma listeleriniz, özel kategorileriniz ve ekolayzır profilleriniz yerel cihazınızda saklanır.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold"
            >
              <Save className="w-4 h-4" />
              Yedeği İndir (.json)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#18181F] hover:bg-[#23232C] border border-white/10 text-xs font-medium text-[#F5F2EB]"
            >
              <Upload className="w-4 h-4 text-[#D4AF37]" />
              Yedekten Yükle
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportBackup(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
        {backupStatus && <p className="text-xs text-[#E5C158]">{backupStatus}</p>}
      </section>

      {/* Transparent Catalog Provider Status */}
      <section className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-base font-semibold text-[#F5F2EB]">İçerik Kaynakları ve Lisans Politikası</h2>
        </div>

        <div className="divide-y divide-white/[0.06] text-sm">
          <ProviderRow
            name="AutoMusic Pro Kategori & Seçki Veritabanı"
            detail="18 kategoriye özel doğrulanmış Türkçe, Karadeniz, Fantezi ve Arapça seçkiler"
            connected={providerStatus.databaseConnected}
          />
          <ProviderRow
            name="Kur'an-ı Kerim Açık Tilavet ve Diyanet Meali"
            detail="MP3Quran, EveryAyah ve AlQuran Cloud (114 Sure, 6 Kâri)"
            connected={providerStatus.quranApiConnected}
          />
          <ProviderRow
            name="Internet Archive Açık Ses Arşivi"
            detail="Doğrulanmış tam uzunlukta açık arşiv kayıtları"
            connected={providerStatus.internetArchiveConnected}
          />
          <ProviderRow
            name="Audius Açık Müzik Ağı"
            detail="Ücretsiz, aboneliksiz tam uzunlukta bağımsız müzik akışı"
            connected={Boolean(providerStatus.audiusConnected)}
          />
          <ProviderRow
            name="Wikimedia Commons & MusicBrainz"
            detail="Açık ses kayıtları ve gerçek sanatçı/albüm/parça sıralaması veritabanı"
            connected={Boolean(providerStatus.wikimediaConnected)}
          />
          <ProviderRow
            name="Jamendo Lisanslı Müzik Kataloğu"
            detail="Sunucu ortam değişkeni (JAMENDO_CLIENT_ID) ile etkinleştirilir"
            connected={providerStatus.jamendoConfigured}
          />
          <ProviderRow
            name="Yerel Cihaz Ses Dosyaları (MP3 / AAC / FLAC)"
            detail="Kullanıcının kendi eklediği dosyalar çevrimdışı arşivde saklanır"
            connected={providerStatus.localArchiveReady}
          />
        </div>

        <p className="text-xs text-[#8C887F] leading-relaxed pt-2">
          DRM korumalı veya ücretli abonelik gerektiren servislerden izinsiz içerik çekilmez. Tüm ses bağlantıları yalnızca izinli açık kaynaklardan güvenli sunucu aktarımıyla sunulur.
        </p>
      </section>
    </div>
  );
};

// Reusable clean row primitives
const ToggleRow: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="py-4 flex items-center justify-between gap-4 cursor-pointer">
    <div className="space-y-0.5">
      <p className="text-sm font-medium text-[#F5F2EB]">{label}</p>
      <p className="text-xs text-[#9B978E]">{description}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 accent-[#D4AF37] shrink-0"
    />
  </label>
);

const ProviderRow: React.FC<{ name: string; detail: string; connected: boolean }> = ({
  name,
  detail,
  connected,
}) => (
  <div className="py-3 flex items-center justify-between gap-4">
    <div>
      <p className="font-medium text-[#F5F2EB]">{name}</p>
      <p className="text-xs text-[#9B978E] mt-0.5">{detail}</p>
    </div>
    <span className={`text-xs font-medium shrink-0 inline-flex items-center gap-1.5 ${connected ? 'text-[#D4AF37]' : 'text-[#8C887F]'}`}>
      {connected && <CheckCircle2 className="w-3.5 h-3.5" />}
      {connected ? 'Bağlı' : 'Hazır (Anahtar Bekliyor)'}
    </span>
  </div>
);
