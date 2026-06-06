import { useState } from 'react'
import { Input, Button, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

export default function LoginPage(): JSX.Element {
  const [username, setUsername] = useState('awute')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleValider = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 600))
      if (username === 'awute' && password === 'Awmax') {
        login({ id: 1, login: 'awute', nom: 'Awute Maxime', role: 'admin' }, 'mock-token')
        navigate('/')
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect\n(respectez les minuscules / majuscules)')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1A2E1C 0%, #0D1F0F 60%, #060E07 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* Titre application au-dessus */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 28 }}
      >
        <div style={{ color: '#FFDF00', fontSize: 32, fontWeight: 900, letterSpacing: 8, marginBottom: 4 }}>
          TCIT
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: 2 }}>
          TOGOLAISE DE CONTRÔLE ET D'IMMATRICULATION TRANSIT
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #006A4E, #D21034, #FFDF00, #D21034, #006A4E, transparent)', marginTop: 10, borderRadius: 1 }} />
      </motion.div>

      {/* Boîte de connexion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          background: '#F5F5F0',
          border: '1px solid #C8C8C4',
          borderRadius: 4,
          width: 400,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* En-tête dialog */}
        <div style={{
          background: 'linear-gradient(180deg, #4A7030 0%, #2D4D1A 100%)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockOutlined style={{ color: '#FFDF00', fontSize: 18 }} />
          </div>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontStyle: 'italic' }}>
            Identification de l'utilisateur
          </span>
        </div>

        {/* Corps */}
        <div style={{ padding: '20px 24px 16px' }}>

          {/* Erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                background: '#FFF0F0',
                border: '1px solid #E8A0A0',
                borderRadius: 3,
                padding: '8px 12px',
                marginBottom: 14,
                fontSize: 12,
                color: '#8B1A1A',
                whiteSpace: 'pre-line',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Champ utilisateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <label style={{ width: 130, fontSize: 13, color: '#333', textAlign: 'right', flexShrink: 0 }}>
              Nom d'utilisateur :
            </label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              prefix={<UserOutlined style={{ color: '#888' }} />}
              style={{ flex: 1, borderColor: '#AAA', borderRadius: 2 }}
              size="middle"
            />
          </div>

          {/* Champ mot de passe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <label style={{ width: 130, fontSize: 13, color: '#333', textAlign: 'right', flexShrink: 0 }}>
              Mot de passe :
            </label>
            <Input.Password
              value={password}
              onChange={e => setPassword(e.target.value)}
              onPressEnter={handleValider}
              prefix={<LockOutlined style={{ color: '#888' }} />}
              style={{ flex: 1, borderColor: '#AAA', borderRadius: 2 }}
              size="middle"
              autoFocus
            />
          </div>

          {/* Mémoriser */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Checkbox
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ fontSize: 12, color: '#555' }}
            >
              Mémoriser le nom d'utilisateur
            </Checkbox>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              onClick={() => { setPassword(''); setError(null) }}
              style={{
                borderColor: '#AAA',
                color: '#555',
                borderRadius: 2,
                fontSize: 13,
              }}
              size="middle"
            >
              Annuler
            </Button>
            <Button
              onClick={handleValider}
              loading={loading}
              icon={<span style={{ fontSize: 14, marginRight: 4 }}>✓</span>}
              style={{
                background: 'linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%)',
                border: '1px solid #1B5E20',
                color: '#fff',
                borderRadius: 2,
                fontSize: 13,
                fontWeight: 600,
              }}
              size="middle"
            >
              Valider
            </Button>
          </div>
        </div>

        {/* Bande drapeau */}
        <div style={{ height: 3, display: 'flex' }}>
          <div style={{ flex: 1, background: '#006A4E' }} />
          <div style={{ flex: 1, background: '#FFDF00' }} />
          <div style={{ flex: 1, background: '#D21034' }} />
        </div>
      </motion.div>

      {/* Pied de page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ marginTop: 20, color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 1 }}
      >
        Fonctionnement en Mode Client / Serveur
      </motion.div>
    </div>
  )
}
