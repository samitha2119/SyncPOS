const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['Cash', 'Card', 'LankaQR'], required: true },
  amount: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  items: [saleItemSchema],
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: String, default: 'main' },
  totalAmount: { type: Number, required: true }, // Before tax/discount
  vat: { type: Number, default: 0 },
  sscl: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true }, // Final payable
  payments: [paymentSchema],
  status: { type: String, enum: ['Completed', 'Refunded', 'Voided'], default: 'Completed' },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  refundReason: { type: String },
  voidReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
