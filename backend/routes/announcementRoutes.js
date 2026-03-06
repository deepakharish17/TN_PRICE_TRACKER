const express      = require("express");
const Announcement = require("../models/Announcement");
const AuditLog     = require("../models/AuditLog");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

const audit = (req, action, details, targetName="") =>
  AuditLog.create({ adminId:req.user._id, adminName:req.user.name, adminEmail:req.user.email, action, details, targetName }).catch(()=>{});

router.get("/", protect, async (req, res) => {
  try {
    const items = await Announcement.find().populate("postedBy","name email").sort({ createdAt:-1 });
    res.json(items);
  } catch { res.status(500).json("Server error"); }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, body, type } = req.body;
    if (!title?.trim() || !body?.trim()) return res.status(400).json("Title and body required");
    const item = await Announcement.create({ title, body, type:"info", ...{type}, postedBy: req.user._id });
    await item.populate("postedBy","name email");
    await audit(req, "announce", `Posted: "${title}"`, title);
    res.json(item);
  } catch { res.status(500).json("Server error"); }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (item) await audit(req, "delete", `Deleted announcement: "${item.title}"`, item.title);
    res.json("Deleted");
  } catch { res.status(500).json("Server error"); }
});

module.exports = router;
