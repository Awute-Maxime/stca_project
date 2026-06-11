import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Select, DatePicker, Modal, Input, Checkbox, Radio } from 'antd'
import {
  SearchOutlined, CarOutlined, UserOutlined,
  FileAddOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockDestinations } from '@mock/destinations'

const { Option } = Select

const TYPES_VEHICULE = ['Voiture', 'Camion', 'Moto', 'Bus', 'Pick-up', 'Minibus']
const MONTANT_FIXE   = 10000

const C = {
  blue:      '#1B3A6B',
  accent:    '#2563EB',
  gold:      '#F59E0B',
  green:     '#16A34A',
  text:      '#1E293B',
  muted:     '#6B7280',
  border:    '#D1D5DB',
  bgSection: '#F8FAFF',
  danger:    '#DC2626',
}

// ── Progress Dot ──────────────────────────────────────────────────────────────
function ProgressDot({ filled }: { filled: boolean }): JSX.Element {
  return (
    <div style={{
      width: 9, height: 9, borderRadius: '50%',
      background: filled ? '#4ADE80' : 'rgba(255,255,255,0.25)',
      boxShadow: filled ? '0 0 7px rgba(74,222,128,0.8)' : 'none',
      transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
      flexShrink: 0,
    }} />
  )
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, delay = 0, filled = false }: {
  title: string; icon: ReactNode; children: ReactNode; delay?: number; filled?: boolean
}): JSX.Element {
  return (
    <div style={{
      background: C.bgSection,
      border: `1px solid ${filled ? '#BBF7D0' : '#DDEAFF'}`,
      borderLeft: `3px solid ${filled ? C.green : C.accent}`,
      borderRadius: 7,
      padding: '6px 10px',
      marginBottom: 5,
      animation: `sectionSlide 0.35s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      transition: 'border-color 0.3s, border-left-color 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color: filled ? C.green : C.accent, fontSize: 11, transition: 'color 0.3s' }}>
          {icon}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
          color: filled ? C.green : C.blue, transition: 'color 0.3s',
        }}>
          {title}
        </span>
        {filled && (
          <CheckCircleOutlined style={{ color: C.green, fontSize: 11, marginLeft: 'auto' }} />
        )}
      </div>
      {children}
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────────────────────
function Label({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div style={{
      fontSize: 9, color: C.muted, marginBottom: 2,
      letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700,
    }}>
      {children}
    </div>
  )
}

function FieldBox({ label, children, style }: {
  label: string; children: ReactNode; style?: CSSProperties
}): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

const SEL: CSSProperties = { width: '100%', fontSize: 12 }
const ICON_STYLE: CSSProperties = {
  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
  color: '#9CA3AF', fontSize: 11, pointerEvents: 'none',
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function EnregistrementPage(): JSX.Element {
  const [date,            setDate]           = useState(dayjs())
  const [parc,            setParc]           = useState('')
  const [nomAcheteur,     setNomAcheteur]    = useState('')
  const [paysResidence,   setPaysResidence]  = useState('')
  const [paysDestination, setPaysDestination]= useState('')
  const [maisonTransit,   setMaisonTransit]  = useState('')
  const [typeVehicule,    setTypeVehicule]   = useState<string | undefined>()
  const [destination,     setDestination]    = useState<string | undefined>()
  const [marqueModele,    setMarqueModele]   = useState('')
  const [chassis,         setChassis]        = useState('')
  const [numTri,          setNumTri]         = useState('')
  const [dateTri,         setDateTri]        = useState(dayjs())
  const [recycler,        setRecycler]       = useState(false)
  const [ancienneImmat,   setAncienneImmat]  = useState('')
  const [saisirAncienne,  setSaisirAncienne] = useState(false)
  const [immatGenere,     setImmatGenere]    = useState<string | null>(null)
  const [montant,         setMontant]        = useState<number | null>(null)
  const [loading,         setLoading]        = useState(false)
  const [marqueModalOpen, setMarqueModalOpen]= useState(false)
  const [parcModalOpen,   setParcModalOpen]  = useState(false)

  // ── Progress sur 4 critères requis ────────────────────────────────────────
  const progress = [
    parc !== '',
    nomAcheteur !== '',
    typeVehicule !== undefined && marqueModele !== '',
    destination !== undefined,
  ]
  const progressCount = progress.filter(Boolean).length
  const formReady = progressCount === 4

  const handleDestinationChange = (code: string): void => {
    const dest = mockDestinations.find(d => d.code === code)
    if (dest) {
      const num = String(dest.numImmatActuel + 1).padStart(4, '0')
      setImmatGenere(`${dest.lettre}${num}`)
      setMontant(MONTANT_FIXE)
      setDestination(code)
    }
  }

  const handleReset = (): void => {
    setDate(dayjs()); setParc(''); setNomAcheteur(''); setPaysResidence('')
    setPaysDestination(''); setMaisonTransit(''); setTypeVehicule(undefined)
    setDestination(undefined); setMarqueModele(''); setChassis('')
    setNumTri(''); setDateTri(dayjs()); setRecycler(false)
    setAncienneImmat(''); setSaisirAncienne(false)
    setImmatGenere(null); setMontant(null)
  }

  const handleEnregistrer = async (): Promise<void> => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    handleReset()
  }

  const destNom = destination ? (mockDestinations.find(d => d.code === destination)?.nom ?? '') : ''

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      userSelect: 'none',
      animation: 'formEnter 0.35s cubic-bezier(0.16,1,0.3,1)',
      background: '#fff',
    }}>

      {/* ── Header gradient ──────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.accent} 100%)`,
        padding: '6px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        borderRadius: '3px 3px 0 0',
        marginBottom: 7,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileAddOutlined style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
            ENREGISTREMENT DES VÉHICULES
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {progress.map((filled, i) => <ProgressDot key={i} filled={filled} />)}
          <span style={{
            color: formReady ? '#4ADE80' : 'rgba(255,255,255,0.6)',
            fontSize: 9, fontWeight: 600, marginLeft: 5,
            transition: 'color 0.3s',
          }}>
            {formReady ? '✓ Prêt' : `${progressCount}/4 requis`}
          </span>
        </div>
      </div>

      {/* ── Form body ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 8px 6px' }}>

        {/* ── Ligne 1 : Référence + Date + Parc + IMMAT ─────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 150px 1fr auto', gap: 8, marginBottom: 6 }}>

          <FieldBox label="Référence">
            <input className="light-input light-input--ref"
              value={immatGenere ?? ''} readOnly placeholder="Auto-généré"
              style={{ height: 26 }} />
          </FieldBox>

          <FieldBox label="En date du">
            <DatePicker value={date} onChange={v => v && setDate(v)}
              format="DD/MM/YYYY" size="small"
              style={{ width: '100%', height: 26 }} allowClear={false} />
          </FieldBox>

          <FieldBox label="Parc / Zone d'importation">
            <div style={{ position: 'relative' }}>
              <input
                className={`light-input light-input--clickable${parc ? ' light-input--filled' : ''}`}
                value={parc} readOnly placeholder="Cliquer pour sélectionner..."
                onClick={() => setParcModalOpen(true)}
                style={{ paddingRight: 28, height: 26 }} />
              <SearchOutlined style={ICON_STYLE} />
            </div>
          </FieldBox>

          {/* ── IMMAT Badge ────────────────────────────────────────────── */}
          {immatGenere ? (
            <div style={{
              background: `linear-gradient(135deg, ${C.blue} 0%, #0F2555 100%)`,
              borderRadius: 7,
              padding: '4px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minWidth: 108,
              boxShadow: '0 4px 16px rgba(27,58,107,0.45)',
              animation: 'immatReveal 0.4s cubic-bezier(0.16,1,0.3,1), immatPulse 2.5s ease-in-out 0.4s infinite',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Shimmer overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.09) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s linear infinite',
                pointerEvents: 'none',
              }} />
              <div style={{ color: 'rgba(245,158,11,0.6)', fontSize: 7, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 800, position: 'relative' }}>
                N° IMMAT
              </div>
              <div style={{ color: C.gold, fontSize: 22, fontWeight: 900, letterSpacing: 3, lineHeight: 1.15, position: 'relative', fontFamily: 'Courier New, monospace' }}>
                {immatGenere}
              </div>
              {destNom && (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7, marginTop: 1, letterSpacing: 0.3, position: 'relative', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {destNom}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              minWidth: 108, borderRadius: 7,
              border: '2px dashed #D1D5DB',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: '#FAFAFA',
              transition: 'all 0.2s',
            }}>
              <div style={{ color: '#D1D5DB', fontSize: 7.5, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
                N° IMMAT
              </div>
              <div style={{ color: '#E5E7EB', fontSize: 17, fontWeight: 900, letterSpacing: 2, lineHeight: 1.3 }}>
                ——
              </div>
            </div>
          )}
        </div>

        {/* ── Section Acheteur ──────────────────────────────────────── */}
        <SectionCard title="Coordonnées Acheteur" icon={<UserOutlined />} delay={0} filled={progress[1]}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FieldBox label="Nom et prénom *">
              <input
                className={`light-input light-input--req${nomAcheteur ? ' light-input--filled' : ''}`}
                value={nomAcheteur}
                onChange={e => setNomAcheteur(e.target.value)}
                placeholder="Nom et prénom de l'acheteur"
                style={{ height: 26 }} />
            </FieldBox>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FieldBox label="Pays de résidence">
                <input
                  className={`light-input light-input--warm${paysResidence ? ' light-input--filled' : ''}`}
                  value={paysResidence}
                  onChange={e => setPaysResidence(e.target.value)}
                  placeholder="Pays résidence"
                  style={{ height: 26 }} />
              </FieldBox>
              <FieldBox label="Pays de destination">
                <input
                  className={`light-input light-input--warm${paysDestination ? ' light-input--filled' : ''}`}
                  value={paysDestination}
                  onChange={e => setPaysDestination(e.target.value)}
                  placeholder="Pays destination"
                  style={{ height: 26 }} />
              </FieldBox>
            </div>
            <FieldBox label="Maison de transit">
              <input
                className={`light-input${maisonTransit ? ' light-input--filled' : ''}`}
                value={maisonTransit}
                onChange={e => setMaisonTransit(e.target.value)}
                placeholder="Maison de transit"
                style={{ height: 26 }} />
            </FieldBox>
          </div>
        </SectionCard>

        {/* ── Section Véhicule ─────────────────────────────────────── */}
        <SectionCard title="Description du véhicule" icon={<CarOutlined />} delay={80} filled={progress[2]}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>

            <FieldBox label="Véhicule à assurer *">
              <Select size="small" placeholder="Sélectionner..." style={SEL}
                value={typeVehicule}
                onChange={v => {
                  setTypeVehicule(v)
                  setDestination(undefined)
                  setImmatGenere(null)
                  setMontant(null)
                }}>
                {TYPES_VEHICULE.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </FieldBox>

            <FieldBox label="Marque - Modèle *">
              <div style={{ position: 'relative' }}>
                <input
                  className={`light-input light-input--clickable${marqueModele ? ' light-input--filled' : ''}`}
                  value={marqueModele} readOnly
                  placeholder="Cliquer pour sélectionner..."
                  onClick={() => setMarqueModalOpen(true)}
                  style={{ paddingRight: 28, height: 26 }} />
                <SearchOutlined style={ICON_STYLE} />
              </div>
            </FieldBox>

            <FieldBox label="À destination de *">
              <Select size="small"
                placeholder={typeVehicule ? 'Sélectionner...' : "⚠ Choisir d'abord le type"}
                style={SEL} value={destination} disabled={!typeVehicule}
                onChange={handleDestinationChange}>
                {mockDestinations.map(d => (
                  <Option key={d.code} value={d.code}>
                    <span style={{ fontWeight: 600, color: C.blue, marginRight: 6 }}>{d.code}</span>
                    {d.nom}
                  </Option>
                ))}
              </Select>
            </FieldBox>

            <FieldBox label="Montant (FCFA)">
              <input
                className={`light-input light-input--amount${montant != null ? ' light-input--filled' : ''}`}
                value={montant != null ? `${montant.toLocaleString('fr-FR')} FCFA` : ''}
                readOnly placeholder="—"
                style={{ height: 26 }} />
            </FieldBox>

            <FieldBox label="N° de Châssis (VIN)" style={{ gridColumn: 'span 2' }}>
              <div style={{ position: 'relative' }}>
                <input
                  className={`light-input light-input--chassis${chassis ? ' light-input--filled' : ''}`}
                  value={chassis}
                  onChange={e => setChassis(e.target.value.toUpperCase())}
                  placeholder="Ex : ZFA29000000302873"
                  maxLength={17}
                  style={{ height: 26, paddingRight: 36 }} />
                <span style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 9, fontWeight: 700,
                  color: chassis.length === 17 ? C.green : '#9CA3AF',
                  transition: 'color 0.25s',
                  pointerEvents: 'none',
                }}>
                  {chassis.length}/17
                </span>
              </div>
            </FieldBox>

            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 140px', gap: 6 }}>
              <FieldBox label="N° de Tri">
                <input
                  className={`light-input${numTri ? ' light-input--filled' : ''}`}
                  value={numTri}
                  onChange={e => setNumTri(e.target.value)}
                  placeholder="N° de tri"
                  style={{ height: 26 }} />
              </FieldBox>
              <FieldBox label="Date N° de Tri">
                <DatePicker value={dateTri} onChange={v => v && setDateTri(v)}
                  format="DD/MM/YYYY" size="small"
                  style={{ width: '100%', height: 26 }} allowClear={false} />
              </FieldBox>
            </div>
          </div>
        </SectionCard>

        {/* ── Bas : Ancienne immat + Recycler ──────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          padding: '5px 10px',
          background: '#FAFBFD',
          border: '1px solid #E5E7EB',
          borderLeft: '3px solid #D1D5DB',
          borderRadius: 7,
          marginBottom: 6,
          animation: 'sectionSlide 0.35s cubic-bezier(0.16,1,0.3,1) 160ms both',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <Checkbox checked={saisirAncienne} onChange={e => setSaisirAncienne(e.target.checked)}>
                <span style={{ fontSize: 10, color: '#B45309', fontWeight: 600 }}>
                  Saisir ancienne immatriculation
                </span>
              </Checkbox>
            </div>
            <input className="light-input"
              value={ancienneImmat} disabled={!saisirAncienne}
              onChange={e => setAncienneImmat(e.target.value)}
              placeholder="Ancienne immatriculation"
              style={{ height: 26 }} />
          </div>

          <div>
            <Label>Recycler 'Plaque Perdue'</Label>
            <Radio.Group value={recycler ? 'oui' : 'non'}
              onChange={e => setRecycler(e.target.value === 'oui')}
              style={{ marginTop: 5 }}>
              <Radio value="oui" style={{ fontSize: 11 }}>Oui</Radio>
              <Radio value="non" style={{ fontSize: 11 }}>Non</Radio>
            </Radio.Group>
          </div>
        </div>

        {/* ── Boutons ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Barre de progression */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 3, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${(progressCount / 4) * 100}%`,
                background: formReady ? '#16A34A' : C.accent,
                transition: 'width 0.45s cubic-bezier(0.16,1,0.3,1), background 0.3s',
              }} />
            </div>
          </div>

          <button onClick={handleReset} style={{
            height: 29, padding: '0 13px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${C.border}`, borderRadius: 5,
            background: '#fff', color: C.muted, transition: 'all 0.15s',
          }}>
            Réinitialiser
          </button>

          <button onClick={handleReset} style={{
            height: 29, padding: '0 13px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${C.danger}`, borderRadius: 5,
            background: '#fff', color: C.danger, transition: 'all 0.15s',
          }}>
            Annuler
          </button>

          <button onClick={handleEnregistrer} disabled={loading} style={{
            height: 31, padding: '0 22px', fontSize: 12, fontWeight: 700,
            border: 'none', borderRadius: 5,
            cursor: loading ? 'not-allowed' : 'pointer',
            color: '#fff',
            background: loading
              ? '#9EB3D0'
              : `linear-gradient(135deg, ${C.accent} 0%, ${C.blue} 100%)`,
            boxShadow: loading ? 'none' : '0 3px 12px rgba(37,99,235,0.38)',
            transition: 'all 0.2s',
            animation: formReady && !loading ? 'btnPulse 2.2s ease-in-out infinite' : 'none',
            letterSpacing: 0.3,
          }}>
            {loading ? '⟳ Enregistrement...' : '✓ Enregistrer'}
          </button>
        </div>

      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <MarqueModeleModal
        open={marqueModalOpen}
        onSelect={v => { setMarqueModele(v); setMarqueModalOpen(false) }}
        onCancel={() => setMarqueModalOpen(false)}
      />
      <ParcModal
        open={parcModalOpen}
        onSelect={v => { setParc(v); setParcModalOpen(false) }}
        onCancel={() => setParcModalOpen(false)}
      />
    </div>
  )
}

// ── Modal Marque / Modèle ─────────────────────────────────────────────────────

const MARQUES = [
  'ACERBI 125 PS', 'DAF XF 105', 'FIAT DUCATO', 'HONDA ACCORD',
  'HONDA CB 125', 'ISUZU D-MAX', 'MAN TGX 18.480', 'MERCEDES ACTROS',
  'MERCEDES SPRINTER', 'MITSUBISHI L200', 'NISSAN NAVARA', 'NISSAN PATROL',
  'OPEL ASTRA', 'PEUGEOT 306', 'PEUGEOT BOXER', 'RENAULT MASTER',
  'RENAULT TRAFIC', 'TOYOTA COROLLA', 'TOYOTA HILUX', 'TOYOTA HIACE',
  'TOYOTA LAND CRUISER', 'VOLKSWAGEN GOLF', 'VOLKSWAGEN TRANSPORTER', 'YAMAHA FZ 150',
]

function MarqueModeleModal({ open, onSelect, onCancel }: {
  open: boolean; onSelect: (v: string) => void; onCancel: () => void
}): JSX.Element {
  const [search, setSearch] = useState('')
  const filtered = MARQUES.filter(m => m.toLowerCase().includes(search.toLowerCase()))
  return (
    <Modal
      title={<><CarOutlined style={{ color: '#1B3A6B', marginRight: 6 }} />Sélectionner Marque / Modèle</>}
      open={open} onCancel={onCancel} footer={null} width={460}
    >
      <Input placeholder="Rechercher…" prefix={<SearchOutlined />}
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10 }} autoFocus />
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {filtered.map(m => (
          <div key={m} onClick={() => onSelect(m)}
            style={{ padding: '7px 10px', cursor: 'pointer', borderRadius: 3, fontSize: 12, transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {m}
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ── Modal Parc ────────────────────────────────────────────────────────────────

const PARCS = [
  'Parc Lomé Centre', 'Parc Adakpamé', 'Parc Agoé',
  'Parc Baguida', 'Parc Hédzranawoé', 'Parc Agbalépedogan', 'Parc Port Autonome de Lomé',
]

function ParcModal({ open, onSelect, onCancel }: {
  open: boolean; onSelect: (v: string) => void; onCancel: () => void
}): JSX.Element {
  const [search, setSearch] = useState('')
  const filtered = PARCS.filter(p => p.toLowerCase().includes(search.toLowerCase()))
  return (
    <Modal
      title="Sélectionner le Parc / Zone d'importation"
      open={open} onCancel={onCancel} footer={null} width={440}
    >
      <Input placeholder="Rechercher…" prefix={<SearchOutlined />}
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10 }} autoFocus />
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {filtered.map(p => (
          <div key={p} onClick={() => onSelect(p)}
            style={{ padding: '7px 10px', cursor: 'pointer', borderRadius: 3, fontSize: 12, transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {p}
          </div>
        ))}
      </div>
    </Modal>
  )
}
