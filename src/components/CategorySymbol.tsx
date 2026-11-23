import React from 'react';
import { CategorySymbolId } from '../types/media';

interface CategorySymbolProps {
  symbol: CategorySymbolId;
  className?: string;
}

/**
 * 17 bespoke, domain-tailored minimalist burnished-gold vector emblems —
 * each category has its own distinct, unmistakable instrument or cultural motif.
 */
export const CategorySymbol: React.FC<CategorySymbolProps> = ({
  symbol,
  className = 'w-6 h-6 text-[#D4AF37]',
}) => {
  const common = {
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (symbol) {
    // 1. Nostalji — Vintage Vinyl Plak & Gramofon İğnesi
    case 'nostalji':
      return (
        <svg {...common}>
          <circle cx="15" cy="16" r="10.5" />
          <circle cx="15" cy="16" r="6" strokeOpacity="0.45" />
          <circle cx="15" cy="16" r="2.2" fill="currentColor" stroke="none" />
          <path d="M26 7v9l-4.5 3.5" />
          <circle cx="26" cy="7" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );

    // 2. Karadeniz — Kemençe Gövdesi & Yay
    case 'karadeniz':
      return (
        <svg {...common}>
          <path d="M16 4v24" />
          <path d="M12.5 11.5h7l-1 13.5a2.5 2.5 0 0 1-5 0l-1-13.5Z" />
          <path d="M13.5 6.5h5" />
          <path d="M6 20.5 26 14.5" strokeOpacity="0.85" />
          <path d="M6.5 27c2.8-1.8 5.2-1.8 8 0" strokeOpacity="0.4" />
        </svg>
      );

    // 3. Arapça müzik — Klasik Ud Gövdesi ve Bükümlü Sap
    case 'arapca':
      return (
        <svg {...common}>
          <path d="M21 5l5 2-2.5 4" />
          <path d="M23.5 7 15.5 15" />
          <path d="M16.8 14.2c3.2 2.4 3.5 7.4.4 10.5-3.2 3.2-8.5 3-11-0.2-2.4-3-1.4-7.8 2.2-10.3 2.5-1.7 5.8-1.9 8.4 0Z" />
          <circle cx="12.5" cy="19.5" r="2.2" strokeOpacity="0.7" />
        </svg>
      );

    // 4. Azerice müzik — Geleneksel Azerbaycan Tar (8-şekilli gövde)
    case 'azerice':
      return (
        <svg {...common}>
          <path d="M24 5l3 3" />
          <path d="M25.5 6.5 16.5 15.5" />
          <circle cx="14.5" cy="17.5" r="3.2" />
          <circle cx="9.8" cy="22.2" r="4.5" />
          <path d="M9.8 22.2l1.8-1.8" strokeOpacity="0.6" />
        </svg>
      );

    // 5. Lazca müzik — Doğu Karadeniz Tulum (Çift kamış & yayla tulumu)
    case 'lazca':
      return (
        <svg {...common}>
          <path d="M10 15c0-4.4 3.4-7.5 7.8-7.5 4.2 0 7.2 3.1 7.2 7.3 0 4.6-3.4 8.2-8.2 8.2-3.9 0-6.8-3.4-6.8-8Z" />
          <path d="M10.5 19.5 6 26.5" />
          <path d="M13.5 22 10.5 27.5" />
          <path d="M17.5 7.5V4.5" />
          <circle cx="18" cy="15" r="2" strokeOpacity="0.55" />
        </svg>
      );

    // 6. Türküler — Anadolu Bağlama / Saz
    case 'turkuler':
      return (
        <svg {...common}>
          <path d="M26 5 14.5 16.5" />
          <path d="M23.5 5.5l3 3" />
          <path d="M15.8 15.2c2.5 2.5 2.2 6.8-.6 9.6-2.8 2.8-7.1 3.1-9.6.6-2.5-2.5-2.2-6.8.6-9.6 2.8-2.8 7.1-3.1 9.6-.6Z" />
          <path d="M8.5 23.5l5-5" strokeOpacity="0.6" />
        </svg>
      );

    // 7. Arabesk — Keman & Yaylı Makamlar
    case 'arabesk':
      return (
        <svg {...common}>
          <path d="M16 4v24" strokeOpacity="0.45" />
          <path d="M13 10.5c-2.5 0-4 2-3.3 4.2.5 1.5 1.6 2.3 1.6 3.5s-2.4 2.1-2.4 4.6c0 2.7 2.8 4.7 7.1 4.7s7.1-2 7.1-4.7c0-2.5-2.4-3.4-2.4-4.6s1.1-2 1.6-3.5c.7-2.2-.8-4.2-3.3-4.2h-6Z" />
          <path d="M14 5.5h4" />
          <path d="M12.5 19.5h7" strokeOpacity="0.7" />
        </svg>
      );

    // 8. Türk sanat müziği — Klasik Kanun (Trapez gövde ve paralel teller)
    case 'turk_sanat':
      return (
        <svg {...common}>
          <path d="M6 23.5h20l-4.5-15H10.5L6 23.5Z" />
          <path d="M9.5 12.5h13" strokeOpacity="0.65" />
          <path d="M8.5 16h15" strokeOpacity="0.65" />
          <path d="M7.5 19.5h17" strokeOpacity="0.65" />
        </svg>
      );

    // 9. Türk pop — Stüdyo Kondenser Mikrofon
    case 'turk_pop':
      return (
        <svg {...common}>
          <rect x="12" y="5" width="8" height="12.5" rx="4" />
          <path d="M8.5 14.5a7.5 7.5 0 0 0 15 0" />
          <path d="M16 22v5" />
          <path d="M11.5 27h9" />
          <path d="M13.5 9.5h5" strokeOpacity="0.55" />
        </svg>
      );

    // 10. Türk rock — Elektro Gitar & Pena
    case 'turk_rock':
      return (
        <svg {...common}>
          <path d="M24.5 5.5 27 8l-2 2-1.5-1.5-8 8" />
          <path d="M16.5 15.5l2.5 2.5-3.2 4.5c-2.2 3-6.5 3.6-9.1 1-2.6-2.6-2-6.9 1-9.1l4.5-3.2 2.3 2.3" />
          <circle cx="10.5" cy="21.5" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );

    // 11. Özgün müzik — Akustik Gitar & Şiirsel Tüy
    case 'ozgun':
      return (
        <svg {...common}>
          <path d="M24.5 6.5c-6 1-11.5 5.5-14.5 13l-2.5 6 6-2.5c7.5-3 12-8.5 13-14.5Z" />
          <path d="M11 21l9-9" strokeOpacity="0.65" />
          <path d="M7.5 25.5 5.5 27.5" />
        </svg>
      );

    // 12. İlahi — Hilal ve Manevi Kandil
    case 'ilahi':
      return (
        <svg {...common}>
          <path d="M21.5 19.8A8.5 8.5 0 0 1 11.2 9.5a8.5 8.5 0 1 0 10.3 10.3Z" />
          <path d="M21 7v4M19 9h4" strokeOpacity="0.85" />
        </svg>
      );

    // 13. Ezgi — Akışkan Melodi & Nota Dalgası
    case 'ezgi':
      return (
        <svg {...common}>
          <path d="M12.5 22.5V9.5l12-2.5v12.5" />
          <circle cx="9.8" cy="22.5" r="2.7" />
          <circle cx="21.8" cy="19.5" r="2.7" />
          <path d="M12.5 13.5l12-2.5" strokeOpacity="0.55" />
        </svg>
      );

    // 14. Neşid — Enstrümansız Saf Vokal Ses Dalgaları
    case 'nesid':
      return (
        <svg {...common}>
          <path d="M16 6v20" />
          <path d="M11.5 10v12" />
          <path d="M20.5 10v12" />
          <path d="M7 13.5v5" strokeOpacity="0.7" />
          <path d="M25 13.5v5" strokeOpacity="0.7" />
        </svg>
      );

    // 15. Zikirli ilahiler — Bendir / Def Çemberi & Zikir Ritmi
    case 'zikirli_ilahiler':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="10" />
          <circle cx="16" cy="16" r="6.2" strokeDasharray="2.5 3.5" strokeOpacity="0.8" />
          <circle cx="16" cy="6" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="26" cy="16" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="16" cy="26" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="6" cy="16" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );

    // 16. Tasavvuf müziği — Geleneksel Kamış Ney & Boğumlar
    case 'tasavvuf':
      return (
        <svg {...common}>
          <path d="M7 25 25 7" strokeWidth="2.4" />
          <path d="M11.5 20.5l1.8 1.8" strokeOpacity="0.6" />
          <path d="M15.5 16.5l1.8 1.8" strokeOpacity="0.6" />
          <path d="M19.5 12.5l1.8 1.8" strokeOpacity="0.6" />
          <circle cx="23.5" cy="8.5" r="2" />
          <path d="M7 11c2.5-2.5 5.5-3.5 8.5-3" strokeOpacity="0.45" />
        </svg>
      );

    // 17. Kur'an-ı Kerim — Sekiz Köşeli Rub el Hizb Yıldızı ve Açık Mushaf
    case 'kuran':
      return (
        <svg {...common}>
          <rect x="8.5" y="8.5" width="15" height="15" />
          <rect x="8.5" y="8.5" width="15" height="15" transform="rotate(45 16 16)" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      );

    // Özel kullanıcı kategorisi
    default:
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="10" />
          <path d="M13.5 11.8 20.5 16l-7 4.2v-8.4Z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
};
