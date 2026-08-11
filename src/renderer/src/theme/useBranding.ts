import { useEffect, useState } from 'react'
import { electronApi } from '@api/electron'
import { fusionnerBranding, type BrandingConfig } from '../../../shared/branding'
import { appliquerBranding } from './appliquerBranding'

export function useBranding(): BrandingConfig {
  const [cfg, setCfg] = useState<BrandingConfig>(() => fusionnerBranding({}))
  useEffect(() => {
    let vivant = true
    const poser = (c: BrandingConfig): void => { if (vivant) { setCfg(c); appliquerBranding(c) } }
    electronApi.brandingCourant().then(poser)
    const off = electronApi.onBrandingMaj(poser)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onOS = (): void => appliquerBranding(cfg)
    mq.addEventListener('change', onOS)
    return () => { vivant = false; off(); mq.removeEventListener('change', onOS) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return cfg
}
