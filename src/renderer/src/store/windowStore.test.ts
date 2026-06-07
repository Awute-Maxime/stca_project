import { describe, it, expect, beforeEach } from 'vitest'
import { useWindowStore } from './windowStore'

const config = { title: 'Test', defaultX: 10, defaultY: 20, width: 400, height: 300 }

describe('windowStore (généralisé, IDs string arbitraires)', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {} })
  })

  it('ouvre une fenêtre avec un identifiant arbitraire et la config fournie', () => {
    useWindowStore.getState().openWindow('rechercheImmat', config)
    const win = useWindowStore.getState().windows['rechercheImmat']
    expect(win.isOpen).toBe(true)
    expect(win.title).toBe('Test')
    expect(win.x).toBe(10)
    expect(win.width).toBe(400)
  })

  it('ré-ouvrir une fenêtre déjà ouverte la met au premier plan sans changer sa position', () => {
    const store = useWindowStore.getState()
    store.openWindow('liste', config)
    store.updatePosition('liste', 222, 333)
    const zBefore = useWindowStore.getState().windows['liste'].zIndex

    store.openWindow('liste', config)
    const win = useWindowStore.getState().windows['liste']
    expect(win.x).toBe(222)
    expect(win.zIndex).toBeGreaterThan(zBefore)
  })

  it('ferme une fenêtre — isOpen passe à false', () => {
    const store = useWindowStore.getState()
    store.openWindow('analyse', config)
    store.closeWindow('analyse')
    expect(useWindowStore.getState().windows['analyse'].isOpen).toBe(false)
  })

  it('bascule l\'état minimisé', () => {
    const store = useWindowStore.getState()
    store.openWindow('enregistrement', config)
    store.minimizeWindow('enregistrement')
    expect(useWindowStore.getState().windows['enregistrement'].isMinimized).toBe(true)
    store.minimizeWindow('enregistrement')
    expect(useWindowStore.getState().windows['enregistrement'].isMinimized).toBe(false)
  })
})
