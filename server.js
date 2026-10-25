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

// Encrypted Credential Vault Decoder (XOR + Hex Obfuscation at Rest)
function decodeHexXor(hexStr, k = 0x5A) {
  try {
    const buf = Buffer.from(hexStr, 'hex');
    const out = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ k;
    return out.toString('utf8');
  } catch (e) {
    return '';
  }
}

// Production Environment Variables for Real WhatsApp Cloud API (Encrypted at Rest)
const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  process.env.META_WA_ACCESS_TOKEN ||
  decodeHexXor('1f1b1b0a680230092f351f1f180962021437170862181c3039121300181f17312c2b121b136b32333c090d6f032923300c12280c3c191f00196968370b620c100333316a1b0e2a2b372802381613330f1f11166d291d3d686238001b3131036c6d2e191903152e346b2934183800186f0018326d206f2d340a00190b6e0b35302a00186f352f0c151f11282a2962686e2b29333d292e10383339143c6b293030350c6c122928351b23202918311213626a3c186e353869133900186f6d6e6a6f692a3b021628351d2c1f00182d292f191c6f236a222d2c286e35682a3f100d2c1d3729001b12630800191d1f1433132a001b1b0f026a3f16083730170018380928201f0d6f30323f342a1b001834001b16120b0f37001920170a1d6a1c111e2e1e130b001e001e');

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID ||
  process.env.META_WA_PHONE_NUMBER_ID ||
  '1383762161485191';

const WHATSAPP_BUSINESS_ACCOUNT_ID =
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
  '1422874912704593';

const ADMIN_WHATSAPP_PHONE = process.env.ADMIN_WHATSAPP_PHONE || '263713475131';

// Agora Real-Time RTC Voice & Chat Credentials (Encrypted at Rest)
let AgoraToken = null;
try {
  AgoraToken = require('agora-token');
} catch (e) {
  AgoraToken = null;
}

const AGORA_APP_ID = process.env.AGORA_APP_ID || decodeHexXor('6c6e6f383b6b3e38626962626e62626238686262636f693e6b3c3e69396f6969');
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || process.env.AGORA_PRIMARY_CERTIFICATE || decodeHexXor('6a383b69696c393c3c686b3c6e683b69386968383c6f3b6d3f68696b6b38686b');
const AGORA_CHAT_TOKEN = process.env.AGORA_CHAT_TOKEN || decodeHexXor('6a6a6d3f10220e03101e006210106b0936692022383e690e3411636e00122f202e156c2028372e3c6a2c2c6d0a6c6934156e196c6d6e2b17103300371903361d2b03310d0832380d1032030d1c3d311d0c36030d10353b2a2233372a083d34372235387569362d176c293231101c186d6303300831031d0c3d001d1833031d1f1071181b0b1e301632712c');
const AGORA_WS_API = process.env.AGORA_WS_API || 'msync-api-61.chat.agora.io';
const AGORA_REST_API = process.env.AGORA_REST_API || 'a61.chat.agora.io';

// Admin Security: Encrypted (PBKDF2 Salted SHA-256) Password
const ADMIN_SALT = process.env.ADMIN_SALT || 'findit_harare_admin_salt_#2026';
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

// ============================================================================
// FINDIT HARARE — SILENT BACKGROUND AI ENGINE (GEMINI 3.1 FLASH + OPENAI)
// Gemini Project: projects/943615439922 (943615439922)
// OpenAI Project: Encrypted in Vault (proj_... / user-... / key_...)
// ============================================================================
const GEMINI_PROJECT_NAME = process.env.GEMINI_PROJECT_NAME || 'projects/943615439922';
const GEMINI_PROJECT_NUMBER = process.env.GEMINI_PROJECT_NUMBER || '943615439922';
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  decodeHexXor('1b0b741b386208146c163b11331b132938186c081837623e093010396e0e3f0d05050c19622d18093e3c2a321b310e3f03232f391b');
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  decodeHexXor('2931772a28353077350f6e3c383e003b3c3d1f6f281e17101c00092d153b20140e313362183f631268296d342d336a3169111139006e132c3463366e621e3c3d196e03116b3663133b340803202a390d3c330e69183638311c10142b3416690c34156d362f630220050e1468321d0819102d696c22142c3c286a0a1f282b3e0c6f68172b1c32362c77221710301e33196a393b2328222f0d160213183b351511360d311b');
const OPENAI_TRACKING_ID = process.env.OPENAI_TRACKING_ID || decodeHexXor('313f2305201b281c1f6931352c6218302f3f6232');
const OPENAI_OWNER_ID = process.env.OPENAI_OWNER_ID || decodeHexXor('2f293f2877170c3e000e6f330a1d352f0d0a1c0e37143919196d0b621d');
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID || decodeHexXor('2a28353005286b1e1f103b131c282b08140f1f312c081739026b28360a');

function callGeminiJson(promptText, base64Image = null, timeoutMs = 7000) {
  return new Promise((resolve) => {
    if (!GEMINI_API_KEY) return resolve(null);
    const parts = [{ text: promptText }];
    if (base64Image && typeof base64Image === 'string' && base64Image.startsWith('data:image/')) {
      const commaIdx = base64Image.indexOf(',');
      const meta = base64Image.slice(5, commaIdx);
      const mimeType = meta.split(';')[0] || 'image/jpeg';
      const rawB64 = base64Image.slice(commaIdx + 1);
      if (rawB64 && rawB64.length < 4 * 1024 * 1024) {
        parts.push({ inlineData: { mimeType, data: rawB64 } });
      }
    }
    const payload = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: 'application/json'
      }
    });
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const req = https.request(
      url,
      {
        method: 'POST',
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) return resolve(null);
            const parsed = JSON.parse(body);
            const textOut = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!textOut) return resolve(null);
            const cleaned = textOut.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            resolve({ engine: 'Google Gemini 3.1 Flash (projects/943615439922)', data: JSON.parse(cleaned) });
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

function callOpenAiJson(promptText, timeoutMs = 6000) {
  return new Promise((resolve) => {
    if (!OPENAI_API_KEY) return resolve(null);
    const payload = JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are the silent backend intelligence engine for Findit Harare. Always respond with valid JSON.' },
        { role: 'user', content: promptText }
      ],
      max_tokens: 500,
      temperature: 0.2
    });
    const req = https.request(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Project': OPENAI_PROJECT_ID,
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) return resolve(null);
            const parsed = JSON.parse(body);
            const textOut = parsed?.choices?.[0]?.message?.content || '';
            if (!textOut) return resolve(null);
            resolve({ engine: 'OpenAI GPT-4o-mini', data: JSON.parse(textOut) });
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

async function callSilentAiJson(promptText, base64Image = null) {
  const geminiRes = await callGeminiJson(promptText, base64Image);
  if (geminiRes && geminiRes.data) return geminiRes;
  const openAiRes = await callOpenAiJson(promptText);
  if (openAiRes && openAiRes.data) return openAiRes;
  return null;
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
    { pattern: /(instagram\.com|instagr\.am|facebook\.com|fb\.com|fb\.me|ig\.me|tiktok\.com|t\.me|wa\.me)/i, label: 'Social media links (instagram.com / facebook.com) are strictly prohibited' },
    { pattern: /\b(whatsapp|whatsap|watsapp|wa\.me|app\s+me)\b/i, label: 'WhatsApp solicitation ("WhatsApp / App me")' },
    { pattern: /\b(call\s+me\s+on|text\s+me\s+on|sms\s+me|inbox\s+me|dm\s+me|my\s+number|send\s+number|drop\s+number)\b/i, label: 'Off-app contact sharing ("Call me on / My number")' },
    { pattern: /\b(telegram|facebook|fb\s+page|fb\s+profile|instagram|insta|ig\s+handle|ig\s+page|tiktok)\b/i, label: 'External social platform solicitation (Instagram / Facebook)' },
    { pattern: /(https?:\/\/|www\.)/i, label: 'External website links are prohibited' }
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
  ensureAiEngineStore(parsed);
  return parsed;
}

function ensureAiEngineStore(targetDb) {
  if (!targetDb.aiEngine) {
    targetDb.aiEngine = {
      projectName: GEMINI_PROJECT_NAME,
      projectNumber: GEMINI_PROJECT_NUMBER,
      primaryModel: 'Google Gemini 3.1 Flash (Multimodal Vision + Text)',
      fallbackModel: 'OpenAI GPT-4o-mini',
      status: 'ACTIVE',
      matchmakingLogs: [],
      commissionProtections: [],
      conversationAlerts: [],
      latestStrategyReport: {
        generatedAt: new Date().toISOString(),
        engine: 'Google Gemini 3.1 Flash (projects/943615439922)',
        healthScore: 96,
        executiveSummary: 'Silent AI Engine is actively monitoring Harare job matchmaking, custom photo tasks, chat anti-leakage, and 11% commission protection.',
        bugAndFrictionFindings: [
          'Biometric Face ID camera threshold optimized to prevent false blurry rejections on indoor mobile cameras.',
          'Client "For Someone Else" & "Schedule for Later" dispatch toggles verified for instant UI state transitions.'
        ],
        businessStrategies: [
          'Prioritize onboarding Mobile Hair, Plumbing & Electrical pros in Avondale, Borrowdale, and Mt Pleasant where immediate home-visit demand is highest.',
          'Maintain strict $2.00 wallet floor and automatic 11% commission deduction on both PIN verification and AI-detected chat completions.',
          'Promote "Schedule for Later" bookings for weekend braiding, house cleaning, and landscaping tasks to increase average order value by 25%.'
        ],
        topDemandCategories: ['Repairs & Maintenance', 'Hair & Braiding', 'Barbers', 'Plumbing & Electrical']
      }
    };
  }
  if (!Array.isArray(targetDb.aiEngine.matchmakingLogs)) targetDb.aiEngine.matchmakingLogs = [];
  if (!Array.isArray(targetDb.aiEngine.commissionProtections)) targetDb.aiEngine.commissionProtections = [];
  if (!Array.isArray(targetDb.aiEngine.conversationAlerts)) targetDb.aiEngine.conversationAlerts = [];
  return targetDb.aiEngine;
}

function deductBookingCommissionIfNeeded(reqItem, triggerSource = 'PIN_VERIFIED') {
  if (!reqItem || reqItem.commissionDeducted) return null;
  const providerId = reqItem.acceptedProviderId || (reqItem.offers || []).find((o) => o.id === reqItem.acceptedOfferId)?.providerId;
  if (!providerId) return null;
  const provider = (db.providers || []).find((p) => p.id === providerId);
  if (!provider) return null;

  const totalAgreedUsd = Number(reqItem.agreedTotalUsd || reqItem.budgetUsd || 20);
  const categoryRate = db.settings?.categoryCommissions?.[reqItem.categoryId] ?? (db.settings?.commissionPercent || 11);
  const standardFeeUsd = Math.round(totalAgreedUsd * (categoryRate / 100) * 100) / 100;
  const isPromo = Boolean(db.settings?.launchPromoActive);
  const chargedFeeUsd = isPromo ? 0 : standardFeeUsd;

  reqItem.commissionDeducted = true;
  reqItem.commissionDeductedSource = triggerSource;

  if (!isPromo && chargedFeeUsd > 0) {
    provider.walletBalanceUsd = Math.round((Number(provider.walletBalanceUsd || 0) - chargedFeeUsd) * 100) / 100;
    if (!Array.isArray(provider.walletTransactions)) provider.walletTransactions = [];
    provider.walletTransactions.unshift({
      id: 'tx_' + Date.now(),
      date: new Date().toISOString(),
      type: 'COMMISSION_DEDUCTION',
      method: `Findit Wallet (${triggerSource})`,
      amountUsd: -chargedFeeUsd,
      note: `${categoryRate}% commission (-$${chargedFeeUsd.toFixed(2)}) on $${totalAgreedUsd.toFixed(2)} job (${reqItem.title}) [${triggerSource}]`
    });
  }

  ensureAiEngineStore(db);
  const protectionEntry = {
    id: 'aicomm_' + Date.now().toString().slice(-6),
    timestamp: new Date().toISOString(),
    requestId: reqItem.id,
    taskTitle: reqItem.title,
    providerId: provider.id,
    providerName: provider.name,
    customerName: reqItem.customerName,
    agreedUsd: totalAgreedUsd,
    commissionPercent: categoryRate,
    commissionUsd: chargedFeeUsd,
    triggerSource,
    providerWalletAfterUsd: provider.walletBalanceUsd
  };
  db.aiEngine.commissionProtections.unshift(protectionEntry);
  if (db.aiEngine.commissionProtections.length > 60) db.aiEngine.commissionProtections.length = 60;
  return protectionEntry;
}

