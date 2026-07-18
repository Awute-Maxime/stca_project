import { useState, useMemo, type ReactNode } from 'react'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useVehicules, removeVehicule } from '@mock/vehiculesStore'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { WinAlert, WinConfirm, EditionDocsModal } from '@components/WinDialogs'
import { CarteGrisePrintDirect, type CarteGriseData } from '@components/documents/CarteGrise'
import { FacturePrintDirect, type FactureData } from '@components/documents/Facture'
import { FicheIdPrintDirect, type FicheIdData } from '@components/documents/FicheId'
import { Feuillet3PrintDirect, type Feuillet3Data } from '@components/documents/Feuillet3'
import { docsPourChoix, cgDataDe, factureDataDe, ficheIdDataDe, feuillet3DataDe, ouvrirApercuDoc } from '@components/documents/editionHelpers'

const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}

interface Props {
  mode: 'immat' | 'chassis'
}

export default function RechercheWindow({ mode }: Props): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [frFilter, setFrFilter] = useState('')
  const [selectedRef, setSelectedRef] = useState<string | null>(null)
  const [hoveredRef, setHoveredRef] = useState<string | null>(null)
  const [alert, setAlert] = useState<ReactNode | null>(null)
  const [confirm, setConfirm] = useState<{ msg: ReactNode; cb: () => void } | null>(null)
  const [editionType, setEditionType] = useState<'duplicata' | 'renouvel' | null>(null)
  // Impression directe séquentielle (sans aperçu) — un document à la fois
  const [directQueue, setDirectQueue] = useState<Array<'facture' | 'cg' | 'ficheId' | 'feuillet3'>>([])
  const [directCg, setDirectCg] = useState<CarteGriseData | null>(null)
  const [directFacture, setDirectFacture] = useState<FactureData | null>(null)
  const [directFicheId, setDirectFicheId] = useState<FicheIdData | null>(null)
  const [directFeuillet3, setDirectFeuillet3] = useState<Feuillet3Data | null>(null)

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

  const checkSel = (): boolean => {
    if (selectedRef) return true
    const hasRows = searched && filtered.length > 0
    const msg = hasRows
      ? <>Veuillez sélectionner un enregistrement<br />dans la liste avant d&apos;effectuer cette opération.</>
      : <>Aucun enregistrement affiché.<br />Entrez un {isImmat ? "numéro d'immatriculation" : 'N° de châssis'} et cliquez sur <strong>Rechercher</strong>,<br />puis choisissez un enregistrement.</>
    setAlert(msg)
    return false
  }

  const isImmat = mode === 'immat'
  const label = isImmat ? 'N° Immatriculation' : 'N° Chassis (VIN)'
  const placeholder = isImmat ? 'ex: A2050' : 'ex: WDB9636032L487321'
  const emptyMsg = isImmat
    ? "Entrez un numéro d'immatriculation et cliquez sur Rechercher"
    : 'Entrez un numéro de châssis (VIN) et cliquez sur Rechercher'

  const results = useMemo(() => {
    if (!searched || !query) return []
    const q = query.toUpperCase()
    return vehicules.filter(v =>
      isImmat ? v.immat.toUpperCase().includes(q) : v.chassis.toUpperCase().includes(q)
    )
  }, [vehicules, searched, query, isImmat])

  const filtered = useMemo(() => {
    if (!frFilter) return results
    return results.filter(v => v.destination === frFilter.toUpperCase())
  }, [results, frFilter])

  const doSearch = (): void => {
    if (!query.trim()) {
      notification.warning({ message: isImmat ? "Veuillez entrer un numéro d'immatriculation." : 'Veuillez entrer un numéro de châssis (VIN).', placement: 'bottomRight' })
      return
    }
    setSearched(true)
    setSelectedRef(null)
  }

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Barre recherche */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
          background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0, flexWrap: 'wrap',
        }}>
          <label style={{ fontSize: 11.5, color: '#374151', whiteSpace: 'nowrap' }}>{label} :</label>
          <input className="light-input" value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
            placeholder={placeholder}
            style={{
              padding: '3px 5px', fontSize: 11, width: isImmat ? 120 : 180, height: 26,
              textTransform: 'uppercase',
              fontFamily: isImmat ? undefined : "'Courier New', monospace",
            }} />
          <button onClick={doSearch} style={{
            height: 32, padding: '0 12px', background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>🔍 Rechercher</button>
        </div>

        {/* Table — colonnes conformes au vrai STCA II */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse', fontSize: 11 }}>
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
                <th style={thStyle}>Nom de l&apos;utilisateur ↕</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>{emptyMsg}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontStyle: 'italic' }}>Aucun véhicule trouvé</td></tr>
              ) : filtered.map(v => {
                const bg = DEST_COLORS[v.destination] ?? '#6B7280'
                const isSel = selectedRef === v.ref
                const isHov = hoveredRef === v.ref
                const bbc = isSel ? '#BFDBFE' : '#F1F5F9'
                const rowBg = isSel ? '#EFF6FF' : (isHov ? '#F8FAFF' : undefined)
                return (
                  <tr key={v.id} onClick={() => setSelectedRef(v.ref)}
                    onMouseEnter={() => setHoveredRef(v.ref)}
                    onMouseLeave={() => setHoveredRef(null)}
                    style={{ cursor: 'pointer', background: rowBg }}
                  >
                    <td style={{ ...tdStyle, color: '#64748B', borderBottomColor: bbc }}>{v.ref}</td>
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
                    <td style={{ ...tdStyle, color: '#475569', borderBottomColor: bbc }}>{v.agent}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Barre statut */}
        <div style={{ padding: '4px 10px', background: '#FFFEF0', borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#475569', flexShrink: 0 }}>
          Nbr de Véhicule(s) : {filtered.length}
        </div>
      </div>

      {/* Panneau actions droit */}
      <div style={{
        width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5,
        padding: '7px 6px', background: '#F8FAFF', borderLeft: '1px solid #E2E8F0', overflowY: 'auto',
      }}>
        <button onClick={() => { if (checkSel()) setEditionType('duplicata') }}
          style={{
            width: '100%', padding: '7px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, lineHeight: 1.4,
          }}>🖨 Rééditer un<br />DUPLICATA</button>

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
            from: decodeURIComponent(location.hash.replace('#/mdi/', '')) || (isImmat ? 'rechercheImmat' : 'rechercheChassis'),
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

        <button onClick={() => {
          if (!checkSel()) return
          setConfirm({ msg: 'Voulez-vous supprimer cet enregistrement ?', cb: () => {
            if (selectedRef) removeVehicule(selectedRef) // suppression réelle — synchro toutes fenêtres
            setSelectedRef(null); setSearched(true); setConfirm(null)
            notification.success({ message: '✅ Enregistrement supprimé', placement: 'bottomRight' })
          }})
        }}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>⊖ Supprimer</button>

        <button onClick={() => { if (checkSel()) setEditionType('renouvel') }}
          style={{
            width: '100%', padding: '7px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, lineHeight: 1.4,
          }}>🖨 Rééditer un<br />Renouvellem.</button>

        <fieldset style={{ border: '1px solid #E2E8F0', borderRadius: 5, padding: '6px 8px', background: '#fff', marginTop: 2, margin: 0 }}>
          <legend style={{ fontSize: 10.5, fontWeight: 600, color: '#374151', padding: '0 3px' }}>Filtrage Frontière</legend>
          <input type="text" className="light-input" placeholder="ex: AFO" value={frFilter}
            onChange={e => setFrFilter(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '3px 5px', fontSize: 11, textTransform: 'uppercase', height: 26 }} />
        </fieldset>

        <div style={{ flex: 1 }} />

        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 600,
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
              // Réédition — mêmes chemins que l'Enregistrement :
              // Prévisualiser coché → aperçus rapides + impressions auto (BrowserWindows) ;
              // décoché → impression directe séquentielle sans aperçu.
              if (prev) {
                const ts = Date.now()
                docs.forEach(d => ouvrirApercuDoc(d, v, true, ts, editionType === 'duplicata' ? 'DUPLICATA' : ''))
              } else {
                setDirectCg(docs.includes('cg') ? cgDataDe(v) : null)
                setDirectFacture(docs.includes('facture') ? factureDataDe(v) : null)
                setDirectFicheId(docs.includes('ficheId') ? ficheIdDataDe(v) : null)
                setDirectFeuillet3(docs.includes('feuillet3') ? feuillet3DataDe(v, editionType === 'duplicata' ? 'DUPLICATA' : '') : null)
                setDirectQueue(docs)
              }
              return
            }
            notification.info({ message: `🖨 ${prev ? 'Prévisualisation' : 'Impression'} : ${doc}`, placement: 'bottomRight' })
          }} />
      )}
      {/* Impression directe séquentielle (facture puis carte grise) */}
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
    </div>
  )
}
