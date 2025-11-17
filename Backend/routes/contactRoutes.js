const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const mongoose = require("mongoose");

// CREATE - Save contact information
router.post("/contact", async (req, res) => {
  try {
    const { eventId, name, phone, email, highlights, schedule } = req.body;

    // Validate required fields
    if (!eventId || !name || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: "eventId, name, phone, and email are required"
      });
    }

    // Validate and convert eventId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid eventId format"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    const contact = new Contact({
      eventId: new mongoose.Types.ObjectId(eventId),
      name,
      phone,
      email,
      highlights: highlights || [],
      schedule: schedule || []
    });

    await contact.save();
    res.status(201).json({
      success: true,
      message: "Contact info saved!",
      contact
    });
  } catch (err) {
    console.error("CONTACT CREATE ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET - Retrieve all contacts for an event
router.get("/contact/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid eventId format"
      });
    }

    const contacts = await Contact.find({ eventId: new mongoose.Types.ObjectId(eventId) });
    res.json({ success: true, contacts });
  } catch (err) {
    console.error("CONTACT GET ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE - Update contact information
router.put("/contact/:contactId", async (req, res) => {
  try {
    const { contactId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid contactId format"
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      new mongoose.Types.ObjectId(contactId),
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }
    res.json({ success: true, message: "Contact updated!", contact });
  } catch (err) {
    console.error("CONTACT UPDATE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE - Remove contact
router.delete("/contact/:contactId", async (req, res) => {
  try {
    const { contactId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid contactId format"
      });
    }

    const contact = await Contact.findByIdAndDelete(new mongoose.Types.ObjectId(contactId));
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }
    res.json({ success: true, message: "Contact deleted!" });
  } catch (err) {
    console.error("CONTACT DELETE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
