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
    rejectionReason: { type: String },
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
    googleFormLink: { type: String }, // Add this field
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
// 4️⃣ STUDENT EVENT REGISTRATION SCHEMA
// ---------------------------------------------------------
const StudentEventRegistrationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'BasicInfo', required: true },
  registrationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Registered', 'Checked-In'], default: 'Registered' },
}, { timestamps: true });

// Add a unique index to prevent a student from registering for the same event twice
StudentEventRegistrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

const StudentEventRegistration = mongoose.model("StudentEventRegistration", StudentEventRegistrationSchema);

// ---------------------------------------------------------
// 4️⃣ NOTIFICATION SCHEMA
// ---------------------------------------------------------
const NotificationSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'BasicInfo', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  // 'type' will be used by the frontend to show the correct icon (e.g., 'Approved', 'Rejected')
  type: { type: String, enum: ['Approved', 'Rejected', 'Info', 'New Event'], required: true },
  isRead: { type: Boolean, default: false },  
  recipient: { type: String, enum: ['organizer', 'admin', 'student'], required: true }, // To distinguish between notifications for organizers, admins, and students
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
    const { organizerId } = req.body;
    if (!organizerId) {
      return res.status(400).json({ success: false, error: "Organizer ID is required to create an event." });
    }
    // The payload from the client directly matches the schema
    const payload = { ...req.body };
    
    const info = new BasicInfo(payload);
    const saved = await info.save();

    // --- Create a notification for the admin ---
    const adminNotification = new Notification({
      eventId: saved._id,
      organizerId: saved.organizerId, // Pass the organizerId from the saved event
      recipient: 'admin',
      type: 'Info',
      title: 'New Event Submission',
      message: `A new event '${saved.eventName}' is ready for review.`,
    });
    await adminNotification.save();
    console.log(`✅ Admin notification created for new event.`);
    // --- End notification creation ---

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
    const { eventId, startDate, endDate, startTime, endTime, isFreeEvent, price, isAllDept, selectedDept, venue, participants, googleFormLink } = req.body;

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
      participants,
      googleFormLink // Add the googleFormLink here
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

        // Make a copy of the basic info to avoid modifying the mongoose document directly
        const basicInfoObject = basic.toObject();
        // Ensure the poster path uses forward slashes for URL compatibility
        if (basicInfoObject.poster) {
          basicInfoObject.poster = basicInfoObject.poster.replace(/\\/g, "/");
        }
        return {
          basicInfo: basicInfoObject,
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

// --------- GET FULL DETAILS FOR A SINGLE EVENT (for Student View) ----------
app.get("/event-details/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, error: "Invalid Event ID" });
    }

    const basic = await BasicInfo.findById(eventId);

    if (!basic) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const registration = await Registration.findOne({ eventId: basic._id });
    const contact = await ContactInfo.findOne({ eventId: basic._id });

    // Construct the full URL for the poster
    const basicInfoObject = basic.toObject();
    if (basicInfoObject.poster) {
      basicInfoObject.poster = basicInfoObject.poster.replace(/\\/g, "/");
    }

    const combined = {
      basicInfo: basicInfoObject,
      eventDetails: registration ? registration.toObject() : {},
      contactInfo: contact ? contact.toObject() : {}
    };

    res.json({ success: true, event: combined });
  } catch (err) {
    console.error(`❌ /event-details/${req.params.eventId} error:`, err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// --------- GET ADMIN NOTIFICATIONS ----------
app.get("/admin-notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: 'admin' })
      .populate('eventId', 'eventName') // Get eventName from BasicInfo
      .sort({ createdAt: -1 }) // Show newest first
      .limit(50); // Limit to the last 50 notifications

    res.status(200).json({
      success: true,
      notifications: notifications,
    });
  } catch (err) {
    console.error("❌ /admin-notifications error:", err.message);
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
});

// --------- MARK NOTIFICATION AS READ ----------
app.put("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, error: "Invalid Notification ID" });
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true } // Return the updated document
    );

    if (!updatedNotification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (err) {
    console.error("❌ /notifications/:notificationId/read error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// --------- GET STUDENT NOTIFICATIONS ----------
app.get("/api/students/notifications", async (req, res) => {
  try {
    // Fetch notifications intended for all students
    const notifications = await Notification.find({ recipient: 'student' })
      .populate('eventId', 'eventName') // Get eventName from BasicInfo
      .sort({ createdAt: -1 }) // Show newest first
      .limit(50);

    res.status(200).json({
      success: true,
      notifications: notifications,
    });
  } catch (err) {
    console.error("❌ /api/students/notifications error:", err.message);
    res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
});

// --------- GET SINGLE EVENT FOR REVIEW ----------
app.get("/review/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, error: "Invalid Event ID" });
    }

    const basic = await BasicInfo.findById(eventId);

    if (!basic) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const registration = await Registration.findOne({ eventId: basic._id });
    const contact = await ContactInfo.findOne({ eventId: basic._id });

    const basicInfoObject = basic.toObject();
    if (basicInfoObject.poster) {
      basicInfoObject.poster = basicInfoObject.poster.replace(/\\/g, "/");
    }

    const combined = {
      basicInfo: basicInfoObject,
      eventDetails: registration ? registration.toObject() : {},
      contactInfo: contact ? contact.toObject() : {}
    };

    res.json(combined);
  } catch (err) {
    console.error(`❌ /review/${req.params.eventId} error:`, err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
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
        // Just send the relative path, client will construct the full URL
        const posterPath = basic.poster ? basic.poster.replace(/\\/g, "/") : null;

        const registration = await Registration.findOne({ eventId: basic._id });
        return {
          _id: basic._id,
          // Details from BasicInfo
          title: basic.eventName,
          dept: basic.dept,
          image: posterPath, // Send the relative path
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
    const { status, rejectionReason } = req.body;

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

    const updateData = { status };
    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
    } else {
      updateData.rejectionReason = null;
    }

    const updated = await BasicInfo.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    // --- Create notifications ---
    if (updated.organizerId) {
      // 1. Notification for the Organizer
      const notificationType = status.charAt(0).toUpperCase() + status.slice(1); // 'approved' -> 'Approved'
      const orgNotification = new Notification({
        organizerId: updated.organizerId,
        eventId: updated._id,
        recipient: 'organizer',
        type: notificationType,
        title: `Your event '${updated.eventName}' has been ${status}.`,
        message: `The status of your event has been updated.`,
      });
      await orgNotification.save();
      console.log(`✅ Organizer notification created for event ${status}.`);

      // 2. Notification for Students (if approved)
      if (status === 'approved') {
        const studentNotification = new Notification({
          organizerId: updated.organizerId, // Keep track of who organized it
          eventId: updated._id,
          recipient: 'student',
          type: 'New Event',
          title: 'New Event Available!',
          message: `Explore the newly added event: '${updated.eventName}'.`,
        });
        await studentNotification.save();
        console.log(`✅ Student notification created for new approved event.`);
      }
    }

    res.json({ success: true, message: `Event ${status}!`, event: updated });
  } catch (err) {
    console.error("❌ UPDATE STATUS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------
// STUDENT EVENT REGISTRATION ENDPOINTS
// ---------------------------------------------------------

// --------- REGISTER STUDENT FOR AN EVENT ----------
app.post("/api/students/register-event", async (req, res) => {
  try {
    const { studentId, eventId } = req.body;

    if (!studentId || !eventId) {
      return res.status(400).json({ success: false, message: "Student ID and Event ID are required." });
    }

    // Check if the event exists and is approved
    const event = await BasicInfo.findOne({ _id: eventId, status: 'approved' });
    if (!event) {
      return res.status(404).json({ success: false, message: "Approved event not found." });
    }

    // Create the registration
    const newRegistration = new StudentEventRegistration({ studentId, eventId });
    await newRegistration.save();

    res.status(201).json({ success: true, message: "Successfully registered for the event!" });

  } catch (err) {
    // Handle the case where the unique index is violated (already registered)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "You are already registered for this event." });
    }
    console.error("❌ /api/students/register-event error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// --------- GET EVENTS REGISTERED BY A STUDENT ----------
app.get("/api/students/:studentId/registered-events", async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: "Invalid Student ID." });
    }

    const registrations = await StudentEventRegistration.find({ studentId })
      .populate({
        path: 'eventId', // This is the 'BasicInfo' document
        model: 'BasicInfo'
      });

    // Now, for each registered event, get its full details
    const detailedRegisteredEvents = await Promise.all(
      registrations.map(async (reg) => {
        if (!reg.eventId) return null;

        // Find the corresponding registration details (venue, date, etc.)
        const registrationDetails = await Registration.findOne({ eventId: reg.eventId._id });
        const basicInfoObject = reg.eventId.toObject();

        // Construct the full URL for the poster
        if (basicInfoObject.poster) {
          basicInfoObject.poster = basicInfoObject.poster.replace(/\\/g, "/");
        }

        return {
          basicInfo: basicInfoObject,
          eventDetails: registrationDetails ? registrationDetails.toObject() : {},
        };
      })
    );

    res.status(200).json({ success: true, events: detailedRegisteredEvents.filter(e => e !== null) });

  } catch (err) {
    console.error(`❌ /api/students/${req.params.studentId}/registered-events error:`, err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// --------- GET REGISTRATIONS FOR A SINGLE EVENT (for Organizer View) ----------
app.get("/api/events/:eventId/registrations", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, error: "Invalid Event ID" });
    }

    // 1. Find the main event details from BasicInfo
    const basicInfo = await BasicInfo.findById(eventId).populate('organizerId', 'name');
    if (!basicInfo) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    // 2. Find the registration configuration details (like participant limit)
    const registrationConfig = await Registration.findOne({ eventId: eventId });

    // 3. Find all student registrations for this event and populate student details
    const studentRegistrations = await StudentEventRegistration.find({ eventId: eventId })
      .populate({
        path: 'studentId',
        select: 'name usn department', // Select only the fields you need
        model: 'Student' // This line is crucial for the fix
      });

    // 4. Combine the data into the format expected by the frontend
    const responseData = {
      success: true,
      event: {
        eventName: basicInfo.eventName,
        organizerName: basicInfo.organizerId ? basicInfo.organizerId.name : 'N/A',
        eventDetails: {
          participants: registrationConfig ? registrationConfig.participants : 'N/A'
        }
      },
      registrations: studentRegistrations
    };

    res.json(responseData);

  } catch (err) {
    console.error(`❌ /api/events/${req.params.eventId}/registrations error:`, err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// --------- CHECK-IN STUDENT FOR AN EVENT ----------
app.put("/api/registrations/:registrationId/checkin", async (req, res) => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({ success: false, message: "Invalid Registration ID." });
    }

    const updatedRegistration = await StudentEventRegistration.findByIdAndUpdate(
      registrationId,
      { status: 'Checked-In' },
      { new: true } // Return the updated document
    );

    if (!updatedRegistration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    res.status(200).json({ success: true, message: "Student checked in successfully.", registration: updatedRegistration });

  } catch (err) {
    console.error(`❌ /api/registrations/${req.params.registrationId}/checkin error:`, err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ---------------------------------------------------------
app.listen(5000, () => console.log("Server running on port 5000"));
