import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  CreditCardIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react'
import useAuthStore from '../store/authStore'

const navItems = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/transactions', icon: CreditCardIcon, label: 'Transaksi' },
  { to: '/budget', icon: ChartBarIcon, label: 'Anggaran' },
  { to: '/reports', icon: DocumentChartBarIcon, label: 'Laporan' },
]

function Layout() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">FinanceFlow</h1>
          <p className="text-xs text-gray-500 mt-0.5">Personal Finance</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
