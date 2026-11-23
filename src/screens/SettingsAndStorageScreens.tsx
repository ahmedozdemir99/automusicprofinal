import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  Download,
  HardDrive,
  Headphones,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { TrackRow } from '../components/TrackRow';
import { useAutoMusic } from '../context/AutoMusicContext';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../services/audioEngine';
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

      {/* Exact Default Smart One-Time Download Controls */}
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

        {/* Manual Explicit Clear (Never automatic!) */}
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
// Screen 16: Ses Ayarları & Canlı 5-Bant Ekolayzır
// ============================================================
export const AudioSettingsScreen: React.FC = () => {
  const { eqSettings, isEqSupported, updateEqSettings, applyEqPreset, setEqBand, goBack } = useAutoMusic();

  const presetKeys: EqPresetId[] = ['flat', 'car', 'headphones', 'bass_boost', 'vocal_quran', 'tasavvuf'];

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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Ses Ayarları ve Ekolayzır</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            Canlı Web Audio DSP motoru · MP3, AAC, FLAC, OGG ve WAV destekli
          </p>
        </div>

        <label className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#141418] border border-white/10 cursor-pointer">
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

      {!isEqSupported && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-sm text-amber-200">
          Bu cihazda veya tarayıcıda donanım ses efektleri desteklenmiyor; oynatma güvenli şekilde ham ses çıkışıyla devam eder.
        </div>
      )}

      {/* Ready Audio Profiles (Car, Headphones, Quran Vocal, Tasavvuf...) */}
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

      {/* 5-Band Parametric Equalizer + Bass & Treble */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-8">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 justify-items-center">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const val = eqSettings.bandsDb[idx];
            return (
              <div key={freq} className="flex flex-col items-center gap-3">
                <span className="text-xs font-mono tabular-nums text-[#D4AF37]">
                  {val > 0 ? `+${val}` : val} dB
                </span>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={val}
                  disabled={!eqSettings.enabled || !isEqSupported}
                  onChange={(e) => setEqBand(idx, Number(e.target.value))}
                  aria-label={`${freq} Hz bandı`}
                  className="eq-slider"
                />
                <span className="text-xs font-mono tabular-nums text-[#9B978E]">
                  {freq >= 1000 ? `${freq / 1000} kHz` : `${freq} Hz`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/[0.06]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#F5F2EB]">Bas Güçlendirme (80 Hz)</span>
              <span className="font-mono tabular-nums text-[#D4AF37]">+{eqSettings.bassBoostDb} dB</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
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
              step={1}
              value={eqSettings.trebleBoostDb}
              disabled={!eqSettings.enabled || !isEqSupported}
              onChange={(e) => updateEqSettings({ trebleBoostDb: Number(e.target.value), preset: 'custom' })}
              className="gold-slider w-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================================
// Screen 17: Genel Ayarlar
// ============================================================
export const GeneralSettingsScreen: React.FC = () => {
  const {
    providerStatus,
    downloads,
    storageEstimate,
    eqSettings,
    navigate,
    setCarMode,
  } = useAutoMusic();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Ayarlar</h1>
        <p className="text-sm text-[#9B978E] mt-1">
          Ses kalitesi, akıllı tek seferlik indirme, depolama, Araba Modu ve uygulama kurulumu
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
          <p className="text-base font-semibold text-[#F5F2EB]">Ses Ayarları ve Ekolayzır</p>
          <p className="text-xs text-[#9B978E]">
            Aktif profil: {EQ_PRESETS[eqSettings.preset].label} · Bas &amp; Tiz · Araba ve Kulaklık profilleri
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
          <p className="text-base font-semibold text-[#F5F2EB]">Android Auto Araba Modunu Aç</p>
          <p className="text-xs text-[#9B978E]">
            Sürüş güvenliğine uygun büyük dokunmatik şablon ve direksiyon medya kumandaları
          </p>
        </button>

        <PWAInstallButton variant="card" />
      </div>

      {/* Transparent Catalog Provider Status (Rule 12: No hardcoded API keys, clear status) */}
      <section className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-base font-semibold text-[#F5F2EB]">İçerik Kaynakları ve Lisans Politikası</h2>
        </div>

        <div className="divide-y divide-white/[0.06] text-sm">
          <ProviderRow
            name="AutoMusic Pro Kategori & Liste Veritabanı (SQLite)"
            detail="17 kategoriye özel hazır Türkçe ve Arapça çalma listeleri"
            connected={providerStatus.databaseConnected}
          />
          <ProviderRow
            name="Kur'an-ı Kerim Açık Tilavet ve Diyanet Meali"
            detail="MP3Quran, EveryAyah ve AlQuran Cloud (114 Sure, 6 Kari)"
            connected={providerStatus.quranApiConnected}
          />
          <ProviderRow
            name="Internet Archive Açık Lisanslı Ses Arşivi"
            detail="Creative Commons ve Kamu Malı açık ses kayıtları"
            connected={providerStatus.internetArchiveConnected}
          />
          <ProviderRow
            name="Jamendo Lisanslı Müzik Kataloğu"
            detail="Sunucu ortam değişkeni (JAMENDO_CLIENT_ID) ile bağlanır"
            connected={providerStatus.jamendoConfigured}
          />
          <ProviderRow
            name="Yerel Cihaz Ses Dosyaları (MP3 / AAC / FLAC)"
            detail="Kullanıcının kendi eklediği dosyalar uygulama arşivinde saklanır"
            connected={providerStatus.localArchiveReady}
          />
        </div>

        <p className="text-xs text-[#8C887F] leading-relaxed pt-2">
          DRM korumalı servislerden (Spotify, YouTube vb.) izinsiz indirme veya akış dönüştürme uygulanmaz. API anahtarları kaynak koda sabit yazılmaz.
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
      {connected ? 'Bağlı' : 'Bağlanmadı'}
    </span>
  </div>
);
