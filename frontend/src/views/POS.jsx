import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useStore } from '../store/useStore';
import ReactToPrint from 'react-to-print';
import { Search, Plus, Minus, Trash2, UserPlus, CreditCard, Printer, Check } from 'lucide-react';

export default function POS() {
  const {
    cartItems,
    cartCustomer,
    cartDiscount,
    discountType,
    addToCart,
    removeFromCart,
    updateCartQty,
    setCartCustomer,
    setCartDiscount,
    clearCart,
    currentShift,
    settings
  } = useStore();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Payment states
  const [cashPaid, setCashPaid] = useState(0);
  const [cardPaid, setCardPaid] = useState(0);
  const [qrPaid, setQrPaid] = useState(0);
  
  // Customer lookup states
  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Finished Invoice state for printing
  const [finishedSale, setFinishedSale] = useState(null);

  const barcodeInputRef = useRef(null);
  const receiptPrintRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const { data } = await axiosInstance.get(`/products?businessType=Retail`);
      setProducts(data);
      // Unique categories
      const cats = [...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Auto-focus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const match = products.find(p => p.barcode === searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (match) {
      try {
        addToCart(match);
        setSearchTerm('');
      } catch (err) {
        alert(err.message);
      }
    } else {
      alert('No product matches barcode / search criteria.');
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  const discountVal = discountType === 'percent' 
    ? (subtotal * (cartDiscount / 100)) 
    : cartDiscount;

  const afterDiscount = Math.max(0, subtotal - discountVal);
  
  const vatRate = settings?.vatEnabled ? settings.vatRate : 0;
  const ssclRate = settings?.ssclEnabled ? settings.ssclRate : 0;
  
  const vat = afterDiscount * (vatRate / 100);
  const sscl = afterDiscount * (ssclRate / 100);
  const grandTotal = afterDiscount + vat + sscl;

  const totalPaid = Number(cashPaid) + Number(cardPaid) + Number(qrPaid);
  const changeDue = Math.max(0, totalPaid - grandTotal);

  const handleCheckoutSubmit = async () => {
    if (!currentShift) {
      alert('Please open a shift before checking out.');
      return;
    }
    if (totalPaid < grandTotal) {
      alert('Paid amount cannot be less than the grand total.');
      return;
    }

    const payments = [];
    if (cashPaid > 0) payments.push({ method: 'Cash', amount: Number(cashPaid) });
    if (cardPaid > 0) payments.push({ method: 'Card', amount: Number(cardPaid) });
    if (qrPaid > 0) payments.push({ method: 'LankaQR', amount: Number(qrPaid) });

    const payload = {
      items: cartItems,
      customerId: cartCustomer?._id || null,
      totalAmount: subtotal,
      vat,
      sscl,
      discount: discountVal,
      grandTotal,
      payments,
      shiftId: currentShift._id
    };

    try {
      const { data } = await axiosInstance.post('/sales', payload);
      setFinishedSale(data);
      clearCart();
      setShowPaymentModal(false);
      setCashPaid(0);
      setCardPaid(0);
      setQrPaid(0);
      fetchProducts(); // refresh stock levels
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  const lookupCustomers = async () => {
    try {
      const { data } = await axiosInstance.get(`/customers?search=${custSearch}`);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    try {
      const { data } = await axiosInstance.post('/customers', {
        name: newCustName,
        phone: newCustPhone
      });
      setCartCustomer(data);
      setShowCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating customer');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCat = category ? p.category === category : true;
    return matchCat;
  });

  return (
    <div style={styles.container}>
      {/* Left side catalog */}
      <div style={styles.catalogSide}>
        <form onSubmit={handleBarcodeSubmit} style={styles.searchForm}>
          <Search size={18} style={styles.searchIcon} />
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan Barcode or Search Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" className="btn btn-primary">Enter</button>
        </form>

        {/* Category Tabs */}
        <div style={styles.categoryTabs}>
          <button
            onClick={() => setCategory('')}
            style={{ ...styles.tab, ...(!category ? styles.activeTab : {}) }}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{ ...styles.tab, ...(category === cat ? styles.activeTab : {}) }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div style={styles.grid}>
          {filteredProducts.map(prod => (
            <div
              key={prod._id}
              onClick={() => {
                try {
                  addToCart(prod);
                } catch (err) {
                  alert(err.message);
                }
              }}
              style={{
                ...styles.prodCard,
                opacity: prod.stock === 0 ? 0.6 : 1,
                cursor: prod.stock === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <div style={styles.prodHeader}>
                <span style={styles.prodBrand}>{prod.brand || 'SyncPOS'}</span>
                <span className={`badge ${prod.stock <= prod.minStock ? 'badge-danger' : 'badge-success'}`}>
                  Qty: {prod.stock}
                </span>
              </div>
              <h4 style={styles.prodName}>{prod.name}</h4>
              <p style={styles.prodPrice}>LKR {prod.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right side cart */}
      <div style={styles.cartSide}>
        <div style={styles.cartHeader}>
          <h3>Shopping Cart</h3>
          <button onClick={clearCart} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Clear
          </button>
        </div>

        {/* Customer section */}
        <div style={styles.customerBox}>
          {cartCustomer ? (
            <div style={styles.selectedCustomer}>
              <div>
                <p style={{ fontWeight: '700' }}>{cartCustomer.name}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Tier: {cartCustomer.tier} | Points: {cartCustomer.loyaltyPoints}
                </span>
              </div>
              <button onClick={() => setCartCustomer(null)} style={styles.removeCustBtn}>Remove</button>
            </div>
          ) : (
            <button onClick={() => { setShowCustomerModal(true); lookupCustomers(); }} className="btn btn-secondary" style={{ width: '100%' }}>
              <UserPlus size={16} /> Attach Customer
            </button>
          )}
        </div>

        {/* Cart items list */}
        <div style={styles.cartList}>
          {cartItems.length === 0 ? (
            <div style={styles.emptyCart}>Cart is empty</div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} style={styles.cartItemRow}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    LKR {item.price.toLocaleString()}
                  </span>
                </div>
                <div style={styles.qtyControls}>
                  <button onClick={() => updateCartQty(item.productId, Math.max(1, item.quantity - 1))} style={styles.qtyBtn}>
                    <Minus size={12} />
                  </button>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} style={styles.qtyBtn}>
                    <Plus size={12} />
                  </button>
                </div>
                <div style={{ width: '80px', textAlign: 'right', fontWeight: '700' }}>
                  LKR {item.subtotal.toLocaleString()}
                </div>
                <button onClick={() => removeFromCart(item.productId)} style={styles.removeCartItemBtn}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & calculations */}
        <div style={styles.totalsBox}>
          <div style={styles.totalsRow}>
            <span>Subtotal</span>
            <span>LKR {subtotal.toLocaleString()}</span>
          </div>

          <div style={styles.totalsRow}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>Discount</span>
              <select
                value={discountType}
                onChange={(e) => setCartDiscount(cartDiscount, e.target.value)}
                style={{ width: '70px', padding: '2px', borderRadius: '4px', fontSize: '0.75rem' }}
              >
                <option value="flat">LKR</option>
                <option value="percent">%</option>
              </select>
            </div>
            <input
              type="number"
              value={cartDiscount}
              onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0, discountType)}
              style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', textAlign: 'right', fontSize: '0.85rem' }}
            />
          </div>

          {settings?.vatEnabled && (
            <div style={styles.totalsRow}>
              <span>VAT ({settings.vatRate}%)</span>
              <span>LKR {vat.toLocaleString()}</span>
            </div>
          )}

          {settings?.ssclEnabled && (
            <div style={styles.totalsRow}>
              <span>SSCL ({settings.ssclRate}%)</span>
              <span>LKR {sscl.toLocaleString()}</span>
            </div>
          )}

          <div style={{ ...styles.totalsRow, borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>Grand Total</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--teal-primary)' }}>
              LKR {grandTotal.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => {
              if (cartItems.length === 0) return;
              setCashPaid(grandTotal);
              setShowPaymentModal(true);
            }}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px', padding: '16px' }}
            disabled={cartItems.length === 0}
          >
            <CreditCard size={18} /> Proceed to Payment
          </button>
        </div>
      </div>

      {/* Customer Lookup/Create modal */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Customer Lookup</h3>
              <button onClick={() => setShowCustomerModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search by phone/name..."
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
              />
              <button onClick={lookupCustomers} className="btn btn-primary">Search</button>
            </div>

            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {customers.length === 0 ? (
                <p style={{ padding: '16px', color: 'var(--text-muted)' }}>No customers found.</p>
              ) : (
                customers.map(c => (
                  <div
                    key={c._id}
                    onClick={() => { setCartCustomer(c); setShowCustomerModal(false); }}
                    style={{ padding: '12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justify: 'space-between' }}
                  >
                    <span>{c.name} ({c.phone})</span>
                    <span className="badge badge-info">{c.tier}</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick register */}
            <form onSubmit={handleCreateCustomer} style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ marginBottom: '12px' }}>Quick Register Customer</h4>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register & Attach</button>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Split Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Split Payment Checkout</h3>
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Cancel</button>
            </div>

            <div style={{ backgroundColor: 'var(--input-bg)', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              <label>Amount Due</label>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--orange-primary)' }}>
                LKR {grandTotal.toLocaleString()}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div className="input-group">
                <label>Cash Paid (LKR)</label>
                <input
                  type="number"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(Number(e.target.value) || 0)}
                />
              </div>

              <div className="input-group">
                <label>Card Paid (LKR)</label>
                <input
                  type="number"
                  value={cardPaid}
                  onChange={(e) => setCardPaid(Number(e.target.value) || 0)}
                />
              </div>

              <div className="input-group">
                <label>LankaQR Paid (LKR)</label>
                <input
                  type="number"
                  value={qrPaid}
                  onChange={(e) => setQrPaid(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div style={styles.billingSummary}>
              <div style={styles.totalsRow}>
                <span>Total Paid</span>
                <span>LKR {totalPaid.toLocaleString()}</span>
              </div>
              <div style={styles.totalsRow}>
                <span>Change Due</span>
                <span style={{ fontWeight: '700', color: 'var(--teal-primary)' }}>
                  LKR {changeDue.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px' }}
              disabled={totalPaid < grandTotal}
            >
              Complete Sale
            </button>
          </div>
        </div>
      )}

      {/* Finished Sale printing drawer */}
      {finishedSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(20, 184, 166, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-primary)', marginBottom: '12px' }}>
                <Check size={24} />
              </div>
              <h3>Checkout Complete!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{finishedSale.invoiceNumber}</p>
            </div>

            {/* Invisible/print template */}
            <div style={{ display: 'none' }}>
              <div ref={receiptPrintRef} className="receipt-print" style={styles.receiptPrint}>
                <h2 style={{ textAlign: 'center' }}>{settings?.businessName || 'SyncPOS'}</h2>
                {settings?.tinNumber && <p style={{ textAlign: 'center' }}>TIN: {settings.tinNumber}</p>}
                <p style={{ textAlign: 'center' }}>{settings?.receiptHeader}</p>
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px dashed black' }} />
                <p>Invoice: {finishedSale.invoiceNumber}</p>
                <p>Date: {new Date(finishedSale.createdAt).toLocaleString()}</p>
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px dashed black' }} />
                <table style={{ width: '100%', fontSize: '0.9rem', color: 'black' }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid black', padding: '4px', color: 'black' }}>Item</th>
                      <th style={{ borderBottom: '1px solid black', padding: '4px', textAlign: 'center', color: 'black' }}>Qty</th>
                      <th style={{ borderBottom: '1px solid black', padding: '4px', textAlign: 'right', color: 'black' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedSale.items.map(item => (
                      <tr key={item._id}>
                        <td style={{ padding: '4px' }}>{item.name}</td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '4px', textAlign: 'right' }}>LKR {item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px dashed black' }} />
                <p style={{ textAlign: 'right' }}>Subtotal: LKR {finishedSale.totalAmount.toLocaleString()}</p>
                {finishedSale.discount > 0 && <p style={{ textAlign: 'right' }}>Discount: -LKR {finishedSale.discount.toLocaleString()}</p>}
                {finishedSale.vat > 0 && <p style={{ textAlign: 'right' }}>VAT: LKR {finishedSale.vat.toLocaleString()}</p>}
                {finishedSale.sscl > 0 && <p style={{ textAlign: 'right' }}>SSCL: LKR {finishedSale.sscl.toLocaleString()}</p>}
                <p style={{ textAlign: 'right', fontWeight: '800' }}>Grand Total: LKR {finishedSale.grandTotal.toLocaleString()}</p>
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px dashed black' }} />
                <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>{settings?.receiptFooter}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <ReactToPrint
                trigger={() => (
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    <Printer size={16} /> Print Receipt
                  </button>
                )}
                content={() => receiptPrintRef.current}
                onAfterPrint={() => setFinishedSale(null)}
              />
              <button onClick={() => setFinishedSale(null)} className="btn btn-secondary">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '24px',
    height: 'calc(100vh - 140px)',
  },
  catalogSide: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'hidden',
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '16px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    paddingLeft: '48px',
  },
  categoryTabs: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  activeTab: {
    backgroundColor: 'var(--teal-primary)',
    color: 'white',
    borderColor: 'var(--teal-primary)',
  },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '16px',
    overflowY: 'auto',
  },
  prodCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.2s',
  },
  prodHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  prodBrand: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  prodName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '12px',
  },
  prodPrice: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--teal-primary)',
  },
  cartSide: {
    flex: 1,
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  customerBox: {
    marginBottom: '16px',
  },
  selectedCustomer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--input-bg)',
    padding: '10px 16px',
    borderRadius: '8px',
  },
  removeCustBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  emptyCart: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    paddingTop: '60px',
  },
  cartItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--input-bg)',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    cursor: 'pointer',
  },
  removeCartItemBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '4px',
  },
  totalsBox: {
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '0.9rem',
  },
  billingSummary: {
    backgroundColor: 'var(--input-bg)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  receiptPrint: {
    padding: '20px',
    fontFamily: 'monospace',
    color: 'black',
    backgroundColor: 'white',
    width: '300px',
  }
};
