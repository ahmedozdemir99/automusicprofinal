import React from 'react';
import {
  BookOpen,
  Car,
  Disc3,
  Download,
  Heart,
  Home,
  Library,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { AndroidAutoMode } from './components/AndroidAutoMode';
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
  const { screen, navigate, carMode, setCarMode, currentTrack, toastMessage, downloads } = useAutoMusic();
  const activeTab = getActiveTab(screen.name);

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

        <nav className="space-y-1" aria-label="Ana gezinme">
          {primaryTabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1B1810] text-[#E5C158]'
                    : 'text-[#A19E95] hover:text-[#F5F2EB] hover:bg-white/[0.04]'
                }`}
              >
                <span className={isActive ? 'text-[#D4AF37]' : 'text-[#7C7970]'}>{item.icon}</span>
                <span>{item.label}</span>
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
            label="Sanatçılar ve Kariler"
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

        <div className="mt-auto pt-4 space-y-2.5">
          <PWAInstallButton variant="sidebar" />
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
        <header className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[#0B0B0F]/92 backdrop-blur-md border-b border-white/[0.07] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2 text-base font-bold tracking-tight text-[#D4AF37] whitespace-nowrap shrink-0"
          >
            <img src="/icon.svg" alt="" className="w-6 h-6 rounded-md shrink-0" />
            <span>AutoMusic Pro</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={() => setCarMode(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              <Car className="w-3.5 h-3.5 shrink-0" />
              Araç Modu
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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0D0D11]/95 backdrop-blur-lg border-t border-white/[0.08] grid grid-cols-5 items-center"
      >
        {primaryTabs.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-[#D4AF37]' : 'text-[#8C887F]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Full-Screen Car Mode */}
      {carMode && <AndroidAutoMode />}

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
