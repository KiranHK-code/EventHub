const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
  try {
    const { organizationName, email, password, address, city, state, zip } = req.body;

    const existingOrg = await Organization.findOne({ email });
    if (existingOrg) {
      return res.status(400).json({ message: 'Organization with this email already exists.' });
    }

    const newOrganization = new Organization({
      organizationName,
      email,
      password,
      address,
      city,
      state,
      zip,
    });

    await newOrganization.save();

    res.status(201).json({ message: 'Organization created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const organization = await Organization.findOne({ email });
      if (!organization) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const isMatch = await organization.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ id: organization._id }, 'your_jwt_secret', {
        expiresIn: '1h',
      });
  
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

module.exports = router;
