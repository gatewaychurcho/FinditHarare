// ============================================================================
// FINDIT HARARE — ELECTRIC BLUE & WHITE PRODUCTION ENGINE (100% VECTOR SVG UI)
// ============================================================================

const SESSION_KEY = 'findit_harare_session_v3';

const state = {
  db: null,
  role: 'CUSTOMER', // 'CUSTOMER' | 'PROVIDER'
  currentUser: null,
  isAuthenticated: false,

  // Screen flow: 'HOME' -> 'CONFIGURE' -> 'SEARCHING' -> 'BOOKED'
  screenStep: 'HOME',

  selectedCategoryId: 'braiding',
  selectedSuburbId: 'avondale',
  selectedSubServiceIdx: 0,
  selectedTierKey: 'STANDARD', // 'STANDARD' | 'PLATINUM' | 'ONE_CLICK' | 'BUDGET'

  customAddress: 'Avondale',
  customSuburbLabel: 'Avondale, Harare',
  entranceNote: 'Main Gate',
  pinnedLat: -17.7955,
  pinnedLng: 31.0365,

  draftFareUsd: 25,
  recommendedFareUsd: 25,
  draftPaymentMethod: 'Cash USD',
  draftAutoAccept: false,
  draftNotes: '',
  notesLeakageWarning: '',

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

  // Full inDrive-Style Sign-Up & Verification Wizard State
  authStep: 'PHONE', // 'PHONE' | 'OTP' | 'PROFILE'
  authRole: 'CUSTOMER', // 'CUSTOMER' | 'PROVIDER'
  authPhone: '+263 77 ',
  authOtpDigits: ['', '', '', ''],
  authName: '',
  authSuburbId: 'avondale',
  authCategoryId: 'braiding',
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
    trash: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    plus: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    dotOnline: `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><circle cx="8" cy="8" r="6" fill="#FFFFFF"/><circle cx="8" cy="8" r="3.5" fill="#10B981"/></svg>`,
    dotOffline: `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><circle cx="8" cy="8" r="5" stroke="#FFFFFF" stroke-width="2"/></svg>`,
    refresh: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    zwFlag: `<svg width="${s}" height="${Math.round(s * 0.72)}" viewBox="0 0 28 20" fill="none" style="border-radius:3px; flex-shrink:0;"><rect width="28" height="20" fill="#006400"/><rect y="3" width="28" height="14" fill="#FFD200"/><rect y="6" width="28" height="8" fill="#D40000"/><rect y="8.5" width="28" height="3" fill="#000000"/><polygon points="0,0 11,10 0,20" fill="#FFFFFF"/></svg>`
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

let leafletMap = null;
let leafletMarkersLayer = null;
let leafletRoutePolyline = null;
let userLiveGpsMarker = null;
let callInterval = null;
let offerCountdownInterval = null;
let mediaStreamRef = null;
let geocodeDebounceTimer = null;
const osrmRouteCache = new Map();

// ============================================================================
// CUSTOM ICONIFIED SERVICE ILLUSTRATIONS (MATCHING EACH SERVICE LABEL)
// ============================================================================
function getCategoryVectorSvg(catId, isSelected = false) {
  const strokeMain = isSelected ? '#FFFFFF' : '#0066FF';
  const strokeSub = isSelected ? '#BAE6FD' : '#0F172A';

  const icons = {
    // Hairdresser: Comb + Braided Locks
    braiding: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path d="M8 5C8 10 12 12 12 17C12 21 9 23 9 25" stroke="${strokeMain}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M13 5C13 10 9 12 9 17C9 21 12 23 12 25" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="18" y="5" width="9" height="18" rx="2" stroke="${strokeMain}" stroke-width="2.1"/>
      <path d="M18 9H23M18 13H23M18 17H23M18 21H23" stroke="${strokeSub}" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,

    // Barber: Open Barber Scissors + Clipper Blade
    barber: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <circle cx="9" cy="21" r="3.5" stroke="${strokeMain}" stroke-width="2.2"/>
      <circle cx="21" cy="21" r="3.5" stroke="${strokeMain}" stroke-width="2.2"/>
      <path d="M11.5 18.5L22 5M18.5 18.5L8 5" stroke="${strokeSub}" stroke-width="2.3" stroke-linecap="round"/>
      <circle cx="15" cy="13" r="1.5" fill="${strokeMain}"/>
    </svg>`,

    // Nail Tech: Nail Polish Bottle + Brush + Sparkling Nail
    nails: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <rect x="8" y="12" width="12" height="12" rx="3" stroke="${strokeMain}" stroke-width="2.2"/>
      <path d="M11 12V7H17V12" stroke="${strokeSub}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M14 4V7" stroke="${strokeMain}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M24 6L25 9L28 10L25 11L24 14L23 11L20 10L23 9L24 6Z" fill="${strokeMain}"/>
    </svg>`,

    // Makeup (MUA): Lipstick Tube + Makeup Brush
    makeup: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <rect x="7" y="14" width="8" height="10" rx="1.5" stroke="${strokeSub}" stroke-width="2.1"/>
      <path d="M8.5 14V8.5C8.5 7 13.5 5.5 13.5 8.5V14" fill="${strokeMain}" stroke="${strokeMain}" stroke-width="1.5"/>
      <path d="M21 15V24" stroke="${strokeSub}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M17.5 9C17.5 6.5 24.5 6.5 24.5 9L23 15H19L17.5 9Z" stroke="${strokeMain}" stroke-width="2.1" stroke-linejoin="round"/>
    </svg>`,

    // Wig Stylist: Styled Wavy Wig on Stand + Crown
    wigs: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path d="M9 10L12 5L16 8.5L20 5L23 10H9Z" stroke="${strokeMain}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M8 23C8 16 10 12 16 12C22 12 24 16 24 23" stroke="${strokeSub}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="16" cy="17" r="3" stroke="${strokeMain}" stroke-width="2"/>
    </svg>`,

    // Lashes & Brows: Eye with Curved Long Lashes
    lashes: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path d="M5 16C9 10 23 10 27 16C23 21 9 21 5 16Z" stroke="${strokeSub}" stroke-width="2.1" stroke-linejoin="round"/>
      <circle cx="16" cy="16" r="3" fill="${strokeMain}"/>
      <path d="M9 11L7 7M13.5 9.5L13 5.5M18.5 9.5L19 5.5M23 11L25 7" stroke="${strokeMain}" stroke-width="2.1" stroke-linecap="round"/>
    </svg>`,

    // Home Cleaning: Broom + Sparkles
    cleaning: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path d="M21 5L14 15" stroke="${strokeSub}" stroke-width="2.3" stroke-linecap="round"/>
      <path d="M9 15H19L21 23H7L9 15Z" stroke="${strokeMain}" stroke-width="2.1" stroke-linejoin="round"/>
      <circle cx="24" cy="11" r="1.5" fill="${strokeMain}"/>
    </svg>`,

    // Handyman: Wrench + Hammer
    handyman: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path d="M9 22L21 10" stroke="${strokeMain}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M18 7L24 13M10 9L14 13" stroke="${strokeSub}" stroke-width="2.3" stroke-linecap="round"/>
    </svg>`,

    // Plumbing & Solar: Solar Lightning + Pipe Wrench
    plumbing: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path d="M17 5L10 15H16L14 23L22 13H16L17 5Z" stroke="${strokeMain}" stroke-width="2.1" stroke-linejoin="round"/>
    </svg>`,

    // Errands: Delivery Bike / Fast Box
    delivery: `<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <circle cx="9" cy="20" r="3" stroke="${strokeSub}" stroke-width="2.1"/>
      <circle cx="23" cy="20" r="3" stroke="${strokeSub}" stroke-width="2.1"/>
      <path d="M9 20H16L20 11H14M20 14L23 20" stroke="${strokeMain}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  };

  return icons[catId] || icons.braiding;
}

// Small crisp icon inside the blue badge on each provider's map marker
function getMapMarkerProfessionIconSvg(catId) {
  if (catId === 'barber') {
    return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/></svg>`;
  }
  if (catId === 'nails') {
    return `<svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`;
  }
  if (catId === 'makeup') {
    return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><path d="M12 3v18M5 8h14"/></svg>`;
  }
  return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><path d="M6 4v16M10 6h8M10 10h8M10 14h8M10 18h8"/></svg>`;
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
  const socialRegex = /(whatsapp|call\s+me|text\s+me|dm\s+me|@[a-zA-Z0-9_]{3,}|wa\.me|t\.me)/i;
  if (socialRegex.test(text)) {
    return 'Off-platform handles (@...) and "WhatsApp/Call me" links are blocked.';
  }
  return null;
}

// ============================================================================
// INITIALIZATION, SESSION PERSISTENCE & REAL-TIME SSE STREAM
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initSplashScreen();
  loadSavedSession();
  await fetchState();
  initLeafletMap();
  useBrowserGeolocation(true);
  connectRealtimeStream();
  startOfferCountdownLoop();
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

  setTimeout(() => {
    if (fillEl) fillEl.style.width = '100%';
  }, 50);

  setTimeout(() => {
    splashEl.classList.add('hidden');
    state.splashDismissed = true;
  }, 1050);
}

async function fetchState() {
  try {
    const res = await fetch('/api/state');
    const newDb = await res.json();

    // Preserve optimistic local chat messages across state fetches so messages never disappear
    if (state.db && state.db.requests && newDb.requests) {
      newDb.requests.forEach((newReq) => {
        const oldReq = state.db.requests.find((r) => r.id === newReq.id);
        if (oldReq && oldReq.messages && oldReq.messages.length > 0) {
          if (!newReq.messages) newReq.messages = [];
          oldReq.messages.forEach((oldM) => {
            if (!newReq.messages.some((m) => m.id === oldM.id || (m.text === oldM.text && m.senderRole === oldM.senderRole))) {
              newReq.messages.push(oldM);
            }
          });
        }
      });
    }

    state.db = newDb;

    // Rock-solid session retention: NEVER log out or nullify an active user!
    if (state.isAuthenticated && state.currentUser) {
      const list = state.role === 'PROVIDER' ? (state.db.providers || []) : (state.db.customers || []);
      const found = list.find((item) => item.id === state.currentUser.id || (item.phone && state.currentUser.phone && item.phone.replace(/\D/g, '') === state.currentUser.phone.replace(/\D/g, '')));
      if (found) {
        state.currentUser = { ...state.currentUser, ...found };
      } else {
        // Keep user in local memory DB array so they are always recognized
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

    syncRecommendedFare();
    renderAll();
  } catch (err) {
    console.error('Failed to load state:', err);
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

let realtimeEventSource = null;
let realtimeReconnectTimer = null;

function connectRealtimeStream() {
  if (realtimeEventSource) {
    try { realtimeEventSource.close(); } catch (e) {}
    realtimeEventSource = null;
  }
  if (realtimeReconnectTimer) {
    clearTimeout(realtimeReconnectTimer);
    realtimeReconnectTimer = null;
  }

  try {
    const es = new EventSource('/api/stream');
    realtimeEventSource = es;

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.eventType === 'CONNECTED') return;

        if (data.eventType === 'MESSAGE_SENT' && data.payload) {
          const { requestId, message } = data.payload;
          const targetReq = (state.db?.requests || []).find((r) => r.id === requestId);
          if (targetReq && message) {
            if (!targetReq.messages) targetReq.messages = [];
            if (!targetReq.messages.some((m) => m.id === message.id)) {
              targetReq.messages.push(message);
            }
            updateChatFeedDomOnly(targetReq);
          }
        }

        // If user is currently typing in an input or on sign up flow, never interrupt their screen!
        const activeEl = document.activeElement;
        const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
        if (state.activeModal === 'SIGNUP_FLOW' || isUserTyping) {
          return;
        }

        await fetchState();

        if (data.eventType === 'TASK_CANCELLED' && state.role === 'CUSTOMER') {
          state.screenStep = 'HOME';
          state.activeRequestId = null;
          state.pendingSearchFareUsd = null;
          renderAll();
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      try { es.close(); } catch (e) {}
      realtimeEventSource = null;
      if (!realtimeReconnectTimer) {
        realtimeReconnectTimer = setTimeout(connectRealtimeStream, 2500);
      }
    };
  } catch (err) {
    realtimeReconnectTimer = setTimeout(connectRealtimeStream, 3000);
  }
}

// ============================================================================
// 1-SECOND COUNTDOWN LOOP FOR SEARCH BAR, GEOFENCE 50M ALERTS & 20M AUTO-PAIR
// ============================================================================
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

  if (!bookedJob || (bookedJob.status !== 'CONFIRMED' && bookedJob.status !== 'ARRIVED')) {
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

    // Update countdown text on live DOM without wiping inputs or map
    const countdownEls = document.querySelectorAll('.proximity-autopair-timer');
    countdownEls.forEach((el) => {
      el.textContent = `${Math.max(0, 60 - currentSec)}s`;
    });

    if (currentSec >= 60) {
      delete state.bookingProximitySeconds[bookedJob.id];
      showToast('20m Proximity reached for 1 min: Task automatically started!');
      apiPost('/api/bookings/status', {
        requestId: bookedJob.id,
        status: 'IN_PROGRESS',
        autoStarted: true
      }).then(() => {
        fetchState();
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

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function showToast(msg, type = 'info') {
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

    leafletMap.on('movestart', () => {
      const pin = document.getElementById('centerMapPin');
      if (pin) pin.classList.add('lifting');
    });

    leafletMap.on('moveend', () => {
      const pin = document.getElementById('centerMapPin');
      if (pin) pin.classList.remove('lifting');
      if (!leafletMap) return;

      const activeReq = getCustomerActiveRequest();
      if (state.role === 'CUSTOMER' && !activeReq && state.screenStep === 'HOME') {
        const center = leafletMap.getCenter();
        state.pinnedLat = Number(center.lat.toFixed(5));
        state.pinnedLng = Number(center.lng.toFixed(5));
        reverseGeocodeHararePin(state.pinnedLat, state.pinnedLng);
      }
    });

    updateMapMarkers();
  } catch (err) {
    console.warn('Using built-in Harare street map fallback:', err.message);
    const fb = document.getElementById('fallbackRadarMap');
    if (fb) fb.style.display = 'block';
  }
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

  if (geocodeDebounceTimer) clearTimeout(geocodeDebounceTimer);
  geocodeDebounceTimer = setTimeout(async () => {
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
        const pinLabel = document.getElementById('centerPinLabel');
        if (pinLabel) pinLabel.textContent = `${state.customAddress}, ${suburb}`;
        return;
      }
    } catch (e) {}

    state.customAddress = nearest.name;
    state.customSuburbLabel = `${nearest.name}, Harare`;
    const pinLabel = document.getElementById('centerPinLabel');
    if (pinLabel) pinLabel.textContent = `${nearest.name}, Harare`;
  }, 260);
}

async function drawRoadRouteOnMap(lat1, lng1, lat2, lng2, color = '#0066FF', weight = 5) {
  if (!leafletMap) return;
  const key = `${lat1.toFixed(4)},${lng1.toFixed(4)}->${lat2.toFixed(4)},${lng2.toFixed(4)}`;

  let coords = osrmRouteCache.get(key);
  if (!coords) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0] && data.routes[0].geometry) {
          coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
          osrmRouteCache.set(key, coords);
        }
      }
    } catch (e) {}
  }

  if (!coords) {
    coords = buildCurvedPreviewPoints(lat1, lng1, lat2, lng2);
  }

  if (leafletRoutePolyline) {
    leafletMap.removeLayer(leafletRoutePolyline);
  }
  leafletRoutePolyline = L.polyline(coords, {
    color,
    weight,
    opacity: 0.92
  }).addTo(leafletMap);
}

