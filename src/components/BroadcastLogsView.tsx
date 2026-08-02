import React, { useState, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Mail,
  Users,
  CheckCheck,
  Globe,
  Clock,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { BroadcastLog } from '../types';

export const BroadcastLogsView: React.FC = () => {
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('All');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broadcast-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (selectedChannelFilter === 'All') return true;
    return log.channel.toLowerCase() === selectedChannelFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Top Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950/40 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Automated Delivery Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-100">
            WhatsApp & Email Sermon Delivery Hub
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Real-time logs of AI-translated sermon broadcasts delivered to worshippers in Urdu, English, Arabic, Spanish, etc.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-stone-900 p-2 rounded-xl border border-stone-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-500 ml-2" />
          <span className="text-xs text-stone-400 font-medium">Filter Channel:</span>
          {['All', 'WhatsApp', 'Email', 'Both'].map((channel) => (
            <button
              key={channel}
              onClick={() => setSelectedChannelFilter(channel)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedChannelFilter === channel
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {channel}
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-400 px-2">
          Total Broadcast Batches: <span className="font-bold text-emerald-400">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-6">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl space-y-4"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {log.placeName}
                  </span>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-stone-100">
                  {log.sermonTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {log.recipientsCount} Recipients
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {log.channel}
                </span>
              </div>
            </div>

            {/* Language Breakdown Pills */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Language Distribution Delivered:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(log.languageBreakdown || {}).map(([lang, count]) => (
                  <div
                    key={lang}
                    className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 flex items-center gap-2"
                  >
                    <span className="font-semibold text-emerald-300">{lang}:</span>
                    <span className="text-stone-400 font-bold">{count} Worshippers</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample WhatsApp & Email Cards Preview */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sample Delivered Messages Preview:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {log.sampleMessages?.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs border-b border-stone-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        {sample.channel === 'WhatsApp' ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-teal-400 font-bold">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </span>
                        )}
                        <span className="text-stone-300 font-semibold">• {sample.recipientName}</span>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-amber-300">
                        {sample.language}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 font-serif whitespace-pre-line leading-relaxed">
                      {sample.previewText}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCheck className="w-3.5 h-3.5" /> {sample.status}
                      </span>
                      <span>Verified SSL Delivery</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
