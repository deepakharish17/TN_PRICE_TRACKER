const mongoose = require("mongoose");
const announcementSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  body:     { type: String, required: true },
  type:     { type: String, enum:["info","alert","success","urgent"], default:"info" },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref:"User" },
}, { timestamps: true });
module.exports = mongoose.model("Announcement", announcementSchema);
