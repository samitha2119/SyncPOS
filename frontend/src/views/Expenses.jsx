import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Plus, DollarSign } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');

  const fetchExpenses = async () => {
    try {
      const { data } = await axiosInstance.get('/expenses');
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/expenses', {
        title,
        amount: Number(amount),
        category
      });
      setShowAddModal(false);
      setTitle('');
      setAmount('');
      setCategory('Rent');
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting expense');
    }
  };

  const totalExpenseSum = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top summary card */}
      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
        <div className="card" style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', padding: '16px 24px' }}>
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <label>Total Shop Expenses</label>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>LKR {totalExpenseSum.toLocaleString()}</h3>
          </div>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table>
          <thead>
            <tr>
              <th>Expense Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Recorded By</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No store expenses logged.
                </td>
              </tr>
            ) : (
              expenses.map(e => (
                <tr key={e._id}>
                  <td style={{ fontWeight: '700' }}>{e.title}</td>
                  <td><span className="badge badge-info">{e.category}</span></td>
                  <td>{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                  <td>{e.cashierId?.name}</td>
                  <td style={{ fontWeight: '700', color: '#ef4444' }}>LKR {e.amount.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Log Store Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleAddExpenseSubmit}>
              <div className="input-group">
                <label>Expense Title</label>
                <input type="text" placeholder="e.g. Electricity Bill" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Amount (LKR)</label>
                <input type="number" placeholder="e.g. 15000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Supplies">Store Supplies</option>
                  <option value="Other">Other Overhead</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '12px' }}>
                Log Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
