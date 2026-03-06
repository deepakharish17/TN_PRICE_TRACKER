const mongoose = require("mongoose");

// Single-document settings store for the platform
const settingsSchema = new mongoose.Schema({
  key:   { type: String, unique: true, default: "platform" },
  districts:   { type: [String], default: [] },
  commodities: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
