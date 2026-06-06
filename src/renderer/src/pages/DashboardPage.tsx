import { AnimatePresence } from 'framer-motion'
import AppLayout from '@components/AppLayout'
import FloatingWindow from '@components/FloatingWindow'
import EnregistrementPage from './EnregistrementPage'
import ListePage from './ListePage'
import StatistiquesPage from './StatistiquesPage'
import { useWindowStore } from '@store/windowStore'
import { Typography } from 'antd'

const { Text } = Typography

export default function DashboardPage(): JSX.Element {
  const windows = useWindowStore(s => s.windows)
  const anyOpen = Object.values(windows).some(w => w.isOpen)

  return (
    <AppLayout>
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#C8CAC8' }}>

        {/* ── Fond bureau — visible quand aucune fenêtre n'est ouverte ── */}
        {!anyOpen && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', gap: 8,
          }}>
            <Text style={{ fontSize: 48, color: '#3D5C28', opacity: 0.18, fontWeight: 900, letterSpacing: 8, fontStyle: 'italic' }}>TCIT</Text>
            <Text style={{ fontSize: 13, color: '#2A4018', opacity: 0.3, fontWeight: 600 }}>
              Togolaise de Contrôle et d'Immatriculation Transit
            </Text>
            <Text style={{ fontSize: 11, color: '#555', opacity: 0.35, marginTop: 4 }}>
              Utilisez le menu à gauche pour ouvrir une fonctionnalité
            </Text>
          </div>
        )}

        {/* ── Fenêtres flottantes ───────────────────────────────────── */}
        <AnimatePresence>
          {windows.enregistrement.isOpen && (
            <FloatingWindow id="enregistrement">
              <EnregistrementPage />
            </FloatingWindow>
          )}
          {windows.liste.isOpen && (
            <FloatingWindow id="liste">
              <ListePage />
            </FloatingWindow>
          )}
          {windows.statistiques.isOpen && (
            <FloatingWindow id="statistiques">
              <StatistiquesPage />
            </FloatingWindow>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
