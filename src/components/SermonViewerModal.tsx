import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  BookOpen,
  Calendar,
  CheckCircle2,
  Building2,
  Share2,
  Languages,
  Loader2,
  FileText,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { Sermon, LanguageOption, TranslationResult, SUPPORTED_LANGUAGES } from '../types';
import { UserRole } from './Header';

interface SermonViewerModalProps {
  sermon: Sermon;
  selectedLanguage: LanguageOption;
  onClose: () => void;
  onBroadcastTrigger: (sermon: Sermon) => void;
  onDeleteSermon?: (sermonId: string) => void;
  userRole?: UserRole;
}

export const SermonViewerModal: React.FC<SermonViewerModalProps> = ({
  sermon,
  selectedLanguage,
  onClose,
  onBroadcastTrigger,
  onDeleteSermon,
  userRole,
}) => {
  const [targetLang, setTargetLang] = useState<LanguageOption>(selectedLanguage);
  const [activeView, setActiveView] = useState<'translated' | 'original' | 'split'>('translated');
  const [loadingTranslation, setLoadingTranslation] = useState<boolean>(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  
  // Audio Speech Synthesis state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Synchronize when selectedLanguage changes
  useEffect(() => {
    setTargetLang(selectedLanguage);
  }, [selectedLanguage]);

  // Fetch AI translation whenever targetLang changes or sermon opens
  useEffect(() => {
    let isMounted = true;
    const fetchTranslation = async () => {
      setLoadingTranslation(true);
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sermon.title,
            originalText: sermon.originalText,
            summary: sermon.summary,
            keyTakeaways: sermon.keyTakeaways,
            religion: sermon.religion,
            targetLanguage: `${targetLang.name} (${targetLang.nativeName})`,
          }),
        });

        if (!res.ok) throw new Error('Translation failed');
        const data = await res.json();
        
        if (isMounted) {
          setTranslationResult({
            sermonId: sermon.id,
            targetLanguage: targetLang.name,
            targetLanguageCode: targetLang.code,
            translatedTitle: data.translatedTitle || sermon.title,
            translatedText: data.translatedText || sermon.originalText,
            translatedSummary: data.translatedSummary || sermon.summary,
            translatedTakeaways: data.translatedTakeaways || sermon.keyTakeaways,
            sacredTerminologyNotes: data.sacredTerminologyNotes,
          });
        }
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        if (isMounted) setLoadingTranslation(false);
      }
    };

    fetchTranslation();

    return () => {
      isMounted = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sermon, targetLang]);

  // TTS playback handler
  const toggleSpeechPlayback = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser environment.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = translationResult
        ? `${translationResult.translatedTitle}. ${translationResult.translatedSummary}. ${translationResult.translatedText}`
        : `${sermon.title}. ${sermon.summary}. ${sermon.originalText}`;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = targetLang.code;
      utterance.rate = 0.95; // Speech speed
      
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}?sermonId=${sermon.id}&lang=${targetLang.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl text-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 bg-stone-900/90 flex items-start justify-between gap-4 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {sermon.religion}
              </span>
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-stone-500" />
                {sermon.placeName}
              </span>
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                {sermon.date}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-bold font-serif text-stone-100 leading-snug">
              {translationResult && activeView !== 'original'
                ? translationResult.translatedTitle
                : sermon.title}
            </h2>

            <p className="text-xs text-stone-400 mt-1 flex items-center gap-2">
              <span className="font-semibold text-emerald-400">
                {sermon.speakerTitle}: {sermon.speakerName}
              </span>
              <span>•</span>
              <span>Original Language: {sermon.originalLanguage}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteSermon && (userRole === 'super_admin' || userRole === 'masjid_admin') && (
              <button
                onClick={() => {
                  if (isConfirmingDelete) {
                    onDeleteSermon(sermon.id);
                    setIsConfirmingDelete(false);
                    onClose();
                  } else {
                    setIsConfirmingDelete(true);
                    setTimeout(() => setIsConfirmingDelete(false), 4000);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  isConfirmingDelete
                    ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300'
                    : 'bg-rose-600/30 hover:bg-rose-600 text-rose-200 border border-rose-500/40'
                }`}
                title="Delete Sermon"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isConfirmingDelete ? 'Click to Confirm Delete' : 'Delete Sermon'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Translation Control Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-stone-950/70 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
          
          {/* Target Language Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Target Translation:
            </span>
            <select
              value={targetLang.code}
              onChange={(e) => {
                const l = SUPPORTED_LANGUAGES.find((lang) => lang.code === e.target.value);
                if (l) setTargetLang(l);
              }}
              className="bg-stone-900 text-emerald-300 font-semibold text-xs rounded-lg px-2.5 py-1.5 border border-stone-700 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>

            {loadingTranslation && (
              <span className="flex items-center gap-1 text-xs text-amber-400 animate-pulse font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                AI Translating...
              </span>
            )}
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveView('translated')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'translated'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Languages className="w-3 h-3" />
                Translated ({targetLang.name})
              </span>
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'split'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Dual View
            </button>
            <button
              onClick={() => setActiveView('original')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'original'
                  ? 'bg-stone-700 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Original ({sermon.originalLanguage})
            </button>
          </div>

        </div>

        {/* Audio Speech & Action Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-stone-900/40 border-b border-stone-800/80 flex items-center justify-between flex-wrap gap-2">
          
          {/* Audio TTS Player */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSpeechPlayback}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Stop Narration
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> Listen in {targetLang.name}
                </>
              )}
            </button>

            <span className="text-[11px] text-stone-400 hidden sm:inline-block">
              🔊 Gemini AI Multilingual Speech Narration
            </span>
          </div>

          {/* WhatsApp & Email Broadcast Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedLink ? 'Link Copied!' : 'Share'}
            </button>

            <button
              onClick={() => onBroadcastTrigger(sermon)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Broadcast via WhatsApp / Email
            </button>
          </div>
        </div>

        {/* Modal Body / Text Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Sacred Context & Scripture Banner */}
          {sermon.scriptureReference && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Scripture / Text Reference
                </h4>
                <p className="text-sm font-serif text-amber-100 font-medium mt-0.5">
                  {sermon.scriptureReference}
                </p>
              </div>
            </div>
          )}

          {/* Key Takeaways Section */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Core Takeaways & Spiritual Guidance
            </h4>
            <ul className="space-y-2">
              {(translationResult && activeView !== 'original'
                ? translationResult.translatedTakeaways
                : sermon.keyTakeaways
              ).map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Terminology & Honorifics Note */}
          {translationResult?.sacredTerminologyNotes && activeView !== 'original' && (
            <div className="px-3.5 py-2.5 rounded-xl bg-stone-800/80 border border-stone-700/80 text-xs text-stone-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Sacred Vocabulary & Honorifics Preservation:</span>{' '}
                {translationResult.sacredTerminologyNotes}
              </div>
            </div>
          )}

          {/* Main Sermon Text - Single Column or Split Dual View */}
          {activeView === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: Original Text */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Original ({sermon.originalLanguage})
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-stone-200">
                  {sermon.title}
                </h3>
                <div
                  className="text-stone-300 font-serif text-sm sm:text-base leading-relaxed whitespace-pre-line"
                  dir={sermon.originalLanguageCode === 'ar' || sermon.originalLanguageCode === 'ur' ? 'rtl' : 'ltr'}
                >
                  {sermon.originalText}
                </div>
              </div>

              {/* Right Column: AI Translated Text */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-emerald-900/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    Translated ({targetLang.name})
                  </span>
                </div>
                {loadingTranslation ? (
                  <div className="py-12 text-center text-stone-500 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                    <p className="text-xs">Translating sacred sermon via Gemini AI...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-serif font-bold text-base text-stone-200">
                      {translationResult?.translatedTitle || sermon.title}
                    </h3>
                    <div
                      className="text-stone-200 font-serif text-sm sm:text-base leading-relaxed whitespace-pre-line"
                      dir={targetLang.direction || 'ltr'}
                    >
                      {translationResult?.translatedText || sermon.originalText}
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : (
            /* Single Column View (Translated or Original) */
            <div className="p-5 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {activeView === 'original'
                    ? `Original (${sermon.originalLanguage})`
                    : `AI Translated (${targetLang.name} - ${targetLang.nativeName})`}
                </span>
                <span className="text-xs text-stone-500">
                  {sermon.date}
                </span>
              </div>

              {loadingTranslation && activeView === 'translated' ? (
                <div className="py-16 text-center text-stone-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                  <p className="text-sm font-medium text-stone-300">
                    AI translating sermon into {targetLang.name}...
                  </p>
                  <p className="text-xs text-stone-500">
                    Preserving spiritual nuances, honorifics, and sacred terminology
                  </p>
                </div>
              ) : (
                <div
                  className="text-stone-200 font-serif text-base sm:text-lg leading-relaxed whitespace-pre-line"
                  dir={
                    activeView === 'original'
                      ? sermon.originalLanguageCode === 'ar' || sermon.originalLanguageCode === 'ur'
                        ? 'rtl'
                        : 'ltr'
                      : targetLang.direction || 'ltr'
                  }
                >
                  {activeView === 'original'
                    ? sermon.originalText
                    : translationResult?.translatedText || sermon.originalText}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/90 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            Topic Tags: {sermon.topicTags.join(' • ')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
