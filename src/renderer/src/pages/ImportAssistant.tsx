import { useState, useMemo, useEffect } from 'react'
import { Steps, Button, Select, Alert, Progress, Tag, Empty } from 'antd'
import {
  FileSearchOutlined, PartitionOutlined, CloudUploadOutlined,
  CheckCircleOutlined, WarningOutlined, FolderOpenOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { electronApi, type ImportPreview, type ImportReport } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Assistant d'import de l'ancienne base STCA (export CSV) → base TCIT.
// 3 étapes : Fichier (choix + aperçu) · Correspondance (colonnes, pré-remplie) ·
// Import (lancement + rapport). Le moteur est côté main (import.ts) via IPC.
// ─────────────────────────────────────────────────────────────────────────────

const C = { blue: '#1B3A6B', accent: '#2563EB', green: '#16A34A', gold: '#F59E0B', muted: '#6B7280', border: '#E2E8F0', bg: '#F8FAFF', danger: '#DC2626' }

// Champs cibles + alias pour la correspondance automatique (noms STCA M)
const CHAMPS: { cle: string; libelle: string; requis: boolean; alias: string[] }[] = [
  { cle: 'numRef',                  libelle: 'N° Référence',             requis: true,  alias: ['numref', 'reference', 'ref'] },
  { cle: 'nomPrenomProprio',        libelle: 'Nom et prénom',            requis: true,  alias: ['nomprenomproprio', 'nomprenom', 'nomproprio', 'nom'] },
  { cle: 'adresseProprio',          libelle: 'Adresse',                  requis: false, alias: ['adresseproprio', 'adresse'] },
  { cle: 'codeTransit',             libelle: 'Code frontière',           requis: true,  alias: ['codetransit', 'code', 'frontiere'] },
  { cle: 'categorieRang',           libelle: 'Catégorie (rang)',         requis: false, alias: ['categorievehicule', 'categorie', 'rang'] },
  { cle: 'marqueModele',            libelle: 'Marque et modèle',         requis: true,  alias: ['marquemodele', 'marque', 'modele'] },
  { cle: 'vin',                     libelle: 'N° Châssis (VIN)',         requis: true,  alias: ['vinvehicule', 'vin', 'chassis', 'numchassis'] },
  { cle: 'numImmatriculation',      libelle: 'N° Immatriculation',       requis: true,  alias: ['numimmatriculation', 'immatriculation', 'immat', 'plaque'] },
  { cle: 'numTri',                  libelle: 'N° de Tri',                requis: false, alias: ['numtri', 'tri'] },
  { cle: 'montant',                 libelle: 'Montant',                  requis: false, alias: ['montantenregistrement', 'montant'] },
  { cle: 'dateEnreg',               libelle: "Date d'enregistrement",    requis: false, alias: ['dateenreg', 'dateenregistrement', 'date'] },
  { cle: 'flagSortie',              libelle: 'Sorti (oui/non)',          requis: false, alias: ['flagsortie', 'sortie', 'sorti'] },
  { cle: 'dateSortie',              libelle: 'Date de sortie',           requis: false, alias: ['datesortie'] },
  { cle: 'nomUtilisateur',          libelle: 'Agent',                    requis: false, alias: ['nomutilisateur', 'utilisateur', 'agent'] },
  { cle: 'maisonTransit',           libelle: 'Maison de transit',        requis: false, alias: ['maisontransit', 'transit'] },
  { cle: 'nomDuParc',               libelle: 'Nom du parc',              requis: false, alias: ['nomduparc', 'parc'] },
  { cle: 'ancienneImmatriculation', libelle: 'Ancienne immatriculation', requis: false, alias: ['ancienneimmatriculation', 'ancienneimmat'] },
  { cle: 'dateAncienneCG',          libelle: 'Date ancienne CG',         requis: false, alias: ['dateanciennecg', 'anciennecg'] },
  { cle: 'dateArchivage',           libelle: "Date d'archivage",         requis: false, alias: ['datearchivage', 'archivage'] },
]

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function autoMapper(colonnes: string[]): Record<string, string | undefined> {
  const map: Record<string, string | undefined> = {}
  const normCols = colonnes.map(c => ({ brut: c, n: norm(c) }))
  for (const champ of CHAMPS) {
    const exact = normCols.find(c => champ.alias.includes(c.n))
    const partiel = exact ?? normCols.find(c => champ.alias.some(a => c.n.includes(a) || a.includes(c.n)))
    map[champ.cle] = partiel?.brut
  }
  return map
}

export default function ImportAssistant(): JSX.Element {
  const [etape, setEtape] = useState(0)
  const [chemin, setChemin] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [chargement, setChargement] = useState(false)
  const [mapping, setMapping] = useState<Record<string, string | undefined>>({})
  const [running, setRunning] = useState(false)
  const [progres, setProgres] = useState<{ traite: number; importes: number } | null>(null)
  const [rapport, setRapport] = useState<ImportReport | null>(null)

  // Abonnement à la progression de l'import (émise par le main)
  useEffect(() => {
    const off = electronApi.onImportProgress(setProgres)
    return off
  }, [])

  const colonnes = preview?.columns ?? []
  const optionsColonnes = useMemo(
    () => [{ value: '', label: '— (ignorer) —' }, ...colonnes.map(c => ({ value: c, label: c }))],
    [colonnes],
  )
  const requisManquants = CHAMPS.filter(c => c.requis && !mapping[c.cle]).map(c => c.libelle)
  const pretPourImport = preview?.ok && requisManquants.length === 0

  const choisirFichier = async (): Promise<void> => {
    const p = await electronApi.importPickFile()
    if (!p) return
    await chargerFichier(p)
  }

  const chargerFichier = async (p: string): Promise<void> => {
    setChemin(p)
    setChargement(true)
    setRapport(null)
    const pv = await electronApi.importPreview(p)
    setPreview(pv)
    if (pv.ok && pv.columns) setMapping(autoMapper(pv.columns))
    setChargement(false)
  }

  const lancer = async (): Promise<void> => {
    if (!chemin || !preview?.delimiter) return
    setRunning(true)
    setProgres({ traite: 0, importes: 0 })
    setRapport(null)
    const r = await electronApi.importRun({ chemin, mapping, delimiter: preview.delimiter })
    setRapport(r)
    setRunning(false)
    setProgres(null)
  }

  const nomFichier = chemin ? chemin.replace(/^.*[\\/]/, '') : ''

  // ── Styles ──────────────────────────────────────────────────────────────────
  const label9: React.CSSProperties = { fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }
  const cell: React.CSSProperties = { fontSize: 11.5, padding: '5px 8px', borderBottom: '1px solid #EEF2F7' }

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <Steps size="small" current={etape} style={{ marginBottom: 14 }}
        items={[
          { title: 'Fichier', icon: <FileSearchOutlined /> },
          { title: 'Correspondance', icon: <PartitionOutlined /> },
          { title: 'Import', icon: <CloudUploadOutlined /> },
        ]} />

      {/* ── Étape 0 : Fichier ─────────────────────────────────────────────── */}
      {etape === 0 && (
        <div>
          <Alert type="info" showIcon style={{ marginBottom: 12, fontSize: 11.5 }}
            message="Import de l'ancienne base STCA"
            description="Sélectionnez un export CSV de la base STCA. Les données importées alimenteront la nouvelle base et deviendront visibles dans l'application après la bascule (Phase 3)." />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <Button type="primary" icon={<FolderOpenOutlined />} onClick={choisirFichier} loading={chargement}
              style={{ background: C.blue, borderColor: C.blue }}>
              Choisir le fichier CSV…
            </Button>
            {nomFichier && <Tag color="blue" style={{ fontFamily: 'monospace' }}>{nomFichier}</Tag>}
          </div>

          {preview && !preview.ok && (
            <Alert type="error" showIcon message="Fichier illisible" description={preview.error} style={{ fontSize: 11 }} />
          )}

          {preview?.ok && (
            <>
              <div style={{ display: 'flex', gap: 18, padding: '8px 12px', background: C.bg, border: '1px solid #DDEAFF', borderRadius: 7, marginBottom: 10, fontSize: 11.5 }}>
                <span><span style={{ color: C.muted }}>Lignes (env.) : </span><strong style={{ color: C.blue }}>{preview.totalApprox?.toLocaleString('fr-FR')}</strong></span>
                <span><span style={{ color: C.muted }}>Colonnes : </span><strong style={{ color: C.blue }}>{colonnes.length}</strong></span>
                <span><span style={{ color: C.muted }}>Séparateur : </span><strong style={{ color: C.blue }}>{preview.delimiter === '\t' ? 'Tabulation' : preview.delimiter}</strong></span>
              </div>
              <div style={{ ...label9, marginBottom: 4 }}>Aperçu (premières lignes)</div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 7, overflow: 'auto', maxHeight: 220 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 10.5, whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>{colonnes.map(c => (
                      <th key={c} style={{ ...cell, position: 'sticky', top: 0, background: '#EEF3FB', color: C.blue, fontWeight: 700, textAlign: 'left' }}>{c}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {(preview.rows ?? []).slice(0, 8).map((r, i) => (
                      <tr key={i}>{r.map((v, j) => <td key={j} style={cell}>{v}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Étape 1 : Correspondance ──────────────────────────────────────── */}
      {etape === 1 && (
        <div>
          <Alert type={requisManquants.length ? 'warning' : 'success'} showIcon style={{ marginBottom: 10, fontSize: 11 }}
            message={requisManquants.length
              ? `Champs requis non associés : ${requisManquants.join(', ')}`
              : 'Tous les champs requis sont associés — prêt pour l\'import.'} />
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 7, overflow: 'auto', maxHeight: 320 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...cell, background: '#EEF3FB', color: C.blue, fontWeight: 700, textAlign: 'left', width: '45%' }}>Champ TCIT</th>
                  <th style={{ ...cell, background: '#EEF3FB', color: C.blue, fontWeight: 700, textAlign: 'left' }}>Colonne du fichier</th>
                </tr>
              </thead>
              <tbody>
                {CHAMPS.map(champ => (
                  <tr key={champ.cle}>
                    <td style={cell}>
                      <span style={{ color: C.blue, fontWeight: 600 }}>{champ.libelle}</span>
                      {champ.requis && <span style={{ color: C.danger, marginLeft: 4 }}>*</span>}
                    </td>
                    <td style={cell}>
                      <Select size="small" style={{ width: '100%', maxWidth: 260 }}
                        value={mapping[champ.cle] ?? ''}
                        status={champ.requis && !mapping[champ.cle] ? 'error' : undefined}
                        onChange={v => setMapping(m => ({ ...m, [champ.cle]: v || undefined }))}
                        options={optionsColonnes} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 6 }}>
            <span style={{ color: C.danger }}>*</span> champ requis. Correspondance pré-remplie automatiquement — ajustez si besoin.
          </div>
        </div>
      )}

      {/* ── Étape 2 : Import ──────────────────────────────────────────────── */}
      {etape === 2 && (
        <div>
          {!rapport && !running && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 12.5, color: C.blue, marginBottom: 4 }}>
                Prêt à importer environ <strong>{preview?.totalApprox?.toLocaleString('fr-FR')}</strong> enregistrement(s)
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
                Les doublons (référence, châssis, couple immat.+frontière) seront ignorés automatiquement.
              </div>
              <Button type="primary" size="large" icon={<CloudUploadOutlined />} onClick={lancer} disabled={!pretPourImport}
                style={{ background: C.green, borderColor: C.green }}>
                Lancer l'import
              </Button>
            </div>
          )}

          {running && (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <Progress
                percent={preview?.totalApprox ? Math.min(99, Math.round(((progres?.traite ?? 0) / preview.totalApprox) * 100)) : 0}
                status="active" strokeColor={C.accent} />
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>
                {(progres?.traite ?? 0).toLocaleString('fr-FR')} ligne(s) traitée(s) · {(progres?.importes ?? 0).toLocaleString('fr-FR')} importée(s)…
              </div>
            </div>
          )}

          {rapport && (
            <div>
              <Alert type={rapport.ok ? 'success' : 'error'} showIcon icon={rapport.ok ? <CheckCircleOutlined /> : <WarningOutlined />}
                message={rapport.ok ? 'Import terminé' : 'Import interrompu'}
                description={rapport.error} style={{ marginBottom: 12, fontSize: 11.5 }} />
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {[
                  { l: 'Lues', v: rapport.total, c: C.blue },
                  { l: 'Importées', v: rapport.importes, c: C.green },
                  { l: 'Doublons ignorés', v: rapport.doublons, c: C.gold },
                  { l: 'Erreurs', v: rapport.erreurs.length, c: C.danger },
                ].map(s => (
                  <div key={s.l} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v.toLocaleString('fr-FR')}</div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {rapport.erreurs.length > 0 ? (
                <>
                  <div style={{ ...label9, marginBottom: 4 }}>Détail des erreurs</div>
                  <div style={{ border: `1px solid #FECACA`, borderRadius: 7, overflow: 'auto', maxHeight: 180, background: '#FFFBFB' }}>
                    {rapport.erreurs.slice(0, 200).map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 10px', borderBottom: '1px solid #FEE2E2', fontSize: 11 }}>
                        <span style={{ fontFamily: 'monospace', color: C.danger, minWidth: 64 }}>ligne {e.ligne}</span>
                        <span style={{ color: '#7F1D1D' }}>{e.raison}</span>
                      </div>
                    ))}
                    {rapport.erreurs.length > 200 && <div style={{ padding: '4px 10px', fontSize: 10.5, color: C.muted }}>… (+{rapport.erreurs.length - 200} autres)</div>}
                  </div>
                </>
              ) : (
                <Empty description="Aucune erreur" imageStyle={{ height: 40 }} />
              )}
              <Alert type="info" showIcon style={{ marginTop: 12, fontSize: 11 }}
                message="Les données importées apparaîtront dans l'application après la bascule du stockage vers la base (Phase 3)." />
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <Button disabled={etape === 0 || running} onClick={() => setEtape(e => e - 1)}>Précédent</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          {etape === 2 && rapport && (
            <Button icon={<ReloadOutlined />} onClick={() => { setEtape(0); setChemin(null); setPreview(null); setRapport(null); setMapping({}) }}>
              Nouvel import
            </Button>
          )}
          {etape < 2 && (
            <Button type="primary" onClick={() => setEtape(e => e + 1)}
              disabled={etape === 0 ? !preview?.ok : requisManquants.length > 0}
              style={{ background: C.blue, borderColor: C.blue }}>
              Suivant
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
