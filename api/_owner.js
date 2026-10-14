const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'julbly38@gmail.com').toLowerCase();

// Пускає лише власника: дійсна сесія Supabase Auth + підтверджений email власника + роль admin у app_users.
export async function isOwner(req, base, key) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const u = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  if (!u.ok) return false;
  const user = await u.json();
  if (!user.email_confirmed_at || (user.email || '').toLowerCase() !== OWNER_EMAIL) return false;
  const r = await fetch(`${base}/rest/v1/app_users?select=role&auth_user_id=eq.${user.id}&role=eq.admin&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return r.ok && (await r.json()).length === 1;
}
