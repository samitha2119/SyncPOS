import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useStore } from '../store/useStore';
import { Truck, Check, ArrowRight } from 'lucide-react';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const fetchDeliveriesAndDrivers = async () => {
    try {
      const [delRes, staffRes] = await Promise.all([
        axiosInstance.get('/deliveries'),
        axiosInstance.get('/staff')
      ]);
      setDeliveries(delRes.data);
      setDrivers(staffRes.data.filter(s => s.role === 'Driver'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDeliveriesAndDrivers();
    const socket = useStore.getState().socket;
    if (socket) {
      socket.on('delivery:update', fetchDeliveriesAndDrivers);
      return () => {
        socket.off('delivery:update', fetchDeliveriesAndDrivers);
      };
    }
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axiosInstance.patch(`/deliveries/${id}/status`, { status });
      fetchDeliveriesAndDrivers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignDriver = async (id, driverId) => {
    try {
      await axiosInstance.patch(`/deliveries/${id}/assign`, { driverId });
      fetchDeliveriesAndDrivers();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Kanban Board */}
      <div style={styles.board}>
        {columns.map(col => {
          const colItems = deliveries.filter(d => d.status === col);
          return (
            <div key={col} style={styles.column}>
              <div style={styles.columnHeader}>
                <h4>{col}</h4>
                <span className="badge badge-info">{colItems.length}</span>
              </div>

              <div style={styles.columnBody}>
                {colItems.map(d => (
                  <div key={d._id} className="card" style={styles.card}>
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--orange-primary)' }}>{d.deliveryId}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                      <p><strong>Customer:</strong> {d.customerName}</p>
                      <p><strong>Phone:</strong> {d.customerPhone}</p>
                      <p><strong>Address:</strong> {d.deliveryAddress}</p>
                    </div>

                    {/* Driver assignment */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.7rem' }}>Driver Assigned</label>
                      <select
                        value={d.driverId?._id || ''}
                        onChange={(e) => handleAssignDriver(d._id, e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', marginTop: '4px' }}
                      >
                        <option value="">Unassigned</option>
                        {drivers.map(dr => <option key={dr._id} value={dr._id}>{dr.name}</option>)}
                      </select>
                    </div>

                    {/* Quick advance status */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      {col === 'Pending' && (
                        <button
                          onClick={() => handleStatusUpdate(d._id, 'In Transit')}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
                        >
                          Ship Out <ArrowRight size={12} />
                        </button>
                      )}
                      {col === 'In Transit' && (
                        <button
                          onClick={() => handleStatusUpdate(d._id, 'Delivered')}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '6px', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                        >
                          Mark Delivered <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    height: 'calc(100vh - 180px)',
    overflow: 'hidden',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--input-bg)',
    borderRadius: '16px',
    padding: '16px',
    overflow: 'hidden',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '2px solid var(--border)',
    paddingBottom: '8px',
  },
  columnBody: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    padding: '16px',
    backgroundColor: 'var(--bg-card)',
  }
};
