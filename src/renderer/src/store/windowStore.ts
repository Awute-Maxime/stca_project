import { create } from 'zustand'

export interface WindowConfig {
  title: string
  defaultX: number
  defaultY: number
  width: number
  height: number
}

export interface WindowState extends WindowConfig {
  id: string
  isOpen: boolean
  isMinimized: boolean
  x: number
  y: number
  zIndex: number
}

let maxZ = 10

interface WindowStore {
  windows: Record<string, WindowState>
  openWindow:     (id: string, config: WindowConfig) => void
  closeWindow:    (id: string) => void
  focusWindow:    (id: string) => void
  minimizeWindow: (id: string) => void
  updatePosition: (id: string, x: number, y: number) => void
  updateSize:     (id: string, width: number, height: number) => void
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: {},

  openWindow: (id, config) => set(state => {
    maxZ++
    const existing = state.windows[id]
    return {
      windows: {
        ...state.windows,
        [id]: existing
          ? { ...existing, isOpen: true, isMinimized: false, zIndex: maxZ }
          : {
              id,
              ...config,
              isOpen: true,
              isMinimized: false,
              x: config.defaultX,
              y: config.defaultY,
              zIndex: maxZ
            }
      }
    }
  }),

  closeWindow: (id) => set(state => {
    const win = state.windows[id]
    if (!win) return state
    return { windows: { ...state.windows, [id]: { ...win, isOpen: false, isMinimized: false } } }
  }),

  focusWindow: (id) => set(state => {
    const win = state.windows[id]
    if (!win) return state
    maxZ++
    return { windows: { ...state.windows, [id]: { ...win, zIndex: maxZ } } }
  }),

  minimizeWindow: (id) => set(state => {
    const win = state.windows[id]
    if (!win) return state
    return { windows: { ...state.windows, [id]: { ...win, isMinimized: !win.isMinimized } } }
  }),

  updatePosition: (id, x, y) => set(state => {
    const win = state.windows[id]
    if (!win) return state
    return { windows: { ...state.windows, [id]: { ...win, x, y } } }
  }),

  updateSize: (id, width, height) => set(state => {
    const win = state.windows[id]
    if (!win) return state
    return { windows: { ...state.windows, [id]: { ...win, width, height } } }
  })
}))

// Conservé pour compatibilité de lecture par les futurs composants de fenêtre
export const getWindow = (id: string): WindowState | undefined => useWindowStore.getState().windows[id]