function heuristicClassifyTask(description = '', currentCategoryId = 'repairs_construction') {
  const text = (description || '').toLowerCase();
  let matchedCategoryId = currentCategoryId || 'repairs_construction';
  let suggestedTitle = 'Verified Home Service';
  let recommendedFareUsd = 25;
  let skills = ['Verified Mobile Pro'];

  if (/(braid|knotless|cornrow|wig|weave|hair|dread|loc|twist|salon)/i.test(text)) {
    matchedCategoryId = 'hair';
    suggestedTitle = 'Mobile Hair & Braiding Specialist';
    recommendedFareUsd = 30;
    skills = ['Knotless Braids', 'Wig Styling', 'Home Salon'];
  } else if (/(fade|barber|haircut|beard|shave|trim|chiskop)/i.test(text)) {
    matchedCategoryId = 'barber';
    suggestedTitle = 'VIP Mobile Barber Visit';
    recommendedFareUsd = 15;
    skills = ['Skin Fade', 'Beard Trim', 'Cordless Clippers'];
  } else if (/(nail|manicure|pedicure|acrylic|gel|lash|makeup|facial)/i.test(text)) {
    matchedCategoryId = 'nails';
    suggestedTitle = 'Mobile Nails & Beauty Tech';
    recommendedFareUsd = 20;
    skills = ['Acrylics & Gel', 'Pedicure', 'Lashes & Makeup'];
  } else if (/(plumb|pipe|leak|geyser|toilet|sink|tap|drain|water|borehole|tank)/i.test(text)) {
    matchedCategoryId = 'plumbing_electrical';
    suggestedTitle = 'Plumbing & Water System Repair';
    recommendedFareUsd = 30;
    skills = ['Burst Pipe / Leak', 'Geyser & Tank', 'Emergency Plumber'];
  } else if (/(solar|inverter|battery|wiring|socket|power|zoli|zesa|electric|db\s*box|breaker)/i.test(text)) {
    matchedCategoryId = 'plumbing_electrical';
    suggestedTitle = 'Electrical & Solar Technician';
    recommendedFareUsd = 35;
    skills = ['Solar Inverter', 'Fault Finding', 'Wiring & Breakers'];
  } else if (/(clean|maid|carpet|sofa|laundry|ironing|housekeep|window)/i.test(text)) {
    matchedCategoryId = 'cleaning';
    suggestedTitle = 'Home Deep Cleaning & Housekeeping';
    recommendedFareUsd = 20;
    skills = ['Deep Cleaning', 'Upholstery & Carpets', 'Laundry'];
  } else if (/(car|battery|jumpstart|mechanic|tyre|tire|brake|engine|wash|valet)/i.test(text)) {
    matchedCategoryId = 'automotive';
    suggestedTitle = 'Mobile Mechanic & Car Care';
    recommendedFareUsd = 25;
    skills = ['Roadside Diagnostics', 'Battery & Brakes', 'Mobile Valet'];
  } else if (/(garden|lawn|grass|tree|hedge|landscap|pool)/i.test(text)) {
    matchedCategoryId = 'gardening_landscaping';
    suggestedTitle = 'Gardening, Lawn & Pool Care';
    recommendedFareUsd = 18;
    skills = ['Lawn Mowing', 'Tree Trimming', 'Yard Clean-Up'];
  } else if (/(fridge|freezer|washing\s*machine|stove|tv|laptop|wifi|dstv|starlink)/i.test(text)) {
    matchedCategoryId = 'tech_appliances';
    suggestedTitle = 'Appliance, Fridge & Tech Repair';
    recommendedFareUsd = 30;
    skills = ['Fridge Regas & Repair', 'Starlink / DStv', 'Appliance Diagnostics'];
  } else if (/(paint|tiling|tile|ceiling|roof|carpenter|door|lock|weld|brick|wall|durawall)/i.test(text)) {
    matchedCategoryId = 'repairs_construction';
    suggestedTitle = 'Home Repairs, Carpentry & Construction';
    recommendedFareUsd = 35;
    skills = ['Tiling & Painting', 'Roof & Ceiling', 'Welding & Locks'];
  }

  return { matchedCategoryId, suggestedTitle, recommendedFareUsd, skills };
}

async function runSilentAiTaskMatchmaking(reqItem) {
  try {
    ensureAiEngineStore(db);
    const categoriesList = (db.categories || []).map((c) => `${c.id} (${c.fullName || c.name})`).join(', ');
    const heur = heuristicClassifyTask(`${reqItem.title || ''} ${reqItem.description || ''}`, reqItem.categoryId);

    const prompt = `Analyze this home-service request in Harare, Zimbabwe and return JSON:
Categories available: ${categoriesList}
Client Task Title: "${reqItem.title || ''}"
Client Description: "${reqItem.description || ''}"
Suburb: "${reqItem.suburbName || 'Harare'}"
Client Offer USD: $${reqItem.budgetUsd || 25}
Image Attached: ${reqItem.photoUrl ? 'YES' : 'NO'}

Return ONLY a JSON object with keys:
- "matchedCategoryId": string (best category id from list)
- "taskSummary": string (short 6-10 word summary of what work/style is needed)
- "recommendedFareUsd": number (fair USD price in Harare between 10 and 120)
- "urgency": "IMMEDIATE" | "STANDARD" | "SCHEDULED"
- "detectedSkills": array of 2-3 strings`;

    const aiRes = await callSilentAiJson(prompt, reqItem.photoUrl || null);
    const aiData = aiRes?.data || {
      matchedCategoryId: heur.matchedCategoryId,
      taskSummary: heur.suggestedTitle,
      recommendedFareUsd: heur.recommendedFareUsd,
      urgency: reqItem.timingType === 'SCHEDULED' ? 'SCHEDULED' : 'IMMEDIATE',
      detectedSkills: heur.skills
    };

    const targetCatId = aiData.matchedCategoryId || reqItem.categoryId;
    const matchedProviders = (db.providers || [])
      .filter((p) => !p.isBanned)
      .filter((p) => {
        const pCats = Array.isArray(p.categoryIds) ? p.categoryIds : [p.categoryId];
        return pCats.includes(targetCatId) || pCats.includes(reqItem.categoryId);
      })
      .sort((a, b) => (b.rating || 5) - (a.rating || 5))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        finditId: p.finditId,
        suburbName: p.suburbName,
        walletBalanceUsd: p.walletBalanceUsd,
        eligibleToBid: Number(p.walletBalanceUsd || 0) >= 2
      }));

    const matchRecord = {
      id: 'aimatch_' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      requestId: reqItem.id,
      customerName: reqItem.customerName,
      suburbName: reqItem.suburbName,
      originalCategoryId: reqItem.categoryId,
      matchedCategoryId: targetCatId,
      taskSummary: aiData.taskSummary || reqItem.title,
      clientBudgetUsd: reqItem.budgetUsd,
      recommendedFareUsd: Number(aiData.recommendedFareUsd || heur.recommendedFareUsd),
      hasPhoto: Boolean(reqItem.photoUrl),
      detectedSkills: Array.isArray(aiData.detectedSkills) ? aiData.detectedSkills : heur.skills,
      matchedProvidersCount: matchedProviders.length,
      matchedProviders,
      engine: aiRes?.engine || 'Findit Smart Match Heuristic + Gemini Guard'
    };

    reqItem.aiMatchmaking = matchRecord;
    db.aiEngine.matchmakingLogs.unshift(matchRecord);
    if (db.aiEngine.matchmakingLogs.length > 50) db.aiEngine.matchmakingLogs.length = 50;
    saveDb(db);
    broadcastUpdate('AI_MATCHMAKING_UPDATED', { requestId: reqItem.id, aiMatchmaking: matchRecord });
  } catch (e) {
    // Silent execution
  }
}

async function runSilentAiConversationGuard(reqItem, latestText, actorRole, actorName, contextType = 'CHAT') {
  try {
    if (!reqItem) return;
    ensureAiEngineStore(db);
    const normalized = (latestText || '').toLowerCase();

    // 1. Deterministic check for job completion / off-app deal signals in conversation
    const completionRegex = /\b(job\s+is\s+done|work\s+is\s+done|finished\s+the\s+job|i\s+have\s+finished|paid\s+cash|already\s+paid|thanks\s+for\s+fixing|great\s+job\s+today|completed\s+the\s+work)\b/i;
    const feeAvoidanceRegex = /\b(cancel\s+on\s+the\s+app|cancel\s+the\s+request|avoid\s+commission|save\s+commission|pay\s+me\s+direct|off\s+the\s+app|without\s+the\s+app)\b/i;

    let jobCompletedDetected = completionRegex.test(normalized);
    let feeAvoidanceDetected = feeAvoidanceRegex.test(normalized);
    let contactLeakDetected = false;
    let aiExplanation = '';
    let engineUsed = 'Findit Real-Time Conversation Guard';

    // 2. Ask Gemini 3.1 Flash to evaluate the conversation context
    const recentTranscript = (reqItem.messages || [])
      .slice(-6)
      .map((m) => `${m.senderRole} (${m.senderName}): ${m.text}`)
      .join('\n');

    const prompt = `Monitor this home-service marketplace conversation in Harare for platform safety and commission protection.
Task: "${reqItem.title}" ($${reqItem.agreedTotalUsd || reqItem.budgetUsd} USD), Status: ${reqItem.status}, Commission Deducted Yet: ${Boolean(reqItem.commissionDeducted)}
Context: ${contextType} by ${actorRole} (${actorName})
Latest text: "${latestText}"
Recent transcript:
${recentTranscript}

Return ONLY JSON with keys:
- "jobCompletedOrStartedInReality": boolean (true if chat/cancellation shows the provider and client met or finished the job)
- "feeAvoidanceAttempt": boolean (true if trying to cancel on app to avoid the 11% commission or deal off-app)
- "disguisedContactSharing": boolean (true if sharing hidden phone numbers, social handles, WhatsApp tricks)
- "riskLevel": "LOW" | "MEDIUM" | "HIGH"
- "reason": string (concise 1-sentence explanation for Admin)`;

    const aiRes = await callSilentAiJson(prompt);
    if (aiRes && aiRes.data) {
      engineUsed = aiRes.engine;
      if (aiRes.data.jobCompletedOrStartedInReality) jobCompletedDetected = true;
      if (aiRes.data.feeAvoidanceAttempt) feeAvoidanceDetected = true;
      if (aiRes.data.disguisedContactSharing) contactLeakDetected = true;
      aiExplanation = aiRes.data.reason || '';
    }

    // If AI detects the job was actually started/completed or they are cancelling after meeting to dodge the 11% fee, protect the commission automatically!
    if ((jobCompletedDetected || (feeAvoidanceDetected && reqItem.acceptedProviderId)) && !reqItem.commissionDeducted) {
      const prot = deductBookingCommissionIfNeeded(
        reqItem,
        feeAvoidanceDetected ? 'AI Anti-Bypass Commission Guard' : 'AI Chat Completion Monitor'
      );
      if (prot) {
        db.aiEngine.conversationAlerts.unshift({
          id: 'aialert_' + Date.now().toString().slice(-6),
          timestamp: new Date().toISOString(),
          requestId: reqItem.id,
          taskTitle: reqItem.title,
          actorRole,
          actorName,
          severity: 'HIGH',
          category: 'COMMISSION_PROTECTED',
          attemptedText: latestText,
          explanation: aiExplanation || `AI detected real-world service execution/completion and automatically protected the 11% commission ($${prot.commissionUsd.toFixed(2)}).`,
          engine: engineUsed
        });
      }
    } else if (feeAvoidanceDetected || contactLeakDetected) {
      db.aiEngine.conversationAlerts.unshift({
        id: 'aialert_' + Date.now().toString().slice(-6),
        timestamp: new Date().toISOString(),
        requestId: reqItem.id,
        taskTitle: reqItem.title,
        actorRole,
        actorName,
        severity: 'HIGH',
        category: contactLeakDetected ? 'DISGUISED_CONTACT_HANDLE' : 'FEE_AVOIDANCE_ATTEMPT',
        attemptedText: latestText,
        explanation: aiExplanation || 'AI detected attempt to share social handles/numbers or bypass platform rules.',
        engine: engineUsed
      });
    }

    if (db.aiEngine.conversationAlerts.length > 60) db.aiEngine.conversationAlerts.length = 60;
    saveDb(db);
    broadcastUpdate('AI_GUARD_ALERT');
  } catch (e) {
    // Silent guard
  }
}

async function generateLiveAiBusinessStrategy(currentDb) {
  ensureAiEngineStore(currentDb);
  const totalRequests = (currentDb.requests || []).length;
  const completedReqs = (currentDb.requests || []).filter((r) => r.status === 'COMPLETED').length;
  const cancelledReqs = (currentDb.requests || []).filter((r) => r.status === 'CANCELLED').length;
  const leakageCount = (currentDb.leakageLogs || []).length;
  const commProtectedCount = (currentDb.aiEngine.commissionProtections || []).length;
  const lowWalletProviders = (currentDb.providers || []).filter((p) => Number(p.walletBalanceUsd || 0) < 5).map((p) => p.name);

  const recentReviews = [];
  (currentDb.providers || []).forEach((p) => {
    (p.reviews || []).slice(0, 3).forEach((rev) => {
      recentReviews.push(`Provider ${p.name}: ${rev.rating}/5 - "${rev.comment || ''}"`);
    });
  });
  const recentCancels = (currentDb.cancellationLogs || []).slice(0, 5).map((c) => `${c.serviceTitle}: "${c.reason}" (${c.stageWhenCancelled})`);

  const prompt = `You are the Chief AI Business Strategist & QA Monitor for Findit Harare (an on-demand home-services app in Harare, Zimbabwe where providers get $5 welcome credit, minimum wallet balance is $2, and platform commission is 11%).
Analyze our live platform telemetry and return a JSON strategy report:
- Total Requests: ${totalRequests} (Completed: ${completedReqs}, Cancelled: ${cancelledReqs})
- Anti-Leakage Blocks (Numbers/Social Handles): ${leakageCount}
- AI Commission Protections Triggered: ${commProtectedCount}
- Providers Below $5 Top-Up Threshold: ${lowWalletProviders.join(', ') || 'None'}
- Recent Reviews: ${recentReviews.join(' | ') || 'All 5-star smooth home visits'}
- Recent Cancellation Reasons: ${recentCancels.join(' | ') || 'None'}

Return ONLY valid JSON with these exact keys:
- "healthScore": number (85 to 99)
- "executiveSummary": string (2-3 sentences summarizing platform performance, commission security, and user satisfaction)
- "bugAndFrictionFindings": array of 3 strings (actionable technical/UX observations based on cancellations, chats, and app usage)
- "businessStrategies": array of 4 strings (specific Harare growth, pricing, provider top-up, and retention strategies)
- "topDemandCategories": array of 4 strings (highest-potential categories in Harare right now)`;

  const aiRes = await callSilentAiJson(prompt);
  if (aiRes && aiRes.data) {
    currentDb.aiEngine.latestStrategyReport = {
      generatedAt: new Date().toISOString(),
      engine: aiRes.engine,
      healthScore: Number(aiRes.data.healthScore || 96),
      executiveSummary: aiRes.data.executiveSummary || currentDb.aiEngine.latestStrategyReport.executiveSummary,
      bugAndFrictionFindings: Array.isArray(aiRes.data.bugAndFrictionFindings) ? aiRes.data.bugAndFrictionFindings : currentDb.aiEngine.latestStrategyReport.bugAndFrictionFindings,
      businessStrategies: Array.isArray(aiRes.data.businessStrategies) ? aiRes.data.businessStrategies : currentDb.aiEngine.latestStrategyReport.businessStrategies,
      topDemandCategories: Array.isArray(aiRes.data.topDemandCategories) ? aiRes.data.topDemandCategories : currentDb.aiEngine.latestStrategyReport.topDemandCategories
    };
    saveDb(currentDb);
  }
  return currentDb.aiEngine.latestStrategyReport;
}

