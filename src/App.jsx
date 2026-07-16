import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        {/* Stubs — the auth screens are not built yet, but src/api/auth.js
            already speaks to /api/auth/login and /api/auth/signup. */}
        <Route path="/login" element={<Placeholder title="Log in" />} />
        <Route path="/signup" element={<Placeholder title="Create your account" />} />

        <Route
          path="*"
          element={<Placeholder title="Page not found" body="That page doesn't exist yet." />}
        />
      </Routes>

      <Footer />
    </>
  )
}
