import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Plus, ShieldAlert, Key } from 'lucide-react';

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('Cashier');

  // Reset PIN state
  const [newPin, setNewPin] = useState('');

  const fetchStaff = async () => {
    try {
      const { data } = await axiosInstance.get('/staff');
      setStaffList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/staff', { name, email, password, pin, role });
      setShowAddModal(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding staff user');
    }
  };

  const handleResetPinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await axiosInstance.patch(`/staff/${selectedStaff._id}/reset-pin`, { pin: newPin });
      setShowPinModal(false);
      setNewPin('');
      setSelectedStaff(null);
      fetchStaff();
      alert('PIN reset successful!');
    } catch (err) {
      alert(err.response?.data?.message || 'PIN reset failed');
    }
  };

  const toggleStaffStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'reactivate'} this user?`)) return;
    try {
      await axiosInstance.put(`/staff/${user._id}`, {
        isActive: !user.isActive
      });
      fetchStaff();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPin('');
    setRole('Cashier');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Team Member
        </button>
      </div>

      {/* Directory Table */}
      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>PIN Code</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(st => (
              <tr key={st._id}>
                <td style={{ fontWeight: '700' }}>{st.name}</td>
                <td>{st.email}</td>
                <td><span className="badge badge-info">{st.role}</span></td>
                <td><code>••••</code></td>
                <td>
                  <span className={`badge ${st.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {st.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button
                      onClick={() => { setSelectedStaff(st); setShowPinModal(true); }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      title="Reset PIN"
                    >
                      <Key size={12} /> Reset PIN
                    </button>
                    <button
                      onClick={() => toggleStaffStatus(st)}
                      className={`btn ${st.isActive ? 'btn-danger' : 'btn-primary'}`}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      {st.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reset PIN Modal */}
      {showPinModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Reset PIN: {selectedStaff.name}</h3>
              <button onClick={() => setShowPinModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleResetPinSubmit}>
              <div className="input-group">
                <label>New 4-digit PIN Code</label>
                <input
                  type="text"
                  maxLength="4"
                  placeholder="e.g. 9988"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Save New PIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff user Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Register New Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>
            <form onSubmit={handleAddStaffSubmit} className="grid-2">
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Administrator</option>
                  <option value="Technician">Technician</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>4-digit PIN Code</label>
                <input type="text" maxLength="4" placeholder="e.g. 5678" value={pin} onChange={(e) => setPin(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                Save User Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
