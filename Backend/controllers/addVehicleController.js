const User = require('../models/User');

exports.addVehicleController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plateNumber, make, model } = req.body;

    if (!plateNumber || !make || !model) {
      return res.status(400).json({ message: 'Complete all vehicle fields.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.vehicles.push({ plateNumber, make, model });
    await user.save();

    res.json({ message: 'Vehicle added.', vehicles: user.vehicles });
  } catch (err) {
    console.error('Error adding vehicle:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
