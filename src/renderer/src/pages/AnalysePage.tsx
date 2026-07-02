import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { type MockVehicule } from '@mock/vehicules'
import { useVehicules } from '@mock/vehiculesStore'
import { mockDestinations } from '@mock/destinations'
import DraggableWindow from '@components/DraggableWindow'

/* ── FR locale helpers ──────────────────────────────────────────────── */
const FR_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const FR_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function frDayName(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : FR_DAYS[d.getDay()]
}

function fmtDateFR(iso: string): string {
  return iso ? dayjs(iso).format('DD/MM/YYYY') : ''
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
const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}

/* ── Destination label helper ───────────────────────────────────────── */
function destLabel(code: string): string {
  return mockDestinations.find(d => d.code === code)?.nom ?? code
}

/* ── Random Police Number ───────────────────────────────────────────── */
function randomPolice(seed: number): string {
  const n = 100000 + ((seed * 7919) % 900000)
  return `POL-${n}`
}

/* ── Types ──────────────────────────────────────────────────────────── */
type Step = 'password' | 'sector' | 'tcit_config' | 'assurance' | 'print_preview'
type TcitTab = 'detail' | 'resume' | 'annual'
type GroupBy = 'jour' | 'mois' | 'destination'
type ReportSource = 'tcit_detail' | 'tcit_resume' | 'tcit_annual' | 'assurance'

