import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigProvider } from 'antd'
import MainScreen from './MainScreen'
import { useWindowStore } from '@store/windowStore'
import { winDevAntdTheme } from '@theme/windev-theme'

function renderWithTheme(ui: JSX.Element): ReturnType<typeof render> {
  return render(<ConfigProvider theme={winDevAntdTheme}>{ui}</ConfigProvider>)
}

describe('MainScreen', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {} })
  })

  it('affiche la barre de menus, la roue de navigation et la barre de statut', () => {
    renderWithTheme(<MainScreen utilisateurLogin="awute" />)
    expect(screen.getByText('STCA : Enregistrement des Véhicules')).toBeInTheDocument()
    expect(screen.getByText('Enregistrement')).toBeInTheDocument()
    expect(screen.getByText('Fonctionnement en Mode Client/Serveur')).toBeInTheDocument()
  })

  it('ouvre une fenêtre MDI au clic sur un item de la roue', async () => {
    renderWithTheme(<MainScreen utilisateurLogin="awute" />)
    const user = userEvent.setup()

    await user.click(screen.getByText('Recherche IMMAT.'))

    expect(await screen.findByText('Recherche par N° Immatriculation')).toBeInTheDocument()
    expect(useWindowStore.getState().windows['rechercheImmat'].isOpen).toBe(true)
  })

  it('ouvre une fenêtre MDI au clic sur un sous-menu', async () => {
    renderWithTheme(<MainScreen utilisateurLogin="awute" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('menuitem', { name: 'Fichier' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Marques et modèles de véhicules' }))

    expect(await screen.findByText('Liste des Marques / Modèles de véhicules')).toBeInTheDocument()
  })
})
