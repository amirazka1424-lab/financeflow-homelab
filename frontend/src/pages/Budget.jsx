import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useBudgetStore from '../store/budgetStore'

const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya']

function BudgetModal({ onClose, onSave }) {
  const [form, setForm] = useState({ category: 'Makanan', limit_amount: '', month: new Date().toISOString().slice(0, 7) })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, limit_amount: parseFloat(form.limit_amount) })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Tambah Anggaran</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batas Anggaran (Rp)</label>
            <input type="number" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} className="input-field" placeholder="0" required min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
            <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="input-field" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Budget() {
  const { budgets, fetchBudgets, createBudget, deleteBudget, isLoading } = useBudgetStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchBudgets() }, [])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

  const handleSave = async (data) => {
    const ok = await createBudget(data)
    if (ok) { toast.success('Anggaran ditambahkan!'); setShowModal(false) }
    else toast.error('Gagal menambah anggaran')
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus anggaran ini?')) return
    const ok = await deleteBudget(id)
    if (ok) toast.success('Anggaran dihapus')
    else toast.error('Gagal menghapus')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Anggaran</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola batas pengeluaran per kategori</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Tambah</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-gray-400 text-sm col-span-full">Memuat...</p>
        ) : budgets.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-full text-center py-8">Belum ada anggaran</p>
        ) : budgets.map((b) => {
          const spent = b.spent_amount || 0
          const pct = Math.min((spent / b.limit_amount) * 100, 100)
          const isOver = spent > b.limit_amount
          return (
            <div key={b.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{b.category}</p>
                  <p className="text-xs text-gray-400">{b.month}</p>
                </div>
                <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-danger-500 text-xs">✕</button>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full ${isOver ? 'bg-danger-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Terpakai: {formatCurrency(spent)}</span>
                <span className={isOver ? 'text-danger-600 font-medium' : 'text-gray-500'}>{formatCurrency(b.limit_amount)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && <BudgetModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}

export default Budget
