import { useState } from 'react'
import { notification } from 'antd'

const INITIAL_MARQUES = [
  {id:1,nom:'140 H'},{id:2,nom:'3256 33'},{id:3,nom:'A.C.M. VQ-2485SA3/ ALLOY TIPPER'},
  {id:4,nom:'ABG DD74'},{id:5,nom:'ABI E.B.G 1200'},{id:6,nom:'ACAM M 2770 G'},
  {id:7,nom:'ACERBI 03G'},{id:8,nom:'ACERBI 08R'},{id:9,nom:'ACERBI 0L8451-BT0'},
  {id:10,nom:'ACERBI 0L 88308T0/ ALLOY TIPPER'},{id:11,nom:'ACERBI 11L537'},{id:12,nom:'ACERBI 125 MG'},
  {id:13,nom:'ACERBI 125 PS'},{id:14,nom:'ACERBI 135MG'},{id:15,nom:'ACERBI 135MHS'},
  {id:16,nom:'ACERBI 135 MSH'},{id:17,nom:'ACERBI 135PG'},{id:18,nom:'ACERBI 135 PS'},
  {id:19,nom:'ACERBI 135PS00'},{id:20,nom:'ACERBI 135 PSA'},{id:21,nom:'ACERBI 135PSF'},
  {id:22,nom:'ACERBI 135 PSR'},{id:23,nom:'ACTM'},{id:24,nom:'ACTM 55315'},
  {id:25,nom:'ACTM A24320C'},{id:26,nom:'ACTM ORIGINAL'},{id:27,nom:'ACTM R3232'},
  {id:28,nom:'ACTM R 35315'},{id:29,nom:'A.C.T.M R44315'},{id:30,nom:'ACTM S070415'},
  {id:31,nom:'ACTM S 322'},{id:32,nom:'ACTM S32215C'},{id:33,nom:'ACTM S32215E'},
  {id:34,nom:'ACTM S32215H'},{id:35,nom:'ACTM S3322/ ALLOY TIPPER'},{id:36,nom:'ACTM S34320'},
  {id:37,nom:'ACTM S34320A'},{id:38,nom:'ACTM S 443'},{id:39,nom:'ACTM S 44315'},
  {id:40,nom:'FOTON BJ1069'},{id:41,nom:'HOWO A7'},{id:42,nom:'ISUZU NQR 75P'},
  {id:43,nom:'MAN TGX 18.440'},{id:44,nom:'MERCEDES ACTROS 1844'},{id:45,nom:'NISSAN PATROL'},
  {id:46,nom:'RENAULT TRUCKS T 480'},{id:47,nom:'SCANIA R500'},{id:48,nom:'TOYOTA HILUX'},
  {id:49,nom:'TOYOTA LAND CRUISER 79'},{id:50,nom:'VOLVO FH16 750'},
]

