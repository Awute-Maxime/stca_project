import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Peuplement de la base TCIT avec des DONNÉES DE TEST fidèles à l'app actuelle,
// pour développer la Phase 3 (bascule localStorage → base). Idempotent : vide
// puis remplit. Volume d'enregistrements : node prisma/seed.mjs [N] (défaut 1000).
// ─────────────────────────────────────────────────────────────────────────────

const N = parseInt(process.argv[2] ?? '1000', 10)
const db = new PrismaClient()

const CATEGORIES = [
  { rang: 1, nom: 'Voiture' },
  { rang: 2, nom: 'Camion' },
  { rang: 3, nom: 'Autre' },
]

const DESTINATIONS = [
  { code: 'AFO', nom: 'Afolé',         lettre: 'C', tarif: 10000, numImmatActuel: 7388, couleur: '#DC2626' },
  { code: 'CK',  nom: 'Cinkassé',      lettre: 'T', tarif: 10000, numImmatActuel: 7467, couleur: '#DC2626' },
  { code: 'KA',  nom: 'Kambolé',       lettre: 'E', tarif: 10000, numImmatActuel: 2182, couleur: '#DC2626' },
  { code: 'KE',  nom: 'Kétao',         lettre: 'C', tarif: 10000, numImmatActuel: 3177, couleur: '#DC2626' },
  { code: 'KP',  nom: 'Kpadapé',       lettre: 'C', tarif: 10000, numImmatActuel: 4419, couleur: '#16A34A' },
  { code: 'KW',  nom: 'Kwodjoviakope', lettre: 'C', tarif: 10000, numImmatActuel: 6637, couleur: '#16A34A' },
  { code: 'NO',  nom: 'Noépé',         lettre: 'A', tarif: 10000, numImmatActuel: 3910, couleur: '#16A34A' },
  { code: 'TO',  nom: 'Tohoum',        lettre: 'C', tarif: 10000, numImmatActuel: 7490, couleur: '#DC2626' },
  { code: 'S/C', nom: 'Sanvi condji',  lettre: 'A', tarif: 10000, numImmatActuel: 8039, couleur: '#FFD700' },
  { code: 'POL', nom: 'Réexportation', lettre: 'A', tarif: 10000, numImmatActuel: 3,    couleur: '#94A3B8' },
]

const MARQUES = [
  ['TOYOTA', 'COROLLA'], ['TOYOTA', 'HILUX'], ['TOYOTA', 'HIACE'], ['TOYOTA', 'LAND CRUISER'],
  ['TOYOTA', 'RAV4'], ['HONDA', 'CIVIC'], ['HONDA', 'CR-V'], ['NISSAN', 'PATROL'],
  ['NISSAN', 'X-TRAIL'], ['MERCEDES', 'ACTROS'], ['MERCEDES', 'SPRINTER'], ['KIA', 'RIO'],
  ['KIA', 'SPORTAGE'], ['HYUNDAI', 'TUCSON'], ['FORD', 'RANGER'], ['FORD', 'FOCUS'],
  ['PEUGEOT', '308'], ['RENAULT', 'DUSTER'], ['VOLKSWAGEN', 'GOLF'], ['MITSUBISHI', 'PAJERO'],
]

const UTILISATEURS = [
  { login: 'Administrateur',   motDePasse: 'Admin2024', nom: 'Administrateur Système',  administrateur: true,  compteActif: true },
  { login: 'Authority.Config', motDePasse: 'Conf#2024', nom: 'Authority Configuration', administrateur: true,  compteActif: true },
  { login: 'awute',            motDePasse: 'Awmax',     nom: 'Awute Maxime',            administrateur: true,  compteActif: true },
  { login: 'odette',           motDePasse: 'Ode7788',   nom: 'Odette Mensah',           administrateur: true,  compteActif: true },
  { login: 'akilou',           motDePasse: 'aki',       nom: 'Akilou Koffi',            administrateur: false, compteActif: true },
  { login: 'celestine',        motDePasse: 'celes',     nom: 'Celestine Atsu',          administrateur: false, compteActif: true },
  { login: 'mathieu',          motDePasse: 'math4',     nom: 'Mathieu Agbo',            administrateur: false, compteActif: true },
  { login: 'victor',           motDePasse: 'vict4',     nom: 'Victor Kponto',           administrateur: false, compteActif: true },
]

const AGENTS = ['awute', 'odette', 'akilou', 'celestine', 'mathieu', 'victor']
const PRENOMS = ['Kofi', 'Ama', 'Yao', 'Afi', 'Kwame', 'Akosua', 'Komla', 'Adjoa', 'Sena', 'Essi', 'Mensah', 'Dossou', 'Amivi', 'Koffi']
const NOMS    = ['MENSAH', 'KOFFI', 'DOSSOU', 'ATSU', 'AGBO', 'KPONTO', 'GBADAGO', 'AMEDE', 'SOW', 'ISSAH', 'KODJO', 'AGBEKO', 'LAWSON', 'ADJOVI']
const PARCS   = ['TP1', 'TP2', 'TP3', 'Parc Baguida', 'Parc Hédzranawoé', 'Parc Port Autonome']
const VILLES  = ['Lomé', 'Kara', 'Aného', 'Sokodé', 'Kpalimé', 'Atakpamé', 'Dapaong', 'Tsévié']

