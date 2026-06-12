import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Landmark, ArrowUpRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ShiftControl() {
  const { currentShift, openShift, closeShift } = useStore();
  const [openingFloat, setOpeningFloat] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [closedShiftRecap, setClosedShiftRecap] = useState(null);

  const handleOpenShift = async (e) => {
    e.preventDefault();
    const float = parseFloat(openingFloat);
    if (isNaN(float) || float < 0) {
      alert('Please enter a valid positive float amount.');
      return;
    }
    try {
      await openShift(float);
      setOpeningFloat('');
    } catch (err) {
      alert('Failed to open shift.');
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    const actual = parseFloat(actualCash);
    if (isNaN(actual) || actual < 0) {
      alert('Please enter a valid cash amount in register.');
      return;
    }
    try {
      const data = await closeShift(actual);
      setClosedShiftRecap(data);
      setActualCash('');
    } catch (err) {
      alert('Failed to close shift.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {!currentShift ? (
        <div>
          {closedShiftRecap && (
            <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--teal-primary)', backgroundColor: 'rgba(20, 184, 166, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <CheckCircle color="var(--teal-primary)" />
                <h3 style={{ fontWeight: '700' }}>Shift Closed & Reconciled</h3>
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                Shift recap is calculated below. The register session has been saved.
              </p>
              <div style={styles.recapGrid}>
                <div>Expected Cash: <strong>LKR {closedShiftRecap.expectedCash.toLocaleString()}</strong></div>
                <div>Actual Cash: <strong>LKR {closedShiftRecap.actualCash.toLocaleString()}</strong></div>
                <div style={{ color: closedShiftRecap.variance < 0 ? '#ef4444' : 'var(--teal-primary)' }}>
                  Variance: <strong>LKR {closedShiftRecap.variance.toLocaleString()}</strong>
                </div>
                <div>Orders: <strong>{closedShiftRecap.salesCount}</strong></div>
              </div>
              <button onClick={() => setClosedShiftRecap(null)} className="btn btn-secondary" style={{ marginTop: '12px' }}>
                Dismiss
              </button>
            </div>
          )}

          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Landmark size={40} color="var(--teal-primary)" style={{ marginBottom: '12px' }} />
              <h3>Open Register Session</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Please set the drawer opening float before processing sales.
              </p>
            </div>

            <form onSubmit={handleOpenShift}>
              <div className="input-group">
                <label>Opening Float (LKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                Open Shift
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <h3>Active Register Session</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Started at {new Date(currentShift.startTime).toLocaleTimeString()}
              </p>
            </div>
            <span className="badge badge-success">Open</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            <div style={styles.metricRow}>
              <span>Opening Float</span>
              <strong>LKR {currentShift.openingFloat.toLocaleString()}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Expected Cash Drawer</span>
              <strong>LKR {currentShift.expectedCash.toLocaleString()}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Total Shift Sales</span>
              <strong>LKR {currentShift.totalSalesAmount.toLocaleString()}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Orders Processed</span>
              <strong>{currentShift.salesCount}</strong>
            </div>
          </div>

          <form onSubmit={handleCloseShift} style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>Reconcile & Close Shift</h4>
            <div className="input-group">
              <label>Actual Cash in Drawer (LKR)</label>
              <input
                type="number"
                placeholder="Enter exact counted cash amount"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '14px' }}>
              Reconcile & Close Shift
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: 'var(--input-bg)',
    borderRadius: '8px',
  },
  recapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '12px',
    fontSize: '0.9rem',
  }
};
