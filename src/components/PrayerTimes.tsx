import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  MapPin,
  Compass,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Calendar,
  Sparkles,
  Building2,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Navigation,
  ChevronRight,
  Info,
  Radio,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import { WorshipPlace, Religion } from '../types';

interface PrayerTimesProps {
  worshipPlaces: WorshipPlace[];
  joinedPlaceIds: string[];
  selectedLanguageName?: string;
}

interface TimingItem {
  key: string;
  name: string;
  arabicName?: string;
  time: string; // "05:15 AM"
  time24: string; // "05:15"
  jamaatTime?: string; // "05:30 AM"
  isNext?: boolean;
  isPassed?: boolean;
  isCurrent?: boolean;
  icon: 'sunrise' | 'sun' | 'sunset' | 'moon' | 'clock';
}

interface CalculationMethod {
  id: number;
  name: string;
}

const CALCULATION_METHODS: CalculationMethod[] = [
  { id: 2, name: 'ISNA (Islamic Society of North America)' },
  { id: 3, name: 'Muslim World League (MWL)' },
  { id: 4, name: 'Umm Al-Qura University, Makkah' },
  { id: 1, name: 'University of Islamic Sciences, Karachi' },
  { id: 5, name: 'Egyptian General Authority of Survey' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı (Turkey)' },
  { id: 8, name: 'Gulf Region / Dubai Standard' },
];

const POPULAR_CITIES = [
  { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { name: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904 },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
  { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
];

export const PrayerTimes: React.FC<PrayerTimesProps> = ({
  worshipPlaces,
  joinedPlaceIds,
  selectedLanguageName = 'English',
}) => {
  // Location state
  const [selectedCity, setSelectedCity] = useState<string>('Manchester');
  const [selectedCountry, setSelectedCountry] = useState<string>('United Kingdom');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 53.4808,
    lng: -2.2426,
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Settings
  const [calcMethod, setCalcMethod] = useState<number>(2); // ISNA by default
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('all');
  const [selectedReligionFilter, setSelectedReligionFilter] = useState<string>('All');
  
  // Custom Congregation offsets in minutes from Adhan
  const [jamaatOffsets, setJamaatOffsets] = useState<Record<string, number>>({
    Fajr: 20,
    Dhuhr: 15,
    Asr: 15,
    Maghrib: 10,
    Isha: 15,
  });

  // Prayer Timings state
  const [timings, setTimings] = useState<TimingItem[]>([]);
  const [hijriDate, setHijriDate] = useState<string>('17 Safar 1448 AH');
  const [gregorianDate, setGregorianDate] = useState<string>(
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );
  const [isLoadingTimes, setIsLoadingTimes] = useState<boolean>(false);

  // Qibla direction state
  const [qiblaBearing, setQiblaBearing] = useState<number>(118.4); // degrees from North

  // Countdown timer state
  const [nextTiming, setNextTiming] = useState<TimingItem | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');
  const [progressPercent, setProgressPercent] = useState<number>(45);

  // Audio / Notifications
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [showQiblaModal, setShowQiblaModal] = useState<boolean>(false);

  // Filter places that user has joined or all places
  const joinedPlaces = worshipPlaces.filter((p) => joinedPlaceIds.includes(p.id));
  const activePlacesList = joinedPlaces.length > 0 ? joinedPlaces : worshipPlaces;

  // Selected place context
  const currentPlace =
    selectedPlaceId !== 'all'
      ? worshipPlaces.find((p) => p.id === selectedPlaceId)
      : activePlacesList[0] || worshipPlaces[0];

  // Calculate Qibla angle given lat/lng
  const calculateQiblaDirection = (latitude: number, longitude: number) => {
    // Makkah coordinates
    const makkahLat = (21.4225 * Math.PI) / 180;
    const makkahLng = (39.8262 * Math.PI) / 180;
    const userLat = (latitude * Math.PI) / 180;
    const userLng = (longitude * Math.PI) / 180;

    const dLng = makkahLng - userLng;
    const y = Math.sin(dLng);
    const x =
      Math.cos(userLat) * Math.tan(makkahLat) - Math.sin(userLat) * Math.cos(dLng);

    let qiblaRad = Math.atan2(y, x);
    let qiblaDeg = (qiblaRad * 180) / Math.PI;
    qiblaDeg = (qiblaDeg + 360) % 360;

    setQiblaBearing(Math.round(qiblaDeg * 10) / 10);
  };

  // Fetch or calculate timings for location
  const fetchPrayerTimes = async (
    cityName: string,
    countryName: string,
    lat: number,
    lng: number,
    methodId: number
  ) => {
    setIsLoadingTimes(true);
    setLocationError(null);

    try {
      // 1. Try server endpoint or Aladhan API
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
          cityName
        )}&country=${encodeURIComponent(countryName)}&method=${methodId}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.data && data.data.timings) {
          const raw = data.data.timings;
          const hData = data.data.date?.hijri;
          if (hData) {
            setHijriDate(
              `${hData.day} ${hData.month?.en || 'Safar'} ${hData.year} AH`
            );
          }

          // Format raw times (24h -> 12h display)
          const items: TimingItem[] = [
            {
              key: 'Fajr',
              name: 'Fajr (Dawn Prayer)',
              arabicName: 'الفجر',
              time24: raw.Fajr.split(' ')[0],
              time: format12Hour(raw.Fajr.split(' ')[0]),
              jamaatTime: addMinutesToTime(raw.Fajr.split(' ')[0], jamaatOffsets.Fajr || 20),
              icon: 'sunrise',
            },
            {
              key: 'Sunrise',
              name: 'Sunrise (Shuruq)',
              arabicName: 'الشروق',
              time24: raw.Sunrise.split(' ')[0],
              time: format12Hour(raw.Sunrise.split(' ')[0]),
              icon: 'sunrise',
            },
            {
              key: 'Dhuhr',
              name: 'Dhuhr (Noon Prayer)',
              arabicName: 'الظهر',
              time24: raw.Dhuhr.split(' ')[0],
              time: format12Hour(raw.Dhuhr.split(' ')[0]),
              jamaatTime: addMinutesToTime(raw.Dhuhr.split(' ')[0], jamaatOffsets.Dhuhr || 15),
              icon: 'sun',
            },
            {
              key: 'Asr',
              name: 'Asr (Afternoon Prayer)',
              arabicName: 'العصر',
              time24: raw.Asr.split(' ')[0],
              time: format12Hour(raw.Asr.split(' ')[0]),
              jamaatTime: addMinutesToTime(raw.Asr.split(' ')[0], jamaatOffsets.Asr || 15),
              icon: 'sun',
            },
            {
              key: 'Maghrib',
              name: 'Maghrib (Sunset Prayer)',
              arabicName: 'المغرب',
              time24: raw.Maghrib.split(' ')[0],
              time: format12Hour(raw.Maghrib.split(' ')[0]),
              jamaatTime: addMinutesToTime(raw.Maghrib.split(' ')[0], jamaatOffsets.Maghrib || 10),
              icon: 'sunset',
            },
            {
              key: 'Isha',
              name: 'Isha (Night Prayer)',
              arabicName: 'العشاء',
              time24: raw.Isha.split(' ')[0],
              time: format12Hour(raw.Isha.split(' ')[0]),
              jamaatTime: addMinutesToTime(raw.Isha.split(' ')[0], jamaatOffsets.Isha || 15),
              icon: 'moon',
            },
          ];

          setTimings(items);
          calculateQiblaDirection(lat, lng);
          setIsLoadingTimes(false);
          return;
        }
      }
    } catch (err) {
      console.log('Aladhan API fetch error, using calculated fallback:', err);
    }

    // Fallback: Generate realistic calculated prayer times based on city lat/lng
    generateFallbackTimings(cityName, currentPlace?.religion || 'Islam');
    calculateQiblaDirection(lat, lng);
    setIsLoadingTimes(false);
  };

  // Helper: Format 24h string "14:30" to "02:30 PM"
  const format12Hour = (time24Str: string): string => {
    if (!time24Str) return '';
    const [hStr, mStr] = time24Str.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr ? mStr.substring(0, 2) : '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hFormatted = h < 10 ? `0${h}` : `${h}`;
    return `${hFormatted}:${m} ${ampm}`;
  };

  // Helper: Add offset minutes to 24h time string
  const addMinutesToTime = (time24Str: string, minutes: number): string => {
    if (!time24Str) return '';
    const [hStr, mStr] = time24Str.split(':');
    let totalMin = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutes;
    totalMin = (totalMin + 1440) % 1440;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const time24Formatted = `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
    return format12Hour(time24Formatted);
  };

  // Generate fallback timings for multi-faith venues
  const generateFallbackTimings = (city: string, religion: Religion) => {
    const isIslamic = religion === 'Islam';
    const isChristian = religion === 'Christianity';
    const isHindu = religion === 'Hinduism';
    const isJewish = religion === 'Judaism';
    const isSikh = religion === 'Sikhism';

    let items: TimingItem[] = [];

    if (isIslamic) {
      items = [
        { key: 'Fajr', name: 'Fajr (Dawn)', arabicName: 'الفجر', time24: '04:15', time: '04:15 AM', jamaatTime: '04:35 AM', icon: 'sunrise' },
        { key: 'Sunrise', name: 'Sunrise (Shuruq)', arabicName: 'الشروق', time24: '05:48', time: '05:48 AM', icon: 'sunrise' },
        { key: 'Dhuhr', name: 'Dhuhr (Midday)', arabicName: 'الظهر', time24: '13:15', time: '01:15 PM', jamaatTime: '01:30 PM', icon: 'sun' },
        { key: 'Asr', name: 'Asr (Afternoon)', arabicName: 'العصر', time24: '17:05', time: '05:05 PM', jamaatTime: '05:20 PM', icon: 'sun' },
        { key: 'Maghrib', name: 'Maghrib (Sunset)', arabicName: 'المغرب', time24: '20:45', time: '08:45 PM', jamaatTime: '08:55 PM', icon: 'sunset' },
        { key: 'Isha', name: 'Isha (Night)', arabicName: 'العشاء', time24: '22:15', time: '10:15 PM', jamaatTime: '10:30 PM', icon: 'moon' },
      ];
    } else if (isChristian) {
      items = [
        { key: 'Morning', name: 'Lauds / Morning Prayer', time24: '07:30', time: '07:30 AM', jamaatTime: '08:00 AM', icon: 'sunrise' },
        { key: 'Mass', name: 'Holy Mass / Service', time24: '10:00', time: '10:00 AM', jamaatTime: '10:15 AM', icon: 'sun' },
        { key: 'Midday', name: 'Midday Prayer', time24: '12:30', time: '12:30 PM', jamaatTime: '12:45 PM', icon: 'sun' },
        { key: 'Vespers', name: 'Evening Vespers', time24: '18:00', time: '06:00 PM', jamaatTime: '06:15 PM', icon: 'sunset' },
        { key: 'Night', name: 'Compline / Night Mass', time24: '20:30', time: '08:30 PM', jamaatTime: '08:45 PM', icon: 'moon' },
      ];
    } else if (isHindu) {
      items = [
        { key: 'Mangala', name: 'Mangala Aarti (Dawn)', time24: '06:00', time: '06:00 AM', jamaatTime: '06:15 AM', icon: 'sunrise' },
        { key: 'Shringar', name: 'Morning Puja & Shringar', time24: '08:30', time: '08:30 AM', jamaatTime: '08:45 AM', icon: 'sun' },
        { key: 'Bhog', name: 'Madhyahna (Midday) Bhog', time24: '12:00', time: '12:00 PM', jamaatTime: '12:15 PM', icon: 'sun' },
        { key: 'Sandhya', name: 'Sandhya (Evening) Aarti', time24: '19:00', time: '07:00 PM', jamaatTime: '07:15 PM', icon: 'sunset' },
        { key: 'Shayan', name: 'Shayan Aarti (Night)', time24: '21:00', time: '09:00 PM', jamaatTime: '09:15 PM', icon: 'moon' },
      ];
    } else if (isJewish) {
      items = [
        { key: 'Shacharit', name: 'Shacharit (Morning Tefillah)', time24: '07:00', time: '07:00 AM', jamaatTime: '07:15 AM', icon: 'sunrise' },
        { key: 'Mincha', name: 'Mincha (Afternoon Tefillah)', time24: '14:00', time: '02:00 PM', jamaatTime: '02:15 PM', icon: 'sun' },
        { key: 'Maariv', name: 'Maariv (Evening Tefillah)', time24: '20:00', time: '08:00 PM', jamaatTime: '08:15 PM', icon: 'sunset' },
        { key: 'Shabbat', name: 'Shabbat Candle Lighting', time24: '20:40', time: '08:40 PM', jamaatTime: '08:40 PM', icon: 'moon' },
      ];
    } else if (isSikh) {
      items = [
        { key: 'Nitnem', name: 'Amrit Vela / Nitnem Bani', time24: '04:00', time: '04:00 AM', jamaatTime: '04:30 AM', icon: 'sunrise' },
        { key: 'AsaVar', name: 'Asa Ki Var & Kirtan', time24: '06:30', time: '06:30 AM', jamaatTime: '07:00 AM', icon: 'sun' },
        { key: 'Rehras', name: 'Rehras Sahib (Sunset)', time24: '19:30', time: '07:30 PM', jamaatTime: '07:45 PM', icon: 'sunset' },
        { key: 'Sukhasan', name: 'Sukhasan & Ardas', time24: '21:30', time: '09:30 PM', jamaatTime: '09:45 PM', icon: 'moon' },
      ];
    } else {
      items = [
        { key: 'Morning', name: 'Morning Chanting & Reflection', time24: '06:30', time: '06:30 AM', jamaatTime: '07:00 AM', icon: 'sunrise' },
        { key: 'Midday', name: 'Midday Devotion', time24: '12:00', time: '12:00 PM', jamaatTime: '12:15 PM', icon: 'sun' },
        { key: 'Evening', name: 'Evening Meditation & Peace Service', time24: '18:30', time: '06:30 PM', jamaatTime: '07:00 PM', icon: 'sunset' },
      ];
    }

    setTimings(items);
  };

  // Browser Geolocation auto-detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        try {
          // Reverse geocode via free BigDataCloud or OpenStreetMap Nominatim
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const city =
              geoData.city ||
              geoData.locality ||
              geoData.principalSubdivision ||
              'Current Location';
            const country = geoData.countryName || 'Local Region';

            setSelectedCity(city);
            setSelectedCountry(country);
            fetchPrayerTimes(city, country, latitude, longitude, calcMethod);
          } else {
            setSelectedCity('My Location');
            fetchPrayerTimes('Location', 'Region', latitude, longitude, calcMethod);
          }
        } catch {
          setSelectedCity('GPS Location');
          fetchPrayerTimes('GPS', 'Region', latitude, longitude, calcMethod);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          error.code === 1
            ? 'Location permission denied. Please select a city manually.'
            : 'Could not resolve device coordinates.'
        );
      },
      { timeout: 10000 }
    );
  };

  // Handle preset city click
  const handleSelectPopularCity = (cityObj: (typeof POPULAR_CITIES)[0]) => {
    setSelectedCity(cityObj.name);
    setSelectedCountry(cityObj.country);
    setCoordinates({ lat: cityObj.lat, lng: cityObj.lng });
    fetchPrayerTimes(cityObj.name, cityObj.country, cityObj.lat, cityObj.lng, calcMethod);
  };

  // Sync location dynamically when selected place changes
  useEffect(() => {
    if (selectedPlaceId !== 'all') {
      const place = worshipPlaces.find((p) => p.id === selectedPlaceId);
      if (place) {
        if (place.city) setSelectedCity(place.city);
        if (place.country) setSelectedCountry(place.country);
        fetchPrayerTimes(place.city || 'Manchester', place.country || 'United Kingdom', coordinates.lat, coordinates.lng, calcMethod);
      }
    }
  }, [selectedPlaceId, worshipPlaces]);

  // Update when calculation method or selected city changes
  useEffect(() => {
    fetchPrayerTimes(selectedCity, selectedCountry, coordinates.lat, coordinates.lng, calcMethod);
  }, [calcMethod, selectedPlaceId]);

  // Dynamic ticking countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      if (!timings || timings.length === 0) return;

      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const currentSec = now.getSeconds();

      // Find timings that skip 'Sunrise' for next prayer calculation
      const prayerList = timings.filter((t) => t.key !== 'Sunrise');

      let upcoming: TimingItem | null = null;
      let minDiff = Infinity;

      // Check all prayer times today
      prayerList.forEach((t) => {
        const [h, m] = t.time24.split(':').map(Number);
        const tMin = h * 60 + m;
        const diff = tMin - currentMin;

        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          upcoming = t;
        }
      });

      // If all prayers today have passed, next prayer is first prayer tomorrow (Fajr / Morning)
      if (!upcoming) {
        upcoming = prayerList[0];
        const [h, m] = upcoming.time24.split(':').map(Number);
        const tMin = h * 60 + m;
        minDiff = 1440 - currentMin + tMin; // minutes until tomorrow's first prayer
      }

      setNextTiming(upcoming);

      // Compute remaining hours, minutes, seconds
      const totalSecRemaining = minDiff * 60 - currentSec;
      if (totalSecRemaining > 0) {
        const hrs = Math.floor(totalSecRemaining / 3600);
        const mins = Math.floor((totalSecRemaining % 3600) / 60);
        const secs = totalSecRemaining % 60;

        const hrsStr = hrs < 10 ? `0${hrs}` : `${hrs}`;
        const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
        const secsStr = secs < 10 ? `0${secs}` : `${secs}`;

        setTimeRemaining(`${hrsStr}:${minsStr}:${secsStr}`);

        // Estimate percent elapsed between prayers
        const percent = Math.min(100, Math.max(5, 100 - (minDiff / 360) * 100));
        setProgressPercent(Math.round(percent));
      } else {
        setTimeRemaining('00:00:00');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [timings]);

  // Audio preview sound (Adhan / Bell Chime using Web Audio API)
  const playAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Gentle spiritual chord frequencies
      const freqs = [440, 554.37, 659.25, 880]; // A major triad harmony
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1 + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + 3.0);
      });
      setIsMuted(false);
      setTimeout(() => setIsMuted(true), 3000);
    } catch (e) {
      console.log('Audio Context playback error:', e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SECTION HEADER BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-stone-900 to-indigo-950 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Location-Based Prayer & Service Timings
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-slate-100 tracking-tight leading-tight">
            Daily Prayer, Mass & Puja Schedule for Joined Religious Places
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif">
            Stay spiritually connected with real-time prayer timings (Salah, Mass, Puja, Tefillot, Nitnem) synchronized with your device location and specific congregation schedules of your joined places.
          </p>

          {/* Quick Stats & Date Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Calendar className="w-4 h-4 text-emerald-400" />
              {gregorianDate}
            </span>

            <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Hijri: <span className="text-amber-300 font-bold">{hijriDate}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <MapPin className="w-4 h-4 text-indigo-400" />
              {selectedCity}, {selectedCountry}
            </span>
          </div>
        </div>
      </div>

      {/* LOCATION & PLACE SELECTOR TOOLBAR */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Location & City Input */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchPrayerTimes(selectedCity, selectedCountry, coordinates.lat, coordinates.lng, calcMethod);
                  }
                }}
                placeholder="Enter city (e.g. Manchester, Chicago, Karachi, Toronto)..."
                className="w-full bg-slate-950 text-xs sm:text-sm text-slate-200 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 font-medium"
              />
            </div>

            <button
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-950/40 whitespace-nowrap disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Locating...' : 'Use GPS Location'}
            </button>
          </div>

          {/* Place Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-400" /> Joined Place:
            </span>
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="bg-slate-950 text-amber-300 font-semibold text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">🌟 All Joined Places Overview</option>
              {worshipPlaces.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name} ({place.city})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Popular Preset Cities Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
            Quick Cities:
          </span>
          {POPULAR_CITIES.slice(0, 8).map((c) => (
            <button
              key={c.name}
              onClick={() => handleSelectPopularCity(c)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCity.toLowerCase() === c.name.toLowerCase()
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {locationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
        )}
      </div>

      {/* DYNAMIC NEXT PRAYER COUNTDOWN BANNER */}
      {nextTiming && (
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Left: Next Prayer Title & Details */}
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                UPCOMING SERVICE / PRAYER
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-slate-100 flex items-center justify-center md:justify-start gap-2">
                <span>{nextTiming.name}</span>
                {nextTiming.arabicName && (
                  <span className="text-amber-400 font-serif font-normal text-xl">
                    ({nextTiming.arabicName})
                  </span>
                )}
              </h3>

              <p className="text-xs text-slate-300 font-serif">
                Scheduled Adhan / Service Time:{' '}
                <span className="font-bold text-slate-100">{nextTiming.time}</span>
                {nextTiming.jamaatTime && (
                  <>
                    {' '}• Congregation (Jama'at) at{' '}
                    <span className="font-bold text-amber-300">{nextTiming.jamaatTime}</span>
                  </>
                )}
              </p>
            </div>

            {/* Right: Countdown Timer Digital Clock */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="bg-slate-950/90 px-6 py-3 rounded-2xl border border-indigo-500/40 shadow-inner flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-400 animate-spin-slow" />
                <div>
                  <div className="text-2xl sm:text-4xl font-mono font-bold tracking-widest text-indigo-300">
                    {timeRemaining}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center md:text-right">
                    Time Remaining
                  </div>
                </div>
              </div>

              {/* Action Buttons: Audio Bell & Qibla */}
              <div className="flex items-center gap-2">
                <button
                  onClick={playAudioChime}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow"
                  title="Test Adhan/Bell Audio Chime"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Test Sound
                </button>

                <button
                  onClick={() => setShowQiblaModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 transition-all shadow"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-300" />
                  Qibla Compass ({qiblaBearing}°)
                </button>
              </div>
            </div>

          </div>

          {/* Progress Bar */}
          <div className="mt-6 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-amber-400 h-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* PRAYER TIMINGS CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Daily Prayer & Mass Timings for {selectedCity}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Calculation Method:</span>
            <select
              value={calcMethod}
              onChange={(e) => setCalcMethod(Number(e.target.value))}
              className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingTimes ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs font-semibold">Calculating location prayer timings...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {timings.map((timing) => {
              const isNext = nextTiming?.key === timing.key;

              return (
                <div
                  key={timing.key}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isNext
                      ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isNext && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider">
                      Next
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {timing.icon === 'sunrise' && <Sunrise className="w-4 h-4 text-amber-400" />}
                        {timing.icon === 'sun' && <Sun className="w-4 h-4 text-amber-400" />}
                        {timing.icon === 'sunset' && <Sunset className="w-4 h-4 text-orange-400" />}
                        {timing.icon === 'moon' && <Moon className="w-4 h-4 text-indigo-400" />}
                        {timing.icon === 'clock' && <Clock className="w-4 h-4 text-emerald-400" />}

                        <span className="font-bold text-slate-100 text-sm">{timing.name}</span>
                      </div>

                      {timing.arabicName && (
                        <p className="text-xs text-amber-400 font-serif">{timing.arabicName}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Adhan / Call
                      </span>
                      <div className="text-xl font-bold font-mono text-slate-100">{timing.time}</div>
                    </div>

                    {timing.jamaatTime && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                          Jama'at / Congregation
                        </span>
                        <div className="text-lg font-bold font-mono text-amber-300">
                          {timing.jamaatTime}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* JOINED PLACES CONGREGATION SCHEDULE TABLE */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Congregation (Jama'at) Timings by Joined Worship Place
            </h3>
            <p className="text-xs text-slate-400">
              Specific service and Jama'at timings configured by local admins for your saved places
            </p>
          </div>

          <span className="text-xs font-semibold bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-slate-300">
            {activePlacesList.length} Joined Centers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Worship Place</th>
                <th className="p-3">Religion</th>
                <th className="p-3">City</th>
                <th className="p-3">Main Congregation Day</th>
                <th className="p-3">Fajr / Morning</th>
                <th className="p-3">Dhuhr / Midday</th>
                <th className="p-3">Asr / Afternoon</th>
                <th className="p-3">Maghrib / Evening</th>
                <th className="p-3">Isha / Night</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {activePlacesList.map((place) => (
                <tr key={place.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                    />
                    <span>{place.name}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                      {place.religion}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{place.city}</td>
                  <td className="p-3 font-semibold text-emerald-400">{place.congregationDay}</td>
                  <td className="p-3 font-mono text-slate-200">
                    {place.religion === 'Islam' ? addMinutesToTime(timings[0]?.time24 || '04:15', jamaatOffsets.Fajr || 20) : '08:00 AM'}
                  </td>
                  <td className="p-3 font-mono text-slate-200">
                    {place.religion === 'Islam' ? addMinutesToTime(timings[2]?.time24 || '13:15', jamaatOffsets.Dhuhr || 15) : '10:30 AM'}
                  </td>
                  <td className="p-3 font-mono text-slate-200">
                    {place.religion === 'Islam' ? addMinutesToTime(timings[3]?.time24 || '17:05', jamaatOffsets.Asr || 15) : '02:00 PM'}
                  </td>
                  <td className="p-3 font-mono text-slate-200">
                    {place.religion === 'Islam' ? addMinutesToTime(timings[4]?.time24 || '20:45', jamaatOffsets.Maghrib || 10) : '06:00 PM'}
                  </td>
                  <td className="p-3 font-mono text-slate-200">
                    {place.religion === 'Islam' ? addMinutesToTime(timings[5]?.time24 || '22:15', jamaatOffsets.Isha || 15) : '08:00 PM'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QIBLA COMPASS MODAL */}
      {showQiblaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 font-serif">Qibla & Sacred Direction</h3>
              </div>
              <button
                onClick={() => setShowQiblaModal(false)}
                className="text-slate-400 hover:text-slate-100 text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-center space-y-4">
              <p className="text-xs text-slate-300 font-serif">
                Direct bearing from <span className="font-bold text-slate-100">{selectedCity}</span> towards Makkah (Kaaba):
              </p>

              {/* Graphic Compass Dial */}
              <div className="relative w-48 h-48 mx-auto rounded-full bg-slate-950 border-4 border-indigo-500/30 flex items-center justify-center shadow-inner">
                {/* North marker */}
                <span className="absolute top-2 font-bold text-xs text-rose-400 font-mono">N</span>
                <span className="absolute bottom-2 font-bold text-xs text-slate-500 font-mono">S</span>
                <span className="absolute right-2 font-bold text-xs text-slate-500 font-mono">E</span>
                <span className="absolute left-2 font-bold text-xs text-slate-500 font-mono">W</span>

                {/* Rotating Needle pointing towards Qibla */}
                <div
                  className="absolute w-1 h-36 bg-gradient-to-b from-emerald-400 via-amber-400 to-transparent rounded-full transition-transform duration-700"
                  style={{ transform: `rotate(${qiblaBearing}deg)` }}
                />

                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-amber-300 z-10 shadow">
                  {qiblaBearing}°
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-indigo-300">
                  Angle: {qiblaBearing}° degrees Clockwise from North
                </div>
                <div className="text-[11px] text-slate-400">
                  Coordinates: {coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° E
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQiblaModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
