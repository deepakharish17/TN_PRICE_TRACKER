const mongoose = require("mongoose");
const auditSchema = new mongoose.Schema({
  adminId:    { type: mongoose.Schema.Types.ObjectId, ref:"User" },
  adminName:  String,
  adminEmail: String,
  action:     { type: String, required: true },
  targetId:   mongoose.Schema.Types.ObjectId,
  targetName: String,
  details:    String,
}, { timestamps: true });
module.exports = mongoose.model("AuditLog", auditSchema);