/* ================================================================== */
/*  AnalysePage — Multi-step modal flow                                */
/* ================================================================== */
export default function AnalysePage({ onClose }: { onClose: () => void }): JSX.Element {
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

  /* ── Print preview state ────────────────────────────────────────── */
  const [reportSource, setReportSource] = useState<ReportSource>('tcit_detail')

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

  /* ── Filtered data for TCIT reports ─────────────────────────────── */
  const tcitFiltered = useMemo(() => {
    return vehicules.filter(v => {
      const vDate = v.date.substring(0, 10)
      return vDate >= dateFrom && vDate <= dateTo
    })
  }, [vehicules, dateFrom, dateTo])

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

  /* ── Navigate to print preview ──────────────────────────────────── */
  const openPrint = (source: ReportSource): void => {
    setReportSource(source)
    setStep('print_preview')
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

      {/* ============================================================ */}
      {/*  Step 4: Print Preview (shared)                              */}
      {/* ============================================================ */}
      {step === 'print_preview' && (
        <DraggableWindow
          title={reportSource === 'assurance'
            ? 'Gain généré par les assurances'
            : reportSource === 'tcit_detail'
              ? 'Rapport détaillé — TCIT'
              : reportSource === 'tcit_resume'
                ? 'Rapport résumé — TCIT'
                : 'Rapport annuel — TCIT'}
          icon="🖨"
          width={820}
          onClose={() => setStep(reportSource === 'assurance' ? 'assurance' : 'tcit_config')}
        >
            {/* Toolbar onglets */}
            <div style={{
              display: 'flex', alignItems: 'center', borderBottom: '1px solid #E2E8F0',
              background: '#F8FAFF', padding: '0 12px', flexShrink: 0,
            }}>
              <button style={{
                padding: '8px 16px', fontSize: 11.5, fontWeight: 700, color: '#2563EB',
                border: 'none', borderBottom: '2px solid #2563EB', background: 'none', cursor: 'pointer',
              }}>&#128065; Aperçu</button>
              <button onClick={() => window.print()} style={{
                padding: '8px 16px', fontSize: 11.5, color: '#475569',
                border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent',
              }}>&#128424; Imprimer</button>
              <button style={{
                padding: '8px 16px', fontSize: 11.5, color: '#475569',
                border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent',
              }}>&#128228; Exporter</button>
              <button style={{
                padding: '8px 16px', fontSize: 11.5, color: '#475569',
                border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent',
              }}>&#128269; Rechercher</button>
              <button style={{
                padding: '8px 16px', fontSize: 11.5, color: '#475569',
                border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent',
              }}>&#9999;&#65039; Annoter</button>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8', paddingRight: 8 }}>100 %</span>
            </div>

            {/* Printer params bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px',
              borderBottom: '1px solid #E2E8F0', background: '#fff', fontSize: 11.5, flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                border: '1px solid #CBD5E1', borderRadius: 5, minWidth: 180,
              }}>
                <span style={{ fontSize: 18 }}>&#128424;</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 11 }}>AnyDesk Printer</div>
                  <div style={{ color: '#16A34A', fontSize: 10 }}>Prêt</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="anl-color" defaultChecked style={{ accentColor: '#2563EB' }} /> Couleur
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="anl-color" style={{ accentColor: '#2563EB' }} /> Noir et blanc
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="anl-pages" defaultChecked style={{ accentColor: '#2563EB' }} /> Toutes les pages
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="anl-pages" style={{ accentColor: '#2563EB' }} /> Page courante
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#94A3B8' }}>
                  <input type="radio" name="anl-pages" disabled style={{ accentColor: '#2563EB' }} /> Pages{' '}
                  <input type="text" placeholder="1-10, 25-30, 35" disabled style={{
                    width: 110, border: '1px solid #D1D5DB', borderRadius: 3,
                    padding: '2px 5px', fontSize: 10, color: '#94A3B8',
                  }} />
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span style={{ color: '#475569' }}>Copies</span>
                <input type="number" defaultValue={1} min={1} style={{
                  width: 50, border: '1px solid #D1D5DB', borderRadius: 4,
                  padding: '3px 6px', fontSize: 12, textAlign: 'center',
                }} />
              </div>
            </div>

            {/* Corps : miniature + aperçu A4 */}
            <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', background: '#94A3B8', minHeight: 0 }}>
              {/* Miniature */}
              <div style={{ width: 110, background: '#64748B', padding: 10, flexShrink: 0, overflowY: 'auto' }}>
                <div style={{
                  background: '#fff', border: '1px solid #475569', padding: 4, marginBottom: 6,
                  cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ fontSize: 5, fontWeight: 700, textAlign: 'center', color: '#1E293B', marginBottom: 3 }}>
                    {reportSource === 'assurance' ? 'Gain assurance...' : 'Rapport TCIT...'}
                  </div>
                  <div style={{ height: 2, background: '#CBD5E1', marginBottom: 2 }} />
                  <div style={{ height: 30, background: '#F1F5F9', border: '1px solid #E2E8F0' }} />
                  <div style={{ fontSize: 5, color: '#64748B', marginTop: 2, textAlign: 'center' }}>1</div>
                </div>
              </div>

              {/* Aperçu A4 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 595, minHeight: 842, background: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)', padding: '48px 56px', fontFamily: 'Arial, sans-serif',
                }}>
                  {reportSource === 'tcit_detail' && <ReportDetail data={tcitFiltered} groupBy={groupBy} dateFrom={dateFrom} dateTo={dateTo} />}
                  {reportSource === 'tcit_resume' && <ReportResume data={tcitFiltered} groupBy={groupBy} dateFrom={dateFrom} dateTo={dateTo} />}
                  {reportSource === 'tcit_annual' && <ReportAnnual data={tcitFiltered} dateFrom={dateFrom} dateTo={dateTo} />}
                  {reportSource === 'assurance' && <ReportAssurance data={assurFiltered} dateFrom={assurFrom} dateTo={assurTo} gainTotal={assurGainTotal} />}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              ...mft, justifyContent: 'space-between',
            }}>
              <button style={bc}
                onClick={() => setStep(reportSource === 'assurance' ? 'assurance' : 'tcit_config')}>
                ✕ Fermer
              </button>
              <button style={be} onClick={() => window.print()}>
                <span style={{ fontSize: 18 }}>&#128424;</span> Lancer l&apos;impression
              </button>
            </div>
        </DraggableWindow>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Report sub-components for A4 preview                               */
/* ================================================================== */

interface ReportProps {
  data: MockVehicule[]
  dateFrom: string
  dateTo: string
}

/* ── DETAIL report ──────────────────────────────────────────────────── */
function ReportDetail({ data, groupBy, dateFrom, dateTo }: ReportProps & { groupBy: GroupBy }): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  const groupTitle = groupBy === 'jour' ? 'jour' : groupBy === 'mois' ? 'mois' : 'destination'

  /* Group data */
  const groups = useMemo(() => {
    const map = new Map<string, typeof data>()
    for (const v of data) {
      let key: string
      if (groupBy === 'jour') {
        key = dayjs(v.date).format('DD/MM/YYYY')
      } else if (groupBy === 'mois') {
        const d = new Date(v.date)
        key = FR_MONTHS[d.getMonth()] + ' ' + d.getFullYear()
      } else {
        key = v.destination + ' — ' + destLabel(v.destination)
      }
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(v)
    }
    return Array.from(map.entries())
  }, [data, groupBy])

  const grandTotal = data.reduce((s, v) => s + v.montant, 0)

  const thS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '5px 8px', fontSize: 9.5,
    fontWeight: 700, background: '#F1F5F9', color: '#1E293B',
  }
  const tdS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '4px 8px', fontSize: 9, color: '#1E293B',
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Rapport détaillé par {groupTitle}
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      {groups.map(([label, items]) => {
        const subTotal = items.reduce((s, v) => s + v.montant, 0)
        return (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', marginBottom: 4, borderBottom: '1px solid #E2E8F0', paddingBottom: 2 }}>
              {label}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
              <thead>
                <tr>
                  <th style={thS}>Référence</th>
                  <th style={thS}>Nom</th>
                  <th style={thS}>Code/Date</th>
                  <th style={thS}>Immatriculation</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {items.map(v => (
                  <tr key={v.id}>
                    <td style={tdS}>{v.ref}</td>
                    <td style={tdS}>{v.nomAcheteur}</td>
                    <td style={tdS}>{v.destination}/{dayjs(v.date).format('DD/MM/YY')}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{v.immat}</td>
                    <td style={{ ...tdS, textAlign: 'right' }}>{v.montant.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', fontSize: 9.5, fontWeight: 700, color: '#1E293B' }}>
              Sous-total : {subTotal.toLocaleString('fr-FR')} FCFA ({items.length} véhicule{items.length > 1 ? 's' : ''})
            </div>
          </div>
        )
      })}

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 10, paddingTop: 8,
        textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#DC2626',
      }}>
        TOTAL GENERAL : {grandTotal.toLocaleString('fr-FR')} FCFA ({data.length} véhicule{data.length > 1 ? 's' : ''})
      </div>
    </div>
  )
}

/* ── RESUME report ──────────────────────────────────────────────────── */
function ReportResume({ data, groupBy, dateFrom, dateTo }: ReportProps & { groupBy: GroupBy }): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  const groupTitle = groupBy === 'jour' ? 'jour' : groupBy === 'mois' ? 'mois' : 'destination'

  const lines = useMemo(() => {
    const map = new Map<string, { count: number; montant: number }>()
    for (const v of data) {
      let key: string
      if (groupBy === 'jour') {
        key = dayjs(v.date).format('DD/MM/YYYY')
      } else if (groupBy === 'mois') {
        const d = new Date(v.date)
        key = FR_MONTHS[d.getMonth()] + ' ' + d.getFullYear()
      } else {
        key = v.destination + ' — ' + destLabel(v.destination)
      }
      const cur = map.get(key) ?? { count: 0, montant: 0 }
      map.set(key, { count: cur.count + 1, montant: cur.montant + v.montant })
    }
    return Array.from(map.entries())
  }, [data, groupBy])

  const grandTotal = data.reduce((s, v) => s + v.montant, 0)

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Rapport résumé par {groupTitle}
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      {lines.map(([label, val]) => (
        <div key={label} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#1E293B' }}>
            <span style={{ fontWeight: 600 }}>{label}</span>
            <span>{val.count} véh. — {val.montant.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div style={{ borderBottom: '1px dashed #CBD5E1', marginTop: 3 }} />
        </div>
      ))}

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 14, paddingTop: 8,
        textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#DC2626',
      }}>
        TOTAL GENERAL : {grandTotal.toLocaleString('fr-FR')} FCFA ({data.length} véhicule{data.length > 1 ? 's' : ''})
      </div>
    </div>
  )
}

/* ── ANNUAL report ──────────────────────────────────────────────────── */
function ReportAnnual({ data, dateFrom, dateTo }: ReportProps): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  const monthGroups = useMemo(() => {
    const map = new Map<number, Map<string, number>>()
    for (const v of data) {
      const d = new Date(v.date)
      const month = d.getMonth()
      if (!map.has(month)) map.set(month, new Map())
      const destMap = map.get(month)!
      destMap.set(v.destination, (destMap.get(v.destination) ?? 0) + v.montant)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [data])

  const grandTotal = data.reduce((s, v) => s + v.montant, 0)

  const thS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '5px 8px', fontSize: 9.5,
    fontWeight: 700, background: '#F1F5F9', color: '#1E293B',
  }
  const tdS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '4px 8px', fontSize: 9, color: '#1E293B',
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Rapport annuel
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      {monthGroups.map(([monthIdx, destMap]) => {
        const monthTotal = Array.from(destMap.values()).reduce((s, v) => s + v, 0)
        return (
          <div key={monthIdx} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', marginBottom: 4, borderBottom: '1px solid #E2E8F0', paddingBottom: 2 }}>
              {FR_MONTHS[monthIdx]}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
              <thead>
                <tr>
                  <th style={thS}>Destination</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(destMap.entries()).map(([dest, montant]) => (
                  <tr key={dest}>
                    <td style={tdS}>{dest} — {destLabel(dest)}</td>
                    <td style={{ ...tdS, textAlign: 'right' }}>{montant.toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', fontSize: 9.5, fontWeight: 700, color: '#1E293B' }}>
              Sous-total {FR_MONTHS[monthIdx]} : {monthTotal.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        )
      })}

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 10, paddingTop: 8,
        textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#DC2626',
      }}>
        TOTAL ANNUEL : {grandTotal.toLocaleString('fr-FR')} FCFA
      </div>
    </div>
  )
}

/* ── ASSURANCE report ───────────────────────────────────────────────── */
function ReportAssurance({ data, dateFrom, dateTo, gainTotal }: ReportProps & { gainTotal: number }): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Gain généré par les assurances
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 11 }}>
        <span>
          <span style={{ fontWeight: 600, color: '#374151' }}>Nbr de Véhicule(s) : </span>
          <span style={{ color: '#DC2626', fontWeight: 700 }}>{data.length}</span>
        </span>
        <span>
          <span style={{ fontWeight: 600, color: '#374151' }}>Gain Total : </span>
          <span style={{ color: '#DC2626', fontWeight: 700 }}>{gainTotal.toLocaleString('fr-FR')} FCFA</span>
        </span>
      </div>

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 10, paddingTop: 8,
        textAlign: 'center', fontSize: 10, color: '#64748B',
      }}>
        Type d&apos;assurance : POOL TPV VT - MOTO &mdash; Gain unitaire : 2 264 FCFA
      </div>
    </div>
  )
}
