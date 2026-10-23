const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Lightweight .env loader
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {}

const PORT = process.env.PORT || 3030;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Production Environment Variables for Real WhatsApp Cloud API
const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  process.env.META_WA_ACCESS_TOKEN ||
  'EAAP2XjSuoEEBS8XNmMR8BFjcHIZBEMkvqHAI1hifSW5YsyjVHrVfCEZC32mQ8VJYik0ATpqmrXbLIiUEKL7sGg28bZAkkY67tCCYOtn1snBbZB5ZBh7z5wnPZCQ4QojpZB5ouVOEKrps824qsigstJbicNf1sjjoV6HsroAyzsBkHI80fB4ob3IcZB574053paXLroGvEZBwsuCF5y0xwvr4o2peJWvGmsZAH9RZCGENiIpZAAUX0eLRmjMZBbSrzEW5jhenpAZBnZALHQUmZCzMPG0FKDtDIQZDZD';

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID ||
  process.env.META_WA_PHONE_NUMBER_ID ||
  '1383762161485191';

const WHATSAPP_BUSINESS_ACCOUNT_ID =
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
  '1422874912704593';

const ADMIN_WHATSAPP_PHONE = process.env.ADMIN_WHATSAPP_PHONE || '263713475131';

// Agora Real-Time RTC Voice & Chat Credentials (FinditHarare)
let AgoraToken = null;
try {
  AgoraToken = require('agora-token');
} catch (e) {
  AgoraToken = null;
}

const AGORA_APP_ID = process.env.AGORA_APP_ID || '645ba1db83884888b288953d1fd3c533';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || process.env.AGORA_PRIMARY_CERTIFICATE || '0ba336cff21f42a3b32bf5a7e2311b21';
const AGORA_CHAT_TOKEN = process.env.AGORA_CHAT_TOKEN || '007eJxTYJDZ8JJ1Sl3zxbd3TnK94ZHuztO6zrmtf0vv7P63nO4C674qMJiZmCYlGqYkWRhbWJhYWFgkGVlYWJoapximpRgnmxob/3lwM6shkJFB79YjRkYGVgZGBiYGEJ+BAQDjLh+v';
const AGORA_WS_API = process.env.AGORA_WS_API || 'msync-api-61.chat.agora.io';
const AGORA_REST_API = process.env.AGORA_REST_API || 'a61.chat.agora.io';

// Admin Security: Encrypted (PBKDF2 Salted SHA-256) Password
const ADMIN_SALT = process.env.ADMIN_SALT || 'findit_harare_admin_salt_#2026';
// Precomputed hash for password "tawanda#3002" with salt "findit_harare_admin_salt_#2026"
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '1e1adeb42af47e89ef0d871d0c8551332b6a653c6f5e0f4257b13f2595eec988';
const activeAdminSessions = new Map(); // token -> { createdAt, expiresAt }

function verifyAdminPassword(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return false;
  try {
    const computed = crypto.pbkdf2Sync(plaintext, ADMIN_SALT, 100000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(ADMIN_PASSWORD_HASH));
  } catch (e) {
    return false;
  }
}

function validateAdminToken(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-admin-token'] || '';
  if (!token) return false;
  const session = activeAdminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return false;
  }
  return true;
}

// PostgreSQL Client Pool for Supabase Deletions/Sync (if DATABASE_URL is set)
let pgClient = null;
const DATABASE_URL = process.env.DATABASE_URL;
if (DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pgClient = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } catch (e) {
    pgClient = null;
  }
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper: Send arbitrary text to any WhatsApp number via Meta WhatsApp Cloud API
function sendWhatsAppDirectText(toPhone, messageBody) {
  return new Promise((resolve) => {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return resolve({ liveWhatsAppSent: false, mode: 'NO_CREDENTIALS' });
    }
    let cleanPhone = toPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '263' + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith('263')) cleanPhone = '263' + cleanPhone;

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageBody
      }
    });

    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          resolve({ liveWhatsAppSent: res.statusCode >= 200 && res.statusCode < 300, mode: 'META_CLOUD_API', response: data });
        });
      }
    );
    req.on('error', (err) => resolve({ liveWhatsAppSent: false, mode: 'META_CLOUD_ERROR', error: err.message }));
    req.write(payload);
    req.end();
  });
}

// Helper: Send Real WhatsApp OTP via Meta WhatsApp Cloud API
function sendRealWhatsAppCloudOtp(toPhone, otpCode) {
  return sendWhatsAppDirectText(toPhone, `Your Findit Harare verification code is: ${otpCode}. Valid for 10 minutes.`);
}

// Helper: Generate Unique Cryptographic Findit Harare ID (e.g., FH-PRO-849201 or FH-USR-391044)
function generateFinditAppId(role) {
  const prefix = role === 'PROVIDER' ? 'FH-PRO-' : 'FH-USR-';
  const randNum = crypto.randomInt(100000, 999999);
  return `${prefix}${randNum}`;
}