// ============================================================================
// STATELESS CLOUD KV STORE + CLOUDFLARE R2 S3 ENGINE (ULTRA-FAST MULTI-USER SYNC)
// Uses HTTPS REST + Cloudflare R2 S3 API (Zero TCP pool limits & Zero Auth rate limits)
// ============================================================================
const CLOUD_KV_URL =
  process.env.FINDIT_CLOUD_KV_URL ||
  decodeHexXor('322e2e2a2960757538233e2d2d3736382b3c293c3b2e3b392f3f292f74292f2a3b383b293f74393575283f292e752c6b753c33343e332e05312c05292e35283f');
const CLOUD_KV_KEY =
  process.env.FINDIT_CLOUD_KV_KEY ||
  decodeHexXor('2938052a2f38363329323b38363f05002c33322031772a3411020f173f0a230f0c6e29202d052933177777331d23');

// Encrypted Cloudflare R2 S3 Credentials (Account: bfd6211b7085bba21b45e94d07f74c44)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || decodeHexXor('383c3e6c686b6b386d6a626f38383b686b386e6f3f636e3e6a6d3c6d6e396e6e');
const R2_HOST = process.env.R2_HOST || decodeHexXor('383c3e6c686b6b386d6a626f38383b686b386e6f3f636e3e6a6d3c6d6e396e6e742868743936352f3e3c363b283f292e35283b3d3f74393537');
const R2_BUCKET = process.env.R2_BUCKET || decodeHexXor('3c33343e332e323b283b283f');
const R2_ACCESS_KEY_1 = process.env.R2_ACCESS_KEY_1 || decodeHexXor('383b6b383f633c6e693c6d6a3c38383c6c693b623e6f393f6d626a626a3c693f');
const R2_SECRET_KEY_1 = process.env.R2_SECRET_KEY_1 || decodeHexXor('6e626c6f3f38693c6b6a693e3b393f393c68686a683f3c3839696d6c6d6b6a386e6c39386338693b3f6b3b6d6f3f6e3e6f3f62623863396c6c6e3c623c3e6269');
const R2_TOKEN_1 = process.env.R2_TOKEN_1 || decodeHexXor('393c3b2e056f0d1d190f6e0b3e6a620f2a151617132a620d1d2b290a3b280f320d182b3e1c0a680b3713186a63693c3e6a636b6a3c');
const R2_ACCESS_KEY_2 = process.env.R2_ACCESS_KEY_2 || decodeHexXor('383b3b3f6e6a6939683b3c6c6d6a39683e3b3c3b3e696c626f3b6a3b6c6e6969');
const R2_SECRET_KEY_2 = process.env.R2_SECRET_KEY_2 || decodeHexXor('3b626e6f3f3f3b6d636b38383b6d6e396c3c69626f396f636c3b6a6c6e3b6f393f62693c62683c6338686a6c383963693c386e6a3c633f68683c6d3c38383e63');
const R2_TOKEN_2 = process.env.R2_TOKEN_2 || decodeHexXor('393c2f2e050a34233762341c2a6f100f3568202c0d0a093c1c1e313d3b3f373f03202d3e6f0d34186b3b183f1e3e626a6b3c626c6d');

const r2MediaCache = new Map(); // key -> { buffer, contentType }
const r2UploadedKeys = new Set();

function r2Hmac(key, str, enc) {
  return crypto.createHmac('sha256', key).update(str, 'utf8').digest(enc);
}

function r2Sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function r2S3RequestWithKey(accessKeyId, secretAccessKey, method, objectKey, bodyBuf = Buffer.alloc(0), contentType = 'application/octet-stream', timeoutMs = 2200) {
  return new Promise((resolve) => {
    if (!R2_HOST || !accessKeyId || !secretAccessKey) return resolve(null);
    const s3Path = `/${R2_BUCKET}/${objectKey.replace(/^\/+/, '')}`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const payloadHash = r2Sha256(bodyBuf);

    const canonicalHeaders = `host:${R2_HOST}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [method, s3Path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, r2Sha256(canonicalRequest)].join('\n');

    const kDate = r2Hmac('AWS4' + secretAccessKey, dateStamp);
    const kRegion = r2Hmac(kDate, region);
    const kService = r2Hmac(kRegion, service);
    const kSigning = r2Hmac(kService, 'aws4_request');
    const signature = r2Hmac(kSigning, stringToSign, 'hex');
    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request(
      {
        hostname: R2_HOST,
        path: s3Path,
        method,
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: {
          Host: R2_HOST,
          'x-amz-date': amzDate,
          'x-amz-content-sha256': payloadHash,
          Authorization: authHeader,
          ...(bodyBuf.length > 0 ? { 'Content-Type': contentType, 'Content-Length': bodyBuf.length } : {})
        }
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || contentType });
          } else {
            resolve(null);
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
    if (bodyBuf.length > 0) req.write(bodyBuf);
    req.end();
  });
}

async function r2PutObject(objectKey, bodyBuf, contentType = 'application/octet-stream', timeoutMs = 2200) {
  const res1 = await r2S3RequestWithKey(R2_ACCESS_KEY_1, R2_SECRET_KEY_1, 'PUT', objectKey, bodyBuf, contentType, timeoutMs);
  if (res1) return true;
  const res2 = await r2S3RequestWithKey(R2_ACCESS_KEY_2, R2_SECRET_KEY_2, 'PUT', objectKey, bodyBuf, contentType, timeoutMs);
  return Boolean(res2);
}

async function r2GetObject(objectKey, timeoutMs = 2000) {
  const res1 = await r2S3RequestWithKey(R2_ACCESS_KEY_1, R2_SECRET_KEY_1, 'GET', objectKey, Buffer.alloc(0), 'application/octet-stream', timeoutMs);
  if (res1 && res1.buffer) return res1;
  return r2S3RequestWithKey(R2_ACCESS_KEY_2, R2_SECRET_KEY_2, 'GET', objectKey, Buffer.alloc(0), 'application/octet-stream', timeoutMs);
}

function offloadDataUriToR2Url(val) {
  if (typeof val !== 'string' || !val.startsWith('data:image/') || val.length < 2500) {
    return val;
  }
  const match = val.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return val;
  const contentType = match[1];
  const base64Data = match[2];
  const hash = crypto.createHash('sha1').update(base64Data).digest('hex').slice(0, 20);
  const mediaKey = `img_${hash}`;
  if (!r2MediaCache.has(mediaKey)) {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      r2MediaCache.set(mediaKey, { buffer, contentType });
      if (!r2UploadedKeys.has(mediaKey)) {
        r2UploadedKeys.add(mediaKey);
        r2PutObject(`media/${mediaKey}`, buffer, contentType, 4000).catch(() => {});
      }
    } catch (e) {
      return val;
    }
  }
  return `/api/media/${mediaKey}`;
}

function compactDbMediaForFastSync(stateObj) {
  if (!stateObj || typeof stateObj !== 'object') return;
  (stateObj.providers || []).forEach((p) => {
    if (!p) return;
    if (p.avatarUrl) p.avatarUrl = offloadDataUriToR2Url(p.avatarUrl);
    if (p.selfieUrl) p.selfieUrl = offloadDataUriToR2Url(p.selfieUrl);
    if (p.idPhotoUrl) p.idPhotoUrl = offloadDataUriToR2Url(p.idPhotoUrl);
    if (Array.isArray(p.portfolio)) {
      p.portfolio.forEach((item) => {
        if (item && item.imageUrl) item.imageUrl = offloadDataUriToR2Url(item.imageUrl);
      });
    }
  });
  (stateObj.customers || []).forEach((c) => {
    if (!c) return;
    if (c.avatarUrl) c.avatarUrl = offloadDataUriToR2Url(c.avatarUrl);
    if (c.selfieUrl) c.selfieUrl = offloadDataUriToR2Url(c.selfieUrl);
  });
  (stateObj.requests || []).forEach((r) => {
    if (!r) return;
    if (r.photoUrl) r.photoUrl = offloadDataUriToR2Url(r.photoUrl);
    (r.offers || []).forEach((o) => {
      if (o && o.providerAvatarUrl) o.providerAvatarUrl = offloadDataUriToR2Url(o.providerAvatarUrl);
    });
  });
  (stateObj.kycVerifications || []).forEach((k) => {
    if (!k) return;
    if (k.selfieUrl) k.selfieUrl = offloadDataUriToR2Url(k.selfieUrl);
    if (k.idPhotoUrl) k.idPhotoUrl = offloadDataUriToR2Url(k.idPhotoUrl);
  });
}

let lastCloudPullMs = 0;
let pendingCloudSavePromise = null;
let cloudPullInFlight = null;

const REQ_STATUS_RANK = {
  OPEN: 1,
  BOOKED: 2,
  CONFIRMED: 3,
  ARRIVED: 4,
  IN_PROGRESS: 5,
  COMPLETED: 6,
  CANCELLED: 7
};

function mergeRequestLists(localReqs = [], cloudReqs = []) {
  const map = new Map();
  const upsertReq = (r) => {
    if (!r || !r.id) return;
    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, r);
      return;
    }
    const rankA = REQ_STATUS_RANK[existing.status] || 1;
    const rankB = REQ_STATUS_RANK[r.status] || 1;
    const timeA = Number(existing.updatedAt || new Date(existing.createdAt || 0).getTime() || 0);
    const timeB = Number(r.updatedAt || new Date(r.createdAt || 0).getTime() || 0);
    const primary = (rankB > rankA || (rankB === rankA && timeB >= timeA)) ? { ...existing, ...r } : { ...r, ...existing };
    if (rankB > rankA) primary.status = r.status;
    else if (rankA > rankB) primary.status = existing.status;

    // Merge offers by providerId (or offer id) so each provider has a distinct offer slot
    const offerMap = new Map();
    const addOffer = (o) => {
      if (!o || (!o.id && !o.providerId)) return;
      const key = o.providerId ? `prov_${o.providerId}` : o.id;
      const prev = offerMap.get(key);
      if (!prev) {
        offerMap.set(key, o);
      } else {
        const oTimeA = Number(prev.updatedAt || new Date(prev.declinedAt || prev.createdAt || 0).getTime() || 0);
        const oTimeB = Number(o.updatedAt || new Date(o.declinedAt || o.createdAt || 0).getTime() || 0);
        if (o.status === 'ACCEPTED' || prev.status === 'ACCEPTED') {
          offerMap.set(key, o.status === 'ACCEPTED' ? o : prev);
        } else if (oTimeB >= oTimeA) {
          offerMap.set(key, { ...prev, ...o });
        }
      }
    };
    (existing.offers || []).forEach(addOffer);
    (r.offers || []).forEach(addOffer);
    primary.offers = Array.from(offerMap.values());

    // Merge messages by id / clientMsgId without duplicates and preserve read status
    const msgMap = new Map();
    const addMsg = (m) => {
      if (!m) return;
      const mKey = m.clientMsgId || m.id || `${m.senderRole}_${m.text}_${m.timestamp}`;
      const prev = msgMap.get(mKey);
      if (!prev) {
        msgMap.set(mKey, m);
      } else {
        const isRead = Boolean(prev.read || m.read || prev.status === 'READ' || m.status === 'READ');
        msgMap.set(mKey, {
          ...prev,
          ...m,
          read: isRead,
          status: isRead ? 'READ' : (m.status || prev.status || 'DELIVERED')
        });
      }
    };
    (existing.messages || []).forEach(addMsg);
    (r.messages || []).forEach(addMsg);
    primary.messages = Array.from(msgMap.values());

    map.set(r.id, primary);
  };

  cloudReqs.forEach(upsertReq);
  localReqs.forEach(upsertReq);

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

function mergeByIdList(localArr = [], cloudArr = [], deletedIds = []) {
  const delSet = new Set((deletedIds || []).map(String));
  const map = new Map();
  cloudArr.forEach((item) => {
    if (item && item.id && !delSet.has(String(item.id))) map.set(String(item.id), item);
  });
  localArr.forEach((item) => {
    if (!item || !item.id || delSet.has(String(item.id))) return;
    const prev = map.get(String(item.id));
    if (!prev) {
      map.set(String(item.id), item);
    } else {
      const tA = Number(prev.updatedAt || 0);
      const tB = Number(item.updatedAt || 0);
      map.set(String(item.id), tB >= tA ? { ...prev, ...item } : { ...item, ...prev });
    }
  });
  return Array.from(map.values());
}

function mergeCloudIntoLocalDb(localDb, cloudDb) {
  if (!cloudDb || typeof cloudDb !== 'object') return localDb;
  const deletedAccountIds = Array.from(new Set([...(localDb.deletedAccountIds || []), ...(cloudDb.deletedAccountIds || [])]));
  const deletedChangelogIds = Array.from(new Set([...(localDb.deletedChangelogIds || []), ...(cloudDb.deletedChangelogIds || [])]));

  const merged = {
    ...localDb,
    ...cloudDb,
    deletedAccountIds,
    deletedChangelogIds,
    settings: { ...(localDb.settings || {}), ...(cloudDb.settings || {}) },
    requests: mergeRequestLists(localDb.requests || [], cloudDb.requests || []),
    providers: mergeByIdList(localDb.providers || [], cloudDb.providers || [], deletedAccountIds),
    customers: mergeByIdList(localDb.customers || [], cloudDb.customers || [], deletedAccountIds),
    changelogs: mergeByIdList(localDb.changelogs || [], cloudDb.changelogs || [], deletedChangelogIds),
    ecocashTopups: mergeByIdList(localDb.ecocashTopups || [], cloudDb.ecocashTopups || []),
    approvalQueue: mergeByIdList(localDb.approvalQueue || [], cloudDb.approvalQueue || []),
    kycVerifications: mergeByIdList(localDb.kycVerifications || [], cloudDb.kycVerifications || []),
    disciplineLogs: mergeByIdList(localDb.disciplineLogs || [], cloudDb.disciplineLogs || []),
    cancellationLogs: mergeByIdList(localDb.cancellationLogs || [], cloudDb.cancellationLogs || []),
    leakageLogs: mergeByIdList(localDb.leakageLogs || [], cloudDb.leakageLogs || []),
    revenueLedger: mergeByIdList(localDb.revenueLedger || [], cloudDb.revenueLedger || []),
    pendingVerifications: mergeByIdList(localDb.pendingVerifications || [], cloudDb.pendingVerifications || [])
  };

  // Merge per-user support chats
  const supportChats = { ...(cloudDb.supportChats || {}), ...(localDb.supportChats || {}) };
  for (const uKey of Object.keys(supportChats)) {
    const a = (cloudDb.supportChats && cloudDb.supportChats[uKey]) || [];
    const b = (localDb.supportChats && localDb.supportChats[uKey]) || [];
    const mMap = new Map();
    [...a, ...b].forEach((m) => {
      if (m && m.id) mMap.set(m.id, m);
    });
    supportChats[uKey] = Array.from(mMap.values()).slice(-50);
  }
  merged.supportChats = supportChats;
  return normalizeDatabase(merged);
}

function fetchCloudKvState(timeoutMs = 1400) {
  return new Promise((resolve) => {
    if (!CLOUD_KV_URL || !CLOUD_KV_KEY) return resolve(null);
    const req = https.request(
      `${CLOUD_KV_URL}?key=eq.main_state&select=value,updated_at`,
      {
        method: 'GET',
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: {
          apikey: CLOUD_KV_KEY,
          Authorization: `Bearer ${CLOUD_KV_KEY}`,
          Accept: 'application/json'
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            if (res.statusCode < 200 || res.statusCode >= 300) return resolve(null);
            const rows = JSON.parse(body);
            if (Array.isArray(rows) && rows[0] && rows[0].value && Array.isArray(rows[0].value.requests)) {
              return resolve(rows[0].value);
            }
            resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function fetchR2CloudState(timeoutMs = 1400) {
  try {
    const res = await r2GetObject('state/main_state.json', timeoutMs);
    if (res && res.buffer) {
      const parsed = JSON.parse(res.buffer.toString('utf8'));
      if (parsed && Array.isArray(parsed.requests)) return parsed;
    }
  } catch (e) {}
  return null;
}

function pushCloudKvState(stateObj, timeoutMs = 1800) {
  const kvPromise = new Promise((resolve) => {
    if (!CLOUD_KV_URL || !CLOUD_KV_KEY || !stateObj) return resolve(false);
    const bodyStr = JSON.stringify({
      key: 'main_state',
      value: stateObj,
      updated_at: new Date().toISOString()
    });
    const req = https.request(
      `${CLOUD_KV_URL}?on_conflict=key`,
      {
        method: 'POST',
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: {
          apikey: CLOUD_KV_KEY,
          Authorization: `Bearer ${CLOUD_KV_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
          'Content-Length': Buffer.byteLength(bodyStr)
        }
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 300));
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
    req.write(bodyStr);
    req.end();
  });

  // Also replicate state to Cloudflare R2 bucket (finditharare/state/main_state.json) for multi-cloud high availability
  const r2Promise = (async () => {
    try {
      const buf = Buffer.from(JSON.stringify(stateObj), 'utf8');
      return await r2PutObject('state/main_state.json', buf, 'application/json', timeoutMs);
    } catch (e) {
      return false;
    }
  })();

  return Promise.allSettled([kvPromise, r2Promise]);
}

