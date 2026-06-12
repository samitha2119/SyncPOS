const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passed: { type: Boolean, required: true, default: false }
});

const tradeInSchema = new mongoose.Schema({
  tradeInId: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], default: 'Good' },
  checklist: [checklistItemSchema],
  valuation: { type: Number, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Rejected'], 
    default: 'Pending' 
  },
  creditGenerated: { type: Number, default: 0 },
  usedInSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TradeIn', tradeInSchema);
