import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavigationWheel, { WHEEL_ITEMS } from './NavigationWheel'

describe('NavigationWheel', () => {
  it('définit les 6 items de la roue dans l\'ordre documenté', () => {
    expect(WHEEL_ITEMS.map(i => i.id)).toEqual([
      'enregistrement', 'destination', 'analyse', 'listeVehicules', 'rechercheImmat', 'rechercheChassis'
    ])
  })

  it('affiche les libellés des 6 items et le bouton central', () => {
    render(<NavigationWheel onSelect={vi.fn()} />)
    expect(screen.getByText('Enregistrement')).toBeInTheDocument()
    expect(screen.getByText('Destination')).toBeInTheDocument()
    expect(screen.getByText('Analyse')).toBeInTheDocument()
    expect(screen.getByText('Liste Véhicules')).toBeInTheDocument()
    expect(screen.getByText('Recherche IMMAT.')).toBeInTheDocument()
    expect(screen.getByText('Recherche N°Chassis')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accueil|power/i })).toBeInTheDocument()
  })

  it('appelle onSelect avec l\'identifiant correct au clic sur un item', async () => {
    const onSelect = vi.fn()
    render(<NavigationWheel onSelect={onSelect} />)
    const user = userEvent.setup()

    await user.click(screen.getByText('Enregistrement'))
    expect(onSelect).toHaveBeenCalledWith('enregistrement')

    await user.click(screen.getByText('Recherche N°Chassis'))
    expect(onSelect).toHaveBeenCalledWith('rechercheChassis')
  })
})
