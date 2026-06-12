const Repair = require('../models/Repair');

// Helper to generate Repair Job ID (e.g. REP-10001)
const generateJobId = async () => {
  const count = await Repair.countDocuments();
  return `REP-${10000 + count + 1}`;
};

// @desc    Get all repair jobs
// @route   GET /api/repairs
// @access  Private
const getRepairs = async (req, res) => {
  const { status, search } = req.query;
  let query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
      { imei: { $regex: search, $options: 'i' } },
      { jobId: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const repairs = await Repair.find(query).populate('technicianId', 'name');
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single repair job
// @route   GET /api/repairs/:id
// @access  Private
const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id).populate('technicianId', 'name');
    if (repair) {
      res.json(repair);
    } else {
      res.status(404).json({ message: 'Repair job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a repair job
// @route   POST /api/repairs
// @access  Private
const createRepair = async (req, res) => {
  const { customerName, customerPhone, deviceModel, imei, issueDescription, estimatedCost, technicianId, signature, damageMapPoints, notes } = req.body;
  try {
    const jobId = await generateJobId();
    const repair = new Repair({
      jobId,
      customerName,
      customerPhone,
      deviceModel,
      imei,
      issueDescription,
      estimatedCost,
      technicianId: technicianId || null,
      signature,
      damageMapPoints,
      notes
    });

    const saved = await repair.save();

    // Socket notification
    const io = req.app.get('socketio');
    if (io) {
      io.emit('dashboardUpdate', {});
      io.emit('notificationUpdate', { type: 'New Repair', message: `New repair ticket ${jobId} added.` });
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update repair status
// @route   PATCH /api/repairs/:id/status
// @access  Private
const updateRepairStatus = async (req, res) => {
  const { status, notes } = req.body;
  try {
    const repair = await Repair.findById(req.params.id);
    if (repair) {
      repair.status = status;
      if (notes) {
        repair.notes = notes;
      }
      const updated = await repair.save();

      // Socket update trigger
      const io = req.app.get('socketio');
      if (io) {
        io.emit('dashboardUpdate', {});
        io.emit('notificationUpdate', { type: 'Repair Update', message: `Repair ${repair.jobId} updated to ${status}` });
      }

      res.json(updated);
    } else {
      res.status(404).json({ message: 'Repair job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign technician to repair
// @route   PATCH /api/repairs/:id/assign
// @access  Private (Admin/Manager)
const assignTechnician = async (req, res) => {
  const { technicianId } = req.body;
  try {
    const repair = await Repair.findById(req.params.id);
    if (repair) {
      repair.technicianId = technicianId;
      const updated = await repair.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Repair job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepairStatus,
  assignTechnician
};
