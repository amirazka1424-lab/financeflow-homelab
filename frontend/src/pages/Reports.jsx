import { useEffect, useState } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

export default function Reports() {
  const { transactions, fetchTransactions } = useTransactionStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, []);

  const years = [];
  for (let y = selectedYear - 2; y <= selectedYear + 1; y++) years.push(y);

  // Filter transactions by selected month/year
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const netCashflow = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Category breakdown for expense
  const expenseByCategory = {};
  filtered.filter((t) => t.type === 'expense').forEach((t) => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const sortedCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1]);

  // Monthly cashflow for the year
  const monthlyCashflow = MONTHS.map((_, idx) => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === idx;
    });
    const mIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const mExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { month: MONTHS[idx], income: mIncome, expense: mExpense, net: mIncome - mExpense };
  });

  const maxBar = Math.max(...monthlyCashflow.map((m) => Math.max(m.income, m.expense)), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Laporan Keuangan</h1>
        <div className="flex gap-2">
          <select className="input w-auto" value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-auto" value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Pemasukan</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(income)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Pengeluaran</p>
          <p className="text-lg font-bold text-red-500">{formatCurrency(expense)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Net Cashflow</p>
          <p className={'text-lg font-bold ' + (netCashflow >= 0 ? 'text-primary-600' : 'text-red-600')}>
            {formatCurrency(netCashflow)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Rasio Tabungan</p>
          <p className={'text-lg font-bold ' + (savingsRate >= 20 ? 'text-green-600' : 'text-yellow-500')}>
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="card mb-6">
        <h2 className="section-title">Cashflow Bulanan {selectedYear}</h2>
        <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
          {monthlyCashflow.map((m, i) => (
            <div key={i} className={'flex flex-col items-center gap-1 min-w-[50px] ' + (i === selectedMonth ? 'opacity-100' : 'opacity-60')}>
              <div className="flex items-end gap-0.5 h-28">
                <div className="w-4 rounded-t bg-green-400" style={{ height: Math.round((m.income / maxBar) * 100) + '%' }} title={'Income: ' + formatCurrency(m.income)} />
                <div className="w-4 rounded-t bg-red-400" style={{ height: Math.round((m.expense / maxBar) * 100) + '%' }} title={'Expense: ' + formatCurrency(m.expense)} />
              </div>
              <span className="text-xs text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block"></span>Pemasukan</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block"></span>Pengeluaran</span>
        </div>
      </div>

      {/* Expense by Category */}
      <div className="card mb-6">
        <h2 className="section-title">Pengeluaran per Kategori — {MONTHS[selectedMonth]} {selectedYear}</h2>
        {sortedCategories.length === 0 ? (
          <p className="text-gray-400 text-sm">Tidak ada data pengeluaran</p>
        ) : (
          <div className="space-y-3">
            {sortedCategories.map(([cat, val]) => {
              const pct = expense > 0 ? (val / expense) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{cat}</span>
                    <span className="font-medium">{formatCurrency(val)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill bg-red-400" style={{ width: pct + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction List for selected month */}
      <div className="card">
        <h2 className="section-title">Transaksi — {MONTHS[selectedMonth]} {selectedYear}</h2>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">Tidak ada transaksi</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Kategori</th>
                  <th>Tipe</th>
                  <th className="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                  <tr key={t.id}>
                    <td className="text-gray-500">{t.date}</td>
                    <td>{t.description || '-'}</td>
                    <td><span className="badge-gray">{t.category}</span></td>
                    <td>
                      <span className={t.type === 'income' ? 'badge-green' : t.type === 'expense' ? 'badge-red' : 'badge-blue'}>
                        {t.type === 'income' ? 'Masuk' : t.type === 'expense' ? 'Keluar' : 'Transfer'}
                      </span>
                    </td>
                    <td className={'text-right font-semibold ' + (t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-500' : 'text-blue-500')}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
