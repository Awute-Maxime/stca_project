import { create } from 'zustand'

export type WindowId = 'enregistrement' | 'liste' | 'statistiques'

interface WindowState {
  id: WindowId
  title: string
  isOpen: boolean
  isMinimized: boolean
  x: number
  y: number
  zIndex: number
}

export const WINDOW_CONFIG: Record<WindowId, { title: string; defaultX: number; defaultY: number; width: number; height: number }> = {
  enregistrement: { title: 'Enregistrement des véhicules', defaultX: 60,  defaultY: 30, width: 880, height: 580 },
  liste:          { title: 'Liste des véhicules',          defaultX: 80,  defaultY: 50, width: 980, height: 580 },
  statistiques:   { title: 'Statistiques',                 defaultX: 100, defaultY: 40, width: 920, height: 620 },
}

let maxZ = 10

const initialWindows = (): Record<WindowId, WindowState> => {
  const keys = Object.keys(WINDOW_CONFIG) as WindowId[]
  return Object.fromEntries(
    keys.map(id => [
      id,
      {
        id,
        title: WINDOW_CONFIG[id].title,
        isOpen: false,
        isMinimized: false,
        x: WINDOW_CONFIG[id].defaultX,
        y: WINDOW_CONFIG[id].defaultY,
        zIndex: 10,
      }
    ])
  ) as Record<WindowId, WindowState>
}

interface WindowStore {
  windows: Record<WindowId, WindowState>
  openWindow:     (id: WindowId) => void
  closeWindow:    (id: WindowId) => void
  focusWindow:    (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  updatePosition: (id: WindowId, x: number, y: number) => void
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: initialWindows(),

  openWindow: (id) => set(state => {
    maxZ++
    const win = state.windows[id]
    return {
      windows: {
        ...state.windows,
        [id]: { ...win, isOpen: true, isMinimized: false, zIndex: maxZ }
      }
    }
  }),

  closeWindow: (id) => set(state => ({
    windows: {
      ...state.windows,
      [id]: { ...state.windows[id], isOpen: false, isMinimized: false }
    }
  })),

  focusWindow: (id) => set(state => {
    maxZ++
    return {
      windows: {
        ...state.windows,
        [id]: { ...state.windows[id], zIndex: maxZ }
      }
    }
  }),

  minimizeWindow: (id) => set(state => ({
    windows: {
      ...state.windows,
      [id]: { ...state.windows[id], isMinimized: !state.windows[id].isMinimized }
    }
  })),

  updatePosition: (id, x, y) => set(state => ({
    windows: {
      ...state.windows,
      [id]: { ...state.windows[id], x, y }
    }
  })),
}))
