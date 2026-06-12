import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Plus, Edit3, Trash2, ArrowUp, ArrowDown, History } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showMovementsDrawer, setShowMovementsDrawer] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [brand, setBrand] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [businessType, setBusinessType] = useState('Retail');

  // Adjust stock states
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('IN'); // IN or OUT
  const [adjustReason, setAdjustReason] = useState('');

  // Add batch states
  const [batchNum, setBatchNum] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchQty, setBatchQty] = useState('');

  // Movement drawer state
  const [movements, setMovements] = useState([]);

  const fetchProducts = async () => {
    try {
      const { data } = await axiosInstance.get(`/products?search=${search}&category=${category}`);
      setProducts(data);
      const cats = [...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/products', {
        name,
        barcode: barcode || undefined,
        price: Number(price),
        costPrice: Number(costPrice),
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5,
        brand,
        category: formCategory,
        businessType
      });
      setShowAddModal(false);
      resetAddForm();
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await axiosInstance.post(`/products/${selectedProduct._id}/adjust-stock`, {
        quantity: Number(adjustQty),
        type: adjustType,
        reason: adjustReason
      });
      setShowAdjustModal(false);
      setAdjustQty('');
      setAdjustReason('');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  const handleAddBatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await axiosInstance.post(`/products/${selectedProduct._id}/batches`, {
        batchNumber: batchNum,
        expiryDate: batchExpiry,
        quantity: Number(batchQty)
      });
      setShowBatchModal(false);
      setBatchNum('');
      setBatchExpiry('');
      setBatchQty('');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding batch');
    }
  };

  const viewMovements = async (product) => {
    try {
      const { data } = await axiosInstance.get(`/products/${product._id}/movements`);
      setMovements(data);
      setSelectedProduct(product);
      setShowMovementsDrawer(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axiosInstance.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetAddForm = () => {
    setName('');
    setBarcode('');
    setPrice('');
    setCostPrice('');
    setStock('');
    setMinStock('');
    setBrand('');
    setFormCategory('');
    setBusinessType('Retail');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search & Actions Header */}
      <div style={{ display: 'flex', justify: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input
            type="text"
            placeholder="Search by name, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: '200px' }}>
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Products list table */}
      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table>
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Cost</th>
              <th>Business Type</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No products registered in system.
                </td>
              </tr>
            ) : (
              products.map(p => (
                <tr key={p._id}>
                  <td>{p.barcode || '—'}</td>
                  <td style={{ fontWeight: '700' }}>{p.name}</td>
                  <td>{p.category || '—'}</td>
                  <td>{p.brand || '—'}</td>
                  <td>
                    <span className={`badge ${p.stock <= p.minStock ? 'badge-danger' : 'badge-success'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>LKR {p.price.toLocaleString()}</td>
                  <td>LKR {p.costPrice.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-info">{p.businessType}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => { setSelectedProduct(p); setShowAdjustModal(true); }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Adjust Stock"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(p); setShowBatchModal(true); }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Add Batch"
                      >
                        Batch
                      </button>
                      <button
                        onClick={() => viewMovements(p)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Movement Logs"
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleAddProductSubmit} className="grid-2">
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Barcode</label>
                <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Business Type</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                  <option value="Retail">Retail</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Repair">Repair</option>
                </select>
              </div>
              <div className="input-group">
                <label>Sale Price (LKR)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Cost Price (LKR)</label>
                <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Initial Stock</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Min Alert Stock</label>
                <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Brand</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Category</label>
                <input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Adjust Stock: {selectedProduct.name}</h3>
              <button onClick={() => setShowAdjustModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleAdjustStockSubmit}>
              <div className="input-group">
                <label>Adjustment Type</label>
                <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)}>
                  <option value="IN">Stock In (+)</option>
                  <option value="OUT">Stock Out (-)</option>
                  <option value="ADJUSTMENT">Adjustment (Refill)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Quantity</label>
                <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Reason for Adjustment</label>
                <input type="text" placeholder="e.g. Broken item / manual audit count" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Apply Adjustment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showBatchModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Add Batch: {selectedProduct.name}</h3>
              <button onClick={() => setShowBatchModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleAddBatchSubmit}>
              <div className="input-group">
                <label>Batch Number</label>
                <input type="text" placeholder="e.g. BATCH-A09" value={batchNum} onChange={(e) => setBatchNum(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Expiry Date</label>
                <input type="date" value={batchExpiry} onChange={(e) => setBatchExpiry(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Quantity</label>
                <input type="number" value={batchQty} onChange={(e) => setBatchQty(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Save Batch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Movements Drawer Modal */}
      {showMovementsDrawer && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Movement Log: {selectedProduct.name}</h3>
              <button onClick={() => setShowMovementsDrawer(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {movements.length === 0 ? (
                <p style={{ padding: '16px', color: 'var(--text-muted)' }}>No movements recorded yet.</p>
              ) : (
                movements.map((move, idx) => (
                  <div
                    key={move._id || idx}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span className={`badge ${move.type === 'IN' ? 'badge-success' : move.type === 'OUT' ? 'badge-danger' : 'badge-warning'}`}>
                        {move.type}
                      </span>
                      <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(move.date).toLocaleDateString()}
                      </span>
                      <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>{move.reason || 'Manual log'}</p>
                    </div>
                    <strong style={{ fontSize: '1rem' }}>
                      {move.type === 'OUT' ? '-' : '+'}{move.quantity}
                    </strong>
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
