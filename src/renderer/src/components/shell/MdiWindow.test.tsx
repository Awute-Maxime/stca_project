import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MdiWindow from './MdiWindow'
import { useWindowStore } from '@store/windowStore'

const openWindow = (id: string): void => {
  useWindowStore.setState({
    windows: {
      [id]: { id, title: 'Test Fenêtre', x: 100, y: 50, width: 400, height: 300, isOpen: true, isMinimized: false, zIndex: 1 }
    }
  })
}

describe('MdiWindow', () => {
  beforeEach(() => useWindowStore.setState({ windows: {} }))

  it('ne rend rien si la fenêtre est fermée', () => {
    const { container } = render(<MdiWindow id="test"><p>contenu</p></MdiWindow>)
    expect(container.firstChild).toBeNull()
  })

  it('affiche le titre et le contenu quand la fenêtre est ouverte', () => {
    openWindow('test')
    render(<MdiWindow id="test"><p>contenu enfant</p></MdiWindow>)
    expect(screen.getByText('Test Fenêtre')).toBeInTheDocument()
    expect(screen.getByText('contenu enfant')).toBeInTheDocument()
  })

  it('la barre de titre a un fond bleu marine', () => {
    openWindow('test')
    render(<MdiWindow id="test"><p>x</p></MdiWindow>)
    const titleBar = screen.getByText('Test Fenêtre').parentElement!
    // JSDOM normalise #1B3A6B en rgb(27, 58, 107)
    expect(titleBar.style.background).toMatch(/#1B3A6B|rgb\(27,\s*58,\s*107\)/)
  })

  it('ferme la fenêtre au clic sur le bouton Fermer', async () => {
    openWindow('test')
    render(<MdiWindow id="test"><p>x</p></MdiWindow>)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(useWindowStore.getState().windows['test'].isOpen).toBe(false)
  })
})
