declare global {
  interface Window {
    api: {
      resizeForLogin: () => void
      resizeForMain:  () => void
      closeWindow:    () => void
      minimizeWindow: () => void
      maximizeWindow: () => void
    }
  }
}

export const electronApi = {
  resizeForLogin: () => window.api?.resizeForLogin?.(),
  resizeForMain:  () => window.api?.resizeForMain?.(),
  closeWindow:    () => window.api?.closeWindow?.(),
  minimizeWindow: () => window.api?.minimizeWindow?.(),
  maximizeWindow: () => window.api?.maximizeWindow?.(),
}
