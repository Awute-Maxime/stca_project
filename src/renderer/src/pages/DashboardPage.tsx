import { Routes, Route } from 'react-router-dom'
import AppLayout from '@components/AppLayout'
import HomePage from './HomePage'
import EnregistrementPage from './EnregistrementPage'

export default function DashboardPage(): JSX.Element {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/enregistrement" element={<EnregistrementPage />} />
        {/* Routes à ajouter : /liste, /statistiques, /marques */}
      </Routes>
    </AppLayout>
  )
}
