const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  commodity: String,
  marketName: String,
  district: String,
  price: Number,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  rejectionReason: String,
  editedByAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Price", priceSchema);