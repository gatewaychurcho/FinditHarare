-- ============================================================================
-- FINDIT HARARE — PRODUCTION SUPABASE POSTGRESQL DATABASE SCHEMA
-- Run this in your Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Clients & Service Providers)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 8)),
  findit_id TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'PROVIDER', 'ADMIN')),
  rating NUMERIC(3, 2) DEFAULT 5.00,
  completed_bookings INT DEFAULT 0,
  avatar_url TEXT,
  national_id TEXT,
  face_verified BOOLEAN DEFAULT FALSE,
  whatsapp_verified BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SERVICE PROVIDERS PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.providers (
  id TEXT PRIMARY KEY DEFAULT ('prov_' || substr(md5(random()::text), 1, 8)),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  findit_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  brand_name TEXT,
  phone TEXT NOT NULL,
  category_id TEXT NOT NULL,
  skill_tier TEXT DEFAULT 'Platinum Pro',
  suburb_id TEXT NOT NULL,
  suburb_name TEXT NOT NULL,
  starting_price_usd NUMERIC(6, 2) DEFAULT 20.00,
  wallet_balance_usd NUMERIC(8, 2) DEFAULT 0.00,
  is_online BOOLEAN DEFAULT TRUE,
  bio TEXT,
  avatar_url TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  completed_bookings INT DEFAULT 0,
  lat DOUBLE PRECISION DEFAULT -17.8252,
  lng DOUBLE PRECISION DEFAULT 31.0335,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORK CATALOGUE / SERVICES OFFERINGS
CREATE TABLE IF NOT EXISTS public.services_catalogue (
  id TEXT PRIMARY KEY DEFAULT ('cat_' || substr(md5(random()::text), 1, 8)),
  provider_id TEXT REFERENCES public.providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price_usd NUMERIC(6, 2) NOT NULL,
  duration TEXT DEFAULT '2 hrs',
  tag TEXT DEFAULT 'Verified Quality',
  image_url TEXT,
  approval_status TEXT DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICE REQUESTS (inDrive-Style Radar Broadcasts)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id TEXT PRIMARY KEY DEFAULT ('req_' || substr(md5(random()::text), 1, 8)),
  customer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  exact_address TEXT NOT NULL,
  suburb_id TEXT NOT NULL,
  suburb_name TEXT NOT NULL,
  budget_usd NUMERIC(6, 2) NOT NULL,
  recommended_fare_usd NUMERIC(6, 2) NOT NULL,
  start_pin_code TEXT NOT NULL,
  lat DOUBLE PRECISION DEFAULT -17.8252,
  lng DOUBLE PRECISION DEFAULT 31.0335,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'BOOKED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  accepted_offer_id TEXT,
  accepted_provider_id TEXT REFERENCES public.providers(id) ON DELETE SET NULL,
  agreed_total_usd NUMERIC(6, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BIDS / COUNTER-OFFERS (Nearby Pros bidding on requests)
CREATE TABLE IF NOT EXISTS public.request_bids (
  id TEXT PRIMARY KEY DEFAULT ('bid_' || substr(md5(random()::text), 1, 8)),
  request_id TEXT REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_id TEXT REFERENCES public.providers(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_avatar TEXT,
  provider_rating NUMERIC(3, 2) DEFAULT 5.00,
  price_usd NUMERIC(6, 2) NOT NULL,
  eta_minutes INT DEFAULT 4,
  message TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GUARDED CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text), 1, 8)),
  request_id TEXT REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('CUSTOMER', 'PROVIDER', 'SYSTEM')),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ECOCASH MANUAL SMS TOP-UPS & RECONCILIATION
CREATE TABLE IF NOT EXISTS public.ecocash_topups (
  id TEXT PRIMARY KEY DEFAULT ('eco_' || substr(md5(random()::text), 1, 8)),
  provider_id TEXT REFERENCES public.providers(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_findit_id TEXT NOT NULL,
  provider_phone TEXT NOT NULL,
  claimed_amount_usd NUMERIC(6, 2) NOT NULL,
  reference_code TEXT NOT NULL,
  confirmation_sms TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 8. MUTUAL RATINGS & REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev_' || substr(md5(random()::text), 1, 8)),
  request_id TEXT REFERENCES public.service_requests(id) ON DELETE CASCADE,
  reviewer_role TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  target_id TEXT NOT NULL,
  rating_stars INT CHECK (rating_stars BETWEEN 1 AND 5),
  tags TEXT[],
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. OFFICIAL ADMIN WARNINGS
CREATE TABLE IF NOT EXISTS public.account_warnings (
  id TEXT PRIMARY KEY DEFAULT ('warn_' || substr(md5(random()::text), 1, 8)),
  account_id TEXT NOT NULL,
  role TEXT NOT NULL,
  reason TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for live radar and chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests, public.request_bids, public.chat_messages, public.ecocash_topups;
