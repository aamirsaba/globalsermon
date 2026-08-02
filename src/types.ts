export interface UserSession {
  role: 'worshipper' | 'masjid_admin' | 'super_admin';
  isLoggedIn: boolean;
  name?: string;
  email?: string;
  assignedPlaceId?: string; // for masjid admin or worshipper's primary property
  assignedPlaceName?: string;
}

export type Religion =
  | 'Islam'
  | 'Christianity'
  | 'Hinduism'
  | 'Judaism'
  | 'Sikhism'
  | 'Buddhism'
  | 'Other';

export type CongregationDay =
  | 'Friday'
  | 'Sunday'
  | 'Saturday'
  | 'Thursday'
  | 'Daily';

export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface WorshipPlace {
  id: string;
  name: string;
  religion: Religion;
  venueType: string; // e.g. "Mosque / Masjid", "Church", "Temple", "Synagogue", "Gurdwara"
  congregationDay: CongregationDay;
  city: string;
  country: string;
  address: string;
  imageUrl: string;
  adminName: string;
  preacherTitle: string; // e.g. "Imam", "Pastor", "Priest", "Pandit", "Rabbi", "Granthi"
  preacherName: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  followerCount: number;
  languagesOffered: string[];
  lat?: number;
  lng?: number;
  approvalStatus?: ApprovalStatus;
  createdAt?: string;
  facilities?: string[]; // e.g., ["Wudu Area", "Ladies Section", "Wheelchair Access", "Parking", "Library"]
}

export interface MasjidAdminAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  placeId: string;
  placeName: string;
  role: 'masjid_admin';
  status: ApprovalStatus;
  requestedAt: string;
  approvedAt?: string;
}

export interface Sermon {
  id: string;
  placeId: string;
  placeName: string;
  religion: Religion;
  title: string;
  speakerName: string;
  speakerTitle: string;
  originalLanguage: string; // e.g. 'Arabic', 'English', 'Sanskrit', 'Hebrew', 'Urdu', 'Hindi'
  originalLanguageCode: string; // e.g. 'ar', 'en', 'sa', 'he', 'ur', 'hi'
  date: string;
  originalText: string;
  summary: string;
  keyTakeaways: string[];
  scriptureReference?: string;
  topicTags: string[];
  audioUrl?: string;
}

export interface TranslationResult {
  sermonId: string;
  targetLanguage: string;
  targetLanguageCode: string;
  translatedTitle: string;
  translatedText: string;
  translatedSummary: string;
  translatedTakeaways: string[];
  sacredTerminologyNotes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneWhatsApp: string;
  preferredLanguage: string; // e.g., "Urdu", "English", "Spanish", "Arabic", "Hindi"
  preferredLanguageCode: string;
  joinedPlaceIds: string[];
  deliveryPreference: 'whatsapp' | 'email' | 'both';
}

export interface BroadcastLog {
  id: string;
  sermonId: string;
  sermonTitle: string;
  placeName: string;
  timestamp: string;
  channel: 'WhatsApp' | 'Email' | 'Both';
  recipientsCount: number;
  languageBreakdown: Record<string, number>;
  sampleMessages: Array<{
    recipientName: string;
    language: string;
    channel: 'WhatsApp' | 'Email';
    previewText: string;
    status: 'Sent' | 'Delivered' | 'Read';
  }>;
}

export interface LiveStreamChunk {
  id: string;
  speakerTimestamp: string;
  originalText: string;
  translations: Record<string, string>; // languageCode -> translatedText
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', direction: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', direction: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', direction: 'ltr' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文', flag: '🇨🇳', direction: 'ltr' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', flag: '🇮🇷', direction: 'rtl' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫', direction: 'rtl' },
];
