import { useState } from 'react'
import { notification } from 'antd'
import { useMarques, addMarque, renameMarque, removeMarque } from '@mock/marquesStore'

export default function FichierMarquesPage(): JSX.Element {
  const marques = useMarques() // store partagé — même liste que le modal Marque de l'Enregistrement
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
    removeMarque(item.id) // suppression réelle — synchro modal Enregistrement inclus
    setSelectedId(null)
    notification.success({ message: '✅ Supprimé', placement: 'bottomRight' })
  }
  const dialogValidate = (): void => {
    const val = dialogValue.trim()
    if (!val) return
    const err = dialogMode === 'add' ? addMarque(val) : renameMarque(selectedId!, val)
    if (err) {
      notification.warning({ message: err, placement: 'bottomRight' })
      return
    }
    notification.success({
      message: dialogMode === 'add' ? '✅ Marque/modèle ajouté' : '✅ Modifié',
      placement: 'bottomRight',
    })
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
