import { useEffect, useState } from 'react';
import { useAccountStore } from '../store/accountStore';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const ACCOUNT_TYPES = ['Bank', 'E-Wallet', 'Cash', 'Investasi', 'Lainnya'];

const AccountModal = ({ onClose, onSave, initial }) => {
  const [form, setForm] = useState(
    initial || { name: '', type: 'Bank', balance: '', color: '#3B82F6', icon: '' }
  );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Edit Akun' : 'Tambah Akun'}</h2>
        <div className="space-y-3">
          <input className="input" placeholder="Nama akun" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className="input" type="number" placeholder="Saldo awal"
            value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Warna:</label>
            <input type="color" value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default function Accounts() {
  const { accounts, fetchAccounts, createAccount, updateAccount, deleteAccount, isLoading } = useAccountStore();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = async (form) => {
    const data = { ...form, balance: parseFloat(form.balance) || 0 };
    if (editTarget) await updateAccount(editTarget.id, data);
    else await createAccount(data);
    setShowModal(false);
    setEditTarget(null);
  };

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Akun Keuangan</h1>
          <p className="text-sm text-gray-500">Total Saldo: {formatCurrency(totalBalance)}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>+ Tambah Akun</button>
      </div>
      {isLoading ? (
        <p className="text-gray-400 text-sm">Memuat...</p>
      ) : accounts.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">Belum ada akun</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="card border-l-4" style={{ borderColor: acc.color || '#3B82F6' }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{acc.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{acc.type}</span>
                </div>
                <div className="flex gap-1">
                  <button className="text-gray-400 hover:text-primary-500 text-xs"
                    onClick={() => { setEditTarget(acc); setShowModal(true); }}>Edit</button>
                  <button className="text-gray-400 hover:text-danger-500 text-xs"
                    onClick={() => deleteAccount(acc.id)}>X</button>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(acc.balance || 0)}</p>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <AccountModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
