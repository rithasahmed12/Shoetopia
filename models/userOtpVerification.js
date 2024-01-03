const mongoose = require('mongoose');

const userOtpVerificationSchema = new mongoose.Schema({
    email:String,
    otp:String,
    createdAt: Date,
    expiresAt: Date
});

// userOtpVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });


module.exports = mongoose.model('userOtpVerification',userOtpVerificationSchema);