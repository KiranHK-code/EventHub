const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads dir exists (relative to Backend folder)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

// POST /upload-poster
// Expects form field named `image`
router.post('/upload-poster', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
