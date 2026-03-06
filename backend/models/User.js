const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:           String,
  email:          { type: String, unique: true },
  password:       String,
  role:           { type: String, default: "user" },   // user | admin
  suspended:      { type: Boolean, default: false },
  suspendReason:  { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
