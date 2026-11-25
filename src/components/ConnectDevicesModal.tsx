import React, { useEffect, useState } from 'react';
import {
  BatteryCharging,
  Bluetooth,
  BluetoothConnected,
  Car,
  Cast,
  Check,
  Copy,
  MonitorPlay,
  Radio,
  Share2,
  Smartphone,
  Speaker,
  Tv,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAutoMusic } from '../context/AutoMusicContext';
import { formatTvCode } from '../services/deviceCastService';

export const ConnectDevicesModal: React.FC = () => {
  const {
    connectModalTab,
    closeConnectModal,
    openConnectModal,
    enterTvReceiverMode,
    tvCastCode,
    tvCastConnected,
    tvReceiverCount,
    tvCastError,
    mutePhoneWhileCasting,
    setMutePhoneWhileCasting,
    isRemoteCastSupported,
    remotePlaybackState,
    connectToTvByCode,
    disconnectTvCast,
    triggerNativeGoogleCast,
    btConnected,
    btDeviceName,
    btBatteryLevel,
    btAutoCarMode,
    setBtAutoCarMode,
    btOutputLabel,
    btStatusMessage,
    isBluetoothBleSupported,
    isAudioOutputSupported,
    connectBluetoothCar,
    disconnectBluetoothCar,
    chooseCarAudioOutput,
    setCarMode,
    currentTrack,
  } = useAutoMusic();

  const [codeInput, setCodeInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (tvCastCode) {
      setCodeInput(tvCastCode);
    }
  }, [tvCastCode]);

  if (!connectModalTab) {
    return null;
  }

  const tvReceiverUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/?tv=1` : '/?tv=1';

  const handleCodeChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 6);
    setCodeInput(digits);
  };

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    connectToTvByCode(codeInput);
  };

  const handleCopyTvUrl = async () => {
    try {
      await navigator.clipboard.writeText(tvReceiverUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard blocked in some non-secure contexts
    }
  };

  const handleShareTvUrl = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'AutoMusic Pro · Google TV Ekranı',
          text: 'Google TV tarayıcısında açıp 6 haneli kodu telefonunuza girin:',
          url: tvReceiverUrl,
        });
      } catch {
        // User cancelled share sheet
      }
    } else {
      await handleCopyTvUrl();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cihaza Bağlan ve Paylaş"
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConnectModal();
      }}
    >
      <div className="w-full max-w-xl bg-[#121216] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh]">
        {/* Header */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
              {connectModalTab === 'tv' ? (
                <Tv className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Bluetooth className="w-4 h-4 text-[#D4AF37]" />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                Google TV &amp; Araç Bağlantısı
              </h2>
              <p className="text-xs text-[#9B978E] truncate">
                YouTube TV koduyla ekran paylaşımı veya araç ekranına Bluetooth bağlantısı
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeConnectModal}
            aria-label="Kapat"
            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#A19E95] hover:text-[#F5F2EB] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-3 sm:px-6 pt-2 grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openConnectModal('tv')}
            className={`h-11 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-colors ${
              connectModalTab === 'tv'
                ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                : 'bg-[#18181F] text-[#E5E2D9] border-white/10 hover:bg-[#22222B]'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            <span>Google TV</span>
            {tvCastConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>
          <button
            type="button"
            onClick={() => openConnectModal('bluetooth')}
            className={`h-11 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-colors ${
              connectModalTab === 'bluetooth'
                ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                : 'bg-[#18181F] text-[#E5E2D9] border-white/10 hover:bg-[#22222B]'
            }`}
          >
            <Bluetooth className="w-4 h-4 shrink-0" />
            <span>Araç</span>
            {btConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 min-h-0 overflow-y-auto overflow-x-hidden space-y-2">
          {connectModalTab === 'tv' ? (
            <>
              {/* Active TV Connection Card */}
              {tvCastConnected && tvCastCode ? (
                <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-500/35 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <MonitorPlay className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#F5F2EB]">
                          Google TV Bağlı · {formatTvCode(tvCastCode)}
                        </p>
                        <p className="text-xs text-emerald-300">
                          {tvReceiverCount > 0
                            ? `${tvReceiverCount} aktif TV ekranı senkronize ediliyor`
                            : 'TV alıcısının açılması bekleniyor...'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={disconnectTvCast}
                      className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/10 text-xs font-semibold text-[#F5F2EB] transition-colors"
                    >
                      Ayır
                    </button>
                  </div>

                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0D0D11]/80 border border-white/[0.06] cursor-pointer">
                    <div className="flex items-center gap-2.5 text-xs text-[#E5E2D9]">
                      {mutePhoneWhileCasting ? (
                        <VolumeX className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      )}
                      <span>Ses yalnızca Google TV’den çalsın (telefonu sustur)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={mutePhoneWhileCasting}
                      onChange={(e) => setMutePhoneWhileCasting(e.target.checked)}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                  </label>
                </div>
              ) : (
                <form
                  onSubmit={handlePairSubmit}
                  className="p-3 rounded-xl bg-[#18181F] border border-white/[0.08] space-y-2"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#F5F2EB]">
                      TV koduyla bağlan
                    </h3>
                    <p className="text-xs text-[#9B978E] leading-relaxed">
                      TV tarayıcısında alıcı adresini açın ve 6 haneli kodu girin.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatTvCode(codeInput)}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="Örn: 482-915"
                      aria-label="6 haneli Google TV kodu"
                      className="w-full min-w-0 flex-1 h-12 px-4 rounded-xl bg-[#0D0D11] border border-white/15 focus:border-[#D4AF37] outline-none text-center text-lg font-mono font-bold tracking-[0.25em] text-[#F5F2EB]"
                    />
                    <button
                      type="submit"
                      disabled={codeInput.replace(/[^0-9]/g, '').length !== 6}
                      className="h-12 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-[#09090B] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Cast className="w-4 h-4" />
                      TV’ye Bağlan
                    </button>
                  </div>

                  <label className="flex items-center justify-between gap-3 pt-1 cursor-pointer">
                    <span className="text-xs text-[#A19E95]">
                      Bağlanınca sesi telefon yerine TV ekranından oynat
                    </span>
                    <input
                      type="checkbox"
                      checked={mutePhoneWhileCasting}
                      onChange={(e) => setMutePhoneWhileCasting(e.target.checked)}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                  </label>

                  {tvCastError && (
                    <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                      {tvCastError}
                    </p>
                  )}
                </form>
              )}

              {/* TV Receiver Link & Launch Box */}
              <div className="p-3 rounded-xl bg-[#16161C] border border-white/[0.07] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#E5C158]">
                    TV alıcı adresi
                  </p>
                  <button
                    type="button"
                    onClick={enterTvReceiverMode}
                    className="h-8 px-3 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-semibold text-[#E5C158] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    Alıcıyı aç
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <code className="basis-full min-w-0 px-3 py-2 rounded-xl bg-[#0D0D11] border border-white/10 text-xs font-mono text-[#E5E2D9] truncate">
                    {tvReceiverUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyTvUrl()}
                    className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-[#F5F2EB] inline-flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Kopyala
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShareTvUrl()}
                    className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-[#F5F2EB] inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Paylaş
                  </button>
                </div>
                
              </div>

              {/* Native Wi-Fi Cast Option */}
              <div className="p-3 rounded-xl bg-[#16161C] border border-white/[0.07] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Doğrudan Google Cast
                    </p>
                    <p className="text-[11px] text-[#8C887F] leading-relaxed">
                      {isRemoteCastSupported
                        ? currentTrack
                          ? 'Destekleyen tarayıcılarda kapak ve parça bilgisini Cast eder; standart Chrome Remote Playback modunda ise yalnızca ses (Chrome simgesi) gönderilir.'
                          : 'Doğrudan Cast için önce bir parça başlatıp tekrar deneyebilirsiniz.'
                        : 'Doğrudan Cast desteklenmiyor. TV kodunu deneyin.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void triggerNativeGoogleCast()}
                    disabled={!isRemoteCastSupported}
                    className="h-10 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 border border-white/10 text-xs font-semibold text-[#F5F2EB] whitespace-nowrap shrink-0"
                  >
                    Cihaz Seç
                  </button>
                </div>

                {remotePlaybackState === 'connected' && (
                  <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 leading-relaxed">
                    Chrome Ses Cast şu an aktif: Tarayıcının bu yöntemi TV’ye yalnızca ses gönderdiği için TV’de
                    sadece Chrome simgesi görünür. Tam TV ekranı ve kapak görseli için yukarıdaki{' '}
                    <strong className="text-[#F5F2EB]">/?tv=1</strong> adresini Google TV’de açıp 6 haneli kodu girin.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Active Bluetooth Device */}
              {btConnected && btDeviceName ? (
                <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <BluetoothConnected className="w-5 h-5 text-emerald-400" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#F5F2EB] truncate">
                        {btDeviceName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-emerald-300">
                        <span>Bluetooth Bağlı</span>
                        {btBatteryLevel !== null && (
                          <span className="inline-flex items-center gap-1">
                            · <BatteryCharging className="w-3.5 h-3.5" /> %{btBatteryLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={disconnectBluetoothCar}
                    className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/10 text-xs font-semibold text-[#F5F2EB]"
                  >
                    Ayır
                  </button>
                </div>
              ) : null}

              {/* Bluetooth Scan & Pair Card */}
              <div className="p-3 rounded-xl bg-[#18181F] border border-white/[0.08] space-y-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F5F2EB]">
                    Bluetooth bağlantısı
                  </h3>
                  <p className="text-xs text-[#9B978E] leading-relaxed">
                    Telefonun Bluetooth ayarlarından araca bağlanın. Uyumlu cihazları burada da seçebilirsiniz.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => void connectBluetoothCar()}
                    className="w-full min-w-0 sm:flex-1 h-11 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Bluetooth className="w-4 h-4 shrink-0" />
                    {isBluetoothBleSupported
                      ? 'Araç Cihazı Tara ve Bağla'
                      : 'Bluetooth Durumunu Kontrol Et'}
                  </button>

                  {isAudioOutputSupported && (
                    <button
                      type="button"
                      onClick={() => void chooseCarAudioOutput()}
                      className="h-11 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-[#F5F2EB] inline-flex items-center gap-2"
                    >
                      <Speaker className="w-4 h-4 text-[#D4AF37]" />
                      Ses Çıkışı Seç
                    </button>
                  )}
                </div>

                {btOutputLabel && (
                  <p className="text-xs text-emerald-300">
                    Aktif Ses Çıkışı: <span className="font-semibold">{btOutputLabel}</span>
                  </p>
                )}

                <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0D0D11]/80 border border-white/[0.06] cursor-pointer">
                  <span className="text-xs text-[#E5E2D9]">
                    Bluetooth bağlandığında Araç Modunu otomatik başlat
                  </span>
                  <input
                    type="checkbox"
                    checked={btAutoCarMode}
                    onChange={(e) => setBtAutoCarMode(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37]"
                  />
                </label>

                {btStatusMessage && (
                  <p className="text-xs text-[#E5C158] bg-[#1C1A12] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 leading-relaxed">
                    {btStatusMessage}
                  </p>
                )}
              </div>

              {/* A2DP / AVRCP Car Screen Info & Car Mode Shortcut */}
              <div className="p-3 rounded-xl bg-[#16161C] border border-white/[0.07] space-y-2">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#F5F2EB]">
                      Araç ekranı ve direksiyon tuşları
                    </p>
                    <p className="text-[11px] text-[#9B978E] leading-relaxed">
                      Telefonunuz aracınıza Bluetooth ses olarak bağlıyken; çalan şarkı adı, sanatçı/kâri,
                      kapak görseli ve ileri/geri/duraklat tuşları MediaSession AVRCP üzerinden araç
                      ekranınıza otomatik gönderilir.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeConnectModal();
                    setCarMode(true);
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs sm:text-sm font-semibold text-[#F5F2EB] inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Car className="w-4 h-4 text-[#D4AF37]" />
                  Araç modunu aç
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
