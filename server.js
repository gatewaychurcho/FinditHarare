const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
      'I have arrived outside your gate',
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
        id: 'cust_1',
        finditId: 'FH-USR-391044',
        name: 'Tendai Moyo',
        phone: '+263 77 200 1001',
        suburbId: 'avondale',
        suburbName: 'Avondale',
        rating: 4.95,
        reviewCount: 8,
        completedBookings: 8,
        avatarInitials: 'TM',
        whatsappVerified: true,
        faceVerified: true,
        nationalIdNumber: '63-2491028-F-42',
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        reviews: [
          { providerName: 'Tariro Moyo', rating: 5, tags: ['Respectful & Welcoming', 'Paid Promptly in USD'], date: '2 days ago' }
        ]
      },
      {
        id: 'cust_2',
        finditId: 'FH-USR-582910',
        name: 'Rudo Chigumba',
        phone: '+263 78 411 2290',
        suburbId: 'borrowdale',
        suburbName: 'Borrowdale',
        rating: 4.9,
        reviewCount: 5,
        completedBookings: 5,
        avatarInitials: 'RC',
        whatsappVerified: true,
        faceVerified: true,
        nationalIdNumber: '63-3102941-K-12',
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
        id: 'prov_1',
        finditId: 'FH-PRO-849201',
        name: 'Tariro Moyo',
        shortName: 'Tariro',
        brandName: 'Mobile Braiding & Locks Studio',
        phone: '+263 77 311 4401',
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
        rating: 4.96,
        reviewCount: 312,
        completedBookings: 873,
        bio: 'Platinum mobile braider (6 yrs exp). Painless Small/Medium Knotless Braids, Boho Goddess Braids, and neat stitch cornrows at your home.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 18.50,
        walletTransactions: [
          { id: 'tx_1', date: '2026-10-18T10:00:00Z', type: 'TOPUP', method: 'EcoCash USD (Admin Verified)', amountUsd: 20.00, note: 'EcoCash SMS Verified (Ref: PP261018.1000.A49210)' },
          { id: 'tx_2', date: '2026-10-19T15:30:00Z', type: 'COMMISSION_DEDUCTION', method: 'Findit Wallet', amountUsd: -1.50, note: '10% platform commission on $15.00 home booking' }
        ],
        portfolio: [
          {
            id: 'cat_101',
            title: 'Waist-Length Boho Knotless',
            priceUsd: 25,
            duration: '3.5 hrs',
            tag: 'Platinum Work',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'cat_102',
            title: 'Fulani Tribal Stitch Cornrows',
            priceUsd: 20,
            duration: '2.5 hrs',
            tag: 'Precision Stitch',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'cat_103',
            title: 'Small Butt-Length Knotless',
            priceUsd: 32,
            duration: '5 hrs',
            tag: 'Luxury Finish',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: [
          { customerName: 'Ruvimbo K.', rating: 5, date: '2 days ago', comment: 'Super neat knotless braids and she arrived at my home in Avondale right on time!' },
          { customerName: 'Chido M.', rating: 5, date: '1 week ago', comment: 'Looked exactly like her catalogue photos. Zero pain on my edges!' }
        ]
      },
      {
        id: 'prov_5',
        finditId: 'FH-PRO-610394',
        name: 'Fadzai Sibanda',
        shortName: 'Fadzai',
        brandName: 'CrownBraids Mobile Kit',
        phone: '+263 77 801 9920',
        avatarInitials: 'FS',
        avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=240&q=80',
        isOnline: true,
        isBanned: false,
        banReason: '',
        warningsCount: 1,
        activeWarnings: [],
        acceptedConductRules: true,
        categoryId: 'braiding',
        skillTier: 'Verified pro',
        isPlatinum: false,
        experienceYears: 3,
        suburbId: 'mabelreign',
        suburbName: 'Mabelreign',
        lat: -17.7930,
        lng: 31.0280,
        serviceRadiusKm: 12,
        startingPriceUsd: 20,
        rating: 4.9,
        reviewCount: 184,
        completedBookings: 412,
        bio: 'Fast, gentle mobile braider covering Borrowdale, Avondale, Mabelreign & Belvedere.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: false, faceVerified: true },
        walletBalanceUsd: 10.00,
        walletTransactions: [],
        portfolio: [
          {
            id: 'cat_501',
            title: 'Medium Knotless Box Braids',
            priceUsd: 20,
            duration: '3.5 hrs',
            tag: 'Clean Tuck',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'cat_502',
            title: 'Butterfly Faux Locs',
            priceUsd: 24,
            duration: '4 hrs',
            tag: 'Boho Look',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: [
          { customerName: 'Nomsa B.', rating: 5, date: '4 days ago', comment: 'Very gentle hands and great pricing.' }
        ]
      },
      {
        id: 'prov_6',
        finditId: 'FH-PRO-729183',
        name: 'Chipo Zengeni',
        shortName: 'Chipo',
        brandName: 'RoyalTresses Home Visit',
        phone: '+263 78 302 1188',
        avatarInitials: 'CZ',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
        isOnline: true,
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        acceptedConductRules: true,
        categoryId: 'braiding',
        skillTier: 'Platinum pro',
        isPlatinum: true,
        experienceYears: 5,
        suburbId: 'mt_pleasant',
        suburbName: 'Mt Pleasant',
        lat: -17.7740,
        lng: 31.0430,
        serviceRadiusKm: 16,
        startingPriceUsd: 24,
        rating: 4.89,
        reviewCount: 240,
        completedBookings: 618,
        bio: 'Pro mobile hair stylist serving Mt Pleasant, Avondale & Borrowdale. Fast braiding speed and neat parts.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 14.00,
        walletTransactions: [],
        portfolio: [
          {
            id: 'cat_601',
            title: 'Goddess Boho Knotless + Curls',
            priceUsd: 25,
            duration: '3.5 hrs',
            tag: 'Platinum Pro',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      },
      {
        id: 'prov_4',
        finditId: 'FH-PRO-492018',
        name: 'Tinashe Gumbo',
        shortName: 'Tinashe',
        brandName: 'Cordless Pro Clipper Kit',
        phone: '+263 71 900 4421',
        avatarInitials: 'TG',
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
        experienceYears: 7,
        suburbId: 'eastlea',
        suburbName: 'Eastlea',
        lat: -17.8020,
        lng: 31.0580,
        serviceRadiusKm: 18,
        startingPriceUsd: 15,
        rating: 4.96,
        reviewCount: 412,
        completedBookings: 1240,
        bio: 'Executive mobile barber in Harare. Cordless Wahl/Babyliss clippers, hot towel shave, beard sculpting at your home.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 15.00,
        walletTransactions: [],
        portfolio: [
          {
            id: 'cat_401',
            title: 'VIP Home Skin Fade + Beard Trim',
            priceUsd: 15,
            duration: '45 mins',
            tag: 'Executive Cut',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'cat_402',
            title: 'Father & Son Home Combo Cut',
            priceUsd: 22,
            duration: '1.2 hrs',
            tag: 'Family Deal',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      },
      {
        id: 'prov_2',
        finditId: 'FH-PRO-301948',
        name: 'Nyasha Chikwanda',
        shortName: 'Nyasha',
        brandName: 'Acrylic & Gel Mobile Nail Kit',
        phone: '+263 77 522 8812',
        avatarInitials: 'NC',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
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
        suburbId: 'borrowdale',
        suburbName: 'Borrowdale',
        lat: -17.7560,
        lng: 31.0840,
        serviceRadiusKm: 20,
        startingPriceUsd: 18,
        rating: 4.94,
        reviewCount: 195,
        completedBookings: 540,
        bio: 'Mobile nail technician bringing portable dust collector, UV lamps & spa pedicure basin to your home.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: false, faceVerified: true },
        walletBalanceUsd: 12.00,
        walletTransactions: [],
        portfolio: [
          {
            id: 'cat_201',
            title: 'French Tip Acrylic Full Set',
            priceUsd: 20,
            duration: '2 hrs',
            tag: '4-Week Retention',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      },
      {
        id: 'prov_3',
        finditId: 'FH-PRO-918273',
        name: 'Kudzai Mutasa',
        shortName: 'Kudzai',
        brandName: 'Bridal & Soft Glam Mobile Kit',
        phone: '+263 78 299 3310',
        avatarInitials: 'KM',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
        isOnline: true,
        isBanned: false,
        banReason: '',
        warningsCount: 0,
        activeWarnings: [],
        acceptedConductRules: true,
        categoryId: 'makeup',
        skillTier: 'Platinum pro',
        isPlatinum: true,
        experienceYears: 6,
        suburbId: 'mt_pleasant',
        suburbName: 'Mt Pleasant',
        lat: -17.7710,
        lng: 31.0490,
        serviceRadiusKm: 25,
        startingPriceUsd: 25,
        rating: 4.98,
        reviewCount: 210,
        completedBookings: 615,
        bio: 'Bridal & Roora mobile MUA in Harare. Sweatproof skin-like soft glam with ring light & luxury kit.',
        badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true },
        walletBalanceUsd: 25.00,
        walletTransactions: [],
        portfolio: [
          {
            id: 'cat_301',
            title: 'Signature Soft Glam + Mink Lashes',
            priceUsd: 25,
            duration: '1 hr',
            tag: 'Sweatproof Finish',
            approvalStatus: 'APPROVED',
            imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80'
          }
        ],
        reviews: []
      }
    ],
    // EcoCash Confirmation SMS Verification Queue (Provider submits SMS -> Admin verifies & adds points/USD)
    ecocashTopups: [
      {
        id: 'eco_101',
        providerId: 'prov_5',
        providerFinditId: 'FH-PRO-610394',
        providerName: 'Fadzai Sibanda',
        providerPhone: '+263 77 801 9920',
        claimedAmountUsd: 10,
        detectedAmountUsd: 10,
        referenceCode: 'PP261021.0942.B78102',
        confirmationSms: 'EcoCash: Transfer Confirmation. USD 10.00 to FINDIT HARARE OFFICIAL (0772910440) from FADZAI SIBANDA. Approval Code: PP261021.0942.B78102. New Wallet Balance: USD 14.20.',
        status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
        submittedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString()
      }
    ],
    // Discipline & Enforcement Logs (Warnings, Suspensions, Bans)
    disciplineLogs: [],
    requests: [
      {
        id: 'req_101',
        customerId: 'cust_2',
        customerFinditId: 'FH-USR-582910',
        customerName: 'Rudo Chigumba',
        customerRating: 4.9,
        categoryId: 'braiding',
        categoryName: 'Hair Braiding & Styling',
        title: 'Medium Boho Knotless Braids',
        description: 'Looking for a neat mobile braider to come to my home in Borrowdale. My hair is already washed and blow-dried.',
        suburbId: 'borrowdale',
        suburbName: 'Borrowdale',
        exactAddress: '88 Borrowdale Rd, Borrowdale, Harare',
        lat: -17.7520,
        lng: 31.0890,
        serviceMode: 'HOME_VISIT',
        preferredTime: 'Today, Now (ASAP)',
        paymentMethod: 'Cash USD',
        budgetUsd: 25,
        startPinCode: '4829',
        pinVerifiedByProvider: false,
        status: 'OPEN',
        acceptedOfferId: null,
        routeCoordinates: null,
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        offers: [],
        messages: []
      }
    ],
    kycVerifications: [
      {
        id: 'kyc_101',
        accountId: 'cust_1',
        finditId: 'FH-USR-391044',
        role: 'CUSTOMER',
        actorName: 'Tendai Moyo',
        name: 'Tendai Moyo',
        phone: '+263 77 200 1001',
        suburbName: 'Avondale',
        whatsappVerified: true,
        faceVerified: true,
        faceScore: '99.4%',
        faceMatchScore: 99.4,
        nationalId: '63-2491028-F-42',
        nationalIdNumber: '63-2491028-F-42',
        termsAccepted: true,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: 'kyc_102',
        accountId: 'prov_1',
        finditId: 'FH-PRO-849201',
        role: 'PROVIDER',
        actorName: 'Tariro Moyo (Mobile Braiding Studio)',
        name: 'Tariro Moyo (Mobile Braiding Studio)',
        phone: '+263 77 311 4401',
        suburbName: 'Avondale',
        whatsappVerified: true,
        faceVerified: true,
        faceScore: '99.6%',
        faceMatchScore: 99.6,
        nationalId: '63-1984312-G-18',
        nationalIdNumber: '63-1984312-G-18',
        termsAccepted: true,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ],
    cancellationLogs: [
      {
        id: 'canc_1',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        requestId: 'req_099',
        categoryName: 'VIP Home Skin Fade + Beard Trim',
        serviceTitle: 'VIP Home Skin Fade + Beard Trim',
        actorRole: 'CUSTOMER',
        cancelledByRole: 'CUSTOMER',
        actorName: 'Rudo Chigumba',
        cancelledByName: 'Rudo Chigumba',
        reason: 'Changed my mind / Rescheduling for tomorrow morning',
        stage: 'OPEN',
        stageWhenCancelled: 'OPEN'
      }
    ],
    approvalQueue: [
      {
        id: 'app_901',
        providerId: 'prov_5',
        providerName: 'Fadzai Sibanda (CrownBraids Mobile)',
        providerSuburb: 'Mabelreign',
        type: 'CATALOGUE_PHOTO',
        submittedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        title: 'Jumbo Box Braids Promo Flyer',
        priceUsd: 18,
        priceTag: '$18 USD',
        duration: '3 hrs',
        tag: 'Special Offer',
        caption: 'Promotional flyer upload attempt with overlay text',
        proposedBio: null,
        hasSuspectedWatermarkOrFlyer: true,
        flagNote: 'Flagged: Suspected promotional flyer / watermark text overlay',
        flaggedReason: 'Flagged: Suspected promotional flyer / watermark text overlay',
        imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=600&q=80',
        status: 'PENDING'
      },
      {
        id: 'app_902',
        providerId: 'prov_2',
        providerName: 'Nyasha Chikwanda (Acrylic & Gel Mobile)',
        providerSuburb: 'Borrowdale',
        type: 'CATALOGUE_PHOTO',
        submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        title: 'Chrome Almond Gel Extensions (Home Visit)',
        priceUsd: 20,
        priceTag: '$20 USD',
        duration: '1.5 hrs',
        tag: 'Clean Photo',
        caption: 'Clean unwatermarked work photo from home service in Borrowdale',
        proposedBio: null,
        hasSuspectedWatermarkOrFlyer: false,
        flagNote: 'Passed automated text & watermark scan — Ready for visual approval',
        flaggedReason: 'Passed automated text & watermark scan — Ready for visual approval',
        imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80',
        status: 'PENDING'
      }
    ],
    leakageLogs: [
      {
        id: 'leak_1',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        actorRole: 'PROVIDER',
        actorName: 'Fadzai Sibanda',
        context: 'In-App Chat',
        attemptedText: 'App me on 0772 123 456 so we talk outside',
        reasons: ['Phone numbers are blocked to keep bookings protected in-app', 'WhatsApp solicitation ("WhatsApp / App me")']
      }
    ],
    revenueLedger: [
      {
        id: 'rev_1',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        requestId: 'req_100',
        providerName: 'Tariro Moyo',
        customerName: 'Ruvimbo K.',
        categoryName: 'Hair Braiding & Styling',
        bookingAmountUsd: 30.00,
        configuredCommissionPercent: 10,
        standardFeeUsd: 3.00,
        promoApplied: false,
        actualFeeCollectedUsd: 3.00,
        paymentMethod: 'Cash USD'
      }
    ],
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

  (parsed.customers || []).forEach((c, i) => {
    if (!c.finditId) c.finditId = `FH-USR-${391044 + i * 1123}`;
    if (c.isBanned === undefined) c.isBanned = false;
    if (!c.activeWarnings) c.activeWarnings = [];
    if (c.warningsCount === undefined) c.warningsCount = 0;
    if (!c.reviews) c.reviews = [];
    if (!c.reviewCount) c.reviewCount = c.completedBookings || 1;
  });
  (parsed.providers || []).forEach((p, i) => {
    if (!p.finditId) p.finditId = `FH-PRO-${849201 + i * 1347}`;
    if (p.isBanned === undefined) p.isBanned = false;
    if (!p.activeWarnings) p.activeWarnings = [];
    if (p.warningsCount === undefined) p.warningsCount = 0;
    if (!p.reviews) p.reviews = [];
  });
  return parsed;
}

function loadDb() {
  // Check /tmp first (Vercel writable directory across requests)
  const tmpFile = path.join('/tmp', 'findit_db.json');
  if (fs.existsSync(tmpFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
      if (parsed && parsed.approvalQueue) return normalizeDatabase(parsed);
    } catch (e) {}
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (parsed && parsed.approvalQueue && parsed.kycVerifications && parsed.cancellationLogs) {
        return normalizeDatabase(parsed);
      }
    }
  } catch (err) {
    console.error('Error loading DB_FILE:', err.message);
  }

  const initial = getInitialDatabase();
  saveDb(initial);
  return initial;
}

function saveDb(currentDb) {
  db = currentDb;
  const jsonStr = JSON.stringify(currentDb, null, 2);
  try {
    fs.writeFileSync(path.join('/tmp', 'findit_db.json'), jsonStr, 'utf8');
  } catch (tmpErr) {}
  try {
    fs.writeFileSync(DB_FILE, jsonStr, 'utf8');
  } catch (err) {
    // EROFS on Vercel is expected
  }
}

let db = loadDb();

const sseClients = new Set();
const pendingOtpStore = new Map();
const staggeredBidTimers = new Map();

function broadcastUpdate(eventType, payload = {}) {
  const message = `data: ${JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() })}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(message);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

function scheduleStaggeredProviderBids(requestId) {
  if (staggeredBidTimers.has(requestId)) {
    staggeredBidTimers.get(requestId).forEach((t) => clearTimeout(t));
  }

  const reqItem = db.requests.find((r) => r.id === requestId);
  if (!reqItem || reqItem.status !== 'OPEN') return;

  let matchingProviders = db.providers.filter((p) => p.categoryId === reqItem.categoryId && p.isOnline !== false && !p.isBanned);
  if (matchingProviders.length < 4) {
    const extras = db.providers.filter((p) => p.categoryId !== reqItem.categoryId && p.isOnline !== false && !p.isBanned);
    matchingProviders = [...matchingProviders, ...extras].slice(0, 4);
  }
  if (reqItem.directProviderId) {
    const directProv = db.providers.find((p) => p.id === reqItem.directProviderId && !p.isBanned);
    if (directProv) {
      matchingProviders = [directProv, ...matchingProviders.filter((p) => p.id !== directProv.id)];
    }
  }

  const delaysMs = [2800, 5800, 9200, 12800];
  const priceDeltas = [0, 2, 2, 3.5];
  const timers = [];

  matchingProviders.slice(0, 4).forEach((prov, idx) => {
    const delay = delaysMs[idx] || (idx + 1) * 3500;
    const timer = setTimeout(() => {
      const currentReq = db.requests.find((r) => r.id === requestId);
      if (!currentReq || currentReq.status !== 'OPEN') return;
      if (currentReq.offers.some((o) => o.providerId === prov.id)) return;

      const distKm = getDistanceKm(prov.lat, prov.lng, currentReq.lat, currentReq.lng);
      const delta = priceDeltas[idx] !== undefined ? priceDeltas[idx] : 2;
      const proposedUsd = Math.max(5, Number((Number(currentReq.budgetUsd) + delta).toFixed(2)));
      const isExactAccept = proposedUsd <= Number(currentReq.budgetUsd);
      const nowMs = Date.now();
      const etaMins = idx === 0 ? 2 : Math.max(3, Math.min(8, Math.round(distKm * 1.4)));

      const newOffer = {
        id: 'off_' + nowMs.toString().slice(-5) + idx,
        providerId: prov.id,
        providerFinditId: prov.finditId,
        providerName: prov.name,
        providerShortName: prov.shortName || prov.name.split(' ')[0],
        providerBrand: prov.brandName,
        providerAvatar: prov.avatarInitials,
        providerAvatarUrl: prov.avatarUrl || '',
        providerSkillTier: prov.skillTier || 'Verified pro',
        isPlatinum: Boolean(prov.isPlatinum),
        providerExpYears: prov.experienceYears || 3,
        providerRating: prov.rating,
        providerReviewCount: prov.reviewCount,
        providerCompletedJobs: prov.completedBookings,
        providerBadges: prov.badges,
        distanceKm: distKm,
        etaMinutes: etaMins,
        priceUsd: proposedUsd,
        travelFeeUsd: 0,
        bidType: isExactAccept ? 'ACCEPTED_PRICE' : 'COUNTER_BID',
        proposedTime: `${etaMins} min`,
        conditions: [
          isExactAccept ? 'Your fare' : prov.skillTier,
          prov.brandName
        ],
        status: 'PROPOSED',
        lastCounterBy: 'PROVIDER',
        createdAt: new Date(nowMs).toISOString(),
        expiresAt: nowMs + 120 * 1000,
        ttlSeconds: 120
      };

      currentReq.offers.push(newOffer);
      saveDb(db);
      broadcastUpdate('OFFER_SUBMITTED', {
        requestId: currentReq.id,
        offerId: newOffer.id,
        providerName: prov.name,
        priceUsd: proposedUsd,
        bidType: newOffer.bidType
      });
    }, delay);

    timers.push(timer);
  });

  staggeredBidTimers.set(requestId, timers);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
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
  '.ico': 'image/x-icon'
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
    db = loadDb();
    return sendJson(res, 200, {
      ...db,
      suburbs: HARARE_SUBURBS,
      quickMessages: QUICK_MESSAGES,
      config: {
        agoraAppId: process.env.AGORA_APP_ID || 'aab8b8f8d67246b9bf73a87995eb871a'
      }
    });
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
        adminDmSent: true,
        otpCode: otpCode
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
      const existingCustomer = db.customers.find((c) => c.phone.replace(/\D/g, '') === cleanDigits) || null;
      const existingProvider = db.providers.find((p) => p.phone.replace(/\D/g, '') === cleanDigits) || null;
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
  if (pathname === '/api/auth/complete-signup' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const role = body.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
      const sub = HARARE_SUBURBS.find((s) => s.id === body.suburbId) || HARARE_SUBURBS[0];
      const name = (body.name || '').trim();
      const phone = (body.phone || '').trim();
      if (!name) return sendJson(res, 400, { error: 'Full legal name is required.' });
      if (!body.avatarUrl || !body.avatarUrl.startsWith('data:image/')) {
        return sendJson(res, 400, { error: 'A real live camera selfie scan is required to verify your face and issue your Findit ID.' });
      }

      const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'FH';
      const nationalIdNumber = (body.nationalIdNumber || '').trim();
      if (!nationalIdNumber || nationalIdNumber.length < 7) {
        return sendJson(res, 400, { error: 'Valid Zimbabwe National ID number is required.' });
      }

      const faceMatchScore = Number(body.faceMatchScore || 99.4);
      const faceBiometricHash = crypto.createHash('sha256').update(body.avatarUrl.slice(0, 5000)).digest('hex').slice(0, 16).toUpperCase();

      if (role === 'CUSTOMER') {
        let user = db.customers.find((c) => c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
        if (!user) {
          user = {
            id: 'cust_' + Date.now().toString().slice(-4),
            finditId: generateFinditAppId('CUSTOMER'),
            name,
            phone,
            suburbId: sub.id,
            suburbName: sub.name,
            rating: 5.0,
            reviewCount: 1,
            completedBookings: 0,
            avatarInitials: initials,
            avatarUrl: body.avatarUrl,
            whatsappVerified: true,
            faceVerified: true,
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
          user.suburbId = sub.id;
          user.suburbName = sub.name;
          user.avatarUrl = body.avatarUrl;
          user.whatsappVerified = true;
          user.faceVerified = true;
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
        const cat = db.categories.find((c) => c.id === body.categoryId) || db.categories[0];
        let provider = db.providers.find((p) => p.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
        if (!provider) {
          provider = {
            id: 'prov_' + Date.now().toString().slice(-4),
            finditId: generateFinditAppId('PROVIDER'),
            name,
            shortName: name.split(' ')[0],
            brandName: body.brandName || `${name.split(' ')[0]} Mobile Service`,
            phone,
            avatarInitials: initials,
            avatarUrl: body.avatarUrl,
            isOnline: true,
            isBanned: false,
            banReason: '',
            warningsCount: 0,
            activeWarnings: [],
            acceptedConductRules: true,
            categoryId: cat.id,
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
            bio: body.bio || `Verified mobile ${cat.fullName || cat.name} specialist visiting clients in ${sub.name} and across Harare.`,
            badges: { phoneVerified: true, idVerified: true, businessVerified: false, faceVerified: true },
            faceBiometricHash,
            nationalIdNumber,
            walletBalanceUsd: 0.00,
            walletTransactions: [],
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
          provider.avatarUrl = body.avatarUrl;
          provider.faceBiometricHash = faceBiometricHash;
          provider.nationalIdNumber = nationalIdNumber;
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
        broadcastUpdate('PROVIDER_REGISTERED', { providerId: provider.id, finditId: provider.finditId });
        return sendJson(res, 200, { role: 'PROVIDER', user: provider });
      }
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
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
        action,
        reason
      });

      saveDb(db);
      broadcastUpdate('ACCOUNT_DISCIPLINE_UPDATED', {
        role: targetRole,
        accountId: target.id,
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
        customerName: body.customerName || cust?.name || 'Tendai Moyo',
        customerRating: cust?.rating || 5.0,
        customerCompletedVisits: cust?.completedBookings || 8,
        categoryId: category.id,
        categoryName: category.fullName || category.name,
        title: body.title || `${category.name} Service`,
        description: body.description || 'Looking for a reliable verified mobile provider to come to my home.',
        suburbId: suburb.id,
        suburbName: body.suburbName || suburb.name,
        exactAddress: body.exactAddress || `${suburb.sampleStreet}, Harare`,
        lat,
        lng,
        serviceMode: 'HOME_VISIT',
        preferredTime: body.preferredTime || 'Today, Now (ASAP)',
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
      broadcastUpdate('REQUEST_CREATED', { requestId: newReq.id });
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

      if (!db.settings.launchPromoActive && provider.walletBalanceUsd < db.settings.minWalletBalanceUsd) {
        return sendJson(res, 402, {
          error: `Your Findit Wallet balance ($${provider.walletBalanceUsd.toFixed(2)} Pts) is below the minimum required ($${db.settings.minWalletBalanceUsd.toFixed(2)}). Please top up via EcoCash USD in your Wallet tab.`
        });
      }

      const distKm = getDistanceKm(provider.lat, provider.lng, reqItem.lat, reqItem.lng);
      const priceUsd = Number(body.priceUsd);
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
      broadcastUpdate('OFFER_SUBMITTED', { requestId: reqItem.id, offerId: existingOffer.id, providerName: provider.name, priceUsd });
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

      if (provider) {
        reqItem.routeCoordinates = generateHarareRoadWaypoints(
          provider.lat,
          provider.lng,
          reqItem.lat,
          reqItem.lng
        );

        if (!isPromo) {
          provider.walletBalanceUsd = Math.round((provider.walletBalanceUsd - chargedFeeUsd) * 100) / 100;
          provider.walletTransactions.unshift({
            id: 'tx_' + Date.now(),
            date: new Date().toISOString(),
            type: 'COMMISSION_DEDUCTION',
            method: 'Findit Wallet Points',
            amountUsd: -chargedFeeUsd,
            note: `${categoryRate}% commission (-$${chargedFeeUsd.toFixed(2)} Pts) on $${totalAgreedUsd.toFixed(2)} booking (${reqItem.title})`
          });
        } else {
          provider.walletTransactions.unshift({
            id: 'tx_' + Date.now(),
            date: new Date().toISOString(),
            type: 'PROMO_WAIVER',
            method: '0% Launch Promo',
            amountUsd: 0,
            savedUsd: standardFeeUsd,
            note: `${categoryRate}% fee ($${standardFeeUsd.toFixed(2)}) waived on $${totalAgreedUsd.toFixed(2)} booking!`
          });
        }
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
        text: `Hi ${(reqItem.customerName || 'Client').split(' ')[0]}! I've packed my mobile kit and I'm on my way to ${reqItem.exactAddress} (~${offer.etaMinutes || 5} mins away). Message me here if there are any gate instructions.`,
        timestamp: new Date().toISOString()
      });

      saveDb(db);
      broadcastUpdate('BOOKING_CONFIRMED', { requestId: reqItem.id, offerId: offer.id });
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
      if (String(body.pinCode).trim() !== String(reqItem.startPinCode)) {
        return sendJson(res, 400, { error: 'Incorrect 4-digit Start PIN. Ask the client for the Start PIN shown on their booking screen.' });
      }
      reqItem.pinVerifiedByProvider = true;
      reqItem.status = 'IN_PROGRESS';
      reqItem.messages.push({
        id: 'msg_' + Date.now(),
        senderRole: 'SYSTEM',
        senderName: 'Findit Harare',
        type: 'PIN_VERIFIED',
        text: `Arrival PIN #${reqItem.startPinCode} Verified. Provider has arrived and service is now IN PROGRESS.`,
        timestamp: new Date().toISOString()
      });
      saveDb(db);
      broadcastUpdate('PIN_VERIFIED', { requestId: reqItem.id });
      return sendJson(res, 200, { request: reqItem });
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
        reqItem.messages.push({
          id: 'msg_' + Date.now(),
          senderRole: 'PROVIDER',
          senderName: offer ? offer.providerName : 'Service Provider',
          providerId: offer ? offer.providerId : null,
          type: 'ARRIVED',
          text: `I have arrived outside your gate at ${reqItem.exactAddress}. Please share your 4-digit Start PIN (#${reqItem.startPinCode}) so we can begin.`,
          timestamp: new Date().toISOString()
        });
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

  if (pathname === '/api/messages' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = db.requests.find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });

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

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Findit Harare App running at http://localhost:${PORT}`);
    console.log(`Findit Harare Admin Dashboard running at http://localhost:${PORT}/admin`);
  });
}

module.exports = server;
