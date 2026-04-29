import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Dashboard from './components/Dashboard'
import AddApplicationForm from './components/AddApplicationForm'
import ResumesView from './components/ResumesView'
import TailorResume from './components/TailorResume'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import AuthCallback from './components/auth/AuthCallback'

const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'add',
    label: 'Add Application',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: 'resumes',
    label: 'Resumes',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'tailor',
    label: 'Tailor Resume',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function MainApp() {
  const [view, setView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tailorApplicationId, setTailorApplicationId] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function navigateTo(id) {
    setTailorApplicationId(null)
    setView(id)
    setSidebarOpen(false)
  }

  function handleNavigate(id, param) {
    if (id === 'tailor' && param) setTailorApplicationId(param)
    setView(id)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-zinc-100 font-semibold text-sm leading-tight">Job Tracker</p>
            <p className="text-zinc-500 text-xs">Application manager</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                view === item.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span className={view === item.id ? 'text-indigo-400' : 'text-zinc-500'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-2">
          {user && (
            <div className="px-3 py-2">
              <p className="text-zinc-300 text-xs font-medium truncate">{user.name || user.email}</p>
              <p className="text-zinc-600 text-xs truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-zinc-100 font-semibold text-sm">
              {NAV.find((n) => n.id === view)?.label}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Sign out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {view === 'add' && (
            <AddApplicationForm onSuccess={() => navigateTo('dashboard')} />
          )}
          {view === 'resumes' && <ResumesView />}
          {view === 'tailor' && (
            <TailorResume initialApplicationId={tailorApplicationId} />
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
