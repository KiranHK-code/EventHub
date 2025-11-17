const mongoose = require("mongoose");

const basicInfoSchema = new mongoose.Schema({
  eventId: {
  type: String,
  required: true,
  default: () => Math.random().toString(36).substring(2, 10)
}
,
  eventName: String,
  dept: String,
  eventType: String,
  poster: String, // Base64 or URL
  description: String,
});

module.exports = mongoose.model("BasicInfo", basicInfoSchema);
