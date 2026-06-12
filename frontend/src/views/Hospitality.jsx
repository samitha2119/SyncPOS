import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useStore } from '../store/useStore';
import { Utensils, Award, ChefHat, CheckSquare, XCircle, Printer } from 'lucide-react';

export default function Hospitality() {
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' or 'kds'
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutCash, setCheckoutCash] = useState('');
  const { currentShift } = useStore();

  const fetchTablesAndMenu = async () => {
    try {
      const [tableRes, menuRes] = await Promise.all([
        axiosInstance.get('/hospitality/tables'),
        axiosInstance.get('/products?businessType=Hospitality')
      ]);
      setTables(tableRes.data);
      setMenu(menuRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTablesAndMenu();
    // Socket update listener
    const socket = useStore.getState().socket;
    if (socket) {
      socket.on('kdsUpdate', fetchTablesAndMenu);
      socket.on('order:update', fetchTablesAndMenu);
      return () => {
        socket.off('kdsUpdate', fetchTablesAndMenu);
        socket.off('order:update', fetchTablesAndMenu);
      };
    }
  }, []);

  const handleOrderSubmit = async () => {
    if (!selectedTable) return;
    if (selectedItems.length === 0) {
      alert('Please add items to order.');
      return;
    }

    try {
      await axiosInstance.post(`/hospitality/tables/${selectedTable._id}/order`, {
        items: selectedItems
      });
      setSelectedItems([]);
      setSelectedTable(null);
      fetchTablesAndMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Order submission failed');
    }
  };

  const handleItemStatusUpdate = async (tableId, itemId, newStatus) => {
    try {
      await axiosInstance.patch(`/hospitality/tables/${tableId}/items/${itemId}`, {
        status: newStatus
      });
      fetchTablesAndMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable || !currentShift) return;
    const grandTotal = selectedTable.items
      .filter(item => item.status !== 'Cancelled')
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const cashVal = parseFloat(checkoutCash);
    if (isNaN(cashVal) || cashVal < grandTotal) {
      alert('Invalid payment amount. Must cover grand total.');
      return;
    }

    try {
      await axiosInstance.post(`/hospitality/tables/${selectedTable._id}/checkout`, {
        shiftId: currentShift._id,
        payments: [{ method: 'Cash', amount: cashVal }]
      });
      setShowCheckoutModal(false);
      setSelectedTable(null);
      setCheckoutCash('');
      fetchTablesAndMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Hospitality checkout failed');
    }
  };

  const addMenuItemToOrder = (item) => {
    const existing = selectedItems.find(i => i.productId === item._id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.productId === item._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { productId: item._id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const removeMenuItemFromOrder = (productId) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  // KDS view grouping
  const kdsOrders = tables.filter(t => t.status !== 'Available' && t.items.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Switch Tab buttons */}
      <div style={styles.tabHeader}>
        <button
          onClick={() => { setActiveTab('tables'); setSelectedTable(null); }}
          className={`btn ${activeTab === 'tables' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Utensils size={16} /> Table Layout
        </button>
        <button
          onClick={() => { setActiveTab('kds'); setSelectedTable(null); }}
          className={`btn ${activeTab === 'kds' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ChefHat size={16} /> KDS Kitchen Screen
        </button>
      </div>

      {activeTab === 'tables' ? (
        <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Left Grid for Tables */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: '700' }}>Dining Room Grid</h3>
            <div style={styles.tablesGrid}>
              {tables.map(t => {
                const totalBill = t.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                return (
                  <div
                    key={t._id}
                    onClick={() => { setSelectedTable(t); setSelectedItems([]); }}
                    style={{
                      ...styles.tableCircle,
                      backgroundColor:
                        t.status === 'Available' ? 'rgba(16, 185, 129, 0.15)' :
                        t.status === 'Occupied' ? 'rgba(239, 68, 68, 0.15)' :
                        'rgba(245, 158, 11, 0.15)',
                      borderColor:
                        t.status === 'Available' ? '#10b981' :
                        t.status === 'Occupied' ? '#ef4444' :
                        '#f59e0b'
                    }}
                  >
                    <strong style={{ fontSize: '1.1rem' }}>{t.tableNumber}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.status}</span>
                    {totalBill > 0 && (
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '6px' }}>
                        LKR {totalBill.toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel for Order/Billing */}
          <div className="card">
            {selectedTable ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <h3>Order Panel: {selectedTable.tableNumber}</h3>
                  <span className="badge badge-info" style={{ marginTop: '6px' }}>Status: {selectedTable.status}</span>
                </div>

                {selectedTable.status === 'Available' ? (
                  /* Create new order */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <label>Menu Items</label>
                    <div style={styles.menuScroller}>
                      {menu.map(m => (
                        <div
                          key={m._id}
                          onClick={() => addMenuItemToOrder(m)}
                          style={styles.menuRow}
                        >
                          <span>{m.name}</span>
                          <strong>LKR {m.price.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <label>Active Selection</label>
                      <div style={styles.selectionScroller}>
                        {selectedItems.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No items added.</p>
                        ) : (
                          selectedItems.map(si => (
                            <div key={si.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                              <span>{si.name} (x{si.quantity})</span>
                              <button onClick={() => removeMenuItemFromOrder(si.productId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Remove</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button onClick={handleOrderSubmit} className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                      Send to Kitchen (KOT)
                    </button>
                  </div>
                ) : (
                  /* View active bill & process checkout */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label>Active Table Orders</label>
                      {selectedTable.items.map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span>{item.name} (x{item.quantity})</span>
                          <div>
                            <span className={`badge ${
                              item.status === 'Served' ? 'badge-success' :
                              item.status === 'Cancelled' ? 'badge-danger' :
                              'badge-warning'
                            }`} style={{ marginRight: '8px' }}>
                              {item.status}
                            </span>
                            <strong>LKR {(item.price * item.quantity).toLocaleString()}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowCheckoutModal(true)}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 'auto' }}
                    >
                      Checkout & Close Bill
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '80px' }}>
                Select a table to start ordering or view billing.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Kitchen Display (KDS) Screen */
        <div style={styles.kdsGrid}>
          {kdsOrders.length === 0 ? (
            <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              No active food preparation tickets in KDS.
            </div>
          ) : (
            kdsOrders.map(t => (
              <div key={t._id} className="card" style={{ borderColor: 'var(--orange-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <h3>{t.tableNumber}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(t.updatedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {t.items.map(item => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ textDecoration: item.status === 'Cancelled' ? 'line-through' : 'none' }}>
                        {item.name} <strong>x{item.quantity}</strong>
                      </span>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {item.status !== 'Served' && item.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => handleItemStatusUpdate(t._id, item._id, 'Served')}
                              style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
                              title="Mark Served"
                            >
                              <CheckSquare size={18} />
                            </button>
                            <button
                              onClick={() => handleItemStatusUpdate(t._id, item._id, 'Cancelled')}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              title="Cancel Item"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {item.status === 'Served' && <span className="badge badge-success">Served</span>}
                        {item.status === 'Cancelled' && <span className="badge badge-danger">Cancelled</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bill checkout modal */}
      {showCheckoutModal && selectedTable && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Close Bill: {selectedTable.tableNumber}</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleCheckoutSubmit}>
              <div style={{ backgroundColor: 'var(--input-bg)', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
                <label>Amount Due</label>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--teal-primary)' }}>
                  LKR {selectedTable.items
                    .filter(item => item.status !== 'Cancelled')
                    .reduce((sum, item) => sum + item.price * item.quantity, 0)
                    .toLocaleString()}
                </h2>
              </div>
              <div className="input-group">
                <label>Cash Amount Received</label>
                <input
                  type="number"
                  value={checkoutCash}
                  onChange={(e) => setCheckoutCash(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '12px' }}>
                Process Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  tabHeader: {
    display: 'flex',
    gap: '12px',
  },
  tablesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '16px',
    padding: '12px 0',
  },
  tableCircle: {
    height: '130px',
    borderRadius: '16px',
    border: '2px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  menuScroller: {
    maxHeight: '180px',
    overflowY: 'auto',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  menuRow: {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  selectionScroller: {
    maxHeight: '100px',
    overflowY: 'auto',
  },
  kdsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  }
};
