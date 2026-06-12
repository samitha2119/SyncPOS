const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  businessName: { type: String, default: 'SyncPOS' },
  tinNumber: { type: String, default: '' },
  currency: { type: String, default: 'LKR' },
  vatRate: { type: Number, default: 15 }, // %
  ssclRate: { type: Number, default: 2.5 }, // %
  vatEnabled: { type: Boolean, default: false },
  ssclEnabled: { type: Boolean, default: false },
  receiptHeader: { type: String, default: 'Welcome to SyncPOS!' },
  receiptFooter: { type: String, default: 'Thank you for your business. Please come again!' },
  paperWidth: { type: String, enum: ['58mm', '80mm'], default: '80mm' }
});

module.exports = mongoose.model('Setting', settingSchema);
