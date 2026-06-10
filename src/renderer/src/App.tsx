import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@pages/LoginPage'
import SplashScreen from '@pages/SplashScreen'
import MainScreen from '@windows/MainScreen'
import { useAuthStore } from '@store/authStore'

function App(): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  return (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          isAuthenticated
            ? <MainScreen utilisateurLogin={user?.login ?? ''} />
            : <Navigate to="/splash" replace />
        }
      />
    </Routes>
  )
}

export default App
