import { useEffect, useState } from 'react';
import { useBillStore } from '../store/billStore';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const BILL_CATEGORIES = ['Listrik', 'Air', 'Internet', 'Telepon', 'TV Kabel', 'Asuransi', 'Cicilan', 'Sewa', 'Lainnya'];
const RECURRING = ['monthly', 'weekly', 'yearly', 'once'];

const BillModal = ({ onClose, onSave, initial }) => {
  const [form, setForm] = useState(
    initial || { name: '', category: 'Listrik', amount: '', due_date: '', recurring: 'monthly', note: '' }
  );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Edit Tagihan' : 'Tambah Tagihan'}</h2>
        <div className="space-y-3">
          <input className="input" placeholder="Nama tagihan" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {BILL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" type="number" placeholder="Nominal"
            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className="input" type="date" placeholder="Tanggal jatuh tempo"
            value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <select className="input" value={form.recurring}
            onChange={(e) => setForm({ ...form, recurring: e.target.value })}>
            {RECURRING.map((r) => <option key={r} value={r}>{r === 'monthly' ? 'Bulanan' : r === 'weekly' ? 'Mingguan' : r === 'yearly' ? 'Tahunan' : 'Sekali'}</option>)}
          </select>
          <textarea className="input" placeholder="Catatan" rows="2"
            value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default function Bills() {
  const { bills, fetchBills, createBill, updateBill, deleteBill, markPaid, isLoading } = useBillStore();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => { fetchBills(); }, []);

  const handleSave = async (form) => {
    const data = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editTarget) await updateBill(editTarget.id, data);
    else await createBill(data);
    setShowModal(false);
    setEditTarget(null);
  };

  const unpaid = bills.filter((b) => !b.is_paid);
  const paid = bills.filter((b) => b.is_paid);
  const totalUnpaid = unpaid.reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tagihan & Bills</h1>
          <p className="text-sm text-gray-500">Belum dibayar: {formatCurrency(totalUnpaid)}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>+ Tambah Tagihan</button>
      </div>
      {isLoading ? (
        <p className="text-gray-400 text-sm">Memuat...</p>
      ) : (
        <>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Belum Dibayar</h2>
          {unpaid.length === 0 ? (
            <p className="text-gray-400 text-sm mb-6">Tidak ada tagihan tertunggak</p>
          ) : (
            <div className="space-y-2 mb-6">
              {unpaid.map((b) => (
                <div key={b.id} className="card flex justify-between items-center border-l-4 border-yellow-400">
                  <div>
                    <p className="font-medium text-gray-800">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.category} | Jatuh tempo: {b.due_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatCurrency(b.amount || 0)}</p>
                    <button className="btn-primary text-xs py-1 px-2" onClick={() => markPaid(b.id)}>Bayar</button>
                    <button className="text-gray-400 hover:text-primary-500 text-xs" onClick={() => { setEditTarget(b); setShowModal(true); }}>Edit</button>
                    <button className="text-gray-400 hover:text-danger-500 text-xs" onClick={() => deleteBill(b.id)}>X</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {paid.length > 0 && (
            <>
              <h2 className="text-base font-semibold text-gray-700 mb-3">Sudah Dibayar</h2>
              <div className="space-y-2">
                {paid.map((b) => (
                  <div key={b.id} className="card flex justify-between items-center opacity-60">
                    <div>
                      <p className="font-medium text-gray-600 line-through">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-500">{formatCurrency(b.amount || 0)}</p>
                      <button className="text-gray-400 hover:text-danger-500 text-xs" onClick={() => deleteBill(b.id)}>X</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {showModal && (
        <BillModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
