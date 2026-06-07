import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from './StatusBar'

describe('StatusBar', () => {
  it('affiche le mode de fonctionnement Client/Serveur', () => {
    render(<StatusBar nbVehiculesAujourdhui={0} />)
    expect(screen.getByText('Fonctionnement en Mode Client/Serveur')).toBeInTheDocument()
  })

  it('affiche le nombre de véhicules enregistrés aujourd\'hui', () => {
    render(<StatusBar nbVehiculesAujourdhui={42} />)
    expect(screen.getByText(/Nbr de véhicule\(s\) enregistré\(s\) aujourd'hui : 42/)).toBeInTheDocument()
  })

  it('affiche la date du jour au format JJ/MM/AAAA', () => {
    render(<StatusBar nbVehiculesAujourdhui={0} />)
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    expect(screen.getByText(new RegExp(`${dd}/${mm}/${today.getFullYear()}`))).toBeInTheDocument()
  })
})
