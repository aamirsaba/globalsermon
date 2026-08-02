import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Sparkles,
  BookOpen,
  Send,
  Calendar,
  User,
  CheckCircle2,
  Globe,
  Loader2,
  FileText,
  Clock,
  Layers,
  Crown,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Check,
  Edit,
  Sliders,
  MapPin,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { WorshipPlace, Sermon, Religion, CongregationDay, MasjidAdminAccount } from '../types';
import { UserRole } from './Header';

interface AdminPortalProps {
  userRole: UserRole;
  worshipPlaces: WorshipPlace[];
  sermons: Sermon[];
  adminAccounts: MasjidAdminAccount[];
  onAddPlace: (place: WorshipPlace) => void;
  onApprovePlace: (placeId: string) => void;
  onRejectPlace: (placeId: string) => void;
  onApproveAdminAccount: (accountId: string) => void;
  onRejectAdminAccount: (accountId: string) => void;
  onAddSermon: (sermon: Sermon) => void;
  onSelectSermon: (sermon: Sermon) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  userRole,
  worshipPlaces,
  sermons,
  adminAccounts,
  onAddPlace,
  onApprovePlace,
  onRejectPlace,
  onApproveAdminAccount,
  onRejectAdminAccount,
  onAddSermon,
  onSelectSermon,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'upload' | 'places' | 'aiDraft'>(
    userRole === 'super_admin' ? 'approvals' : 'upload'
  );

  // Selected Place for sermon upload
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(worshipPlaces[0]?.id || '');

  // Form states for Sermon Upload
  const [sermonTitle, setSermonTitle] = useState<string>('');
  const [speakerName, setSpeakerName] = useState<string>('');
  const [speakerTitle, setSpeakerTitle] = useState<string>('Imam & Khatib');
  const [originalLanguage, setOriginalLanguage] = useState<string>('Arabic');
  const [scriptureRef, setScriptureRef] = useState<string>('');
  const [topicTags, setTopicTags] = useState<string>('Patience, Community, Faith');
  const [summary, setSummary] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');
  const [takeaway1, setTakeaway1] = useState<string>('');
  const [takeaway2, setTakeaway2] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [sermonSuccess, setSermonSuccess] = useState<boolean>(false);

