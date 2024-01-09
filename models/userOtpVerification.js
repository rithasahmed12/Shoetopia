const mongoose = require("mongoose");

const userOtpVerificationSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: Date,
  expiresAt: Date,
});

module.exports = mongoose.model(
  "userOtpVerification",
  userOtpVerificationSchema
);
