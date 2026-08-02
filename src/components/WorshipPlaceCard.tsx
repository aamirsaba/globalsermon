import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  UserCheck,
  Globe,
  BookOpen,
  ChevronRight,
  Check,
} from 'lucide-react';
import { WorshipPlace, Sermon, LanguageOption } from '../types';

interface WorshipPlaceCardProps {
  place: WorshipPlace;
  sermons: Sermon[];
  selectedLanguage: LanguageOption;
  onSelectSermon: (sermon: Sermon) => void;
  onJoinPlace: (placeId: string) => void;
  isJoined: boolean;
}

export const WorshipPlaceCard: React.FC<WorshipPlaceCardProps> = ({
  place,
  sermons,
  selectedLanguage,
  onSelectSermon,
  onJoinPlace,
  isJoined,
}) => {
  const placeSermons = sermons.filter((s) => s.placeId === place.id);

  return (
    <div className="rounded-2xl bg-stone-900 border border-stone-800 shadow-xl overflow-hidden hover:border-stone-700 transition-all flex flex-col justify-between group">
      
      {/* Top Image Banner & Badges */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={place.imageUrl}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-stone-950 shadow">
            {place.religion}
          </span>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-900/90 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {place.congregationDay}
          </span>
        </div>

        {/* Bottom Banner Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold font-serif text-stone-100 drop-shadow-md line-clamp-1">
            {place.name}
          </h3>
          <p className="text-xs text-stone-300 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            {place.city}, {place.country}
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        
        {/* Preacher Info & Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800">
            <span className="font-semibold text-emerald-400">
              {place.preacherTitle}: {place.preacherName}
            </span>
            <span className="flex items-center gap-1 text-stone-400">
              <Users className="w-3.5 h-3.5" />
              {place.followerCount + (isJoined ? 1 : 0)} Followers
            </span>
          </div>

          <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        </div>

        {/* Recent Sermons Preview List */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
            <span>Recent Sermons ({placeSermons.length})</span>
            <span className="text-emerald-400">AI Multilingual</span>
          </div>

          {placeSermons.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-stone-950 text-xs text-stone-500 text-center">
              No published sermons yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {placeSermons.slice(0, 2).map((sermon) => (
                <button
                  key={sermon.id}
                  onClick={() => onSelectSermon(sermon)}
                  className="w-full text-left p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800/80 transition-colors flex items-center justify-between gap-2 group/sermon"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-200 line-clamp-1 font-serif group-hover/sermon:text-emerald-400 transition-colors">
                      {sermon.title}
                    </p>
                    <p className="text-[10px] text-stone-400 flex items-center gap-2">
                      <span>Original: {sermon.originalLanguage}</span>
                      <span>•</span>
                      <span>{sermon.date}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover/sermon:text-emerald-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Button: Follow / Join Place */}
        <div className="pt-2">
          <button
            onClick={() => onJoinPlace(place.id)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isJoined
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
            }`}
          >
            {isJoined ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Joined (Receiving WhatsApp / Email Updates)
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" /> Join Place & Receive Sermons in {selectedLanguage.name}
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
