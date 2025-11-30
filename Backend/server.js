const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cors());
const path = require('path');

// serve uploaded files statically from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----------------- CONNECT MONGODB -----------------
mongoose
  .connect("mongodb://127.0.0.1:27017/CEMS")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));


// ---------------------------------------------------------
// 1️⃣ BASIC INFO SCHEMA (Create Event Page)
// ---------------------------------------------------------
const BasicInfoSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    dept: { type: String, required: true },
    eventType: { type: String, default: "Hackathon" },
    description: { type: String, required: true },
    // poster now stores a public URL (e.g. '/uploads/...') instead of base64
    poster: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const BasicInfo = mongoose.model("BasicInfo", BasicInfoSchema);


// ---------------------------------------------------------
// 2️⃣ REGISTRATION SCHEMA (Register Event Page)
// ---------------------------------------------------------
const RegistrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'BasicInfo', required: true },

    startDate: { type: String, required: true },
    endDate: { type: String, required: true },

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    isFreeEvent: { type: Boolean, default: true },
    price: { type: String },

    isAllDept: { type: Boolean, default: true },

    selectedDept: { type: [String], default: [] },

    venue: { type: String, required: true },
    participants: { type: String },
  },
  { timestamps: true }
);

const Registration = mongoose.model("Registration", RegistrationSchema);


// ---------------------------------------------------------
// 3️⃣ CONTACT INFO SCHEMA (Contact Page)
// ---------------------------------------------------------
const ContactSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'BasicInfo', required: true },
  
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },

  highlights: [
    {
      text: { type: String, required: true }
    }
  ],

  schedule: [
    {
      time: { type: String, required: true },
      task: { type: String, required: true }
    }
  ]

}, { timestamps: true });


const ContactInfo = mongoose.model("ContactInfo", ContactSchema);

// ---------------------------------------------------------
// 5️⃣ NOTIFICATION SCHEMA
// ---------------------------------------------------------
// Notifications have been removed from this backend build.

// ---------------------------------------------------------
// 6️⃣ ROUTES
// ---------------------------------------------------------

// upload route
const uploadRoutes = require('./routes/upload');
app.use('/', uploadRoutes);

const organizerRoutes = require('./routes/organizerRoutes');
app.use('/api/organizers', organizerRoutes);


// --------- CREATE BASIC INFO ----------
app.post("/addBasicInfo", async (req, res) => {
  try {
    // accept either `image` or `poster` fields from the client
    const payload = { ...req.body };
    if (req.body.image && !req.body.poster) payload.poster = req.body.image;

    console.log("📸 /addBasicInfo payload:", payload);

    const info = new BasicInfo(payload);
    const saved = await info.save();

    console.log("✅ BasicInfo saved:", saved);
    res.json({ success: true, eventId: saved._id });
  } catch (err) {
    console.error("❌ /addBasicInfo error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// --------- SAVE REGISTRATION DETAILS ----------
app.post("/create-event", async (req, res) => {
  try {
    const { eventId, startDate, endDate, startTime, endTime, isFreeEvent, price, isAllDept, selectedDept, venue, participants } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: "Event ID is required" });
    }

    const reg = new Registration({
      eventId,
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
    });
    await reg.save();

    res.json({ success: true, message: "Registration details saved!", registrationId: reg._id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --------- SAVE CONTACT DETAILS ----------
app.post("/contact", async (req, res) => {
  try {
    const { eventId, name, phone, email, highlights, schedule } = req.body;

    if (!eventId || !name || !phone || !email) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const contact = new ContactInfo({
      eventId,
      name,
      phone,
      email,
      highlights: highlights || [],
      schedule: schedule || []
    });
    await contact.save();

    res.json({ success: true, message: "Contact info saved!", contactId: contact._id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --------- GET COMBINED DATA FOR REVIEW ----------
app.get("/review", async (req, res) => {
  try {
    const basicInfos = await BasicInfo.find({});

    const combined = await Promise.all(
      basicInfos.map(async (basic) => {
        const registration = await Registration.findOne({ eventId: basic._id });
        const contact = await ContactInfo.findOne({ eventId: basic._id });

        return {
          basicInfo: basic,
          eventDetails: registration ? {
            startDate: registration.startDate,
            endDate: registration.endDate,
            startTime: registration.startTime,
            endTime: registration.endTime,
            isFreeEvent: registration.isFreeEvent,
            price: registration.price,
            isAllDept: registration.isAllDept,
            selectedDept: registration.selectedDept,
            venue: registration.venue,
            participants: registration.participants
          } : {},
          contactInfo: contact ? {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            highlights: contact.highlights,
            schedule: contact.schedule
          } : {}
        };
      })
    );

    console.log("📋 /review combined response:", combined);
    res.json(combined);
  } catch (err) {
    console.error("❌ /review error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// --------- UPDATE EVENT STATUS (APPROVE/REJECT) ----------
app.put("/review/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid eventId format"
      });
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be 'approved', 'rejected', or 'pending'"
      });
    }

    const updated = await BasicInfo.findByIdAndUpdate(
      eventId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    res.json({ success: true, message: `Event ${status}!`, event: updated });
  } catch (err) {
    console.error("❌ UPDATE STATUS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------- CREATE NOTIFICATION (when event is submitted) ----------
// Notification endpoints removed.

// Device token registration endpoints removed.

// Notification listing/marking endpoints removed.

// ---------------------------------------------------------
app.listen(5000, () => console.log("Server running on port 5000"));
