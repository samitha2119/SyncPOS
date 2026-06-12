import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useStore } from '../store/useStore';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  const { settings, fetchSettings, updateSettings } = useStore();
  const [businessName, setBusinessName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [vatRate, setVatRate] = useState(15);
  const [ssclRate, setSsclRate] = useState(2.5);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [ssclEnabled, setSsclEnabled] = useState(false);
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [paperWidth, setPaperWidth] = useState('80mm');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    } else {
      setBusinessName(settings.businessName || '');
      setTinNumber(settings.tinNumber || '');
      setCurrency(settings.currency || 'LKR');
      setVatRate(settings.vatRate || 15);
      setSsclRate(settings.ssclRate || 2.5);
      setVatEnabled(settings.vatEnabled || false);
      setSsclEnabled(settings.ssclEnabled || false);
      setReceiptHeader(settings.receiptHeader || '');
      setReceiptFooter(settings.receiptFooter || '');
      setPaperWidth(settings.paperWidth || '80mm');
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        businessName,
        tinNumber,
        currency,
        vatRate: Number(vatRate),
        ssclRate: Number(ssclRate),
        vatEnabled,
        ssclEnabled,
        receiptHeader,
        receiptFooter,
        paperWidth
      });
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '24px' }}>
          <SettingsIcon size={24} color="var(--teal-primary)" />
          <h3>System Settings</h3>
        </div>

        <form onSubmit={handleSubmit} className="grid-2" style={{ gap: '20px' }}>
          <h4 style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--teal-primary)' }}>Store Identity</h4>
          
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Business Name</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>TIN Number</label>
            <input type="text" value={tinNumber} onChange={(e) => setTinNumber(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Base Currency</label>
            <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
          </div>

          <h4 style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--teal-primary)', marginTop: '12px' }}>Taxes & Levies</h4>

          {/* VAT CONFIG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={vatEnabled}
                onChange={(e) => setVatEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Enable VAT (Value Added Tax)</span>
            </label>
            {vatEnabled && (
              <div className="input-group" style={{ marginTop: '8px' }}>
                <label>VAT Rate (%)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <strong style={{ width: '50px' }}>{vatRate}%</strong>
                </div>
              </div>
            )}
          </div>

          {/* SSCL CONFIG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={ssclEnabled}
                onChange={(e) => setSsclEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Enable SSCL (Social Security Contribution Levy)</span>
            </label>
            {ssclEnabled && (
              <div className="input-group" style={{ marginTop: '8px' }}>
                <label>SSCL Rate (%)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={ssclRate}
                    onChange={(e) => setSsclRate(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <strong style={{ width: '50px' }}>{ssclRate}%</strong>
                </div>
              </div>
            )}
          </div>

          <h4 style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--teal-primary)', marginTop: '12px' }}>Receipt Customization</h4>

          <div className="input-group">
            <label>Paper Width</label>
            <select value={paperWidth} onChange={(e) => setPaperWidth(e.target.value)}>
              <option value="80mm">80mm (Thermal Standard)</option>
              <option value="58mm">58mm (Mobile Printer)</option>
            </select>
          </div>
          <div style={{ display: 'flex' }} />

          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Receipt Header Message</label>
            <input type="text" value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} />
          </div>

          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Receipt Footer Message</label>
            <input type="text" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '24px', padding: '16px' }} disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
