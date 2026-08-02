import React, { useState } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Mail,
  Users,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Globe,
  Loader2,
} from 'lucide-react';
import { Sermon, WorshipPlace } from '../types';

interface BroadcastModalProps {
  sermon: Sermon;
  worshipPlace?: WorshipPlace;
  onClose: () => void;
  onSuccess: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  sermon,
  worshipPlace,
  onClose,
  onSuccess,
}) => {
  const [channels, setChannels] = useState<'Both' | 'WhatsApp' | 'Email'>('Both');
  const [customNote, setCustomNote] = useState<string>('');
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<any>(null);

  const followerCount = worshipPlace ? worshipPlace.followerCount : 1250;

  const handleSendBroadcast = async () => {
    setBroadcasting(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sermonId: sermon.id,
          deliveryChannels: channels,
          customNote,
        }),
      });

      if (!res.ok) throw new Error('Broadcast failed');
      const data = await res.json();
      setSuccessResult(data);
    } catch (err) {
      console.error('Broadcast error:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl text-stone-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-100">
                Broadcast Sermon to Worshippers
              </h3>
              <p className="text-xs text-stone-400">
                Automated AI Translation & Delivery via WhatsApp & Email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          
          {/* Target Audience Summary */}
          <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-stone-400 font-medium">Subscribed Worshippers</p>
                <p className="text-base font-bold text-stone-100">{followerCount} Followers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">Languages Supported</p>
              <p className="text-xs font-semibold text-emerald-300">Urdu, English, Arabic, Spanish, etc.</p>
            </div>
          </div>

          {!successResult ? (
            <>
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannels('Both')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                      channels === 'Both'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    WhatsApp & Email
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannels('WhatsApp')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                      channels === 'WhatsApp'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    WhatsApp Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannels('Email')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                      channels === 'Email'
                        ? 'bg-teal-600/20 border-teal-500 text-teal-300 shadow'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-teal-400" />
                    Email Only
                  </button>
                </div>
              </div>

              {/* Custom Announcement / Admin Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                  Optional Admin Announcement / Community Notice
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g., Friday Jummah prayer timings, parking guidance, or community announcement..."
                  rows={2}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    WhatsApp Card Preview (Urdu / Target Language)
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    Auto-Translated
                  </span>
                </div>

                <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-xs text-stone-300 font-serif leading-relaxed space-y-1">
                  <p className="font-bold text-emerald-300">
                    🕌 {sermon.placeName} - آن لائن خطبہ
                  </p>
                  <p className="text-stone-200">
                    *عنوان:* {sermon.title}
                  </p>
                  <p className="text-stone-400 text-[11px]">
                    {sermon.summary}
                  </p>
                  {customNote && (
                    <p className="text-amber-300 text-[11px] font-sans pt-1 border-t border-stone-800">
                      📢 {customNote}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Success View */
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-100 font-serif">
                  Broadcast Dispatched Successfully!
                </h4>
                <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                  Sent to {successResult.recipientsCount} worshippers in their chosen primary languages (Urdu, English, Spanish, Arabic, etc.).
                </p>
              </div>

              {/* Language Breakdown */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-left max-w-md mx-auto">
                <p className="text-xs font-bold text-emerald-400 mb-2">
                  Language Distribution Delivery:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-300">
                  {Object.entries(successResult.languageBreakdown || {}).map(([lang, count]) => (
                    <div key={lang} className="flex justify-between p-2 rounded bg-stone-900">
                      <span>{lang}:</span>
                      <span className="font-bold text-emerald-300">{count as number} recipients</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/90 flex items-center justify-end gap-2">
          {!successResult ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={broadcasting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
              >
                {broadcasting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Multilingual Broadcast Now
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
            >
              Done & View Broadcast Logs
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
