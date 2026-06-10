import { useState } from 'react'
import { Input, Button } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { appColors } from '@theme/windev-theme'
import { electronApi } from '@api/electron'

export default function LoginPage(): JSX.Element {
  const [username, setUsername] = useState('awute')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleValider = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 400))
      if (username === 'awute' && password === 'Awmax') {
        electronApi.resizeForMain()
        login({ id: 1, login: 'awute', nom: 'Awute Maxime', role: 'admin' }, 'mock-token')
        navigate('/')
      } else {
        setError("Nom d'utilisateur ou mot de passe incorrect\n(respectez les minuscules / majuscules)")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* En-tête bleu marine */}
      <div style={{
        background: appColors.primaryBlue,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LockOutlined style={{ color: '#FFFFFF', fontSize: 18 }} />
        </div>
        <div>
          <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
            Identification de l'utilisateur
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 }}>
            STCA — Enregistrement des Véhicules
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, padding: '16px 20px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 4,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 11,
            color: '#991B1B',
            whiteSpace: 'pre-line',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <label style={{ width: 116, fontSize: 12, color: '#374151', textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
            Nom d'utilisateur :
          </label>
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
            style={{ flex: 1 }}
            size="small"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <label style={{ width: 116, fontSize: 12, color: '#374151', textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
            Mot de passe :
          </label>
          <Input.Password
            value={password}
            onChange={e => setPassword(e.target.value)}
            onPressEnter={handleValider}
            prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
            style={{ flex: 1 }}
            size="small"
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="small"
            onClick={() => { setPassword(''); setError(null) }}
            style={{ color: '#6B7280', borderColor: '#D1D5DB', fontSize: 12 }}
          >
            Annuler
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={handleValider}
            loading={loading}
            style={{ fontSize: 12 }}
          >
            ✓ Valider
          </Button>
        </div>
      </div>

      {/* Bande drapeau Togo */}
      <div style={{ height: 4, display: 'flex', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#006A4E' }} />
        <div style={{ flex: 1, background: '#FFDF00' }} />
        <div style={{ flex: 1, background: '#D21034' }} />
      </div>
    </div>
  )
}
