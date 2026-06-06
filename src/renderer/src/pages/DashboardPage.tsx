import { Routes, Route } from 'react-router-dom'
import AppLayout from '@components/AppLayout'
import HomePage from './HomePage'

export default function DashboardPage(): JSX.Element {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Routes à ajouter : /enregistrement, /liste, /statistiques, /marques */}
      </Routes>
    </AppLayout>
  )
}
