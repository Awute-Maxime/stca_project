export interface WheelItem {
  id: 'enregistrement' | 'destination' | 'analyse' | 'listeVehicules' | 'rechercheImmat' | 'rechercheChassis'
  label: string
  /** Position en pourcentage relatif au conteneur circulaire (centre = 50/50) */
  top: number
  left: number
}

export const WHEEL_ITEMS: WheelItem[] = [
  { id: 'enregistrement',  label: 'Enregistrement',      top: 12, left: 50 },
  { id: 'destination',     label: 'Destination',         top: 50, left: 10 },
  { id: 'analyse',         label: 'Analyse',             top: 50, left: 90 },
  { id: 'listeVehicules',  label: 'Liste Véhicules',     top: 84, left: 22 },
  { id: 'rechercheImmat',  label: 'Recherche IMMAT.',    top: 84, left: 78 },
  { id: 'rechercheChassis',label: 'Recherche N°Chassis', top: 92, left: 50 }
]

interface NavigationWheelProps {
  onSelect: (id: WheelItem['id']) => void
}

export default function NavigationWheel({ onSelect }: NavigationWheelProps): JSX.Element {
  return (
    <div style={{
      position: 'relative',
      width: 360,
      height: 360,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 50% 40%, #EAF2FB 0%, #C9DCF2 100%)',
      border: '1px solid #A9C3DE'
    }}>
      {WHEEL_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            position: 'absolute',
            top: `${item.top}%`,
            left: `${item.left}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            color: '#39577A',
            width: 90
          }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: 6,
            background: '#FFFFFF', border: '1px solid #B9CEE6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} />
          <span>{item.label}</span>
        </button>
      ))}

      {/* Bouton central — accueil / mise en veille */}
      <button
        aria-label="Bouton power — accueil"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 84,
          height: 84,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D8D8D8 60%, #B0B0B0 100%)',
          border: '1px solid #9A9A9A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <span style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FF7B4A 0%, #D9420C 70%)',
          border: '2px solid #FFFFFF'
        }} />
      </button>
    </div>
  )
}
