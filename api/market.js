import { isOwner } from './_owner.js';

const COLS = 'source,ext_id,title,title_uk,company,location,remote,salary,tags,url,posted_at,matched,first_seen';

// Знахідки моніторингу ринку праці (job_market_postings) — лише для власника.
export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Supabase env not set' });
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isOwner(req, SUPABASE_URL, SUPABASE_SERVICE_KEY))) return res.status(401).json({ error: 'unauthorized' });

  const r = await fetch(`${SUPABASE_URL}/rest/v1/job_market_postings?select=${COLS}&order=first_seen.desc&limit=1000`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  if (!r.ok) return res.status(502).json({ error: 'Supabase error', status: r.status });

  const st = await fetch(`${SUPABASE_URL}/rest/v1/job_market_state?select=last_run,last_new&id=eq.1`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  }).then(x => x.ok ? x.json() : []).catch(() => []);
  res.status(200).json({ postings: await r.json(), state: st[0] || null });
}
