import { useMemo } from 'react'
import { Typography } from 'antd'
import { useVehicules } from '@mock/vehiculesStore'
import { mockDestinations } from '@mock/destinations'
import dayjs from 'dayjs'

const { Text } = Typography

const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
const TYPE_COLORS: Record<string, string> = {
  'Voiture': '#2563EB', 'Camion': '#D97706', 'Moto': '#DC2626',
  'Bus': '#16A34A', 'Pick-up': '#7C3AED', 'Minibus': '#0891B2',
}

function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}

// ── Stat Card — prototype: .sc ───────────────────────────────────────────────
function StatCard({ icon, iconBg, borderColor, value, valueStyle, label, sub }: {
  icon: string; iconBg: string; borderColor: string
  value: string | number; valueStyle?: React.CSSProperties
  label: string; sub: string
}): JSX.Element {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 12,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #F1F5F9',
        borderLeftWidth: 4, borderLeftColor: borderColor,
        cursor: 'default',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.boxShadow = '0 6px 22px rgba(0,0,0,0.1)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Icon — prototype: .si */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        {/* Value — prototype: .sv */}
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', lineHeight: 1, ...valueStyle }}>{value}</div>
        {/* Label — prototype: .sl */}
        <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginTop: 3 }}>{label}</div>
        {/* Sub — prototype: .ss2 */}
        <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  )
}

// ── Section Title — prototype: .dp-t ─────────────────────────────────────────
function SectionTitle({ label }: { label: string }): JSX.Element {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: '#1B3A6B',
      marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6,
    }}>
      {label}
    </div>
  )
}

