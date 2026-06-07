export interface MockUtilisateur {
  login: string
  motDePasseMasque: string
  administrateur: boolean
  compteActif: boolean
}

export const mockUtilisateurs: MockUtilisateur[] = [
  { login: 'Administrateur',   motDePasseMasque: '••••••••', administrateur: true,  compteActif: true  },
  { login: 'Authority.Config', motDePasseMasque: '•••••',    administrateur: true,  compteActif: true  },
  { login: 'Odette',           motDePasseMasque: '••••',     administrateur: true,  compteActif: true  },
  { login: 'akilou',           motDePasseMasque: '•••',      administrateur: false, compteActif: true  },
  { login: 'aminou',           motDePasseMasque: '••••••',   administrateur: true,  compteActif: true  },
  { login: 'awute',            motDePasseMasque: '•••••',    administrateur: true,  compteActif: true  },
  { login: 'awute2',           motDePasseMasque: '••••••',   administrateur: true,  compteActif: true  },
  { login: 'celestine',        motDePasseMasque: '••••',     administrateur: false, compteActif: true  },
  { login: 'clemence',         motDePasseMasque: '••••',     administrateur: false, compteActif: false },
  { login: 'emmanuel',         motDePasseMasque: '',         administrateur: false, compteActif: true  },
  { login: 'jeanlin',          motDePasseMasque: '••••••',   administrateur: true,  compteActif: true  },
  { login: 'mathieu',          motDePasseMasque: '••••',     administrateur: false, compteActif: true  },
  { login: 'mohamed',          motDePasseMasque: '••••',     administrateur: false, compteActif: false },
  { login: 'nicole',           motDePasseMasque: '••••',     administrateur: false, compteActif: false },
  { login: 'oliadmin',         motDePasseMasque: '•••••••',  administrateur: true,  compteActif: true  },
  { login: 'victor',           motDePasseMasque: '••••',     administrateur: false, compteActif: true  },
  { login: 'victoradm',        motDePasseMasque: '•••••••',  administrateur: true,  compteActif: true  },
  { login: 'visiteur',         motDePasseMasque: '',         administrateur: false, compteActif: false }
]
