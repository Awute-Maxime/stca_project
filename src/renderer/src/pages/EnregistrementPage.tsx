import { useState } from 'react'
import { Select, DatePicker, Modal, Input, Checkbox, Radio } from 'antd'
import { SearchOutlined, CarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockDestinations } from '@mock/destinations'

const { Option } = Select

const TYPES_VEHICULE = ['Voiture', 'Camion', 'Moto', 'Bus', 'Pick-up', 'Minibus']
const MONTANT_FIXE   = 10000

const BLUE   = '#1B3A6B'
const ACCENT = '#2563EB'

// ── Micro-composants ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ fontSize: 10, color: '#666', marginBottom: 2, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
      {children}
    </div>
  )
}

function FieldBox({ label, children, style }: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
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
    <div style={{
      fontSize: 11, fontWeight: 700, color: BLUE,
      borderBottom: `1px solid ${BLUE}`, paddingBottom: 3,
      marginBottom: 8, marginTop: 10, letterSpacing: 0.5,
    }}>
      {title}
    </div>
  )
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', height: 26, fontSize: 12,
  border: '1px solid #ccc', borderRadius: 3,
  padding: '0 6px', outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: "'Segoe UI', sans-serif",
}

const INPUT_DISABLED: React.CSSProperties = {
  ...INPUT_STYLE, background: '#f5f5f5', color: '#888',
}

const SELECT_STYLE: React.CSSProperties = { width: '100%', fontSize: 12 }
const ANT_SMALL = { size: 'small' as const }

// ── Page principale ───────────────────────────────────────────────────────────

