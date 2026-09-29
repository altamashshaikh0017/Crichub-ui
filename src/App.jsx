import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Teams from './pages/Teams'
import Squad from './pages/Squad'
import Tournaments from './pages/Tournaments'
import TournamentTeams from './pages/TournamentTeams'
import Matches from './pages/Matches'
import MatchResult from './pages/MatchResult'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teams/:teamId/squad"
          element={
            <ProtectedRoute>
              <Squad />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tournaments"
          element={
            <ProtectedRoute>
              <Tournaments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tournaments/:tournamentId/teams"
          element={
            <ProtectedRoute>
              <TournamentTeams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/matches/:matchId/result"
          element={
            <ProtectedRoute>
              <MatchResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Placeholder title="Page not found" body="That page doesn't exist yet." />}
        />
      </Routes>

      <Footer />
    </>
  )
}
