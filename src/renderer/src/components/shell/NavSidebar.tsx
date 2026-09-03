export interface SidebarItem {
  id: 'enregistrement' | 'destination' | 'analyse' | 'listeVehicules' | 'rechercheImmat' | 'rechercheChassis'
  label: string
  icon: string
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'enregistrement',   label: 'Enregistrement',      icon: '📄' },
  { id: 'destination',      label: 'Destination',         icon: '📍' },
  { id: 'analyse',          label: 'Analyse',             icon: '📊' },
  { id: 'listeVehicules',   label: 'Liste Véhicules',     icon: '☰' },
  { id: 'rechercheImmat',   label: 'Recherche IMMAT.',    icon: '🔍' },
  { id: 'rechercheChassis', label: 'Recherche N°Chassis', icon: '🚗' },
]

interface NavSidebarProps {
  onSelect: (id: SidebarItem['id']) => void
  activeId?: string
  onOpenParametres?: () => void
}

export default function NavSidebar({ onSelect, activeId, onOpenParametres }: NavSidebarProps): JSX.Element {
  return (
    <div style={{
      width: 100,
      flexShrink: 0,
      background: 'linear-gradient(180deg, var(--tc-sb-from) 0%, var(--tc-sb-to) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        width: 46, height: 46,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        marginBottom: 8,
        flexShrink: 0,
      }}>🚗</div>

      {/* Separator */}
      <div style={{
        width: '60%', height: 1,
        background: 'rgba(255,255,255,0.1)',
        margin: '6px 0',
        flexShrink: 0,
      }} />

      {/* Nav items */}
      {SIDEBAR_ITEMS.map(item => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            aria-label={item.label}
            className="nav-btn"
            onClick={() => onSelect(item.id)}
            style={{
              position: 'relative',
              width: 88,
              padding: '10px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              border: 'none',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              borderRadius: 8,
              transition: 'all 0.2s',
              margin: '1px 0',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = 'rgba(255,255,255,0.08)'
                b.style.color = 'rgba(255,255,255,0.9)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = 'none'
                b.style.color = 'rgba(255,255,255,0.6)'
              }
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                left: 0, top: '20%', bottom: '20%',
                width: 3, borderRadius: '0 3px 3px 0',
                background: 'var(--accent)',
              }} />
            )}
            <span className="nav-ico" style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 9.5, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>
              {item.label}
            </span>
          </button>
        )
      })}

      {/* Bouton Paramètres — poussé en bas (marginTop:auto), même style que les autres */}
      {onOpenParametres && (
        <button
          aria-label="Paramètres de l'application"
          className="nav-btn"
          onClick={onOpenParametres}
          style={{
            position: 'relative',
            width: 88,
            padding: '10px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: 'rgba(255,255,255,0.6)',
            borderRadius: 8,
            transition: 'all 0.2s',
            margin: '1px 0',
            marginTop: 'auto',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.background = 'rgba(255,255,255,0.08)'
            b.style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.background = 'none'
            b.style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          <span className="nav-ico" style={{ fontSize: 18 }}>⚙️</span>
          <span style={{ fontSize: 9.5, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>
            Paramètres
          </span>
        </button>
      )}
    </div>
  )
}
