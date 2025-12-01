const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, 'your_jwt_secret_admin', { // Replace with a real secret
    expiresIn: '30d',
  });
};

// @route   POST /api/admins/register
// @desc    Register a new admin
// @access  Public (or protected, depending on requirements)
router.post('/register', async (req, res) => {
  const { name, adminId, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ adminId });

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists with this ID' });
    }

    const admin = await Admin.create({
      name,
      adminId,
      password,
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        adminId: admin.adminId,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/admins/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { adminId, password } = req.body;

  try {
    const admin = await Admin.findOne({ adminId });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        adminId: admin.adminId,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid Admin ID or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