export default function EnregistrementPage(): JSX.Element {
  const [date,           setDate]          = useState(dayjs())
  const [parc,           setParc]          = useState('')
  const [nomAcheteur,    setNomAcheteur]   = useState('')
  const [paysResidence,  setPaysResidence] = useState('')
  const [paysDestination,setPaysDestination]= useState('')
  const [maisonTransit,  setMaisonTransit] = useState('')
  const [typeVehicule,   setTypeVehicule]  = useState<string | undefined>()
  const [destination,    setDestination]   = useState<string | undefined>()
  const [marqueModele,   setMarqueModele]  = useState('')
  const [chassis,        setChassis]       = useState('')
  const [numTri,         setNumTri]        = useState('')
  const [dateTri,        setDateTri]       = useState(dayjs())
  const [recycler,       setRecycler]      = useState(false)
  const [ancienneImmat,  setAncienneImmat] = useState('')
  const [saisirAncienne, setSaisirAncienne]= useState(false)
  const [immatGenere,    setImmatGenere]   = useState<string | null>(null)
  const [montant,        setMontant]       = useState<number | null>(null)
  const [loading,        setLoading]       = useState(false)

  const [marqueModalOpen, setMarqueModalOpen] = useState(false)
  const [parcModalOpen,   setParcModalOpen]   = useState(false)

  const handleDestinationChange = (code: string): void => {
    const dest = mockDestinations.find(d => d.code === code)
    if (dest) {
      const num   = String(dest.numImmatActuel + 1).padStart(4, '0')
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
    await new Promise(r => setTimeout(r, 500))
    setLoading(false)
    handleReset()
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '4px 8px', fontSize: 12, userSelect: 'none' }}>

      {/* ── Ligne 1 : Référence + Date + Parc + IMMAT ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 150px 1fr auto', gap: 8, marginBottom: 4 }}>
        <FieldBox label="Référence">
          <input
            style={{ ...INPUT_DISABLED, color: immatGenere ? ACCENT : '#888', fontWeight: immatGenere ? 700 : 400, letterSpacing: immatGenere ? 2 : 0 }}
            value={immatGenere ?? ''}
            readOnly
            placeholder="Auto-généré"
          />
        </FieldBox>

        <FieldBox label="En date du">
          <DatePicker
            value={date}
            onChange={v => v && setDate(v)}
            format="DD/MM/YYYY"
            size="small"
            style={{ width: '100%', height: 26 }}
            allowClear={false}
          />
        </FieldBox>

        <FieldBox label="Parc / Zone d'importation">
          <div style={{ position: 'relative' }}>
            <input
              value={parc}
              readOnly
              placeholder="Cliquer pour sélectionner..."
              onClick={() => setParcModalOpen(true)}
              style={{ ...INPUT_STYLE, paddingRight: 24, cursor: 'pointer' }}
            />
            <SearchOutlined style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 11 }} />
          </div>
        </FieldBox>

        {immatGenere && (
          <div style={{
            background: BLUE, borderRadius: 4, padding: '2px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minWidth: 90,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, letterSpacing: 0.5 }}>N° IMMAT</div>
            <div style={{ color: '#FFDF00', fontSize: 22, fontWeight: 900, letterSpacing: 3, lineHeight: 1.2 }}>
              {immatGenere}
            </div>
          </div>
        )}
      </div>

      {/* ── Section Acheteur ───────────────────────────────────────────── */}
      <SectionBar title="Coordonnées Acheteur" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginBottom: 0 }}>
        <FieldBox label="Nom et prénom *">
          <input value={nomAcheteur} onChange={e => setNomAcheteur(e.target.value)}
            placeholder="Nom et prénom de l'acheteur" style={INPUT_STYLE} />
        </FieldBox>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <FieldBox label="Pays de résidence">
            <input value={paysResidence} onChange={e => setPaysResidence(e.target.value)}
              placeholder="Pays résidence" style={{ ...INPUT_STYLE, background: '#fffef0' }} />
          </FieldBox>
          <FieldBox label="Pays de destination">
            <input value={paysDestination} onChange={e => setPaysDestination(e.target.value)}
              placeholder="Pays destination" style={{ ...INPUT_STYLE, background: '#fffef0' }} />
          </FieldBox>
        </div>

        <FieldBox label="Maison de transit">
          <input value={maisonTransit} onChange={e => setMaisonTransit(e.target.value)}
            placeholder="Maison de transit" style={INPUT_STYLE} />
        </FieldBox>
      </div>

      {/* ── Section Véhicule ───────────────────────────────────────────── */}
      <SectionBar title="Description du véhicule" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        <FieldBox label="Véhicule à assurer *">
          <Select
            {...ANT_SMALL}
            placeholder="Sélectionner..."
            style={SELECT_STYLE}
            value={typeVehicule}
            onChange={v => { setTypeVehicule(v); setDestination(undefined); setImmatGenere(null); setMontant(null) }}
          >
            {TYPES_VEHICULE.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </FieldBox>

        <FieldBox label="Marque - Modèle *">
          <div style={{ position: 'relative' }}>
            <input value={marqueModele} readOnly
              placeholder="Cliquer pour sélectionner..."
              onClick={() => setMarqueModalOpen(true)}
              style={{ ...INPUT_STYLE, paddingRight: 24, cursor: 'pointer' }}
            />
            <SearchOutlined style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 11 }} />
          </div>
        </FieldBox>

        <FieldBox label="À destination de *">
          <Select
            {...ANT_SMALL}
            placeholder={typeVehicule ? 'Sélectionner...' : '⚠ Choisir d\'abord le type'}
            style={SELECT_STYLE}
            value={destination}
            disabled={!typeVehicule}
            onChange={handleDestinationChange}
          >
            {mockDestinations.map(d => (
              <Option key={d.code} value={d.code}>
                <span style={{ fontWeight: 600, color: BLUE, marginRight: 6 }}>{d.code}</span>
                {d.nom}
              </Option>
            ))}
          </Select>
        </FieldBox>

        <FieldBox label="Montant (FCFA)">
          <input
            value={montant != null ? `${montant.toLocaleString('fr-FR')} FCFA` : ''}
            readOnly
            style={{ ...INPUT_DISABLED, color: '#16a34a', fontWeight: 700 }}
          />
        </FieldBox>

        <FieldBox label="N° de Châssis (VIN)">
          <input value={chassis} onChange={e => setChassis(e.target.value.toUpperCase())}
            placeholder="Ex : ZFA29000000302873"
            maxLength={17}
            style={{ ...INPUT_STYLE, fontFamily: 'monospace', letterSpacing: 1 }}
          />
        </FieldBox>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 6 }}>
          <FieldBox label="N° de Tri">
            <input value={numTri} onChange={e => setNumTri(e.target.value)}
              placeholder="N° de tri" style={INPUT_STYLE} />
          </FieldBox>
          <FieldBox label="Date N° de Tri">
            <DatePicker value={dateTri} onChange={v => v && setDateTri(v)}
              format="DD/MM/YYYY" size="small" style={{ width: '100%', height: 26 }} allowClear={false} />
          </FieldBox>
        </div>
      </div>

      {/* ── Bas : Ancienne immat + Recycler ────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        marginTop: 10, padding: '8px', background: '#f8f8f8',
        border: '1px solid #e0e0e0', borderRadius: 4,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Checkbox checked={saisirAncienne} onChange={e => setSaisirAncienne(e.target.checked)}
              style={{ fontSize: 11 }}>
              <span style={{ fontSize: 11, color: '#c00', fontWeight: 600 }}>
                Saisir l'ancienne immatriculation
              </span>
            </Checkbox>
          </div>
          <input value={ancienneImmat} disabled={!saisirAncienne}
            onChange={e => setAncienneImmat(e.target.value)}
            placeholder="Ancienne immatriculation"
            style={{ ...INPUT_STYLE, background: saisirAncienne ? '#fffef0' : '#f0f0f0', width: '100%' }}
          />
        </div>

        <div>
          <Label>Recycler 'Plaque Perdue'</Label>
          <Radio.Group value={recycler ? 'oui' : 'non'} onChange={e => setRecycler(e.target.value === 'oui')}
            style={{ marginTop: 4 }}>
            <Radio value="oui" style={{ fontSize: 11 }}>Oui</Radio>
            <Radio value="non" style={{ fontSize: 11 }}>Non</Radio>
          </Radio.Group>
        </div>
      </div>

      {/* ── Boutons ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <button onClick={handleReset}
          style={{ height: 30, padding: '0 16px', fontSize: 12, border: `1px solid ${BLUE}`, borderRadius: 3, background: '#fff', color: BLUE, cursor: 'pointer' }}>
          Réinitialiser
        </button>
        <button onClick={handleReset}
          style={{ height: 30, padding: '0 16px', fontSize: 12, border: '1px solid #ccc', borderRadius: 3, background: '#fff', color: '#666', cursor: 'pointer' }}>
          Annuler
        </button>
        <button onClick={handleEnregistrer} disabled={loading}
          style={{ height: 30, padding: '0 20px', fontSize: 12, border: 'none', borderRadius: 3,
            background: loading ? '#9eb3d0' : `linear-gradient(135deg, ${ACCENT}, ${BLUE})`,
            color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 2px 8px rgba(37,99,235,0.35)',
          }}>
          {loading ? '⟳ Enregistrement...' : '✓ Enregistrer'}
        </button>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
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

function MarqueModeleModal({ open, onSelect, onCancel }: { open: boolean; onSelect: (v: string) => void; onCancel: () => void }): JSX.Element {
  const [search, setSearch] = useState('')
  const filtered = MARQUES.filter(m => m.toLowerCase().includes(search.toLowerCase()))
  return (
    <Modal title={<><CarOutlined /> Sélectionner Marque / Modèle</>}
      open={open} onCancel={onCancel} footer={null} width={460}>
      <Input placeholder="Rechercher…" prefix={<SearchOutlined />}
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10 }} autoFocus />
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {filtered.map(m => (
          <div key={m} onClick={() => onSelect(m)}
            style={{ padding: '7px 10px', cursor: 'pointer', borderRadius: 3, fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
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

function ParcModal({ open, onSelect, onCancel }: { open: boolean; onSelect: (v: string) => void; onCancel: () => void }): JSX.Element {
  const [search, setSearch] = useState('')
  const filtered = PARCS.filter(p => p.toLowerCase().includes(search.toLowerCase()))
  return (
    <Modal title="Sélectionner le Parc / Zone d'importation"
      open={open} onCancel={onCancel} footer={null} width={440}>
      <Input placeholder="Rechercher…" prefix={<SearchOutlined />}
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10 }} autoFocus />
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {filtered.map(p => (
          <div key={p} onClick={() => onSelect(p)}
            style={{ padding: '7px 10px', cursor: 'pointer', borderRadius: 3, fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {p}
          </div>
        ))}
      </div>
    </Modal>
  )
}
