import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface PwaUpdateEventDetail {
  applyUpdate: () => Promise<void>;
}

export const PWAUpdateBanner: React.FC = () => {
  const [applyUpdate, setApplyUpdate] = useState<(() => Promise<void>) | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PwaUpdateEventDetail>).detail;
      if (detail?.applyUpdate) {
        setApplyUpdate(() => detail.applyUpdate);
      }
    };
    window.addEventListener('amp-pwa-update', handler);
    return () => window.removeEventListener('amp-pwa-update', handler);
  }, []);

  if (!applyUpdate) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 lg:bottom-24 right-4 z-50 max-w-sm rounded-2xl bg-[#181610] border border-[#D4AF37]/45 shadow-2xl p-4 flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center shrink-0">
        <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${updating ? 'animate-spin' : ''}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#F5F2EB]">Yeni sürüm hazır</p>
        <p className="text-[11px] text-[#A8A49B] mt-0.5">
          Güncel ses motoru ve iyileştirmeler için şimdi yenileyin.
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          disabled={updating}
          onClick={() => {
            setUpdating(true);
            void applyUpdate();
          }}
          className="h-8 px-3 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold whitespace-nowrap disabled:opacity-60 transition-colors"
        >
          Güncelle
        </button>
        <button
          type="button"
          onClick={() => setApplyUpdate(null)}
          aria-label="Güncelleme uyarısını kapat"
          className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-[#9B978E]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
