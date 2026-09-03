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
import { addVehicule, updateVehicule, getAllVehicules, prochainNumImmat } from '@mock/vehiculesStore'
import { WinAlert } from '@components/WinDialogs'
import { useMarques, addMarque } from '@mock/marquesStore'
import AutoCompleteHistorique from '@components/AutoCompleteHistorique'
import { useHistorique, addHistorique, CHASSIS_PREFIXE_LEN } from '@mock/historiquesStore'
import { useTypesVehicule } from '@mock/typesVehiculeStore'
import { useDestColors, getDestinations } from '@mock/destinationsStore'
import { CarteGrisePrintDirect, type CarteGriseData } from '@components/documents/CarteGrise'
import { FacturePrintDirect, type FactureData } from '@components/documents/Facture'
import { tarifPourType, primesPourType } from '@mock/assurancesStore'
import { FicheIdPrintDirect, type FicheIdData } from '@components/documents/FicheId'
import { Feuillet3PrintDirect, type Feuillet3Data } from '@components/documents/Feuillet3'
import { Feuillet1PrintDirect, type Feuillet1Data } from '@components/documents/Feuillet1'
import { Feuillet2PrintDirect, type Feuillet2Data } from '@components/documents/Feuillet2'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'

const MONTANT_FIXE   = 10000

const C = {
  blue:      'var(--tc-heading)',
  accent:    'var(--accent)',
  gold:      '#F59E0B',
  green:     '#16A34A',
  text:      'var(--tc-text)',
  muted:     '#6B7280',
  border:    'var(--tc-th-bd)',
  bgSection: 'var(--tc-section)',
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
  /** Normalisation appliquée à la sortie du champ (on blur) — ex. MAJUSCULES, Capitalisation. */
  normaliser?: (v: string) => string
}

// ── Normalisation des saisies (uniformisation en base) ───────────────────────
/** « jean  dupont » → « JEAN DUPONT » (trim + espaces réduits + majuscules). */
const enMajuscules = (v: string): string => v.trim().replace(/\s+/g, ' ').toUpperCase()
/** « burkina  faso » → « Burkina Faso » (chaque mot capitalisé). */
const enCapitalise = (v: string): string =>
  v.trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (_m, sep, c) => sep + c.toUpperCase())
/** Ne garde que les chiffres. */
const chiffresSeuls = (v: string): string => v.replace(/\D/g, '')

