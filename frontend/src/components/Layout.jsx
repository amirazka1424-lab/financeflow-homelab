import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CreditCardIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  FlagIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/transactions', icon: CreditCardIcon, label: 'Transaksi' },
  { to: '/budget', icon: ChartBarIcon, label: 'Anggaran' },
  { to: '/accounts', icon: BanknotesIcon, label: 'Akun' },
  { to: '/goals', icon: FlagIcon, label: 'Goals' },
  { to: '/assets', icon: BuildingLibraryIcon, label: 'Net Worth' },
  { to: '/bills', icon: ClipboardDocumentListIcon, label: 'Tagihan' },
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
      <aside className="w-64 h-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">FinanceFlow</h1>
          <p className="text-xs text-gray-400 mt-0.5">Homelab Edition</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-gray-400">Login sebagai</p>
            <p className="text-sm font-medium text-gray-700 truncate">{user?.username || user?.email || '-'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
