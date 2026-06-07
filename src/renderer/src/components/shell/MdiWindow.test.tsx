import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MdiWindow from './MdiWindow'
import { useWindowStore } from '@store/windowStore'

const config = { title: 'Enregistrement des véhicules', defaultX: 40, defaultY: 30, width: 700, height: 500 }

describe('MdiWindow', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {} })
    useWindowStore.getState().openWindow('enregistrement', config)
  })

  it('affiche le titre de la fenêtre et son contenu', () => {
    render(<MdiWindow id="enregistrement"><p>Contenu du formulaire</p></MdiWindow>)
    expect(screen.getByText('Enregistrement des véhicules')).toBeInTheDocument()
    expect(screen.getByText('Contenu du formulaire')).toBeInTheDocument()
  })

  it('le bouton Fermer appelle closeWindow du store', async () => {
    render(<MdiWindow id="enregistrement"><p>Contenu</p></MdiWindow>)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /fermer/i }))
    expect(useWindowStore.getState().windows['enregistrement'].isOpen).toBe(false)
  })

  it('le bouton Réduire appelle minimizeWindow du store', async () => {
    render(<MdiWindow id="enregistrement"><p>Contenu</p></MdiWindow>)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /réduire/i }))
    expect(useWindowStore.getState().windows['enregistrement'].isMinimized).toBe(true)
  })

  it('ne rend rien si la fenêtre est fermée', () => {
    useWindowStore.getState().closeWindow('enregistrement')
    const { container } = render(<MdiWindow id="enregistrement"><p>Contenu</p></MdiWindow>)
    expect(container).toBeEmptyDOMElement()
  })
})
