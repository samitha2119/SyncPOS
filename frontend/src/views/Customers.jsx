import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { History, Medal } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const fetchCustomers = async () => {
    try {
      const { data } = await axiosInstance.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const viewPurchaseHistory = async (customer) => {
    try {
      const { data } = await axiosInstance.get(`/customers/${customer._id}/purchases`);
      setPurchaseHistory(data);
      setSelectedCustomer(customer);
      setShowHistoryModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Customers List Card */}
      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>NIC</th>
              <th>Loyalty Points</th>
              <th>Loyalty Tier</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No customers registered.
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: '700' }}>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.nic || '—'}</td>
                  <td><strong>{c.loyaltyPoints}</strong></td>
                  <td>
                    <span className={`badge ${
                      c.tier === 'Gold' ? 'badge-warning' :
                      c.tier === 'Silver' ? 'badge-info' :
                      'badge-success'
                    }`}>
                      <Medal size={12} style={{ marginRight: '4px' }} /> {c.tier}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => viewPurchaseHistory(c)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <History size={14} /> Purchases
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Purchase History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Purchase History: {selectedCustomer.name}</h3>
              <button onClick={() => setShowHistoryModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {purchaseHistory.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No purchases recorded.</p>
              ) : (
                purchaseHistory.map(sale => (
                  <div
                    key={sale._id}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--orange-primary)', fontSize: '0.95rem' }}>{sale.invoiceNumber}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(sale.createdAt).toLocaleString()}
                      </p>
                      <div style={{ marginTop: '8px' }}>
                        {sale.items.map((it, idx) => (
                          <span key={idx} style={{ fontSize: '0.8rem', marginRight: '8px', padding: '2px 6px', backgroundColor: 'var(--input-bg)', borderRadius: '4px' }}>
                            {it.name} (x{it.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--teal-primary)' }}>LKR {sale.grandTotal.toLocaleString()}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Status: {sale.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
