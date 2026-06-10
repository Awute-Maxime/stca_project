declare global {
  interface Window {
    api: {
      resizeForLogin: () => void
      resizeForMain:  () => void
    }
  }
}

export const electronApi = {
  resizeForLogin: () => window.api?.resizeForLogin?.(),
  resizeForMain:  () => window.api?.resizeForMain?.(),
}
