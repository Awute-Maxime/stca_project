import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { electronApi } from '@api/electron'

const SPLASH_DURATION = 2800

export default function SplashScreen(): JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      electronApi.resizeForLogin()
      navigate('/login', { replace: true })
    }, SPLASH_DURATION)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #006A4E 0%, #004A35 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Logo TCIT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        {/* Étoile togolaise */}
        <svg width="56" height="56" viewBox="0 0 56 56">
          <polygon
            points="28,2 33.8,18.4 51.8,18.4 37.4,28.4 43.2,44.8 28,34.8 12.8,44.8 18.6,28.4 4.2,18.4 22.2,18.4"
            fill="#FFDF00"
            opacity="0.95"
          />
        </svg>

        {/* Séparateur vertical */}
        <div style={{ width: 2, height: 64, background: 'rgba(255,223,0,0.4)', borderRadius: 1 }} />

        {/* Texte */}
        <div>
          <div style={{
            color: '#FFFFFF',
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: 6,
            lineHeight: 1,
            fontFamily: "'Segoe UI', Arial, sans-serif",
          }}>
            TCIT
          </div>
          <div style={{
            width: 180,
            height: 2,
            background: 'linear-gradient(90deg, #D21034, #FFDF00, #D21034)',
            borderRadius: 1,
            marginTop: 4,
            marginBottom: 6,
          }} />
          <div style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 9.5,
            letterSpacing: 1.2,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            textTransform: 'uppercase',
            lineHeight: 1.4,
          }}>
            Togolaise de Contrôle<br />et d'Immatriculation Transit
          </div>
        </div>
      </div>

      {/* Barre de chargement animée */}
      <div style={{
        width: 180,
        height: 3,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 16,
      }}>
        <div style={{
          height: '100%',
          borderRadius: 2,
          background: 'linear-gradient(90deg, #FFDF00, #D21034)',
          animation: `splash-progress ${SPLASH_DURATION}ms linear forwards`,
        }} />
      </div>

      {/* Bande drapeau Togo en bas */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 5,
        display: 'flex',
      }}>
        <div style={{ flex: 1, background: '#006A4E' }} />
        <div style={{ flex: 1, background: '#FFDF00' }} />
        <div style={{ flex: 1, background: '#D21034' }} />
      </div>

      <style>{`
        @keyframes splash-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
