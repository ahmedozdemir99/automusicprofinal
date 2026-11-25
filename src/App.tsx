import React from 'react';
import {
  Bluetooth,
  BookOpen,
  Car,
  Disc3,
  Download,
  Heart,
  Home,
  Library,
  Moon,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  Tv,
  Users,
} from 'lucide-react';
import { AndroidAutoMode } from './components/AndroidAutoMode';
import { ConnectDevicesModal } from './components/ConnectDevicesModal';
import { GoogleTvReceiverScreen } from './components/GoogleTvReceiverScreen';
import { NowPlayingView } from './components/NowPlayingView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PlayerBar } from './components/PlayerBar';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PWAUpdateBanner } from './components/PWAUpdateBanner';
import { AutoMusicProvider, useAutoMusic } from './context/AutoMusicContext';
import {
  ArtistDetailScreen,
  ArtistsScreen,
  CategoriesScreen,
  TrackListScreen,
} from './screens/CategoriesAndCatalogScreens';
import { HomeScreen } from './screens/HomeScreen';
import {
  CreatePlaylistScreen,
  LibraryHubScreen,
  PlaylistDetailScreen,
  SearchScreen,
} from './screens/LibraryAndSearchScreens';
import { QuranHubScreen, SurahDetailScreen } from './screens/QuranScreens';
import {
  AudioSettingsScreen,
  DownloadsScreen,
  GeneralSettingsScreen,
  StorageManagementScreen,
} from './screens/SettingsAndStorageScreens';
import { NavTabId } from './types/media';

function getActiveTab(screenName: string): NavTabId {
  switch (screenName) {
    case 'search':
      return 'search';
    case 'quran':
    case 'reciter_select':
    case 'surah_list':
    case 'surah_detail':
      return 'quran';
    case 'favorites':
    case 'playlists':
    case 'playlist_detail':
    case 'create_playlist':
    case 'downloads':
      return 'library';
    case 'general_settings':
    case 'audio_settings':
    case 'storage':
      return 'settings';
    default:
      return 'home';
  }
}

