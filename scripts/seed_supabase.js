const fs = require('fs');
const { Client } = require('pg');

async function seed() {
  const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
  const pass = 'tawandadecide#3002';
  const encPass = encodeURIComponent(pass);
  const poolerStr = `postgresql://postgres.bydwwmlbqfsfatacuesu:${encPass}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

  const client = new Client({
    connectionString: poolerStr,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase for seeding...');

  // Seed Customers into public.users
  let userCount = 0;
  for (const c of db.customers || []) {
    const finditId = c.finditId || `FH-USR-${Math.floor(100000 + Math.random() * 900000)}`;
    const phone = c.phone || '+263 77 000 0000';
    const name = c.name || 'Harare Client';
    const rating = c.rating || 5.0;
    const completed = c.completedBookings || 0;
    const nationalId = c.nationalIdNumber || '63-2948102-F-42';

    await client.query(
      `INSERT INTO public.users (findit_id, phone, name, role, rating, completed_bookings, national_id, whatsapp_verified)
       VALUES ($1, $2, $3, 'CUSTOMER', $4, $5, $6, true)
       ON CONFLICT (phone) DO UPDATE
       SET name = EXCLUDED.name`,
      [finditId, phone, name, rating, completed, nationalId]
    );
    userCount++;
  }
  console.log('Seeded customers:', userCount);

  // Seed Providers into public.users & public.providers
  let provCount = 0;
  for (const p of db.providers || []) {
    const finditId = p.finditId || `FH-PRO-${Math.floor(100000 + Math.random() * 900000)}`;
    const phone = p.phone || `+263 77 ${Math.floor(1000000 + Math.random() * 9000000)}`;
    const name = p.name || 'Specialist Pro';
    const rating = p.rating || 5.0;
    const completed = p.completedBookings || 0;

    const userRes = await client.query(
      `INSERT INTO public.users (findit_id, phone, name, role, rating, completed_bookings, whatsapp_verified)
       VALUES ($1, $2, $3, 'PROVIDER', $4, $5, true)
       ON CONFLICT (phone) DO UPDATE
       SET name = EXCLUDED.name
       RETURNING id`,
      [finditId, phone, name, rating, completed]
    );

    const userId = userRes.rows[0]?.id;

    await client.query(
      `INSERT INTO public.providers (
         user_id, findit_id, name, short_name, brand_name, phone, category_id,
         skill_tier, suburb_id, suburb_name, starting_price_usd, wallet_balance_usd,
         is_online, bio, rating, completed_bookings, lat, lng
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (findit_id) DO UPDATE
       SET name = EXCLUDED.name, wallet_balance_usd = EXCLUDED.wallet_balance_usd`,
      [
        userId,
        finditId,
        name,
        p.shortName || name.split(' ')[0],
        p.brandName || `${name} Services`,
        phone,
        p.categoryId || 'braiding',
        p.skillTier || 'Verified pro',
        p.suburbId || 'avondale',
        p.suburbName || 'Avondale',
        p.startingPriceUsd || 25,
        p.walletBalanceUsd || 15.0,
        p.isOnline !== false,
        p.bio || '',
        rating,
        completed,
        p.lat || -17.8252,
        p.lng || 31.0335
      ]
    );
    provCount++;
  }
  console.log('Seeded providers:', provCount);

  // Check counts
  const uRes = await client.query('SELECT count(*) FROM public.users');
  const pRes = await client.query('SELECT count(*) FROM public.providers');
  console.log(`LIVE IN SUPABASE: users = ${uRes.rows[0].count}, providers = ${pRes.rows[0].count}`);

  await client.end();
}

seed().catch((err) => {
  console.error('Seeding error:', err.message);
  process.exit(1);
});
