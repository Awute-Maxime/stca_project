import { useState, useRef, useEffect } from 'react'
import { LockOutlined, UserOutlined, EyeOutlined, EyeInvisibleOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { electronApi } from '@api/electron'
import { getAllUtilisateurs } from '@mock/utilisateursStore'

type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }

export default function LoginPage(): JSX.Element {
  const [username, setUsername]   = useState('awute')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [shaking, setShaking]     = useState(false)
  const passRef = useRef<HTMLInputElement>(null)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const isAdminUsername = getAllUtilisateurs().some(
    u => u.login.toLowerCase() === username.toLowerCase() && u.administrateur && u.compteActif
  )

  useEffect(() => {
    if (isAdminUsername) {
      electronApi.resizeForLoginAdmin()
    } else {
      electronApi.resizeForLogin()
    }
  }, [isAdminUsername])

  const handleValider = async (): Promise<void> => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 380))
      const found = getAllUtilisateurs().find(
        u => u.login.toLowerCase() === username.toLowerCase() && u.motDePasse === password && u.compteActif
      )
      if (found) {
        electronApi.resizeForMain()
        login({ id: found.id, login: found.login, nom: found.nom, role: found.administrateur ? 'admin' : 'agent' }, 'mock-token')
        navigate('/')
      } else {
        setError("Identifiants incorrects — vérifiez les minuscules / majuscules")
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGestionUtilisateurs = async (): Promise<void> => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 380))
      const found = getAllUtilisateurs().find(
        u => u.login.toLowerCase() === username.toLowerCase() && u.motDePasse === password && u.administrateur && u.compteActif
      )
      if (found) {
        electronApi.resizeForMain()
        login({ id: found.id, login: found.login, nom: found.nom, role: 'admin' }, 'mock-token')
        navigate('/', { state: { autoOpen: 'outils.gestionUtilisateurs' }, replace: true })
      } else {
        setError("Identifiants incorrects ou droits administrateur requis")
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
      }
    } finally {
      setLoading(false)
    }
  }

  const outerStyle: DragCSS = {
    width: '100vw', height: '100vh',
    background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', userSelect: 'none',
    WebkitAppRegion: 'drag',
  }

  const noDrag: DragCSS = { WebkitAppRegion: 'no-drag' }

  return (
    <div style={outerStyle}>
      {/* Carte glass */}
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(160deg, #081030 0%, #0a122c 100%)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: shaking ? 'cardShake 0.4s ease' : 'cardSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
        ...noDrag,
      } as React.CSSProperties}>

        {/* Header draggable */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(27,58,107,0.95) 0%, rgba(37,99,235,0.75) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          WebkitAppRegion: 'drag',
        } as DragCSS}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LockOutlined style={{ color: '#FFFFFF', fontSize: 15 }} />
            </div>
            <div>
              <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                Identification de l'utilisateur
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 1 }}>
                TCIT — Contrôle et Immatriculation Transit
              </div>
            </div>
          </div>

          <button
            style={{
              ...noDrag, width: 26, height: 26,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, color: 'rgba(255,255,255,0.6)',
              fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            } as React.CSSProperties}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'rgba(220,38,38,0.75)'
              b.style.color = '#fff'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'rgba(255,255,255,0.08)'
              b.style.color = 'rgba(255,255,255,0.6)'
            }}
            onClick={electronApi.closeWindow}
          >✕</button>
        </div>

        {/* Corps */}
        <div style={{ padding: '22px 24px 18px', flex: 1, ...noDrag } as React.CSSProperties}>
          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 14,
              fontSize: 11, color: '#FCA5A5',
              animation: 'errFadeIn 0.2s ease',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: 0.8 }}>
              NOM D'UTILISATEUR
            </label>
            <div style={{ position: 'relative' }}>
              <UserOutlined style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.25)', fontSize: 13, zIndex: 1,
              }} />
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') passRef.current?.focus() }}
                style={{
                  width: '100%', height: 36,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, color: '#E2E8F0', fontSize: 13,
                  paddingLeft: 32, paddingRight: 10, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, background 0.2s',
                  fontFamily: "'Segoe UI', Arial, sans-serif",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.7)'
                  e.currentTarget.style.background = 'rgba(37,99,235,0.08)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: 0.8 }}>
              MOT DE PASSE
            </label>
            <div style={{ position: 'relative' }}>
              <LockOutlined style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.25)', fontSize: 13, zIndex: 1,
              }} />
              <input
                ref={passRef}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleValider() }}
                autoFocus
                style={{
                  width: '100%', height: 36,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, color: '#E2E8F0', fontSize: 13,
                  paddingLeft: 32, paddingRight: 36, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, background 0.2s',
                  fontFamily: "'Segoe UI', Arial, sans-serif",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.7)'
                  e.currentTarget.style.background = 'rgba(37,99,235,0.08)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                }}
              />
              <button
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', fontSize: 14,
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
          </div>

          {isAdminUsername && (
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={handleGestionUtilisateurs}
                disabled={loading}
                style={{
                  width: '100%', height: 32,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 8,
                  color: '#F59E0B',
                  fontSize: 11, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'all 0.15s',
                  fontFamily: "'Segoe UI', Arial, sans-serif",
                  letterSpacing: 0.3,
                  ...noDrag,
                } as React.CSSProperties}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.2)' }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.1)' }}
              >
                <TeamOutlined style={{ fontSize: 13 }} />
                Gestion des utilisateurs
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setPassword(''); setError(null) }}
              style={{
                flex: 1, height: 36,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, color: 'rgba(255,255,255,0.8)', fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: "'Segoe UI', Arial, sans-serif",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
            >
              Annuler
            </button>
            <button
              onClick={handleValider}
              disabled={loading}
              style={{
                flex: 2, height: 36,
                background: loading ? 'rgba(37,99,235,0.4)' : 'linear-gradient(135deg, #2563EB 0%, #1B3A6B 100%)',
                border: '1px solid rgba(37,99,235,0.5)', borderRadius: 8,
                color: '#FFFFFF', fontSize: 12, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
                fontFamily: "'Segoe UI', Arial, sans-serif",
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(37,99,235,0.6)' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.4)' }}
            >
              <span style={{ display: 'inline-block', animation: loading ? 'spin 0.7s linear infinite' : 'none' }}>
                {loading ? '⟳' : '✓'}
              </span>
              Valider
            </button>
          </div>
        </div>

        {/* Bande drapeau Togo */}
        <div style={{ height: 4, display: 'flex' }}>
          <div style={{ flex: 1, background: '#006A4E' }} />
          <div style={{ flex: 1, background: '#FFDF00' }} />
          <div style={{ flex: 1, background: '#D21034' }} />
        </div>
      </div>

      <style>{`
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cardShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        @keyframes errFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px rgba(10,20,50,0.8) inset;
          -webkit-text-fill-color: #E2E8F0;
        }
      `}</style>
    </div>
  )
}
