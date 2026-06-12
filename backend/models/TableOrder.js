const mongoose = require('mongoose');

const tableOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Sent', 'Served', 'Cancelled'], 
    default: 'Pending' 
  }
});

const tableOrderSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['Available', 'Occupied', 'Bill Requested'], 
    default: 'Available' 
  },
  items: [tableOrderItemSchema],
  activeOrderId: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }
}, { timestamps: true });

module.exports = mongoose.model('TableOrder', tableOrderSchema);
