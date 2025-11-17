const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "BasicInfo",
  },

  startDate: { type: String, required: true },
  endDate: { type: String, required: true },

  startTime: { type: String, required: true },
  endTime: { type: String, required: true },

  isFreeEvent: { type: Boolean, default: true },
  price: { type: String },

  isAllDept: { type: Boolean, default: true },

  selectedDept: {
    type: [String], // stores list of departments
    default: [],
  },

  venue: { type: String, required: true },
  participants: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Registration", RegistrationSchema);
