const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, 'your_jwt_secret', { // Replace 'your_jwt_secret' with a real secret from environment variables
    expiresIn: '30d',
  });
};

// @route   POST /api/students/register
// @desc    Register a new student
// @access  Public
router.post('/register', async (req, res) => {
  const { name, usn, department, email, password } = req.body;

  try {
    const studentExists = await Student.findOne({ $or: [{ email }, { usn }] });

    if (studentExists) {
      return res.status(400).json({ message: 'Student already exists with this email or USN' });
    }

    const student = await Student.create({
      name,
      usn,
      department,
      email,
      password,
    });

    if (student) {
      res.status(201).json({
        _id: student._id,
        name: student.name,
        email: student.email,
        usn: student.usn,
        department: student.department,
        token: generateToken(student._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid student data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/students/login
// @desc    Authenticate student & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });

    if (student && (await student.matchPassword(password))) {
      res.json({
        _id: student._id,
        name: student.name,
        email: student.email,
        usn: student.usn,
        department: student.department,
        token: generateToken(student._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
