const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paidDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Overdue'], 
    default: 'Pending' 
  }
});

const hirePurchaseSchema = new mongoose.Schema({
  hpId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  totalPrice: { type: Number, required: true },
  downPayment: { type: Number, required: true },
  remainingBalance: { type: Number, required: true },
  interestRate: { type: Number, default: 0 },
  installments: [installmentSchema],
  status: { 
    type: String, 
    enum: ['Active', 'Completed', 'Defaulted'], 
    default: 'Active' 
  }
}, { timestamps: true });

module.exports = mongoose.model('HirePurchase', hirePurchaseSchema);
