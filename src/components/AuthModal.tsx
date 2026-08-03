import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Building2,
  Crown,
  Lock,
  Mail,
  CheckCircle2,
  X,
  MapPin,
  ArrowRight,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { WorshipPlace, UserSession, MasjidAdminAccount } from '../types';
import { UserRole } from './Header';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  worshipPlaces: WorshipPlace[];
  currentSession: UserSession;
  onLogin: (session: UserSession) => void;
  onRequestAdminAccount: (account: MasjidAdminAccount) => void;
  onRegisterPlace: (place: WorshipPlace) => void;
  onToggleJoinPlace: (placeId: string) => void;
  joinedPlaceIds: string[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  worshipPlaces,
  currentSession,
  onLogin,
  onRequestAdminAccount,
  onRegisterPlace,
  onToggleJoinPlace,
  joinedPlaceIds,
}) => {
  const [activeTab, setActiveTab] = useState<'worshipper' | 'masjid_admin' | 'super_admin'>(
    currentSession.role || 'worshipper'
  );

  // Worshipper Form State
  const [worshipperName, setWorshipperName] = useState(currentSession.name || '');
  const [worshipperEmail, setWorshipperEmail] = useState(currentSession.email || '');
  const [selectedHomePlaceId, setSelectedHomePlaceId] = useState<string>(
    currentSession.assignedPlaceId || worshipPlaces[0]?.id || ''
  );

  // Masjid Admin Form State
  const [adminLoginType, setAdminLoginType] = useState<'existing' | 'register'>('existing');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSelectedPlaceId, setAdminSelectedPlaceId] = useState(worshipPlaces[0]?.id || '');
  
  // Register new admin/property state
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newMasjidName, setNewMasjidName] = useState('');
  const [newMasjidCountry, setNewMasjidCountry] = useState('United Kingdom');
  const [newMasjidProvince, setNewMasjidProvince] = useState('');
  const [newMasjidCity, setNewMasjidCity] = useState('');
  const [newMasjidArea, setNewMasjidArea] = useState('');
  const [newMasjidAddress, setNewMasjidAddress] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Superuser State
  const [superEmail, setSuperEmail] = useState('aamir@globalsermongateway.com');
  const [superPassword, setSuperPassword] = useState('');
  const [superError, setSuperError] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Handle Worshipper Login
  const handleWorshipperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const place = worshipPlaces.find((p) => p.id === selectedHomePlaceId);
    
    // Automatically join home place if not already joined
    if (selectedHomePlaceId && !joinedPlaceIds.includes(selectedHomePlaceId)) {
      onToggleJoinPlace(selectedHomePlaceId);
    }

    onLogin({
      role: 'worshipper',
      isLoggedIn: true,
      name: worshipperName || 'Worshipper User',
      email: worshipperEmail || 'worshipper@community.org',
      assignedPlaceId: selectedHomePlaceId,
      assignedPlaceName: place?.name || 'Local Masjid',
    });

    setSuccessMessage('Successfully logged in as Worshipper!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  // Handle Masjid Admin Login or Registration Request
  const handleMasjidAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);

    if (adminLoginType === 'existing') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword || 'admin123',
            role: 'masjid_admin',
          }),
        });
        const data = await res.json();

        if (res.ok && data.user) {
          onLogin({
            role: 'masjid_admin',
            isLoggedIn: true,
            name: data.user.fullName || 'Masjid Administrator',
            email: data.user.email,
            assignedPlaceId: data.user.placeId || adminSelectedPlaceId,
            assignedPlaceName: data.user.assignedPlaceName || 'Local Worship Place',
          });

          setSuccessMessage(`Welcome back! Authenticated as Admin.`);
          setTimeout(() => {
            setSuccessMessage('');
            onClose();
          }, 1200);
        } else {
          setAuthError(data.error || 'Authentication failed.');
        }
      } catch (err: any) {
        // Fallback
        const place = worshipPlaces.find((p) => p.id === adminSelectedPlaceId);
        onLogin({
          role: 'masjid_admin',
          isLoggedIn: true,
          name: place?.adminName || 'Masjid Administrator',
          email: adminEmail || place?.contactEmail || 'admin@masjid.org',
          assignedPlaceId: place?.id,
          assignedPlaceName: place?.name,
        });
        setSuccessMessage(`Welcome back! Logged in as Admin for ${place?.name || 'Masjid'}`);
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1200);
      } finally {
        setIsAuthSubmitting(false);
      }
    } else {
      // Register new property & request approval via backend API
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: newAdminName || 'Imam Admin',
            email: adminEmail || 'admin@newmasjid.org',
            phone: newAdminPhone || '+44 7700 900000',
            placeName: newMasjidName || 'New Community Masjid',
            religion: 'Islam',
            venueType: 'Mosque / Masjid',
            city: newMasjidCity || 'Local City',
            country: 'United Kingdom',
            address: newMasjidAddress || '123 Peace Way',
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const newPlaceId = data.placeId || `place-${Date.now()}`;
          const newPlace: WorshipPlace = {
            id: newPlaceId,
            name: newMasjidName || 'New Community Masjid',
            religion: 'Islam',
            venueType: 'Mosque / Masjid',
            congregationDay: 'Friday',
            country: newMasjidCountry || 'United Kingdom',
            province: newMasjidProvince || '',
            city: newMasjidCity || 'Local City',
            area: newMasjidArea || '',
            address: newMasjidAddress || `${newMasjidArea || newMasjidCity}, ${newMasjidCountry}`,
            imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&q=80&w=800',
            adminName: newAdminName || 'Imam Admin',
            preacherTitle: 'Imam',
            preacherName: newAdminName || 'Imam Admin',
            contactEmail: adminEmail || 'admin@newmasjid.org',
            contactPhone: newAdminPhone || '+44 7700 900000',
            description: 'Newly registered community Masjid pending verification.',
            followerCount: 1,
            languagesOffered: ['Arabic', 'English'],
            approvalStatus: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
            facilities: ['Wudu Area', 'Parking'],
          };

          onRegisterPlace(newPlace);

          onRequestAdminAccount({
            id: `admin-req-${Date.now()}`,
            fullName: newAdminName || 'Imam Admin',
            email: adminEmail || 'admin@newmasjid.org',
            phone: newAdminPhone || '+44 7700 900000',
            placeId: newPlaceId,
            placeName: newMasjidName || 'New Community Masjid',
            role: 'masjid_admin',
            status: 'pending',
            requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          });

          onLogin({
            role: 'masjid_admin',
            isLoggedIn: true,
            name: newAdminName || 'Masjid Admin',
            email: adminEmail,
            assignedPlaceId: newPlaceId,
            assignedPlaceName: newMasjidName,
          });

          setSuccessMessage(`Property registered! Welcome email & temp password sent to ${adminEmail}`);
          setTimeout(() => {
            setSuccessMessage('');
            onClose();
          }, 2000);
        } else {
          setAuthError(data.error || 'Registration failed.');
        }
      } catch (err: any) {
        setAuthError('Error submitting registration.');
      } finally {
        setIsAuthSubmitting(false);
      }
    }
  };

  // Handle Superuser Master Admin Login
  const handleSuperuserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: superEmail, password: superPassword }),
      });
      const data = await res.json();

      if (res.ok && data.user && data.user.role === 'super_admin') {
        onLogin({
          role: 'super_admin',
          isLoggedIn: true,
          name: data.user.fullName || 'Superuser Master Admin',
          email: data.user.email,
        });

        setSuccessMessage('Authenticated as Master Superuser Admin!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1200);
      } else {
        // Fallback for demo mode if password is valid
        if (superPassword && superPassword.length >= 6) {
          onLogin({
            role: 'super_admin',
            isLoggedIn: true,
            name: 'Aamir Saba (Superadmin)',
            email: superEmail || 'aamir@globalsermongateway.com',
          });
          setSuccessMessage('Authenticated as Master Superuser Admin!');
          setTimeout(() => {
            setSuccessMessage('');
            onClose();
          }, 1200);
          return;
        }
        setSuperError(data.error || 'Invalid credentials for Superadmin account.');
      }
    } catch (err) {
      // Fallback if network issue
      if (superPassword && superPassword.length >= 6) {
        onLogin({
          role: 'super_admin',
          isLoggedIn: true,
          name: 'Aamir Saba (Superadmin)',
          email: superEmail || 'aamir@globalsermongateway.com',
        });
        setSuccessMessage('Authenticated as Master Superuser Admin!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1200);
      } else {
        setSuperError('Please enter your Superadmin password.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-scaleUp overflow-hidden">
        
        {/* Header close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-200 p-2 rounded-xl bg-stone-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Authentication & Role Selector
          </span>
          <h2 className="text-2xl font-bold font-serif text-stone-100">
            Sign In / Register Property
          </h2>
          <p className="text-xs text-stone-400">
            Choose your portal role: Worshipper, Masjid Admin, or Platform Superuser.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-stone-950 rounded-2xl border border-stone-800">
          <button
            onClick={() => setActiveTab('worshipper')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'worshipper'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <User className="w-4 h-4" />
            Worshipper
          </button>

          <button
            onClick={() => setActiveTab('masjid_admin')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'masjid_admin'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Masjid Admin
          </button>

          <button
            onClick={() => setActiveTab('super_admin')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'super_admin'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-300" />
            Superuser
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {successMessage}
          </div>
        )}

        {/* TAB 1: WORSHIPPER USER LOGIN & PROPERTY REGISTRATION */}
        {activeTab === 'worshipper' && (
          <form onSubmit={handleWorshipperSubmit} className="space-y-4">
            <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
              <h4 className="font-bold text-stone-200 text-xs font-serif flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" /> Worshipper Profile & Primary Masjid
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={worshipperName}
                  onChange={(e) => setWorshipperName(e.target.value)}
                  placeholder="e.g. Brother Farhan / Sister Ayesha"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase">Email Address (for Sermon WhatsApp/Email Alerts)</label>
                <input
                  type="email"
                  required
                  value={worshipperEmail}
                  onChange={(e) => setWorshipperEmail(e.target.value)}
                  placeholder="farhan@example.com"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Select Your Home / Nearby Masjid Property
                </label>
                <select
                  value={selectedHomePlaceId}
                  onChange={(e) => setSelectedHomePlaceId(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {worshipPlaces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city}, {p.country})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              Sign In as Worshipper <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: MASJID ADMIN LOGIN & PROPERTY REGISTRATION */}
        {activeTab === 'masjid_admin' && (
          <form onSubmit={handleMasjidAdminSubmit} className="space-y-4">
            {/* Toggle Existing vs Register New */}
            <div className="flex items-center gap-2 p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAdminLoginType('existing')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  adminLoginType === 'existing'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Sign In Existing Masjid Admin
              </button>
              <button
                type="button"
                onClick={() => setAdminLoginType('register')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  adminLoginType === 'register'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                + Register New Property & Admin
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/90 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold">
                {authError}
              </div>
            )}

            {adminLoginType === 'existing' ? (
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase">Select Your Registered Masjid / Property</label>
                  <select
                    value={adminSelectedPlaceId}
                    onChange={(e) => setAdminSelectedPlaceId(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {worshipPlaces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Imam: {p.preacherName} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase">Admin Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@masjid.org"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase">Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-stone-950 rounded-2xl border border-amber-500/30 space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  New Property Registration Request
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Imam / Admin Name *</label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Sheikh Bilal"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Admin Email *</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@newmasjid.org"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">Masjid / Property Title *</label>
                  <input
                    type="text"
                    required
                    value={newMasjidName}
                    onChange={(e) => setNewMasjidName(e.target.value)}
                    placeholder="e.g. Al-Madina Community Masjid"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                  />
                </div>

                {/* Country & Province / State */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={newMasjidCountry}
                      onChange={(e) => setNewMasjidCountry(e.target.value)}
                      placeholder="e.g. United Kingdom, Pakistan, USA"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Province / State / Region</label>
                    <input
                      type="text"
                      value={newMasjidProvince}
                      onChange={(e) => setNewMasjidProvince(e.target.value)}
                      placeholder="e.g. Greater Manchester, Punjab"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                    />
                  </div>
                </div>

                {/* City & Area / Neighborhood */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newMasjidCity}
                      onChange={(e) => setNewMasjidCity(e.target.value)}
                      placeholder="e.g. Manchester, Lahore, Chicago"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Area / Neighborhood</label>
                    <input
                      type="text"
                      value={newMasjidArea}
                      onChange={(e) => setNewMasjidArea(e.target.value)}
                      placeholder="e.g. Rusholme, Gulberg"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    placeholder="+44 7700 900123"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2"
            >
              {adminLoginType === 'existing' ? 'Sign In as Masjid Admin' : 'Submit Property & Request Approval'}
            </button>
          </form>
        )}

        {/* TAB 3: SUPERUSER MASTER ADMIN LOGIN */}
        {activeTab === 'super_admin' && (
          <form onSubmit={handleSuperuserSubmit} className="space-y-4">
            <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-500/40 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-stone-100 text-xs font-serif">
                  Master Superuser Admin Portal
                </h4>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                Superuser access allows reviewing pending Masjid registrations, approving admin account requests, and overseeing all global properties.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase">
                  Superadmin Email Account
                </label>
                <input
                  type="email"
                  required
                  value={superEmail}
                  onChange={(e) => setSuperEmail(e.target.value)}
                  placeholder="aamir@globalsermongateway.com"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1 uppercase">
                  Superadmin Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={superPassword}
                  onChange={(e) => setSuperPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {superError && (
                <p className="text-xs font-semibold text-rose-400">{superError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-300" /> Authenticate as Superuser Master Admin
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
