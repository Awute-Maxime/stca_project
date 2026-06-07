import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@pages/LoginPage'
import MainScreen from '@windows/MainScreen'
import { useAuthStore } from '@store/authStore'

function App(): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          isAuthenticated
            ? <MainScreen utilisateurLogin={user?.login ?? ''} />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

export default App
