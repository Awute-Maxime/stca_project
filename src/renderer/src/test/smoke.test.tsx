import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hello(): JSX.Element {
  return <span>Bonjour TCIT</span>
}

describe('Infrastructure de test', () => {
  it('rend un composant React et trouve son texte', () => {
    render(<Hello />)
    expect(screen.getByText('Bonjour TCIT')).toBeInTheDocument()
  })
})
