declare global {
  interface Window {
    api: {
      resizeForLogin:      () => void
      resizeForLoginAdmin: () => void
      resizeForMain:       () => void
      closeWindow:     () => void
      minimizeWindow:  () => void
      maximizeWindow:  () => void
      mdiOpen:         (data: { id: string; x: number; y: number; width: number; height: number }) => void
      mdiListOpen:     () => Promise<string[]>
      mdiCloseId:      (id: string) => void
      printersList:    () => Promise<Array<{ name: string; isDefault: boolean }>>
      mdiSelfClose:    () => void
      mdiSelfMinimize: () => void
      mdiSelfMaximize: () => void
    }
  }
}

export const electronApi = {
  resizeForLogin:      () => window.api?.resizeForLogin?.(),
  resizeForLoginAdmin: () => window.api?.resizeForLoginAdmin?.(),
  resizeForMain:       () => window.api?.resizeForMain?.(),
  closeWindow:     () => window.api?.closeWindow?.(),
  minimizeWindow:  () => window.api?.minimizeWindow?.(),
  maximizeWindow:  () => window.api?.maximizeWindow?.(),
  mdiOpen:         (data: { id: string; x: number; y: number; width: number; height: number }) =>
    window.api?.mdiOpen?.(data),
  mdiListOpen:     (): Promise<string[]> => window.api?.mdiListOpen?.() ?? Promise.resolve([]),
  mdiCloseId:      (id: string) => window.api?.mdiCloseId?.(id),
  printersList:    (): Promise<Array<{ name: string; isDefault: boolean }>> =>
    window.api?.printersList?.() ?? Promise.resolve([]),
  mdiSelfClose:    () => window.api?.mdiSelfClose?.(),
  mdiSelfMinimize: () => window.api?.mdiSelfMinimize?.(),
  mdiSelfMaximize: () => window.api?.mdiSelfMaximize?.(),
}
