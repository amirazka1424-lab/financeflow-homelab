import { useEffect } from 'react'
import useTransactionStore from '../store/transactionStore'
import useAuthStore from '../store/authStore'

function StatCard({ title, value, subtitle, color }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

function Dashboard() {
  const { summary, transactions, fetchSummary, fetchTransactions, isLoading } = useTransactionStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchSummary()
    fetchTransactions()
  }, [])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.full_name || user?.email}
        </h2>
        <p className="text-gray-500 text-sm mt-1">Ringkasan keuangan Anda</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Pemasukan"
          value={summary ? formatCurrency(summary.total_income) : '-'}
          subtitle="Bulan ini"
          color="text-success-600"
        />
        <StatCard
          title="Total Pengeluaran"
          value={summary ? formatCurrency(summary.total_expense) : '-'}
          subtitle="Bulan ini"
          color="text-danger-600"
        />
        <StatCard
          title="Saldo Bersih"
          value={summary ? formatCurrency(summary.net_balance) : '-'}
          subtitle="Pemasukan - Pengeluaran"
          color={summary?.net_balance >= 0 ? 'text-success-600' : 'text-danger-600'}
        />
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaksi Terbaru</h3>
        {isLoading ? (
          <p className="text-gray-400 text-sm">Memuat...</p>
        ) : recentTransactions.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada transaksi</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.description || t.category}</p>
                  <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                </div>
                <span className={`text-sm font-semibold ${
                  t.type === 'income' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
