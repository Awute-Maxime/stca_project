export interface MockDestination {
  code: string
  nom: string
  tarif: number
  lettre: string
  numImmatActuel: number
}

export const mockDestinations: MockDestination[] = [
  { code: 'AFO', nom: 'Afolé',           tarif: 10000, lettre: 'C', numImmatActuel: 7388 },
  { code: 'CK',  nom: 'Cinkassé',        tarif: 10000, lettre: 'T', numImmatActuel: 7467 },
  { code: 'KA',  nom: 'Kambolé',         tarif: 10000, lettre: 'E', numImmatActuel: 2182 },
  { code: 'KE',  nom: 'Kétao',           tarif: 10000, lettre: 'C', numImmatActuel: 3177 },
  { code: 'KP',  nom: 'Kpadapé',         tarif: 10000, lettre: 'C', numImmatActuel: 4419 },
  { code: 'KW',  nom: 'Kwodjoviakope',   tarif: 10000, lettre: 'C', numImmatActuel: 6637 },
  { code: 'NO',  nom: 'Noépé',           tarif: 10000, lettre: 'A', numImmatActuel: 3910 },
  { code: 'TO',  nom: 'Tohoum',          tarif: 10000, lettre: 'C', numImmatActuel: 7490 },
  { code: 'S/C', nom: 'Sanvi condji',    tarif: 10000, lettre: 'A', numImmatActuel: 8039 },
  { code: 'POL', nom: 'Réexportation',   tarif: 10000, lettre: 'A', numImmatActuel: 3 }
]