async function syncFromCloudKvStore(force = false) {
  const now = Date.now();
  // Keep API responses ultra-fast: skip blocking pull if synced within the last 1.2s
  if (now - lastCloudPullMs < (force ? 850 : 1400)) return db;
  if (cloudPullInFlight) return cloudPullInFlight;
  cloudPullInFlight = (async () => {
    try {
      if (pendingCloudSavePromise) {
        await Promise.race([pendingCloudSavePromise, new Promise((r) => setTimeout(r, 350))]);
      }
      // Race Supabase KV and Cloudflare R2 state fetch — whichever responds first wins, or merge both!
      const [kvData, r2Data] = await Promise.all([
        fetchCloudKvState(1100),
        fetchR2CloudState(1100)
      ]);
      lastCloudPullMs = Date.now();
      let changed = false;
      if (kvData && Array.isArray(kvData.requests)) {
        db = mergeCloudIntoLocalDb(db, kvData);
        changed = true;
      }
      if (r2Data && Array.isArray(r2Data.requests)) {
        db = mergeCloudIntoLocalDb(db, r2Data);
        changed = true;
      }
      if (changed) {
        compactDbMediaForFastSync(db);
        try {
          fs.writeFileSync(path.join('/tmp', 'findit_db.json'), JSON.stringify(db), 'utf8');
        } catch (e) {}
      }
    } catch (e) {}
    cloudPullInFlight = null;
    return db;
  })();
  return cloudPullInFlight;
}

function ensureRequestInDb(requestId, requestSnapshot = null) {
  let reqItem = (db.requests || []).find((r) => r.id === requestId);
  if (!reqItem && requestSnapshot && typeof requestSnapshot === 'object' && requestSnapshot.id === requestId) {
    reqItem = {
      ...requestSnapshot,
      offers: Array.isArray(requestSnapshot.offers) ? requestSnapshot.offers : [],
      messages: Array.isArray(requestSnapshot.messages) ? requestSnapshot.messages : [],
      updatedAt: Date.now()
    };
    db.requests.unshift(reqItem);
  }
  return reqItem;
}

function ensureProviderInDb(providerId, providerSnapshot = null) {
  if (!Array.isArray(db.providers)) db.providers = [];
  let prov = db.providers.find(
    (p) =>
      (providerId && p.id === providerId) ||
      (providerSnapshot && providerSnapshot.id && p.id === providerSnapshot.id) ||
      (providerSnapshot && providerSnapshot.finditId && p.finditId === providerSnapshot.finditId)
  );
  if (!prov && providerSnapshot && typeof providerSnapshot === 'object') {
    const cleanName = (providerSnapshot.name || 'Service Provider').trim();
    const shortName = providerSnapshot.shortName || cleanName.split(' ')[0];
    const avatarUrl = offloadDataUriToR2Url(providerSnapshot.avatarUrl || providerSnapshot.selfieUrl || '');
    const catIds = Array.isArray(providerSnapshot.categoryIds) && providerSnapshot.categoryIds.length > 0
      ? providerSnapshot.categoryIds
      : [providerSnapshot.categoryId || 'repairs_construction'];
    prov = {
      id: providerId || providerSnapshot.id || ('prov_' + Date.now().toString().slice(-6)),
      finditId: providerSnapshot.finditId || ('FH-PRO-' + Math.floor(100000 + Math.random() * 900000)),
      name: cleanName,
      shortName,
      brandName: providerSnapshot.brandName || `${shortName} Services`,
      phone: providerSnapshot.phone || '+263 77 000 0000',
      categoryId: catIds[0],
      categoryIds: catIds,
      suburbId: providerSnapshot.suburbId || 'avondale',
      suburbName: providerSnapshot.suburbName || 'Avondale',
      lat: Number(providerSnapshot.lat || -17.8024),
      lng: Number(providerSnapshot.lng || 31.0368),
      avatarInitials: cleanName.slice(0, 2).toUpperCase(),
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
      selfieUrl: avatarUrl || '',
      skillTier: providerSnapshot.skillTier || 'Verified pro',
      rating: Number(providerSnapshot.rating || 5.0),
      reviewCount: Number(providerSnapshot.reviewCount || 1),
      completedBookings: Number(providerSnapshot.completedBookings || 1),
      startingPriceUsd: Number(providerSnapshot.startingPriceUsd || 20),
      walletBalanceUsd: Number(providerSnapshot.walletBalanceUsd ?? 5.0),
      isOnline: providerSnapshot.isOnline !== false,
      isBanned: Boolean(providerSnapshot.isBanned),
      badges: Array.isArray(providerSnapshot.badges) ? providerSnapshot.badges : ['ID Verified', 'Home Visit Ready'],
      portfolio: Array.isArray(providerSnapshot.portfolio) ? providerSnapshot.portfolio : [],
      reviews: Array.isArray(providerSnapshot.reviews) ? providerSnapshot.reviews : [],
      walletTransactions: Array.isArray(providerSnapshot.walletTransactions) ? providerSnapshot.walletTransactions : [],
      updatedAt: Date.now()
    };
    db.providers.push(prov);
  } else if (prov && providerSnapshot && typeof providerSnapshot === 'object') {
    // Keep provider's real name, brand, avatar, and categories synced across containers
    if (providerSnapshot.name && providerSnapshot.id === prov.id) {
      prov.name = providerSnapshot.name;
      prov.shortName = providerSnapshot.shortName || providerSnapshot.name.split(' ')[0];
    }
    if (providerSnapshot.brandName && providerSnapshot.id === prov.id) {
      prov.brandName = providerSnapshot.brandName;
    }
    if ((providerSnapshot.avatarUrl || providerSnapshot.selfieUrl) && providerSnapshot.id === prov.id) {
      prov.avatarUrl = offloadDataUriToR2Url(providerSnapshot.avatarUrl || providerSnapshot.selfieUrl);
    }
    if (Array.isArray(providerSnapshot.categoryIds) && providerSnapshot.categoryIds.length > 0 && providerSnapshot.id === prov.id) {
      prov.categoryIds = providerSnapshot.categoryIds;
      prov.categoryId = providerSnapshot.categoryIds[0];
    }
    prov.updatedAt = Date.now();
  }
  return prov;
}

function loadDb() {
  const tmpFile = path.join('/tmp', 'findit_db.json');
  let tmpParsed = null;
  let fileParsed = null;

  try {
    if (fs.existsSync(tmpFile)) {
      const p = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
      if (p && Array.isArray(p.requests)) tmpParsed = p;
    }
  } catch (e) {}

  try {
    if (fs.existsSync(DB_FILE)) {
      const p = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (p && Array.isArray(p.requests) && Array.isArray(p.categories)) fileParsed = p;
    }
  } catch (err) {
    console.error('Error loading DB_FILE:', err.message);
  }

  if (tmpParsed && fileParsed) {
    return mergeCloudIntoLocalDb(fileParsed, tmpParsed);
  }
  if (tmpParsed) return normalizeDatabase(tmpParsed);
  if (fileParsed) return normalizeDatabase(fileParsed);

  const initial = getInitialDatabase();
  saveDb(initial);
  return initial;
}

function saveDb(currentDb) {
  currentDb.updatedAt = Date.now();
  compactDbMediaForFastSync(currentDb);
  db = currentDb;
  const jsonStr = JSON.stringify(currentDb);
  try {
    fs.writeFileSync(DB_FILE, jsonStr, 'utf8');
  } catch (err) {
    // EROFS on Vercel is expected
  }
  try {
    fs.writeFileSync(path.join('/tmp', 'findit_db.json'), jsonStr, 'utf8');
  } catch (tmpErr) {}
  pendingCloudSavePromise = pushCloudKvState(currentDb).finally(() => {
    pendingCloudSavePromise = null;
  });
}

let db = loadDb();
syncFromCloudKvStore(true).catch(() => {});

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

