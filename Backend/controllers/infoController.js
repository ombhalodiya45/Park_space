const Info = require('../models/Info');

exports.saveInfo = async (req, res) => {
  try {
    const info = new Info({ data: req.body.data });
    await info.save();
    res.json({ message: 'Info saved', info });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save info' });
  }
};

exports.getInfo = async (req, res) => {
  try {
    const info = await Info.findOne().sort({ createdAt: -1 });
    res.json({ info });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve info' });
  }
};
