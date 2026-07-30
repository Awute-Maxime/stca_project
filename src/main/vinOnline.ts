// Décodage VIN EN LIGNE via NHTSA vPIC (US DOT, gratuit, sans clé). Exécuté côté MAIN
// (la CSP renderer interdit le réseau externe). fetch global (Node 18 / Electron 28).
export type CategorieVin = 'Voiture' | 'Camion' | 'Autre'

export interface ResultatVinEnLigne {
  ok: boolean
  erreur?: string
  constructeur: string
  pays: string
  annee: string
  marque: string
  modele: string
  typeVehicule: string
  categorie: CategorieVin | null
}

/** Mappe le VehicleType / BodyClass NHTSA vers nos catégories. */
export function mapNhtsaCategorie(vehicleType: string, bodyClass: string): CategorieVin | null {
  const vt = (vehicleType || '').toUpperCase()
  const bc = (bodyClass || '').toUpperCase()
  if (vt.includes('TRUCK') || bc.includes('PICKUP') || bc.includes('TRACTOR') || bc.includes('CAB')) return 'Camion'
  if (vt.includes('BUS') || vt.includes('MOTORCYCLE') || vt.includes('TRAILER') || bc.includes('VAN') || bc.includes('BUS')) return 'Autre'
  if (vt.includes('PASSENGER') || vt.includes('MPV') || vt.includes('MULTIPURPOSE')) return 'Voiture'
  if (bc.includes('SUV') || bc.includes('SEDAN') || bc.includes('HATCHBACK') || bc.includes('WAGON') || bc.includes('COUPE')) return 'Voiture'
  if (bc.includes('PICKUP')) return 'Camion'
  return null
}

const champ = (arr: Array<{ Variable: string; Value: string | null }>, nom: string): string =>
  (arr.find(x => x.Variable === nom)?.Value ?? '').trim()

/** Interroge NHTSA vPIC (timeout 6 s). Retourne un résultat mappé, ou ok:false. */
export async function decoderVinEnLigne(vin: string): Promise<ResultatVinEnLigne> {
  const vide: ResultatVinEnLigne = { ok: false, constructeur: 'Inconnu', pays: '—', annee: '—', marque: '', modele: '', typeVehicule: '', categorie: null }
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 6000)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) return { ...vide, erreur: `HTTP ${r.status}` }
    const j = await r.json() as { Results: Array<{ Variable: string; Value: string | null }> }
    const res = j.Results ?? []
    const make = champ(res, 'Make')
    const manuf = champ(res, 'Manufacturer Name')
    const annee = champ(res, 'Model Year')
    const type = champ(res, 'Vehicle Type')
    const body = champ(res, 'Body Class')
    const modele = champ(res, 'Model')
    const errCode = champ(res, 'Error Code')
    const ok = (make !== '' || manuf !== '') && errCode !== '11' // 11 = VIN inconnu de la base
    return {
      ok,
      constructeur: make || manuf || 'Inconnu',
      pays: champ(res, 'Plant Country') || '—',
      annee: annee || '—',
      marque: make, modele,
      typeVehicule: type || body || '',
      categorie: mapNhtsaCategorie(type, body),
      erreur: ok ? undefined : 'VIN non reconnu par NHTSA',
    }
  } catch (e) {
    return { ...vide, erreur: e instanceof Error && e.name === 'AbortError' ? 'Délai dépassé' : 'Réseau indisponible' }
  } finally {
    clearTimeout(t)
  }
}
