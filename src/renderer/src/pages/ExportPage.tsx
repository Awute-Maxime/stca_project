import { useState } from 'react'
import { DatePicker, Checkbox, Button, Select, Progress, Alert } from 'antd'
import {
  FileExcelOutlined, FilePdfOutlined, FileTextOutlined,
  DownloadOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockVehicules } from '@mock/vehicules'

const C = {
  blue:   '#1B3A6B',
  accent: '#2563EB',
  green:  '#16A34A',
  gold:   '#F59E0B',
  muted:  '#6B7280',
  border: '#E2E8F0',
  bg:     '#F8FAFF',
}
const { RangePicker } = DatePicker

const COLUMNS_DISPO = [
  { key: 'ref',            label: 'N° Référence' },
  { key: 'date',           label: 'Date' },
  { key: 'immat',          label: 'N° Immatriculation' },
  { key: 'chassis',        label: 'N° Chassis (VIN)' },
  { key: 'typeVehicule',   label: 'Type de véhicule' },
  { key: 'marqueModele',   label: 'Marque / Modèle' },
  { key: 'destination',    label: 'Destination (frontière)' },
  { key: 'nomAcheteur',    label: 'Nom acheteur' },
  { key: 'paysResidence',  label: 'Pays de résidence' },
  { key: 'paysDestination',label: 'Pays de destination' },
  { key: 'parc',           label: 'Parc / Zone' },
  { key: 'agent',          label: 'Agent' },
  { key: 'montant',        label: 'Montant (FCFA)' },
]

const DEFAULT_COLS = ['ref', 'date', 'immat', 'typeVehicule', 'marqueModele', 'destination', 'nomAcheteur', 'montant']

type Format = 'excel' | 'csv' | 'pdf'

const FORMAT_CONFIG: Record<Format, { label: string; icon: React.ReactNode; color: string; ext: string }> = {
  excel: { label: 'Excel (.xlsx)', icon: <FileExcelOutlined />, color: '#16A34A', ext: 'xlsx' },
  csv:   { label: 'CSV (.csv)',    icon: <FileTextOutlined />,  color: '#0891B2', ext: 'csv'  },
  pdf:   { label: 'PDF (.pdf)',    icon: <FilePdfOutlined />,   color: '#DC2626', ext: 'pdf'  },
}

export default function ExportPage(): JSX.Element {
  const [format,    setFormat]    = useState<Format>('excel')
  const [scope,     setScope]     = useState<'all' | 'range'>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [cols,      setCols]      = useState<string[]>(DEFAULT_COLS)
  const [progress,  setProgress]  = useState<number | null>(null)
  const [done,      setDone]      = useState(false)

  const countInRange = scope === 'range' && dateRange
    ? mockVehicules.filter(v => {
        const d = dayjs(v.date)
        return d.isSameOrAfter(dateRange[0], 'day') && d.isSameOrBefore(dateRange[1], 'day')
      }).length
    : mockVehicules.length

  const handleExport = async (): Promise<void> => {
    setDone(false)
    setProgress(0)
    for (let i = 1; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 120))
      setProgress(i * 10)
    }
    setProgress(null)
    setDone(true)
    setTimeout(() => setDone(false), 4000)
  }

  const toggleCol = (key: string): void => {
    setCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const fmt = FORMAT_CONFIG[format]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Header — sub-header beige (modèle Enregistrement, pas de 2e bandeau bleu) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 12, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <DownloadOutlined style={{ color: '#1B3A6B', fontSize: 15 }} />
        <span style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Exportation des Enregistrements de Véhicules
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Colonne gauche */}
        <div>
          {/* Format */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Format d'export
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(Object.keys(FORMAT_CONFIG) as Format[]).map(f => {
                const cfg = FORMAT_CONFIG[f]
                const active = format === f
                return (
                  <button key={f} onClick={() => setFormat(f)} style={{
                    flex: 1, padding: '10px 8px', border: `2px solid ${active ? cfg.color : C.border}`,
                    borderRadius: 7, background: active ? `${cfg.color}0F` : '#fff',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 22, color: cfg.color }}>{cfg.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? cfg.color : C.muted }}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Périmètre */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Périmètre des données
            </div>
            <Select value={scope} onChange={setScope} style={{ width: '100%', marginBottom: 6 }} size="small"
              options={[
                { value: 'all',   label: `Tous les enregistrements (${mockVehicules.length})` },
                { value: 'range', label: 'Plage de dates' },
              ]} />
            {scope === 'range' && (
              <RangePicker format="DD/MM/YYYY" size="small" value={dateRange}
                onChange={v => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} style={{ width: '100%' }} />
            )}
          </div>

          {/* Résumé */}
          <div style={{
            padding: '10px 12px', background: C.bg, border: `1px solid #DDEAFF`,
            borderRadius: 7, fontSize: 11,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: C.muted }}>Enregistrements</span>
              <span style={{ fontWeight: 700, color: C.blue }}>{countInRange}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: C.muted }}>Colonnes sélectionnées</span>
              <span style={{ fontWeight: 700, color: C.blue }}>{cols.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.muted }}>Format</span>
              <span style={{ fontWeight: 700, color: fmt.color }}>{fmt.label}</span>
            </div>
          </div>
        </div>

        {/* Colonne droite — colonnes */}
        <div>
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Colonnes à exporter
          </div>
          <div style={{
            border: `1px solid ${C.border}`, borderRadius: 7, overflow: 'hidden',
            maxHeight: 240, overflowY: 'auto',
          }}>
            {COLUMNS_DISPO.map((col, i) => (
              <div key={col.key} onClick={() => toggleCol(col.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  cursor: 'pointer', borderBottom: i < COLUMNS_DISPO.length - 1 ? `1px solid ${C.border}` : 'none',
                  background: cols.includes(col.key) ? C.bg : '#fff',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!cols.includes(col.key)) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.background = cols.includes(col.key) ? C.bg : '#fff' }}>
                <Checkbox checked={cols.includes(col.key)} onChange={() => toggleCol(col.key)} />
                <span style={{ fontSize: 11, color: C.blue }}>{col.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <Button size="small" onClick={() => setCols(COLUMNS_DISPO.map(c => c.key))} style={{ fontSize: 10 }}>
              Tout sélectionner
            </Button>
            <Button size="small" onClick={() => setCols(DEFAULT_COLS)} style={{ fontSize: 10 }}>
              Sélection par défaut
            </Button>
          </div>
        </div>
      </div>

      {/* Progress + bouton */}
      <div style={{ marginTop: 14 }}>
        {progress !== null && (
          <Progress percent={progress} size="small" strokeColor={fmt.color} style={{ marginBottom: 8 }} />
        )}
        {done && (
          <Alert type="success" showIcon icon={<CheckCircleOutlined />}
            message={`Export terminé — ${countInRange} enregistrement(s) exporté(s) au format ${fmt.ext.toUpperCase()}`}
            style={{ marginBottom: 8, fontSize: 11 }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => { setProgress(null); setDone(false) }}>Réinitialiser</Button>
          <Button type="primary" icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={cols.length === 0 || (scope === 'range' && !dateRange) || progress !== null}
            style={{ background: fmt.color, borderColor: fmt.color }}>
            Exporter {fmt.label}
          </Button>
        </div>
      </div>
    </div>
  )
}
