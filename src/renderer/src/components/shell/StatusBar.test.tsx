import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from './StatusBar'

describe('StatusBar', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('affiche le mode Client/Serveur', () => {
    render(<StatusBar nbVehiculesAujourdhui={0} />)
    expect(screen.getByText(/Mode Client\/Serveur/i)).toBeInTheDocument()
  })

  it('affiche le nombre de véhicules passé en prop', () => {
    render(<StatusBar nbVehiculesAujourdhui={42} />)
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })

  it('a un fond bleu marine', () => {
    const { container } = render(<StatusBar nbVehiculesAujourdhui={0} />)
    const bar = container.firstChild as HTMLElement
    // JSDOM peut normaliser hex en rgb — accepter les deux formes
    expect(bar.style.background).toMatch(/#1B3A6B|rgb\(27,\s*58,\s*107\)/i)
  })
})
