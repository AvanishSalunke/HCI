const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = (id, role) => {
  return jwt.sign(
    { userId: id, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '3d' }
  );
};
// Accounts are created by the seed script only. A public sign-up route would let
// anyone make themselves a faculty advisor of any committee.
exports.loginUser = async (req, res) => {
  try {
    const { username, password, role, committee } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please enter your username and password' });
    }
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.role !== role) {
      return res.status(400).json({ message: `You are not registered as a ${role}` });
    }
    // the login page of one committee must not let in another committee's account
    if (committee && user.committee !== committee) {
      return res.status(400).json({ message: 'This account does not belong to this committee' });
    }
    const token = generateToken(user._id, user.role);
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        role: user.role,
        committee: user.committee,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
