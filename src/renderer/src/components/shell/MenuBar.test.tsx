import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MenuBar from './MenuBar'

const noop = (): void => {}

describe('MenuBar', () => {
  it('affiche le titre de la fenêtre et les informations utilisateur', () => {
    render(<MenuBar utilisateurLogin="awute" onMenuItemClick={noop} />)
    expect(screen.getByText('STCA : Enregistrement des Véhicules')).toBeInTheDocument()
    expect(screen.getByText(/utilisateur connecté : awute/)).toBeInTheDocument()
    expect(screen.getByText(/utilisateur avec pouvoir : OUI/)).toBeInTheDocument()
  })

  it('affiche les 6 menus de premier niveau dans l\'ordre de l\'original', () => {
    render(<MenuBar utilisateurLogin="awute" onMenuItemClick={noop} />)
    const labels = ['Fichier', 'Enregistrements des véhicules', 'Analyse', 'Assurances', 'Outils+Config.', '?']
    const menuLabels = screen.getAllByRole('menuitem').map(el => el.textContent?.trim())
    expect(menuLabels).toEqual(labels)
  })

  it('ouvre le sous-menu Fichier et déclenche onMenuItemClick au clic sur "Quitter"', async () => {
    const onMenuItemClick = vi.fn()
    render(<MenuBar utilisateurLogin="awute" onMenuItemClick={onMenuItemClick} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('menuitem', { name: 'Fichier' }))
    const quitter = await screen.findByRole('menuitem', { name: 'Quitter' })
    await user.click(quitter)

    expect(onMenuItemClick).toHaveBeenCalledWith('fichier.quitter')
  })
})
