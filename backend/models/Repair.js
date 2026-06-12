const mongoose = require('mongoose');

const damagePointSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  notes: { type: String }
});

const repairSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deviceModel: { type: String, required: true },
  imei: { type: String, required: true },
  issueDescription: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  estimatedCost: { type: Number, required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  signature: { type: String }, // Base64 data from signature pad
  damageMapPoints: [damagePointSchema], // Damage coordinate points from front/back mobile template canvas
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Repair', repairSchema);
