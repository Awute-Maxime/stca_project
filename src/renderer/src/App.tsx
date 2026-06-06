import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@pages/LoginPage'
import DashboardPage from '@pages/DashboardPage'
import { useAuthStore } from '@store/authStore'

function App(): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App
