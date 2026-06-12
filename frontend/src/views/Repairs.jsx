import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import SignatureCanvas from 'react-signature-canvas';
import { Search, Plus, Wrench, Shield, Check, Printer } from 'lucide-react';

export default function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('Pending');
  const [technicians, setTechnicians] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [techId, setTechId] = useState('');
  const [notes, setNotes] = useState('');
  
  // Canvas states
  const [damagePoints, setDamagePoints] = useState([]);
  const [tempNotes, setTempNotes] = useState('');
  const [damageTarget, setDamageTarget] = useState(null); // {x, y} coordinates of click
  const signatureRef = useRef(null);

  const fetchRepairsAndTechs = async () => {
    try {
      const [repRes, techRes] = await Promise.all([
        axiosInstance.get(`/repairs?search=${search}`),
        axiosInstance.get('/staff') // fetches technicians too
      ]);
      setRepairs(repRes.data);
      setTechnicians(techRes.data.filter(s => s.role === 'Technician'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRepairsAndTechs();
  }, [search]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (signatureRef.current.isEmpty()) {
      alert('Please have the customer sign the liability waiver.');
      return;
    }

    const sigData = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');

    try {
      await axiosInstance.post('/repairs', {
        customerName,
        customerPhone,
        deviceModel,
        imei,
        issueDescription,
        estimatedCost: Number(estimatedCost),
        technicianId: techId || undefined,
        signature: sigData,
        damageMapPoints: damagePoints,
        notes
      });
      setShowAddModal(false);
      resetForm();
      fetchRepairsAndTechs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating repair ticket');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/repairs/${id}/status`, { status: newStatus });
      fetchRepairsAndTechs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDamageCanvasClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setDamageTarget({ x, y });
  };

  const addDamagePoint = () => {
    if (!damageTarget) return;
    setDamagePoints([...damagePoints, { x: damageTarget.x, y: damageTarget.y, notes: tempNotes }]);
    setDamageTarget(null);
    setTempNotes('');
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDeviceModel('');
    setImei('');
    setIssueDescription('');
    setEstimatedCost('');
    setTechId('');
    setNotes('');
    setDamagePoints([]);
    if (signatureRef.current) signatureRef.current.clear();
  };

  const filteredRepairs = repairs.filter(r => r.status === statusTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filters header */}
      <div style={{ display: 'flex', justify: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by IMEI, Customer Name, Phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Repair Job
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              color: statusTab === tab ? 'var(--teal-primary)' : 'var(--text-muted)',
              borderBottom: statusTab === tab ? '2px solid var(--teal-primary)' : 'none',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Repairs Table */}
      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Customer</th>
              <th>Device / IMEI</th>
              <th>Issue</th>
              <th>Technician</th>
              <th>Cost Estimate</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRepairs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No repair jobs in {statusTab} status.
                </td>
              </tr>
            ) : (
              filteredRepairs.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight: '700', color: 'var(--orange-primary)' }}>{r.jobId}</td>
                  <td>
                    <strong>{r.customerName}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.customerPhone}</p>
                  </td>
                  <td>
                    <strong>{r.deviceModel}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IMEI: {r.imei}</p>
                  </td>
                  <td>{r.issueDescription}</td>
                  <td>{r.technicianId?.name || 'Unassigned'}</td>
                  <td>LKR {r.estimatedCost.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusUpdate(r._id, e.target.value)}
                      style={{ width: '130px', padding: '6px' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add repair ticket dialog modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>New Repair Job Ticket</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
            </div>

            <form onSubmit={handleCreateJob} style={styles.modalGrid}>
              {/* Form columns */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={styles.subHeading}><Wrench size={16} /> Device & Customer Info</h4>
                <div className="input-group">
                  <label>Customer Name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Customer Phone</label>
                  <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Device Model</label>
                  <input type="text" placeholder="e.g. iPhone 13 Pro" value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>IMEI / Serial</label>
                  <input type="text" value={imei} onChange={(e) => setImei(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Issue Description</label>
                  <input type="text" value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} required />
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Estimated Cost</label>
                    <input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Assign Technician</label>
                    <select value={techId} onChange={(e) => setTechId(e.target.value)}>
                      <option value="">Select Technician</option>
                      {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Diagnosis Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" />
                </div>
              </div>

              {/* Damage canvas mapping */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={styles.subHeading}><Shield size={16} /> Visual Damage Mapping</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Click on the smartphone template below to map physical damages/scratches.
                </p>

                <div style={styles.canvasContainer}>
                  <div style={styles.phoneTemplate} onClick={handleDamageCanvasClick}>
                    {/* CSS Phone Template outline */}
                    <div style={styles.phoneOutline}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap to Mark Damage</span>
                    </div>

                    {/* Render mapped damage pins */}
                    {damagePoints.map((pt, idx) => (
                      <div
                        key={idx}
                        style={{ ...styles.damagePin, left: `${pt.x}%`, top: `${pt.y}%` }}
                        title={pt.notes}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>

                  {damageTarget && (
                    <div style={styles.pointInputBox}>
                      <label>Mark Damage Point ({damageTarget.x}%, {damageTarget.y}%)</label>
                      <input
                        type="text"
                        placeholder="Description (e.g. Scratched screen)"
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                      />
                      <button type="button" onClick={addDamagePoint} className="btn btn-primary" style={{ marginTop: '8px', padding: '6px' }}>
                        Pin Point
                      </button>
                    </div>
                  )}
                </div>

                {/* Signature canvas liability sign off */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label>Customer Signature (Liability Waiver)</label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    By signing, the client agrees that SyncPOS is not liable for existing software faults.
                  </p>
                  <div style={styles.signatureWrap}>
                    <SignatureCanvas
                      ref={signatureRef}
                      penColor="black"
                      canvasProps={{ width: 380, height: 100, className: 'sigCanvas' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '12px' }}>
                  <Check size={18} /> Create Repair Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '32px',
  },
  subHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '8px',
  },
  canvasContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  phoneTemplate: {
    width: '180px',
    height: '320px',
    border: '4px solid var(--border)',
    borderRadius: '24px',
    position: 'relative',
    cursor: 'crosshair',
    backgroundColor: 'var(--input-bg)',
    overflow: 'hidden',
  },
  phoneOutline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  damagePin: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
  },
  pointInputBox: {
    width: '100%',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
  },
  signatureWrap: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'white',
    width: '100%',
    height: '102px',
  },
};
