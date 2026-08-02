import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Filter,
  Sparkles,
  Building2,
  BookOpen,
  Send,
  Users,
  CheckCircle2,
  Calendar,
  Radio,
  Plus,
  Compass,
  MessageSquare,
  Mail,
  Heart,
  MapPin,
} from 'lucide-react';

import { Header, UserRole, ActiveTab } from './components/Header';
import { WorshipPlaceCard } from './components/WorshipPlaceCard';
import { SermonCard } from './components/SermonCard';
import { SermonViewerModal } from './components/SermonViewerModal';
import { BroadcastModal } from './components/BroadcastModal';
import { AdminPortal } from './components/AdminPortal';
import { BroadcastLogsView } from './components/BroadcastLogsView';
import { LiveStreamRoom } from './components/LiveStreamRoom';
import { PrayerTimes } from './components/PrayerTimes';
import { WorshipMapGrid } from './components/WorshipMapGrid';
import { NearbyMasjidApp } from './components/NearbyMasjidApp';
import { AuthModal } from './components/AuthModal';

import { WorshipPlace, Sermon, LanguageOption, SUPPORTED_LANGUAGES, Religion, MasjidAdminAccount, UserSession } from './types';
import { INITIAL_WORSHIP_PLACES, INITIAL_SERMONS, INITIAL_PENDING_ADMIN_ACCOUNTS } from './initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('nearby_app');
  const [userRole, setUserRole] = useState<UserRole>('worshipper');
  
  // User Authentication & Active Session State
  const [currentSession, setCurrentSession] = useState<UserSession>({
    role: 'worshipper',
    isLoggedIn: false,
    name: 'Guest Worshipper',
    assignedPlaceId: 'place-1',
    assignedPlaceName: 'Al-Farooq Central Grand Mosque',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Default target translation language (Urdu is set by default as requested in prompt, or English)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    SUPPORTED_LANGUAGES[0] // Urdu
  );

  const [worshipPlaces, setWorshipPlaces] = useState<WorshipPlace[]>(INITIAL_WORSHIP_PLACES);
  const [sermons, setSermons] = useState<Sermon[]>(INITIAL_SERMONS);
  const [adminAccounts, setAdminAccounts] = useState<MasjidAdminAccount[]>(INITIAL_PENDING_ADMIN_ACCOUNTS);
  const [joinedPlaceIds, setJoinedPlaceIds] = useState<string[]>(['place-1', 'place-7']);

  // Filters
  const [religionFilter, setReligionFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeExploreView, setActiveExploreView] = useState<'all' | 'places' | 'sermons'>('all');

  // Modals
  const [selectedSermonForModal, setSelectedSermonForModal] = useState<Sermon | null>(null);
  const [selectedSermonForBroadcast, setSelectedSermonForBroadcast] = useState<Sermon | null>(null);

  // Load data from backend on mount
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch('/api/places'),
          fetch('/api/sermons'),
        ]);

        if (pRes.ok) {
          const pData = await pRes.json();
          if (Array.isArray(pData) && pData.length > 0) setWorshipPlaces(pData);
        }

        if (sRes.ok) {
          const sData = await sRes.json();
          if (Array.isArray(sData) && sData.length > 0) setSermons(sData);
        }
      } catch (err) {
        console.log('Using initial client data fallback:', err);
      }
    };

    loadBackendData();
  }, []);

  // Handlers
  const handleAddPlace = (place: WorshipPlace) => {
    setWorshipPlaces((prev) => [place, ...prev]);
  };

  const handleApprovePlace = (placeId: string) => {
    setWorshipPlaces((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, approvalStatus: 'approved' } : p))
    );
  };

  const handleRejectPlace = (placeId: string) => {
    setWorshipPlaces((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, approvalStatus: 'rejected' } : p))
    );
  };

  const handleApproveAdminAccount = (accountId: string) => {
    setAdminAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, status: 'approved', approvedAt: new Date().toISOString() } : a))
    );
  };

  const handleRejectAdminAccount = (accountId: string) => {
    setAdminAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, status: 'rejected' } : a))
    );
  };

  const handleAddSermon = (sermon: Sermon) => {
    setSermons((prev) => [sermon, ...prev]);
  };

  const handleToggleJoinPlace = (placeId: string) => {
    setJoinedPlaceIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const handleLogin = (session: UserSession) => {
    setCurrentSession(session);
    setUserRole(session.role);
    if (session.role === 'super_admin' || session.role === 'masjid_admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('nearby_app');
    }
  };

  const handleRequestAdminAccount = (account: MasjidAdminAccount) => {
    setAdminAccounts((prev) => [account, ...prev]);
  };

  const pendingApprovalsCount =
    worshipPlaces.filter((p) => p.approvalStatus === 'pending').length +
    adminAccounts.filter((a) => a.status === 'pending').length;

  // Filtered lists
  const filteredPlaces = worshipPlaces.filter((place) => {
    const matchesReligion = religionFilter === 'All' || place.religion.toLowerCase() === religionFilter.toLowerCase();
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.preacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesReligion && matchesSearch;
  });

  const filteredSermons = sermons.filter((sermon) => {
    const matchesReligion = religionFilter === 'All' || sermon.religion.toLowerCase() === religionFilter.toLowerCase();
    const matchesSearch =
      sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.placeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.speakerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesReligion && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-emerald-500 selection:text-stone-950">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        userRole={userRole}
        setUserRole={setUserRole}
        pendingApprovalsCount={pendingApprovalsCount}
        currentSession={currentSession}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* VIEW 0: NEARBY MASJIDS APP */}
        {activeTab === 'nearby_app' && (
          <NearbyMasjidApp
            worshipPlaces={worshipPlaces}
            sermons={sermons}
            joinedPlaceIds={joinedPlaceIds}
            onToggleJoin={handleToggleJoinPlace}
            selectedLanguage={selectedLanguage}
            onSelectSermon={(s) => setSelectedSermonForModal(s)}
          />
        )}

        {/* VIEW 1: EXPLORE PLACES & SERMONS */}
        {activeTab === 'explore' && (
          <div className="space-y-8">
            
            {/* Hero Welcome Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/60 border border-stone-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Global Multilingual Faith Gateway
                </div>

                <h2 className="text-2xl sm:text-4xl font-bold font-serif text-stone-100 tracking-tight leading-tight">
                  Connect with Local Worship Places & Receive Sermons in Your Language
                </h2>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
                  Join Mosques, Churches, Temples, Synagogues, or Gurdwaras near you. Whenever an Imam, Pastor, or Priest uploads a Friday Khutbah or Sunday Sermon, receive instant AI translations via WhatsApp and Email in{' '}
                  <span className="text-emerald-400 font-bold underline decoration-emerald-500/50">
                    {selectedLanguage.name} ({selectedLanguage.nativeName})
                  </span>{' '}
                  or any language of your choice.
                </p>

                {/* Quick Worshipper Stats Pills */}
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-400">
                  <span className="flex items-center gap-1.5 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    {worshipPlaces.length} Verified Prayer Centers
                  </span>

                  <span className="flex items-center gap-1.5 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    {sermons.length} Multilingual Sermons
                  </span>

                  <button
                    onClick={() => setActiveTab('map')}
                    className="flex items-center gap-1.5 bg-purple-950/80 hover:bg-purple-900/80 px-3 py-1.5 rounded-xl border border-purple-500/40 text-purple-300 font-bold transition-all shadow-md"
                  >
                    <Compass className="w-4 h-4 text-purple-400" />
                    Spatial D3 Map Grid
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-stone-900 p-4 rounded-2xl border border-stone-800 shadow-lg">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Masjid name, city (e.g. Manchester, Chicago), Imam/Preacher, or topic..."
                    className="w-full bg-stone-950 text-xs sm:text-sm text-stone-200 pl-10 pr-4 py-2.5 rounded-xl border border-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-stone-500"
                  />
                </div>

                {/* Religion Filter Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                  <span className="text-xs text-stone-400 font-medium mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-stone-500" /> Religion:
                  </span>
                  {['All', 'Islam', 'Christianity', 'Hinduism', 'Judaism', 'Sikhism'].map((rel) => (
                    <button
                      key={rel}
                      onClick={() => setReligionFilter(rel)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        religionFilter === rel
                          ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-950/40'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      {rel === 'Islam' ? '🕌 Mosque' : rel === 'Christianity' ? '⛪ Church' : rel === 'Hinduism' ? '🛕 Temple' : rel === 'Judaism' ? '✡️ Synagogue' : rel === 'Sikhism' ? 'ੴ Gurdwara' : 'All Faiths'}
                    </button>
                  ))}
                </div>

              </div>

              {/* View Toggle (All vs Places vs Sermons) */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveExploreView('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeExploreView === 'all'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    All Overview
                  </button>
                  <button
                    onClick={() => setActiveExploreView('places')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeExploreView === 'places'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Worship Places ({filteredPlaces.length})
                  </button>
                  <button
                    onClick={() => setActiveExploreView('sermons')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeExploreView === 'sermons'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Sermons ({filteredSermons.length})
                  </button>
                </div>

                <span className="text-xs text-stone-400">
                  Current Target Language: <span className="font-bold text-emerald-400">{selectedLanguage.flag} {selectedLanguage.name}</span>
                </span>
              </div>
            </div>

            {/* SECTION: WORSHIP PLACES GRID */}
            {(activeExploreView === 'all' || activeExploreView === 'places') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-serif text-stone-100 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    Prayer Places & Congregations
                  </h3>
                  <span className="text-xs text-stone-400">
                    Join your local Masjid or Temple to receive AI-translated khutbahs
                  </span>
                </div>

                {filteredPlaces.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400 space-y-2">
                    <p className="text-sm">No prayer places found matching filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlaces.map((place) => (
                      <WorshipPlaceCard
                        key={place.id}
                        place={place}
                        sermons={sermons}
                        selectedLanguage={selectedLanguage}
                        onSelectSermon={(s) => setSelectedSermonForModal(s)}
                        onJoinPlace={handleToggleJoinPlace}
                        isJoined={joinedPlaceIds.includes(place.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION: RECENT SERMONS GRID */}
            {(activeExploreView === 'all' || activeExploreView === 'sermons') && (
              <div className="space-y-4 pt-4 border-t border-stone-800/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-serif text-stone-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    Recent Sermons & Khutbahs (AI Multilingual Translation)
                  </h3>
                  <span className="text-xs text-stone-400">
                    Click any sermon to read in {selectedLanguage.name}
                  </span>
                </div>

                {filteredSermons.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400">
                    No sermons found matching query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSermons.map((sermon) => (
                      <SermonCard
                        key={sermon.id}
                        sermon={sermon}
                        selectedLanguage={selectedLanguage}
                        onOpenViewer={(s) => setSelectedSermonForModal(s)}
                        onBroadcastTrigger={(s) => setSelectedSermonForBroadcast(s)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: D3 SPATIAL COORDINATE MAP GRID */}
        {activeTab === 'map' && (
          <WorshipMapGrid
            worshipPlaces={worshipPlaces}
            joinedPlaceIds={joinedPlaceIds}
            onToggleJoin={handleToggleJoinPlace}
            onSelectPlace={(place) => {
              // Option to focus or view place details
            }}
          />
        )}

        {/* VIEW 3: LOCATION-BASED PRAYER & MASS TIMES */}
        {activeTab === 'prayer-times' && (
          <PrayerTimes
            worshipPlaces={worshipPlaces}
            joinedPlaceIds={joinedPlaceIds}
            selectedLanguageName={selectedLanguage.name}
          />
        )}

        {/* VIEW 2: ADMIN / PRAYER PLACE MANAGEMENT */}
        {activeTab === 'admin' && (
          <AdminPortal
            userRole={userRole}
            worshipPlaces={worshipPlaces}
            sermons={sermons}
            adminAccounts={adminAccounts}
            onAddPlace={handleAddPlace}
            onApprovePlace={handleApprovePlace}
            onRejectPlace={handleRejectPlace}
            onApproveAdminAccount={handleApproveAdminAccount}
            onRejectAdminAccount={handleRejectAdminAccount}
            onAddSermon={handleAddSermon}
            onSelectSermon={(s) => setSelectedSermonForModal(s)}
          />
        )}

        {/* VIEW 3: BROADCAST & DELIVERY LOGS */}
        {activeTab === 'broadcast' && <BroadcastLogsView />}

        {/* VIEW 4: PHASE 2 LIVE TRANSLATION ROOM */}
        {activeTab === 'live' && (
          <LiveStreamRoom
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-800 bg-stone-900/80 py-8 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <span className="font-bold text-stone-200 font-serif">Global Sermon Gateway</span>
            <span>• Universal Multilingual Worship Platform</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>Powered by Gemini AI Multilingual Engine</span>
            <span>•</span>
            <span>Supporting All Major Faiths & Languages</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: SERMON READER / TRANSLATOR */}
      {selectedSermonForModal && (
        <SermonViewerModal
          sermon={selectedSermonForModal}
          selectedLanguage={selectedLanguage}
          onClose={() => setSelectedSermonForModal(null)}
          onBroadcastTrigger={(s) => {
            setSelectedSermonForModal(null);
            setSelectedSermonForBroadcast(s);
          }}
        />
      )}

      {/* MODAL 2: BROADCAST TRIGGER */}
      {selectedSermonForBroadcast && (
        <BroadcastModal
          sermon={selectedSermonForBroadcast}
          worshipPlace={worshipPlaces.find((p) => p.id === selectedSermonForBroadcast.placeId)}
          onClose={() => setSelectedSermonForBroadcast(null)}
          onSuccess={() => setActiveTab('broadcast')}
        />
      )}

      {/* MODAL 3: AUTH & PROPERTY REGISTRATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        worshipPlaces={worshipPlaces}
        currentSession={currentSession}
        onLogin={handleLogin}
        onRequestAdminAccount={handleRequestAdminAccount}
        onRegisterPlace={handleAddPlace}
        onToggleJoinPlace={handleToggleJoinPlace}
        joinedPlaceIds={joinedPlaceIds}
      />

    </div>
  );
}
