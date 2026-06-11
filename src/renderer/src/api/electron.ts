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
  mdiSelfClose:    () => window.api?.mdiSelfClose?.(),
  mdiSelfMinimize: () => window.api?.mdiSelfMinimize?.(),
  mdiSelfMaximize: () => window.api?.mdiSelfMaximize?.(),
}
