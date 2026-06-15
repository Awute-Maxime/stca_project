import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Select, DatePicker, Modal, Input, Checkbox, Radio, Dropdown, notification } from 'antd'
import type { MenuProps } from 'antd'
import {
  SearchOutlined, CarOutlined, UserOutlined,
  FileAddOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PrinterOutlined, PlusOutlined,
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

  return (
    <div style={{ position: 'relative' }}>
      <input
        className={className}
        value={value}
        onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        style={{ ...style, paddingRight: history.length > 0 && !disabled ? 22 : undefined }}
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
      {history.length > 0 && !disabled && (
        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <button
            type="button"
            title="Voir l'historique des saisies"
            style={{
              position: 'absolute', right: 4, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#CBD5E1', fontSize: 10, padding: '0 1px',
              display: 'flex', alignItems: 'center', zIndex: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2563EB' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#CBD5E1' }}
            onMouseDown={e => e.preventDefault()}
          >
            <ClockCircleOutlined />
          </button>
        </Dropdown>
      )}
    </div>
  )
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

const SEL: CSSProperties       = { width: '100%', fontSize: 12 }
const ICON_R: CSSProperties    = {
  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
  color: '#9CA3AF', fontSize: 11, pointerEvents: 'none',
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
  const [marqueModalOpen, setMarqueModalOpen]= useState(false)
  const [parcModalOpen,   setParcModalOpen]  = useState(false)

  // ── État post-enregistrement ──────────────────────────────────────────────
  const [saved,         setSaved]       = useState(false)
  const [savedRef,      setSavedRef]    = useState<string | null>(null)
  const [showEdition,   setShowEdition] = useState(false)

  // ── Historiques par champ ─────────────────────────────────────────────────
  const nomHist      = useFieldHistory('nomAcheteur')
  const residHist    = useFieldHistory('paysResidence')
  const destPaysHist = useFieldHistory('paysDestination')
  const transitHist  = useFieldHistory('maisonTransit')
  const triHist      = useFieldHistory('numTri')
  const chassisHist  = useFieldHistory('chassis')
  const marqueHist   = useFieldHistory('marqueModele')

  // ── Progression (4 critères) ──────────────────────────────────────────────
  const progress = [
    parc !== '',
    nomAcheteur !== '',
    typeVehicule !== undefined && marqueModele !== '',
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
    setDate(dayjs()); setParc(''); setNomAcheteur(''); setPaysResidence('')
    setPaysDestination(''); setMaisonTransit(''); setTypeVehicule(undefined)
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

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      userSelect: 'none',
      animation: 'formEnter 0.35s cubic-bezier(0.16,1,0.3,1)',
      background: '#fff',
    }}>

      {/* ── Header gradient ─────────────────────────────────────────────── */}
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

      {/* ── Corps du formulaire ─────────────────────────────────────────── */}
      <div style={{ padding: '0 8px 6px' }}>

        {/* ── Ligne 1 : Référence + Date + IMMAT (proéminent) ─────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '88px 148px 1fr auto',
          gap: 8, marginBottom: 6, alignItems: 'end',
        }}>

          <FieldBox label="Référence">
            <input className="light-input light-input--ref"
              value={savedRef ?? '0'} readOnly
              style={{ height: 26 }} />
          </FieldBox>

          <FieldBox label="En date du">
            <DatePicker value={date} onChange={v => v && setDate(v)}
              format="DD/MM/YYYY" size="small"
              style={{ width: '100%', height: 26 }} allowClear={false}
              disabled={saved} />
          </FieldBox>

          <FieldBox label="Parc / Zone d'importation">
            <div style={{ position: 'relative' }}>
              <input
                className={`light-input light-input--clickable${parc ? ' light-input--filled' : ''}`}
                value={parc} readOnly placeholder="Cliquer pour sélectionner..."
                onClick={() => !saved && setParcModalOpen(true)}
                style={{ paddingRight: 28, height: 26, cursor: saved ? 'default' : 'pointer' }} />
              <SearchOutlined style={ICON_R} />
            </div>
          </FieldBox>

          {/* ── Badge IMMAT — proéminent ──────────────────────────────── */}
          {immatGenere ? (
            <div style={{
              background: `linear-gradient(150deg, ${C.blue} 0%, #0A1E47 100%)`,
              borderRadius: 9,
              padding: '8px 22px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minWidth: 158,
              border: '1.5px solid rgba(245,158,11,0.5)',
              boxShadow: '0 6px 24px rgba(27,58,107,0.55), 0 0 0 1px rgba(245,158,11,0.08)',
              animation: 'immatReveal 0.4s cubic-bezier(0.16,1,0.3,1), immatPulse 2.5s ease-in-out 0.4s infinite',
              position: 'relative', overflow: 'hidden',
              cursor: 'default',
            }}>
              {/* Shimmer sweep */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s linear infinite',
                pointerEvents: 'none',
              }} />
              <div style={{ color: 'rgba(245,158,11,0.65)', fontSize: 7.5, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800, position: 'relative' }}>
                N° IMMAT
              </div>
              <div style={{
                color: C.gold, fontSize: 30, fontWeight: 900,
                letterSpacing: 5, lineHeight: 1.1,
                fontFamily: 'Courier New, monospace',
                position: 'relative',
                textShadow: '0 0 18px rgba(245,158,11,0.45)',
              }}>
                {immatGenere}
              </div>
              {destNom && (
                <div style={{
                  color: 'rgba(255,255,255,0.42)', fontSize: 7.5, marginTop: 2,
                  letterSpacing: 0.5, position: 'relative',
                  maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {destNom}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              minWidth: 158,
              borderRadius: 9,
              border: '2px dashed rgba(245,158,11,0.38)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 16px',
              background: 'linear-gradient(150deg, #FEFCE8 0%, #FFFDF7 100%)',
              animation: 'immatEmptyPulse 3s ease-in-out infinite',
              gap: 2,
            }}>
              <div style={{ color: 'rgba(245,158,11,0.45)', fontSize: 7.5, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 800 }}>
                N° IMMAT
              </div>
              <div style={{ color: 'rgba(245,158,11,0.22)', fontSize: 26, fontWeight: 900, letterSpacing: 4, lineHeight: 1.15, fontFamily: 'Courier New, monospace' }}>
                ——
              </div>
              <div style={{ color: 'rgba(245,158,11,0.38)', fontSize: 7.5, fontWeight: 700, letterSpacing: 1 }}>
                EN ATTENTE
              </div>
            </div>
          )}
        </div>

        {/* ── Section Acheteur ────────────────────────────────────────── */}
        <SectionCard title="Coordonnées Acheteur" icon={<UserOutlined />} delay={0} filled={progress[1]}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            <FieldBox label="Nom et prénom *">
              <HistoryInput
                fieldKey="nomAcheteur"
                history={nomHist.history}
                value={nomAcheteur}
                onChange={setNomAcheteur}
                className={`light-input light-input--req${nomAcheteur ? ' light-input--filled' : ''}`}
                placeholder="Nom et prénom de l'acheteur"
                style={{ height: 26 }}
                disabled={saved}
              />
            </FieldBox>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FieldBox label="Pays de résidence">
                <HistoryInput
                  fieldKey="paysResidence"
                  history={residHist.history}
                  value={paysResidence}
                  onChange={setPaysResidence}
                  className={`light-input light-input--warm${paysResidence ? ' light-input--filled' : ''}`}
                  placeholder="Pays résidence"
                  style={{ height: 26 }}
                  disabled={saved}
                />
              </FieldBox>
              <FieldBox label="Pays de destination">
                <HistoryInput
                  fieldKey="paysDestination"
                  history={destPaysHist.history}
                  value={paysDestination}
                  onChange={setPaysDestination}
                  className={`light-input light-input--warm${paysDestination ? ' light-input--filled' : ''}`}
                  placeholder="Pays destination"
                  style={{ height: 26 }}
                  disabled={saved}
                />
              </FieldBox>
            </div>

            <FieldBox label="Maison de transit">
              <HistoryInput
                fieldKey="maisonTransit"
                history={transitHist.history}
                value={maisonTransit}
                onChange={setMaisonTransit}
                className={`light-input${maisonTransit ? ' light-input--filled' : ''}`}
                placeholder="Maison de transit"
                style={{ height: 26 }}
                disabled={saved}
              />
            </FieldBox>

          </div>
        </SectionCard>

        {/* ── Section Véhicule ─────────────────────────────────────────── */}
        <SectionCard title="Description du véhicule" icon={<CarOutlined />} delay={80} filled={progress[2]}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>

            <FieldBox label="Véhicule à assurer *">
              <Select size="small" placeholder="Sélectionner..." style={SEL}
                value={typeVehicule} disabled={saved}
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
                  onClick={() => !saved && setMarqueModalOpen(true)}
                  style={{ paddingRight: marqueHist.history.length > 0 ? 46 : 28, height: 26, cursor: saved ? 'default' : 'pointer' }}
                  disabled={saved}
                />
                {/* Bouton rappel historique marques */}
                {marqueHist.history.length > 0 && !saved && (
                  <Dropdown menu={{ items: marqueMenuItems }} placement="bottomRight" trigger={['click']}>
                    <button
                      type="button"
                      title="Marques récentes"
                      style={{
                        position: 'absolute', right: 24, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#CBD5E1', fontSize: 10, padding: '0 2px',
                        display: 'flex', alignItems: 'center', zIndex: 1,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2563EB' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#CBD5E1' }}
                      onMouseDown={e => e.preventDefault()}
                    >
                      <ClockCircleOutlined />
                    </button>
                  </Dropdown>
                )}
                <SearchOutlined style={ICON_R} />
              </div>
            </FieldBox>

            <FieldBox label="À destination de *">
              <Select size="small"
                placeholder={typeVehicule ? 'Sélectionner...' : "⚠ Choisir d'abord le type"}
                style={SEL} value={destination}
                disabled={!typeVehicule || saved}
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
                <HistoryInput
                  fieldKey="chassis"
                  history={chassisHist.history}
                  value={chassis}
                  onChange={v => setChassis(v.toUpperCase())}
                  className={`light-input light-input--chassis${chassis ? ' light-input--filled' : ''}`}
                  placeholder="Ex : ZFA29000000302873"
                  maxLength={17}
                  style={{ height: 26, paddingRight: 44 }}
                  disabled={saved}
                  uppercase
                />
                <span style={{
                  position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 9, fontWeight: 700,
                  color: chassis.length === 17 ? C.green : '#9CA3AF',
                  transition: 'color 0.25s',
                  pointerEvents: 'none',
                }}>
                  {chassis.length}/17
                </span>
              </div>
            </FieldBox>

            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 148px', gap: 6 }}>
              <FieldBox label="N° de Tri">
                <HistoryInput
                  fieldKey="numTri"
                  history={triHist.history}
                  value={numTri}
                  onChange={setNumTri}
                  className={`light-input${numTri ? ' light-input--filled' : ''}`}
                  placeholder="N° de tri (douanier)"
                  style={{ height: 26 }}
                  disabled={saved}
                />
              </FieldBox>
              <FieldBox label="Date N° de Tri">
                <DatePicker value={dateTri} onChange={v => v && setDateTri(v)}
                  format="DD/MM/YYYY" size="small"
                  style={{ width: '100%', height: 26 }} allowClear={false}
                  disabled={saved} />
              </FieldBox>
            </div>

          </div>
        </SectionCard>

        {/* ── Ancienne immat + Recycler ────────────────────────────────── */}
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
              <Checkbox checked={saisirAncienne} onChange={e => setSaisirAncienne(e.target.checked)} disabled={saved}>
                <span style={{ fontSize: 10, color: '#B45309', fontWeight: 600 }}>
                  Saisir ancienne immatriculation
                </span>
              </Checkbox>
            </div>
            <input className="light-input"
              value={ancienneImmat} disabled={!saisirAncienne || saved}
              onChange={e => setAncienneImmat(e.target.value)}
              placeholder="Ancienne immatriculation"
              style={{ height: 26 }} />
          </div>
          <div>
            <Label>Recycler 'Plaque Perdue'</Label>
            <Radio.Group value={recycler ? 'oui' : 'non'}
              onChange={e => setRecycler(e.target.value === 'oui')}
              style={{ marginTop: 5 }} disabled={saved}>
              <Radio value="oui" style={{ fontSize: 11 }}>Oui</Radio>
              <Radio value="non" style={{ fontSize: 11 }}>Non</Radio>
            </Radio.Group>
          </div>
        </div>

        {/* ── Barre d'actions ──────────────────────────────────────────── */}
        {saved ? (
          /* État post-enregistrement */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'savedEnter 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <CheckCircleOutlined style={{ color: C.green, fontSize: 16 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green, flex: 1 }}>
              Enregistré — Réf.&nbsp;
              <span style={{ color: C.blue, letterSpacing: 0.5 }}>{savedRef}</span>
            </span>
            <button onClick={() => setShowEdition(true)} style={{
              height: 29, padding: '0 13px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${C.border}`, borderRadius: 5,
              background: '#fff', color: C.muted,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <PrinterOutlined /> Réimprimer
            </button>
            <button onClick={handleReset} style={{
              height: 31, padding: '0 18px', fontSize: 12, fontWeight: 700,
              border: 'none', borderRadius: 5, cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.accent} 0%, ${C.blue} 100%)`,
              color: '#fff',
              boxShadow: '0 3px 10px rgba(37,99,235,0.35)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <PlusOutlined /> Nouveau
            </button>
          </div>
        ) : (
          /* État saisie normale */
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

            {formReady && (
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
                animation: !loading ? 'btnPulse 2.2s ease-in-out infinite' : 'none',
                letterSpacing: 0.3,
              }}>
                {loading ? '⟳ Enregistrement...' : '✓ Enregistrer'}
              </button>
            )}
          </div>
        )}

      </div>

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
