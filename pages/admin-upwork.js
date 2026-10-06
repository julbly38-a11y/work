import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { SANS, MONO } from '../components/shared'

// Сторінка «Upwork» для власника: збережений список вакансій (таблиця upwork_vacancies).
// Дані віддає /api/upwork-vacancies; там та сама перевірка власника на сервері.
export default function AdminUpwork() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('')

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(me => {
      if (!me.is_owner) { router.replace('/'); return }
      setAllowed(true)
    }).catch(() => router.replace('/'))
  }, [router])

  useEffect(() => {
    if (!allowed) return
    fetch('/api/upwork-vacancies')
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Не вдалося завантажити')
        setRows(d.vacancies || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [allowed])

  const countries = useMemo(
    () => [...new Set(rows.map(r => r.client_country).filter(Boolean))].sort(),
    [rows]
  )

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter(r =>
      (!country || r.client_country === country) &&
      (!needle || [r.title, r.query, r.budget].some(v => (v || '').toLowerCase().includes(needle)))
    )
  }, [rows, q, country])

  if (!allowed) return null

  const cell = { padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.08)', fontSize: 13, verticalAlign: 'top' }

  return (
    <>
      <Head><title>Upwork — адмін</title></Head>
      <div style={{ minHeight: '100vh', background: '#f0ece8', padding: '32px 20px', ...SANS }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => router.back()} style={{ fontSize: 12, color: '#4a9870', background: 'none', border: 'none', cursor: 'pointer', padding: 0, ...MONO }}>← назад</button>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>Upwork: вакансії</h1>
            <span style={{ fontSize: 12, color: '#666', ...MONO }}>{shown.length} з {rows.length}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Пошук: назва, запит, оплата"
              style={{ padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(0,0,0,0.2)', minWidth: 260, ...SANS }}
            />
            <select value={country} onChange={e => setCountry(e.target.value)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(0,0,0,0.2)', ...SANS }}>
              <option value="">Усі країни клієнта</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading && <div style={{ fontSize: 13, color: '#666' }}>Завантаження…</div>}
          {error && <div style={{ fontSize: 13, color: '#b00020' }}>{error}</div>}

          {!loading && !error && (
            <div style={{ background: '#fff', borderRadius: 10, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#faf8f5' }}>
                    <th style={cell}>Вакансія</th>
                    <th style={cell}>Оплата</th>
                    <th style={cell}>Тип</th>
                    <th style={cell}>Клієнт</th>
                    <th style={cell}>Заявок</th>
                    <th style={cell}>Опубліковано</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(r => (
                    <tr key={r.id}>
                      <td style={cell}>
                        {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2a6b4f' }}>{r.title}</a> : r.title}
                      </td>
                      <td style={cell}>{r.budget || '—'}</td>
                      <td style={cell}>{r.type || '—'}</td>
                      <td style={cell}>{r.client_country || '—'}</td>
                      <td style={cell}>{r.proposals || '—'}</td>
                      <td style={cell}>{r.published || '—'}</td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr><td style={cell} colSpan={6}>Нічого не знайдено</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
