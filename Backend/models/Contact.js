const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "BasicInfo",
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },

  highlights: [
    { text: { type: String, required: true } }
  ],

  schedule: [
    { 
      time: { type: String, required: true }, 
      task: { type: String, required: true } 
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);