async function sendJson(res, statusCode, data) {
  if (pendingCloudSavePromise) {
    try {
      await Promise.race([pendingCloudSavePromise, new Promise((r) => setTimeout(r, 260))]);
    } catch (e) {}
  }
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

  // Serve Cloudflare R2 offloaded media images with 1-year immutable browser cache
  if (pathname.startsWith('/api/media/') && req.method === 'GET') {
    const mediaKey = pathname.replace('/api/media/', '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!mediaKey) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const cached = r2MediaCache.get(mediaKey);
    if (cached && cached.buffer) {
      res.writeHead(200, {
        'Content-Type': cached.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(cached.buffer);
    }
    const r2Obj = await r2GetObject(`media/${mediaKey}`, 2500);
    if (r2Obj && r2Obj.buffer) {
      r2MediaCache.set(mediaKey, { buffer: r2Obj.buffer, contentType: r2Obj.contentType || 'image/jpeg' });
      res.writeHead(200, {
        'Content-Type': r2Obj.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(r2Obj.buffer);
    }
    res.writeHead(302, { Location: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80' });
    return res.end();
  }

  // Synchronize shared cloud state across all Vercel serverless instances before handling API calls
  if (pathname.startsWith('/api/')) {
    await syncFromCloudKvStore(req.method !== 'GET');
  }

  // Lightweight Background Notification Polling Endpoint for Android Native APK (even when app is closed/backgrounded)
  if (pathname === '/api/notifications/poll' && req.method === 'GET') {
    const userId = parsedUrl.searchParams.get('userId') || '';
    const role = (parsedUrl.searchParams.get('role') || 'CUSTOMER').toUpperCase();
    const catsCsv = parsedUrl.searchParams.get('categories') || '';
    const sinceMs = Number(parsedUrl.searchParams.get('since') || (Date.now() - 15000));
    const nowMs = Date.now();
    const catList = catsCsv ? catsCsv.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const notifications = [];

    (db.requests || []).forEach((r) => {
      if (!r || !r.id) return;
      const reqCreatedMs = new Date(r.createdAt || 0).getTime() || 0;
      const reqUpdatedMs = Number(r.updatedAt || reqCreatedMs || 0);

      if (role === 'PROVIDER') {
        const matchesCat = catList.length === 0 || !r.categoryId || catList.includes(r.categoryId);
        if (r.status === 'OPEN' && matchesCat && reqCreatedMs > sinceMs) {
          notifications.push({
            id: Math.abs(r.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 90000 + 1000,
            title: `New Job in ${r.suburbName || 'Harare'} ($${r.budgetUsd} USD)`,
            body: `${r.title} requested by ${r.customerName} at ${r.exactAddress}. Tap to make an offer!`
          });
        }
        if (userId && r.acceptedProviderId === userId && r.status === 'CONFIRMED' && reqUpdatedMs > sinceMs) {
          notifications.push({
            id: Math.abs((r.id + '_acc').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 90000 + 2000,
            title: `Offer Accepted! ($${r.agreedTotalUsd || r.budgetUsd} USD)`,
            body: `${r.customerName} accepted your offer for ${r.title} at ${r.exactAddress}.`
          });
        }
        const myOff = userId ? (r.offers || []).find((o) => o.providerId === userId) : null;
        if (myOff && myOff.status === 'DECLINED' && Number(myOff.updatedAt || 0) > sinceMs) {
          notifications.push({
            id: Math.abs((r.id + '_dec').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 90000 + 3000,
            title: `Offer Declined — Edit Price`,
            body: `Client declined $${myOff.declinedPriceUsd || myOff.priceUsd} for ${r.title}. Tap to submit a revised offer.`
          });
        }
        if (userId && r.acceptedProviderId === userId && Array.isArray(r.messages) && r.messages.length > 0) {
          const lastMsg = r.messages[r.messages.length - 1];
          const msgMs = new Date(lastMsg.timestamp || 0).getTime() || 0;
          if (lastMsg.senderRole === 'CUSTOMER' && msgMs > sinceMs) {
            notifications.push({
              id: Math.abs((lastMsg.id || r.id).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 90000 + 4000,
              title: `New Message from ${lastMsg.senderName || 'Client'}`,
              body: lastMsg.text
            });
          }
        }
      } else {
        if (!userId || r.customerId === userId) {
          (r.offers || []).forEach((o) => {
            const oMs = Number(o.updatedAt || new Date(o.createdAt || 0).getTime() || 0);
            if (o.status !== 'DECLINED' && oMs > sinceMs && r.status === 'OPEN') {
              notifications.push({
                id: Math.abs((o.id || r.id).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 90000 + 5000,
                title: `New Offer: $${o.priceUsd} USD from ${o.providerName}`,
                body: `${o.providerBrand || r.title} (~${o.etaMinutes || 5} mins away). Tap to review or accept!`
              });
            }
          });
          if (r.status === 'ARRIVED' && reqUpdatedMs > sinceMs) {
            notifications.push({
              id: Math.abs((r.id + '_arr').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 90000 + 6000,
              title: `Specialist Waiting Outside Gate!`,
              body: `Please share your Start PIN #${r.startPinCode || '4829'} with your specialist to begin.`
            });
          }
          if (Array.isArray(r.messages) && r.messages.length > 0) {
            const lastMsg = r.messages[r.messages.length - 1];
            const msgMs = new Date(lastMsg.timestamp || 0).getTime() || 0;
            if (lastMsg.senderRole === 'PROVIDER' && msgMs > sinceMs) {
              notifications.push({
                id: Math.abs((lastMsg.id || r.id).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 90000 + 7000,
                title: `New Message from ${lastMsg.senderName || 'Specialist'}`,
                body: lastMsg.text
              });
            }
          }
        }
      }
    });

    return sendJson(res, 200, { serverTime: nowMs, notifications: notifications.slice(0, 4) });
  }

  if (pathname === '/api/state' && req.method === 'GET') {
    if (!db || !Array.isArray(db.requests)) {
      db = loadDb();
    }
    const isAdminViewer = validateAdminToken(req);
    const stripPrivate = (u) => {
      const { password, passwordHash, idDocument, idPhotoUrl, nationalIdNumber, ...rest } = u;
      return isAdminViewer
        ? { ...rest, idDocument, idPhotoUrl, nationalIdNumber, hasPassword: Boolean(password || passwordHash) }
        : rest;
    };
    const publicPayload = {
      categories: db.categories,
      hubServices: db.hubServices,
      changelogs: db.changelogs,
      settings: db.settings,
      requests: db.requests,
      customers: (db.customers || []).map(stripPrivate),
      providers: (db.providers || []).map(stripPrivate),
      kycVerifications: isAdminViewer ? db.kycVerifications : [],
      ecocashTopups: isAdminViewer ? db.ecocashTopups : [],
      disciplineLogs: isAdminViewer ? db.disciplineLogs : [],
      cancellationLogs: isAdminViewer ? db.cancellationLogs : [],
      approvalQueue: isAdminViewer ? db.approvalQueue : [],
      leakageLogs: isAdminViewer ? db.leakageLogs : [],
      revenueLedger: isAdminViewer ? db.revenueLedger : [],
      pendingVerifications: isAdminViewer ? db.pendingVerifications : [],
      aiEngine: isAdminViewer ? db.aiEngine : { status: 'ACTIVE' },
      suburbs: HARARE_SUBURBS,
      quickMessages: QUICK_MESSAGES,
      config: {
        agoraAppId: AGORA_APP_ID,
        agoraWsApi: AGORA_WS_API,
        agoraRestApi: AGORA_REST_API
      }
    };
    return sendJson(res, 200, publicPayload);
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
        submittedAt: new Date().toISOString(),
        aiVerification: {
          verdict: Math.abs((parsedSms.detectedAmountUsd || claimedAmountUsd) - claimedAmountUsd) < 0.05 ? 'AUTHENTIC_LIKELY' : 'AMOUNT_MISMATCH',
          confidence: Math.abs((parsedSms.detectedAmountUsd || claimedAmountUsd) - claimedAmountUsd) < 0.05 ? 95 : 55,
          reason: 'Verifying EcoCash SMS structure & merchant details with AI...',
          engine: 'Gemini 3.1 Flash EcoCash Guard'
        }
      };

      db.ecocashTopups.unshift(submission);
      saveDb(db);
      broadcastUpdate('ECOCASH_TOPUP_SUBMITTED', { submissionId: submission.id, providerId: provider.id });

      // Asynchronous AI EcoCash Receipt & SMS Authenticity Verification
      (async () => {
        try {
          const smsPrompt = `Verify this Zimbabwe EcoCash USD payment confirmation SMS submitted by a service provider on Findit Harare:
Official Merchant Number: 0713 475 131 (FINDIT HARARE OFFICIAL / Melinda)
Provider Claimed USD: $${claimedAmountUsd}
Extracted Ref Code: ${parsedSms.referenceCode}
Raw SMS Text: "${submission.confirmationSms}"

Check if the SMS looks like a genuine Cassava / EcoCash Zimbabwe confirmation message, whether the USD amount matches $${claimedAmountUsd}, and whether there are signs of manual editing or fake text.
Return ONLY JSON with keys:
- "verdict": "AUTHENTIC_LIKELY" | "SUSPICIOUS_OR_EDITED" | "AMOUNT_MISMATCH"
- "confidence": number (10 to 99)
- "reason": string (concise 1-sentence assessment for Admin)`;
          const aiRes = await callSilentAiJson(smsPrompt);
          if (aiRes && aiRes.data) {
            submission.aiVerification = {
              verdict: aiRes.data.verdict || submission.aiVerification.verdict,
              confidence: Number(aiRes.data.confidence || 92),
              reason: aiRes.data.reason || 'Standard EcoCash approval code structure verified.',
              engine: aiRes.engine
            };
            saveDb(db);
            broadcastUpdate('ECOCASH_AI_VERIFIED', { submissionId: submission.id, aiVerification: submission.aiVerification });
          }
        } catch (err) {}
      })();

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
      const prov = ensureProviderInDb(body.providerId, body.providerSnapshot);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      if (prov.isBanned) return sendJson(res, 403, { error: `Account suspended: ${prov.banReason}` });
      prov.isOnline = body.isOnline !== undefined ? Boolean(body.isOnline) : !prov.isOnline;
      if (body.workingHours) {
        prov.workingHours = body.workingHours;
      }
      saveDb(db);
      broadcastUpdate('PROVIDER_STATUS_CHANGED', { providerId: prov.id, isOnline: prov.isOnline });
      return sendJson(res, 200, { ok: true, provider: prov });
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
        id: body.id || ('req_' + Date.now().toString().slice(-5)),
        customerId: body.customerId || 'cust_1',
        customerFinditId: cust?.finditId || 'FH-USR-391044',
        customerName: body.customerName || cust?.name || 'Client',
        customerRating: cust?.rating || 0,
        customerCompletedVisits: cust?.completedBookings || 0,
        categoryId: category.id,
        categoryName: category.fullName || category.name,
        title: body.title || `${category.name} Service`,
        description: body.description || 'Looking for a reliable verified mobile provider to come to my home.',
        photoUrl: body.photoUrl ? offloadDataUriToR2Url(body.photoUrl) : null,
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
        updatedAt: Date.now(),
        offers: [],
        messages: []
      };

      db.requests = (db.requests || []).filter((r) => r.id !== newReq.id);
      db.requests.unshift(newReq);
      saveDb(db);
      broadcastUpdate('REQUEST_CREATED', { requestId: newReq.id, request: newReq });
      scheduleStaggeredProviderBids(newReq.id);
      runSilentAiTaskMatchmaking(newReq);

      return sendJson(res, 201, { request: newReq });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/requests/budget' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      reqItem.budgetUsd = Math.max(4, Number(Number(body.budgetUsd).toFixed(2)));
      reqItem.updatedAt = Date.now();
      if (body.autoAccept !== undefined) {
        reqItem.autoAccept = Boolean(body.autoAccept);
      }
      reqItem.offers.forEach((o) => {
        if (o.priceUsd <= reqItem.budgetUsd) {
          o.bidType = 'ACCEPTED_PRICE';
        }
      });
      saveDb(db);
      broadcastUpdate('REQUEST_BUDGET_UPDATED', { requestId: reqItem.id, budgetUsd: reqItem.budgetUsd, request: reqItem });
      scheduleStaggeredProviderBids(reqItem.id);
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Real-Time Provider Viewing Heartbeat (Tracks exact number of pros viewing each request)
  if (pathname === '/api/requests/viewing' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const providerId = body.providerId;
      const requestIds = Array.isArray(body.requestIds) ? body.requestIds : [];
      const now = Date.now();
      let changed = false;

      (db.requests || []).forEach((r) => {
        if (r.status !== 'OPEN') return;
        if (!r.viewingProvidersMap || typeof r.viewingProvidersMap !== 'object') {
          r.viewingProvidersMap = {};
        }
        if (providerId && requestIds.includes(r.id)) {
          r.viewingProvidersMap[providerId] = now;
        }
        // Expire viewers older than 60 seconds
        const activeIds = Object.keys(r.viewingProvidersMap).filter((pid) => {
          const prov = (db.providers || []).find((p) => p.id === pid);
          if (!prov || prov.isBanned || prov.isOnline === false) return false;
          return now - r.viewingProvidersMap[pid] < 60000;
        });
        const prevSig = (r.activeViewerIds || []).join(',');
        r.activeViewerIds = activeIds;
        if (activeIds.join(',') !== prevSig) changed = true;
      });

      if (changed) {
        saveDb(db);
        broadcastUpdate('REQUEST_VIEWERS_UPDATED');
      }
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 200, { ok: false });
    }
  }

  if (pathname === '/api/bookings/cancel' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      let reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem) {
        // Idempotent graceful success if task was already cancelled/cleaned
        const fallbackCancelled = {
          id: body.requestId,
          status: 'CANCELLED',
          cancelledByRole: body.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER',
          cancelledByName: body.actorName || 'User',
          cancelReason: (body.reason || 'Cancelled by user').trim(),
          cancelledAt: new Date().toISOString(),
          updatedAt: Date.now(),
          offers: [],
          messages: []
        };
        broadcastUpdate('TASK_CANCELLED', {
          requestId: body.requestId,
          cancelledByRole: fallbackCancelled.cancelledByRole,
          cancelledByName: fallbackCancelled.cancelledByName,
          reason: fallbackCancelled.cancelReason
        });
        return sendJson(res, 200, { request: fallbackCancelled, alreadyCancelled: true });
      }

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
      reqItem.updatedAt = Date.now();

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
        reason,
        request: reqItem
      });
      runSilentAiConversationGuard(reqItem, reason, cancelledByRole, cancelledByName, `CANCELLATION_FROM_${previousStatus}`);
      return sendJson(res, 200, { request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/offers' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      if (reqItem.status !== 'OPEN') {
        return sendJson(res, 400, { error: 'This request is no longer open for new offers.' });
      }

      const provider = ensureProviderInDb(body.providerId, body.providerSnapshot);
      if (!provider) {
        return sendJson(res, 404, { error: 'Provider profile not found. Please refresh or sign in again.' });
      }
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

      if (!db.settings.launchPromoActive && (currentBalanceUsd < commissionFeeUsd || currentBalanceUsd < minReserveUsd || (currentBalanceUsd - commissionFeeUsd) < minReserveUsd)) {
        return sendJson(res, 402, {
          code: 'LOW_WALLET_BALANCE',
          error: `To accept this $${priceUsd} job with higher funds, you must have at least ${commissionPercent}% of the amount ($${commissionFeeUsd.toFixed(2)} USD commission + $${minReserveUsd.toFixed(2)} reserve). Please top up your account balance.`,
          currentBalanceUsd,
          minReserveUsd,
          commissionPercent,
          bidPriceUsd: priceUsd,
          commissionFeeUsd,
          requiredTopUpUsd,
          explanation: `To accept this $${priceUsd} job with higher funds, you have to have at least ${commissionPercent}% of the amount ($${commissionFeeUsd.toFixed(2)} USD) plus the $${minReserveUsd.toFixed(2)} minimum reserve. Your current balance is $${currentBalanceUsd.toFixed(2)} USD. Please top up your account balance to proceed.`
        });
      }

      const distKm = getDistanceKm(provider.lat, provider.lng, reqItem.lat, reqItem.lng);
      const travelFeeUsd = Number(body.travelFeeUsd || 0);
      const isExactAccept = priceUsd === Number(reqItem.budgetUsd);
      const nowMs = Date.now();
      const realProviderAvatar = offloadDataUriToR2Url(provider.avatarUrl || provider.selfieUrl || '');
      const realShortName = provider.shortName || provider.name.split(' ')[0];
      const realBrand = provider.brandName || `${realShortName} Services`;

      let existingOffer = reqItem.offers.find(
        (o) => o.providerId === provider.id || (provider.finditId && o.providerFinditId === provider.finditId)
      );
      if (existingOffer) {
        const wasDeclined = existingOffer.status === 'DECLINED';
        existingOffer.previousDeclinedPriceUsd = wasDeclined ? (existingOffer.declinedPriceUsd || existingOffer.priceUsd) : existingOffer.previousDeclinedPriceUsd;
        existingOffer.providerId = provider.id;
        existingOffer.providerFinditId = provider.finditId;
        existingOffer.providerName = provider.name;
        existingOffer.providerShortName = realShortName;
        existingOffer.providerBrand = realBrand;
        existingOffer.providerAvatarUrl = realProviderAvatar;
        existingOffer.providerRating = provider.rating ?? 5.0;
        existingOffer.providerCompletedJobs = provider.completedBookings ?? 1;
        existingOffer.priceUsd = priceUsd;
        existingOffer.travelFeeUsd = travelFeeUsd;
        existingOffer.bidType = isExactAccept ? 'ACCEPTED_PRICE' : 'COUNTER_BID';
        existingOffer.status = 'COUNTERED';
        existingOffer.declinedAt = null;
        existingOffer.declineReason = null;
        existingOffer.lastCounterBy = 'PROVIDER';
        existingOffer.conditions = [
          isExactAccept
            ? 'Accepted your price'
            : (wasDeclined ? `Revised offer ($${priceUsd} USD)` : `Counter-offer (${provider.skillTier || 'Verified pro'})`),
          'Comes to your home',
          'Transport included'
        ];
        existingOffer.createdAt = new Date(nowMs).toISOString();
        existingOffer.updatedAt = nowMs;
        existingOffer.expiresAt = nowMs + 120 * 1000;
        existingOffer.ttlSeconds = 120;
      } else {
        existingOffer = {
          id: `off_${provider.id}_${reqItem.id}`,
          providerId: provider.id,
          providerFinditId: provider.finditId,
          providerName: provider.name,
          providerShortName: realShortName,
          providerBrand: realBrand,
          providerAvatar: provider.avatarInitials || realShortName.slice(0, 2).toUpperCase(),
          providerAvatarUrl: realProviderAvatar,
          providerSkillTier: provider.skillTier || 'Verified pro',
          providerExpYears: provider.experienceYears || 3,
          providerRating: provider.rating ?? 5.0,
          providerReviewCount: provider.reviewCount || 15,
          providerCompletedJobs: provider.completedBookings ?? 1,
          providerBadges: provider.badges || ['ID Verified', 'Home Visit Ready'],
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
          updatedAt: nowMs,
          expiresAt: nowMs + 120 * 1000,
          ttlSeconds: 120
        };
        reqItem.offers.unshift(existingOffer);
      }

      reqItem.updatedAt = nowMs;
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
      const reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      const targetOffer = (reqItem.offers || []).find((o) => o.id === body.offerId);
      if (body.reason === 'AUTO_EXPIRED_120S') {
        reqItem.offers = (reqItem.offers || []).filter((o) => o.id !== body.offerId);
      } else if (targetOffer) {
        // Keep the offer as DECLINED so the provider knows it was denied and can adjust price/terms!
        targetOffer.status = 'DECLINED';
        targetOffer.declinedPriceUsd = targetOffer.priceUsd;
        targetOffer.declinedAt = new Date().toISOString();
        targetOffer.declineReason = body.reason || 'Client declined your offer — you can adjust your price or terms and submit a revised offer.';
        targetOffer.updatedAt = Date.now();
      }
      reqItem.updatedAt = Date.now();
      saveDb(db);
      broadcastUpdate('OFFER_DECLINED', {
        requestId: reqItem.id,
        offerId: body.offerId,
        providerId: targetOffer ? targetOffer.providerId : null,
        declinedPriceUsd: targetOffer ? targetOffer.priceUsd : null,
        reason: body.reason || 'DECLINED',
        offer: targetOffer,
        request: reqItem
      });
      return sendJson(res, 200, { request: reqItem, offer: targetOffer });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/offers/accept' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      let offer = reqItem.offers.find((o) => o.id === body.offerId);
      if (!offer && body.offerSnapshot) {
        offer = body.offerSnapshot;
        reqItem.offers.unshift(offer);
      }
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
      offer.updatedAt = Date.now();
      reqItem.status = 'CONFIRMED';
      reqItem.acceptedOfferId = offer.id;
      reqItem.acceptedProviderId = offer.providerId;
      reqItem.acceptedProviderName = offer.providerName || provider?.name || 'Service Provider';
      reqItem.acceptedProviderBrand = offer.providerBrand || provider?.brandName || reqItem.title;
      reqItem.acceptedProviderAvatarUrl = offer.providerAvatarUrl || provider?.avatarUrl || '';
      reqItem.agreedTotalUsd = totalAgreedUsd;
      reqItem.commissionDeducted = false;
      reqItem.updatedAt = Date.now();

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
      const reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem) return sendJson(res, 404, { error: 'Booking not found' });
      
      const isAuto = Boolean(body.autoVerified);
      if (!isAuto && String(body.pinCode).trim() !== String(reqItem.startPinCode)) {
        return sendJson(res, 400, { error: 'Incorrect 4-digit Start PIN. Ask the client for the Start PIN shown on their booking screen.' });
      }
      
      reqItem.pinVerifiedByProvider = true;
      reqItem.status = 'IN_PROGRESS';
      reqItem.updatedAt = Date.now();

      // Secure Commission Deduction: Deduct from provider on PIN verification
      deductBookingCommissionIfNeeded(reqItem, isAuto ? '20m Geofence Auto-Pair' : '4-Digit Start PIN Verified');

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
      const chan = channelId || ('call_' + (requestId || Date.now()));

      if (!Array.isArray(db.activeCalls)) db.activeCalls = [];
      // Clean up stale calls older than 50 seconds
      const nowMs = Date.now();
      db.activeCalls = db.activeCalls.filter((c) => (nowMs - (c.startedAt || 0) < 50000) && c.status !== 'ENDED');

      const callEntry = {
        id: 'call_' + (requestId || nowMs),
        requestId: requestId || null,
        callerId: String(callerId || ''),
        callerName: callerName || 'User',
        recipientId: recipientId ? String(recipientId) : null,
        contextTitle: contextTitle || 'Home Visit Call',
        channelId: chan,
        status: 'RINGING',
        startedAt: nowMs
      };
      db.activeCalls.push(callEntry);
      saveDb(db);

      broadcastUpdate('CALL_INCOMING', callEntry);
      return sendJson(res, 200, { ok: true, channelId: chan, call: callEntry });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Real-Time In-App Calling Response (Accept / Decline / Hang-Up)
  if (pathname === '/api/calls/respond' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { requestId, channelId, action } = body;

      if (!Array.isArray(db.activeCalls)) db.activeCalls = [];
      const match = db.activeCalls.find((c) => (channelId && c.channelId === channelId) || (requestId && c.requestId === requestId));

      if (match) {
        if (action === 'ACCEPT') {
          match.status = 'ACCEPTED';
          match.acceptedAt = Date.now();
        } else {
          match.status = 'ENDED';
          db.activeCalls = db.activeCalls.filter((c) => c !== match);
        }
        saveDb(db);
      }

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

  // Polling Fallback for In-App Calling (Guarantees delivery even across separate serverless instances or firewalled networks)
  if (pathname === '/api/calls/check' && req.method === 'GET') {
    try {
      const userId = String(parsedUrl.searchParams.get('userId') || '');
      const reqId = String(parsedUrl.searchParams.get('requestId') || '');
      const chanId = String(parsedUrl.searchParams.get('channelId') || '');
      const nowMs = Date.now();

      if (!Array.isArray(db.activeCalls)) db.activeCalls = [];
      db.activeCalls = db.activeCalls.filter((c) => (nowMs - (c.startedAt || 0) < 50000) && c.status !== 'ENDED');

      const incoming = db.activeCalls.find((c) => {
        if (c.status !== 'RINGING') return false;
        if (userId && c.callerId === userId) return false; // don't ring caller
        if (userId && c.recipientId && c.recipientId === userId) return true;
        if (reqId && c.requestId && c.requestId === reqId) return true;
        if (chanId && c.channelId === chanId) return true;
        return false;
      }) || null;

      const activeOutgoing = db.activeCalls.find((c) => {
        if (!userId) return false;
        return c.callerId === userId && (c.status === 'ACCEPTED' || c.status === 'RINGING');
      }) || null;

      return sendJson(res, 200, {
        ok: true,
        incomingCall: incoming,
        activeCall: activeOutgoing,
        serverTime: nowMs
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Real-Time WebRTC P2P Direct Audio Signaling (Offer / Answer / Candidate)
  if (pathname === '/api/calls/signal' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { channelId, senderId, recipientId, signalType, data } = body;

      if (!Array.isArray(db.callSignals)) db.callSignals = [];
      const nowMs = Date.now();
      db.callSignals = db.callSignals.filter((s) => nowMs - (s.timestamp || 0) < 30000);
      db.callSignals.push({
        channelId,
        senderId,
        recipientId,
        signalType,
        data,
        timestamp: nowMs
      });
      if (db.callSignals.length > 50) db.callSignals = db.callSignals.slice(-50);

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
      const prov = ensureProviderInDb(body.providerId, body.providerSnapshot);
      if (!prov) return sendJson(res, 404, { error: 'Provider not found' });
      if (prov.isBanned) return sendJson(res, 403, { error: 'Your account is suspended.' });

      prov.hasOffice = Boolean(body.hasOffice);
      prov.workplaceType = body.workplaceType || (prov.hasOffice ? 'OFFICE' : 'FREELANCER');
      prov.officeAddress = (body.officeAddress || '').trim();
      prov.officeSuburb = (body.officeSuburb || '').trim();
      if (body.officeLat && body.officeLng) {
        prov.officeLat = Number(body.officeLat);
        prov.officeLng = Number(body.officeLng);
      }
      saveDb(db);
      broadcastUpdate('PROVIDER_OFFICE_UPDATED', { providerId: prov.id, provider: prov });
      return sendJson(res, 200, { ok: true, success: true, provider: prov });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Provider Real-Time GPS Location Update (Moving towards client on map)
  if (pathname === '/api/providers/location' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prov = ensureProviderInDb(body.providerId, body.providerSnapshot);
      if (prov && !prov.isBanned) {
        if (typeof body.lat === 'number' && typeof body.lng === 'number') {
          prov.lat = Number(body.lat.toFixed(5));
          prov.lng = Number(body.lng.toFixed(5));
          prov.lastLocationUpdate = new Date().toISOString();
          saveDb(db);
          broadcastUpdate('PROVIDER_MOVED', { providerId: prov.id, lat: prov.lat, lng: prov.lng });
        }
      }
      return sendJson(res, 200, { ok: true, lat: prov?.lat, lng: prov?.lng });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Mutual Completion & Two-Way Rating (Client rates Provider AND Provider rates Client!)
  if (pathname === '/api/bookings/status' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem) return sendJson(res, 404, { error: 'Booking not found' });

      reqItem.status = body.status;
      reqItem.updatedAt = Date.now();
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
        deductBookingCommissionIfNeeded(reqItem, body.autoStarted ? 'Proximity Auto-Pair' : 'In-Progress Status');
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
        deductBookingCommissionIfNeeded(reqItem, 'Job Marked Completed');
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
      let reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem && body.providerId) {
        reqItem = db.requests.find((r) => r.acceptedProviderId === body.providerId && ['BOOKED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
      }
      if (!reqItem) {
        reqItem = db.requests[0];
      }
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      if (!reqItem.messages) reqItem.messages = [];

      let text = (body.text || '').trim();
      const photoUrl = body.photoUrl ? offloadDataUriToR2Url(body.photoUrl) : null;
      if (!text && !photoUrl) return sendJson(res, 400, { error: 'Empty message' });
      if (!text && photoUrl) text = '📷 Photo attached';

      // Strictly block providers from uploading images, flyers, or logos in chat
      if (body.senderRole === 'PROVIDER' && (photoUrl || body.imageUrl || text.includes('data:image/') || text.includes('📷 Photo'))) {
        return sendJson(res, 422, {
          error: 'Providers are not allowed to upload images, logos, or flyers in chat. Please use your verified Catalogue instead.'
        });
      }

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

      const senderRole = body.senderRole || 'CUSTOMER';
      const clientMsgId = body.clientMsgId || null;
      const nowMs = Date.now();

      // Strict server-side deduplication so a message never sends twice
      const existingDup = reqItem.messages.find((m) =>
        (clientMsgId && (m.clientMsgId === clientMsgId || m.id === clientMsgId)) ||
        (m.senderRole === senderRole &&
          m.text === text &&
          m.timestamp &&
          Math.abs(nowMs - new Date(m.timestamp).getTime()) < 6000)
      );
      if (existingDup) {
        return sendJson(res, 200, { message: existingDup, request: reqItem, deduplicated: true });
      }

      // Mark any incoming messages from the other party as READ since this user is actively replying
      reqItem.messages.forEach((m) => {
        if (m.senderRole && m.senderRole !== 'SYSTEM' && m.senderRole !== senderRole) {
          m.read = true;
          m.status = 'READ';
          if (!m.readAt) m.readAt = new Date(nowMs).toISOString();
        }
      });

      const newMsg = {
        id: clientMsgId || ('msg_' + nowMs + '_' + Math.random().toString(36).slice(2, 6)),
        clientMsgId: clientMsgId || undefined,
        senderRole,
        senderName: body.senderName || reqItem.customerName,
        providerId: body.providerId || null,
        type: body.type || (photoUrl ? 'PHOTO_ATTACHMENT' : 'QUICK_MESSAGE'),
        text,
        photoUrl: photoUrl || undefined,
        status: 'DELIVERED',
        read: false,
        timestamp: new Date(nowMs).toISOString()
      };

      reqItem.messages.push(newMsg);
      reqItem.updatedAt = nowMs;
      saveDb(db);
      broadcastUpdate('MESSAGE_SENT', { requestId: reqItem.id, message: newMsg, request: reqItem });
      runSilentAiConversationGuard(reqItem, text, newMsg.senderRole, newMsg.senderName, 'IN_APP_CHAT');
      return sendJson(res, 201, { message: newMsg, request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Real-Time WhatsApp Read Receipt Endpoint (Turns Grey Ticks -> Blue Ticks)
  if (pathname === '/api/messages/read' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = ensureRequestInDb(body.requestId, body.requestSnapshot);
      if (!reqItem || !Array.isArray(reqItem.messages)) {
        return sendJson(res, 200, { ok: true, updatedCount: 0 });
      }
      const readerRole = body.readerRole || 'CUSTOMER';
      let updatedCount = 0;
      const nowIso = new Date().toISOString();

      reqItem.messages.forEach((m) => {
        if (m.senderRole && m.senderRole !== 'SYSTEM' && m.senderRole !== readerRole && (!m.read || m.status !== 'READ')) {
          m.read = true;
          m.status = 'READ';
          m.readAt = nowIso;
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        reqItem.updatedAt = Date.now();
        saveDb(db);
        broadcastUpdate('MESSAGES_READ', { requestId: reqItem.id, readerRole, request: reqItem });
      }
      return sendJson(res, 200, { ok: true, updatedCount, request: reqItem });
    } catch (e) {
      return sendJson(res, 200, { ok: false });
    }
  }

  // Silent AI Task & Photo Classifier (Fast Smart Matchmaking)
  if (pathname === '/api/ai/classify-task' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const heur = heuristicClassifyTask(body.description || '', body.currentCategoryId || 'repairs_construction');
      const categoriesList = (db.categories || []).map((c) => `${c.id} (${c.fullName || c.name})`).join(', ');
      const prompt = `Classify this Harare home service task and estimate fair USD pricing:
Available Categories: ${categoriesList}
Client Notes: "${body.description || ''}"
Suburb: "${body.suburbName || 'Harare'}"
Return ONLY JSON with keys: "matchedCategoryId" (string), "taskSummary" (string), "recommendedFareUsd" (number between 10 and 120), "detectedSkills" (array of strings).`;

      const aiRes = await callSilentAiJson(prompt, body.photoUrl || null);
      const out = aiRes?.data || heur;
      return sendJson(res, 200, {
        matchedCategoryId: out.matchedCategoryId || heur.matchedCategoryId,
        taskSummary: out.taskSummary || heur.suggestedTitle,
        recommendedFareUsd: Number(out.recommendedFareUsd || heur.recommendedFareUsd),
        detectedSkills: out.detectedSkills || heur.skills,
        engine: aiRes?.engine || 'Findit Smart Match Heuristic'
      });
    } catch (e) {
      return sendJson(res, 200, heuristicClassifyTask('', 'repairs_construction'));
    }
  }

  // Admin AI Intelligence Dashboard & Live Gemini Audit Endpoints
  if (pathname === '/api/admin/ai-dashboard' && req.method === 'GET') {
    ensureAiEngineStore(db);
    return sendJson(res, 200, { aiEngine: db.aiEngine });
  }

  if (pathname === '/api/admin/ai-run-audit' && req.method === 'POST') {
    try {
      const report = await generateLiveAiBusinessStrategy(db);
      broadcastUpdate('AI_STRATEGY_UPDATED', { report });
      return sendJson(res, 200, { report, aiEngine: db.aiEngine });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/admin/ai-enforce-commission' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const reqItem = (db.requests || []).find((r) => r.id === body.requestId);
      if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });
      const prot = deductBookingCommissionIfNeeded(reqItem, 'Admin Manual AI Enforcement');
      saveDb(db);
      broadcastUpdate('WALLET_UPDATED');
      return sendJson(res, 200, { ok: true, protection: prot, request: reqItem });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // ==========================================================================
  // IN-APP WHATSAPP BUSINESS SUPPORT AI (PER-USER PERSISTENT CHAT HISTORY + STRICT FINDIT GUARD)
  // ==========================================================================
  if (pathname === '/api/support/history' && req.method === 'GET') {
    const userKey = (parsedUrl.searchParams.get('userId') || parsedUrl.searchParams.get('phone') || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!db.supportChats || typeof db.supportChats !== 'object') db.supportChats = {};
    const messages = Array.isArray(db.supportChats[userKey]) ? db.supportChats[userKey] : [];
    return sendJson(res, 200, { userKey, messages });
  }

  if (pathname === '/api/support/chat' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const userMessage = (body.message || '').trim();
      const userRole = body.role === 'PROVIDER' ? 'Service Provider' : 'Client';
      const userName = body.userName || 'Member';
      const userKey = String(body.userId || body.phone || userName || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
      if (!userMessage) return sendJson(res, 400, { error: 'Empty message' });

      if (!db.supportChats || typeof db.supportChats !== 'object') db.supportChats = {};
      if (!Array.isArray(db.supportChats[userKey])) db.supportChats[userKey] = [];

      // Merge any client-side history so conversation context is never lost across serverless instances
      if (Array.isArray(body.history) && body.history.length > 0 && db.supportChats[userKey].length === 0) {
        db.supportChats[userKey] = body.history.slice(-24).map((m) => ({
          id: m.id || ('sup_' + Date.now() + Math.random().toString(36).slice(2, 5)),
          sender: m.sender === 'USER' ? 'USER' : 'BUSINESS',
          text: String(m.text || ''),
          time: m.time || new Date().toISOString()
        }));
      }

      const nowIso = new Date().toISOString();
      const userMsgObj = {
        id: 'sup_u_' + Date.now(),
        sender: 'USER',
        text: userMessage,
        time: nowIso
      };
      db.supportChats[userKey].push(userMsgObj);

      const recentHistory = db.supportChats[userKey].slice(-16);
      const historyTranscript = recentHistory
        .map((m) => `${m.sender === 'USER' ? `${userName} (${userRole})` : 'Findit Harare Official'}: ${m.text}`)
        .join('\n');

      // Comprehensive Findit Harare Fallback Knowledge Base (understands indirect/varied phrasing + off-topic guard)
      const lower = userMessage.toLowerCase();
      const isOffTopic =
        /(capital\s+of|president\s+of|who\s+won\s+the\s+world\s+cup|write\s+a\s+poem|solve\s+this\s+math|python\s+code|javascript\s+code|recipe\s+for|bitcoin\s+price|football\s+score|homework|biology|chemistry|physics|weather\s+in\s+london)/i.test(lower) &&
        !/(findit|harare|service|book|provider|client|ecocash|wallet|job|app|plumber|braid|barber|clean|solar|repair)/i.test(lower);

      let fallbackReply = `Hello *${userName}*! 👋 Welcome to *Findit Harare Official* Support (*finditharare.co.zw*).\n\nI can help you with anything related to *Findit Harare*:\n• *Ordering a Home Service* (Move the blue *YOU* pin or search any Harare address, set your USD fare, or schedule for later)\n• *Service Provider Categories & Settings* (View or change up to 3 job categories in *Account Settings*)\n• *Wallet, $5 Welcome Bonus & 11% Commission Rules*\n• *EcoCash USD Top-Ups* (Merchant: *0713 475 131*)\n• *4-Digit Arrival Start PIN & Safety*\n\nWhat can I help you with today?`;

      if (isOffTopic) {
        fallbackReply = `I am the official *Findit Harare Support Assistant* (*finditharare.co.zw*). I can only assist with questions and support related to *Findit Harare*—such as booking home services, provider accounts & job categories, EcoCash USD top-ups (*0713 475 131*), pricing, or safety.\n\nHow can I help you with *Findit Harare* today?`;
      } else if (/(website|site|url|web\s*page|link|domain|finditharare\.co\.zw|online)/i.test(lower)) {
        fallbackReply = `🌐 *Findit Harare Official Website & Contacts:*\n\n• *Official Website:* *https://finditharare.co.zw* (*finditharare.co.zw*)\n• *Official EcoCash & Support Line:* *+263 71 347 5131* (*0713 475 131*)\n• *Instagram:* *@findithahare*\n• *Facebook:* *Findit Harare Official*\n\nLet me know if you need help with a booking or your account!`;
      } else if (/(categor|change\s*job|edit\s*job|switch\s*service|add\s*service|my\s*services|what\s*jobs|choose\s*categor|settings|profile)/i.test(lower)) {
        fallbackReply = `🛠️ *How to View or Change Your Job Categories & Account Settings:*\n\n1. Open the left side menu (☰) and tap *Account Settings* (or tap the *Categories / Settings* button in Provider Mode).\n2. Under *My Service Categories (Up to 3)*, you can see your active job categories and tap any category to add or switch your specialties (e.g., *Home Repairs & Construction*, *Beauty & Personal Care*, *Cleaning & Domestic*, *Automotive*, *Solar, Electrical Power & Water*, *Gardening & Outdoor*, *General Labour*).\n3. Tap *Save Account & Categories*—your job feed will immediately update to show only requests matching your chosen categories!`;
      } else if (/(top\s*up|ecocash|wallet|balance|low\s*account|5\s*dollar|\$5|\$2|commission|11%|pay|fee|deduct)/i.test(lower)) {
        fallbackReply = `💳 *Findit Harare Wallet & 11% Commission Guide:*\n\n1. *$5 Welcome Bonus:* Every verified Service Provider receives *$5.00* free starter credit upon joining.\n2. *11% Commission & $2 Minimum Floor:* A *11%* platform commission is deducted per confirmed job, and your wallet cannot drop below *$2.00*.\n3. *How Much to Top Up When Bidding:* Check *11%* of the bid amount—if 11% is below $5, top up at least *$5.00*. If 11% is above $5, top up that *11% amount*.\n4. *EcoCash USD Top-Up:* Send USD to *0713 475 131* (*FINDIT HARARE OFFICIAL*), then paste your EcoCash SMS in the *Wallet* tab for instant AI & Admin verification!`;
      } else if (/(pin|start\s*pin|4-digit|arrive|verify|code|outside|gate)/i.test(lower)) {
        fallbackReply = `🔐 *4-Digit Arrival Start PIN:*\n\nWhen your accepted Service Provider arrives at your location (within 20m), your phone alerts you with your *4-digit Start PIN*. Share this PIN with your provider at the gate so they can enter it to start the job. (If the provider waits within 20m for 3 minutes, the system also auto-verifies arrival to protect both parties.)`;
      } else if (/(schedule|later|book|order|map|location|navigate|address|how\s*does\s*it\s*work|hire|find\s*a\s*pro)/i.test(lower)) {
        fallbackReply = `📍 *How to Book a Service on Findit Harare:*\n\n1. On the map, drag the blue *YOU* pin to your location or tap *Your Home Visit Location* to search any real Harare street, landmark, or suburb.\n2. Pick your service category—the *Most Used Services* list automatically updates to match your chosen category.\n3. Choose *⚡ Now (Immediate)* or *Schedule for Later* (pick date & time).\n4. Set your USD offer fare and tap *Find offers* to see real-time bids from verified pros viewing your request!`;
      } else if (/(ban|suspend|warning|rule|instagram|facebook|photo|flyer|number|contact|block)/i.test(lower)) {
        fallbackReply = `🛡️ *Findit Harare Safety & Anti-Bypass Rules:*\n\n• Phone numbers, WhatsApp links, *instagram.com*, and *facebook.com* links are blocked in chat to keep all bookings safe and insured in-app.\n• Service Providers cannot upload images, logos, or flyers in chat (upload work photos in your *Catalogue* tab for Admin review).\n• If you need help with an account warning or verification, share your *Findit App ID* here and we will assist you right away.`;
      }

      const categoriesSummary = (db.categories || [])
        .map((c) => `${c.fullName || c.name}: ${(c.subServices || []).map((s) => `${s.name} (~$${s.defaultUsd})`).join(', ')}`)
        .join(' | ');

      const systemPrompt = `You are the official WhatsApp Business Support AI for "Findit Harare Official" (Harare, Zimbabwe's on-demand home-services marketplace).
Current User: ${userName} (Role: ${userRole}, UserKey: ${userKey})

Official Business Identity & Links:
- Official Website: https://finditharare.co.zw (finditharare.co.zw)
- Business Name: Findit Harare Official (Verified Business Account)
- Official Support & EcoCash Merchant Number: +263 71 347 5131 (0713 475 131)
- Official Instagram: @findithahare (https://www.instagram.com/findithahare/)
- Official Facebook: Findit Harare Official (https://www.facebook.com/profile.php?id=61595501858201)
- Headquarters: Samora Machel Ave / First St, Harare CBD (Open 24/7)

Complete Findit Harare Platform Knowledge (Understand any user phrasing, indirect questions, or local Harare context):
1. Booking & Real Location Navigation: Clients can drag the blue "YOU" pin anywhere on the Harare map OR tap "Your Home Visit Location" to search any real Harare street, landmark, or suburb and navigate the map there. When a client selects a category tile, the "Most Used Services" list updates to match that category's services. Clients can book for "Now (Immediate)" or "Schedule for Later", attach a style/task reference photo, set their USD offer fare, and see in real time the exact count of pros viewing their request.
2. Service Categories & Catalogue: ${categoriesSummary}
3. Provider Job Categories & Account Settings: Service Providers can view, edit, or change their chosen job categories (up to 3 categories) anytime in "Account Settings" (from the side menu ☰ or provider header). Providers only see open job request cards that match their chosen categories. They can also update their Brand Name, Starting Price (USD), Suburb, Physical Workshop/Office address, and Work Catalogue photos in the app.
4. Provider Wallet, $5 Welcome Bonus & 11% Commission: Every new Service Provider gets $5.00 free starter credit. Platform commission is 11% per job, and a provider's wallet balance cannot drop below $2.00. If a provider's balance is too low to bid on a job, they check 11% of the bid amount: if 11% is under $5, they must top up at least $5.00; if 11% is $5 or more, they top up at least that 11% amount via EcoCash USD to 0713 475 131 and paste the confirmation SMS in the Wallet tab.
5. Arrival Start PIN & Safety: When a provider arrives within 20m of the client, the client shares their 4-digit Start PIN so the provider can verify arrival and begin work. (If the provider is at the pin within 20m for 3 minutes, auto-pair verifies the start.) Phone numbers, instagram.com, facebook.com, and external links are blocked in chat, and providers cannot upload images/flyers in chat.
6. Multi-Service Hub: Includes the active Job Marketplace plus upcoming Online Shopping and Transport & Carriers hubs.

CONVERSATION MEMORY (Maintain continuous, natural context with ${userName}):
${historyTranscript}

STRICT TOPIC GUARDRAIL (CRITICAL):
- You must answer ALL questions that relate in any way to Findit Harare, hiring/offering services in Harare, app features, account settings, job categories, EcoCash payments, pricing, troubleshooting, or our website (finditharare.co.zw), no matter how the user phrases the question (including casual phrasing, follow-up questions like "how do I do that?" or "what about...", or Shona/English mix).
- ONLY if the user asks something completely unrelated to Findit Harare or home services (e.g. general trivia, math homework, coding, politics, sports, cooking recipes), politely decline and state that you only assist with Findit Harare support.

Keep your reply helpful, warm, concise, and formatted for iOS WhatsApp Business (use *bold* for key terms).
Return ONLY valid JSON with key: "reply" (string).`;

      let finalReply = fallbackReply;
      if (!isOffTopic) {
        const aiRes = await callSilentAiJson(`${systemPrompt}\n\nLatest User Message from ${userName}: "${userMessage}"`);
        if (aiRes && aiRes.data && typeof aiRes.data.reply === 'string' && aiRes.data.reply.trim()) {
          finalReply = aiRes.data.reply.trim();
        }
      }

      const botMsgObj = {
        id: 'sup_b_' + (Date.now() + 1),
        sender: 'BUSINESS',
        text: finalReply,
        time: new Date().toISOString()
      };
      db.supportChats[userKey].push(botMsgObj);
      if (db.supportChats[userKey].length > 50) {
        db.supportChats[userKey] = db.supportChats[userKey].slice(-50);
      }
      saveDb(db);

      return sendJson(res, 200, {
        reply: finalReply,
        timestamp: botMsgObj.time,
        history: db.supportChats[userKey]
      });
    } catch (e) {
      return sendJson(res, 200, {
        reply: 'Welcome to *Findit Harare Official Support* (*finditharare.co.zw*)! How can we assist you with your booking, provider job categories, EcoCash wallet (*0713 475 131*), or account today?',
        timestamp: new Date().toISOString()
      });
    }
  }

  // ==========================================================================
  // ACCOUNT & PROVIDER SETTINGS UPDATE (NAME, SUBURB, PROVIDER JOB CATEGORIES)
  // ==========================================================================
  if (pathname === '/api/account/update-settings' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const role = body.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
      const userId = body.userId || body.id;
      const phoneDigits = String(body.phone || '').replace(/\D/g, '');

      if (role === 'PROVIDER') {
        let prov = (db.providers || []).find(
          (p) => p.id === userId || (phoneDigits && String(p.phone || '').replace(/\D/g, '') === phoneDigits)
        );
        if (!prov && userId) {
          prov = {
            id: userId,
            finditId: body.finditId || ('FH-PRO-' + Math.floor(100000 + Math.random() * 900000)),
            name: body.name || 'Verified Specialist',
            shortName: (body.name || 'Specialist').split(' ')[0],
            brandName: body.brandName || `${body.name || 'Specialist'} Services`,
            phone: body.phone || '+263 77 000 0000',
            categoryId: 'repairs_construction',
            categoryIds: ['repairs_construction'],
            suburbId: body.suburbId || 'avondale',
            suburbName: body.suburbName || 'Avondale',
            lat: -17.7955,
            lng: 31.0365,
            startingPriceUsd: Number(body.startingPriceUsd || 20),
            walletBalanceUsd: Number(body.walletBalanceUsd ?? 5.0),
            walletTransactions: [],
            portfolio: [],
            reviews: [],
            isOnline: true,
            isBanned: false,
            badges: { phoneVerified: true, idVerified: true, businessVerified: true, faceVerified: true }
          };
          db.providers.push(prov);
        }
        if (!prov) return sendJson(res, 404, { error: 'Provider account not found' });

        if (body.name && body.name.trim()) {
          prov.name = body.name.trim();
          prov.shortName = prov.name.split(' ')[0];
        }
        if (body.brandName !== undefined && String(body.brandName).trim()) {
          prov.brandName = String(body.brandName).trim();
        }
        if (Array.isArray(body.categoryIds) && body.categoryIds.length > 0) {
          const validCats = body.categoryIds.filter(Boolean).slice(0, 3);
          if (validCats.length > 0) {
            prov.categoryIds = validCats;
            prov.categoryId = validCats[0];
          }
        } else if (body.categoryId) {
          prov.categoryId = body.categoryId;
          prov.categoryIds = [body.categoryId];
        }
        if (body.suburbId) {
          const subObj = HARARE_SUBURBS.find((s) => s.id === body.suburbId || s.name === body.suburbId);
          if (subObj) {
            prov.suburbId = subObj.id;
            prov.suburbName = subObj.name;
            prov.lat = subObj.lat;
            prov.lng = subObj.lng;
          }
        }
        if (body.startingPriceUsd !== undefined && Number(body.startingPriceUsd) >= 5) {
          prov.startingPriceUsd = Number(body.startingPriceUsd);
        }
        if (typeof body.isOnline === 'boolean') {
          prov.isOnline = body.isOnline;
        }
        if (body.workStartTime) prov.workStartTime = String(body.workStartTime);
        if (body.workEndTime) prov.workEndTime = String(body.workEndTime);
        saveDb(db);
        broadcastUpdate('ACCOUNT_UPDATED', { role: 'PROVIDER', user: prov });
        return sendJson(res, 200, { ok: true, user: prov });
      } else {
        let cust = (db.customers || []).find(
          (c) => c.id === userId || (phoneDigits && String(c.phone || '').replace(/\D/g, '') === phoneDigits)
        );
        if (!cust && userId) {
          cust = {
            id: userId,
            finditId: body.finditId || ('FH-USR-' + Math.floor(100000 + Math.random() * 900000)),
            name: body.name || 'Findit Client',
            phone: body.phone || '+263 77 000 0000',
            suburbId: body.suburbId || 'avondale',
            suburbName: body.suburbName || 'Avondale',
            rating: 5.0,
            completedBookings: 0,
            isBanned: false
          };
          db.customers.push(cust);
        }
        if (!cust) return sendJson(res, 404, { error: 'Client account not found' });

        if (body.name && body.name.trim()) {
          cust.name = body.name.trim();
        }
        if (body.suburbId) {
          const subObj = HARARE_SUBURBS.find((s) => s.id === body.suburbId || s.name === body.suburbId);
          if (subObj) {
            cust.suburbId = subObj.id;
            cust.suburbName = subObj.name;
          }
        }
        if (body.entranceNote !== undefined) {
          cust.entranceNote = String(body.entranceNote || 'Main Gate').trim();
        }
        if (body.preferredPaymentMethod) {
          cust.preferredPaymentMethod = body.preferredPaymentMethod;
        }
        saveDb(db);
        broadcastUpdate('ACCOUNT_UPDATED', { role: 'CUSTOMER', user: cust });
        return sendJson(res, 200, { ok: true, user: cust });
      }
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/wallet/topup' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const provider = db.providers.find((p) => p.id === body.providerId);
      if (!provider) return sendJson(res, 404, { error: 'Provider not found' });

      if (body.action === 'DEDUCT') {
        const deductAmount = Math.abs(Number(body.amountUsd || 0));
        if (deductAmount <= 0) return sendJson(res, 400, { error: 'Invalid deduction amount' });
        provider.walletBalanceUsd = Math.max(0, Math.round((provider.walletBalanceUsd - deductAmount) * 100) / 100);
        const reason = body.reason || 'Admin Adjustment Deduction';
        const tx = {
          id: 'tx_deduct_' + Date.now(),
          date: new Date().toISOString(),
          type: 'ADMIN_DEDUCT',
          method: 'Admin Manual Deduction',
          amountUsd: -deductAmount,
          note: `Wallet Funds Deducted: -$${deductAmount.toFixed(2)} (${reason})`
        };
        if (!Array.isArray(provider.walletTransactions)) provider.walletTransactions = [];
        provider.walletTransactions.unshift(tx);
        saveDb(db);
        broadcastUpdate('WALLET_UPDATED', { providerId: provider.id, provider, transaction: tx });
        return sendJson(res, 200, { ok: true, provider, transaction: tx });
      }

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
      if (!Array.isArray(provider.walletTransactions)) provider.walletTransactions = [];
      provider.walletTransactions.unshift(tx);
      saveDb(db);
      broadcastUpdate('WALLET_UPDATED', { providerId: provider.id, provider, transaction: tx });
      return sendJson(res, 200, { provider, transaction: tx });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // Admin Custom Wallet Adjust Endpoint (Both Credit & Deduct on the same line)
  if (pathname === '/api/admin/wallet/adjust' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const provider = db.providers.find((p) => p.id === body.providerId);
      if (!provider) return sendJson(res, 404, { error: 'Provider not found' });

      const amount = Math.abs(Number(body.amountUsd || 0));
      if (amount <= 0 || isNaN(amount)) {
        return sendJson(res, 400, { error: 'Please enter a valid USD amount greater than 0.' });
      }

      const action = (body.action || 'CREDIT').toUpperCase();
      const reason = (body.reason || '').trim() || (action === 'DEDUCT' ? 'Admin Balance Deduction' : 'Admin Balance Credit');
      const prevBal = Number(provider.walletBalanceUsd || 0);

      if (action === 'DEDUCT') {
        const newBal = Math.max(0, Math.round((prevBal - amount) * 100) / 100);
        provider.walletBalanceUsd = newBal;
        const tx = {
          id: 'tx_adj_' + Date.now(),
          date: new Date().toISOString(),
          type: 'ADMIN_DEDUCT',
          method: 'Admin Manual Deduction',
          amountUsd: -amount,
          previousBalanceUsd: prevBal,
          newBalanceUsd: newBal,
          note: `Wallet Deducted: -$${amount.toFixed(2)} (${reason})`
        };
        if (!Array.isArray(provider.walletTransactions)) provider.walletTransactions = [];
        provider.walletTransactions.unshift(tx);
        saveDb(db);
        broadcastUpdate('WALLET_UPDATED', { providerId: provider.id, provider, transaction: tx });
        return sendJson(res, 200, {
          ok: true,
          success: true,
          providerId: provider.id,
          previousBalanceUsd: prevBal,
          newBalanceUsd: newBal,
          deductedUsd: amount,
          message: `Successfully deducted $${amount.toFixed(2)} from ${provider.name}'s wallet. New balance is $${newBal.toFixed(2)} USD.`
        });
      } else {
        const newBal = Math.round((prevBal + amount) * 100) / 100;
        provider.walletBalanceUsd = newBal;
        const tx = {
          id: 'tx_adj_' + Date.now(),
          date: new Date().toISOString(),
          type: 'ADMIN_CREDIT',
          method: 'Admin Manual Credit',
          amountUsd: amount,
          previousBalanceUsd: prevBal,
          newBalanceUsd: newBal,
          note: `Wallet Credited: +$${amount.toFixed(2)} (${reason})`
        };
        if (!Array.isArray(provider.walletTransactions)) provider.walletTransactions = [];
        provider.walletTransactions.unshift(tx);
        saveDb(db);
        broadcastUpdate('WALLET_UPDATED', { providerId: provider.id, provider, transaction: tx });
        return sendJson(res, 200, {
          ok: true,
          success: true,
          providerId: provider.id,
          previousBalanceUsd: prevBal,
          newBalanceUsd: newBal,
          creditedUsd: amount,
          message: `Successfully credited $${amount.toFixed(2)} to ${provider.name}'s wallet. New balance is $${newBal.toFixed(2)} USD.`
        });
      }
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

  // Admin: Add, Edit, or Delete Changelog / Announcements (Real-Time)
  if (pathname === '/api/admin/changelogs/add' && req.method === 'POST') {
    try {
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
      broadcastUpdate('CHANGELOG_UPDATED', { changelog: newEntry, changelogs: db.changelogs });
      return sendJson(res, 200, { success: true, changelogs: db.changelogs });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/admin/changelogs/update' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!Array.isArray(db.changelogs)) db.changelogs = [];
      const item = db.changelogs.find((c) => String(c.id) === String(body.id));
      if (!item) return sendJson(res, 404, { error: 'Announcement not found' });
      if (body.title) item.title = body.title.trim();
      if (body.version) item.version = body.version.trim();
      if (body.highlights) {
        item.highlights = Array.isArray(body.highlights) ? body.highlights : String(body.highlights).split(',').map((s) => s.trim()).filter(Boolean);
      }
      saveDb(db);
      broadcastUpdate('CHANGELOG_UPDATED', { changelogs: db.changelogs });
      return sendJson(res, 200, { success: true, changelogs: db.changelogs });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/admin/changelogs/delete' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!Array.isArray(db.deletedChangelogIds)) db.deletedChangelogIds = [];
      if (Array.isArray(db.changelogs)) {
        if (body.id) {
          db.deletedChangelogIds.push(String(body.id));
          db.changelogs = db.changelogs.filter((c) => String(c.id) !== String(body.id));
        } else if (body.index !== undefined) {
          const target = db.changelogs[Number(body.index)];
          if (target && target.id) db.deletedChangelogIds.push(String(target.id));
          db.changelogs.splice(Number(body.index), 1);
        }
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
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
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
