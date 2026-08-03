import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  PlusCircle,
  Clock,
  Send,
  Sparkles,
  BookOpen,
  Volume2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  Bell,
  Check,
  Share2,
} from 'lucide-react';
import { WorshipPlace, Sermon, Religion, LanguageOption } from '../types';

interface NearbyMasjidAppProps {
  worshipPlaces: WorshipPlace[];
  sermons: Sermon[];
  joinedPlaceIds: string[];
  onToggleJoin: (placeId: string) => void;
  selectedLanguage: LanguageOption;
  onSelectSermon: (sermon: Sermon) => void;
}

// Preset Reference Locations
const PRESET_USER_LOCATIONS = [
  { name: 'Manchester, UK', lat: 53.4808, lng: -2.2426 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Chicago, USA', lat: 41.8781, lng: -87.6298 },
  { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Melbourne, Australia', lat: -37.8136, lng: 144.9631 },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
];

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const NearbyMasjidApp: React.FC<NearbyMasjidAppProps> = ({
  worshipPlaces,
  sermons,
  joinedPlaceIds,
  onToggleJoin,
  selectedLanguage,
  onSelectSermon,
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'joined' | 'sermons'>('discover');

  // User location
  const [userLoc, setUserLoc] = useState({
    lat: 53.4808,
    lng: -2.2426,
    name: 'Manchester, UK',
  });
  const [isLocating, setIsLocating] = useState(false);

  // Filters
  const [selectedReligion, setSelectedReligion] = useState<string>('Islam'); // Default focus on Islam/Masjid
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaceForDetail, setSelectedPlaceForDetail] = useState<WorshipPlace | null>(null);
  const [notificationModalOpen, setNotificationModalOpen] = useState<string | null>(null);

  // GPS Locate Action
  const handleGPSLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My Current GPS Location',
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  // Approved Places calculated with distance
  const placesWithDistance = useMemo(() => {
    return worshipPlaces
      .filter((p) => p.approvalStatus !== 'rejected') // show approved & pending
      .map((p) => {
        let lat = p.lat;
        let lng = p.lng;
        if (lat === undefined || lng === undefined) {
          if (p.city.toLowerCase().includes('manchester')) {
            lat = 53.4808;
            lng = -2.2426;
          } else if (p.city.toLowerCase().includes('chicago')) {
            lat = 41.8781;
            lng = -87.6298;
          } else if (p.city.toLowerCase().includes('london')) {
            lat = 51.5186;
            lng = -0.0612;
          } else if (p.city.toLowerCase().includes('toronto')) {
            lat = 43.6532;
            lng = -79.3832;
          } else if (p.city.toLowerCase().includes('melbourne')) {
            lat = -37.8136;
            lng = 144.9631;
          } else {
            lat = 52.4862;
            lng = -1.8904;
          }
        }
        const dist = calculateHaversineDistanceKm(userLoc.lat, userLoc.lng, lat, lng);
        return {
          ...p,
          lat,
          lng,
          distanceKm: dist,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [worshipPlaces, userLoc]);

  // Filtered List
  const filteredPlaces = useMemo(() => {
    return placesWithDistance.filter((p) => {
      const matchesReligion =
        selectedReligion === 'All' || p.religion === selectedReligion;
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.preacherName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesReligion && matchesSearch;
    });
  }, [placesWithDistance, selectedReligion, searchQuery]);

  // Joined Places
  const joinedPlaces = useMemo(() => {
    return placesWithDistance.filter((p) => joinedPlaceIds.includes(p.id));
  }, [placesWithDistance, joinedPlaceIds]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* MOBILE APP TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Worshipper Companion App
            </div>

            <h2 className="text-xl sm:text-3xl font-bold font-serif text-stone-100 tracking-tight">
              Find & Join Nearby Masjids & Congregations
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
              Discover verified local Masjids, follow live Jummah Khutbah broadcasts in your native language ({selectedLanguage.name}), and receive automated WhatsApp & Email sermon notifications.
            </p>
          </div>

          {/* Quick Joined Count Pill */}
          <div className="bg-stone-900/90 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3 shadow-xl flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              {joinedPlaceIds.length}
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-stone-400 font-semibold uppercase">Joined Masjids</p>
              <p className="text-xs font-bold text-stone-200">Receiving Live Dispatches</p>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-3.5 border-t border-stone-800/80 overflow-x-auto no-scrollbar max-w-full pb-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'discover'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Discover Nearby ({filteredPlaces.length})
          </button>

          <button
            onClick={() => setActiveTab('joined')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'joined'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            My Joined Masjids ({joinedPlaces.length})
          </button>

          <button
            onClick={() => setActiveTab('sermons')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'sermons'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Sermon Feed ({sermons.length})
          </button>
        </div>
      </div>

      {/* DISCOVER TAB */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          
          {/* SEARCH & LOCATION FILTER BAR */}
          <div className="bg-stone-900 p-5 rounded-2xl border border-stone-800 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              
              {/* Location Picker */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="text-stone-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Your Location:
                </span>

                {PRESET_USER_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() =>
                      setUserLoc({ lat: loc.lat, lng: loc.lng, name: loc.name })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      userLoc.name === loc.name
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {loc.name.split(',')[0]}
                  </button>
                ))}

                <button
                  onClick={handleGPSLocate}
                  disabled={isLocating}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1 whitespace-nowrap"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Locating...' : 'GPS Detect'}
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Masjid name, Imam, city..."
                  className="w-full bg-stone-950 text-xs text-stone-200 pl-9 pr-3 py-2 rounded-xl border border-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

            </div>

            {/* Filter by Religion / Faith Category */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs border-t border-stone-800/80 pt-3">
              <span className="text-stone-400 font-medium flex items-center gap-1 whitespace-nowrap mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-400" /> Category:
              </span>

              {['Islam', 'All', 'Christianity', 'Hinduism', 'Judaism', 'Sikhism'].map((rel) => {
                const isSelected = selectedReligion === rel;
                return (
                  <button
                    key={rel}
                    onClick={() => setSelectedReligion(rel)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-500 text-stone-950 shadow'
                        : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {rel === 'Islam' ? '🕌 Mosques & Masjids' : rel === 'All' ? '🌟 All Venues' : rel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MASJID CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map((place) => {
              const isJoined = joinedPlaceIds.includes(place.id);
              const isApproved = place.approvalStatus === 'approved' || !place.approvalStatus;

              return (
                <div
                  key={place.id}
                  className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Cover Image */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                      {/* Distance Badge */}
                      <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-amber-400" />
                        {place.distanceKm.toLocaleString()} km away
                      </div>

                      {/* Verification Status */}
                      <div className="absolute top-3 right-3">
                        {isApproved ? (
                          <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
                          </span>
                        ) : (
                          <span className="bg-amber-950/90 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            Pending Review
                          </span>
                        )}
                      </div>

                      {/* Place Name & Location on Image */}
                      <div className="absolute bottom-3 left-3 right-3 space-y-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {place.venueType}
                        </span>
                        <h3 className="text-base font-bold text-stone-100 font-serif leading-tight">
                          {place.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body Details */}
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-stone-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                        {place.address}
                      </p>

                      <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Resident Imam:</span>
                          <span className="font-semibold text-stone-200">
                            {place.preacherTitle} {place.preacherName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Congregation Day:</span>
                          <span className="font-bold text-amber-400">
                            {place.congregationDay} Jummah
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Followers:</span>
                          <span className="font-mono text-stone-300">
                            {place.followerCount.toLocaleString()} Worshippers
                          </span>
                        </div>
                      </div>

                      {/* Facility Tags */}
                      {place.facilities && place.facilities.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {place.facilities.slice(0, 4).map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-stone-800 text-stone-300 border border-stone-700"
                            >
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => onToggleJoin(place.id)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isJoined
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-amber-400" /> Joined & Following
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" /> Join Masjid
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedPlaceForDetail(place)}
                      className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-semibold"
                      title="View Details & Timings"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JOINED MASJIDS TAB */}
      {activeTab === 'joined' && (
        <div className="space-y-6">
          {joinedPlaces.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
              <Building2 className="w-12 h-12 text-stone-600 mx-auto" />
              <h3 className="text-lg font-bold text-stone-200 font-serif">No Joined Masjids Yet</h3>
              <p className="text-xs text-stone-400">
                Switch to the "Discover Nearby" tab to find local Masjids near you and click "Join Masjid" to receive sermon translations on WhatsApp or Email.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-lg"
              >
                Discover Nearby Masjids
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bg-stone-900 rounded-2xl border border-amber-500/40 p-5 shadow-xl space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-700"
                    />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Joined Congregation
                      </span>
                      <h4 className="font-bold text-stone-100 text-sm font-serif mt-1">
                        {place.name}
                      </h4>
                      <p className="text-xs text-stone-400">{place.city}, {place.country}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-stone-300">
                      <span>Live Broadcasts:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Bell className="w-3 h-3" /> Enabled ({selectedLanguage.name})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-300">
                      <span>Imam / Preacher:</span>
                      <span className="font-semibold">{place.preacherName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleJoin(place.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                    >
                      Leave Masjid
                    </button>
                    <button
                      onClick={() => setSelectedPlaceForDetail(place)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      View Timetable
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SERMON FEED TAB */}
      {activeTab === 'sermons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sermons.map((sermon) => (
            <div
              key={sermon.id}
              onClick={() => onSelectSermon(sermon)}
              className="bg-stone-900 rounded-2xl border border-stone-800 p-5 shadow-xl space-y-3 cursor-pointer hover:border-emerald-500/40 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sermon.religion} • {sermon.originalLanguage}
                </span>
                <span className="text-stone-400 font-mono">{sermon.date}</span>
              </div>

              <h3 className="text-base font-bold text-stone-100 font-serif leading-snug">
                {sermon.title}
              </h3>

              <p className="text-xs text-stone-400 line-clamp-2">
                {sermon.summary}
              </p>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>By {sermon.speakerName}</span>
                <span className="text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                  Translate in {selectedLanguage.name} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PLACE DETAIL MODAL */}
      {selectedPlaceForDetail && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPlaceForDetail.imageUrl}
                  alt={selectedPlaceForDetail.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-stone-700"
                />
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedPlaceForDetail.religion}
                  </span>
                  <h3 className="font-bold text-stone-100 text-base font-serif mt-1">
                    {selectedPlaceForDetail.name}
                  </h3>
                  <p className="text-xs text-stone-400">{selectedPlaceForDetail.city}, {selectedPlaceForDetail.country}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlaceForDetail(null)}
                className="text-stone-400 hover:text-stone-200 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 font-serif leading-relaxed">
              {selectedPlaceForDetail.description}
            </p>

            <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2 text-xs">
              <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-2">
                🕌 Masjid Information & Contacts
              </h4>
              <div className="flex justify-between text-stone-300">
                <span>Address:</span>
                <span className="font-semibold text-right">{selectedPlaceForDetail.address}</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Contact Email:</span>
                <span className="font-mono text-emerald-400">{selectedPlaceForDetail.contactEmail}</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Phone / WhatsApp:</span>
                <span className="font-mono text-stone-200">{selectedPlaceForDetail.contactPhone}</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Sermon Languages:</span>
                <span className="font-semibold">{selectedPlaceForDetail.languagesOffered.join(', ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onToggleJoin(selectedPlaceForDetail.id);
                  setSelectedPlaceForDetail(null);
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                  joinedPlaceIds.includes(selectedPlaceForDetail.id)
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {joinedPlaceIds.includes(selectedPlaceForDetail.id) ? '✓ Joined' : '+ Join Masjid'}
              </button>

              <button
                onClick={() => setSelectedPlaceForDetail(null)}
                className="px-5 py-3 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
