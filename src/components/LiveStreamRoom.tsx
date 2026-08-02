import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Globe,
  Sparkles,
  Users,
  MessageSquare,
  Maximize2,
  Settings,
  Languages,
  Loader2,
  Tv,
} from 'lucide-react';
import { LanguageOption, SUPPORTED_LANGUAGES } from '../types';

interface LiveStreamRoomProps {
  selectedLanguage: LanguageOption;
  setSelectedLanguage: (lang: LanguageOption) => void;
}

const SAMPLE_LIVE_CHUNKS = [
  {
    time: '00:05',
    original: 'الحمد لله رب العالمين، والصلاة والسلام على رسول الله الكريم',
    speaker: 'Sheikh Muhammad Al-Azhari (Arabic)',
    religion: 'Islam',
  },
  {
    time: '00:12',
    original: 'أوصيكم ونفسي بتقوى الله عز وجل والصبر في الملمات',
    speaker: 'Sheikh Muhammad Al-Azhari (Arabic)',
    religion: 'Islam',
  },
  {
    time: '00:20',
    original: 'إن التراحم والتآخي بين العباد هو جوهر الإيمان الصادق',
    speaker: 'Sheikh Muhammad Al-Azhari (Arabic)',
    religion: 'Islam',
  },
  {
    time: '00:28',
    original: 'الله لطيف بعباده ويرزق من يشاء وهو القوي العزيز',
    speaker: 'Sheikh Muhammad Al-Azhari (Arabic)',
    religion: 'Islam',
  },
  {
    time: '00:36',
    original: 'نسأل الله العلي القدير أن يبارك في جمعتنا وأن يفرج عن أمتنا',
    speaker: 'Sheikh Muhammad Al-Azhari (Arabic)',
    religion: 'Islam',
  },
];

