import React from 'react';
import {
  BookOpen,
  Calendar,
  Globe,
  Send,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Sermon, LanguageOption } from '../types';

interface SermonCardProps {
  sermon: Sermon;
  selectedLanguage: LanguageOption;
  onOpenViewer: (sermon: Sermon) => void;
  onBroadcastTrigger: (sermon: Sermon) => void;
}

export const SermonCard: React.FC<SermonCardProps> = ({
  sermon,
  selectedLanguage,
  onOpenViewer,
  onBroadcastTrigger,
}) => {
  return (
    <div className="rounded-2xl bg-stone-900 border border-stone-800 shadow-xl p-5 hover:border-stone-700 transition-all flex flex-col justify-between space-y-4 group">
      
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {sermon.religion}
          </span>

          <span className="text-stone-400 flex items-center gap-1 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            {sermon.date}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold font-serif text-stone-100 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
          {sermon.title}
        </h3>

        <div className="text-xs text-stone-400 flex items-center gap-2 flex-wrap">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {sermon.placeName}
          </span>
          <span>•</span>
          <span>{sermon.speakerTitle}: {sermon.speakerName}</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-stone-300 line-clamp-3 leading-relaxed font-serif bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
        "{sermon.summary}"
      </p>

      {/* Scripture reference & Tags */}
      <div className="space-y-2 text-xs">
        {sermon.scriptureReference && (
          <p className="text-stone-400 font-medium line-clamp-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{sermon.scriptureReference}</span>
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-800 pt-2">
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Original: {sermon.originalLanguage}
          </span>
          <span className="text-emerald-400 font-semibold">
            AI Auto-Translate to {selectedLanguage.name}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onOpenViewer(sermon)}
          className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs border border-stone-700 transition-all flex items-center justify-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Read in {selectedLanguage.name}
        </button>

        <button
          onClick={() => onBroadcastTrigger(sermon)}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" /> Broadcast
        </button>
      </div>

    </div>
  );
};
