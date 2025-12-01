const express = require('express');
const router = express.Router();
const Organizer = require('../models/Organizer');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
  try {
    const { organizerName, email, password, staffId } = req.body;

    const existingOrganizer = await Organizer.findOne({ email });
    if (existingOrganizer) {
      return res.status(400).json({ message: 'Organizer with this email already exists.' });
    }

    const newOrganizer = new Organizer({
      organizerName,
      email,
      password,
      staffId,
    });

    await newOrganizer.save();

    res.status(201).json({ message: 'Organizer created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const organizer = await Organizer.findOne({ email });
      if (!organizer) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const isMatch = await organizer.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ id: organizer._id }, 'your_jwt_secret', {
        expiresIn: '1h',
      });
  
      res.status(200).json({
        success: true,
        token: token,
        organizer: organizer // Return the full organizer object
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

module.exports = router;