export const LiveStreamRoom: React.FC<LiveStreamRoomProps> = ({
  selectedLanguage,
  setSelectedLanguage,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [enableVoiceTranslation, setEnableVoiceTranslation] = useState<boolean>(true);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [translatedChunks, setTranslatedChunks] = useState<Array<{ original: string; translated: string; time: string }>>([]);
  const [loadingChunk, setLoadingChunk] = useState<boolean>(false);

  const tickerEndRef = useRef<HTMLDivElement>(null);

  // Auto-advance stream simulation every 5 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentChunkIndex((prev) => (prev + 1) % SAMPLE_LIVE_CHUNKS.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Translate the current live chunk using Gemini API
  useEffect(() => {
    let isMounted = true;
    const chunk = SAMPLE_LIVE_CHUNKS[currentChunkIndex];

    const translateChunk = async () => {
      setLoadingChunk(true);
      try {
        const res = await fetch('/api/live-translate-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalChunkText: chunk.original,
            religion: chunk.religion,
            targetLanguage: `${selectedLanguage.name} (${selectedLanguage.nativeName})`,
          }),
        });

        const data = await res.json();
        const translatedText = data.translatedChunk || chunk.original;

        if (isMounted) {
          setTranslatedChunks((prev) => {
            const next = [
              ...prev,
              { original: chunk.original, translated: translatedText, time: chunk.time },
            ];
            return next.slice(-10); // keep last 10 lines
          });

          // Play Speech synthesis voice translation if enabled
          if (enableVoiceTranslation && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(translatedText);
            utterance.lang = selectedLanguage.code;
            utterance.rate = 1.0;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (err) {
        console.error('Live translation chunk error:', err);
      } finally {
        if (isMounted) setLoadingChunk(false);
      }
    };

    translateChunk();

    return () => {
      isMounted = false;
    };
  }, [currentChunkIndex, selectedLanguage, enableVoiceTranslation]);

  // Scroll ticker
  useEffect(() => {
    tickerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [translatedChunks]);

  const currentTranslated = translatedChunks[translatedChunks.length - 1]?.translated || 'Connecting to live translation...';

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-rose-950/40 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              Phase 2 Preview: Live Translation Room
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-100">
            Real-Time Live Sermon Subtitles & Voice Audio
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Experience real-time AI live subtitles and synchronized voice translation in your preferred language during live Friday Khutbahs & Services.
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 bg-stone-950 p-2 rounded-xl border border-stone-800">
          <Globe className="w-4 h-4 text-emerald-400 ml-1" />
          <span className="text-xs text-stone-400 font-medium">Live Language:</span>
          <select
            value={selectedLanguage.code}
            onChange={(e) => {
              const lang = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
              if (lang) setSelectedLanguage(lang);
            }}
            className="bg-stone-900 text-emerald-300 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-stone-700 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Live Room Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Simulated Live Video/Audio Stream Player (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-6 group">
            
            {/* Background Decorative Graphic / Visualizer */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-900/40 z-0" />
            <div className="absolute inset-0 flex items-center justify-center opacity-10 z-0">
              <Tv className="w-48 h-48 text-stone-500 stroke-[1]" />
            </div>

            {/* Top Bar Overlay */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-800">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold text-rose-400 tracking-wider">LIVE Khutbah</span>
                <span className="text-stone-500">|</span>
                <span className="text-xs text-stone-300 font-semibold">Al-Farooq Grand Mosque</span>
              </div>

              <div className="flex items-center gap-2 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-800 text-xs text-stone-300">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>3,410 Live Viewers</span>
              </div>
            </div>

            {/* Middle Graphic: Speaker Profile & Live Audio Visualizer Bars */}
            <div className="relative z-10 my-auto text-center py-6 space-y-3">
              <div className="w-20 h-20 rounded-full bg-stone-800 border-2 border-emerald-500/50 p-1 mx-auto shadow-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=400"
                  alt="Live Mosque"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-stone-100">
                  Sheikh Muhammad Al-Azhari
                </h3>
                <p className="text-xs text-amber-400 font-medium">
                  Friday Jummah Sermon (Original: Arabic)
                </p>
              </div>

              {/* Animated Audio Equalizer Waveform */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-1.5 h-8 py-1">
                  {[40, 75, 100, 60, 90, 45, 80, 50, 95, 30, 70, 85].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Overlay: REAL-TIME AI SUBTITLE TICKER */}
            <div className="relative z-10 bg-stone-900/95 backdrop-blur-md p-4 rounded-xl border border-stone-800/90 shadow-2xl space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Live AI Subtitle ({selectedLanguage.name} - {selectedLanguage.nativeName})
                </span>
                {loadingChunk && (
                  <span className="flex items-center gap-1 text-amber-400 animate-pulse text-[10px]">
                    <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                  </span>
                )}
              </div>

              <p
                className="text-sm sm:text-base font-serif font-bold text-stone-100 leading-snug"
                dir={selectedLanguage.direction || 'ltr'}
              >
                "{currentTranslated}"
              </p>
            </div>

          </div>

          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause Live Stream' : 'Resume Live Stream'}
              </button>

              <button
                onClick={() => setEnableVoiceTranslation(!enableVoiceTranslation)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  enableVoiceTranslation
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                {enableVoiceTranslation ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                Live Voice Narration ({enableVoiceTranslation ? 'ON' : 'Muted'})
              </button>
            </div>

            <span className="text-xs text-stone-400">
              Low-Latency Gemini Translation Engine
            </span>
          </div>
        </div>

        {/* Right Column: Live Subtitle Stream Transcript History */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl space-y-4 flex flex-col h-[520px]">
          <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold font-serif text-stone-100 flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-400" />
              Live Subtitle Feed
            </h3>
            <span className="text-[10px] text-stone-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
              {selectedLanguage.name}
            </span>
          </div>

          {/* Transcript History list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {translatedChunks.length === 0 ? (
              <div className="py-20 text-center text-xs text-stone-500">
                Listening to live sermon...
              </div>
            ) : (
              translatedChunks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span className="font-semibold text-amber-400">
                      Original (Arabic): "{item.original}"
                    </span>
                    <span>{item.time}</span>
                  </div>

                  <p
                    className="text-xs font-serif font-semibold text-stone-200"
                    dir={selectedLanguage.direction || 'ltr'}
                  >
                    {item.translated}
                  </p>
                </div>
              ))
            )}
            <div ref={tickerEndRef} />
          </div>

          <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-[11px] text-stone-400">
            💡 Phase 2 feature allows worshippers worldwide to attend live sermons in real-time with simultaneous voice and subtitle translation in over 14 languages.
          </div>
        </div>

      </div>

    </div>
  );
};
