const express = require("express");
const router = express.Router();

const BasicInfo = require("../models/BasicInfo");
const Registration = require("../models/Event");

// -------------------------------
// CREATE EVENT (BasicInfo + Registration)
// -------------------------------
router.post("/create-event", async (req, res) => {
  try {
    const {
      eventName,
      organizer,
      image,
      startDate,
      endDate,
      startTime,
      endTime,
      isFreeEvent,
      price,
      isAllDept,
      selectedDept,
      venue,
      participants
    } = req.body;

    // 1️⃣ Create BasicInfo first
    const basicInfo = await BasicInfo.create({
      eventName,
      organizer,
      image,
    });

    // 2️⃣ Create Registration with the generated eventId
    const registration = await Registration.create({
      eventId: basicInfo._id,
      startDate,
      endDate,
      startTime,
      endTime,
      isFreeEvent,
      price,
      isAllDept,
      selectedDept,
      venue,
      participants,
    });

    res.json({
      success: true,
      message: "Event created successfully!",
      eventId: basicInfo._id,
      basicInfo,
      registration
    });

  } catch (err) {
    console.error("CREATE EVENT ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
