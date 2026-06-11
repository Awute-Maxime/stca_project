import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigProvider } from 'antd'
import MenuBar from './MenuBar'
import { appAntdTheme } from '@theme/windev-theme'

function wrap(ui: JSX.Element): JSX.Element {
  return <ConfigProvider theme={appAntdTheme}>{ui}</ConfigProvider>
}

describe('MenuBar', () => {
  it('affiche le titre et les 6 menus principaux', () => {
    render(wrap(<MenuBar utilisateurLogin="awute" onMenuItemClick={() => {}} />))
    expect(screen.getByText('TCIT : Enregistrement des Véhicules')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Fichier' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Enregistrements des véhicules' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Analyse' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Assurances' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Outils+Config.' })).toBeInTheDocument()
  })

  it('affiche le login utilisateur dans le chrome', () => {
    render(wrap(<MenuBar utilisateurLogin="awute" onMenuItemClick={() => {}} />))
    expect(screen.getByText(/utilisateur connecté : awute/)).toBeInTheDocument()
  })

  it('appelle onMenuItemClick avec la bonne clé au clic sous-menu', async () => {
    const spy = vi.fn()
    render(wrap(<MenuBar utilisateurLogin="awute" onMenuItemClick={spy} />))
    const user = userEvent.setup()
    await user.click(screen.getByRole('menuitem', { name: 'Fichier' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Marques et modèles de véhicules' }))
    expect(spy).toHaveBeenCalledWith('fichier.marques')
  })
})
