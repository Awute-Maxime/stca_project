import { useState } from 'react'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

// Logo TCIT inline SVG
const TcitLogo = (): JSX.Element => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" width="280" height="112">
    <defs>
      <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#006A4E', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#004A35', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="acG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#D21034', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#FFDF00', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#D21034', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect width="400" height="160" rx="12" fill="url(#bgG)" />
    <rect x="0" y="140" width="400" height="20" rx="0" fill="url(#acG)" />
    <g transform="translate(52,78)">
      <polygon points="0,-28 6.6,-9 26.6,-9 10.5,4 16.4,23 0,11.4 -16.4,23 -10.5,4 -26.6,-9 -6.6,-9" fill="#FFDF00" opacity="0.92" />
    </g>
    <rect x="90" y="30" width="2" height="96" rx="1" fill="#FFDF00" opacity="0.5" />
    <text x="115" y="90" fontFamily="'Segoe UI',Arial,sans-serif" fontSize="64" fontWeight="800" fill="#FFFFFF" letterSpacing="6">TCIT</text>
    <text x="115" y="115" fontFamily="'Segoe UI',Arial,sans-serif" fontSize="11" fontWeight="400" fill="#FFFFFF" opacity="0.80" letterSpacing="1">Togolaise de Contrôle et d'Immatriculation Transit</text>
    <rect x="115" y="97" width="200" height="3" rx="1.5" fill="#D21034" opacity="0.7" />
  </svg>
)

export default function LoginPage(): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const onFinish = async (values: { login: string; password: string }): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      // TODO: appel API réel → POST /api/auth/login
      // Pour l'instant : mock avec les credentials STCA
      await new Promise((r) => setTimeout(r, 800))
      if (values.login === 'awute' && values.password === 'Awmax') {
        login({ id: 1, login: 'awute', nom: 'Awute Maxime', role: 'admin' }, 'mock-token')
        navigate('/')
      } else {
        setError('Identifiants incorrects')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #006A4E 0%, #004A35 50%, #003025 100%)' }}>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px 48px',
          width: 420,
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)'
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <TcitLogo />
        </div>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ color: '#666', fontSize: 13 }}>
            Veuillez vous connecter pour continuer
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
          </motion.div>
        )}

        {/* Formulaire */}
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="login"
            rules={[{ required: true, message: "Identifiant requis" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#006A4E' }} />}
              placeholder="Identifiant"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Mot de passe requis" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#006A4E' }} />}
              placeholder="Mot de passe"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: 'linear-gradient(90deg, #006A4E, #008A64)',
                border: 'none',
                height: 44,
                fontSize: 15,
                fontWeight: 600
              }}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        {/* Bande drapeau bas */}
        <div style={{ display: 'flex', marginTop: 28, borderRadius: 4, overflow: 'hidden', height: 4 }}>
          {['#006A4E','#FFDF00','#D21034','#FFDF00','#006A4E'].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
