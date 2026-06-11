import { useMemo } from 'react'
import { Table, Tag, Progress, Typography } from 'antd'
import {
  CarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockVehicules } from '@mock/vehicules'
import { mockDestinations } from '@mock/destinations'
import dayjs from 'dayjs'

const { Text } = Typography

const DEST_COLORS: Record<string, string> = {
  AFO: '#16A34A', CK: '#2563EB', KA: '#0891B2', KE: '#D97706',
  KP: '#7C3AED', KW: '#1D4ED8', NO: '#DC2626', TO: '#B45309',
  'S/C': '#65A30D', POL: '#9F1239',
}
const TYPE_COLORS: Record<string, string> = {
  'Voiture': '#2563EB', 'Camion': '#D97706', 'Moto': '#DC2626',
  'Bus': '#16A34A', 'Pick-up': '#7C3AED', 'Minibus': '#0891B2',
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  sub?: string
}
function StatCard({ label, value, icon, color, sub }: StatCardProps): JSX.Element {
  return (
    <div
      style={{
        flex: 1, background: '#fff', borderRadius: 12,
        borderLeft: `4px solid ${color}`,
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        animation: 'formEnter 0.4s ease',
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: 500 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 10, color, marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
            <RiseOutlined style={{ fontSize: 9 }} />
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section Title ──────────────────────────────────────────────────────────────
function SectionTitle({ label }: { label: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 3, height: 14, background: '#1B3A6B', borderRadius: 2 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#1B3A6B', letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardHome(): JSX.Element {
  const today = dayjs().format('YYYY-MM-DD')

  const stats = useMemo(() => {
    const total = mockVehicules.length
    const totalFcfa = mockVehicules.reduce((s, v) => s + v.montant, 0)
    const todayCount = mockVehicules.filter(v => v.date.startsWith(today)).length
    const frontieres = new Set(mockVehicules.map(v => v.destination)).size
    return { total, totalFcfa, todayCount, frontieres }
  }, [today])

  // Activité par frontière (top 6)
  const destRows = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of mockVehicules) {
      map.set(v.destination, (map.get(v.destination) ?? 0) + 1)
    }
    const max = Math.max(...map.values())
    return Array.from(map.entries())
      .map(([code, count]) => ({
        code,
        nom: mockDestinations.find(d => d.code === code)?.nom ?? code,
        count,
        pct: Math.round((count / max) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [])

  // Répartition par type de véhicule
  const typeRows = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of mockVehicules) {
      map.set(v.typeVehicule, (map.get(v.typeVehicule) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count, pct: Math.round((count / mockVehicules.length) * 100) }))
      .sort((a, b) => b.count - a.count)
  }, [])

  // 5 derniers enregistrements
  const derniers = useMemo(() =>
    [...mockVehicules].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()).slice(0, 5),
    []
  )

  const columns: ColumnsType<typeof derniers[0]> = [
    {
      title: 'N° IMMAT', dataIndex: 'immat', width: 100,
      render: v => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B3A6B', fontSize: 13 }}>{v}</span>
      ),
    },
    {
      title: 'Type', dataIndex: 'typeVehicule', width: 90,
      render: v => (
        <Tag style={{ fontSize: 10, border: 'none', background: `${TYPE_COLORS[v] ?? '#6B7280'}18`, color: TYPE_COLORS[v] ?? '#6B7280', fontWeight: 600 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Marque / Modèle', dataIndex: 'marqueModele',
      render: v => <span style={{ fontSize: 12, color: '#374151' }}>{v}</span>,
    },
    {
      title: 'Frontière', dataIndex: 'destination', width: 90,
      render: v => (
        <Tag style={{ fontWeight: 700, letterSpacing: 0.5, background: DEST_COLORS[v] ?? '#1B3A6B', color: '#fff', border: 'none', fontSize: 10 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Agent', dataIndex: 'agent', width: 90,
      render: v => (
        <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
          <UserOutlined style={{ fontSize: 10 }} />{v}
        </span>
      ),
    },
    {
      title: 'Montant', dataIndex: 'montant', width: 110, align: 'right' as const,
      render: v => <span style={{ fontWeight: 600, color: '#16A34A', fontSize: 12 }}>{v.toLocaleString('fr-FR')} F</span>,
    },
    {
      title: 'Date', dataIndex: 'date', width: 110,
      render: v => (
        <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClockCircleOutlined style={{ fontSize: 10 }} />{dayjs(v).format('DD/MM HH:mm')}
        </span>
      ),
    },
  ]

  return (
    <div style={{
      padding: '16px 20px', height: '100%', overflow: 'auto',
      display: 'flex', flexDirection: 'column', gap: 14,
      animation: 'formEnter 0.35s ease',
    }}>

      {/* ── Ligne 1 : Stat Cards ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard
          label="Véhicules enregistrés"
          value={stats.total}
          icon={<CarOutlined />}
          color="#2563EB"
          sub="Total cumulé"
        />
        <StatCard
          label="FCFA collecté"
          value={`${stats.totalFcfa.toLocaleString('fr-FR')} F`}
          icon={<DollarOutlined />}
          color="#16A34A"
          sub="Toutes frontières"
        />
        <StatCard
          label="Frontières actives"
          value={`${stats.frontieres} / ${mockDestinations.length}`}
          icon={<EnvironmentOutlined />}
          color="#D97706"
          sub="Sur 10 postes"
        />
        <StatCard
          label="Enregistrements du jour"
          value={stats.todayCount}
          icon={<CalendarOutlined />}
          color="#7C3AED"
          sub={`${today}`}
        />
      </div>

      {/* ── Ligne 2 : Activité + Types ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Activité par frontière */}
        <div style={{
          flex: '0 0 58%', background: '#fff', borderRadius: 10,
          padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          <SectionTitle label="Activité par frontière" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {destRows.map(r => (
              <div key={r.code} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag style={{
                  width: 36, textAlign: 'center', fontWeight: 700, fontSize: 10,
                  background: DEST_COLORS[r.code] ?? '#1B3A6B', color: '#fff', border: 'none',
                  flexShrink: 0,
                }}>
                  {r.code}
                </Tag>
                <span style={{ width: 90, fontSize: 11, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.nom}
                </span>
                <div style={{ flex: 1 }}>
                  <Progress
                    percent={r.pct} size="small"
                    strokeColor={DEST_COLORS[r.code] ?? '#1B3A6B'}
                    trailColor="#F3F4F6"
                    format={() => <span style={{ fontSize: 10, color: '#9CA3AF' }}>{r.count}</span>}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par type */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 10,
          padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          <SectionTitle label="Répartition par type" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {typeRows.map(r => (
              <div key={r.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 52, fontSize: 10, color: TYPE_COLORS[r.type] ?? '#6B7280',
                  fontWeight: 700, flexShrink: 0,
                }}>
                  {r.type}
                </span>
                <div style={{ flex: 1 }}>
                  <Progress
                    percent={r.pct} size="small"
                    strokeColor={TYPE_COLORS[r.type] ?? '#6B7280'}
                    trailColor="#F3F4F6"
                    format={() => (
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{r.pct}%</span>
                    )}
                  />
                </div>
                <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: '#374151', textAlign: 'right', flexShrink: 0 }}>
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ligne 3 : Derniers enregistrements ──────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 10,
        padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <SectionTitle label="Derniers enregistrements" />
        <Table
          columns={columns}
          dataSource={derniers}
          rowKey="id"
          size="small"
          pagination={false}
          rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'}
          style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #F3F4F6' }}
        />
      </div>

      {/* Footer discret */}
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <Text style={{ fontSize: 10, color: '#D1D5DB' }}>
          TCIT — Contrôle et Immatriculation Transit · Données mock · {dayjs().format('DD/MM/YYYY')}
        </Text>
      </div>
    </div>
  )
}
