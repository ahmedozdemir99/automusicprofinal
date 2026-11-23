import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'sidebar' | 'compact' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'primary',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Automatically suppress when already running in standalone installed PWA mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) return;
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={() => void handleClick()}
          className={`p-5 rounded-2xl bg-[#16140D] hover:bg-[#1F1C12] border border-[#D4AF37]/30 text-left space-y-2 transition-colors w-full ${className}`}
        >
          <div className="flex items-center justify-between gap-2">
            <img
              src="/icon.svg"
              alt="AutoMusic Pro İkonu"
              className="w-8 h-8 rounded-lg"
            />
            <Download className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-base font-semibold text-[#F5F2EB]">
            Uygulamayı Telefona / Cihaza Yükle (PWA)
          </p>
          <p className="text-xs text-[#C4B78B]">
            Mağaza veya ek kurulum gerekmeden ana ekrana yükleyin; çevrimdışı tam ekran çalışır.
          </p>
        </button>
      ) : variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => void handleClick()}
          className={`w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#F5F2EB] text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${className}`}
        >
          <Download className="w-4 h-4 text-[#D4AF37] shrink-0" />
          Uygulamayı Yükle
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => void handleClick()}
          aria-label="Uygulamayı Yükle"
          className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[#F5F2EB] text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          Yükle
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void handleClick()}
          className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-[#D4AF37]/30 text-sm font-medium text-[#E5C158] transition-colors whitespace-nowrap ${className}`}
        >
          <Download className="w-4 h-4 text-[#D4AF37] shrink-0" />
          Uygulamayı Yükle
        </button>
      )}

      {/* Guided Install Sheet for iOS Safari or Browsers where beforeinstallprompt is pending */}
      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AutoMusic Pro Kurulum Rehberi"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#121216] border border-white/10 p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/icon.svg"
                  alt="AutoMusic Pro"
                  className="w-12 h-12 rounded-2xl border border-[#D4AF37]/25"
                />
                <div>
                  <h3 className="text-lg font-bold text-[#F5F2EB]">AutoMusic Pro'yu Yükle</h3>
                  <p className="text-xs text-[#9B978E]">Ana ekrandan uygulama gibi tam ekran açılır</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Kapat"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#9B978E] hover:text-[#F5F2EB] hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-[#CFCBC2] bg-[#0B0B0F] p-4 rounded-2xl border border-white/[0.06]">
                <p className="font-medium text-[#E5C158] inline-flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  iPhone / iPad (Safari) Kurulumu
                </p>
                <ol className="space-y-2 text-xs text-[#A8A49B] list-decimal list-inside leading-relaxed">
                  <li>Safari alt çubuğundaki <strong className="text-[#F5F2EB]">Paylaş</strong> düğmesine dokunun.</li>
                  <li>Aşağı kaydırıp <strong className="text-[#F5F2EB]">Ana Ekrana Ekle</strong> seçeneğine dokunun.</li>
                  <li>Sağ üstten <strong className="text-[#F5F2EB]">Ekle</strong> diyerek kurulumu tamamlayın.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-[#CFCBC2] bg-[#0B0B0F] p-4 rounded-2xl border border-white/[0.06]">
                <p className="font-medium text-[#E5C158] inline-flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Android (Chrome / Edge) ve Masaüstü Kurulumu
                </p>
                <ol className="space-y-2 text-xs text-[#A8A49B] list-decimal list-inside leading-relaxed">
                  <li>Uygulamayı kendi tarayıcı sekmenizde açın.</li>
                  <li>Chrome / Edge menüsünden (<strong className="text-[#F5F2EB]">⋮</strong>) <strong className="text-[#F5F2EB]">Uygulamayı yükle</strong> veya <strong className="text-[#F5F2EB]">Ana ekrana ekle</strong> seçeneğine dokunun.</li>
                  <li>AutoMusic Pro ikonu ana ekranınıza eklenir ve çevrimdışı arşiviyle doğrudan çalışır.</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </>
  );
};
