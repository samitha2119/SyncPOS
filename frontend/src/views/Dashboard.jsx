import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { TrendingUp, ShoppingBag, AlertTriangle, UserCheck } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ revenue: 0, salesCount: 0, lowStockCount: 0, openShift: null });
  const [trendData, setTrendData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentShift } = useStore();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendRes, topRes] = await Promise.all([
        axiosInstance.get('/dashboard/stats'),
        axiosInstance.get('/dashboard/sales-trend'),
        axiosInstance.get('/dashboard/top-products')
      ]);

      setStats(statsRes.data);
      setTrendData(trendRes.data);
      setTopProducts(topRes.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Setup listener on store if socket exists
    const socket = useStore.getState().socket;
    if (socket) {
      socket.on('dashboardUpdate', fetchDashboardData);
      return () => {
        socket.off('dashboardUpdate', fetchDashboardData);
      };
    }
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '40px' }}>Loading Dashboard Analytics...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Stats Row */}
      <div className="grid-4">
        {/* Revenue */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--teal-primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <label>Monthly Revenue</label>
            <h2 style={styles.statVal}>LKR {stats.revenue.toLocaleString()}</h2>
          </div>
        </div>

        {/* Sales Count */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-primary)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <label>Orders Processed</label>
            <h2 style={styles.statVal}>{stats.salesCount}</h2>
          </div>
        </div>

        {/* Low Stock count */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <label>Low Stock Alerts</label>
            <h2 style={styles.statVal}>{stats.lowStockCount} items</h2>
          </div>
        </div>

        {/* Active Cashier */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--orange-primary)' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <label>Shift Operator</label>
            <h2 style={styles.statVal}>{stats.openShift ? stats.openShift.cashier : 'None (Closed)'}</h2>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Sales Trend Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>7-Day Sales Trend</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {trendData.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '100px' }}>No sales trend data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--teal-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--teal-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                  <Area type="monotone" dataKey="sales" stroke="var(--teal-primary)" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Top 10 Selling Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topProducts.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '60px' }}>No sales logged yet.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p._id || idx} style={styles.topProductRow}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={styles.rankNum}>{idx + 1}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{p.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--teal-primary)' }}>{p.quantitySold} sold</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LKR {p.totalSales.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  iconBg: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: '1.35rem',
    fontWeight: '700',
    marginTop: '4px',
  },
  topProductRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  rankNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
