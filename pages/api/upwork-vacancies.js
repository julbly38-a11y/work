import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '../../lib/pii-mask'

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Список вакансій Upwork для власника (таблиця public.upwork_vacancies).
// Службовий ключ лишається на сервері; доступ лише власнику сайту.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end() }

  const { user, owner } = await getSessionUser(req)
  if (!user) return res.status(401).json({ error: 'Потрібен вхід' })
  if (!owner) return res.status(403).json({ error: 'Список доступний лише власнику сайту' })

  try {
    const { data, error } = await sb()
      .from('upwork_vacancies')
      .select('id, query, title, budget, type, client_country, proposals, published, url, imported_at')
      .order('published', { ascending: false, nullsFirst: false })
      .limit(1000)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ count: data.length, vacancies: data })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
