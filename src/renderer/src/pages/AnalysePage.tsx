import { useDestColors } from '@mock/destinationsStore'
import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useVehicules } from '@mock/vehiculesStore'
import DraggableWindow from '@components/DraggableWindow'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'

/* ── FR locale helpers ──────────────────────────────────────────────── */
const FR_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function frDayName(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : FR_DAYS[d.getDay()]
}

/* ── Period preset logic ────────────────────────────────────────────── */
function anlApplyPeriod(preset: string): { from: string; to: string } {
  const now = dayjs()
  switch (preset) {
    case 'today':
      return { from: now.format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    case 'yesterday': {
      const y = now.subtract(1, 'day')
      return { from: y.format('YYYY-MM-DD'), to: y.format('YYYY-MM-DD') }
    }
    case 'week_cur': {
      const monday = now.day() === 0 ? now.subtract(6, 'day') : now.day(1)
      const sunday = monday.add(6, 'day')
      return { from: monday.format('YYYY-MM-DD'), to: sunday.format('YYYY-MM-DD') }
    }
    case 'week_float': {
      return { from: now.subtract(6, 'day').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    }
    case 'week_prev': {
      const thisMon = now.day() === 0 ? now.subtract(6, 'day') : now.day(1)
      const prevMon = thisMon.subtract(7, 'day')
      const prevSun = prevMon.add(6, 'day')
      return { from: prevMon.format('YYYY-MM-DD'), to: prevSun.format('YYYY-MM-DD') }
    }
    case 'month_cur': {
      return { from: now.startOf('month').format('YYYY-MM-DD'), to: now.endOf('month').format('YYYY-MM-DD') }
    }
    case 'month_float': {
      return { from: now.subtract(29, 'day').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    }
    case 'month_prev': {
      const prev = now.subtract(1, 'month')
      return { from: prev.startOf('month').format('YYYY-MM-DD'), to: prev.endOf('month').format('YYYY-MM-DD') }
    }
    case 'year_cur': {
      return { from: now.startOf('year').format('YYYY-MM-DD'), to: now.endOf('year').format('YYYY-MM-DD') }
    }
    case 'year_float': {
      return { from: now.subtract(364, 'day').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    }
    case 'year_prev': {
      const prev = now.subtract(1, 'year')
      return { from: prev.startOf('year').format('YYYY-MM-DD'), to: prev.endOf('year').format('YYYY-MM-DD') }
    }
    default:
      return { from: now.format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
  }
}

/* ── Couleurs destination — palette exacte du prototype (ligne 919) ── */
// DEST_COLORS lu depuis destinationsStore (couleur de plaque éditable, source unique)
function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}

/* ── Random Police Number ───────────────────────────────────────────── */
function randomPolice(seed: number): string {
  const n = 100000 + ((seed * 7919) % 900000)
  return `POL-${n}`
}

/* ── Types ──────────────────────────────────────────────────────────── */
type Step = 'password' | 'sector' | 'tcit_config' | 'assurance'
type TcitTab = 'detail' | 'resume' | 'annual'
type GroupBy = 'jour' | 'mois' | 'destination'
type ReportSource = 'tcit_detail' | 'tcit_resume' | 'tcit_annual' | 'assurance'

/* ================================================================== */
/*  AnalysePage — Multi-step modal flow                                */
/* ================================================================== */
export default function AnalysePage({ onClose }: { onClose: () => void }): JSX.Element {
  const DEST_COLORS = useDestColors()
  const vehicules = useVehicules() // store partagé — synchro auto
  const todayISO = dayjs().format('YYYY-MM-DD')

  /* ── Step navigation state ──────────────────────────────────────── */
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')

  /* ── TCIT config state ──────────────────────────────────────────── */
  const [tcitTab, setTcitTab] = useState<TcitTab>('detail')
  const [dateFrom, setDateFrom] = useState(todayISO)
  const [dateTo, setDateTo] = useState(todayISO)
  const [periodPreset, setPeriodPreset] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('jour')

  /* ── Assurance state ────────────────────────────────────────────── */
  const [assurFrom, setAssurFrom] = useState(todayISO)
  const [assurTo, setAssurTo] = useState(todayISO)
  const [assurType, setAssurType] = useState('all')

  /* ── Close window ───────────────────────────────────────────────── */
  const closeWindow = (): void => {
    onClose()
  }

  /* ── Period preset handler ──────────────────────────────────────── */
  const handlePeriodPreset = (val: string): void => {
    setPeriodPreset(val)
    if (val) {
      const { from, to } = anlApplyPeriod(val)
      setDateFrom(from)
      setDateTo(to)
    }
  }

  /* ── Filtered data for assurance ────────────────────────────────── */
  const assurFiltered = useMemo(() => {
    return vehicules.filter(v => {
      const vDate = v.date.substring(0, 10)
      return vDate >= assurFrom && vDate <= assurTo
    })
  }, [vehicules, assurFrom, assurTo])

  /* ── Total gain assurance ───────────────────────────────────────── */
  const assurGainTotal = assurFiltered.length * 2264

  /* ── Handle password submit ─────────────────────────────────────── */
  const handlePasswordOk = (): void => {
    setStep('sector')
  }

  /* ── Aperçu avant impression — BrowserWindow propre (Règle 10) ──── */
  const openPrint = (source: ReportSource): void => {
    const isAssur = source === 'assurance'
    localStorage.setItem('tcit_apercu_analyse', JSON.stringify({
      reportSource: source,
      dateFrom: isAssur ? assurFrom : dateFrom,
      dateTo: isAssur ? assurTo : dateTo,
      groupBy,
    }))
    const cfg = WINDOW_REGISTRY['apercu.analyse']
    if (cfg) electronApi.mdiOpen({ id: 'apercu.analyse', x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  CSS Constants (from prototype)                                    */
  /* ────────────────────────────────────────────────────────────────── */
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const mb2: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
    animation: 'formEnter 0.2s ease',
  }
  const mh: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '14px 20px',
    background: '#1B3A6B', borderRadius: '10px 10px 0 0', color: '#fff',
    fontSize: 13, fontWeight: 700,
  }
  const mhc: React.CSSProperties = {
    width: 26, height: 26, background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.6)', fontSize: 17, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 4, transition: 'all 0.15s',
  }
  const mft: React.CSSProperties = {
    padding: '12px 20px', borderTop: '1px solid #E2E8F0',
    background: '#F8FAFF', borderRadius: '0 0 10px 10px',
    display: 'flex', justifyContent: 'flex-end', gap: 8,
  }
  const be: React.CSSProperties = {
    height: 32, padding: '0 22px', background: '#2563EB', color: '#fff',
    border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  }
  const bc: React.CSSProperties = {
    height: 34, padding: '0 16px', background: '#fff', color: '#374151',
    border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
  }
  const bs: React.CSSProperties = {
    height: 32, padding: '0 16px', background: '#F8FAFF', color: '#64748B',
    border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
  }
  const fi: React.CSSProperties = {
    height: 26, border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 13,
    width: 110, padding: '0 6px', outline: 'none',
  }

  /* ── Close button hover helpers ─────────────────────────────────── */
  const closeHoverIn = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
    e.currentTarget.style.color = '#fff'
  }
  const closeHoverOut = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.background = 'none'
    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ============================================================ */}
      {/*  Step 1: Password                                            */}
      {/* ============================================================ */}
      {step === 'password' && (
        <div style={overlayStyle}>
          <div style={{ ...mb2, width: 450, padding: 0 }}>
            {/* Titlebar — prototype exact */}
            <div style={mh}>
              <span style={{ fontSize: 12, marginRight: 8 }}>🔒</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Saisie du mot de passe de Configuration</span>
              <button style={mhc} onClick={closeWindow}
                onMouseEnter={closeHoverIn} onMouseLeave={closeHoverOut}>✕</button>
            </div>

            {/* Body — prototype: padding 20px 24px */}
            <div style={{ padding: '20px 24px' }}>
              {/* Inner card — prototype exact */}
              <div style={{
                border: '1px solid #E2E8F0', background: '#F8FAFF',
                borderRadius: 6, padding: '14px 16px', marginBottom: 16,
              }}>
                <p style={{ color: '#DC2626', fontSize: 11.5, margin: '0 0 14px', lineHeight: 1.5 }}>
                  Donnez le mot de passe de forçage pour accéder aux fonctions d&apos;Administrateur de TCIT.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11.5, whiteSpace: 'nowrap', color: '#374151' }}>» Mot de passe Admin. :</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePasswordOk() }}
                    style={{ ...fi, width: 110, padding: '4px 8px', fontSize: 13 }}
                    autoFocus
                  />
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 16px', background: '#2563EB', color: '#fff',
                    border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }} onClick={handlePasswordOk}>OK ✔</button>
                </div>
              </div>

              {/* USB section — prototype: text-align center, border-top */}
              <div style={{ textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 26, lineHeight: 1 }}>⚠️</span>
                  <span style={{ fontSize: 11.5, color: '#92400E' }}>Ou déverrouiller par la clé USB :</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
                    background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
                    borderRadius: 5, fontSize: 12, cursor: 'pointer',
                  }}>⚡ Lire Clé USB</button>
                  <button style={bc} onClick={closeWindow}>Annuler</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Step 2: Sector Choice                                       */}
      {/* ============================================================ */}
      {step === 'sector' && (
        <div style={overlayStyle}>
          <div style={{ ...mb2, width: 380, maxWidth: '95vw' }}>
            <div style={mh}>
              <span style={{ fontSize: 12, marginRight: 8 }}>📊</span>
              <span style={{ flex: 1 }}>Analyse</span>
              <button style={mhc} onClick={closeWindow}
                onMouseEnter={closeHoverIn} onMouseLeave={closeHoverOut}>✕</button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 28 }}>&#8505;&#65039;</span>
                <span style={{ fontSize: 12.5, color: '#1E293B' }}>
                  Veuillez choisir un secteur à analyser
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={be} onClick={() => setStep('tcit_config')}>TCIT</button>
                <button style={{
                  height: 32, padding: '0 22px', background: '#fff', color: '#374151',
                  border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                }} onClick={() => setStep('assurance')}>ASSURANCE</button>
                <button style={bc} onClick={closeWindow}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Step 3a: TCIT Reports Config                                */}
      {/* ============================================================ */}
      {step === 'tcit_config' && (
        <div style={overlayStyle}>
          <div style={{ ...mb2, width: 540, maxWidth: '95vw' }}>
            {/* Titlebar */}
            <div style={mh}>
              <span style={{ fontSize: 12, marginRight: 8 }}>📊</span>
              <span style={{ flex: 1 }}>Rapports d&apos;analyse — TCIT</span>
              <button style={mhc} onClick={() => setStep('sector')}
                onMouseEnter={closeHoverIn} onMouseLeave={closeHoverOut}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 20px',
              background: '#fff',
            }}>
              {([
                { key: 'detail' as TcitTab, label: 'Rapports détaillés' },
                { key: 'resume' as TcitTab, label: 'Rapports résumés' },
                { key: 'annual' as TcitTab, label: 'Rapport annuel' },
              ]).map(t => (
                <button key={t.key} onClick={() => setTcitTab(t.key)} style={{
                  padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12,
                  color: tcitTab === t.key ? '#2563EB' : '#64748B',
                  fontWeight: tcitTab === t.key ? 700 : 400,
                  borderBottom: tcitTab === t.key ? '3px solid #2563EB' : '3px solid transparent',
                }}>{t.label}</button>
              ))}
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px' }}>
              {/* Date fields */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Date de début
                  </label>
                  <input type="date" value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setPeriodPreset('') }}
                    style={{ ...fi, width: 130 }} />
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                    {frDayName(dateFrom)}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Date de fin
                  </label>
                  <input type="date" value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setPeriodPreset('') }}
                    style={{ ...fi, width: 130 }} />
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                    {frDayName(dateTo)}
                  </div>
                </div>
              </div>

              {/* Period preset */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Période prédéfinie
                </label>
                <select value={periodPreset} onChange={e => handlePeriodPreset(e.target.value)}
                  style={{ ...fi, width: 220 }}>
                  <option value="">— Choisir —</option>
                  <option value="today">Aujourd&apos;hui</option>
                  <option value="yesterday">Hier</option>
                  <option value="week_cur">Semaine en cours</option>
                  <option value="week_float">Semaine flottante</option>
                  <option value="week_prev">Semaine précédente</option>
                  <option value="month_cur">Mois en cours</option>
                  <option value="month_float">Mois flottant</option>
                  <option value="month_prev">Mois précédent</option>
                  <option value="year_cur">Année en cours</option>
                  <option value="year_float">Année flottante</option>
                  <option value="year_prev">Année précédente</option>
                </select>
              </div>

              {/* GroupBy fieldset — hidden for annual */}
              {tcitTab !== 'annual' && (
                <fieldset style={{
                  border: '1px solid #E2E8F0', borderRadius: 6, padding: '10px 14px',
                  marginBottom: 14,
                }}>
                  <legend style={{ fontSize: 11, color: '#64748B', fontWeight: 600, padding: '0 6px' }}>
                    Totaliser les montants par
                  </legend>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {([
                      { v: 'jour' as GroupBy, l: 'Jour' },
                      { v: 'mois' as GroupBy, l: 'Mois' },
                      { v: 'destination' as GroupBy, l: 'Destination' },
                    ]).map(r => (
                      <label key={r.v} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, color: '#1E293B', cursor: 'pointer',
                      }}>
                        <input type="radio" name="anl-groupby"
                          checked={groupBy === r.v}
                          onChange={() => setGroupBy(r.v)}
                          style={{ accentColor: '#2563EB' }} />
                        {r.l}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>

            {/* Footer */}
            <div style={mft}>
              <button style={bc} onClick={() => setStep('sector')}>Quitter</button>
              <button style={be} onClick={() => {
                if (tcitTab === 'detail') openPrint('tcit_detail')
                else if (tcitTab === 'resume') openPrint('tcit_resume')
                else openPrint('tcit_annual')
              }}>&#128424; Imprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Step 3b: Assurance Gain                                     */}
      {/* ============================================================ */}
      {step === 'assurance' && (
        <DraggableWindow
          title="Gain généré par les assurances"
          icon="💰"
          width={960}
          onClose={() => setStep('sector')}
        >
            {/* Filters bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              borderBottom: '1px solid #E2E8F0', background: '#F8FAFF', flexShrink: 0,
            }}>
              <input type="date" value={assurFrom}
                onChange={e => setAssurFrom(e.target.value)}
                style={{ ...fi, width: 130 }} />
              <input type="date" value={assurTo}
                onChange={e => setAssurTo(e.target.value)}
                style={{ ...fi, width: 130 }} />
              <button style={{
                ...be, height: 26, padding: '0 12px', fontSize: 11,
              }}>&#128269; Rechercher</button>
              <select value={assurType} onChange={e => setAssurType(e.target.value)}
                style={{ ...fi, width: 200 }}>
                <option value="all">Tous les types</option>
                <option value="POOL TPV VT - MOTO">POOL TPV VT - MOTO</option>
                <option value="POOL TPV VT - AUTO">POOL TPV VT - AUTO</option>
              </select>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button style={be} onClick={() => openPrint('assurance')}>&#128424; Imprimer</button>
                <button style={bc} onClick={() => setStep('sector')}>Quitter</button>
              </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#1B3A6B', color: '#fff' }}>
                    {['Réf', 'Nom', 'Transit/Pays', 'Type', 'Marque et modèle', 'N° Chassis', 'Immatriculation', 'Destination', 'N° Police'].map(h => (
                      <th key={h} style={{
                        padding: '8px 10px', fontSize: 11, fontWeight: 700,
                        textAlign: 'left', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assurFiltered.map((v, i) => (
                    <tr key={v.id} style={{
                      background: i % 2 === 0 ? '#fff' : '#F8FAFF',
                      borderBottom: '1px solid #F1F5F9',
                    }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: '#2563EB' }}>{v.ref}</td>
                      <td style={{ padding: '6px 10px', color: '#1E293B' }}>{v.nomAcheteur}</td>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>{v.paysDestination}</td>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>{v.typeVehicule}</td>
                      <td style={{ padding: '6px 10px', color: '#1E293B' }}>{v.marqueModele}</td>
                      <td style={{ padding: '6px 10px', color: '#64748B', fontFamily: 'monospace', fontSize: 10 }}>{v.chassis}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#1B3A6B' }}>{v.immat}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                          color: destTxt(DEST_COLORS[v.destination] ?? '#6B7280'),
                          background: DEST_COLORS[v.destination] ?? '#6B7280',
                        }}>{v.destination}</span>
                      </td>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>{randomPolice(v.id)}</td>
                    </tr>
                  ))}
                  {assurFiltered.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>
                        Aucun véhicule pour cette période
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer totals */}
            <div style={{
              ...mft, justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12 }}>
                <span style={{ color: '#374151', fontWeight: 600 }}>Nbr de Véhicule(s) : </span>
                <span style={{ color: '#DC2626', fontWeight: 700 }}>{assurFiltered.length}</span>
              </span>
              <span style={{ fontSize: 12 }}>
                <span style={{ color: '#374151', fontWeight: 600 }}>Gain Total : </span>
                <span style={{ color: '#DC2626', fontWeight: 700 }}>
                  {assurGainTotal.toLocaleString('fr-FR')} FCFA
                </span>
              </span>
            </div>
        </DraggableWindow>
      )}
    </div>
  )
}