export default function FichierMarquesPage(): JSX.Element {
  const [marques, setMarques] = useState(INITIAL_MARQUES)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogValue, setDialogValue] = useState('')
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [dialogFootNote, setDialogFootNote] = useState('')

  const sorted = [...marques].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  const checkSel = (): boolean => {
    if (selectedId) return true
    notification.warning({ message: 'Veuillez sélectionner une marque dans la liste.', placement: 'bottomRight' })
    return false
  }

  const openAdd = (): void => {
    setDialogMode('add'); setDialogValue(''); setDialogFootNote(''); setDialogOpen(true)
  }
  const openEdit = (): void => {
    if (!checkSel()) return
    const item = marques.find(m => m.id === selectedId)
    if (!item) return
    setDialogMode('edit'); setDialogValue(item.nom); setDialogFootNote(item.nom); setDialogOpen(true)
  }
  const doDelete = (): void => {
    if (!checkSel()) return
    const item = marques.find(m => m.id === selectedId)
    if (!item) return
    if (!confirm(`Supprimer "${item.nom}" ?`)) return
    setMarques(prev => prev.filter(m => m.id !== selectedId))
    setSelectedId(null)
    notification.success({ message: '✅ Supprimé', placement: 'bottomRight' })
  }
  const dialogValidate = (): void => {
    const val = dialogValue.trim()
    if (!val) return
    if (dialogMode === 'add') {
      setMarques(prev => [...prev, { id: Date.now(), nom: val }])
      notification.success({ message: '✅ Marque/modèle ajouté', placement: 'bottomRight' })
    } else {
      setMarques(prev => prev.map(m => m.id === selectedId ? { ...m, nom: val } : m))
      notification.success({ message: '✅ Modifié', placement: 'bottomRight' })
    }
    setDialogOpen(false)
  }
  const doPrint = (): void => {
    notification.info({ message: '🖨 Impression liste marques...', placement: 'bottomRight' })
  }

  const btnStyle = (borderColor: string, bg: string, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '5px 8px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
    border: `1px solid ${borderColor}`, background: bg, color,
    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5,
    ...extra,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* En-tête pleine largeur */}
      <div style={{
        background: '#F5F3EE', color: '#1B3A6B', fontWeight: 700,
        padding: '6px 10px', textAlign: 'center', fontSize: 11.5,
        borderBottom: '2px solid #E2D9C8', flexShrink: 0,
      }}>Marques - Modèles</div>

      {/* Corps : table + sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Zone table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <tbody>
              {sorted.map(m => (
                <tr key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  onDoubleClick={openEdit}
                  style={{
                    cursor: 'pointer',
                    background: selectedId === m.id ? '#EFF6FF' : undefined,
                  }}
                  onMouseEnter={e => { if (selectedId !== m.id) (e.currentTarget.firstChild as HTMLElement).style.background = '#F8FAFF' }}
                  onMouseLeave={e => { if (selectedId !== m.id) (e.currentTarget.firstChild as HTMLElement).style.background = '' }}
                >
                  <td style={{
                    padding: '3px 10px', color: '#1E293B', fontSize: 11.5,
                    borderBottom: selectedId === m.id ? '1px solid #BFDBFE' : '1px solid #F1F5F9',
                  }}>{m.nom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panneau actions droit */}
      <div style={{
        width: 130, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
        padding: '6px 5px', background: '#F1F3F6', borderLeft: '1px solid #CBD5E1',
      }}>
        <button onClick={openAdd}
          style={btnStyle('#B0C4DE', 'linear-gradient(to bottom, #fff, #E8EEF4)', '#1E293B', { fontWeight: 700 })}>
          ➕ Nouveau
        </button>
        <button onClick={openEdit}
          style={btnStyle('#B0C4DE', 'linear-gradient(to bottom, #fff, #E8EEF4)', '#1E293B')}>
          🖊 Modifier
        </button>
        <button onClick={doDelete}
          style={btnStyle('#B0C4DE', 'linear-gradient(to bottom, #fff, #E8EEF4)', '#DC2626', { fontWeight: 600 })}>
          ➖ Supprimer
        </button>
        <div style={{ borderTop: '1px solid #CBD5E1', margin: '3px 0' }} />
        <button onClick={doPrint}
          style={btnStyle('#B0C4DE', 'linear-gradient(to bottom, #fff, #E8EEF4)', '#1E293B')}>
          🖨 Imprimer
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
          style={btnStyle('#DC2626', 'linear-gradient(to bottom, #fff8f8, #FECACA)', '#DC2626', { fontWeight: 700 })}>
          ✕ Quitter
        </button>
      </div>

      </div>{/* fin corps table+sidebar */}

      {/* Dialog Création/Modification — style WinDev fidèle au prototype */}
      {dialogOpen && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: '#ECE9D8', border: '2px outset #ACA899', minWidth: 300,
            boxShadow: '5px 5px 12px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              background: '#1B3A6B', color: '#fff', fontSize: 11, fontWeight: 600,
              padding: '4px 8px', userSelect: 'none',
            }}>
              Création / Modification d&apos;un type de véhicule
            </div>
            <div style={{ padding: '16px 14px 12px' }}>
              <div style={{ fontSize: 11.5, color: '#1E293B', fontWeight: 500, marginBottom: 6 }}>
                Nom de la marque et du modèle
              </div>
              <input className="light-input" value={dialogValue}
                onChange={e => setDialogValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') dialogValidate(); if (e.key === 'Escape') setDialogOpen(false) }}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '4px 6px', fontSize: 12, display: 'block', height: 26 }} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14 }}>
                <button onClick={dialogValidate} style={{
                  padding: '4px 20px', background: '#2563EB', color: '#fff',
                  border: '1px solid #1D4ED8', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>✓ Valider</button>
                <button onClick={() => setDialogOpen(false)} style={{
                  padding: '4px 20px', background: '#DC2626', color: '#fff',
                  border: '1px solid #B91C1C', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>✕ Quitter</button>
              </div>
              {dialogFootNote && (
                <div style={{
                  textAlign: 'center', marginTop: 10, fontSize: 10.5, color: '#1B3A6B',
                  fontWeight: 600, borderTop: '1px solid #C8BFA8', paddingTop: 8,
                }}>{dialogFootNote}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
