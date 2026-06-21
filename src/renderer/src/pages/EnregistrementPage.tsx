import { useState, useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { DatePicker, Modal, Input, Checkbox, Radio, Dropdown, notification } from 'antd'
import type { MenuProps } from 'antd'
import {
  SearchOutlined, CarOutlined, UserOutlined,
  FileAddOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PrinterOutlined, PlusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockDestinations } from '@mock/destinations'

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

// ── Hook historique localStorage ──────────────────────────────────────────────
function useFieldHistory(fieldKey: string, max = 30) {
  const storageKey = `tcit_hist_${fieldKey}`
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as string[]) : []
    } catch { return [] }
  })

  const add = (value: string): void => {
    const trimmed = value.trim()
    if (!trimmed) return
    const updated = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, max)
    setHistory(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  return { history, add }
}

// ── HistoryInput — input natif + datalist + bouton rappel ────────────────────
// history est passé depuis le parent pour synchronisation immédiate après save
interface HistoryInputProps {
  fieldKey: string
  history: string[]
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  style?: CSSProperties
  maxLength?: number
  disabled?: boolean
  uppercase?: boolean
}

function HistoryInput({
  fieldKey, history, value, onChange, className, placeholder,
  style, maxLength, disabled, uppercase,
}: HistoryInputProps): JSX.Element {
  const listId = `tcit_h_${fieldKey}`

  const menuItems: MenuProps['items'] = history.slice(0, 20).map((h, i) => ({
    key: i,
    label: (
      <span
        style={{ fontSize: 11, display: 'block', padding: '1px 0' }}
        onMouseDown={e => { e.preventDefault(); onChange(h) }}
      >
        {h}
      </span>
    ),
  }))

  const wrapStyle: CSSProperties = { position: 'relative', display: 'flex' }
  if (style?.flex) wrapStyle.flex = style.flex
  if (style?.width) wrapStyle.width = style.width

  const inputStyle: CSSProperties = {
    ...style,
    width: '100%',
    paddingRight: history.length > 0 && !disabled ? 26 : undefined,
  }
  delete inputStyle.flex

  return (
    <div style={wrapStyle}>
      <input
        className={className}
        value={value}
        onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        list={listId}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete="off"
      />
      {history.length > 0 && (
        <datalist id={listId}>
          {history.map(v => <option key={v} value={v} />)}
        </datalist>
      )}
      {!disabled && (
        history.length > 0 ? (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
            <button
              type="button"
              title="Voir l'historique des saisies"
              style={{
                position: 'absolute', right: 1, top: 1,
                width: 24, height: 24,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9CA3AF', fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 3, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2563EB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
              onMouseDown={e => e.preventDefault()}
            >
              🕐
            </button>
          </Dropdown>
        ) : (
          <button
            type="button"
            title="Aucun historique"
            style={{
              position: 'absolute', right: 1, top: 1,
              width: 24, height: 24,
              background: 'none', border: 'none', cursor: 'default',
              color: '#CBD5E1', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 3,
            }}
          >
            🕐
          </button>
        )
      )}
    </div>
  )
}

// ── Progress Dot ──────────────────────────────────────────────────────────────
function ProgressDot({ filled }: { filled: boolean }): JSX.Element {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%',
      background: filled ? '#2563EB' : '#CBD5E1',
      display: 'inline-block',
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

// ── Label / FieldBox ──────────────────────────────────────────────────────────
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

const FS2: CSSProperties = {
  height: 26, background: '#fff', border: '1px solid #D1D5DB', borderRadius: 4,
  padding: '0 26px 0 8px', color: '#1E293B', fontSize: 11.5, outline: 'none',
  cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
} as CSSProperties
const QBTN: CSSProperties = {
  fontSize: 11, width: 22, height: 22, borderRadius: '50%',
  background: '#E2E8F0', border: 'none', cursor: 'pointer', color: '#475569',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function EnregistrementPage(): JSX.Element {

  // ── État du formulaire ────────────────────────────────────────────────────
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
  const [description,     setDescription]    = useState('')
  const [marqueModalOpen, setMarqueModalOpen]= useState(false)
  const [parcModalOpen,   setParcModalOpen]  = useState(false)

  // ── État post-enregistrement ──────────────────────────────────────────────
  const [saved,         setSaved]       = useState(false)
  const [savedRef,      setSavedRef]    = useState<string | null>(null)
  const [showEdition,   setShowEdition] = useState(false)
  const [editMode,      setEditMode]    = useState(false)

  // ── Charger un véhicule depuis Liste/Recherche (mode Modification) ───────
  useEffect(() => {
    const raw = localStorage.getItem('tcit_loadEnreg')
    if (!raw) return
    localStorage.removeItem('tcit_loadEnreg')
    try {
      const v = JSON.parse(raw)
      if (v.ref) setSavedRef(v.ref)
      if (v.nom) setNomAcheteur(v.nom)
      if (v.resid) setPaysResidence(v.resid)
      if (v.paydest) setPaysDestination(v.paydest)
      if (v.marque) setMarqueModele(v.marque)
      if (v.chassis) setChassis(v.chassis)
      if (v.type) setTypeVehicule(v.type)
      if (v.dest) {
        setDestination(v.dest)
        const d = mockDestinations.find(dd => dd.code === v.dest)
        if (d) setImmatGenere(v.immat || `${d.lettre}${String(d.numImmatActuel).padStart(4, '0')}`)
      }
      if (v.montant) setMontant(v.montant)
      if (v.immat) setImmatGenere(v.immat)
      if (v.date) setDate(dayjs(v.date))
      setEditMode(true)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Historiques par champ ─────────────────────────────────────────────────
  const nomHist      = useFieldHistory('nomAcheteur')
  const residHist    = useFieldHistory('paysResidence')
  const destPaysHist = useFieldHistory('paysDestination')
  const transitHist  = useFieldHistory('maisonTransit')
  const triHist      = useFieldHistory('numTri')
  const chassisHist  = useFieldHistory('chassis')
  const marqueHist   = useFieldHistory('marqueModele')
  const descHist     = useFieldHistory('description')

  // ── Progression (4 critères) ──────────────────────────────────────────────
  const progress = [
    nomAcheteur !== '',
    typeVehicule !== undefined,
    marqueModele !== '',
    destination !== undefined,
  ]
  const progressCount = progress.filter(Boolean).length
  const formReady     = progressCount === 4

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
    setDate(dayjs()); setNomAcheteur(''); setPaysResidence('')
    setPaysDestination(''); setMaisonTransit(''); setDescription(''); setTypeVehicule(undefined)
    setDestination(undefined); setMarqueModele(''); setChassis('')
    setNumTri(''); setDateTri(dayjs()); setRecycler(false)
    setAncienneImmat(''); setSaisirAncienne(false)
    setImmatGenere(null); setMontant(null)
    setSaved(false); setSavedRef(null); setShowEdition(false)
  }

  const handleEnregistrer = async (): Promise<void> => {
    setLoading(true)

    // Persistance des historiques
    nomHist.add(nomAcheteur)
    residHist.add(paysResidence)
    destPaysHist.add(paysDestination)
    transitHist.add(maisonTransit)
    if (numTri)       triHist.add(numTri)
    if (chassis)      chassisHist.add(chassis)
    if (marqueModele) marqueHist.add(marqueModele)

    // Simulation sauvegarde DB
    await new Promise(r => setTimeout(r, 600))
    const ref = String(610268 + Math.floor(Math.random() * 1000))
    setSavedRef(ref)

    // Stub Poste Plaques — envoi des 3 données (serveur simulé hors ligne)
    notification.warning({
      message: 'Poste Plaques — Serveur hors ligne',
      description: (
        <div style={{ fontSize: 11, lineHeight: 1.8 }}>
          <div>N° Tri&nbsp;: <strong>{numTri || '—'}</strong></div>
          <div>Châssis&nbsp;: <strong>{chassis || '—'}</strong></div>
          <div>IMMAT&nbsp;: <strong style={{ color: C.gold }}>{immatGenere}</strong></div>
          <div style={{ color: '#9CA3AF', marginTop: 4, fontSize: 10 }}>
            192.168.0.25 — non disponible. Données prêtes à renvoyer.
          </div>
        </div>
      ),
      duration: 7,
      placement: 'bottomRight',
    })

    setSaved(true)
    setLoading(false)
    setShowEdition(true)
  }

  const destNom = destination
    ? (mockDestinations.find(d => d.code === destination)?.nom ?? '')
    : ''

  // Bouton rappel marque dans le menu déroulant
  const marqueMenuItems: MenuProps['items'] = marqueHist.history.slice(0, 12).map((h, i) => ({
    key: i,
    label: (
      <span
        style={{ fontSize: 11, display: 'block' }}
        onMouseDown={e => { e.preventDefault(); setMarqueModele(h) }}
      >
        {h}
      </span>
    ),
  }))

  const DEST_COLORS: Record<string, string> = {
    AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
    KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
    'S/C': '#FFD700', POL: '#94A3B8',
  }

  const R: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }
  const LBL: CSSProperties = { fontSize: 11, color: '#475569', whiteSpace: 'nowrap', width: 130, flexShrink: 0 }
  const LBL_SM: CSSProperties = { ...LBL, width: 110 }
  const FS: CSSProperties = { border: '1px solid #CBD5E1', borderRadius: 5, padding: '6px 12px 10px', margin: 0 }
  const LEG: CSSProperties = { fontSize: 10, fontWeight: 600, color: '#475569', padding: '0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      userSelect: 'none',
      animation: 'formEnter 0.35s cubic-bezier(0.16,1,0.3,1)',
      background: '#F8FAFF',
    }}>

      {/* ── Sub-header beige ────────────────────────────────────────────── */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, marginRight: 8 }}>📄</span>
        <span style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
          {editMode ? "Modification d'un Enregistrement" : 'Enregistrement des Véhicules'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {progress.map((filled, i) => <ProgressDot key={i} filled={filled} />)}
          <span style={{ fontSize: 9, color: '#64748B', marginLeft: 5 }}>
            {formReady ? '✓ Prêt' : `${progressCount}/4 requis`}
          </span>
        </div>
      </div>

      {/* ── Saved bar (post-enregistrement) ─────────────────────────────── */}
      {saved && (
        <div style={{
          margin: '8px 14px 0', padding: '8px 12px',
          background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 8, animation: 'sbIn 0.3s ease',
        }}>
          <span style={{ flex: 1, fontSize: 11.5, color: '#10B981', fontWeight: 700 }}>
            ✅ Enregistrement sauvegardé — Réf. <span style={{ color: C.blue }}>{savedRef}</span>
          </span>
          <button onClick={() => setShowEdition(true)} style={{
            height: 32, padding: '0 16px', background: '#F8FAFF', color: '#64748B',
            border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            🖨 Réimprimer
          </button>
          <button onClick={handleReset} style={{
            height: 32, padding: '0 16px', background: '#F8FAFF', color: '#64748B',
            border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            ➕ Nouveau
          </button>
        </div>
      )}

      {/* ── Barre Référence + date + IMMAT badge ───────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '7px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFF', flexShrink: 0,
      }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('mdi:open-window', { detail: 'listeVehicules' }))}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 5,
            color: '#1D4ED8', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >☰ Liste</button>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Référence</span>
        <input className="light-input" value={savedRef ?? '0'} readOnly
          style={{ width: 58, textAlign: 'center', fontWeight: 700, color: '#2563EB', letterSpacing: 1.5, background: '#EFF6FF', height: 26 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>En date du</span>
        <DatePicker value={date} onChange={v => v && setDate(v)} format="DD/MM/YYYY" size="small"
          style={{ width: 136, height: 26 }} allowClear={false} disabled={saved} />
        <div style={{ flex: 1 }} />
        <div style={{
          width: 220, minHeight: 72, padding: '10px 8px', whiteSpace: 'nowrap',
          border: '2px dashed rgba(245,158,11,0.45)', borderRadius: 8,
          background: immatGenere ? `${DEST_COLORS[destination ?? ''] ?? C.gold}28` : 'rgba(245,158,11,0.04)',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderColor: immatGenere ? `${DEST_COLORS[destination ?? ''] ?? C.gold}77` : 'rgba(245,158,11,0.45)',
        }}>
          <div style={{ fontSize: 9, color: 'rgba(180,115,0,0.8)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>N° Immat</div>
          {immatGenere ? (
            <div style={{ fontSize: 20, fontWeight: 900, color: C.blue, fontFamily: "'Courier New', monospace", letterSpacing: 3, margin: '2px 0' }}>
              {immatGenere}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'rgba(180,115,0,0.45)', letterSpacing: 2, margin: '2px 0' }}>— / —</div>
              <div style={{ fontSize: 10.5, color: 'rgba(180,115,0,0.6)', letterSpacing: 1 }}>EN ATTENTE</div>
            </>
          )}
        </div>
      </div>

      {/* ── Corps du formulaire ─────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', minHeight: 0 }}>

        {/* ── Section Coordonnées Acheteur ──────────────────────────────── */}
        <fieldset style={FS}>
          <legend style={LEG}>Coordonnées Acheteur</legend>
          <div style={R}>
            <span style={LBL_SM}>Nom et prénom :</span>
            <HistoryInput fieldKey="nomAcheteur" history={nomHist.history} value={nomAcheteur}
              onChange={setNomAcheteur} className="light-input" placeholder="Nom et prénom de l'acheteur"
              style={{ flex: 1, height: 26 }} disabled={saved} />
          </div>
          <div style={R}>
            <span style={LBL_SM}>Pays Résidence :</span>
            <HistoryInput fieldKey="paysResidence" history={residHist.history} value={paysResidence}
              onChange={setPaysResidence} className="light-input" style={{ flex: 1, height: 26 }} disabled={saved} />
            <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', marginLeft: 12 }}>Pays Destination :</span>
            <HistoryInput fieldKey="paysDestination" history={destPaysHist.history} value={paysDestination}
              onChange={setPaysDestination} className="light-input" style={{ flex: 1, height: 26 }} disabled={saved} />
          </div>
        </fieldset>

        {/* ── Section Description du véhicule ──────────────────────────── */}
        <fieldset style={FS}>
          <legend style={LEG}>Description du véhicule</legend>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#2563EB', marginBottom: 6 }}>
            Véhicule sortant du Parc
          </div>
          {/* Véhicule à assurer + Description */}
          <div style={R}>
            <span style={LBL}>Véhicule à assurer :</span>
            <select style={{ ...FS2, width: 130 }} value={typeVehicule ?? ''} disabled={saved}
              onChange={e => { const v = e.target.value || undefined; setTypeVehicule(v); setDestination(undefined); setImmatGenere(null); setMontant(null) }}>
              <option value="">—</option>
              {TYPES_VEHICULE.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <HistoryInput fieldKey="description" history={descHist.history} value={description}
              onChange={setDescription} className="light-input" placeholder="Description / informations complémentaires"
              style={{ flex: 1, height: 26 }} disabled={saved} />
            <button type="button" style={QBTN} title="Aide">?</button>
          </div>
          {/* À Destination de + Montant */}
          <div style={R}>
            <span style={LBL}>À Destination de :</span>
            <select style={{ ...FS2, width: 130 }} value={destination ?? ''} disabled={!typeVehicule || saved}
              onChange={e => { if (e.target.value) handleDestinationChange(e.target.value) }}>
              <option value="">{typeVehicule ? '—' : "⚠ Choisir d'abord le type"}</option>
              {mockDestinations.map(d => <option key={d.code} value={d.code}>{d.code}</option>)}
            </select>
            {destination && destNom && (
              <div style={{
                flex: 1, padding: '4px 14px', borderRadius: 4, fontSize: 11.5, fontWeight: 700,
                color: '#fff', whiteSpace: 'nowrap', letterSpacing: 0.3, textAlign: 'center',
                background: DEST_COLORS[destination] ?? '#6B7280',
              }}>{destNom}</div>
            )}
            <div style={{ minWidth: 12 }} />
            <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>Montant :</span>
            <input className="light-input" value={montant != null ? `${montant.toLocaleString('fr-FR')} FCFA` : '0'} readOnly
              style={{ width: 90, textAlign: 'right', fontWeight: 700, color: '#1B3A6B', background: '#F0F4FF', height: 26 }} />
          </div>
          {/* Marque - Modèle + N° de Tri */}
          <div style={R}>
            <span style={LBL}>Marque - Modèle :</span>
            <HistoryInput fieldKey="marqueModele" history={marqueHist.history} value={marqueModele}
              onChange={setMarqueModele} className="light-input" style={{ flex: 1, height: 26 }} disabled={saved} />
            <button type="button" style={QBTN} title="Aide">?</button>
            <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', marginLeft: 12 }}>N° de Tri :</span>
            <HistoryInput fieldKey="numTri" history={triHist.history} value={numTri} onChange={setNumTri}
              className="light-input" style={{ width: 140, height: 26 }} disabled={saved} />
          </div>
          {/* Transit (maison) + Date N° Tri */}
          <div style={R}>
            <span style={LBL}>Transit (maison) :</span>
            <HistoryInput fieldKey="maisonTransit" history={transitHist.history} value={maisonTransit}
              onChange={setMaisonTransit} className="light-input" style={{ flex: 1, height: 26 }} disabled={saved} />
            <button type="button" style={QBTN} title="Aide">?</button>
            <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', marginLeft: 12 }}>Date N° Tri :</span>
            <input className="light-input" type="date" value={dateTri.format('YYYY-MM-DD')}
              onChange={e => setDateTri(dayjs(e.target.value))}
              style={{ width: 140, height: 26 }} disabled={saved} />
          </div>
          {/* N° de Châssis */}
          <div style={{ ...R, marginBottom: 0 }}>
            <span style={LBL}>N° de Châssis :</span>
            <div style={{ position: 'relative', flex: 1 }}>
              <input className="light-input" value={chassis}
                onChange={e => setChassis(e.target.value.toUpperCase())}
                placeholder="Ex : ZFA29000000302873" maxLength={17}
                style={{ height: 26, paddingRight: 36 }} disabled={saved} />
              <span style={{
                position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                fontSize: 9, color: '#9CA3AF', pointerEvents: 'none',
              }}>{chassis.length}/17</span>
            </div>
            <input className="light-input" style={{ width: 130, background: '#F1F5F9', color: '#94A3B8', height: 26 }}
              placeholder="(N° série)" readOnly />
          </div>
        </fieldset>

        {/* ── Bas : ancienne immat + recycler ──────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, border: '1px solid #CBD5E1', borderRadius: 5, padding: '7px 12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: '#475569', marginBottom: 5 }}>
              <Checkbox checked={saisirAncienne} onChange={e => setSaisirAncienne(e.target.checked)} disabled={saved} />
              Saisir l&apos;ancienne immatriculation
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>Ancienne immatriculation :</span>
              <input className="light-input" value={ancienneImmat} disabled={!saisirAncienne || saved}
                onChange={e => setAncienneImmat(e.target.value)} style={{ flex: 1, height: 26, background: saisirAncienne ? '#fff' : '#F9FAFB' }} />
            </div>
          </div>
          <div style={{ width: 200, border: '1px solid #CBD5E1', borderRadius: 5, padding: '7px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Recycler &apos;Plaque Perdue&apos;
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#1E293B', cursor: 'pointer' }}>
              <Checkbox checked={!recycler} onChange={e => setRecycler(!e.target.checked)} disabled={saved} />
              NON
            </label>
          </div>
        </div>

      </div>

      {/* ── Barre d'actions ────────────────────────────────────────────── */}
      {!saved && !editMode && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '9px 14px', borderTop: '1px solid #E2E8F0', background: '#F8FAFF', flexShrink: 0,
        }}>
          <button onClick={handleReset} style={{
            height: 32, padding: '0 16px', background: '#F8FAFF', color: '#64748B',
            border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          }}>Réinitialiser</button>
          <button onClick={handleReset} style={{
            height: 32, padding: '0 16px', background: '#F8FAFF', color: '#DC2626',
            border: '1px solid #DC2626', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          }}>Annuler</button>
          <button onClick={handleEnregistrer} disabled={loading || !formReady} style={{
            height: 32, padding: '0 22px', background: loading || !formReady ? '#9CA3AF' : '#2563EB',
            color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700,
            cursor: loading || !formReady ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {loading ? '⟳ Enregistrement...' : '💾 Enregistrer'}
          </button>
        </div>
      )}

      {/* ── Barre d'actions — mode Modification ─────────────────────── */}
      {!saved && editMode && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '9px 14px', borderTop: '1px solid #E2E8F0', background: '#FFF7ED', flexShrink: 0,
        }}>
          <button onClick={() => { setEditMode(false); handleReset(); window.dispatchEvent(new CustomEvent('mdi:close-self')) }} style={{
            height: 32, padding: '0 16px', background: '#FFF7ED', color: '#DC2626',
            border: '1px solid #DC2626', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          }}>✕ Fermer</button>
          <button onClick={() => {
            notification.success({ message: `✅ Véhicule ${savedRef} modifié`, placement: 'bottomRight' })
            setEditMode(false); handleReset()
          }} style={{
            height: 32, padding: '0 22px', background: '#D97706', color: '#fff',
            border: '1px solid #D97706', borderRadius: 5, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>✏ Modifier</button>
        </div>
      )}

      {/* ── Dialog Edition Documents ─────────────────────────────────── */}
      <EditionDocumentsModal
        open={showEdition}
        reference={savedRef}
        onClose={() => setShowEdition(false)}
      />

      {/* ── Modals sélection ──────────────────────────────────────────── */}
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

// ── Dialog Edition Documents ──────────────────────────────────────────────────
const EDITION_OPTIONS = [
  'Tous (Facture - CG - Assurances)',
  'Facture + Carte Grise',
  'Carte Grise + Fiche ID Jaune',
  'Toutes Assurances',
  'Uniquement Facture',
  'Uniquement Carte Grise',
  'Uniquement Fiche ID Jaune',
  'Feuillet N°1 Assurance (Bleu)',
  'Feuillet N°2 Assurance (Rose)',
  'Feuillet N°3 Cond. Part. (Blanc A4)',
]

function EditionDocumentsModal({ open, reference, onClose }: {
  open: boolean
  reference: string | null
  onClose: () => void
}): JSX.Element {
  const [selected,      setSelected]     = useState(0)
  const [previsualiser, setPrevisualiser]= useState(false)
  const [printing,      setPrinting]     = useState(false)

  const handleImprimer = async (): Promise<void> => {
    setPrinting(true)
    await new Promise(r => setTimeout(r, 800))
    setPrinting(false)
    notification.info({
      message: 'Impression simulée',
      description: `Aucune imprimante configurée — ${EDITION_OPTIONS[selected]}`,
      duration: 4,
      placement: 'bottomRight',
    })
    onClose()
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PrinterOutlined style={{ color: C.blue }} />
          <span style={{ color: C.blue, fontWeight: 700 }}>Edition Documents : NORMALE</span>
          {reference && (
            <span style={{
              background: '#EFF6FF', color: C.accent,
              fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 4,
              marginLeft: 4,
            }}>
              Réf. {reference}
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
    >
      <Radio.Group
        value={selected}
        onChange={e => setSelected(e.target.value as number)}
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {EDITION_OPTIONS.map((opt, i) => (
          <Radio key={i} value={i}>
            <span style={{ fontSize: 12, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.blue : C.text }}>
              {opt}
            </span>
          </Radio>
        ))}
      </Radio.Group>

      <div style={{
        marginTop: 16, paddingTop: 12,
        borderTop: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Checkbox checked={previsualiser} onChange={e => setPrevisualiser(e.target.checked)}>
          <span style={{ fontSize: 12 }}>Prévisualiser</span>
        </Checkbox>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            height: 30, padding: '0 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${C.border}`, borderRadius: 5,
            background: '#fff', color: C.muted,
          }}>
            Fermer
          </button>
          <button onClick={handleImprimer} disabled={printing} style={{
            height: 30, padding: '0 16px', fontSize: 11, fontWeight: 700,
            border: 'none', borderRadius: 5, cursor: printing ? 'not-allowed' : 'pointer',
            background: printing
              ? '#9EB3D0'
              : `linear-gradient(135deg, ${C.accent} 0%, ${C.blue} 100%)`,
            color: '#fff',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <PrinterOutlined />
            {printing ? 'Impression...' : 'Imprimer'}
          </button>
        </div>
      </div>
    </Modal>
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
      title={<><CarOutlined style={{ color: C.blue, marginRight: 6 }} />Sélectionner Marque / Modèle</>}
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
