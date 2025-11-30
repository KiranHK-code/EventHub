const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const organizerSchema = new mongoose.Schema({
  organizerName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  staffId: {
    type: String,
    required: true,
  },
});

organizerSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

organizerSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Organizer', organizerSchema);