function HistoryInput({
  fieldKey, history, value, onChange, className, placeholder,
  style, maxLength, disabled, uppercase, normaliser,
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
        onBlur={() => { if (normaliser && value) onChange(normaliser(value)) }}
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
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
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
      background: filled ? 'var(--accent)' : '#CBD5E1',
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
  height: 26, background: 'var(--tc-card)', border: '1px solid var(--tc-th-bd)', borderRadius: 4,
  padding: '0 26px 0 8px', color: 'var(--tc-text)', fontSize: 11.5, outline: 'none',
  cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
} as CSSProperties
const QBTN: CSSProperties = {
  fontSize: 11, width: 22, height: 22, borderRadius: '50%',
  background: '#E2E8F0', border: 'none', cursor: 'pointer', color: 'var(--tc-label)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function EnregistrementPage(): JSX.Element {

  // Types de véhicule — source unique (Outils+Config. → Types Véhicule)
  const typesVehicule = useTypesVehicule()

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
  const [alerteChassis, setAlerteChassis] = useState<ReactNode | null>(null)
  const [showEdition,   setShowEdition] = useState(false)
  const [editMode,      setEditMode]    = useState(false)
  // Fenêtre d'origine (Liste/Recherche) — rouverte après validation de la modification
  const [editFrom,      setEditFrom]    = useState<string | null>(null)

  // ── Charger un véhicule depuis Liste/Recherche (mode Modification) ───────
  const applyLoadedVehicle = (raw: string | null): void => {
    if (!raw) return
    localStorage.removeItem('tcit_loadEnreg')
    try {
      const v = JSON.parse(raw)
      if (v.from) setEditFrom(v.from)
      if (v.ref) setSavedRef(v.ref)
      if (v.nom) setNomAcheteur(v.nom)
      if (v.resid) setPaysResidence(v.resid)
      if (v.paydest) setPaysDestination(v.paydest)
      if (v.marque) setMarqueModele(v.marque)
      if (v.chassis) setChassis(v.chassis)
      if (v.type) setTypeVehicule(v.type)
      if (v.dest) {
        setDestination(v.dest)
        const d = getDestinations().find(dd => dd.code === v.dest)
        if (d) setImmatGenere(v.immat || `${d.lettre}${String(d.numImmatActuel).padStart(4, '0')}`)
      }
      if (v.montant) setMontant(v.montant)
      if (v.immat) setImmatGenere(v.immat)
      if (v.date) setDate(dayjs(v.date))
      if (v.numTri) setNumTri(v.numTri)
      if (v.dateTri) setDateTri(dayjs(v.dateTri))
      setEditMode(true)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    // 1) Au montage — fenêtre fraîchement ouverte par « Modifier »
    applyLoadedVehicle(localStorage.getItem('tcit_loadEnreg'))
    // 2) Via l'event storage — fenêtre Enregistrement DÉJÀ ouverte : bascule en Modification
    const onStorage = (e: StorageEvent): void => {
      if (e.key === 'tcit_loadEnreg' && e.newValue) applyLoadedVehicle(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // « Appliquer ce type » depuis la fenêtre de décodage VIN (autre BrowserWindow)
  useEffect(() => {
    const onVinType = (e: StorageEvent): void => {
      if (e.key !== 'tcit_vin_type' || !e.newValue) return
      try {
        const { type } = JSON.parse(e.newValue) as { type: string }
        if (type && type !== typeVehicule && !saved) {
          setTypeVehicule(type); setDestination(undefined); setImmatGenere(null); setMontant(null)
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', onVinType)
    return () => window.removeEventListener('storage', onVinType)
  }, [typeVehicule, saved])

  // « Double-clic pour charger » depuis une fenêtre d'historique (autre BrowserWindow)
  useEffect(() => {
    const onPick = (e: StorageEvent): void => {
      if (e.key !== 'tcit_hist_pick' || !e.newValue || saved) return
      try {
        const { champ, valeur } = JSON.parse(e.newValue) as { champ: string; valeur: string }
        switch (champ) {
          case 'nomAcheteur':    setNomAcheteur(valeur); break
          case 'paysResidence':  setPaysResidence(valeur); break
          case 'paysDestination':setPaysDestination(valeur); break
          case 'description':    setDescription(valeur); break
          case 'maisonTransit':  setMaisonTransit(valeur); break
          case 'chassis':        setChassis(valeur); break
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', onPick)
    return () => window.removeEventListener('storage', onPick)
  }, [saved])

  // ── Historiques de saisie (store centralisé, synchro inter-fenêtres) ───────
  const nomOpts     = useHistorique('nom')
  const paysOpts    = useHistorique('pays')     // partagé Résidence + Destination
  const parcOpts    = useHistorique('parc')     // champ « parc de provenance »
  const transitOpts = useHistorique('transit')
  const chassisOpts = useHistorique('chassis')  // préfixes de 11 caractères
  const marquesRef  = useMarques()              // référentiel Marques (fichier)
  const triHist     = useFieldHistory('numTri') // inchangé (pas dans le périmètre)

  // Ouvre une fenêtre de gestion (MDI) depuis le registre. `origine` = champ du
  // formulaire à renseigner si l'utilisateur double-clique une valeur dans la fenêtre.
  const ouvrirGestion = (id: string, origine?: string): void => {
    try { if (origine) localStorage.setItem('tcit_hist_origine', origine) } catch { /* ignore */ }
    const c = WINDOW_REGISTRY[id]
    if (c) electronApi.mdiOpen({ id, x: c.defaultX, y: c.defaultY, width: c.width, height: c.height })
  }

  // ── Progression (4 critères) ──────────────────────────────────────────────
  const progress = [
    nomAcheteur !== '',
    typeVehicule !== undefined,
    marqueModele !== '',
    destination !== undefined,
  ]
  const progressCount = progress.filter(Boolean).length
  const formReady     = progressCount === 4

  const handleDestinationChange = async (code: string): Promise<void> => {
    const dest = getDestinations().find(d => d.code === code)
    if (dest) {
      setMontant(MONTANT_FIXE)
      setDestination(code)
      // Prochain N° IMMAT = max(base référentiel, max réel en base) + 1 (anti-doublon)
      const num = String(await prochainNumImmat(code, dest.numImmatActuel)).padStart(4, '0')
      setImmatGenere(`${dest.lettre}${num}`)
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

  // ── Détection d'un N° de châssis déjà enregistré (actifs ET archivés) ───────
  // Un châssis déjà présent = anomalie à faire régler par l'administrateur.
  // On exclut l'enregistrement en cours de modification (son propre châssis).
  // Détection en base (vin unique) : actifs via le cache, archives via requête.
  const [chassisDuplique, setChassisDuplique] = useState<{ ref: string; immat: string } | null>(null)
  useEffect(() => {
    const ch = chassis.trim().toUpperCase()
    if (ch.length < 5) { setChassisDuplique(null); return }
    const actif = getAllVehicules().find(v => (v.chassis ?? '').trim().toUpperCase() === ch && v.ref !== savedRef)
    if (actif) { setChassisDuplique({ ref: actif.ref, immat: actif.immat }); return }
    let annule = false
    void electronApi.dbArchivesRechercher(ch).then(r => {
      if (annule) return
      const arch = (r.items ?? []).find(v => v.chassis.trim().toUpperCase() === ch && v.ref !== savedRef)
      setChassisDuplique(arch ? { ref: arch.ref, immat: arch.immat } : null)
    })
    return () => { annule = true }
  }, [chassis, savedRef])

  const handleEnregistrer = async (): Promise<void> => {
    // Garde-fou : châssis déjà enregistré → on bloque et on renvoie vers l'admin
    if (chassisDuplique) {
      setAlerteChassis(
        <>
          Le N° de châssis <strong>{chassis.trim().toUpperCase()}</strong> est <strong>déjà enregistré</strong> dans
          la base (réf. {chassisDuplique.ref}
          {chassisDuplique.immat ? <> — immat. {chassisDuplique.immat}</> : null}).
          <br /><br />Veuillez vous <strong>adresser à l'administrateur</strong> pour régler ce point.
        </>,
      )
      return
    }
    setLoading(true)

    // Persistance des historiques
    addHistorique('nom', nomAcheteur)
    addHistorique('pays', paysResidence)
    addHistorique('pays', paysDestination)
    addHistorique('parc', description) // champ « parc de provenance »
    addHistorique('transit', maisonTransit)
    if (numTri)   triHist.add(numTri)
    if (chassis)  addHistorique('chassis', chassis.slice(0, CHASSIS_PREFIXE_LEN)) // on mémorise le préfixe (début répétitif du VIN)
    if (marqueModele) void addMarque(marqueModele) // ajout auto au fichier Marques (dédoublonne)

    // Ajout réel en BASE — le main attribue la référence et la retourne.
    // Synchronise Liste, Dashboard, etc. via db:changed('enregistrements').
    const ref = await addVehicule({
      date: dayjs().format('YYYY-MM-DD HH:mm'),
      immat: immatGenere ?? '',
      chassis,
      typeVehicule: typeVehicule ?? '',
      marqueModele,
      destination: destination ?? '',
      montant: montant ?? MONTANT_FIXE,
      nomAcheteur,
      paysResidence,
      paysDestination,
      parc: maisonTransit, // colonne « Sortant du parc » = maison de transit (cf. STCA II réel)
      agent: localStorage.getItem('tcit_session_login') ?? 'awute',
      recyclerPlaque: false, // nouveau véhicule = pas encore sorti
      numTri,
      dateTri: dateTri.format('YYYY-MM-DD'),
    })
    if (!ref) {
      setAlerteChassis(<>L&apos;enregistrement a échoué (doublon châssis/immatriculation ou erreur base). Réessayez ou voyez l&apos;administrateur.</>)
      setLoading(false)
      return
    }
    setSavedRef(ref)

    // Envoi vers le poste d'affichage (émetteur dans le main : bufferise hors ligne,
    // se reconnecte seul ; n'échoue jamais côté enregistrement). Inactif si non configuré.
    void electronApi.affichageEnvoyer({
      reference: ref,
      immatriculation: immatGenere ?? '',
      numeroTri: numTri,
      marqueModele,
      chassis,
      destination: destination ?? '',
      agent: localStorage.getItem('tcit_session_login') ?? 'awute',
    })

    setSaved(true)
    setLoading(false)
    setShowEdition(true)
  }

  const destNom = destination
    ? (getDestinations().find(d => d.code === destination)?.nom ?? '')
    : ''

  const DEST_COLORS = useDestColors()

  // Récapitulatif financier : Montant STCA + Assurance (tarif de la catégorie) = Total facture
  const montantStca    = montant ?? 0
  const montantAssur   = typeVehicule ? tarifPourType(typeVehicule).tarif : 0
  const totalFacture   = montantStca + montantAssur
  const fmtF = (n: number): string => `${n.toLocaleString('fr-FR')} F`

  const R: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }
  const LBL: CSSProperties = { fontSize: 11, color: 'var(--tc-label)', whiteSpace: 'nowrap', width: 130, flexShrink: 0 }
  const LBL_SM: CSSProperties = { ...LBL, width: 110 }
  const FS: CSSProperties = { border: '1px solid var(--tc-fieldset-bd)', borderRadius: 5, padding: '6px 12px 10px', margin: 0 }
  const LEG: CSSProperties = { fontSize: 10, fontWeight: 600, color: 'var(--tc-label)', padding: '0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      userSelect: 'none',
      // Agrandissement proportionnel +20% (mêmes proportions, tout plus grand)
      zoom: 1.2,
      animation: 'formEnter 0.35s cubic-bezier(0.16,1,0.3,1)',
      background: 'var(--tc-section)',
    }}>

      {/* ── Sub-header beige ────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--tc-subheader-bg)', borderBottom: '2px solid var(--tc-subheader-bd)',
        padding: '9px 14px', display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, marginRight: 8 }}>📄</span>
        <span style={{ color: 'var(--tc-heading)', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
          {editMode ? "Modification d'un Enregistrement" : 'Enregistrement des Véhicules'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {progress.map((filled, i) => <ProgressDot key={i} filled={filled} />)}
          <span style={{ fontSize: 9, color: 'var(--tc-muted)', marginLeft: 5 }}>
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
            height: 32, padding: '0 16px', background: 'var(--tc-section)', color: 'var(--tc-muted)',
            border: '1px solid var(--tc-th-bd)', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            🖨 Réimprimer
          </button>
          <button onClick={handleReset} style={{
            height: 32, padding: '0 16px', background: 'var(--tc-section)', color: 'var(--tc-muted)',
            border: '1px solid var(--tc-th-bd)', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            ➕ Nouveau
          </button>
        </div>
      )}

      {/* ── Barre Référence + date + IMMAT badge ───────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '7px 16px', borderBottom: '1px solid var(--tc-line)', background: 'var(--tc-section)', flexShrink: 0,
      }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('mdi:open-window', { detail: 'listeVehicules' }))}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
            background: 'var(--tc-soft-bg)', border: '1px solid var(--tc-soft-bd)', borderRadius: 5,
            color: 'var(--tc-soft-tx)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >☰ Liste</button>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tc-label)' }}>Référence</span>
        <input className="light-input" value={savedRef ?? '0'} readOnly
          style={{ width: 58, textAlign: 'center', fontWeight: 700, color: 'var(--accent)', letterSpacing: 1.5, background: 'var(--tc-soft-bg)', height: 26 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tc-label)' }}>En date du</span>
        <DatePicker value={date} onChange={v => v && setDate(v)} format="DD/MM/YYYY" size="small"
          style={{ width: 136, height: 26 }} allowClear={false} disabled={saved} />
        <div style={{ flex: 1 }} />
        {/* Affichage N° Immatriculation — style « plaque réaliste » (bordure pleine).
            En attente : contour gris, fond transparent. Défini : couleur de la
            destination (bordure légèrement transparente + fond très léger tinté). */}
        <div style={{
          minWidth: 246, minHeight: 72, padding: '12px 18px', whiteSpace: 'nowrap',
          border: `3px solid ${immatGenere ? `${DEST_COLORS[destination ?? ''] ?? '#1B3A6B'}CC` : '#94A3B8'}`,
          borderRadius: 10,
          background: immatGenere ? `${DEST_COLORS[destination ?? ''] ?? '#1B3A6B'}14` : 'transparent',
          textAlign: 'center', position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: immatGenere ? '0 6px 16px rgba(27,58,107,0.14)' : 'none',
          transition: 'border-color 0.3s, background 0.3s',
        }}>
          <span style={{
            position: 'absolute', top: 6, left: 12,
            fontSize: 8.5, fontWeight: 800, color: 'var(--tc-heading)', letterSpacing: 1, opacity: 0.55,
          }}>N° IMMAT</span>
          {immatGenere ? (
            <div key={immatGenere} style={{
              fontFamily: "'Arial Narrow', 'Segoe UI', sans-serif", fontWeight: 800,
              fontSize: 27, letterSpacing: 4, color: 'var(--tc-heading)', lineHeight: 1.15, marginTop: 8,
              animation: 'immatReveal 0.4s ease',
            }}>
              <span style={{ fontSize: 15, letterSpacing: 2.5, color: 'var(--tc-muted)' }}>TG WZ</span>{' '}
              {immatGenere[0]} {immatGenere.slice(1)}{' '}
              <span style={{ fontSize: 15, letterSpacing: 2.5, color: 'var(--tc-muted)' }}>{destination}</span>
            </div>
          ) : (
            <div style={{
              fontFamily: "'Arial Narrow', 'Segoe UI', sans-serif", fontWeight: 800,
              fontSize: 21, letterSpacing: 3, color: '#94A3B8', marginTop: 8,
            }}>EN ATTENTE</div>
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
            <AutoCompleteHistorique value={nomAcheteur} onChange={setNomAcheteur} options={nomOpts}
              normaliser={enMajuscules} placeholder="Nom et prénom de l'acheteur" icone="👤"
              style={{ height: 26 }} disabled={saved}
              onOpenGestion={() => ouvrirGestion('historique.nom', 'nomAcheteur')} />
          </div>
          <div style={R}>
            <span style={LBL_SM}>Pays Résidence :</span>
            <AutoCompleteHistorique value={paysResidence} onChange={setPaysResidence} options={paysOpts}
              normaliser={enCapitalise} placeholder="Pays de résidence" icone="🌍"
              style={{ height: 26 }} disabled={saved}
              onOpenGestion={() => ouvrirGestion('historique.pays', 'paysResidence')} />
            <span style={{ fontSize: 11, color: 'var(--tc-label)', whiteSpace: 'nowrap', marginLeft: 12 }}>Pays Destination :</span>
            <AutoCompleteHistorique value={paysDestination} onChange={setPaysDestination} options={paysOpts}
              normaliser={enCapitalise} placeholder="Pays de destination" icone="🌍"
              style={{ height: 26 }} disabled={saved}
              onOpenGestion={() => ouvrirGestion('historique.pays', 'paysDestination')} />
          </div>
        </fieldset>

        {/* ── Section Description du véhicule ──────────────────────────── */}
        <fieldset style={FS}>
          <legend style={LEG}>Description du véhicule</legend>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>
            Véhicule sortant du Parc
          </div>
          {/* Véhicule à assurer + Description */}
          <div style={R}>
            <span style={LBL}>Véhicule à assurer :</span>
            <select style={{ ...FS2, width: 130 }} value={typeVehicule ?? ''} disabled={saved}
              onChange={e => { const v = e.target.value || undefined; setTypeVehicule(v); setDestination(undefined); setImmatGenere(null); setMontant(null) }}>
              <option value="">—</option>
              {typesVehicule.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}
            </select>
            <AutoCompleteHistorique value={description} onChange={setDescription} options={parcOpts}
              normaliser={enCapitalise} placeholder="Nom du parc de provenance du véhicule" icone="🅿️"
              style={{ height: 26 }} disabled={saved}
              onOpenGestion={() => ouvrirGestion('historique.parc', 'description')} />
          </div>
          {/* À Destination de + Montant */}
          <div style={R}>
            <span style={LBL}>À Destination de :</span>
            <select style={{ ...FS2, width: 130 }} value={destination ?? ''} disabled={!typeVehicule || saved}
              onChange={e => { if (e.target.value) handleDestinationChange(e.target.value) }}>
              <option value="">{typeVehicule ? '—' : "⚠ Choisir d'abord le type"}</option>
              {getDestinations().map(d => <option key={d.code} value={d.code}>{d.code}</option>)}
            </select>
            {destination && destNom && (
              <div style={{
                flex: 1, padding: '4px 14px', borderRadius: 4, fontSize: 11.5, fontWeight: 700,
                // Jaune (S/C) et gris (POL) → texte sombre, sinon blanc — prototype updateDestLabel
                color: (DEST_COLORS[destination] === '#FFD700' || DEST_COLORS[destination] === '#94A3B8') ? '#1E293B' : '#fff',
                whiteSpace: 'nowrap', letterSpacing: 0.3, textAlign: 'center',
                background: DEST_COLORS[destination] ?? '#6B7280',
              }}>{destNom}</div>
            )}
            <div style={{ minWidth: 12 }} />
            <span style={{ fontSize: 11, color: 'var(--tc-label)', whiteSpace: 'nowrap' }}>Montant :</span>
            <input className="light-input" value={montant != null ? `${montant.toLocaleString('fr-FR')} FCFA` : '0'} readOnly
              style={{ width: 90, textAlign: 'right', fontWeight: 700, color: 'var(--tc-heading)', background: 'var(--tc-montant-bg)', height: 26 }} />
          </div>
          {/* Marque - Modèle + N° de Tri */}
          <div style={R}>
            <span style={LBL}>Marque - Modèle :</span>
            <AutoCompleteHistorique value={marqueModele} onChange={setMarqueModele}
              options={marquesRef.map(m => m.nom)} transformSaisie={v => v.toUpperCase()} normaliser={enMajuscules}
              placeholder="Marque et modèle du véhicule" icone="🚗"
              style={{ height: 26 }} disabled={saved}
              onOpenGestion={() => ouvrirGestion('fichier.marques')} />
            <span style={{ fontSize: 11, color: 'var(--tc-label)', whiteSpace: 'nowrap', marginLeft: 12 }}>N° de Tri :</span>
            <HistoryInput fieldKey="numTri" history={triHist.history} value={numTri} onChange={setNumTri}
              normaliser={chiffresSeuls} className="light-input" style={{ width: 140, height: 26 }} disabled={saved} />
          </div>
          {/* Transit (maison) + Date N° Tri */}
          <div style={R}>
            <span style={LBL}>Transit (maison) :</span>
            <AutoCompleteHistorique value={maisonTransit} onChange={setMaisonTransit} options={transitOpts}
              normaliser={enCapitalise} placeholder="Maison de transit" icone="🏢"
              style={{ height: 26 }} disabled={saved}
              onOpenGestion={() => ouvrirGestion('historique.transit', 'maisonTransit')} />
            <span style={{ fontSize: 11, color: 'var(--tc-label)', whiteSpace: 'nowrap', marginLeft: 12 }}>Date N° Tri :</span>
            <DatePicker value={dateTri} onChange={v => v && setDateTri(v)} format="DD/MM/YYYY" size="small"
              allowClear={false} disabled={saved} style={{ width: 140, height: 26 }} />
          </div>
          {/* N° de Châssis */}
          <div style={{ ...R, marginBottom: 0 }}>
            <span style={LBL}>N° de Châssis :</span>
            <AutoCompleteHistorique value={chassis} onChange={setChassis} options={chassisOpts}
              transformSaisie={v => v.replace(/\s+/g, '').toUpperCase()} maxLength={17}
              placeholder="Ex : ZFA29000000302873 — le début est proposé" icone="🔩"
              inputClass="light-input--chassis"
              style={{ height: 36 }} disabled={saved}
              onOpenGestion={() => ouvrirGestion('historique.chassis', 'chassis')} />
            <button type="button" className="btn-decoder-vin" disabled={saved}
              title="Décoder ce N° de châssis (constructeur, année, catégorie…)"
              onClick={() => { localStorage.setItem('tcit_vin_decode', chassis); ouvrirGestion('fichier.decodeurVin') }}>
              🔎 Décoder le VIN
            </button>
          </div>
          {chassisDuplique && (
            <div style={{
              marginTop: 6, padding: '6px 10px', borderRadius: 6,
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              fontSize: 10.5, color: '#991B1B', lineHeight: 1.45, display: 'flex', gap: 6, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 12 }}>⚠</span>
              <span>
                Ce N° de châssis est <strong>déjà enregistré</strong> (réf. {chassisDuplique.ref}
                {chassisDuplique.immat ? <> — immat. {chassisDuplique.immat}</> : null}).
                Adressez-vous à l'<strong>administrateur</strong>.
              </span>
            </div>
          )}
        </fieldset>

        {/* ── Bas : ancienne immat + recycler ──────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, border: '1px solid var(--tc-fieldset-bd)', borderRadius: 5, padding: '7px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--tc-label)', marginBottom: 6 }}>
              <Checkbox checked={saisirAncienne} onChange={e => setSaisirAncienne(e.target.checked)} disabled={saved} />
              Saisir l&apos;ancienne immatriculation
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--tc-label)', whiteSpace: 'nowrap' }}>Ancienne immatriculation :</span>
              <input className="light-input" value={ancienneImmat} disabled={!saisirAncienne || saved}
                onChange={e => setAncienneImmat(e.target.value)} style={{ flex: 1, height: 26, background: saisirAncienne ? '#fff' : '#F9FAFB' }} />
            </div>
          </div>
          <div style={{ width: 180, border: '1px solid var(--tc-fieldset-bd)', borderRadius: 5, padding: '7px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--tc-label)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Recycler &apos;Plaque Perdue&apos;
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--tc-text)', cursor: 'pointer' }}>
              <Checkbox checked={!recycler} onChange={e => setRecycler(!e.target.checked)} disabled={saved} />
              NON
            </label>
          </div>

          {/* ── Récapitulatif financier (compact, 2 lignes — même hauteur que les autres) ─── */}
          <div style={{
            width: 250, border: '1px solid #DCE4F2', borderRadius: 5, padding: '7px 13px',
            background: 'var(--tc-card)', boxShadow: '0 4px 12px rgba(27,58,107,0.08)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--tc-label)', marginBottom: 5 }}>
              <span>STCA <b style={{ color: 'var(--tc-text)', fontVariantNumeric: 'tabular-nums' }}>{fmtF(montantStca)}</b></span>
              <span>Assur. <b style={{ color: 'var(--tc-text)', fontVariantNumeric: 'tabular-nums' }}>{montantAssur ? fmtF(montantAssur) : '—'}</b></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--tc-line)', paddingTop: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--tc-heading)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Total facture</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>{fmtF(totalFacture)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Barre d'actions ────────────────────────────────────────────── */}
      {!saved && !editMode && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '9px 14px', borderTop: '1px solid var(--tc-line)', background: 'var(--tc-section)', flexShrink: 0,
        }}>
          <button onClick={handleReset} className="btn-reset" style={{
            height: 32, padding: '0 16px', background: 'var(--tc-section)', color: 'var(--tc-muted)',
            border: '1px solid var(--tc-th-bd)', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}><span className="btn-ico" role="img" aria-label="réinitialiser">🔄</span> Réinitialiser</button>
          {/* Annuler = fermer la fenêtre — prototype : closeWin('enregistrement') */}
          <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} className="btn-annuler" style={{
            height: 32, padding: '0 16px', background: 'var(--tc-section)', color: '#DC2626',
            border: '1px solid #DC2626', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}><span className="btn-ico" role="img" aria-label="annuler">✖️</span> Annuler</button>
          <button onClick={handleEnregistrer} disabled={loading || !formReady} className="btn-save" style={{
            height: 32, padding: '0 22px', background: loading || !formReady ? '#9CA3AF' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700,
            cursor: loading || !formReady ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {loading ? '⟳ Enregistrement...' : <><span className="btn-ico" role="img" aria-label="enregistrer">💾</span> Enregistrer</>}
          </button>
        </div>
      )}

      {/* ── Barre d'actions — mode Modification ─────────────────────── */}
      {!saved && editMode && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '9px 14px', borderTop: '1px solid var(--tc-line)', background: '#FFF7ED', flexShrink: 0,
        }}>
          <button onClick={() => { setEditMode(false); handleReset(); window.dispatchEvent(new CustomEvent('mdi:close-self')) }} style={{
            height: 32, padding: '0 16px', background: '#FFF7ED', color: '#DC2626',
            border: '1px solid #DC2626', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          }}>✕ Fermer</button>
          <button onClick={() => {
            // Sauvegarde réelle : surcharge par réf dans le store partagé →
            // Liste, Dashboard, Recherche, etc. se synchronisent automatiquement
            if (savedRef) {
              void updateVehicule(savedRef, {
                nomAcheteur, paysResidence, paysDestination,
                marqueModele, chassis,
                typeVehicule: typeVehicule ?? '',
                destination: destination ?? '',
                immat: immatGenere ?? '',
                montant: montant ?? MONTANT_FIXE,
                parc: maisonTransit,
                numTri,
                dateTri: dateTri.format('YYYY-MM-DD'),
              })
            }
            notification.success({ message: `✅ Véhicule ${savedRef} modifié`, placement: 'bottomRight' })
            // Retour à la fenêtre d'origine (Liste/Recherche) : on la rouvre
            // puis on ferme cette fenêtre de modification
            if (editFrom) window.dispatchEvent(new CustomEvent('mdi:open-window', { detail: editFrom }))
            window.dispatchEvent(new CustomEvent('mdi:close-self'))
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
        data={{
          immat: immatGenere ?? '',
          destCode: destination ?? '',
          nom: nomAcheteur,
          adresse: paysResidence,
          numTri,
          dateTri: dateTri.format('DD/MM/YYYY'),
          marque: marqueModele,
          chassis,
          parc: maisonTransit,
          dateDelivrance: dayjs().format('DD/MM/YYYY'),
        }}
        facture={{
          factureNum: savedRef ? parseInt(savedRef, 10).toLocaleString('fr-FR') : '',
          dateEnreg: date.format('DD/MM/YYYY'),
          nom: nomAcheteur,
          pays: paysDestination,
          destCode: destination ?? '',
          immat: immatGenere ?? '',
          chassis,
          marque: marqueModele,
          natureVeh: typeVehicule ?? '',
          montantStca: montant ?? MONTANT_FIXE,
          // Tarif de la catégorie du véhicule — Configuration Assurances (source unique)
          montantAssurance: tarifPourType(typeVehicule ?? '').tarif,
        }}
        ficheId={{
          nom: nomAcheteur,
          pays: paysDestination,
          chassis,
          marque: marqueModele,
          parc: maisonTransit,
          destCode: destination ?? '',
          immat: immatGenere ?? '',
          numTri,
          dateTri: dateTri.format('DD/MM/YYYY'),
        }}
        feuillet3={{
          numPolice: '1 - ' + (savedRef ? String(parseInt(savedRef, 10)).padStart(6, '0') : '') + ' / ' + date.format('YYYYMMDD'),
          dateEffet: date.format('DD/MM/YYYY'),
          dateEcheance: date.add(14, 'day').format('DD/MM/YYYY'),
          parc: maisonTransit,
          nom: nomAcheteur,
          paysResidence,
          paysDestination,
          categorieUsage: typeVehicule ?? '',
          marque: marqueModele,
          chassis,
          immatStac: immatGenere ? 'TG WZ ' + immatGenere[0] + ' ' + immatGenere.slice(1) + ' ' + (destination ?? '') : '',
          mention: '',
          // Primes de la catégorie du véhicule — Configuration Assurances (source unique)
          primes: primesPourType(typeVehicule ?? ''),
        }}
        feuillet1={{
          nom: nomAcheteur,
          numPolice: '1 - ' + (savedRef ? String(parseInt(savedRef, 10)).padStart(6, '0') : '') + ' / ' + date.format('YYYYMMDD'),
          dateEffet: date.format('DD/MM/YYYY'),
          dateEcheance: date.add(14, 'day').format('DD/MM/YYYY'),
          marque: marqueModele,
          immatStac: immatGenere ? 'TG WZ ' + immatGenere[0] + ' ' + immatGenere.slice(1) + ' ' + (destination ?? '') : '',
          chassis,
        }}
        feuillet2={{
          nom: nomAcheteur,
          numPolice: '1 - ' + (savedRef ? String(parseInt(savedRef, 10)).padStart(6, '0') : '') + ' / ' + date.format('YYYYMMDD'),
          dateEffet: date.format('DD/MM/YYYY'),
          dateEcheance: date.add(14, 'day').format('DD/MM/YYYY'),
          marque: marqueModele,
          immatStac: immatGenere ? 'TG WZ ' + immatGenere[0] + ' ' + immatGenere.slice(1) + ' ' + (destination ?? '') : '',
          chassis,
        }}
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
      {alerteChassis && <WinAlert message={alerteChassis} onClose={() => setAlerteChassis(null)} />}
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

// Indices des options d'édition qui incluent chaque document
const OPTIONS_AVEC_CG      = [0, 1, 2, 5]
const OPTIONS_AVEC_FACTURE = [0, 1, 4]
const OPTIONS_AVEC_FICHEID = [0, 2, 6]
const OPTIONS_AVEC_FEUILLET3 = [0, 3, 9]
const OPTIONS_AVEC_FEUILLET1 = [0, 3, 7]
const OPTIONS_AVEC_FEUILLET2 = [0, 3, 8]

type DocImp = 'facture' | 'cg' | 'ficheId' | 'feuillet1' | 'feuillet2' | 'feuillet3'

// Documents imprimables pour un choix d'édition (facture, carte grise, puis fiche ID)
function docsPourSelection(sel: number): DocImp[] {
  const docs: DocImp[] = []
  if (OPTIONS_AVEC_FACTURE.includes(sel)) docs.push('facture')
  if (OPTIONS_AVEC_CG.includes(sel)) docs.push('cg')
  if (OPTIONS_AVEC_FICHEID.includes(sel)) docs.push('ficheId')
  if (OPTIONS_AVEC_FEUILLET1.includes(sel)) docs.push('feuillet1')
  if (OPTIONS_AVEC_FEUILLET2.includes(sel)) docs.push('feuillet2')
  if (OPTIONS_AVEC_FEUILLET3.includes(sel)) docs.push('feuillet3')
  return docs
}

function EditionDocumentsModal({ open, reference, data, facture, ficheId, feuillet1, feuillet2, feuillet3, onClose }: {
  open: boolean
  reference: string | null
  data: CarteGriseData
  facture: FactureData
  ficheId: FicheIdData
  feuillet1: Feuillet1Data
  feuillet2: Feuillet2Data
  feuillet3: Feuillet3Data
  onClose: () => void
}): JSX.Element {
  const [selected,      setSelected]     = useState(0)
  const [previsualiser, setPrevisualiser]= useState(false)
  const [printing,      setPrinting]     = useState(false)
  // File d'impression directe (sans aperçu) — un document à la fois
  const [printQueue,    setPrintQueue]   = useState<DocImp[]>([])
  // Impressions autoPrint en attente de signal retour des fenêtres d'aperçu
  const [pendingTs,     setPendingTs]    = useState<number | null>(null)
  const [pendingDocs,   setPendingDocs]  = useState<DocImp[]>([])

  const notImplemented = (): void => {
    notification.info({
      message: 'Document non encore implémenté',
      description: EDITION_OPTIONS[selected],
      duration: 4,
      placement: 'bottomRight',
    })
  }

  // Ouvre la fenêtre d'aperçu d'un document (BrowserWindow propre — Règle 10)
  const openDocWindow = (doc: DocImp, autoPrint: boolean, ts: number): void => {
    const id  = doc === 'cg' ? 'apercu.carteGrise' : doc === 'facture' ? 'apercu.facture' : doc === 'ficheId' ? 'apercu.ficheId' : doc === 'feuillet1' ? 'apercu.feuillet1' : doc === 'feuillet2' ? 'apercu.feuillet2' : 'apercu.feuillet3'
    const cle = doc === 'cg' ? 'tcit_apercu_carteGrise' : doc === 'facture' ? 'tcit_apercu_facture' : doc === 'ficheId' ? 'tcit_apercu_ficheId' : doc === 'feuillet1' ? 'tcit_apercu_feuillet1' : doc === 'feuillet2' ? 'tcit_apercu_feuillet2' : 'tcit_apercu_feuillet3'
    const contenu = doc === 'cg' ? data : doc === 'facture' ? facture : doc === 'ficheId' ? ficheId : doc === 'feuillet1' ? feuillet1 : doc === 'feuillet2' ? feuillet2 : feuillet3
    const payload = { data: contenu, autoPrint, ts }
    localStorage.setItem(cle, JSON.stringify(payload))
    const cfg = WINDOW_REGISTRY[id]
    if (cfg) electronApi.mdiOpen({ id, x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
  }

  // Bouton Aperçu : consultation seule (impression manuelle depuis les aperçus)
  const handleApercu = (): void => {
    const docs = docsPourSelection(selected)
    if (docs.length === 0) { notImplemented(); return }
    const ts = Date.now()
    docs.forEach(d => openDocWindow(d, false, ts))
  }

  // Bouton Imprimer :
  // - Prévisualiser coché → aperçus rapides + impressions lancées (sans validation)
  // - Prévisualiser décoché → impression directe séquentielle, aucun aperçu
  const handleImprimer = async (): Promise<void> => {
    const docs = docsPourSelection(selected)
    if (docs.length > 0) {
      if (previsualiser) {
        const ts = Date.now()
        setPendingTs(ts)
        setPendingDocs(docs)
        docs.forEach(d => openDocWindow(d, true, ts))
      } else {
        setPrintQueue(docs)
      }
      return
    }
    // Autres documents — pas encore implémentés (simulation)
    setPrinting(true)
    await new Promise(r => setTimeout(r, 800))
    setPrinting(false)
    notImplemented()
    onClose()
  }

  const finishPrint = (): void => {
    setPrintQueue([])
    setPendingTs(null)
    setPendingDocs([])
    notification.success({
      message: '🖨 Document(s) envoyé(s) à l\'impression',
      description: EDITION_OPTIONS[selected],
      placement: 'bottomRight',
    })
    onClose()
  }

  // File directe : passe au document suivant, termine quand la file est vide
  const avancerQueue = (): void => {
    setPrintQueue(q => {
      const reste = q.slice(1)
      if (reste.length === 0) setTimeout(finishPrint, 0)
      return reste
    })
  }

  // Signaux retour des fenêtres d'aperçu autoPrint (un par document)
  useEffect(() => {
    if (pendingTs == null) return
    const onStorage = (e: StorageEvent): void => {
      const doc: DocImp | null =
        e.key === 'tcit_cg_printed' ? 'cg'
        : e.key === 'tcit_facture_printed' ? 'facture'
        : e.key === 'tcit_ficheid_printed' ? 'ficheId'
        : e.key === 'tcit_feuillet3_printed' ? 'feuillet3'
        : e.key === 'tcit_feuillet1_printed' ? 'feuillet1'
        : e.key === 'tcit_feuillet2_printed' ? 'feuillet2'
        : null
      if (!doc || e.newValue !== String(pendingTs)) return
      setPendingDocs(prev => {
        const reste = prev.filter(d => d !== doc)
        if (reste.length === 0) setTimeout(finishPrint, 0)
        return reste
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTs])

  return (
    <>
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PrinterOutlined style={{ color: C.blue }} />
          <span style={{ color: C.blue, fontWeight: 700 }}>Edition Documents : NORMALE</span>
          {reference && (
            <span style={{
              background: 'var(--tc-soft-bg)', color: C.accent,
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
            background: 'var(--tc-card)', color: C.muted,
          }}>
            Fermer
          </button>
          {/* Aperçu — consultation avant impression */}
          <button onClick={handleApercu} style={{
            height: 30, padding: '0 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${C.accent}`, borderRadius: 5,
            background: 'var(--tc-soft-bg)', color: C.accent,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            👁 Aperçu
          </button>
          <button onClick={handleImprimer} disabled={printing} style={{
            height: 30, padding: '0 16px', fontSize: 11, fontWeight: 700,
            border: 'none', borderRadius: 5, cursor: printing ? 'not-allowed' : 'pointer',
            background: printing
              ? '#9EB3D0'
              : `linear-gradient(135deg, ${C.accent} 0%, #1B3A6B 100%)`,
            color: '#fff',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <PrinterOutlined />
            {printing ? 'Impression...' : 'Imprimer'}
          </button>
        </div>
      </div>
    </Modal>

    {/* ── Impression directe séquentielle (Prévisualiser décoché) ── */}
    {printQueue[0] === 'facture' && (
      <FacturePrintDirect data={facture} onDone={avancerQueue} />
    )}
    {printQueue[0] === 'cg' && (
      <CarteGrisePrintDirect data={data} onDone={avancerQueue} />
    )}
    {printQueue[0] === 'ficheId' && (
      <FicheIdPrintDirect data={ficheId} onDone={avancerQueue} />
    )}
    {printQueue[0] === 'feuillet3' && (
      <Feuillet3PrintDirect data={feuillet3} onDone={avancerQueue} />
    )}
    {printQueue[0] === 'feuillet1' && (
      <Feuillet1PrintDirect data={feuillet1} onDone={avancerQueue} />
    )}
    {printQueue[0] === 'feuillet2' && (
      <Feuillet2PrintDirect data={feuillet2} onDone={avancerQueue} />
    )}
    </>
  )
}

// ── Modal Marque / Modèle — lit le store partagé (source unique : Fichier Marques)
function MarqueModeleModal({ open, onSelect, onCancel }: {
  open: boolean; onSelect: (v: string) => void; onCancel: () => void
}): JSX.Element {
  const marques = useMarques()
  const [search, setSearch] = useState('')
  const filtered = marques.map(m => m.nom).filter(m => m.toLowerCase().includes(search.toLowerCase()))
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
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--tc-soft-bg)')}
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
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--tc-soft-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {p}
          </div>
        ))}
      </div>
    </Modal>
  )
}
