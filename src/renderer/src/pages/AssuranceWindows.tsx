import { useState, useMemo } from 'react'
import { Table, Select, DatePicker, Button, Tag, Progress } from 'antd'
import { PrinterOutlined, BarChartOutlined, DollarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { mockVehicules } from '@mock/vehicules'
import { mockDestinations } from '@mock/destinations'

const C = {
  blue:   '#1B3A6B',
  accent: '#2563EB',
  green:  '#16A34A',
  gold:   '#F59E0B',
  muted:  '#6B7280',
  border: '#E2E8F0',
  bg:     '#F8FAFF',
  danger: '#DC2626',
}
const { RangePicker } = DatePicker

const DEST_COLORS: Record<string, string> = {
  AFO: '#16A34A', CK: '#2563EB', KA: '#0891B2', KE: '#D97706',
  KP: '#7C3AED', KW: '#1D4ED8', NO: '#DC2626', TO: '#B45309',
  'S/C': '#65A30D', POL: '#9F1239',
}
const TAUX_COMMISSION = 0.05  // 5% de commission TCIT

// ─────────────────────────────────────────────────────────────────────────────
// GAIN GÉNÉRÉ PAR LES ASSURANCES
// ─────────────────────────────────────────────────────────────────────────────
interface AssuranceRow {
  code: string
  nom: string
  nbVehicules: number
  montantTransit: number
  montantAssurance: number
  commission: number
  total: number
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }): JSX.Element {
  return (
    <div style={{
      flex: 1, padding: '10px 14px', background: '#fff',
      border: `1px solid ${C.border}`, borderLeft: `4px solid ${color}`,
      borderRadius: 7, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function AnalyseAssuranceWindow(): JSX.Element {
  const [period, setPeriod] = useState<'semaine' | 'mois' | 'annee'>('mois')

  const rows = useMemo<AssuranceRow[]>(() => {
    const map = new Map<string, { count: number; transit: number }>()
    for (const v of mockVehicules) {
      const prev = map.get(v.destination) ?? { count: 0, transit: 0 }
      map.set(v.destination, { count: prev.count + 1, transit: prev.transit + v.montant })
    }
    const total = mockVehicules.length
    return mockDestinations.map(d => {
      const data = map.get(d.code) ?? { count: 0, transit: 0 }
      const assurance = data.count * 5000
      const commission = assurance * TAUX_COMMISSION
      return {
        code: d.code,
        nom: d.nom,
        nbVehicules: data.count,
        montantTransit: data.transit,
        montantAssurance: assurance,
        commission,
        total: data.transit + assurance,
      }
    }).sort((a, b) => b.nbVehicules - a.nbVehicules)
  }, [])

  const totals = useMemo(() => ({
    vehicules: rows.reduce((s, r) => s + r.nbVehicules, 0),
    transit: rows.reduce((s, r) => s + r.montantTransit, 0),
    assurance: rows.reduce((s, r) => s + r.montantAssurance, 0),
    commission: rows.reduce((s, r) => s + r.commission, 0),
  }), [rows])

  const maxVehicules = Math.max(...rows.map(r => r.nbVehicules))

  const columns: ColumnsType<AssuranceRow> = [
    {
      title: 'Frontière', dataIndex: 'code', width: 140,
      render: (code, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag style={{ fontWeight: 700, background: DEST_COLORS[code] ?? C.blue, color: '#fff', border: 'none', fontSize: 10 }}>{code}</Tag>
          <span style={{ fontSize: 11, color: '#374151' }}>{row.nom}</span>
        </div>
      ),
    },
    {
      title: 'Véhicules', dataIndex: 'nbVehicules', width: 160,
      render: (n) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: C.blue, width: 26, flexShrink: 0 }}>{n}</span>
          <div style={{ flex: 1 }}>
            <Progress percent={Math.round((n / maxVehicules) * 100)} size="small"
              strokeColor={C.accent} trailColor="#F3F4F6" showInfo={false} />
          </div>
        </div>
      ),
    },
    {
      title: 'Transit (FCFA)', dataIndex: 'montantTransit', align: 'right' as const,
      render: v => <span style={{ fontSize: 12, color: C.blue, fontWeight: 500 }}>{v.toLocaleString('fr-FR')}</span>,
    },
    {
      title: 'Assurance (FCFA)', dataIndex: 'montantAssurance', align: 'right' as const,
      render: v => <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{v.toLocaleString('fr-FR')}</span>,
    },
    {
      title: `Commission (${TAUX_COMMISSION * 100}%)`, dataIndex: 'commission', align: 'right' as const,
      render: v => <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>{v.toLocaleString('fr-FR')}</span>,
    },
    {
      title: 'Total collecté', dataIndex: 'total', align: 'right' as const,
      render: v => <span style={{ fontSize: 12, color: C.blue, fontWeight: 800 }}>{v.toLocaleString('fr-FR')} F</span>,
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.accent} 100%)`,
        padding: '8px 12px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChartOutlined style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>GAIN GÉNÉRÉ PAR LES ASSURANCES</span>
        </div>
        <Select value={period} onChange={setPeriod} size="small"
          style={{ width: 130 }}
          options={[
            { value: 'semaine', label: 'Cette semaine' },
            { value: 'mois', label: 'Ce mois' },
            { value: 'annee', label: 'Cette année' },
          ]} />
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <StatCard label="Véhicules assurés" value={String(totals.vehicules)} color={C.blue} />
        <StatCard label="Primes collectées" value={`${totals.assurance.toLocaleString('fr-FR')} F`} color={C.gold} sub="Toutes frontières" />
        <StatCard label="Commission TCIT (5%)" value={`${totals.commission.toLocaleString('fr-FR')} F`} color={C.green} sub="À conserver" />
        <StatCard label="Total transit + assurance" value={`${(totals.transit + totals.assurance).toLocaleString('fr-FR')} F`} color={C.accent} />
      </div>

      <Table
        columns={columns} dataSource={rows} rowKey="code" size="small"
        pagination={false}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}><strong>TOTAL</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={1}><strong style={{ color: C.blue }}>{totals.vehicules}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right"><strong>{totals.transit.toLocaleString('fr-FR')}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right"><strong style={{ color: C.gold }}>{totals.assurance.toLocaleString('fr-FR')}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right"><strong style={{ color: C.green }}>{totals.commission.toLocaleString('fr-FR')}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right"><strong style={{ color: C.blue }}>{(totals.transit + totals.assurance).toLocaleString('fr-FR')} F</strong></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
        style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
        rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button icon={<PrinterOutlined />} style={{ borderColor: C.blue, color: C.blue }}>Imprimer le rapport</Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTANT À RESTITUER
// ─────────────────────────────────────────────────────────────────────────────
interface RestitutionRow {
  agent: string
  nbVehicules: number
  montantCollecte: number
  commission: number
  aReverser: number
}

export function MontantRestituerWindow(): JSX.Element {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [agentFilter, setAgentFilter] = useState<string | undefined>()

  const agents = useMemo(() => [...new Set(mockVehicules.map(v => v.agent))].sort(), [])

  const rows = useMemo<RestitutionRow[]>(() => {
    const map = new Map<string, { count: number; collecte: number }>()
    for (const v of mockVehicules) {
      const prev = map.get(v.agent) ?? { count: 0, collecte: 0 }
      map.set(v.agent, { count: prev.count + 1, collecte: prev.collecte + v.montant + 5000 })
    }
    return Array.from(map.entries())
      .filter(([agent]) => !agentFilter || agent === agentFilter)
      .map(([agent, data]) => {
        const commission = data.collecte * TAUX_COMMISSION
        return {
          agent,
          nbVehicules: data.count,
          montantCollecte: data.collecte,
          commission,
          aReverser: data.collecte - commission,
        }
      })
      .sort((a, b) => b.montantCollecte - a.montantCollecte)
  }, [agentFilter])

  const totalReverser = rows.reduce((s, r) => s + r.aReverser, 0)
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0)

  const columns: ColumnsType<RestitutionRow> = [
    {
      title: 'Agent', dataIndex: 'agent',
      render: v => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: C.bg,
            border: `2px solid ${C.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: C.blue, flexShrink: 0,
          }}>
            {v.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: C.blue, fontSize: 12 }}>{v}</span>
        </div>
      ),
    },
    {
      title: 'Véhicules', dataIndex: 'nbVehicules', width: 90, align: 'center' as const,
      render: v => <span style={{ fontWeight: 600, color: C.blue }}>{v}</span>,
    },
    {
      title: 'Montant collecté (FCFA)', dataIndex: 'montantCollecte', align: 'right' as const,
      render: v => <span style={{ fontSize: 12 }}>{v.toLocaleString('fr-FR')}</span>,
    },
    {
      title: `Commission (${TAUX_COMMISSION * 100}%)`, dataIndex: 'commission', align: 'right' as const,
      render: v => <span style={{ color: C.green, fontWeight: 600, fontSize: 12 }}>{v.toLocaleString('fr-FR')}</span>,
    },
    {
      title: 'Montant à reverser', dataIndex: 'aReverser', align: 'right' as const,
      render: v => (
        <span style={{ fontWeight: 800, color: C.blue, fontSize: 13 }}>
          {v.toLocaleString('fr-FR')} F
        </span>
      ),
    },
    {
      title: '', width: 90, align: 'center' as const,
      render: () => (
        <Button size="small" icon={<PrinterOutlined />} style={{ fontSize: 10, color: C.muted, borderColor: C.border }}>
          Reçu
        </Button>
      ),
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.accent} 100%)`,
        padding: '8px 12px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>MONTANT À RESTITUER</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{dayjs().format('DD/MM/YYYY')}</span>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <RangePicker format="DD/MM/YYYY" size="small" value={dateRange}
          onChange={v => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} style={{ width: 220 }} />
        <Select placeholder="Filtrer par agent" value={agentFilter} onChange={setAgentFilter} allowClear size="small"
          options={agents.map(a => ({ value: a, label: a }))} style={{ width: 160 }} />
      </div>

      {/* Total cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, padding: '10px 14px', background: C.bg, border: `1px solid #DDEAFF`, borderLeft: `4px solid ${C.blue}`, borderRadius: 7 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{rows.reduce((s, r) => s + r.nbVehicules, 0)}</div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total véhicules</div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderLeft: `4px solid ${C.green}`, borderRadius: 7 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{totalCommission.toLocaleString('fr-FR')} F</div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Commission TCIT</div>
        </div>
        <div style={{ flex: 2, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: `4px solid ${C.gold}`, borderRadius: 7 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#92400E' }}>{totalReverser.toLocaleString('fr-FR')} FCFA</div>
          <div style={{ fontSize: 10, color: '#78350F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Montant total à reverser aux agents</div>
        </div>
      </div>

      <Table
        columns={columns} dataSource={rows} rowKey="agent" size="small"
        pagination={false}
        summary={() => (
          <Table.Summary.Row style={{ background: '#EEF2FF' }}>
            <Table.Summary.Cell index={0}><strong>TOTAL GÉNÉRAL</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="center"><strong>{rows.reduce((s, r) => s + r.nbVehicules, 0)}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right"><strong>{rows.reduce((s, r) => s + r.montantCollecte, 0).toLocaleString('fr-FR')}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right"><strong style={{ color: C.green }}>{totalCommission.toLocaleString('fr-FR')}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right"><strong style={{ color: C.blue, fontSize: 13 }}>{totalReverser.toLocaleString('fr-FR')} F</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={5} />
          </Table.Summary.Row>
        )}
        style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
        rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Button icon={<PrinterOutlined />} style={{ borderColor: C.blue, color: C.blue }}>Imprimer le tableau</Button>
      </div>
    </div>
  )
}
