import { useEffect, useState } from 'react';
import { useGoalStore } from '../store/goalStore';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const GoalModal = ({ onClose, onSave, initial }) => {
  const [form, setForm] = useState(
    initial || { name: '', target_amount: '', current_amount: '0', deadline: '', description: '' }
  );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Edit Goal' : 'Tambah Goal'}</h2>
        <div className="space-y-3">
          <input className="input" placeholder="Nama goal" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="number" placeholder="Target nominal"
            value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
          <input className="input" type="number" placeholder="Tabungan saat ini"
            value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
          <input className="input" type="date" placeholder="Deadline"
            value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <textarea className="input" placeholder="Deskripsi (opsional)" rows="2"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default function Goals() {
  const { goals, fetchGoals, createGoal, updateGoal, deleteGoal, isLoading } = useGoalStore();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => { fetchGoals(); }, []);

  const handleSave = async (form) => {
    const data = {
      ...form,
      target_amount: parseFloat(form.target_amount) || 0,
      current_amount: parseFloat(form.current_amount) || 0,
    };
    if (editTarget) await updateGoal(editTarget.id, data);
    else await createGoal(data);
    setShowModal(false);
    setEditTarget(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Target Tabungan</h1>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>+ Tambah Goal</button>
      </div>
      {isLoading ? (
        <p className="text-gray-400 text-sm">Memuat...</p>
      ) : goals.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">Belum ada goal</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
            const remaining = g.target_amount - g.current_amount;
            return (
              <div key={g.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{g.name}</p>
                    {g.deadline && <p className="text-xs text-gray-400">Deadline: {g.deadline}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button className="text-gray-400 hover:text-primary-500 text-xs"
                      onClick={() => { setEditTarget(g); setShowModal(true); }}>Edit</button>
                    <button className="text-gray-400 hover:text-danger-500 text-xs"
                      onClick={() => deleteGoal(g.id)}>X</button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full bg-primary-500" style={{ width: pct + '%' }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatCurrency(g.current_amount)} terkumpul</span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Target: <span className="font-medium">{formatCurrency(g.target_amount)}</span></p>
                  {remaining > 0 && <p className="text-sm text-gray-500">Kurang: {formatCurrency(remaining)}</p>}
                  {pct >= 100 && <p className="text-sm text-green-600 font-semibold">Goal tercapai!</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && (
        <GoalModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