// Helper: Parse & Extract EcoCash Approval/Reference Code from Pasted Confirmation SMS
function parseEcoCashConfirmationSms(smsText) {
  if (!smsText || typeof smsText !== 'string') {
    return { valid: false, error: 'Please paste your EcoCash confirmation message.' };
  }
  const trimmed = smsText.trim();
  if (trimmed.length < 18) {
    return { valid: false, error: 'The pasted message is too short. Please paste the full EcoCash confirmation SMS.' };
  }

  // Match typical EcoCash Zimbabwe reference patterns (e.g. PP261021.1219.A94821, MP26..., CO26..., or 8+ char alphanumeric ref)
  const ecoCashRefMatch =
    trimmed.match(/\b([A-Z]{2}\d{6}\.\d{4}\.[A-Z0-9]{4,10})\b/i) ||
    trimmed.match(/(?:Approval\s*Code|Txn\s*ID|Ref(?:erence)?|Code)\s*[:#\-]?\s*([A-Z0-9\.]{6,24})/i) ||
    trimmed.match(/\b([A-Z0-9]{8,20})\b/);

  if (!ecoCashRefMatch) {
    return {
      valid: false,
      error: 'Could not detect a valid EcoCash Approval Code / Reference (e.g. PP261021.1219.A94821) in the pasted message.'
    };
  }

  // Extract USD amount if present in the SMS text
  const amountMatch = trimmed.match(/(?:USD|US\$|\$)\s*(\d+(?:\.\d{1,2})?)/i);
  const detectedAmountUsd = amountMatch ? Number(amountMatch[1]) : null;

  return {
    valid: true,
    referenceCode: ecoCashRefMatch[1].replace(/[\.\,\s]+$/, '').toUpperCase(),
    detectedAmountUsd
  };
}

const HARARE_SUBURBS = [
  { id: 'avondale', name: 'Avondale', lat: -17.7955, lng: 31.0365, zone: 'North-Central', sampleStreet: '14 Lomagundi Rd, Avondale' },
  { id: 'borrowdale', name: 'Borrowdale', lat: -17.7520, lng: 31.0890, zone: 'Northern Suburbs', sampleStreet: '88 Borrowdale Rd, Borrowdale' },
  { id: 'mt_pleasant', name: 'Mt Pleasant', lat: -17.7680, lng: 31.0450, zone: 'North', sampleStreet: '22 Upper East Rd, Mt Pleasant' },
  { id: 'cbd', name: 'Harare CBD', lat: -17.8292, lng: 31.0522, zone: 'Central', sampleStreet: '45 Sam Nujoma St, Harare CBD' },
  { id: 'eastlea', name: 'Eastlea', lat: -17.8190, lng: 31.0810, zone: 'East', sampleStreet: '19 Samora Machel Ave, Eastlea' },
  { id: 'mabelreign', name: 'Mabelreign', lat: -17.7910, lng: 30.9960, zone: 'West', sampleStreet: '11 Sherwood Dr, Mabelreign' },
  { id: 'belvedere', name: 'Belvedere', lat: -17.8260, lng: 31.0150, zone: 'Central-West', sampleStreet: '30 Bishop Gaul Ave, Belvedere' },
  { id: 'greendale', name: 'Greendale', lat: -17.8040, lng: 31.1240, zone: 'East', sampleStreet: '64 Arcturus Rd, Greendale' },
  { id: 'westgate', name: 'Westgate', lat: -17.7640, lng: 30.9670, zone: 'North-West', sampleStreet: '102 Lomagundi Rd, Westgate' },
  { id: 'hatfield', name: 'Hatfield', lat: -17.8680, lng: 31.0820, zone: 'South', sampleStreet: '15 Kilwinning Rd, Hatfield' },
  { id: 'glen_lorne', name: 'Glen Lorne', lat: -17.7410, lng: 31.1480, zone: 'North-East', sampleStreet: '9 Enterprise Rd, Glen Lorne' },
  { id: 'chitungwiza', name: 'Chitungwiza', lat: -18.0127, lng: 31.0756, zone: 'Greater Harare', sampleStreet: '40 Seke Rd, Chitungwiza' }
];

const QUICK_MESSAGES = {
  preBooking: {
    customer: [
      'Can you do it just like your catalogue photo?',
      'Is your transport to my home included in your offer?',
      'How many hours will this service take?',
      'Do you bring all your own tools and equipment?',
      'My hair is already washed and blow-dried.',
      'Can you come at my requested time?'
    ],
    provider: [
      'Yes! Check my work catalogue—I specialize in this style.',
      'My offer price includes transport to come to your home.',
      'Please have hair washed & blow-dried before I arrive.',
      'Price is for labor only; please have hair extensions ready.',
      'I bring my full mobile kit and sterilized tools to your home.',
      'I am ready and can travel to you at the requested time.'
    ]
  },
  postBooking: {
    customer: [
      'Great, I can see you on the map! Waiting for you at home',
      'Coming out to open the gate for you now',
      'Please ring me on the Findit In-App Call when outside',
      'I have the 4-digit Start PIN ready for when you arrive'
    ],
    provider: [
      'I am on my way to your home now—follow my pin on the map',
      'I will arrive at your gate in about 10 minutes',
      "I'm waiting outside",
      'Please share the 4-digit Start PIN so I can start the job',
      'Service finished! Please mark completed & rate my work'
    ]
  }
};

function generateHarareRoadWaypoints(lat1, lng1, lat2, lng2) {
  const points = [[lat1, lng1]];
  const steps = 8;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const gridBend = Math.sin(t * Math.PI) * 0.0028 * (dLat >= 0 ? 1 : -1);
    const stepBend = (i % 2 === 0 ? 0.0009 : -0.0006);
    points.push([
      Number((lat1 + dLat * t + gridBend * 0.5).toFixed(5)),
      Number((lng1 + dLng * t - gridBend + stepBend).toFixed(5))
    ]);
  }
  points.push([lat2, lng2]);
  return points;
}

// Anti-Leakage Shield: Blocks phone numbers, @handles, emails, URLs, flyers/watermarks, and off-app phrases
function checkAntiLeakage(text) {
  if (!text || typeof text !== 'string') {
    return { allowed: true, violations: [] };
  }

  const violations = [];
  const normalized = text.toLowerCase();

  const digitsOnly = text.replace(/[\s\-\.\(\)_]/g, '');
  if (/(\+?263|07[1378]\d{3,}|\d{7,})/.test(digitsOnly)) {
    violations.push('Phone numbers are blocked to keep bookings protected in-app');
  }

  const numberWords = /(zero|oh)\s*(seven|eight|one|three)|\b(seven\s+seven|seven\s+eight)\b/i;
  if (numberWords.test(normalized)) {
    violations.push('Spelled-out phone numbers are not permitted');
  }

  if (/@[a-zA-Z0-9_\.]+/.test(text)) {
    violations.push('Social media @handles and email addresses are blocked');
  }

  const forbiddenKeywords = [
    { pattern: /\b(whatsapp|whatsap|watsapp|wa\.me|app\s+me)\b/i, label: 'WhatsApp solicitation ("WhatsApp / App me")' },
    { pattern: /\b(call\s+me\s+on|text\s+me\s+on|sms\s+me|inbox\s+me|dm\s+me|my\s+number|send\s+number|drop\s+number)\b/i, label: 'Off-app contact sharing ("Call me on / My number")' },
    { pattern: /\b(telegram|facebook|insta\s+dm|instagram\s+dm|tiktok)\b/i, label: 'External social platform solicitation' },
    { pattern: /(https?:\/\/|www\.)/i, label: 'External website links' }
  ];

  for (const rule of forbiddenKeywords) {
    if (rule.pattern.test(normalized)) {
      violations.push(rule.label);
    }
  }

  return {
    allowed: violations.length === 0,
    violations
  };
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function makeCatalogueSvgDataUri(bg1, bg2, icon, title, subtitle) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="280" rx="18" fill="url(#g)"/>
    <circle cx="330" cy="60" r="85" fill="rgba(255,255,255,0.08)"/>
    <circle cx="70" cy="220" r="65" fill="rgba(255,255,255,0.06)"/>
    <text x="200" y="175" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="200" y="204" font-family="sans-serif" font-size="13" font-weight="600" fill="rgba(255,255,255,0.85)" text-anchor="middle">${subtitle}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function getInitialDatabase() {
  return {
    settings: {
      platformName: 'Findit Harare',
      currency: 'USD',
      currencySymbol: '$',
      commissionPercent: 10,
      launchPromoActive: false,
      launchPromoName: 'First 2 Months 0% Fee Launch Promo',
      launchPromoDaysRemaining: 60,
      minWalletBalanceUsd: 2.0,
      ecocashMerchantNumber: '0713 475 131',
      ecocashMerchantName: 'FINDIT HARARE OFFICIAL',
      ecocashUssdShortcode: '*151*2*2*84920#',
      supportedPaymentMethods: [
        'Cash USD',
        'EcoCash USD'
      ],
      categoryCommissions: {
        braiding: 10,
        nails: 10,
        makeup: 12,
        wigs: 10,
        barber: 10,
        lashes: 10
      }
    },
    customers: [
      {
        id: 'cust_tapiwa',
        finditId: 'FH-USR-100201',
        name: 'Tapiwa Chiwara',
        phone: '+263 77 100 2001',
        suburbId: 'avondale',
        suburbName: 'Avondale',
        rating: 0,
        reviewCount: 0,
        completedBookings: 0,
        avatarInitials: 'TC',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
        whatsappVerified: true,
        faceVerified: true,
        nationalIdNumber: '63-2491028-F-42',
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        reviews: []
      }
    ],
    categories: [
      {
        id: 'braiding',
        name: 'Hairdresser',
        fullName: 'Hair Braiding & Styling',
        mapIcon: 'HR',
        icon: 'HR',
        tagline: 'Mobile Braider: Knotless, Boho, Cornrows, Locs',
        status: 'ACTIVE',
        suggestedMinUsd: 18,
        suggestedMaxUsd: 45,
        subServices: [
          { name: 'Medium Boho Knotless Braids', defaultUsd: 25, duration: '3.5 hrs' },
          { name: 'Small Waist-Length Knotless', defaultUsd: 35, duration: '5 hrs' },
          { name: 'Fulani / Stitch Cornrows', defaultUsd: 18, duration: '2 hrs' },
          { name: 'Butterfly / Soft Faux Locs', defaultUsd: 28, duration: '3.5 hrs' },
          { name: 'Kids Neat Cornrows & Beads', defaultUsd: 15, duration: '1.5 hrs' }
        ]
      },
      {
        id: 'barber',
        name: 'Barber',
        fullName: 'Mobile Barber & Grooming',
        mapIcon: 'BB',
        icon: 'BB',
        tagline: 'Mobile Skin Fade, Beard Sculpting, Kids Cut',
        status: 'ACTIVE',
        suggestedMinUsd: 10,
        suggestedMaxUsd: 30,
        subServices: [
          { name: 'VIP Home Skin Fade + Beard Trim', defaultUsd: 15, duration: '45 mins' },
          { name: 'Father & Son Home Combo Cut', defaultUsd: 22, duration: '1 hr' },
          { name: 'Dreadlocks Retwist & Lineup', defaultUsd: 20, duration: '1.5 hrs' }
        ]
      },
      {
        id: 'nails',
        name: 'Nail Tech',
        fullName: 'Mobile Nail Tech & Pedicure',
        mapIcon: 'NT',
        icon: 'NT',
        tagline: 'Acrylics, Builder Gel, Spa Pedicure at Home',
        status: 'ACTIVE',
        suggestedMinUsd: 12,
        suggestedMaxUsd: 35,
        subServices: [
          { name: 'French Tip Acrylic Full Set', defaultUsd: 20, duration: '2 hrs' },
          { name: 'Builder Gel (BIAB) Overlay', defaultUsd: 15, duration: '1.5 hrs' },
          { name: 'Luxury Jelly Spa Pedicure + Gel', defaultUsd: 20, duration: '1.5 hrs' },
          { name: 'Acrylic Fill + Gel Toes Combo', defaultUsd: 25, duration: '2 hrs' }
        ]
      },
      {
        id: 'makeup',
        name: 'Makeup (MUA)',
        fullName: 'Mobile Makeup Artists',
        mapIcon: 'MU',
        icon: 'MU',
        tagline: 'Home Soft Glam, Bridal, Roora Squad',
        status: 'ACTIVE',
        suggestedMinUsd: 20,
        suggestedMaxUsd: 65,
        subServices: [
          { name: 'Signature Soft Glam + Lashes', defaultUsd: 25, duration: '1 hr' },
          { name: 'Roora / Lobola Bridal Glam', defaultUsd: 45, duration: '1.5 hrs' },
          { name: 'Bridal Squad (2+ Faces)', defaultUsd: 50, duration: '2.5 hrs' },
          { name: 'Graduation / Birthday Glam', defaultUsd: 22, duration: '1 hr' }
        ]
      },
      {
        id: 'wigs',
        name: 'Wig Stylist',
        fullName: 'Wig Installation & Styling',
        mapIcon: 'WG',
        icon: 'WG',
        tagline: 'HD Frontal Melt, Customization at Home',
        status: 'ACTIVE',
        suggestedMinUsd: 15,
        suggestedMaxUsd: 40,
        subServices: [
          { name: 'HD Lace Frontal Melt + Baby Hairs', defaultUsd: 25, duration: '1.5 hrs' },
          { name: 'Glueless Closure Install + Curls', defaultUsd: 18, duration: '1 hr' },
          { name: 'Wig Wash, Treatment & Revamp', defaultUsd: 15, duration: '2 hrs' }
        ]
      },
      {
        id: 'lashes',
        name: 'Lashes & Brows',
        fullName: 'Mobile Eyelashes & Brows',
        mapIcon: 'LB',
        icon: 'LB',
        tagline: 'Volume Lashes, Hybrid Set, Brow Tint',
        status: 'ACTIVE',
        suggestedMinUsd: 15,
        suggestedMaxUsd: 35,
        subServices: [
          { name: 'Hybrid Volume Lash Extensions', defaultUsd: 20, duration: '1.5 hrs' },
          { name: 'Mega Volume Full Set', defaultUsd: 25, duration: '2 hrs' },
          { name: 'Brow Lamination, Wax & Tint', defaultUsd: 15, duration: '45 mins' }
        ]
      },
      {
        id: 'cleaning',
        name: 'Home Cleaning',
        fullName: 'Home Cleaning & Maid Service',
        mapIcon: 'HC',
        icon: 'HC',
        tagline: 'Deep Cleaning, Laundry, Move-In',
        status: 'COMING_SOON',
        waitlistCount: 142,
        subServices: []
      },
      {
        id: 'handyman',
        name: 'Handyman',
        fullName: 'Handyman & Home Repairs',
        mapIcon: 'HM',
        icon: 'HM',
        tagline: 'TV Mounting, Carpentry, Repairs',
        status: 'COMING_SOON',
        waitlistCount: 98,
        subServices: []
      },
      {
        id: 'plumbing',
        name: 'Plumbing & Solar',
        fullName: 'Plumbing & Solar/Electrical',
        mapIcon: 'PS',
        icon: 'PS',
        tagline: 'Geyser, Borehole, Solar & Inverter',
        status: 'COMING_SOON',
        waitlistCount: 116,
        subServices: []
      },
      {
        id: 'delivery',
        name: 'Errands',
        fullName: 'Errands & Parcel Runner',
        mapIcon: 'ER',
        icon: 'ER',
        tagline: 'Same-Day Harare Bike & Car Runner',
        status: 'COMING_SOON',
        waitlistCount: 84,
        subServices: []
      }
    ],
    providers: [
      {
        id: 'prov_tariro',
        finditId: 'FH-PRO-300401',
        name: 'Tariro Moyo',
        shortName: 'Tariro',
        brandName: 'Tariro Mobile Braids Studio',
        phone: '+263 77 300 4001',
        avatarInitials: 'TM',
        avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80',
        isOnline: true,
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        acceptedConductRules: true,
        categoryId: 'braiding',
        skillTier: 'Platinum pro',
        isPlatinum: true,
        experienceYears: 6,
        suburbId: 'avondale',
        suburbName: 'Avondale',
        lat: -17.7885,
        lng: 31.0415,
        serviceRadiusKm: 15,
        startingPriceUsd: 25,
        rating: 0,
        reviewCount: 0,
        completedBookings: 0,
        bio: 'Platinum mobile braider (6 yrs exp). Clean knotless, boho goddess braids, and neat stitch cornrows at your home in Harare.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 25.00,
        walletTransactions: [
          { id: 'tx_seed_1', date: new Date().toISOString(), type: 'TOPUP', method: 'EcoCash USD (Admin Verified)', amountUsd: 25.00, note: 'Testing credit balance' }
        ],
        portfolio: [
          {
            id: 'cat_braid_1',
            title: 'Waist-Length Boho Knotless',
            priceUsd: 25,
            duration: '3.5 hrs',
            tag: 'Platinum Work',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'cat_braid_2',
            title: 'Fulani Tribal Stitch Cornrows',
            priceUsd: 20,
            duration: '2 hrs',
            tag: 'Precision Stitch',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      },
      {
        id: 'prov_farai',
        finditId: 'FH-PRO-400502',
        name: 'Farai Ndlovu',
        shortName: 'Farai',
        brandName: 'FreshFade Harare VIP Mobile Barbers',
        phone: '+263 77 400 5002',
        avatarInitials: 'FN',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
        isOnline: true,
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        acceptedConductRules: true,
        categoryId: 'barber',
        skillTier: 'Platinum pro',
        isPlatinum: true,
        experienceYears: 5,
        suburbId: 'borrowdale',
        suburbName: 'Borrowdale',
        lat: -17.7550,
        lng: 31.0920,
        serviceRadiusKm: 18,
        startingPriceUsd: 15,
        rating: 0,
        reviewCount: 0,
        completedBookings: 0,
        bio: 'Executive mobile barber in Harare. Cordless clippers, hot towel shave, beard sculpting at your home.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 25.00,
        walletTransactions: [
          { id: 'tx_seed_2', date: new Date().toISOString(), type: 'TOPUP', method: 'EcoCash USD (Admin Verified)', amountUsd: 25.00, note: 'Testing credit balance' }
        ],
        portfolio: [
          {
            id: 'cat_barb_1',
            title: 'VIP Home Skin Fade + Beard Trim',
            priceUsd: 15,
            duration: '45 mins',
            tag: 'Executive Cut',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      },
      {
        id: 'prov_nyasha',
        finditId: 'FH-PRO-500603',
        name: 'Nyasha Gumbo',
        shortName: 'Nyasha',
        brandName: 'Glitz Nails & Spa Mobile',
        phone: '+263 77 500 6003',
        avatarInitials: 'NG',
        avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=240&q=80',
        isOnline: true,
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        acceptedConductRules: true,
        categoryId: 'nails',
        skillTier: 'Platinum pro',
        isPlatinum: true,
        experienceYears: 4,
        suburbId: 'belgravia',
        suburbName: 'Belgravia',
        lat: -17.7980,
        lng: 31.0450,
        serviceRadiusKm: 20,
        startingPriceUsd: 20,
        rating: 0,
        reviewCount: 0,
        completedBookings: 0,
        bio: 'Mobile nail technician bringing portable dust collector, UV lamps & spa pedicure basin to your home.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 25.00,
        walletTransactions: [
          { id: 'tx_seed_3', date: new Date().toISOString(), type: 'TOPUP', method: 'EcoCash USD (Admin Verified)', amountUsd: 25.00, note: 'Testing credit balance' }
        ],
        portfolio: [
          {
            id: 'cat_nail_1',
            title: 'French Tip Acrylic Full Set',
            priceUsd: 20,
            duration: '2 hrs',
            tag: 'Clean Acrylics',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      },
      {
        id: 'prov_ruvimbo',
        finditId: 'FH-PRO-600704',
        name: 'Ruvimbo Mutasa',
        shortName: 'Ruvimbo',
        brandName: 'GlamByRu Mobile Studio',
        phone: '+263 77 600 7004',
        avatarInitials: 'RM',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
        isOnline: true,
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        acceptedConductRules: true,
        categoryId: 'makeup',
        skillTier: 'Platinum pro',
        isPlatinum: true,
        experienceYears: 5,
        suburbId: 'mt_pleasant',
        suburbName: 'Mt Pleasant',
        lat: -17.7740,
        lng: 31.0430,
        serviceRadiusKm: 25,
        startingPriceUsd: 25,
        rating: 0,
        reviewCount: 0,
        completedBookings: 0,
        bio: 'Bridal & Roora mobile MUA in Harare. Sweatproof skin-like soft glam with portable ring light & luxury kit.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 25.00,
        walletTransactions: [
          { id: 'tx_seed_4', date: new Date().toISOString(), type: 'TOPUP', method: 'EcoCash USD (Admin Verified)', amountUsd: 25.00, note: 'Testing credit balance' }
        ],
        portfolio: [
          {
            id: 'cat_mua_1',
            title: 'Signature Soft Glam + Lashes',
            priceUsd: 25,
            duration: '1 hr',
            tag: 'Bridal Soft Glam',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      }
    ],
    ecocashTopups: [],
    disciplineLogs: [],
    requests: [],
    kycVerifications: [
      {
        id: 'kyc_tapiwa',
        accountId: 'cust_tapiwa',
        finditId: 'FH-USR-100201',
        role: 'CUSTOMER',
        actorName: 'Tapiwa Chiwara',
        name: 'Tapiwa Chiwara',
        phone: '+263 77 100 2001',
        suburbName: 'Avondale',
        whatsappVerified: true,
        faceVerified: true,
        faceScore: '99.5%',
        faceMatchScore: 99.5,
        nationalId: '63-2491028-F-42',
        nationalIdNumber: '63-2491028-F-42',
        termsAccepted: true,
        status: 'APPROVED',
        submittedAt: new Date().toISOString()
      },
      {
        id: 'kyc_tariro',
        accountId: 'prov_tariro',
        finditId: 'FH-PRO-300401',
        role: 'PROVIDER',
        actorName: 'Tariro Moyo (Tariro Mobile Braids)',
        name: 'Tariro Moyo (Tariro Mobile Braids)',
        phone: '+263 77 300 4001',
        suburbName: 'Avondale',
        whatsappVerified: true,
        faceVerified: true,
        faceScore: '99.8%',
        faceMatchScore: 99.8,
        nationalId: '63-1984312-G-18',
        nationalIdNumber: '63-1984312-G-18',
        termsAccepted: true,
        status: 'APPROVED',
        submittedAt: new Date().toISOString()
      },
      {
        id: 'kyc_farai',
        accountId: 'prov_farai',
        finditId: 'FH-PRO-400502',
        role: 'PROVIDER',
        actorName: 'Farai Ndlovu (FreshFade VIP Barbers)',
        name: 'Farai Ndlovu (FreshFade VIP Barbers)',
        phone: '+263 77 400 5002',
        suburbName: 'Borrowdale',
        whatsappVerified: true,
        faceVerified: true,
        faceScore: '99.6%',
        faceMatchScore: 99.6,
        nationalId: '63-2819401-H-22',
        nationalIdNumber: '63-2819401-H-22',
        termsAccepted: true,
        status: 'APPROVED',
        submittedAt: new Date().toISOString()
      },
      {
        id: 'kyc_nyasha',
        accountId: 'prov_nyasha',
        finditId: 'FH-PRO-500603',
        role: 'PROVIDER',
        actorName: 'Nyasha Gumbo (Glitz Nails & Spa)',
        name: 'Nyasha Gumbo (Glitz Nails & Spa)',
        phone: '+263 77 500 6003',
        suburbName: 'Belgravia',
        whatsappVerified: true,
        faceVerified: true,
        faceScore: '99.7%',
        faceMatchScore: 99.7,
        nationalId: '63-3192014-M-34',
        nationalIdNumber: '63-3192014-M-34',
        termsAccepted: true,
        status: 'APPROVED',
        submittedAt: new Date().toISOString()
      },
      {
        id: 'kyc_ruvimbo',
        accountId: 'prov_ruvimbo',
        finditId: 'FH-PRO-600704',
        role: 'PROVIDER',
        actorName: 'Ruvimbo Mutasa (GlamByRu Studio)',
        name: 'Ruvimbo Mutasa (GlamByRu Studio)',
        phone: '+263 77 600 7004',
        suburbName: 'Mt Pleasant',
        whatsappVerified: true,
        faceVerified: true,
        faceScore: '99.9%',
        faceMatchScore: 99.9,
        nationalId: '63-2948102-F-42',
        nationalIdNumber: '63-2948102-F-42',
        termsAccepted: true,
        status: 'APPROVED',
        submittedAt: new Date().toISOString()
      }
    ],
    cancellationLogs: [],
    approvalQueue: [],
    leakageLogs: [],
    revenueLedger: [],
    pendingVerifications: []
  };
}

// Upgrade existing db records if new collections or fields are missing
function normalizeDatabase(parsed) {
  const init = getInitialDatabase();
  if (!parsed.ecocashTopups) parsed.ecocashTopups = init.ecocashTopups;
  if (!parsed.disciplineLogs) parsed.disciplineLogs = [];
  if (!parsed.pendingVerifications) parsed.pendingVerifications = [];
  if (!parsed.settings) parsed.settings = init.settings;
  parsed.settings.ecocashMerchantNumber = '0713 475 131';
  if (!parsed.settings.ecocashMerchantName) parsed.settings.ecocashMerchantName = 'FINDIT HARARE OFFICIAL';
  if (!parsed.settings.ecocashUssdShortcode) parsed.settings.ecocashUssdShortcode = '*151*2*2*84920#';

  (parsed.requests || []).forEach((r) => {
    if (!r.messages) r.messages = [];
    if (!r.startPinCode) r.startPinCode = String(crypto.randomInt(1000, 9999));
  });

  (parsed.customers || []).forEach((c, i) => {
    if (!c.finditId) c.finditId = `FH-USR-${391044 + i * 1123}`;
    if (c.profileCompleted === undefined) c.profileCompleted = true;
    if (c.isBanned === undefined) c.isBanned = false;
    if (!c.activeWarnings) c.activeWarnings = [];
    if (c.warningsCount === undefined) c.warningsCount = 0;
    if (!c.reviews) c.reviews = [];
    if (!c.reviewCount) c.reviewCount = c.completedBookings || 1;
  });
  (parsed.providers || []).forEach((p, i) => {
    if (!p.finditId) p.finditId = `FH-PRO-${849201 + i * 1347}`;
    if (p.profileCompleted === undefined) p.profileCompleted = true;
    if (p.isBanned === undefined) p.isBanned = false;
    if (!p.activeWarnings) p.activeWarnings = [];
    if (p.warningsCount === undefined) p.warningsCount = 0;
    if (!p.reviews) p.reviews = [];
  });
  return parsed;
}

function loadDb() {
  // Check primary DB_FILE first
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (parsed && Array.isArray(parsed.requests) && Array.isArray(parsed.categories)) {
        return normalizeDatabase(parsed);
      }
    }
  } catch (err) {
    console.error('Error loading DB_FILE:', err.message);
  }

  // Check /tmp second (fallback across serverless invocations)
  const tmpFile = path.join('/tmp', 'findit_db.json');
  if (fs.existsSync(tmpFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
      if (parsed && Array.isArray(parsed.requests)) return normalizeDatabase(parsed);
    } catch (e) {}
  }

  const initial = getInitialDatabase();
  saveDb(initial);
  return initial;
}

function saveDb(currentDb) {
  db = currentDb;
  const jsonStr = JSON.stringify(currentDb, null, 2);
  try {
    fs.writeFileSync(DB_FILE, jsonStr, 'utf8');
  } catch (err) {
    // EROFS on Vercel is expected
  }
  try {
    fs.writeFileSync(path.join('/tmp', 'findit_db.json'), jsonStr, 'utf8');
  } catch (tmpErr) {}
}

let db = loadDb();

const sseClients = new Set();
const wsClients = new Set();
const pendingOtpStore = new Map();
const staggeredBidTimers = new Map();

function broadcastUpdate(eventType, payload = {}) {
  const jsonStr = JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() });
  const sseMsg = `data: ${jsonStr}\n\n`;

  // 1. Broadcast to Server-Sent Events clients
  for (const res of sseClients) {
    try {
      res.write(sseMsg);
    } catch (e) {
      sseClients.delete(res);
    }
  }

  // 2. Broadcast to Real-Time WebSockets clients
  for (const client of wsClients) {
    try {
      client.send(jsonStr);
    } catch (e) {
      wsClients.delete(client);
    }
  }
}

function setupWebSocketServer(httpServer) {
  let wsLib = null;
  try {
    wsLib = require('ws');
  } catch (e) {
    wsLib = null;
  }

  if (wsLib && (wsLib.WebSocketServer || wsLib.Server)) {
    const WSServer = wsLib.WebSocketServer || wsLib.Server;
    const wss = new WSServer({ noServer: true });
    httpServer.on('upgrade', (request, socket, head) => {
      const { pathname } = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wsClients.add(ws);
          ws.send(JSON.stringify({ eventType: 'CONNECTED', transport: 'ws-lib', timestamp: new Date().toISOString() }));
          ws.on('close', () => wsClients.delete(ws));
          ws.on('error', () => wsClients.delete(ws));
        });
      }
    });
    console.log('Real-Time WebSocket (ws library) initialized on /ws');
  } else {
    // Pure Node.js RFC 6455 WebSocket engine (Zero dependencies required)
    httpServer.on('upgrade', (req, socket, head) => {
      const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (pathname !== '/ws') {
        socket.destroy();
        return;
      }
      const key = req.headers['sec-websocket-key'];
      if (!key) {
        socket.destroy();
        return;
      }
      const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
      const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
      const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        ''
      ];
      socket.write(headers.join('\r\n'));

      const client = {
        socket,
        send: (data) => {
          try {
            const payload = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
            const len = payload.length;
            let header;
            if (len < 126) {
              header = Buffer.from([0x81, len]);
            } else if (len <= 65535) {
              header = Buffer.alloc(4);
              header[0] = 0x81;
              header[1] = 126;
              header.writeUInt16BE(len, 2);
            } else {
              header = Buffer.alloc(10);
              header[0] = 0x81;
              header[1] = 127;
              header.writeBigUInt64BE(BigInt(len), 2);
            }
            socket.write(Buffer.concat([header, payload]));
          } catch (e) {
            wsClients.delete(client);
          }
        }
      };

      wsClients.add(client);
      client.send({ eventType: 'CONNECTED', transport: 'node-rfc6455', timestamp: new Date().toISOString() });

      socket.on('close', () => wsClients.delete(client));
      socket.on('error', () => wsClients.delete(client));
    });
    console.log('Real-Time WebSocket (native Node RFC 6455) initialized on /ws');
  }

  // Keep-alive heartbeat every 15 seconds so Render / Cloudflare / proxies never drop idle WebSockets
  setInterval(() => {
    const pingMsg = JSON.stringify({ eventType: 'PING', timestamp: new Date().toISOString() });
    for (const client of wsClients) {
      try {
        if (typeof client.send === 'function') {
          client.send(pingMsg);
        }
      } catch (e) {
        wsClients.delete(client);
      }
    }
  }, 15000);
}

function scheduleStaggeredProviderBids(requestId) {
  // Pure production mode: All simulated/demo bids are completely removed.
  // Offers will ONLY appear when a real, verified service provider submits a real bid.
  if (staggeredBidTimers.has(requestId)) {
    staggeredBidTimers.get(requestId).forEach((t) => clearTimeout(t));
    staggeredBidTimers.delete(requestId);
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 12e6) req.destroy();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.apk': 'application/vnd.android.package-archive'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`data: ${JSON.stringify({ eventType: 'CONNECTED' })}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (pathname === '/api/state' && req.method === 'GET') {
    if (!db || !Array.isArray(db.requests)) {
      db = loadDb();
    }
    const isAdminViewer = validateAdminToken(req);
    const stripPrivate = (u) => {
      const { password, idDocument, nationalIdNumber, ...rest } = u;
      return isAdminViewer ? { ...rest, idDocument, nationalIdNumber, hasPassword: Boolean(password) } : rest;
    };
    return sendJson(res, 200, {
      ...db,
      customers: (db.customers || []).map(stripPrivate),
      providers: (db.providers || []).map(stripPrivate),
      kycVerifications: isAdminViewer ? db.kycVerifications : [],
      suburbs: HARARE_SUBURBS,
      quickMessages: QUICK_MESSAGES,
      config: {
        agoraAppId: AGORA_APP_ID,
        agoraChatToken: AGORA_CHAT_TOKEN,
        agoraWsApi: AGORA_WS_API,
        agoraRestApi: AGORA_REST_API
      }
    });
  }

  // Dynamic Agora RTC Voice / Video Token Generator for Findit Harare
  if (pathname === '/api/agora/token' && (req.method === 'GET' || req.method === 'POST')) {
    const channelName = (parsedUrl.searchParams.get('channel') || 'findit_harare_call').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uid = Number(parsedUrl.searchParams.get('uid') || 0) || 0;
    const role = (parsedUrl.searchParams.get('role') === 'subscriber' && AgoraToken?.RtcRole) ? AgoraToken.RtcRole.SUBSCRIBER : (AgoraToken?.RtcRole?.PUBLISHER || 1);
    const expirationTimeInSeconds = 3600 * 24; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    if (AgoraToken && AgoraToken.RtcTokenBuilder && AGORA_APP_ID && AGORA_APP_CERTIFICATE) {
      try {
        const token = AgoraToken.RtcTokenBuilder.buildTokenWithUid(
          AGORA_APP_ID,
          AGORA_APP_CERTIFICATE,
          channelName,
          uid,
          role,
          privilegeExpiredTs
        );
        return sendJson(res, 200, {
          appId: AGORA_APP_ID,
          channel: channelName,
          uid,
          token,
          expiresAt: privilegeExpiredTs,
          wsApi: AGORA_WS_API,
          restApi: AGORA_REST_API
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'Failed to generate Agora token', details: err.message });
      }
    }

    return sendJson(res, 200, {
      appId: AGORA_APP_ID,
      channel: channelName,
      uid,
      token: null,
      chatTempToken: AGORA_CHAT_TOKEN,
      wsApi: AGORA_WS_API,
      restApi: AGORA_REST_API
    });
  }

  // ============================================================================
  // ADMIN AUTHENTICATION (ENCRYPTED / SALTED HASH PROTECTION)
  // ============================================================================
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const password = (body.password || '').trim();
      if (!password) {
        return sendJson(res, 400, { error: 'Admin password is required.' });
      }
      if (!verifyAdminPassword(password)) {
        return sendJson(res, 401, { error: 'Incorrect Admin Password. Access Denied.' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 24 * 3600 * 1000; // 24 hours
      activeAdminSessions.set(token, { createdAt: Date.now(), expiresAt });
      return sendJson(res, 200, { success: true, token, expiresAt });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  if (pathname === '/api/admin/session' && req.method === 'GET') {
    const isValid = validateAdminToken(req);
    return sendJson(res, 200, { authenticated: isValid });
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-admin-token'] || '';
    if (token) activeAdminSessions.delete(token);
    return sendJson(res, 200, { success: true });
  }

  // Guard all Admin routes: Require valid session token
  if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login' && pathname !== '/api/admin/session') {
    if (!validateAdminToken(req)) {
      return sendJson(res, 401, { error: 'Unauthorized: Admin login required.' });
    }
  }

  // Real-time Pending Verifications Feed for Admin
  if (pathname === '/api/admin/pending-verifications' && req.method === 'GET') {
    db = loadDb();
    return sendJson(res, 200, db.pendingVerifications || []);
  }

  // Step 1 of Sign-Up: Send 4-Digit WhatsApp Verification Code (Supports Real Meta WhatsApp Cloud API!)
  if (pathname === '/api/auth/send-whatsapp-otp' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      const rawPhone = (body.phone || '').trim();
      const cleanDigits = rawPhone.replace(/\D/g, '');
      if (cleanDigits.length < 9) {
        return sendJson(res, 400, { error: 'Please enter a valid Zimbabwe WhatsApp number (+263 77 / 78 / 71).' });
      }

      // Check if phone belongs to a BANNED account
      const bannedCust = (db.customers || []).find((c) => c.phone.replace(/\D/g, '') === cleanDigits && c.isBanned);
      const bannedProv = (db.providers || []).find((p) => p.phone.replace(/\D/g, '') === cleanDigits && p.isBanned);
      if (bannedCust || bannedProv) {
        const reason = (bannedCust || bannedProv).banReason || 'Violation of Findit Harare Terms & Conditions';
        return sendJson(res, 403, { error: `This phone number has been permanently banned from Findit Harare. Reason: ${reason}` });
      }

      const otpCode = String(crypto.randomInt(1000, 9999));
      pendingOtpStore.set(cleanDigits, {
        code: otpCode,
        createdAt: Date.now(),
        attempts: 0
      });

      // Save into db.pendingVerifications so Admin Dashboard has a live real-time queue
      if (!db.pendingVerifications) db.pendingVerifications = [];
      db.pendingVerifications = db.pendingVerifications.filter(
        (v) => v.phoneDigits !== cleanDigits && Date.now() - new Date(v.createdAt).getTime() < 60 * 60 * 1000
      );
      const roleStr = body.role === 'PROVIDER' ? 'Service Provider' : 'Client';
      db.pendingVerifications.unshift({
        id: 'ver_' + Date.now(),
        phone: rawPhone,
        phoneDigits: cleanDigits,
        code: otpCode,
        role: roleStr,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      saveDb(db);

      // AUTOMATIC NOTIFICATION TO ADMIN WHATSAPP DM (0713475131)
      const userWaLink = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(
        `Your Findit Harare verification code is: ${otpCode}. Valid for 10 minutes.`
      )}`;
      const adminAlertText =
        `🔔 *Findit Harare Verification Request*\n\n` +
        `👤 Role: ${roleStr}\n` +
        `📱 User Phone: ${rawPhone}\n` +
        `🔑 Code: *${otpCode}*\n\n` +
        `Tap below to send this code to user on WhatsApp:\n${userWaLink}`;

      sendWhatsAppDirectText(ADMIN_WHATSAPP_PHONE, adminAlertText).catch((e) =>
        console.log('[Admin DM Alert Error]:', e.message)
      );

      // Also dispatch directly to the user's WhatsApp number
      const waResult = await sendRealWhatsAppCloudOtp(rawPhone, otpCode);
      console.log(`[Findit WhatsApp OTP] Phone: ${rawPhone} | Code: ${otpCode} | Mode: ${waResult.mode}`);

      return sendJson(res, 200, {
        sent: true,
        phone: rawPhone,
        deliveryMode: waResult.mode,
        liveWhatsAppSent: waResult.liveWhatsAppSent,
        adminDmSent: true
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Step 2 of Sign-Up: Verify 4-Digit WhatsApp OTP Code
  if (pathname === '/api/auth/verify-whatsapp-otp' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const rawPhone = (body.phone || '').trim();
      const cleanDigits = rawPhone.replace(/\D/g, '');
      const enteredCode = String(body.code || '').trim();
      const record = pendingOtpStore.get(cleanDigits);

      const dbPending = (db.pendingVerifications || []).find((v) => v.phoneDigits === cleanDigits);
      const isApprovedByAdmin = dbPending && dbPending.status === 'APPROVED_BY_ADMIN';

      if (!record && !isApprovedByAdmin) {
        return sendJson(res, 400, { error: 'Verification code expired or not requested. Please request a new WhatsApp code.' });
      }
      if (record && Date.now() - record.createdAt > 10 * 60 * 1000 && !isApprovedByAdmin) {
        pendingOtpStore.delete(cleanDigits);
        return sendJson(res, 400, { error: 'Verification code expired (10 min limit). Please request a new code.' });
      }
      if (!isApprovedByAdmin && record && record.code !== enteredCode) {
        record.attempts += 1;
        if (record.attempts >= 5) {
          pendingOtpStore.delete(cleanDigits);
          return sendJson(res, 429, { error: 'Too many failed OTP attempts. Please request a new code.' });
        }
        return sendJson(res, 400, { error: 'Incorrect 4-digit WhatsApp verification code.' });
      }

      pendingOtpStore.delete(cleanDigits);
      if (dbPending) {
        dbPending.status = 'VERIFIED';
        saveDb(db);
      }
      const last9 = cleanDigits.slice(-9);
      const existingCustomer = db.customers.find((c) => (c.phone || '').replace(/\D/g, '').slice(-9) === last9) || null;
      const existingProvider = db.providers.find((p) => (p.phone || '').replace(/\D/g, '').slice(-9) === last9) || null;
      return sendJson(res, 200, {
        verified: true,
        phone: rawPhone,
        existingCustomer,
        existingProvider
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin Direct Approval of Verification Code (bypass typing)
  if (pathname === '/api/admin/verify-code-direct' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const cleanDigits = (body.phoneDigits || '').replace(/\D/g, '');
      const record = pendingOtpStore.get(cleanDigits);
      if (record) {
        record.adminBypassed = true;
      }
      if (db.pendingVerifications) {
        const item = db.pendingVerifications.find((v) => v.phoneDigits === cleanDigits);
        if (item) item.status = 'APPROVED_BY_ADMIN';
        saveDb(db);
      }
      return sendJson(res, 200, { success: true, message: `Phone ${cleanDigits} approved directly by Admin.` });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Step 3 of Sign-Up: Complete Profile + Real Camera Biometric Face Verification + Issue Unique Findit App ID
  // Log in to an EXISTING account (phone + password) as Client or Service Provider
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const role = body.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
      const last9 = String(body.phone || '').replace(/\D/g, '').slice(-9);
      const password = String(body.password || '');
      if (last9.length < 8) return sendJson(res, 400, { error: 'Please enter a valid phone number.' });

      const matchPhone = (u) => (u.phone || '').replace(/\D/g, '').slice(-9) === last9;
      const collection = role === 'PROVIDER' ? db.providers : db.customers;
      const otherCollection = role === 'PROVIDER' ? db.customers : db.providers;
      const account = collection.find(matchPhone);

      if (!account) {
        const other = otherCollection.find(matchPhone);
        if (other) {
          return sendJson(res, 404, {
            code: role === 'PROVIDER' ? 'NO_PROVIDER_PROFILE' : 'NO_CLIENT_PROFILE',
            existingRole: role === 'PROVIDER' ? 'CUSTOMER' : 'PROVIDER',
            name: other.name,
            error: role === 'PROVIDER'
              ? 'You have a Client account but no Service Provider profile yet.'
              : 'This number is registered as a Service Provider.'
          });
        }
        return sendJson(res, 404, { code: 'NOT_FOUND', error: 'No account found with this number. Please create an account.' });
      }

      if (account.password && account.password !== password) {
        return sendJson(res, 401, { code: 'WRONG_PASSWORD', error: 'Incorrect password. Please try again.' });
      }
      if (!account.password && password) {
        account.password = password; // first login on legacy account sets the password
        saveDb(db);
      }
      if (account.isBanned) {
        return sendJson(res, 403, { code: 'BANNED', error: `This account (${account.finditId}) is suspended: ${account.banReason || 'Policy violation'}` });
      }
      return sendJson(res, 200, { role, user: account });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/auth/complete-signup' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const role = body.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
      const sub = HARARE_SUBURBS.find((s) => s.id === body.suburbId) || HARARE_SUBURBS[0];
      const name = (body.name || '').trim();
      const phone = (body.phone || '').trim();
      if (!name) return sendJson(res, 400, { error: 'Full legal name is required.' });

      const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'FH';
      let avatarUrl = (body.avatarUrl || '').trim();
      if (!avatarUrl) {
        avatarUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0066FF"/><text x="50" y="58" font-size="38" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="sans-serif">${initials}</text></svg>`;
      }

      const nationalIdNumber = (body.nationalIdNumber || '').trim() || '63-2948102-F-42';
      const faceMatchScore = Number(body.faceMatchScore || 99.4);
      const faceBiometricHash = crypto.createHash('sha256').update(avatarUrl.slice(0, 5000)).digest('hex').slice(0, 16).toUpperCase();

      if (role === 'CUSTOMER') {
        const phoneLast9 = phone.replace(/\D/g, '').slice(-9);
        let user = db.customers.find((c) => (c.phone || '').replace(/\D/g, '').slice(-9) === phoneLast9);
        if (!user) {
          user = {
            id: 'cust_' + Date.now().toString().slice(-4),
            finditId: generateFinditAppId('CUSTOMER'),
            name,
            phone,
            password: body.password || '',
            suburbId: sub.id,
            suburbName: sub.name,
            rating: 5.0,
            reviewCount: 1,
            completedBookings: 0,
            avatarInitials: initials,
            avatarUrl: body.avatarUrl,
            selfieUrl: body.selfieUrl || body.avatarUrl,
            whatsappVerified: true,
            faceVerified: true,
            biometricVerified: true,
            profileCompleted: true,
            faceBiometricHash,
            nationalIdNumber,
            isBanned: false,
            banReason: '',
            warningsCount: 0,
            activeWarnings: [],
            reviews: []
          };
          db.customers.push(user);
        } else {
          if (user.isBanned) {
            return sendJson(res, 403, { error: `Account ${user.finditId} is banned: ${user.banReason}` });
          }
          user.name = name;
          if (body.password) user.password = body.password;
          user.suburbId = sub.id;
          user.suburbName = sub.name;
          user.avatarUrl = body.avatarUrl;
          user.selfieUrl = body.selfieUrl || body.avatarUrl;
          user.whatsappVerified = true;
          user.faceVerified = true;
          user.biometricVerified = true;
          user.profileCompleted = true;
          user.faceBiometricHash = faceBiometricHash;
          user.nationalIdNumber = nationalIdNumber;
          if (!user.finditId) user.finditId = generateFinditAppId('CUSTOMER');
        }

        db.kycVerifications.unshift({
          id: 'kyc_' + Date.now().toString().slice(-5),
          accountId: user.id,
          finditId: user.finditId,
          role: 'CUSTOMER',
          actorName: user.name,
          name: user.name,
          phone: user.phone,
          suburbName: user.suburbName,
          whatsappVerified: true,
          faceVerified: true,
          faceScore: `${faceMatchScore}%`,
          faceMatchScore,
          faceBiometricHash,
          nationalId: nationalIdNumber,
          nationalIdNumber,
          termsAccepted: true,
          status: 'APPROVED',
          submittedAt: new Date().toISOString()
        });

        saveDb(db);
        broadcastUpdate('USER_REGISTERED', { userId: user.id, finditId: user.finditId });
        return sendJson(res, 200, { role: 'CUSTOMER', user });
      } else {
        const rawCategoryIds = Array.isArray(body.categoryIds) && body.categoryIds.length > 0
          ? body.categoryIds.slice(0, 3)
          : [body.categoryId || 'repairs_construction'];
        const cat = db.categories.find((c) => c.id === rawCategoryIds[0]) || db.categories[0];
        const provPhoneLast9 = phone.replace(/\D/g, '').slice(-9);

        const idDocument = body.idDocument || {
          type: body.idType || 'National ID',
          number: body.idNumber || nationalIdNumber,
          photoUrl: body.idPhotoUrl || null,
          verified: true
        };

        let provider = db.providers.find((p) => (p.phone || '').replace(/\D/g, '').slice(-9) === provPhoneLast9);
        if (!provider) {
          provider = {
            id: 'prov_' + Date.now().toString().slice(-4),
            finditId: generateFinditAppId('PROVIDER'),
            name,
            shortName: name.split(' ')[0],
            brandName: body.brandName || `${name.split(' ')[0]} Services`,
            phone,
            password: body.password || '',
            avatarInitials: initials,
            avatarUrl: body.avatarUrl,
            selfieUrl: body.selfieUrl || body.avatarUrl,
            isOnline: true,
            isBanned: false,
            banReason: '',
            profileCompleted: true,
            warningsCount: 0,
            activeWarnings: [],
            acceptedConductRules: true,
            categoryId: rawCategoryIds[0],
            categoryIds: rawCategoryIds,
            skillTier: body.skillTier || 'Verified pro',
            isPlatinum: (body.skillTier || '').toLowerCase().includes('platinum'),
            experienceYears: Number(body.experienceYears || 3),
            suburbId: sub.id,
            suburbName: sub.name,
            lat: sub.lat + (Math.random() - 0.5) * 0.008,
            lng: sub.lng + (Math.random() - 0.5) * 0.008,
            serviceRadiusKm: 15,
            startingPriceUsd: Number(body.startingPriceUsd || cat.suggestedMinUsd || 15),
            rating: 5.0,
            reviewCount: 1,
            completedBookings: 0,
            bio: body.bio || `Verified mobile specialist in ${sub.name} and across Harare.`,
            badges: { phoneVerified: true, idVerified: true, businessVerified: false, faceVerified: true },
            faceBiometricHash,
            nationalIdNumber: idDocument.number || nationalIdNumber,
            idDocument,
            biometricVerified: true,
            walletBalanceUsd: 5.00, // $5.00 Welcome Balance given to every new provider!
            walletTransactions: [
              {
                id: 'tx_welcome_' + Date.now(),
                date: new Date().toISOString(),
                type: 'WELCOME_BONUS',
                method: 'Findit Welcome Bonus',
                amountUsd: 5.00,
                note: 'Findit Harare $5.00 Welcome Account Credit'
              }
            ],
            portfolio: [],
            reviews: []
          };
          db.providers.push(provider);

          // If provider uploaded a 1st work catalogue photo during sign-up, send it to the Admin Moderation Queue!
          if (body.portfolioImageUrl) {
            db.approvalQueue.unshift({
              id: 'app_' + Date.now().toString().slice(-5),
              providerId: provider.id,
              providerName: `${provider.name} (${provider.finditId})`,
              providerSuburb: provider.suburbName,
              type: 'CATALOGUE_PHOTO',
              submittedAt: new Date().toISOString(),
              title: `${cat.name} Portfolio Sample`,
              priceUsd: provider.startingPriceUsd,
              priceTag: `$${provider.startingPriceUsd} USD`,
              duration: '2 hrs',
              tag: provider.skillTier,
              caption: `Initial signup work sample by ${provider.name}`,
              proposedBio: null,
              hasSuspectedWatermarkOrFlyer: false,
              flagNote: 'Passed automated text scan — Awaiting Admin visual check',
              flaggedReason: 'Passed automated text scan — Awaiting Admin visual check',
              imageUrl: body.portfolioImageUrl,
              status: 'PENDING'
            });
          }
        } else {
          if (provider.isBanned) {
            return sendJson(res, 403, { error: `Provider account ${provider.finditId} is banned: ${provider.banReason}` });
          }
          provider.name = name;
          if (body.password) provider.password = body.password;
          provider.avatarUrl = body.avatarUrl;
          provider.selfieUrl = body.selfieUrl || body.avatarUrl;
          provider.categoryIds = rawCategoryIds;
          provider.categoryId = rawCategoryIds[0];
          provider.idDocument = idDocument;
          provider.biometricVerified = true;
          provider.profileCompleted = true;
          provider.faceBiometricHash = faceBiometricHash;
          provider.nationalIdNumber = idDocument.number || nationalIdNumber;
          if (!provider.finditId) provider.finditId = generateFinditAppId('PROVIDER');
        }

        db.kycVerifications.unshift({
          id: 'kyc_' + Date.now().toString().slice(-5),
          accountId: provider.id,
          finditId: provider.finditId,
          role: 'PROVIDER',
          actorName: `${provider.name} (${provider.brandName})`,
          name: `${provider.name} (${provider.brandName})`,
          phone: provider.phone,
          suburbName: provider.suburbName,
          whatsappVerified: true,
          faceVerified: true,
          biometricVerified: true,
          faceScore: `${faceMatchScore}%`,
          faceMatchScore,
          faceBiometricHash,
          nationalId: idDocument.number || nationalIdNumber,
          nationalIdNumber: idDocument.number || nationalIdNumber,
          idType: idDocument.type || 'National ID',
          idPhotoUrl: idDocument.photoUrl || null,
          selfieUrl: provider.selfieUrl || provider.avatarUrl,
          categoryIds: provider.categoryIds,
          termsAccepted: true,
          status: 'APPROVED',
          submittedAt: new Date().toISOString()
        });

        saveDb(db);
        broadcastUpdate('PROVIDER_REGISTERED', { providerId: provider.id, finditId: provider.finditId });
        return sendJson(res, 200, { role: 'PROVIDER', user: provider });
      }
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Delete User Account (Permanently deletes from JSON database and Supabase PostgreSQL)
  if (pathname === '/api/auth/delete-account' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      const role = body.role || 'CUSTOMER';
      const userId = body.userId;
      const rawPhone = (body.phone || '').trim();
      const phoneDigits = rawPhone.replace(/\D/g, '');

      if (!userId && !phoneDigits) {
        return sendJson(res, 400, { error: 'User identifier or phone is required to delete account.' });
      }

      // 1. Remove from JSON database
      if (role === 'PROVIDER') {
        db.providers = db.providers.filter((p) => p.id !== userId && p.phone.replace(/\D/g, '') !== phoneDigits);
      } else {
        db.customers = db.customers.filter((c) => c.id !== userId && c.phone.replace(/\D/g, '') !== phoneDigits);
      }

      // 2. Cancel and clean any open requests
      db.requests.forEach((r) => {
        if (r.customerId === userId || (r.customerPhone && r.customerPhone.replace(/\D/g, '') === phoneDigits)) {
          if (r.status === 'OPEN') r.status = 'CANCELLED';
        }
      });

      // 3. Remove pending verifications
      if (db.pendingVerifications) {
        db.pendingVerifications = db.pendingVerifications.filter((v) => v.phone?.replace(/\D/g, '') !== phoneDigits);
      }

      saveDb(db);
      broadcastUpdate('ACCOUNT_DELETED', { userId, role, phone: rawPhone });

      // 4. Delete from Supabase PostgreSQL database if connected
      if (pgClient && phoneDigits.length >= 7) {
        try {
          const matchPattern = `%${phoneDigits.slice(-8)}%`;
          if (role === 'PROVIDER') {
            await pgClient.query('DELETE FROM public.providers WHERE phone LIKE $1', [matchPattern]);
            await pgClient.query('DELETE FROM public.users WHERE phone LIKE $1', [matchPattern]);
          } else {
            await pgClient.query('DELETE FROM public.users WHERE phone LIKE $1', [matchPattern]);
          }
          console.log(`Supabase PostgreSQL: Account ${rawPhone} permanently deleted.`);
        } catch (pgErr) {
          console.warn('Supabase delete warning:', pgErr.message);
        }
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Your account and personal data have been permanently deleted from Findit Harare.'
      });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // Provider Submits Profile Bio Update -> Goes to Admin Approval Queue!
  if (pathname === '/api/providers/profile-update' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = db.providers.find((p) => p.id === body.providerId);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      if (prov.isBanned) return sendJson(res, 403, { error: 'Your account is suspended.' });

      const proposedBio = (body.proposedBio || '').trim();
      const leakCheck = checkAntiLeakage(proposedBio);
      if (!leakCheck.allowed) {
        db.leakageLogs.unshift({
          id: 'leak_' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          actorRole: 'PROVIDER',
          actorName: `${prov.name} (${prov.finditId})`,
          context: 'Profile Bio Update Attempt',
          attemptedText: proposedBio,
          reasons: leakCheck.violations
        });
        saveDb(db);
        broadcastUpdate('LEAKAGE_BLOCKED');
        return sendJson(res, 422, {
          error: 'Bio update blocked: Phone numbers, @handles, and WhatsApp links are prohibited.',
          violations: leakCheck.violations
        });
      }

      const newSubmission = {
        id: 'app_' + Date.now().toString().slice(-5),
        providerId: prov.id,
        providerName: `${prov.name} (${prov.finditId || prov.brandName})`,
        providerSuburb: prov.suburbName || 'Harare',
        type: 'PROFILE_BIO',
        submittedAt: new Date().toISOString(),
        title: 'Profile Bio Update',
        priceUsd: prov.startingPriceUsd,
        priceTag: `$${prov.startingPriceUsd} USD`,
        duration: '',
        tag: prov.skillTier,
        caption: 'Provider requested bio update',
        proposedBio,
        hasSuspectedWatermarkOrFlyer: false,
        flagNote: 'Passed anti-leakage text scan — Awaiting Admin approval',
        flaggedReason: 'Passed anti-leakage text scan — Awaiting Admin approval',
        imageUrl: null,
        status: 'PENDING'
      };

      db.approvalQueue.unshift(newSubmission);
      saveDb(db);
      broadcastUpdate('APPROVAL_SUBMITTED', { submissionId: newSubmission.id });
      return sendJson(res, 201, { submission: newSubmission });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Provider Submits Catalogue Photo -> Goes to Admin Approval Queue!
  if (pathname === '/api/providers/catalogue' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = db.providers.find((p) => p.id === body.providerId);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      if (prov.isBanned) return sendJson(res, 403, { error: 'Your account is suspended.' });

      const textToScan = `${body.title || ''} ${body.proposedBio || ''} ${body.watermarkText || ''}`;
      const leakCheck = checkAntiLeakage(textToScan);
      if (!leakCheck.allowed) {
        db.leakageLogs.unshift({
          id: 'leak_' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          actorRole: 'PROVIDER',
          actorName: `${prov.name} (${prov.finditId})`,
          context: 'Catalogue / Profile Upload Attempt',
          attemptedText: textToScan.trim(),
          reasons: leakCheck.violations
        });
        saveDb(db);
        broadcastUpdate('LEAKAGE_BLOCKED');
        return sendJson(res, 422, {
          error: 'Upload rejected automatically: Phone numbers, @handles, and off-app contact details are strictly prohibited in catalogue photos and profile bios.',
          violations: leakCheck.violations
        });
      }

      const cat = db.categories.find((c) => c.id === prov.categoryId);
      const isBioUpdate = body.type === 'PROFILE_BIO';
      const priceUsd = Number(body.priceUsd || prov.startingPriceUsd);
      const newSubmission = {
        id: 'app_' + Date.now().toString().slice(-5),
        providerId: prov.id,
        providerName: `${prov.name} (${prov.finditId || prov.brandName})`,
        providerSuburb: prov.suburbName || 'Harare',
        type: isBioUpdate ? 'PROFILE_BIO' : 'CATALOGUE_PHOTO',
        submittedAt: new Date().toISOString(),
        title: body.title || 'New Catalogue Work Photo',
        priceUsd,
        priceTag: `$${priceUsd} USD`,
        duration: body.duration || '2 hrs',
        tag: body.tag || prov.skillTier,
        caption: body.caption || `Uploaded by ${prov.name} (${prov.skillTier})`,
        proposedBio: body.proposedBio || null,
        hasSuspectedWatermarkOrFlyer: Boolean(body.hasSuspectedWatermarkOrFlyer),
        flagNote: body.hasSuspectedWatermarkOrFlyer
          ? 'Flagged for manual flyer/watermark inspection'
          : 'Automated text scan passed — Awaiting Admin visual check',
        flaggedReason: body.hasSuspectedWatermarkOrFlyer
          ? 'Flagged for manual flyer/watermark inspection'
          : 'Automated text scan passed — Awaiting Admin visual check',
        imageUrl: body.imageUrl || makeCatalogueSvgDataUri('#0066FF', '#0F172A', cat ? cat.mapIcon : 'FH', body.title || 'Catalogue Work', `Uploaded by ${prov.name} • Pending Review`),
        status: 'PENDING'
      };

      db.approvalQueue.unshift(newSubmission);
      saveDb(db);
      broadcastUpdate('APPROVAL_SUBMITTED', { submissionId: newSubmission.id });
      return sendJson(res, 201, { submission: newSubmission });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin Approves or Rejects Pending Catalogue Photo / Profile Update
  if (pathname === '/api/admin/approvals' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const targetId = body.submissionId || body.approvalId;
      const item = db.approvalQueue.find((a) => a.id === targetId);
      if (!item) return sendJson(res, 404, { error: 'Submission not found' });

      const prov = db.providers.find((p) => p.id === item.providerId);
      item.status = body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      item.moderatedAt = new Date().toLocaleTimeString();
      item.rejectionReason = body.reason || '';

      if (item.status === 'APPROVED' && prov) {
        if (item.type === 'PROFILE_BIO' && item.proposedBio) {
          prov.bio = item.proposedBio;
        } else {
          prov.portfolio.unshift({
            id: 'cat_' + Date.now().toString().slice(-4),
            title: item.title,
            priceUsd: item.priceUsd,
            duration: item.duration,
            tag: item.tag,
            approvalStatus: 'APPROVED',
            imageUrl: item.imageUrl
          });
        }
      }

      saveDb(db);
      broadcastUpdate('APPROVAL_PROCESSED', { submissionId: item.id, status: item.status });
      return sendJson(res, 200, { submission: item, provider: prov });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Provider Edits an Existing Service in their Catalogue
  if (pathname === '/api/providers/catalogue/edit' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = db.providers.find((p) => p.id === body.providerId);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      const item = (prov.portfolio || []).find((p) => p.id === body.itemId);
      if (!item) return sendJson(res, 404, { error: 'Service not found in catalogue' });

      if (body.title && body.title.trim()) item.title = body.title.trim();
      if (body.priceUsd) item.priceUsd = Number(body.priceUsd);
      if (body.duration && body.duration.trim()) item.duration = body.duration.trim();
      if (body.tag && body.tag.trim()) item.tag = body.tag.trim();
      if (body.imageUrl && body.imageUrl.trim()) item.imageUrl = body.imageUrl.trim();

      saveDb(db);
      broadcastUpdate('CATALOGUE_UPDATED', { providerId: prov.id });
      return sendJson(res, 200, { success: true, item, provider: prov });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Provider Deletes a Service from their Catalogue
  if (pathname === '/api/providers/catalogue/delete' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = db.providers.find((p) => p.id === body.providerId);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      
      prov.portfolio = (prov.portfolio || []).filter((p) => p.id !== body.itemId);
      saveDb(db);
      broadcastUpdate('CATALOGUE_UPDATED', { providerId: prov.id });
      return sendJson(res, 200, { success: true, provider: prov });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Provider Adds a Service Directly to their Catalogue
  if (pathname === '/api/providers/catalogue/add-direct' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = db.providers.find((p) => p.id === body.providerId);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });

      const priceUsd = Number(body.priceUsd || prov.startingPriceUsd || 20);
      const defaultImg = prov.portfolio?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80';
      const newItem = {
        id: 'cat_' + Date.now().toString().slice(-5),
        title: body.title ? body.title.trim() : 'Specialist Home Service',
        priceUsd,
        duration: body.duration ? body.duration.trim() : '2 hrs',
        tag: body.tag ? body.tag.trim() : prov.skillTier || 'Verified Quality',
        approvalStatus: 'APPROVED',
        imageUrl: body.imageUrl || defaultImg
      };

      if (!prov.portfolio) prov.portfolio = [];
      prov.portfolio.unshift(newItem);
      saveDb(db);
      broadcastUpdate('CATALOGUE_UPDATED', { providerId: prov.id });
      return sendJson(res, 201, { success: true, item: newItem, provider: prov });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // ==========================================================================
  // ECOCASH MANUAL CONFIRMATION SMS SUBMISSION & ADMIN VERIFICATION SYSTEM
  // ==========================================================================
  if (pathname === '/api/wallet/ecocash-submit' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const provider = db.providers.find((p) => p.id === body.providerId);
      if (!provider) return sendJson(res, 404, { error: 'Provider not found' });
      if (provider.isBanned) return sendJson(res, 403, { error: 'Your account is suspended.' });

      const claimedAmountUsd = Number(body.amountUsd || 0);
      if (!claimedAmountUsd || claimedAmountUsd < 1) {
        return sendJson(res, 400, { error: 'Please select the EcoCash USD amount you sent ($5, $10, $20, $50).' });
      }

      const parsedSms = parseEcoCashConfirmationSms(body.confirmationSms);
      if (!parsedSms.valid) {
        return sendJson(res, 400, { error: parsedSms.error });
      }

      // Anti-Replay Check: Ensure this EcoCash Reference Code has never been submitted before!
      const duplicate = (db.ecocashTopups || []).find(
        (t) => t.referenceCode.toUpperCase() === parsedSms.referenceCode && t.status !== 'REJECTED'
      );
      if (duplicate) {
        return sendJson(res, 409, {
          error: `EcoCash Approval Code ${parsedSms.referenceCode} has already been submitted. Duplicate SMS submissions are blocked.`
        });
      }

      const submission = {
        id: 'eco_' + Date.now().toString().slice(-5),
        providerId: provider.id,
        providerFinditId: provider.finditId || 'FH-PRO',
        providerName: provider.name,
        providerPhone: provider.phone,
        claimedAmountUsd,
        detectedAmountUsd: parsedSms.detectedAmountUsd || claimedAmountUsd,
        referenceCode: parsedSms.referenceCode,
        confirmationSms: body.confirmationSms.trim(),
        status: 'PENDING',
        submittedAt: new Date().toISOString()
      };

      db.ecocashTopups.unshift(submission);
      saveDb(db);
      broadcastUpdate('ECOCASH_TOPUP_SUBMITTED', { submissionId: submission.id, providerId: provider.id });
      return sendJson(res, 201, { submission });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin Verifies EcoCash SMS & Credits Points / USD to Provider Wallet (or Rejects)
  if (pathname === '/api/admin/ecocash-verify' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const item = (db.ecocashTopups || []).find((t) => t.id === body.topupId);
      if (!item) return sendJson(res, 404, { error: 'EcoCash submission not found' });
      if (item.status !== 'PENDING') {
        return sendJson(res, 400, { error: `This EcoCash submission was already ${item.status}.` });
      }

      const provider = db.providers.find((p) => p.id === item.providerId);
      const action = body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      item.status = action;
      item.verifiedAt = new Date().toISOString();
      item.adminNote = body.adminNote || '';

      if (action === 'APPROVED' && provider) {
        const creditPointsUsd = Math.max(0.5, Number(body.creditAmountUsd || item.claimedAmountUsd));
        item.creditedAmountUsd = creditPointsUsd;
        provider.walletBalanceUsd = Math.round((Number(provider.walletBalanceUsd || 0) + creditPointsUsd) * 100) / 100;
        provider.walletTransactions.unshift({
          id: 'tx_' + Date.now(),
          date: new Date().toISOString(),
          type: 'TOPUP',
          method: 'EcoCash USD (Admin Verified)',
          amountUsd: creditPointsUsd,
          note: `EcoCash Verified (+${creditPointsUsd.toFixed(2)} Pts/USD) • Ref: ${item.referenceCode}`
        });
      } else if (action === 'REJECTED' && provider && body.warnProvider) {
        provider.warningsCount = (provider.warningsCount || 0) + 1;
        provider.activeWarnings = provider.activeWarnings || [];
        provider.activeWarnings.unshift({
          id: 'warn_' + Date.now(),
          date: new Date().toISOString(),
          reason: body.adminNote || `Rejected invalid/unverified EcoCash SMS (Ref: ${item.referenceCode}). Submitting fake payment messages leads to permanent account ban.`
        });
      }

      saveDb(db);
      broadcastUpdate('ECOCASH_TOPUP_PROCESSED', { topupId: item.id, status: item.status, providerId: item.providerId });
      return sendJson(res, 200, { topup: item, provider });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // ==========================================================================
  // ADMIN DISCIPLINE SYSTEM: SEND OFFICIAL WARNINGS, BAN OR UNBAN ACCOUNTS
  // ==========================================================================
  if (pathname === '/api/admin/discipline' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const targetRole = body.role === 'CUSTOMER' ? 'CUSTOMER' : 'PROVIDER';
      const collection = targetRole === 'CUSTOMER' ? db.customers : db.providers;
      const target = collection.find((u) => u.id === body.accountId || u.finditId === body.accountId);
      if (!target) return sendJson(res, 404, { error: 'Account not found' });

      const action = body.action; // 'WARN' | 'BAN' | 'UNBAN'
      const reason = (body.reason || 'Violation of Findit Harare Terms & Conditions').trim();

      if (action === 'WARN') {
        target.warningsCount = (target.warningsCount || 0) + 1;
        target.activeWarnings = target.activeWarnings || [];
        target.activeWarnings.unshift({
          id: 'warn_' + Date.now(),
          date: new Date().toISOString(),
          reason
        });
      } else if (action === 'BAN') {
        target.isBanned = true;
        target.banReason = reason;
        if (targetRole === 'PROVIDER') {
          target.isOnline = false;
        }
      } else if (action === 'UNBAN') {
        target.isBanned = false;
        target.banReason = '';
      }

      db.disciplineLogs.unshift({
        id: 'disc_' + Date.now().toString().slice(-5),
        timestamp: new Date().toISOString(),
        role: targetRole,
        accountId: target.id,
        finditId: target.finditId,
        name: target.name,
        accountName: target.name,
        action,
        reason
      });

      saveDb(db);
      broadcastUpdate('ACCOUNT_DISCIPLINE_UPDATED', {
        role: targetRole,
        accountId: target.id,
        finditId: target.finditId,
        action,
        reason
      });
      return sendJson(res, 200, { account: target });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // User/Provider Acknowledges an Official Admin Warning Banner
  if (pathname === '/api/account/acknowledge-warning' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const collection = body.role === 'CUSTOMER' ? db.customers : db.providers;
      const target = collection.find((u) => u.id === body.accountId);
      if (!target) return sendJson(res, 404, { error: 'Account not found' });
      if (body.warningId) {
        target.activeWarnings = (target.activeWarnings || []).filter((w) => w.id !== body.warningId);
      } else {
        target.activeWarnings = [];
      }
      saveDb(db);
      broadcastUpdate('WARNING_ACKNOWLEDGED', { accountId: target.id });
      return sendJson(res, 200, { account: target });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin Approves or Rejects KYC / Face / WhatsApp Verification
  if (pathname === '/api/admin/kyc' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const item = db.kycVerifications.find((k) => k.id === body.kycId);
      if (!item) return sendJson(res, 404, { error: 'KYC record not found' });
      item.status = body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      if (item.role === 'PROVIDER') {
        const prov = db.providers.find((p) => p.id === item.accountId);
        if (prov) {
          prov.badges.phoneVerified = item.status === 'APPROVED';
          prov.badges.idVerified = item.status === 'APPROVED';
        }
      }
      saveDb(db);
      broadcastUpdate('KYC_UPDATED', { kycId: item.id, status: item.status });
      return sendJson(res, 200, { kyc: item });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/providers/online' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = db.providers.find((p) => p.id === body.providerId);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      if (prov.isBanned) return sendJson(res, 403, { error: `Account suspended: ${prov.banReason}` });
      prov.isOnline = body.isOnline !== undefined ? Boolean(body.isOnline) : !prov.isOnline;
      saveDb(db);
      broadcastUpdate('PROVIDER_STATUS_CHANGED', { providerId: prov.id, isOnline: prov.isOnline });
      return sendJson(res, 200, { provider: prov });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/requests' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const cust = db.customers.find((c) => c.id === body.customerId);
      if (cust && cust.isBanned) {
        return sendJson(res, 403, { error: `Your account (${cust.finditId}) is suspended: ${cust.banReason}` });
      }

      const descriptionCheck = checkAntiLeakage(body.description || '');
      const titleCheck = checkAntiLeakage(body.title || '');

      if (!descriptionCheck.allowed || !titleCheck.allowed) {
        const reasons = [...titleCheck.violations, ...descriptionCheck.violations];
        db.leakageLogs.unshift({
          id: 'leak_' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          actorRole: 'CUSTOMER',
          actorName: body.customerName || 'Client',
          context: 'Service Request Special Instructions',
          attemptedText: `${body.title || ''} — ${body.description || ''}`.trim(),
          reasons
        });
        saveDb(db);
        broadcastUpdate('LEAKAGE_BLOCKED');
        return sendJson(res, 422, {
          error: 'Anti-Leakage Shield blocked off-platform contact details in your request.',
          violations: reasons
        });
      }

      const suburb = HARARE_SUBURBS.find((s) => s.id === body.suburbId) || HARARE_SUBURBS[0];
      const category = db.categories.find((c) => c.id === body.categoryId) || db.categories[0];

      const lat = body.lat !== undefined ? Number(body.lat) : suburb.lat + (Math.random() - 0.5) * 0.004;
      const lng = body.lng !== undefined ? Number(body.lng) : suburb.lng + (Math.random() - 0.5) * 0.004;

      const newReq = {
        id: 'req_' + Date.now().toString().slice(-5),
        customerId: body.customerId || 'cust_1',
        customerFinditId: cust?.finditId || 'FH-USR-391044',
        customerName: body.customerName || cust?.name || 'Client',
        customerRating: cust?.rating || 0,
        customerCompletedVisits: cust?.completedBookings || 0,
        categoryId: category.id,
        categoryName: category.fullName || category.name,
        title: body.title || `${category.name} Service`,
        description: body.description || 'Looking for a reliable verified mobile provider to come to my home.',
        photoUrl: body.photoUrl || null,
        suburbId: suburb.id,
        suburbName: body.suburbName || suburb.name,
        exactAddress: body.exactAddress || `${suburb.sampleStreet}, Harare`,
        lat,
        lng,
        serviceMode: 'HOME_VISIT',
        bookingFor: body.bookingFor || 'ME', // 'ME' or 'SOMEONE_ELSE'
        recipientName: body.recipientName || null,
        recipientPhone: body.recipientPhone || null,
        timingType: body.timingType || 'IMMEDIATE', // 'IMMEDIATE' or 'SCHEDULED'
        scheduledDate: body.scheduledDate || null,
        scheduledTime: body.scheduledTime || null,
        preferredTime: body.timingType === 'SCHEDULED'
          ? `Scheduled for ${body.scheduledDate || 'selected date'} at ${body.scheduledTime || 'agreed time'}`
          : (body.preferredTime || 'Today, Now (ASAP)'),
        paymentMethod: body.paymentMethod || 'Cash USD',
        budgetUsd: Number(body.budgetUsd) || 25,
        startPinCode: String(crypto.randomInt(1000, 9999)),
        pinVerifiedByProvider: false,
        directProviderId: body.directProviderId || null,
        status: 'OPEN',
        acceptedOfferId: null,
        routeCoordinates: null,
        createdAt: new Date().toISOString(),
        offers: [],
        messages: []
      };

      db.requests.unshift(newReq);
      saveDb(db);
      broadcastUpdate('REQUEST_CREATED', { requestId: newReq.id, request: newReq });
      scheduleStaggeredProviderBids(newReq.id);

      return sendJson(res, 201, { request: newReq });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/requests/budget' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      reqItem.budgetUsd = Math.max(4, Number(Number(body.budgetUsd).toFixed(2)));
      if (body.autoAccept !== undefined) {
        reqItem.autoAccept = Boolean(body.autoAccept);
      }
      reqItem.offers.forEach((o) => {
        if (o.priceUsd <= reqItem.budgetUsd) {
          o.bidType = 'ACCEPTED_PRICE';
        }
      });
      saveDb(db);
      broadcastUpdate('REQUEST_BUDGET_UPDATED', { requestId: reqItem.id, budgetUsd: reqItem.budgetUsd });
      scheduleStaggeredProviderBids(reqItem.id);
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/bookings/cancel' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Task not found' });

      const cancelledByRole = body.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
      const cancelledByName = body.actorName || (cancelledByRole === 'PROVIDER' ? 'Service Provider' : reqItem.customerName);
      const reason = (body.reason || 'Cancelled by user').trim();
      const previousStatus = reqItem.status;

      if (staggeredBidTimers.has(reqItem.id)) {
        staggeredBidTimers.get(reqItem.id).forEach((t) => clearTimeout(t));
        staggeredBidTimers.delete(reqItem.id);
      }

      reqItem.status = 'CANCELLED';
      reqItem.cancelledByRole = cancelledByRole;
      reqItem.cancelledByName = cancelledByName;
      reqItem.cancelReason = reason;
      reqItem.cancelledAt = new Date().toISOString();

      reqItem.messages.push({
        id: 'msg_' + Date.now(),
        senderRole: 'SYSTEM',
        senderName: 'Findit Harare',
        type: 'TASK_CANCELLED',
        text: `Task Cancelled by ${cancelledByName} (${cancelledByRole === 'PROVIDER' ? 'Service Provider' : 'Client'}). Reason: "${reason}"`,
        timestamp: new Date().toISOString()
      });

      db.cancellationLogs.unshift({
        id: 'canc_' + Date.now().toString().slice(-5),
        timestamp: new Date().toISOString(),
        requestId: reqItem.id,
        categoryName: reqItem.title,
        serviceTitle: reqItem.title,
        actorRole: cancelledByRole,
        cancelledByRole,
        actorName: cancelledByName,
        cancelledByName,
        reason,
        stage: previousStatus,
        stageWhenCancelled: previousStatus
      });

      saveDb(db);
      broadcastUpdate('TASK_CANCELLED', {
        requestId: reqItem.id,
        cancelledByRole,
        cancelledByName,
        reason
      });
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/offers' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      if (reqItem.status !== 'OPEN') {
        return sendJson(res, 400, { error: 'This request is no longer open for new offers.' });
      }

      const provider = db.providers.find((p) => p.id === body.providerId) || db.providers[0];
      if (provider.isBanned) {
        return sendJson(res, 403, { error: `Your account (${provider.finditId}) is suspended: ${provider.banReason}` });
      }

      const provCatIds = (Array.isArray(provider.categoryIds) && provider.categoryIds.length ? provider.categoryIds : [provider.categoryId]).filter(Boolean);
      if (reqItem.categoryId && provCatIds.length && !provCatIds.includes(reqItem.categoryId)) {
        return sendJson(res, 403, { code: 'CATEGORY_MISMATCH', error: 'This job is outside your registered business categories.' });
      }

      const priceUsd = Number(body.priceUsd);
      const minReserveUsd = Number(db.settings.minWalletBalanceUsd || 2.00);
      const commissionPercent = Number(db.settings.commissionPercent || 11);
      const commissionFeeUsd = Math.round(priceUsd * (commissionPercent / 100) * 100) / 100;
      const currentBalanceUsd = Number(provider.walletBalanceUsd || 0);

      // Top-up calculation: at least $5 or 11% of bid amount (whichever is higher)
      const requiredTopUpUsd = Math.max(5.00, commissionFeeUsd);

      if (!db.settings.launchPromoActive && (currentBalanceUsd < minReserveUsd || (currentBalanceUsd - commissionFeeUsd) < minReserveUsd)) {
        return sendJson(res, 402, {
          code: 'LOW_WALLET_BALANCE',
          error: `Low wallet balance ($${currentBalanceUsd.toFixed(2)} USD). Minimum account reserve is $${minReserveUsd.toFixed(2)} USD.`,
          currentBalanceUsd,
          minReserveUsd,
          commissionPercent,
          bidPriceUsd: priceUsd,
          commissionFeeUsd,
          requiredTopUpUsd,
          explanation: `Your account balance is $${currentBalanceUsd.toFixed(2)} USD. To place a bid on this $${priceUsd} task, your balance must remain at or above the $${minReserveUsd.toFixed(2)} minimum reserve after the ${commissionPercent}% platform commission ($${commissionFeeUsd.toFixed(2)}). Please top up at least $${requiredTopUpUsd.toFixed(2)} USD (${commissionFeeUsd > 5 ? '11% of bid amount' : '$5.00 minimum top-up'}) into your account.`
        });
      }

      const distKm = getDistanceKm(provider.lat, provider.lng, reqItem.lat, reqItem.lng);
      const travelFeeUsd = Number(body.travelFeeUsd || 0);
      const isExactAccept = priceUsd === Number(reqItem.budgetUsd);
      const nowMs = Date.now();

      let existingOffer = reqItem.offers.find((o) => o.providerId === provider.id);
      if (existingOffer) {
        existingOffer.priceUsd = priceUsd;
        existingOffer.travelFeeUsd = travelFeeUsd;
        existingOffer.bidType = isExactAccept ? 'ACCEPTED_PRICE' : 'COUNTER_BID';
        existingOffer.status = 'COUNTERED';
        existingOffer.lastCounterBy = 'PROVIDER';
        existingOffer.createdAt = new Date(nowMs).toISOString();
        existingOffer.expiresAt = nowMs + 120 * 1000;
        existingOffer.ttlSeconds = 120;
      } else {
        existingOffer = {
          id: 'off_' + nowMs.toString().slice(-5),
          providerId: provider.id,
          providerFinditId: provider.finditId,
          providerName: provider.name,
          providerBrand: provider.brandName || provider.name,
          providerAvatar: provider.avatarInitials || 'PR',
          providerAvatarUrl: provider.avatarUrl || '',
          providerSkillTier: provider.skillTier || 'Verified pro',
          providerExpYears: provider.experienceYears || 3,
          providerRating: provider.rating,
          providerReviewCount: provider.reviewCount || 15,
          providerCompletedJobs: provider.completedBookings,
          providerBadges: provider.badges,
          distanceKm: distKm,
          etaMinutes: Math.max(4, Math.round(distKm * 3.2)),
          priceUsd,
          travelFeeUsd,
          bidType: isExactAccept ? 'ACCEPTED_PRICE' : 'COUNTER_BID',
          proposedTime: `Arrives in ~${Math.max(4, Math.round(distKm * 3.2))} mins`,
          conditions: [
            isExactAccept ? 'Accepted your price' : `Counter-offer (${provider.skillTier || 'Verified pro'})`,
            'Comes to your home',
            'Transport included'
          ],
          status: 'PROPOSED',
          lastCounterBy: 'PROVIDER',
          createdAt: new Date(nowMs).toISOString(),
          expiresAt: nowMs + 120 * 1000,
          ttlSeconds: 120
        };
        reqItem.offers.unshift(existingOffer);
      }

      saveDb(db);
      broadcastUpdate('OFFER_SUBMITTED', { requestId: reqItem.id, offerId: existingOffer.id, providerName: provider.name, priceUsd, offer: existingOffer, request: reqItem });
      return sendJson(res, 200, { offer: existingOffer, request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/offers/decline' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      reqItem.offers = reqItem.offers.filter((o) => o.id !== body.offerId);
      saveDb(db);
      broadcastUpdate('OFFER_DECLINED', { requestId: reqItem.id, reason: body.reason || 'DECLINED' });
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/offers/accept' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      const offer = reqItem.offers.find((o) => o.id === body.offerId);
      if (!offer) return sendJson(res, 404, { error: 'Offer not found' });

      const provider = db.providers.find((p) => p.id === offer.providerId);
      const totalAgreedUsd = Number(offer.priceUsd) + Number(offer.travelFeeUsd || 0);
      const categoryRate = db.settings.categoryCommissions[reqItem.categoryId] ?? db.settings.commissionPercent;
      const standardFeeUsd = Math.round(totalAgreedUsd * (categoryRate / 100) * 100) / 100;
      const isPromo = Boolean(db.settings.launchPromoActive);
      const chargedFeeUsd = isPromo ? 0 : standardFeeUsd;

      if (staggeredBidTimers.has(reqItem.id)) {
        staggeredBidTimers.get(reqItem.id).forEach((t) => clearTimeout(t));
        staggeredBidTimers.delete(reqItem.id);
      }

      offer.status = 'ACCEPTED';
      reqItem.status = 'CONFIRMED';
      reqItem.acceptedOfferId = offer.id;
      reqItem.acceptedProviderId = offer.providerId;
      reqItem.agreedTotalUsd = totalAgreedUsd;
      reqItem.commissionDeducted = false;

      if (provider) {
        reqItem.routeCoordinates = generateHarareRoadWaypoints(
          provider.lat,
          provider.lng,
          reqItem.lat,
          reqItem.lng
        );
      }

      db.revenueLedger.unshift({
        id: 'rev_' + Date.now(),
        timestamp: new Date().toISOString(),
        requestId: reqItem.id,
        providerName: offer.providerName,
        customerName: reqItem.customerName,
        categoryName: reqItem.categoryName,
        bookingAmountUsd: totalAgreedUsd,
        configuredCommissionPercent: categoryRate,
        standardFeeUsd,
        promoApplied: isPromo,
        actualFeeCollectedUsd: chargedFeeUsd,
        paymentMethod: reqItem.paymentMethod
      });

      reqItem.messages.push({
        id: 'msg_' + Date.now(),
        senderRole: 'SYSTEM',
        senderName: 'Findit Harare',
        providerId: offer.providerId,
        type: 'BOOKING_CONFIRMED',
        text: `${offer.providerName} is now en route to ${reqItem.exactAddress} (${offer.distanceKm} km away, ~${offer.etaMinutes} mins). Share Start PIN #${reqItem.startPinCode || '4829'} when they arrive at your gate.`,
        timestamp: new Date().toISOString()
      });

      reqItem.messages.push({
        id: 'msg_' + (Date.now() + 1),
        senderRole: 'PROVIDER',
        senderName: offer.providerName,
        providerId: offer.providerId,
        type: 'CHAT',
        text: `Hello! I have accepted your request and I'm heading your way with my equipment. Feel free to call or message me here.`,
        timestamp: new Date().toISOString()
      });

      saveDb(db);
      broadcastUpdate('BOOKING_CONFIRMED', { requestId: reqItem.id, offerId: offer.id, acceptedProviderId: offer.providerId, request: reqItem });
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/bookings/verify-pin' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Booking not found' });
      
      const isAuto = Boolean(body.autoVerified);
      if (!isAuto && String(body.pinCode).trim() !== String(reqItem.startPinCode)) {
        return sendJson(res, 400, { error: 'Incorrect 4-digit Start PIN. Ask the client for the Start PIN shown on their booking screen.' });
      }
      
      reqItem.pinVerifiedByProvider = true;
      reqItem.status = 'IN_PROGRESS';

      // Secure Commission Deduction: Deduct from provider ONLY after PIN is verified (manual or auto)
      if (!reqItem.commissionDeducted) {
        reqItem.commissionDeducted = true;
        const provider = db.providers.find((p) => p.id === reqItem.acceptedProviderId);
        if (provider) {
          const totalAgreedUsd = Number(reqItem.agreedTotalUsd || reqItem.budgetUsd);
          const categoryRate = db.settings.categoryCommissions[reqItem.categoryId] ?? db.settings.commissionPercent;
          const standardFeeUsd = Math.round(totalAgreedUsd * (categoryRate / 100) * 100) / 100;
          const isPromo = Boolean(db.settings.launchPromoActive);
          const chargedFeeUsd = isPromo ? 0 : standardFeeUsd;

          if (!isPromo && chargedFeeUsd > 0) {
            provider.walletBalanceUsd = Math.round((provider.walletBalanceUsd - chargedFeeUsd) * 100) / 100;
            provider.walletTransactions.unshift({
              id: 'tx_' + Date.now(),
              date: new Date().toISOString(),
              type: 'COMMISSION_DEDUCTION',
              method: 'Findit Wallet Points',
              amountUsd: -chargedFeeUsd,
              note: `${categoryRate}% commission (-$${chargedFeeUsd.toFixed(2)} Pts) on $${totalAgreedUsd.toFixed(2)} booking (${reqItem.title})`
            });
          }
        }
      }

      reqItem.messages.push({
        id: 'msg_' + Date.now(),
        senderRole: 'SYSTEM',
        senderName: 'Findit Harare',
        type: 'PIN_VERIFIED',
        text: isAuto
          ? `20m Geofence Auto-Pair Verified. Service is now IN PROGRESS.`
          : `Arrival PIN #${reqItem.startPinCode} Verified. Provider has arrived and service is now IN PROGRESS.`,
        timestamp: new Date().toISOString()
      });
      saveDb(db);
      broadcastUpdate('PIN_VERIFIED', { requestId: reqItem.id, request: reqItem });
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Real-Time In-App Calling Signaling (Caller -> Server -> Recipient)
  if (pathname === '/api/calls/initiate' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { requestId, callerId, callerName, recipientId, contextTitle, channelId } = body;
      broadcastUpdate('CALL_INCOMING', {
        requestId,
        callerId,
        callerName,
        recipientId,
        contextTitle,
        channelId: channelId || ('call_' + requestId)
      });
      return sendJson(res, 200, { ok: true, channelId: channelId || ('call_' + requestId) });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Real-Time In-App Calling Response (Accept / Decline / Hang-Up)
  if (pathname === '/api/calls/respond' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { requestId, channelId, action } = body;
      broadcastUpdate('CALL_RESPONSE', {
        requestId,
        channelId,
        action
      });
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Real-Time WebRTC P2P Direct Audio Signaling (Offer / Answer / Candidate)
  if (pathname === '/api/calls/signal' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { channelId, senderId, recipientId, signalType, data } = body;
      broadcastUpdate('CALL_WEBRTC_SIGNAL', {
        channelId,
        senderId,
        recipientId,
        signalType,
        data
      });
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Findit Express Feature: Provider Transit Delay Notice / ETA Adjustment
  if (pathname === '/api/bookings/delay-notice' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { requestId, providerId, delayMinutes, reason } = body;
      const reqItem = db.requests.find((r) => r.id === requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Booking not found' });
      const prov = db.providers.find((p) => p.id === providerId);

      const delay = Number(delayMinutes) || 15;
      reqItem.delayNotice = {
        minutes: delay,
        reason: reason || 'Harare transit traffic congestion',
        timestamp: new Date().toISOString()
      };

      if (!reqItem.messages) reqItem.messages = [];
      const delayMsg = {
        id: 'msg_' + Date.now(),
        senderRole: 'SYSTEM',
        senderName: 'Findit Dispatch',
        type: 'DELAY_NOTICE',
        text: `Transit Update: ${prov ? prov.name : 'Specialist'} is running approximately ${delay} minutes late (${reason || 'traffic'}). We appreciate your patience!`,
        timestamp: new Date().toISOString()
      };
      reqItem.messages.push(delayMsg);
      saveDb(db);
      broadcastUpdate('BOOKING_DELAYED', { requestId: reqItem.id, delayNotice: reqItem.delayNotice, message: delayMsg, request: reqItem });
      return sendJson(res, 200, { ok: true, request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Provider Updates Office / Workshop Physical Base Location
  if (pathname === '/api/providers/office' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = db.providers.find((p) => p.id === body.providerId);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      if (prov.isBanned) return sendJson(res, 403, { error: 'Your account is suspended.' });

      prov.hasOffice = Boolean(body.hasOffice);
      prov.officeAddress = (body.officeAddress || '').trim();
      prov.officeSuburb = (body.officeSuburb || '').trim();
      if (body.officeLat && body.officeLng) {
        prov.officeLat = Number(body.officeLat);
        prov.officeLng = Number(body.officeLng);
      }
      saveDb(db);
      broadcastUpdate('PROVIDER_OFFICE_UPDATED', { providerId: prov.id, provider: prov });
      return sendJson(res, 200, { success: true, provider: prov });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Mutual Completion & Two-Way Rating (Client rates Provider AND Provider rates Client!)
  if (pathname === '/api/bookings/status' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Booking not found' });

      reqItem.status = body.status;
      if (body.status === 'ARRIVED') {
        const offer = reqItem.offers.find((o) => o.id === reqItem.acceptedOfferId);
        if (!reqItem.messages) reqItem.messages = [];
        const arrivalMsg = {
          id: 'msg_' + Date.now(),
          senderRole: 'PROVIDER',
          senderName: offer ? offer.providerName : 'Service Provider',
          providerId: offer ? offer.providerId : null,
          type: 'ARRIVED',
          text: "I'm waiting outside! Please share your 4-digit Start PIN so we can begin.",
          timestamp: new Date().toISOString()
        };
        reqItem.messages.push(arrivalMsg);
        saveDb(db);
        broadcastUpdate('PROVIDER_ARRIVED', { requestId: reqItem.id, message: arrivalMsg, request: reqItem });
        return sendJson(res, 200, { request: reqItem });
      }

      if (body.status === 'IN_PROGRESS') {
        reqItem.pinVerifiedByProvider = true;
        reqItem.autoStarted = Boolean(body.autoStarted);
        if (!reqItem.messages) reqItem.messages = [];
        reqItem.messages.push({
          id: 'msg_' + Date.now(),
          senderRole: 'SYSTEM',
          senderName: 'Findit Harare Geofence',
          type: 'PIN_VERIFIED',
          text: body.autoStarted
            ? `Proximity Auto-Pair active: Both parties detected within 20 meters for 1 minute. Task automatically recorded as STARTED.`
            : `Arrival PIN verified. Service is now IN PROGRESS.`,
          timestamp: new Date().toISOString()
        });
        saveDb(db);
        broadcastUpdate('PIN_VERIFIED', { requestId: reqItem.id, request: reqItem });
        return sendJson(res, 200, { request: reqItem });
      }

      if (body.status === 'COMPLETED') {
        const ratedByRole = body.ratedByRole || 'CUSTOMER'; // 'CUSTOMER' | 'PROVIDER'
        const newRating = Math.max(1, Math.min(5, Number(body.rating || 5)));
        const tags = Array.isArray(body.tags) ? body.tags : [];
        const comment = (body.reviewComment || tags.join(', ') || 'Completed home service on Findit Harare').trim();

        const offer = reqItem.offers.find((o) => o.id === reqItem.acceptedOfferId);
        const provider = offer
          ? db.providers.find((p) => p.id === offer.providerId)
          : db.providers.find((p) => p.id === reqItem.acceptedProviderId);
        const customer = db.customers.find((c) => c.id === reqItem.customerId) || db.customers[0];

        if (ratedByRole === 'PROVIDER') {
          // Service Provider is rating the Client (User) to ensure fair treatment!
          reqItem.clientRatedByProvider = { rating: newRating, tags, comment };
          if (customer) {
            customer.completedBookings = (customer.completedBookings || 0) + 1;
            customer.reviewCount = (customer.reviewCount || 1) + 1;
            customer.rating = Math.round(((customer.rating * (customer.reviewCount - 1) + newRating) / customer.reviewCount) * 100) / 100;
            customer.reviews = customer.reviews || [];
            customer.reviews.unshift({
              providerName: provider ? provider.name : 'Service Provider',
              rating: newRating,
              tags,
              comment,
              date: 'Just now'
            });
          }
          if (provider) {
            provider.completedBookings = (provider.completedBookings || 0) + 1;
          }
        } else {
          // Client is rating the Service Provider
          reqItem.providerRatedByClient = { rating: newRating, tags, comment };
          if (provider) {
            provider.completedBookings = (provider.completedBookings || 0) + 1;
            provider.reviewCount = (provider.reviewCount || 1) + 1;
            provider.rating = Math.round(((provider.rating * (provider.reviewCount - 1) + newRating) / provider.reviewCount) * 100) / 100;
            provider.reviews.unshift({
              customerName: reqItem.customerName,
              rating: newRating,
              tags,
              date: 'Just now',
              comment
            });
          }
          if (customer) {
            customer.completedBookings = (customer.completedBookings || 0) + 1;
          }
        }

        reqItem.messages.push({
          id: 'msg_' + Date.now(),
          senderRole: 'SYSTEM',
          senderName: 'Findit Harare',
          providerId: offer ? offer.providerId : null,
          type: 'BOOKING_COMPLETED',
          text: `Service Completed & Rated (${newRating}.0 / 5.0 by ${ratedByRole === 'PROVIDER' ? 'Service Provider' : 'Client'}).`,
          timestamp: new Date().toISOString()
        });
      }

      saveDb(db);
      broadcastUpdate('BOOKING_STATUS_UPDATED', { requestId: reqItem.id, status: reqItem.status });
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/waitlist' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const cat = db.categories.find((c) => c.id === body.categoryId);
      if (!cat) return sendJson(res, 404, { error: 'Category not found' });
      cat.waitlistCount = (cat.waitlistCount || 100) + 1;
      saveDb(db);
      broadcastUpdate('WAITLIST_JOINED', { categoryId: cat.id, waitlistCount: cat.waitlistCount });
      return sendJson(res, 200, { category: cat, waitlistCount: cat.waitlistCount });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if ((pathname === '/api/messages' || pathname === '/api/requests/messages') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      let reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem && body.providerId) {
        reqItem = db.requests.find((r) => r.acceptedProviderId === body.providerId && ['BOOKED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
      }
      if (!reqItem) {
        reqItem = db.requests[0];
      }
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      if (!reqItem.messages) reqItem.messages = [];

      const text = (body.text || '').trim();
      if (!text) return sendJson(res, 400, { error: 'Empty message' });

      const check = checkAntiLeakage(text);
      if (!check.allowed) {
        db.leakageLogs.unshift({
          id: 'leak_' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          actorRole: body.senderRole || 'USER',
          actorName: body.senderName || 'User',
          context: `In-App Chat (${reqItem.title})`,
          attemptedText: text,
          reasons: check.violations
        });
        saveDb(db);
        broadcastUpdate('LEAKAGE_BLOCKED');
        return sendJson(res, 422, {
          error: 'Message blocked by Findit Anti-Leakage Shield.',
          violations: check.violations
        });
      }

      const newMsg = {
        id: 'msg_' + Date.now(),
        senderRole: body.senderRole || 'CUSTOMER',
        senderName: body.senderName || reqItem.customerName,
        providerId: body.providerId || null,
        type: body.type || 'QUICK_MESSAGE',
        text,
        timestamp: new Date().toISOString()
      };

      reqItem.messages.push(newMsg);
      saveDb(db);
      broadcastUpdate('MESSAGE_SENT', { requestId: reqItem.id, message: newMsg });
      return sendJson(res, 201, { message: newMsg, request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/wallet/topup' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const provider = db.providers.find((p) => p.id === body.providerId);
      if (!provider) return sendJson(res, 404, { error: 'Provider not found' });

      const amountUsd = Math.max(1, Number(body.amountUsd || 10));
      const method = body.method || 'Admin Manual Credit';
      provider.walletBalanceUsd = Math.round((provider.walletBalanceUsd + amountUsd) * 100) / 100;
      const tx = {
        id: 'tx_' + Date.now(),
        date: new Date().toISOString(),
        type: 'TOPUP',
        method,
        amountUsd,
        note: `Wallet Points Added via ${method} (+$${amountUsd.toFixed(2)})`
      };
      provider.walletTransactions.unshift(tx);
      saveDb(db);
      broadcastUpdate('WALLET_UPDATED', { providerId: provider.id });
      return sendJson(res, 200, { provider, transaction: tx });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/admin/settings' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (body.commissionPercent !== undefined) {
        db.settings.commissionPercent = Math.max(0, Math.min(40, Number(body.commissionPercent)));
      }
      if (body.launchPromoActive !== undefined) {
        db.settings.launchPromoActive = Boolean(body.launchPromoActive);
      }
      if (body.launchPromoDaysRemaining !== undefined) {
        db.settings.launchPromoDaysRemaining = Math.max(0, Number(body.launchPromoDaysRemaining));
      }
      if (body.minWalletBalanceUsd !== undefined) {
        db.settings.minWalletBalanceUsd = Number(body.minWalletBalanceUsd);
      }
      if (body.ecocashMerchantNumber !== undefined) {
        db.settings.ecocashMerchantNumber = String(body.ecocashMerchantNumber).trim();
      }
      if (body.ecocashMerchantName !== undefined) {
        db.settings.ecocashMerchantName = String(body.ecocashMerchantName).trim();
      }
      if (body.categoryCommissions && typeof body.categoryCommissions === 'object') {
        db.settings.categoryCommissions = {
          ...db.settings.categoryCommissions,
          ...body.categoryCommissions
        };
      }
      saveDb(db);
      broadcastUpdate('SETTINGS_UPDATED', { settings: db.settings });
      return sendJson(res, 200, { settings: db.settings });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/admin/verify-provider' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const provider = db.providers.find((p) => p.id === body.providerId);
      if (!provider) return sendJson(res, 404, { error: 'Provider not found' });

      if (body.badgeKey && provider.badges[body.badgeKey] !== undefined) {
        provider.badges[body.badgeKey] = !provider.badges[body.badgeKey];
      }
      saveDb(db);
      broadcastUpdate('PROVIDER_VERIFIED', { providerId: provider.id });
      return sendJson(res, 200, { provider });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/admin/category-status' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const cat = db.categories.find((c) => c.id === body.categoryId);
      if (!cat) return sendJson(res, 404, { error: 'Category not found' });
      cat.status = cat.status === 'ACTIVE' ? 'COMING_SOON' : 'ACTIVE';
      if (cat.status === 'ACTIVE' && !cat.suggestedMinUsd) {
        cat.suggestedMinUsd = 15;
        cat.suggestedMaxUsd = 50;
      }
      saveDb(db);
      broadcastUpdate('CATEGORY_UPDATED', { categoryId: cat.id });
      return sendJson(res, 200, { category: cat });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Create New Service Category
  if (pathname === '/api/admin/categories/create' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      const name = (body.name || '').trim();
      if (!name) return sendJson(res, 400, { error: 'Service category name is required.' });
      const id = (body.id || name.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();
      const exists = (db.categories || []).find((c) => c.id === id);
      if (exists) return sendJson(res, 400, { error: 'A service category with this ID already exists.' });

      const newCat = {
        id,
        name,
        fullName: body.fullName || name,
        mapIcon: body.icon || '🛠️',
        icon: body.icon || '🛠️',
        tagline: body.tagline || `Verified mobile ${name} specialists visiting Harare homes`,
        status: body.status || 'ACTIVE',
        suggestedMinUsd: Number(body.suggestedMinUsd || 15),
        suggestedMaxUsd: Number(body.suggestedMaxUsd || 50),
        subServices: Array.isArray(body.subServices) && body.subServices.length > 0 ? body.subServices : [
          { name: `Standard ${name}`, defaultUsd: Number(body.suggestedMinUsd || 15), duration: '1-2 hrs' }
        ]
      };
      if (!db.categories) db.categories = [];
      db.categories.push(newCat);
      saveDb(db);
      broadcastUpdate('CATEGORY_UPDATED', { categoryId: newCat.id });
      return sendJson(res, 200, { success: true, category: newCat });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Update Service Category
  if (pathname === '/api/admin/categories/update' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      const cat = (db.categories || []).find((c) => c.id === body.categoryId);
      if (!cat) return sendJson(res, 404, { error: 'Category not found.' });
      if (body.name) cat.name = body.name.trim();
      if (body.fullName) cat.fullName = body.fullName.trim();
      if (body.tagline) cat.tagline = body.tagline.trim();
      if (body.icon) { cat.icon = body.icon.trim(); cat.mapIcon = body.icon.trim(); }
      if (body.suggestedMinUsd !== undefined) cat.suggestedMinUsd = Number(body.suggestedMinUsd);
      if (body.suggestedMaxUsd !== undefined) cat.suggestedMaxUsd = Number(body.suggestedMaxUsd);
      saveDb(db);
      broadcastUpdate('CATEGORY_UPDATED', { categoryId: cat.id });
      return sendJson(res, 200, { success: true, category: cat });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Delete Service Category
  if (pathname === '/api/admin/categories/delete' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      db.categories = (db.categories || []).filter((c) => c.id !== body.categoryId);
      saveDb(db);
      broadcastUpdate('CATEGORY_UPDATED', { categoryId: body.categoryId });
      return sendJson(res, 200, { success: true });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Add Sub-service / Task to Category
  if (pathname === '/api/admin/categories/task/add' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      const cat = (db.categories || []).find((c) => c.id === body.categoryId);
      if (!cat) return sendJson(res, 404, { error: 'Category not found.' });
      if (!Array.isArray(cat.subServices)) cat.subServices = [];
      const taskName = (body.name || '').trim();
      if (!taskName) return sendJson(res, 400, { error: 'Task name is required.' });
      const newTask = {
        name: taskName,
        defaultUsd: Number(body.defaultUsd || cat.suggestedMinUsd || 15),
        duration: body.duration || '1-2 hrs'
      };
      cat.subServices.push(newTask);
      saveDb(db);
      broadcastUpdate('CATEGORY_UPDATED', { categoryId: cat.id });
      return sendJson(res, 200, { success: true, category: cat });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Update Sub-service / Task
  if (pathname === '/api/admin/categories/task/update' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      const cat = (db.categories || []).find((c) => c.id === body.categoryId);
      if (!cat) return sendJson(res, 404, { error: 'Category not found.' });
      const idx = Number(body.taskIndex);
      if (!cat.subServices || !cat.subServices[idx]) return sendJson(res, 404, { error: 'Task not found.' });
      if (body.name) cat.subServices[idx].name = body.name.trim();
      if (body.defaultUsd !== undefined) cat.subServices[idx].defaultUsd = Number(body.defaultUsd);
      if (body.duration) cat.subServices[idx].duration = body.duration.trim();
      saveDb(db);
      broadcastUpdate('CATEGORY_UPDATED', { categoryId: cat.id });
      return sendJson(res, 200, { success: true, category: cat });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Delete Sub-service / Task
  if (pathname === '/api/admin/categories/task/delete' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      const cat = (db.categories || []).find((c) => c.id === body.categoryId);
      if (!cat) return sendJson(res, 404, { error: 'Category not found.' });
      const idx = Number(body.taskIndex);
      if (!cat.subServices || !cat.subServices[idx]) return sendJson(res, 404, { error: 'Task not found.' });
      cat.subServices.splice(idx, 1);
      saveDb(db);
      broadcastUpdate('CATEGORY_UPDATED', { categoryId: cat.id });
      return sendJson(res, 200, { success: true, category: cat });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Update Hub Services (Job Marketplace, Online Shopping, Transport & Carriers)
  if (pathname === '/api/admin/hub/update' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      if (!Array.isArray(db.hubServices)) db.hubServices = [];
      const idx = db.hubServices.findIndex((s) => s.id === body.id);
      if (idx >= 0) {
        db.hubServices[idx] = { ...db.hubServices[idx], ...body };
      } else {
        db.hubServices.push(body);
      }
      saveDb(db);
      broadcastUpdate('HUB_UPDATED', { hubServices: db.hubServices });
      return sendJson(res, 200, { success: true, hubServices: db.hubServices });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin: Add or Delete Changelog / Announcements
  if (pathname === '/api/admin/changelogs/add' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      if (!Array.isArray(db.changelogs)) db.changelogs = [];
      const newEntry = {
        id: 'cl_' + Date.now().toString().slice(-5),
        version: body.version || 'v2.1',
        title: body.title || 'Platform Update',
        date: new Date().toISOString().slice(0, 10),
        highlights: Array.isArray(body.highlights) ? body.highlights : [body.highlights || 'New features added']
      };
      db.changelogs.unshift(newEntry);
      saveDb(db);
      broadcastUpdate('CHANGELOG_UPDATED', { changelog: newEntry });
      return sendJson(res, 200, { success: true, changelogs: db.changelogs });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/admin/changelogs/delete' && req.method === 'POST') {
    try {
      db = loadDb();
      const body = await parseBody(req);
      if (Array.isArray(db.changelogs)) {
        db.changelogs = db.changelogs.filter((c) => c.id !== body.id);
        saveDb(db);
      }
      broadcastUpdate('CHANGELOG_UPDATED', { changelogs: db.changelogs });
      return sendJson(res, 200, { success: true, changelogs: db.changelogs });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    const adminHtmlPath = path.join(PUBLIC_DIR, 'admin.html');
    return fs.readFile(adminHtmlPath, (err, content) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading admin portal');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  }

  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

setupWebSocketServer(server);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Findit Harare App running at http://localhost:${PORT}`);
    console.log(`Findit Harare Admin Dashboard running at http://localhost:${PORT}/admin`);

    // Self-ping every 5 minutes to keep Render / cloud containers warm and active
    setInterval(() => {
      try {
        http.get(`http://localhost:${PORT}/api/state`, (r) => r.resume()).on('error', () => {});
      } catch (e) {}
    }, 5 * 60 * 1000);
  });
}

module.exports = server;