export default function DashboardHome(): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto à chaque enregistrement
  const today = dayjs().format('YYYY-MM-DD')

  const stats = useMemo(() => {
    const total = vehicules.length
    const totalFcfa = vehicules.reduce((s, v) => s + v.montant, 0)
    const todayCount = vehicules.filter(v => v.date.startsWith(today)).length
    const frontieres = new Set(vehicules.map(v => v.destination)).size
    return { total, totalFcfa, todayCount, frontieres }
  }, [vehicules, today])

  const destRows = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of vehicules) {
      map.set(v.destination, (map.get(v.destination) ?? 0) + 1)
    }
    const max = Math.max(...map.values())
    return Array.from(map.entries())
      .map(([code, count]) => ({ code, count, pct: Math.round((count / max) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [vehicules])

  const typeRows = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of vehicules) {
      map.set(v.typeVehicule, (map.get(v.typeVehicule) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count, pct: Math.round((count / vehicules.length) * 100) }))
      .sort((a, b) => b.count - a.count)
  }, [vehicules])

  const derniers = useMemo(() =>
    [...vehicules].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()).slice(0, 5),
    [vehicules]
  )

  return (
    <div style={{ padding: '16px 20px', height: '100%', overflow: 'auto' }}>

      {/* ── Stat Cards — prototype: .dg ────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18,
      }}>
        <StatCard icon="🚗" iconBg="#EFF6FF" borderColor="#2563EB"
          value={stats.total} label="Véhicules enregistrés" sub="Total cumulé" />
        <StatCard icon="💰" iconBg="#F0FDF4" borderColor="#16A34A"
          value={`${(stats.totalFcfa / 1000).toFixed(0)} 000 F`} valueStyle={{ fontSize: 17 }}
          label="FCFA collecté" sub="Toutes frontières" />
        <StatCard icon="📍" iconBg="#FFFBEB" borderColor="#D97706"
          value={`${stats.frontieres} / ${mockDestinations.length}`}
          label="Frontières actives" sub="Sur 10 postes" />
        <StatCard icon="📅" iconBg="#F5F3FF" borderColor="#7C3AED"
          value={stats.todayCount} label="Enregistrements du jour" sub={today} />
      </div>

      {/* ── Charts row — prototype: .dr ────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>

        {/* Activité par frontière — prototype: .dp flex:1.4 */}
        <div style={{
          flex: 1.4, background: '#fff', borderRadius: 12, padding: 16,
          border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <SectionTitle label="Activité par frontière" />
          {destRows.map(r => (
            <div key={r.code} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
              {/* Code — prototype: .frc */}
              <span style={{ width: 36, fontSize: 10, fontWeight: 800, color: '#1B3A6B' }}>{r.code}</span>
              {/* Bar — prototype: .frb + .frf */}
              <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${r.pct}%`,
                  background: DEST_COLORS[r.code] ?? '#2563EB',
                }} />
              </div>
              {/* Count — prototype: .frn */}
              <span style={{ width: 24, fontSize: 10, color: '#64748B', textAlign: 'right' }}>{r.count}</span>
            </div>
          ))}
        </div>

        {/* Répartition par type — prototype: .dp flex:1 */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 12, padding: 16,
          border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <SectionTitle label="Répartition par type" />
          {typeRows.map(r => (
            <div key={r.type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {/* Type name — prototype: .tyn */}
              <span style={{ width: 64, fontSize: 10, color: '#1E293B' }}>{r.type}</span>
              {/* Bar — prototype: .tyb + .tyf */}
              <div style={{ flex: 1, height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${r.pct}%`,
                  background: TYPE_COLORS[r.type] ?? '#6B7280',
                }} />
              </div>
              {/* Percent — prototype: .typ */}
              <span style={{ width: 30, fontSize: 10, color: '#64748B', textAlign: 'right' }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table — prototype: .dp + .rt ───────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: 16,
        border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <SectionTitle label="Derniers enregistrements" />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['N° IMMAT', 'Type', 'Marque/Modèle', 'Frontière', 'Agent', 'Montant', 'Date'].map(h => (
                <th key={h} style={{
                  fontSize: 9.5, fontWeight: 700, color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  padding: '6px 8px', borderBottom: '1px solid #D1D5DB', textAlign: 'left',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {derniers.map(v => {
              const bg = DEST_COLORS[v.destination] ?? '#2563EB'
              return (
                <tr key={v.id}
                  onMouseEnter={e => { e.currentTarget.querySelectorAll('td').forEach(td => { (td as HTMLElement).style.background = '#F8FAFC' }) }}
                  onMouseLeave={e => { e.currentTarget.querySelectorAll('td').forEach(td => { (td as HTMLElement).style.background = '' }) }}
                >
                  {/* Immat — prototype: .ib */}
                  <td style={{ padding: 8, fontSize: 11, borderBottom: '1px solid #F8FAFC' }}>
                    <span style={{
                      fontFamily: "'Courier New', monospace", fontSize: 10.5, fontWeight: 700,
                      color: '#1B3A6B', background: '#EFF6FF', border: '1px solid #BFDBFE',
                      padding: '2px 6px', borderRadius: 3,
                    }}>{v.immat}</span>
                  </td>
                  <td style={{ padding: 8, fontSize: 11, borderBottom: '1px solid #F8FAFC' }}>{v.typeVehicule}</td>
                  <td style={{ padding: 8, fontSize: 11, borderBottom: '1px solid #F8FAFC' }}>{v.marqueModele}</td>
                  {/* Frontière badge */}
                  <td style={{ padding: 8, fontSize: 11, borderBottom: '1px solid #F8FAFC' }}>
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                      color: destTxt(bg), background: bg,
                    }}>{v.destination}</span>
                  </td>
                  <td style={{ padding: 8, fontSize: 11, borderBottom: '1px solid #F8FAFC' }}>{v.agent}</td>
                  {/* Montant — prototype: .gb */}
                  <td style={{ padding: 8, fontSize: 11, borderBottom: '1px solid #F8FAFC', color: '#16A34A', fontWeight: 700 }}>
                    {(v.montant / 1000).toFixed(0)} 000 F
                  </td>
                  {/* Date */}
                  <td style={{ padding: 8, fontSize: 11, borderBottom: '1px solid #F8FAFC', color: '#64748B' }}>
                    {dayjs(v.date).format('DD/MM/YYYY')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ fontSize: 10, color: '#D1D5DB' }}>
          TCIT — Contrôle et Immatriculation Transit · Données mock · {dayjs().format('DD/MM/YYYY')}
        </Text>
      </div>
    </div>
  )
}
