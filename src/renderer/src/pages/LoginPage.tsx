import { useState } from 'react'
import { Input, Button } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { appColors } from '@theme/windev-theme'

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
      minHeight: '100vh',
      background: '#F0F2F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 8,
        width: 420,
        boxShadow: '0 4px 24px rgba(27,58,107,0.15)',
        overflow: 'hidden',
        border: '1px solid #DBEAFE',
      }}>
        {/* En-tête bleu marine */}
        <div style={{
          background: appColors.primaryBlue,
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 40, height: 40,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockOutlined style={{ color: '#FFFFFF', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>
              Identification de l&apos;utilisateur
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
              STCA — Enregistrement des Véhicules
            </div>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px 28px 20px' }}>
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 4,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 12,
              color: '#991B1B',
              whiteSpace: 'pre-line',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <label style={{ width: 120, fontSize: 13, color: '#374151', textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
              Nom d&apos;utilisateur :
            </label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <label style={{ width: 120, fontSize: 13, color: '#374151', textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
              Mot de passe :
            </label>
            <Input.Password
              value={password}
              onChange={e => setPassword(e.target.value)}
              onPressEnter={handleValider}
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              style={{ flex: 1 }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button
              onClick={() => { setPassword(''); setError(null) }}
              style={{ color: '#6B7280', borderColor: '#D1D5DB' }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              onClick={handleValider}
              loading={loading}
              icon={<span style={{ marginRight: 4 }}>✓</span>}
            >
              Valider
            </Button>
          </div>
        </div>

        {/* Bande drapeau Togo */}
        <div style={{ height: 4, display: 'flex' }}>
          <div style={{ flex: 1, background: '#006A4E' }} />
          <div style={{ flex: 1, background: '#FFDF00' }} />
          <div style={{ flex: 1, background: '#D21034' }} />
        </div>
      </div>
    </div>
  )
}
