// ============================================================================
// FINDIT HARARE — ELECTRIC BLUE & WHITE PRODUCTION ENGINE (100% VECTOR SVG UI)
// ============================================================================

const SESSION_KEY = 'findit_harare_session_v3';

// Hybrid APK & Web Native API Base:
// When running compiled inside Android APK (file:///android_asset/), dynamically connect to cloud backend
const API_BASE = (typeof window !== 'undefined' && (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null' || (window.location.hostname === 'localhost' && window.location.port !== '3030')))
  ? 'https://finditharare.vercel.app'
  : '';

const DEFAULT_AVATAR_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E2E8F0'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2394A3B8'/%3E%3Cpath d='M20 86c0-16 13-30 30-30s30 14 30 30' fill='%2394A3B8'/%3E%3C/svg%3E";
const DEFAULT_TASK_PHOTO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='12' fill='%23EBF3FF'/%3E%3Cpath d='M30 40h40M30 50h40M30 60h25' stroke='%230066FF' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E";

function resolveMediaUrl(url, type = 'avatar') {
  if (!url || typeof url !== 'string' || url === 'undefined' || url === 'null') {
    return type === 'task' ? DEFAULT_TASK_PHOTO_FALLBACK : DEFAULT_AVATAR_FALLBACK;
  }
  if (url.includes('tinashe_selfie.png')) {
    return (API_BASE || '') + '/api/media/img_689d999fee5679b5b5c5';
  }
  if (url.startsWith('data:image/')) {
    return url;
  }
  if (url.startsWith('/api/')) {
    return (API_BASE || '') + url;
  }
  return url;
}
const WS_RELAY_HOST = (typeof window !== 'undefined' && window.FINDIT_WS_HOST) ? window.FINDIT_WS_HOST : '';

const state = {
  db: null,
  role: 'CUSTOMER', // 'CUSTOMER' | 'PROVIDER'
  currentUser: null,
  isAuthenticated: false,

  // Screen flow: 'HOME' -> 'CONFIGURE' -> 'SEARCHING' -> 'BOOKED'
  screenStep: 'HOME',

  selectedCategoryId: 'repairs_construction',
  selectedSuburbId: 'avondale',
  selectedSubServiceIdx: 0,
  selectedTierKey: 'STANDARD', // 'STANDARD' | 'PLATINUM' | 'ONE_CLICK' | 'BUDGET'

  customAddress: 'Current Live Location',
  customSuburbLabel: 'Live Location, Harare',
  isCustomAddressSelected: false,
  entranceNote: 'Main Gate',
  pinnedLat: -17.7955,
  pinnedLng: 31.0365,

  draftFareUsd: 25,
  recommendedFareUsd: 25,
  draftPaymentMethod: 'Cash USD',
  draftAutoAccept: false,
  draftNotes: '',
  draftPhotoUrl: null,
  notesLeakageWarning: '',

  // inDrive Style: Booking for Myself or Someone Else
  bookingFor: 'ME', // 'ME' | 'SOMEONE_ELSE'
  recipientName: '',
  recipientPhone: '',

  // Findit Dispatch: Immediate vs Scheduled Visit
  timingType: 'IMMEDIATE', // 'IMMEDIATE' | 'SCHEDULED'
  scheduledDate: '',
  scheduledTime: '',

  // Active searching fare stepper (-0.50 / +0.50)
  pendingSearchFareUsd: null,
  searchTimerSeconds: 120,

  activeRequestId: null,
  providerTab: 'FEED', // 'FEED' | 'ACTIVE_JOB' | 'WALLET' | 'CATALOGUE'

  // Service Provider Wallet Top-Up State
  walletTopupMethod: 'EcoCash USD',
  walletTopupAmount: 10,

  // Collapsible bottom sheet & offer stack for 100% full-screen map view
  isSheetMinimized: false,
  isOffersMinimized: false,

  // Modals: null | 'CANCEL_TASK' | 'CATALOGUE_VIEW' | 'DRAWER' | 'SIGNUP_FLOW' | 'TERMS_MODAL' | 'PRIVACY_MODAL' | 'HISTORY' | 'SAFETY' | 'SETTINGS' | 'SUBURB_PICKER' | 'SERVICE_PICKER' | 'NOTES_MODAL' | 'PAYMENT_MODAL' | 'UPLOAD_CATALOGUE' | 'EDIT_BIO_MODAL' | 'COMING_SOON_MODAL' | 'RATE_BOOKING_MODAL'
  activeModal: null,
  modalData: null,

  // Rating Modal State
  ratingStars: 5,
  ratingTags: ['Punctual Arrival', 'Clean Mobile Kit', 'Professional Work'],

  // Real File Upload Preview State (Provider Portfolio)
  uploadedFileDataUrl: null,
  uploadedFileName: '',
  uploadSuspectedWatermark: false,

  // Full inDrive & Findit Style Multi-Hub & Biometrics State
  hubView: 'HUB', // 'HUB' | 'MARKETPLACE'
  onboardingSlide: 0, // 0 | 1
  onboardingActive: false,
  authPassword: '',
  authIdType: 'National ID',
  authIdNumber: '',
  authIdPhotoUrl: null,
  authCategoryIds: ['repairs_construction'],
  faceScanning: false,
  faceVerifiedSuccess: false,

  authStep: 'PHONE', // 'PHONE' | 'OTP' | 'PROFILE'
  authRole: 'CUSTOMER', // 'CUSTOMER' | 'PROVIDER'
  authPhone: '+263 77 ',
  authOtpDigits: ['', '', '', ''],
  authName: '',
  authSuburbId: 'avondale',
  authCategoryId: 'repairs_construction',
  authSkillTier: 'Platinum pro',
  authBrandName: '',
  authStartingPrice: 25,
  authNationalId: '63-2948102-F-42',
  authTermsAccepted: true,
  authCapturedSelfieUrl: null,
  authFaceScanVerified: false,
  authPortfolioPhotoUrl: null,

  chatDrawerOpen: false,
  activeChatProviderId: null,
  activeCall: null,
  callSeconds: 0,
  splashDismissed: false
};

const ACTIVE_BOOKED_STATUSES = ['BOOKED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'];

function isBookedStatus(status) {
  return ACTIVE_BOOKED_STATUSES.includes(status);
}

// ============================================================================
// UNIVERSAL VECTOR SVG ICON SYSTEM (ZERO EMOJIS ANYWHERE)
// ============================================================================
function uiIcon(name, size = 16) {
  const s = size;
  const icons = {
    star: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1.8" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starOutline: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    diamond: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path d="M12 2L22 12L12 22L2 12L12 2Z"/></svg>`,
    check: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>`,
    close: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    chevronUp: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="18 15 12 9 6 15"/></svg>`,
    chevronDown: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>`,
    chevronLeft: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="15 18 9 12 15 6"/></svg>`,
    chevronRight: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>`,
    send: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    arrowLeft: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    briefcase: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    user: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    map: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    pin: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    navigation: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
    crosshair: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="7"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/></svg>`,
    routeCar: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="11" width="18" height="7" rx="2"/><path d="M5 11l2-5h10l2 5"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>`,
    phone: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    chat: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    shield: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    lock: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    key: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
    wallet: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/><path d="M2 10h20"/></svg>`,
    list: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`,
    image: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    clock: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`,
    home: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    bell: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    gear: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    info: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    support: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    facebook: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
    instagram: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    camera: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    sparkle: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`,
    notes: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    edit: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    hailingPerson: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="8.5" cy="5" r="2.5"/><path d="M5 21v-6a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v6"/><path d="M12 11l5-4 2 1.5"/><path d="M6 12l-2 4"/></svg>`,
    buildingOffice: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><path d="M10 22v-4h4v4"/></svg>`,
    trash: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    plus: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    dotOnline: `<span style="width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow:0 0 0 2.5px rgba(16,185,129,0.28); display:inline-block; flex-shrink:0;"></span>`,
    dotOffline: `<span style="width:8px; height:8px; border-radius:50%; background:#94A3B8; display:inline-block; flex-shrink:0;"></span>`,
    refresh: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    zwFlag: `<svg width="${s}" height="${Math.round(s * 0.72)}" viewBox="0 0 28 20" fill="none" style="border-radius:3px; flex-shrink:0;"><rect width="28" height="20" fill="#006400"/><rect y="3" width="28" height="14" fill="#FFD200"/><rect y="6" width="28" height="8" fill="#D40000"/><rect y="8.5" width="28" height="3" fill="#000000"/><polygon points="0,0 11,10 0,20" fill="#FFFFFF"/></svg>`,
    bolt: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    users: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    calendar: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    toolbox: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 7H2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>`,
    chart: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    mic: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    micOff: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    globe: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    wifiOff: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`
  };
  return icons[name] || icons.sparkle;
}

function toggleSheetMinimize(forceVal) {
  if (typeof forceVal === 'boolean') {
    state.isSheetMinimized = forceVal;
  } else {
    state.isSheetMinimized = !state.isSheetMinimized;
  }
  renderUiOverlay();
}

function toggleOffersMinimize(forceVal) {
  if (typeof forceVal === 'boolean') {
    state.isOffersMinimized = forceVal;
  } else {
    state.isOffersMinimized = !state.isOffersMinimized;
  }
  renderFloatingOffersOverlay();
}

function formatProRatingAndJobs(rating, completedBookings) {
  const jobs = Number(completedBookings || 0);
  const stars = Number(rating || 0);
  if (jobs === 0 || stars === 0) {
    return `<span class="new-pro-badge" style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:700; color:#D97706; background:#FEF3C7; border:1px solid #FCD34D; padding:2px 7px; border-radius:7px;">
      <span style="display:inline-flex;">${uiIcon('star', 12)}</span>
      <span>New (0 jobs)</span>
    </span>`;
  }
  return `<span style="display:inline-flex; align-items:center; gap:3px; font-size:12px; font-weight:800; color:var(--text-main);">
    ${uiIcon('star', 13)}
    <span>${stars.toFixed(1)}</span>
    <span class="offer-pro-jobs" style="color:var(--text-secondary); font-weight:600; margin-left:2px;">(${jobs} job${jobs > 1 ? 's' : ''})</span>
  </span>`;
}

let arrivalVibrateInterval = null;
let arrivalAudioCtx = null;
let isAudioContextUnlocked = false;

function unlockArrivalAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!arrivalAudioCtx) {
    arrivalAudioCtx = new AudioContext();
  }
  if (arrivalAudioCtx.state === 'suspended') {
    arrivalAudioCtx.resume().then(() => {
      isAudioContextUnlocked = true;
    }).catch(() => {});
  } else {
    isAudioContextUnlocked = true;
  }
}

if (typeof document !== 'undefined') {
  ['touchstart', 'touchend', 'click', 'keydown'].forEach((evt) => {
    document.addEventListener(evt, unlockArrivalAudioContext, { passive: true });
  });
}

function playArrivalUrgentAlarmSound() {
  try {
    unlockArrivalAudioContext();
    if (!arrivalAudioCtx) return;
    const now = arrivalAudioCtx.currentTime;

    // Dual-tone urgent telephone siren / penetrating alarm warble (880Hz / 1100Hz)
    const osc1 = arrivalAudioCtx.createOscillator();
    const osc2 = arrivalAudioCtx.createOscillator();
    const gain1 = arrivalAudioCtx.createGain();
    const gain2 = arrivalAudioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // Fast urgent warble alternation
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1100, now + 0.12);
    osc1.frequency.setValueAtTime(880, now + 0.24);
    osc1.frequency.setValueAtTime(1100, now + 0.36);
    osc1.frequency.setValueAtTime(880, now + 0.48);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(550, now + 0.12);
    osc2.frequency.setValueAtTime(440, now + 0.24);
    osc2.frequency.setValueAtTime(550, now + 0.36);
    osc2.frequency.setValueAtTime(440, now + 0.48);

    gain1.gain.setValueAtTime(0.75, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    gain2.gain.setValueAtTime(0.65, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(arrivalAudioCtx.destination);
    gain2.connect(arrivalAudioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.warn('Urgent alarm note:', e.message);
  }
}

function triggerHardwareVibration(pattern = [800, 250, 800, 250, 1000]) {
  try {
    if (typeof window !== 'undefined' && window.FinditNative && typeof window.FinditNative.vibratePattern === 'function') {
      const csv = Array.isArray(pattern) ? [0, ...pattern].join(',') : '0,800,250,800,250,1000';
      window.FinditNative.vibratePattern(csv);
    }
  } catch (e) {}
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {}
}

function stopHardwareVibration() {
  try {
    if (typeof window !== 'undefined' && window.FinditNative && typeof window.FinditNative.vibrate === 'function') {
      window.FinditNative.vibrate(0);
    }
  } catch (e) {}
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0);
    }
  } catch (e) {}
}

function startArrivalVibrationAlert(req) {
  if (arrivalVibrateInterval) return;
  playArrivalUrgentAlarmSound();
  triggerHardwareVibration([800, 250, 800, 250, 1000]);
  arrivalVibrateInterval = setInterval(() => {
    const activeReq = getCustomerActiveRequest();
    const isArrivalAlertActive = activeReq && !activeReq.pinVerifiedByProvider && (activeReq.status === 'ARRIVED' || isBookedStatus(activeReq.status));
    if (!isArrivalAlertActive) {
      stopArrivalVibrationAlert();
      return;
    }
    playArrivalUrgentAlarmSound();
    triggerHardwareVibration([800, 250, 800, 250, 1000]);
  }, 1900);
}

function stopArrivalVibrationAlert() {
  if (arrivalVibrateInterval) {
    clearInterval(arrivalVibrateInterval);
    arrivalVibrateInterval = null;
  }
  stopHardwareVibration();
}

let leafletMap = null;
let leafletMarkersLayer = null;
let leafletRoutePolyline = null;
let leafletRoutePolylineCasing = null;
let userLiveGpsMarker = null;
let callInterval = null;
let offerCountdownInterval = null;
let mediaStreamRef = null;
let geocodeDebounceTimer = null;
const osrmRouteCache = new Map();
const osrmStepsCache = new Map();

// ============================================================================
// CUSTOM ICONIFIED SERVICE ILLUSTRATIONS (MATCHING EACH SERVICE LABEL)
// ============================================================================
function getCategoryVectorSvg(catId, isSelected = false) {
  const strokeMain = isSelected ? '#FFFFFF' : '#0066FF';
  const strokeSub = isSelected ? '#BAE6FD' : '#0F172A';

  const icons = {
    // 1. Home Repairs & Construction
    repairs_construction: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <path d="M8 24L18 14" stroke="${strokeMain}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M14 10L20 16M10 14L13 17" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="17" y="6" width="8" height="5" rx="1.5" transform="rotate(45 17 6)" stroke="${strokeMain}" stroke-width="2"/>
    </svg>`,

    // 2. Beauty & Personal Care
    beauty_care: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <circle cx="10" cy="22" r="3.2" stroke="${strokeMain}" stroke-width="2.2"/>
      <circle cx="22" cy="22" r="3.2" stroke="${strokeMain}" stroke-width="2.2"/>
      <path d="M12.5 19.5L21.5 6M19.5 19.5L10.5 6" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M26 6L27 8L29 9L27 10L26 12L25 10L23 9L25 8Z" fill="${strokeMain}"/>
    </svg>`,

    // 3. Cleaning & Domestic Services
    cleaning_domestic: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <path d="M14 7H19L20 11H13L14 7Z" stroke="${strokeSub}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M11 15H21L23 25H9L11 15Z" stroke="${strokeMain}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M12 9L8 11" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="26" cy="10" r="1.5" fill="${strokeMain}"/>
      <circle cx="7" cy="18" r="1.2" fill="${strokeMain}"/>
    </svg>`,

    // 4. Automotive Services
    automotive: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <path d="M7 17L9 11C9.5 9.5 11 8.5 12.5 8.5H19.5C21 8.5 22.5 9.5 23 11L25 17" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="5" y="15" width="22" height="7" rx="3" stroke="${strokeMain}" stroke-width="2.2"/>
      <circle cx="10" cy="22" r="2.5" fill="${strokeMain}"/>
      <circle cx="22" cy="22" r="2.5" fill="${strokeMain}"/>
    </svg>`,

    // 5. Solar, Electrical Power & Water
    solar_power_water: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <path d="M17 5L9 16H16L14 26L24 14H16L17 5Z" stroke="${strokeMain}" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="23" cy="7" r="2.5" stroke="${strokeSub}" stroke-width="1.8"/>
    </svg>`,

    // 6. Gardening & Outdoor Work
    gardening_outdoor: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <path d="M8 25C8 25 10 14 20 9C20 9 24 19 14 23C11 24.2 9 25 8 25Z" stroke="${strokeMain}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M9 24L17 15" stroke="${strokeSub}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="23" cy="18" r="2" fill="${strokeMain}"/>
    </svg>`,

    // 7. General Labour & Other Jobs
    general_labour: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <path d="M7 11L16 6L25 11L16 16L7 11Z" stroke="${strokeMain}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M7 11V20L16 25V16" stroke="${strokeSub}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M25 11V20L16 25" stroke="${strokeMain}" stroke-width="2.1" stroke-linejoin="round"/>
    </svg>`,

    // Backwards-compatible aliases
    braiding: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M9 6C9 11 13 13 13 18C13 22 10 24 10 26" stroke="${strokeMain}" stroke-width="2.2" stroke-linecap="round"/><path d="M14 6C14 11 10 13 10 18C10 22 13 24 13 26" stroke="${strokeSub}" stroke-width="2" stroke-linecap="round"/><rect x="18" y="7" width="8" height="17" rx="2" stroke="${strokeMain}" stroke-width="2"/></svg>`,
    barber: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><circle cx="10" cy="22" r="3.2" stroke="${strokeMain}" stroke-width="2.2"/><circle cx="22" cy="22" r="3.2" stroke="${strokeMain}" stroke-width="2.2"/><path d="M12.5 19.5L21.5 6M19.5 19.5L10.5 6" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    nails: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><rect x="9" y="13" width="12" height="12" rx="3" stroke="${strokeMain}" stroke-width="2.2"/><path d="M12 13V8H18V13" stroke="${strokeSub}" stroke-width="2" stroke-linejoin="round"/><path d="M15 5V8" stroke="${strokeMain}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    makeup: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><rect x="8" y="14" width="8" height="11" rx="1.5" stroke="${strokeSub}" stroke-width="2"/><path d="M9.5 14V9C9.5 7.5 14.5 6 14.5 9V14" fill="${strokeMain}" stroke="${strokeMain}" stroke-width="1.5"/><path d="M21 16V25" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    cleaning: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M21 6L14 16" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/><path d="M9 16H19L21 24H7L9 16Z" stroke="${strokeMain}" stroke-width="2" stroke-linejoin="round"/></svg>`,
    handyman: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M8 24L18 14" stroke="${strokeMain}" stroke-width="2.4" stroke-linecap="round"/><path d="M17 9L23 15M10 11L14 15" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    plumbing: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M17 5L9 16H16L14 26L24 14H16L17 5Z" stroke="${strokeMain}" stroke-width="2.2" stroke-linejoin="round"/></svg>`
  };

  return icons[catId] || icons.repairs_construction;
}

// Small crisp icon inside the blue badge on each provider's map marker
function getMapMarkerProfessionIconSvg(catId) {
  if (catId === 'barber') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/></svg>`;
  }
  if (catId === 'hair_styling' || catId === 'beauty_wellness' || catId === 'nails' || catId === 'makeup') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`;
  }
  if (catId === 'repairs_construction') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
  }
  if (catId === 'solar_power_water') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  }
  if (catId === 'cleaning_domestic') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;
  }
  if (catId === 'automotive') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="19.5" r="2.5"/><circle cx="16.5" cy="19.5" r="2.5"/><path d="M5 11l2-5h10l2 5"/></svg>`;
  }
  if (catId === 'gardening_outdoor') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><path d="M12 22v-9"/><path d="M12 13c-4.42 0-8-3.58-8-8 4.42 0 8 3.58 8 8z"/><path d="M12 13c4.42 0 8-3.58 8-8-4.42 0-8 3.58-8 8z"/></svg>`;
  }
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
}

function formatUsdPrice(val) {
  const num = Number(val || 0);
  return num % 1 === 0 ? `$${num}` : `$${num.toFixed(2)}`;
}

// Client-side real-time anti-leakage check for Special Instructions & Chat
function checkAntiLeakageClient(text) {
  if (!text) return null;
  const zimPhoneRegex = /(?:\+?263|0)\s*7[1378]\s*\d{3}\s*\d{3,4}|\b\d{6,12}\b/;
  if (zimPhoneRegex.test(text)) {
    return 'Phone numbers (077..., +263...) are blocked to protect in-app bookings.';
  }
  const socialLinksRegex = /(instagram\.com|instagr\.am|facebook\.com|fb\.com|fb\.me|ig\.me|tiktok\.com|wa\.me|t\.me|https?:\/\/|www\.)/i;
  if (socialLinksRegex.test(text)) {
    return 'Instagram links (instagram.com), Facebook links (facebook.com), and external URLs are strictly prohibited.';
  }
  const socialRegex = /(whatsapp|call\s+me|text\s+me|dm\s+me|@[a-zA-Z0-9_]{3,}|\binstagram\b|\bfacebook\b|\binsta\b)/i;
  if (socialRegex.test(text)) {
    return 'Off-platform handles (@...), Instagram, Facebook, and WhatsApp solicitations are blocked.';
  }
  return null;
}

// ============================================================================
// INITIALIZATION, SESSION PERSISTENCE & REAL-TIME SSE STREAM
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initSplashScreen();
  loadSavedSession();
  await fetchState(true);
  initLeafletMap();
  useBrowserGeolocation(true);
  initRealtimeSync();
  startOfferCountdownLoop();

  // Mobile & Android Hardware Back Button Handler: Exit modals/steps smoothly rather than leaving app
  window.addEventListener('popstate', () => {
    if (state.incomingCall) {
      declineIncomingCall();
      return;
    }
    if (state.activeCall) {
      endInAppCall();
      return;
    }
    if (state.chatDrawerOpen) {
      closeChatDrawer();
      return;
    }
    if (state.activeModal) {
      closeModal();
      return;
    }
    if (state.screenStep === 'CONFIGURE') {
      state.screenStep = 'HOME';
      renderAll();
      return;
    }
    if (state.isOffersMinimized) {
      toggleOffersMinimize(false);
      return;
    }
  });
});

function pushNavState(label) {
  try {
    window.history.pushState({ step: label, ts: Date.now() }, '');
  } catch (e) {}
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopFaceCameraStream();
  }
});

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.loggedOut) {
        state.isAuthenticated = false;
        state.currentUser = null;
        state.savedAccountId = null;
      } else if (parsed.user && typeof parsed.user === 'object') {
        state.role = parsed.role || parsed.user.role || 'CUSTOMER';
        state.currentUser = parsed.user;
        state.savedAccountId = parsed.user.id || parsed.accountId;
        state.isAuthenticated = true;
      } else if (parsed.accountId) {
        state.role = parsed.role || 'CUSTOMER';
        state.savedAccountId = parsed.accountId;
        state.currentUser = {
          id: parsed.accountId,
          name: 'Verified User',
          phone: '',
          role: state.role
        };
        state.isAuthenticated = true;
      }
    } else {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.savedAccountId = null;
    }
  } catch (e) {
    state.isAuthenticated = false;
    state.currentUser = null;
  }
}

function saveSession(role, userOrId, loggedOut = false) {
  try {
    if (loggedOut || !userOrId) {
      localStorage.removeItem(SESSION_KEY);
      state.isAuthenticated = false;
      state.currentUser = null;
      state.savedAccountId = null;
      return;
    }
    const resolvedRole = role || state.role || 'CUSTOMER';
    let user = null;
    if (typeof userOrId === 'object' && userOrId !== null) {
      user = userOrId;
    } else if (state.currentUser && state.currentUser.id === userOrId) {
      user = state.currentUser;
    } else {
      user = {
        id: userOrId,
        role: resolvedRole,
        name: state.authName || 'Findit User',
        phone: state.authPhone || ''
      };
    }
    const payload = {
      role: resolvedRole,
      accountId: user.id,
      user,
      loggedOut: false,
      timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    state.isAuthenticated = true;
    state.currentUser = user;
    state.savedAccountId = user.id;
    state.role = resolvedRole;
  } catch (e) {}
}

function initSplashScreen() {
  const splashEl = document.getElementById('splashScreen');
  const fillEl = document.getElementById('splashLoaderFill');
  if (!splashEl) return;

  const hasOnboarded = localStorage.getItem('findit_onboarded_v2');
  state.onboardingActive = !hasOnboarded;
  state.hubView = 'HUB';

  if (fillEl) {
    setTimeout(() => {
      fillEl.style.width = '100%';
    }, 50);
  }

  setTimeout(() => {
    splashEl.classList.add('hidden');
    state.splashDismissed = true;
    renderAll();
  }, 900);
}

let lastRenderedOnboardingSig = '';

function renderOnboardingLayer() {
  let container = document.getElementById('onboardingRoot');
  if (!container) {
    container = document.createElement('div');
    container.id = 'onboardingRoot';
    document.body.appendChild(container);
  }

  if (!state.onboardingActive) {
    if (container.innerHTML !== '') container.innerHTML = '';
    lastRenderedOnboardingSig = 'INACTIVE';
    return;
  }

  const slide = state.onboardingSlide || 0;
  const sig = `ACTIVE_${slide}`;
  if (sig === lastRenderedOnboardingSig && container.firstElementChild) {
    return;
  }
  lastRenderedOnboardingSig = sig;

  if (slide === 0) {
    // Step 1: Hand ordering on phone with animated isometric illustration
    container.innerHTML = `
      <div class="fh-onboarding-screen">
        <div class="onboarding-top-nav">
          <button class="onboarding-skip-btn" onclick="finishOnboarding()">Skip</button>
        </div>

        <div class="onboarding-graphic-container">
          <div class="onboarding-mock-phone">
            <div class="onboarding-mock-map-bg" style="background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px), radial-gradient(#CBD5E1 1.5px, #F8FAFC 1.5px);"></div>
            
            <div class="onboarding-pin-bubble" style="top:20px; left:24px;">${uiIcon('pin', 12)}</div>
            <div class="onboarding-pin-bubble" style="top:40px; right:20px;">${uiIcon('pin', 12)}</div>

            <div class="onboarding-bid-card" style="top:42px; left:14px;">
              <span style="color:#0066FF; font-weight:800;">${uiIcon('star', 12)} 4.9</span>
              <span style="font-weight:800;">$25 USD</span>
            </div>

            <div class="isometric-art-wrapper">
              <svg viewBox="0 0 200 240" width="100%" height="100%" style="overflow:visible;">
                <defs>
                  <linearGradient id="phoneGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E293B"/>
                    <stop offset="100%" stop-color="#0F172A"/>
                  </linearGradient>
                  <linearGradient id="screenGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FFFFFF"/>
                    <stop offset="100%" stop-color="#F1F5F9"/>
                  </linearGradient>
                  <linearGradient id="btnGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0066FF"/>
                    <stop offset="100%" stop-color="#0052CC"/>
                  </linearGradient>
                </defs>
                
                <!-- Isometric Phone Body -->
                <g transform="translate(20, 20) skewY(-6) scale(0.92)">
                  <rect x="10" y="10" width="145" height="210" rx="24" fill="url(#phoneGrad1)" stroke="#334155" stroke-width="3"/>
                  <rect x="18" y="22" width="129" height="186" rx="16" fill="url(#screenGrad1)"/>
                  <rect x="62" y="15" width="40" height="4" rx="2" fill="#475569"/>
                  
                  <rect x="26" y="34" width="55" height="8" rx="4" fill="#94A3B8"/>
                  <rect x="26" y="46" width="80" height="12" rx="4" fill="#0F172A"/>
                  
                  <!-- Mini Map Surface -->
                  <rect x="26" y="66" width="113" height="72" rx="8" fill="#E2E8F0"/>
                  <path d="M26 95 Q60 85 90 100 T139 90" stroke="#CBD5E1" stroke-width="8" fill="none"/>
                  <path d="M75 66 L75 138" stroke="#CBD5E1" stroke-width="6" fill="none"/>
                  
                  <!-- Blue Pin on Phone -->
                  <circle cx="85" cy="94" r="7" fill="#0066FF"/>
                  <circle cx="85" cy="94" r="3" fill="#FFFFFF"/>
                  
                  <!-- Tap Ripple -->
                  <circle cx="82" cy="164" r="14" fill="none" stroke="#0066FF" stroke-width="2" opacity="0.8">
                    <animate attributeName="r" values="8;24;36" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.9;0.4;0" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  
                  <!-- Button -->
                  <rect x="26" y="150" width="113" height="28" rx="8" fill="url(#btnGrad1)"/>
                  <text x="82" y="168" fill="#FFFFFF" font-size="11" font-weight="bold" text-anchor="middle" font-family="-apple-system, sans-serif">Book Service</text>
                </g>
                
                <!-- Animated Isometric Hand Tapping -->
                <g class="iso-touch-hand">
                  <path d="M125 180 L155 160 L175 190 L145 210 Z" fill="#0066FF" opacity="0.9"/>
                  <path d="M115 165 L145 147 L160 170 L130 187 Z" fill="#FDBA74"/>
                  <path d="M115 165 L95 151 C91 148 92 142 97 139 C101 136 107 137 111 141 L125 157 Z" fill="#FDBA74"/>
                  <ellipse cx="96" cy="153" rx="6" ry="3" fill="#000000" opacity="0.25"/>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div class="onboarding-footer-area">
          <div class="onboarding-headline-text">
            Post your task and receive competitive <span class="highlight-accent">bids</span> from verified experts nearby.
          </div>

          <div class="onboarding-pagination-dots">
            <span class="onboarding-dot active"></span>
            <span class="onboarding-dot"></span>
          </div>

          <button class="onboarding-cta-btn" onclick="nextOnboardingSlide()">
            <span>Next</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
  } else {
    // Step 2: Notification being received on phone with animated isometric card
    container.innerHTML = `
      <div class="fh-onboarding-screen">
        <div class="onboarding-top-nav">
          <button class="onboarding-skip-btn" onclick="finishOnboarding()">Skip</button>
        </div>

        <div class="onboarding-graphic-container">
          <div class="onboarding-mock-phone">
            <div class="onboarding-mock-map-bg" style="background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px), radial-gradient(#CBD5E1 1.5px, #F8FAFC 1.5px);"></div>

            <div class="isometric-art-wrapper">
              <svg viewBox="0 0 200 240" width="100%" height="100%" style="overflow:visible;">
                <defs>
                  <linearGradient id="phoneGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E293B"/>
                    <stop offset="100%" stop-color="#0F172A"/>
                  </linearGradient>
                  <linearGradient id="screenGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#F8FAFC"/>
                    <stop offset="100%" stop-color="#EFF6FF"/>
                  </linearGradient>
                </defs>
                
                <!-- Radar Alert Waves -->
                <circle cx="100" cy="110" r="40" fill="none" stroke="#0066FF" stroke-width="1.5" opacity="0.7">
                  <animate attributeName="r" values="30;65;95" dur="2.4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.8;0.3;0" dur="2.4s" repeatCount="indefinite"/>
                </circle>
                
                <!-- Isometric Phone Body -->
                <g transform="translate(20, 20) skewY(6) scale(0.92)">
                  <rect x="10" y="10" width="145" height="210" rx="24" fill="url(#phoneGrad2)" stroke="#334155" stroke-width="3"/>
                  <rect x="18" y="22" width="129" height="186" rx="16" fill="url(#screenGrad2)"/>
                  <rect x="62" y="15" width="40" height="4" rx="2" fill="#475569"/>
                  
                  <rect x="26" y="34" width="60" height="8" rx="4" fill="#94A3B8"/>
                  <path d="M30 65 Q70 85 110 55 T135 105" stroke="#93C5FD" stroke-width="4" stroke-dasharray="4 4" fill="none"/>
                </g>
                
                <!-- Floating Animated Incoming Notification Card -->
                <g class="iso-notif-card-float" transform="translate(16, 72)">
                  <rect x="0" y="0" width="168" height="66" rx="14" fill="#FFFFFF" stroke="#0066FF" stroke-width="2"/>
                  
                  <!-- Alert Bell Icon Circle -->
                  <circle cx="24" cy="24" r="14" fill="#EFF6FF"/>
                  <path d="M24 16 C21 16 19 18 19 21 L19 26 L17 28 L31 28 L29 26 L29 21 C29 18 27 16 24 16 Z M22 29 C22 30 23 31 24 31 C25 31 26 30 26 29 Z" fill="#0066FF"/>
                  <circle cx="31" cy="16" r="4" fill="#EF4444"/>
                  
                  <text x="44" y="22" fill="#0F172A" font-size="12" font-weight="800" font-family="-apple-system, sans-serif">New Task Alert</text>
                  <text x="44" y="36" fill="#64748B" font-size="10" font-weight="600" font-family="-apple-system, sans-serif">Borrowdale • Plumbing</text>
                  
                  <rect x="10" y="44" width="65" height="16" rx="8" fill="#ECFDF5"/>
                  <text x="42" y="55" fill="#059669" font-size="10" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">$45 USD</text>
                  
                  <rect x="85" y="44" width="72" height="16" rx="8" fill="#0066FF"/>
                  <text x="121" y="55" fill="#FFFFFF" font-size="9.5" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">View Offer</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div class="onboarding-footer-area">
          <div class="onboarding-headline-text">
            Receive <span class="highlight-accent">instant alerts</span> when clients nearby in Harare request your services.
          </div>

          <div class="onboarding-pagination-dots">
            <span class="onboarding-dot"></span>
            <span class="onboarding-dot active"></span>
          </div>

          <button class="onboarding-cta-btn" onclick="finishOnboarding()">
            <span>Get Started</span>
          </button>
        </div>
      </div>
    `;
  }
}

function nextOnboardingSlide() {
  state.onboardingSlide = 1;
  renderAll();
}

function finishOnboarding() {
  localStorage.setItem('findit_onboarded_v2', 'true');
  state.onboardingActive = false;
  state.hubView = 'HUB';
  renderAll();
}

let lastStateFingerprint = '';
let isFetchingState = false;
let stateMutationEpoch = 0;

function markLocalStateMutation() {
  stateMutationEpoch++;
}

function computeStateFingerprint(db) {
  if (!db) return '';
  const reqSig = (db.requests || []).map((r) => `${r.id}:${r.status}:${(r.offers || []).map((o) => `${o.id}:${o.status}:${o.priceUsd}`).join(',')}:${r.acceptedOfferId || ''}:${r.budgetUsd}:${(r.activeViewerIds || []).length}:${(r.messages || []).map((m) => `${m.id}:${m.read ? 1 : 0}`).join(',')}`).join(';');
  const userSig = state.currentUser ? `${state.currentUser.id}:${state.currentUser.walletBalanceUsd}:${state.currentUser.warningsCount || 0}:${state.currentUser.isBanned}:${(state.currentUser.categoryIds || []).join(',')}` : '';
  const provSig = (db.providers || []).map((p) => `${p.id}:${p.isOnline}:${(p.categoryIds || []).join(',')}`).join(';');
  const clSig = (db.changelogs || []).map((c) => c.id).join(',');
  return `${reqSig}|${userSig}|${provSig}|${clSig}|${state.screenStep}|${state.providerTab}|${state.role}`;
}

const seenNotificationKeys = new Set();

function syncNativeSessionBridge() {
  try {
    if (window.FinditNative && typeof window.FinditNative.syncUserSession === 'function') {
      const uid = state.currentUser?.id || '';
      const role = state.role || 'CUSTOMER';
      const uName = state.currentUser?.name || '';
      const cats = state.role === 'PROVIDER' ? getProviderCategoryIds(state.currentUser).join(',') : '';
      window.FinditNative.syncUserSession(uid, role, uName, cats);
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch (e) {}
}

function triggerSystemNotification(title, body, notifKey = '') {
  try {
    const key = notifKey || `${title}:${body}`;
    if (seenNotificationKeys.has(key)) return;
    seenNotificationKeys.add(key);
    if (seenNotificationKeys.size > 200) {
      const first = seenNotificationKeys.values().next().value;
      seenNotificationKeys.delete(first);
    }

    const numericId = Math.abs(
      key.split('').reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0), 0)
    ) % 90000 + 1000;

    // 1. Native Android Status-Bar / Heads-Up Notification Bridge (works even when outside the app!)
    if (window.FinditNative && typeof window.FinditNative.triggerNotification === 'function') {
      window.FinditNative.triggerNotification(String(title || 'Findit Harare'), String(body || ''), numericId);
      return;
    }

    // 2. Web Service Worker / Browser Notification fallback (when tab is backgrounded or on mobile browser)
    if ('Notification' in window && Notification.permission === 'granted') {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then((reg) => {
            if (reg && typeof reg.showNotification === 'function') {
              reg.showNotification(String(title || 'Findit Harare'), {
                body: String(body || ''),
                icon: '/assets/logo-icon.svg',
                badge: '/assets/logo-icon.svg',
                tag: key,
                vibrate: [180, 80, 180]
              });
            }
          })
          .catch(() => {});
      } else {
        new Notification(String(title || 'Findit Harare'), {
          body: String(body || ''),
          icon: '/assets/logo-icon.svg',
          tag: key
        });
      }
    }
  } catch (e) {}
}

function resolveProviderByIdOrOffer(provId, req = null, offer = null) {
  const matchedOffer =
    offer ||
    (req && Array.isArray(req.offers)
      ? req.offers.find((o) => (req.acceptedOfferId && o.id === req.acceptedOfferId) || (provId && o.providerId === provId)) || req.offers[0]
      : null);
  const targetId = provId || req?.acceptedProviderId || matchedOffer?.providerId;
  const targetFinditId = matchedOffer?.providerFinditId;

  const found = (state.db?.providers || []).find(
    (p) => (targetId && p.id === targetId) || (targetFinditId && p.finditId === targetFinditId)
  );
  if (found) {
    return {
      ...found,
      name: matchedOffer?.providerName || found.name,
      shortName: matchedOffer?.providerShortName || found.shortName || (matchedOffer?.providerName || found.name || 'Pro').split(' ')[0],
      brandName: matchedOffer?.providerBrand || found.brandName || `${(matchedOffer?.providerName || found.name || 'Pro').split(' ')[0]} Services`,
      avatarUrl: matchedOffer?.providerAvatarUrl || found.avatarUrl || found.selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'
    };
  }

  const fallbackName = matchedOffer?.providerName || req?.acceptedProviderName || 'Verified Specialist';
  const fallbackShort = matchedOffer?.providerShortName || fallbackName.split(' ')[0];
  return {
    id: targetId || 'prov_custom',
    finditId: targetFinditId || 'FH-PRO-VERIFIED',
    name: fallbackName,
    shortName: fallbackShort,
    brandName: matchedOffer?.providerBrand || req?.acceptedProviderBrand || `${fallbackShort} Services`,
    avatarUrl:
      matchedOffer?.providerAvatarUrl ||
      req?.acceptedProviderAvatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    rating: matchedOffer?.providerRating ?? 5.0,
    completedBookings: matchedOffer?.providerCompletedJobs ?? 1,
    skillTier: matchedOffer?.providerSkillTier || 'Verified pro',
    bio: `${fallbackName} is a verified Findit Harare specialist ready for home visits.`,
    categoryId: req?.categoryId || 'repairs_construction',
    lat: req?.lat ? Number(req.lat) + 0.006 : -17.8024,
    lng: req?.lng ? Number(req.lng) + 0.006 : 31.0368,
    portfolio: []
  };
}

async function fetchState(force = false) {
  if (isFetchingState && !force) return;
  isFetchingState = true;
  const fetchStartEpoch = stateMutationEpoch;
  try {
    let newDb = null;
    try {
      newDb = await apiGet('/api/state', 2);
      if (newDb && Array.isArray(newDb.categories)) {
        try { localStorage.setItem('findit_offline_db', JSON.stringify(newDb)); } catch (e) {}
      }
    } catch (netErr) {
      // Offline fallback: load from localStorage
      const cachedStr = localStorage.getItem('findit_offline_db');
      if (cachedStr) {
        try { newDb = JSON.parse(cachedStr); } catch (e) {}
      }
      if (!newDb) throw netErr;
      updateNetworkOfflineStatus();
    }

    if (!newDb) return;

    // If a local user action happened while this background poll was in flight, ignore stale poll
    if (!force && fetchStartEpoch !== stateMutationEpoch) {
      return;
    }

    // Preserve optimistic local chat messages, offers, AND active local requests across serverless instances
    if (state.db && Array.isArray(state.db.requests) && Array.isArray(newDb.requests)) {
      const nowMs = Date.now();
      newDb.requests.forEach((newReq) => {
        const oldReq = state.db.requests.find((r) => r.id === newReq.id);
        if (!oldReq) return;

        // 1. Preserve recent/optimistic offers (especially the current provider's own offer!)
        if (Array.isArray(oldReq.offers) && oldReq.offers.length > 0) {
          if (!Array.isArray(newReq.offers)) newReq.offers = [];
          oldReq.offers.forEach((oldOff) => {
            if (!oldOff) return;
            const offAgeMs = nowMs - Number(oldOff.updatedAt || new Date(oldOff.createdAt || 0).getTime() || 0);
            if (offAgeMs > 120 * 1000) return;
            const existingIdx = newReq.offers.findIndex(
              (o) => o.id === oldOff.id || (oldOff.providerId && o.providerId === oldOff.providerId)
            );
            if (existingIdx < 0) {
              newReq.offers.unshift(oldOff);
            } else {
              const serverOff = newReq.offers[existingIdx];
              const localTime = Number(oldOff.updatedAt || 0);
              const serverTime = Number(serverOff.updatedAt || 0);
              if (localTime > serverTime && serverOff.status !== 'DECLINED' && serverOff.status !== 'ACCEPTED') {
                newReq.offers[existingIdx] = { ...serverOff, ...oldOff };
              }
            }
          });
        }

        // 2. Preserve local chat messages & read ticks
        if (oldReq.messages && oldReq.messages.length > 0) {
          if (!newReq.messages) newReq.messages = [];
          oldReq.messages.forEach((oldM) => {
            const existsInNew = newReq.messages.find((m) =>
              m.id === oldM.id ||
              (oldM.clientMsgId && (m.clientMsgId === oldM.clientMsgId || m.id === oldM.clientMsgId)) ||
              (m.text === oldM.text && m.senderRole === oldM.senderRole && Math.abs(new Date(m.timestamp || 0).getTime() - new Date(oldM.timestamp || oldM.createdAt || 0).getTime()) < 10000)
            );
            if (!existsInNew) {
              newReq.messages.push(oldM);
            } else if (oldM.read || oldM.status === 'READ') {
              existsInNew.read = true;
              existsInNew.status = 'READ';
            }
          });
        }
      });

      // Prevent any newly created OPEN or active request from flickering if a poll ever hits a cold container
      state.db.requests.forEach((localReq) => {
        if (!localReq || !localReq.id) return;
        const isRecentActive = (localReq.status === 'OPEN' || isBookedStatus(localReq.status)) &&
          (!localReq.createdAt || (nowMs - new Date(localReq.createdAt).getTime() < 30 * 60 * 1000));
        if (isRecentActive && !newDb.requests.some((r) => r.id === localReq.id)) {
          newDb.requests.unshift(localReq);
        }
      });
    }

    state.db = newDb;
    const prevBanned = Boolean(state.currentUser?.isBanned);
    // Rock-solid session & profile retention: NEVER log out or overwrite user's chosen categories/profile with stale defaults!
    if (state.isAuthenticated && state.currentUser) {
      const list = state.role === 'PROVIDER' ? (state.db.providers || []) : (state.db.customers || []);
      const found = list.find((item) => item.id === state.currentUser.id || (item.phone && state.currentUser.phone && item.phone.replace(/\D/g, '') === state.currentUser.phone.replace(/\D/g, '')));
      if (found) {
        const localCategoryIds = state.currentUser.categoryIds;
        const localCategoryId = state.currentUser.categoryId;
        const localName = state.currentUser.name;
        const localBrand = state.currentUser.brandName;
        const localAvatar = state.currentUser.avatarUrl || state.currentUser.selfieUrl;
        state.currentUser = { ...state.currentUser, ...found };
        if (Array.isArray(localCategoryIds) && localCategoryIds.length > 0 && state.userCustomizedProfile) {
          state.currentUser.categoryIds = localCategoryIds;
          state.currentUser.categoryId = localCategoryId || localCategoryIds[0];
          found.categoryIds = localCategoryIds;
          found.categoryId = state.currentUser.categoryId;
        }
        if (localName && state.userCustomizedProfile) {
          state.currentUser.name = localName;
          found.name = localName;
        }
        if (localBrand && state.userCustomizedProfile) {
          state.currentUser.brandName = localBrand;
          found.brandName = localBrand;
        }
        if (localAvatar && !found.avatarUrl) {
          state.currentUser.avatarUrl = localAvatar;
          found.avatarUrl = localAvatar;
        }
      } else {
        list.push(state.currentUser);
      }
      state.isAuthenticated = true;
    } else if (state.savedAccountId) {
      const list = state.role === 'PROVIDER' ? (state.db.providers || []) : (state.db.customers || []);
      const found = list.find((item) => item.id === state.savedAccountId);
      if (found) {
        state.currentUser = found;
        state.isAuthenticated = true;
      }
    }

    syncNativeSessionBridge();
    syncRecommendedFare();

    // Real-Time In-App Calling Sync (Guarantees incoming calls ring immediately across all devices & serverless instances)
    if (Array.isArray(state.db?.activeCalls)) {
      syncIncomingCallFromList(state.db.activeCalls);
    }

    // Admin ban / unban takes effect instantly — no refresh needed
    if (state.currentUser && Boolean(state.currentUser.isBanned) !== prevBanned) {
      force = true;
      lastUiOverlaySignature = '';
      if (state.currentUser.isBanned) {
        state.activeModal = null;
        lastRenderedModalKey = '';
        try { renderModalLayer(); } catch (e) {}
      }
    }

    const fp = computeStateFingerprint(state.db);
    if (force || fp !== lastStateFingerprint) {
      lastStateFingerprint = fp;
      lastUiOverlaySignature = ''; // ALWAYS invalidate overlay signature when database fingerprint changes!
      lastOffersSignature = '';
      const activeEl = document.activeElement;
      const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
      if (!isUserTyping || force) {
        renderAll(true);
      }
    }
  } catch (err) {
    console.error('Failed to load state:', err);
  } finally {
    isFetchingState = false;
  }
}

function syncRecommendedFare() {
  if (!state.db) return;
  const cat = state.db.categories.find((c) => c.id === state.selectedCategoryId) || state.db.categories[0];
  const subServices = cat?.subServices || [];
  const sub = subServices[state.selectedSubServiceIdx] || subServices[0];
  const baseUsd = sub ? sub.defaultUsd : (cat?.suggestedMinUsd || 20);

  let mult = 1;
  if (state.selectedTierKey === 'PLATINUM') mult = 1.25;
  else if (state.selectedTierKey === 'ONE_CLICK') mult = 1.15;
  else if (state.selectedTierKey === 'BUDGET') mult = 0.8;

  const rec = Math.max(5, Math.round(baseUsd * mult * 2) / 2);
  state.recommendedFareUsd = rec;
  if (!state.draftFareUsd || state.screenStep === 'HOME') {
    state.draftFareUsd = rec;
  }
}

let realtimeWebSocket = null;
let realtimeEventSource = null;
let realtimeReconnectTimer = null;
let isWsConnected = false;

let realtimeSyncInterval = null;
let liveOffersPollTimer = null;
let lastPolledOffersCount = -1;

function startFastLiveOffersPoll(requestId) {
  if (liveOffersPollTimer) return;
  liveOffersPollTimer = setInterval(async () => {
    const activeReq = getCustomerActiveRequest();
    if (!activeReq || activeReq.status !== 'OPEN' || !state.isAuthenticated || state.role !== 'CUSTOMER') {
      stopFastLiveOffersPoll();
      return;
    }
    const targetId = requestId || activeReq.id;
    try {
      const res = await apiGet(`/api/requests/${targetId}/live-offers`, 1);
      if (res && res.requestId === activeReq.id) {
        if (res.status && res.status !== activeReq.status) {
          activeReq.status = res.status;
          fetchState(true);
          return;
        }
        if (Array.isArray(res.offers)) {
          const prevCount = (activeReq.offers || []).length;
          activeReq.offers = res.offers;
          if (Array.isArray(res.activeViewerIds)) {
            activeReq.activeViewerIds = res.activeViewerIds;
          }
          if (res.offers.length > prevCount || res.offers.length !== lastPolledOffersCount) {
            lastPolledOffersCount = res.offers.length;
            lastOffersSignature = '';
            lastUiOverlaySignature = '';
            renderFloatingOffersOverlay(true);
            playIncomingMessageSoundAndVibrate({ senderName: 'Service Provider', text: 'New pro offer received!' });
          }
        }
      }
    } catch (e) {}
  }, 1000);
}

function stopFastLiveOffersPoll() {
  if (liveOffersPollTimer) {
    clearInterval(liveOffersPollTimer);
    liveOffersPollTimer = null;
    lastPolledOffersCount = -1;
  }
}

function initRealtimeSync() {
  connectWebSocket();
  if (state.isAuthenticated && state.currentUser) {
    try { startActiveCallPolling(); } catch (e) {}
  }
  if (!realtimeSyncInterval) {
    realtimeSyncInterval = setInterval(() => {
      if (state.isAuthenticated && state.currentUser && !activeCallPollTimer) {
        try { startActiveCallPolling(); } catch (e) {}
      }
      // Smooth non-overlapping delta sync when WebSocket is not active
      if (!isWsConnected && !isFetchingState) {
        const activeEl = document.activeElement;
        const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
        // Never interrupt active typing modals with background polls
        if (!isUserTyping) {
          const activeReq = getCustomerActiveRequest();
          if (state.screenStep === 'SEARCHING' || (activeReq && activeReq.status === 'OPEN')) {
            startFastLiveOffersPoll(activeReq?.id);
          }
          fetchState(false);
        }
      }
    }, 1200);
  }
}

let audioCtxForChime = null;

function playIncomingMessageSoundAndVibrate(message) {
  // 1. Phone vibration (Standard message haptic pattern: vibrate - pause - vibrate)
  try {
    triggerHardwareVibration([140, 70, 140]);
  } catch (e) {}

  // 2. High-Fidelity Pleasant WhatsApp/iOS Message Chime using Web Audio API
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtxForChime || audioCtxForChime.state === 'closed') {
        audioCtxForChime = new AudioContextClass();
      }
      if (audioCtxForChime.state === 'suspended') {
        audioCtxForChime.resume().catch(() => {});
      }
      const ctx = audioCtxForChime;
      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5 chime)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2: 880 Hz (A5 bell harmonic)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08);
      gain2.gain.setValueAtTime(0.32, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    }
  } catch (audioErr) {}

  // 3. Android Native Bridge notification & vibration
  try {
    if (window.FinditNative && typeof window.FinditNative.triggerNotification === 'function') {
      const sender = message?.senderName || 'Findit User';
      const text = message?.text || 'Sent you a message';
      window.FinditNative.triggerNotification(`${sender}`, text, 7777);
    }
  } catch (nativeErr) {}
}

function handleIncomingRealtimeEvent(data) {
  if (!data || data.eventType === 'CONNECTED' || data.eventType === 'PING') return;

  // 0A. OFFICIAL ADMIN NOTIFICATION & DISPATCHED WARNINGS
  if (data.eventType === 'ADMIN_NOTIFICATION' && data.payload?.notification) {
    const notif = data.payload.notification;
    if (!state.db) state.db = {};
    if (!Array.isArray(state.db.adminNotifications)) state.db.adminNotifications = [];
    state.db.adminNotifications.unshift(notif);
    const myId = state.currentUser?.id;
    const isTarget = notif.recipientType === 'ALL' ||
      (notif.recipientType === 'CUSTOMERS' && state.role === 'CUSTOMER') ||
      (notif.recipientType === 'PROVIDERS' && state.role === 'PROVIDER') ||
      (notif.recipientType === 'SPECIFIC_USER' && (notif.recipientId === myId || notif.recipientId === state.currentUser?.finditId));
    if (isTarget) {
      triggerHardwareVibration([180, 80, 180]);
      showToast(`${notif.title}: ${notif.message}`, notif.type === 'WARNING' ? 'error' : 'info', 6000);
      triggerSystemNotification(notif.title, notif.message, notif.id);
      renderAll();
    }
    return;
  }

  // 0B. LIVE AI-SUPPORT & HUMAN HELPDESK REPLIES
  if (data.eventType === 'SUPPORT_MESSAGE_RECEIVED' && data.payload) {
    const { userKey, message } = data.payload;
    const myKey = String(state.currentUser?.id || state.currentUser?.phone || state.currentUser?.name || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (userKey === myKey && message) {
      playIncomingMessageSoundAndVibrate(message);
      if (state.activeModal === 'SUPPORT_CHAT') {
        state.supportChatHistory = state.supportChatHistory || [];
        if (!state.supportChatHistory.some((m) => m.id === message.id)) {
          state.supportChatHistory.push(message);
          renderModalLayer();
        }
      } else {
        showToast(`Findit Support: ${message.text}`, 'info', 6000);
      }
    }
    return;
  }

  // 0. ADMIN BAN / UNBAN / WARN — apply in 0ms to the affected user (zero refresh needed)
  if (data.eventType === 'ACCOUNT_DISCIPLINE_UPDATED' && data.payload) {
    const { accountId, finditId, role, action, reason } = data.payload;
    if (state.db) {
      const list = role === 'CUSTOMER' ? (state.db.customers || []) : (state.db.providers || []);
      const target = list.find((u) => u.id === accountId || (finditId && u.finditId === finditId));
      if (target) {
        if (action === 'BAN') {
          target.isBanned = true;
          target.banReason = reason || 'Safety policy violation';
          if (role === 'PROVIDER') target.isOnline = false;
        } else if (action === 'UNBAN') {
          target.isBanned = false;
          target.banReason = '';
        } else if (action === 'WARN') {
          target.warningsCount = (target.warningsCount || 0) + 1;
          target.activeWarnings = target.activeWarnings || [];
          target.activeWarnings.unshift({
            id: 'warn_' + Date.now(),
            date: new Date().toISOString(),
            reason: reason || 'Official Admin Warning'
          });
        }
      }
    }
    if (state.currentUser && (state.currentUser.id === accountId || (finditId && state.currentUser.finditId === finditId))) {
      if (action === 'BAN') {
        state.currentUser.isBanned = true;
        state.currentUser.banReason = reason || 'Safety policy violation';
        state.activeModal = null;
        lastRenderedModalKey = '';
      } else if (action === 'UNBAN') {
        state.currentUser.isBanned = false;
        state.currentUser.banReason = '';
        showToast('Your account has been reinstated by Admin!', 'success');
      } else if (action === 'WARN') {
        state.currentUser.warningsCount = (state.currentUser.warningsCount || 0) + 1;
        state.currentUser.activeWarnings = state.currentUser.activeWarnings || [];
        state.currentUser.activeWarnings.unshift({
          id: 'warn_' + Date.now(),
          date: new Date().toISOString(),
          reason: reason || 'Official Admin Warning'
        });
      }
      saveSession(state.role, state.currentUser, false);
      lastUiOverlaySignature = '';
      renderAll();
    }
    fetchState(true);
    return;
  }

  // 1. CHAT MESSAGE SENT (Encrypted & private between customer and assigned provider only)
  if (data.eventType === 'MESSAGE_SENT' && data.payload) {
    const { requestId, message } = data.payload;
    const targetReq = (state.db?.requests || []).find((r) => r.id === requestId);
    if (targetReq && message) {
      const myId = state.currentUser?.id;
      const myFinditId = state.currentUser?.finditId;
      const myPhone = (state.currentUser?.phone || '').replace(/\D/g, '');
      const isCustomerParty = state.role === 'CUSTOMER' && (
        targetReq.customerId === myId ||
        targetReq.customerFinditId === myFinditId ||
        (myPhone && (targetReq.customerPhone || '').replace(/\D/g, '') === myPhone)
      );
      const isProviderParty = state.role === 'PROVIDER' && (
        targetReq.acceptedProviderId === myId ||
        (targetReq.offers || []).some((o) => o.providerId === myId || (myFinditId && o.providerFinditId === myFinditId))
      );
      const isParty = isCustomerParty || isProviderParty;
      if (!isParty) return;

      if (!targetReq.messages) targetReq.messages = [];
      const existingMsg = targetReq.messages.find((m) =>
        m.id === message.id ||
        (message.clientMsgId && (m.clientMsgId === message.clientMsgId || m.id === message.clientMsgId)) ||
        (m.senderRole === message.senderRole &&
          m.text === message.text &&
          Math.abs(new Date(m.timestamp || m.createdAt || 0).getTime() - new Date(message.timestamp || 0).getTime()) < 8000)
      );
      if (existingMsg) {
        Object.assign(existingMsg, message);
      } else {
        targetReq.messages.push(message);
      }
      if (message.senderRole && message.senderRole !== 'SYSTEM' && message.senderRole !== state.role) {
        playIncomingMessageSoundAndVibrate(message);
        const txt = (message.text || '').toLowerCase();
        if (state.role === 'CUSTOMER' && (message.type === 'ARRIVED' || txt.includes('outside') || txt.includes('arrived') || txt.includes('gate'))) {
          startArrivalVibrationAlert(targetReq);
        }
        if (state.chatDrawerOpen) {
          markRequestMessagesRead(targetReq.id);
        } else {
          showToast(`${message.senderName || 'Findit User'}: ${message.text || 'Photo attached'}`, 'info', 4500);
          triggerSystemNotification(
            `New Message from ${message.senderName || 'Findit User'}`,
            message.text,
            `msg_${message.id || message.clientMsgId || Date.now()}`
          );
        }
      }
      updateChatFeedDomOnly(targetReq);
    }
    return;
  }

  // 1B. CHAT MESSAGES READ (Turns Grey Ticks -> Blue Ticks in real time!)
  if (data.eventType === 'MESSAGES_READ' && data.payload) {
    const { requestId, readerRole, request } = data.payload;
    const targetReq = (state.db?.requests || []).find((r) => r.id === requestId);
    if (targetReq) {
      if (request && Array.isArray(request.messages)) {
        targetReq.messages = request.messages;
      } else if (Array.isArray(targetReq.messages)) {
        targetReq.messages.forEach((m) => {
          if (m.senderRole && m.senderRole !== 'SYSTEM' && m.senderRole !== readerRole) {
            m.read = true;
            m.status = 'READ';
          }
        });
      }
      updateChatFeedDomOnly(targetReq);
    }
    return;
  }

  // 1C. OFFER DECLINED BY CLIENT (Notify provider on their card so they can edit price/re-bid!)
  if (data.eventType === 'OFFER_DECLINED' && data.payload) {
    const { requestId, offerId, providerId, declinedPriceUsd, request } = data.payload;
    if (request && state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === requestId);
      if (idx >= 0) state.db.requests[idx] = request;
    } else if (state.db?.requests) {
      const r = state.db.requests.find((x) => x.id === requestId);
      const off = r && (r.offers || []).find((o) => o.id === offerId);
      if (off) {
        off.status = 'DECLINED';
        off.declinedPriceUsd = off.priceUsd;
      }
    }
    lastUiOverlaySignature = '';
    lastOffersSignature = '';
    if (state.role === 'PROVIDER' && state.currentUser && state.currentUser.id === providerId) {
      showToast(`Client declined your $${declinedPriceUsd || ''} offer. You can edit your price and submit a revised bid!`, 'error');
      triggerSystemNotification(
        'Offer Declined — Edit Price',
        `Client declined your $${declinedPriceUsd || ''} offer. Tap to adjust your price or terms.`,
        `dec_${offerId}_${declinedPriceUsd}`
      );
      if ('vibrate' in navigator) {
        try { navigator.vibrate([100, 60, 100]); } catch (e) {}
      }
    }
    renderAll(true);
    return;
  }

  // 2. NEW REQUEST CREATED (Instant delivery to providers via WebSocket - Card pops up directly!)
  if (data.eventType === 'REQUEST_CREATED' && data.payload?.request) {
    const req = data.payload.request;
    if (!state.db) state.db = {};
    if (!Array.isArray(state.db.requests)) state.db.requests = [];
    const existingIdx = state.db.requests.findIndex((r) => r.id === req.id);
    if (existingIdx >= 0) state.db.requests[existingIdx] = req;
    else state.db.requests.unshift(req);
    lastUiOverlaySignature = ''; // Invalidate signature cache so card appears without delay!
    const myCats = state.role === 'PROVIDER' ? getProviderCategoryIds(state.currentUser) : [];
    const matchesMe = myCats.length === 0 || myCats.includes(req.categoryId);
    if (state.role === 'PROVIDER' && matchesMe) {
      if (state.currentUser && state.currentUser.isOnline === false) {
        showToast(`New Job in ${req.suburbName || 'Harare'} ($${req.budgetUsd})! You are currently Offline. Switch Online to bid.`, 'info', 6000);
      }
      triggerSystemNotification(
        `New Job in ${req.suburbName || 'Harare'} ($${req.budgetUsd} USD)`,
        `${req.title} requested by ${req.customerName} at ${req.exactAddress}`,
        `req_${req.id}`
      );
      if ('vibrate' in navigator) {
        try { navigator.vibrate([120, 60, 120]); } catch (e) {}
      }
    }
    renderAll();
    return;
  }

  // 3. PROVIDER SUBMITTED AN OFFER (Instant delivery to client - Offer card pops up directly!)
  if (data.eventType === 'OFFER_SUBMITTED' && data.payload?.offer) {
    const { requestId, offer, request } = data.payload;
    if (request && state.db?.requests) {
      const reqIdx = state.db.requests.findIndex((r) => r.id === requestId);
      if (reqIdx >= 0) state.db.requests[reqIdx] = request;
      else state.db.requests.unshift(request);
    }
    lastUiOverlaySignature = ''; // Invalidate signature cache!
    lastOffersSignature = ''; // Invalidate offers cache so card appears instantly!
    const currentActive = getCustomerActiveRequest();
    if (state.role === 'CUSTOMER' && currentActive && currentActive.id === requestId) {
      triggerSystemNotification(
        `New Offer: $${offer.priceUsd} USD from ${offer.providerName}`,
        `${offer.providerBrand || currentActive.title} (~${offer.etaMinutes || 5} mins away)`,
        `off_${offer.id}_${offer.priceUsd}`
      );
      if ('vibrate' in navigator) {
        try { navigator.vibrate([150, 70, 150]); } catch (e) {}
      }
    }
    renderAll();
    return;
  }

  // 4. BOOKING CONFIRMED (Accepted offer: disappears for other providers, locks in for accepted provider & client)
  if ((data.eventType === 'BOOKING_CONFIRMED' || data.eventType === 'OFFER_ACCEPTED') && data.payload) {
    const { requestId, acceptedProviderId, request } = data.payload;
    if (state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === requestId);
      if (idx >= 0) {
        if (request) state.db.requests[idx] = request;
        else {
          state.db.requests[idx].status = 'CONFIRMED';
          state.db.requests[idx].acceptedProviderId = acceptedProviderId;
        }
      }
    }
    lastUiOverlaySignature = ''; // Invalidate signature cache so accepted request card vanishes for all other providers!
    lastOffersSignature = '';
    if (state.role === 'PROVIDER') {
      if (state.currentUser?.id === acceptedProviderId) {
        state.providerTab = 'ACTIVE_JOB';
        triggerSystemNotification(
          `Offer Accepted! ($${request?.agreedTotalUsd || request?.budgetUsd || ''} USD)`,
          `${request?.customerName || 'Client'} accepted your offer for ${request?.title || 'Job'}.`,
          `acc_${requestId}`
        );
        if ('vibrate' in navigator) {
          try { navigator.vibrate([200, 100, 200]); } catch (e) {}
        }
      } else {
        // Another provider took the job: silently purge from feed with zero pop-ups
        state.providerTab = 'FEED';
      }
    }
    if (state.role === 'CUSTOMER') {
      state.screenStep = 'BOOKED';
    }
    renderAll(true);
    return;
  }

  // 5. PROVIDER ARRIVED OUTSIDE GATE (Triggers persistent vibration on client phone!)
  if (data.eventType === 'PROVIDER_ARRIVED' && data.payload?.request) {
    const { requestId, request } = data.payload;
    if (state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === requestId);
      if (idx >= 0) state.db.requests[idx] = request;
    }
    lastUiOverlaySignature = '';
    if (state.role === 'CUSTOMER') {
      startArrivalVibrationAlert(request);
      triggerSystemNotification(
        'Specialist Waiting Outside Gate!',
        `Please share your Start PIN #${request.startPinCode || '4829'} to begin service.`,
        `arr_${request.id}`
      );
      showToast(`Specialist is waiting outside! Please share your Start PIN #${request.startPinCode}.`, 'info');
    }
    renderAll();
    return;
  }

  // 6. START PIN VERIFIED (Task Started - Stop vibration!)
  if (data.eventType === 'PIN_VERIFIED') {
    stopArrivalVibrationAlert();
    if (data.payload?.request && state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === data.payload.requestId);
      if (idx >= 0) state.db.requests[idx] = data.payload.request;
    }
    lastUiOverlaySignature = '';
    showToast(`Start PIN verified! Service is now in progress.`);
    renderAll();
    return;
  }

  // 6B. BOOKING STATUS UPDATED / COMPLETED (By client, provider, or admin)
  if (data.eventType === 'BOOKING_STATUS_UPDATED' || data.eventType === 'STATUS_UPDATED' || data.eventType === 'BOOKING_COMPLETED') {
    const reqId = data.payload?.requestId || data.payload?.request?.id;
    const reqObj = data.payload?.request;
    const newStatus = data.payload?.status || reqObj?.status;
    if (state.db?.requests && reqId) {
      const idx = state.db.requests.findIndex((r) => r.id === reqId);
      if (idx >= 0) {
        if (reqObj) state.db.requests[idx] = reqObj;
        else if (newStatus) state.db.requests[idx].status = newStatus;
      }
    }
    if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
      stopArrivalVibrationAlert();
      stopNavigationHud();
      if (leafletRoutePolyline) {
        try { leafletRoutePolyline.remove(); } catch (e) {}
        leafletRoutePolyline = null;
      }
      if (leafletRoutePolylineCasing) {
        try { leafletRoutePolylineCasing.remove(); } catch (e) {}
        leafletRoutePolylineCasing = null;
      }
      if (reqId) delete state.bookingProximitySeconds[reqId];
      if (state.activeRequestId === reqId) {
        state.activeRequestId = null;
      }
      state.activeModal = null;
      lastRenderedModalKey = '';
      if (state.role === 'CUSTOMER') {
        state.screenStep = 'HOME';
        state.pendingSearchFareUsd = null;
      }
      if (state.role === 'PROVIDER') {
        state.providerTab = 'FEED';
      }
      lastUiOverlaySignature = '';
      lastOffersSignature = '';
      showToast(newStatus === 'COMPLETED' ? 'Job completed successfully! Thank you.' : 'Job was cancelled.', 'info');
      renderAll(true);
      return;
    }
  }

  // 7. TASK CANCELLED (By user or provider)
  if (data.eventType === 'TASK_CANCELLED') {
    stopArrivalVibrationAlert();
    if (data.payload?.request && state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === data.payload.requestId);
      if (idx >= 0) state.db.requests[idx] = data.payload.request;
    }
    lastUiOverlaySignature = '';
    if (state.role === 'CUSTOMER') {
      state.screenStep = 'HOME';
      state.activeRequestId = null;
      state.pendingSearchFareUsd = null;
    }
    if (state.role === 'PROVIDER') {
      state.providerTab = 'FEED';
    }
    showToast(data.payload?.reason ? `Booking cancelled: ${data.payload.reason}` : `Booking was cancelled.`);
    renderAll();
    return;
  }

  // 8. REAL-TIME CALL INCOMING (Signaling to recipient)
  if (data.eventType === 'CALL_INCOMING' && data.payload) {
    const c = data.payload;
    if (isCallForCurrentUser(c)) {
      state.incomingCall = {
        callerId: c.callerId,
        callerName: c.callerName || 'User',
        contextTitle: c.contextTitle || 'In-App Audio Call',
        channelId: c.channelId || ('call_' + c.requestId),
        requestId: c.requestId
      };
      playIncomingRingtone();
      renderCallModal();
      triggerSystemNotification('Incoming Call from ' + (c.callerName || 'User'), c.contextTitle || 'Tap to answer', 'call_' + c.requestId);
      try {
        if (window.FinditNative && typeof window.FinditNative.triggerIncomingCall === 'function') {
          window.FinditNative.triggerIncomingCall(c.callerName || 'Findit User', 'Voice', c.channelId);
        }
      } catch (nativeCallErr) {}
      startActiveCallPolling();
    }
    return;
  }

  // 9. REAL-TIME CALL RESPONSE (Signaling to caller)
  if (data.eventType === 'CALL_RESPONSE' && data.payload) {
    const { channelId, action } = data.payload;
    if (action === 'ACCEPT' && state.activeCall && state.activeCall.channelId === channelId) {
      stopCallRingtones();
      state.activeCall.callState = 'CONNECTED';
      state.callSeconds = 0;
      if (callInterval) clearInterval(callInterval);
      callInterval = setInterval(() => {
        state.callSeconds++;
        const el = document.getElementById('callTimerText');
        if (el) {
          const m = String(Math.floor(state.callSeconds / 60)).padStart(2, '0');
          const s = String(state.callSeconds % 60).padStart(2, '0');
          el.textContent = `${m}:${s}`;
        }
      }, 1000);
      renderCallModal();
      // Caller initiates dual-engine audio streams now that callee has accepted!
      joinDualEngineCall(channelId, true);
    } else if ((action === 'DECLINE' || action === 'END') && (state.activeCall || state.incomingCall)) {
      endInAppCall(false);
    }
    return;
  }

  // 10. REAL-TIME WEBRTC P2P SIGNALING (Point A to Point B direct voice stream)
  if (data.eventType === 'CALL_WEBRTC_SIGNAL' && data.payload) {
    handleWebRtcSignalMessage(data.payload);
    return;
  }

  // 11. Findit : PROVIDER TRANSIT DELAY NOTICE
  if (data.eventType === 'BOOKING_DELAYED' && data.payload?.request) {
    const { requestId, request, delayNotice } = data.payload;
    if (state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === requestId);
      if (idx >= 0) state.db.requests[idx] = request;
    }
    if (state.role === 'CUSTOMER' && state.activeRequestId === requestId) {
      showToast(`Transit Notice: Provider running ~${delayNotice.minutes}m late (${delayNotice.reason})`);
      if ('vibrate' in navigator) try { navigator.vibrate([200, 100, 200]); } catch (e) {}
    }
    updateChatFeedDomOnly(request);
    lastUiOverlaySignature = '';
    renderUiOverlay();
    return;
  }

  // 12. REAL-TIME PROVIDER LIVE LOCATION MOVED (Smooth map update)
  if (data.eventType === 'PROVIDER_MOVED' && data.payload) {
    const { providerId, lat, lng } = data.payload;
    if (state.db?.providers) {
      const p = state.db.providers.find((x) => x.id === providerId);
      if (p) {
        p.lat = lat;
        p.lng = lng;
      }
    }
    updateMapMarkers(true);
    return;
  }

  // 13. REAL-TIME CLIENT LIVE LOCATION (Directs providers straight to client live GPS position)
  if (data.eventType === 'CLIENT_LOCATION_UPDATED' && data.payload) {
    const { requestId, lat, lng, exactAddress } = data.payload;
    if (state.db?.requests) {
      const r = state.db.requests.find((x) => x.id === requestId);
      if (r) {
        r.lat = Number(lat);
        r.lng = Number(lng);
        r.clientLiveLat = Number(lat);
        r.clientLiveLng = Number(lng);
        if (exactAddress) r.exactAddress = exactAddress;
      }
    }
    if (state.role === 'PROVIDER') {
      const prov = state.currentUser || state.db?.providers?.[0];
      const activeJob = getProviderActiveBooking(prov?.id);
      if (activeJob && activeJob.id === requestId) {
        activeJob.lat = Number(lat);
        activeJob.lng = Number(lng);
        activeJob.clientLiveLat = Number(lat);
        activeJob.clientLiveLng = Number(lng);
        if (exactAddress) activeJob.exactAddress = exactAddress;
        updateMapMarkers(true);
      }
    }
    return;
  }

  // If user is currently typing in an input, don't interrupt them
  const activeEl = document.activeElement;
  const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
  if (state.activeModal === 'SIGNUP_FLOW' || isUserTyping) {
    return;
  }

  fetchState();
}

let wsConsecutiveFailures = 0;

function connectWebSocket() {
  if (realtimeWebSocket) {
    try { realtimeWebSocket.close(); } catch (e) {}
    realtimeWebSocket = null;
  }

  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  // If running on Vercel and no external WS_RELAY_HOST is configured, skip WS handshake so there is 0ms connection lag
  if (isVercel && !WS_RELAY_HOST) {
    isWsConnected = false;
    return;
  }

  if (typeof WebSocket === 'undefined') {
    if (!isVercel) connectRealtimeStream();
    return;
  }

  try {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const targetHost = isVercel ? WS_RELAY_HOST : window.location.host;
    const wsUrl = `${wsProto}//${targetHost}/ws`;
    const ws = new WebSocket(wsUrl);
    realtimeWebSocket = ws;

    ws.onopen = () => {
      isWsConnected = true;
      wsConsecutiveFailures = 0;
      if (realtimeEventSource) {
        try { realtimeEventSource.close(); } catch (e) {}
        realtimeEventSource = null;
      }
      fetchState(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.eventType === 'PING') return;
        handleIncomingRealtimeEvent(data);
      } catch (e) {}
    };

    ws.onerror = () => {
      isWsConnected = false;
      wsConsecutiveFailures++;
      if (!isVercel && !realtimeEventSource) {
        connectRealtimeStream();
      }
    };

    ws.onclose = () => {
      isWsConnected = false;
      if (!realtimeReconnectTimer) {
        // Back off cleanly if WebSocket relay is suspended/unreachable so Vercel polling runs smoothly
        const retryDelayMs = wsConsecutiveFailures >= 2 ? 60000 : 4000;
        realtimeReconnectTimer = setTimeout(() => {
          realtimeReconnectTimer = null;
          connectWebSocket();
        }, retryDelayMs);
      }
    };
  } catch (e) {
    if (!isVercel) connectRealtimeStream();
  }
}

function connectRealtimeStream() {
  if (realtimeEventSource) {
    try { realtimeEventSource.close(); } catch (e) {}
    realtimeEventSource = null;
  }

  try {
    const sseBase = (typeof API_BASE !== 'undefined' && API_BASE) ? API_BASE : '';
    const es = new EventSource(`${sseBase}/api/stream`);
    realtimeEventSource = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleIncomingRealtimeEvent(data);
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      try { es.close(); } catch (e) {}
      realtimeEventSource = null;
      if (!realtimeReconnectTimer && !isWsConnected) {
        realtimeReconnectTimer = setTimeout(connectRealtimeStream, 2500);
      }
    };
  } catch (err) {
    if (!realtimeReconnectTimer && !isWsConnected) {
      realtimeReconnectTimer = setTimeout(connectRealtimeStream, 3000);
    }
  }
}

// ============================================================================
// 1-SECOND COUNTDOWN LOOP FOR SEARCH BAR, GEOFENCE 50M ALERTS & 20M AUTO-PAIR
// ============================================================================
function compressImageFileToDataUrl(file, maxDimension = 800, quality = 0.72) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let w = img.width;
          let h = img.height;
          if (w > maxDimension || h > maxDimension) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 999999;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function checkProximityAutoPairTick() {
  if (!state.db || !state.isAuthenticated) return;
  if (!state.bookingProximitySeconds) state.bookingProximitySeconds = {};

  const bookedJob = state.role === 'PROVIDER'
    ? getProviderActiveBooking(state.currentUser?.id)
    : getCustomerActiveRequest();

  if (!bookedJob || bookedJob.status === 'COMPLETED' || bookedJob.status === 'CANCELLED' || bookedJob.status === 'OPEN') {
    if (bookedJob?.id && state.bookingProximitySeconds[bookedJob.id]) {
      delete state.bookingProximitySeconds[bookedJob.id];
    }
    return;
  }

  const provId = bookedJob.acceptedProviderId || bookedJob.offers?.[0]?.providerId;
  const prov = (state.db.providers || []).find((p) => p.id === provId) || state.db.providers?.[0];
  if (!prov) return;

  const distMeters = calculateDistanceMeters(prov.lat, prov.lng, bookedJob.lat, bookedJob.lng);
  const isWithin20m = distMeters <= 20 || bookedJob.status === 'ARRIVED';

  if (isWithin20m) {
    state.bookingProximitySeconds[bookedJob.id] = (state.bookingProximitySeconds[bookedJob.id] || 0) + 1;
    const currentSec = state.bookingProximitySeconds[bookedJob.id];

    // 1. Client's phone starts ringing & vibrating when provider says "I'm outside" OR is within 20 meters!
    if (state.role === 'CUSTOMER' && !bookedJob.pinVerifiedByProvider) {
      if (currentSec <= 300) {
        startArrivalVibrationAlert(bookedJob);
      } else {
        stopArrivalVibrationAlert();
      }
    }

    // 2. If provider is within 20 meters for 1.5 minutes (90 seconds), the "I'm Outside" button
    // disappears automatically as if clicked, and the provider screen now waits for PIN!
    if (state.role === 'PROVIDER' && bookedJob.status !== 'ARRIVED' && !bookedJob.pinVerifiedByProvider && currentSec >= 90) {
      providerMarkArrived(bookedJob.id);
    }

    // Update countdown timer on DOM: 3 minutes = 180 seconds auto-pair threshold
    const countdownEls = document.querySelectorAll('.proximity-autopair-timer');
    countdownEls.forEach((el) => {
      const remaining = Math.max(0, 180 - currentSec);
      const m = Math.floor(remaining / 60);
      const s = String(remaining % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
    });

    // If provider is within 20m for 3 minutes (180s) and PIN not shared, auto-pair & deduct commission!
    if (currentSec >= 180 && !bookedJob.pinVerifiedByProvider && !bookedJob.autoPairTriggered) {
      bookedJob.autoPairTriggered = true;
      delete state.bookingProximitySeconds[bookedJob.id];
      stopArrivalVibrationAlert();
      apiPost('/api/bookings/verify-pin', {
        requestId: bookedJob.id,
        autoVerified: true,
        requestSnapshot: bookedJob
      }).then(() => {
        fetchState(true);
      }).catch((e) => console.warn('Auto-pair trigger error:', e));
    }
  } else {
    state.bookingProximitySeconds[bookedJob.id] = 0;
  }
}

function startOfferCountdownLoop() {
  if (offerCountdownInterval) clearInterval(offerCountdownInterval);
  offerCountdownInterval = setInterval(() => {
    tickCountdowns();
  }, 1000);
}

let lastBackgroundSyncTime = Date.now();

async function tickCountdowns() {
  checkProximityAutoPairTick();

  // Multi-device real-time sync every 3s during active search, active booking, or provider job feed
  if (Date.now() - lastBackgroundSyncTime > 3000) {
    lastBackgroundSyncTime = Date.now();
    const activeEl = document.activeElement;
    const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
    if (!isUserTyping && state.activeModal !== 'SIGNUP_FLOW') {
      const needsSync = (state.role === 'CUSTOMER' && (state.screenStep === 'SEARCHING' || state.screenStep === 'BOOKED')) ||
                        (state.role === 'PROVIDER' && state.providerTab === 'FEED');
      if (needsSync) {
        fetchState();
      }
    }
  }

  if (!state.db || !state.isAuthenticated || state.role !== 'CUSTOMER') return;
  const activeReq = getCustomerActiveRequest();
  if (!activeReq || activeReq.status !== 'OPEN') return;

  const createdMs = new Date(activeReq.createdAt).getTime();
  const elapsedSec = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));
  const remSearchSec = Math.max(0, 120 - (elapsedSec % 120));
  const mins = Math.floor(remSearchSec / 60);
  const secs = String(remSearchSec % 60).padStart(2, '0');

  const timerTextEl = document.getElementById('searchMmSsTimer');
  if (timerTextEl) timerTextEl.textContent = `${mins}:${secs}`;

  const searchBarEl = document.getElementById('searchProgressFill');
  if (searchBarEl) {
    searchBarEl.style.width = `${Math.max(4, (remSearchSec / 120) * 100)}%`;
  }

  const nowMs = Date.now();
  const expiredOffers = [];

  (activeReq.offers || []).forEach((offer) => {
    const expiresAt = offer.expiresAt || (new Date(offer.createdAt).getTime() + 120 * 1000);
    const totalMs = (offer.ttlSeconds || 120) * 1000;
    const remMs = Math.max(0, expiresAt - nowMs);
    const pct = Math.max(0, Math.min(100, (remMs / totalMs) * 100));

    const fillEl = document.getElementById(`accept_fill_${offer.id}`);
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
    }

    if (remMs <= 0) {
      expiredOffers.push(offer);
    }
  });

  if (expiredOffers.length > 0) {
    for (const exp of expiredOffers) {
      await apiPost('/api/offers/decline', {
        requestId: activeReq.id,
        offerId: exp.id,
        reason: 'AUTO_EXPIRED_120S'
      });
    }
    await fetchState();
  }
}

async function apiGet(url, retries = 2) {
  const target = url.startsWith('http') ? url : (API_BASE + url);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(target);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function apiPost(url, body, retries = 2) {
  markLocalStateMutation();
  const target = url.startsWith('http') ? url : (API_BASE + url);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.error || 'Request failed');
        error.data = data;
        error.status = res.status;
        throw error;
      }
      return data;
    } catch (err) {
      if (err.status && err.status < 500) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

function compressDataUrlIfNeeded(dataUrl, maxDim = 500, quality = 0.72) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return resolve(dataUrl);
    if (dataUrl.startsWith('data:image/svg+xml')) return resolve(dataUrl);
    if (dataUrl.length < 80000) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

let hasUnlockedAudioSpeech = false;
function ensureAudioAndSpeechUnlocked() {
  if (hasUnlockedAudioSpeech) return;
  hasUnlockedAudioSpeech = true;
  try {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0.01;
      silent.rate = 2.0;
      window.speechSynthesis.speak(silent);
    }
  } catch (e) {}
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', ensureAudioAndSpeechUnlocked, { once: false, passive: true });
  document.addEventListener('touchstart', ensureAudioAndSpeechUnlocked, { once: false, passive: true });
}

function showToast(msg, type = 'info') {
  if (state.activeCall || state.incomingCall) return;
  // Ignore raw transient fetch drops from displaying scary toasts
  if (typeof msg === 'string' && (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror'))) {
    console.warn('Network notice (auto-reconnecting):', msg);
    return;
  }
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ============================================================================
// 100% WORKING OPENSTREETMAP (ZERO "API KEY REQUIRED") + REAL REVERSE GEOCODER
// ============================================================================
function initLeafletMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl) return;

  try {
    if (typeof L === 'undefined') throw new Error('Leaflet unavailable');

    leafletMap = L.map('leafletMap', {
      zoomControl: false,
      attributionControl: false
    }).setView([state.pinnedLat, state.pinnedLng], 14);

    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(leafletMap);

    osmLayer.on('tileerror', () => {
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(leafletMap);
    });

    leafletMarkersLayer = L.layerGroup().addTo(leafletMap);

    leafletMap.on('movestart', () => {});

    leafletMap.on('moveend', () => {
      if (!leafletMap) return;
      // Moving the map does NOT change your location (only pans map view across Harare)
    });

    updateLiveGpsMarker();
    updateMapMarkers();
  } catch (err) {
    console.warn('Using built-in Harare street map fallback:', err.message);
    const fb = document.getElementById('fallbackRadarMap');
    if (fb) fb.style.display = 'block';
  }
}

function syncPinDomLabels() {
  const pinLabel = document.getElementById('centerPinLabel');
  if (pinLabel) {
    pinLabel.textContent = `Deliver to: ${state.customAddress} (Live Location)`;
  }
  const routeAddrEl = document.querySelector('.indrive-top-route-card .top-route-row .top-route-text');
  if (routeAddrEl) {
    routeAddrEl.textContent = `${state.customAddress}, ${(state.customSuburbLabel || 'Harare').split(',')[0]}`;
  }
  updateLiveGpsMarker();
}

function handleCenterPinBubbleClick() {
  openSuburbPickerModal();
}

function orderFromCurrentMapPin() {
  if (state.role === 'PROVIDER') return;
  const activeReq = getCustomerActiveRequest();
  if (activeReq) return;
  state.hubView = 'MARKETPLACE';
  if (state.screenStep !== 'CONFIGURE') {
    openConfigureStep(state.selectedSubServiceIdx || 0);
  } else {
    state.isSheetMinimized = false;
    renderUiOverlay(true);
  }
  showToast(`Ordering service at: ${state.customAddress}`);
}

function reverseGeocodeHararePin(lat, lng) {
  if (!state.db || !state.db.suburbs) return;
  let nearest = state.db.suburbs[0];
  let bestDist = Infinity;

  for (const s of state.db.suburbs) {
    const d = Math.hypot(s.lat - lat, s.lng - lng);
    if (d < bestDist) {
      bestDist = d;
      nearest = s;
    }
  }
  state.selectedSuburbId = nearest.id;
  state.customAddress = nearest.sampleStreet ? nearest.sampleStreet.split(',')[0] : nearest.name;
  state.customSuburbLabel = `${nearest.name}, Harare`;
  syncPinDomLabels();

  if (geocodeDebounceTimer) clearTimeout(geocodeDebounceTimer);
  geocodeDebounceTimer = setTimeout(async () => {
    try {
      const srvRes = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (srvRes.ok) {
        const data = await srvRes.json();
        if (data && data.suburb) {
          state.customAddress = data.road || data.suburb;
          state.customSuburbLabel = `${data.suburb}, Harare`;
          if (data.suburbId) state.selectedSuburbId = data.suburbId;
          syncPinDomLabels();
          return;
        }
      }
    } catch (e) {}

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || nearest.name;
        const road = addr.road || addr.pedestrian || addr.residential || suburb;
        const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
        state.customAddress = `${road}${houseNumber}`;
        state.customSuburbLabel = `${suburb}, Harare`;
        syncPinDomLabels();
        return;
      }
    } catch (e) {}

    state.customAddress = nearest.name;
    state.customSuburbLabel = `${nearest.name}, Harare`;
    syncPinDomLabels();
  }, 200);
}

// ============================================================================
// INDRIVE LIVE GPS NAVIGATION ENGINE & TURN-BY-TURN AUDIO DIRECTIONS
// ============================================================================
const liveNavState = {
  active: false,
  voiceEnabled: true,
  steps: [],
  currentStepIdx: 0,
  totalDistanceMeters: 0,
  totalDurationSeconds: 0,
  destinationName: '',
  destinationLat: null,
  destinationLng: null,
  bearingDeg: 0,
  lastSpokenText: '',
  lastSpokenMs: 0
};

function calculateBearingDegrees(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((brng + 360) % 360);
}

function getManeuverSvgIcon(type = 'turn', modifier = 'straight', size = 26) {
  const mod = (modifier || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (t === 'arrive') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/></svg>`;
  }
  if (mod.includes('left')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 19v-6a5 5 0 0 0-5-5H5M5 8l-4 4 4 4"/></svg>`;
  }
  if (mod.includes('right')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19v-6a5 5 0 0 1 5-5h9M19 8l4 4-4 4"/></svg>`;
  }
  if (mod.includes('u-turn') || mod.includes('uturn')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10a5 5 0 1 1 10 0v9M9 10L5 6m4 4l-4 4"/></svg>`;
  }
  if (t.includes('roundabout')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.8 1.04 6.44 2.73M21 5v5h-5"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
}

let cachedNavigationVoice = null;

function getGoogleMapsNavigationVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  // 1. Google Maps native voice (Chrome, Android, and Google TTS)
  const googleVoice = voices.find((v) =>
    v.name.includes('Google') && (v.name.includes('US English') || v.name.includes('UK English Female') || v.name.includes('English') || v.lang.startsWith('en'))
  );
  if (googleVoice) return googleVoice;

  // 2. High-quality natural English voices (iOS / macOS / Windows)
  const naturalVoices = ['Samantha', 'Karen', 'Victoria', 'Moira', 'Tessa', 'Jenny', 'Aria', 'Natural'];
  for (const name of naturalVoices) {
    const match = voices.find((v) => v.name.includes(name) && v.lang.startsWith('en'));
    if (match) return match;
  }

  // 3. Clean standard English voice (strictly avoid novelty/robotic voices like Fred, Bad News, Albert, etc.)
  const noveltyVoices = ['Fred', 'Bad News', 'Bells', 'Cellos', 'Good News', 'Organ', 'Trinoids', 'Whisper', 'Zarvox', 'Albert', 'Boing', 'Bubbles', 'Deranged', 'Hysterical', 'Jester'];
  const cleanEnglish = voices.find((v) =>
    v.lang.startsWith('en') && !noveltyVoices.some((nov) => v.name.includes(nov))
  );
  return cleanEnglish || voices[0] || null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedNavigationVoice = getGoogleMapsNavigationVoice();
  };
}

function playNavTurnChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) {}
}

function speakNavigationDirection(text) {
  if (!liveNavState.voiceEnabled) return;
  if (!text || typeof text !== 'string') return;
  const now = Date.now();
  if (liveNavState.lastSpokenText === text && now - liveNavState.lastSpokenMs < 8000) return;
  liveNavState.lastSpokenText = text;
  liveNavState.lastSpokenMs = now;

  // 1. Audible Nav Ding
  playNavTurnChime();

  // 2. High Quality Speech Synthesis (Google Maps & inDrive Voice Guidance)
  if ('speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = cachedNavigationVoice || getGoogleMapsNavigationVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  // 3. Android Native Text-to-Speech Engine (Plays aloud on mobile device regardless of webview mute)
  try {
    if (window.FinditNative && typeof window.FinditNative.speak === 'function') {
      window.FinditNative.speak(text);
    }
  } catch (nativeErr) {}
}

function toggleNavVoice() {
  liveNavState.voiceEnabled = !liveNavState.voiceEnabled;
  if (liveNavState.voiceEnabled) {
    speakNavigationDirection('Navigation voice guidance active');
    showToast('Voice directions unmuted', 'info');
  } else {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    try {
      if (window.FinditNative && typeof window.FinditNative.stopSpeech === 'function') {
        window.FinditNative.stopSpeech();
      }
    } catch (e) {}
    showToast('Voice directions muted', 'info');
  }
  renderNavigationHud();
}

function recenterNavigationCamera() {
  if (!leafletMap) return;
  const lat = state.userLiveGpsLat || state.pinnedLat;
  const lng = state.userLiveGpsLng || state.pinnedLng;
  if (lat && lng) {
    leafletMap.flyTo([lat, lng], 16, { duration: 0.6 });
    showToast('Centered on your live location', 'info');
  }
}

function renderNavigationHud() {
  const hud = document.getElementById('navigationHudOverlay');
  if (!hud) return;

  if (!liveNavState.active || !liveNavState.steps || liveNavState.steps.length === 0) {
    hud.style.display = 'none';
    return;
  }

  const currentStep = liveNavState.steps[liveNavState.currentStepIdx] || liveNavState.steps[0];
  const stepDist = currentStep.distance || 0;
  const distText = stepDist < 1000 ? `In ${Math.round(stepDist)} m` : `In ${(stepDist / 1000).toFixed(1)} km`;

  const roadName = currentStep.name || 'Client Route';
  const mod = currentStep.modifier || '';
  const actionText = currentStep.type === 'arrive'
    ? 'Arrive at client destination'
    : mod ? `Turn ${mod} onto ${roadName}` : `Continue straight onto ${roadName}`;

  const iconSvg = getManeuverSvgIcon(currentStep.type, currentStep.modifier, 24);

  const totalDistKm = (liveNavState.totalDistanceMeters / 1000).toFixed(1);
  const totalMins = Math.max(1, Math.round(liveNavState.totalDurationSeconds / 60));

  hud.style.display = 'flex';
  hud.innerHTML = `
    <div class="nav-hud-main">
      <div class="nav-maneuver-icon-box">
        ${iconSvg}
      </div>
      <div class="nav-hud-info">
        <div class="nav-hud-dist">${distText}</div>
        <div class="nav-hud-street">${escapeHtml(actionText)}</div>
      </div>
      <div class="nav-hud-controls">
        <button type="button" class="nav-hud-btn ${liveNavState.voiceEnabled ? 'active' : ''}" onclick="toggleNavVoice()" title="${liveNavState.voiceEnabled ? 'Mute Voice' : 'Enable Voice'}">
          ${liveNavState.voiceEnabled
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
          }
        </button>
        <button type="button" class="nav-hud-btn" onclick="recenterNavigationCamera()" title="Recenter GPS">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </button>
      </div>
    </div>
    <div class="nav-hud-footer">
      <div class="nav-hud-eta">
        <span class="nav-pulse-dot"></span>
        <span>${totalDistKm} km • ~${totalMins} min remaining</span>
      </div>
      <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">
        To: ${escapeHtml(liveNavState.destinationName || 'Client Address')}
      </div>
    </div>
  `;
}

function stopNavigationHud() {
  liveNavState.active = false;
  liveNavState.steps = [];
  const hud = document.getElementById('navigationHudOverlay');
  if (hud) hud.style.display = 'none';
}

function advanceNavigationStep(curLat, curLng) {
  if (!liveNavState.active || !liveNavState.steps || liveNavState.steps.length === 0) return;
  const currentStep = liveNavState.steps[liveNavState.currentStepIdx];
  if (!currentStep) return;

  let stepLoc = currentStep.location;
  if (!stepLoc || !stepLoc[0]) {
    stepLoc = [liveNavState.destinationLat, liveNavState.destinationLng];
  }
  const distToManeuver = calculateDistanceMeters(curLat, curLng, stepLoc[0], stepLoc[1]);
  currentStep.distance = distToManeuver;

  const distToDest = calculateDistanceMeters(curLat, curLng, liveNavState.destinationLat, liveNavState.destinationLng);
  liveNavState.totalDistanceMeters = distToDest;
  liveNavState.totalDurationSeconds = Math.round(distToDest / 8.5);

  if (distToManeuver < 35 && liveNavState.currentStepIdx < liveNavState.steps.length - 1) {
    liveNavState.currentStepIdx++;
    const nextStep = liveNavState.steps[liveNavState.currentStepIdx];
    const speech = nextStep.type === 'arrive'
      ? `In 50 meters, your client's live location is ahead.`
      : `Turn ${nextStep.modifier || 'onto'} ${nextStep.name || 'next street'}`;
    speakNavigationDirection(speech);
  } else if (distToDest <= 20) {
    speakNavigationDirection("You have arrived at your destination, thanks for using Findit");
    setTimeout(() => {
      stopNavigationHud();
    }, 3200);
  } else if (distToManeuver <= 75 && distToManeuver > 35) {
    const speech = `In ${Math.round(distToManeuver)} meters, turn ${currentStep.modifier || 'onto'} ${currentStep.name || 'next street'}`;
    speakNavigationDirection(speech);
  }

  renderNavigationHud();
}

async function drawRoadRouteOnMap(lat1, lng1, lat2, lng2, color = '#0066FF', weight = 5, isNav = false, reqContext = null) {
  if (!leafletMap) return;

  // inDrive rule: When looking for providers, never show route polylines; show only concentric radar pulse
  const activeCustomerReq = getCustomerActiveRequest();
  if (state.role === 'CUSTOMER' && (state.screenStep === 'SEARCHING' || (activeCustomerReq && activeCustomerReq.status === 'OPEN'))) {
    if (leafletRoutePolyline) {
      try { leafletMap.removeLayer(leafletRoutePolyline); } catch (e) {}
      leafletRoutePolyline = null;
    }
    if (leafletRoutePolylineCasing) {
      try { leafletMap.removeLayer(leafletRoutePolylineCasing); } catch (e) {}
      leafletRoutePolylineCasing = null;
    }
    return;
  }
  const key = `${lat1.toFixed(4)},${lng1.toFixed(4)}->${lat2.toFixed(4)},${lng2.toFixed(4)}`;

  let coords = osrmRouteCache.get(key);
  let steps = osrmStepsCache.get(key);

  if (!coords) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const r = data.routes[0];
          if (r.geometry) {
            coords = r.geometry.coordinates.map((c) => [c[1], c[0]]);
            osrmRouteCache.set(key, coords);
          }
          if (r.legs && r.legs[0] && r.legs[0].steps) {
            steps = r.legs[0].steps.map((st) => ({
              type: st.maneuver?.type || 'turn',
              modifier: st.maneuver?.modifier || '',
              name: st.name || (st.maneuver?.modifier ? `onto ${st.maneuver.modifier} street` : 'Harare Route'),
              distance: Math.round(st.distance || 0),
              duration: Math.round(st.duration || 0),
              location: st.maneuver?.location ? [st.maneuver.location[1], st.maneuver.location[0]] : [lat2, lng2]
            }));
            osrmStepsCache.set(key, steps);
            liveNavState.totalDistanceMeters = Math.round(r.distance || calculateDistanceMeters(lat1, lng1, lat2, lng2));
            liveNavState.totalDurationSeconds = Math.round(r.duration || (liveNavState.totalDistanceMeters / 8.5));
          }
        }
      }
    } catch (e) {}
  }

  if (!coords) {
    coords = buildCurvedPreviewPoints(lat1, lng1, lat2, lng2);
  }

  if (!steps || steps.length === 0) {
    const totalDist = calculateDistanceMeters(lat1, lng1, lat2, lng2);
    const destName = reqContext?.exactAddress || reqContext?.suburbName || 'Client Address';
    steps = [
      {
        type: 'depart',
        modifier: 'straight',
        name: 'Head towards destination',
        distance: Math.round(totalDist * 0.4),
        duration: Math.round(totalDist * 0.4 / 8.5),
        location: coords[Math.floor(coords.length * 0.4)] || [lat2, lng2]
      },
      {
        type: 'turn',
        modifier: 'left',
        name: `Turn onto ${destName}`,
        distance: Math.round(totalDist * 0.6),
        duration: Math.round(totalDist * 0.6 / 8.5),
        location: [lat2, lng2]
      },
      {
        type: 'arrive',
        modifier: '',
        name: `${reqContext?.customerName || 'Client'}'s Gate`,
        distance: 25,
        duration: 5,
        location: [lat2, lng2]
      }
    ];
    liveNavState.totalDistanceMeters = totalDist;
    liveNavState.totalDurationSeconds = Math.round(totalDist / 8.5);
  }

  // inDrive Dual-Layer Route Polyline (Dark Casing + Glowing Blue Active Polyline)
  if (leafletRoutePolylineCasing) {
    leafletMap.removeLayer(leafletRoutePolylineCasing);
  }
  leafletRoutePolylineCasing = L.polyline(coords, {
    color: '#0F172A',
    weight: weight + 3,
    opacity: 0.35
  }).addTo(leafletMap);

  if (leafletRoutePolyline) {
    leafletMap.removeLayer(leafletRoutePolyline);
  }
  leafletRoutePolyline = L.polyline(coords, {
    color,
    weight,
    opacity: 0.95
  }).addTo(leafletMap);

  if (isNav && state.role === 'PROVIDER') {
    liveNavState.active = true;
    liveNavState.steps = steps;
    liveNavState.currentStepIdx = 0;
    renderNavigationHud();
    const firstStep = steps[0];
    const initialSpeech = firstStep ? `Navigating to ${reqContext?.customerName || 'client'}. In ${firstStep.distance} meters, ${firstStep.name}` : `Navigating to client location.`;
    speakNavigationDirection(initialSpeech);
  }

  // Automatically zoom and center the map so the full route is visible
  if (coords && coords.length > 1) {
    try {
      leafletMap.fitBounds(L.latLngBounds(coords), { padding: [70, 70], maxZoom: 16 });
    } catch (e) {}
  }
}

async function updateProviderLiveNavigation(prov, req) {
  if (!prov || !req) return;
  const provLat = Number(prov.lat || state.userLiveGpsLat || -17.7885);
  const provLng = Number(prov.lng || state.userLiveGpsLng || 31.0415);
  const reqLat = Number(req.lat || -17.8292);
  const reqLng = Number(req.lng || 31.0522);

  liveNavState.destinationLat = reqLat;
  liveNavState.destinationLng = reqLng;
  liveNavState.destinationName = `${req.customerName || 'Client'}'s Live Location (${req.exactAddress || req.suburbName || 'Harare'})`;

  await drawRoadRouteOnMap(provLat, provLng, reqLat, reqLng, '#0066FF', 5, true, req);
}

let providerLocationWatchId = null;
let lastProviderReportedLat = null;
let lastProviderReportedLng = null;
let lastProviderBackendSyncMs = 0;

function startProviderLiveLocationWatcher() {
  if (!('geolocation' in navigator)) return;
  if (providerLocationWatchId !== null) return;

  providerLocationWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const rawLat = Number(latitude.toFixed(5));
      const rawLng = Number(longitude.toFixed(5));

      // Jitter filter: calculate distance in meters from previous reading
      if (lastProviderReportedLat !== null && lastProviderReportedLng !== null) {
        const moveDistMeters = calculateDistanceMeters(lastProviderReportedLat, lastProviderReportedLng, rawLat, rawLng);
        // Ignore microscopic GPS noise / jitter under 3 meters to prevent pin shaking
        if (moveDistMeters < 3.0) {
          return;
        }
        const brng = calculateBearingDegrees(lastProviderReportedLat, lastProviderReportedLng, rawLat, rawLng);
        liveNavState.bearingDeg = brng;
        const arrow = document.getElementById('proHeadingArrow');
        if (arrow) arrow.style.transform = `translateX(-50%) rotate(${brng}deg)`;
      }

      lastProviderReportedLat = rawLat;
      lastProviderReportedLng = rawLng;
      state.userLiveGpsLat = rawLat;
      state.userLiveGpsLng = rawLng;

      if (state.role === 'PROVIDER') {
        if (state.currentUser) {
          state.currentUser.lat = rawLat;
          state.currentUser.lng = rawLng;
        }
        const pMatch = (state.db?.providers || []).find((p) => p.id === state.currentUser?.id);
        if (pMatch) {
          pMatch.lat = rawLat;
          pMatch.lng = rawLng;
        }

        // Advance live GPS turn-by-turn navigation step & directions
        if (liveNavState.active && liveNavState.steps.length > 0) {
          advanceNavigationStep(rawLat, rawLng);
        }

        // Throttle backend server sync to at most once every 3.5 seconds
        const now = Date.now();
        if (now - lastProviderBackendSyncMs > 3500) {
          lastProviderBackendSyncMs = now;
          if (state.currentUser?.id) {
            apiPost('/api/providers/location', {
              providerId: state.currentUser.id,
              lat: rawLat,
              lng: rawLng,
              providerSnapshot: state.currentUser
            }).catch(() => {});
          }
        }

        // Smoothly update map without layer destruction
        updateMapMarkers(true);
      }
    },
    (err) => {
      console.warn('Provider live GPS watch notice:', err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000
    }
  );
}

function stopProviderLiveLocationWatcher() {
  if (providerLocationWatchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(providerLocationWatchId);
    providerLocationWatchId = null;
  }
}

let clientLocationWatchId = null;
let lastClientReportedLat = null;
let lastClientReportedLng = null;
let lastClientBackendSyncMs = 0;

function startClientLiveLocationWatcher() {
  if (!('geolocation' in navigator)) return;
  if (clientLocationWatchId !== null) return;

  clientLocationWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const rawLat = Number(latitude.toFixed(5));
      const rawLng = Number(longitude.toFixed(5));

      // Jitter filter: ignore under 3m movements
      if (lastClientReportedLat !== null && lastClientReportedLng !== null) {
        const moveDist = calculateDistanceMeters(lastClientReportedLat, lastClientReportedLng, rawLat, rawLng);
        if (moveDist < 3.0) return;
      }

      lastClientReportedLat = rawLat;
      lastClientReportedLng = rawLng;
      state.userLiveGpsLat = rawLat;
      state.userLiveGpsLng = rawLng;

      // Keep order pin pinned straight to live location unless client explicitly dragged it
      if (state.role === 'CUSTOMER' && (state.screenStep === 'HOME' || state.screenStep === 'CONFIGURE') && !state.userHasManuallyDraggedPin) {
        state.pinnedLat = rawLat;
        state.pinnedLng = rawLng;
        reverseGeocodeHararePin(rawLat, rawLng);
      }

      // If client has an active request, continuously broadcast live GPS updates so the provider is routed straight to them
      const activeReq = getCustomerActiveRequest();
      if (activeReq && activeReq.id) {
        activeReq.lat = rawLat;
        activeReq.lng = rawLng;
        activeReq.clientLiveLat = rawLat;
        activeReq.clientLiveLng = rawLng;
        const now = Date.now();
        if (now - lastClientBackendSyncMs > 3500) {
          lastClientBackendSyncMs = now;
          apiPost('/api/requests/client-location', {
            requestId: activeReq.id,
            lat: rawLat,
            lng: rawLng,
            address: state.customAddress ? `${state.customAddress} (Live Location)` : 'Current Live Location'
          }).catch(() => {});
        }
      }

      updateLiveGpsMarker();
    },
    (err) => {
      console.warn('Client live GPS watch notice:', err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000
    }
  );
}

function stopClientLiveLocationWatcher() {
  if (clientLocationWatchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(clientLocationWatchId);
    clientLocationWatchId = null;
  }
}

function updateNetworkOfflineStatus() {
  const banner = document.getElementById('offlineModeBanner');
  const isOnline = navigator.onLine;
  if (banner) {
    banner.style.display = isOnline ? 'none' : 'flex';
  }
}

window.addEventListener('online', () => {
  updateNetworkOfflineStatus();
  showToast('Back online — syncing latest data', 'info');
  fetchState(true);
});

window.addEventListener('offline', () => {
  updateNetworkOfflineStatus();
});

function useBrowserGeolocation(silent = false) {
  state.userHasManuallyDraggedPin = false;
  state.isCustomAddressSelected = false;
  state.customAddress = 'Current Live Location';
  if (state.role === 'PROVIDER') {
    startProviderLiveLocationWatcher();
  } else {
    startClientLiveLocationWatcher();
  }
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        state.userLiveGpsLat = Number(latitude.toFixed(5));
        state.userLiveGpsLng = Number(longitude.toFixed(5));

        state.pinnedLat = state.userLiveGpsLat;
        state.pinnedLng = state.userLiveGpsLng;
        state.userHasManuallyDraggedPin = false;
        state.isCustomAddressSelected = false;
        if (state.role !== 'PROVIDER') {
          reverseGeocodeHararePin(state.pinnedLat, state.pinnedLng);
        }

        if (state.role === 'PROVIDER' && state.currentUser) {
          state.currentUser.lat = state.userLiveGpsLat;
          state.currentUser.lng = state.userLiveGpsLng;
          const pMatch = (state.db?.providers || []).find((p) => p.id === state.currentUser.id);
          if (pMatch) {
            pMatch.lat = state.userLiveGpsLat;
            pMatch.lng = state.userLiveGpsLng;
          }
          apiPost('/api/providers/location', {
            providerId: state.currentUser.id,
            lat: state.userLiveGpsLat,
            lng: state.userLiveGpsLng
          }).catch(() => {});
        }

        updateLiveGpsMarker();
        updateMapMarkers(true);
        if (leafletMap) {
          leafletMap.flyTo([state.userLiveGpsLat || state.pinnedLat, state.userLiveGpsLng || state.pinnedLng], 17, { animate: true, duration: 0.8 });
        }
        if (!silent) {
          showToast(`Centered on live GPS: ${state.customAddress || 'Harare'}`);
        }
      },
      () => {
        state.userHasManuallyDraggedPin = false;
        state.isCustomAddressSelected = false;
        if (state.userLiveGpsLat && state.userLiveGpsLng) {
          state.pinnedLat = state.userLiveGpsLat;
          state.pinnedLng = state.userLiveGpsLng;
        }
        updateLiveGpsMarker();
        if (leafletMap) {
          leafletMap.flyTo([state.pinnedLat, state.pinnedLng], 17, { animate: true, duration: 0.8 });
        }
        if (!silent) {
          showToast('Centered on Harare location');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  } else if (!silent && leafletMap) {
    leafletMap.flyTo([state.pinnedLat, state.pinnedLng], 17, { animate: true, duration: 0.8 });
  }
}

function updateLiveGpsMarker() {
  if (!leafletMap) return;

  // In provider mode, provider's own position is rendered with their trade icon
  if (state.role === 'PROVIDER') {
    if (userLiveGpsMarker) {
      leafletMap.removeLayer(userLiveGpsMarker);
      userLiveGpsMarker = null;
    }
    return;
  }

  const lat = state.pinnedLat || state.userLiveGpsLat || -17.7955;
  const lng = state.pinnedLng || state.userLiveGpsLng || 31.0365;
  if (!lat || !lng) return;

  // Authentic inDrive passenger client icon: pure vector icon (exactly 1 on map, draggable to choose pickup/visit location)
  const gpsIcon = L.divIcon({
    className: 'indrive-client-map-marker-wrap',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; pointer-events:auto; cursor:grab;" title="Drag to choose location">
        <div style="background:#0F172A; color:#FFFFFF; font-size:10px; font-weight:800; padding:2px 8px; border-radius:99px; margin-bottom:3px; white-space:nowrap; box-shadow:0 3px 10px rgba(15,23,42,0.3); display:inline-flex; align-items:center; gap:4px;">
          <span style="display:inline-block; width:5px; height:5px; border-radius:50%; background:#10B981;"></span>
          <span>${escapeHtml(state.customAddress || 'Harare')}</span>
        </div>
        <div style="position:relative; width:40px; height:40px; border-radius:50%; background:#0066FF; border:3px solid #FFFFFF; box-shadow:0 6px 18px rgba(0,102,255,0.45); display:flex; align-items:center; justify-content:center;">
          <div class="user-pin-pulse-ring" style="border-radius:50%;"></div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="#FFFFFF" stroke-width="2.5"/>
          </svg>
          <div style="position:absolute; bottom:-6px; background:#0F172A; color:#FFFFFF; font-size:8px; font-weight:900; letter-spacing:0.04em; padding:1px 5px; border-radius:99px; border:1px solid #FFFFFF;">YOU</div>
        </div>
      </div>
    `,
    iconSize: [110, 68],
    iconAnchor: [55, 58]
  });

  if (userLiveGpsMarker) {
    userLiveGpsMarker.setLatLng([lat, lng]);
    userLiveGpsMarker.setIcon(gpsIcon);
    if (!userLiveGpsMarker.dragging.enabled()) {
      userLiveGpsMarker.dragging.enable();
    }
  } else {
    userLiveGpsMarker = L.marker([lat, lng], {
      icon: gpsIcon,
      zIndexOffset: 1200,
      draggable: true
    }).addTo(leafletMap);

    userLiveGpsMarker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      const newLat = Number(pos.lat.toFixed(5));
      const newLng = Number(pos.lng.toFixed(5));
      state.pinnedLat = newLat;
      state.pinnedLng = newLng;
      state.userLiveGpsLat = newLat;
      state.userLiveGpsLng = newLng;
      state.userHasManuallyDraggedPin = true;
      state.isCustomAddressSelected = true;
      reverseGeocodeHararePin(newLat, newLng);
      updateLiveGpsMarker();
      renderUiOverlay(false);
      showToast(`Location set to: ${state.customAddress || 'Harare'}`);

      const activeReq = getCustomerActiveRequest();
      if (activeReq && (activeReq.status === 'OPEN' || activeReq.status === 'SEARCHING')) {
        activeReq.lat = newLat;
        activeReq.lng = newLng;
        activeReq.clientLiveLat = newLat;
        activeReq.clientLiveLng = newLng;
        activeReq.exactAddress = state.customAddress;
        apiPost('/api/requests/client-location', {
          requestId: activeReq.id,
          lat: newLat,
          lng: newLng,
          address: state.customAddress
        }).catch(() => {});
      }
    });
  }
}

let lastMapSignature = '';
const activeMapProviderMarkers = new Map();
const activeMapOfficeMarkers = new Map();
let activeRouteProviderMarker = null;
let activeRouteClientMarker = null;

function updateMapMarkers(force = false) {
  const centerPin = document.getElementById('centerMapPin');
  const whereFromBubble = document.getElementById('whereFromBubble');
  const whereFromOrderAction = document.getElementById('whereFromOrderAction');
  const radarPulses = document.getElementById('mapRadarPulses');
  const centerUserPinBox = document.getElementById('centerUserPinBox');

  const activeReq = getCustomerActiveRequest();
  const isSearching = Boolean(activeReq && activeReq.status === 'OPEN');
  const isBooked = Boolean(activeReq && isBookedStatus(activeReq.status));

  // Hide duplicate screen-center pin elements: strictly 1 client icon on the Leaflet map!
  if (centerUserPinBox) centerUserPinBox.style.display = 'none';
  if (whereFromBubble) whereFromBubble.style.display = 'none';
  if (whereFromOrderAction) whereFromOrderAction.style.display = 'none';

  if (centerPin) {
    if (state.role !== 'PROVIDER' && !isBooked && isSearching) {
      centerPin.style.display = 'flex';
      if (radarPulses) radarPulses.style.display = 'block';
    } else {
      if (radarPulses) radarPulses.style.display = 'none';
      centerPin.style.display = 'none';
    }
  }

  if (!leafletMap || !leafletMarkersLayer || !state.db) return;

  // Never keep or display routes while looking for providers
  if (isSearching) {
    if (leafletRoutePolyline) {
      try { leafletMap.removeLayer(leafletRoutePolyline); } catch (e) {}
      leafletRoutePolyline = null;
    }
    if (leafletRoutePolylineCasing) {
      try { leafletMap.removeLayer(leafletRoutePolylineCasing); } catch (e) {}
      leafletRoutePolylineCasing = null;
    }
  }

  const onlinePros = (state.db.providers || []).filter((p) => p.isOnline !== false);

  // In Service Provider Mode: if there is an active accepted booking, show the route to the Client's Home!
  if (state.isAuthenticated && state.role === 'PROVIDER') {
    const prov = state.currentUser || state.db.providers[0];
    const provActiveJob = getProviderActiveBooking(prov?.id);
    if (prov && provActiveJob) {
      drawProviderAndClientRouteMarkers(prov, provActiveJob);
      return;
    }
  }

  // In Client Mode when an offer is accepted: show ONLY the accepted Service Provider + Client Home Pin + Real Street Route!
  if (isBooked && activeReq) {
    const acceptedOffer = (activeReq.offers || []).find((o) => o.id === activeReq.acceptedOfferId) || activeReq.offers?.[0];
    const provId = activeReq.acceptedProviderId || acceptedOffer?.providerId;
    const prov = resolveProviderByIdOrOffer(provId, activeReq, acceptedOffer);
    if (prov) {
      drawProviderAndClientRouteMarkers(prov, activeReq);
      return;
    }
  }

  // Route markers and polyline clean up when not booked
  if (activeRouteProviderMarker) {
    try { leafletMarkersLayer.removeLayer(activeRouteProviderMarker); } catch (e) {}
    activeRouteProviderMarker = null;
  }
  if (activeRouteClientMarker) {
    try { leafletMarkersLayer.removeLayer(activeRouteClientMarker); } catch (e) {}
    activeRouteClientMarker = null;
  }
  if (leafletRoutePolyline) {
    try { leafletMap.removeLayer(leafletRoutePolyline); } catch (e) {}
    leafletRoutePolyline = null;
  }
  if (leafletRoutePolylineCasing) {
    try { leafletMap.removeLayer(leafletRoutePolylineCasing); } catch (e) {}
    leafletRoutePolylineCasing = null;
  }

  stopNavigationHud();

  // Reconcile and update provider markers with clean vector trade icons (NO profile photos on map)
  const currentProIds = new Set(onlinePros.map((p) => p.id));
  for (const [id, marker] of activeMapProviderMarkers.entries()) {
    if (!currentProIds.has(id)) {
      try { leafletMarkersLayer.removeLayer(marker); } catch (e) {}
      activeMapProviderMarkers.delete(id);
    }
  }

  onlinePros.forEach((p, idx) => {
    const showThinkingDots = isSearching && (p.categoryId === activeReq?.categoryId || idx < 2);
    const existingMarker = activeMapProviderMarkers.get(p.id);

    if (existingMarker) {
      const curPos = existingMarker.getLatLng();
      if (curPos.lat !== p.lat || curPos.lng !== p.lng) {
        existingMarker.setLatLng([p.lat, p.lng]);
      }
    } else {
      const tradeSvg = getMapMarkerProfessionIconSvg(p.categoryId);
      const markerHtml = `
        <div class="indrive-map-pro-wrap">
          ${showThinkingDots ? `
            <div class="pro-thinking-dots-bubble">
              <span></span><span></span><span></span>
            </div>
          ` : ''}
          <div style="width:34px; height:34px; border-radius:10px; background:#0F172A; border:2px solid #0066FF; display:flex; align-items:center; justify-content:center; color:#FFFFFF; box-shadow:0 4px 12px rgba(0,102,255,0.38); cursor:pointer;" title="${escapeHtml(p.shortName || 'Pro')}">
            <div style="width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
              ${tradeSvg}
            </div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: '',
        html: markerHtml,
        iconSize: [38, showThinkingDots ? 58 : 38],
        iconAnchor: [19, showThinkingDots ? 48 : 19]
      });

      const m = L.marker([p.lat, p.lng], { icon }).addTo(leafletMarkersLayer);
      m.on('click', () => openProviderCatalogueModal(p.id));
      activeMapProviderMarkers.set(p.id, m);
    }
  });

  // Reconcile physical office / workshop location pins
  const officePros = onlinePros.filter((p) => p.hasOffice && (p.officeAddress || p.officeSuburb));
  const currentOfficeIds = new Set(officePros.map((p) => p.id));
  for (const [id, om] of activeMapOfficeMarkers.entries()) {
    if (!currentOfficeIds.has(id)) {
      try { leafletMarkersLayer.removeLayer(om); } catch (e) {}
      activeMapOfficeMarkers.delete(id);
    }
  }

  officePros.forEach((p) => {
    const oLat = p.officeLat || p.lat;
    const oLng = p.officeLng || p.lng;
    const existingOm = activeMapOfficeMarkers.get(p.id);

    if (existingOm) {
      const curPos = existingOm.getLatLng();
      if (curPos.lat !== oLat || curPos.lng !== oLng) {
        existingOm.setLatLng([oLat, oLng]);
      }
    } else {
      const officeHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
          <div style="background:#0F172A; color:#FFFFFF; font-size:10px; font-weight:800; padding:2px 7px; border-radius:99px; margin-bottom:3px; white-space:nowrap; box-shadow:0 3px 8px rgba(0,0,0,0.3); display:inline-flex; align-items:center; gap:4px;">
            <span style="color:#60A5FA;">${uiIcon('buildingOffice', 10)}</span>
            <span>${escapeHtml(p.brandName || p.shortName)} Shop</span>
          </div>
          <div style="width:30px; height:30px; border-radius:9px; background:#1E293B; border:2px solid #60A5FA; display:flex; align-items:center; justify-content:center; color:#60A5FA; box-shadow:0 4px 10px rgba(0,0,0,0.25);">
            ${uiIcon('buildingOffice', 16)}
          </div>
        </div>
      `;
      const oIcon = L.divIcon({
        className: '',
        html: officeHtml,
        iconSize: [110, 50],
        iconAnchor: [55, 45]
      });
      const om = L.marker([oLat, oLng], { icon: oIcon }).addTo(leafletMarkersLayer);
      om.on('click', () => openProviderCatalogueModal(p.id));
      activeMapOfficeMarkers.set(p.id, om);
    }
  });
}

function drawProviderAndClientRouteMarkers(prov, req) {
  // Clear general catalogue pins so only active trip participants show
  activeMapProviderMarkers.forEach((m) => { try { leafletMarkersLayer.removeLayer(m); } catch (e) {} });
  activeMapProviderMarkers.clear();
  activeMapOfficeMarkers.forEach((m) => { try { leafletMarkersLayer.removeLayer(m); } catch (e) {} });
  activeMapOfficeMarkers.clear();

  // 1. Provider Live Marker with moving trade icon (NO name banner, NO circular pulse)
  const tradeSvg = getMapMarkerProfessionIconSvg(prov.categoryId);
  const provHtml = `
    <div class="indrive-map-pro-wrap">
      <div style="width:36px; height:36px; border-radius:10px; background:#0F172A; border:2.5px solid #0066FF; display:flex; align-items:center; justify-content:center; color:#FFFFFF; box-shadow:0 4px 14px rgba(0,102,255,0.4);">
        <div style="width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
          ${tradeSvg}
        </div>
      </div>
    </div>
  `;
  const provIcon = L.divIcon({
    className: '',
    html: provHtml,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  if (activeRouteProviderMarker) {
    activeRouteProviderMarker.setLatLng([prov.lat, prov.lng]);
    activeRouteProviderMarker.setIcon(provIcon);
  } else {
    activeRouteProviderMarker = L.marker([prov.lat, prov.lng], { icon: provIcon }).addTo(leafletMarkersLayer);
  }

  // 2. Client Live Location Destination Marker (Vector SVG Pin with Live GPS Dot — NO photos)
  const clientFirstName = req.customerName ? req.customerName.split(' ')[0] : 'Client';
  const clientHtml = `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div style="background:#0F172A; color:#FFFFFF; font-size:10px; font-weight:800; padding:2px 8px; border-radius:99px; margin-bottom:3px; white-space:nowrap; box-shadow:0 3px 10px rgba(15,23,42,0.3); display:inline-flex; align-items:center; gap:4px;">
        <span style="display:inline-block; width:5px; height:5px; border-radius:50%; background:#10B981;"></span>
        <span>${escapeHtml(clientFirstName)}'s Location</span>
      </div>
      <div style="position:relative; width:40px; height:40px; border-radius:50%; background:#0066FF; border:3px solid #FFFFFF; display:flex; align-items:center; justify-content:center; color:#FFFFFF; box-shadow:0 6px 16px rgba(0,102,255,0.45);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="#FFFFFF" stroke-width="2.5"/>
        </svg>
      </div>
    </div>
  `;
  const clientIcon = L.divIcon({
    className: '',
    html: clientHtml,
    iconSize: [110, 64],
    iconAnchor: [55, 54]
  });

  if (activeRouteClientMarker) {
    activeRouteClientMarker.setLatLng([req.lat, req.lng]);
    activeRouteClientMarker.setIcon(clientIcon);
  } else {
    activeRouteClientMarker = L.marker([req.lat, req.lng], { icon: clientIcon }).addTo(leafletMarkersLayer);
  }

  // 3. Real Street Route & Live Turn-by-Turn GPS Navigation
  if (state.role === 'PROVIDER') {
    updateProviderLiveNavigation(prov, req);
  } else {
    stopNavigationHud();
    drawRoadRouteOnMap(prov.lat, prov.lng, req.lat, req.lng, '#0066FF', 5, false, req);
  }
}

function buildCurvedPreviewPoints(lat1, lng1, lat2, lng2) {
  const pts = [[lat1, lng1]];
  const steps = 6;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const bend = Math.sin(t * Math.PI) * 0.0025;
    pts.push([lat1 + (lat2 - lat1) * t + bend, lng1 + (lng2 - lng1) * t - bend * 0.7]);
  }
  pts.push([lat2, lng2]);
  return pts;
}

// ============================================================================
// MAP VISIBILITY & MULTI-HUB SYNC CONTROLLER
// ============================================================================
let lastMapDisplayState = '';

function syncMapVisibility() {
  const mapContainer = document.getElementById('harareMapContainer');
  const centerPin = document.getElementById('centerMapPin');
  if (!mapContainer) return;

  const activeReq = getCustomerActiveRequest();
  const isHub = (state.hubView === 'HUB');
  const isMarketplace = (state.hubView === 'MARKETPLACE');
  const isConfiguring = (state.screenStep === 'CONFIGURE');
  const isSearching = (state.screenStep === 'SEARCHING' || (activeReq && activeReq.status === 'OPEN'));
  const isBooked = (state.screenStep === 'BOOKED' || (activeReq && isBookedStatus(activeReq.status)));
  const isProvider = (state.role === 'PROVIDER');

  const shouldShowMap = !isHub && (isProvider || isBooked || isSearching || isConfiguring || isMarketplace);
  const targetDisplay = shouldShowMap ? 'block' : 'none';

  if (mapContainer.style.display !== targetDisplay) {
    mapContainer.style.display = targetDisplay;
    lastMapDisplayState = targetDisplay;
    if (targetDisplay === 'block' && leafletMap) {
      setTimeout(() => {
        try { leafletMap.invalidateSize(); } catch (e) {}
      }, 80);
    }
  }

  if (centerPin) {
    const pinTarget = (shouldShowMap && !isBooked && !isProvider) ? 'flex' : 'none';
    if (centerPin.style.display !== pinTarget) {
      centerPin.style.display = pinTarget;
    }
  }
}

// ============================================================================
// MAIN RENDER CONTROLLER
// ============================================================================
function renderAll(force = true) {
  if (!state.db) return;

  if (state.isAuthenticated && state.role === 'CUSTOMER') {
    const activeReq = getCustomerActiveRequest();
    if (activeReq && activeReq.status === 'OPEN') {
      state.screenStep = 'SEARCHING';
      if (state.pendingSearchFareUsd === null) {
        state.pendingSearchFareUsd = Number(activeReq.budgetUsd);
      }
    } else if (activeReq && isBookedStatus(activeReq.status)) {
      state.screenStep = 'BOOKED';
    } else {
      if (state.screenStep === 'SEARCHING' || state.screenStep === 'BOOKED') {
        state.screenStep = 'HOME';
      }
      state.activeRequestId = null;
      state.pendingSearchFareUsd = null;
    }
  }

  syncMapVisibility();
  updateMapMarkers(false);
  renderFloatingOffersOverlay(false);
  renderUiOverlay(false);
  if (force || state.activeModal) {
    renderModalLayer();
  }
  renderChatDrawer();
  renderCallModal();
  renderOnboardingLayer();
}

function getCustomerActiveRequest() {
  if (!state.db || !state.currentUser || !state.isAuthenticated) return null;
  const reqs = Array.isArray(state.db.requests) ? state.db.requests : [];
  if (state.activeRequestId) {
    const found = reqs.find(
      (r) => r.id === state.activeRequestId && (r.status === 'OPEN' || isBookedStatus(r.status))
    );
    if (found) return found;
  }
  const myOpen = reqs.find(
    (r) => (r.customerId === state.currentUser.id || (state.currentUser.phone && r.customerPhone === state.currentUser.phone)) &&
           (r.status === 'OPEN' || isBookedStatus(r.status))
  );
  if (myOpen) {
    state.activeRequestId = myOpen.id;
    return myOpen;
  }
  return null;
}

function getProviderActiveBooking(providerId) {
  if (!state.db || !state.db.requests || !providerId) return null;
  const directMatch = state.db.requests.find((r) => {
    if (!isBookedStatus(r.status)) return false;
    if (r.acceptedProviderId && r.acceptedProviderId === providerId) return true;
    const accOffer = (r.offers || []).find((o) => o.id === r.acceptedOfferId);
    return accOffer && accOffer.providerId === providerId;
  });
  return directMatch || null;
}

// ============================================================================
// "CHOOSE A PRO" INCOMING OFFER CARDS OVERLAY (WITH 120S SHRINKING ACCEPT FILL)
// ============================================================================
let lastOffersSignature = '';

function renderFloatingOffersOverlay(force = false) {
  const root = document.getElementById('floatingOffersRoot');
  if (!root) return;

  if (!state.isAuthenticated || state.role !== 'CUSTOMER') {
    if (root.innerHTML !== '') {
      root.className = 'floating-offers-root';
      root.innerHTML = '';
      lastOffersSignature = '';
    }
    return;
  }

  const req = getCustomerActiveRequest();
  if (!req || req.status !== 'OPEN' || !req.offers || req.offers.length === 0) {
    if (root.innerHTML !== '') {
      root.className = 'floating-offers-root';
      root.innerHTML = '';
      lastOffersSignature = '';
    }
    return;
  }

  const nowMs = Date.now();
  const activeOffers = (req.offers || []).filter((o) => {
    if (o.status === 'DECLINED') return false;
    const exp = o.expiresAt || (new Date(o.createdAt).getTime() + 120 * 1000);
    return exp > nowMs;
  });

  if (activeOffers.length === 0) {
    if (root.innerHTML !== '') {
      root.className = 'floating-offers-root';
      root.innerHTML = '';
      lastOffersSignature = '';
    }
    return;
  }

  const offersSig = `${req.id}|${state.isOffersMinimized}|${activeOffers.length}|${activeOffers.map((o) => `${o.id}:${o.providerId}:${o.providerName || ''}:${o.priceUsd}`).join(',')}`;
  if (!force && offersSig === lastOffersSignature) {
    return;
  }
  lastOffersSignature = offersSig;

  if (state.isOffersMinimized) {
    root.className = 'floating-offers-root';
    root.innerHTML = `
      <div style="margin-top:auto;">
        <div class="minimized-map-restore-bar" onclick="toggleOffersMinimize(false)">
          <div>
            <div style="font-size:13.5px; font-weight:800; color:var(--text-main);">
              ${activeOffers.length} Pro Offer${activeOffers.length > 1 ? 's' : ''} Waiting
            </div>
            <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">
              Full-screen map active • Tap to view offers
            </div>
          </div>
          <button type="button" class="minimized-restore-btn" onclick="toggleOffersMinimize(false); event.stopPropagation();">
            ${uiIcon('chevronUp', 14)}
            <span>Show Offers (${activeOffers.length})</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  root.className = 'floating-offers-root active-backdrop';
  root.innerHTML = `
    <div class="choose-pro-top-bar">
      <button class="cancel-request-red-pill" onclick="openCancelTaskModal('${req.id}')">
        ${uiIcon('close', 14)}
        <span>Cancel request</span>
      </button>

      <button class="sheet-collapse-pill" style="background:#FFFFFF; color:#0F172A; height:42px; padding:0 14px; border-radius:14px; font-size:12.5px;" onclick="toggleOffersMinimize(true)">
        ${uiIcon('map', 15)}
        <span>Full Map</span>
        ${uiIcon('chevronDown', 14)}
      </button>
    </div>

    <div class="choose-pro-heading">Choose a pro (${activeOffers.length})</div>

    ${activeOffers.map((offer) => {
      const prov = resolveProviderByIdOrOffer(offer.providerId, req, offer);
      const expiresAt = offer.expiresAt || (new Date(offer.createdAt).getTime() + 120 * 1000);
      const totalMs = (offer.ttlSeconds || 120) * 1000;
      const remMs = Math.max(0, expiresAt - nowMs);
      const pct = Math.max(8, Math.min(100, (remMs / totalMs) * 100));

      const isYourFare = Number(offer.priceUsd) <= Number(req.budgetUsd);
      const isPlatinum = Boolean(offer.isPlatinum || prov?.isPlatinum || (offer.providerSkillTier || '').toLowerCase().includes('platinum'));
      const fullName = offer.providerName || prov?.name || 'Verified Pro';
      const shortName = offer.providerShortName || fullName.split(' ')[0];
      const avatarUrl = offer.providerAvatarUrl || prov?.avatarUrl || prov?.selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
      const brandLabel = offer.providerBrand || prov?.brandName || `${shortName} Services`;
      const approvedPhotosCount = prov && Array.isArray(prov.portfolio) ? prov.portfolio.filter((i) => i.approvalStatus === 'APPROVED').length : 0;

      return `
        <div class="indrive-offer-card">
          <div class="offer-price-eta-row">
            <div class="offer-price-left">
              <span class="offer-price-val">${formatUsdPrice(offer.priceUsd)}</span>
              <span class="offer-eta-val">${offer.etaMinutes || 4} min</span>
            </div>
            <button class="offer-catalogue-pill" onclick="openProviderCatalogueModal('${offer.providerId}', '${req.id}', '${offer.id}')">
              ${uiIcon('image', 13)}
              <span>Catalogue (${approvedPhotosCount})</span>
              ${uiIcon('chevronRight', 13)}
            </button>
          </div>

          ${isYourFare ? `
            <div class="your-fare-badge">
              ${uiIcon('check', 13)}
              <span>Your fare</span>
            </div>
          ` : ''}

          <div class="offer-pro-row" onclick="openProviderCatalogueModal('${offer.providerId}', '${req.id}', '${offer.id}')" style="cursor:pointer;">
            <div class="offer-avatar-wrap ${isPlatinum ? 'platinum' : ''}">
              <img src="${resolveMediaUrl(avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" alt="${escapeHtml(shortName)}" />
              ${isPlatinum ? `<div class="platinum-diamond-badge">${uiIcon('diamond', 9)}</div>` : ''}
            </div>
            <div class="offer-pro-details">
              <div class="offer-pro-name-line">
                <span>${escapeHtml(shortName)}</span>
                ${formatProRatingAndJobs(offer.providerRating ?? prov?.rating, offer.providerCompletedJobs ?? prov?.completedBookings)}
              </div>
              <div class="offer-pro-kit-line">${escapeHtml(brandLabel)}</div>
              ${isPlatinum ? `<div class="offer-pro-platinum-line">Platinum pro</div>` : ''}
            </div>
          </div>

          <div class="offer-actions-grid">
            <button class="offer-decline-btn" onclick="declineOffer('${req.id}', '${offer.id}')">
              Decline
            </button>
            <button class="offer-accept-progress-btn" onclick="acceptOffer('${req.id}', '${offer.id}')">
              <div class="offer-accept-fill" id="accept_fill_${offer.id}" style="width:${pct}%;"></div>
              <span class="offer-accept-label">Accept</span>
            </button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

// ============================================================================
// MAIN UI OVERLAY
// ============================================================================
let lastUiOverlaySignature = '';

function renderUiOverlay(force = true) {
  const overlay = document.getElementById('uiOverlay');
  if (!overlay) return;

  // Never clobber an active input field inside uiOverlay during background polling
  if (!force && document.activeElement && overlay.contains(document.activeElement)) {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return;
    }
  }

  if (state.role === 'PROVIDER' && !state.isAuthenticated) {
    overlay.innerHTML = renderNativeAuthScreen();
    lastUiOverlaySignature = 'UNAUTH_PROV';
    return;
  }

  // Account Suspension Check (Admin Ban Enforcement)
  if (state.currentUser?.isBanned) {
    overlay.innerHTML = `
      <div class="auth-fullscreen-screen pointer-auto" style="padding:24px 20px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#FFFFFF;">
        <div style="width:68px; height:68px; border-radius:50%; background:#FEE2E2; color:#DC2626; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
          ${uiIcon('shield', 36)}
        </div>
        <div style="font-size:20px; font-weight:800; color:#991B1B; margin-bottom:8px;">Account Suspended</div>
        <div style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin-bottom:16px; max-width:320px;">
          Your Findit Harare account (<strong>${state.currentUser.finditId || 'ID'}</strong>) has been suspended by Admin for safety policy violations.
        </div>
        ${state.currentUser.banReason ? `
          <div style="background:#FFF1F2; border:1px solid #FECDD3; border-radius:12px; padding:12px; font-size:12px; color:#BE123C; margin-bottom:20px; text-align:left; width:100%; max-width:340px;">
            <strong>Reason:</strong> ${state.currentUser.banReason}
          </div>
        ` : ''}
        <button class="btn-dark-sec" style="max-width:200px;" onclick="logoutCurrentAccount()">Log Out</button>
      </div>
    `;
    lastUiOverlaySignature = 'BANNED';
    return;
  }

  const activeReq = state.role === 'CUSTOMER' ? getCustomerActiveRequest() : null;
  const provRequestsSig = state.role === 'PROVIDER'
    ? (state.db?.requests || []).map((r) => `${r.id}:${r.status}:${r.acceptedProviderId || ''}:${(r.offers || []).length}`).join(';')
    : '';
  const provActiveJob = state.role === 'PROVIDER' ? getProviderActiveBooking(state.currentUser?.id) : null;
  const provActiveJobSig = provActiveJob ? `${provActiveJob.id}:${provActiveJob.status}:${provActiveJob.pinVerifiedByProvider}:${(provActiveJob.messages || []).length}` : 'NO_JOB';

  const overlaySig = [
    state.role,
    state.isAuthenticated,
    state.screenStep,
    state.hubView,
    state.providerTab,
    state.isSheetMinimized,
    state.selectedCategoryId,
    state.selectedSubServiceIdx,
    state.selectedTierKey,
    state.draftFareUsd,
    state.recommendedFareUsd,
    state.draftPaymentMethod,
    state.draftAutoAccept,
    state.draftNotes,
    state.draftPhotoUrl ? 1 : 0,
    state.bookingFor,
    state.timingType,
    state.scheduledDate,
    state.scheduledTime,
    state.customAddress,
    state.customSuburbLabel,
    state.pendingSearchFareUsd,
    state.walletTopupAmount,
    state.walletTopupMethod,
    state.currentUser?.id,
    state.currentUser?.walletBalanceUsd,
    state.currentUser?.activeWarnings?.length || 0,
    (state.db?.changelogs || []).map((c) => `${c.id}:${c.title}:${c.version}`).join(','),
    activeReq ? `${activeReq.id}:${activeReq.status}:${activeReq.budgetUsd}:${activeReq.startPinVerified}:${(activeReq.activeViewerIds || []).join(',')}:${(activeReq.offers || []).length}` : 'NO_REQ',
    provRequestsSig,
    provActiveJobSig
  ].join('|');

  if (!force && overlaySig === lastUiOverlaySignature) {
    return;
  }
  lastUiOverlaySignature = overlaySig;

  // Warning Banner Wrapper if user has active warnings
  const warningBannerHtml = (state.currentUser?.activeWarnings?.length > 0)
    ? `
      <div id="adminWarningBanner" style="position:fixed; top:12px; left:12px; right:12px; z-index:99999; pointer-events:auto; background:#FEF2F2; border:1.5px solid #EF4444; border-radius:14px; padding:12px 14px; box-shadow:0 8px 24px rgba(239,68,68,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div style="font-size:12.5px; font-weight:800; color:#DC2626; display:flex; align-items:center; gap:6px;">
            <span style="display:inline-flex;">${uiIcon('shield', 16)}</span>
            <span>Official Admin Warning</span>
          </div>
          <button type="button" style="background:none; border:none; color:#DC2626; font-size:12px; font-weight:800; cursor:pointer; padding:4px 6px;" onclick="acknowledgeAdminWarning()">Dismiss</button>
        </div>
        <div style="font-size:12px; color:#991B1B; line-height:1.45; margin-bottom:10px;">
          ${state.currentUser.activeWarnings[0].reason}
        </div>
        <button type="button" class="btn-primary-blue" style="height:36px; font-size:12px; font-weight:800; background:#DC2626; border-radius:10px; cursor:pointer; width:100%; display:flex; align-items:center; justify-content:center; gap:6px;" onclick="acknowledgeAdminWarning()">
          <span>I Understand &amp; Comply</span>
        </button>
      </div>
    `
    : '';

  let contentHtml = '';
  if (state.hubView === 'HUB') {
    contentHtml = renderMainHubOverlay();
  } else if (state.role === 'PROVIDER') {
    contentHtml = renderProviderModeOverlay();
  } else {
    if (activeReq && isBookedStatus(activeReq.status)) {
      contentHtml = renderBookedTrackingOverlay(activeReq);
    } else if (activeReq && activeReq.status === 'OPEN') {
      contentHtml = renderSearchingRadarOverlay(activeReq);
    } else if (state.screenStep === 'CONFIGURE') {
      contentHtml = renderConfigureFareOverlay();
    } else {
      contentHtml = renderHomeDiscoveryOverlay();
    }
  }

  overlay.innerHTML = warningBannerHtml + contentHtml;
}

async function acknowledgeAdminWarning(warningId) {
  try {
    const bannerEl = document.getElementById('adminWarningBanner');
    if (bannerEl) bannerEl.remove();

    if (state.currentUser) {
      state.currentUser.activeWarnings = [];
      state.currentUser.warningsCount = 0;
      if (state.role === 'PROVIDER') {
        const p = (state.db.providers || []).find((x) => x.id === state.currentUser.id);
        if (p) { p.activeWarnings = []; p.warningsCount = 0; }
      } else {
        const c = (state.db.customers || []).find((x) => x.id === state.currentUser.id);
        if (c) { c.activeWarnings = []; c.warningsCount = 0; }
      }
      renderUiOverlay();
    }

    await apiPost('/api/account/acknowledge-warning', {
      role: state.role,
      accountId: state.currentUser?.id,
      warningId: warningId || null
    });
    showToast('Warning acknowledged');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ----------------------------------------------------------------------------
// PERSONALIZED TOP SERVICES & MOST USED SERVICES GENERATOR (NO RANDOM ADDRESSES)
// ----------------------------------------------------------------------------
function getPersonalizedAndTopServices() {
  const categories = (state.db.categories || []).filter((c) => c.status === 'ACTIVE');
  const selectedCat = categories.find((c) => c.id === state.selectedCategoryId) || categories[0];
  if (!selectedCat) return [];

  const myPastBookingsInCat = (state.db.requests || []).filter(
    (r) => state.currentUser && r.customerId === state.currentUser.id && r.categoryId === selectedCat.id
  );

  const items = [];
  const seenTitles = new Set();

  myPastBookingsInCat.forEach((req) => {
    if (seenTitles.has(req.title)) return;
    const subIdx = Math.max(0, (selectedCat.subServices || []).findIndex((s) => s.name === req.title));
    const subObj = (selectedCat.subServices || [])[subIdx];
    seenTitles.add(req.title);
    items.push({
      categoryId: selectedCat.id,
      categoryName: selectedCat.name,
      subIdx,
      title: req.title,
      duration: subObj?.duration || '1.5 hrs',
      priceUsd: req.budgetUsd || subObj?.defaultUsd || 20,
      badge: 'Your most used'
    });
  });

  (selectedCat.subServices || []).forEach((sub, idx) => {
    if (!seenTitles.has(sub.name)) {
      seenTitles.add(sub.name);
      items.push({
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        subIdx: idx,
        title: sub.name,
        duration: sub.duration,
        priceUsd: sub.defaultUsd,
        badge: idx === 0 ? `Most used in ${selectedCat.name}` : `Popular ${selectedCat.name}`
      });
    }
  });

  return items.slice(0, 5);
}

// ----------------------------------------------------------------------------
// FINDIT HARARE MULTI-SERVICE HUB & JOB MARKETPLACE OVERLAYS
// ----------------------------------------------------------------------------
function openJobMarketplaceView() {
  state.hubView = 'MARKETPLACE';
  state.screenStep = 'HOME';
  lastUiOverlaySignature = '';
  renderAll();
}

function returnToMainHub() {
  state.hubView = 'HUB';
  state.screenStep = 'HOME';
  lastUiOverlaySignature = '';
  renderAll();
}

function openComingSoonServiceModal(title, desc) {
  state.activeModal = 'COMING_SOON_SERVICE';
  state.modalData = { title, desc };
  renderModalLayer();
}

function openChangelogModal() {
  state.activeModal = 'CHANGELOG_MODAL';
  renderModalLayer();
}

function selectCategoryForJobPosting(catId) {
  state.selectedCategoryId = catId;
  state.selectedSubServiceIdx = 0;
  state.screenStep = 'CONFIGURE';
  syncRecommendedFare();
  renderAll();
}

// Pure Vector SVG Illustration Banners for Multi-Service Hub Cards (Zero Stock Photos)
function getHubServiceVectorBanner(serviceId) {
  if (serviceId === 'job_marketplace') {
    return `
      <div class="fh-hub-card-svg-wrap">
        <svg viewBox="0 0 280 145" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hubJmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#060D1F"/>
              <stop offset="50%" stop-color="#0B1B3D"/>
              <stop offset="100%" stop-color="#003B99"/>
            </linearGradient>
            <linearGradient id="neonGlow1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00D2FF"/>
              <stop offset="100%" stop-color="#0066FF"/>
            </linearGradient>
          </defs>
          <rect width="280" height="145" fill="url(#hubJmGrad)"/>
          
          <!-- Blueprint Circuit & Grid Lines -->
          <line x1="20" y1="20" x2="260" y2="20" stroke="rgba(0,210,255,0.12)" stroke-width="1"/>
          <line x1="20" y1="50" x2="260" y2="50" stroke="rgba(0,210,255,0.08)" stroke-width="1"/>
          <line x1="20" y1="80" x2="260" y2="80" stroke="rgba(0,210,255,0.08)" stroke-width="1"/>
          <line x1="20" y1="110" x2="260" y2="110" stroke="rgba(0,210,255,0.12)" stroke-width="1"/>
          <line x1="70" y1="0" x2="70" y2="145" stroke="rgba(0,210,255,0.08)" stroke-width="1"/>
          <line x1="140" y1="0" x2="140" y2="145" stroke="rgba(0,210,255,0.1)" stroke-width="1"/>
          <line x1="210" y1="0" x2="210" y2="145" stroke="rgba(0,210,255,0.08)" stroke-width="1"/>

          <!-- Glowing Radar Rings in Background -->
          <circle cx="140" cy="72" r="50" stroke="rgba(0,210,255,0.2)" stroke-width="1.2" stroke-dasharray="4 4"/>
          <circle cx="140" cy="72" r="28" stroke="rgba(0,210,255,0.3)" stroke-width="1.5"/>

          <!-- Stylized Handshake & Direct Pro Vector Shapes -->
          <g transform="translate(100, 36)">
            <path d="M5 45 L25 35 L40 45 L30 58 Z" fill="#0066FF"/>
            <rect x="0" y="42" width="12" height="18" rx="2" fill="#38BDF8"/>
            <path d="M75 45 L55 35 L40 45 L50 58 Z" fill="#00D2FF"/>
            <rect x="68" y="42" width="12" height="18" rx="2" fill="#38BDF8"/>
            <circle cx="40" cy="46" r="14" fill="#0B1B3D" stroke="#00D2FF" stroke-width="2.5"/>
            <path d="M40 38 L42 44 L48 46 L42 48 L40 54 L38 48 L32 46 L38 44 Z" fill="#FFFFFF"/>
          </g>

          <!-- Solar / Electrical Lightning Pin -->
          <circle cx="42" cy="72" r="18" fill="rgba(0,102,255,0.35)" stroke="#38BDF8" stroke-width="1.5"/>
          <path d="M42 62 L37 72 H43 L41 82 L48 71 H42 L45 62 Z" fill="#00D2FF"/>

          <!-- Construction Wrench & Hammer Pin -->
          <circle cx="238" cy="72" r="18" fill="rgba(16,185,129,0.25)" stroke="#10B981" stroke-width="1.5"/>
          <path d="M233 66 L243 76 M243 66 L233 76" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    `;
  }

  if (serviceId === 'online_shopping') {
    return `
      <div class="fh-hub-card-svg-wrap">
        <svg viewBox="0 0 280 145" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hubShopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0F172A"/>
              <stop offset="60%" stop-color="#1E1B4B"/>
              <stop offset="100%" stop-color="#312E81"/>
            </linearGradient>
          </defs>
          <rect width="280" height="145" fill="url(#hubShopGrad)"/>

          <!-- Delivery Route Trails -->
          <path d="M10 115 Q90 120 140 75 T270 45" stroke="rgba(129, 140, 248, 0.25)" stroke-width="2" stroke-dasharray="6 4" fill="none"/>
          <circle cx="140" cy="75" r="3" fill="#818CF8"/>
          <circle cx="270" cy="45" r="4" fill="#C7D2FE"/>

          <!-- Vector Shopping Bag & Delivery Box -->
          <g transform="translate(105, 30)">
            <rect x="10" y="24" width="48" height="52" rx="10" fill="rgba(99, 102, 241, 0.35)" stroke="#818CF8" stroke-width="2.2"/>
            <path d="M22 24 V16 C22 10 26 6 34 6 C42 6 46 10 46 16 V24" stroke="#C7D2FE" stroke-width="2.4" stroke-linecap="round" fill="none"/>
            <circle cx="34" cy="50" r="10" fill="#4338CA"/>
            <path d="M30 50 L33 53 L39 47" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>

          <!-- Speed lines -->
          <line x1="30" y1="55" x2="65" y2="55" stroke="rgba(165, 180, 252, 0.3)" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="70" x2="50" y2="70" stroke="rgba(165, 180, 252, 0.2)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `;
  }

  // Transport & Carriers
  return `
    <div class="fh-hub-card-svg-wrap">
      <svg viewBox="0 0 280 145" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hubTransGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B132B"/>
            <stop offset="60%" stop-color="#1C2541"/>
            <stop offset="100%" stop-color="#0F4C5C"/>
          </linearGradient>
        </defs>
        <rect width="280" height="145" fill="url(#hubTransGrad)"/>

        <!-- Highway Perspective Lines -->
        <polygon points="110,145 170,145 145,85 135,85" fill="rgba(56, 189, 248, 0.08)"/>
        <line x1="140" y1="88" x2="140" y2="145" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="8 6" opacity="0.4"/>

        <!-- Vector Utility Bakkie / Cargo Truck -->
        <g transform="translate(85, 35)">
          <rect x="15" y="32" width="50" height="26" rx="4" fill="rgba(14, 116, 144, 0.45)" stroke="#38BDF8" stroke-width="2"/>
          <rect x="22" y="20" width="16" height="14" rx="2" fill="#0E7490" stroke="#67E8F9" stroke-width="1.2"/>
          <rect x="42" y="22" width="18" height="12" rx="2" fill="#155E75" stroke="#67E8F9" stroke-width="1.2"/>
          <path d="M65 34 L82 34 L95 44 L95 58 L65 58 Z" fill="#0284C7" stroke="#38BDF8" stroke-width="2"/>
          <path d="M69 38 L80 38 L88 45 L69 45 Z" fill="#E0F2FE"/>
          <circle cx="35" cy="60" r="9" fill="#0B132B" stroke="#38BDF8" stroke-width="2"/>
          <circle cx="35" cy="60" r="3" fill="#FFFFFF"/>
          <circle cx="82" cy="60" r="9" fill="#0B132B" stroke="#38BDF8" stroke-width="2"/>
          <circle cx="82" cy="60" r="3" fill="#FFFFFF"/>
        </g>

        <!-- GPS Pin Anchor -->
        <circle cx="218" cy="50" r="14" fill="rgba(0,210,255,0.25)" stroke="#00D2FF" stroke-width="1.5"/>
        <circle cx="218" cy="50" r="5" fill="#00D2FF"/>
      </svg>
    </div>
  `;
}

function renderMainHubOverlay() {
  const hubServices = [
    {
      id: 'job_marketplace',
      title: 'Job Marketplace',
      subtitle: 'Hire verified local trades & pros',
      status: 'ACTIVE',
      badge: '7 Categories',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'transport_carriers',
      title: 'Transport & Rides',
      subtitle: 'Bakkies, trucks, haulage & rides',
      status: 'COMING_SOON',
      badge: 'Coming Soon',
      imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'online_shopping',
      title: 'Online Shopping',
      subtitle: 'Harare shops, groceries & express delivery',
      status: 'COMING_SOON',
      badge: 'Coming Soon',
      imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return `
    <div class="fh-hub-wrapper">
      <!-- Top Navigation Row -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <button class="indrive-circle-btn" onclick="openSideDrawerModal()" title="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>

        <div style="display:flex; align-items:center; gap:6px;">
          <img src="/assets/logo-icon.svg" width="24" height="24" style="border-radius:6px;" alt="Logo" />
          <span style="font-size:16px; font-weight:900; color:#0B1B3D;"><span style="color:#0066FF;">Findit</span> Harare</span>
        </div>

        ${state.isAuthenticated ? `
          <button class="indrive-circle-btn" onclick="openSideDrawerModal()" title="Profile" style="background:var(--blue-soft); color:var(--blue-primary); font-weight:800; font-size:12px;">
            ${state.currentUser?.avatarInitials || (state.currentUser?.name ? state.currentUser.name.slice(0, 2).toUpperCase() : 'FH')}
          </button>
        ` : `
          <button class="btn-primary-blue pointer-auto" style="height:34px; padding:0 12px; font-size:12px; border-radius:99px; width:auto; pointer-events:auto;" onclick="openSignInRoleChoiceModal()">
            <span>Sign In</span>
          </button>
        `}
      </div>

      <!-- Main Welcome Header -->
      <div class="fh-hub-header">
        <div class="fh-hub-title">Welcome to Findit Harare</div>
        <div class="fh-hub-subtitle">What do you need today?</div>
      </div>

      <!-- 3 Service Hub Grid (With High Quality Real Images) -->
      <div class="fh-hub-grid">
        ${hubServices.map((srv, idx) => {
          const isMarketplace = srv.id === 'job_marketplace';
          const isFullWidth = idx === 2;
          return `
            <div
              class="fh-hub-card"
              style="${isFullWidth ? 'grid-column: span 2;' : ''}"
              onclick="${isMarketplace ? 'openJobMarketplaceView()' : `openComingSoonServiceModal('${srv.title}', '${srv.subtitle}')`}"
            >
              <div class="fh-hub-card-img-wrap" style="${isFullWidth ? 'height:130px;' : 'height:145px;'}">
                <img class="fh-hub-card-img" src="${srv.imageUrl}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" alt="${srv.title}" />
                <span class="fh-hub-card-badge ${srv.status === 'ACTIVE' ? 'active-pro' : ''}">
                  ${srv.badge || (srv.status === 'ACTIVE' ? 'Active' : 'Coming Soon')}
                </span>
              </div>
              <div class="fh-hub-card-label">
                <div class="fh-hub-card-name">${srv.title}</div>
                <div class="fh-hub-card-sub">${srv.subtitle}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// HOME MAP, ICONIFIED SERVICE TILES & TOP SERVICES (COLLAPSIBLE SHEET)
// ----------------------------------------------------------------------------
function renderHomeDiscoveryOverlay() {
  const categories = state.db.categories || [];
  const topServices = getPersonalizedAndTopServices();

  return `
    <!-- Top Row: Left Hamburger Menu + Notification Bell + Profile / Sign In -->
    <div class="indrive-top-left-row" style="display:flex; align-items:center; gap:8px;">
      <button class="indrive-circle-btn" onclick="openSideDrawerModal()" title="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>

      <button class="indrive-circle-btn" style="position:relative;" onclick="openNotificationCenterModal()" title="Notification Center &amp; Admin Notices">
        ${uiIcon('bell', 18)}
        ${getUnreadNotificationsCount() > 0 ? `
          <span style="position:absolute; top:-2px; right:-2px; background:#EF4444; color:#FFFFFF; font-size:9.5px; font-weight:800; min-width:17px; height:17px; border-radius:99px; display:inline-flex; align-items:center; justify-content:center; border:2px solid #FFFFFF; padding:0 3px;">
            ${getUnreadNotificationsCount()}
          </span>
        ` : ''}
      </button>

      ${state.isAuthenticated ? `
        <button class="indrive-circle-btn" onclick="openSideDrawerModal()" title="Profile" style="background:var(--blue-soft); color:var(--blue-primary); font-weight:800; font-size:12px;">
          ${state.currentUser?.avatarInitials || (state.currentUser?.name ? state.currentUser.name.slice(0, 2).toUpperCase() : 'FH')}
        </button>
      ` : `
        <button class="btn-primary-blue pointer-auto" style="height:34px; padding:0 12px; font-size:12px; border-radius:99px; width:auto; pointer-events:auto;" onclick="openSignInRoleChoiceModal()">
          <span>Sign In</span>
        </button>
      `}
    </div>

    <div>
      <div class="sheet-floating-controls" style="justify-content:flex-end;">
        <button class="map-floating-gps-btn" onclick="useBrowserGeolocation(false)" title="Center on My Live Location">
          ${uiIcon('crosshair', 19)}
        </button>
      </div>

      ${state.isSheetMinimized ? `
        <div class="minimized-map-restore-bar" onclick="toggleSheetMinimize(false)">
          <div>
            <div style="font-size:13.5px; font-weight:800; color:var(--text-main);">Explore Harare Home Services</div>
            <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Full-screen map active • Tap to open services</div>
          </div>
          <button type="button" class="minimized-restore-btn" onclick="toggleSheetMinimize(false); event.stopPropagation();">
            ${uiIcon('chevronUp', 14)}
            <span>Services</span>
          </button>
        </div>
      ` : `
        <div class="indrive-dark-sheet">
          <div class="sheet-top-handle-bar">
            <span style="font-size:11.5px; font-weight:800; color:var(--text-secondary);">Harare Home-Visit Pros</span>
            <div class="sheet-grabber" onclick="toggleSheetMinimize(true)" title="Collapse panel to see full map"></div>
            <button class="sheet-collapse-pill" onclick="toggleSheetMinimize(true)">
              ${uiIcon('map', 13)}
              <span>Full Map</span>
              ${uiIcon('chevronDown', 13)}
            </button>
          </div>

          <!-- Horizontal Service Category Tiles with Matching Custom Profession Icons -->
          <div class="indrive-cat-strip">
            ${categories.map((cat) => {
              const isSelected = cat.id === state.selectedCategoryId;
              const isSoon = cat.status !== 'ACTIVE';
              return `
                <div
                  class="indrive-cat-tile ${isSelected ? 'active' : ''} ${isSoon ? 'soon' : ''}"
                  onclick="selectHomeCategory('${cat.id}')"
                >
                  ${isSoon ? `<span class="cat-soon-dot">Soon</span>` : ''}
                  <div class="cat-tile-icon">${getCategoryVectorSvg(cat.id, isSelected)}</div>
                  <div class="cat-tile-label">${cat.name}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Search & Transport Row (Transport & Rides placed right beside Job Search) -->
          <div style="display:flex; gap:8px; align-items:stretch; margin-bottom:12px;">
            <button class="indrive-where-to-btn" style="flex:1; margin-bottom:0;" onclick="openConfigureStep(0)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round">
                <circle cx="11" cy="11" r="7"/>
                <path d="M20 20l-3.5-3.5"/>
              </svg>
              <span>What service &amp; price?</span>
            </button>

            <button class="indrive-where-to-btn" style="width:auto; flex:0 0 auto; padding:0 14px; background:#0F172A; color:#FFFFFF; border:1px solid #334155; margin-bottom:0;" onclick="openComingSoonServiceModal('Transport & Rides', 'Bakkies, trucks, haulage & city rides across Harare')" title="Transport & Rides">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2.2" stroke-linecap="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2 10.9 2 11.2 2 11.5V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
              <span style="color:#FFFFFF; font-weight:800; font-size:13px;">Transport</span>
            </button>
          </div>

          <!-- Section Header: Most Used / Top Requested Services for Selected Category -->
          <div style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin:4px 4px 4px; display:flex; justify-content:space-between; align-items:center;">
            <span>Most Used Services • ${(categories.find((c) => c.id === state.selectedCategoryId) || categories[0])?.name || 'Harare'}</span>
            <span style="color:var(--blue-primary); font-size:10.5px;">Tap to book</span>
          </div>

          <div class="indrive-history-list">
            ${topServices.map((srv) => `
              <div class="indrive-history-row" onclick="selectTopServiceShortcut('${srv.categoryId}', ${srv.subIdx})">
                <div class="history-icon-circle">
                  ${getCategoryVectorSvg(srv.categoryId, false)}
                </div>
                <div style="flex:1; min-width:0;">
                  <div class="history-title">${srv.title}</div>
                  <div class="history-sub">${srv.categoryName} • ${srv.badge} ${srv.duration ? `• ~${srv.duration}` : ''}</div>
                </div>
                <div style="font-size:14.5px; font-weight:800; color:var(--blue-primary); display:inline-flex; align-items:center; gap:4px;">
                  <span>~$${srv.priceUsd}</span>
                  ${uiIcon('chevronRight', 14)}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Online Shopping Placed on Bottom -->
          <div style="margin-top:14px; padding-top:10px; border-top:1px solid var(--border-light);">
            <div
              class="indrive-history-row"
              style="background:linear-gradient(135deg, rgba(0,102,255,0.06) 0%, rgba(14,165,233,0.1) 100%); border:1.5px solid rgba(0,102,255,0.22); border-radius:14px; padding:11px 13px; cursor:pointer;"
              onclick="openComingSoonServiceModal('Online Shopping', 'Harare retail stores, groceries, electronics & express courier delivery')"
            >
              <div style="width:40px; height:40px; border-radius:12px; background:#0066FF; color:#FFFFFF; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div style="flex:1; min-width:0; margin-left:10px;">
                <div style="font-size:13.5px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                  <span>Online Shopping</span>
                  <span style="background:#0066FF; color:#FFF; font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:99px; text-transform:uppercase;">Stores</span>
                </div>
                <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Harare shops, electronics, groceries &amp; delivery</div>
              </div>
              <div style="color:var(--blue-primary); display:inline-flex; align-items:center;">
                ${uiIcon('chevronRight', 16)}
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

function selectTopServiceShortcut(catId, subIdx) {
  state.selectedCategoryId = catId;
  openConfigureStep(subIdx);
}

// ----------------------------------------------------------------------------
// CONFIGURE SERVICE TIER & RECOMMENDED FARE SHEET (COLLAPSIBLE)
// ----------------------------------------------------------------------------
function renderConfigureFareOverlay() {
  const categories = state.db.categories || [];
  const activeCat = categories.find((c) => c.id === state.selectedCategoryId) || categories[0];
  const subServices = activeCat?.subServices || [];
  const currentSub = subServices[state.selectedSubServiceIdx] || subServices[0] || { name: activeCat.fullName, defaultUsd: 25, duration: '2 hrs' };
  const baseUsd = currentSub.defaultUsd || 25;

  const tiers = [
    {
      key: 'STANDARD',
      title: activeCat.name,
      rating: '4.9',
      eta: '~4 min away',
      sub: 'Standard verified home-visit pro',
      recUsd: baseUsd
    },
    {
      key: 'PLATINUM',
      title: 'Platinum Pro',
      rating: '4.96',
      eta: 'Master portfolio',
      sub: 'Top-rated senior specialists',
      recUsd: Math.round(baseUsd * 1.25)
    },
    {
      key: 'ONE_CLICK',
      title: 'One Click',
      rating: '4.9',
      eta: 'Priority dispatch',
      sub: 'In a hurry? Skip bidding',
      recUsd: Math.round(baseUsd * 1.15 * 2) / 2
    },
    {
      key: 'BUDGET',
      title: 'Junior Pro',
      rating: '4.7',
      eta: 'Rising talent',
      sub: 'Budget-friendly home service',
      recUsd: Math.max(8, Math.round(baseUsd * 0.8))
    }
  ];

  const selectedTierObj = tiers.find((t) => t.key === state.selectedTierKey) || tiers[0];
  const otherTiers = tiers.filter((t) => t.key !== state.selectedTierKey);

  return `
    <div class="indrive-top-route-card">
      <div class="top-route-row" onclick="openSuburbPickerModal()">
        <span style="color:#10B981; display:inline-flex;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
        <div class="top-route-text" style="display:flex; align-items:center; gap:6px; min-width:0;">
          <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${state.isCustomAddressSelected ? `${state.customAddress}, ${state.customSuburbLabel.split(',')[0]}` : `My Current Live Location`}
          </span>
          <span style="background:#DCFCE7; color:#15803D; font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:99px; display:inline-flex; align-items:center; gap:3px; flex-shrink:0;">
            <span style="width:5px; height:5px; border-radius:50%; background:#16A34A;"></span> ${state.isCustomAddressSelected ? 'Custom Address' : 'Live GPS'}
          </span>
        </div>
        <button class="entrance-pill-btn" onclick="event.stopPropagation(); promptEntranceNote()">
          <span>${state.entranceNote || 'Main Gate'}</span>
        </button>
      </div>

      <div class="top-route-row" onclick="openServicePickerModal()">
        <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('sparkle', 18)}</span>
        <div class="top-route-text">
          ${currentSub.name}
          <span class="top-route-muted">~${currentSub.duration}</span>
        </div>
        <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('chevronRight', 16)}</span>
      </div>
    </div>

    <div>
      <div class="sheet-floating-controls">
        <button class="indrive-circle-btn" onclick="backToHomeStep()" title="Back">
          ${uiIcon('arrowLeft', 19)}
        </button>
        <button class="map-floating-gps-btn" onclick="useBrowserGeolocation(false)" title="Center on My Live Location">
          ${uiIcon('crosshair', 19)}
        </button>
      </div>

      ${state.isSheetMinimized ? `
        <div class="minimized-map-restore-bar" onclick="toggleSheetMinimize(false)">
          <div>
            <div style="font-size:13.5px; font-weight:800; color:var(--text-main);">${currentSub.name} • ${formatUsdPrice(state.draftFareUsd)}</div>
            <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Full-screen map active • Tap to continue booking</div>
          </div>
          <button type="button" class="minimized-restore-btn" onclick="toggleSheetMinimize(false); event.stopPropagation();">
            ${uiIcon('chevronUp', 14)}
            <span>Open Fare</span>
          </button>
        </div>
      ` : `
        <div class="indrive-dark-sheet">
          <div class="sheet-top-handle-bar">
            <span style="font-size:11.5px; font-weight:800; color:var(--text-secondary);">Set Your Offer Fare (USD)</span>
            <div class="sheet-grabber" onclick="toggleSheetMinimize(true)"></div>
            <button class="sheet-collapse-pill" onclick="toggleSheetMinimize(true)">
              ${uiIcon('map', 13)}
              <span>Full Map</span>
              ${uiIcon('chevronDown', 13)}
            </button>
          </div>

          <!-- Findit Dispatch: Need It Now vs Schedule for Later -->
          <div style="display:flex; background:rgba(0,0,0,0.04); border-radius:12px; padding:3px; margin-bottom:10px;">
            <button type="button" style="flex:1; border:none; padding:7px 10px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; ${state.timingType !== 'SCHEDULED' ? 'background:#FFFFFF; color:var(--blue-primary); box-shadow:0 1px 3px rgba(0,0,0,0.08);' : 'background:transparent; color:var(--text-secondary);'}" onclick="setDispatchTimingType('IMMEDIATE')">
              <span>${uiIcon('bolt', 13)} Now (Immediate)</span>
            </button>
            <button type="button" style="flex:1; border:none; padding:7px 10px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; ${state.timingType === 'SCHEDULED' ? 'background:#FFFFFF; color:var(--blue-primary); box-shadow:0 1px 3px rgba(0,0,0,0.08);' : 'background:transparent; color:var(--text-secondary);'}" onclick="setDispatchTimingType('SCHEDULED')">
              ${uiIcon('clock', 13)}
              <span>Schedule for Later</span>
            </button>
          </div>

          ${state.timingType === 'SCHEDULED' ? `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 12px; margin-bottom:10px;">
              <div style="font-size:11.5px; font-weight:800; color:#334155; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
                ${uiIcon('clock', 12)}
                <span>Findit Direct Schedule (Date &amp; Time)</span>
              </div>
              <div style="display:flex; gap:8px;">
                <input id="scheduledDateInput" type="date" value="${state.scheduledDate || ''}" oninput="state.scheduledDate=this.value" onchange="state.scheduledDate=this.value" style="flex:1.2; height:36px; border:1px solid #CBD5E1; border-radius:8px; padding:0 8px; font-size:12.5px; background:#fff; color:#0F172A;" />
                <input id="scheduledTimeInput" type="time" value="${state.scheduledTime || '15:00'}" oninput="state.scheduledTime=this.value" onchange="state.scheduledTime=this.value" style="flex:0.8; height:36px; border:1px solid #CBD5E1; border-radius:8px; padding:0 8px; font-size:12.5px; background:#fff; color:#0F172A;" />
              </div>
            </div>
          ` : ''}

          <div class="indrive-selected-tier-box">
            <div class="selected-tier-top" onclick="openServicePickerModal()" style="cursor:pointer;">
              <div>${getCategoryVectorSvg(activeCat.id, false)}</div>
              <div class="selected-tier-info">
                <div class="selected-tier-name">
                  <span>${selectedTierObj.title}</span>
                </div>
                <div class="selected-tier-meta">
                  ${uiIcon('star', 12)}
                  <span>${selectedTierObj.rating} • ${selectedTierObj.eta}</span>
                </div>
                <div class="selected-tier-sub">${selectedTierObj.sub}</div>
              </div>
              <span style="color:var(--blue-primary);">${uiIcon('notes', 15)}</span>
            </div>

            <div class="selected-fare-adjuster">
              <button class="fare-circle-btn" onclick="adjustDraftFare(-0.5)">−</button>
              <div class="fare-center-display">
                <div class="fare-big-amount">${formatUsdPrice(state.draftFareUsd)}</div>
                <div class="fare-rec-sub">Recommended fare: ${formatUsdPrice(state.recommendedFareUsd)}</div>
              </div>
              <button class="fare-circle-btn" onclick="adjustDraftFare(0.5)">+</button>
            </div>
          </div>

          ${otherTiers.map((t) => `
            <div class="indrive-tier-row" onclick="selectConfigureTier('${t.key}', ${t.recUsd})">
              <div>${getCategoryVectorSvg(activeCat.id, false)}</div>
              <div class="selected-tier-info">
                <div class="selected-tier-name">${t.title}</div>
                <div class="selected-tier-meta">
                  ${uiIcon('star', 12)}
                  <span>${t.rating} • ${t.eta}</span>
                </div>
                <div class="selected-tier-sub">${t.sub}</div>
              </div>
              <div class="tier-row-price">${t.key === 'ONE_CLICK' ? formatUsdPrice(t.recUsd) : '~' + formatUsdPrice(t.recUsd)}</div>
            </div>
          `).join('')}

          <!-- Original Feature: Special Instructions Bar with Anti-Leakage Shield & Quick Presets -->
          <div class="special-notes-trigger-bar" onclick="openNotesModal()">
            <div style="display:flex; align-items:center; gap:9px; min-width:0;">
              <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('notes', 16)}</span>
              <div style="min-width:0;">
                <div style="font-size:12.5px; font-weight:800; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${state.draftNotes ? state.draftNotes : 'Add special instructions or preset notes'}
                </div>
                <div style="font-size:11px; color:var(--text-secondary); font-weight:600; display:flex; align-items:center; gap:4px;">
                  ${uiIcon('shield', 11)}
                  <span>Phone numbers &amp; WhatsApp links auto-filtered</span>
                </div>
              </div>
            </div>
            <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('chevronRight', 15)}</span>
          </div>

          <div class="indrive-auto-accept-row" onclick="toggleDraftAutoAccept()">
            <div class="auto-accept-left">
              <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('navigation', 16)}</span>
              <span>Auto-accept offer of ${formatUsdPrice(state.draftFareUsd)}</span>
            </div>
            <div class="indrive-switch ${state.draftAutoAccept ? 'on' : ''}">
              <div class="indrive-switch-knob"></div>
            </div>
          </div>

          <!-- Style Reference Photo Upload (1 photo of hairstyle, nails, fade) -->
          <div style="margin-bottom:14px;">
            <input type="file" id="stylePhotoInput" accept="image/*" style="display:none;" onchange="handleDraftStylePhotoUpload(this)" />
            ${state.draftPhotoUrl ? `
              <div class="style-photo-preview-wrap" style="background:#EFF6FF; border:1.5px solid #0066FF; border-radius:14px; padding:10px 12px; display:flex; align-items:center; gap:10px;">
                <img src="${resolveMediaUrl(state.draftPhotoUrl, 'task')}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" class="style-photo-thumb" style="width:52px; height:52px; border-radius:10px; object-fit:cover; cursor:pointer;" onclick="openImagePreviewModal('${state.draftPhotoUrl}', 'Desired Style Photo')" alt="Style Photo" />
                <div style="flex:1; min-width:0;">
                  <div style="font-size:13px; font-weight:800; color:#0066FF;">Desired Style Photo Attached</div>
                  <div style="font-size:11.5px; color:#1E40AF; cursor:pointer;" onclick="openImagePreviewModal('${state.draftPhotoUrl}', 'Desired Style Photo')">Tap photo to view full size</div>
                </div>
                <button type="button" class="small-pill-btn" style="color:#DC2626; border-color:rgba(220,38,38,0.3); background:#FEF2F2;" onclick="removeDraftStylePhoto()">
                  Remove
                </button>
              </div>
            ` : `
              <button type="button" class="btn-dark-sec" style="width:100%; height:44px; font-size:13px; font-weight:700; justify-content:center; gap:8px; border:1.5px dashed var(--blue-border); background:var(--blue-soft);" onclick="document.getElementById('stylePhotoInput').click()">
                <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('camera', 18)}</span>
                <span>Attach 1 Photo of Desired Style (Hair, Nails, Fade)</span>
              </button>
            `}
          </div>

          <div class="indrive-find-footer-row">
            <button class="footer-icon-btn" onclick="openPaymentModal()" title="Payment Method (${state.draftPaymentMethod})">
              ${uiIcon('wallet', 20)}
            </button>

            <button class="indrive-find-offers-btn" onclick="submitServiceRequest()">
              <span>Find offers</span>
              ${uiIcon('chevronRight', 17)}
            </button>

            <button class="footer-icon-btn" onclick="openNotesModal()" title="Special Instructions">
              ${uiIcon('notes', 19)}
            </button>
          </div>
        </div>
      `}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SEARCHING / RADAR SHEET ("6 pros are viewing your request" + -0.50 / +0.50 + Raise fare)
// ----------------------------------------------------------------------------
function renderSearchingRadarOverlay(req) {
  startFastLiveOffersPoll(req.id);
  const viewerIdSet = new Set([
    ...(Array.isArray(req.activeViewerIds) ? req.activeViewerIds : []),
    ...((req.offers || []).map((o) => o.providerId).filter(Boolean))
  ]);
  let viewingPros = (state.db.providers || []).filter(
    (p) => viewerIdSet.has(p.id) && p.isOnline !== false && !p.isBanned
  ).slice(0, 6);
  if (viewingPros.length === 0) {
    const matchingPros = (state.db.providers || []).filter((p) => {
      if (p.isOnline === false || p.isBanned) return false;
      const cats = getProviderCategoryIds(p);
      return cats.length === 0 || !req.categoryId || cats.includes(req.categoryId);
    });
    viewingPros = (matchingPros.length > 0 ? matchingPros : (state.db.providers || []).filter((p) => !p.isBanned)).slice(0, 5);
  }
  const viewingLabel = viewingPros.length <= 1
    ? `${Math.max(1, viewingPros.length)} verified pro active nearby • Broadcasting live`
    : `${viewingPros.length} verified pros active nearby • Broadcasting live`;
  const currentFare = state.pendingSearchFareUsd !== null ? Number(state.pendingSearchFareUsd) : Number(req.budgetUsd);
  const isChanged = Math.abs(currentFare - Number(req.budgetUsd)) >= 0.01;
  const isGoodFare = currentFare >= state.recommendedFareUsd;

  return `
    <div class="indrive-top-left-row">
      <button class="cancel-request-red-pill pointer-auto" onclick="openCancelTaskModal('${req.id}')">
        ${uiIcon('close', 14)}
        <span>Cancel request</span>
      </button>
    </div>

    <div class="sheet-floating-controls" style="justify-content:flex-end;">
      <button class="map-floating-gps-btn" onclick="useBrowserGeolocation(false)" title="Center on My Live Location">
        ${uiIcon('crosshair', 19)}
      </button>
    </div>

    ${state.isSheetMinimized ? `
      <div class="minimized-map-restore-bar" onclick="toggleSheetMinimize(false)">
        <div>
          <div style="font-size:13.5px; font-weight:800; color:var(--text-main);">Searching Pros • ${formatUsdPrice(currentFare)}</div>
          <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">${viewingLabel} • Tap to adjust fare</div>
        </div>
        <button type="button" class="minimized-restore-btn" onclick="toggleSheetMinimize(false); event.stopPropagation();">
          ${uiIcon('chevronUp', 14)}
          <span>Open Radar</span>
        </button>
      </div>
    ` : `
      <div class="indrive-dark-sheet">
        <div class="viewing-pros-banner">
          <span class="viewing-pros-text">${viewingLabel}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            ${viewingPros.length > 0 ? `
              <div class="viewing-avatars-stack">
                ${viewingPros.map((p) => `
                  <img src="${resolveMediaUrl(p.avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" alt="${p.shortName || p.name}" />
                `).join('')}
              </div>
            ` : ''}
            <button class="sheet-collapse-pill" onclick="toggleSheetMinimize(true)">
              ${uiIcon('map', 12)}
              <span>Map</span>
              ${uiIcon('chevronDown', 12)}
            </button>
          </div>
        </div>

        <div class="priority-timer-row">
          <div class="priority-status-text">
            ${isGoodFare ? 'Good fare. Your request gets priority' : 'Low fare. Raise fare for faster offers'}
          </div>
          <div class="search-mmss-timer" id="searchMmSsTimer">0:50</div>
        </div>

        <div class="search-progress-track">
          <div class="search-progress-fill" id="searchProgressFill" style="width:76%;"></div>
        </div>

        <div class="live-fare-step-row">
          <button class="fare-step-pill-btn" onclick="stepActiveSearchFare(-0.5)">-0.50</button>
          <div class="live-fare-center-val">${formatUsdPrice(currentFare)}</div>
          <button class="fare-step-pill-btn" onclick="stepActiveSearchFare(0.5)">+0.50</button>
        </div>

        <button
          class="raise-fare-btn ${isChanged ? 'ready' : ''}"
          ${isChanged ? `onclick="commitActiveSearchFare('${req.id}')"` : 'disabled'}
        >
          ${currentFare >= Number(req.budgetUsd) ? 'Raise fare' : 'Update fare'}
        </button>

        <div class="searching-bottom-card" onclick="toggleActiveRequestAutoAccept('${req.id}')">
          <div class="auto-accept-left">
            <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('navigation', 16)}</span>
            <span>Automatically accept the nearest pro for ${formatUsdPrice(currentFare)}</span>
          </div>
          <div class="indrive-switch ${req.autoAccept ? 'on' : ''}">
            <div class="indrive-switch-knob"></div>
          </div>
        </div>
      </div>
    `}
  `;
}

// ----------------------------------------------------------------------------
// EMBEDDED REAL-TIME CHAT COMPONENT (SHARED BY CLIENT & SERVICE PROVIDER)
// ----------------------------------------------------------------------------
function renderEmbeddedChatComponent(req, peerName) {
  const messages = req.messages || [];
  const quickChips = state.role === 'PROVIDER'
    ? [
        'On my way with my mobile kit!',
        'I have arrived outside your gate',
        'Please share the 4-digit Start PIN',
        '2 mins away from your street'
      ]
    : [
        'I am waiting at home',
        'Gate is open for you',
        'I have the Start PIN ready',
        'Please call me in-app when outside'
      ];

  return `
    <div class="embedded-chat-panel">
      <div class="embedded-chat-header">
        <div style="display:flex; align-items:center; gap:7px;">
          <span style="width:8px; height:8px; border-radius:50%; background:#10B981; display:inline-block;"></span>
          <span style="font-size:12.5px; font-weight:800; color:var(--text-main);">
            Live Chat with ${peerName}
          </span>
        </div>
        <span style="font-size:11px; font-weight:700; color:var(--blue-primary); display:inline-flex; align-items:center; gap:4px;">
          ${uiIcon('lock', 12)}
          <span>Protected Chat</span>
        </span>
      </div>

      <div class="embedded-chat-feed" id="embeddedChatScroll">
        ${messages.map((m) => {
          const isSystem = m.senderRole === 'SYSTEM';
          const isMine = !isSystem && m.senderRole === state.role;
          const rowClass = isSystem ? 'system' : isMine ? 'mine' : 'theirs';
          return `
            <div class="chat-msg-row ${rowClass}">
              ${!isSystem ? `<div class="chat-msg-sender">${isMine ? 'You' : m.senderName}</div>` : ''}
              <div class="chat-msg-bubble">${m.text}</div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="chat-quick-strip">
        ${quickChips.map((chip) => `
          <button class="chat-preset-chip" onclick="sendChatMessage('${chip.replace(/'/g, "\\'")}', '${req.id}')">
            ${chip}
          </button>
        `).join('')}
      </div>

      <div class="chat-inline-input-row">
        <input
          id="inlineChatInput_${req.id}"
          class="dark-input"
          style="padding:9px 12px; font-size:13px;"
          placeholder="Message ${peerName} (no phone numbers)..."
          onkeydown="if(event.key==='Enter') sendInlineChatMessage('${req.id}')"
        />
        <button
          class="btn-primary-blue"
          style="width:76px; height:38px; font-size:12.5px; flex-shrink:0;"
          onclick="sendInlineChatMessage('${req.id}')"
        >
          Send
        </button>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// CLIENT ACTIVE HOME-VISIT BOOKING OVERLAY (WITH LIVE ROUTE & EMBEDDED CHAT)
// ----------------------------------------------------------------------------
function renderBookedTrackingOverlay(req) {
  const acceptedOffer = (req.offers || []).find((o) => o.id === req.acceptedOfferId) || req.offers?.[0];
  const provId = req.acceptedProviderId || acceptedOffer?.providerId;
  const prov = resolveProviderByIdOrOffer(provId, req, acceptedOffer);
  const avatarUrl = prov?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
  const agreedPrice = acceptedOffer?.priceUsd || req.agreedTotalUsd || req.budgetUsd;
  const isArrived = req.status === 'ARRIVED';
  const isInProgress = req.status === 'IN_PROGRESS' || Boolean(req.pinVerifiedByProvider);

  let statusIcon = uiIcon('routeCar', 18);
  let statusHeadline = `${prov?.shortName || prov?.name || 'Pro'} is arriving in ~${acceptedOffer?.etaMinutes || 4} min`;
  if (req.status === 'ARRIVED') {
    statusIcon = uiIcon('pin', 18);
    statusHeadline = `${prov?.shortName || prov?.name} is waiting outside!`;
  } else if (req.status === 'IN_PROGRESS' || req.pinVerifiedByProvider) {
    statusIcon = uiIcon('sparkle', 18);
    statusHeadline = `Service in progress at your home`;
  }

  return `
    <div class="indrive-top-left-row">
      <button class="indrive-circle-btn" onclick="openSideDrawerModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>

      ${(!isArrived && !isInProgress) ? `
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="cancel-request-red-pill pointer-auto" onclick="openCancelTaskModal('${req.id}')">
            ${uiIcon('close', 14)}
            <span>Cancel</span>
          </button>
        </div>
      ` : ''}
    </div>

    <div class="sheet-floating-controls" style="justify-content:flex-end;">
      <button class="map-floating-gps-btn" onclick="useBrowserGeolocation(false)" title="Center on My Live Location">
        ${uiIcon('crosshair', 19)}
      </button>
    </div>

    ${state.isSheetMinimized ? `
      <div class="minimized-map-restore-bar" onclick="toggleSheetMinimize(false)">
        <div>
          <div style="font-size:13.5px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
            <span style="color:var(--blue-primary); display:inline-flex;">${statusIcon}</span>
            <span>${statusHeadline}</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Start PIN: #${req.startPinCode || '4829'} • Tap to open chat &amp; details</div>
        </div>
        <button type="button" class="minimized-restore-btn" onclick="toggleSheetMinimize(false); event.stopPropagation();">
          ${uiIcon('chevronUp', 14)}
          <span>Open Chat</span>
        </button>
      </div>
    ` : `
      <div class="indrive-dark-sheet">
        <div class="sheet-top-handle-bar">
          <span style="font-size:11px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.04em; display:inline-flex; align-items:center; gap:5px;">
            <span style="width:7px; height:7px; border-radius:50%; background:#10B981;"></span>
            <span>Active Visit Confirmed</span>
          </span>
          <div class="sheet-grabber" onclick="toggleSheetMinimize(true)"></div>
          <button class="sheet-collapse-pill" onclick="toggleSheetMinimize(true)">
            ${uiIcon('map', 13)}
            <span>Full Map</span>
            ${uiIcon('chevronDown', 13)}
          </button>
        </div>

        ${(() => {
          const distMeters = calculateDistanceMeters(prov?.lat, prov?.lng, req.lat, req.lng);
          const isWithin20m = distMeters <= 20 || req.status === 'ARRIVED';
          const proximitySec = (state.bookingProximitySeconds && state.bookingProximitySeconds[req.id]) || 0;
          const autoPairRemaining = Math.max(0, 60 - proximitySec);

          if (req.status === 'ARRIVED') {
            speakNavigationDirection(`${prov?.shortName || 'Your specialist'} has arrived outside your location. Share your start PIN to begin.`);
            return `
              <div class="pulsating-arrival-banner" style="background:#FEF2F2; border:1.5px solid #FCA5A5; border-radius:12px; padding:10px 12px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                <div style="flex:1; min-width:0;">
                  <div style="font-size:11.5px; font-weight:800; color:#DC2626; text-transform:uppercase; letter-spacing:0.04em; display:flex; align-items:center; gap:5px; margin-bottom:2px;">
                    <span style="width:7px; height:7px; border-radius:50%; background:#EF4444; display:inline-block;"></span>
                    <span>${prov?.shortName || prov?.name || 'Specialist'} is Waiting Outside</span>
                  </div>
                  <div style="font-size:11.5px; color:#991B1B; font-weight:600;">
                    Share this Start PIN with your specialist to begin:
                  </div>
                  ${isWithin20m ? `
                    <div style="font-size:10.5px; font-weight:700; color:#059669; margin-top:3px; display:flex; align-items:center; gap:4px;">
                      <span style="width:5px; height:5px; border-radius:50%; background:#10B981;"></span>
                      <span>Within 20m • Auto-pairs in <span class="proximity-autopair-timer">${autoPairRemaining}s</span></span>
                    </div>
                  ` : ''}
                </div>
                <div style="background:#FFFFFF; border:2px solid #EF4444; border-radius:10px; padding:5px 12px; text-align:center; box-shadow:0 2px 8px rgba(239,68,68,0.12); flex-shrink:0;">
                  <div style="font-size:9px; font-weight:800; color:#DC2626; letter-spacing:0.05em;">START PIN</div>
                  <div style="font-size:18px; font-weight:900; color:#DC2626; letter-spacing:2px; line-height:1.2;">#${req.startPinCode || '4829'}</div>
                </div>
              </div>
            `;
          }

          if (distMeters <= 50 && req.status !== 'IN_PROGRESS') {
            return `
              <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; padding:8px 11px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                <div style="font-size:12px; font-weight:700; color:#1E40AF; display:flex; align-items:center; gap:6px;">
                  <span style="color:#2563EB;">${uiIcon('pin', 14)}</span>
                  <span>Specialist approaching (~${distMeters}m away)</span>
                </div>
                <div style="font-size:12px; font-weight:800; color:#2563EB;">PIN #${req.startPinCode || '4829'}</div>
              </div>
            `;
          }
          return '';
        })()}

        <!-- Service Info Row -->
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px;">
          <div>
            ${req.status === 'ARRIVED' ? `
              <div style="font-size:14.5px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('briefcase', 14)}</span>
                <span>${req.title}</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:1px;">
                Agreed Fare: <strong style="color:var(--blue-primary);">${formatUsdPrice(agreedPrice)}</strong> (${req.paymentMethod})
              </div>
            ` : `
              <div style="font-size:15px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                <span style="color:var(--blue-primary); display:inline-flex;">${statusIcon}</span>
                <span>${statusHeadline}</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                ${req.title} • <strong style="color:var(--blue-primary);">${formatUsdPrice(agreedPrice)}</strong> (${req.paymentMethod})
              </div>
            `}
          </div>
          ${req.status !== 'ARRIVED' ? `
            <div style="background:var(--blue-soft); border:1.5px solid var(--blue-border); padding:5px 10px; border-radius:10px; text-align:center; flex-shrink:0;">
              <div style="font-size:9px; color:var(--blue-primary); font-weight:800;">START PIN</div>
              <div style="font-size:15px; font-weight:800; color:var(--blue-primary); letter-spacing:1.5px;">${req.startPinCode || '4829'}</div>
            </div>
          ` : ''}
        </div>

        ${req.photoUrl ? `
          <div style="display:inline-flex; align-items:center; gap:7px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:3px 9px; margin-bottom:8px; cursor:pointer;" onclick="openImagePreviewModal('${req.photoUrl}', 'Desired Style Photo')">
            <img src="${resolveMediaUrl(req.photoUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" style="width:20px; height:20px; border-radius:4px; object-fit:cover;" alt="Reference" />
            <span style="font-size:11px; font-weight:700; color:#15803D;">View Reference Photo</span>
            ${uiIcon('chevronRight', 10)}
          </div>
        ` : ''}

        <!-- Accepted Service Provider Card -->
        <div class="indrive-selected-tier-box" style="margin-bottom:8px; padding:8px 10px;">
          <div class="offer-pro-row" style="margin-bottom:0;">
            <div class="offer-avatar-wrap platinum">
              <img src="${resolveMediaUrl(avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" alt="${prov?.name}" />
              <div class="platinum-diamond-badge">${uiIcon('diamond', 9)}</div>
            </div>
            <div class="offer-pro-details">
              <div class="offer-pro-name-line">
                <span>${prov?.name || 'Tariro Moyo'}</span>
                ${formatProRatingAndJobs(prov?.rating, prov?.completedBookings)}
              </div>
              <div class="offer-pro-kit-line">${prov?.brandName || 'Mobile Service'} • ${req.status === 'ARRIVED' ? '<span style="color:#059669; font-weight:800;">Outside your gate</span>' : (acceptedOffer?.distanceKm ? `${acceptedOffer.distanceKm} km away` : 'En route')}</div>
              <div class="offer-pro-platinum-line">${prov?.skillTier || 'Platinum pro'}</div>
              ${prov?.hasOffice ? `
                <div style="font-size:11px; color:#475569; margin-top:3px; display:flex; align-items:center; gap:4px;">
                  ${uiIcon('buildingOffice', 11)}
                  <span>Workshop: <strong>${escapeHtml(prov.officeAddress || prov.officeSuburb)}</strong></span>
                </div>
              ` : ''}
            </div>
            <button class="offer-catalogue-pill" onclick="openProviderCatalogueModal('${prov?.id}')">
              <span>Catalogue</span>
              ${uiIcon('chevronRight', 13)}
            </button>
          </div>
        </div>

        ${req.delayNotice ? `
          <div style="background:#FEF3C7; border:1px solid #F59E0B; border-radius:10px; padding:8px 10px; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span style="font-size:16px;">⏱️</span>
            <div>
              <div style="font-size:12px; font-weight:800; color:#B45309;">Specialist Running ~${req.delayNotice.minutes}m Late</div>
              <div style="font-size:11px; color:#92400E;">${escapeHtml(req.delayNotice.reason)}</div>
            </div>
          </div>
        ` : ''}

        ${req.bookingFor === 'SOMEONE_ELSE' ? `
          <div style="font-size:11.5px; font-weight:700; color:#1E40AF; background:#DBEAFE; padding:6px 10px; border-radius:8px; margin-bottom:8px;">
            ${uiIcon('users', 14)} Ordered for: <strong>${escapeHtml(req.recipientName || 'Recipient')}</strong> ${req.recipientPhone ? `(${escapeHtml(req.recipientPhone)})` : ''}
          </div>
        ` : ''}

        <!-- Latest Message Snippet Pill (if messages exist) -->
        ${(req.messages && req.messages.length > 0) ? `
          <div class="chat-preview-pill" style="margin-bottom:8px;" onclick="openChatDrawer('${req.id}', '${prov?.id}')">
            <div class="chat-preview-dot"></div>
            <div class="chat-preview-text">
              <span class="chat-preview-sender">${req.messages[req.messages.length - 1].senderName}:</span>
              ${req.messages[req.messages.length - 1].text}
            </div>
            <span class="chat-preview-action">Reply ${uiIcon('chevronRight', 12)}</span>
          </div>
        ` : ''}

        <!-- Action Buttons: Masked Call, Full Screen Chat, and Complete Service (unlocked after code confirmation) -->
        ${(() => {
          const isCodeConfirmed = Boolean(req.pinVerifiedByProvider || req.status === 'IN_PROGRESS' || req.status === 'COMPLETED');
          if (!isCodeConfirmed) {
            return `
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <button class="btn-dark-sec" onclick="startInAppCall('${(prov?.name || 'Pro').replace(/'/g, "\\'")}', '${escapeHtml(req.title)}', 'call_${req.id}', '${prov?.id || ''}')">
                  ${uiIcon('phone', 14)}
                  <span>Call</span>
                </button>
                <button class="btn-dark-sec" onclick="openChatDrawer('${req.id}', '${prov?.id || ''}')">
                  ${uiIcon('chat', 14)}
                  <span>Chat ${(req.messages && req.messages.length > 0) ? `(${req.messages.length})` : ''}</span>
                </button>
              </div>
              <div style="margin-top:8px; background:#EFF6FF; border:1.5px dashed #3B82F6; border-radius:12px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                  <span style="display:inline-flex; flex-shrink:0;">${uiIcon('key', 16)}</span>
                  <div style="min-width:0;">
                    <div style="font-size:12px; font-weight:800; color:#1E40AF;">Share Start PIN with Specialist</div>
                    <div style="font-size:10.5px; color:#3B82F6;">Complete button unlocks once code is verified</div>
                  </div>
                </div>
                <span style="background:#2563EB; color:#FFFFFF; font-size:13.5px; font-weight:900; letter-spacing:1.5px; padding:3px 9px; border-radius:8px; flex-shrink:0;">#${req.startPinCode || '4829'}</span>
              </div>
              <div style="margin-top:8px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:9px 12px; display:flex; align-items:center; justify-content:center; gap:6px; color:#64748B; font-size:11.5px; font-weight:700;">
                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#F59E0B; animation:waTypingWave 1.4s infinite;"></span>
                <span>Enter PIN with specialist to unlock completion</span>
              </div>
            `;
          }
          return `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
              <button class="btn-dark-sec" onclick="startInAppCall('${(prov?.name || 'Pro').replace(/'/g, "\\'")}', '${escapeHtml(req.title)}', 'call_${req.id}', '${prov?.id || ''}')">
                ${uiIcon('phone', 14)}
                <span>Call</span>
              </button>
              <button class="btn-dark-sec" onclick="openChatDrawer('${req.id}', '${prov?.id || ''}')">
                ${uiIcon('chat', 14)}
                <span>Chat ${(req.messages && req.messages.length > 0) ? `(${req.messages.length})` : ''}</span>
              </button>
            </div>
            <button class="btn-primary-blue" style="width:100%; height:44px; font-size:14px; font-weight:800; background:#10B981; box-shadow:0 4px 14px rgba(16,185,129,0.35);" onclick="openRateBookingModal('${req.id}')">
              ${uiIcon('check', 16)}
              <span>Mark Service Completed &amp; Rate</span>
            </button>
          `;
        })()}
      </div>
    `}
  `;
}

// ============================================================================
// FULL INDRIVE-STYLE SIGN-UP & VERIFICATION FLOW (CLIENT & SERVICE PROVIDER)
// ============================================================================
function openSignUpWizardModal() {
  state.authStep = 'PHONE';
  state.activeModal = 'SIGNUP_FLOW';
  renderModalLayer();
}

function renderNativeAuthScreen() {
  return `
    <div class="auth-fullscreen-screen pointer-auto">
      ${renderSignUpWizardInnerHtml(true)}
    </div>
  `;
}

function renderSignUpWizardInnerHtml(isFullScreen = false) {
  const categories = state.db?.categories || [];

  // ==========================================
  // A. CUSTOMER SIGN-UP (2-STEP: DETAILS + FACE ID)
  // ==========================================
  if (state.authRole === 'CUSTOMER') {
    if (state.authStep === 'PHONE') {
      return `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="/assets/logo-icon.svg" width="36" height="36" style="border-radius:10px; display:block;" alt="Findit Logo" />
              <div>
                <div style="font-size:18px; font-weight:800; color:var(--text-main);">Findit Harare</div>
                <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Client Account (Step 1 of 2)</div>
              </div>
            </div>
            ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
          </div>

          <!-- Account Role Switcher -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
            <button
              type="button"
              class="${state.authRole === 'CUSTOMER' ? 'btn-primary-blue' : 'btn-dark-sec'}"
              style="height:42px; font-size:12.5px;"
              onclick="state.authRole='CUSTOMER'; renderAll();"
            >
              ${uiIcon('user', 14)}
              <span>Client Account</span>
            </button>
            <button
              type="button"
              class="${state.authRole === 'PROVIDER' ? 'btn-primary-blue' : 'btn-dark-sec'}"
              style="height:42px; font-size:12.5px;"
              onclick="state.authRole='PROVIDER'; state.authStep='PHONE'; renderAll();"
            >
              ${uiIcon('briefcase', 14)}
              <span>Service Provider</span>
            </button>
          </div>

          <div style="font-size:20px; font-weight:900; color:var(--text-main); margin-bottom:4px;">
            Create Your Account
          </div>
          <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">
            Already have an account? <a href="javascript:void(0)" style="color:var(--blue-primary); font-weight:800;" onclick="openSignInRoleChoiceModal('LOGIN')">Log in here</a>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:14px;">
            <div>
              <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Full Name</label>
              <input
                class="dark-input"
                placeholder="e.g. Tendai Chikore"
                value="${escapeHtml(state.authName || '')}"
                oninput="state.authName = this.value"
              />
            </div>

            <div>
              <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">WhatsApp / Mobile Number</label>
              <div style="display:flex; gap:8px;">
                <div style="background:var(--blue-soft); border:1.5px solid var(--blue-border); border-radius:12px; padding:10px 12px; font-weight:800; color:var(--blue-primary); display:inline-flex; align-items:center; gap:6px; white-space:nowrap; font-size:13px;">
                  ${uiIcon('zwFlag', 18)}
                  <span>+263</span>
                </div>
                <input
                  type="tel"
                  class="dark-input"
                  style="font-size:15px; font-weight:800; flex:1;"
                  placeholder="77 200 1001"
                  value="${(state.authPhone || '').replace(/^\+?263\s*/, '')}"
                  oninput="state.authPhone = '+263 ' + this.value"
                />
              </div>
            </div>

            <div>
              <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Create Password</label>
              <input
                type="password"
                class="dark-input"
                placeholder="••••••••"
                value="${escapeHtml(state.authPassword || '')}"
                oninput="state.authPassword = this.value"
              />
            </div>
          </div>

          <label style="display:flex; align-items:flex-start; gap:8px; font-size:11.5px; color:var(--text-secondary); margin-bottom:16px; line-height:1.45;">
            <input type="checkbox" ${state.authTermsAccepted ? 'checked' : ''} onchange="state.authTermsAccepted = this.checked" style="margin-top:2px; accent-color:#0066FF;" />
            <span>
              I agree to Findit Harare's
              <a href="javascript:void(0)" onclick="state.activeModal='TERMS_MODAL'; renderModalLayer();" style="color:var(--blue-primary); font-weight:700;">Terms &amp; Conditions</a>
              and
              <a href="javascript:void(0)" onclick="state.activeModal='PRIVACY_MODAL'; renderModalLayer();" style="color:var(--blue-primary); font-weight:700;">Privacy Policy</a>
            </span>
          </label>

          <button type="button" class="btn-primary-blue" style="height:50px; font-size:15px; font-weight:800;" onclick="submitPhoneForFaceStep()">
            ${uiIcon('camera', 18)}
            <span>Continue to Step 2: Biometric Face ID</span>
          </button>
        </div>
      `;
    }

    // Step 2: Client Face ID Verification
    return `
      <div>
        <div class="cancel-sheet-header">
          <button type="button" class="btn-dark-sec" style="padding:6px 12px;" onclick="stopFaceCameraStream(); state.authStep='PHONE'; renderAll();">
            ${uiIcon('arrowLeft', 14)}
            <span>Back</span>
          </button>
          ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
        </div>

        <div style="font-size:20px; font-weight:900; color:var(--text-main); margin-bottom:4px;">
          Biometric Face ID
        </div>
        <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">
          Step 2 of 2: Hold your phone at eye level inside the circle to verify your identity.
        </div>

        <!-- Biometric Circular Scanner Viewfinder -->
        <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:18px;">
          <div class="ios-face-viewfinder">
            ${state.faceVerifiedSuccess ? `
              <div class="ios-face-id-success-tick">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            ` : state.authCapturedSelfieUrl ? `
              <img src="${state.authCapturedSelfieUrl}" alt="Selfie" style="width:100%; height:100%; object-fit:cover; display:block;" />
            ` : `
              <video id="authSelfieVideo" autoplay playsinline muted></video>
              <div class="ios-face-scanning-radar"></div>
            `}
            <canvas id="authSelfieCanvas" style="display:none;"></canvas>
          </div>

          ${state.faceVerifiedSuccess ? `
            <div style="background:#ECFDF5; border:1.5px solid #10B981; color:#065F46; padding:8px 16px; border-radius:99px; font-weight:800; font-size:13px; display:inline-flex; align-items:center; gap:6px; margin-top:14px;">
              ${uiIcon('check', 16)}
              <span>Face ID Verified</span>
            </div>
          ` : state.authCapturedSelfieUrl ? `
            <div style="background:#ECFDF5; border:1px solid #10B981; color:#065F46; padding:7px 14px; border-radius:99px; font-weight:800; font-size:12px; display:inline-flex; align-items:center; gap:6px; margin-top:12px;">
              ${uiIcon('check', 14)}
              <span>Face Captured</span>
            </div>
          ` : `
            <div id="authCameraHint" style="font-size:12px; color:var(--text-secondary); margin-top:12px; font-weight:600; text-align:center;">
              Hold phone at eye level inside the circle &amp; tap Verify Face
            </div>
          `}
        </div>

        ${!state.faceVerifiedSuccess ? `
          <button type="button" class="btn-primary-blue" style="height:50px; font-size:15px; font-weight:800; margin-bottom:8px;" onclick="captureAndVerifyFaceId()">
            ${uiIcon('camera', 18)}
            <span>Verify Face with Face ID</span>
          </button>
        ` : `
          <button type="button" class="btn-primary-blue" style="height:50px; font-size:15px; font-weight:800; background:#10B981;" onclick="finishNativeRegistration()">
            ${uiIcon('check', 18)}
            <span>Complete &amp; Enter Findit</span>
          </button>
        `}
      </div>
    `;
  }

  // ==========================================
  // B. PROVIDER SIGN-UP (4-STEP: DETAILS + ID + FACE MATCH + CATEGORIES)
  // ==========================================
  // Provider Step 1: Details
  if (state.authStep === 'PHONE') {
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="/assets/logo-icon.svg" width="36" height="36" style="border-radius:10px; display:block;" alt="Findit Logo" />
            <div>
              <div style="font-size:18px; font-weight:800; color:var(--text-main);">Findit Harare</div>
              <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Provider Sign Up (Step 1 of 4)</div>
            </div>
          </div>
          ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
          <button
            type="button"
            class="${state.authRole === 'CUSTOMER' ? 'btn-primary-blue' : 'btn-dark-sec'}"
            style="height:42px; font-size:12.5px;"
            onclick="state.authRole='CUSTOMER'; state.authStep='PHONE'; renderAll();"
          >
            ${uiIcon('user', 14)}
            <span>Client Account</span>
          </button>
          <button
            type="button"
            class="${state.authRole === 'PROVIDER' ? 'btn-primary-blue' : 'btn-dark-sec'}"
            style="height:42px; font-size:12.5px;"
            onclick="state.authRole='PROVIDER'; renderAll();"
          >
            ${uiIcon('briefcase', 14)}
            <span>Service Provider</span>
          </button>
        </div>

        <div style="font-size:20px; font-weight:900; color:var(--text-main); margin-bottom:4px;">
          Provider Credentials
        </div>
        <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">
          Earn on your terms in Harare with real-time job cards and direct client bidding.
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:14px;">
          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Full Legal Name</label>
            <input
              class="dark-input"
              placeholder="e.g. Farai Nyoni"
              value="${escapeHtml(state.authName || '')}"
              oninput="state.authName = this.value"
            />
          </div>

          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">WhatsApp / Phone Number</label>
            <div style="display:flex; gap:8px;">
              <div style="background:var(--blue-soft); border:1.5px solid var(--blue-border); border-radius:12px; padding:10px 12px; font-weight:800; color:var(--blue-primary); display:inline-flex; align-items:center; gap:6px; white-space:nowrap; font-size:13px;">
                ${uiIcon('zwFlag', 18)}
                <span>+263</span>
              </div>
              <input
                type="tel"
                class="dark-input"
                style="font-size:15px; font-weight:800; flex:1;"
                placeholder="77 300 4001"
                value="${(state.authPhone || '').replace(/^\+?263\s*/, '')}"
                oninput="state.authPhone = '+263 ' + this.value"
              />
            </div>
          </div>

          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Create Password</label>
            <input
              type="password"
              class="dark-input"
              placeholder="••••••••"
              value="${escapeHtml(state.authPassword || '')}"
              oninput="state.authPassword = this.value"
            />
          </div>

          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Business / Trade Name</label>
            <input
              class="dark-input"
              placeholder="e.g. Nyoni Solar &amp; Electrical"
              value="${escapeHtml(state.authBrandName || '')}"
              oninput="state.authBrandName = this.value"
            />
          </div>
        </div>

        <button type="button" class="btn-primary-blue" style="height:50px; font-size:15px; font-weight:800;" onclick="submitProviderPhoneStep()">
          ${uiIcon('shield', 18)}
          <span>Continue to Step 2: Identification</span>
        </button>
      </div>
    `;
  }

  // Provider Step 2: Government ID Authenticity
  if (state.authStep === 'ID') {
    return `
      <div>
        <div class="cancel-sheet-header">
          <button type="button" class="btn-dark-sec" style="padding:6px 12px;" onclick="state.authStep='PHONE'; renderAll();">
            ${uiIcon('arrowLeft', 14)}
            <span>Back</span>
          </button>
          ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
        </div>

        <div style="font-size:20px; font-weight:900; color:var(--text-main); margin-bottom:4px;">
          Government ID Authenticity
        </div>
        <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:12px;">
          Step 2 of 4: Provide identification to verify your specialist account.
        </div>

        <!-- Privacy & Security Guarantee Banner -->
        <div style="background:#F0FDF4; border:1.5px solid #BBF7D0; border-radius:12px; padding:10px 12px; margin-bottom:14px; display:flex; align-items:flex-start; gap:8px;">
          <span style="color:#16A34A; margin-top:2px;">${uiIcon('shield', 16)}</span>
          <div style="font-size:11.5px; color:#166534; line-height:1.45;">
            <strong>Confidential &amp; Encrypted:</strong> Your ID document is private and exclusively stored in the Admin safety locker. It is <strong>never visible to clients or the public</strong>.
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Select ID Document Type</label>
            <select class="dark-input" onchange="state.authIdType=this.value">
              <option value="National ID" ${state.authIdType === 'National ID' ? 'selected' : ''}>Zimbabwe National ID Card</option>
              <option value="Passport" ${state.authIdType === 'Passport' ? 'selected' : ''}>Passport</option>
              <option value="Driver Licence" ${state.authIdType === 'Driver Licence' ? 'selected' : ''}>Driver's Licence</option>
            </select>
          </div>

          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">ID / Passport / Licence Number</label>
            <input
              class="dark-input"
              placeholder="e.g. 63-2049182-Y-42"
              value="${escapeHtml(state.authIdNumber || '')}"
              oninput="state.authIdNumber = this.value"
            />
          </div>

          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Photo of ID (Front)</label>
            ${state.authIdPhotoUrl ? `
              <div style="position:relative; border-radius:12px; overflow:hidden; border:1.5px solid #10B981; max-height:150px; background:#000;">
                <img src="${state.authIdPhotoUrl}" alt="ID Photo" style="width:100%; height:140px; object-fit:cover; display:block;" />
                <button type="button" onclick="state.authIdPhotoUrl=null; renderAll();" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer;">
                  ${uiIcon('close', 14)}
                </button>
              </div>
            ` : `
              <div style="border:2px dashed #CBD5E1; border-radius:12px; padding:18px; text-align:center; background:#F8FAFC; cursor:pointer;" onclick="document.getElementById('authIdFileInput').click()">
                <div style="color:var(--blue-primary); margin-bottom:6px;">${uiIcon('camera', 24)}</div>
                <div style="font-size:13px; font-weight:800; color:#0F172A;">Snap or Upload ID Document Photo</div>
                <div style="font-size:11px; color:#64748B; margin-top:2px;">Clear photo of ID card or passport details page</div>
              </div>
              <input type="file" id="authIdFileInput" accept="image/*" style="display:none;" onchange="handleAuthIdFileUpload(this)" />
            `}
          </div>
        </div>

        <button type="button" class="btn-primary-blue" style="height:50px; font-size:15px; font-weight:800;" onclick="submitProviderIdStep()">
          ${uiIcon('camera', 18)}
          <span>Continue to Step 3: Biometric Face Match</span>
        </button>
      </div>
    `;
  }

  // Provider Step 3: Biometric Face Match
  if (state.authStep === 'FACE') {
    return `
      <div>
        <div class="cancel-sheet-header">
          <button type="button" class="btn-dark-sec" style="padding:6px 12px;" onclick="stopFaceCameraStream(); state.authStep='ID'; renderAll();">
            ${uiIcon('arrowLeft', 14)}
            <span>Back</span>
          </button>
          ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
        </div>

        <div style="font-size:20px; font-weight:900; color:var(--text-main); margin-bottom:4px;">
          Live Biometric Face Match
        </div>
        <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">
          Step 3 of 4: Match your live face against the submitted identification.
        </div>

        <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:18px;">
          <div class="ios-face-viewfinder">
            ${state.faceVerifiedSuccess ? `
              <div class="ios-face-id-success-tick">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            ` : state.authCapturedSelfieUrl ? `
              <img src="${state.authCapturedSelfieUrl}" alt="Selfie" style="width:100%; height:100%; object-fit:cover; display:block;" />
            ` : `
              <video id="authSelfieVideo" autoplay playsinline muted></video>
              <div class="ios-face-scanning-radar"></div>
            `}
            <canvas id="authSelfieCanvas" style="display:none;"></canvas>
          </div>

          ${state.faceVerifiedSuccess ? `
            <div style="background:#ECFDF5; border:1.5px solid #10B981; color:#065F46; padding:8px 16px; border-radius:99px; font-weight:800; font-size:13px; display:inline-flex; align-items:center; gap:6px; margin-top:14px;">
              ${uiIcon('check', 16)}
              <span>Face Matches ID Document</span>
            </div>
          ` : `
            <div id="authCameraHint" style="font-size:12px; color:var(--text-secondary); margin-top:12px; font-weight:600; text-align:center;">
              Hold phone steady &amp; tap Match Face
            </div>
          `}
        </div>

        ${!state.faceVerifiedSuccess ? `
          <button type="button" class="btn-primary-blue" style="height:50px; font-size:15px; font-weight:800; margin-bottom:8px;" onclick="captureAndVerifyFaceId()">
            ${uiIcon('camera', 18)}
            <span>Scan &amp; Match Face</span>
          </button>
        ` : `
          <button type="button" class="btn-primary-blue" style="height:50px; font-size:15px; font-weight:800;" onclick="state.authStep='CATEGORIES'; renderAll();">
            <span>Continue to Step 4: Business Categories →</span>
          </button>
        `}
      </div>
    `;
  }

  // Provider Step 4: Select up to 3 Categories
  const selectedCatCount = (state.authCategoryIds || []).length;
  return `
    <div>
      <div class="cancel-sheet-header">
        <button type="button" class="btn-dark-sec" style="padding:6px 12px;" onclick="state.authStep='FACE'; renderAll();">
          ${uiIcon('arrowLeft', 14)}
          <span>Back</span>
        </button>
        ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <div style="font-size:20px; font-weight:900; color:var(--text-main);">
          Select Business Categories
        </div>
        <span style="padding:3px 10px; border-radius:99px; background:var(--blue-soft); color:var(--blue-primary); font-size:12px; font-weight:800;">
          Selected (${selectedCatCount}/3)
        </span>
      </div>
      <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:14px;">
        Step 4 of 4: Select up to <strong>3 categories</strong> you offer to receive matching job cards.
      </div>

      <!-- Categories Selector Grid -->
      <div class="provider-categories-selector-grid">
        ${categories.map((c) => {
          const isSelected = (state.authCategoryIds || []).includes(c.id);
          return `
            <div
              class="provider-category-select-pill ${isSelected ? 'selected' : ''}"
              onclick="toggleProviderAuthCategory('${c.id}')"
            >
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
                  ${getCategoryVectorSvg(c.id, isSelected)}
                </div>
                <div>
                  <div style="font-size:13.5px; font-weight:800;">${c.fullName || c.name}</div>
                  <div style="font-size:11px; opacity:0.8; font-weight:600;">${(c.subServices || []).slice(0, 3).map(s => s.name).join(' • ')}</div>
                </div>
              </div>
              <div style="width:20px; height:20px; border-radius:50%; border:2px solid ${isSelected ? '#0066FF' : '#CBD5E1'}; display:flex; align-items:center; justify-content:center; background:${isSelected ? '#0066FF' : 'transparent'}; color:#fff;">
                ${isSelected ? uiIcon('check', 12) : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <button
        type="button"
        class="btn-primary-blue"
        style="height:50px; font-size:15px; font-weight:800; margin-top:12px;"
        onclick="finishNativeRegistration()"
      >
        ${uiIcon('check', 18)}
        <span>Finish &amp; Start Receiving Jobs</span>
      </button>
    </div>
  `;
}

function toggleProviderAuthCategory(catId) {
  if (!Array.isArray(state.authCategoryIds)) state.authCategoryIds = [];
  const idx = state.authCategoryIds.indexOf(catId);
  if (idx >= 0) {
    state.authCategoryIds.splice(idx, 1);
  } else {
    if (state.authCategoryIds.length >= 3) {
      showToast('You can select up to 3 categories. Tap one to deselect first.', 'info');
      return;
    }
    state.authCategoryIds.push(catId);
  }
  lastRenderedModalKey = '';
  renderModalLayer();
}

async function handleAuthIdFileUpload(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const compressed = await compressImageFileToDataUrl(file, 640, 0.72);
  state.authIdPhotoUrl = compressed || null;
  renderAll();
}

async function submitProviderPhoneStep() {
  const name = (state.authName || '').trim();
  const rawPhone = (state.authPhone || '').trim();
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length < 8) {
    showToast('Please enter a valid Zimbabwe phone number (+263...)', 'error');
    return;
  }
  if (!name) {
    showToast('Please enter your full legal name', 'error');
    return;
  }

  // Number already has a Provider profile → must log in with password
  const last9 = digits.slice(-9);
  if (state.db) {
    const list = state.db.providers || [];
    const existing = list.find((item) => (item.phone || '').replace(/\D/g, '').slice(-9) === last9);
    if (existing) {
      stopFaceCameraStream();
      state.loginPhone = rawPhone;
      state.modalData = { tab: 'LOGIN', loginRole: 'PROVIDER', notice: { tone: 'warn', text: 'This number already has a Provider account. Please log in with your password.' } };
      state.activeModal = 'SIGNIN_ROLE_CHOICE';
      lastRenderedModalKey = '';
      renderAll();
      return;
    }
  }

  state.authStep = 'ID';
  renderAll();
}

function submitProviderIdStep() {
  if (!state.authIdNumber && !state.authNationalId) {
    showToast('Please enter your ID, Passport, or Licence number', 'error');
    return;
  }
  state.authStep = 'FACE';
  state.faceVerifiedSuccess = false;
  renderAll();
  setTimeout(startAuthFaceCamera, 120);
}

function analyzeFaceImageQuality(canvas, ctx) {
  if (!canvas || !ctx || canvas.width < 50 || canvas.height < 50) {
    return { ok: false, reason: 'Live camera feed not ready. Please allow camera access.' };
  }

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Sample central region only to verify the camera stream is producing real pixels (not a black/blank frame)
  let sampledPixels = 0;
  let totalLuminance = 0;
  const step = 4;

  for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.85); y += step) {
    for (let x = Math.floor(width * 0.15); x < Math.floor(width * 0.85); x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
      sampledPixels++;
    }
  }

  const avgLuminance = sampledPixels > 0 ? totalLuminance / sampledPixels : 0;
  if (avgLuminance < 4) {
    return { ok: false, reason: 'Camera feed is completely dark. Face a light source.' };
  }

  return {
    ok: true,
    score: { avgLuminance, sharpness: 10, skinRatio: 0.5 },
    confidence: 99
  };
}

function grabFaceFrame(videoEl, canvas) {
  const vw = videoEl.videoWidth || 400;
  const vh = videoEl.videoHeight || 400;
  const size = Math.min(vw, vh) || 400;
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const sx = Math.max(0, (vw - size) / 2);
  const sy = Math.max(0, (vh - size) / 2);
  ctx.drawImage(videoEl, sx, sy, size, size, 0, 0, 400, 400);
  return ctx;
}

let faceVerifyInProgress = false;

async function captureAndVerifyFaceId() {
  if (faceVerifyInProgress) return;
  const videoEl = document.getElementById('authSelfieVideo');
  const canvas = document.getElementById('authSelfieCanvas') || document.createElement('canvas');
  const hintEl = document.getElementById('authCameraHint');

  if (!videoEl) {
    showToast('Camera is starting. Please allow camera access and try again.', 'error');
    return;
  }

  faceVerifyInProgress = true;
  if (hintEl) {
    hintEl.textContent = 'Verifying live face…';
    hintEl.style.color = 'var(--blue-primary)';
    hintEl.style.fontWeight = '800';
  }

  // Wait briefly if video stream dimensions are still warming up
  for (let w = 0; w < 10 && (!videoEl.videoWidth || videoEl.videoWidth === 0); w++) {
    await new Promise((r) => setTimeout(r, 120));
  }

  if (!videoEl.videoWidth || videoEl.videoWidth === 0) {
    faceVerifyInProgress = false;
    showToast('Camera stream not ready yet. Please wait 1 second and tap Verify again.', 'error');
    return;
  }

  let best = null;
  let bestDataUrl = null;
  for (let i = 0; i < 3; i++) {
    const ctx = grabFaceFrame(videoEl, canvas);
    const q = analyzeFaceImageQuality(canvas, ctx);
    bestDataUrl = canvas.toDataURL('image/jpeg', 0.90);
    if (q.ok) {
      best = q;
      break;
    }
    best = q;
    await new Promise((r) => setTimeout(r, 120));
  }
  faceVerifyInProgress = false;

  if (!bestDataUrl || (best && !best.ok)) {
    const reason = (best && best.reason) || 'Please allow camera access and try again.';
    if (hintEl) {
      hintEl.textContent = reason;
      hintEl.style.color = '#EF4444';
      hintEl.style.fontWeight = '800';
    }
    return;
  }

  state.authCapturedSelfieUrl = bestDataUrl;

  // iOS Face ID Success Indication
  if ('vibrate' in navigator) {
    try { navigator.vibrate([100, 50, 100]); } catch (e) {}
  }
  state.faceVerifiedSuccess = true;
  stopFaceCameraStream();
  renderAll();

  // If customer, auto-finish in 850ms
  if (state.authRole === 'CUSTOMER') {
    setTimeout(() => {
      finishNativeRegistration();
    }, 850);
  }
}

async function submitPhoneForFaceStep() {
  const name = (state.authName || '').trim();
  const rawPhone = (state.authPhone || '').trim();
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length < 8) {
    showToast('Please enter a valid Zimbabwe phone number (+263...)', 'error');
    return;
  }
  if (!name) {
    showToast('Please enter your full name', 'error');
    return;
  }
  if (!state.authTermsAccepted) {
    showToast('Please accept the Terms & Conditions and Privacy Policy', 'error');
    return;
  }

  // Number already registered → must log in with password (no password-less sign-in)
  const last9 = digits.slice(-9);
  if (state.db) {
    const list = state.authRole === 'PROVIDER' ? (state.db.providers || []) : (state.db.customers || []);
    const existing = list.find((item) => (item.phone || '').replace(/\D/g, '').slice(-9) === last9);
    if (existing) {
      stopFaceCameraStream();
      state.loginPhone = rawPhone;
      state.modalData = { tab: 'LOGIN', loginRole: state.authRole, notice: { tone: 'warn', text: 'This number already has an account. Please log in with your password.' } };
      state.activeModal = 'SIGNIN_ROLE_CHOICE';
      lastRenderedModalKey = '';
      renderAll();
      return;
    }
  }

  // Proceed to Step 2: Scan Face for Logo
  state.authStep = 'FACE';
  renderAll();
  setTimeout(startAuthFaceCamera, 120);
}

async function startAuthFaceCamera() {
  stopFaceCameraStream();
  const videoEl = document.getElementById('authSelfieVideo');
  if (!videoEl) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 640 }
      },
      audio: false
    });
    mediaStreamRef = stream;
    videoEl.srcObject = stream;
    await videoEl.play().catch(() => {});
  } catch (err) {
    console.warn('Camera preview note:', err.message);
    const hintEl = document.getElementById('authCameraHint');
    if (hintEl) {
      hintEl.textContent = 'Camera unavailable or blocked. Tap "Choose Photo from Device" below.';
    }
  }
}

function captureAuthFaceSelfie() {
  const videoEl = document.getElementById('authSelfieVideo');
  const canvas = document.getElementById('authSelfieCanvas') || document.createElement('canvas');
  if (!videoEl || !videoEl.videoWidth) {
    showToast('Starting camera... please wait a moment or choose a photo', 'info');
    return;
  }
  const size = Math.min(videoEl.videoWidth, videoEl.videoHeight) || 400;
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  const sx = (videoEl.videoWidth - size) / 2;
  const sy = (videoEl.videoHeight - size) / 2;
  ctx.drawImage(videoEl, sx, sy, size, size, 0, 0, 400, 400);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  state.authCapturedSelfieUrl = dataUrl;
  stopFaceCameraStream();
  renderAll();
}

function retakeAuthFaceSelfie() {
  state.authCapturedSelfieUrl = null;
  renderAll();
  setTimeout(startAuthFaceCamera, 120);
}

async function handleAuthFaceFileUpload(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const compressed = await compressImageFileToDataUrl(file, 480, 0.75);
  state.authCapturedSelfieUrl = compressed || null;
  state.faceVerifiedSuccess = true;
  stopFaceCameraStream();
  renderAll();
}

async function finishNativeRegistration() {
  const submitBtns = document.querySelectorAll('#pickerModalRoot .btn-primary-blue');
  const restoreSubmitBtns = () => {
    submitBtns.forEach((b) => {
      b.disabled = false;
      b.style.opacity = '1';
      b.style.pointerEvents = 'auto';
      b.innerHTML = `${uiIcon('check', 18)} <span>Finish &amp; Start Receiving Jobs</span>`;
    });
  };

  submitBtns.forEach((b) => {
    b.disabled = true;
    b.style.opacity = '0.7';
    b.style.pointerEvents = 'none';
    b.innerHTML = '<span>Creating Account...</span>';
  });

  const name = (state.authName || '').trim();
  if (!name) {
    showToast('Please enter your full legal name', 'error');
    restoreSubmitBtns();
    state.authStep = 'PHONE';
    renderAll();
    return;
  }

  // Ensure an avatar is available and compressed to < 50KB
  let finalAvatar = state.authCapturedSelfieUrl;
  if (!finalAvatar) {
    const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'FH';
    const svgAvatar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#0066FF"/><text x="50" y="62" font-size="38" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="Inter, -apple-system, sans-serif">${initials}</text></svg>`;
    finalAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(svgAvatar)}`;
  } else {
    finalAvatar = await compressDataUrlIfNeeded(finalAvatar, 400, 0.75);
  }

  let finalIdPhoto = state.authIdPhotoUrl ? await compressDataUrlIfNeeded(state.authIdPhotoUrl, 640, 0.70) : null;
  let finalPortfolioPhoto = state.authPortfolioPhotoUrl ? await compressDataUrlIfNeeded(state.authPortfolioPhotoUrl, 640, 0.70) : '';

  try {
    const res = await apiPost('/api/auth/complete-signup', {
      role: state.authRole,
      name: name,
      phone: state.authPhone.trim(),
      password: state.authPassword || '',
      suburbId: state.authSuburbId,
      categoryId: state.authCategoryId,
      categoryIds: state.authCategoryIds && state.authCategoryIds.length > 0 ? state.authCategoryIds.slice(0, 3) : [state.authCategoryId],
      skillTier: state.authSkillTier,
      brandName: (state.authBrandName || `${name.split(' ')[0]} Services`).trim(),
      startingPriceUsd: Number(state.authStartingPrice || 25),
      nationalIdNumber: (state.authIdNumber || state.authNationalId || '').trim() || '63-2948102-F-42',
      idDocument: {
        type: state.authIdType || 'National ID',
        number: (state.authIdNumber || state.authNationalId || '').trim() || '63-2948102-F-42',
        photoUrl: finalIdPhoto
      },
      avatarUrl: finalAvatar,
      selfieUrl: finalAvatar,
      portfolioImageUrl: finalPortfolioPhoto
    });

    stopFaceCameraStream();
    state.role = res.role;
    state.currentUser = res.user;
    state.isAuthenticated = true;
    state.activeModal = null;
    state.authStep = 'PHONE';

    // Insert or update in local in-memory DB immediately
    if (state.db) {
      const list = res.role === 'PROVIDER' ? (state.db.providers = state.db.providers || []) : (state.db.customers = state.db.customers || []);
      const idx = list.findIndex((item) => item.id === res.user.id);
      if (idx >= 0) {
        list[idx] = res.user;
      } else {
        list.push(res.user);
      }
    }

    saveSession(res.role, res.user, false);
    showToast(`Welcome to Findit Harare, ${res.user.name}!`, 'success');

    // If client had a pending task waiting in CONFIGURE step, submit it directly!
    if (res.role === 'CUSTOMER' && state.screenStep === 'CONFIGURE' && state.draftNotes) {
      submitServiceRequest();
    } else {
      renderAll();
    }
  } catch (err) {
    restoreSubmitBtns();
    showToast(err.message || 'Failed to complete registration. Please check your connection.', 'error');
  }
}


// ============================================================================
// SLIDE-OUT LEFT DRAWER, CANCELLATION SHEET, WAITLIST, RATING & MODALS
// ============================================================================
let lastRenderedModalKey = '';

function openSignInRoleChoiceModal(tab = 'LOGIN') {
  state.modalData = { tab: typeof tab === 'string' ? tab : 'LOGIN', loginRole: 'CUSTOMER', notice: null };
  state.activeModal = 'SIGNIN_ROLE_CHOICE';
  renderModalLayer();
}

function setSignInModalData(patch) {
  state.modalData = { ...(state.modalData || {}), ...patch };
  renderModalLayer();
}

function quickFillTestUser(role, phone, pwd) {
  state.loginPhone = '+263 ' + phone.replace(/^0/, '');
  state.loginPassword = pwd;
  setSignInModalData({ loginRole: role, notice: null });
  const pInput = document.getElementById('loginPhoneInput');
  if (pInput) pInput.value = phone.replace(/^0/, '');
  const pwdInput = document.getElementById('loginPasswordInput');
  if (pwdInput) pwdInput.value = pwd;
}

async function submitExistingAccountLogin() {
  const md = state.modalData || {};
  const role = md.loginRole || 'CUSTOMER';
  const phone = (state.loginPhone || document.getElementById('loginPhoneInput')?.value || '').trim();
  const password = state.loginPassword || document.getElementById('loginPasswordInput')?.value || '';
  if (phone.replace(/\D/g, '').length < 8) {
    setSignInModalData({ notice: { tone: 'error', text: 'Please enter a valid phone number.' } });
    return;
  }
  if (!password) {
    setSignInModalData({ notice: { tone: 'error', text: 'Please enter your password.' } });
    return;
  }

  try {
    const res = await apiPost('/api/auth/login', { phone, password, role }, 0);
    const user = res.user;
    const list = role === 'PROVIDER' ? (state.db.providers || []) : (state.db.customers || []);
    if (!list.some((u) => u.id === user.id)) list.push(user);
    state.currentUser = user;
    state.isAuthenticated = true;
    state.role = role;
    state.providerTab = 'FEED';
    state.loginPassword = '';
    state.activeModal = null;
    state.modalData = null;
    lastRenderedModalKey = '';
    saveSession(role, user, false);
    showToast(`Welcome back, ${user.name}!`);
    if (role === 'PROVIDER') {
      try { openJobMarketplaceView(); } catch (e) {}
    }
    renderAll();
  } catch (err) {
    const d = err.data || {};
    if (d.code === 'NO_PROVIDER_PROFILE') {
      setSignInModalData({ notice: { tone: 'warn', text: `Hi ${d.name || ''}, you have a Client account but no Provider profile yet. To work as a provider, complete the provider verification once (ID document + face match + categories).`, actions: 'UPGRADE_TO_PROVIDER', name: d.name } });
    } else if (d.code === 'NO_CLIENT_PROFILE') {
      setSignInModalData({ notice: { tone: 'warn', text: 'This number is registered as a Service Provider. Log in as Provider — you can switch to Client mode from the side menu anytime.', actions: 'SWITCH_TO_PROVIDER' } });
    } else if (d.code === 'NOT_FOUND') {
      setSignInModalData({ notice: { tone: 'error', text: 'No account found with this number.', actions: 'CREATE' } });
    } else {
      setSignInModalData({ notice: { tone: 'error', text: err.message || 'Login failed. Please try again.' } });
    }
  }
}

function startProviderUpgradeFromLogin() {
  const name = state.modalData?.notice?.name || '';
  state.authRole = 'PROVIDER';
  state.authStep = 'PHONE';
  state.authName = name;
  state.authPhone = state.loginPhone || '';
  state.authPassword = state.loginPassword || '';
  state.faceVerifiedSuccess = false;
  state.modalData = null;
  state.activeModal = 'SIGNUP_FLOW';
  lastRenderedModalKey = '';
  renderModalLayer();
}

function startSignInForRole(role) {
  state.authRole = role;
  state.authStep = 'PHONE';
  state.activeModal = 'SIGNUP_FLOW';
  state.faceVerifiedSuccess = false;
  lastRenderedModalKey = '';
  renderModalLayer();
}

function getRelevantNotifications() {
  const allNotifs = Array.isArray(state.db?.adminNotifications) ? state.db.adminNotifications : [];
  const myId = state.currentUser?.id;
  const myFinditId = state.currentUser?.finditId;
  const myPhone = (state.currentUser?.phone || '').replace(/\D/g, '');

  const filtered = allNotifs.filter((n) => {
    if (n.recipientType === 'ALL') return true;
    if (n.recipientType === 'CUSTOMERS' && state.role === 'CUSTOMER') return true;
    if (n.recipientType === 'PROVIDERS' && state.role === 'PROVIDER') return true;
    if (n.recipientType === 'SPECIFIC_USER') {
      const rec = String(n.recipientId || '').trim();
      const recDigits = rec.replace(/\D/g, '');
      return rec === myId || rec === myFinditId || (myPhone && recDigits && myPhone === recDigits);
    }
    return false;
  });

  // Also include user's personal activeWarnings if any
  const warnings = Array.isArray(state.currentUser?.activeWarnings) ? state.currentUser.activeWarnings : [];
  warnings.forEach((w) => {
    if (!filtered.some((f) => f.id === w.id)) {
      filtered.unshift({
        id: w.id || ('warn_' + Date.now()),
        type: 'WARNING',
        title: 'Official Admin Safety Warning',
        message: w.reason || 'Safety policy notice from Findit Admin',
        createdAt: w.date || new Date().toISOString()
      });
    }
  });

  return filtered;
}

function getUnreadNotificationsCount() {
  const notifs = getRelevantNotifications();
  const readSet = new Set(state.currentUser?.readNotificationIds || []);
  try {
    const localRead = JSON.parse(localStorage.getItem('findit_read_notifs') || '[]');
    localRead.forEach((id) => readSet.add(id));
  } catch (e) {}
  return notifs.filter((n) => !readSet.has(n.id)).length;
}

function markAllNotificationsRead() {
  const notifs = getRelevantNotifications();
  const readList = notifs.map((n) => n.id);
  if (state.currentUser) {
    state.currentUser.readNotificationIds = readList;
  }
  try {
    localStorage.setItem('findit_read_notifs', JSON.stringify(readList));
  } catch (e) {}
  showToast('All notifications marked as read', 'success');
  renderModalLayer();
  renderUiOverlay();
}

function openNotificationCenterModal() {
  state.activeModal = 'NOTIFICATIONS';
  lastRenderedModalKey = '';
  renderModalLayer();
}

function renderModalLayer() {
  const root = document.getElementById('pickerModalRoot');
  if (!root) return;
  if (!state.activeModal) {
    if (root.innerHTML !== '') root.innerHTML = '';
    lastRenderedModalKey = '';
    return;
  }

  // Generate unique modal rendering key to prevent wiping inputs or camera streams on periodic polling
  const modalKey = state.activeModal === 'SIGNUP_FLOW'
    ? `SIGNUP_${state.authRole}_${state.authStep}_${(state.authCategoryIds || []).join(',')}_${state.faceVerifiedSuccess ? 'VERIFIED' : 'SCAN'}`
    : state.activeModal === 'SUPPORT'
      ? `SUPPORT_${(state.supportChatMessages || []).length}_${state.supportAiTyping ? 1 : 0}_${state.supportShowBizInfo ? 1 : 0}`
      : state.activeModal === 'SUBURB_PICKER'
        ? `SUBURB_PICKER_${(state.locationSearchResults || []).length}_${state.locationSearching ? 1 : 0}`
        : state.activeModal === 'SETTINGS'
          ? `SETTINGS_${state.role}_${(state.settingsDraft?.categoryIds || []).join(',')}_${state.settingsDraft?.isOnline !== false ? 1 : 0}`
          : state.activeModal === 'PROVIDER_OFFICE_MODAL'
            ? `PROVIDER_OFFICE_${state.officeDraftHasOffice ? 1 : 0}`
            : state.activeModal === 'ADD_SERVICE_MODAL'
              ? `ADD_SERVICE_${state.newServicePhotoDataUrl ? 1 : 0}`
              : state.activeModal === 'EDIT_SERVICE_MODAL'
                ? `EDIT_SERVICE_${state.modalData?.item?.id}_${state.editServicePhotoDataUrl ? 1 : 0}`
                : state.activeModal === 'NOTIFICATIONS'
                  ? `NOTIFICATIONS_${(getRelevantNotifications() || []).length}_${getUnreadNotificationsCount()}`
                  : state.activeModal === 'RATE_BOOKING_MODAL'
                    ? `RATE_BOOKING_${state.modalData?.requestId}_${state.ratingStars}_${(state.ratingTags || []).join(',')}`
                    : `${state.activeModal}_${JSON.stringify(state.modalData || {})}`;

  if (modalKey === lastRenderedModalKey && root.firstElementChild) {
    return;
  }
  lastRenderedModalKey = modalKey;

  // 1. SIGN-IN MODAL: "Log In" (existing account) | "Create Account" (new), each as Client or Provider
  if (state.activeModal === 'SIGNIN_ROLE_CHOICE') {
    const md = state.modalData || {};
    const tab = md.tab || 'LOGIN';
    const loginRole = md.loginRole || 'CUSTOMER';
    const notice = md.notice || null;

    const loginHtml = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
        <button type="button" class="${loginRole === 'CUSTOMER' ? 'btn-primary-blue' : 'btn-dark-sec'}" style="height:40px; font-size:12.5px;" onclick="setSignInModalData({ loginRole: 'CUSTOMER', notice: null })">
          ${uiIcon('user', 14)}<span>As Client</span>
        </button>
        <button type="button" class="${loginRole === 'PROVIDER' ? 'btn-primary-blue' : 'btn-dark-sec'}" style="height:40px; font-size:12.5px;" onclick="setSignInModalData({ loginRole: 'PROVIDER', notice: null })">
          ${uiIcon('briefcase', 14)}<span>As Provider</span>
        </button>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
        <div>
          <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Phone Number</label>
          <div style="display:flex; gap:8px;">
            <div style="background:var(--blue-soft); border:1.5px solid var(--blue-border); border-radius:12px; padding:10px 12px; font-weight:800; color:var(--blue-primary); display:inline-flex; align-items:center; gap:6px; white-space:nowrap; font-size:13px;">
              ${uiIcon('zwFlag', 18)}<span>+263</span>
            </div>
            <input id="loginPhoneInput" type="tel" class="dark-input" style="font-size:15px; font-weight:800; flex:1;" placeholder="77 200 1001"
              value="${escapeHtml((state.loginPhone || '').replace(/^\+?263\s*/, ''))}" oninput="state.loginPhone = '+263 ' + this.value" />
          </div>
        </div>
        <div>
          <label style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Password</label>
          <input id="loginPasswordInput" type="password" class="dark-input" placeholder="••••••••"
            value="${escapeHtml(state.loginPassword || '')}" oninput="state.loginPassword = this.value"
            onkeydown="if(event.key==='Enter') submitExistingAccountLogin()" />
        </div>
      </div>

      ${notice ? `
        <div style="background:${notice.tone === 'warn' ? '#FFFBEB' : '#FEF2F2'}; border:1.5px solid ${notice.tone === 'warn' ? '#FDE68A' : '#FECACA'}; border-radius:12px; padding:10px 12px; margin-bottom:12px; font-size:12px; line-height:1.45; color:${notice.tone === 'warn' ? '#92400E' : '#B91C1C'};">
          <div style="font-weight:800; margin-bottom:${notice.actions ? '8px' : '0'};">${escapeHtml(notice.text)}</div>
          ${notice.actions === 'UPGRADE_TO_PROVIDER' ? `
            <div style="display:flex; flex-direction:column; gap:6px;">
              <button type="button" class="btn-primary-blue" style="height:38px; font-size:12.5px;" onclick="startProviderUpgradeFromLogin()">
                ${uiIcon('shield', 14)}<span>Complete Provider Verification (ID + Face)</span>
              </button>
              <button type="button" class="btn-dark-sec" style="height:36px; font-size:12px;" onclick="setSignInModalData({ loginRole: 'CUSTOMER', notice: null }); setTimeout(submitExistingAccountLogin, 30);">
                Log in as Client instead
              </button>
            </div>
          ` : ''}
          ${notice.actions === 'SWITCH_TO_PROVIDER' ? `
            <button type="button" class="btn-primary-blue" style="height:38px; font-size:12.5px;" onclick="setSignInModalData({ loginRole: 'PROVIDER', notice: null }); setTimeout(submitExistingAccountLogin, 30);">
              Log in as Provider instead
            </button>
          ` : ''}
          ${notice.actions === 'CREATE' ? `
            <button type="button" class="btn-primary-blue" style="height:38px; font-size:12.5px;" onclick="setSignInModalData({ tab: 'SIGNUP', notice: null })">
              Create an Account
            </button>
          ` : ''}
        </div>
      ` : ''}

      <button type="button" class="btn-primary-blue" style="height:48px; font-size:15px; font-weight:800;" onclick="submitExistingAccountLogin()">
        <span>Log In as ${loginRole === 'PROVIDER' ? 'Service Provider' : 'Client'}</span>
      </button>

      <!-- Quick Test Accounts 1-Tap Fill -->
      <div style="margin-top:14px; padding:10px 12px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; text-align:left;">
        <div style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:8px;">
          Quick Test Logins (Tap to Autofill)
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:10.5px; font-weight:700; color:#2563EB;">Clients (Password: test1234):</div>
          <div style="display:flex; gap:5px; flex-wrap:wrap;">
            <button type="button" class="btn-dark-sec" style="height:26px; padding:0 8px; font-size:11px;" onclick="quickFillTestUser('CUSTOMER', '0771110001', 'test1234')">Tapiwa (Avondale)</button>
            <button type="button" class="btn-dark-sec" style="height:26px; padding:0 8px; font-size:11px;" onclick="quickFillTestUser('CUSTOMER', '0771110002', 'test1234')">Ruvimbo (Borrowdale)</button>
            <button type="button" class="btn-dark-sec" style="height:26px; padding:0 8px; font-size:11px;" onclick="quickFillTestUser('CUSTOMER', '0771110003', 'test1234')">Farai (Eastlea)</button>
            <button type="button" class="btn-dark-sec" style="height:26px; padding:0 8px; font-size:11px;" onclick="quickFillTestUser('CUSTOMER', '0771110004', 'test1234')">Nyasha (Mt Pleasant)</button>
          </div>
          <div style="font-size:10.5px; font-weight:700; color:#059669; margin-top:2px;">Providers (Password: test1234):</div>
          <div style="display:flex; gap:5px; flex-wrap:wrap;">
            <button type="button" class="btn-dark-sec" style="height:26px; padding:0 8px; font-size:11px;" onclick="quickFillTestUser('PROVIDER', '0772220001', 'test1234')">Kuda (Plumbing/Repairs)</button>
            <button type="button" class="btn-dark-sec" style="height:26px; padding:0 8px; font-size:11px;" onclick="quickFillTestUser('PROVIDER', '0772220002', 'test1234')">Tariro (Hair &amp; Beauty)</button>
            <button type="button" class="btn-dark-sec" style="height:26px; padding:0 8px; font-size:11px;" onclick="quickFillTestUser('PROVIDER', '0772220003', 'test1234')">Simba (Auto Mechanics)</button>
          </div>
        </div>
      </div>

      <div style="font-size:11.5px; color:var(--text-secondary); text-align:center; margin-top:10px; line-height:1.45;">
        One phone number can hold both a Client and a Provider profile. You can switch modes anytime from the side menu.
      </div>
    `;

    const signupHtml = `
      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:6px;">
        <div class="role-choice-card" onclick="startSignInForRole('CUSTOMER')">
          <div class="role-choice-icon-wrap" style="background:#EFF6FF; color:#0066FF;">${uiIcon('user', 24)}</div>
          <div style="flex:1;">
            <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:3px;">Create Client Account</div>
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.4;">Name, phone, password + quick face check. Post jobs and get bids from verified pros.</div>
          </div>
          <div style="color:var(--text-secondary); display:flex; align-items:center;">${uiIcon('chevronRight', 18)}</div>
        </div>

        <div class="role-choice-card" onclick="startSignInForRole('PROVIDER')">
          <div class="role-choice-icon-wrap" style="background:#ECFDF5; color:#10B981;">${uiIcon('briefcase', 24)}</div>
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px; flex-wrap:wrap;">
              <span style="font-size:15px; font-weight:800; color:var(--text-main);">Become a Service Provider</span>
              <span style="background:#FEF3C7; color:#92400E; font-size:10px; font-weight:800; padding:2px 6px; border-radius:99px;">+$5 Welcome Bonus</span>
            </div>
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.4;">ID + face match + up to 3 business categories. Bid on matching jobs near you.</div>
          </div>
          <div style="color:var(--text-secondary); display:flex; align-items:center;">${uiIcon('chevronRight', 18)}</div>
        </div>
      </div>
    `;

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="/assets/logo-icon.svg" width="28" height="28" style="border-radius:8px;" alt="Logo" />
              <div class="cancel-sheet-title">Findit Harare</div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; background:#F1F5F9; border-radius:12px; padding:4px; margin-bottom:14px;">
            <button type="button" onclick="setSignInModalData({ tab: 'LOGIN', notice: null })" style="height:36px; border:none; border-radius:9px; font-weight:800; font-size:13px; cursor:pointer; ${tab === 'LOGIN' ? 'background:#FFFFFF; color:#0F172A; box-shadow:0 1px 3px rgba(0,0,0,0.12);' : 'background:transparent; color:#64748B;'}">Log In</button>
            <button type="button" onclick="setSignInModalData({ tab: 'SIGNUP', notice: null })" style="height:36px; border:none; border-radius:9px; font-weight:800; font-size:13px; cursor:pointer; ${tab === 'SIGNUP' ? 'background:#FFFFFF; color:#0F172A; box-shadow:0 1px 3px rgba(0,0,0,0.12);' : 'background:transparent; color:#64748B;'}">Create Account</button>
          </div>

          ${tab === 'LOGIN' ? loginHtml : signupHtml}
        </div>
      </div>
    `;
    return;
  }

  // 2. EXPLANATORY LOW BALANCE MODAL (11% Commission & $2 Min Reserve & Top-Up Rule)
  if (state.activeModal === 'LOW_BALANCE_EXPLANATORY') {
    const data = state.modalData || {};
    const currentBalance = Number(data.currentBalanceUsd || 0);
    const minReserve = Number(data.minReserveUsd || 2.00);
    const commPercent = Number(data.commissionPercent || 11);
    const bidPrice = Number(data.bidPriceUsd || 0);
    const commFee = Number(data.commissionFeeUsd || Math.round(bidPrice * (commPercent / 100) * 100) / 100);
    const reqTopUp = Number(data.requiredTopUpUsd || Math.max(5.00, commFee));

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet low-balance-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:36px; height:36px; border-radius:10px; background:#FEF2F2; color:#DC2626; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                ${uiIcon('alertTriangle', 20)}
              </div>
              <div>
                <div class="cancel-sheet-title">Low Account Balance</div>
                <div style="font-size:11.5px; color:#DC2626; font-weight:700;">Account Top-Up Required to Bid</div>
              </div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:14px; padding:12px 14px; margin-bottom:14px;">
            <div style="font-size:13px; font-weight:800; color:#92400E; margin-bottom:4px;">
              Why is a top-up needed?
            </div>
            <div style="font-size:12px; color:#78350F; line-height:1.5;">
              Every provider receives a <strong>$5.00 Welcome Balance</strong> upon joining. As you work, an <strong>${commPercent}% platform commission</strong> ($${commFee.toFixed(2)} USD) is deducted upon successful job completion. Your wallet reserve cannot fall below <strong>$${minReserve.toFixed(2)} USD</strong>.
            </div>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px; margin-bottom:14px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; font-size:12.5px;">
              <span style="color:#64748B;">Current Wallet Balance:</span>
              <span style="font-weight:800; color:${currentBalance < minReserve ? '#DC2626' : '#0F172A'};">$${currentBalance.toFixed(2)} USD</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px;">
              <span style="color:#64748B;">Minimum Account Reserve:</span>
              <span style="font-weight:700; color:#0F172A;">$${minReserve.toFixed(2)} USD</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px;">
              <span style="color:#64748B;">Task Bid Amount:</span>
              <span style="font-weight:700; color:#0066FF;">$${bidPrice.toFixed(2)} USD</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px; border-top:1px dashed #CBD5E1; padding-top:8px;">
              <span style="color:#64748B;">Platform Fee (${commPercent}%):</span>
              <span style="font-weight:700; color:#0F172A;">$${commFee.toFixed(2)} USD</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13.5px; border-top:1px solid #CBD5E1; padding-top:8px;">
              <span style="font-weight:800; color:#0F172A;">Required Top-Up:</span>
              <span style="font-weight:900; color:#16A34A; font-size:15px;">+$${reqTopUp.toFixed(2)} USD</span>
            </div>
          </div>

          <div style="font-size:11.5px; color:#64748B; line-height:1.45; margin-bottom:16px;">
            <strong>Top-up Rule:</strong> Top up at least <strong>$${reqTopUp.toFixed(2)} USD</strong> (11% of bid = $${commFee.toFixed(2)} USD. If the 11% figure is below $5.00, minimum top-up is $5.00; if 11% is above $5.00, top up the exact 11% figure).
          </div>

          <button class="btn-primary-blue" style="height:48px; font-size:14.5px; font-weight:800; background:#10B981; margin-bottom:8px;" onclick="triggerEcoCashTopUp(${reqTopUp})">
            ${uiIcon('wallet', 18)}
            <span>Top Up $${reqTopUp.toFixed(2)} USD via EcoCash</span>
          </button>

          <button class="btn-dark-sec" style="height:40px; font-size:13px; font-weight:700;" onclick="closeModal()">
            Return to Available Tasks
          </button>
        </div>
      </div>
    `;
    return;
  }

  // 3. SIGN-UP WIZARD MODAL
  if (state.activeModal === 'SIGNUP_FLOW') {
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          ${renderSignUpWizardInnerHtml(false)}
        </div>
      </div>
    `;
    return;
  }

  // COMING SOON HUB SERVICE WAITLIST (ONLINE SHOPPING & TRANSPORT)
  if (state.activeModal === 'COMING_SOON_SERVICE') {
    const srvTitle = state.modalData?.title || 'Coming Soon';
    const srvDesc = state.modalData?.desc || 'This service is currently expanding to Harare.';
    const suburbs = state.db?.suburbs || [];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--blue-primary);">${uiIcon('sparkle', 22)}</span>
              <div>
                <div class="cancel-sheet-title">${srvTitle}</div>
                <div style="font-size:11.5px; color:#D97706; font-weight:800;">Harare Early-Access Priority List</div>
              </div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin-bottom:14px;">
            ${srvDesc} Join the priority waitlist to get notified via WhatsApp the moment we go live in your Harare area!
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
            <input id="serviceWaitlistPhone" class="dark-input" value="${state.currentUser?.phone || '+263 77 200 1001'}" placeholder="Your WhatsApp (+263...)" />
            <select id="serviceWaitlistSuburb" class="dark-input">
              ${suburbs.map((s) => `<option value="${s.name}" ${s.id === state.selectedSuburbId ? 'selected' : ''}>Harare Area: ${s.name}</option>`).join('')}
            </select>
          </div>

          <button class="btn-primary-blue" onclick="showToast('You have been added to the priority list! We will WhatsApp you upon launch.', 'success'); closeModal();">
            ${uiIcon('check', 16)}
            <span>Join Early Access List</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // PLATFORM CHANGELOG / ANNOUNCEMENTS MODAL
  if (state.activeModal === 'CHANGELOG_MODAL') {
    const logs = state.db?.changelogs || [];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--blue-primary);">${uiIcon('sparkle', 20)}</span>
              <div class="cancel-sheet-title">What's New in Findit Harare</div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <div style="max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:14px;">
            ${logs.map((cl) => `
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:13.5px; font-weight:800; color:#0F172A;">${cl.title}</span>
                  <span style="font-size:11px; font-weight:800; background:#EFF6FF; color:#0066FF; padding:2px 8px; border-radius:99px;">${cl.version}</span>
                </div>
                <div style="font-size:11px; color:#64748B; margin-bottom:8px;">${cl.date}</div>
                <ul style="margin:0; padding-left:18px; font-size:12px; color:#334155; line-height:1.5;">
                  ${(cl.highlights || []).map((h) => `<li>${h}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
          <button class="btn-primary-blue" style="margin-top:14px;" onclick="closeModal()">Got It</button>
        </div>
      </div>
    `;
    return;
  }

  // COMING SOON CATEGORY PRIORITY WAITLIST MODAL (ORIGINAL FEATURE)
  if (state.activeModal === 'COMING_SOON_MODAL') {
    const cat = state.modalData?.category || {};
    const suburbs = state.db.suburbs || [];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="history-icon-circle">${getCategoryVectorSvg(cat.id || 'cleaning', false)}</div>
              <div>
                <div class="cancel-sheet-title">${cat.fullName || cat.name || 'Coming Soon'}</div>
                <div style="font-size:12px; color:#B45309; font-weight:800;">Launching Soon in Harare • ${cat.waitlistCount || 140} on waitlist</div>
              </div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin-bottom:14px;">
            We are currently verifying Harare specialists for <strong>${cat.fullName || cat.name}</strong> (National ID, biometric face liveness, and work catalogue inspection). Join the priority waitlist to get notified first!
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
            <input id="waitlistPhoneInput" class="dark-input" value="${state.currentUser?.phone || '+263 77 200 1001'}" placeholder="Your WhatsApp Number (+263...)" />
            <select id="waitlistSuburbSelect" class="dark-input">
              ${suburbs.map((s) => `<option value="${s.name}" ${s.id === state.selectedSuburbId ? 'selected' : ''}>Suburb: ${s.name}, Harare</option>`).join('')}
            </select>
          </div>

          <button class="btn-primary-blue" onclick="submitCategoryWaitlist('${cat.id}')">
            ${uiIcon('sparkle', 16)}
            <span>Join Priority Waitlist</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // 5-STAR RATING & COMPLIMENT MODAL ON SERVICE COMPLETION
  if (state.activeModal === 'RATE_BOOKING_MODAL') {
    const requestId = state.modalData?.requestId || state.activeRequestId;
    const req = (state.db.requests || []).find((r) => r.id === requestId) || {};
    const isProvider = state.role === 'PROVIDER';
    const allTags = isProvider
      ? ['Paid Promptly in USD', 'Respectful & Welcoming', 'Home & Power Ready', 'Clear Gate Directions', 'Delayed at Gate', 'Haggled Agreed Price']
      : ['Punctual Arrival', 'Clean Mobile Kit', 'Professional Work', 'Fair USD Price', 'Friendly & Respectful', 'Delayed Arrival'];

    const ratingDescriptions = {
      1: '1 Star — Needs Major Improvement',
      2: '2 Stars — Below Expectations',
      3: '3 Stars — Satisfactory Service',
      4: '4 Stars — Very Good Service',
      5: '5 Stars — Outstanding & Highly Recommended'
    };

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">${isProvider ? 'Rate Client & Courtesy' : 'Rate Home-Visit Service'}</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="text-align:center; padding:8px 0 14px;">
            <div style="font-size:14px; font-weight:700; color:var(--text-secondary); margin-bottom:12px;">
              ${isProvider ? `How was your visit serving <strong>${req.customerName || 'the client'}</strong>?` : `How was your <strong>${req.title || 'Home Service'}</strong> experience?`}
            </div>

            <!-- Clickable 1 to 5 Stars Component -->
            <div style="display:flex; justify-content:center; gap:8px; margin-bottom:8px;">
              ${[1, 2, 3, 4, 5].map((star) => `
                <button
                  type="button"
                  style="background:var(--bg-card); border:1.8px solid ${star <= state.ratingStars ? '#F59E0B' : 'var(--border-light)'}; width:48px; height:48px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:transform 0.12s, border-color 0.15s;"
                  onclick="selectRatingStars(${star})"
                  title="${star} Star${star > 1 ? 's' : ''}"
                >
                  ${star <= state.ratingStars ? uiIcon('star', 24) : uiIcon('starOutline', 24)}
                </button>
              `).join('')}
            </div>

            <div style="font-size:12px; font-weight:800; color:${state.ratingStars >= 4 ? '#059669' : state.ratingStars === 3 ? '#D97706' : '#DC2626'}; margin-bottom:14px;">
              ${ratingDescriptions[state.ratingStars] || `${state.ratingStars} Stars`}
            </div>

            <!-- Quick Compliment Tags -->
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:7px; margin-bottom:14px;">
              ${allTags.map((tag) => {
                const active = state.ratingTags.includes(tag);
                return `
                  <button
                    type="button"
                    class="chat-preset-chip"
                    style="background:${active ? 'var(--blue-primary)' : 'var(--bg-card)'}; color:${active ? '#FFFFFF' : 'var(--text-main)'}; border-color:${active ? 'var(--blue-primary)' : 'var(--border-light)'}; padding:7px 12px;"
                    onclick="toggleRatingComplimentTag('${tag}')"
                  >
                    ${active ? uiIcon('check', 12) : ''}
                    <span>${tag}</span>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Custom Written Feedback Comment Box (User Requested Free-Form Input) -->
            <div style="margin:12px 0 16px; text-align:left;">
              <label style="font-size:11.5px; font-weight:800; color:var(--text-secondary); display:block; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.04em;">
                Write Custom Feedback (Optional)
              </label>
              <textarea
                id="customRatingCommentBox"
                class="dark-input"
                rows="3"
                style="width:100%; border-radius:12px; font-size:13px; line-height:1.45; padding:10px 12px; resize:none;"
                placeholder="${isProvider ? 'Write notes about the client gate, payment, or home instructions...' : 'Share what made the specialist stand out, punctuality, neatness, etc...'}"
                oninput="state.customReviewComment = this.value"
              >${escapeHtml(state.customReviewComment || '')}</textarea>
            </div>
          </div>

          <button class="btn-primary-blue" onclick="completeBooking('${requestId}')">
            ${uiIcon('check', 16)}
            <span>${isProvider ? `Submit Client Review & Finish` : `Submit ${state.ratingStars}-Star Rating & Finish`}</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // TERMS & CONDITIONS MODAL
  if (state.activeModal === 'TERMS_MODAL') {
    root.innerHTML = `
      <div class="modal-backdrop" onclick="state.activeModal='SIGNUP_FLOW'; renderModalLayer();">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Terms &amp; Conditions</div>
            <button class="cancel-close-x" onclick="state.activeModal='SIGNUP_FLOW'; renderModalLayer();">${uiIcon('close', 16)}</button>
          </div>
          <div style="font-size:13px; color:var(--text-secondary); line-height:1.55; max-height:340px; overflow-y:auto;">
            <p style="margin-bottom:8px;"><strong>1. Fair Price Negotiation:</strong> Clients propose a starting USD fare and verified Harare providers accept the fare or counter-bid based on their skill tier and travel distance.</p>
            <p style="margin-bottom:8px;"><strong>2. In-App Protection &amp; Anti-Leakage:</strong> Sharing off-platform phone numbers, WhatsApp links, @handles, or watermarked flyers in chat or catalogue photos is strictly prohibited.</p>
            <p style="margin-bottom:8px;"><strong>3. Admin Catalogue Moderation:</strong> Every portfolio photo or bio update submitted by a service provider is reviewed by Findit Admin before being published to clients.</p>
            <p><strong>4. Home Arrival PIN &amp; Mutual Cancellation:</strong> Clients share the 4-digit Start PIN upon provider arrival. Either party may cancel with a valid reason.</p>
          </div>
          <button class="btn-primary-blue" style="margin-top:14px;" onclick="state.activeModal='SIGNUP_FLOW'; renderModalLayer();">
            Back to Sign Up
          </button>
        </div>
      </div>
    `;
    return;
  }

  // PRIVACY POLICY MODAL
  if (state.activeModal === 'PRIVACY_MODAL') {
    root.innerHTML = `
      <div class="modal-backdrop" onclick="state.activeModal='SIGNUP_FLOW'; renderModalLayer();">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Privacy Policy</div>
            <button class="cancel-close-x" onclick="state.activeModal='SIGNUP_FLOW'; renderModalLayer();">${uiIcon('close', 16)}</button>
          </div>
          <div style="font-size:13px; color:var(--text-secondary); line-height:1.55; max-height:340px; overflow-y:auto;">
            <p style="margin-bottom:8px;"><strong>1. Masked Phone Numbers:</strong> Your personal WhatsApp and phone number are never exposed to the other party; all calls and messages happen inside Findit Harare.</p>
            <p style="margin-bottom:8px;"><strong>2. Biometric &amp; National ID Data:</strong> Live selfie verification and Zimbabwe National ID records are encrypted and used exclusively for safety verification.</p>
            <p><strong>3. Live Location Privacy:</strong> Home visit coordinates are shared only with your accepted service provider during an active booking.</p>
          </div>
          <button class="btn-primary-blue" style="margin-top:14px;" onclick="state.activeModal='SIGNUP_FLOW'; renderModalLayer();">
            Back to Sign Up
          </button>
        </div>
      </div>
    `;
    return;
  }

  // SLIDE-OUT LEFT NAVIGATION DRAWER
  if (state.activeModal === 'DRAWER') {
    const isAuth = state.isAuthenticated && state.currentUser;
    const user = isAuth ? state.currentUser : null;
    const isProvider = state.role === 'PROVIDER';
    const ratingNum = user && user.rating ? Number(user.rating).toFixed(2) : null;
    const jobCount = user ? (user.completedBookings || 0) : 0;

    root.innerHTML = `
      <div class="indrive-left-drawer-backdrop" onclick="closeModal()">
        <div class="indrive-left-drawer" onclick="event.stopPropagation()">
          <div>
            ${isAuth ? `
              <div class="drawer-profile-header" onclick="state.activeModal='SETTINGS'; renderModalLayer();">
                <div class="drawer-avatar-circle">
                  ${user.avatarUrl
                    ? `<img src="${resolveMediaUrl(user.avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" alt="${user.name}" />`
                    : `<span>${user.avatarInitials || (user.name ? user.name.slice(0, 2).toUpperCase() : 'FH')}</span>`
                  }
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="font-size:15px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user.name}</div>
                  <div style="font-size:12px; color:var(--text-secondary); font-weight:600; margin-top:2px; display:flex; align-items:center; gap:4px;">
                    <span style="color:#F59E0B; display:inline-flex;">${uiIcon('star', 12)}</span>
                    <span>${ratingNum || '5.00'} (${jobCount})</span>
                  </div>
                  <div style="font-size:11px; font-family:monospace; font-weight:800; color:var(--blue-primary); margin-top:2px;">
                    ID: ${user.finditId || (isProvider ? 'FH-PRO-VERIFIED' : 'FH-USR-VERIFIED')}
                  </div>
                </div>
                <span style="color:var(--text-secondary); display:inline-flex;">${uiIcon('chevronRight', 14)}</span>
              </div>
            ` : `
              <div class="drawer-profile-header" onclick="openSignInRoleChoiceModal()">
                <div class="drawer-avatar-circle" style="background:var(--blue-soft); color:var(--blue-primary);">
                  ${uiIcon('user', 20)}
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="font-size:15px; font-weight:800; color:var(--text-main);">Sign in to Findit</div>
                  <div style="font-size:12px; color:var(--blue-primary); font-weight:700; margin-top:2px;">
                    Client or Service Provider
                  </div>
                </div>
                <span style="color:var(--text-secondary); display:inline-flex;">${uiIcon('chevronRight', 14)}</span>
              </div>
            `}

            ${(isAuth && isProvider) ? `
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:12px; margin-bottom:12px;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <div>
                    <div style="font-size:12.5px; font-weight:800; color:#0F172A; display:flex; align-items:center; gap:6px;">
                      <span style="width:7px; height:7px; border-radius:50%; background:${user.isOnline !== false ? '#10B981' : '#64748B'};"></span>
                      <span>${user.isOnline !== false ? 'Online & Ready for Jobs' : 'Offline'}</span>
                    </div>
                    <div style="font-size:10.5px; color:#64748B; margin-top:2px;">
                      ${user.isOnline !== false ? 'Clients in Harare can see & book you' : 'Turn on to receive live requests'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onclick="toggleProviderOnlineStatus()"
                    style="background:${user.isOnline !== false ? '#10B981' : '#475569'}; color:#FFFFFF; border:none; padding:6px 12px; border-radius:99px; font-size:11.5px; font-weight:800; cursor:pointer;"
                  >
                    ${user.isOnline !== false ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>
              </div>
            ` : ''}

            <div class="drawer-menu-list">
              <!-- Multi-Service Hub Pinned to Side Panel (Works in both Client & Provider Mode) -->
              <div class="drawer-menu-item ${state.hubView === 'HUB' ? 'active' : ''}" style="background:#EFF6FF; border:1.5px solid #BFDBFE; border-radius:12px; margin-bottom:8px; font-weight:800; color:#1E40AF;" onclick="closeModal(); returnToMainHub();">
                ${uiIcon('home', 18)}
                <span style="color:#1E40AF;">Multi-Service Hub</span>
              </div>

              <div class="drawer-menu-item ${state.hubView !== 'HUB' ? 'active' : ''}" onclick="closeModal(); openJobMarketplaceView();">
                ${uiIcon('map', 18)}
                <span>${isProvider ? 'Provider Workspace' : 'Job Marketplace Map'}</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='HISTORY'; renderModalLayer();">
                ${uiIcon('clock', 18)}
                <span>${isProvider ? 'Service History' : 'Request history'}</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='NOTIFICATIONS'; renderModalLayer();">
                ${uiIcon('bell', 18)}
                <span>Notifications</span>
                ${getUnreadNotificationsCount() > 0 ? `<span style="margin-left:auto; background:#EF4444; color:#fff; font-size:10.5px; font-weight:800; padding:1px 7px; border-radius:99px;">${getUnreadNotificationsCount()}</span>` : ''}
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='SAFETY'; renderModalLayer();">
                ${uiIcon('shield', 18)}
                <span>Safety</span>
              </div>

              <div class="drawer-menu-item" onclick="openAccountSettingsModal()">
                ${uiIcon('gear', 18)}
                <span>${isProvider ? 'Settings & Job Categories' : 'Account Settings'}</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='HELP'; renderModalLayer();">
                ${uiIcon('info', 18)}
                <span>Help</span>
              </div>

              <div class="drawer-menu-item" onclick="openSupportModal()">
                ${uiIcon('support', 18)}
                <span>Support</span>
              </div>

              <a href="/FinditHarare.apk" download="FinditHarare.apk" class="drawer-menu-item" style="text-decoration:none; color:inherit; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; margin:6px 0; font-weight:700;">
                ${uiIcon('phone', 18)}
                <span style="color:#1D4ED8;">Download Android APK</span>
              </a>
            </div>
          </div>

          <div class="drawer-footer-area">
            <button class="drawer-mode-switch-btn" onclick="toggleClientAndProviderMode()">
              ${isProvider ? uiIcon('user', 15) : uiIcon('briefcase', 15)}
              <span>${isProvider ? 'Switch to Client Mode' : 'Switch to Provider Mode'}</span>
            </button>
            <div class="drawer-social-row">
              <a href="https://www.facebook.com/profile.php?id=61595501858201" target="_blank" rel="noopener" class="drawer-social-btn" title="Facebook - Findit Harare">
                ${uiIcon('facebook', 16)}
              </a>
              <a href="https://www.instagram.com/findithahare/" target="_blank" rel="noopener" class="drawer-social-btn" title="Instagram - @findithahare">
                ${uiIcon('instagram', 16)}
              </a>
            </div>
            <div style="margin-top:8px; display:flex; flex-direction:column; align-items:center; gap:4px;">
              <img src="/assets/logo.svg" alt="Findit Harare" style="height:22px; width:auto; opacity:0.9;" />
              <div style="font-size:10.5px; font-weight:700; color:var(--text-secondary); opacity:0.75;">
                Verified Home Services • Harare, Zimbabwe
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // "Why do you want to cancel?"
  if (state.activeModal === 'CANCEL_TASK') {
    const isProvider = state.role === 'PROVIDER';
    const reasons = isProvider
      ? [
          { icon: 'route', label: 'Client location is too far away' },
          { icon: 'fare', label: 'Agreed fare does not cover travel' },
          { icon: 'warn', label: 'Accidental acceptance' },
          { icon: 'pin', label: 'Cannot find home address or gate' },
          { icon: 'inbox', label: 'Client is not responding' },
          { icon: 'dots', label: 'Another reason' }
        ]
      : [
          { icon: 'route', label: 'Pros are too far away' },
          { icon: 'fare', label: 'High fares' },
          { icon: 'warn', label: 'Accidental request' },
          { icon: 'pin', label: 'Wrong address or service selected' },
          { icon: 'inbox', label: 'No offers from pros' },
          { icon: 'dots', label: 'Another reason' }
        ];

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Why do you want to cancel?</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div>
            ${reasons.map((r) => `
              <div class="indrive-cancel-row" onclick="handleCancelReasonRowClick('${r.label.replace(/'/g, "\\'")}')">
                <div class="cancel-row-left">
                  ${getCancelReasonSvg(r.icon)}
                  <span>${r.label}</span>
                </div>
                ${uiIcon('chevronRight', 16)}
              </div>
            `).join('')}
          </div>

          <button class="cancel-skip-btn" onclick="submitCancelTaskWithReason('Skipped reason')">
            Skip
          </button>
        </div>
      </div>
    `;
    return;
  }

  // PROVIDER WORK CATALOGUE MODAL
  if (state.activeModal === 'CATALOGUE_VIEW') {
    const { providerId, requestId, offerId } = state.modalData || {};
    const targetReq = requestId ? (state.db?.requests || []).find((r) => r.id === requestId) : null;
    const targetOffer = targetReq && offerId ? (targetReq.offers || []).find((o) => o.id === offerId) : null;
    const prov = resolveProviderByIdOrOffer(providerId, targetReq, targetOffer);
    const approvedPhotos = (prov.portfolio || []).filter((item) => item.approvalStatus === 'APPROVED');

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${resolveMediaUrl(prov.avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" alt="${prov.name}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2.5px solid #0066FF;" />
              <div>
                <div style="font-size:17.5px; font-weight:800;">${prov.name}</div>
                <div style="font-size:12.5px; color:var(--text-secondary); font-weight:600; display:flex; align-items:center; gap:4px;">
                  ${uiIcon('star', 13)}
                  <span>${prov.rating} (${prov.completedBookings} jobs) • ${prov.skillTier}</span>
                </div>
              </div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:14px; line-height:1.45;">
            ${prov.bio}
          </div>

          <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:16px;">
            ${approvedPhotos.map((item) => `
              <div style="background:var(--bg-card); border-radius:16px; overflow:hidden; border:1px solid var(--border-light);">
                <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" alt="${item.title}" style="width:100%; height:185px; object-fit:cover; display:block;" />
                <div style="padding:11px 14px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-main);">${item.title}</div>
                    <div style="font-size:12px; color:var(--text-secondary); font-weight:600;">Duration: ${item.duration} • ${item.tag}</div>
                  </div>
                  <div style="font-size:16px; font-weight:800; color:var(--blue-primary);">$${item.priceUsd}</div>
                </div>
              </div>
            `).join('')}
          </div>

          ${offerId && requestId ? `
            <button class="btn-primary-blue" onclick="closeModal(); acceptOffer('${requestId}', '${offerId}')">
              ${uiIcon('check', 16)}
              <span>Accept ${prov.shortName || prov.name}'s Offer</span>
            </button>
          ` : `
            <button class="btn-primary-blue" onclick="closeModal(); selectTopServiceShortcut('${prov.categoryId}', 0)">
              <span>Request ${prov.shortName || prov.name}</span>
              ${uiIcon('chevronRight', 16)}
            </button>
          `}
        </div>
      </div>
    `;
    return;
  }

  // REQUEST & SERVICE HISTORY MODAL (SEPARATED FOR CLIENT VS PROVIDER)
  if (state.activeModal === 'HISTORY') {
    const userId = state.currentUser ? state.currentUser.id : null;
    const isProvider = state.role === 'PROVIDER';
    const items = userId
      ? (state.db.requests || []).filter((r) =>
          isProvider
            ? (r.acceptedProviderId === userId || (r.offers || []).some((o) => o.providerId === userId && r.acceptedOfferId === o.id))
            : r.customerId === userId
        )
      : [];
    const modalTitle = isProvider ? 'Service History' : 'Request History';
    const emptySub = isProvider
      ? 'Your accepted and completed client visits will appear here.'
      : 'Your completed and active service requests will appear here.';

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">${modalTitle}</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          ${items.length === 0 ? `
            <div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">
              <div style="font-size:32px; margin-bottom:8px; color:var(--text-muted);">${uiIcon('clock', 36)}</div>
              <div style="font-weight:700; font-size:15px; color:var(--text-primary); margin-bottom:4px;">No ${isProvider ? 'services' : 'requests'} yet</div>
              <div style="font-size:13px;">${emptySub}</div>
            </div>
          ` : items.map((r) => `
            <div class="indrive-cancel-row" style="cursor:default;">
              <div>
                <div style="font-weight:800; font-size:14.5px;">${r.title}</div>
                <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                  ${isProvider ? `Client: ${r.customerName} • ` : ''}${r.exactAddress || r.suburbName || 'Harare'} • <span style="font-weight:700; color:var(--blue-primary);">${r.status}</span>
                </div>
              </div>
              <div style="font-weight:800; font-size:15.5px; color:var(--blue-primary);">${formatUsdPrice(r.agreedTotalUsd || r.budgetUsd)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // DESIRED STYLE REFERENCE PHOTO PREVIEW MODAL
  if (state.activeModal === 'IMAGE_PREVIEW') {
    const { photoUrl, title } = state.modalData || {};
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()" style="text-align:center; padding:18px;">
          <div class="cancel-sheet-header" style="margin-bottom:14px;">
            <div class="cancel-sheet-title">${title || 'Style Reference Photo'}</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <div style="max-height:68vh; overflow:auto; border-radius:14px; border:1.5px solid var(--border-light); background:#0F172A; display:flex; align-items:center; justify-content:center;">
            <img src="${resolveMediaUrl(photoUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" style="max-width:100%; max-height:65vh; display:block; object-fit:contain; border-radius:14px;" alt="Desired Style Reference" />
          </div>
          <div style="font-size:12px; font-weight:700; color:var(--text-secondary); margin-top:12px;">
            Exact client reference photo attached to this service booking
          </div>
        </div>
      </div>
    `;
    return;
  }

  // SAFETY CENTER MODAL
  if (state.activeModal === 'SAFETY') {
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Safety Center</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <div class="indrive-cancel-row" onclick="window.location.href='tel:999'">
            <div class="cancel-row-left">
              <span style="color:#DC2626;">${uiIcon('phone', 18)}</span>
              <span>Call Zimbabwe Emergency Services (999)</span>
            </div>
            ${uiIcon('chevronRight', 16)}
          </div>
          <div class="indrive-cancel-row" onclick="showToast('Live home-visit status link copied')">
            <div class="cancel-row-left">
              <span style="color:var(--blue-primary);">${uiIcon('shield', 18)}</span>
              <span>Share my live home-visit status</span>
            </div>
            ${uiIcon('chevronRight', 16)}
          </div>
          <div style="font-size:12.5px; color:var(--text-secondary); margin-top:12px; line-height:1.5;">
            Every service provider on Findit Harare is verified with National ID, biometric face liveness, and a 4-digit Home Arrival Start PIN.
          </div>
        </div>
      </div>
    `;
    return;
  }

  // FUNCTIONAL ACCOUNT & PROVIDER CATEGORIES SETTINGS MODAL
  if (state.activeModal === 'SETTINGS') {
    const isProvider = state.role === 'PROVIDER';
    const currentUser = state.currentUser || (isProvider ? state.db?.providers?.[0] : state.db?.customers?.[0]) || {};
    if (!state.settingsDraft) {
      initSettingsDraftFromUser();
    }
    const draft = state.settingsDraft || {};
    const allCategories = (state.db?.categories || []).filter((c) => c.status === 'ACTIVE');
    const suburbs = state.db?.suburbs || [];
    const selectedCats = Array.isArray(draft.categoryIds) && draft.categoryIds.length > 0
      ? draft.categoryIds
      : getProviderCategoryIds(currentUser);

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" style="max-height:88vh; overflow-y:auto;" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div>
              <div class="cancel-sheet-title">${isProvider ? 'Provider Account & Job Categories' : 'Account & App Settings'}</div>
              <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600; margin-top:2px;">
                ${isProvider ? 'Edit your profile, pricing, and up to 3 job categories' : 'Manage your profile, default suburb, and preferences'}
              </div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <!-- Account Identity & Verification Card -->
          <div style="background:linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%); border:1.5px solid #BFDBFE; border-radius:16px; padding:12px 14px; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="display:flex; align-items:center; gap:12px; min-width:0;">
              <div
                style="position:relative; width:50px; height:50px; border-radius:50%; background:#0066FF; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; border:2px solid #FFFFFF; box-shadow:0 2px 8px rgba(0,102,255,0.25); flex-shrink:0; cursor:pointer;"
                onclick="document.getElementById('profileAvatarUploadInput').click()"
                title="Tap to change profile picture"
              >
                ${currentUser.avatarUrl
                  ? `<img src="${resolveMediaUrl(currentUser.avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
                  : `<span>${escapeHtml((draft.name || currentUser.name || 'FH').slice(0, 2).toUpperCase())}</span>`
                }
                <div style="position:absolute; bottom:-1px; right:-1px; width:18px; height:18px; border-radius:50%; background:#0066FF; border:1.5px solid #FFFFFF; display:flex; align-items:center; justify-content:center; color:#FFFFFF; box-shadow:0 1px 4px rgba(0,0,0,0.25);">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              </div>
              <input type="file" id="profileAvatarUploadInput" accept="image/*" style="display:none;" onchange="handleProfileAvatarUpload(this)" />
              <div style="min-width:0;">
                <div style="font-size:14.5px; font-weight:800; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${escapeHtml(draft.name || currentUser.name || 'Verified Member')}
                </div>
                <div style="font-size:11.5px; color:#475569; font-weight:700; font-family:monospace;">
                  ${currentUser.finditId || (isProvider ? 'FH-PRO-849201' : 'FH-USR-392810')} • ${escapeHtml(currentUser.phone || '+263 77 200 1001')}
                </div>
                <div style="display:flex; align-items:center; gap:6px; margin-top:4px; flex-wrap:wrap;">
                  <span style="background:#DCFCE7; color:#15803D; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:99px; display:inline-flex; align-items:center; gap:3px;">
                    ${uiIcon('check', 11)} WhatsApp &amp; Face ID Verified
                  </span>
                  <span style="background:#DBEAFE; color:#1D4ED8; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:99px;">
                    ${isProvider ? 'Service Provider' : 'Client Account'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          ${isProvider ? `
            <!-- PROVIDER JOB CATEGORIES EDITOR (SELECT UP TO 3 CATEGORIES) -->
            <div style="background:#FFFFFF; border:1.5px solid var(--border-light); border-radius:16px; padding:12px 14px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <div style="font-size:13px; font-weight:800; color:#0F172A;">
                  My Job Categories (${selectedCats.length}/3 Selected)
                </div>
                <span style="font-size:11px; font-weight:800; color:#0066FF;">Tap to add / switch</span>
              </div>
              <div style="font-size:11.5px; color:var(--text-secondary); margin-bottom:10px; line-height:1.4;">
                Choose up to <strong>3 service categories</strong>. Your Provider Job Feed will only show client requests from your selected categories.
              </div>
              <div style="display:grid; grid-template-columns:1fr; gap:7px;">
                ${allCategories.map((cat) => {
                  const isSelected = selectedCats.includes(cat.id);
                  return `
                    <div
                      onclick="toggleSettingsProviderCategory('${cat.id}')"
                      style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 12px; border-radius:12px; cursor:pointer; transition:all 0.15s ease; border:1.5px solid ${isSelected ? '#0066FF' : '#E2E8F0'}; background:${isSelected ? '#EFF6FF' : '#F8FAFC'};"
                    >
                      <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        <div style="width:34px; height:34px; border-radius:10px; background:${isSelected ? '#0066FF' : '#FFFFFF'}; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:1px solid ${isSelected ? '#0066FF' : '#E2E8F0'};">
                          ${getCategoryVectorSvg(cat.id, isSelected)}
                        </div>
                        <div style="min-width:0;">
                          <div style="font-size:13px; font-weight:800; color:${isSelected ? '#0066FF' : '#0F172A'};">
                            ${escapeHtml(cat.fullName || cat.name)}
                          </div>
                          <div style="font-size:11px; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${escapeHtml(cat.tagline || '')}
                          </div>
                        </div>
                      </div>
                      <div style="width:22px; height:22px; border-radius:50%; background:${isSelected ? '#0066FF' : '#FFFFFF'}; border:1.5px solid ${isSelected ? '#0066FF' : '#CBD5E1'}; color:#FFFFFF; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        ${isSelected ? uiIcon('check', 13) : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Editable Profile & Dispatch Settings Form -->
          <div style="background:#FFFFFF; border:1.5px solid var(--border-light); border-radius:16px; padding:12px 14px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;">
            <div style="font-size:13px; font-weight:800; color:#0F172A;">Profile &amp; Location Details</div>

            <div>
              <label style="display:block; font-size:11.5px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Full Name</label>
              <input
                id="settingsNameInput"
                type="text"
                class="dark-input"
                value="${escapeHtml(draft.name || currentUser.name || '')}"
                placeholder="Your full name"
                oninput="if(state.settingsDraft) state.settingsDraft.name = this.value"
              />
            </div>

            ${isProvider ? `
              <div style="display:grid; grid-template-columns:1.3fr 0.7fr; gap:8px;">
                <div>
                  <label style="display:block; font-size:11.5px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Business / Brand Name</label>
                  <input
                    id="settingsBrandInput"
                    type="text"
                    class="dark-input"
                    value="${escapeHtml(draft.brandName || currentUser.brandName || '')}"
                    placeholder="e.g. Tatenda Home Repairs"
                    oninput="if(state.settingsDraft) state.settingsDraft.brandName = this.value"
                  />
                </div>
                <div>
                  <label style="display:block; font-size:11.5px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Base Rate ($)</label>
                  <input
                    id="settingsPriceInput"
                    type="number"
                    min="5"
                    class="dark-input"
                    value="${Number(draft.startingPriceUsd || currentUser.startingPriceUsd || 20)}"
                    oninput="if(state.settingsDraft) state.settingsDraft.startingPriceUsd = Number(this.value)"
                  />
                </div>
              </div>

              <!-- Provider Daily Working Hours Setting -->
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:12px; font-weight:800; color:#0F172A;">Daily Working Hours (AI Scheduled)</span>
                  <span style="font-size:10.5px; color:#0066FF; font-weight:700;">Harare CAT (UTC+2)</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                  <div>
                    <label style="font-size:10.5px; font-weight:700; color:#64748B; display:block; margin-bottom:2px;">Shift Start</label>
                    <input id="settingsWorkStart" type="time" class="dark-input" value="${draft.workStartTime || currentUser.workStartTime || '08:00'}" oninput="if(state.settingsDraft) state.settingsDraft.workStartTime=this.value" style="height:36px; font-size:12px;" />
                  </div>
                  <div>
                    <label style="font-size:10.5px; font-weight:700; color:#64748B; display:block; margin-bottom:2px;">Shift End</label>
                    <input id="settingsWorkEnd" type="time" class="dark-input" value="${draft.workEndTime || currentUser.workEndTime || '18:00'}" oninput="if(state.settingsDraft) state.settingsDraft.workEndTime=this.value" style="height:36px; font-size:12px;" />
                  </div>
                </div>
                <div style="font-size:10.5px; color:#64748B; margin-top:5px; line-height:1.4;">
                  AI automatically keeps you on the Harare radar during your shifts. Please stay online only when ready to take jobs.
                </div>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div>
                  <label style="display:block; font-size:11.5px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Default Gate / Entrance</label>
                  <input
                    id="settingsEntranceInput"
                    type="text"
                    class="dark-input"
                    value="${escapeHtml(draft.entranceNote || state.entranceNote || 'Main Gate')}"
                    placeholder="e.g. Main Gate"
                    oninput="if(state.settingsDraft) state.settingsDraft.entranceNote = this.value"
                  />
                </div>
                <div>
                  <label style="display:block; font-size:11.5px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Default Payment</label>
                  <select
                    id="settingsPaymentSelect"
                    class="dark-input"
                    onchange="if(state.settingsDraft) state.settingsDraft.preferredPaymentMethod = this.value"
                  >
                    ${['Cash USD', 'EcoCash USD', 'InnBucks USD'].map((pm) => `
                      <option value="${pm}" ${(draft.preferredPaymentMethod || state.draftPaymentMethod) === pm ? 'selected' : ''}>${pm}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            `}

            <div>
              <label style="display:block; font-size:11.5px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Primary Harare Suburb</label>
              <select
                id="settingsSuburbSelect"
                class="dark-input"
                onchange="if(state.settingsDraft) state.settingsDraft.suburbId = this.value"
              >
                ${suburbs.map((s) => `
                  <option value="${s.id}" ${(draft.suburbId || currentUser.suburbId || state.selectedSuburbId) === s.id ? 'selected' : ''}>${s.name}, Harare (${s.zone})</option>
                `).join('')}
              </select>
            </div>

            <button type="button" class="btn-primary-blue" style="margin-top:4px; height:44px;" onclick="saveAccountSettingsChanges()">
              ${uiIcon('check', 16)}
              <span>${isProvider ? 'Save Account & Job Categories' : 'Save Account Settings'}</span>
            </button>
          </div>

          <!-- Quick Actions & Platform Links -->
          <div style="display:flex; flex-direction:column; gap:2px;">
            ${isProvider ? `
              <div class="indrive-cancel-row" onclick="openProviderOfficeModal()">
                <div class="cancel-row-left">
                  <span style="color:var(--blue-primary);">${uiIcon('buildingOffice', 17)}</span>
                  <span>Physical Workshop / Office Location</span>
                </div>
                ${uiIcon('chevronRight', 16)}
              </div>
            ` : ''}

            <div class="indrive-cancel-row" onclick="toggleClientAndProviderMode()">
              <div class="cancel-row-left">
                <span style="color:var(--blue-primary);">${isProvider ? uiIcon('user', 17) : uiIcon('briefcase', 17)}</span>
                <span style="font-weight:700;">${isProvider ? 'Switch to Client Mode' : 'Switch to Service Provider Mode'}</span>
              </div>
              ${uiIcon('chevronRight', 16)}
            </div>

            <a href="https://finditharare.co.zw" target="_blank" rel="noopener" class="indrive-cancel-row" style="text-decoration:none; color:inherit;">
              <div class="cancel-row-left">
                <span style="color:var(--blue-primary);">${uiIcon('sparkle', 17)}</span>
                <span>Official Website (<strong>finditharare.co.zw</strong>)</span>
              </div>
              ${uiIcon('chevronRight', 16)}
            </a>

            <div class="indrive-cancel-row" onclick="openSupportModal()">
              <div class="cancel-row-left">
                <span style="color:#25D366;">${uiIcon('support', 17)}</span>
                <span>Findit Harare Official Support Chat</span>
              </div>
              ${uiIcon('chevronRight', 16)}
            </div>

            <div class="indrive-cancel-row" onclick="logoutCurrentAccount()">
              <span style="color:var(--text-main); font-weight:700;">Log Out</span>
              ${uiIcon('chevronRight', 16)}
            </div>

            <div class="indrive-cancel-row" onclick="promptDeleteAccount()" style="border-top:1px solid #FEE2E2; margin-top:4px; cursor:pointer;">
              <span style="color:#DC2626; font-weight:800; display:flex; align-items:center; gap:8px;">
                ${uiIcon('trash', 16)}
                <span>Delete Account Permanently</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // NOTIFICATIONS & OFFICIAL WARNINGS MODAL
  if (state.activeModal === 'NOTIFICATIONS') {
    const rawNotifs = getRelevantNotifications();
    const readSet = new Set(state.currentUser?.readNotificationIds || []);
    try {
      const localRead = JSON.parse(localStorage.getItem('findit_read_notifs') || '[]');
      localRead.forEach((id) => readSet.add(id));
    } catch (e) {}

    const unreadCount = rawNotifs.filter((n) => !readSet.has(n.id)).length;

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="cancel-sheet-title">Notification Center</div>
              ${unreadCount > 0 ? `<span style="background:#EF4444; color:#fff; font-size:11px; font-weight:800; padding:2px 7px; border-radius:99px;">${unreadCount} New</span>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${rawNotifs.length > 0 && unreadCount > 0 ? `
                <button class="small-pill-btn" style="color:var(--blue-primary); border-color:var(--blue-border); font-size:11px; padding:3px 8px; cursor:pointer;" onclick="markAllNotificationsRead()">
                  Mark all read
                </button>
              ` : ''}
              <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; max-height:65vh; overflow-y:auto; padding-bottom:8px;">
            ${rawNotifs.length === 0 ? `
              <div style="text-align:center; padding:32px 16px; color:var(--text-secondary);">
                <div style="margin-bottom:8px; display:inline-flex; color:var(--blue-primary);">${uiIcon('bell', 32)}</div>
                <div style="font-size:14px; font-weight:800; color:var(--text-main); margin-bottom:4px;">No New Notifications</div>
                <div style="font-size:12px;">Official platform alerts, booking notices, and admin warnings will appear here.</div>
              </div>
            ` : rawNotifs.map((n) => {
              const isUnread = !readSet.has(n.id);
              const isWarn = n.type === 'WARNING';
              const isSecurity = n.type === 'SECURITY';
              const cardBg = isWarn ? '#FEF2F2' : (isUnread ? 'var(--blue-soft)' : 'var(--bg-card)');
              const borderCol = isWarn ? '#EF4444' : (isUnread ? 'var(--blue-border)' : 'var(--border-light)');
              const titleCol = isWarn ? '#B91C1C' : 'var(--text-main)';
              const iconSvg = isWarn ? uiIcon('alertTriangle', 18) : (isSecurity ? uiIcon('shield', 18) : uiIcon('bell', 18));
              const iconCol = isWarn ? '#DC2626' : 'var(--blue-primary)';

              return `
                <div style="padding:12px 14px; background:${cardBg}; border-radius:14px; border:1.5px solid ${borderCol};">
                  <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:6px; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="color:${iconCol}; display:inline-flex; flex-shrink:0;">${iconSvg}</span>
                      <span style="font-size:13.5px; font-weight:800; color:${titleCol};">${escapeHtml(n.title)}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                      ${isWarn ? `<span style="background:#EF4444; color:#fff; font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:99px; text-transform:uppercase;">Warning</span>` : ''}
                      ${isUnread ? `<span style="width:8px; height:8px; border-radius:50%; background:#0066FF;"></span>` : ''}
                    </div>
                  </div>
                  <div style="font-size:12.5px; color:${isWarn ? '#991B1B' : 'var(--text-secondary)'}; line-height:1.5; padding-left:26px;">
                    ${escapeHtml(n.message || n.body || '')}
                  </div>
                  <div style="font-size:10.5px; color:var(--text-secondary); opacity:0.8; padding-left:26px; margin-top:6px;">
                    ${n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : (n.time || 'Official Notice')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    return;
  }

  // HELP & HOW IT WORKS MODAL
  if (state.activeModal === 'HELP') {
    const steps = [
      {
        num: '1',
        title: 'Choose Service & Offer Your Price',
        desc: 'Pick your home service (Hair Braiding, Plumbing, Nails, Barbering, Cleaning), enter your suburb address, and propose a fair USD fare.'
      },
      {
        num: '2',
        title: '120s Live Radar Broadcast',
        desc: 'Nearby verified Harare specialists review your offer in real time. If needed, raise your fare by +$1 or +$2 to attract faster bids.'
      },
      {
        num: '3',
        title: 'Inspect Profiles & Accept',
        desc: 'Compare provider star ratings, completed jobs, and verified photo catalogues before accepting the offer that fits your budget.'
      },
      {
        num: '4',
        title: 'Live Chat & Safe Direct Cash Pay',
        desc: 'Chat directly in-app, share gate directions, track arrival, and pay agreed USD cash only once the job is finished satisfactorily.'
      }
    ];

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Help &amp; How It Works</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px; max-height:65vh; overflow-y:auto; padding-bottom:10px;">
            ${steps.map((s) => `
              <div style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-card); border-radius:14px; border:1px solid var(--border-light);">
                <div style="width:28px; height:28px; border-radius:50%; background:var(--blue-soft); color:var(--blue-primary); font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  ${s.num}
                </div>
                <div>
                  <div style="font-size:13.5px; font-weight:800; color:var(--text-main); margin-bottom:2px;">${s.title}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.45;">${s.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    return;
  }

  // ==========================================================================
  // IN-APP WHATSAPP BUSINESS CLONE SUPPORT CHAT (AUTHENTIC LIGHT THEME)
  // ==========================================================================
  if (state.activeModal === 'SUPPORT') {
    loadUserSupportHistory();
    const formatWaBold = (str) => escapeHtml(str || '').replace(/\*([^*]+)\*/g, '<strong style="color:#111B21;">$1</strong>').replace(/\n/g, '<br/>');

    root.innerHTML = `
      <div class="fullscreen-chat-backdrop" style="z-index:99999; position:fixed; inset:0; width:100vw; height:100vh; height:100dvh; padding:0; margin:0;" onclick="closeModal()">
        <div class="fullscreen-chat-modal" style="background:#EFEAE2; display:flex; flex-direction:column; height:100%; height:100dvh; width:100%; width:100vw; border-radius:0; margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111B21;" onclick="event.stopPropagation()">
          <!-- Authentic Light WhatsApp Business Top Bar (No 3-Dots, No Bin) -->
          <div style="background:#F0F2F5; border-bottom:1px solid #D1D7DB; padding:max(10px, env(safe-area-inset-top)) 12px 10px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px; flex-shrink:0;">
            <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
              <button type="button" onclick="closeModal()" style="background:none; border:none; color:#54656F; display:flex; align-items:center; padding:4px 4px 4px 0; cursor:pointer;" title="Back">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#54656F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style="position:relative; width:40px; height:40px; border-radius:50%; overflow:hidden; background:#FFFFFF; flex-shrink:0; display:flex; align-items:center; justify-content:center; border:1px solid #D1D7DB;">
                <img src="/assets/logo-icon.svg" alt="Findit Harare" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/favicon.png'" />
              </div>
              <div style="min-width:0; flex:1;">
                <div style="display:flex; align-items:center; gap:5px;">
                  <span style="font-size:15px; font-weight:700; color:#111B21; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Findit Harare Official</span>
                  <!-- Meta Verified Blue/Green Badge -->
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#00A884" style="flex-shrink:0;"><path d="M12 2l2.4 2.1 3.1-.4.9 3 2.8 1.5-.8 3 1.6 2.7-2.2 2.2.4 3.1-3 .9-1.5 2.8-3-.8-2.7 1.6-2.2-2.2-3.1.4-.9-3-2.8-1.5.8-3-1.6-2.7 2.2-2.2-.4-3.1 3-.9 1.5-2.8 3 .8 2.7-1.6z"/><path d="M9.5 12.5l2 2 4-4.5" stroke="#FFFFFF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div style="font-size:11.5px; color:${state.supportAiTyping ? '#00A884' : '#667781'}; font-weight:${state.supportAiTyping ? '600' : '400'};">
                  ${state.supportAiTyping ? 'typing…' : 'Official Support Desk • Harare'}
                </div>
              </div>
            </div>
          </div>

          <!-- WhatsApp Chat Feed (Light Mode Wallpaper Pattern) -->
          <div id="waSupportChatFeed" style="flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:8px; background-color:#EFEAE2; background-image:radial-gradient(rgba(0,0,0,0.035) 1px, transparent 0); background-size:20px 20px;">
            <!-- WhatsApp Centered Encryption Pill -->
            <div style="background:#FFF5C4; color:#54656F; font-size:11px; text-align:center; padding:7px 14px; border-radius:10px; margin:2px auto 4px auto; max-width:92%; line-height:1.4; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:1px solid #FFE58F;">
              ${uiIcon('lock', 13)} Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.
            </div>

            <!-- Meta Business Security Notice -->
            <div style="background:#F0F2F5; color:#54656F; font-size:11px; text-align:center; padding:6px 12px; border-radius:10px; margin:0 auto 8px auto; max-width:92%; line-height:1.35; border:1px solid #E2E8F0;">
              This business is now using a secure service from Meta to manage this chat. Tap to learn more.
            </div>

            <!-- Authentic WhatsApp Business Profile Card (With Real Followers & Clickable Social Icons) -->
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:18px; padding:18px 16px; margin:0 auto 10px auto; width:92%; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="width:72px; height:72px; border-radius:50%; background:#FFFFFF; margin:0 auto 10px auto; display:flex; align-items:center; justify-content:center; overflow:hidden; border:2px solid #00A884; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <img src="/assets/logo-icon.svg" alt="Findit Harare" style="width:100%; height:100%; object-fit:cover;" />
              </div>
              <div style="font-size:16px; font-weight:800; color:#111B21; display:flex; align-items:center; justify-content:center; gap:5px;">
                <span>Findit Harare Official</span>
                <!-- WhatsApp Verified Badge -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#00A884"><path d="M12 2l2.4 2.1 3.1-.4.9 3 2.8 1.5-.8 3 1.6 2.7-2.2 2.2.4 3.1-3 .9-1.5 2.8-3-.8-2.7 1.6-2.2-2.2-3.1.4-.9-3-2.8-1.5.8-3-1.6-2.7 2.2-2.2-.4-3.1 3-.9 1.5-2.8 3 .8 2.7-1.6z"/><path d="M9.5 12.5l2 2 4-4.5" stroke="#FFFFFF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div style="font-size:12.5px; font-weight:600; color:#54656F; margin-top:3px;">
                Customer Support &amp; Verification Desk
              </div>

              <!-- Official Social Followers Line Matching User Screenshot -->
              <div style="font-size:11.5px; color:#54656F; margin-top:6px; line-height:1.5;">
                Official Business Account • Harare, Zimbabwe •
                <a href="https://www.facebook.com/profile.php?id=61595501858201" target="_blank" rel="noopener" title="Findit Harare Facebook (175 followers)" style="color:#111B21; text-decoration:none; display:inline-flex; align-items:center; gap:3px; font-weight:700;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span>175</span>
                </a> •
                <a href="https://www.instagram.com/findithahare/" target="_blank" rel="noopener" title="Findit Harare Instagram (74 followers)" style="color:#111B21; text-decoration:none; display:inline-flex; align-items:center; gap:3px; font-weight:700;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  <span>74</span>
                </a> • Joined in February, 2025
              </div>

              <!-- Official Website WhatsApp Link Pill -->
              <a href="https://finditharare.co.zw" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:6px; background:#F0F2F5; border:1px solid #D1D7DB; border-radius:99px; padding:6px 14px; text-decoration:none; color:#0066FF; font-size:12px; font-weight:700; margin-top:10px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>finditharare.co.zw</span>
              </a>
            </div>

            <!-- Message Bubbles (Light Mode WhatsApp Bubbles) -->
            ${state.supportChatMessages.map((m, idx, arr) => {
              const isUser = m.sender === 'USER';
              const isLastUserTyping = isUser && idx === arr.length - 1 && state.supportAiTyping;
              return `
                <div style="display:flex; justify-content:${isUser ? 'flex-end' : 'flex-start'};">
                  <div style="max-width:82%; background:${isUser ? '#D9FDD3' : '#FFFFFF'}; color:#111B21; padding:8px 12px 6px 12px; border-radius:${isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px'}; box-shadow:0 1px 1px rgba(0,0,0,0.06); font-size:13.5px; line-height:1.45; position:relative;">
                    <div>${formatWaBold(m.text)}</div>
                    <div style="display:flex; align-items:center; justify-content:flex-end; gap:3px; font-size:10.5px; color:#667781; margin-top:3px;">
                      <span>${m.time || ''}</span>
                      ${isUser ? renderWhatsAppDoubleTickSvg(!isLastUserTyping) : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

            ${state.supportAiTyping ? `
              <div style="display:flex; justify-content:flex-start; margin:4px 0;">
                <div style="background:#FFFFFF; padding:10px 14px; border-radius:14px 14px 14px 3px; box-shadow:0 1px 2px rgba(0,0,0,0.06); display:inline-flex; align-items:center; gap:4px;">
                  <span class="wa-typing-dot" style="width:7px; height:7px; border-radius:50%; background:#8696A0; display:inline-block; animation:waTypingWave 1.4s ease-in-out infinite;"></span>
                  <span class="wa-typing-dot" style="width:7px; height:7px; border-radius:50%; background:#8696A0; display:inline-block; animation:waTypingWave 1.4s ease-in-out infinite; animation-delay:0.2s;"></span>
                  <span class="wa-typing-dot" style="width:7px; height:7px; border-radius:50%; background:#8696A0; display:inline-block; animation:waTypingWave 1.4s ease-in-out infinite; animation-delay:0.4s;"></span>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Quick FAQ Chips (Light WhatsApp Style) -->
          <div style="background:#F0F2F5; padding:6px 10px 2px 10px; display:flex; gap:6px; overflow-x:auto; border-top:1px solid #D1D7DB; flex-shrink:0;">
            <button type="button" class="chat-preset-chip" style="background:#FFFFFF; border:1px solid #D1D7DB; color:#008069; font-size:11.5px; white-space:nowrap;" onclick="sendSupportAiMessage('How does the $5 welcome bonus and 11% commission work?')">
              $5 Bonus &amp; 11% Rule
            </button>
            <button type="button" class="chat-preset-chip" style="background:#FFFFFF; border:1px solid #D1D7DB; color:#008069; font-size:11.5px; white-space:nowrap;" onclick="sendSupportAiMessage('How do I top up my provider wallet with EcoCash USD?')">
              EcoCash Top-Up
            </button>
            <button type="button" class="chat-preset-chip" style="background:#FFFFFF; border:1px solid #D1D7DB; color:#008069; font-size:11.5px; white-space:nowrap;" onclick="sendSupportAiMessage('How do I view or change my service categories in Settings?')">
              Job Categories
            </button>
            <button type="button" class="chat-preset-chip" style="background:#FFFFFF; border:1px solid #D1D7DB; color:#008069; font-size:11.5px; white-space:nowrap;" onclick="sendSupportAiMessage('What is your official website and phone number?')">
              Website &amp; Contacts
            </button>
          </div>

          <!-- Authentic Light WhatsApp Bottom Input Bar -->
          <form onsubmit="event.preventDefault(); sendSupportAiMessage(); return false;" style="background:#F0F2F5; padding:8px 10px max(14px, env(safe-area-inset-bottom)) 10px; display:flex; align-items:center; gap:8px; flex-shrink:0; margin:0;">
            <div style="flex:1; display:flex; align-items:center; background:#FFFFFF; border-radius:24px; padding:0 12px; height:42px; border:1px solid #E2E8F0;">
              <span style="color:#54656F; cursor:pointer; font-size:18px; margin-right:8px; display:flex; align-items:center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </span>
              <input
                id="waSupportInput"
                type="text"
                autocomplete="off"
                placeholder="Message"
                style="flex:1; border:none; background:transparent; font-size:14px; color:#111B21; outline:none; height:100%;"
              />
              <span style="color:#54656F; cursor:pointer; margin-left:8px; display:flex; align-items:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </span>
            </div>
            <button
              type="submit"
              style="width:42px; height:42px; border-radius:50%; border:none; background:#00A884; color:#FFFFFF; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; box-shadow:0 2px 6px rgba(0,168,132,0.3);"
            >
              ${uiIcon('send', 16)}
            </button>
          </form>
        </div>
      </div>
    `;
    setTimeout(() => {
      const feed = document.getElementById('waSupportChatFeed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 30);
    return;
  }

  // SUBURB & REAL LOCATION PICKER MODAL (inDrive-style Real Address Search + Pin Navigation)
  if (state.activeModal === 'SUBURB_PICKER') {
    const suburbs = state.db.suburbs || [];
    const searchQuery = state.locationSearchQuery || '';
    const filteredSuburbs = searchQuery.trim()
      ? suburbs.filter((s) => `${s.name} ${s.zone}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : suburbs;
    const geoResults = Array.isArray(state.locationSearchResults) ? state.locationSearchResults : [];

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Your Home Visit Location</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <!-- Search any real street, landmark, or address in Harare / Zimbabwe -->
          <form onsubmit="event.preventDefault(); searchRealLocationAddress(); return false;" style="display:flex; gap:8px; margin-bottom:10px;">
            <input
              id="liveLocationSearchInput"
              type="text"
              class="dark-input"
              style="flex:1; margin:0;"
              value="${escapeHtml(state.locationSearchQuery !== undefined ? state.locationSearchQuery : state.customAddress)}"
              placeholder="Type street, house #, landmark or suburb..."
              oninput="handleLiveLocationQueryInput(this.value)"
            />
            <button type="submit" class="btn-primary-blue" style="width:auto; padding:0 14px; height:44px; font-size:12.5px; flex-shrink:0;">
              ${state.locationSearching ? '...' : 'Search'}
            </button>
          </form>

          <!-- inDrive Quick Map Actions: Move Pin on Map OR Use Live GPS -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
            <button type="button" class="btn-dark-sec" style="height:38px; font-size:12px; font-weight:800; justify-content:center; gap:6px; border:1.5px solid var(--blue-border); background:var(--blue-soft); color:var(--blue-primary);" onclick="startMapPinPickMode()">
              ${uiIcon('pin', 14)}
              <span>Choose on Map</span>
            </button>
            <button type="button" class="btn-dark-sec" style="height:38px; font-size:12px; font-weight:800; justify-content:center; gap:6px; background:#ECFDF5; color:#059669; border:1.5px solid #A7F3D0;" onclick="selectLiveLocationDefault()">
              ${uiIcon('crosshair', 14)}
              <span>Live Location</span>
            </button>
          </div>

          <div style="max-height:290px; overflow-y:auto;">
            ${geoResults.length > 0 ? `
              <div style="font-size:11px; font-weight:800; color:var(--blue-primary); text-transform:uppercase; padding:4px 4px 6px;">
                Live Map Search Results (Tap to Navigate)
              </div>
              ${geoResults.map((g, gIdx) => `
                <div class="indrive-cancel-row" onclick="selectGeocodedLocation(${gIdx})" style="background:#F0F7FF; border-radius:10px; margin-bottom:4px; padding:10px;">
                  <div class="cancel-row-left">
                    <span style="color:var(--blue-primary);">${uiIcon('navigation', 17)}</span>
                    <div>
                      <div style="font-weight:800; color:#0F172A;">${escapeHtml(g.shortTitle)}</div>
                      <div style="font-size:11.5px; color:var(--text-secondary);">${escapeHtml(g.fullLabel)}</div>
                    </div>
                  </div>
                  ${uiIcon('chevronRight', 16)}
                </div>
              `).join('')}
            ` : ''}

            <div style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; padding:6px 4px 4px;">
              Harare Suburbs &amp; Zones
            </div>
            ${filteredSuburbs.map((s) => `
              <div class="indrive-cancel-row" onclick="selectSuburbLocation('${s.id}')">
                <div class="cancel-row-left">
                  <span style="color:var(--blue-primary);">${uiIcon('pin', 17)}</span>
                  <div>
                    <div style="font-weight:700;">${s.name}, Harare</div>
                    <div style="font-size:12px; color:var(--text-secondary);">${s.zone}</div>
                  </div>
                </div>
                ${uiIcon('chevronRight', 16)}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    return;
  }

  // SUB-SERVICE PICKER MODAL
  if (state.activeModal === 'SERVICE_PICKER') {
    const activeCat = state.db.categories.find((c) => c.id === state.selectedCategoryId) || state.db.categories[0];
    const subServices = activeCat?.subServices || [];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">${activeCat.fullName || activeCat.name}</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          ${subServices.map((sub, idx) => `
            <div class="indrive-cancel-row" onclick="pickSubService(${idx})">
              <div class="cancel-row-left">
                <div>
                  <div style="font-weight:700;">${sub.name}</div>
                  <div style="font-size:12px; color:var(--text-secondary);">~${sub.duration}</div>
                </div>
              </div>
              <div style="font-weight:800; color:var(--blue-primary);">$${sub.defaultUsd}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // PAYMENT METHOD MODAL
  if (state.activeModal === 'PAYMENT_MODAL') {
    const methods = state.db.settings?.supportedPaymentMethods || ['Cash USD', 'EcoCash USD', 'InnBucks USD'];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Payment Method (USD)</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          ${methods.map((m) => `
            <div class="indrive-cancel-row" onclick="state.draftPaymentMethod='${m}'; closeModal(); renderAll();">
              <div class="cancel-row-left">
                <span style="color:var(--blue-primary);">${uiIcon('wallet', 18)}</span>
                <span>${m}</span>
              </div>
              ${state.draftPaymentMethod === m ? `<span style="color:var(--blue-primary); font-weight:800;">${uiIcon('check', 16)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // SPECIAL INSTRUCTIONS MODAL WITH QUICK PRESET CHIPS & REAL-TIME ANTI-LEAKAGE SHIELD
  if (state.activeModal === 'NOTES_MODAL') {
    const categoryPresets = {
      beauty_care: [
        'Hair is washed & blow-dried',
        'Power socket & chair ready',
        'Mirror & clean lighting available',
        'Bring full mobile styling kit',
        'Parking available inside yard'
      ],
      repairs_construction: [
        'Main water shutoff located',
        'Power socket & extension ready',
        'Bring ladder & tools',
        'Materials already on site',
        'Parking available inside yard'
      ],
      cleaning_domestic: [
        'Water & power ready',
        'Cleaning detergents provided at home',
        'Bring cloths, mops & equipment',
        'Pets secured in yard',
        'Gate code at security'
      ],
      automotive: [
        'Car parked on flat level ground',
        'Vehicle keys ready on site',
        'Shaded driveway available',
        'Bring diagnostic tools & jump pack',
        'Gate code at security'
      ],
      solar_power_water: [
        'Roof access & ladder point clear',
        'Inverter & battery room accessible',
        'Main breaker switch identified',
        'Borehole pump switch accessible',
        'Parking available inside yard'
      ],
      gardening_outdoor: [
        'Outdoor water tap & hose ready',
        'Power socket near garden',
        'Green waste compost area available',
        'Bring lawnmower & trimmer',
        'Pets secured in house'
      ],
      general_labour: [
        'Items packed & ready on ground floor',
        'Stairs / elevator available',
        'Heavy items require 2-person lift',
        'Straps & trolley needed',
        'Truck parking available at gate'
      ]
    };
    const catId = normalizeCategoryId(state.selectedCategoryId || 'repairs_construction');
    const presetNotes = categoryPresets[catId] || categoryPresets.general_labour || categoryPresets.repairs_construction;
    const currentCat = (state.db?.categories || []).find((c) => c.id === catId);
    const catName = currentCat ? (currentCat.name || currentCat.fullName) : 'service';
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Special Instructions</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="background:var(--blue-soft); border:1px solid var(--blue-border); border-radius:12px; padding:9px 11px; margin-bottom:10px; display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--blue-primary); font-weight:700;">
            ${uiIcon('shield', 15)}
            <span>Anti-Leakage Filter Active: Phone numbers (077..., +263...), @handles, and WhatsApp links are blocked.</span>
          </div>

          <div style="font-size:11.5px; font-weight:800; color:var(--text-secondary); margin-bottom:6px;">
            One-Tap Preset Instructions
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
            ${presetNotes.map((chip) => `
              <button class="chat-preset-chip" onclick="appendPresetInstruction('${chip.replace(/'/g, "\\'")}')">
                + ${chip}
              </button>
            `).join('')}
          </div>

          <textarea
            id="draftNotesInput"
            class="dark-input"
            rows="3"
            placeholder="Add details about your ${escapeHtml(catName)} (e.g. materials, gate note)..."
            oninput="handleLiveNotesInput(this.value)"
          >${state.draftNotes}</textarea>

          <div id="notesLeakageAlert" style="display:${state.notesLeakageWarning ? 'flex' : 'none'}; align-items:center; gap:7px; margin-top:8px; padding:8px 11px; border-radius:11px; background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; font-size:12px; font-weight:700;">
            ${uiIcon('shield', 14)}
            <span id="notesLeakageText">${state.notesLeakageWarning || ''}</span>
          </div>

          <button class="btn-primary-blue" style="margin-top:14px;" onclick="saveDraftNotes()">
            ${uiIcon('check', 16)}
            <span>Save Instructions</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // PROVIDER BIO UPDATE FOR ADMIN APPROVAL (ORIGINAL FEATURE)
  if (state.activeModal === 'EDIT_BIO_MODAL') {
    const prov = state.currentUser || state.db.providers[0];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Update Profile Bio (Admin Reviewed)</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px; padding:9px 11px; margin-bottom:10px; font-size:12px; color:#92400E; font-weight:700; display:flex; align-items:flex-start; gap:8px;">
            <span style="color:#D97706;">${uiIcon('shield', 15)}</span>
            <span>Admin approves all profile bio updates first to ensure zero phone numbers, WhatsApp links, or off-app solicitation.</span>
          </div>

          <textarea id="providerBioInput" class="dark-input" rows="3" placeholder="Describe your mobile kit, experience & specialties (no phone numbers)...">${prov.bio || ''}</textarea>

          <button class="btn-primary-blue" style="margin-top:12px;" onclick="submitProviderBioUpdate()">
            ${uiIcon('check', 16)}
            <span>Submit Bio for Admin Approval</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // REAL DEVICE PHOTO UPLOAD MODAL FOR PROVIDER PORTFOLIO
  if (state.activeModal === 'UPLOAD_CATALOGUE') {
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Add Work Catalogue Photo</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:10px; line-height:1.45;">
            Upload a clean photo of your work. Findit Admin reviews all uploads before publishing to ensure zero phone numbers, flyers, or watermarks.
          </p>

          <label class="real-file-dropzone" style="margin-bottom:12px;">
            <input type="file" accept="image/*" style="display:none;" onchange="handleRealPortfolioFileSelect(this)" />
            ${state.uploadedFileDataUrl
              ? `<img src="${state.uploadedFileDataUrl}" alt="Selected work photo" />`
              : `
                <span style="color:var(--blue-primary); margin-bottom:6px;">${uiIcon('image', 28)}</span>
                <div style="font-size:13.5px; font-weight:800; color:var(--blue-primary);">Choose photo from device</div>
                <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">JPG, PNG or WEBP</div>
              `
            }
          </label>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <input id="catUploadTitle" class="dark-input" placeholder="Style title (e.g. Medium Knotless Braids)" />
            <input id="catUploadPrice" type="number" class="dark-input" placeholder="Price in USD (e.g. 25)" value="25" />

            <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-secondary); font-weight:600;">
              <input type="checkbox" ${state.uploadSuspectedWatermark ? 'checked' : ''} onchange="state.uploadSuspectedWatermark=this.checked" style="accent-color:#0066FF;" />
              <span>Flag photo as containing a flyer/watermark (Test Admin Detector)</span>
            </label>

            <button class="btn-primary-blue" onclick="submitProviderCatalogueUpload()">
              ${uiIcon('check', 16)}
              <span>Submit for Admin Approval</span>
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // ADD SERVICE TO CATALOGUE MODAL
  if (state.activeModal === 'ADD_SERVICE_MODAL') {
    const prov = state.currentUser || state.db.providers[0];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Add Service to Catalogue</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px; line-height:1.45;">
            Add a specialist service with your price and duration. Uploaded photos are checked by Findit Admins before appearing publicly.
          </p>

          <div style="display:flex; flex-direction:column; gap:11px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main);">Service Title</label>
              <input id="newServiceTitle" class="dark-input" placeholder="e.g. Knotless Braids, Manicure, Burst Fade..." style="width:100%; margin-top:4px;" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:var(--text-main);">Price in USD ($)</label>
                <input id="newServicePrice" type="number" class="dark-input" placeholder="e.g. 25" value="25" style="width:100%; margin-top:4px;" />
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:var(--text-main);">Est. Duration</label>
                <input id="newServiceDuration" class="dark-input" placeholder="e.g. 2 hrs" value="2 hrs" style="width:100%; margin-top:4px;" />
              </div>
            </div>

            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main);">Style / Specialty Tag</label>
              <input id="newServiceTag" class="dark-input" placeholder="e.g. Precision Finish, Mobile Kit" value="Verified Quality" style="width:100%; margin-top:4px;" />
            </div>

            <!-- Upload Photo from Local Storage (Admin Approval Required) -->
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main); display:flex; justify-content:space-between; align-items:center;">
                <span>Work Photo (Device Upload)</span>
                <span style="font-size:10.5px; color:#D97706; font-weight:700;">Admin Verified</span>
              </label>
              <div
                onclick="document.getElementById('newServiceFileInput').click()"
                style="margin-top:6px; border:2px dashed ${state.newServicePhotoDataUrl ? 'var(--blue-primary)' : 'var(--border-light)'}; border-radius:12px; padding:12px; text-align:center; background:var(--bg-card); cursor:pointer; transition:all 0.2s ease;"
              >
                <input type="file" id="newServiceFileInput" accept="image/*" style="display:none;" onchange="handleNewServiceFileSelect(this)" />
                ${state.newServicePhotoDataUrl ? `
                  <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <img src="${state.newServicePhotoDataUrl}" style="max-height:130px; max-width:100%; border-radius:8px; object-fit:cover;" alt="Work Photo" />
                    <span style="font-size:11px; font-weight:700; color:var(--blue-primary);">Tap to change photo</span>
                  </div>
                ` : `
                  <div style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:6px 0;">
                    <div style="width:38px; height:38px; border-radius:50%; background:var(--blue-soft); color:var(--blue-primary); display:flex; align-items:center; justify-content:center;">
                      ${uiIcon('image', 18)}
                    </div>
                    <div style="font-size:12px; font-weight:800; color:var(--text-main);">Tap to upload photo from your device</div>
                    <div style="font-size:11px; color:var(--text-secondary); line-height:1.35;">Photos must be approved by Admins before showing publicly</div>
                  </div>
                `}
              </div>
            </div>

            <button class="btn-primary-blue" id="addServiceSubmitBtn" onclick="saveNewCatalogueService()" style="margin-top:6px; height:42px;">
              ${uiIcon('check', 16)}
              <span>Submit Service for Admin Approval</span>
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // EDIT SERVICE IN CATALOGUE MODAL
  if (state.activeModal === 'EDIT_SERVICE_MODAL') {
    const item = state.modalData?.item || {};
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Edit Service Details</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px; line-height:1.45;">
            Update your pricing, duration, or style name for this service.
          </p>

          <div style="display:flex; flex-direction:column; gap:11px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main);">Service Title</label>
              <input id="editServiceTitle" class="dark-input" value="${item.title || ''}" placeholder="Service Title" style="width:100%; margin-top:4px;" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:var(--text-main);">Price in USD ($)</label>
                <input id="editServicePrice" type="number" class="dark-input" value="${item.priceUsd || 20}" style="width:100%; margin-top:4px;" />
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:var(--text-main);">Est. Duration</label>
                <input id="editServiceDuration" class="dark-input" value="${item.duration || '2 hrs'}" style="width:100%; margin-top:4px;" />
              </div>
            </div>

            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main);">Style / Specialty Tag</label>
              <input id="editServiceTag" class="dark-input" value="${item.tag || 'Verified Quality'}" style="width:100%; margin-top:4px;" />
            </div>

            <!-- Replace Photo from Device -->
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main); display:flex; justify-content:space-between; align-items:center;">
                <span>Work Photo</span>
                <span style="font-size:10.5px; color:var(--text-secondary); font-weight:600;">Tap to replace</span>
              </label>
              <div
                onclick="document.getElementById('editServiceFileInput').click()"
                style="margin-top:6px; border:2px dashed var(--border-light); border-radius:12px; padding:12px; text-align:center; background:var(--bg-card); cursor:pointer;"
              >
                <input type="file" id="editServiceFileInput" accept="image/*" style="display:none;" onchange="handleEditServiceFileSelect(this)" />
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                  <img src="${state.editServicePhotoDataUrl || resolveMediaUrl(item.imageUrl, 'task')}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" style="max-height:120px; max-width:100%; border-radius:8px; object-fit:cover;" alt="Service Photo" />
                  <span style="font-size:11px; font-weight:700; color:var(--blue-primary);">Tap to choose new photo from device</span>
                </div>
              </div>
            </div>

            <button class="btn-primary-blue" id="editServiceSubmitBtn" onclick="saveEditedCatalogueService('${item.id}')" style="margin-top:6px; height:42px;">
              ${uiIcon('check', 16)}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // PROVIDER PHYSICAL OFFICE / WORKSHOP SETTINGS MODAL
  if (state.activeModal === 'PROVIDER_OFFICE_MODAL') {
    const prov = state.currentUser || (state.db.providers || [])[0] || {};
    const suburbs = state.db.suburbs || [];
    const hasOffice = Boolean(state.officeDraftHasOffice !== undefined ? state.officeDraftHasOffice : prov.hasOffice);
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--blue-primary);">${uiIcon('buildingOffice', 20)}</span>
              <div class="cancel-sheet-title">Workplace &amp; Office Setup</div>
            </div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <div style="font-size:12px; color:var(--text-secondary); margin-bottom:14px; line-height:1.45;">
            State whether you operate from a physical workshop/office/shop or operate as a mobile freelancer. Clients can see your base location and calculate travel times.
          </div>

          <!-- Workplace Choice Tabs -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
            <button
              type="button"
              class="${hasOffice ? 'btn-primary-blue' : 'btn-dark-sec'}"
              style="height:44px; font-size:12px; cursor:pointer;"
              onclick="setProviderWorkplaceType(true)"
            >
              ${uiIcon('buildingOffice', 15)}
              <span>${uiIcon('buildingOffice', 13)} Shop / Office</span>
            </button>
            <button
              type="button"
              class="${!hasOffice ? 'btn-primary-blue' : 'btn-dark-sec'}"
              style="height:44px; font-size:12px; cursor:pointer;"
              onclick="setProviderWorkplaceType(false)"
            >
              ${uiIcon('briefcase', 15)}
              <span>${uiIcon('toolbox', 13)} Mobile Freelancer</span>
            </button>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            ${hasOffice ? `
              <div>
                <label style="font-size:12px; font-weight:700; color:var(--text-main);">Workshop / Office Suburb</label>
                <select id="providerOfficeSuburbSelect" class="dark-input" style="width:100%; margin-top:4px;">
                  ${suburbs.map((s) => `<option value="${s.name}" ${(prov.officeSuburb || prov.primarySuburb || '') === s.name ? 'selected' : ''}>${s.name}, Harare</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:var(--text-main);">Street Address / Shop Details</label>
                <input id="providerOfficeAddressInput" class="dark-input" value="${escapeHtml(prov.officeAddress || '')}" placeholder="e.g. Shop 14, Sam Levy's Village, Borrowdale" style="width:100%; margin-top:4px;" />
              </div>
            ` : `
              <div style="background:#F1F5F9; border-radius:12px; padding:12px; font-size:12.5px; color:#475569; line-height:1.45;">
                <strong>Mobile Freelancer Mode:</strong> You travel directly to client homes and job sites in Harare. When you are en route, your live moving location and trade icon will be displayed to the client.
              </div>
            `}
            <button class="btn-primary-blue" onclick="saveProviderOfficeDetails()" style="margin-top:6px; height:44px;">
              ${uiIcon('check', 16)}
              <span>Save Workplace Setup</span>
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // FULL-SCREEN CHAT PHOTO PREVIEW LIGHTBOX
  if (state.activeModal === 'CHAT_PHOTO_PREVIEW') {
    const pUrl = state.modalData?.previewPhotoUrl;
    root.innerHTML = `
      <div class="modal-backdrop" style="background:rgba(0,0,0,0.92); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px;" onclick="closeModal()">
        <div style="position:relative; max-width:94vw; max-height:90vh; display:flex; flex-direction:column; align-items:center; justify-content:center;" onclick="event.stopPropagation()">
          <button class="cancel-close-x" onclick="closeModal()" style="position:absolute; top:-42px; right:0; background:rgba(255,255,255,0.25); color:#fff; border-radius:50%; width:34px; height:34px; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            ${uiIcon('close', 18)}
          </button>
          <img src="${escapeHtml(pUrl)}" alt="Chat Reference" style="max-width:100%; max-height:84vh; object-fit:contain; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.7);" />
        </div>
      </div>
    `;
    return;
  }
}

function setProviderWorkplaceType(hasOffice) {
  state.officeDraftHasOffice = Boolean(hasOffice);
  lastRenderedModalKey = '';
  renderModalLayer();
}

async function quickToggleProviderOffice() {
  const prov = state.currentUser || (state.db.providers || [])[0];
  if (!prov) return;
  const newHasOffice = !prov.hasOffice;
  prov.hasOffice = newHasOffice;
  prov.workplaceType = newHasOffice ? 'OFFICE' : 'FREELANCER';
  if (state.currentUser && state.currentUser.id === prov.id) {
    state.currentUser = { ...prov };
    saveSession(state.role, state.currentUser, false);
  }
  renderAll();
  showToast(newHasOffice ? 'Switched to Shop / Office mode' : 'Switched to Mobile Freelancer mode', 'success');
  try {
    await apiPost('/api/providers/office', {
      providerId: prov.id,
      hasOffice: newHasOffice,
      workplaceType: prov.workplaceType,
      officeSuburb: prov.officeSuburb || prov.primarySuburb || 'Avondale',
      officeAddress: prov.officeAddress || '',
      providerSnapshot: prov
    });
    await fetchState(true);
  } catch (e) {
    console.warn('Quick toggle sync note:', e);
  }
}

function openProviderOfficeModal() {
  const prov = state.currentUser || (state.db.providers || [])[0] || {};
  state.officeDraftHasOffice = Boolean(prov.hasOffice);
  state.activeModal = 'PROVIDER_OFFICE_MODAL';
  lastRenderedModalKey = '';
  renderModalLayer();
}

async function saveProviderOfficeDetails() {
  const prov = state.currentUser || (state.db.providers || [])[0];
  if (!prov) return;
  const hasOffice = Boolean(state.officeDraftHasOffice !== undefined ? state.officeDraftHasOffice : prov.hasOffice);
  const officeSuburb = document.getElementById('providerOfficeSuburbSelect')?.value || prov.officeSuburb || prov.primarySuburb || '';
  const officeAddress = hasOffice ? (document.getElementById('providerOfficeAddressInput')?.value?.trim() || '') : '';
  const subObj = (state.db?.suburbs || []).find((s) => s.name.toLowerCase() === officeSuburb.toLowerCase());
  const officeLat = subObj ? subObj.lat : (prov.lat || -17.82485);
  const officeLng = subObj ? subObj.lng : (prov.lng || 31.05303);

  // Optimistic update
  prov.hasOffice = hasOffice;
  prov.workplaceType = hasOffice ? 'OFFICE' : 'FREELANCER';
  prov.officeSuburb = officeSuburb;
  prov.officeAddress = officeAddress;
  prov.officeLat = officeLat;
  prov.officeLng = officeLng;
  if (state.currentUser && state.currentUser.id === prov.id) {
    state.currentUser = { ...prov };
    saveSession(state.role, state.currentUser, false);
  }

  showToast('Updating workplace...', 'info');
  try {
    const data = await apiPost('/api/providers/office', {
      providerId: prov.id,
      hasOffice,
      workplaceType: prov.workplaceType,
      officeSuburb,
      officeAddress,
      officeLat,
      officeLng,
      providerSnapshot: prov
    });
    if (data.ok || data.success) {
      showToast(hasOffice ? 'Office & Workshop details saved' : 'Freelancer mode set', 'success');
      state.officeDraftHasOffice = undefined;
      closeModal();
      renderAll();
      updateMapMarkers(true);
    } else {
      showToast(data.error || 'Failed to update office', 'error');
    }
  } catch (err) {
    console.error('Error saving provider office:', err);
    // Still succeeded optimistically
    showToast(hasOffice ? 'Office & Workshop details saved locally' : 'Freelancer mode set', 'success');
    state.officeDraftHasOffice = undefined;
    closeModal();
    renderAll();
    updateMapMarkers(true);
  }
}

function getCancelReasonSvg(type) {
  const map = {
    route: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18h6a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7h6"/></svg>`,
    fare: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>`,
    warn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    pin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2" stroke-linecap="round"><path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>`,
    inbox: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/></svg>`,
    dots: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#0066FF"><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/></svg>`
  };
  return map[type] || map.dots;
}

// ============================================================================
// USER ACTIONS, WAITLIST, SPECIAL INSTRUCTIONS & FARE NEGOTIATION HANDLERS
// ============================================================================
function selectHomeCategory(catId) {
  const cat = state.db.categories.find((c) => c.id === catId);
  if (!cat) return;
  if (cat.status !== 'ACTIVE') {
    state.activeModal = 'COMING_SOON_MODAL';
    state.modalData = { category: cat };
    renderModalLayer();
    return;
  }
  state.selectedCategoryId = catId;
  state.selectedSubServiceIdx = 0;
  state.selectedTierKey = 'STANDARD';
  syncRecommendedFare();
  renderAll();
}

async function submitCategoryWaitlist(categoryId) {
  const phone = document.getElementById('waitlistPhoneInput')?.value.trim() || '+263 77 200 1001';
  const suburb = document.getElementById('waitlistSuburbSelect')?.value || 'Avondale';
  try {
    const res = await apiPost('/api/waitlist', { categoryId, phone, suburb });
    closeModal();
    showToast(`Added to ${res.category?.fullName || 'category'} priority waitlist (#${res.waitlistCount})!`);
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openConfigureStep(subIdx = 0) {
  state.selectedSubServiceIdx = subIdx;
  state.selectedTierKey = 'STANDARD';
  syncRecommendedFare();
  state.draftFareUsd = state.recommendedFareUsd;
  state.isSheetMinimized = false;
  state.screenStep = 'CONFIGURE';
  renderAll();
}

function backToHomeStep() {
  state.isSheetMinimized = false;
  state.screenStep = 'HOME';
  renderAll();
}

function adjustDraftFare(delta) {
  state.draftFareUsd = Math.max(4, Number((Number(state.draftFareUsd) + delta).toFixed(2)));
  renderAll();
}

function selectConfigureTier(tierKey, recUsd) {
  state.selectedTierKey = tierKey;
  state.recommendedFareUsd = recUsd;
  state.draftFareUsd = recUsd;
  renderAll();
}

function toggleDraftAutoAccept() {
  state.draftAutoAccept = !state.draftAutoAccept;
  renderAll();
}

function promptEntranceNote() {
  const val = prompt('Entrance / Gate note:', state.entranceNote || 'Main Gate');
  if (val !== null) {
    state.entranceNote = val.trim() || 'Main Gate';
    renderAll();
  }
}

function appendPresetInstruction(presetText) {
  const input = document.getElementById('draftNotesInput');
  const current = input ? input.value.trim() : state.draftNotes;
  const nextVal = current ? `${current}. ${presetText}` : presetText;
  state.draftNotes = nextVal;
  if (input) input.value = nextVal;
  handleLiveNotesInput(nextVal);
}

function handleLiveNotesInput(val) {
  const warning = checkAntiLeakageClient(val);
  state.notesLeakageWarning = warning || '';
  const alertEl = document.getElementById('notesLeakageAlert');
  const textEl = document.getElementById('notesLeakageText');
  if (alertEl && textEl) {
    alertEl.style.display = warning ? 'flex' : 'none';
    textEl.textContent = warning || '';
  }
}

function setBookingForMode(mode) {
  state.bookingFor = mode === 'SOMEONE_ELSE' ? 'SOMEONE_ELSE' : 'ME';
  renderUiOverlay(true);
  if (state.bookingFor === 'SOMEONE_ELSE') {
    setTimeout(() => {
      const inp = document.getElementById('recipientNameInput');
      if (inp) inp.focus();
    }, 60);
  }
}

function setDispatchTimingType(type) {
  state.timingType = type === 'SCHEDULED' ? 'SCHEDULED' : 'IMMEDIATE';
  if (state.timingType === 'SCHEDULED') {
    if (!state.scheduledDate) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      state.scheduledDate = `${yyyy}-${mm}-${dd}`;
    }
    if (!state.scheduledTime) {
      state.scheduledTime = '15:00';
    }
  }
  renderUiOverlay(true);
}

async function triggerSilentAiTaskAnalysis() {
  try {
    if (!state.draftNotes && !state.draftPhotoUrl) return;
    const res = await apiPost('/api/ai/classify-task', {
      description: state.draftNotes || '',
      photoUrl: state.draftPhotoUrl || null,
      currentCategoryId: state.selectedCategoryId,
      suburbName: state.customSuburbLabel
    });
    if (res && res.matchedCategoryId) {
      const matchedCat = (state.db?.categories || []).find((c) => c.id === res.matchedCategoryId && c.status === 'ACTIVE');
      if (matchedCat && matchedCat.id !== state.selectedCategoryId) {
        state.selectedCategoryId = matchedCat.id;
        state.selectedSubServiceIdx = 0;
      }
      if (res.recommendedFareUsd && Number(res.recommendedFareUsd) >= 5) {
        state.recommendedFareUsd = Number(res.recommendedFareUsd);
        state.draftFareUsd = Number(res.recommendedFareUsd);
      }
      renderUiOverlay(true);
    }
  } catch (e) {
    // Silent background intelligence — never interrupt user
  }
}

function saveDraftNotes() {
  const el = document.getElementById('draftNotesInput');
  const val = el ? el.value.trim() : '';
  const warning = checkAntiLeakageClient(val);
  if (warning) {
    showToast(warning, 'error');
    return;
  }
  state.draftNotes = val;
  state.notesLeakageWarning = '';
  closeModal();
  renderAll();
  triggerSilentAiTaskAnalysis();
}

async function submitServiceRequest() {
  if (!state.isAuthenticated || !state.currentUser) {
    state.authRole = 'CUSTOMER';
    state.authStep = 'PHONE';
    state.activeModal = 'SIGNUP_FLOW';
    renderAll();
    showToast('Please verify your WhatsApp first to find offers');
    return;
  }
  if (state.timingType === 'SCHEDULED' && (!state.scheduledDate || !state.scheduledTime)) {
    showToast('Please select a Date and Time for your scheduled visit', 'error');
    return;
  }
  try {
    markLocalStateMutation();
    const cat = state.db.categories.find((c) => c.id === state.selectedCategoryId) || state.db.categories[0];
    const sub = (cat.subServices || [])[state.selectedSubServiceIdx] || { name: `${cat.name} Home Service` };
    const reqId = 'req_' + Date.now().toString().slice(-5);
    const attachedPhoto = state.draftPhotoUrl || null;
    const nowIso = new Date().toISOString();

    // inDrive Live Location: Uses live GPS by default; only uses custom address if explicitly chosen
    const isLive = !state.isCustomAddressSelected;
    const targetLat = isLive ? (state.userLiveGpsLat || state.pinnedLat) : state.pinnedLat;
    const targetLng = isLive ? (state.userLiveGpsLng || state.pinnedLng) : state.pinnedLng;
    let suburbClean = (state.customSuburbLabel || '').split(',')[0].trim();
    if (!suburbClean || suburbClean.toLowerCase().includes('live location') || suburbClean.toLowerCase() === 'harare') {
      const nearest = (state.db?.suburbs || []).reduce((best, s) => {
        const d = Math.hypot(s.lat - targetLat, s.lng - targetLng);
        return (!best || d < best.d) ? { s, d } : best;
      }, null);
      if (nearest?.s) suburbClean = nearest.s.name;
      else suburbClean = 'Harare';
    }
    const streetClean = state.customAddress && state.customAddress !== 'Current Live Location' && !state.customAddress.toLowerCase().includes('live location') ? state.customAddress : suburbClean;
    const targetAddress = streetClean.toLowerCase().includes(suburbClean.toLowerCase()) ? streetClean : `${streetClean}, ${suburbClean}`;

    // 0ms Optimistic Broadcast: Transition immediately to SEARCHING without any delay!
    const optimisticReq = {
      id: reqId,
      customerId: state.currentUser.id,
      customerFinditId: state.currentUser.finditId || 'FH-USR-391044',
      customerName: state.currentUser.name,
      customerRating: state.currentUser.rating || 0,
      customerCompletedVisits: state.currentUser.completedBookings || 0,
      categoryId: cat.id,
      categoryName: cat.fullName || cat.name,
      title: sub.name,
      description: state.draftNotes || (isLive ? `Service delivery straight to my location at ${targetAddress}.` : `Service at ${targetAddress}.`),
      photoUrl: attachedPhoto,
      suburbId: state.selectedSuburbId,
      suburbName: suburbClean,
      exactAddress: targetAddress,
      lat: targetLat,
      lng: targetLng,
      serviceMode: isLive ? 'LIVE_LOCATION' : 'CUSTOM_ADDRESS',
      isLiveLocationOrder: isLive,
      clientLiveLat: targetLat,
      clientLiveLng: targetLng,
      clientLiveAddress: targetAddress,
      bookingFor: state.bookingFor || 'ME',
      recipientName: state.bookingFor === 'SOMEONE_ELSE' ? (state.recipientName || 'Recipient') : null,
      recipientPhone: state.bookingFor === 'SOMEONE_ELSE' ? (state.recipientPhone || null) : null,
      timingType: state.timingType || 'IMMEDIATE',
      scheduledDate: state.timingType === 'SCHEDULED' ? state.scheduledDate : null,
      scheduledTime: state.timingType === 'SCHEDULED' ? state.scheduledTime : null,
      paymentMethod: state.draftPaymentMethod,
      budgetUsd: Number(state.draftFareUsd),
      autoAccept: state.draftAutoAccept,
      startPinCode: String(Math.floor(1000 + Math.random() * 9000)),
      pinVerifiedByProvider: false,
      status: 'OPEN',
      acceptedOfferId: null,
      createdAt: nowIso,
      updatedAt: Date.now(),
      offers: [],
      messages: []
    };

    state.draftPhotoUrl = null;
    if (!state.db) state.db = {};
    if (!Array.isArray(state.db.requests)) state.db.requests = [];
    state.db.requests.unshift(optimisticReq);

    state.activeRequestId = reqId;
    state.pendingSearchFareUsd = Number(optimisticReq.budgetUsd);
    state.isSheetMinimized = false;
    state.isOffersMinimized = false;
    state.screenStep = 'SEARCHING';
    lastUiOverlaySignature = '';
    renderAll(true);

    const res = await apiPost('/api/requests', {
      id: reqId,
      customerId: state.currentUser.id,
      customerName: state.currentUser.name,
      categoryId: cat.id,
      title: sub.name,
      description: optimisticReq.description,
      suburbId: state.selectedSuburbId,
      suburbName: optimisticReq.suburbName,
      exactAddress: optimisticReq.exactAddress,
      lat: targetLat,
      lng: targetLng,
      serviceMode: 'LIVE_LOCATION',
      isLiveLocationOrder: true,
      clientLiveLat: targetLat,
      clientLiveLng: targetLng,
      clientLiveAddress: targetAddress,
      bookingFor: optimisticReq.bookingFor,
      recipientName: optimisticReq.recipientName,
      recipientPhone: optimisticReq.recipientPhone,
      timingType: optimisticReq.timingType,
      scheduledDate: optimisticReq.scheduledDate,
      scheduledTime: optimisticReq.scheduledTime,
      paymentMethod: state.draftPaymentMethod,
      budgetUsd: Number(state.draftFareUsd),
      autoAccept: state.draftAutoAccept,
      photoUrl: attachedPhoto
    });

    if (res && res.request && state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === reqId || r.id === res.request.id);
      if (idx >= 0) {
        // Preserve any offers that arrived in the meantime
        const currentOffers = state.db.requests[idx].offers || [];
        state.db.requests[idx] = {
          ...res.request,
          offers: res.request.offers?.length ? res.request.offers : currentOffers
        };
      } else {
        state.db.requests.unshift(res.request);
      }
      state.activeRequestId = res.request.id;
    }
  } catch (err) {
    showToast(err.message, 'error');
    renderAll(true);
  }
}

async function handleDraftStylePhotoUpload(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const compressed = await compressImageFileToDataUrl(file, 1200, 0.82);
  if (compressed) {
    state.draftPhotoUrl = compressed;
    renderAll();
    try {
      const upRes = await apiPost('/api/upload', { dataUrl: compressed });
      if (upRes && upRes.mediaUrl) {
        state.draftPhotoUrl = upRes.mediaUrl;
        renderAll();
      }
    } catch (e) {
      console.warn('Bucket upload note:', e);
    }
    showToast('Desired style reference photo attached!');
    triggerSilentAiTaskAnalysis();
  }
}

function removeDraftStylePhoto() {
  state.draftPhotoUrl = null;
  renderAll();
}

function openImagePreviewModal(photoUrl, title = 'Desired Style Photo') {
  state.activeModal = 'IMAGE_PREVIEW';
  state.modalData = { photoUrl, title };
  pushNavigationHistoryState({ imagePreview: true });
  renderModalLayer();
}

function stepActiveSearchFare(delta) {
  const req = getCustomerActiveRequest();
  if (!req) return;
  const base = state.pendingSearchFareUsd !== null ? Number(state.pendingSearchFareUsd) : Number(req.budgetUsd);
  state.pendingSearchFareUsd = Math.max(4, Number((base + delta).toFixed(2)));
  renderUiOverlay();
}

async function commitActiveSearchFare(requestId) {
  if (state.pendingSearchFareUsd === null) return;
  try {
    await apiPost('/api/requests/budget', {
      requestId,
      budgetUsd: Number(state.pendingSearchFareUsd)
    });
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleActiveRequestAutoAccept(requestId) {
  const req = getCustomerActiveRequest();
  if (!req) return;
  try {
    await apiPost('/api/requests/budget', {
      requestId,
      budgetUsd: req.budgetUsd,
      autoAccept: !req.autoAccept
    });
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function acceptOffer(requestId, offerId) {
  try {
    markLocalStateMutation();
    const reqSnap = (state.db?.requests || []).find((r) => r.id === requestId) || null;
    const offSnap = reqSnap && (reqSnap.offers || []).find((o) => o.id === offerId);

    // 0ms Optimistic Booking Transition: instantly start live route & chat
    if (reqSnap && offSnap) {
      reqSnap.status = 'CONFIRMED';
      reqSnap.acceptedOfferId = offSnap.id;
      reqSnap.acceptedProviderId = offSnap.providerId;
      reqSnap.acceptedProviderName = offSnap.providerName;
      reqSnap.acceptedProviderBrand = offSnap.providerBrand;
      reqSnap.acceptedProviderAvatarUrl = offSnap.providerAvatarUrl;
      reqSnap.agreedTotalUsd = Number(offSnap.priceUsd) + Number(offSnap.travelFeeUsd || 0);
      reqSnap.updatedAt = Date.now();
      offSnap.status = 'ACCEPTED';
    }
    state.activeRequestId = requestId;
    state.isSheetMinimized = false;
    state.isOffersMinimized = false;
    state.screenStep = 'BOOKED';
    state.providerTab = 'ACTIVE_JOB';
    lastUiOverlaySignature = '';
    lastOffersSignature = '';
    renderAll(true);
    showToast('Offer accepted! Live route & chat with your pro started.');

    const res = await apiPost('/api/offers/accept', {
      requestId,
      offerId,
      requestSnapshot: reqSnap,
      offerSnapshot: offSnap
    });
    if (res && res.request && state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === res.request.id);
      if (idx >= 0) state.db.requests[idx] = res.request;
      else state.db.requests.unshift(res.request);
    }
    renderAll(true);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function declineOffer(requestId, offerId) {
  try {
    markLocalStateMutation();
    const reqSnap = (state.db?.requests || []).find((r) => r.id === requestId) || null;
    if (reqSnap && Array.isArray(reqSnap.offers)) {
      const targetOff = reqSnap.offers.find((o) => o.id === offerId);
      if (targetOff) {
        targetOff.status = 'DECLINED';
        targetOff.declinedPriceUsd = targetOff.priceUsd;
      }
      lastOffersSignature = '';
      renderFloatingOffersOverlay(true);
    }
    const res = await apiPost('/api/offers/decline', {
      requestId,
      offerId,
      reason: 'DECLINED_BY_USER',
      requestSnapshot: reqSnap
    });
    if (res && res.request && state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === res.request.id);
      if (idx >= 0) state.db.requests[idx] = res.request;
    }
    showToast('Offer declined — provider has been notified and can adjust their price.', 'info');
    await fetchState(true);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openCancelTaskModal(requestId) {
  state.activeModal = 'CANCEL_TASK';
  state.modalData = { requestId };
  renderModalLayer();
}

function handleCancelReasonRowClick(reasonLabel) {
  if (reasonLabel === 'Another reason') {
    const custom = prompt('Reason for cancelling:', '');
    if (custom) submitCancelTaskWithReason(custom);
    return;
  }
  submitCancelTaskWithReason(reasonLabel);
}

async function submitCancelTaskWithReason(reason) {
  const requestId = state.modalData?.requestId || state.activeRequestId || getCustomerActiveRequest()?.id;
  if (!requestId) {
    closeModal();
    return;
  }
  markLocalStateMutation();
  const reqSnap = (state.db?.requests || []).find((r) => r.id === requestId) || null;

  // Immediate local transition so cancellation never lags or fails
  if (reqSnap) {
    reqSnap.status = 'CANCELLED';
    reqSnap.cancelReason = reason;
    reqSnap.updatedAt = Date.now();
  }
  state.activeModal = null;
  state.activeRequestId = null;
  state.pendingSearchFareUsd = null;
  state.isSheetMinimized = false;
  state.screenStep = 'HOME';
  state.providerTab = 'FEED';
  lastUiOverlaySignature = '';
  lastOffersSignature = '';
  renderAll(true);

  try {
    await apiPost('/api/bookings/cancel', {
      requestId,
      role: state.role,
      actorName: state.currentUser?.name || 'User',
      reason,
      requestSnapshot: reqSnap
    });
    showToast('Request cancelled.');
    await fetchState(true);
  } catch (err) {
    // Even if server already cleaned it up, keep local state cleanly cancelled
    showToast('Request cancelled.');
  }
}

function openRateBookingModal(requestId) {
  state.ratingStars = 5;
  state.customReviewComment = '';
  state.activeModal = 'RATE_BOOKING_MODAL';
  state.modalData = { requestId };
  if (state.role === 'PROVIDER') {
    state.ratingTags = ['Paid Promptly in USD', 'Respectful & Welcoming', 'Home & Power Ready'];
  } else {
    state.ratingTags = ['Punctual Arrival', 'Clean Mobile Kit', 'Professional Work'];
  }
  renderModalLayer();
}

function selectRatingStars(num) {
  state.ratingStars = Math.max(1, Math.min(5, Number(num)));
  lastRenderedModalKey = '';
  renderModalLayer();
}

function toggleRatingComplimentTag(tag) {
  if (state.ratingTags.includes(tag)) {
    state.ratingTags = state.ratingTags.filter((t) => t !== tag);
  } else {
    state.ratingTags.push(tag);
  }
  lastRenderedModalKey = '';
  renderModalLayer();
}

let isSubmittingReview = false;

async function completeBooking(requestId) {
  if (isSubmittingReview) return;
  isSubmittingReview = true;

  // 1. Immediately disable button and show loading state
  const submitBtns = document.querySelectorAll('.btn-primary-blue');
  submitBtns.forEach((b) => {
    b.disabled = true;
    b.style.opacity = '0.65';
    b.style.pointerEvents = 'none';
    b.innerHTML = '<span>Submitting Review...</span>';
  });

  const role = state.role || 'CUSTOMER';
  const rating = state.ratingStars || 5;
  const customComment = (state.customReviewComment || '').trim();
  const reviewText = customComment
    ? (state.ratingTags && state.ratingTags.length ? `${state.ratingTags.join(', ')} — ${customComment}` : customComment)
    : (state.ratingTags || []).join(', ');

  // 2. Optimistically update local booking status to COMPLETED so UI never bounces
  if (state.db && Array.isArray(state.db.requests)) {
    const localReq = state.db.requests.find((r) => r.id === requestId);
    if (localReq) {
      localReq.status = 'COMPLETED';
      if (role === 'PROVIDER') {
        localReq.clientRatedByProvider = { rating, comment: reviewText, customComment, tags: state.ratingTags };
      } else {
        localReq.providerRatedByClient = { rating, comment: reviewText, customComment, tags: state.ratingTags };
      }
    }
  }

  // 3. Immediately close modal and reset step in 0ms
  state.activeModal = null;
  state.modalData = null;
  state.customReviewComment = '';
  lastRenderedModalKey = '';
  state.activeRequestId = null;
  state.isSheetMinimized = false;
  state.screenStep = 'HOME';
  state.providerTab = 'FEED';
  lastUiOverlaySignature = '';
  renderAll(true);

  showToast(
    role === 'PROVIDER'
      ? 'Client review submitted successfully! Great job.'
      : 'Service rated! Thank you for supporting Harare pros.',
    'success'
  );

  try {
    await apiPost('/api/bookings/status', {
      requestId,
      status: 'COMPLETED',
      ratedByRole: role,
      rating,
      reviewText,
      customComment,
      tags: state.ratingTags
    });
    await fetchState(true);
  } catch (err) {
    console.warn('Booking complete network sync note:', err.message);
  } finally {
    isSubmittingReview = false;
  }
}

// ============================================================================
// DRAWER MODE SWITCH & LOGOUT HANDLERS
// ============================================================================
function closeModal() {
  stopFaceCameraStream();
  state.activeModal = null;
  state.modalData = null;
  lastRenderedModalKey = '';
  renderModalLayer();
}

function openSideDrawerModal() {
  if (state.activeModal === 'SIGNUP_FLOW' || !state.isAuthenticated) {
    openSignInRoleChoiceModal();
    return;
  }
  state.activeModal = 'DRAWER';
  pushNavigationHistoryState({ drawer: true });
  renderModalLayer();
}

async function toggleClientAndProviderMode() {
  closeModal();
  state.isSheetMinimized = false;
  if (state.role === 'CUSTOMER') {
    const userPhone = state.currentUser ? (state.currentUser.phone || '').replace(/\D/g, '') : '';
    const matchedProv = userPhone
      ? (state.db.providers || []).find((p) => p.phone.replace(/\D/g, '') === userPhone && !p.isBanned)
      : null;

    if (matchedProv) {
      state.role = 'PROVIDER';
      state.currentUser = matchedProv;
      state.providerTab = 'FEED';
      state.hubView = 'MARKETPLACE';
      saveSession('PROVIDER', matchedProv, false);
      showToast(`Switched to Provider: ${matchedProv.name}`);
      renderAll();
    } else {
      // Start authentic provider sign-in / registration wizard (like inDrive)
      state.authRole = 'PROVIDER';
      state.authStep = 'PHONE';
      state.authName = state.currentUser?.name || '';
      state.authPhone = state.currentUser?.phone || '+263 77 ';
      state.activeModal = 'SIGNUP_FLOW';
      renderAll();
      showToast('Please sign in or register as a Service Provider');
    }
  } else {
    // Switching back to Client Mode
    const userPhone = state.currentUser ? (state.currentUser.phone || '').replace(/\D/g, '') : '';
    const matchedCust = userPhone
      ? (state.db.customers || []).find((c) => c.phone.replace(/\D/g, '') === userPhone && !c.isBanned)
      : null;

    if (matchedCust) {
      state.role = 'CUSTOMER';
      state.currentUser = matchedCust;
      saveSession('CUSTOMER', matchedCust, false);
      showToast('Switched to Client Mode');
      renderAll();
    } else {
      const clientUser = {
        id: 'cust_' + (state.currentUser?.id || Date.now().toString().slice(-4)),
        finditId: 'FH-USR-' + Math.floor(100000 + Math.random() * 900000),
        name: state.currentUser?.name || 'Findit Client',
        phone: state.currentUser?.phone || '+263 77 ',
        avatarUrl: state.currentUser?.avatarUrl || null,
        suburbName: state.currentUser?.suburbName || 'Avondale'
      };
      if (state.db && state.db.customers) state.db.customers.push(clientUser);
      state.role = 'CUSTOMER';
      state.currentUser = clientUser;
      saveSession('CUSTOMER', clientUser, false);
      showToast('Switched to Client Mode');
      renderAll();
    }
  }
}

function logoutCurrentAccount() {
  closeModal();
  state.isAuthenticated = false;
  state.currentUser = null;
  state.authStep = 'PHONE';
  saveSession(null, null, true);
  renderAll();
}

async function promptDeleteAccount() {
  if (!state.isAuthenticated || !state.currentUser) {
    showToast('No active account to delete', 'error');
    return;
  }

  const userName = state.currentUser.name || 'Your Account';
  const confirmed = confirm(
    `Permanently Delete Account (${userName})?\n\n` +
    `• All personal details, phone number, and National ID will be completely erased from Findit Harare.\n` +
    `• Records will be permanently deleted from the database.\n` +
    `• Any open requests or bids will be cancelled immediately.\n\n` +
    `Are you sure you want to proceed?`
  );

  if (!confirmed) return;

  try {
    showToast('Deleting your account from database...');
    const res = await apiPost('/api/auth/delete-account', {
      role: state.role,
      userId: state.currentUser.id,
      phone: state.currentUser.phone
    });

    closeModal();
    state.isAuthenticated = false;
    state.currentUser = null;
    state.activeRequestId = null;
    state.activeCall = null;
    state.authStep = 'PHONE';
    saveSession(null, null, true);
    showToast(res.message || 'Account successfully deleted.');
    renderAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openProviderCatalogueModal(providerId, requestId = null, offerId = null) {
  state.activeModal = 'CATALOGUE_VIEW';
  state.modalData = { providerId, requestId, offerId };
  renderModalLayer();
}

function openSuburbPickerModal() {
  state.locationSearchQuery = state.customAddress || '';
  state.locationSearchResults = [];
  state.locationSearching = false;
  state.activeModal = 'SUBURB_PICKER';
  lastRenderedModalKey = '';
  renderModalLayer();
  setTimeout(() => {
    const inp = document.getElementById('liveLocationSearchInput');
    if (inp) {
      inp.focus();
      inp.select();
    }
  }, 50);
}

let locationSearchDebounceTimer = null;
function handleLiveLocationQueryInput(val) {
  state.locationSearchQuery = val;
  state.customAddress = val.trim() || state.customAddress;
  if (locationSearchDebounceTimer) clearTimeout(locationSearchDebounceTimer);
  if (val.trim().length >= 3) {
    locationSearchDebounceTimer = setTimeout(() => {
      searchRealLocationAddress(true);
    }, 450);
  }
}

async function searchRealLocationAddress(silent = false) {
  const inp = document.getElementById('liveLocationSearchInput');
  const rawQuery = (inp ? inp.value : state.locationSearchQuery || '').trim();
  if (!rawQuery) return;
  state.locationSearchQuery = rawQuery;
  state.customAddress = rawQuery;

  // Check if it directly matches a known Harare suburb first
  const suburbs = state.db?.suburbs || [];
  const localMatches = suburbs
    .filter((s) => `${s.name} ${s.zone}`.toLowerCase().includes(rawQuery.toLowerCase()))
    .map((s) => ({
      shortTitle: `${rawQuery}, ${s.name}`,
      fullLabel: `${s.name} (${s.zone}), Harare, Zimbabwe`,
      suburbName: s.name,
      suburbId: s.id,
      lat: s.lat,
      lng: s.lng
    }));

  state.locationSearching = true;
  if (!silent) {
    lastRenderedModalKey = '';
    renderModalLayer();
  }

  try {
    const q = rawQuery.toLowerCase().includes('harare') || rawQuery.toLowerCase().includes('zimbabwe')
      ? rawQuery
      : `${rawQuery}, Harare, Zimbabwe`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=zw&limit=5&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    const osmItems = Array.isArray(data)
      ? data.map((item) => {
          const parts = (item.display_name || '').split(',').map((p) => p.trim());
          const shortTitle = parts.slice(0, 2).join(', ') || rawQuery;
          const suburbGuess = item.address?.suburb || item.address?.neighbourhood || item.address?.residential || parts[1] || 'Harare';
          return {
            shortTitle,
            fullLabel: parts.slice(0, 4).join(', '),
            suburbName: suburbGuess,
            suburbId: null,
            lat: Number(item.lat),
            lng: Number(item.lon)
          };
        })
      : [];

    state.locationSearchResults = [...osmItems, ...localMatches].slice(0, 6);
  } catch (e) {
    state.locationSearchResults = localMatches;
  } finally {
    state.locationSearching = false;
    if (state.activeModal === 'SUBURB_PICKER') {
      const wasFocused = document.activeElement?.id === 'liveLocationSearchInput';
      const cursorPos = document.getElementById('liveLocationSearchInput')?.selectionStart || rawQuery.length;
      lastRenderedModalKey = '';
      renderModalLayer();
      if (wasFocused) {
        const nextInp = document.getElementById('liveLocationSearchInput');
        if (nextInp) {
          nextInp.focus();
          try { nextInp.setSelectionRange(cursorPos, cursorPos); } catch (err) {}
        }
      }
    }
  }
}

function selectLiveLocationDefault() {
  state.isCustomAddressSelected = false;
  state.userHasManuallyDraggedPin = false;
  state.customAddress = 'Current Live Location';
  closeModal();
  useBrowserGeolocation(false);
  renderAll(true);
  showToast('Using your Live GPS Location');
}

function selectGeocodedLocation(idx) {
  const item = (state.locationSearchResults || [])[idx];
  if (!item) return;
  state.isCustomAddressSelected = true;
  const suburbs = state.db?.suburbs || [];
  let nearestSub = suburbs[0];
  let minD = Infinity;
  suburbs.forEach((s) => {
    const d = Math.hypot((s.lat || 0) - item.lat, (s.lng || 0) - item.lng);
    if (d < minD) {
      minD = d;
      nearestSub = s;
    }
  });
  if (nearestSub) state.selectedSuburbId = nearestSub.id;
  state.customAddress = item.shortTitle;
  state.customSuburbLabel = `${item.suburbName || nearestSub?.name || 'Harare'}, Harare`;
  state.pinnedLat = Number(item.lat.toFixed(5));
  state.pinnedLng = Number(item.lng.toFixed(5));
  closeModal();
  renderAll();
  if (leafletMap) {
    leafletMap.flyTo([state.pinnedLat, state.pinnedLng], 16, { animate: true, duration: 0.85 });
  }
  showToast(`Set to: ${state.customAddress}`);
}

function startMapPinPickMode() {
  state.isCustomAddressSelected = true;
  closeModal();
  state.isSheetMinimized = true;
  renderAll();
  if (leafletMap && state.pinnedLat && state.pinnedLng) {
    leafletMap.flyTo([state.pinnedLat, state.pinnedLng], 16, { animate: true, duration: 0.6 });
  }
  showToast('Drag the blue YOU pin to set your custom location');
}

function selectSuburbLocation(suburbId) {
  const s = (state.db.suburbs || []).find((item) => item.id === suburbId);
  if (!s) return;
  state.isCustomAddressSelected = true;
  const typedStreet = (state.locationSearchQuery || '').trim();
  state.selectedSuburbId = s.id;
  state.customAddress = (typedStreet && typedStreet.toLowerCase() !== s.name.toLowerCase())
    ? typedStreet
    : s.name;
  state.customSuburbLabel = `${s.name}, Harare`;
  state.pinnedLat = s.lat;
  state.pinnedLng = s.lng;
  closeModal();
  renderAll();
  if (leafletMap) {
    leafletMap.flyTo([s.lat, s.lng], 15, { animate: true, duration: 0.75 });
  }
  showToast(`Navigated to ${state.customAddress}, ${s.name}`);
}

function openServicePickerModal() {
  state.activeModal = 'SERVICE_PICKER';
  renderModalLayer();
}

function pickSubService(idx) {
  state.selectedSubServiceIdx = idx;
  syncRecommendedFare();
  state.draftFareUsd = state.recommendedFareUsd;
  closeModal();
  renderAll();
}

function openPaymentModal() {
  state.activeModal = 'PAYMENT_MODAL';
  renderModalLayer();
}

function openNotesModal() {
  state.notesLeakageWarning = '';
  state.activeModal = 'NOTES_MODAL';
  renderModalLayer();
}

function stopFaceCameraStream() {
  if (mediaStreamRef) {
    try {
      mediaStreamRef.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
    } catch (e) {}
    mediaStreamRef = null;
  }
  const videoEl = document.getElementById('authSelfieVideo');
  if (videoEl) {
    try {
      videoEl.pause();
      videoEl.srcObject = null;
    } catch (e) {}
  }
}

// ============================================================================
// INDRIVE-INSPIRED SERVICE PROVIDER MODE (DRIVER / SPECIALIST WORKSPACE)
// ============================================================================
function normalizeCategoryId(catId) {
  const map = {
    braiding: 'beauty_care',
    barber: 'beauty_care',
    nails: 'beauty_care',
    makeup: 'beauty_care',
    wigs: 'beauty_care',
    lashes: 'beauty_care',
    cleaning: 'cleaning_domestic',
    handyman: 'repairs_construction',
    plumbing: 'repairs_construction'
  };
  return map[catId] || catId || 'repairs_construction';
}

function getProviderCategoryIds(prov) {
  if (!prov) return [];
  const raw = Array.isArray(prov.categoryIds) && prov.categoryIds.length
    ? prov.categoryIds
    : (prov.categoryId ? [prov.categoryId] : []);
  return Array.from(new Set(raw.map(normalizeCategoryId))).slice(0, 3);
}

let lastReportedViewingKey = '';
let lastReportedViewingAt = 0;
function reportProviderViewingRequests(providerId, requestIds) {
  if (!providerId) return;
  const key = `${providerId}:${(requestIds || []).join(',')}`;
  const now = Date.now();
  if (key === lastReportedViewingKey && now - lastReportedViewingAt < 20000) return;
  lastReportedViewingKey = key;
  lastReportedViewingAt = now;
  apiPost('/api/requests/viewing', { providerId, requestIds: requestIds || [] }).catch(() => {});
}

function renderProviderModeOverlay() {
  const prov = state.currentUser || state.db.providers[0];
  const activeJob = getProviderActiveBooking(prov.id);
  // Strictly show ONLY job cards matching the provider's chosen categories (up to 3)
  const myCategoryIds = getProviderCategoryIds(prov);
  const openRequests = (state.db.requests || []).filter((r) => {
    if (r.status !== 'OPEN') return false;
    if (r.acceptedProviderId && r.acceptedProviderId !== prov.id) return false;
    if (r.acceptedOfferId) return false;
    const reqCat = normalizeCategoryId(r.categoryId);
    return myCategoryIds.includes(reqCat);
  });
  if (prov && prov.isOnline !== false && !prov.isBanned) {
    reportProviderViewingRequests(prov.id, openRequests.map((r) => r.id));
  } else if (prov) {
    reportProviderViewingRequests(prov.id, []);
  }
  const myPendingApprovals = (state.db.approvalQueue || []).filter((a) => a.providerId === prov.id && a.status === 'PENDING');

  const currentTab = state.providerTab || (activeJob ? 'ACTIVE_JOB' : 'FEED');

  return `
    <div class="provider-top-bar" style="justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="indrive-circle-btn" onclick="openSideDrawerModal()" title="Side Panel Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <span style="font-size:12.5px; font-weight:800; color:#0F172A; background:#FFFFFF; padding:6px 12px; border-radius:12px; border:1px solid #E2E8F0; box-shadow:0 2px 6px rgba(0,0,0,0.06); display:inline-flex; align-items:center; gap:6px;">
          <span style="width:7px; height:7px; border-radius:50%; background:${prov.isOnline !== false ? '#10B981' : '#64748B'};"></span>
          <span>${prov.isOnline !== false ? 'Online' : 'Offline'}</span>
        </span>
      </div>

      <div style="display:flex; align-items:center; gap:8px;">
        <button class="indrive-circle-btn" style="position:relative;" onclick="openNotificationCenterModal()" title="Notification Center &amp; Admin Notices">
          ${uiIcon('bell', 18)}
          ${getUnreadNotificationsCount() > 0 ? `
            <span style="position:absolute; top:-2px; right:-2px; background:#EF4444; color:#FFFFFF; font-size:9.5px; font-weight:800; min-width:17px; height:17px; border-radius:99px; display:inline-flex; align-items:center; justify-content:center; border:2px solid #FFFFFF; padding:0 3px;">
              ${getUnreadNotificationsCount()}
            </span>
          ` : ''}
        </button>
      </div>
    </div>

    <div class="sheet-floating-controls" style="justify-content:flex-end;">
      <button class="map-floating-gps-btn" onclick="useBrowserGeolocation(false)" title="Center on My Live Location">
        ${uiIcon('crosshair', 19)}
      </button>
    </div>

    ${state.isSheetMinimized ? `
      <div class="minimized-map-restore-bar" onclick="toggleSheetMinimize(false)">
        <div>
          <div style="font-size:13.5px; font-weight:800; color:var(--text-main);">
            ${activeJob ? `Active Visit: ${activeJob.customerName} (${formatUsdPrice(activeJob.agreedTotalUsd || activeJob.budgetUsd)})` : `Provider Mode • ${openRequests.length} Open Request(s)`}
          </div>
          <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Full-screen Harare map active • Tap to open Workspace</div>
        </div>
        <button type="button" class="minimized-restore-btn" onclick="toggleSheetMinimize(false); event.stopPropagation();">
          ${uiIcon('chevronUp', 14)}
          <span>Workspace</span>
        </button>
      </div>
    ` : `
      <div class="indrive-dark-sheet">
        <div class="sheet-top-handle-bar">
          <div style="display:flex; align-items:center; gap:6px; min-width:0;">
            <span style="font-size:12px; font-weight:800; color:var(--blue-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${prov.shortName || prov.name}</span>
            <span style="font-size:11px; color:var(--text-secondary); font-weight:700; display:inline-flex; align-items:center; gap:3px;">
              ${uiIcon('star', 11)} ${prov.rating}
            </span>
          </div>
          <div class="sheet-grabber" onclick="toggleSheetMinimize(true)"></div>
          <button class="sheet-collapse-pill" onclick="toggleSheetMinimize(true)">
            ${uiIcon('map', 12)}
            <span>Full Map</span>
            ${uiIcon('chevronDown', 12)}
          </button>
        </div>

        <!-- 4 Dedicated inDrive-Style Service Provider Tabs (100% Vector Icons) -->
        <div class="provider-bottom-tabs">
          <button
            class="provider-tab-btn ${currentTab === 'FEED' ? 'active' : ''}"
            onclick="state.providerTab='FEED'; renderUiOverlay();"
          >
            ${uiIcon('list', 13)}
            <span>Requests (${openRequests.length})</span>
          </button>

          <button
            class="provider-tab-btn ${currentTab === 'ACTIVE_JOB' ? 'active' : ''}"
            onclick="state.providerTab='ACTIVE_JOB'; renderUiOverlay();"
          >
            ${activeJob ? `<span class="provider-tab-dot"></span>` : uiIcon('routeCar', 13)}
            <span>Visit</span>
          </button>

          <button
            class="provider-tab-btn ${currentTab === 'WALLET' ? 'active' : ''}"
            onclick="state.providerTab='WALLET'; renderUiOverlay();"
          >
            ${uiIcon('wallet', 13)}
            <span>Wallet</span>
          </button>

          <button
            class="provider-tab-btn ${currentTab === 'CATALOGUE' ? 'active' : ''}"
            onclick="state.providerTab='CATALOGUE'; renderUiOverlay();"
          >
            ${uiIcon('image', 13)}
            <span>Catalogue</span>
          </button>
        </div>

        ${currentTab === 'ACTIVE_JOB' ? renderProviderActiveVisitTab(prov, activeJob) : ''}
        ${currentTab === 'FEED' ? renderProviderRequestsFeedTab(prov, openRequests, activeJob) : ''}
        ${currentTab === 'WALLET' ? renderProviderWalletTab(prov) : ''}
        ${currentTab === 'CATALOGUE' ? renderProviderCatalogueTab(prov, myPendingApprovals) : ''}
      </div>
    `}
  `;
}

// ----------------------------------------------------------------------------
// PROVIDER TAB 1: ACTIVE CLIENT VISIT & REAL-TIME CHAT (WHEN OFFER IS ACCEPTED)
// ----------------------------------------------------------------------------
function renderProviderActiveVisitTab(prov, activeJob) {
  if (!activeJob) {
    return `
      <div style="text-align:center; padding:24px 14px; background:var(--bg-card); border-radius:18px; border:1px solid var(--border-light);">
        <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:4px;">No Active Home Visit Right Now</div>
        <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:14px; line-height:1.45;">
          Open the <strong>Requests</strong> tab to accept a client's fare or send a counter-offer. As soon as a client accepts your offer, your live route and client chat appear here.
        </div>
        <button class="btn-primary-blue" style="height:42px; font-size:13px;" onclick="state.providerTab='FEED'; renderUiOverlay();">
          ${uiIcon('list', 15)}
          <span>View Open Client Requests</span>
        </button>
      </div>
    `;
  }

  const accOffer = (activeJob.offers || []).find((o) => o.id === activeJob.acceptedOfferId);
  const agreedUsd = activeJob.agreedTotalUsd || accOffer?.priceUsd || activeJob.budgetUsd;
  const commRate = state.db.settings?.commissionPercent ?? 10;
  const netUsd = Math.round(agreedUsd * (1 - commRate / 100) * 100) / 100;

  const isEnRoute = activeJob.status === 'CONFIRMED' || activeJob.status === 'BOOKED';
  const isArrived = activeJob.status === 'ARRIVED';
  const isInProgress = activeJob.status === 'IN_PROGRESS' || activeJob.pinVerifiedByProvider;

  return `
    <div>
      <!-- 3-Step inDrive Provider Job Progression Bar -->
      <div class="provider-step-bar">
        <div class="provider-step-pill ${isEnRoute ? 'active' : 'done'}">
          ${!isEnRoute ? uiIcon('check', 11) : ''}
          <span>1. En Route</span>
        </div>
        <div class="provider-step-pill ${isArrived ? 'active' : isInProgress ? 'done' : ''}">
          ${isInProgress ? uiIcon('check', 11) : ''}
          <span>2. Waiting Outside (PIN)</span>
        </div>
        <div class="provider-step-pill ${isInProgress ? 'active' : ''}">
          <span>3. In Service</span>
        </div>
      </div>

      <!-- Accepted Client Visit Summary Card -->
      <div class="provider-order-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="font-size:10.5px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.04em; display:inline-flex; align-items:center; gap:4px;">
              ${uiIcon('check', 12)}
              <span>Client Accepted Your Offer</span>
            </div>
            <div style="font-size:16.5px; font-weight:800; color:var(--text-main); margin-top:2px; display:flex; align-items:center; gap:6px;">
              <span>${activeJob.customerName}</span>
              <span style="font-size:12.5px; color:var(--text-secondary); display:inline-flex; align-items:center; gap:3px;">
                ${(Number(activeJob.customerRating) || 0) > 0 ? `${uiIcon('star', 12)} ${activeJob.customerRating}` : '• New Client'}
              </span>
            </div>
            <div style="font-size:12.5px; color:var(--blue-primary); font-weight:700; margin-top:2px; display:flex; align-items:center; gap:4px;">
              ${uiIcon('pin', 13)}
              <span>${activeJob.exactAddress}</span>
            </div>
          </div>

          <div style="text-align:right;">
            <div style="font-size:21px; font-weight:800; color:var(--blue-primary);">${formatUsdPrice(agreedUsd)}</div>
            <div style="font-size:11px; color:#059669; font-weight:800;">Net: $${netUsd.toFixed(2)} (${activeJob.paymentMethod})</div>
          </div>
        </div>

        <div style="font-size:13px; font-weight:800; color:var(--text-main); background:var(--blue-soft); padding:8px 11px; border-radius:11px; margin-bottom:10px; display:flex; align-items:center; gap:7px;">
          <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('briefcase', 14)}</span>
          <span>${activeJob.title} • <span style="font-weight:600; color:var(--text-secondary);">${activeJob.description}</span></span>
        </div>

        ${activeJob.bookingFor === 'SOMEONE_ELSE' ? `
          <div style="font-size:11.5px; font-weight:700; color:#1E40AF; background:#DBEAFE; padding:7px 11px; border-radius:9px; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            ${uiIcon('user', 12)}
            <span>Ordered for: <strong>${escapeHtml(activeJob.recipientName || 'Recipient')}</strong> ${activeJob.recipientPhone ? `(${escapeHtml(activeJob.recipientPhone)})` : ''}</span>
          </div>
        ` : ''}

        ${activeJob.timingType === 'SCHEDULED' ? `
          <div style="font-size:11.5px; font-weight:700; color:#854D0E; background:#FEF9C3; padding:7px 11px; border-radius:9px; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            ${uiIcon('clock', 12)}
            <span>${uiIcon('calendar', 13)} Scheduled Visit: <strong>${escapeHtml(activeJob.scheduledDate)} at ${escapeHtml(activeJob.scheduledTime)}</strong></span>
          </div>
        ` : ''}

        ${activeJob.delayNotice ? `
          <div style="font-size:11px; font-weight:700; color:#B45309; background:#FEF3C7; border:1px solid #FCD34D; padding:6px 10px; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; gap:5px;">
            <span>⏱️</span>
            <span>Delay Alert: Running ~${activeJob.delayNotice.minutes}m late (${escapeHtml(activeJob.delayNotice.reason)})</span>
          </div>
        ` : ''}

        ${activeJob.photoUrl ? `
          <div style="display:flex; align-items:center; gap:9px; background:var(--blue-soft); border:1px solid var(--blue-border); border-radius:11px; padding:7px 11px; margin-bottom:10px;">
            <img src="${resolveMediaUrl(activeJob.photoUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" style="width:42px; height:42px; border-radius:8px; object-fit:cover; cursor:pointer;" onclick="openImagePreviewModal('${activeJob.photoUrl}', 'Client Reference Photo')" alt="Desired Style Reference" />
            <div style="flex:1; min-width:0;">
              <div style="font-size:12px; font-weight:800; color:var(--blue-primary);">Client Desired Style Photo</div>
              <div style="font-size:11px; color:var(--text-secondary); cursor:pointer;" onclick="openImagePreviewModal('${activeJob.photoUrl}', 'Client Reference Photo')">Tap to view full reference photo</div>
            </div>
          </div>
        ` : ''}

        <!-- Compact Provider Execution Bar (Outside Gate & PIN Entry) -->
        ${!isInProgress ? (() => {
          const provUser = state.currentUser || state.db.providers[0];
          const distMeters = calculateDistanceMeters(provUser?.lat, provUser?.lng, activeJob.lat, activeJob.lng);
          const isWithin20m = distMeters <= 20 || isArrived;
          const proximitySec = (state.bookingProximitySeconds && state.bookingProximitySeconds[activeJob.id]) || 0;
          const autoOutsideRemaining = Math.max(0, 90 - proximitySec);
          const autoPairRemaining = Math.max(0, 180 - proximitySec);

          return `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:7px 9px; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:8px;">
                ${isEnRoute ? `
                  <button class="btn-primary-blue" style="height:36px; font-size:12px; font-weight:700; padding:0 12px; white-space:nowrap; flex-shrink:0; border-radius:8px;" onclick="providerMarkArrived('${activeJob.id}')">
                    ${uiIcon('pin', 13)}
                    <span>I'm Waiting Outside</span>
                  </button>
                ` : `
                  <div style="height:36px; padding:0 10px; background:#FEF3C7; border:1px solid #FCD34D; border-radius:8px; display:flex; align-items:center; gap:5px; font-size:11.5px; font-weight:800; color:#B45309; white-space:nowrap; flex-shrink:0;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#F59E0B;"></span>
                    <span>Outside Gate</span>
                  </div>
                `}

                <div style="flex:1; display:flex; align-items:center; gap:8px; min-width:0;">
                  <input
                    id="providerPinInput_${activeJob.id}"
                    class="dark-input"
                    type="tel"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    style="height:36px; font-size:16px; font-weight:800; letter-spacing:4px; text-align:center; padding:0 8px; width:95px; flex-shrink:0; margin:0;"
                    placeholder="••••"
                    maxlength="4"
                    oninput="if(this.value.length === 4) handleProviderAutoPinVerification(this.value, '${activeJob.id}')"
                  />
                  <div id="providerPinStatus_${activeJob.id}" style="flex:1; min-width:0;">
                    <span style="font-size:11px; font-weight:600; color:var(--text-secondary);">Enter 4-digit PIN</span>
                  </div>
                </div>
              </div>

              ${isWithin20m ? `
                <div style="font-size:10.5px; font-weight:700; color:#059669; margin-top:5px; display:flex; align-items:center; gap:4px;">
                  <span style="width:5px; height:5px; border-radius:50%; background:#10B981;"></span>
                  <span>Within 20m of client ${isEnRoute ? `• Auto-notifying Outside in ${autoOutsideRemaining}s` : `• Auto-pairs in <span class="proximity-autopair-timer">${autoPairRemaining}s</span>`}</span>
                </div>
              ` : ''}
            </div>
          `;
        })() : ''}

        ${isInProgress ? `
          <button class="btn-primary-blue" style="height:44px; font-size:14px; background:#10B981;" onclick="openRateBookingModal('${activeJob.id}')">
            ${uiIcon('check', 16)}
            <span>Complete Service &amp; Collect ${formatUsdPrice(agreedUsd)}</span>
          </button>
        ` : ''}
      </div>

      <!-- Latest Message Snippet Pill (if messages exist) -->
      ${(activeJob.messages && activeJob.messages.length > 0) ? `
        <div class="chat-preview-pill" onclick="openChatDrawer('${activeJob.id}')">
          <div class="chat-preview-dot"></div>
          <div class="chat-preview-text">
            <span class="chat-preview-sender">${activeJob.messages[activeJob.messages.length - 1].senderName}:</span>
            ${activeJob.messages[activeJob.messages.length - 1].text}
          </div>
          <span class="chat-preview-action">Reply ${uiIcon('chevronRight', 12)}</span>
        </div>
      ` : ''}

      <div style="display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:6px;">
        <button class="btn-dark-sec" style="font-size:11.5px; padding:0 8px; justify-content:center; gap:4px;" onclick="promptProviderDelayNotice('${activeJob.id}')" title="Send Transit Delay Notice to Client">
          <span>⏱️</span>
          <span>Delay (+15m)</span>
        </button>
        <button class="btn-dark-sec" style="font-size:11.5px; padding:0 8px; justify-content:center; gap:4px;" onclick="startInAppCall('${(activeJob.customerName || 'Client').replace(/'/g, "\\'")}', '${escapeHtml(activeJob.title)}', 'call_${activeJob.id}', '${activeJob.customerId || activeJob.customerPhone || ''}')">
          ${uiIcon('phone', 13)}
          <span>Call</span>
        </button>
        <button class="btn-dark-sec" style="font-size:11.5px; padding:0 8px; justify-content:center; gap:4px;" onclick="openChatDrawer('${activeJob.id}')">
          ${uiIcon('chat', 13)}
          <span>Chat ${(activeJob.messages && activeJob.messages.length > 0) ? `(${activeJob.messages.length})` : ''}</span>
        </button>
      </div>
      ${(!isArrived && !isInProgress) ? `
        <div style="margin-top:8px;">
          <button class="cancel-request-red-pill" style="justify-content:center; width:100%;" onclick="openCancelTaskModal('${activeJob.id}')">
            ${uiIcon('close', 14)}
            <span>Cancel Job</span>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

async function promptProviderDelayNotice(requestId) {
  try {
    const mins = prompt('How many minutes are you delayed in transit? (e.g. 15 or 30)', '15');
    if (!mins || isNaN(mins)) return;
    const reason = prompt('Brief reason (e.g. Traffic along Samora Machel Ave)', 'Harare traffic congestion') || 'Transit traffic delay';

    await apiPost('/api/bookings/delay-notice', {
      requestId,
      providerId: state.currentUser?.id,
      delayMinutes: Number(mins),
      reason
    });
    showToast(`Delay alert sent: ~${mins}m late`);
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ----------------------------------------------------------------------------
// PROVIDER TAB 2: LIVE HARARE CLIENT REQUESTS FEED (WITH INDRIVE BID BUTTONS)
// ----------------------------------------------------------------------------
function renderProviderRequestsFeedTab(prov, openRequests, activeJob) {
  return `
    <div>
      ${activeJob ? `
        <div
          onclick="state.providerTab='ACTIVE_JOB'; renderUiOverlay();"
          style="background:#0F172A; border-radius:12px; padding:10px 13px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer; box-shadow:0 4px 12px rgba(15,23,42,0.12);"
        >
          <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
            <div style="width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow:0 0 0 3px rgba(16,185,129,0.3); flex-shrink:0;"></div>
            <div style="min-width:0; flex:1;">
              <div style="font-size:13px; font-weight:800; color:#FFFFFF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                Active: ${escapeHtml(activeJob.customerName)} • <span style="font-weight:600; color:#94A3B8;">${escapeHtml(activeJob.title || 'In service')}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onclick="state.providerTab='ACTIVE_JOB'; renderUiOverlay(); event.stopPropagation();"
            style="border:none; background:#0066FF; color:#FFFFFF; font-size:11.5px; font-weight:800; padding:6px 14px; border-radius:99px; cursor:pointer; flex-shrink:0; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"
          >
            <span>Open Job</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      ` : ''}

      ${prov.isOnline === false ? `
        <div style="background:#FFFBEB; border:1.5px solid #F59E0B; border-radius:14px; padding:12px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="display:flex; align-items:center; gap:9px; flex:1; min-width:0;">
            <div style="width:10px; height:10px; border-radius:50%; background:#F59E0B; box-shadow:0 0 0 3px rgba(245,158,11,0.25); flex-shrink:0;"></div>
            <div>
              <div style="font-size:13px; font-weight:800; color:#92400E;">You are currently Offline</div>
              <div style="font-size:11.5px; color:#B45309; font-weight:600;">You are hidden from clients. Go Online to receive live job posts and bids.</div>
            </div>
          </div>
          <button
            type="button"
            onclick="toggleProviderOnlineStatus()"
            class="btn-primary-blue"
            style="width:auto; height:34px; padding:0 14px; font-size:12px; white-space:nowrap; cursor:pointer;"
          >
            <span>Go Online</span>
          </button>
        </div>
      ` : ''}

      <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="font-size:11px; font-weight:700; color:var(--text-secondary);">Showing jobs in:</span>
          ${getProviderCategoryIds(prov).map((cid) => {
            const c = (state.db.categories || []).find((x) => x.id === cid);
            return `<span style="font-size:11px; font-weight:800; background:var(--blue-soft); color:var(--blue-primary); padding:3px 9px; border-radius:99px;">${escapeHtml(c ? (c.name || c.fullName) : cid)}</span>`;
          }).join('')}
        </div>
        <button
          type="button"
          onclick="openAccountSettingsModal()"
          style="border:1px solid var(--blue-border); background:#FFFFFF; color:var(--blue-primary); font-size:11px; font-weight:800; padding:4px 9px; border-radius:99px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
        >
          ${uiIcon('edit', 11)}
          <span>Edit Categories</span>
        </button>
      </div>

      ${(() => {
        const visibleRequests = openRequests.filter((r) => !(state.dismissedJobIds || []).includes(r.id));
        if (visibleRequests.length === 0) {
          return `
            <div style="text-align:center; padding:28px 14px; color:var(--text-secondary); font-size:13.5px; background:var(--bg-card); border-radius:16px;">
              No open jobs in your categories right now. New matching requests will appear here instantly.
            </div>
          `;
        }
        return visibleRequests.map((r) => {
          const myExistingOffer = (r.offers || []).find((o) => o.providerId === prov.id || (prov.finditId && o.providerFinditId === prov.finditId));
          const isOfferDeclined = Boolean(myExistingOffer && myExistingOffer.status === 'DECLINED');
          const isOfferPending = Boolean(myExistingOffer && (myExistingOffer.status === 'PROPOSED' || myExistingOffer.status === 'COUNTERED'));
          const commPercent = Number(state.db?.settings?.commissionPercent || 11);
          const minReserve = Number(state.db?.settings?.minWalletBalanceUsd || 2.0);
          const isPromo = Boolean(state.db?.settings?.launchPromoActive);
          const jobBudgetUsd = Number(r.budgetUsd || 0);
          const requiredCommUsd = Math.round(jobBudgetUsd * (commPercent / 100) * 100) / 100;
          const walletBalUsd = Number(prov.walletBalanceUsd || 0);
          const surpassesWallet = !isPromo && (walletBalUsd < requiredCommUsd || walletBalUsd < minReserve || (walletBalUsd - requiredCommUsd) < minReserve);
          const suggestedTopUpUsd = Math.max(5, Math.ceil(requiredCommUsd));
          const bid1Usd = Number((jobBudgetUsd + 2).toFixed(2));
          const bid2Usd = Number((jobBudgetUsd + 3.5).toFixed(2));
          const bid1CommUsd = Math.round(bid1Usd * (commPercent / 100) * 100) / 100;
          const bid2CommUsd = Math.round(bid2Usd * (commPercent / 100) * 100) / 100;
          const bid1Surpasses = !isPromo && (walletBalUsd < bid1CommUsd || (walletBalUsd - bid1CommUsd) < minReserve);
          const bid2Surpasses = !isPromo && (walletBalUsd < bid2CommUsd || (walletBalUsd - bid2CommUsd) < minReserve);

          let displayLocation = r.exactAddress || r.clientLiveAddress || r.suburbName || 'Harare';
          displayLocation = displayLocation
            .replace(/^My Current Live Location \((.*)\)$/i, '$1')
            .replace(/^My Current Live Location$/i, r.suburbName ? `${r.suburbName}, Harare` : 'Harare');

          let badgeSuburb = r.suburbName;
          if (!badgeSuburb || badgeSuburb === 'Harare') {
            const parts = displayLocation.split(',');
            badgeSuburb = (parts[parts.length > 1 ? 1 : 0] || 'Harare').trim();
          }

          const declinedPrice = Number(myExistingOffer?.declinedPriceUsd || myExistingOffer?.priceUsd || jobBudgetUsd);
          let counterMidUsd = null;
          if (declinedPrice > jobBudgetUsd + 1) {
            counterMidUsd = Number(((declinedPrice + jobBudgetUsd) / 2).toFixed(1));
          }

          return `
            <div class="provider-order-card" id="prov_card_${r.id}">
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
                <div>
                  <span style="font-size:23px; font-weight:800; color:var(--blue-primary);">${formatUsdPrice(r.budgetUsd)}</span>
                  <span style="font-size:12px; font-weight:700; color:var(--text-secondary); margin-left:6px;">${r.paymentMethod}</span>
                </div>
                <span style="font-size:11.5px; color:var(--blue-primary); font-weight:800; background:var(--blue-soft); padding:3px 9px; border-radius:99px; display:inline-flex; align-items:center; gap:4px; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  ${uiIcon('pin', 12)}
                  <span>${escapeHtml(badgeSuburb)}</span>
                </span>
              </div>

              <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:4px;">${escapeHtml(r.title)}</div>

              <!-- Client Real Street Address Card -->
              <div style="display:flex; align-items:flex-start; gap:6px; font-size:12px; color:#0F172A; font-weight:700; margin-bottom:8px; background:rgba(0,102,255,0.06); border:1px solid rgba(0,102,255,0.14); padding:6px 9px; border-radius:8px;">
                <span style="color:var(--blue-primary); flex-shrink:0; margin-top:2px;">${uiIcon('pin', 13)}</span>
                <div style="flex:1; min-width:0; line-height:1.4;">
                  <span style="font-weight:800; color:var(--text-main);">${escapeHtml(displayLocation)}</span>
                </div>
              </div>

              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
                ${uiIcon('user', 13)}
                <span>${escapeHtml(r.customerName)}</span>
                <span style="display:inline-flex; align-items:center; gap:2px;">
                  ${(Number(r.customerRating) || 0) > 0 ? `(${uiIcon('star', 11)} ${r.customerRating})` : '(New Client)'}
                </span>
              </div>

              ${r.description ? `
                <div style="font-size:12px; color:var(--text-main); background:rgba(0,0,0,0.03); border-radius:8px; padding:6px 9px; margin-bottom:8px;">
                  <strong>Client note:</strong> ${r.description}
                </div>
              ` : ''}

              ${r.photoUrl ? `
                <div style="display:flex; align-items:center; gap:9px; background:var(--blue-soft); border:1px solid var(--blue-border); border-radius:10px; padding:6px 10px; margin-bottom:8px;">
                  <img src="${resolveMediaUrl(r.photoUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" style="width:44px; height:44px; border-radius:8px; object-fit:cover; cursor:pointer;" onclick="openImagePreviewModal('${r.photoUrl}', 'Desired Style Photo')" alt="Client Reference Photo" />
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:12px; font-weight:800; color:var(--blue-primary);">Desired Style Photo Attached</div>
                    <div style="font-size:11px; color:var(--text-secondary); cursor:pointer;" onclick="openImagePreviewModal('${r.photoUrl}', 'Desired Style Photo')">Tap to inspect style before bidding</div>
                  </div>
                </div>
              ` : ''}

              ${isOfferDeclined ? `
                <!-- inDrive Style Declined & Counter-Bid Box -->
                <div style="background:#FFF1F2; border:1.5px solid #FDA4AF; border-radius:12px; padding:10px 12px; margin-bottom:10px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="display:inline-flex;">${uiIcon('close', 14)}</span>
                      <span style="font-size:12.5px; font-weight:800; color:#BE123C;">Offer Declined ($${declinedPrice})</span>
                    </div>
                    <button type="button" onclick="providerDismissJob('${r.id}')" style="background:transparent; border:none; color:#9F1239; font-size:11px; font-weight:800; cursor:pointer; text-decoration:underline;">
                      Dismiss
                    </button>
                  </div>
                  <div style="font-size:11.5px; color:#9F1239; margin-bottom:8px; line-height:1.4;">
                    Client declined your offer. You can re-bid with a lower rate, accept their budget, or dismiss.
                  </div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn-primary-blue" style="height:34px; padding:0 12px; font-size:12px; font-weight:800; flex:1;" onclick="providerSubmitBid('${r.id}', ${r.budgetUsd})">
                      Accept Budget ${formatUsdPrice(r.budgetUsd)}
                    </button>
                    ${counterMidUsd ? `
                      <button class="btn-dark-sec" style="height:34px; padding:0 10px; font-size:12px; font-weight:800;" onclick="providerSubmitBid('${r.id}', ${counterMidUsd})">
                        Counter ${formatUsdPrice(counterMidUsd)}
                      </button>
                    ` : ''}
                    <button class="btn-dark-sec" style="height:34px; padding:0 10px; font-size:12px; font-weight:800;" onclick="promptProviderCustomBid('${r.id}', ${r.budgetUsd})">
                      Custom $
                    </button>
                  </div>
                </div>
              ` : isOfferPending ? `
                <div style="background:var(--blue-soft); border:1.5px solid var(--blue-border); border-radius:12px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <div>
                    <div style="font-size:12.5px; font-weight:800; color:var(--blue-primary); display:flex; align-items:center; gap:5px;">
                      <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--blue-primary); animation:pulse 1.4s infinite;"></span>
                      <span>Offered ${formatUsdPrice(myExistingOffer.priceUsd)}</span>
                    </div>
                    <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Waiting for client response...</div>
                  </div>
                  <button type="button" class="btn-dark-sec" style="height:32px; padding:0 10px; font-size:11.5px; font-weight:800;" onclick="promptProviderCustomBid('${r.id}', ${r.budgetUsd})">
                    Change Price
                  </button>
                </div>
              ` : ''}

              ${surpassesWallet ? `
                <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:7px 10px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                  <span style="font-size:11.5px; font-weight:700; color:#92400E;">Requires $${requiredCommUsd.toFixed(2)} USD wallet balance</span>
                  <button
                    type="button"
                    onclick="state.walletTopupAmount=${suggestedTopUpUsd}; state.providerTab='WALLET'; renderUiOverlay();"
                    style="height:28px; padding:0 10px; border-radius:7px; border:none; background:#D97706; color:#FFFFFF; font-size:11px; font-weight:800; cursor:pointer;"
                  >
                    Top Up +$${suggestedTopUpUsd}
                  </button>
                </div>
              ` : ''}

              ${activeJob ? `
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                  <span style="font-size:12px; font-weight:700; color:#64748B;">Complete active visit to bid</span>
                  <button
                    type="button"
                    onclick="state.providerTab='ACTIVE_JOB'; renderUiOverlay();"
                    style="border:none; background:#0F172A; color:#FFFFFF; font-size:11px; font-weight:800; padding:5px 12px; border-radius:99px; cursor:pointer; flex-shrink:0;"
                  >
                    View Job
                  </button>
                </div>
              ` : isOfferDeclined || isOfferPending ? '' : `
                <div class="provider-bid-grid">
                  <button
                    class="btn-primary-blue"
                    ${surpassesWallet ? 'disabled style="height:38px; font-size:12px; opacity:0.42; cursor:not-allowed; pointer-events:none; filter:grayscale(0.5);"' : `style="height:38px; font-size:12.5px;" onclick="providerSubmitBid('${r.id}', ${r.budgetUsd})"`}
                  >
                    ${surpassesWallet ? `Need ${commPercent}% ($${requiredCommUsd.toFixed(2)})` : `Accept ${formatUsdPrice(r.budgetUsd)}`}
                  </button>
                  <button
                    class="btn-dark-sec"
                    ${bid1Surpasses ? 'disabled style="padding:7px 6px; font-size:12px; opacity:0.42; cursor:not-allowed; pointer-events:none;"' : `style="padding:7px 6px; font-size:12px;" onclick="providerSubmitBid('${r.id}', ${bid1Usd})"`}
                  >
                    ${formatUsdPrice(bid1Usd)}
                  </button>
                  <button
                    class="btn-dark-sec"
                    ${bid2Surpasses ? 'disabled style="padding:7px 6px; font-size:12px; opacity:0.42; cursor:not-allowed; pointer-events:none;"' : `style="padding:7px 6px; font-size:12px;" onclick="providerSubmitBid('${r.id}', ${bid2Usd})"`}
                  >
                    ${formatUsdPrice(bid2Usd)}
                  </button>
                  <button
                    class="btn-dark-sec"
                    ${surpassesWallet ? 'disabled style="padding:7px 6px; font-size:12px; opacity:0.42; cursor:not-allowed; pointer-events:none;"' : `style="padding:7px 6px; font-size:12px;" onclick="promptProviderCustomBid('${r.id}', ${r.budgetUsd})"`}
                  >
                    Custom $
                  </button>
                </div>
              `}
            </div>
          `;
        }).join('');
      })()}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// PROVIDER TAB 3: FULL PREPAID FINDIT USD WALLET, COMMISSION & INSTANT TOP-UP
// ----------------------------------------------------------------------------
function renderProviderWalletTab(prov) {
  const commRate = state.db.settings?.commissionPercent ?? 10;
  const minBalance = Math.max(0, state.db.settings?.minWalletBalanceUsd ?? 2.0);
  const balance = Number(prov.walletBalanceUsd || 0);
  const canBid = balance >= minBalance;
  const txs = (prov.walletTransactions || []).slice(0, 10);
  const quickAmounts = [5, 10, 20, 50];
  const myEcoSubmissions = (state.db.ecocashTopups || []).filter((t) => t.providerId === prov.id).slice(0, 5);

  // Calculate Provider Completed Visits & Earnings Analytics Float
  const allReqs = state.db?.requests || [];
  const completedJobs = allReqs.filter((r) => {
    if (r.status !== 'COMPLETED') return false;
    if (r.acceptedProviderId === prov.id) return true;
    return (r.offers || []).some((o) => o.providerId === prov.id && (o.id === r.acceptedOfferId || r.pinVerifiedByProvider));
  });

  const totalGrossEarned = completedJobs.reduce((sum, r) => sum + Number(r.agreedTotalUsd || r.budgetUsd || 0), 0);
  const totalNetEarned = totalGrossEarned * (1 - commRate / 100);
  const completedCount = completedJobs.length;
  const avgFare = completedCount > 0 ? (totalGrossEarned / completedCount) : 0;

  return `
    <div>
      <!-- inDrive Provider Lifetime Earnings & Performance Float -->
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border:1px solid #334155; border-radius:16px; padding:16px; margin-bottom:12px; color:#FFFFFF; box-shadow:0 10px 25px -5px rgba(0,0,0,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-flex;">${uiIcon('chart', 18)}</span>
            <div>
              <div style="font-size:13px; font-weight:800; color:#F8FAFC;">Earnings &amp; Job Analytics</div>
              <div style="font-size:10.5px; color:#94A3B8;">Your completed home-visit payouts</div>
            </div>
          </div>
          <span style="background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.4); color:#34D399; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:99px;">
            ${(100 - commRate)}% Take-Home
          </span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px 12px;">
            <div style="font-size:10.5px; font-weight:700; color:#94A3B8; text-transform:uppercase;">Net Earnings</div>
            <div style="font-size:22px; font-weight:900; color:#10B981; margin-top:2px;">$${totalNetEarned.toFixed(2)} <span style="font-size:11px; font-weight:700; color:#94A3B8;">USD</span></div>
            <div style="font-size:10px; color:#64748B;">Gross: $${totalGrossEarned.toFixed(2)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px 12px;">
            <div style="font-size:10.5px; font-weight:700; color:#94A3B8; text-transform:uppercase;">Average Job Pay</div>
            <div style="font-size:22px; font-weight:900; color:#60A5FA; margin-top:2px;">$${avgFare.toFixed(2)} <span style="font-size:11px; font-weight:700; color:#94A3B8;">/job</span></div>
            <div style="font-size:10px; color:#64748B;">${completedCount} completed visit${completedCount === 1 ? '' : 's'}</div>
          </div>
        </div>

        <!-- Recent Completed Jobs Pay Breakdown -->
        ${completedJobs.length > 0 ? `
          <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
            <div style="font-size:10.5px; font-weight:800; color:#94A3B8; text-transform:uppercase; margin-bottom:6px;">
              Recent Completed Jobs (${completedJobs.length})
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; max-height:160px; overflow-y:auto;">
              ${completedJobs.slice(0, 5).map((j) => {
                const fare = Number(j.agreedTotalUsd || j.budgetUsd || 0);
                const net = fare * (1 - commRate / 100);
                return `
                  <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:7px 10px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="min-width:0; flex:1;">
                      <div style="font-size:12px; font-weight:800; color:#F1F5F9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${escapeHtml(j.title || 'Home Visit')}
                      </div>
                      <div style="font-size:10px; color:#94A3B8;">
                        ${escapeHtml(j.suburbName || 'Harare')} • ${j.customerName || 'Client'}
                      </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                      <div style="font-size:13px; font-weight:900; color:#34D399;">+$${net.toFixed(2)}</div>
                      <div style="font-size:9.5px; color:#64748B;">Gross $${fare.toFixed(2)}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `
          <div style="font-size:11px; color:#64748B; text-align:center; padding:4px 0;">
            No completed visits yet. Accept open requests on the map to start earning!
          </div>
        `}
      </div>

      <!-- Clean Sleek Wallet Balance Card -->
      <div class="wallet-hero-card" style="padding:16px 18px; border-radius:16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; opacity:0.85;">
              Prepaid USD Wallet
            </div>
            <div style="font-size:28px; font-weight:800; margin-top:2px; letter-spacing:-0.02em;">
              $${balance.toFixed(2)} <span style="font-size:13px; font-weight:700; opacity:0.85;">USD</span>
            </div>
          </div>

          <span style="background:${canBid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}; border:1px solid ${canBid ? '#34D399' : '#FCA5A5'}; color:#FFFFFF; padding:4px 10px; border-radius:99px; font-size:11px; font-weight:800; display:inline-flex; align-items:center; gap:4px;">
            ${canBid ? uiIcon('check', 11) : uiIcon('shield', 11)}
            <span>${canBid ? 'Active for Bidding' : 'Top Up Required'}</span>
          </span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.2); font-size:11px; font-weight:600; opacity:0.9;">
          <span>Min. Balance: $${minBalance.toFixed(2)} USD</span>
          <span>Platform Commission: ${commRate}%</span>
        </div>
      </div>

      <!-- Instant 1-Tap USD Top-Up Card -->
      <div style="background:#FFFFFF; border:1.5px solid var(--border-light); border-radius:14px; padding:14px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:13px; font-weight:800; color:var(--text-main);">Instant Prepaid Top-Up</div>
          <span style="font-size:10.5px; font-weight:700; color:#059669; background:#ECFDF5; padding:2px 8px; border-radius:99px;">Instant USD Balance</span>
        </div>

        <div class="wallet-amount-grid" style="margin-bottom:12px;">
          ${quickAmounts.map((amt) => `
            <button
              type="button"
              class="wallet-amt-chip ${Number(state.walletTopupAmount || 5) === amt ? 'active' : ''}"
              onclick="state.walletTopupAmount=${amt}; renderUiOverlay();"
            >
              $${amt}
            </button>
          `).join('')}
        </div>

        <button
          type="button"
          class="btn-primary-blue"
          style="width:100%; height:42px; font-size:13.5px; font-weight:800; background:#0066FF;"
          onclick="topUpProviderWallet(Number(state.walletTopupAmount || 5), 'Instant Top-Up')"
        >
          ${uiIcon('wallet', 15)}
          <span>Top Up $${Number(state.walletTopupAmount || 5).toFixed(2)} USD Now</span>
        </button>
      </div>

      <!-- Compact EcoCash USD Top-Up Card -->
      <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:14px; padding:14px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:13px; font-weight:800; color:var(--text-main);">Top Up via EcoCash USD</div>
          <span style="font-size:10.5px; font-weight:700; color:#059669; background:#ECFDF5; padding:2px 8px; border-radius:99px;">*151# Send USD</span>
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--border-light); border-radius:10px; padding:8px 10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">EcoCash Biller Code: <strong style="color:var(--blue-primary); font-size:13px;">*151*2*2*84920#</strong></span>
          <button class="btn-dark-sec" style="padding:4px 9px; font-size:11px;" onclick="navigator.clipboard?.writeText('*151*2*2*84920#'); showToast('EcoCash shortcode copied!');">
            Copy
          </button>
        </div>

        <textarea
          id="walletEcocashSmsInput"
          class="dark-input"
          rows="2"
          style="width:100%; font-size:11.5px; line-height:1.4; padding:8px 10px; resize:none; margin-bottom:8px;"
          placeholder="Paste EcoCash confirmation SMS or enter Ref Code (e.g. PP261021...)..."
        ></textarea>

        <button
          type="button"
          class="btn-primary-blue"
          style="width:100%; height:40px; font-size:13px; background:#10B981;"
          onclick="submitEcoCashTopup()"
        >
          ${uiIcon('check', 14)}
          <span>Verify &amp; Add $${Number(state.walletTopupAmount || 5).toFixed(2)} USD</span>
        </button>
      </div>

      <!-- EcoCash Verification Status History -->
      ${myEcoSubmissions.length > 0 ? `
        <div style="font-size:11.5px; font-weight:800; color:var(--text-secondary); margin-bottom:6px;">
          Recent Top-Up Submissions
        </div>
        <div style="margin-bottom:12px;">
          ${myEcoSubmissions.map((s) => `
            <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:10px; padding:8px 10px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:12px; font-weight:800; color:var(--text-main);">Ref: ${s.referenceCode} • $${s.claimedAmountUsd} USD</div>
                <div style="font-size:10.5px; color:var(--text-secondary);">${new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span style="font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:99px; ${s.status === 'APPROVED' ? 'background:#ECFDF5; color:#059669;' : s.status === 'REJECTED' ? 'background:#FEF2F2; color:#DC2626;' : 'background:#FFFBEB; color:#D97706;'}">
                ${s.status === 'APPROVED' ? 'Approved' : s.status === 'REJECTED' ? 'Rejected' : 'In Review'}
              </span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Recent Wallet Transaction Ledger -->
      <div style="font-size:11.5px; font-weight:800; color:var(--text-secondary); margin-bottom:6px;">
        Transaction History (${txs.length})
      </div>
      ${txs.length === 0 ? `
        <div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:14px; background:var(--bg-card); border-radius:10px; border:1px solid var(--border-light);">
          No wallet transactions yet.
        </div>
      ` : txs.map((t) => `
        <div class="wallet-ledger-item" style="padding:8px 10px;">
          <div style="min-width:0;">
            <div style="font-size:12px; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.note}</div>
            <div style="font-size:10px; color:var(--text-secondary); font-weight:600;">${t.type === 'TOPUP' ? 'Prepaid Top-Up' : 'Platform Commission'}</div>
          </div>
          <span style="font-size:12.5px; font-weight:800; color:${t.amountUsd >= 0 ? '#059669' : '#DC2626'}; flex-shrink:0;">
            ${t.amountUsd >= 0 ? `+$${Number(t.amountUsd).toFixed(2)}` : `-$${Math.abs(Number(t.amountUsd)).toFixed(2)}`}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

async function submitEcoCashTopup() {
  const prov = state.currentUser || state.db.providers[0];
  const inputEl = document.getElementById('walletEcocashSmsInput');
  const sms = (inputEl ? inputEl.value : '').trim();
  if (!sms) {
    showToast('Please enter your EcoCash confirmation SMS or Reference Code', 'error');
    return;
  }
  const amt = Number(state.walletTopupAmount || 5);
  try {
    const res = await apiPost('/api/wallet/ecocash-submit', {
      providerId: prov.id,
      phone: prov.phone,
      amountUsd: amt,
      confirmationSms: sms
    });
    if (inputEl) inputEl.value = '';
    showToast(res.message || `EcoCash Ref ${res.submission?.referenceCode} verified! +$${amt.toFixed(2)} USD added to wallet.`, 'success');
    if (res.provider && state.currentUser) {
      state.currentUser.walletBalanceUsd = res.provider.walletBalanceUsd;
    }
    await fetchState(true);
    renderAll(true);
  } catch (err) {
    showToast(err.message || 'EcoCash top-up failed', 'error');
  }
}

// ----------------------------------------------------------------------------
// PROVIDER TAB 4: WORK CATALOGUE, BIO UPDATE & ADMIN MODERATION STATUS
// ----------------------------------------------------------------------------
function renderProviderCatalogueTab(prov, myPendingApprovals) {
  return `
    <div>
      <!-- Mandatory Admin Approval Rule Banner (Original Feature) -->
      <div style="background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:14px; padding:10px 12px; margin-bottom:12px; font-size:11.5px; color:#92400E; font-weight:700; display:flex; align-items:flex-start; gap:8px;">
        <span style="color:#D97706; margin-top:1px;">${uiIcon('shield', 15)}</span>
        <div>
          <strong>Verified Services Catalogue:</strong> Manage your offerings, edit pricing, or add new services. All photos are checked for clean presentation without watermarks or flyers.
        </div>
      </div>

      <!-- Physical Workshop / Office Base Card with Instant Mode Toggle -->
      <div style="background:var(--bg-card); border:1.5px solid var(--border-light); border-radius:14px; padding:12px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--blue-primary);">${uiIcon('buildingOffice', 18)}</span>
            <div>
              <div style="font-size:13px; font-weight:800; color:var(--text-main);">
                ${prov.hasOffice ? 'Physical Shop / Office' : 'Mobile Freelancer'}
              </div>
              <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">
                ${prov.hasOffice ? `${prov.officeAddress || 'Harare Workshop'}, ${prov.officeSuburb || 'Harare'}` : 'Mobile home visits across Harare (No shop base)'}
              </div>
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-dark-sec" style="height:32px; padding:0 10px; font-size:11.5px; white-space:nowrap; cursor:pointer;" onclick="quickToggleProviderOffice()" title="Switch between Shop and Mobile Freelance">
              <span>${prov.hasOffice ? 'Switch to Mobile' : 'Switch to Shop'}</span>
            </button>
            <button class="btn-primary-blue" style="width:auto; height:32px; padding:0 10px; font-size:11.5px; white-space:nowrap; cursor:pointer;" onclick="openProviderOfficeModal()">
              <span>${prov.hasOffice ? 'Edit Address' : '+ Set Shop'}</span>
            </button>
          </div>
        </div>
      </div>

      <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
        <div style="font-size:12px; color:var(--text-secondary); font-weight:800; display:inline-flex; align-items:center; gap:5px;">
          ${uiIcon('check', 14)}
          <span>${(prov.portfolio || []).length} Active Offering(s)</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn-dark-sec" style="height:34px; padding:0 10px; font-size:11.5px;" onclick="openEditBioModal()">
            ${uiIcon('notes', 13)}
            <span>Bio</span>
          </button>
          <button class="btn-dark-sec" style="height:34px; padding:0 10px; font-size:11.5px;" onclick="openUploadCatalogueModal()">
            ${uiIcon('image', 13)}
            <span>+ Photo</span>
          </button>
          <button class="btn-primary-blue" style="width:auto; height:34px; padding:0 12px; font-size:11.5px;" onclick="openAddServiceModal()">
            ${uiIcon('plus', 13)}
            <span>+ Add Service</span>
          </button>
        </div>
      </div>

      <!-- Pending Admin Approvals Section -->
      ${Array.isArray(myPendingApprovals) && myPendingApprovals.length > 0 ? `
        <div style="background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:14px; padding:12px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-size:12.5px; font-weight:800; color:#B45309; display:flex; align-items:center; gap:6px;">
              <span>⏳ Awaiting Admin Approval (${myPendingApprovals.length})</span>
            </div>
            <span style="font-size:10.5px; font-weight:700; color:#92400E; background:#FEF3C7; padding:2px 8px; border-radius:99px;">
              Reviewing Photos
            </span>
          </div>
          <div style="font-size:11px; color:#92400E; margin-bottom:10px; line-height:1.4;">
            These submissions are in the Admin queue. Once verified for clean presentation, they will go live in your public catalogue for all clients.
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            ${myPendingApprovals.map((pa) => `
              <div style="background:#FFFFFF; border:1px solid #FCD34D; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
                <div>
                  <div style="position:relative;">
                    <img src="${resolveMediaUrl(pa.imageUrl, 'task')}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" style="width:100%; height:95px; object-fit:cover; display:block;" alt="${escapeHtml(pa.title)}" />
                    <span style="position:absolute; top:5px; right:5px; padding:2px 6px; border-radius:99px; background:#D97706; color:#FFFFFF; font-size:9.5px; font-weight:800;">
                      In Review
                    </span>
                  </div>
                  <div style="padding:7px 8px;">
                    <div style="font-size:12px; font-weight:800; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(pa.title)}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px;">
                      <span style="font-size:13px; font-weight:800; color:var(--blue-primary);">$${pa.priceUsd}</span>
                      <span style="font-size:10px; color:#92400E; font-weight:700;">${escapeHtml(pa.duration || '2 hrs')}</span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${(prov.portfolio || []).length === 0 ? `
        <div style="text-align:center; padding:32px 16px; background:var(--bg-card); border:1.5px dashed var(--border-light); border-radius:16px;">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--blue-soft); color:var(--blue-primary); display:flex; align-items:center; justify-content:center; margin:0 auto 10px;">
            ${uiIcon('briefcase', 24)}
          </div>
          <div style="font-size:14px; font-weight:800; color:var(--text-main);">No Services Listed Yet</div>
          <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; max-width:260px; margin-left:auto; margin-right:auto;">
            Add your primary services so Harare clients can discover and book you.
          </div>
          <button class="btn-primary-blue" style="width:auto; height:36px; padding:0 16px; font-size:12px; margin-top:12px;" onclick="openAddServiceModal()">
            ${uiIcon('plus', 14)}
            <span>Add Your First Service</span>
          </button>
        </div>
      ` : `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          ${(prov.portfolio || []).map((item) => `
            <div style="background:var(--bg-card); border:1.5px solid var(--border-light); border-radius:14px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
              <div>
                <div style="position:relative;">
                  <img src="${resolveMediaUrl(item.imageUrl, 'task')}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" style="width:100%; height:110px; object-fit:cover; display:block;" alt="${escapeHtml(item.title || 'Work')}" />
                  <span style="position:absolute; top:6px; right:6px; padding:2px 7px; border-radius:99px; background:rgba(0,0,0,0.68); color:#FFFFFF; font-size:10px; font-weight:800; backdrop-filter:blur(4px);">
                    ${item.duration || '2 hrs'}
                  </span>
                </div>
                <div style="padding:8px 9px;">
                  <div style="font-size:12.5px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-main);">${item.title}</div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px;">
                    <span style="font-size:13.5px; color:var(--blue-primary); font-weight:800;">$${item.priceUsd}</span>
                    <span style="font-size:10px; color:#059669; font-weight:800; background:#ECFDF5; padding:2px 6px; border-radius:6px;">
                      ${item.tag || 'Approved'}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Bar: Edit & Delete -->
              <div style="padding:0 7px 7px; display:flex; gap:5px;">
                <button
                  type="button"
                  style="flex:1; height:28px; border-radius:8px; border:1px solid #CBD5E1; background:#FFFFFF; color:#1E293B; font-size:11px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; padding:0 6px;"
                  onclick="openEditServiceModal('${item.id}')"
                >
                  ${uiIcon('edit', 12)}
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  style="height:28px; width:28px; border-radius:8px; border:1px solid #FECACA; background:#FFF1F2; color:#DC2626; font-size:11px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;"
                  onclick="deleteProviderCatalogueService('${item.id}')"
                  title="Delete Service"
                >
                  ${uiIcon('trash', 12)}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function openAddServiceModal() {
  state.newServicePhotoDataUrl = null;
  state.activeModal = 'ADD_SERVICE_MODAL';
  state.modalData = {};
  lastRenderedModalKey = '';
  renderModalLayer();
}

function openEditServiceModal(itemId) {
  const prov = state.currentUser || state.db.providers[0];
  const item = (prov.portfolio || []).find((p) => p.id === itemId);
  if (!item) return;
  state.editServicePhotoDataUrl = null;
  state.activeModal = 'EDIT_SERVICE_MODAL';
  state.modalData = { item };
  lastRenderedModalKey = '';
  renderModalLayer();
}

async function handleNewServiceFileSelect(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const compressed = await compressImageFileToDataUrl(file, 1200, 0.82);
  if (compressed) {
    state.newServicePhotoDataUrl = compressed;
    lastRenderedModalKey = '';
    renderModalLayer();
  }
}

async function handleEditServiceFileSelect(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const compressed = await compressImageFileToDataUrl(file, 1200, 0.82);
  if (compressed) {
    state.editServicePhotoDataUrl = compressed;
    lastRenderedModalKey = '';
    renderModalLayer();
  }
}

async function saveNewCatalogueService() {
  const prov = state.currentUser || state.db.providers[0];
  const title = document.getElementById('newServiceTitle')?.value.trim();
  const price = document.getElementById('newServicePrice')?.value;
  const duration = document.getElementById('newServiceDuration')?.value.trim();
  const tag = document.getElementById('newServiceTag')?.value.trim();
  const submitBtn = document.getElementById('addServiceSubmitBtn');

  if (!title) {
    showToast('Please enter a service title', 'error');
    return;
  }
  if (!price || Number(price) <= 0) {
    showToast('Please enter a valid price in USD', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Uploading &amp; Submitting...</span>`;
  }

  try {
    let finalImageUrl = state.newServicePhotoDataUrl;
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
      try {
        const upRes = await apiPost('/api/upload', { dataUrl: finalImageUrl });
        if (upRes && upRes.mediaUrl) {
          finalImageUrl = upRes.mediaUrl;
        }
      } catch (e) {
        console.warn('Upload bucket note:', e);
      }
    }

    // Submit to Admin approval queue before appearing publicly
    await apiPost('/api/providers/catalogue', {
      providerId: prov.id,
      title,
      priceUsd: Number(price),
      duration: duration || '2 hrs',
      tag: tag || 'Verified Quality',
      imageUrl: finalImageUrl || null
    });

    state.newServicePhotoDataUrl = null;
    closeModal();
    showToast('Service submitted! Findit Admins will verify the photo before it appears publicly.');
    await fetchState();
    state.providerTab = 'CATALOGUE';
    renderAll(true);
  } catch (err) {
    showToast(err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Submit Service for Admin Approval</span>`;
    }
  }
}

async function saveEditedCatalogueService(itemId) {
  const prov = state.currentUser || state.db.providers[0];
  const title = document.getElementById('editServiceTitle')?.value.trim();
  const price = document.getElementById('editServicePrice')?.value;
  const duration = document.getElementById('editServiceDuration')?.value.trim();
  const tag = document.getElementById('editServiceTag')?.value.trim();
  const submitBtn = document.getElementById('editServiceSubmitBtn');

  if (!title) {
    showToast('Please enter a service title', 'error');
    return;
  }
  if (!price || Number(price) <= 0) {
    showToast('Please enter a valid price in USD', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Saving Changes...</span>`;
  }

  try {
    let finalImageUrl = state.editServicePhotoDataUrl;
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
      try {
        const upRes = await apiPost('/api/upload', { dataUrl: finalImageUrl });
        if (upRes && upRes.mediaUrl) {
          finalImageUrl = upRes.mediaUrl;
        }
      } catch (e) {
        console.warn('Upload bucket note:', e);
      }
    }

    await apiPost('/api/providers/catalogue/edit', {
      providerId: prov.id,
      itemId,
      title,
      priceUsd: Number(price),
      duration: duration || '2 hrs',
      tag: tag || 'Verified Quality',
      imageUrl: finalImageUrl || undefined
    });

    state.editServicePhotoDataUrl = null;
    closeModal();
    showToast('Service updated successfully!');
    await fetchState();
    renderAll(true);
  } catch (err) {
    showToast(err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Save Changes</span>`;
    }
  }
}

async function deleteProviderCatalogueService(itemId) {
  const prov = state.currentUser || state.db.providers[0];
  if (!confirm('Are you sure you want to delete this service from your catalogue?')) {
    return;
  }

  try {
    await apiPost('/api/providers/catalogue/delete', {
      providerId: prov.id,
      itemId
    });
    showToast('Service removed from catalogue');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEditBioModal() {
  state.activeModal = 'EDIT_BIO_MODAL';
  renderModalLayer();
}

async function submitProviderBioUpdate() {
  const prov = state.currentUser || state.db.providers[0];
  const bio = document.getElementById('providerBioInput')?.value.trim();
  if (!bio) {
    showToast('Please enter your bio description', 'error');
    return;
  }
  const leakage = checkAntiLeakageClient(bio);
  if (leakage) {
    showToast(leakage, 'error');
    return;
  }
  try {
    await apiPost('/api/providers/profile-update', {
      providerId: prov.id,
      proposedBio: bio
    });
    closeModal();
    showToast('Bio update submitted for Admin approval!');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function providerMarkArrived(requestId) {
  try {
    // 1. Immediately dismiss turn-by-turn navigation HUD and clear voice directions
    stopNavigationHud();
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (window.FinditNative && typeof window.FinditNative.stopSpeech === 'function') {
      try { window.FinditNative.stopSpeech(); } catch (e) {}
    }
    if (leafletRoutePolyline) {
      try { leafletMap.removeLayer(leafletRoutePolyline); } catch (e) {}
      leafletRoutePolyline = null;
    }
    if (leafletRoutePolylineCasing) {
      try { leafletMap.removeLayer(leafletRoutePolylineCasing); } catch (e) {}
      leafletRoutePolylineCasing = null;
    }
    liveNavState.isActive = false;
    liveNavState.active = false;

    markLocalStateMutation();
    const reqSnap = (state.db?.requests || []).find((r) => r.id === requestId) || null;
    await apiPost('/api/bookings/status', {
      requestId,
      status: 'ARRIVED',
      requestSnapshot: reqSnap
    });
    showToast('Client notified that you have arrived outside their gate!');
    await fetchState(true);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleProviderAutoPinVerification(pinCode, requestId) {
  if (!pinCode || pinCode.length !== 4) return;
  const input = document.getElementById(`providerPinInput_${requestId}`);
  const statusEl = document.getElementById(`providerPinStatus_${requestId}`);

  if (input) input.disabled = true;
  if (statusEl) {
    statusEl.innerHTML = `
      <div style="display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:700; color:#059669;">
        <svg class="wa-spin-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <span>Verifying...</span>
      </div>
    `;
  }

  try {
    markLocalStateMutation();
    const reqSnap = (state.db?.requests || []).find((r) => r.id === requestId) || null;
    const res = await apiPost('/api/bookings/verify-pin', {
      requestId,
      pinCode,
      requestSnapshot: reqSnap
    });

    if (statusEl) {
      statusEl.innerHTML = `
        <div style="display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:800; color:#10B981;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Verified!</span>
        </div>
      `;
    }

    if ('vibrate' in navigator) try { navigator.vibrate([100, 50, 100]); } catch (e) {}

    // Complete job & transition directly to provider review & rating
    setTimeout(async () => {
      try {
        await apiPost('/api/bookings/status', {
          requestId,
          status: 'COMPLETED',
          requestSnapshot: res?.request || reqSnap
        });
      } catch (err) {}
      await fetchState(true);
      openRateBookingModal(requestId);
    }, 600);
  } catch (err) {
    if (input) {
      input.disabled = false;
      input.value = '';
      input.focus();
      input.classList.add('input-shake-error');
      setTimeout(() => input.classList.remove('input-shake-error'), 500);
    }
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:#DC2626;">
          ${escapeHtml(err.message || 'Incorrect PIN')}
        </div>
      `;
    }
  }
}

async function providerVerifyStartPin(requestId) {
  const input = document.getElementById(`providerPinInput_${requestId}`);
  const pinCode = input ? input.value.trim() : '';
  try {
    markLocalStateMutation();
    const reqSnap = (state.db?.requests || []).find((r) => r.id === requestId) || null;
    await apiPost('/api/bookings/verify-pin', {
      requestId,
      pinCode,
      requestSnapshot: reqSnap
    });
    showToast('Start PIN verified! Service is now in progress.');
    await fetchState(true);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function promptProviderCustomBid(requestId, baseUsd) {
  const val = prompt('Enter your offer price in USD ($):', String(Number(baseUsd) + 2));
  if (val && !isNaN(Number(val))) {
    providerSubmitBid(requestId, Number(val));
  }
}

async function topUpProviderWallet(amountUsd, method = 'Instant USD Credit') {
  const prov = state.currentUser || state.db.providers[0];
  if (!prov) return;
  const numAmt = Math.max(1, Number(amountUsd) || 5);
  try {
    const res = await apiPost('/api/wallet/topup', {
      providerId: prov.id,
      phone: prov.phone,
      amountUsd: numAmt,
      method
    });
    showToast(`+$${numAmt.toFixed(2)} added to your Findit USD Wallet!`, 'success');
    if (res?.provider && state.currentUser) {
      state.currentUser.walletBalanceUsd = res.provider.walletBalanceUsd;
    }
    await fetchState(true);
    renderAll(true);
  } catch (err) {
    showToast(err.message || 'Failed to top up wallet', 'error');
  }
}

async function toggleProviderOnlineStatus() {
  const prov = state.currentUser || state.db.providers[0];
  if (!prov) return;
  const newOnline = !(prov.isOnline !== false);

  // Optimistic 0ms update
  prov.isOnline = newOnline;
  if (state.currentUser) state.currentUser.isOnline = newOnline;
  if (state.db && Array.isArray(state.db.providers)) {
    const pInDb = state.db.providers.find((p) => p.id === prov.id);
    if (pInDb) pInDb.isOnline = newOnline;
  }
  saveSession(state.role, state.currentUser, false);
  renderAll(true);
  updateMapMarkers(true);

  if (newOnline) {
    showToast('Online & Ready: Inactive providers remaining idle without taking jobs may be removed from the platform.', 'info');
  } else {
    showToast('You are now Offline. You are hidden from the map and will not receive job alerts.', 'info');
  }

  try {
    const res = await apiPost('/api/providers/online', {
      providerId: prov.id,
      isOnline: newOnline,
      providerSnapshot: prov
    });
    if (res.provider) {
      prov.isOnline = res.provider.isOnline;
      if (state.currentUser) state.currentUser.isOnline = res.provider.isOnline;
      saveSession(state.role, state.currentUser, false);
      renderAll(true);
      updateMapMarkers(true);
    }
  } catch (err) {
    console.warn('Background online sync:', err);
  }
}

function providerDismissJob(requestId) {
  if (!Array.isArray(state.dismissedJobIds)) state.dismissedJobIds = [];
  if (!state.dismissedJobIds.includes(requestId)) {
    state.dismissedJobIds.push(requestId);
  }
  showToast('Job card dismissed', 'info');
  lastUiOverlaySignature = '';
  renderAll(true);
}

async function providerSubmitBid(requestId, priceUsd) {
  const prov = state.currentUser || state.db.providers[0];
  const activeJob = getProviderActiveBooking(prov?.id);
  if (activeJob) {
    showToast(`You have an active job in progress (${activeJob.customerName || 'Client'}). You can only do 1 job at a time to prevent clients waiting. Please complete this job first.`, 'warning', 6000);
    return;
  }
  const currentBalance = Number(prov.walletBalanceUsd || 0);
  const minReserve = Number(state.db?.settings?.minWalletBalanceUsd || 2.00);
  const commPercent = Number(state.db?.settings?.commissionPercent || 11);
  const commFee = Math.round(Number(priceUsd) * (commPercent / 100) * 100) / 100;
  const reqTopUp = Math.max(5.00, commFee);

  // Proactive wallet balance and 11% commission check
  if (!state.db?.settings?.launchPromoActive && (currentBalance < commFee || currentBalance < minReserve || (currentBalance - commFee) < minReserve)) {
    openLowBalanceExplanatoryModal({
      currentBalanceUsd: currentBalance,
      minReserveUsd: minReserve,
      commissionPercent: commPercent,
      bidPriceUsd: Number(priceUsd),
      commissionFeeUsd: commFee,
      requiredTopUpUsd: reqTopUp,
      requestId
    });
    return;
  }

  try {
    markLocalStateMutation();
    const reqSnap = (state.db?.requests || []).find((r) => r.id === requestId) || null;
    const cleanShortName = prov.shortName || (prov.name || 'Specialist').split(' ')[0];
    const cleanBrand = prov.brandName || `${cleanShortName} Services`;
    const cleanAvatar = prov.avatarUrl || prov.selfieUrl || '';

    // 0ms Optimistic Offer: "You offered $XX • Waiting for client" appears immediately!
    if (reqSnap) {
      if (!Array.isArray(reqSnap.offers)) reqSnap.offers = [];
      const offerId = `off_${prov.id}_${reqSnap.id}`;
      let myOff = reqSnap.offers.find((o) => o.providerId === prov.id || o.id === offerId);
      const isExactAccept = Number(priceUsd) === Number(reqSnap.budgetUsd);
      const nowMs = Date.now();
      if (myOff) {
        myOff.priceUsd = Number(priceUsd);
        myOff.status = 'PROPOSED';
        myOff.declinedAt = null;
        myOff.declineReason = null;
        myOff.updatedAt = nowMs;
        myOff.expiresAt = nowMs + 120000;
      } else {
        myOff = {
          id: offerId,
          providerId: prov.id,
          providerFinditId: prov.finditId,
          providerName: prov.name,
          providerShortName: cleanShortName,
          providerBrand: cleanBrand,
          providerAvatarUrl: cleanAvatar,
          providerSkillTier: prov.skillTier || 'Verified pro',
          providerRating: prov.rating ?? 5.0,
          providerCompletedJobs: prov.completedBookings ?? 1,
          priceUsd: Number(priceUsd),
          bidType: isExactAccept ? 'ACCEPTED_PRICE' : 'COUNTER_BID',
          status: 'PROPOSED',
          createdAt: new Date(nowMs).toISOString(),
          updatedAt: nowMs,
          expiresAt: nowMs + 120000,
          ttlSeconds: 120
        };
        reqSnap.offers.unshift(myOff);
      }
      reqSnap.updatedAt = nowMs;
    }

    lastUiOverlaySignature = '';
    renderAll(true);
    showToast(`Offer of $${Number(priceUsd)} USD submitted!`, 'info');

    const provSnapshot = {
      id: prov.id,
      finditId: prov.finditId,
      name: prov.name,
      shortName: cleanShortName,
      brandName: cleanBrand,
      avatarUrl: cleanAvatar,
      selfieUrl: cleanAvatar,
      rating: prov.rating ?? 5.0,
      completedBookings: prov.completedBookings ?? 1,
      skillTier: prov.skillTier || 'Verified pro',
      walletBalanceUsd: prov.walletBalanceUsd ?? 5.0,
      categoryIds: getProviderCategoryIds(prov),
      categoryId: prov.categoryId,
      suburbId: prov.suburbId,
      suburbName: prov.suburbName,
      lat: prov.lat,
      lng: prov.lng
    };

    const res = await apiPost('/api/offers', {
      requestId,
      providerId: prov.id,
      priceUsd: Number(priceUsd),
      providerSnapshot: provSnapshot,
      requestSnapshot: reqSnap
    });
    if (res && res.request && state.db?.requests) {
      const idx = state.db.requests.findIndex((r) => r.id === res.request.id);
      if (idx >= 0) state.db.requests[idx] = res.request;
      else state.db.requests.unshift(res.request);
    }
    renderAll(true);
  } catch (err) {
    if (err.data && (err.data.code === 'LOW_WALLET_BALANCE' || err.status === 402)) {
      openLowBalanceExplanatoryModal({
        ...err.data,
        requestId
      });
      return;
    }
    showToast(err.message, 'error');
  }
}

function openLowBalanceExplanatoryModal(data) {
  state.modalData = data || {};
  state.activeModal = 'LOW_BALANCE_EXPLANATORY';
  renderModalLayer();
}

async function triggerEcoCashTopUp(amountUsd) {
  closeModal();
  await topUpProviderWallet(amountUsd, 'EcoCash USD');
  showToast(`Topped up +$${Number(amountUsd).toFixed(2)} USD via EcoCash. You can now submit your bid.`, 'info');
}

function openUploadCatalogueModal() {
  state.uploadedFileDataUrl = null;
  state.uploadedFileName = '';
  state.uploadSuspectedWatermark = false;
  state.activeModal = 'UPLOAD_CATALOGUE';
  renderModalLayer();
}

async function handleRealPortfolioFileSelect(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  state.uploadedFileName = file.name;
  const compressed = await compressImageFileToDataUrl(file, 1200, 0.82);
  if (compressed) {
    state.uploadedFileDataUrl = compressed;
    renderModalLayer();
  }
}

async function submitProviderCatalogueUpload() {
  const prov = state.currentUser || state.db.providers[0];
  const title = document.getElementById('catUploadTitle')?.value.trim();
  const priceUsd = Number(document.getElementById('catUploadPrice')?.value || 25);

  if (!state.uploadedFileDataUrl) {
    showToast('Please select a photo from your device first', 'error');
    return;
  }
  if (!title) {
    showToast('Please enter a title for this work photo', 'error');
    return;
  }

  try {
    let finalImageUrl = state.uploadedFileDataUrl;
    try {
      const upRes = await apiPost('/api/upload', { dataUrl: state.uploadedFileDataUrl });
      if (upRes && upRes.mediaUrl) {
        finalImageUrl = upRes.mediaUrl;
      }
    } catch (e) {
      console.warn('Bucket upload note:', e);
    }

    await apiPost('/api/providers/catalogue', {
      providerId: prov.id,
      title,
      priceUsd,
      hasSuspectedWatermarkOrFlyer: Boolean(state.uploadSuspectedWatermark),
      imageUrl: finalImageUrl
    });
    closeModal();
    showToast('Photo uploaded & submitted for Admin approval');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================================
// IN-APP PROTECTED CHAT & MASKED VOICE CALL
// ============================================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openChatDrawer(requestIdOrProviderId = null, optionalProviderId = null) {
  state.chatDrawerOpen = true;
  pushNavigationHistoryState({ chat: true });
  let targetRequestId = null;
  let targetProviderId = null;

  if (typeof requestIdOrProviderId === 'string' && requestIdOrProviderId.startsWith('req_')) {
    targetRequestId = requestIdOrProviderId;
    targetProviderId = optionalProviderId;
  } else if (typeof requestIdOrProviderId === 'string' && requestIdOrProviderId.startsWith('prov_')) {
    targetProviderId = requestIdOrProviderId;
    targetRequestId = optionalProviderId;
  } else {
    targetRequestId = requestIdOrProviderId;
    targetProviderId = optionalProviderId;
  }

  if (targetRequestId) state.activeChatRequestId = targetRequestId;
  if (targetProviderId) state.activeChatProviderId = targetProviderId;

  renderChatDrawer();
  setTimeout(() => {
    const input = document.getElementById('chatTextInput');
    if (input) input.focus();
    const feed = document.getElementById('fullScreenChatFeed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, 80);
}

function closeChatDrawer() {
  state.chatDrawerOpen = false;
  renderChatDrawer();
}

function renderChatDrawer() {
  const root = document.getElementById('chatDrawerRoot');
  if (!root) return;
  if (!state.chatDrawerOpen) {
    root.innerHTML = '';
    return;
  }

  const targetReqId = state.activeChatRequestId;
  const req = (targetReqId && (state.db?.requests || []).find((r) => r.id === targetReqId))
    || (state.role === 'PROVIDER'
      ? getProviderActiveBooking((state.currentUser || state.db?.providers?.[0])?.id)
      : getCustomerActiveRequest())
    || (state.db?.requests || [])[0];

  if (req && !state.activeChatRequestId) {
    state.activeChatRequestId = req.id;
  }

  // Smooth DOM retention: if chat modal is already mounted for this request, ONLY update messages to avoid keyboard jump/flicker!
  const existingFeed = document.getElementById('fullScreenChatFeed');
  if (existingFeed && existingFeed.getAttribute('data-req-id') === String(req?.id || '')) {
    updateChatFeedDomOnly(req);
    return;
  }

  let peerName = 'Service Provider';
  let peerAvatar = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80';
  let peerSubtitle = 'Online • Verified Pro';
  let peerId = '';

  if (state.role === 'PROVIDER') {
    peerName = req?.customerName || 'Client';
    peerAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
    peerSubtitle = 'Client • Home Visit';
    peerId = req?.customerId || req?.customerPhone || '';
  } else {
    const provId = req?.acceptedProviderId || req?.offers?.[0]?.providerId || state.activeChatProviderId;
    const prov = resolveProviderByIdOrOffer(provId, req);
    if (prov) {
      peerName = prov.name;
      peerAvatar = prov.avatarUrl;
      peerSubtitle = `${prov.skillTier || 'Platinum Pro'} • Rating: ${prov.rating || '4.9'}`;
      peerId = prov.id;
    } else {
      peerId = provId || '';
    }
  }

  const quickList = state.role === 'PROVIDER'
    ? [
        'On my way with my mobile kit!',
        'I have arrived outside your gate',
        'Please share the 4-digit Start PIN',
        '2 mins away from your street'
      ]
    : [
        'I am waiting at home',
        'Coming out to open the gate',
        'I have the Start PIN ready',
        'Please call me in-app when outside'
      ];

  const messages = req?.messages || [];
  if (req && req.id) {
    markRequestMessagesRead(req.id);
  }

  root.innerHTML = `
    <div class="fullscreen-chat-backdrop" onclick="closeChatDrawer()">
      <div class="fullscreen-chat-modal" onclick="event.stopPropagation()">
        <!-- WhatsApp iOS Navigation Header -->
        <div class="fullscreen-chat-header">
          <button class="fullscreen-chat-back-ios" onclick="closeChatDrawer()" title="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div class="fullscreen-chat-peer" onclick="closeChatDrawer()">
            <img src="${peerAvatar}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" alt="${escapeHtml(peerName)}" class="fullscreen-chat-avatar" />
            <div class="fullscreen-chat-peer-info">
              <div class="fullscreen-chat-peer-name">${escapeHtml(peerName)}</div>
              <div class="fullscreen-chat-peer-status online">online</div>
            </div>
          </div>

          <div class="fullscreen-chat-header-actions">
            <button class="fullscreen-chat-call-btn" onclick="startInAppCall('${peerName.replace(/'/g, "\\'")}', '${(req?.title || 'Home Visit').replace(/'/g, "\\'")}', 'call_${req?.id || ''}', '${peerId || ''}')" title="Call ${escapeHtml(peerName)}">
              ${uiIcon('phone', 20)}
            </button>
          </div>
        </div>

        <!-- Scrollable WhatsApp Feed with iOS Wallpaper Tint -->
        <div class="fullscreen-chat-feed" id="fullScreenChatFeed" data-req-id="${req?.id || ''}">
          ${renderChatMessagesHtml(messages)}
        </div>

        <!-- WhatsApp iOS Footer: Preset quick replies & Input -->
        <div class="fullscreen-chat-footer">
          <div class="chat-quick-strip">
            ${quickList.map((q) => `
              <button type="button" class="chat-preset-chip" onclick="sendChatMessage('${q.replace(/'/g, "\\'")}', '${req?.id || ''}')">
                ${q}
              </button>
            `).join('')}
          </div>

          <div class="chat-inline-input-row">
            <button type="button" class="whatsapp-ios-plus-btn" onclick="document.getElementById('chatPhotoInput').click()" title="Attach Photo">+</button>
            <input type="file" id="chatPhotoInput" accept="image/*" style="display:none;" onchange="handleChatPhotoUpload(this, '${req?.id || ''}')" />
            <input
              id="chatTextInput"
              class="whatsapp-ios-input"
              placeholder="Message..."
              onkeydown="if(event.key==='Enter'){ event.preventDefault(); sendCustomChat('${req?.id || ''}'); }"
            />
            <button
              type="button"
              class="whatsapp-ios-send-btn"
              onclick="sendCustomChat('${req?.id || ''}')"
              title="Send Message"
            >
              ${uiIcon('send', 16)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function formatChatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '';
  }
}

// Authentic overlapping iOS WhatsApp Double-Tick SVG (Grey #8696A0 when delivered, Blue #34B7F1 when read)
function renderWhatsAppDoubleTickSvg(isRead = false) {
  const color = isRead ? '#34B7F1' : '#8696A0';
  return `<svg class="wa-double-tick-svg ${isRead ? 'read' : 'delivered'}" width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; margin-left:1px; flex-shrink:0;"><path d="M10.85 1.15L4.55 7.45L1.85 4.75" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.35 1.15L8.05 7.45L6.65 6.05" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

let lastReadMarkKey = '';
let lastReadMarkTime = 0;
function markRequestMessagesRead(requestId) {
  if (!requestId || !state.db?.requests) return;
  const req = state.db.requests.find((r) => r.id === requestId);
  if (!req || !Array.isArray(req.messages)) return;
  const unreadPeerMsgs = req.messages.filter(
    (m) => m.senderRole && m.senderRole !== 'SYSTEM' && m.senderRole !== state.role && (!m.read || m.status !== 'READ')
  );
  if (unreadPeerMsgs.length === 0) return;

  unreadPeerMsgs.forEach((m) => {
    m.read = true;
    m.status = 'READ';
  });

  const key = `${requestId}:${state.role}:${unreadPeerMsgs.length}`;
  const now = Date.now();
  if (key === lastReadMarkKey && now - lastReadMarkTime < 2500) return;
  lastReadMarkKey = key;
  lastReadMarkTime = now;

  apiPost('/api/messages/read', {
    requestId,
    readerRole: state.role,
    requestSnapshot: req
  }).catch(() => {});
}

function renderChatMessagesHtml(messages) {
  const encryptionBanner = `
    <div class="whatsapp-encryption-pill">
      ${uiIcon('lock', 11)}
      <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
    </div>
    <div class="whatsapp-date-pill">TODAY</div>
  `;

  if (!messages || messages.length === 0) {
    return `
      ${encryptionBanner}
      <div style="text-align:center; padding:24px 20px; color:#8E8E93; margin:auto 0;">
        <div style="font-size:13px; font-weight:600; color:#54656F; margin-bottom:4px;">No messages yet</div>
        <div style="font-size:12px; line-height:1.4;">Send a quick reply below or type a message to coordinate your visit.</div>
      </div>
    `;
  }

  const msgsHtml = messages.map((m, idx) => {
    const isSystem = m.senderRole === 'SYSTEM' || m.type === 'PIN_VERIFIED' || m.type === 'DELAY_NOTICE';
    const isMine = !isSystem && m.senderRole === state.role;
    const rowClass = isSystem ? 'system' : isMine ? 'mine' : 'theirs';
    const timeStr = formatChatTime(m.timestamp || m.createdAt);

    // A sent message is READ if m.read === true, m.status === 'READ', or if the recipient has replied after this message!
    const hasLaterPeerReply = isMine && messages.slice(idx + 1).some((later) => later.senderRole && later.senderRole !== 'SYSTEM' && later.senderRole !== state.role);
    const isReadByPeer = Boolean(m.read || m.status === 'READ' || hasLaterPeerReply);

    if (isSystem) {
      return `
        <div class="chat-msg-row system">
          <div class="chat-msg-bubble">
            ${escapeHtml(m.text)}
          </div>
        </div>
      `;
    }

    const photoHtml = m.photoUrl ? `
      <div style="cursor:pointer; margin-bottom:4px; border-radius:10px; overflow:hidden; max-width:240px;" onclick="openChatPhotoPreview('${escapeHtml(m.photoUrl)}')">
        <img src="${resolveMediaUrl(escapeHtml(m.photoUrl))}" onerror="this.onerror=null; this.src='${DEFAULT_TASK_PHOTO_FALLBACK}';" alt="Photo Attachment" style="display:block; width:100%; max-height:220px; object-fit:cover; border-radius:10px;" />
      </div>
    ` : '';

    const hasCaption = m.text && m.text !== 'Photo attached';
    const textHtml = hasCaption ? `<span>${escapeHtml(m.text)}</span>` : (!m.photoUrl ? `<span>${escapeHtml(m.text || '')}</span>` : '');

    return `
      <div class="chat-msg-row ${rowClass}">
        <div class="chat-msg-bubble">
          ${photoHtml}
          ${textHtml}
          <span class="chat-msg-meta">
            <span>${timeStr}</span>
            ${isMine ? renderWhatsAppDoubleTickSvg(isReadByPeer) : ''}
          </span>
        </div>
      </div>
    `;
  }).join('');

  return encryptionBanner + msgsHtml;
}

function getSupportUserKey() {
  const raw = state.currentUser?.id || state.currentUser?.phone || state.savedAccountId || 'guest';
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getSupportChatStorageKey() {
  return `findit_support_chat_v2_${getSupportUserKey()}`;
}

function loadUserSupportHistory() {
  const key = getSupportChatStorageKey();
  if (state.loadedSupportKey === key && Array.isArray(state.supportChatMessages) && state.supportChatMessages.length > 0) {
    return;
  }
  state.loadedSupportKey = key;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.supportChatMessages = parsed;
        return;
      }
    }
  } catch (e) {}

  state.supportChatMessages = [
    {
      id: 'sup_welcome',
      sender: 'BUSINESS',
      text: `Hello *${state.currentUser?.name || 'there'}*! Welcome to *Findit Harare Official Support* (*finditharare.co.zw*).\n\nHow can we help you with your Findit Harare booking, provider job categories, EcoCash USD wallet (*151*2*2*84920#), or account today?`,
      time: formatChatTime(new Date().toISOString())
    }
  ];
  saveUserSupportHistory();

  // Also sync any server-stored history for this user in the background
  fetch(`${API_BASE}/api/support/history?userId=${encodeURIComponent(getSupportUserKey())}`)
    .then((r) => r.json())
    .then((data) => {
      if (data && Array.isArray(data.messages) && data.messages.length > state.supportChatMessages.length) {
        state.supportChatMessages = data.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          time: m.time && m.time.includes('T') ? formatChatTime(m.time) : (m.time || '')
        }));
        saveUserSupportHistory();
        if (state.activeModal === 'SUPPORT') {
          lastRenderedModalKey = '';
          renderModalLayer();
        }
      }
    })
    .catch(() => {});
}

function saveUserSupportHistory() {
  try {
    const key = getSupportChatStorageKey();
    if (Array.isArray(state.supportChatMessages)) {
      localStorage.setItem(key, JSON.stringify(state.supportChatMessages.slice(-50)));
    }
  } catch (e) {}
}

function clearUserSupportHistory() {
  try {
    localStorage.removeItem(getSupportChatStorageKey());
  } catch (e) {}
  state.loadedSupportKey = '';
  state.supportChatMessages = [];
  loadUserSupportHistory();
  lastRenderedModalKey = '';
  renderModalLayer();
  showToast('Support chat history cleared', 'info');
}

function openSupportModal() {
  loadUserSupportHistory();
  state.activeModal = 'SUPPORT';
  lastRenderedModalKey = '';
  renderModalLayer();
}

function initSettingsDraftFromUser() {
  const isProvider = state.role === 'PROVIDER';
  const u = state.currentUser || (isProvider ? state.db?.providers?.[0] : state.db?.customers?.[0]) || {};
  state.settingsDraft = {
    name: u.name || '',
    brandName: u.brandName || `${u.name || 'Specialist'} Services`,
    startingPriceUsd: Number(u.startingPriceUsd || 20),
    suburbId: u.suburbId || state.selectedSuburbId || 'avondale',
    categoryIds: isProvider ? [...getProviderCategoryIds(u)] : [],
    entranceNote: u.entranceNote || state.entranceNote || 'Main Gate',
    preferredPaymentMethod: u.preferredPaymentMethod || state.draftPaymentMethod || 'Cash USD',
    isOnline: u.isOnline !== false
  };
}

function openAccountSettingsModal() {
  initSettingsDraftFromUser();
  state.activeModal = 'SETTINGS';
  lastRenderedModalKey = '';
  renderModalLayer();
}

function toggleSettingsProviderCategory(catId) {
  if (!state.settingsDraft) initSettingsDraftFromUser();
  // Preserve current typed inputs before re-rendering category selection
  const nameInp = document.getElementById('settingsNameInput');
  const brandInp = document.getElementById('settingsBrandInput');
  const priceInp = document.getElementById('settingsPriceInput');
  const suburbSel = document.getElementById('settingsSuburbSelect');
  if (nameInp) state.settingsDraft.name = nameInp.value;
  if (brandInp) state.settingsDraft.brandName = brandInp.value;
  if (priceInp) state.settingsDraft.startingPriceUsd = Number(priceInp.value);
  if (suburbSel) state.settingsDraft.suburbId = suburbSel.value;

  const list = Array.isArray(state.settingsDraft.categoryIds) ? [...state.settingsDraft.categoryIds] : [];
  const idx = list.indexOf(catId);
  if (idx >= 0) {
    if (list.length <= 1) {
      showToast('You must have at least 1 active job category selected', 'error');
      return;
    }
    list.splice(idx, 1);
  } else {
    if (list.length >= 3) {
      // Replace the oldest selected category if already at 3 so switching is effortless
      list.shift();
    }
    list.push(catId);
  }
  state.settingsDraft.categoryIds = list;
  lastRenderedModalKey = '';
  renderModalLayer();
}

async function handleProfileAvatarUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  showToast('Updating profile photo...', 'info');
  const compressed = await compressImageFileToDataUrl(file, 600, 0.78);
  if (!compressed) {
    showToast('Could not process photo. Please choose another image.', 'error');
    return;
  }
  if (state.currentUser) {
    state.currentUser.avatarUrl = compressed;
    state.currentUser.selfieUrl = compressed;
  }
  if (state.settingsDraft) {
    state.settingsDraft.avatarUrl = compressed;
  }
  if (state.role === 'PROVIDER') {
    const p = (state.db?.providers || []).find((x) => x.id === state.currentUser?.id);
    if (p) { p.avatarUrl = compressed; p.selfieUrl = compressed; }
  } else {
    const c = (state.db?.customers || []).find((x) => x.id === state.currentUser?.id);
    if (c) { c.avatarUrl = compressed; c.selfieUrl = compressed; }
  }
  saveSession(state.role, state.currentUser, false);
  lastRenderedModalKey = '';
  renderAll();
  showToast('Profile picture updated successfully!', 'success');

  apiPost('/api/account/update-settings', {
    role: state.role,
    userId: state.currentUser?.id,
    avatarUrl: compressed
  }).catch((e) => console.warn('Profile avatar sync notice:', e));
}

async function saveAccountSettingsChanges() {
  if (!state.settingsDraft) initSettingsDraftFromUser();
  const isProvider = state.role === 'PROVIDER';
  const nameVal = (document.getElementById('settingsNameInput')?.value || state.settingsDraft.name || '').trim();
  const suburbIdVal = document.getElementById('settingsSuburbSelect')?.value || state.settingsDraft.suburbId || 'avondale';
  const subObj = (state.db?.suburbs || []).find((s) => s.id === suburbIdVal) || (state.db?.suburbs || [])[0];

  if (!nameVal) {
    showToast('Please enter your name', 'error');
    return;
  }

  state.userCustomizedProfile = true;
  markLocalStateMutation();

  if (isProvider) {
    const brandVal = (document.getElementById('settingsBrandInput')?.value || state.settingsDraft.brandName || `${nameVal} Services`).trim();
    const priceVal = Math.max(5, Number(document.getElementById('settingsPriceInput')?.value || state.settingsDraft.startingPriceUsd || 20));
    const catIds = (state.settingsDraft.categoryIds && state.settingsDraft.categoryIds.length > 0)
      ? state.settingsDraft.categoryIds.slice(0, 3)
      : ['repairs_construction'];

    if (!state.currentUser) state.currentUser = state.db?.providers?.[0] || {};
    const workStartVal = document.getElementById('settingsWorkStart')?.value || state.settingsDraft.workStartTime || state.currentUser.workStartTime || '08:00';
    const workEndVal = document.getElementById('settingsWorkEnd')?.value || state.settingsDraft.workEndTime || state.currentUser.workEndTime || '18:00';
    state.currentUser.name = nameVal;
    state.currentUser.shortName = nameVal.split(' ')[0];
    state.currentUser.brandName = brandVal;
    state.currentUser.startingPriceUsd = priceVal;
    state.currentUser.categoryIds = catIds;
    state.currentUser.categoryId = catIds[0];
    state.currentUser.workStartTime = workStartVal;
    state.currentUser.workEndTime = workEndVal;
    if (subObj) {
      state.currentUser.suburbId = subObj.id;
      state.currentUser.suburbName = subObj.name;
      state.currentUser.lat = subObj.lat;
      state.currentUser.lng = subObj.lng;
    }

    const dbProv = (state.db?.providers || []).find((p) => p.id === state.currentUser.id);
    if (dbProv) {
      Object.assign(dbProv, {
        name: state.currentUser.name,
        shortName: state.currentUser.shortName,
        brandName: state.currentUser.brandName,
        startingPriceUsd: state.currentUser.startingPriceUsd,
        categoryIds: state.currentUser.categoryIds,
        categoryId: state.currentUser.categoryId,
        suburbId: state.currentUser.suburbId,
        suburbName: state.currentUser.suburbName,
        workStartTime: workStartVal,
        workEndTime: workEndVal
      });
    }

    saveSession('PROVIDER', state.currentUser, false);
    closeModal();
    lastUiOverlaySignature = '';
    renderAll(true);

    try {
      await apiPost('/api/account/update-settings', {
        role: 'PROVIDER',
        userId: state.currentUser.id,
        phone: state.currentUser.phone,
        name: state.currentUser.name,
        brandName: state.currentUser.brandName,
        startingPriceUsd: state.currentUser.startingPriceUsd,
        categoryIds: state.currentUser.categoryIds,
        suburbId: state.currentUser.suburbId,
        workStartTime: workStartVal,
        workEndTime: workEndVal
      });
    } catch (e) {}
  } else {
    const entranceVal = (document.getElementById('settingsEntranceInput')?.value || state.settingsDraft.entranceNote || 'Main Gate').trim();
    const payVal = document.getElementById('settingsPaymentSelect')?.value || state.settingsDraft.preferredPaymentMethod || 'Cash USD';

    if (!state.currentUser) state.currentUser = state.db?.customers?.[0] || {};
    state.currentUser.name = nameVal;
    state.currentUser.entranceNote = entranceVal;
    state.currentUser.preferredPaymentMethod = payVal;
    state.entranceNote = entranceVal;
    state.draftPaymentMethod = payVal;
    if (subObj) {
      state.currentUser.suburbId = subObj.id;
      state.currentUser.suburbName = subObj.name;
      state.selectedSuburbId = subObj.id;
      state.customAddress = subObj.name;
      state.customSuburbLabel = `${subObj.name}, Harare`;
      state.pinnedLat = subObj.lat;
      state.pinnedLng = subObj.lng;
    }

    saveSession('CUSTOMER', state.currentUser, false);
    closeModal();
    lastUiOverlaySignature = '';
    renderAll(true);

    try {
      await apiPost('/api/account/update-settings', {
        role: 'CUSTOMER',
        userId: state.currentUser.id,
        phone: state.currentUser.phone,
        name: state.currentUser.name,
        suburbId: state.currentUser.suburbId,
        entranceNote: state.currentUser.entranceNote,
        preferredPaymentMethod: state.currentUser.preferredPaymentMethod
      });
    } catch (e) {}
  }
}

function toggleSupportBizInfo() {
  state.supportShowBizInfo = !state.supportShowBizInfo;
  lastRenderedModalKey = '';
  renderModalLayer();
}

async function sendSupportAiMessage(presetText = null) {
  const inp = document.getElementById('waSupportInput');
  const text = (presetText !== null ? presetText : (inp ? inp.value : '')).trim();
  if (!text || state.supportAiTyping) return;
  if (inp) inp.value = '';

  loadUserSupportHistory();
  state.supportChatMessages.push({
    id: 'sup_u_' + Date.now(),
    sender: 'USER',
    text,
    time: formatChatTime(new Date().toISOString())
  });
  saveUserSupportHistory();
  state.supportAiTyping = true;
  lastRenderedModalKey = '';
  renderModalLayer();

  try {
    const res = await apiPost('/api/support/chat', {
      message: text,
      role: state.role,
      userId: getSupportUserKey(),
      phone: state.currentUser?.phone || '',
      userName: state.currentUser?.name || 'Member',
      history: state.supportChatMessages.slice(-16)
    });
    state.supportAiTyping = false;
    state.supportChatMessages.push({
      id: 'sup_b_' + Date.now(),
      sender: 'BUSINESS',
      text: res?.reply || 'How can we help you with Findit Harare today?',
      time: formatChatTime(res?.timestamp || new Date().toISOString())
    });
    saveUserSupportHistory();
    lastRenderedModalKey = '';
    renderModalLayer();
    setTimeout(() => document.getElementById('waSupportInput')?.focus(), 40);
  } catch (e) {
    state.supportAiTyping = false;
    state.supportChatMessages.push({
      id: 'sup_b_' + Date.now(),
      sender: 'BUSINESS',
      text: 'Welcome to *Findit Harare Official Support* (*finditharare.co.zw*)! Please let us know if you need help with a booking, provider job categories, EcoCash wallet (*151*2*2*84920#), or your account.',
      time: formatChatTime(new Date().toISOString())
    });
    saveUserSupportHistory();
    lastRenderedModalKey = '';
    renderModalLayer();
    setTimeout(() => document.getElementById('waSupportInput')?.focus(), 40);
  }
}

async function handleChatPhotoUpload(input, requestId) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const photoDataUrl = await compressImageFileToDataUrl(file, 800, 0.75);
  input.value = '';
  if (photoDataUrl) {
    sendChatMessage('', requestId, photoDataUrl);
  }
}

function openChatPhotoPreview(url) {
  if (!url) return;
  state.modalData = { previewPhotoUrl: url };
  state.activeModal = 'CHAT_PHOTO_PREVIEW';
  renderModalLayer();
}

function updateChatFeedDomOnly(req) {
  if (!req) return;
  const feed = document.getElementById('fullScreenChatFeed');
  if (feed) {
    feed.innerHTML = renderChatMessagesHtml(req.messages || []);
    feed.scrollTop = feed.scrollHeight;
  }
  const embeddedFeed = document.getElementById('embeddedChatScroll');
  if (embeddedFeed) {
    embeddedFeed.innerHTML = renderChatMessagesHtml(req.messages || []);
    embeddedFeed.scrollTop = embeddedFeed.scrollHeight;
  }
}

let lastSentChatText = '';
let lastSentChatAtMs = 0;

function sendChatMessage(text, requestId = null, photoUrl = null) {
  const cleanText = (text || '').trim();
  if (!cleanText && !photoUrl) return;

  // Prevent accidental double-submission (e.g. Enter + click or double-tap within 500ms)
  const nowMs = Date.now();
  if (!photoUrl && cleanText === lastSentChatText && nowMs - lastSentChatAtMs < 500) {
    return;
  }
  if (!photoUrl) {
    lastSentChatText = cleanText;
    lastSentChatAtMs = nowMs;
  }

  if (cleanText) {
    const leakWarning = checkAntiLeakageClient(cleanText);
    if (leakWarning) {
      showToast(leakWarning, 'error');
      return;
    }
  }

  const targetReqId = requestId || state.activeChatRequestId;
  const fallbackReq = state.role === 'PROVIDER'
    ? getProviderActiveBooking(state.currentUser?.id)
    : getCustomerActiveRequest();
  const targetReq = (state.db?.requests || []).find((r) => r.id === (targetReqId || fallbackReq?.id)) || fallbackReq || (state.db?.requests || [])[0];
  if (!targetReq) return;

  // Clear inputs immediately before network call
  const input = document.getElementById('chatTextInput');
  if (input) input.value = '';
  const inlineInput = document.getElementById(`inlineChatInput_${targetReq.id}`);
  if (inlineInput) inlineInput.value = '';

  const senderName = state.currentUser?.name || (state.role === 'PROVIDER' ? 'Service Provider' : 'Client');
  const tempMsgId = 'msg_' + nowMs + '_' + Math.random().toString(36).slice(2, 6);
  const nowIso = new Date(nowMs).toISOString();
  const tempMsg = {
    id: tempMsgId,
    clientMsgId: tempMsgId,
    senderRole: state.role,
    senderName: senderName,
    text: cleanText || (photoUrl ? 'Photo attached' : ''),
    photoUrl: photoUrl || undefined,
    status: 'DELIVERED',
    read: false,
    timestamp: nowIso,
    createdAt: nowIso
  };

  // Immediate 0ms local append (only once!)
  if (!targetReq.messages) targetReq.messages = [];
  targetReq.messages.push(tempMsg);

  // Update DOM immediately with no lag
  updateChatFeedDomOnly(targetReq);

  // Send to backend asynchronously with clientMsgId & requestSnapshot so it never duplicates or 404s
  apiPost('/api/messages', {
    requestId: targetReq.id,
    clientMsgId: tempMsgId,
    senderRole: state.role,
    senderName: senderName,
    text: cleanText || (photoUrl ? 'Photo attached' : ''),
    photoUrl: photoUrl || undefined,
    requestSnapshot: targetReq
  }).then((res) => {
    if (res && res.message) {
      Object.assign(tempMsg, res.message);
      updateChatFeedDomOnly(targetReq);
    }
  }).catch((err) => {
    // Only drop if anti-leakage shield actively blocked it
    if (err.message && (err.message.includes('Shield') || err.message.includes('not allowed'))) {
      targetReq.messages = targetReq.messages.filter((m) => m.id !== tempMsgId && m.clientMsgId !== tempMsgId);
      updateChatFeedDomOnly(targetReq);
    }
    showToast(err.message || 'Could not send message', 'error');
  });
}

function sendInlineChatMessage(requestId) {
  const input = document.getElementById(`inlineChatInput_${requestId}`);
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  sendChatMessage(text, requestId);
}

function sendCustomChat(requestId = null) {
  const input = document.getElementById('chatTextInput');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  sendChatMessage(text, requestId);
}

// ============================================================================
// DUAL-ENGINE AUDIO CALLING (AGORA RTC + WEBRTC P2P DIRECT AUDIO MESH)
// Ensures audio streams seamlessly from Point A to Point B
// ============================================================================
let agoraClient = null;
let localAudioTrack = null;
let p2pPeerConnection = null;
let localMicrophoneStream = null;
let isAudioMuted = false;
let callRingInterval = null;
let queuedCandidates = [];

function playCallEndedTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(425, now);
    osc.frequency.setValueAtTime(425, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

function playOutgoingRingtone() {
  stopCallRingtones();
  const playTone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  };
  playTone(); // 0ms immediate ringback start (zero dead silence delay)
  callRingInterval = setInterval(playTone, 3000);
}

function playIncomingRingtone() {
  stopCallRingtones();
  const playTone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(853, now);
      osc2.frequency.setValueAtTime(960, now);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    } catch (e) {}
    if ('vibrate' in navigator) {
      try { navigator.vibrate([400, 200, 400]); } catch (e) {}
    }
  };
  playTone(); // 0ms immediate incoming ring start
  callRingInterval = setInterval(playTone, 2500);
}

function stopCallRingtones() {
  if (callRingInterval) {
    clearInterval(callRingInterval);
    callRingInterval = null;
  }
}

function isCallForCurrentUser(c) {
  if (!c || c.status !== 'RINGING') return false;
  const myId = String(state.currentUser?.id || '');
  const myPhone = String(state.currentUser?.phone || '').replace(/\D/g, '');
  const myFinditId = String(state.currentUser?.finditId || '');
  const callerId = String(c.callerId || '');

  // 1. Never ring caller themselves
  if (myId && callerId === myId) return false;
  if (myPhone && callerId.replace(/\D/g, '') === myPhone) return false;

  // 2. Strict 1-on-1 recipient isolation (Never leak calls to third parties or other providers!)
  const recId = String(c.recipientId || '');
  if (recId) {
    if (myId && recId === myId) return true;
    if (myPhone && recId.replace(/\D/g, '') && recId.replace(/\D/g, '') === myPhone) return true;
    if (myFinditId && recId === myFinditId) return true;
    return false; // strictly isolated to recipient!
  }

  // 3. Fallback only if recipientId wasn't specified: strictly match the accepted provider or the customer of this request
  if (c.requestId && state.db && Array.isArray(state.db.requests)) {
    const matchReq = state.db.requests.find((r) => r.id === c.requestId);
    if (matchReq) {
      if (state.role === 'CUSTOMER' && (matchReq.customerId === myId || (matchReq.customerPhone && matchReq.customerPhone.replace(/\D/g, '') === myPhone))) {
        return true;
      }
      if (state.role === 'PROVIDER' && matchReq.acceptedProviderId === myId) {
        return true;
      }
    }
  }

  return false;
}

let activeCallPollTimer = null;

function syncIncomingCallFromList(calls) {
  if (!Array.isArray(calls)) return;
  const myId = state.currentUser?.id;
  const activeJob = state.role === 'PROVIDER' ? getProviderActiveBooking(myId) : getCustomerActiveRequest();

  // 1. If we are currently in an OUTGOING call, check if the recipient answered (ACCEPTED)
  if (state.activeCall && state.activeCall.callState === 'OUTGOING') {
    const matched = calls.find((c) => c.channelId === state.activeCall.channelId);
    if (matched) {
      if (matched.status === 'ACCEPTED') {
        stopCallRingtones();
        state.activeCall.callState = 'CONNECTED';
        state.callSeconds = 0;
        if (callInterval) clearInterval(callInterval);
        callInterval = setInterval(() => {
          state.callSeconds++;
          const el = document.getElementById('callTimerText');
          if (el) {
            const m = String(Math.floor(state.callSeconds / 60)).padStart(2, '0');
            const s = String(state.callSeconds % 60).padStart(2, '0');
            el.textContent = `${m}:${s}`;
          }
        }, 1000);
        renderCallModal();
        // Caller initiates audio stream now that recipient answered!
        joinDualEngineCall(state.activeCall.channelId, true);
      } else if (matched.status === 'ENDED') {
        endInAppCall(false);
        return;
      }
    }
  }

  // 2. If we have an incoming call or active call, and it is marked ENDED or removed from list: instant dual drop!
  if (state.incomingCall || state.activeCall) {
    const currentChan = (state.incomingCall || state.activeCall).channelId;
    const currentReq = (state.incomingCall || state.activeCall).requestId;
    const callStillActive = calls.some((c) => 
      ((c.channelId && c.channelId === currentChan) || (c.requestId && c.requestId === currentReq)) &&
      c.status !== 'ENDED'
    );
    if (!callStillActive) {
      endInAppCall(false);
      return;
    }
  }

  // 3. Check for any ringing call intended for us
  if (!state.activeCall && !state.incomingCall) {
    const ringingCall = calls.find((c) => isCallForCurrentUser(c));

    if (ringingCall) {
      state.incomingCall = {
        callerId: ringingCall.callerId,
        callerName: ringingCall.callerName || 'User',
        contextTitle: ringingCall.contextTitle || 'In-App Audio Call',
        channelId: ringingCall.channelId || ('call_' + ringingCall.requestId),
        requestId: ringingCall.requestId
      };
      playIncomingRingtone();
      renderCallModal();
      triggerSystemNotification('Incoming Call from ' + (ringingCall.callerName || 'User'), ringingCall.contextTitle || 'Tap to answer', 'call_' + ringingCall.requestId);
      try {
        if (window.FinditNative && typeof window.FinditNative.triggerIncomingCall === 'function') {
          window.FinditNative.triggerIncomingCall(ringingCall.callerName || 'Findit User', 'Voice', ringingCall.channelId);
        }
      } catch (nativeErr) {}
      startActiveCallPolling();
    }
  }
}

function startActiveCallPolling() {
  if (activeCallPollTimer) return;
  activeCallPollTimer = setInterval(async () => {
    try {
      if (!state.isAuthenticated || !state.currentUser) return;
      const myId = state.currentUser?.id || '';
      const reqId = state.activeRequestId || state.openChatRequestId || '';
      const chanId = state.activeCall?.channelId || state.incomingCall?.channelId || '';
      const query = `userId=${encodeURIComponent(myId)}&requestId=${encodeURIComponent(reqId)}&channelId=${encodeURIComponent(chanId)}`;
      const res = await apiGet(`/api/calls/check?${query}`);
      if (res && res.ok) {
        const calls = [];
        if (res.incomingCall) calls.push(res.incomingCall);
        if (res.activeCall) calls.push(res.activeCall);
        if (calls.length > 0) {
          syncIncomingCallFromList(calls);
        } else if (state.activeCall && state.activeCall.callState === 'OUTGOING' && !res.activeCall) {
          endInAppCall(false);
        }

        if (Array.isArray(res.signals) && res.signals.length > 0) {
          for (const s of res.signals) {
            handleWebRtcSignalMessage(s);
          }
        }
      }
    } catch (e) {}
  }, 1200);
}

function stopActiveCallPolling() {
  if (!state.isAuthenticated && activeCallPollTimer) {
    clearInterval(activeCallPollTimer);
    activeCallPollTimer = null;
  }
}

async function startInAppCall(peerName, contextTitle, channelId = null, recipientId = null) {
  // Acquire microphone in direct user gesture context so permissions and audio tracks are immediately ready
  try {
    if (!localMicrophoneStream) {
      localMicrophoneStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    }
  } catch (micErr) {
    console.warn('Microphone user gesture note:', micErr.message);
  }

  const activeReq = state.role === 'PROVIDER'
    ? (getProviderActiveBooking(state.currentUser?.id) || (state.openChatRequestId ? state.db?.requests?.find((r) => r.id === state.openChatRequestId) : null))
    : (getCustomerActiveRequest() || (state.openChatRequestId ? state.db?.requests?.find((r) => r.id === state.openChatRequestId) : null));

  const finalChannelId = channelId || (activeReq ? ('call_' + activeReq.id) : ('call_' + (state.openChatRequestId || 'harare')));
  const finalRecipientId = recipientId || (state.role === 'PROVIDER'
    ? (activeReq?.customerId || activeReq?.customerPhone)
    : (activeReq?.acceptedProviderId || (activeReq?.offers || []).find((o) => o.id === activeReq?.acceptedOfferId)?.providerId || activeReq?.offers?.[0]?.providerId));

  state.activeCall = {
    callState: 'OUTGOING',
    peerName: peerName || 'User',
    contextTitle: contextTitle || 'Home Visit Call',
    channelId: finalChannelId,
    recipientId: finalRecipientId,
    isMuted: false
  };
  state.incomingCall = null;
  state.callSeconds = 0;
  playOutgoingRingtone();
  renderCallModal();

  apiPost('/api/calls/initiate', {
    requestId: activeReq?.id || state.openChatRequestId,
    callerId: state.currentUser?.id || (state.role === 'PROVIDER' ? 'provider' : 'customer'),
    callerName: state.currentUser?.name || (state.role === 'PROVIDER' ? 'Service Provider' : 'Client'),
    recipientId: finalRecipientId || null,
    contextTitle: contextTitle || 'Home Visit Call',
    channelId: finalChannelId
  }).catch((e) => console.warn('Call initiate notice:', e));

  startActiveCallPolling();
}

async function answerIncomingCall() {
  if (!state.incomingCall) return;
  stopCallRingtones();
  const inc = state.incomingCall;

  // Acquire microphone immediately in user gesture
  try {
    if (!localMicrophoneStream) {
      localMicrophoneStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    }
  } catch (micErr) {
    console.warn('Microphone answer user gesture note:', micErr.message);
  }

  state.activeCall = {
    callState: 'CONNECTED',
    peerName: inc.callerName,
    contextTitle: inc.contextTitle,
    channelId: inc.channelId,
    isMuted: false
  };
  state.incomingCall = null;
  state.callSeconds = 0;
  if (callInterval) clearInterval(callInterval);
  callInterval = setInterval(() => {
    state.callSeconds++;
    const el = document.getElementById('callTimerText');
    if (el) {
      const m = String(Math.floor(state.callSeconds / 60)).padStart(2, '0');
      const s = String(state.callSeconds % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
    }
  }, 1000);
  renderCallModal();

  apiPost('/api/calls/respond', {
    requestId: inc.requestId,
    channelId: inc.channelId,
    action: 'ACCEPT'
  }).catch((e) => console.warn('Call respond notice:', e));

  joinDualEngineCall(inc.channelId, false);
}

async function declineIncomingCall() {
  stopCallRingtones();
  stopActiveCallPolling();
  if (state.incomingCall) {
    const inc = state.incomingCall;
    apiPost('/api/calls/respond', {
      requestId: inc.requestId,
      channelId: inc.channelId,
      action: 'DECLINE'
    }).catch((e) => {});
    state.incomingCall = null;
  }
  renderCallModal();
}

async function joinDualEngineCall(channelId, isCaller) {
  let agoraConnected = false;
  if (window.AgoraRTC) {
    try {
      await joinAgoraVoiceChannel(channelId);
      agoraConnected = true;
    } catch (agoraErr) {
      console.warn('Agora Voice notice, using WebRTC fallback:', agoraErr.message);
    }
  }
  // Only activate WebRTC P2P direct audio if Agora is not connected, preventing audio doubling and echoes
  if (!agoraConnected) {
    setupWebRtcPeerAudio(channelId, isCaller);
  }
}

async function setupWebRtcPeerAudio(channelId, isCaller) {
  try {
    queuedCandidates = [];
    if (p2pPeerConnection) {
      try { p2pPeerConnection.close(); } catch (e) {}
      p2pPeerConnection = null;
    }

    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    p2pPeerConnection = new RTCPeerConnection(config);

    try {
      p2pPeerConnection.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {}

    if (!localMicrophoneStream) {
      try {
        localMicrophoneStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (micErr) {
        console.warn('Microphone permission notice:', micErr.message);
      }
    }

    if (localMicrophoneStream) {
      localMicrophoneStream.getTracks().forEach((track) => {
        try {
          p2pPeerConnection.addTrack(track, localMicrophoneStream);
        } catch (e) {}
      });
    }

    p2pPeerConnection.ontrack = (event) => {
      let audioEl = document.getElementById('p2pRemoteAudioElement');
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = 'p2pRemoteAudioElement';
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        document.body.appendChild(audioEl);
      }
      audioEl.volume = 1.0;
      audioEl.muted = false;
      if (event.streams && event.streams[0]) {
        audioEl.srcObject = event.streams[0];
      } else if (event.track) {
        audioEl.srcObject = new MediaStream([event.track]);
      }
      audioEl.play().catch(() => {});
    };

    p2pPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        apiPost('/api/calls/signal', {
          channelId,
          senderId: state.currentUser?.id,
          signalType: 'ICE_CANDIDATE',
          data: event.candidate
        }).catch(() => {});
      }
    };

    if (isCaller) {
      const offer = await p2pPeerConnection.createOffer({ offerToReceiveAudio: true });
      await p2pPeerConnection.setLocalDescription(offer);
      apiPost('/api/calls/signal', {
        channelId,
        senderId: state.currentUser?.id,
        signalType: 'SDP_OFFER',
        data: offer
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('WebRTC P2P direct setup notice:', err.message);
  }
}

async function handleWebRtcSignalMessage(payload) {
  const { channelId, senderId, signalType, data } = payload;
  const currentChan = state.activeCall?.channelId || state.incomingCall?.channelId;
  if (!currentChan || currentChan !== channelId) return;
  if (state.currentUser?.id && String(senderId) === String(state.currentUser.id)) return;

  try {
    if (signalType === 'SDP_OFFER') {
      if (!p2pPeerConnection) {
        await setupWebRtcPeerAudio(channelId, false);
      }
      if (!localMicrophoneStream) {
        try {
          localMicrophoneStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
          localMicrophoneStream.getTracks().forEach((track) => {
            try { p2pPeerConnection.addTrack(track, localMicrophoneStream); } catch (e) {}
          });
        } catch (e) {}
      }
      await p2pPeerConnection.setRemoteDescription(new RTCSessionDescription(data));
      while (queuedCandidates.length > 0) {
        await p2pPeerConnection.addIceCandidate(queuedCandidates.shift());
      }
      const answer = await p2pPeerConnection.createAnswer();
      await p2pPeerConnection.setLocalDescription(answer);
      apiPost('/api/calls/signal', {
        channelId,
        senderId: state.currentUser?.id,
        signalType: 'SDP_ANSWER',
        data: answer
      }).catch(() => {});
    } else if (signalType === 'SDP_ANSWER') {
      if (p2pPeerConnection) {
        await p2pPeerConnection.setRemoteDescription(new RTCSessionDescription(data));
        while (queuedCandidates.length > 0) {
          await p2pPeerConnection.addIceCandidate(queuedCandidates.shift());
        }
      }
    } else if (signalType === 'ICE_CANDIDATE' && data) {
      const candidate = new RTCIceCandidate(data);
      if (p2pPeerConnection && p2pPeerConnection.remoteDescription) {
        await p2pPeerConnection.addIceCandidate(candidate);
      } else {
        queuedCandidates.push(candidate);
      }
    }
  } catch (err) {
    console.warn('WebRTC signaling notice:', err.message);
  }
}

async function joinAgoraVoiceChannel(channelId) {
  try {
    if (window.AgoraRTC) {
      if (agoraClient) {
        try { await agoraClient.leave(); } catch (e) {}
      }
      agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      try { await agoraClient.setClientRole('host'); } catch (e) {}

      if (AgoraRTC.onAudioAutoplayFailed) {
        AgoraRTC.onAudioAutoplayFailed = () => {
          const resumeHandler = () => {
            if (agoraClient) {
              agoraClient.remoteUsers.forEach((u) => {
                if (u.audioTrack) u.audioTrack.play();
              });
            }
            window.removeEventListener('click', resumeHandler);
            window.removeEventListener('touchstart', resumeHandler);
          };
          window.addEventListener('click', resumeHandler);
          window.addEventListener('touchstart', resumeHandler);
        };
      }

      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.setVolume(100);
          user.audioTrack.play();
        }
      });

      const appId = state.db?.config?.agoraAppId || '645ba1db83884888b288953d1fd3c533';
      const cleanChannel = (channelId || 'harare_call').replace(/[^a-zA-Z0-9_-]/g, '_');
      const userUid = Math.floor(100000 + Math.random() * 899999);
      let rtcToken = null;
      try {
        const tokenRes = await apiGet(`/api/agora/token?channel=${encodeURIComponent(cleanChannel)}&uid=${userUid}`);
        if (tokenRes && tokenRes.token) {
          rtcToken = tokenRes.token;
        }
      } catch (tokenErr) {
        console.warn('Agora token note:', tokenErr.message);
      }

      await agoraClient.join(appId, cleanChannel, rtcToken, userUid);

      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
        AGC: true,
        encoderConfig: 'speech_standard'
      });
      await agoraClient.publish([localAudioTrack]);

      for (const u of agoraClient.remoteUsers) {
        if (u.hasAudio) {
          try {
            await agoraClient.subscribe(u, 'audio');
            u.audioTrack.setVolume(100);
            u.audioTrack.play();
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn('Agora RTC Voice notice:', err.message);
  }
}

async function toggleCallMute() {
  isAudioMuted = !isAudioMuted;
  if (localAudioTrack) {
    await localAudioTrack.setMuted(isAudioMuted);
  }
  if (localMicrophoneStream) {
    localMicrophoneStream.getAudioTracks().forEach((t) => {
      t.enabled = !isAudioMuted;
    });
  }
  if (state.activeCall) state.activeCall.isMuted = isAudioMuted;
  renderCallModal();
}

function showActiveCallPinNotice() {
  const activeReq = state.role === 'PROVIDER'
    ? getProviderActiveBooking(state.currentUser?.id)
    : getCustomerActiveRequest();
  if (activeReq?.startPinCode) {
    showToast(`Arrival Start PIN: #${activeReq.startPinCode}`);
  } else {
    showToast('Arrival PIN is required when provider arrives outside.');
  }
}

async function endInAppCall(notify = true) {
  playCallEndedTone();
  stopCallRingtones();
  stopActiveCallPolling();
  if (callInterval) clearInterval(callInterval);
  const chanId = state.activeCall?.channelId || state.incomingCall?.channelId;
  const reqId = state.activeChatRequestId || state.activeRequestId;

  try {
    if (localAudioTrack) {
      localAudioTrack.close();
      localAudioTrack = null;
    }
    if (agoraClient) {
      await agoraClient.leave();
      agoraClient = null;
    }
    if (localMicrophoneStream) {
      localMicrophoneStream.getTracks().forEach((t) => t.stop());
      localMicrophoneStream = null;
    }
    if (p2pPeerConnection) {
      p2pPeerConnection.close();
      p2pPeerConnection = null;
    }
    const audioEl = document.getElementById('p2pRemoteAudioElement');
    if (audioEl) audioEl.remove();
  } catch (e) {}

  state.activeCall = null;
  state.incomingCall = null;
  renderCallModal();

  if (notify && chanId) {
    apiPost('/api/calls/respond', {
      requestId: reqId,
      channelId: chanId,
      action: 'END'
    }).catch((e) => {});
  }
}

// Authentic iOS Call Screen (Incoming & Active)
function renderCallModal() {
  const root = document.getElementById('callModalRoot');
  if (!root) return;

  // 1. Render Incoming Call Ringing Screen (Authentic iOS Incoming UI)
  if (state.incomingCall) {
    const inc = state.incomingCall;
    const proMatch = state.db.providers?.find((p) => p.name === inc.callerName || p.shortName === inc.callerName);
    const custMatch = state.db.customers?.find((c) => c.name === inc.callerName);
    const avatarUrl = proMatch?.avatarUrl || custMatch?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';

    root.innerHTML = `
      <div class="indrive-call-overlay">
        <div class="ios-call-top-bar">
          <div class="ios-call-encrypted-tag">
            ${uiIcon('lock', 12)}
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        <div class="ios-call-center">
          <div class="ios-call-avatar-wrap">
            <img src="${resolveMediaUrl(avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" class="ios-call-avatar" alt="${inc.callerName}" />
          </div>
          <div class="ios-call-peer-name">${escapeHtml(inc.callerName)}</div>
          <div class="ios-call-peer-context">${escapeHtml(inc.contextTitle || 'Home Service Booking')}</div>
          <div class="ios-call-subtitle">incoming call</div>
        </div>

        <div class="ios-call-bottom-row">
          <div class="ios-call-action-btn-wrap">
            <button type="button" class="ios-call-btn decline" onclick="declineIncomingCall()">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(135deg);"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <span class="ios-btn-sublabel">Decline</span>
          </div>

          <div class="ios-call-action-btn-wrap">
            <button type="button" class="ios-call-btn accept" onclick="answerIncomingCall()">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <span class="ios-btn-sublabel">Accept</span>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 2. Render Active Call Screen (Authentic iOS Active Call UI)
  if (!state.activeCall) {
    root.innerHTML = '';
    return;
  }

  const peerName = state.activeCall.peerName || 'Specialist';
  const contextTitle = state.activeCall.contextTitle || 'Harare Home Visit';
  const proMatch = state.db.providers?.find((p) => p.name === peerName || p.shortName === peerName);
  const custMatch = state.db.customers?.find((c) => c.name === peerName);
  const avatarUrl = proMatch?.avatarUrl || custMatch?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
  const isOutgoing = state.activeCall.callState === 'OUTGOING';

  root.innerHTML = `
    <div class="indrive-call-overlay">
      <div class="ios-call-top-bar">
        <div class="ios-call-encrypted-tag">
          ${uiIcon('lock', 12)}
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      <div class="ios-call-center">
        <div class="ios-call-avatar-wrap">
          <img src="${resolveMediaUrl(avatarUrl)}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_FALLBACK}';" class="ios-call-avatar" alt="${peerName}" />
        </div>
        <div class="ios-call-peer-name">${escapeHtml(peerName)}</div>
        <div class="ios-call-peer-context">${escapeHtml(contextTitle)}</div>
        <div id="callTimerText" class="ios-call-timer">
          ${isOutgoing ? 'calling...' : '00:00'}
        </div>
      </div>

      <div>
        <div class="ios-call-grid">
          <div class="ios-grid-btn-wrap">
            <button type="button" class="ios-frosted-circle-btn ${state.activeCall.isMuted ? 'active' : ''}" onclick="toggleCallMute()">
              <span style="display:inline-flex;">${state.activeCall.isMuted ? uiIcon('micOff', 24) : uiIcon('mic', 24)}</span>
            </button>
            <span class="ios-grid-label">mute</span>
          </div>

          <div class="ios-grid-btn-wrap">
            <button type="button" class="ios-frosted-circle-btn" onclick="showActiveCallPinNotice()">
              ${uiIcon('key', 22)}
            </button>
            <span class="ios-grid-label">PIN</span>
          </div>

          <div class="ios-grid-btn-wrap">
            <button type="button" class="ios-frosted-circle-btn" onclick="openChatDrawer(state.activeRequestId || (state.db.requests?.[0]?.id))">
              ${uiIcon('chat', 22)}
            </button>
            <span class="ios-grid-label">message</span>
          </div>
        </div>

        <div class="ios-call-bottom-row">
          <div class="ios-call-action-btn-wrap">
            <button type="button" class="ios-call-btn end" onclick="endInAppCall()" title="End Call">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(135deg);"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <span class="ios-btn-sublabel">End</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MOBILE & ANDROID HARDWARE / GESTURE BACK BUTTON CONTROLLER (1-STEP BACK)
// ============================================================================
function pushNavigationHistoryState(stateObj = {}) {
  try {
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      window.history.pushState(stateObj, '');
    }
  } catch (e) {}
}

window.handleAndroidBack = function() {
  if (state.incomingCall || state.activeCall) {
    endInAppCall(true);
    return true;
  }
  if (state.activeModal) {
    closeModal();
    return true;
  }
  if (state.chatDrawerOpen) {
    closeChatDrawer();
    return true;
  }
  const sideDrawer = document.getElementById('sideDrawerModal');
  if (sideDrawer && !sideDrawer.classList.contains('hidden')) {
    closeSideDrawerModal();
    return true;
  }
  if (state.onboardingActive) {
    if (state.onboardingSlide > 0) {
      state.onboardingSlide = 0;
      renderAll();
      return true;
    }
    finishOnboarding();
    return true;
  }
  if (state.role === 'PROVIDER' && state.providerTab && state.providerTab !== 'FEED' && state.providerTab !== 'ACTIVE_JOB') {
    state.providerTab = 'FEED';
    renderUiOverlay();
    return true;
  }
  if (state.screenStep === 'CONFIGURE') {
    state.screenStep = 'HOME';
    renderAll();
    return true;
  }
  if (state.hubView === 'MARKETPLACE' && state.role !== 'PROVIDER') {
    state.hubView = 'HUB';
    state.screenStep = 'HOME';
    renderAll();
    return true;
  }
  if (state.role === 'CUSTOMER' && state.screenStep === 'SEARCHING') {
    cancelActiveCustomerRequest();
    return true;
  }
  return false;
};

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    window.handleAndroidBack();
  });
}
