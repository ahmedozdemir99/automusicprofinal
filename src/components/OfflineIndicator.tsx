import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-24 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#1D180C] border border-[#D4AF37]/45 px-3.5 py-2 text-xs font-medium text-[#F2D785] shadow-2xl"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
      <span>Çevrimdışı Mod — İndirilen kayıtlarınız doğrudan çalınır.</span>
    </div>
  );
};
