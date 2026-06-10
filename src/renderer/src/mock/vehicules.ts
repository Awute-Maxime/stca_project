import dayjs from 'dayjs'

export interface MockVehicule {
  id: number
  ref: string
  date: string
  immat: string
  chassis: string
  typeVehicule: string
  marqueModele: string
  destination: string
  montant: number
  nomAcheteur: string
  paysResidence: string
  paysDestination: string
  parc: string
  agent: string
  recyclerPlaque: boolean
}

const AGENTS = ['awute', 'aminou', 'akilou', 'jeanlin', 'celestine', 'victor']
const PARCS = [
  'Parc Lomé Centre', 'Parc Adakpamé', 'Parc Agoé',
  'Parc Baguida', 'Parc Hédzranawoé', 'Parc Port Autonome de Lomé'
]
const TYPES = ['Voiture', 'Camion', 'Moto', 'Bus', 'Pick-up', 'Minibus']
const MARQUES = [
  'TOYOTA COROLLA', 'TOYOTA HILUX', 'TOYOTA HIACE', 'TOYOTA LAND CRUISER',
  'MERCEDES ACTROS', 'MERCEDES SPRINTER',
  'FORD RANGER', 'FORD TRANSIT',
  'RENAULT MASTER', 'RENAULT TRAFIC',
  'PEUGEOT 306', 'PEUGEOT BOXER',
  'VOLKSWAGEN GOLF', 'VOLKSWAGEN TRANSPORTER',
  'NISSAN NAVARA', 'NISSAN PATROL',
  'HONDA CB 125', 'YAMAHA FZ 150',
  'DAF XF 105', 'MAN TGX 18.480',
  'MITSUBISHI L200', 'ISUZU D-MAX',
]
const PAYS = [
  'Burkina Faso', 'Ghana', 'Niger', 'Bénin', 'Mali',
  'Côte d\'Ivoire', 'Nigeria', 'Sénégal', 'Guinée'
]
const NOMS = [
  'Kofi Mensah', 'Abou Diallo', 'Ibrahim Traoré', 'Salimata Ouédraogo',
  'Jean-Baptiste Koffi', 'Fatima Diallo', 'Moussa Coulibaly', 'Adjoa Asante',
  'Amara Touré', 'Aminata Bah', 'Kwame Asare', 'Ramatou Sawadogo',
  'Séraphin Agbeko', 'Nafissatou Sow', 'Edem Dossou', 'Balkissa Maïga',
  'Aristide Akakpo', 'Mariam Sylla', 'Komlan Dzifanu', 'Fatoumata Traoré',
]

const DEST_DATA: Array<{ code: string; lettre: string; numBase: number }> = [
  { code: 'AFO', lettre: 'C', numBase: 7388 },
  { code: 'CK',  lettre: 'T', numBase: 7467 },
  { code: 'KA',  lettre: 'E', numBase: 2182 },
  { code: 'KE',  lettre: 'C', numBase: 3177 },
  { code: 'KP',  lettre: 'C', numBase: 4419 },
  { code: 'KW',  lettre: 'C', numBase: 6637 },
  { code: 'NO',  lettre: 'A', numBase: 3910 },
  { code: 'TO',  lettre: 'C', numBase: 7490 },
  { code: 'S/C', lettre: 'A', numBase: 8039 },
  { code: 'POL', lettre: 'A', numBase: 3 },
]

function randomChassis(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  return Array.from({ length: 17 }, (_, i) =>
    i < 3
      ? 'ABCDEFGHJKLMNPRSTUVWXYZ'[Math.floor(Math.random() * 24)]
      : chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export const mockVehicules: MockVehicule[] = Array.from({ length: 52 }, (_, i) => {
  const destInfo = DEST_DATA[i % DEST_DATA.length]
  const num = destInfo.numBase + i
  const immat = `${destInfo.lettre}${String(num).padStart(4, '0')}`
  const daysAgo = Math.floor(i * 0.8)

  return {
    id: i + 1,
    ref: String(10000 + i).padStart(6, '0'),
    date: dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD HH:mm'),
    immat,
    chassis: randomChassis(),
    typeVehicule: TYPES[i % TYPES.length],
    marqueModele: MARQUES[i % MARQUES.length],
    destination: destInfo.code,
    montant: 10000,
    nomAcheteur: NOMS[i % NOMS.length],
    paysResidence: PAYS[i % PAYS.length],
    paysDestination: PAYS[(i + 2) % PAYS.length],
    parc: PARCS[i % PARCS.length],
    agent: AGENTS[i % AGENTS.length],
    recyclerPlaque: i % 7 === 0,
  }
})
