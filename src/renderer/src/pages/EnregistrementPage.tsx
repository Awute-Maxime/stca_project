import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Select, DatePicker, Modal, Input, Checkbox, Radio } from 'antd'
import { SearchOutlined, CarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockDestinations } from '@mock/destinations'

const { Option } = Select

const TYPES_VEHICULE = ['Voiture', 'Camion', 'Moto', 'Bus', 'Pick-up', 'Minibus']
const MONTANT_FIXE   = 10000

// ── Palette — cohérente avec appColors de MainScreen ──────────────────────────
const C = {
  blue:    '#1B3A6B',   // sidebar color
  accent:  '#2563EB',   // hover / focus
  gold:    '#F59E0B',   // IMMAT badge text
  green:   '#16A34A',
  text:    '#1E293B',
  muted:   '#6B7280',
  border:  '#D1D5DB',
  bgPanel: '#F3F4F6',
  danger:  '#DC2626',
}

// ── Micro-composants ──────────────────────────────────────────────────────────

function Label({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div style={{
      fontSize: 9, color: C.muted, marginBottom: 3,
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

function SectionBar({ title }: { title: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 8 }}>
      <div style={{ width: 2, height: 12, background: C.blue, borderRadius: 1 }} />
      <span style={{ fontSize: 9, fontWeight: 700, color: C.blue, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
    </div>
  )
}

const SEL: CSSProperties = { width: '100%', fontSize: 12 }
const ICON: CSSProperties = {
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

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '4px 8px', fontSize: 12, userSelect: 'none', animation: 'formEnter 0.35s cubic-bezier(0.16,1,0.3,1)', background: '#fff' }}>

      {/* ── Ligne 1 : Référence + Date + Parc + IMMAT ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 150px 1fr auto', gap: 8, marginBottom: 4 }}>

        <FieldBox label="Référence">
          <input className="light-input light-input--ref"
            value={immatGenere ?? ''} readOnly placeholder="Auto-généré" />
        </FieldBox>

        <FieldBox label="En date du">
          <DatePicker value={date} onChange={v => v && setDate(v)}
            format="DD/MM/YYYY" size="small"
            style={{ width: '100%', height: 28 }} allowClear={false} />
        </FieldBox>

        <FieldBox label="Parc / Zone d'importation">
          <div style={{ position: 'relative' }}>
            <input className="light-input light-input--clickable"
              value={parc} readOnly placeholder="Cliquer pour sélectionner..."
              onClick={() => setParcModalOpen(true)} style={{ paddingRight: 28 }} />
            <SearchOutlined style={ICON} />
          </div>
        </FieldBox>

        {immatGenere && (
          <div style={{
            background: C.blue, borderRadius: 5, padding: '3px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minWidth: 96, boxShadow: '0 2px 12px rgba(27,58,107,0.35)',
            animation: 'immatReveal 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ color: 'rgba(245,158,11,0.7)', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
              N° IMMAT
            </div>
            <div style={{ color: C.gold, fontSize: 22, fontWeight: 900, letterSpacing: 3, lineHeight: 1.1 }}>
              {immatGenere}
            </div>
          </div>
        )}
      </div>

      {/* ── Section Acheteur ─────────────────────────────────────────── */}
      <SectionBar title="Coordonnées Acheteur" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
        <FieldBox label="Nom et prénom *">
          <input className="light-input light-input--req" value={nomAcheteur}
            onChange={e => setNomAcheteur(e.target.value)}
            placeholder="Nom et prénom de l'acheteur" />
        </FieldBox>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <FieldBox label="Pays de résidence">
            <input className="light-input light-input--warm" value={paysResidence}
              onChange={e => setPaysResidence(e.target.value)} placeholder="Pays résidence" />
          </FieldBox>
          <FieldBox label="Pays de destination">
            <input className="light-input light-input--warm" value={paysDestination}
              onChange={e => setPaysDestination(e.target.value)} placeholder="Pays destination" />
          </FieldBox>
        </div>

        <FieldBox label="Maison de transit">
          <input className="light-input" value={maisonTransit}
            onChange={e => setMaisonTransit(e.target.value)} placeholder="Maison de transit" />
        </FieldBox>
      </div>

      {/* ── Section Véhicule ─────────────────────────────────────────── */}
      <SectionBar title="Description du véhicule" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        <FieldBox label="Véhicule à assurer *">
          <Select size="small" placeholder="Sélectionner..." style={SEL}
            value={typeVehicule}
            onChange={v => { setTypeVehicule(v); setDestination(undefined); setImmatGenere(null); setMontant(null) }}>
            {TYPES_VEHICULE.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </FieldBox>

        <FieldBox label="Marque - Modèle *">
          <div style={{ position: 'relative' }}>
            <input className="light-input light-input--clickable" value={marqueModele} readOnly
              placeholder="Cliquer pour sélectionner..."
              onClick={() => setMarqueModalOpen(true)} style={{ paddingRight: 28 }} />
            <SearchOutlined style={ICON} />
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
          <input className="light-input light-input--amount"
            value={montant != null ? `${montant.toLocaleString('fr-FR')} FCFA` : ''}
            readOnly placeholder="—" />
        </FieldBox>

        <FieldBox label="N° de Châssis (VIN)">
          <input className="light-input light-input--chassis"
            value={chassis}
            onChange={e => setChassis(e.target.value.toUpperCase())}
            placeholder="Ex : ZFA29000000302873" maxLength={17} />
        </FieldBox>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 6 }}>
          <FieldBox label="N° de Tri">
            <input className="light-input" value={numTri}
              onChange={e => setNumTri(e.target.value)} placeholder="N° de tri" />
          </FieldBox>
          <FieldBox label="Date N° de Tri">
            <DatePicker value={dateTri} onChange={v => v && setDateTri(v)}
              format="DD/MM/YYYY" size="small" style={{ width: '100%', height: 28 }} allowClear={false} />
          </FieldBox>
        </div>
      </div>

      {/* ── Bas : Ancienne immat + Recycler ──────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        marginTop: 8, padding: '6px 8px',
        background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6,
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
            placeholder="Ancienne immatriculation" />
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

      {/* ── Boutons ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
        <button onClick={handleReset} style={{
          height: 28, padding: '0 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${C.border}`, borderRadius: 4,
          background: '#fff', color: C.muted, transition: 'all 0.15s',
        }}>
          Réinitialiser
        </button>
        <button onClick={handleReset} style={{
          height: 28, padding: '0 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${C.danger}`, borderRadius: 4,
          background: '#fff', color: C.danger, transition: 'all 0.15s',
        }}>
          Annuler
        </button>
        <button onClick={handleEnregistrer} disabled={loading} style={{
          height: 28, padding: '0 18px', fontSize: 11, fontWeight: 700,
          border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
          color: '#fff',
          background: loading
            ? '#9EB3D0'
            : `linear-gradient(135deg, ${C.accent} 0%, ${C.blue} 100%)`,
          boxShadow: loading ? 'none' : '0 2px 10px rgba(37,99,235,0.35)',
          transition: 'all 0.15s',
        }}>
          {loading ? '⟳ Enregistrement...' : '✓ Enregistrer'}
        </button>
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
            onMouseLeave={e => (e.currentTarget.style.background  = 'transparent')}>
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
            onMouseLeave={e => (e.currentTarget.style.background  = 'transparent')}>
            {p}
          </div>
        ))}
      </div>
    </Modal>
  )
}
