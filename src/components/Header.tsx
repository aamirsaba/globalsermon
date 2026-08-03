import React from 'react';
import {
  Globe,
  Radio,
  Building2,
  BookOpen,
  Send,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Clock,
  Compass,
  Crown,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageOption, UserSession } from '../types';
import { User, LogIn } from 'lucide-react';

export type UserRole = 'worshipper' | 'masjid_admin' | 'super_admin';
export type ActiveTab = 'explore' | 'nearby_app' | 'map' | 'prayer-times' | 'admin' | 'broadcast' | 'live';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedLanguage: LanguageOption;
  setSelectedLanguage: (lang: LanguageOption) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  pendingApprovalsCount?: number;
  currentSession: UserSession;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedLanguage,
  setSelectedLanguage,
  userRole,
  setUserRole,
  pendingApprovalsCount = 0,
  currentSession,
  onOpenAuthModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-xl w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2.5">
          
          {/* Brand Logo & Title */}
          <div className="flex flex-wrap items-center justify-between gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-emerald-950/40 flex-shrink-0">
                <Globe className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="text-sm sm:text-lg font-bold tracking-tight text-stone-100 font-serif leading-tight">
                    Global Sermon Gateway
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Multi-Faith AI
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 hidden sm:block truncate">
                  Universal Multilingual Masjid & Sermon Distribution Platform
                </p>
              </div>
            </div>

            {/* Mobile Role Switcher */}
            <div className="md:hidden flex items-center gap-0.5 bg-stone-800/90 p-1 rounded-lg border border-stone-700 flex-shrink-0">
              <button
                onClick={() => setUserRole('worshipper')}
                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-all ${
                  userRole === 'worshipper'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                User
              </button>
              <button
                onClick={() => {
                  setUserRole('masjid_admin');
                  setActiveTab('admin');
                }}
                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-all ${
                  userRole === 'masjid_admin'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Masjid
              </button>
              <button
                onClick={() => {
                  setUserRole('super_admin');
                  setActiveTab('admin');
                }}
                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-all ${
                  userRole === 'super_admin'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Superuser
              </button>
            </div>
          </div>

          {/* Controls: Target Language Selector & Role Switcher */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap w-full md:w-auto">
            
            {/* Preferred Language Picker */}
            <div className="flex items-center gap-1.5 bg-stone-800/90 px-2 py-1 rounded-xl border border-stone-700 shadow-inner min-w-0">
              <span className="text-xs text-stone-400 flex items-center gap-1 font-medium whitespace-nowrap">
                <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="hidden sm:inline">Translate To:</span>
              </span>
              <select
                value={selectedLanguage.code}
                onChange={(e) => {
                  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                  if (lang) setSelectedLanguage(lang);
                }}
                className="bg-stone-900 text-emerald-300 font-semibold text-xs rounded-lg px-2 py-1 border border-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[130px] sm:max-w-none truncate"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-stone-900 text-stone-200">
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Sign In & Profile Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-750 border border-amber-500/30 text-stone-200 transition-all text-xs font-semibold shadow-md flex-shrink-0"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold flex-shrink-0">
                {currentSession.role === 'super_admin' ? (
                  <Crown className="w-3 h-3 text-amber-300" />
                ) : currentSession.role === 'masjid_admin' ? (
                  <Building2 className="w-3 h-3 text-amber-300" />
                ) : (
                  <User className="w-3 h-3 text-emerald-400" />
                )}
              </div>
              <div className="text-left hidden sm:block max-w-[120px] truncate">
                <div className="text-[11px] font-bold text-stone-100 leading-none truncate">
                  {currentSession.name || 'Sign In / Register'}
                </div>
                <div className="text-[9px] text-amber-400 font-medium leading-tight truncate">
                  {currentSession.role === 'super_admin'
                    ? 'Superuser Admin'
                    : currentSession.role === 'masjid_admin'
                    ? currentSession.assignedPlaceName || 'Masjid Admin'
                    : currentSession.assignedPlaceName || 'Worshipper User'}
                </div>
              </div>
              <span className="sm:hidden text-stone-200 text-xs font-medium">
                {currentSession.isLoggedIn ? (currentSession.name?.split(' ')[0] || 'Account') : 'Sign In'}
              </span>
              <LogIn className="w-3 h-3 text-stone-400 flex-shrink-0" />
            </button>

            {/* Role Switcher Pills (Desktop) */}
            <div className="hidden md:flex items-center bg-stone-800/90 p-1 rounded-xl border border-stone-700 shadow-inner gap-1">
              <button
                onClick={() => {
                  setUserRole('worshipper');
                  if (activeTab === 'admin') setActiveTab('nearby_app');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  userRole === 'worshipper'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Worshipper App
              </button>

              <button
                onClick={() => {
                  setUserRole('masjid_admin');
                  setActiveTab('admin');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  userRole === 'masjid_admin'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Masjid Admin
              </button>

              <button
                onClick={() => {
                  setUserRole('super_admin');
                  setActiveTab('admin');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                  userRole === 'super_admin'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                Superuser Admin
                {pendingApprovalsCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center -ml-0.5">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 border-t border-stone-800/80 no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('nearby_app')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'nearby_app'
                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            📲 Nearby Masjids & App
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'explore'
                ? 'bg-stone-800 text-emerald-400 border border-emerald-500/30 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Explore Places & Sermons
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'map'
                ? 'bg-stone-800 text-purple-300 border border-purple-500/30 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-400" />
            D3 Map Grid
          </button>

          <button
            onClick={() => setActiveTab('prayer-times')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'prayer-times'
                ? 'bg-stone-800 text-indigo-300 border border-indigo-500/30 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            Prayer & Mass Times
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'admin'
                ? 'bg-stone-800 text-amber-400 border border-amber-500/30 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            {userRole === 'super_admin' ? (
              <>
                <Crown className="w-4 h-4 text-purple-400" />
                Superuser Admin Portal
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-amber-400" />
                Masjid Admin Portal
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'broadcast'
                ? 'bg-stone-800 text-teal-300 border border-teal-500/30 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Send className="w-4 h-4 text-teal-400" />
            WhatsApp & Email Logs
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'live'
                ? 'bg-stone-800 text-rose-400 border border-rose-500/30 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Radio className="w-4 h-4 text-rose-400" />
            Live Translation Room
          </button>
        </div>

      </div>
    </header>
  );
};
