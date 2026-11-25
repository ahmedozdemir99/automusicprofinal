import React, { useEffect, useState } from 'react';
import { CategorySymbolId } from '../types/media';
import { CategorySymbol } from './CategorySymbol';

interface ArtworkCoverProps {
  motif: CategorySymbolId;
  categoryId?: string;
  imageUrl?: string;
  title?: string;
  arabicTitle?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ArtworkCoverProps['size']>, string> = {
  xs: 'w-10 h-10 rounded-lg',
  sm: 'w-12 h-12 rounded-xl',
  md: 'w-14 h-14 rounded-xl',
  lg: 'w-40 h-40 rounded-2xl',
  xl: 'w-64 h-64 sm:w-72 sm:h-72 rounded-3xl',
};

const ICON_SIZES: Record<NonNullable<ArtworkCoverProps['size']>, string> = {
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-7 h-7',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

// Subtle dark obsidian tonal nuances per category while preserving unified black & gold luxury
const MOTIF_GRADIENTS: Record<CategorySymbolId, string> = {
  nostalji: 'from-[#221A10] via-[#141210] to-[#0A0908]',
  karadeniz: 'from-[#0E1D19] via-[#101413] to-[#09090B]',
  arapca: 'from-[#241B0D] via-[#15120D] to-[#09090B]',
  azerice: 'from-[#211610] via-[#141110] to-[#09090B]',
  lazca: 'from-[#101B1B] via-[#101314] to-[#09090B]',
  turkuler: 'from-[#23180E] via-[#14110E] to-[#09090B]',
  arabesk: 'from-[#1F1316] via-[#141013] to-[#09090B]',
  fantezi: 'from-[#23151B] via-[#151015] to-[#09090B]',
  turk_sanat: 'from-[#1E190E] via-[#13120F] to-[#09090B]',
  turk_pop: 'from-[#1B171D] via-[#131216] to-[#09090B]',
  turk_rock: 'from-[#201412] via-[#141111] to-[#09090B]',
  ozgun: 'from-[#1A1812] via-[#121210] to-[#09090B]',
  ilahi: 'from-[#1A190E] via-[#11120E] to-[#09090B]',
  ezgi: 'from-[#18171D] via-[#111115] to-[#09090B]',
  nesid: 'from-[#171B17] via-[#101311] to-[#09090B]',
  zikirli_ilahiler: 'from-[#20190D] via-[#13110D] to-[#09090B]',
  tasavvuf: 'from-[#1D170C] via-[#12100C] to-[#09090B]',
  kuran: 'from-[#221B0A] via-[#13110C] to-[#09090B]',
  custom: 'from-[#191815] via-[#121215] to-[#09090B]',
};

export const ArtworkCover: React.FC<ArtworkCoverProps> = ({
  motif,
  imageUrl,
  title,
  arabicTitle,
  size = 'md',
  className = '',
}) => {
  const safeMotif: CategorySymbolId = MOTIF_GRADIENTS[motif] ? motif : 'custom';
  const showDetail = size === 'lg' || size === 'xl';
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const validImageUrl =
    imageUrl && !imgFailed && /^https?:\/\//i.test(imageUrl) ? imageUrl : null;

  if (validImageUrl) {
    return (
      <div
        data-artwork-cover="true"
        className={`relative shrink-0 overflow-hidden bg-[#121216] border border-[#D4AF37]/25 select-none ${SIZE_CLASSES[size]} ${className}`}
      >
        <img
          src={validImageUrl}
          alt={title ? `${title} kapak görseli` : ''}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      data-artwork-cover="true"
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${MOTIF_GRADIENTS[safeMotif]} border border-[#D4AF37]/20 flex flex-col items-center justify-center select-none ${SIZE_CLASSES[size]} ${className}`}
    >
      {/* Subtle radial warm gold halo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0) 70%)',
        }}
      />

      {arabicTitle && showDetail ? (
        <div className="relative z-10 flex flex-col items-center gap-3 px-3">
          <CategorySymbol symbol={safeMotif} className="w-10 h-10 text-[#D4AF37]/75" />
          <span
            className="font-arabic text-4xl text-[#E8CF78] text-center leading-tight"
            dir="rtl"
          >
            {arabicTitle}
          </span>
        </div>
      ) : arabicTitle && size === 'md' ? (
        <span
          className="relative z-10 font-arabic text-base text-[#E8CF78] text-center px-1 leading-tight"
          dir="rtl"
        >
          {arabicTitle}
        </span>
      ) : (
        <CategorySymbol
          symbol={safeMotif}
          className={`relative z-10 text-[#D4AF37] ${ICON_SIZES[size]}`}
        />
      )}
    </div>
  );
};
