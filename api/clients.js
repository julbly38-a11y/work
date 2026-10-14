import { isOwner } from './_owner.js';

const COLS = 'id,platform_client_id,display_name,country,state,domain,jobs_posted,hire_rate_pct,spend_total_usd,feedback_score,feedback_count,payment_verified,typical_budget_usd,hires_within_minutes,seasonality,our_fit,score,verdict,watch,past_jobs,proposals_sent,connects_spent,last_interaction,notes,first_seen';

// Канон замовників (clients) — лише для власника.
export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Supabase env not set' });
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isOwner(req, SUPABASE_URL, SUPABASE_SERVICE_KEY))) return res.status(401).json({ error: 'unauthorized' });

  const r = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=${COLS}&order=score.desc,spend_total_usd.desc.nullslast&limit=2000`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  if (!r.ok) return res.status(502).json({ error: 'Supabase error', status: r.status });
  res.status(200).json({ clients: await r.json() });
}