function useBrowserGeolocation(silent = false) {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        state.userLiveGpsLat = Number(latitude.toFixed(5));
        state.userLiveGpsLng = Number(longitude.toFixed(5));

        if (latitude > -18.3 && latitude < -17.5 && longitude > 30.8 && longitude < 31.4) {
          state.pinnedLat = state.userLiveGpsLat;
          state.pinnedLng = state.userLiveGpsLng;
          reverseGeocodeHararePin(state.pinnedLat, state.pinnedLng);
        }

        updateLiveGpsMarker();
        if (leafletMap) {
          leafletMap.flyTo([state.userLiveGpsLat || state.pinnedLat, state.userLiveGpsLng || state.pinnedLng], 15, { duration: 0.7 });
        }
        if (!silent) {
          showToast('Live GPS location verified');
        }
      },
      () => {
        state.userLiveGpsLat = state.pinnedLat;
        state.userLiveGpsLng = state.pinnedLng;
        updateLiveGpsMarker();
        if (!silent && leafletMap) {
          leafletMap.flyTo([state.pinnedLat, state.pinnedLng], 15, { duration: 0.7 });
          showToast('Centered on Harare default location');
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  } else if (!silent && leafletMap) {
    leafletMap.flyTo([state.pinnedLat, state.pinnedLng], 15, { duration: 0.7 });
  }
}

function updateLiveGpsMarker() {
  if (!leafletMap) return;
  const lat = state.userLiveGpsLat || state.pinnedLat;
  const lng = state.userLiveGpsLng || state.pinnedLng;
  if (!lat || !lng) return;

  const gpsIcon = L.divIcon({
    className: 'live-gps-user-beacon-wrapper',
    html: `
      <div class="live-gps-pulse-outer"></div>
      <div class="live-gps-pulse-inner"></div>
      <div class="live-gps-core-dot"></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  if (userLiveGpsMarker) {
    userLiveGpsMarker.setLatLng([lat, lng]);
  } else {
    userLiveGpsMarker = L.marker([lat, lng], { icon: gpsIcon, zIndexOffset: 1000 }).addTo(leafletMap);
    userLiveGpsMarker.bindTooltip(state.role === 'PROVIDER' ? 'Your Live Location (Pro)' : 'Your Live Location', { direction: 'top', offset: [0, -10] });
  }
}

function updateMapMarkers() {
  const centerPin = document.getElementById('centerMapPin');
  const whereFromBubble = document.getElementById('whereFromBubble');
  const radarPulses = document.getElementById('mapRadarPulses');
  const pinLabel = document.getElementById('centerPinLabel');

  const activeReq = getCustomerActiveRequest();
  const isSearching = Boolean(activeReq && activeReq.status === 'OPEN');
  const isBooked = Boolean(activeReq && isBookedStatus(activeReq.status));

  if (centerPin) {
    if (state.isAuthenticated && state.role === 'CUSTOMER' && !isBooked) {
      centerPin.style.display = 'flex';
      centerPin.classList.toggle('searching-mode', isSearching);
      if (pinLabel) pinLabel.textContent = `${state.customAddress}`;
      if (whereFromBubble) {
        whereFromBubble.style.display = state.screenStep === 'HOME' && !isSearching ? 'block' : 'none';
      }
      if (radarPulses) {
        radarPulses.style.display = isSearching ? 'block' : 'none';
      }
    } else {
      centerPin.style.display = 'none';
    }
  }

  if (!leafletMap || !leafletMarkersLayer || !state.db) return;
  leafletMarkersLayer.clearLayers();
  if (leafletRoutePolyline) {
    leafletMap.removeLayer(leafletRoutePolyline);
    leafletRoutePolyline = null;
  }

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
    const prov = state.db.providers.find((p) => p.id === provId) || state.db.providers[0];
    if (prov) {
      drawProviderAndClientRouteMarkers(prov, activeReq);
      return;
    }
  }

  if (state.isAuthenticated && state.role === 'CUSTOMER' && state.screenStep === 'CONFIGURE' && !activeReq) {
    const catPros = state.db.providers.filter((p) => p.categoryId === state.selectedCategoryId && p.isOnline !== false);
    const nearestPro = catPros[0] || state.db.providers[0];
    if (nearestPro) {
      drawRoadRouteOnMap(state.pinnedLat, state.pinnedLng, nearestPro.lat, nearestPro.lng, '#0066FF', 4);
    }
  }

  // Draw provider markers with their real avatar + profession icon badge
  const onlinePros = state.db.providers.filter((p) => p.isOnline !== false);
  onlinePros.forEach((p, idx) => {
    const showThinkingDots = isSearching && (p.categoryId === activeReq.categoryId || idx < 2);
    const markerHtml = `
      <div class="indrive-map-pro-wrap">
        ${showThinkingDots ? `
          <div class="pro-thinking-dots-bubble">
            <span></span><span></span><span></span>
          </div>
        ` : ''}
        <div class="pro-map-marker-pill">
          ${p.avatarUrl
            ? `<img src="${p.avatarUrl}" alt="${p.shortName || p.name}" />`
            : `<span style="font-size:11px; font-weight:800; color:#0066FF;">${p.avatarInitials}</span>`
          }
          <div class="pro-map-category-dot" title="${p.brandName}">
            ${getMapMarkerProfessionIconSvg(p.categoryId)}
          </div>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: '',
      html: markerHtml,
      iconSize: [44, showThinkingDots ? 64 : 42],
      iconAnchor: [22, showThinkingDots ? 54 : 21]
    });

    const m = L.marker([p.lat, p.lng], { icon }).addTo(leafletMarkersLayer);
    m.on('click', () => openProviderCatalogueModal(p.id));
  });
}

function drawProviderAndClientRouteMarkers(prov, req) {
  // 1. Provider Live Marker
  const provHtml = `
    <div class="indrive-map-pro-wrap">
      <div style="background:#0066FF; color:#FFFFFF; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:99px; margin-bottom:4px; white-space:nowrap; box-shadow:0 4px 12px rgba(0,102,255,0.35);">
        ${prov.shortName || prov.name.split(' ')[0]} • ${req.status === 'IN_PROGRESS' ? 'At Home' : req.status === 'ARRIVED' ? 'At Gate' : 'En Route'}
      </div>
      <div class="pro-map-marker-pill" style="border-color:#0066FF; border-width:3px;">
        ${prov.avatarUrl
          ? `<img src="${prov.avatarUrl}" alt="${prov.name}" />`
          : `<span style="font-size:11px; font-weight:800; color:#0066FF;">${prov.avatarInitials}</span>`
        }
        <div class="pro-map-category-dot">
          ${getMapMarkerProfessionIconSvg(prov.categoryId)}
        </div>
      </div>
    </div>
  `;
  const provIcon = L.divIcon({
    className: '',
    html: provHtml,
    iconSize: [80, 64],
    iconAnchor: [40, 54]
  });
  L.marker([prov.lat, prov.lng], { icon: provIcon }).addTo(leafletMarkersLayer);

  // 2. Client Home Visit Destination Marker (Vector SVG Home Icon — Zero Emojis)
  const clientHtml = `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div style="background:#0F172A; color:#FFFFFF; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:99px; margin-bottom:4px; white-space:nowrap; box-shadow:0 4px 12px rgba(15,23,42,0.35); display:inline-flex; align-items:center; gap:5px;">
        ${uiIcon('home', 11)}
        <span>${req.customerName.split(' ')[0]}'s Home (${req.suburbName || 'Harare'})</span>
      </div>
      <div style="width:36px; height:36px; border-radius:12px; background:#0066FF; border:2.5px solid #FFFFFF; display:flex; align-items:center; justify-content:center; color:#FFFFFF; box-shadow:0 6px 16px rgba(0,102,255,0.45);">
        ${uiIcon('home', 18)}
      </div>
    </div>
  `;
  const clientIcon = L.divIcon({
    className: '',
    html: clientHtml,
    iconSize: [120, 62],
    iconAnchor: [60, 54]
  });
  L.marker([req.lat, req.lng], { icon: clientIcon }).addTo(leafletMarkersLayer);

  // 3. Real Street Route between Service Provider and Client's Home
  drawRoadRouteOnMap(prov.lat, prov.lng, req.lat, req.lng, '#0066FF', 5);
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
// MAIN RENDER CONTROLLER
// ============================================================================
function renderAll() {
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
    } else if (state.screenStep === 'SEARCHING' || state.screenStep === 'BOOKED') {
      state.screenStep = 'HOME';
    }
  }

  updateMapMarkers();
  renderFloatingOffersOverlay();
  renderUiOverlay();
  renderModalLayer();
  renderChatDrawer();
  renderCallModal();
}

