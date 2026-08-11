import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { electronApi } from '@api/electron'

type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }

interface MenuBarProps {
  utilisateurLogin: string
  onMenuItemClick: (key: string) => void
}

const items: MenuProps['items'] = [
  {
    key: 'fichier',
    label: 'Fichier',
    children: [
      {
        key: 'fichier.historiques',
        label: '🗂️  Gestion des Historiques de Saisie',
        children: [
          { key: 'fichier.marques', label: '🚗  Marques & Modèles' },
          { key: 'historique.nom', label: '👤  Noms & Prénoms' },
          { key: 'historique.pays', label: '🌍  Pays' },
          { key: 'historique.parc', label: '🅿️  Parcs de provenance' },
          { key: 'historique.transit', label: '🏢  Maisons de transit' },
          { key: 'historique.chassis', label: '🔩  Préfixes de châssis' },
        ],
      },
      { key: 'fichier.decodeurVin', label: '🔎  Décoder un N° de châssis (VIN)' },
      { type: 'divider' },
      { key: 'fichier.fermerSession', label: '🔒  Fermer la session' },
      { key: 'fichier.quitter', label: '🚪  Quitter' },
    ],
  },
  {
    key: 'enregistrements',
    label: 'Enregistrements des véhicules',
    children: [
      { key: 'enregistrements.outils', label: '🧰  Affichage fenêtre outils lancement fonctions STCA', disabled: true },
      { key: 'enregistrement', label: '📝  Enregistrer un véhicule' },
      { key: 'listeVehicules', label: '📋  Consulter / Modifier / Supprimer un véhicule enregistré' },
      { key: 'enregistrements.listeParDest', label: '📍  Liste des véhicules enregistrés par destination' },
      { key: 'enregistrements.opsParticulieres', label: '📑  Liste des Opérations Particulières' },
    ],
  },
  {
    key: 'analyse',
    label: 'Analyse',
    children: [
      { key: 'analyse.stca', label: "📊  Edition des rapports d'analyse" },
    ],
  },
  {
    key: 'assurances',
    label: 'Assurances',
    children: [
      { key: 'assurances.montantRestituer', label: '💰  Montant à restituer' },
    ],
  },
  {
    key: 'outils',
    label: 'Outils+Config.',
    children: [
      { key: 'outils.sauvegardeBd', label: '💾  Sauvegarde la Base de Données', disabled: true },
      { key: 'outils.clefAdmin', label: "🔑  Clef d'administration" },
      { key: 'outils.archivage', label: '📦  Archivage' },
      { type: 'divider' },
      { key: 'outils.fixerRef', label: '🔢  Fixer N° Référence' },
      { type: 'divider' },
      { key: 'outils.impressionPlaque', label: "🏷️  Impression de plaque d'immatriculation", disabled: true },
      { key: 'outils.posteImmat', label: '🔌  Configuration des connexions' },
      { key: 'outils.configAssurances', label: '🛡️  Configuration Assurances' },
      { key: 'outils.typesVehicule', label: '🚙  Types Véhicule' },
      { key: 'outils.paramDestinations', label: '🗺️  Paramètres Destinations' },
      { key: 'outils.configImprimantes', label: '🖨️  Config. Imprimantes' },
      { type: 'divider' },
      { key: 'outils.exporter', label: '📤  Exporter les enregistrements de véhicules' },
      { key: 'outils.pointage', label: '📌  Pointage des véhicules' },
    ],
  },
  {
    key: 'aide',
    label: '?',
    children: [
      { key: 'aide.copyright', label: '©️  Copyright' },
      { key: 'aide.version', label: 'ℹ️  Version' },
      { key: 'aide.idReseau', label: '🌐  ID réseau' },
    ],
  },
]

export default function MenuBar({ utilisateurLogin, onMenuItemClick }: MenuBarProps): JSX.Element {
  return (
    <div style={{ flexShrink: 0 }}>

      {/* ── Barre de titre — prototype: #tb ──────────────────────────── */}
      <div style={{
        height: 32,
        background: 'var(--tc-titlebar)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        flexShrink: 0,
        userSelect: 'none',
        WebkitAppRegion: 'drag',
      } as DragCSS}>

        {/* Titre centré — prototype: #tb-t */}
        <div style={{
          flex: 1, textAlign: 'center',
          fontSize: 11.5, fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: 0.4,
        }}>
          TCIT : Enregistrement des Véhicules
        </div>

        {/* Utilisateur — prototype: #tb-u — point vert = session connectée */}
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.85)',
          marginRight: 10,
        }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: '#4ADE80', marginRight: 6, flexShrink: 0,
            boxShadow: '0 0 4px #4ADE80',
          }} />
          utilisateur : <b style={{ marginLeft: 3 }}>{utilisateurLogin}</b>
        </span>

        {/* Boutons fenêtre — prototype: .wc */}
        <div style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' } as DragCSS}>
          <button
            title="Réduire"
            style={{
              width: 28, height: 22, border: 'none', background: 'none',
              color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 3, transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            onClick={electronApi.minimizeWindow}
          >−</button>

          <button
            title="Agrandir"
            style={{
              width: 28, height: 22, border: 'none', background: 'none',
              color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 3, transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            onClick={electronApi.maximizeWindow}
          >□</button>

          <button
            title="Quitter"
            style={{
              width: 28, height: 22, border: 'none', background: 'none',
              color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 3, transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = '#E81123'; b.style.color = '#fff'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'none'; b.style.color = 'rgba(255,255,255,0.65)'
            }}
            onClick={electronApi.closeWindow}
          >✕</button>
        </div>
      </div>

      {/* ── Barre de menus — prototype: #mb ──────────────────────────── */}
      <Menu
        mode="horizontal"
        selectable={false}
        items={items}
        onClick={({ key }) => onMenuItemClick(key)}
        style={{
          height: 28,
          lineHeight: '28px',
          background: 'var(--tc-menu-bg)',
          borderBottom: '1px solid var(--tc-menu-bd)',
          padding: '0 8px',
          fontSize: 11.5,
          color: 'var(--tc-menu-tx)',
          boxShadow: 'none',
        }}
      />
    </div>
  )
}
