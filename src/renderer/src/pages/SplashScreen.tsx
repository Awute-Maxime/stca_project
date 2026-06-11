import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { electronApi } from '@api/electron'

const SPLASH_DURATION = 1400

type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }

// Voiture wireframe en fibres de lumière cyan
function CarWireframe(): JSX.Element {
  return (
    <svg
      viewBox="0 0 310 135"
      width="310"
      height="135"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.7))' }}
    >
      <defs>
        <linearGradient id="carGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#00D4FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowSoft">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* === Lignes de vitesse (speed lines à gauche) === */}
      {[58, 66, 72, 78, 85, 91, 97].map((y, i) => (
        <line key={i}
          x1={0} y1={y} x2={10 + (i % 3) * 5} y2={y}
          stroke="#00D4FF" strokeWidth="0.8"
          opacity={0.15 + (i * 0.05)}
        />
      ))}

      {/* === Lignes de fibres décoratives === */}
      {/* fibres émanant de la carrosserie vers l'extérieur */}
      <line x1="88" y1="45" x2="70" y2="18" stroke="#38BDF8" strokeWidth="0.6" opacity="0.25" />
      <line x1="105" y1="40" x2="95" y2="12" stroke="#00D4FF" strokeWidth="0.5" opacity="0.2" />
      <line x1="180" y1="40" x2="188" y2="14" stroke="#38BDF8" strokeWidth="0.6" opacity="0.2" />
      <line x1="200" y1="46" x2="222" y2="20" stroke="#00D4FF" strokeWidth="0.5" opacity="0.25" />
      <line x1="240" y1="68" x2="265" y2="52" stroke="#38BDF8" strokeWidth="0.5" opacity="0.18" />
      <line x1="148" y1="40" x2="148" y2="8" stroke="#00D4FF" strokeWidth="0.5" opacity="0.15" />
      <line x1="48" y1="75" x2="28" y2="58" stroke="#38BDF8" strokeWidth="0.5" opacity="0.2" />

      {/* === Corps de la voiture (outline principal) === */}
      <path
        d="M 14,108
           L 20,100
           L 28,90
           L 44,72
           L 62,56
           L 80,44
           L 96,40
           L 192,40
           L 212,46
           L 234,62
           L 250,78
           L 258,90
           L 262,100
           L 264,108
           Z"
        stroke="url(#carGrad)"
        strokeWidth="1.5"
        filter="url(#glow)"
      />

      {/* === Intérieur / toit vitré === */}
      <path
        d="M 86,44 L 96,40 L 192,40 L 210,46 L 200,72 L 100,72 Z"
        stroke="#00D4FF"
        strokeWidth="1"
        opacity="0.35"
        filter="url(#glowSoft)"
      />

      {/* === Ligne de fenêtres === */}
      <path
        d="M 100,72 L 150,72 L 200,72"
        stroke="#38BDF8"
        strokeWidth="0.8"
        opacity="0.4"
        strokeDasharray="4 3"
      />

      {/* === Ligne de caisse (bande de décor latérale) === */}
      <path
        d="M 32,90 L 80,84 L 192,84 L 248,86"
        stroke="#0EA5E9"
        strokeWidth="0.7"
        opacity="0.4"
        strokeDasharray="6 4"
      />

      {/* === Roue avant === */}
      <circle cx="80" cy="109" r="24" stroke="#00D4FF" strokeWidth="1.4" filter="url(#glow)" />
      <circle cx="80" cy="109" r="16" stroke="#38BDF8" strokeWidth="0.9" opacity="0.7" />
      <circle cx="80" cy="109" r="9"  stroke="#0EA5E9" strokeWidth="0.7" opacity="0.5" />
      <circle cx="80" cy="109" r="3"  fill="#00D4FF" opacity="0.8" />
      {/* rayons roue avant */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <line key={i}
          x1={80 + 9 * Math.cos(angle * Math.PI / 180)}
          y1={109 + 9 * Math.sin(angle * Math.PI / 180)}
          x2={80 + 16 * Math.cos(angle * Math.PI / 180)}
          y2={109 + 16 * Math.sin(angle * Math.PI / 180)}
          stroke="#38BDF8" strokeWidth="0.8" opacity="0.6"
        />
      ))}

      {/* === Roue arrière === */}
      <circle cx="210" cy="109" r="24" stroke="#00D4FF" strokeWidth="1.4" filter="url(#glow)" />
      <circle cx="210" cy="109" r="16" stroke="#38BDF8" strokeWidth="0.9" opacity="0.7" />
      <circle cx="210" cy="109"  r="9" stroke="#0EA5E9" strokeWidth="0.7" opacity="0.5" />
      <circle cx="210" cy="109"  r="3" fill="#00D4FF" opacity="0.8" />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <line key={i}
          x1={210 + 9 * Math.cos(angle * Math.PI / 180)}
          y1={109 + 9 * Math.sin(angle * Math.PI / 180)}
          x2={210 + 16 * Math.cos(angle * Math.PI / 180)}
          y2={109 + 16 * Math.sin(angle * Math.PI / 180)}
          stroke="#38BDF8" strokeWidth="0.8" opacity="0.6"
        />
      ))}

      {/* === Phare avant === */}
      <ellipse cx="26" cy="84" rx="7" ry="4" fill="#00D4FF" opacity="0.9" filter="url(#glow)" />
      <ellipse cx="26" cy="84" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.8" />
      {/* faisceau phare */}
      <path d="M 20,82 L 2,74 M 20,84 L 2,84 M 20,86 L 4,92"
        stroke="#00D4FF" strokeWidth="0.6" opacity="0.3" />

      {/* === Feux arrière === */}
      <rect x="256" y="82" width="8" height="16" rx="2"
        fill="#FF3B6B" opacity="0.85" filter="url(#glowSoft)" />
      <rect x="258" y="84" width="4" height="12" rx="1"
        fill="#FF6B8A" opacity="0.7" />

      {/* === Particules flottantes === */}
      <circle cx="140" cy="14"  r="1.5" fill="#00D4FF" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.3s" repeatCount="indefinite" />
      </circle>
      <circle cx="58"  cy="22"  r="1"   fill="#38BDF8" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.1s" repeatCount="indefinite" />
      </circle>
      <circle cx="250" cy="28"  r="1.5" fill="#00D4FF" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2.7s" repeatCount="indefinite" />
      </circle>
      <circle cx="290" cy="70"  r="1"   fill="#38BDF8" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.9s" repeatCount="indefinite" />
      </circle>
      <circle cx="10"  cy="100" r="1"   fill="#0EA5E9" opacity="0.35">
        <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="110" r="1.2" fill="#00D4FF" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export default function SplashScreen(): JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      electronApi.resizeForLogin()
      navigate('/login', { replace: true })
    }, SPLASH_DURATION)
    return () => clearTimeout(timer)
  }, [navigate])

  const outerStyle: DragCSS = {
    width: '100vw',
    height: '100vh',
    background: 'radial-gradient(ellipse at 35% 40%, #0D2347 0%, #061028 55%, #020810 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    userSelect: 'none',
    WebkitAppRegion: 'drag',
    animation: 'splashFadeIn 0.5s ease-out both',
  }

  return (
    <div style={outerStyle}>
      {/* Grille de fond (légère) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.06) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Halo central bleu */}
      <div style={{
        position: 'absolute',
        width: 420, height: 220,
        background: 'radial-gradient(ellipse, rgba(14,165,233,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Voiture wireframe */}
      <div style={{
        animation: 'splashCarIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s both',
        marginBottom: 20,
      }}>
        <CarWireframe />
      </div>

      {/* Texte TCIT */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10,
        animation: 'splashTextIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both',
      }}>
        {/* Étoile togolaise */}
        <svg width="26" height="26" viewBox="0 0 56 56" style={{ filter: 'drop-shadow(0 0 6px rgba(255,223,0,0.8))' }}>
          <polygon
            points="28,2 33.8,18.4 51.8,18.4 37.4,28.4 43.2,44.8 28,34.8 12.8,44.8 18.6,28.4 4.2,18.4 22.2,18.4"
            fill="#FFDF00"
          />
        </svg>

        <div>
          <div style={{
            color: '#FFFFFF',
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 7,
            lineHeight: 1,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            textShadow: '0 0 30px rgba(0,212,255,0.5)',
          }}>
            TCIT
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{
        width: 200, height: 1,
        background: 'linear-gradient(90deg, transparent, #00D4FF 30%, #38BDF8 70%, transparent)',
        marginBottom: 8,
        animation: 'splashTextIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both',
      }} />

      {/* Sous-titre */}
      <div style={{
        color: 'rgba(56,189,248,0.7)',
        fontSize: 9,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        animation: 'splashTextIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both',
        marginBottom: 18,
      }}>
        Togolaise de Contrôle et d'Immatriculation Transit
      </div>

      {/* Barre de progression */}
      <div style={{
        width: 200, height: 2,
        background: 'rgba(0,212,255,0.15)',
        borderRadius: 2, overflow: 'hidden',
        animation: 'splashTextIn 0.5s ease 0.6s both',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'linear-gradient(90deg, #0EA5E9, #00D4FF, #38BDF8)',
          animation: `splashProgress ${SPLASH_DURATION}ms linear forwards`,
        }} />
      </div>

      {/* Bande drapeau Togo */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#006A4E' }} />
        <div style={{ flex: 1, background: '#FFDF00' }} />
        <div style={{ flex: 1, background: '#D21034' }} />
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splashCarIn {
          from { opacity: 0; transform: translateX(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