  // Form states for New Property / Place Setup
  const [placeName, setPlaceName] = useState<string>('');
  const [religion, setReligion] = useState<Religion>('Islam');
  const [venueType, setVenueType] = useState<string>('Mosque / Masjid');
  const [congregationDay, setCongregationDay] = useState<CongregationDay>('Friday');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [preacherName, setPreacherName] = useState<string>('');
  const [preacherTitle, setPreacherTitle] = useState<string>('Imam');
  const [description, setDescription] = useState<string>('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'Wudu Area',
    'Ladies Section',
    'Wheelchair Access',
    'Parking',
  ]);
  const [placeSuccess, setPlaceSuccess] = useState<boolean>(false);

  // Form states for AI Sermon Assistant
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiReligion, setAiReligion] = useState<Religion>('Islam');
  const [aiScripture, setAiScripture] = useState<string>('');
  const [aiLanguage, setAiLanguage] = useState<string>('English');
  const [generatingDraft, setGeneratingDraft] = useState<boolean>(false);

  // Lists for Superuser Approval
  const pendingPlaces = worshipPlaces.filter((p) => p.approvalStatus === 'pending');
  const approvedPlaces = worshipPlaces.filter((p) => p.approvalStatus === 'approved' || !p.approvalStatus);
  const pendingAdminReqs = adminAccounts.filter((a) => a.status === 'pending');

  const AVAILABLE_FACILITIES = [
    'Wudu Area',
    'Ladies Section',
    'Wheelchair Access',
    'Parking',
    'Quran Academy',
    'Funeral Service',
    'Community Hall',
    'Langar Hall',
    'Library',
    'Youth Gym',
  ];

  const toggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  // Handle New Place Creation
  const handleCreatePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName || !city) return;

    const newPlace: WorshipPlace = {
      id: `place-${Date.now()}`,
      name: placeName,
      religion,
      venueType,
      congregationDay,
      city,
      country: country || 'Global',
      address: `${city}, ${country || 'Global'}`,
      imageUrl:
        religion === 'Islam'
          ? 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800'
          : religion === 'Christianity'
          ? 'https://images.unsplash.com/photo-1548625361-1851e360e5ff?auto=format&fit=crop&q=80&w=800'
          : 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=800',
      adminName: adminName || 'Admin User',
      preacherTitle: preacherTitle || 'Lead Preacher',
      preacherName: preacherName || 'Spiritual Leader',
      contactEmail: 'admin@worshipcenter.org',
      contactPhone: '+1 555 0199',
      description: description || 'Established place of worship.',
      followerCount: 150,
      languagesOffered: ['English', 'Urdu', 'Arabic'],
      approvalStatus: userRole === 'super_admin' ? 'approved' : 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      facilities: selectedFacilities,
    };

    onAddPlace(newPlace);
    setSelectedPlaceId(newPlace.id);
    setPlaceSuccess(true);
    setTimeout(() => {
      setPlaceSuccess(false);
      setActiveSubTab(userRole === 'super_admin' ? 'approvals' : 'upload');
    }, 1500);
  };

  // Handle Sermon Creation
  const handleCreateSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonTitle || !originalText) return;

    setIsSubmitting(true);
    const place = worshipPlaces.find((p) => p.id === selectedPlaceId) || worshipPlaces[0];

    const newSermon: Sermon = {
      id: `sermon-${Date.now()}`,
      placeId: place.id,
      placeName: place.name,
      religion: place.religion,
      title: sermonTitle,
      speakerName: speakerName || place.preacherName,
      speakerTitle: speakerTitle || place.preacherTitle,
      originalLanguage,
      originalLanguageCode: originalLanguage === 'Arabic' ? 'ar' : originalLanguage === 'Urdu' ? 'ur' : 'en',
      date: new Date().toISOString().split('T')[0],
      scriptureReference: scriptureRef || undefined,
      topicTags: topicTags.split(',').map((t) => t.trim()),
      summary: summary || originalText.substring(0, 150) + '...',
      originalText,
      keyTakeaways: [takeaway1, takeaway2].filter(Boolean),
    };

    onAddSermon(newSermon);
    setIsSubmitting(false);
    setSermonSuccess(true);

    // Reset fields
    setTimeout(() => {
      setSermonSuccess(false);
      setSermonTitle('');
      setOriginalText('');
      setSummary('');
    }, 2000);
  };

  // Handle AI Sermon Draft Generator
  const handleGenerateAiDraft = async () => {
    if (!aiTopic) return;
    setGeneratingDraft(true);
    try {
      const res = await fetch('/api/generate-sermon-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          religion: aiReligion,
          scriptureRef: aiScripture,
          targetLanguage: aiLanguage,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();

      // Populate Sermon Upload fields with generated draft
      setSermonTitle(data.title || `Discourse on ${aiTopic}`);
      setOriginalText(data.text || '');
      setSummary(data.summary || '');
      if (data.keyTakeaways && data.keyTakeaways.length > 0) {
        setTakeaway1(data.keyTakeaways[0] || '');
        setTakeaway2(data.keyTakeaways[1] || '');
      }
      if (data.scriptureRef) {
        setScriptureRef(data.scriptureRef);
      }
      setOriginalLanguage(aiLanguage);

      setActiveSubTab('upload');
    } catch (err) {
      console.error('AI Draft Error:', err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const selectedPlace = worshipPlaces.find((p) => p.id === selectedPlaceId) || worshipPlaces[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Sub-Navigation */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {userRole === 'super_admin' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-300" /> Platform Superuser Master Admin
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Masjid & Prayer Place Admin
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-100">
            {userRole === 'super_admin'
              ? 'Superuser Admin & Property Approval Command Center'
              : 'Sermon Upload & Masjid Management Portal'}
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {userRole === 'super_admin'
              ? 'Review pending Masjid registrations, approve/reject Masjid Admin accounts, configure new properties & facilities, and oversee live broadcasts.'
              : 'Set up prayer place accounts, author sermons in any language, and dispatch AI translated broadcasts to followers.'}
          </p>
        </div>

        {/* Sub Navigation Pills */}
        <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 flex-wrap">
          {userRole === 'super_admin' && (
            <button
              onClick={() => setActiveSubTab('approvals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'approvals'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Approvals & Properties
              {(pendingPlaces.length > 0 || pendingAdminReqs.length > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {pendingPlaces.length + pendingAdminReqs.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'upload'
                ? 'bg-amber-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Upload / Write Sermon
          </button>
          <button
            onClick={() => setActiveSubTab('aiDraft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'aiDraft'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            ✨ AI Draft Assistant
          </button>
          <button
            onClick={() => setActiveSubTab('places')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'places'
                ? 'bg-teal-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Setup New Property
          </button>
        </div>
      </div>

      {/* SUB-TAB 0: SUPERUSER APPROVALS & PROPERTY MANAGEMENT */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-6">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
              <span className="text-xs text-stone-400 font-semibold uppercase">Pending Masjid Approvals</span>
              <p className="text-2xl font-bold font-mono text-amber-400">{pendingPlaces.length}</p>
              <p className="text-[11px] text-stone-500">Awaiting Super Admin Verification</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
              <span className="text-xs text-stone-400 font-semibold uppercase">Pending Admin Registrations</span>
              <p className="text-2xl font-bold font-mono text-purple-400">{pendingAdminReqs.length}</p>
              <p className="text-[11px] text-stone-500">Imam / Admin Account Requests</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
              <span className="text-xs text-stone-400 font-semibold uppercase">Verified Active Properties</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">{approvedPlaces.length}</p>
              <p className="text-[11px] text-stone-500">Approved Worship Centers</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
              <span className="text-xs text-stone-400 font-semibold uppercase">Total Sermons Published</span>
              <p className="text-2xl font-bold font-mono text-indigo-400">{sermons.length}</p>
              <p className="text-[11px] text-stone-500">Multilingual Broadcasts</p>
            </div>
          </div>

          {/* SECTION 1: PENDING MASJID / WORSHIP PLACE APPROVALS */}
          <div className="p-6 rounded-2xl bg-stone-900 border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-stone-100 font-serif">
                  1. Pending Masjid & Worship Place Submissions ({pendingPlaces.length})
                </h3>
              </div>
              <span className="text-xs text-stone-400">Superuser Verification Queue</span>
            </div>

            {pendingPlaces.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-xs bg-stone-950 rounded-xl border border-stone-800">
                ✓ All submitted Masjids and prayer places have been verified and approved!
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="p-5 rounded-2xl bg-stone-950 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-16 h-16 rounded-xl object-cover border border-stone-700 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {place.religion} • {place.venueType}
                          </span>
                          <span className="text-[11px] text-stone-400">Submitted: {place.createdAt || 'Recently'}</span>
                        </div>

                        <h4 className="font-bold text-stone-100 text-sm font-serif">
                          {place.name}
                        </h4>

                        <p className="text-xs text-stone-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-500" />
                          {place.address} ({place.city}, {place.country})
                        </p>

                        <p className="text-xs text-stone-300">
                          <strong className="text-amber-400">Admin:</strong> {place.adminName} ({place.contactEmail}) | <strong className="text-emerald-400">Preacher:</strong> {place.preacherTitle} {place.preacherName}
                        </p>

                        {/* Facilities */}
                        {place.facilities && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {place.facilities.map((f) => (
                              <span key={f} className="px-2 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300">
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onApprovePlace(place.id)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Approve Masjid
                      </button>

                      <button
                        onClick={() => onRejectPlace(place.id)}
                        className="px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: PENDING MASJID ADMIN ACCOUNT REQUESTS */}
          <div className="p-6 rounded-2xl bg-stone-900 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-stone-100 font-serif">
                  2. Pending Masjid Admin Account Registration Requests ({pendingAdminReqs.length})
                </h3>
              </div>
              <span className="text-xs text-stone-400">Account Authorization</span>
            </div>

            {pendingAdminReqs.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-xs bg-stone-950 rounded-xl border border-stone-800">
                ✓ No pending admin account approval requests.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAdminReqs.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-100 text-xs font-serif">{req.fullName}</span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                          {req.role}
                        </span>
                        <span className="text-[10px] text-stone-500">{req.requestedAt}</span>
                      </div>

                      <p className="text-xs text-stone-300">
                        Requested admin access for: <strong className="text-amber-400">{req.placeName}</strong>
                      </p>

                      <p className="text-xs text-stone-400 font-mono">
                        Email: {req.email} | Phone: {req.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveAdminAccount(req.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Account
                      </button>

                      <button
                        onClick={() => onRejectAdminAccount(req.id)}
                        className="px-3 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: ALL VERIFIED ACTIVE PROPERTIES */}
          <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-stone-100 font-serif border-b border-stone-800 pb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              3. Verified Properties & Worship Centers ({approvedPlaces.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedPlaces.map((place) => (
                <div key={place.id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <img src={place.imageUrl} alt={place.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-stone-200 text-xs font-serif line-clamp-1">{place.name}</h4>
                      <p className="text-[11px] text-stone-400">{place.city}, {place.country}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold">✓ Verified Active</span>
                    </div>
                  </div>

                  {place.facilities && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {place.facilities.map((f) => (
                        <span key={f} className="px-1.5 py-0.5 rounded text-[9px] bg-stone-800 text-stone-400">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 1: UPLOAD SERMON */}
      {activeSubTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Upload Form */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-100 font-serif flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Upload New Sermon / Khutbah
              </h3>
              <span className="text-xs text-stone-400">Step 1 of 2: Authoring</span>
            </div>

            {sermonSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Sermon successfully uploaded! Followers will receive AI translated broadcasts via WhatsApp & Email.
              </div>
            )}

            <form onSubmit={handleCreateSermon} className="space-y-4">
              
              {/* Select Prayer Place & Speaker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Select Prayer Place / Mosque
                  </label>
                  <select
                    value={selectedPlaceId}
                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {worshipPlaces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city} - {p.religion})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Original Sermon Language
                  </label>
                  <select
                    value={originalLanguage}
                    onChange={(e) => setOriginalLanguage(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu (اردو)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Sanskrit">Sanskrit (संस्कृत)</option>
                    <option value="Hebrew">Hebrew (עברית)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>

              {/* Title & Speaker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Sermon Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={sermonTitle}
                    onChange={(e) => setSermonTitle(e.target.value)}
                    placeholder="e.g. خطبة الجمعة: أهمية الصبر or Sunday Homily"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Speaker / Preacher Name
                  </label>
                  <input
                    type="text"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    placeholder={selectedPlace?.preacherName || 'e.g. Sheikh Muhammad Al-Azhari'}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Scripture Ref & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Scripture / Verse Reference
                  </label>
                  <input
                    type="text"
                    value={scriptureRef}
                    onChange={(e) => setScriptureRef(e.target.value)}
                    placeholder="e.g. Surah Al-Baqarah (2:153) or Matthew 5:14-16"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Topic Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={topicTags}
                    onChange={(e) => setTopicTags(e.target.value)}
                    placeholder="Patience, Trust, Gratitude, Community"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Brief Summary (2-3 Sentences)
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize key spiritual message for followers..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Full Sermon Text */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Full Sermon Text (in Original Language) *
                </label>
                <textarea
                  required
                  rows={6}
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Paste or write the full sermon, Khutbah, or discourse here in Arabic, English, Urdu, Hindi, Hebrew, etc..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-serif leading-relaxed text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  dir={originalLanguage === 'Arabic' || originalLanguage === 'Urdu' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Key Takeaway #1
                  </label>
                  <input
                    type="text"
                    value={takeaway1}
                    onChange={(e) => setTakeaway1(e.target.value)}
                    placeholder="e.g. Practice patience in everyday trials"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                    Key Takeaway #2
                  </label>
                  <input
                    type="text"
                    value={takeaway2}
                    onChange={(e) => setTakeaway2(e.target.value)}
                    placeholder="e.g. Show active compassion to neighbors"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Publish Sermon & Enable AI Multilingual Translations
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Side Info & Recent Published Sermons */}
          <div className="space-y-6">
            
            {/* Selected Place Badge Card */}
            <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Active Prayer Place Account
              </h4>
              <div className="flex items-center gap-3">
                <img
                  src={selectedPlace.imageUrl}
                  alt={selectedPlace.name}
                  className="w-12 h-12 rounded-xl object-cover border border-stone-700"
                />
                <div>
                  <h5 className="font-bold text-sm text-stone-100 font-serif">
                    {selectedPlace.name}
                  </h5>
                  <p className="text-xs text-stone-400">
                    {selectedPlace.city}, {selectedPlace.country}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    {selectedPlace.followerCount} Subscribed Worshippers
                  </p>
                </div>
              </div>
            </div>

            {/* Recently Uploaded Sermons List */}
            <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center justify-between">
                <span>Recent Sermons</span>
                <span className="text-[10px] text-stone-500">{sermons.length} Total</span>
              </h4>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sermons.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectSermon(s)}
                    className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        {s.religion} • {s.originalLanguage}
                      </span>
                      <span className="text-[10px] text-stone-500">{s.date}</span>
                    </div>
                    <p className="text-xs font-bold text-stone-200 line-clamp-1 font-serif">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      By {s.speakerName} ({s.placeName})
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: AI SERMON ASSISTANT */}
      {activeSubTab === 'aiDraft' && (
        <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-stone-800 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100 font-serif">
                AI Preacher Assistant (Khutbah / Sermon Draft Generator)
              </h3>
              <p className="text-xs text-stone-400">
                Generate high-quality, reverent sermon outlines or complete sermon drafts using Gemini AI.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                Religious Tradition
              </label>
              <select
                value={aiReligion}
                onChange={(e) => setAiReligion(e.target.value as Religion)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Islam">Islam (Khutbah / Friday Sermon)</option>
                <option value="Christianity">Christianity (Sunday Homily / Message)</option>
                <option value="Hinduism">Hinduism (Vedic Discourse / Satsang)</option>
                <option value="Judaism">Judaism (Shabbat Sermon)</option>
                <option value="Sikhism">Sikhism (Gurbani Katha)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                Sermon Topic or Theme *
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Cultivating Patience during Difficulties, Honoring Parents, Inner Peace"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Optional Scripture / Verse Focus
                </label>
                <input
                  type="text"
                  value={aiScripture}
                  onChange={(e) => setAiScripture(e.target.value)}
                  placeholder="e.g. Surah Al-Baqarah 2:153 or Colossians 3:12"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Draft Language
                </label>
                <select
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="English">English</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateAiDraft}
              disabled={generatingDraft || !aiTopic}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
            >
              {generatingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Sermon Draft...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Draft Sermon with AI & Load in Editor
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SETUP NEW PRAYER PLACE */}
      {activeSubTab === 'places' && (
        <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-stone-800 pb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100 font-serif">
                Setup New Prayer Place Account (Masjid / Church / Temple / Gurdwara)
              </h3>
              <p className="text-xs text-stone-400">
                Register a new place of worship to enable worshipper subscriptions & sermon broadcasts.
              </p>
            </div>
          </div>

          {placeSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Prayer Place setup complete! Switched to sermon upload view.
            </div>
          )}

          <form onSubmit={handleCreatePlace} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Place of Worship Name *
                </label>
                <input
                  type="text"
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g. Al-Noor Islamic Center or Grace Cathedral"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Religion / Faith
                </label>
                <select
                  value={religion}
                  onChange={(e) => {
                    const r = e.target.value as Religion;
                    setReligion(r);
                    setVenueType(
                      r === 'Islam'
                        ? 'Mosque / Masjid'
                        : r === 'Christianity'
                        ? 'Church'
                        : r === 'Hinduism'
                        ? 'Mandir / Temple'
                        : r === 'Judaism'
                        ? 'Synagogue'
                        : 'Gurdwara'
                    );
                    setCongregationDay(
                      r === 'Islam'
                        ? 'Friday'
                        : r === 'Christianity' || r === 'Hinduism' || r === 'Sikhism'
                        ? 'Sunday'
                        : 'Saturday'
                    );
                    setPreacherTitle(
                      r === 'Islam'
                        ? 'Imam'
                        : r === 'Christianity'
                        ? 'Pastor'
                        : r === 'Hinduism'
                        ? 'Priest / Acharya'
                        : r === 'Judaism'
                        ? 'Rabbi'
                        : 'Granthi'
                    );
                  }}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Islam">Islam</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Hinduism">Hinduism</option>
                  <option value="Judaism">Judaism</option>
                  <option value="Sikhism">Sikhism</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Primary Congregation Day
                </label>
                <select
                  value={congregationDay}
                  onChange={(e) => setCongregationDay(e.target.value as CongregationDay)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Friday">Friday (e.g. Jummah)</option>
                  <option value="Sunday">Sunday (e.g. Sunday Service)</option>
                  <option value="Saturday">Saturday (e.g. Shabbat)</option>
                  <option value="Daily">Daily Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  City & Country *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (e.g. London)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country (e.g. UK)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Admin Account Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Tariq Al-Mansoor"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Lead Preacher Name & Title
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={preacherTitle}
                    onChange={(e) => setPreacherTitle(e.target.value)}
                    placeholder="Title (e.g. Imam)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    value={preacherName}
                    onChange={(e) => setPreacherName(e.target.value)}
                    placeholder="Preacher Name"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                Description / Welcome Message
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief introduction for worshippers joining your prayer place..."
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                Property Facility Specifications
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVAILABLE_FACILITIES.map((facility) => {
                  const isChecked = selectedFacilities.includes(facility);
                  return (
                    <button
                      type="button"
                      key={facility}
                      onClick={() => toggleFacility(facility)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isChecked
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {facility}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Save & Register Property Account
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
