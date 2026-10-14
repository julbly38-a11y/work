// Читає upwork_vacancies із Supabase ключем власника. Ключ лишається на сервері.
const COLS = 'id,title,title_uk,budget,type,client_country,proposals,published,url,description_en,description_uk,client_info';

function pay(x) {
  if (!x.budget) return 'не вказано';
  const b = x.budget.replace(/\.00/g, '');
  return x.type === 'hourly' ? `$${b.replace('/hr', '')}/год` : `$${b} фікс.`;
}

const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'julbly38@gmail.com').toLowerCase();

// Пускає лише власника: дійсна сесія Supabase Auth + підтверджений email власника + роль admin у app_users.
async function isOwner(req, base, key) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const u = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  if (!u.ok) return false;
  const user = await u.json();
  if (!user.email_confirmed_at || (user.email || '').toLowerCase() !== OWNER_EMAIL) return false;
  const r = await fetch(`${base}/rest/v1/app_users?select=role&auth_user_id=eq.${user.id}&role=eq.admin&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return r.ok && (await r.json()).length === 1;
}

export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Supabase env not set' });
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isOwner(req, SUPABASE_URL, SUPABASE_SERVICE_KEY))) return res.status(401).json({ error: 'unauthorized' });

  const r = await fetch(`${SUPABASE_URL}/rest/v1/upwork_vacancies?select=${COLS}&order=published.desc.nullslast&limit=2000`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  if (!r.ok) return res.status(502).json({ error: 'Supabase error', status: r.status });

  const rows = await r.json();
  const jobs = rows.map(x => {
    const { recent_reviews, country, ...client } = x.client_info || {};
    for (const k in client) if (client[k] == null) delete client[k];
    return { id: x.id, title: x.title, title_uk: x.title_uk || '', pay: pay(x), country: x.client_country || '—', date: x.published, proposals: x.proposals || '', url: x.url || '', client, en: x.description_en || '', uk: x.description_uk || '' };
  });
  res.status(200).json(jobs);
}
