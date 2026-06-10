import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { electronApi } from '@api/electron'

const SPLASH_DURATION = 2800

type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }

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
    background: 'linear-gradient(145deg, #00432F 0%, #006A4E 40%, #004A35 100%)',
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
      {/* Grille décorative */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,223,0,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      {/* Halo lumineux central */}
      <div style={{
        position: 'absolute',
        width: 400, height: 200,
        background: 'radial-gradient(ellipse, rgba(255,223,0,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Logo TCIT */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 22, marginBottom: 24,
        animation: 'splashLogoUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both',
      }}>
        {/* Étoile togolaise */}
        <svg width="60" height="60" viewBox="0 0 56 56" style={{ filter: 'drop-shadow(0 0 12px rgba(255,223,0,0.6))' }}>
          <polygon
            points="28,2 33.8,18.4 51.8,18.4 37.4,28.4 43.2,44.8 28,34.8 12.8,44.8 18.6,28.4 4.2,18.4 22.2,18.4"
            fill="#FFDF00"
          />
        </svg>

        {/* Séparateur */}
        <div style={{ width: 1, height: 70, background: 'linear-gradient(to bottom, transparent, rgba(255,223,0,0.5), transparent)' }} />

        {/* Texte */}
        <div>
          <div style={{
            color: '#FFFFFF',
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: 8,
            lineHeight: 1,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            textShadow: '0 0 40px rgba(255,255,255,0.3)',
          }}>
            TCIT
          </div>
          <div style={{
            width: 190, height: 2,
            background: 'linear-gradient(90deg, #D21034 0%, #FFDF00 50%, #D21034 100%)',
            borderRadius: 1, marginTop: 5, marginBottom: 7,
          }} />
          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 9,
            letterSpacing: 1.5,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            textTransform: 'uppercase',
            lineHeight: 1.5,
          }}>
            Togolaise de Contrôle<br />et d'Immatriculation Transit
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{
        width: 190, height: 2,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 2, overflow: 'hidden',
        animation: 'splashLogoUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'linear-gradient(90deg, #FFDF00, #D21034, #FFDF00)',
          backgroundSize: '200% 100%',
          animation: `splashProgress ${SPLASH_DURATION}ms linear forwards, splashShimmer 1.5s linear infinite`,
        }} />
      </div>

      {/* Bande drapeau Togo */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: '#006A4E' }} />
        <div style={{ flex: 1, background: '#FFDF00' }} />
        <div style={{ flex: 1, background: '#D21034' }} />
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splashLogoUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes splashShimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
