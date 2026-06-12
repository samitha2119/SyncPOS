const Setting = require('../models/Setting');

// @desc    Get store settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      // Create defaults
      settings = new Setting();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private (Admin/Manager)
const updateSettings = async (req, res) => {
  const { businessName, tinNumber, currency, vatRate, ssclRate, vatEnabled, ssclEnabled, receiptHeader, receiptFooter, paperWidth } = req.body;
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    settings.businessName = businessName !== undefined ? businessName : settings.businessName;
    settings.tinNumber = tinNumber !== undefined ? tinNumber : settings.tinNumber;
    settings.currency = currency !== undefined ? currency : settings.currency;
    settings.vatRate = vatRate !== undefined ? vatRate : settings.vatRate;
    settings.ssclRate = ssclRate !== undefined ? ssclRate : settings.ssclRate;
    settings.vatEnabled = vatEnabled !== undefined ? vatEnabled : settings.vatEnabled;
    settings.ssclEnabled = ssclEnabled !== undefined ? ssclEnabled : settings.ssclEnabled;
    settings.receiptHeader = receiptHeader !== undefined ? receiptHeader : settings.receiptHeader;
    settings.receiptFooter = receiptFooter !== undefined ? receiptFooter : settings.receiptFooter;
    settings.paperWidth = paperWidth !== undefined ? paperWidth : settings.paperWidth;

    const saved = await settings.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