function getCustomerActiveRequest() {
  if (!state.db || !state.currentUser || !state.isAuthenticated) return null;
  if (state.activeRequestId) {
    const found = state.db.requests.find(
      (r) => r.id === state.activeRequestId && r.customerId === state.currentUser.id && (r.status === 'OPEN' || isBookedStatus(r.status))
    );
    if (found) return found;
  }
  const myOpen = state.db.requests.find(
    (r) => r.customerId === state.currentUser.id && (r.status === 'OPEN' || isBookedStatus(r.status))
  );
  if (myOpen) {
    state.activeRequestId = myOpen.id;
    return myOpen;
  }
  state.activeRequestId = null;
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
function renderFloatingOffersOverlay() {
  const root = document.getElementById('floatingOffersRoot');
  if (!root) return;

  if (!state.isAuthenticated || state.role !== 'CUSTOMER') {
    root.className = 'floating-offers-root';
    root.innerHTML = '';
    return;
  }

  const req = getCustomerActiveRequest();
  if (!req || req.status !== 'OPEN' || !req.offers || req.offers.length === 0) {
    root.className = 'floating-offers-root';
    root.innerHTML = '';
    return;
  }

  const nowMs = Date.now();
  const activeOffers = req.offers.filter((o) => {
    const exp = o.expiresAt || (new Date(o.createdAt).getTime() + 120 * 1000);
    return exp > nowMs;
  });

  if (activeOffers.length === 0) {
    root.className = 'floating-offers-root';
    root.innerHTML = '';
    return;
  }

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
          <button class="minimized-restore-btn">
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
      const prov = state.db.providers.find((p) => p.id === offer.providerId);
      const expiresAt = offer.expiresAt || (new Date(offer.createdAt).getTime() + 120 * 1000);
      const totalMs = (offer.ttlSeconds || 120) * 1000;
      const remMs = Math.max(0, expiresAt - nowMs);
      const pct = Math.max(8, Math.min(100, (remMs / totalMs) * 100));

      const isYourFare = Number(offer.priceUsd) <= Number(req.budgetUsd);
      const isPlatinum = Boolean(offer.isPlatinum || prov?.isPlatinum || (offer.providerSkillTier || '').toLowerCase().includes('platinum'));
      const shortName = offer.providerShortName || (offer.providerName || 'Pro').split(' ')[0];
      const avatarUrl = offer.providerAvatarUrl || prov?.avatarUrl || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80';
      const approvedPhotosCount = prov ? (prov.portfolio || []).filter((i) => i.approvalStatus === 'APPROVED').length : 2;
      const jobsCount = offer.providerCompletedJobs || prov?.completedBookings || 312;

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
              <img src="${avatarUrl}" alt="${shortName}" />
              ${isPlatinum ? `<div class="platinum-diamond-badge">${uiIcon('diamond', 9)}</div>` : ''}
            </div>
            <div class="offer-pro-details">
              <div class="offer-pro-name-line">
                <span>${shortName}</span>
                <span style="display:inline-flex; align-items:center; gap:3px;">${uiIcon('star', 13)} ${offer.providerRating || 4.9}</span>
                <span class="offer-pro-jobs">${jobsCount} jobs</span>
              </div>
              <div class="offer-pro-kit-line">${offer.providerBrand || req.title}</div>
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
function renderUiOverlay() {
  const overlay = document.getElementById('uiOverlay');
  if (!overlay) return;

  if (!state.isAuthenticated) {
    overlay.innerHTML = renderNativeAuthScreen();
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
    return;
  }

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
  if (state.role === 'PROVIDER') {
    contentHtml = renderProviderModeOverlay();
  } else {
    const activeReq = getCustomerActiveRequest();
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
  const myPastBookings = (state.db.requests || []).filter(
    (r) => state.currentUser && r.customerId === state.currentUser.id
  );

  const items = [];
  const seenTitles = new Set();

  myPastBookings.forEach((req) => {
    const cat = categories.find((c) => c.id === req.categoryId) || categories[0];
    if (!cat || seenTitles.has(req.title)) return;
    const subIdx = Math.max(0, (cat.subServices || []).findIndex((s) => s.name === req.title));
    seenTitles.add(req.title);
    items.push({
      categoryId: cat.id,
      categoryName: cat.name,
      subIdx,
      title: req.title,
      priceUsd: req.budgetUsd,
      badge: 'Your most used'
    });
  });

  const topDefaults = [
    { catId: 'braiding', subIdx: 0, badge: 'Most requested in Harare' },
    { catId: 'barber', subIdx: 0, badge: 'Popular home visit' },
    { catId: 'nails', subIdx: 0, badge: 'Top rated service' },
    { catId: 'makeup', subIdx: 0, badge: 'Trending in Harare' }
  ];

  const selectedCat = categories.find((c) => c.id === state.selectedCategoryId);
  if (selectedCat && selectedCat.subServices) {
    selectedCat.subServices.slice(0, 2).forEach((sub, idx) => {
      if (!seenTitles.has(sub.name)) {
        seenTitles.add(sub.name);
        items.push({
          categoryId: selectedCat.id,
          categoryName: selectedCat.name,
          subIdx: idx,
          title: sub.name,
          duration: sub.duration,
          priceUsd: sub.defaultUsd,
          badge: `Popular ${selectedCat.name}`
        });
      }
    });
  }

  topDefaults.forEach((td) => {
    const cat = categories.find((c) => c.id === td.catId);
    const sub = cat?.subServices?.[td.subIdx];
    if (cat && sub && !seenTitles.has(sub.name)) {
      seenTitles.add(sub.name);
      items.push({
        categoryId: cat.id,
        categoryName: cat.name,
        subIdx: td.subIdx,
        title: sub.name,
        duration: sub.duration,
        priceUsd: sub.defaultUsd,
        badge: td.badge
      });
    }
  });

  return items.slice(0, 4);
}

// ----------------------------------------------------------------------------
// HOME MAP, ICONIFIED SERVICE TILES & TOP SERVICES (COLLAPSIBLE SHEET)
// ----------------------------------------------------------------------------
function renderHomeDiscoveryOverlay() {
  const categories = state.db.categories || [];
  const topServices = getPersonalizedAndTopServices();

  return `
    <!-- Top Row: Left Hamburger Drawer -->
    <div class="indrive-top-left-row">
      <button class="indrive-circle-btn" onclick="openSideDrawerModal()" title="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>
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
          <button class="minimized-restore-btn">
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

          <!-- Big "What service & for how much?" Pill Button -->
          <button class="indrive-where-to-btn" onclick="openConfigureStep(0)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="M20 20l-3.5-3.5"/>
            </svg>
            <span>What service &amp; for how much?</span>
          </button>

          <!-- Section Header: Most Used / Top Requested Services -->
          <div style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin:4px 4px 4px;">
            Top Requested &amp; Most Used Services
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
        <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('pin', 18)}</span>
        <div class="top-route-text">${state.customAddress}, ${state.customSuburbLabel.split(',')[0]}</div>
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
          <button class="minimized-restore-btn">
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
  const viewingPros = state.db.providers.filter((p) => p.isOnline !== false).slice(0, 6);
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
          <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">${viewingPros.length} pros viewing on radar • Tap to adjust fare</div>
        </div>
        <button class="minimized-restore-btn">
          ${uiIcon('chevronUp', 14)}
          <span>Open Radar</span>
        </button>
      </div>
    ` : `
      <div class="indrive-dark-sheet">
        <div class="viewing-pros-banner">
          <span class="viewing-pros-text">${viewingPros.length} pros are viewing your request</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="viewing-avatars-stack">
              ${viewingPros.map((p) => `
                <img src="${p.avatarUrl || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80'}" alt="${p.shortName || p.name}" />
              `).join('')}
            </div>
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
  const prov = state.db.providers.find((p) => p.id === provId) || state.db.providers[0];
  const avatarUrl = prov?.avatarUrl || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80';
  const agreedPrice = acceptedOffer?.priceUsd || req.agreedTotalUsd || req.budgetUsd;

  let statusIcon = uiIcon('routeCar', 18);
  let statusHeadline = `${prov?.shortName || prov?.name || 'Pro'} is arriving in ~${acceptedOffer?.etaMinutes || 4} min`;
  if (req.status === 'ARRIVED') {
    statusIcon = uiIcon('pin', 18);
    statusHeadline = `${prov?.shortName || prov?.name} has arrived at your gate!`;
  } else if (req.status === 'IN_PROGRESS' || req.pinVerifiedByProvider) {
    statusIcon = uiIcon('sparkle', 18);
    statusHeadline = `Service in progress at your home`;
  }

  return `
    <div class="indrive-top-left-row">
      <button class="indrive-circle-btn" onclick="openSideDrawerModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>

      <div style="display:flex; align-items:center; gap:8px;">
        <button class="cancel-request-red-pill pointer-auto" onclick="openCancelTaskModal('${req.id}')">
          ${uiIcon('close', 14)}
          <span>Cancel</span>
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
          <div style="font-size:13.5px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
            <span style="color:var(--blue-primary); display:inline-flex;">${statusIcon}</span>
            <span>${statusHeadline}</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Start PIN: #${req.startPinCode || '4829'} • Tap to open chat &amp; details</div>
        </div>
        <button class="minimized-restore-btn">
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

        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
          <div>
            <div style="font-size:16.5px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:7px;">
              <span style="color:var(--blue-primary); display:inline-flex;">${statusIcon}</span>
              <span>${statusHeadline}</span>
            </div>
            <div style="font-size:12.5px; color:var(--text-secondary); margin-top:2px;">
              ${req.title} • <strong style="color:var(--blue-primary);">${formatUsdPrice(agreedPrice)}</strong> (${req.paymentMethod})
            </div>
          </div>
          <div style="background:var(--blue-soft); border:1.5px solid var(--blue-border); padding:6px 12px; border-radius:12px; text-align:center; flex-shrink:0;">
            <div style="font-size:9.5px; color:var(--blue-primary); font-weight:800;">START PIN</div>
            <div style="font-size:16.5px; font-weight:800; color:var(--blue-primary); letter-spacing:2px;">${req.startPinCode || '4829'}</div>
          </div>
        </div>

        <!-- Geofence 50m Alert & 20m Auto-Pair Status -->
        ${(() => {
          const distMeters = calculateDistanceMeters(prov?.lat, prov?.lng, req.lat, req.lng);
          const isWithin50m = distMeters <= 50 || req.status === 'ARRIVED';
          const isWithin20m = distMeters <= 20 || req.status === 'ARRIVED';
          const proximitySec = (state.bookingProximitySeconds && state.bookingProximitySeconds[req.id]) || 0;
          const autoPairRemaining = Math.max(0, 60 - proximitySec);

          if (!isWithin50m || req.status === 'IN_PROGRESS') return '';
          return `
            <div style="background:#EFF6FF; border:1.5px solid #93C5FD; border-radius:13px; padding:10px 12px; margin-bottom:12px; display:flex; align-items:flex-start; gap:9px;">
              <div style="width:30px; height:30px; border-radius:50%; background:#0066FF; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">
                ${uiIcon('pin', 15)}
              </div>
              <div style="flex:1; min-width:0;">
                <div style="font-size:12.5px; font-weight:800; color:#1E40AF;">
                  ${req.status === 'ARRIVED' ? 'Provider is outside your gate!' : `Provider is within 50m (${distMeters}m away)!`}
                </div>
                <div style="font-size:12px; color:#1E3A8A; margin-top:2px;">
                  Please share your 4-digit Start PIN: <strong style="font-size:13.5px; color:#0066FF; letter-spacing:1px;">#${req.startPinCode || '4829'}</strong> with ${prov?.shortName || 'your provider'}.
                </div>
                ${isWithin20m ? `
                  <div style="font-size:11px; font-weight:700; color:#059669; margin-top:5px; display:flex; align-items:center; gap:5px;">
                    <span style="width:6px; height:6px; border-radius:50%; background:#10B981; display:inline-block;"></span>
                    <span>Within 20m • Auto-pairing in <span class="proximity-autopair-timer">${autoPairRemaining}s</span> if PIN not entered</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        })()}

        <!-- Accepted Service Provider Card -->
        <div class="indrive-selected-tier-box" style="margin-bottom:12px; padding:11px 13px;">
          <div class="offer-pro-row" style="margin-bottom:0;">
            <div class="offer-avatar-wrap platinum">
              <img src="${avatarUrl}" alt="${prov?.name}" />
              <div class="platinum-diamond-badge">${uiIcon('diamond', 9)}</div>
            </div>
            <div class="offer-pro-details">
              <div class="offer-pro-name-line">
                <span>${prov?.name || 'Tariro Moyo'}</span>
                <span style="display:inline-flex; align-items:center; gap:3px;">${uiIcon('star', 13)} ${prov?.rating || 4.96}</span>
              </div>
              <div class="offer-pro-kit-line">${prov?.brandName || 'Mobile Service'} • ${acceptedOffer?.distanceKm || 2.4} km away</div>
              <div class="offer-pro-platinum-line">${prov?.skillTier || 'Platinum pro'}</div>
            </div>
            <button class="offer-catalogue-pill" onclick="openProviderCatalogueModal('${prov?.id}')">
              <span>Catalogue</span>
              ${uiIcon('chevronRight', 13)}
            </button>
          </div>
        </div>

        <!-- Latest Message Snippet Pill (if messages exist) -->
        ${(req.messages && req.messages.length > 0) ? `
          <div class="chat-preview-pill" onclick="openChatDrawer('${req.id}', '${prov?.id}')">
            <div class="chat-preview-dot"></div>
            <div class="chat-preview-text">
              <span class="chat-preview-sender">${req.messages[req.messages.length - 1].senderName}:</span>
              ${req.messages[req.messages.length - 1].text}
            </div>
            <span class="chat-preview-action">Reply ${uiIcon('chevronRight', 12)}</span>
          </div>
        ` : ''}

        <!-- Action Buttons: Masked Call, Full Screen Chat, Complete Service -->
        <div style="display:grid; grid-template-columns:1fr 1fr 1.25fr; gap:8px;">
          <button class="btn-dark-sec" onclick="startInAppCall('${prov?.name || 'Pro'}', '${req.title}')">
            ${uiIcon('phone', 14)}
            <span>Call</span>
          </button>
          <button class="btn-dark-sec" onclick="openChatDrawer('${req.id}', '${prov?.id}')">
            ${uiIcon('chat', 14)}
            <span>Chat ${(req.messages && req.messages.length > 0) ? `(${req.messages.length})` : ''}</span>
          </button>
          <button class="btn-primary-blue" style="height:42px; font-size:13px;" onclick="openRateBookingModal('${req.id}')">
            ${uiIcon('check', 15)}
            <span>Complete</span>
          </button>
        </div>
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
  const suburbs = state.db?.suburbs || [];
  const activeCategories = (state.db?.categories || []).filter((c) => c.status === 'ACTIVE');

  // STEP 1: PHONE NUMBER & ACCOUNT DETAILS
  if (state.authStep === 'PHONE') {
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="/assets/logo-icon.svg" width="38" height="38" style="border-radius:11px; display:block;" alt="Findit Logo" />
            <div>
              <div style="font-size:18px; font-weight:800; color:var(--text-main);">Findit Harare</div>
              <div style="font-size:11.5px; color:var(--text-secondary); font-weight:600;">Sign Up / Sign In (Step 1 of 2)</div>
            </div>
          </div>
          ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
        </div>

        <div style="font-size:21px; font-weight:800; color:var(--text-main); margin-bottom:4px;">
          Enter your details
        </div>
        <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">
          Existing accounts log in instantly; new accounts proceed to face scan.
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
          <button
            type="button"
            class="${state.authRole === 'CUSTOMER' ? 'btn-primary-blue' : 'btn-dark-sec'}"
            style="height:44px; font-size:13px;"
            onclick="state.authRole='CUSTOMER'; renderAll();"
          >
            ${uiIcon('user', 14)}
            <span>Client Account</span>
          </button>
          <button
            type="button"
            class="${state.authRole === 'PROVIDER' ? 'btn-primary-blue' : 'btn-dark-sec'}"
            style="height:44px; font-size:13px;"
            onclick="state.authRole='PROVIDER'; renderAll();"
          >
            ${uiIcon('briefcase', 14)}
            <span>Service Provider</span>
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
          <div>
            <label style="font-size:11.5px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Full Name</label>
            <input
              class="dark-input"
              placeholder="e.g. Nyasha Mutasa"
              value="${state.authName || ''}"
              oninput="state.authName = this.value"
            />
          </div>

          <div>
            <label style="font-size:11.5px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">WhatsApp / Phone Number</label>
            <div style="display:flex; gap:10px;">
              <div style="background:var(--blue-soft); border:1.5px solid var(--blue-border); border-radius:13px; padding:11px 13px; font-weight:800; color:var(--blue-primary); display:inline-flex; align-items:center; gap:7px; white-space:nowrap;">
                ${uiIcon('zwFlag', 20)}
                <span>+263</span>
              </div>
              <input
                type="tel"
                class="dark-input"
                style="font-size:16px; font-weight:800; flex:1;"
                placeholder="77 200 1001"
                value="${(state.authPhone || '').replace(/^\+?263\s*/, '')}"
                oninput="state.authPhone = '+263 ' + this.value"
              />
            </div>
          </div>

          <div>
            <label style="font-size:11.5px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Harare Suburb</label>
            <select class="dark-input" onchange="state.authSuburbId = this.value">
              ${suburbs.map((s) => `<option value="${s.id}" ${s.id === state.authSuburbId ? 'selected' : ''}>${s.name}, Harare</option>`).join('')}
            </select>
          </div>

          ${state.authRole === 'PROVIDER' ? `
            <div>
              <label style="font-size:11.5px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Profession / Trade</label>
              <select class="dark-input" onchange="state.authCategoryId = this.value">
                ${activeCategories.map((c) => `<option value="${c.id}" ${c.id === state.authCategoryId ? 'selected' : ''}>${c.fullName || c.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:11.5px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block;">Starting Rate in USD ($)</label>
              <input type="number" class="dark-input" placeholder="25" value="${state.authStartingPrice || 25}" oninput="state.authStartingPrice = this.value" />
            </div>
          ` : ''}
        </div>

        <label style="display:flex; align-items:flex-start; gap:9px; font-size:12px; color:var(--text-secondary); margin-bottom:18px; line-height:1.45;">
          <input type="checkbox" ${state.authTermsAccepted ? 'checked' : ''} onchange="state.authTermsAccepted = this.checked" style="margin-top:3px; accent-color:#0066FF;" />
          <span>
            I agree to Findit Harare's
            <a href="javascript:void(0)" onclick="state.activeModal='TERMS_MODAL'; renderModalLayer();" style="color:var(--blue-primary); font-weight:700;">Terms &amp; Conditions</a>
            and
            <a href="javascript:void(0)" onclick="state.activeModal='PRIVACY_MODAL'; renderModalLayer();" style="color:var(--blue-primary); font-weight:700;">Privacy Policy</a>
          </span>
        </label>

        <button type="button" class="btn-primary-blue" style="height:52px; font-size:15px; font-weight:800;" onclick="submitPhoneForFaceStep()">
          ${uiIcon('camera', 18)}
          <span>Continue to Step 2: Scan Face for Logo</span>
        </button>
      </div>
    `;
  }

  // STEP 2: SCAN FACE FOR VERIFICATION & OFFICIAL PROFILE LOGO
  return `
    <div>
      <div class="cancel-sheet-header">
        <button type="button" class="btn-dark-sec" style="padding:6px 12px;" onclick="stopFaceCameraStream(); state.authStep='PHONE'; renderAll();">
          ${uiIcon('arrowLeft', 14)}
          <span>Back</span>
        </button>
        ${!isFullScreen ? `<button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>` : ''}
      </div>

      <div style="font-size:21px; font-weight:800; color:var(--text-main); margin-bottom:4px;">
        Scan Face for Logo
      </div>
      <div style="font-size:13px; color:var(--text-secondary); margin-bottom:18px;">
        Step 2 of 2: Snap your face photo to use as your official logo on Findit Harare.
      </div>

      <!-- Biometric Circular Face Logo Scanner Frame -->
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
        <div style="position:relative; width:220px; height:220px; border-radius:50%; border:3.5px solid var(--blue-primary); box-shadow:0 0 28px rgba(0,102,255,0.4); overflow:hidden; background:#0F172A; display:flex; align-items:center; justify-content:center;">
          ${state.authCapturedSelfieUrl ? `
            <img src="${state.authCapturedSelfieUrl}" alt="Face Logo" style="width:100%; height:100%; object-fit:cover; display:block;" />
          ` : `
            <video id="authSelfieVideo" autoplay playsinline muted style="width:100%; height:100%; object-fit:cover; display:block;"></video>
          `}
          <canvas id="authSelfieCanvas" style="display:none;"></canvas>
          <input type="file" id="authFaceFileInput" accept="image/*" style="display:none;" onchange="handleAuthFaceFileUpload(this)" />
        </div>

        ${state.authCapturedSelfieUrl ? `
          <div style="background:#ECFDF5; border:1px solid #10B981; color:#065F46; padding:7px 14px; border-radius:99px; font-weight:800; font-size:12px; display:inline-flex; align-items:center; gap:6px; margin-top:14px;">
            ${uiIcon('check', 14)}
            <span>Face Logo Ready ✓</span>
          </div>
        ` : `
          <div id="authCameraHint" style="font-size:12px; color:var(--text-secondary); margin-top:12px; font-weight:600; text-align:center;">
            Position your face inside the circle &amp; tap Snap
          </div>
        `}
      </div>

      ${!state.authCapturedSelfieUrl ? `
        <button type="button" class="btn-primary-blue" style="height:52px; font-size:15px; font-weight:800; margin-bottom:10px;" onclick="captureAuthFaceSelfie()">
          ${uiIcon('camera', 18)}
          <span>Snap Face for Logo</span>
        </button>
        <button type="button" class="btn-dark-sec" style="height:46px; font-size:13px; font-weight:700; width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px;" onclick="document.getElementById('authFaceFileInput').click()">
          ${uiIcon('image', 16)}
          <span>Choose Photo from Device</span>
        </button>
      ` : `
        <button type="button" class="btn-primary-blue" style="height:52px; font-size:15px; font-weight:800; margin-bottom:10px;" onclick="finishNativeRegistration()">
          ${uiIcon('sparkle', 18)}
          <span>Join Findit Harare</span>
        </button>
        <button type="button" class="btn-dark-sec" style="height:46px; font-size:13px; font-weight:700; width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px;" onclick="retakeAuthFaceSelfie()">
          ${uiIcon('refresh', 15)}
          <span>Retake Photo</span>
        </button>
      `}
    </div>
  `;
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

  // 1-Click Instant Sign-In for Existing Accounts (ZERO WAIT, NO CODES!)
  const last9 = digits.slice(-9);
  if (state.db) {
    const list = state.authRole === 'PROVIDER' ? (state.db.providers || []) : (state.db.customers || []);
    const existing = list.find((item) => (item.phone || '').replace(/\D/g, '').slice(-9) === last9 && !item.isBanned);
    if (existing) {
      stopFaceCameraStream();
      state.currentUser = existing;
      state.isAuthenticated = true;
      state.activeModal = null;
      state.authStep = 'PHONE';
      saveSession(state.authRole, existing, false);
      showToast(`Welcome back, ${existing.name}!`);
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

function handleAuthFaceFileUpload(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.authCapturedSelfieUrl = e.target.result;
    stopFaceCameraStream();
    renderAll();
  };
  reader.readAsDataURL(file);
}

async function finishNativeRegistration() {
  const name = (state.authName || '').trim();
  if (!name) {
    showToast('Please enter your full legal name', 'error');
    state.authStep = 'PHONE';
    renderAll();
    return;
  }

  // Ensure an avatar is available (captured face logo, or fallback SVG monogram)
  let finalAvatar = state.authCapturedSelfieUrl;
  if (!finalAvatar) {
    const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'FH';
    const svgAvatar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#0066FF"/><text x="50" y="62" font-size="38" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="Inter, -apple-system, sans-serif">${initials}</text></svg>`;
    finalAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(svgAvatar)}`;
  }

  try {
    showToast('Creating your account...', 'info');
    const res = await apiPost('/api/auth/complete-signup', {
      role: state.authRole,
      name: name,
      phone: state.authPhone.trim(),
      suburbId: state.authSuburbId,
      categoryId: state.authCategoryId,
      skillTier: state.authSkillTier,
      brandName: (state.authBrandName || `${name.split(' ')[0]} Mobile Services`).trim(),
      startingPriceUsd: Number(state.authStartingPrice || 25),
      nationalIdNumber: (state.authNationalId || '').trim() || '63-2948102-F-42',
      avatarUrl: finalAvatar,
      portfolioImageUrl: state.authPortfolioPhotoUrl || ''
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
    showToast(`Welcome to Findit Harare, ${res.user.name}!`);
    renderAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}


// ============================================================================
// SLIDE-OUT LEFT DRAWER, CANCELLATION SHEET, WAITLIST, RATING & MODALS
// ============================================================================
function renderModalLayer() {
  const root = document.getElementById('pickerModalRoot');
  if (!root) return;
  if (!state.activeModal) {
    root.innerHTML = '';
    return;
  }

  // SIGN-UP WIZARD MODAL
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

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">${isProvider ? 'Rate Client & Courtesy' : 'Rate Home-Visit Service'}</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="text-align:center; padding:8px 0 14px;">
            <div style="font-size:14px; font-weight:700; color:var(--text-secondary); margin-bottom:10px;">
              ${isProvider ? `How was your visit serving <strong>${req.customerName || 'the client'}</strong>?` : `How was your <strong>${req.title || 'Home Service'}</strong> experience?`}
            </div>
            <div style="display:flex; justify-content:center; gap:10px; margin-bottom:14px;">
              ${[1, 2, 3, 4, 5].map((star) => `
                <button
                  style="background:var(--bg-card); border:1.5px solid ${star <= state.ratingStars ? '#F59E0B' : 'var(--border-light)'}; width:46px; height:46px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;"
                  onclick="state.ratingStars=${star}; renderModalLayer();"
                >
                  ${star <= state.ratingStars ? uiIcon('star', 22) : uiIcon('starOutline', 22)}
                </button>
              `).join('')}
            </div>

            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:7px; margin-bottom:14px;">
              ${allTags.map((tag) => {
                const active = state.ratingTags.includes(tag);
                return `
                  <button
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
                    ? `<img src="${user.avatarUrl}" alt="${user.name}" />`
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
              <div class="drawer-profile-header" onclick="state.authRole='CUSTOMER'; state.authStep='PHONE'; state.activeModal='SIGNUP_FLOW'; renderModalLayer();">
                <div class="drawer-avatar-circle" style="background:var(--blue-soft); color:var(--blue-primary);">
                  ${uiIcon('user', 20)}
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="font-size:15px; font-weight:800; color:var(--text-main);">Sign in with WhatsApp</div>
                  <div style="font-size:12px; color:var(--blue-primary); font-weight:700; margin-top:2px;">
                    Tap to verify &amp; access bookings
                  </div>
                </div>
                <span style="color:var(--text-secondary); display:inline-flex;">${uiIcon('chevronRight', 14)}</span>
              </div>
            `}

            <div class="drawer-menu-list">
              <div class="drawer-menu-item active" onclick="closeModal()">
                ${uiIcon('home', 18)}
                <span>${isProvider ? 'Provider Workspace' : 'City / Home Services'}</span>
              </div>

              ${isProvider ? `
                <div class="drawer-menu-item" onclick="closeModal(); state.providerTab='WALLET'; state.isSheetMinimized=false; renderUiOverlay();">
                  ${uiIcon('wallet', 18)}
                  <span>Prepaid USD Wallet ($${(user.walletBalanceUsd || 0).toFixed(2)})</span>
                </div>
              ` : ''}

              <div class="drawer-menu-item" onclick="state.activeModal='HISTORY'; renderModalLayer();">
                ${uiIcon('clock', 18)}
                <span>Request history</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='NOTIFICATIONS'; renderModalLayer();">
                ${uiIcon('bell', 18)}
                <span>Notifications</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='SAFETY'; renderModalLayer();">
                ${uiIcon('shield', 18)}
                <span>Safety</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='SETTINGS'; renderModalLayer();">
                ${uiIcon('gear', 18)}
                <span>Settings</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='HELP'; renderModalLayer();">
                ${uiIcon('info', 18)}
                <span>Help</span>
              </div>

              <div class="drawer-menu-item" onclick="state.activeModal='SUPPORT'; renderModalLayer();">
                ${uiIcon('support', 18)}
                <span>Support</span>
              </div>
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
    const prov = state.db.providers.find((p) => p.id === providerId) || state.db.providers[0];
    const approvedPhotos = (prov.portfolio || []).filter((item) => item.approvalStatus === 'APPROVED');

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${prov.avatarUrl}" alt="${prov.name}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2.5px solid #0066FF;" />
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
                <img src="${item.imageUrl}" alt="${item.title}" style="width:100%; height:185px; object-fit:cover; display:block;" />
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

  // REQUEST HISTORY MODAL
  if (state.activeModal === 'HISTORY') {
    const userId = state.currentUser ? state.currentUser.id : null;
    const myRequests = userId
      ? (state.db.requests || []).filter((r) => r.customerId === userId)
      : [];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Request History</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          ${myRequests.length === 0 ? `
            <div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">
              <div style="font-size:32px; margin-bottom:8px; color:var(--text-muted);">${uiIcon('clock', 36)}</div>
              <div style="font-weight:700; font-size:15px; color:var(--text-primary); margin-bottom:4px;">No requests yet</div>
              <div style="font-size:13px;">Your completed and active service requests will appear here.</div>
            </div>
          ` : myRequests.map((r) => `
            <div class="indrive-cancel-row" style="cursor:default;">
              <div>
                <div style="font-weight:800; font-size:14.5px;">${r.title}</div>
                <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${r.exactAddress || r.suburbName || 'Harare'} • ${r.status}</div>
              </div>
              <div style="font-weight:800; font-size:15.5px; color:var(--blue-primary);">${formatUsdPrice(r.budgetUsd)}</div>
            </div>
          `).join('')}
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

  // SETTINGS MODAL
  if (state.activeModal === 'SETTINGS') {
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Account Settings</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <div class="indrive-cancel-row">
            <span>Verification status</span>
            <span style="color:#059669; font-weight:800; display:inline-flex; align-items:center; gap:4px;">
              ${uiIcon('check', 14)}
              <span>WhatsApp &amp; Face Verified</span>
            </span>
          </div>
          <div class="indrive-cancel-row">
            <span>Findit App ID</span>
            <span style="font-family:monospace; font-weight:800; color:var(--blue-primary);">${state.currentUser?.finditId || (state.role === 'PROVIDER' ? 'FH-PRO-849201' : 'FH-USR-392810')}</span>
          </div>
          <div class="indrive-cancel-row">
            <span>Phone number</span>
            <span style="color:var(--text-secondary); font-weight:700;">${state.currentUser?.phone || '+263 77 200 1001'}</span>
          </div>
          <div class="indrive-cancel-row">
            <span>Currency</span>
            <span style="color:var(--blue-primary); font-weight:800;">USD ($)</span>
          </div>
          <div class="indrive-cancel-row" onclick="logoutCurrentAccount()">
            <span style="color:var(--text-main); font-weight:700;">Log Out</span>
          </div>
          <div class="indrive-cancel-row" onclick="promptDeleteAccount()" style="border-top:1px solid #FEE2E2; margin-top:6px; cursor:pointer;">
            <span style="color:#DC2626; font-weight:800; display:flex; align-items:center; gap:8px;">
              ${uiIcon('trash', 16)}
              <span>Delete Account Permanently</span>
            </span>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // NOTIFICATIONS MODAL
  if (state.activeModal === 'NOTIFICATIONS') {
    const notifications = [
      {
        icon: 'check',
        color: '#059669',
        title: 'Account Verified & Protected',
        time: 'Active now',
        body: 'Your Face ID and WhatsApp account have been authenticated. You have full access to Findit Harare home services.'
      },
      {
        icon: 'wallet',
        color: '#0066FF',
        title: 'EcoCash USD Top-Ups Available',
        time: 'Wallet update',
        body: 'Top up your account instantly via EcoCash merchant transfer (0772 910 440) for rapid booking dispatch.'
      },
      {
        icon: 'shield',
        color: '#0066FF',
        title: 'Harare Safety & Fair Bargaining',
        time: 'Safety notice',
        body: 'Always confirm provider badge and pay in cash only after the work is fully inspected and complete.'
      }
    ];

    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Notifications</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; max-height:65vh; overflow-y:auto; padding-bottom:8px;">
            ${notifications.map((n) => `
              <div style="padding:12px 14px; background:var(--bg-card); border-radius:14px; border:1px solid var(--border-light);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:${n.color}; display:inline-flex;">${uiIcon(n.icon, 16)}</span>
                    <span style="font-size:13.5px; font-weight:800; color:var(--text-main);">${n.title}</span>
                  </div>
                  <span style="font-size:11px; color:var(--text-secondary); font-weight:600;">${n.time}</span>
                </div>
                <div style="font-size:12px; color:var(--text-secondary); line-height:1.45; padding-left:24px;">
                  ${n.body}
                </div>
              </div>
            `).join('')}
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

  // SUPPORT & HELPLINE MODAL
  if (state.activeModal === 'SUPPORT') {
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Support &amp; Helpline</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="margin-bottom:14px; font-size:12.5px; color:var(--text-secondary); line-height:1.45;">
            Our Harare member support team is available 24/7 to assist with bookings, dispute mediation, and EcoCash top-up inquiries.
          </div>

          <a href="https://wa.me/263713475131?text=Hi%20Findit%20Harare%20Support,%20I%20need%20assistance%20with%20my%20account" target="_blank" rel="noopener" class="indrive-cancel-row" style="text-decoration:none;">
            <div class="cancel-row-left">
              <span style="color:#059669; display:inline-flex;">${uiIcon('check', 18)}</span>
              <div>
                <div style="font-size:13.5px; font-weight:800; color:var(--text-main);">Chat on WhatsApp Support</div>
                <div style="font-size:11.5px; color:var(--text-secondary);">@FinditHarare • Typically replies in 2 mins</div>
              </div>
            </div>
            ${uiIcon('chevronRight', 16)}
          </a>


          <div style="margin-top:14px; padding:12px; background:var(--bg-card); border-radius:12px; border:1px solid var(--border-light); font-size:11.5px; color:var(--text-secondary); line-height:1.4;">
            <strong>Support Hours:</strong> Monday – Sunday, 24 Hours<br/>
            <strong>Physical Desk:</strong> Samora Machel Ave / First St, Harare CBD
          </div>
        </div>
      </div>
    `;
    return;
  }

  // SUBURB PICKER MODAL
  if (state.activeModal === 'SUBURB_PICKER') {
    const suburbs = state.db.suburbs || [];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="indrive-modal-sheet" onclick="event.stopPropagation()">
          <div class="cancel-sheet-header">
            <div class="cancel-sheet-title">Your Home Visit Location</div>
            <button class="cancel-close-x" onclick="closeModal()">${uiIcon('close', 16)}</button>
          </div>

          <div style="margin-bottom:12px;">
            <input
              type="text"
              class="dark-input"
              value="${state.customAddress}"
              placeholder="House number & street name"
              oninput="state.customAddress = this.value"
            />
          </div>

          <div style="max-height:290px; overflow-y:auto;">
            ${suburbs.map((s) => `
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
    const presetNotes = [
      'Hair is washed & blow-dried',
      'Power socket & chair ready',
      'Gate code at security',
      'Bring full mobile kit',
      'Parking available inside yard'
    ];
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
            placeholder="Add details about your service (e.g. hair length, gate note)..."
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
            Add a specialist home service with your price and duration so Harare clients can book you directly.
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

            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main);">Work Photo URL (Optional)</label>
              <input id="newServiceImg" class="dark-input" placeholder="https://... (or leave empty for default)" style="width:100%; margin-top:4px;" />
            </div>

            <button class="btn-primary-blue" onclick="saveNewCatalogueService()" style="margin-top:6px; height:42px;">
              ${uiIcon('check', 16)}
              <span>Add Service to Catalogue</span>
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

            <div>
              <label style="font-size:12px; font-weight:700; color:var(--text-main);">Photo Image URL</label>
              <input id="editServiceImg" class="dark-input" value="${item.imageUrl || ''}" style="width:100%; margin-top:4px;" />
            </div>

            <button class="btn-primary-blue" onclick="saveEditedCatalogueService('${item.id}')" style="margin-top:6px; height:42px;">
              ${uiIcon('check', 16)}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    `;
    return;
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
  try {
    const cat = state.db.categories.find((c) => c.id === state.selectedCategoryId) || state.db.categories[0];
    const sub = (cat.subServices || [])[state.selectedSubServiceIdx] || { name: `${cat.name} Home Service` };

    const btn = document.querySelector('.indrive-find-offers-btn');
    if (btn) {
      btn.style.opacity = '0.75';
      btn.innerHTML = `<span>Broadcasting...</span>`;
    }

    const res = await apiPost('/api/requests', {
      customerId: state.currentUser.id,
      customerName: state.currentUser.name,
      categoryId: cat.id,
      title: sub.name,
      description: state.draftNotes || `Home visit at ${state.customAddress} (${state.entranceNote}).`,
      suburbId: state.selectedSuburbId,
      suburbName: state.customSuburbLabel.split(',')[0],
      exactAddress: `${state.customAddress}, ${state.customSuburbLabel}`,
      lat: state.pinnedLat,
      lng: state.pinnedLng,
      paymentMethod: state.draftPaymentMethod,
      budgetUsd: Number(state.draftFareUsd),
      autoAccept: state.draftAutoAccept
    });

    state.activeRequestId = res.request.id;
    state.pendingSearchFareUsd = Number(res.request.budgetUsd);
    state.isSheetMinimized = false;
    state.isOffersMinimized = false;
    state.screenStep = 'SEARCHING';
    renderAll();
    showToast(`Broadcast live! Waiting for verified specialists to respond.`);
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
    renderAll();
  }
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
    const res = await apiPost('/api/offers/accept', { requestId, offerId });
    state.activeRequestId = res.request.id;
    state.isSheetMinimized = false;
    state.isOffersMinimized = false;
    state.screenStep = 'BOOKED';
    state.providerTab = 'ACTIVE_JOB';
    showToast('Offer accepted! Live route & chat with your pro started.');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function declineOffer(requestId, offerId) {
  try {
    await apiPost('/api/offers/decline', { requestId, offerId, reason: 'DECLINED_BY_USER' });
    await fetchState();
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
  const requestId = state.modalData?.requestId || state.activeRequestId;
  if (!requestId) {
    closeModal();
    return;
  }
  try {
    await apiPost('/api/bookings/cancel', {
      requestId,
      role: state.role,
      actorName: state.currentUser?.name || 'User',
      reason
    });
    state.activeModal = null;
    state.activeRequestId = null;
    state.pendingSearchFareUsd = null;
    state.isSheetMinimized = false;
    state.screenStep = 'HOME';
    state.providerTab = 'FEED';
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openRateBookingModal(requestId) {
  state.ratingStars = 5;
  state.activeModal = 'RATE_BOOKING_MODAL';
  state.modalData = { requestId };
  if (state.role === 'PROVIDER') {
    state.ratingTags = ['Paid Promptly in USD', 'Respectful & Welcoming', 'Home & Power Ready'];
  } else {
    state.ratingTags = ['Punctual Arrival', 'Clean Mobile Kit', 'Professional Work'];
  }
  renderModalLayer();
}

function toggleRatingComplimentTag(tag) {
  if (state.ratingTags.includes(tag)) {
    state.ratingTags = state.ratingTags.filter((t) => t !== tag);
  } else {
    state.ratingTags.push(tag);
  }
  renderModalLayer();
}

async function completeBooking(requestId) {
  try {
    const role = state.role || 'CUSTOMER';
    await apiPost('/api/bookings/status', {
      requestId,
      status: 'COMPLETED',
      ratedByRole: role,
      rating: state.ratingStars || 5,
      reviewText: state.ratingTags.join(', ')
    });
    state.activeModal = null;
    state.activeRequestId = null;
    state.isSheetMinimized = false;
    state.screenStep = 'HOME';
    state.providerTab = 'FEED';
    showToast(role === 'PROVIDER' ? 'Client rated successfully! Great job.' : 'Service rated! Thank you for supporting Harare pros.');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================================
// DRAWER MODE SWITCH & LOGOUT HANDLERS
// ============================================================================
function closeModal() {
  stopFaceCameraStream();
  state.activeModal = null;
  state.modalData = null;
  renderModalLayer();
}

function openSideDrawerModal() {
  state.activeModal = 'DRAWER';
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
  state.activeModal = 'SUBURB_PICKER';
  renderModalLayer();
}

function selectSuburbLocation(suburbId) {
  const s = (state.db.suburbs || []).find((item) => item.id === suburbId);
  if (!s) return;
  state.selectedSuburbId = s.id;
  state.customAddress = s.name;
  state.customSuburbLabel = `${s.name}, Harare`;
  state.pinnedLat = s.lat;
  state.pinnedLng = s.lng;
  if (leafletMap) leafletMap.flyTo([s.lat, s.lng], 15, { duration: 0.6 });
  closeModal();
  renderAll();
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
    mediaStreamRef.getTracks().forEach((t) => t.stop());
    mediaStreamRef = null;
  }
}

// ============================================================================
// INDRIVE-INSPIRED SERVICE PROVIDER MODE (DRIVER / SPECIALIST WORKSPACE)
// ============================================================================
function renderProviderModeOverlay() {
  const prov = state.currentUser || state.db.providers[0];
  const activeJob = getProviderActiveBooking(prov.id);
  const openRequests = (state.db.requests || []).filter((r) => r.status === 'OPEN');
  const myPendingApprovals = (state.db.approvalQueue || []).filter((a) => a.providerId === prov.id && a.status === 'PENDING');

  const currentTab = activeJob && state.providerTab === 'FEED' ? 'ACTIVE_JOB' : state.providerTab;

  return `
    <div class="provider-top-bar">
      <button class="indrive-circle-btn" onclick="openSideDrawerModal()" title="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>

      <button
        class="provider-online-slider ${prov.isOnline !== false ? 'online' : 'offline'}"
        onclick="toggleProviderOnlineStatus()"
      >
        ${prov.isOnline !== false ? uiIcon('dotOnline', 14) : uiIcon('dotOffline', 14)}
        <span>${prov.isOnline !== false ? 'Online' : 'Offline'}</span>
      </button>

      <div style="display:flex; align-items:center; gap:6px;">
        <button class="provider-wallet-pill" onclick="state.providerTab='WALLET'; state.isSheetMinimized=false; renderUiOverlay();" title="Open Prepaid USD Wallet">
          <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('wallet', 15)}</span>
          <span>$${(prov.walletBalanceUsd || 0).toFixed(2)}</span>
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
        <button class="minimized-restore-btn">
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
          <span>2. At Gate (PIN)</span>
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
                ${uiIcon('star', 12)} ${activeJob.customerRating || '5.0'}
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

        <!-- Step-by-Step Provider Execution Controls -->
        ${isEnRoute ? `
          <button class="btn-primary-blue" style="height:44px; font-size:14px;" onclick="providerMarkArrived('${activeJob.id}')">
            ${uiIcon('pin', 16)}
            <span>I Have Arrived at Client's Gate</span>
          </button>
        ` : ''}

        ${(() => {
          const provUser = state.currentUser || state.db.providers[0];
          const distMeters = calculateDistanceMeters(provUser?.lat, provUser?.lng, activeJob.lat, activeJob.lng);
          const isWithin50m = distMeters <= 50 || isArrived;
          const isWithin20m = distMeters <= 20 || isArrived;
          const proximitySec = (state.bookingProximitySeconds && state.bookingProximitySeconds[activeJob.id]) || 0;
          const autoPairRemaining = Math.max(0, 60 - proximitySec);

          if ((!isArrived && !isWithin50m) || isInProgress) return '';
          return `
            <div style="background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:13px; padding:11px 13px; margin-bottom:10px;">
              <div style="font-size:12px; font-weight:800; color:#B45309; margin-bottom:7px; display:flex; align-items:center; gap:6px;">
                <span style="color:#D97706; display:inline-flex;">${uiIcon('shield', 14)}</span>
                <span>You are within 50m of ${activeJob.customerName.split(' ')[0]}! Ask client for their 4-digit Start PIN:</span>
              </div>
              <div style="display:flex; gap:8px;">
                <input
                  id="providerPinInput_${activeJob.id}"
                  class="dark-input"
                  style="font-size:16px; font-weight:800; letter-spacing:4px; text-align:center;"
                  placeholder="• • • •"
                  maxlength="4"
                />
                <button class="btn-primary-blue" style="height:42px; font-size:13px; padding:0 16px;" onclick="providerVerifyStartPin('${activeJob.id}')">
                  ${uiIcon('key', 15)}
                  <span>Verify &amp; Start</span>
                </button>
              </div>
              ${isWithin20m ? `
                <div style="font-size:11.5px; font-weight:700; color:#059669; margin-top:7px; display:flex; align-items:center; gap:5px;">
                  <span style="width:6px; height:6px; border-radius:50%; background:#10B981; display:inline-block;"></span>
                  <span>Within 20m of client • Auto-pairing in <span class="proximity-autopair-timer">${autoPairRemaining}s</span> if PIN not entered</span>
                </div>
              ` : ''}
            </div>
          `;
        })()}

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

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <button class="btn-dark-sec" onclick="startInAppCall('${activeJob.customerName}', '${activeJob.title}')">
          ${uiIcon('phone', 15)}
          <span>Call Client</span>
        </button>
        <button class="btn-dark-sec" onclick="openChatDrawer('${activeJob.id}')">
          ${uiIcon('chat', 15)}
          <span>Chat ${(activeJob.messages && activeJob.messages.length > 0) ? `(${activeJob.messages.length})` : ''}</span>
        </button>
      </div>
      <div style="margin-top:8px;">
        <button class="cancel-request-red-pill" style="justify-content:center; width:100%;" onclick="openCancelTaskModal('${activeJob.id}')">
          ${uiIcon('close', 14)}
          <span>Cancel Job</span>
        </button>
      </div>
    </div>
  `;
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
          style="background:#ECFDF5; border:1.5px solid #10B981; border-radius:14px; padding:10px 13px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;"
        >
          <div style="display:flex; align-items:center; gap:9px;">
            <span style="color:#059669; display:inline-flex;">${uiIcon('routeCar', 18)}</span>
            <div>
              <div style="font-size:12.5px; font-weight:800; color:#059669;">Active Visit with ${activeJob.customerName}</div>
              <div style="font-size:11px; color:#047857;">Tap to open route &amp; live client chat</div>
            </div>
          </div>
          <span style="font-size:12px; font-weight:800; color:#059669; display:inline-flex; align-items:center; gap:3px;">
            <span>Open</span>
            ${uiIcon('chevronRight', 14)}
          </span>
        </div>
      ` : ''}

      ${openRequests.length === 0 ? `
        <div style="text-align:center; padding:28px 14px; color:var(--text-secondary); font-size:13.5px; background:var(--bg-card); border-radius:16px;">
          Radar active — waiting for new client requests in Harare...
        </div>
      ` : openRequests.map((r) => {
        const myExistingOffer = (r.offers || []).find((o) => o.providerId === prov.id);
        return `
          <div class="provider-order-card">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
              <div>
                <span style="font-size:23px; font-weight:800; color:var(--blue-primary);">${formatUsdPrice(r.budgetUsd)}</span>
                <span style="font-size:12px; font-weight:700; color:var(--text-secondary); margin-left:6px;">${r.paymentMethod}</span>
              </div>
              <span style="font-size:11.5px; color:var(--blue-primary); font-weight:800; background:var(--blue-soft); padding:3px 9px; border-radius:99px; display:inline-flex; align-items:center; gap:4px;">
                ${uiIcon('pin', 12)}
                <span>${r.suburbName}</span>
              </span>
            </div>

            <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:2px;">${r.title}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
              ${uiIcon('user', 13)}
              <span>${r.customerName}</span>
              <span style="display:inline-flex; align-items:center; gap:2px;">(${uiIcon('star', 11)} ${r.customerRating || '5.0'})</span>
              <span>• ${r.exactAddress}</span>
            </div>

            ${myExistingOffer ? `
              <div style="background:var(--blue-soft); border:1px solid var(--blue-border); border-radius:12px; padding:8px 11px; display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:var(--blue-primary); display:inline-flex; align-items:center; gap:5px;">
                  ${uiIcon('clock', 13)}
                  <span>Offered ${formatUsdPrice(myExistingOffer.priceUsd)} (120s timer)</span>
                </span>
                <button
                  class="btn-primary-blue"
                  style="width:auto; height:32px; padding:0 11px; font-size:11.5px;"
                  onclick="acceptOffer('${r.id}', '${myExistingOffer.id}')"
                >
                  ${uiIcon('check', 12)}
                  <span>Client Accept</span>
                </button>
              </div>
            ` : ''}

            <div class="provider-bid-grid">
              <button class="btn-primary-blue" style="height:38px; font-size:12.5px;" onclick="providerSubmitBid('${r.id}', ${r.budgetUsd})">
                Accept ${formatUsdPrice(r.budgetUsd)}
              </button>
              <button class="btn-dark-sec" style="padding:7px 6px; font-size:12px;" onclick="providerSubmitBid('${r.id}', ${Number(r.budgetUsd) + 2})">
                ${formatUsdPrice(Number(r.budgetUsd) + 2)}
              </button>
              <button class="btn-dark-sec" style="padding:7px 6px; font-size:12px;" onclick="providerSubmitBid('${r.id}', ${Number(r.budgetUsd) + 3.5})">
                ${formatUsdPrice(Number(r.budgetUsd) + 3.5)}
              </button>
              <button class="btn-dark-sec" style="padding:7px 6px; font-size:12px;" onclick="promptProviderCustomBid('${r.id}', ${r.budgetUsd})">
                Custom $
              </button>
            </div>
          </div>
        `;
      }).join('')}
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

  return `
    <div>
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

      <!-- Compact EcoCash USD Top-Up Card -->
      <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:14px; padding:14px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:13px; font-weight:800; color:var(--text-main);">Top Up via EcoCash USD</div>
          <span style="font-size:10.5px; font-weight:700; color:#059669; background:#ECFDF5; padding:2px 8px; border-radius:99px;">*151# Send USD</span>
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--border-light); border-radius:10px; padding:8px 10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">EcoCash: <strong style="color:var(--blue-primary); font-size:13px;">0713 475 131</strong></span>
          <button class="btn-dark-sec" style="padding:4px 9px; font-size:11px;" onclick="navigator.clipboard?.writeText('0713475131'); showToast('EcoCash number copied!');">
            Copy
          </button>
        </div>

        <div class="wallet-amount-grid" style="margin-bottom:10px;">
          ${quickAmounts.map((amt) => `
            <button
              class="wallet-amt-chip ${Number(state.walletTopupAmount) === amt ? 'active' : ''}"
              onclick="state.walletTopupAmount=${amt}; renderUiOverlay();"
            >
              $${amt}
            </button>
          `).join('')}
        </div>

        <textarea
          id="walletEcocashSmsInput"
          class="dark-input"
          rows="2"
          style="width:100%; font-size:11.5px; line-height:1.4; padding:8px 10px; resize:none; margin-bottom:8px;"
          placeholder="Paste EcoCash confirmation SMS here..."
        ></textarea>

        <button
          class="btn-primary-blue"
          style="width:100%; height:40px; font-size:13px;"
          onclick="submitEcoCashTopup()"
        >
          ${uiIcon('check', 14)}
          <span>Submit $${Number(state.walletTopupAmount || 5).toFixed(2)} Top-Up</span>
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
    showToast('Please paste your EcoCash confirmation SMS', 'error');
    return;
  }
  const amt = Number(state.walletTopupAmount || 5);
  try {
    const res = await apiPost('/api/wallet/ecocash-submit', {
      providerId: prov.id,
      amountUsd: amt,
      confirmationSms: sms
    });
    if (inputEl) inputEl.value = '';
    showToast(`EcoCash SMS submitted (Ref: ${res.submission.referenceCode}). Sent to Admin verification queue.`);
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
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
                  <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80'}" style="width:100%; height:110px; object-fit:cover; display:block;" />
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
  state.activeModal = 'ADD_SERVICE_MODAL';
  state.modalData = {};
  renderModalLayer();
}

function openEditServiceModal(itemId) {
  const prov = state.currentUser || state.db.providers[0];
  const item = (prov.portfolio || []).find((p) => p.id === itemId);
  if (!item) return;
  state.activeModal = 'EDIT_SERVICE_MODAL';
  state.modalData = { item };
  renderModalLayer();
}

async function saveNewCatalogueService() {
  const prov = state.currentUser || state.db.providers[0];
  const title = document.getElementById('newServiceTitle')?.value.trim();
  const price = document.getElementById('newServicePrice')?.value;
  const duration = document.getElementById('newServiceDuration')?.value.trim();
  const tag = document.getElementById('newServiceTag')?.value.trim();
  const img = document.getElementById('newServiceImg')?.value.trim();

  if (!title) {
    showToast('Please enter a service title', 'error');
    return;
  }
  if (!price || Number(price) <= 0) {
    showToast('Please enter a valid price in USD', 'error');
    return;
  }

  try {
    await apiPost('/api/providers/catalogue/add-direct', {
      providerId: prov.id,
      title,
      priceUsd: Number(price),
      duration: duration || '2 hrs',
      tag: tag || 'Verified Quality',
      imageUrl: img || null
    });
    closeModal();
    showToast('Service added to catalogue successfully!');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveEditedCatalogueService(itemId) {
  const prov = state.currentUser || state.db.providers[0];
  const title = document.getElementById('editServiceTitle')?.value.trim();
  const price = document.getElementById('editServicePrice')?.value;
  const duration = document.getElementById('editServiceDuration')?.value.trim();
  const tag = document.getElementById('editServiceTag')?.value.trim();
  const img = document.getElementById('editServiceImg')?.value.trim();

  if (!title) {
    showToast('Please enter a service title', 'error');
    return;
  }
  if (!price || Number(price) <= 0) {
    showToast('Please enter a valid price in USD', 'error');
    return;
  }

  try {
    await apiPost('/api/providers/catalogue/edit', {
      providerId: prov.id,
      itemId,
      title,
      priceUsd: Number(price),
      duration: duration || '2 hrs',
      tag: tag || 'Verified Quality',
      imageUrl: img || null
    });
    closeModal();
    showToast('Service details updated successfully!');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
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
    await apiPost('/api/bookings/status', {
      requestId,
      status: 'ARRIVED'
    });
    showToast('Client notified that you have arrived outside their gate!');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function providerVerifyStartPin(requestId) {
  const input = document.getElementById(`providerPinInput_${requestId}`);
  const pinCode = input ? input.value.trim() : '';
  try {
    await apiPost('/api/bookings/verify-pin', {
      requestId,
      pinCode
    });
    showToast('Start PIN verified! Service is now in progress.');
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function promptProviderCustomBid(requestId, baseUsd) {
  const val = prompt('Enter your counter-offer in USD ($):', String(Number(baseUsd) + 5));
  if (val && !isNaN(Number(val))) {
    providerSubmitBid(requestId, Number(val));
  }
}

async function topUpProviderWallet(amountUsd, method) {
  const prov = state.currentUser || state.db.providers[0];
  try {
    await apiPost('/api/wallet/topup', {
      providerId: prov.id,
      amountUsd,
      method
    });
    showToast(`+$${Number(amountUsd).toFixed(2)} added to your Findit USD Wallet via ${method}`);
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleProviderOnlineStatus() {
  const prov = state.currentUser || state.db.providers[0];
  try {
    const res = await apiPost('/api/providers/online', {
      providerId: prov.id,
      isOnline: !(prov.isOnline !== false)
    });
    state.currentUser = res.provider;
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function providerSubmitBid(requestId, priceUsd) {
  const prov = state.currentUser || state.db.providers[0];
  try {
    await apiPost('/api/offers', {
      requestId,
      providerId: prov.id,
      priceUsd: Number(priceUsd)
    });
    showToast(`Offered ${formatUsdPrice(priceUsd)} — Client notified (120s timer)`);
    await fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openUploadCatalogueModal() {
  state.uploadedFileDataUrl = null;
  state.uploadedFileName = '';
  state.uploadSuspectedWatermark = false;
  state.activeModal = 'UPLOAD_CATALOGUE';
  renderModalLayer();
}

function handleRealPortfolioFileSelect(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  state.uploadedFileName = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.uploadedFileDataUrl = e.target.result;
    renderModalLayer();
  };
  reader.readAsDataURL(file);
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
    await apiPost('/api/providers/catalogue', {
      providerId: prov.id,
      title,
      priceUsd,
      hasSuspectedWatermarkOrFlyer: Boolean(state.uploadSuspectedWatermark),
      imageUrl: state.uploadedFileDataUrl
    });
    closeModal();
    showToast('Photo submitted for Admin approval');
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

  let peerName = 'Service Provider';
  let peerAvatar = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80';
  let peerSubtitle = 'Online • Verified Pro';

  if (state.role === 'PROVIDER') {
    peerName = req?.customerName || 'Client';
    peerAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
    peerSubtitle = 'Client • Home Visit';
  } else {
    const provId = req?.acceptedProviderId || req?.offers?.[0]?.providerId || state.activeChatProviderId;
    const prov = state.db.providers.find((p) => p.id === provId) || state.db.providers[0];
    if (prov) {
      peerName = prov.name;
      peerAvatar = prov.avatarUrl;
      peerSubtitle = `${prov.skillTier || 'Platinum Pro'} • ${prov.rating || '4.9'} ★`;
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

  root.innerHTML = `
    <div class="fullscreen-chat-backdrop" onclick="closeChatDrawer()">
      <div class="fullscreen-chat-modal" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="fullscreen-chat-header">
          <button class="fullscreen-chat-close-btn" onclick="closeChatDrawer()" title="Back to Map">
            ${uiIcon('chevronLeft', 20)}
          </button>

          <div class="fullscreen-chat-peer">
            <img src="${peerAvatar}" alt="${escapeHtml(peerName)}" class="fullscreen-chat-avatar" />
            <div class="fullscreen-chat-peer-info">
              <div class="fullscreen-chat-peer-name">${escapeHtml(peerName)}</div>
              <div class="fullscreen-chat-peer-status">
                <span style="width:7px; height:7px; border-radius:50%; background:#10B981; display:inline-block;"></span>
                <span>${escapeHtml(peerSubtitle)}</span>
              </div>
            </div>
          </div>

          <div class="fullscreen-chat-header-actions">
            <button class="fullscreen-chat-call-btn" onclick="startInAppCall('${peerName.replace(/'/g, "\\'")}', '${(req?.title || 'Home Visit').replace(/'/g, "\\'")}')" title="Call ${escapeHtml(peerName)}">
              ${uiIcon('phone', 17)}
            </button>
            <button class="fullscreen-chat-close-btn" onclick="closeChatDrawer()" title="Close Chat">
              ${uiIcon('close', 18)}
            </button>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="fullscreen-chat-security-bar">
          <span style="color:var(--blue-primary); display:inline-flex;">${uiIcon('lock', 12)}</span>
          <span>In-app protected chat. Phone numbers &amp; WhatsApp links are blocked for safety.</span>
        </div>

        <!-- Scrollable Messages Feed -->
        <div class="fullscreen-chat-feed" id="fullScreenChatFeed">
          ${renderChatMessagesHtml(messages)}
        </div>

        <!-- Footer: Preset quick replies & Input -->
        <div class="fullscreen-chat-footer">
          <div class="chat-quick-strip">
            ${quickList.map((q) => `
              <button class="chat-preset-chip" onclick="sendChatMessage('${q.replace(/'/g, "\\'")}', '${req?.id || ''}')">
                ${q}
              </button>
            `).join('')}
          </div>

          <div class="chat-inline-input-row">
            <input
              id="chatTextInput"
              class="dark-input"
              style="font-size:13.5px; padding:11px 14px;"
              placeholder="Type message (phone numbers blocked)..."
              onkeydown="if(event.key==='Enter') sendCustomChat('${req?.id || ''}')"
            />
            <button
              class="btn-primary-blue"
              style="width:50px; height:44px; padding:0; flex-shrink:0; border-radius:14px; display:inline-flex; align-items:center; justify-content:center;"
              onclick="sendCustomChat('${req?.id || ''}')"
              title="Send"
            >
              ${uiIcon('send', 17)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderChatMessagesHtml(messages) {
  if (!messages || messages.length === 0) {
    return `
      <div style="text-align:center; padding:36px 20px; color:var(--text-secondary); margin:auto 0;">
        <div style="width:48px; height:48px; border-radius:50%; background:var(--blue-soft); color:var(--blue-primary); display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;">
          ${uiIcon('chat', 24)}
        </div>
        <div style="font-size:14px; font-weight:800; color:var(--text-main); margin-bottom:4px;">In-App Encrypted Chat</div>
        <div style="font-size:12.5px; max-width:280px; margin:0 auto; line-height:1.4;">
          Chat with each other to coordinate your home visit. Direct contacts are masked.
        </div>
      </div>
    `;
  }

  return messages.map((m) => {
    const isSystem = m.senderRole === 'SYSTEM';
    const isMine = !isSystem && m.senderRole === state.role;
    const rowClass = isSystem ? 'system' : isMine ? 'mine' : 'theirs';
    return `
      <div class="chat-msg-row ${rowClass}">
        ${!isSystem ? `<div class="chat-msg-sender">${isMine ? 'You' : escapeHtml(m.senderName)}</div>` : ''}
        <div class="chat-msg-bubble">${escapeHtml(m.text)}</div>
      </div>
    `;
  }).join('');
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

function sendChatMessage(text, requestId = null) {
  if (!text || !text.trim()) return;
  const cleanText = text.trim();

  const targetReqId = requestId || state.activeChatRequestId;
  const fallbackReq = state.role === 'PROVIDER'
    ? getProviderActiveBooking(state.currentUser?.id)
    : getCustomerActiveRequest();
  const targetReq = (state.db?.requests || []).find((r) => r.id === (targetReqId || fallbackReq?.id)) || fallbackReq || (state.db?.requests || [])[0];
  if (!targetReq) return;

  const senderName = state.currentUser?.name || (state.role === 'PROVIDER' ? 'Service Provider' : 'Client');
  const tempMsgId = 'msg_' + Date.now();
  const tempMsg = {
    id: tempMsgId,
    senderRole: state.role,
    senderName: senderName,
    text: cleanText,
    createdAt: new Date().toISOString()
  };

  // Immediate 0ms local append
  if (!targetReq.messages) targetReq.messages = [];
  targetReq.messages.push(tempMsg);

  // Clear inputs immediately
  const input = document.getElementById('chatTextInput');
  if (input) input.value = '';
  const inlineInput = document.getElementById(`inlineChatInput_${targetReq.id}`);
  if (inlineInput) inlineInput.value = '';

  // Update DOM immediately with no lag
  updateChatFeedDomOnly(targetReq);

  // Send to backend asynchronously
  apiPost('/api/messages', {
    requestId: targetReq.id,
    senderRole: state.role,
    senderName: senderName,
    text: cleanText
  }).then((res) => {
    if (res && res.message && res.message.id) {
      tempMsg.id = res.message.id;
    }
  }).catch((err) => {
    // Only drop if anti-leakage shield actively blocked it
    if (err.message && err.message.includes('Shield')) {
      targetReq.messages = targetReq.messages.filter((m) => m.id !== tempMsgId);
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

let agoraClient = null;
let localAudioTrack = null;
let isAudioMuted = false;

async function startInAppCall(peerName, contextTitle, channelId = 'findit_harare_call') {
  state.activeCall = { peerName, contextTitle, channelId, isMuted: false };
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

  // Initialize real Agora RTC voice session if AgoraRTC is loaded
  try {
    if (window.AgoraRTC) {
      agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });
      const appId = state.db?.config?.agoraAppId || '645ba1db83884888b288953d1fd3c533';
      const cleanChannel = (channelId || 'harare_call').replace(/[^a-zA-Z0-9_-]/g, '_');
      let rtcToken = null;
      try {
        const tokenRes = await apiGet(`/api/agora/token?channel=${encodeURIComponent(cleanChannel)}&uid=0`);
        if (tokenRes && tokenRes.token) {
          rtcToken = tokenRes.token;
        }
      } catch (tokenErr) {
        console.warn('Agora token generation note:', tokenErr.message);
      }
      await agoraClient.join(appId, cleanChannel, rtcToken, 0);
      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await agoraClient.publish([localAudioTrack]);
      showToast('Agora Voice connected (encrypted)');
    }
  } catch (err) {
    console.log('Agora RTC Voice notice:', err.message);
  }
}

async function toggleCallMute() {
  if (localAudioTrack) {
    isAudioMuted = !isAudioMuted;
    await localAudioTrack.setMuted(isAudioMuted);
    if (state.activeCall) state.activeCall.isMuted = isAudioMuted;
    renderCallModal();
    showToast(isAudioMuted ? 'Microphone muted' : 'Microphone unmuted');
  }
}

async function endInAppCall() {
  if (callInterval) clearInterval(callInterval);
  try {
    if (localAudioTrack) {
      localAudioTrack.close();
      localAudioTrack = null;
    }
    if (agoraClient) {
      await agoraClient.leave();
      agoraClient = null;
    }
  } catch (e) {}
  state.activeCall = null;
  renderCallModal();
}

function renderCallModal() {
  const root = document.getElementById('callModalRoot');
  if (!root) return;
  if (!state.activeCall) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="indrive-modal-sheet" style="text-align:center; padding:32px 20px;">
        <div style="font-size:11.5px; color:var(--blue-primary); font-weight:800; text-transform:uppercase; letter-spacing:0.06em; display:inline-flex; align-items:center; gap:6px;">
          ${uiIcon('lock', 14)}
          <span>Findit Masked Agora Voice Call</span>
        </div>
        <div style="font-size:23px; font-weight:800; margin-top:10px;">${state.activeCall.peerName}</div>
        <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">${state.activeCall.contextTitle}</div>
        <div id="callTimerText" style="font-size:32px; font-weight:800; color:var(--blue-primary); margin:24px 0;">00:00</div>

        <div style="display:flex; justify-content:center; align-items:center; gap:14px;">
          <button
            type="button"
            class="btn-dark-sec"
            style="width:48px; height:48px; border-radius:50%; padding:0; display:inline-flex; align-items:center; justify-content:center;"
            onclick="toggleCallMute()"
            title="Mute / Unmute"
          >
            ${state.activeCall.isMuted ? uiIcon('close', 20) : uiIcon('phone', 20)}
          </button>
          <button class="cancel-request-red-pill" style="padding:0 28px; height:48px; font-size:15px;" onclick="endInAppCall()">
            ${uiIcon('phone', 16)}
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
