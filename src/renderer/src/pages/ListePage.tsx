import { useState, useMemo, type ReactNode } from 'react'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useVehicules, updateVehicule, removeVehicule } from '@mock/vehiculesStore'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { WinAlert, WinConfirm, EditionDocsModal } from '@components/WinDialogs'
import { CarteGrisePrintDirect, type CarteGriseData } from '@components/documents/CarteGrise'
import { FacturePrintDirect, type FactureData } from '@components/documents/Facture'
import { FicheIdPrintDirect, type FicheIdData } from '@components/documents/FicheId'
import { Feuillet3PrintDirect, type Feuillet3Data } from '@components/documents/Feuillet3'
import { Feuillet1PrintDirect, type Feuillet1Data } from '@components/documents/Feuillet1'
import { Feuillet2PrintDirect, type Feuillet2Data } from '@components/documents/Feuillet2'
import { docsPourChoix, cgDataDe, factureDataDe, ficheIdDataDe, feuillet1DataDe, feuillet2DataDe, feuillet3DataDe, ouvrirApercuDoc, type DocImp } from '@components/documents/editionHelpers'

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
  // Impression directe séquentielle (sans aperçu) — un document à la fois
  const [directQueue, setDirectQueue] = useState<DocImp[]>([])
  const [directCg, setDirectCg] = useState<CarteGriseData | null>(null)
  const [directFacture, setDirectFacture] = useState<FactureData | null>(null)
  const [directFicheId, setDirectFicheId] = useState<FicheIdData | null>(null)
  const [directFeuillet3, setDirectFeuillet3] = useState<Feuillet3Data | null>(null)
  const [directFeuillet1, setDirectFeuillet1] = useState<Feuillet1Data | null>(null)
  const [directFeuillet2, setDirectFeuillet2] = useState<Feuillet2Data | null>(null)

  const avancerDirect = (): void => {
    setDirectQueue(q => {
      const reste = q.slice(1)
      if (reste.length === 0) {
        notification.success({
          message: '🖨 Document(s) envoyé(s) à l\'impression',
          placement: 'bottomRight',
        })
      }
      return reste
    })
  }

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
                      {v.numTri || String(10000 + v.id).padStart(6, '0')}
                    </td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{v.parc || '—'}</td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{dayjs(v.dateTri || v.date).format('DD/MM/YYYY')}</td>
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
            numTri: v.numTri, dateTri: v.dateTri,
            // Fenêtre d'origine — rouverte automatiquement après validation de la modification
            from: decodeURIComponent(location.hash.replace('#/mdi/', '')) || 'listeVehicules',
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

        {/* Imprimer — ouvre l'aperçu dans sa PROPRE BrowserWindow (Règle 10 : fenêtre libre, pas emprisonnée) */}
        <button onClick={() => {
          if (filtered.length === 0) { setAlert(<>Aucun enregistrement à imprimer.<br />Sélectionnez une période et cliquez sur <strong>Rechercher</strong>.</>); return }
          localStorage.setItem('tcit_apercu_liste', JSON.stringify({ from: appliedFrom, to: appliedTo, pointage, frFilter }))
          const cfg = WINDOW_REGISTRY['apercu.listeVehicules']
          if (cfg) electronApi.mdiOpen({ id: 'apercu.listeVehicules', x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
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
            if (selectedRef) removeVehicule(selectedRef) // suppression réelle — synchro toutes fenêtres
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
            cb: () => { updateVehicule(v.ref, { recyclerPlaque: false }); setSelectedRef(null); setConfirm(null); notification.success({ message: '✅ Véhicule remis en NON Sortie', placement: 'bottomRight' }) }
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
          onApercu={(doc) => {
            // Consultation : ouvre chaque document dans sa fenêtre (modal reste ouvert)
            const v = filtered.find(x => x.ref === selectedRef)
            const docs = docsPourChoix(doc)
            if (!v || docs.length === 0) {
              notification.info({ message: 'Document non encore implémenté', placement: 'bottomRight' })
              return
            }
            const ts = Date.now()
            docs.forEach(d => ouvrirApercuDoc(d, v, false, ts, editionType === 'duplicata' ? 'DUPLICATA' : ''))
          }}
          onPrint={(doc, prev) => {
            setEditionType(null)
            const v = filtered.find(x => x.ref === selectedRef)
            const docs = docsPourChoix(doc)
            if (v && docs.length > 0) {
              if (prev) {
                // Prévisualiser : aperçus rapides + impressions lancées (auto)
                const ts = Date.now()
                docs.forEach(d => ouvrirApercuDoc(d, v, true, ts, editionType === 'duplicata' ? 'DUPLICATA' : ''))
              } else {
                // Impression directe séquentielle sans aperçu
                setDirectCg(docs.includes('cg') ? cgDataDe(v) : null)
                setDirectFacture(docs.includes('facture') ? factureDataDe(v) : null)
                setDirectFicheId(docs.includes('ficheId') ? ficheIdDataDe(v) : null)
                setDirectFeuillet3(docs.includes('feuillet3') ? feuillet3DataDe(v, editionType === 'duplicata' ? 'DUPLICATA' : '') : null)
                setDirectFeuillet1(docs.includes('feuillet1') ? feuillet1DataDe(v) : null)
                setDirectFeuillet2(docs.includes('feuillet2') ? feuillet2DataDe(v) : null)
                setDirectQueue(docs)
              }
              return
            }
            notification.info({ message: `🖨 ${prev ? 'Prévisualisation' : 'Impression'} : ${doc}`, placement: 'bottomRight' })
          }} />
      )}
      {/* Impression directe séquentielle (facture, carte grise, puis fiche ID) */}
      {directQueue[0] === 'facture' && directFacture && (
        <FacturePrintDirect data={directFacture} onDone={avancerDirect} />
      )}
      {directQueue[0] === 'cg' && directCg && (
        <CarteGrisePrintDirect data={directCg} onDone={avancerDirect} />
      )}
      {directQueue[0] === 'ficheId' && directFicheId && (
        <FicheIdPrintDirect data={directFicheId} onDone={avancerDirect} />
      )}
      {directQueue[0] === 'feuillet3' && directFeuillet3 && (
        <Feuillet3PrintDirect data={directFeuillet3} onDone={avancerDirect} />
      )}
      {directQueue[0] === 'feuillet1' && directFeuillet1 && (
        <Feuillet1PrintDirect data={directFeuillet1} onDone={avancerDirect} />
      )}
      {directQueue[0] === 'feuillet2' && directFeuillet2 && (
        <Feuillet2PrintDirect data={directFeuillet2} onDone={avancerDirect} />
      )}

    </div>
  )
}
