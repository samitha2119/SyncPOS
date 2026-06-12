const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  nic: { type: String },
  loyaltyPoints: { type: Number, default: 0 },
  tier: { 
    type: String, 
    enum: ['Bronze', 'Silver', 'Gold'], 
    default: 'Bronze' 
  }
}, { timestamps: true });

// Pre-save to dynamically update the customer tier based on points
customerSchema.pre('save', function (next) {
  if (this.loyaltyPoints < 5000) {
    this.tier = 'Bronze';
  } else if (this.loyaltyPoints >= 5000 && this.loyaltyPoints < 20000) {
    this.tier = 'Silver';
  } else {
    this.tier = 'Gold';
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
