import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavSidebar, { SIDEBAR_ITEMS } from './NavSidebar'

describe('NavSidebar', () => {
  it('définit les 6 items dans l\'ordre documenté', () => {
    expect(SIDEBAR_ITEMS.map(i => i.id)).toEqual([
      'enregistrement', 'destination', 'analyse',
      'listeVehicules', 'rechercheImmat', 'rechercheChassis'
    ])
  })

  it('affiche les 6 boutons avec leur libellé', () => {
    render(<NavSidebar onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: /enregistrement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /destination/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyse/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /liste véhicules/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recherche immat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recherche n°chassis/i })).toBeInTheDocument()
  })

  it('appelle onSelect avec l\'identifiant correct au clic', async () => {
    const onSelect = vi.fn()
    render(<NavSidebar onSelect={onSelect} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /enregistrement/i }))
    expect(onSelect).toHaveBeenCalledWith('enregistrement')

    await user.click(screen.getByRole('button', { name: /destination/i }))
    expect(onSelect).toHaveBeenCalledWith('destination')
  })
})
