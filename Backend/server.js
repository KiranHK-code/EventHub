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
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
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
// 4️⃣ NOTIFICATION SCHEMA
// ---------------------------------------------------------
const NotificationSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'BasicInfo', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  // 'type' will be used by the frontend to show the correct icon (e.g., 'Approved', 'Rejected')
  type: { type: String, enum: ['Approved', 'Rejected', 'Info'], required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);



// ---------------------------------------------------------
// 6️⃣ ROUTES
// ---------------------------------------------------------

// upload route
const uploadRoutes = require('./routes/upload');
app.use('/', uploadRoutes);

const organizerRoutes = require('./routes/organizerRoutes');
app.use('/api/organizers', organizerRoutes);

const studentAuthRoutes = require('./routes/studentAuthRoutes');
app.use('/api/students', studentAuthRoutes);

const adminAuthRoutes = require('./routes/adminAuthRoutes');
app.use('/api/admins', adminAuthRoutes);

// --------- UPDATE ORGANIZER PROFILE ----------
app.put("/api/organizers/profile/:organizerId", async (req, res) => {
  try {
    const { organizerId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ success: false, error: "Invalid Organizer ID" });
    }

    // Find the organizer and update their data
    const updatedOrganizer = await mongoose.model('Organizer').findByIdAndUpdate(organizerId, updateData, { new: true });

    if (!updatedOrganizer) {
      return res.status(404).json({ success: false, error: "Organizer not found" });
    }

    res.json({ success: true, message: "Profile updated successfully", organizer: updatedOrganizer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// --------- CREATE BASIC INFO ----------
app.post("/addBasicInfo", async (req, res) => {
  try {
    // accept either `image` or `poster` fields from the client
    const { organizerId, ...rest } = req.body;
    if (!organizerId) {
      return res.status(400).json({ success: false, error: "Organizer ID is required to create an event." });
    }
    // The payload from the client now directly matches the schema
    const payload = { ...req.body };
    
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

// --------- GET ALL ORGANIZER EVENTS ----------
app.get("/organizer-events", async (req, res) => {
  const { organizerId } = req.query;

  if (!organizerId) {
    return res.status(400).json({ success: false, error: "Organizer ID is required." });
  }

  try {
    // Find events that match the provided organizerId
    const basicInfos = await BasicInfo.find({ organizerId: organizerId }).sort({ createdAt: -1 });

    const events = await Promise.all(
      basicInfos.map(async (basic) => {
        // Construct the full URL for the poster
        const posterUrl = basic.poster ? `${req.protocol}://${req.get('host')}${basic.poster.startsWith('/') ? '' : '/'}${basic.poster}` : null;

        const registration = await Registration.findOne({ eventId: basic._id });
        return {
          _id: basic._id,
          // Details from BasicInfo
          title: basic.eventName,
          dept: basic.dept,
          image: posterUrl,
          status: basic.status.charAt(0).toUpperCase() + basic.status.slice(1), // Capitalize status (e.g., 'pending' -> 'Pending')
          reason: basic.rejectionReason || null, // Assuming you might add a rejection reason field
          // Details from Registration
          startDate: registration ? registration.startDate : null,
          startTime: registration ? registration.startTime : null,
          venue: registration ? registration.venue : 'Not set',
        };
      })
    );

    res.status(200).json({
      success: true,
      events: events,
    });
  } catch (err) {
    console.error("❌ /organizer-events error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// --------- GET ORGANIZER NOTIFICATIONS ----------
app.get("/organizer-notifications", async (req, res) => {
  const { organizerId } = req.query;

  if (!organizerId) {
    return res.status(400).json({ success: false, error: "Organizer ID is required." });
  }

  try {
    const notifications = await Notification.find({ organizerId: organizerId })
      .sort({ createdAt: -1 }) // Show newest first
      .limit(50); // Limit to the last 50 notifications

    res.status(200).json({
      success: true,
      notifications: notifications,
    });
  } catch (err) {
    console.error("❌ /organizer-notifications error:", err.message);
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
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

    // --- Create a notification for the organizer ---
    if (updated.organizerId) {
      const notificationType = status.charAt(0).toUpperCase() + status.slice(1); // 'approved' -> 'Approved'
      const notification = new Notification({
        organizerId: updated.organizerId,
        eventId: updated._id,
        type: notificationType,
        title: `Event ${notificationType}`,
        message: `Your event '${updated.eventName}' has been ${status}.`,
      });
      await notification.save();
      console.log(`✅ Notification created for event ${status}.`);
    }

    res.json({ success: true, message: `Event ${status}!`, event: updated });
  } catch (err) {
    console.error("❌ UPDATE STATUS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------
app.listen(5000, () => console.log("Server running on port 5000"));