// Générateur pseudo-aléatoire déterministe (résultats reproductibles)
let graine = 123456789
const rnd = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff }
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

const MS_JOUR = 24 * 3600 * 1000
const AUJOURDHUI = Date.parse('2026-07-23T10:00:00')

async function main() {
  console.log(`Peuplement : ${N} enregistrement(s)…`)

  // Vidage (ordre : enfants d'abord)
  await db.enregistrement.deleteMany()
  await db.tarifAssurance.deleteMany()
  await db.assureur.deleteMany()
  await db.categorieVehicule.deleteMany()
  await db.destination.deleteMany()
  await db.marqueModele.deleteMany()
  await db.utilisateur.deleteMany()
  await db.parametre.deleteMany()

  // Référentiels
  await db.categorieVehicule.createMany({ data: CATEGORIES })
  await db.destination.createMany({ data: DESTINATIONS })
  await db.marqueModele.createMany({ data: MARQUES.map(([marque, modele]) => ({ marque, modele, libelle: `${marque} ${modele}` })) })
  await db.utilisateur.createMany({ data: UTILISATEURS })

  const assureur = await db.assureur.create({ data: { nom: 'POOL TPV VT - MOTO', coordonnees: '01 BP 2689 Lomé Togo tel : 221 70 92' } })
  await db.tarifAssurance.createMany({ data: [
    { assureurId: assureur.id, categorieRang: 1, tarif: 13000, taxe: 679,  commissionPct: 20, rc: 5065, cedeao: 506, individuelle: 3750, accessoires: 2000 },
    { assureurId: assureur.id, categorieRang: 2, tarif: 19500, taxe: 1047, commissionPct: 20, rc: 9000, cedeao: 506, individuelle: 6947, accessoires: 2000 },
    { assureurId: assureur.id, categorieRang: 3, tarif: 13000, taxe: 679,  commissionPct: 20, rc: 5065, cedeao: 506, individuelle: 3750, accessoires: 2000 },
  ] })

  // Enregistrements
  const compteurImmat = Object.fromEntries(DESTINATIONS.map(d => [d.code, d.numImmatActuel]))
  const BASE_REF = 600000
  let lot = []
  let inseres = 0
  for (let i = 0; i < N; i++) {
    const dest = pick(DESTINATIONS)
    const rang = rnd() < 0.7 ? 1 : rnd() < 0.7 ? 2 : 3
    const [marque, modele] = pick(MARQUES)
    const numImm = ++compteurImmat[dest.code]
    const ageJours = Math.floor(rnd() * 2200) // 0 à ~6 ans
    const dateEnreg = new Date(AUJOURDHUI - ageJours * MS_JOUR)
    const archive = ageJours > 1095 && rnd() < 0.6 // >3 ans → souvent archivé
    const sorti = rnd() < 0.4
    lot.push({
      numRef: BASE_REF + i,
      nomPrenomProprio: `${pick(NOMS)} ${pick(PRENOMS)}`,
      adresseProprio: pick(VILLES),
      categorieRang: rang,
      codeTransit: dest.code,
      maisonTransit: pick(PARCS),
      nomDuParc: pick(PARCS),
      marqueModele: `${marque} ${modele}`,
      vin: 'SEED' + String(i).padStart(13, '0'),
      numTri: 'T' + String(1000 + i).padStart(5, '0'),
      numImmatriculation: `${dest.lettre}${String(numImm).padStart(4, '0')}`,
      montant: 10000,
      dateEnreg,
      flagSortie: sorti,
      dateSortie: sorti ? new Date(dateEnreg.getTime() + Math.floor(rnd() * 30 + 1) * MS_JOUR) : null,
      nomUtilisateur: pick(AGENTS),
      dateArchivage: archive ? new Date(AUJOURDHUI - Math.floor(rnd() * 200) * MS_JOUR) : null,
      archivePar: archive ? 'Administrateur' : null,
    })
    if (lot.length >= 500) { await db.enregistrement.createMany({ data: lot }); inseres += lot.length; lot = [] }
  }
  if (lot.length) { await db.enregistrement.createMany({ data: lot }); inseres += lot.length }

  // Paramètre : compteur de référence calé sur la dernière réf
  await db.parametre.create({ data: { cle: 'refCompteur', valeur: String(BASE_REF + N - 1) } })
  await db.parametre.create({ data: { cle: 'assurances.miseEnService', valeur: 'true' } })

  // Récapitulatif
  const actifs = await db.enregistrement.count({ where: { dateArchivage: null } })
  const archives = await db.enregistrement.count({ where: { NOT: { dateArchivage: null } } })
  console.log(`✅ Terminé : ${inseres} enregistrements (${actifs} actifs, ${archives} archivés)`)
  console.log(`   Référentiels : ${CATEGORIES.length} catégories, ${DESTINATIONS.length} destinations, ${MARQUES.length} marques, ${UTILISATEURS.length} utilisateurs, 1 assureur (3 tarifs)`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
