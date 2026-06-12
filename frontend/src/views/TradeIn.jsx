import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { RefreshCw, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function TradeIn() {
  const [tradeins, setTradeins] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Setup form states
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState([
    { name: 'Display Screen Scratch-free', passed: false },
    { name: 'Battery Health Above 85%', passed: false },
    { name: 'Outer Enclosure Clean/Dented-free', passed: false },
    { name: 'Buttons & Input Sensors Functional', passed: false },
    { name: 'Camera Lenses Functional', passed: false }
  ]);

  const [valuation, setValuation] = useState(0);

  const fetchTradeIns = async () => {
    try {
      const [trRes, custRes] = await Promise.all([
        axiosInstance.get('/tradeins'),
        axiosInstance.get('/customers')
      ]);
      setTradeins(trRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTradeIns();
  }, []);

  // Update dynamic valuation score as checklist changes
  useEffect(() => {
    const passedCount = checklist.filter(c => c.passed).length;
    let baseVal = passedCount * 12000; // 12000 per checklist item passed
    if (condition === 'Excellent') baseVal *= 1.2;
    if (condition === 'Fair') baseVal *= 0.8;
    if (condition === 'Poor') baseVal *= 0.5;
    setValuation(Math.round(baseVal));
  }, [checklist, condition]);

  const handleCreateTradeIn = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/tradeins', {
        brand,
        model,
        condition,
        checklist,
        valuation,
        customerId: customerId || undefined,
        notes
      });
      setShowAddModal(false);
      resetForm();
      fetchTradeIns();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting trade-in valuation');
    }
  };

  const handleAcceptTradeIn = async (id) => {
    if (!window.confirm('Accept this trade-in and issue store credit to the customer?')) return;
    try {
      await axiosInstance.patch(`/tradeins/${id}/accept`);
      fetchTradeIns();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectTradeIn = async (id) => {
    if (!window.confirm('Are you sure you want to reject this device?')) return;
    try {
      await axiosInstance.patch(`/tradeins/${id}/cancel`);
      fetchTradeIns();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setBrand('');
    setModel('');
    setCondition('Good');
    setNotes('');
    setCustomerId('');
    setChecklist(checklist.map(c => ({ ...c, passed: false })));
  };

  const toggleChecklistItem = (idx) => {
    setChecklist(checklist.map((c, i) => i === idx ? { ...c, passed: !c.passed } : c));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Grade Second-Hand Device
        </button>
      </div>

      {/* Trade-ins listing */}
      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table>
          <thead>
            <tr>
              <th>Trade-In ID</th>
              <th>Customer</th>
              <th>Device details</th>
              <th>Grade</th>
              <th>Est. Valuation</th>
              <th>Credit Issued</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tradeins.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No trade-in evaluations registered.
                </td>
              </tr>
            ) : (
              tradeins.map(tr => (
                <tr key={tr._id}>
                  <td style={{ fontWeight: '700', color: 'var(--orange-primary)' }}>{tr.tradeInId}</td>
                  <td>{tr.customerId?.name || 'Walk-in Guest'}</td>
                  <td><strong>{tr.brand} {tr.model}</strong></td>
                  <td><span className="badge badge-info">{tr.condition}</span></td>
                  <td>LKR {tr.valuation.toLocaleString()}</td>
                  <td>LKR {tr.creditGenerated.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      tr.status === 'Accepted' ? 'badge-success' :
                      tr.status === 'Rejected' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {tr.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {tr.status === 'Pending' && (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAcceptTradeIn(tr._id)}
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: '#10b981' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectTradeIn(tr._id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Trade In Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Grade Device & Calculate Value</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleCreateTradeIn} className="grid-2">
              <div className="input-group">
                <label>Manufacturer Brand</label>
                <input type="text" placeholder="e.g. Apple" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Model Version</label>
                <input type="text" placeholder="e.g. iPhone X" value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Physical Grade</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="Excellent">Excellent (A)</option>
                  <option value="Good">Good (B)</option>
                  <option value="Fair">Fair (C)</option>
                  <option value="Poor">Poor (D)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Customer (Attach to Profile)</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              {/* Diagnostic Checklist */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Inspection Checklist</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--input-bg)', padding: '12px', borderRadius: '8px' }}>
                  {checklist.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={item.passed}
                        onChange={() => toggleChecklistItem(idx)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Valuation Notes</label>
                <input type="text" placeholder="Include notes on scratches / faults" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {/* Live Score Output */}
              <div style={{ gridColumn: 'span 2', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <label>Calculated Store Credit Value</label>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--orange-primary)', marginTop: '4px' }}>
                  LKR {valuation.toLocaleString()}
                </h2>
              </div>

              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '16px', padding: '14px' }}>
                Save Grade Valuation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
