import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useTransactionStore from '../store/transactionStore'

const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Gaji', 'Investasi', 'Lainnya']

function TransactionModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { type: 'expense', amount: '', category: 'Makanan', description: '', date: new Date().toISOString().split('T')[0] })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{initial ? 'Edit' : 'Tambah'} Transaksi</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            {['income', 'expense'].map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  form.type === t ? (t === 'income' ? 'bg-success-500 text-white border-success-500' : 'bg-danger-500 text-white border-danger-500') : 'border-gray-300 text-gray-600'
                }`}>
                {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" placeholder="0" required min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Opsional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" required />
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

function Transactions() {
  const { transactions, fetchTransactions, createTransaction, deleteTransaction, isLoading } = useTransactionStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchTransactions() }, [])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

  const handleSave = async (data) => {
    const ok = await createTransaction(data)
    if (ok) { toast.success('Transaksi ditambahkan!'); setShowModal(false) }
    else toast.error('Gagal menambah transaksi')
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return
    const ok = await deleteTransaction(id)
    if (ok) toast.success('Transaksi dihapus') 
    else toast.error('Gagal menghapus')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaksi</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola semua transaksi Anda</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Tambah</button>
      </div>

      <div className="card">
        {isLoading ? (
          <p className="text-gray-400 text-sm">Memuat...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada transaksi</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{t.description || t.category}</p>
                  <p className="text-xs text-gray-400">{t.category} • {new Date(t.date).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold ${ t.type === 'income' ? 'text-success-600' : 'text-danger-600' }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-danger-500 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}

export default Transactions
