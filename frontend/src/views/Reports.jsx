import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, BarChart2 } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('sales'); // 'sales', 'stock', 'tax'
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [taxSummary, setTaxSummary] = useState({ totalVat: 0, totalSscl: 0, taxableTurnover: 0 });

  const fetchReports = async () => {
    try {
      if (reportType === 'sales') {
        const { data } = await axiosInstance.get(`/sales?from=${fromDate}&to=${toDate}`);
        setSalesData(data);
      } else if (reportType === 'stock') {
        const { data } = await axiosInstance.get('/products');
        setStockData(data);
      } else if (reportType === 'tax') {
        const { data } = await axiosInstance.get(`/sales?from=${fromDate}&to=${toDate}&paymentStatus=Completed`);
        // Aggregate VAT & SSCL
        let vatSum = 0;
        let ssclSum = 0;
        let turnover = 0;
        data.forEach(sale => {
          vatSum += sale.vat || 0;
          ssclSum += sale.sscl || 0;
          turnover += sale.totalAmount || 0;
        });
        setTaxSummary({ totalVat: vatSum, totalSscl: ssclSum, taxableTurnover: turnover });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, fromDate, toDate]);

  const exportCSV = () => {
    let headers = '';
    let rows = [];
    let filename = '';

    if (reportType === 'sales') {
      headers = 'Invoice Number,Date,Cashier,Status,Vat,Sscl,Grand Total\n';
      rows = salesData.map(s => 
        `"${s.invoiceNumber}","${new Date(s.createdAt).toLocaleDateString()}","${s.cashierId?.name}","${s.status}",${s.vat},${s.sscl},${s.grandTotal}`
      );
      filename = `sales-report-${fromDate}-to-${toDate}.csv`;
    } else if (reportType === 'stock') {
      headers = 'Barcode,Product Name,Brand,Category,Current Stock,Price,Cost Price\n';
      rows = stockData.map(p => 
        `"${p.barcode || ''}","${p.name}","${p.brand || ''}","${p.category || ''}",${p.stock},${p.price},${p.costPrice}`
      );
      filename = 'stock-level-report.csv';
    }

    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart aggregation for sales (grouped by date)
  const chartSalesData = () => {
    const groups = {};
    salesData.forEach(sale => {
      const day = new Date(sale.createdAt).toLocaleDateString();
      groups[day] = (groups[day] || 0) + sale.grandTotal;
    });
    return Object.keys(groups).map(day => ({ date: day, total: groups[day] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filters & Export Header */}
      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {reportType !== 'stock' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '6px' }} />
              </div>
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '6px' }} />
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {reportType !== 'tax' && (
            <button onClick={exportCSV} className="btn btn-secondary">
              <Download size={16} /> Export to CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'sales', name: 'Sales Performance' },
          { id: 'stock', name: 'Inventory Levels' },
          { id: 'tax', name: 'Tax Filing (IRD Filing)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              color: reportType === tab.id ? 'var(--teal-primary)' : 'var(--text-muted)',
              borderBottom: reportType === tab.id ? '2px solid var(--teal-primary)' : 'none',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {reportType === 'sales' && (
        <div className="grid-2" style={{ gridTemplateColumns: '2fr 1.2fr' }}>
          <div className="card">
            <h3>Sales Performance Trend</h3>
            <div style={{ height: '300px', width: '100%', marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSalesData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                  <Bar dataKey="total" fill="var(--teal-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Invoice Log</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {salesData.map(sale => (
                <div key={sale._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ fontWeight: '700' }}>{sale.invoiceNumber}</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
                  </div>
                  <strong>LKR {sale.grandTotal.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'stock' && (
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Stock Valuation</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map(p => (
                <tr key={p._id}>
                  <td>{p.barcode || '—'}</td>
                  <td style={{ fontWeight: '700' }}>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>{p.category}</td>
                  <td>{p.stock}</td>
                  <td>LKR {(p.stock * p.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'tax' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
            <BarChart2 size={36} color="var(--teal-primary)" style={{ marginBottom: '12px' }} />
            <h3>IRD Tax Summary</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Summary calculated for {fromDate} to {toDate}
            </p>
          </div>

          <div style={styles.taxMetricRow}>
            <span>Taxable Turnover</span>
            <strong>LKR {taxSummary.taxableTurnover.toLocaleString()}</strong>
          </div>
          <div style={styles.taxMetricRow}>
            <span>VAT Collected</span>
            <strong>LKR {taxSummary.totalVat.toLocaleString()}</strong>
          </div>
          <div style={styles.taxMetricRow}>
            <span>SSCL Collected</span>
            <strong>LKR {taxSummary.totalSscl.toLocaleString()}</strong>
          </div>

          <div style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> These tax summaries are based on closed invoice totals including active tax rates configured in settings. Check Settings to verify configured tax percentages.
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  taxMetricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: 'var(--input-bg)',
    borderRadius: '8px',
  }
};
