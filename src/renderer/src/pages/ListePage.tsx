import { useState, useMemo, type ReactNode } from 'react'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useVehicules } from '@mock/vehiculesStore'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { WinAlert, WinConfirm, EditionDocsModal } from '@components/WinDialogs'
import DraggableWindow from '@components/DraggableWindow'

const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}

const BTN = 'width:100%;padding:5px 6px;font-size:11px;border-radius:4px;cursor:pointer;border:1px solid'

export default function ListePage(): JSX.Element {
  const vehicules = useVehicules() // store partagé — se met à jour à chaque nouvel enregistrement
  const todayISO = dayjs().format('YYYY-MM-DD')
  // Dates saisies (inputs) vs dates appliquées (utilisées pour filtrer, MAJ au clic Rechercher)
  const [from, setFrom] = useState(todayISO)
  const [to, setTo] = useState(todayISO)
  const [appliedFrom, setAppliedFrom] = useState(todayISO)
  const [appliedTo, setAppliedTo] = useState(todayISO)
  const [pointage, setPointage] = useState<'sortie' | 'non_sortie' | 'toutes'>('toutes')
  const [frFilter, setFrFilter] = useState('')
  const [selectedRef, setSelectedRef] = useState<string | null>(null)
  const [hoveredRef, setHoveredRef] = useState<string | null>(null)
  const [alert, setAlert] = useState<ReactNode | null>(null)
  const [confirm, setConfirm] = useState<{ msg: ReactNode; cb: () => void } | null>(null)
  const [editionType, setEditionType] = useState<'duplicata' | 'renouvel' | null>(null)
  const [printOpen, setPrintOpen] = useState(false)

  // Rechercher : applique les dates saisies (comme doSearchListe du prototype)
  const doSearch = (): void => {
    setAppliedFrom(from)
    setAppliedTo(to)
    setSelectedRef(null)
  }

  const checkSel = (): boolean => {
    if (selectedRef) return true
    const msg = filtered.length > 0
      ? <>Veuillez sélectionner un enregistrement<br />dans la liste avant d&apos;effectuer cette opération.</>
      : <>Aucun enregistrement affiché.<br />Sélectionnez une période, cliquez sur <strong>Rechercher</strong>,<br />puis choisissez un enregistrement dans la liste.</>
    setAlert(msg)
    return false
  }

  const filtered = useMemo(() => {
    return vehicules.filter(v => {
      const d = v.date.slice(0, 10) // date seule (les mocks contiennent HH:mm) — comme dmyToISO du prototype
      if (d < appliedFrom || d > appliedTo) return false
      if (frFilter && v.destination !== frFilter.toUpperCase()) return false
      if (pointage === 'sortie' && !v.recyclerPlaque) return false
      if (pointage === 'non_sortie' && v.recyclerPlaque) return false
      return true
    })
  }, [vehicules, appliedFrom, appliedTo, pointage, frFilter])

  const sorties = filtered.filter(v => v.recyclerPlaque).length

  const thStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
    letterSpacing: 0.4, padding: 8, borderBottom: '2px solid #E2E8F0',
    textAlign: 'left', whiteSpace: 'nowrap', background: '#F8FAFF',
  }
  const tdStyle: React.CSSProperties = {
    padding: 8, color: '#1E293B', borderBottom: '1px solid #F1F5F9',
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Zone principale gauche ──────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Barre filtres date */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
          background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0, flexWrap: 'wrap',
        }}>
          <label style={{ fontSize: 11.5, color: '#374151', whiteSpace: 'nowrap' }}>Date Début :</label>
          <input type="date" className="light-input" value={from} onChange={e => setFrom(e.target.value)}
            style={{ padding: '3px 5px', fontSize: 11, width: 126, height: 26 }} />
          <span style={{ color: '#94A3B8', fontWeight: 700 }}>&gt;&gt;</span>
          <label style={{ fontSize: 11.5, color: '#374151', whiteSpace: 'nowrap' }}>Date Fin :</label>
          <input type="date" className="light-input" value={to} onChange={e => setTo(e.target.value)}
            style={{ padding: '3px 5px', fontSize: 11, width: 126, height: 26 }} />
          <button onClick={doSearch} style={{
            height: 32, padding: '0 12px', background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>🔍 Rechercher</button>
        </div>

        {/* Table scrollable — colonnes conformes au vrai STCA II */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={thStyle}>Réf ↕</th>
                <th style={thStyle}>Nom et prénom ↕</th>
                <th style={thStyle}>Adresse ↕</th>
                <th style={thStyle}>Code ↕</th>
                <th style={thStyle}>Immatriculation ↕</th>
                <th style={thStyle}>Marque et modèle ↕</th>
                <th style={thStyle}>N° Chassis ↕</th>
                <th style={thStyle}>N° de Tri ↕</th>
                <th style={thStyle}>Sortant du parc ↕</th>
                <th style={thStyle}>Enregistré le ↕</th>
                <th style={thStyle}>Date du N° de Tri ↕</th>
                <th style={thStyle}>Nom de l&apos;utilisateur ↕</th>
                <th style={thStyle}>Sortie</th>
                <th style={thStyle}>Sortie le ↕</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={14} style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontStyle: 'italic' }}>Aucun véhicule trouvé</td></tr>
              ) : filtered.map(v => {
                const bg = DEST_COLORS[v.destination] ?? '#6B7280'
                const isSelected = selectedRef === v.ref
                const isHovered = hoveredRef === v.ref
                const bbc = isSelected ? '#BFDBFE' : '#F1F5F9'
                const rowBg = isSelected ? '#EFF6FF' : (isHovered ? '#F8FAFF' : undefined)
                // Cellule Réf verte si véhicule sorti (variante plus foncée au survol)
                const refBg = v.recyclerPlaque
                  ? (isHovered && !isSelected ? '#BBF7D0' : '#D1FAE5')
                  : undefined
                return (
                  <tr key={v.id}
                    onClick={() => setSelectedRef(v.ref)}
                    onMouseEnter={() => setHoveredRef(v.ref)}
                    onMouseLeave={() => setHoveredRef(null)}
                    style={{ cursor: 'pointer', background: rowBg }}
                  >
                    <td style={{ ...tdStyle, color: '#64748B', borderBottomColor: bbc, background: refBg }}>{v.ref}</td>
                    <td style={{ ...tdStyle, color: '#1E293B', fontWeight: 500, borderBottomColor: bbc, textTransform: 'uppercase' }}>{v.nomAcheteur || '—'}</td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{v.paysResidence}/{v.paysDestination || v.paysResidence}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', borderBottomColor: bbc }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, color: destTxt(bg), background: bg }}>{v.destination}</span>
                    </td>
                    <td style={{ ...tdStyle, borderBottomColor: bbc }}>
                      <span style={{
                        fontFamily: "'Courier New', monospace", fontWeight: 700, color: '#D97706', fontSize: 10.5,
                        background: '#FFF7ED', border: '1px solid #FED7AA', padding: '2px 6px', borderRadius: 3,
                      }}>{v.immat}</span>
                    </td>
                    <td style={{ ...tdStyle, color: '#1E293B', borderBottomColor: bbc, textTransform: 'uppercase' }}>{v.marqueModele}</td>
                    <td style={{ ...tdStyle, fontFamily: "'Courier New', monospace", fontSize: 10, color: '#2563EB', borderBottomColor: bbc }}>{v.chassis}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#7C3AED', fontWeight: 600, borderBottomColor: bbc }}>
                      {String(10000 + v.id).padStart(6, '0')}
                    </td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{v.parc || '—'}</td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{v.agent}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', borderBottomColor: bbc }}>
                      {v.recyclerPlaque
                        ? <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                        : <span style={{ color: '#CBD5E1' }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>
                      {v.recyclerPlaque ? dayjs(v.date).add(1, 'day').format('DD/MM/YYYY') : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Barre statut */}
        <div style={{ padding: '4px 10px', background: '#FFFEF0', borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#475569', flexShrink: 0 }}>
          Nbr de Véhicule(s) : {filtered.length} &nbsp;-&nbsp; Nbr de Véhicule(s) Sortie(s) : {sorties}
        </div>
      </div>

      {/* ── Panneau actions droit ───────────────────────────────────── */}
      <div style={{
        width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5,
        padding: '7px 6px', background: '#F8FAFF', borderLeft: '1px solid #E2E8F0', overflowY: 'auto',
      }}>
        {/* Rééditer DUPLICATA */}
        <button onClick={() => { if (checkSel()) setEditionType('duplicata') }}
          style={{
            width: '100%', padding: '7px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, lineHeight: 1.4,
          }}>🖨 Rééditer un<br />DUPLICATA</button>

        {/* Rééditer Renouvellement */}
        <button onClick={() => { if (checkSel()) setEditionType('renouvel') }}
          style={{
            width: '100%', padding: '7px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, lineHeight: 1.4,
          }}>🖨 Rééditer un<br />Renouvellem.</button>

        {/* Modifier — ouvre Enregistrement + charge les données + ferme Liste */}
        <button onClick={() => {
          if (!checkSel()) return
          const v = filtered.find(x => x.ref === selectedRef)
          if (!v) return
          localStorage.setItem('tcit_loadEnreg', JSON.stringify({
            ref: v.ref, nom: v.nomAcheteur, resid: v.paysResidence, paydest: v.paysDestination,
            marque: v.marqueModele, chassis: v.chassis, type: v.typeVehicule, dest: v.destination,
            immat: v.immat, montant: v.montant, date: v.date, parc: v.parc, agent: v.agent,
          }))
          const cfg = WINDOW_REGISTRY['enregistrement']
          if (cfg) electronApi.mdiOpen({ id: 'enregistrement', x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
          notification.info({ message: `📋 Chargé : ${v.immat} — ${v.nomAcheteur || v.marqueModele}`, placement: 'bottomRight', duration: 2.5 })
          window.dispatchEvent(new CustomEvent('mdi:close-self'))
        }}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #CBD5E1', background: '#fff', color: '#1E293B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>✏ Modifier</button>

        {/* Imprimer — ouvre aperçu impression de la liste filtrée */}
        <button onClick={() => {
          if (filtered.length === 0) { setAlert(<>Aucun enregistrement à imprimer.<br />Sélectionnez une période et cliquez sur <strong>Rechercher</strong>.</>); return }
          setPrintOpen(true)
        }}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #CBD5E1', background: '#fff', color: '#1E293B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>🖨 Imprimer</button>

        {/* Supprimer */}
        <button onClick={() => {
          if (!checkSel()) return
          setConfirm({ msg: 'Voulez-vous supprimer cet enregistrement ?', cb: () => {
            notification.success({ message: '✅ Enregistrement supprimé', placement: 'bottomRight' })
            setSelectedRef(null); setConfirm(null)
          }})
        }}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>⊖ Supprimer</button>

        {/* Filtrage Pointage */}
        <fieldset style={{ border: '1px solid #E2E8F0', borderRadius: 5, padding: '6px 8px', background: '#fff', marginTop: 2, margin: 0 }}>
          <legend style={{ fontSize: 10.5, fontWeight: 600, color: '#374151', padding: '0 3px' }}>Filtrage Pointage</legend>
          <label style={{ display: 'block', fontSize: 11, cursor: 'pointer', marginBottom: 3 }}>
            <input type="radio" name="lv-pointage" value="sortie" checked={pointage === 'sortie'}
              onChange={() => setPointage('sortie')} style={{ accentColor: '#2563EB' }} /> Sortie
          </label>
          <label style={{ display: 'block', fontSize: 11, cursor: 'pointer', marginBottom: 3 }}>
            <input type="radio" name="lv-pointage" value="non_sortie" checked={pointage === 'non_sortie'}
              onChange={() => setPointage('non_sortie')} style={{ accentColor: '#2563EB' }} /> NON sortie
          </label>
          <label style={{ display: 'block', fontSize: 11, cursor: 'pointer' }}>
            <input type="radio" name="lv-pointage" value="toutes" checked={pointage === 'toutes'}
              onChange={() => setPointage('toutes')} style={{ accentColor: '#2563EB' }} /> Toutes
          </label>
        </fieldset>

        {/* Filtrage Frontière */}
        <fieldset style={{ border: '1px solid #E2E8F0', borderRadius: 5, padding: '6px 8px', background: '#fff', margin: 0 }}>
          <legend style={{ fontSize: 10.5, fontWeight: 600, color: '#374151', padding: '0 3px' }}>Filtrage Frontière</legend>
          <input type="text" className="light-input" placeholder="ex: AFO" value={frFilter}
            onChange={e => setFrFilter(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '3px 5px', fontSize: 11, textTransform: 'uppercase', height: 26 }} />
        </fieldset>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* NON Sortie — décocher le pointage de sortie */}
        <button onClick={() => {
          if (!checkSel()) return
          const v = filtered.find(x => x.ref === selectedRef)
          if (!v) return
          if (!v.recyclerPlaque) { notification.info({ message: "Ce véhicule n'est pas encore pointé comme sorti.", placement: 'bottomRight' }); return }
          setConfirm({
            msg: <>Décocher le pointage de sortie de ce véhicule ?<br /><small style={{ color: '#64748B' }}>Il sera considéré comme non sorti.</small></>,
            cb: () => { v.recyclerPlaque = false; setSelectedRef(null); setConfirm(null); notification.success({ message: '✅ Véhicule remis en NON Sortie', placement: 'bottomRight' }) }
          })
        }} style={{
          width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
          border: '1px solid #FED7AA', background: '#FFF7ED', color: '#C2410C', fontWeight: 700,
        }}>NON Sortie 🔶</button>

        {/* Fermer */}
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#475569', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>✕ Fermer</button>
      </div>

      {/* ── Overlays ─────────────────────────────────────────────── */}
      {alert && <WinAlert message={alert} onClose={() => setAlert(null)} />}
      {confirm && <WinConfirm message={confirm.msg} onOui={confirm.cb} onNon={() => setConfirm(null)} />}
      {editionType && (
        <EditionDocsModal type={editionType} onClose={() => setEditionType(null)}
          onPrint={(doc, prev) => {
            setEditionType(null)
            notification.info({ message: `🖨 ${prev ? 'Prévisualisation' : 'Impression'} : ${doc}`, placement: 'bottomRight' })
          }} />
      )}

      {/* ── Aperçu avant impression — fidèle au prototype (m-liste-print), fenêtre déplaçable/redimensionnable (Règle 17) ── */}
      {printOpen && (
        <DraggableWindow
          title="Aperçu avant impression — Liste des Véhicules"
          icon="🖨"
          width={900}
          onClose={() => setPrintOpen(false)}
        >
            {/* Barre outils impression */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
              background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
            }}>
              <button onClick={() => window.print()} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 16px',
                fontSize: 12, fontWeight: 700, background: '#2563EB', color: '#fff',
                border: 'none', borderRadius: 5, cursor: 'pointer',
              }}>🖨 Lancer l&apos;impression</button>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>|</span>
              <span style={{ fontSize: 11, color: '#475569' }}>A4 Paysage</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setPrintOpen(false)} style={{
                padding: '4px 14px', fontSize: 11.5, background: '#fff', color: '#374151',
                border: '1px solid #D1D5DB', borderRadius: 5, cursor: 'pointer',
              }}>Fermer</button>
            </div>

            {/* Zone rapport */}
            <div style={{ flex: 1, overflow: 'auto', background: '#E5E7EB', padding: 20 }}>
              <div style={{
                background: '#fff', width: '100%', minHeight: 500,
                padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              }}>
                {/* Titre rapport — encadré */}
                <div style={{
                  textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1E293B',
                  background: '#F1F5F9', border: '1px solid #CBD5E1',
                  padding: '8px 16px', marginBottom: 16,
                }}>
                  Liste des véhicules enregistrés pour la période du : {dayjs(appliedFrom).format('DD/MM/YYYY')} &nbsp;au&nbsp; {dayjs(appliedTo).format('DD/MM/YYYY')}
                </div>

                {/* Table rapport — en-tête navy */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
                  <thead>
                    <tr style={{ background: '#1B3A6B', color: '#fff' }}>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Ref</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Nom et prénom</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Adresse</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Code</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Immatriculation</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Marque et modèle</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>N° Chassis</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap', textAlign: 'center' }}>N° de Tri</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Parc</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap', textAlign: 'center' }}>Date</th>
                      <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap', textAlign: 'center' }}>Sortie le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v, i) => {
                      const bg = DEST_COLORS[v.destination] ?? '#6B7280'
                      return (
                        <tr key={v.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFF' }}>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0' }}>{v.ref}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontWeight: 500 }}>{v.nomAcheteur || '—'}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0' }}>{v.paysResidence || '—'}</td>
                          <td style={{
                            padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center',
                            fontWeight: 700, color: destTxt(bg), background: bg,
                          }}>{v.destination}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontWeight: 700 }}>{v.immat}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0' }}>{v.marqueModele}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontFamily: "'Courier New', monospace", fontSize: 9.5 }}>{v.chassis}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>{String(10000 + v.id).padStart(6, '0')}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontSize: 9.5 }}>{v.parc || ''}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#94A3B8' }}>
                            {v.recyclerPlaque ? dayjs(v.date).add(1, 'day').format('DD/MM/YYYY') : '__/__'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pied de rapport */}
                <div style={{ marginTop: 14, fontSize: 11, color: '#1E293B', display: 'flex', gap: 40 }}>
                  <span>Nombre de véhicules &nbsp; <strong>{filtered.length}</strong></span>
                  <span>Nombre de véhicules sorties : &nbsp; <strong>{sorties}</strong></span>
                </div>
              </div>
            </div>
        </DraggableWindow>
      )}
    </div>
  )
}
