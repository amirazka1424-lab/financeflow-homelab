import { useEffect, useState } from 'react';
import { useAssetStore } from '../store/assetStore';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const ASSET_CATEGORIES = ['Saham', 'Reksa Dana', 'Kripto', 'Deposito', 'Properti', 'Kendaraan', 'Kas', 'Lainnya'];
const LIABILITY_CATEGORIES = ['KPR', 'KTA', 'Kartu Kredit', 'Cicilan Kendaraan', 'Utang Lainnya'];

const AssetModal = ({ onClose, onSave, initial }) => {
  const [form, setForm] = useState(
    initial || { name: '', type: 'asset', category: 'Saham', value: '', note: '' }
  );
  const cats = form.type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Edit Item' : 'Tambah Item'}</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button className={form.type === 'asset' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
              onClick={() => setForm({ ...form, type: 'asset', category: 'Saham' })}>Aset</button>
            <button className={form.type === 'liability' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
              onClick={() => setForm({ ...form, type: 'liability', category: 'KPR' })}>Liabilitas</button>
          </div>
          <input className="input" placeholder="Nama" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" type="number" placeholder="Nilai (Rp)"
            value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
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

export default function Assets() {
  const { assets, liabilities, fetchAssets, createAsset, updateAsset, deleteAsset, getNetWorth, isLoading } = useAssetStore();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => { fetchAssets(); }, []);

  const handleSave = async (form) => {
    const data = { ...form, value: parseFloat(form.value) || 0 };
    if (editTarget) await updateAsset(editTarget.id, data);
    else await createAsset(data);
    setShowModal(false);
    setEditTarget(null);
  };

  const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + (a.value || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const renderList = (items, label) => (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{label}</h2>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada data</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="card flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <span className="text-xs text-gray-400">{item.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-gray-900">{formatCurrency(item.value || 0)}</p>
                <button className="text-gray-400 hover:text-primary-500 text-xs"
                  onClick={() => { setEditTarget(item); setShowModal(true); }}>Edit</button>
                <button className="text-gray-400 hover:text-danger-500 text-xs"
                  onClick={() => deleteAsset(item.id)}>X</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Net Worth & Aset</h1>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>+ Tambah</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Total Aset</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalAssets)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Total Liabilitas</p>
          <p className="text-xl font-bold text-red-500">{formatCurrency(totalLiabilities)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Net Worth</p>
          <p className={'text-xl font-bold ' + (netWorth >= 0 ? 'text-primary-600' : 'text-red-600')}>{formatCurrency(netWorth)}</p>
        </div>
      </div>
      {isLoading ? <p className="text-gray-400 text-sm">Memuat...</p> : (
        <>
          {renderList(assets, 'Aset')}
          {renderList(liabilities, 'Liabilitas / Utang')}
        </>
      )}
      {showModal && (
        <AssetModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