const AppShell: React.FC = () => {
  const {
    screen,
    navigate,
    carMode,
    setCarMode,
    dayMode,
    toggleDayMode,
    currentTrack,
    toastMessage,
    downloads,
    isTvReceiverMode,
    openConnectModal,
    tvCastConnected,
    btConnected,
  } = useAutoMusic();
  const activeTab = getActiveTab(screen.name);

  if (isTvReceiverMode) {
    return <GoogleTvReceiverScreen />;
  }

  const primaryTabs: Array<{ id: NavTabId; label: string; icon: React.ReactNode; onClick: () => void }> = [
    { id: 'home', label: 'Ana Sayfa', icon: <Home className="w-5 h-5" />, onClick: () => navigate({ name: 'home' }) },
    { id: 'search', label: 'Ara', icon: <Search className="w-5 h-5" />, onClick: () => navigate({ name: 'search' }) },
    { id: 'quran', label: "Kur'an", icon: <BookOpen className="w-5 h-5" />, onClick: () => navigate({ name: 'quran' }) },
    { id: 'library', label: 'Kütüphanem', icon: <Library className="w-5 h-5" />, onClick: () => navigate({ name: 'playlists' }) },
    { id: 'settings', label: 'Ayarlar', icon: <Settings className="w-5 h-5" />, onClick: () => navigate({ name: 'general_settings' }) },
  ];

  const renderScreen = () => {
    switch (screen.name) {
      case 'home':
        return <HomeScreen />;
      case 'categories':
        return <CategoriesScreen />;
      case 'artists':
        return <ArtistsScreen />;
      case 'artist_detail':
        return <ArtistDetailScreen artistId={screen.artistId} />;
      case 'track_list':
        return <TrackListScreen categoryId={screen.categoryId} title={screen.title} />;
      case 'now_playing':
        return <NowPlayingView />;
      case 'quran':
        return <QuranHubScreen />;
      case 'reciter_select':
        return <QuranHubScreen initialShowReciters />;
      case 'surah_list':
        return <QuranHubScreen />;
      case 'surah_detail':
        return <SurahDetailScreen surahNumber={screen.surahNumber} reciterId={screen.reciterId} />;
      case 'favorites':
        return <LibraryHubScreen initialTab="favorites" />;
      case 'playlists':
        return <LibraryHubScreen initialTab="playlists" />;
      case 'playlist_detail':
        return <PlaylistDetailScreen playlistId={screen.playlistId} />;
      case 'create_playlist':
        return <CreatePlaylistScreen />;
      case 'search':
        return <SearchScreen />;
      case 'downloads':
        return <DownloadsScreen />;
      case 'storage':
        return <StorageManagementScreen />;
      case 'audio_settings':
        return <AudioSettingsScreen />;
      case 'general_settings':
        return <GeneralSettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F2EB] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar (Spotify-grade Architecture for 1440px Canvas) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-[#0D0D11] border-r border-white/[0.07] px-4 py-6 z-30">
        <button
          type="button"
          onClick={() => navigate({ name: 'home' })}
          className="flex items-center gap-2.5 text-left px-3 mb-7 text-xl font-bold tracking-tight text-[#D4AF37] whitespace-nowrap"
        >
          <img src="/icon.svg" alt="" className="w-7 h-7 rounded-lg shrink-0" />
          <span>AutoMusic Pro</span>
        </button>

        <nav className="space-y-1.5" aria-label="Ana gezinme">
          {primaryTabs.map((item) => {
            const isActive = activeTab === item.id;
            const isQuran = item.id === 'quran';
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isQuran
                    ? `quran-btn-blink border ${
                        isActive
                          ? 'bg-emerald-500/25 border-emerald-400/75 text-emerald-300'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/22 border-emerald-500/45 text-emerald-300'
                      }`
                    : isActive
                    ? 'bg-[#1B1810] text-[#E5C158]'
                    : 'text-[#A19E95] hover:text-[#F5F2EB] hover:bg-white/[0.04]'
                }`}
              >
                <span className={isQuran ? 'text-emerald-400' : isActive ? 'text-[#D4AF37]' : 'text-[#7C7970]'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {isQuran && (
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-7 pt-6 border-t border-white/[0.07] space-y-1">
          <p className="px-3 mb-2 text-xs font-medium text-[#7C7970]">Hızlı Erişim</p>
          <SidebarLink
            icon={<Disc3 className="w-4 h-4" />}
            label="Müzik Kategorileri"
            active={screen.name === 'categories'}
            onClick={() => navigate({ name: 'categories' })}
          />
          <SidebarLink
            icon={<Users className="w-4 h-4" />}
            label="Sanatçılar ve Kâriler"
            active={screen.name === 'artists'}
            onClick={() => navigate({ name: 'artists' })}
          />
          <SidebarLink
            icon={<Heart className="w-4 h-4" />}
            label="Favorilerim"
            active={screen.name === 'favorites'}
            onClick={() => navigate({ name: 'favorites' })}
          />
          <SidebarLink
            icon={<Download className="w-4 h-4" />}
            label={`İndirilenler (${downloads.length})`}
            active={screen.name === 'downloads'}
            onClick={() => navigate({ name: 'downloads' })}
          />
          <SidebarLink
            icon={<SlidersHorizontal className="w-4 h-4" />}
            label="Ses ve Ekolayzır"
            active={screen.name === 'audio_settings'}
            onClick={() => navigate({ name: 'audio_settings' })}
          />
        </div>

        <div className="mt-auto pt-4 space-y-2">
          <PWAInstallButton variant="sidebar" />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openConnectModal('tv')}
              title="Google TV Ekran Paylaşımı"
              className={`h-10 px-2.5 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                tvCastConnected
                  ? 'bg-emerald-500/18 border-emerald-500/45 text-emerald-300'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-[#F5F2EB]'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>TV Paylaş</span>
            </button>
            <button
              type="button"
              onClick={() => openConnectModal('bluetooth')}
              title="Bluetooth Araba Ekranı Bağlantısı"
              className={`h-10 px-2.5 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                btConnected
                  ? 'bg-emerald-500/18 border-emerald-500/45 text-emerald-300'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-[#F5F2EB]'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Bluetooth</span>
            </button>
          </div>
          <button
            type="button"
            onClick={toggleDayMode}
            aria-label={dayMode ? 'Gece moduna geç' : 'Gündüz moduna geç'}
            className="w-full h-10 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#F5F2EB] text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            {dayMode ? (
              <>
                <Moon className="w-4 h-4 text-[#D4AF37] shrink-0" />
                Gece Modu
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-[#D4AF37] shrink-0" />
                Gündüz Modu
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCarMode(true)}
            className="w-full h-11 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Car className="w-4 h-4 shrink-0" />
            Araç Modu
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Compact Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-30 h-14 px-3 bg-[#0B0B0F]/92 backdrop-blur-md border-b border-white/[0.07] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#D4AF37] min-w-0 truncate"
          >
            <img src="/icon.svg" alt="" className="w-6 h-6 rounded-md shrink-0" />
            <span className="truncate">AutoMusic Pro</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={() => openConnectModal('tv')}
              aria-label="Google TV Ekran Paylaşımı"
              title="Google TV Ekran Paylaşımı"
              className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border transition-colors shrink-0 ${
                tvCastConnected
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-[#F5F2EB]'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
            <button
              type="button"
              onClick={() => openConnectModal('bluetooth')}
              aria-label="Bluetooth Araç Bağlantısı"
              title="Bluetooth Araç Bağlantısı"
              className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border transition-colors shrink-0 ${
                btConnected
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-[#F5F2EB]'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
            <button
              type="button"
              onClick={toggleDayMode}
              aria-label={dayMode ? 'Gece moduna geç' : 'Gündüz moduna geç'}
              title={dayMode ? 'Gece Modu' : 'Gündüz Modu'}
              className="inline-flex items-center justify-center h-8 w-8 sm:w-auto sm:px-2.5 gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[#F5F2EB] text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              {dayMode ? (
                <Moon className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              )}
              <span className="hidden sm:inline">{dayMode ? 'Gece' : 'Gündüz'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCarMode(true)}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              <Car className="w-3.5 h-3.5 shrink-0" />
              <span>Araç Modu</span>
            </button>
          </div>
        </header>

        <main
          className={`flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 ${
            currentTrack ? 'pb-36 lg:pb-28' : 'pb-24 lg:pb-12'
          }`}
        >
          {renderScreen()}
        </main>
      </div>

      {/* Persistent Player Bar */}
      <PlayerBar />

      {/* Mobile Fixed 5-Tab Bottom Navigation (Ana Sayfa, Ara, Kur'an, Kütüphanem, Ayarlar) */}
      <nav
        aria-label="Alt gezinme menüsü"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0D0D11]/95 backdrop-blur-lg border-t border-white/[0.08] grid grid-cols-5 items-center px-1"
      >
        {primaryTabs.map((item) => {
          const isActive = activeTab === item.id;
          const isQuran = item.id === 'quran';
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="h-full flex items-center justify-center"
            >
              <span
                className={`w-[66px] h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors border ${
                  isQuran
                    ? `quran-btn-blink ${
                        isActive
                          ? 'bg-emerald-500/25 border-emerald-400/75 text-emerald-300'
                          : 'bg-emerald-500/15 border-emerald-500/45 text-emerald-400'
                      }`
                    : isActive
                    ? 'border-transparent text-[#D4AF37]'
                    : 'border-transparent text-[#8C887F]'
                }`}
              >
                {item.icon}
                <span className={`text-[10px] leading-none whitespace-nowrap ${isQuran ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Full-Screen Car Mode */}
      {carMode && <AndroidAutoMode />}

      {/* Google TV Cast & Bluetooth Car Modal */}
      <ConnectDevicesModal />

      {/* Safe PWA Update Prompt */}
      <PWAUpdateBanner />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Subtle Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-[#1C1A12] border border-[#D4AF37]/40 text-xs font-medium text-[#F5F2EB] shadow-2xl max-w-sm"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

const SidebarLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
      active
        ? 'bg-white/[0.07] text-[#E5C158]'
        : 'text-[#9B978E] hover:text-[#F5F2EB] hover:bg-white/[0.04]'
    }`}
  >
    <span className={active ? 'text-[#D4AF37]' : 'text-[#7C7970]'}>{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

export default function App() {
  return (
    <AutoMusicProvider>
      <AppShell />
    </AutoMusicProvider>
  );
}
