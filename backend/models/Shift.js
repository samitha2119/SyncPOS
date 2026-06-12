const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  openingFloat: { type: Number, required: true },
  expectedCash: { type: Number, default: 0 }, // dynamically calculated: float + cash sales
  actualCash: { type: Number }, // input by cashier at closing
  variance: { type: Number }, // actualCash - expectedCash
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  salesCount: { type: Number, default: 0 },
  totalSalesAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
