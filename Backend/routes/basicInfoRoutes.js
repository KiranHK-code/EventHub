const express = require("express");
const router = express.Router();
const BasicInfo = require("../models/BasicInfo");

// Save Basic Info
router.post("/addBasicInfo", async (req, res) => {
  try {
    const data = new BasicInfo(req.body);
    await data.save();
    res.json({ success: true, message: "Basic info saved!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
