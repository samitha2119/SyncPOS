import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Search, Plus, Calendar, ShieldAlert, Check } from 'lucide-react';

export default function HP() {
  const [agreements, setAgreements] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  // Setup form states
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [months, setMonths] = useState('6');

  // Pay installment states
  const [payAmount, setPayAmount] = useState('');
  const [payingInstallmentId, setPayingInstallmentId] = useState(null);

  const fetchAgreements = async () => {
    try {
      const { data } = await axiosInstance.get(`/hp?search=${search}`);
      setAgreements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFormDetails = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        axiosInstance.get('/customers'),
        axiosInstance.get('/products?businessType=Retail')
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [search]);

  useEffect(() => {
    if (showAddModal) {
      fetchFormDetails();
    }
  }, [showAddModal]);

  const handleCreateAgreement = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/hp', {
        customerId,
        productId,
        totalPrice: Number(totalPrice),
        downPayment: Number(downPayment),
        interestRate: Number(interestRate),
        months: Number(months)
      });
      setShowAddModal(false);
      resetForm();
      fetchAgreements();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating agreement');
    }
  };

  const handlePayInstallment = async (e) => {
    e.preventDefault();
    if (!selectedAgreement || !payingInstallmentId) return;
    try {
      const { data } = await axiosInstance.post(`/hp/${selectedAgreement._id}/pay`, {
        installmentId: payingInstallmentId,
        amount: Number(payAmount)
      });
      setPayingInstallmentId(null);
      setPayAmount('');
      // Update local view
      setSelectedAgreement(data);
      fetchAgreements();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing installment payment');
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setProductId('');
    setTotalPrice('');
    setDownPayment('');
    setInterestRate('0');
    setMonths('6');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Actions header */}
      <div style={{ display: 'flex', justify: 'space-between', gap: '16px' }}>
        <input
          type="text"
          placeholder="Search by NIC, Customer, HP ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Setup HP Financing
        </button>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: selectedAgreement ? '2fr 1.2fr' : '1fr' }}>
        {/* Agreements Table */}
        <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
          <table>
            <thead>
              <tr>
                <th>HP Agreement</th>
                <th>Customer / NIC</th>
                <th>Product</th>
                <th>Total Price</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agreements.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No Hire Purchase agreements found.
                  </td>
                </tr>
              ) : (
                agreements.map(ag => {
                  const hasOverdue = ag.installments.some(i => i.status === 'Overdue');
                  return (
                    <tr key={ag._id} onClick={() => setSelectedAgreement(ag)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: '700', color: 'var(--orange-primary)' }}>{ag.hpId}</td>
                      <td>
                        <strong>{ag.customerId?.name}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NIC: {ag.customerId?.nic}</p>
                      </td>
                      <td>{ag.productId?.name}</td>
                      <td>LKR {ag.totalPrice.toLocaleString()}</td>
                      <td style={{ fontWeight: '700' }}>LKR {ag.remainingBalance.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          ag.status === 'Completed' ? 'badge-success' :
                          hasOverdue ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {hasOverdue ? 'Overdue' : ag.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                          Schedules
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected agreement details panel */}
        {selectedAgreement && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h3>{selectedAgreement.hpId}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining: LKR {selectedAgreement.remainingBalance.toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedAgreement(null)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label>Installment Schedule</label>
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedAgreement.installments.map((inst, idx) => (
                  <div
                    key={inst._id}
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--input-bg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Month {idx + 1}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(inst.dueDate).toLocaleDateString()}</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '4px' }}>LKR {inst.amount.toLocaleString()}</p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {inst.status === 'Paid' ? (
                        <span className="badge badge-success">Paid</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <span className={`badge ${inst.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}`}>
                            {inst.status}
                          </span>
                          <button
                            onClick={() => { setPayingInstallmentId(inst._id); setPayAmount(inst.amount - inst.paidAmount); }}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            Pay
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pay installment dialog overlay */}
      {payingInstallmentId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Post Installment Payment</h3>
              <button onClick={() => setPayingInstallmentId(null)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Cancel</button>
            </div>
            <form onSubmit={handlePayInstallment}>
              <div className="input-group">
                <label>Amount (LKR)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Post Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Setup HP Agreement Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Setup Hire Purchase Agreement</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleCreateAgreement} className="grid-2">
              <div className="input-group">
                <label>Customer (NIC Lookup)</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.nic})</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Product</label>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} (LKR {p.price.toLocaleString()})</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Total Price (LKR)</label>
                <input type="number" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Down Payment (LKR)</label>
                <input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Interest Rate (%)</label>
                <input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Installment Months</label>
                <select value={months} onChange={(e) => setMonths(e.target.value)}>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                Create Agreement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
