import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

let dir = ''
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'tcit-brand-')); process.env.PROGRAMDATA = dir })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

describe('brandingStore', () => {
  it('lit les défauts quand le fichier est absent', async () => {
    const { lireBranding } = await import('./brandingStore')
    expect(lireBranding().identite.sigle).toBe('TCIT')
  })
  it('écrit puis relit (round-trip), crée le dossier', async () => {
    const { lireBranding, ecrireBranding } = await import('./brandingStore')
    const cfg = lireBranding()
    cfg.apparence.theme = 'sombre'; cfg.identite.sigle = 'ACME'
    ecrireBranding(cfg)
    expect(existsSync(join(dir, 'TCIT', 'branding.json'))).toBe(true)
    const relu = lireBranding()
    expect(relu.apparence.theme).toBe('sombre')
    expect(relu.identite.sigle).toBe('ACME')
  })
})
