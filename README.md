# Findit Harare 🚀
### Modern On-Demand Home Services Marketplace (Harare, Zimbabwe)
*Your Price. Your Pro. At Your Door.*

Findit Harare is an inDrive-inspired peer-to-peer home services marketplace connecting Harare residents with verified local pros (Hair Braiders, Barbers, Nail Technicians, Plumbers, and Home Cleaners).

---

## Key Features

1. **Client Fare Bidding & Negotiation**:
   - Customers propose their budget in USD ($) and can raise or lower offers with a single tap.
   - 120s real-time radar broadcasts requests to nearby verified pros.
2. **Provider Offers & Work Catalogue**:
   - Service providers can submit counter-offers with estimated arrival times.
   - Comprehensive catalogue management: providers can **Add, Edit, and Delete** services with custom pricing and portfolio photos.
3. **Guarded In-App Chat & Leakage Prevention**:
   - Real-time messaging with phone number/handle masking to protect both parties before booking confirmation.
   - Arrival tracking and 4-digit arrival start PIN security.
4. **Prepaid USD EcoCash Wallet & Smart Reconciliation**:
   - Service providers top up via EcoCash merchant transfers (`0772 910 440`).
   - Admin control center includes a **Smart EcoCash SMS Matcher** that automatically reconciles received bank/merchant SMS messages against pending top-ups with 1-click approvals.
5. **Two-Way Star Ratings & Reviews**:
   - Mutual accountability: both clients and providers rate each other after service delivery.
6. **Safety & Official Warnings**:
   - Verified WhatsApp authentication and facial scan liveness checks.
   - Admin disciplinary warning and account ban enforcement with instant dismissal upon acknowledgment.

---

## Tech Stack

- **Frontend**: Lightweight vanilla JavaScript with responsive mobile layout, zero external UI frameworks, and pure vector SVG icons.
- **Maps**: Leaflet.js with OpenStreetMap tiles (no API keys required for development).
- **Backend**: Node.js HTTP/HTTPS server with Server-Sent Events (SSE) for live radar updates.
- **Deployment**: Ready for Vercel, Render, Railway, or AWS.

---

## Local Development

```bash
# 1. Clone repository
git clone https://github.com/gatewaychurcho/FinditHarare.git
cd FinditHarare

# 2. Start server
npm start
```

- App runs at: `http://localhost:3030`
- Admin Dashboard runs at: `http://localhost:3030/admin`

---

## Vercel Deployment

This project includes pre-configured `vercel.json` and `api/index.js` for instant deployment:

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import `FinditHarare`.
4. Deploy!

---

## Production Services Roadmap

- **Database**: PostgreSQL (Supabase / Neon)
- **Real-Time Communication**: Pusher Channels / Supabase Realtime
- **In-App Voice Calling**: Agora.io Voice SDK / WebRTC
- **WhatsApp OTP Verification**: Meta WhatsApp Cloud API
- **Asset Storage**: Cloudinary / Supabase Storage / AWS S3
