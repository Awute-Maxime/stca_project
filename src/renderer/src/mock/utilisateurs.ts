export interface MockUtilisateur {
  id: number
  login: string
  motDePasse: string
  motDePasseMasque: string
  nom: string
  administrateur: boolean
  compteActif: boolean
}

export const mockUtilisateurs: MockUtilisateur[] = [
  { id:  1, login: 'Administrateur',   motDePasse: 'Admin2024',  motDePasseMasque: '••••••••', nom: 'Administrateur Système',  administrateur: true,  compteActif: true  },
  { id:  2, login: 'Authority.Config', motDePasse: 'Conf#2024',  motDePasseMasque: '•••••',    nom: 'Authority Configuration', administrateur: true,  compteActif: true  },
  { id:  3, login: 'Odette',           motDePasse: 'Ode7788',    motDePasseMasque: '••••',     nom: 'Odette Mensah',           administrateur: true,  compteActif: true  },
  { id:  4, login: 'akilou',           motDePasse: 'aki',        motDePasseMasque: '•••',      nom: 'Akilou Koffi',            administrateur: false, compteActif: true  },
  { id:  5, login: 'aminou',           motDePasse: 'aminou',     motDePasseMasque: '••••••',   nom: 'Aminou Sow',              administrateur: true,  compteActif: true  },
  { id:  6, login: 'awute',            motDePasse: 'Awmax',      motDePasseMasque: '•••••',    nom: 'Awute Maxime',            administrateur: true,  compteActif: true  },
  { id:  7, login: 'awute2',           motDePasse: 'Awmax2',     motDePasseMasque: '••••••',   nom: 'Awute Maxime 2',          administrateur: true,  compteActif: true  },
  { id:  8, login: 'celestine',        motDePasse: 'celes',      motDePasseMasque: '•••••',    nom: 'Celestine Atsu',          administrateur: false, compteActif: true  },
  { id:  9, login: 'clemence',         motDePasse: 'clem4',      motDePasseMasque: '••••',     nom: 'Clemence Dossou',         administrateur: false, compteActif: false },
  { id: 10, login: 'emmanuel',         motDePasse: '',           motDePasseMasque: '',         nom: 'Emmanuel Kodjo',          administrateur: false, compteActif: true  },
  { id: 11, login: 'jeanlin',          motDePasse: 'jean99',     motDePasseMasque: '••••••',   nom: 'Jeanlin Gbadago',         administrateur: true,  compteActif: true  },
  { id: 12, login: 'mathieu',          motDePasse: 'math4',      motDePasseMasque: '••••',     nom: 'Mathieu Agbo',            administrateur: false, compteActif: true  },
  { id: 13, login: 'mohamed',          motDePasse: 'moha4',      motDePasseMasque: '••••',     nom: 'Mohamed Issah',           administrateur: false, compteActif: false },
  { id: 14, login: 'nicole',           motDePasse: 'nico4',      motDePasseMasque: '••••',     nom: 'Nicole Amedé',            administrateur: false, compteActif: false },
  { id: 15, login: 'oliadmin',         motDePasse: 'Oli#2024',   motDePasseMasque: '•••••••',  nom: 'Olivier Admin',           administrateur: true,  compteActif: true  },
  { id: 16, login: 'victor',           motDePasse: 'vict4',      motDePasseMasque: '••••',     nom: 'Victor Kponto',           administrateur: false, compteActif: true  },
  { id: 17, login: 'victoradm',        motDePasse: 'Vict#2024',  motDePasseMasque: '•••••••',  nom: 'Victor Administrateur',   administrateur: true,  compteActif: true  },
  { id: 18, login: 'visiteur',         motDePasse: '',           motDePasseMasque: '',         nom: 'Visiteur',                administrateur: false, compteActif: false },
]
