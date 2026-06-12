const Delivery = require('../models/Delivery');

// Helper to generate Delivery ID
const generateDeliveryId = async () => {
  const count = await Delivery.countDocuments();
  return `DEL-${1000 + count + 1}`;
};

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Private
const getDeliveries = async (req, res) => {
  const { status, driverId } = req.query;
  let query = {};
  if (status) {
    query.status = status;
  }
  if (driverId) {
    query.driverId = driverId;
  }
  try {
    const deliveries = await Delivery.find(query)
      .populate('saleId')
      .populate('driverId', 'name');
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a delivery record
// @route   POST /api/deliveries
// @access  Private
const createDelivery = async (req, res) => {
  const { saleId, customerName, customerPhone, deliveryAddress, driverId, notes } = req.body;
  try {
    const deliveryId = await generateDeliveryId();
    const delivery = new Delivery({
      deliveryId,
      saleId,
      customerName,
      customerPhone,
      deliveryAddress,
      driverId: driverId || null,
      notes
    });

    const saved = await delivery.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update delivery status
// @route   PATCH /api/deliveries/:id/status
// @access  Private
const updateDeliveryStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (delivery) {
      delivery.status = status;
      const updated = await delivery.save();

      // Socket update trigger
      const io = req.app.get('socketio');
      if (io) {
        io.emit('delivery:update', { delivery: updated });
      }

      res.json(updated);
    } else {
      res.status(404).json({ message: 'Delivery not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign driver to delivery
// @route   PATCH /api/deliveries/:id/assign
// @access  Private (Admin/Manager)
const assignDriver = async (req, res) => {
  const { driverId } = req.body;
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (delivery) {
      delivery.driverId = driverId;
      const updated = await delivery.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Delivery not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDeliveries,
  createDelivery,
  updateDeliveryStatus,
  assignDriver
};
