const express = require("express");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all for current user
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (e) { res.status(500).json("Server error"); }
});

// Mark single as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true });
    res.json("Marked read");
  } catch (e) { res.status(500).json("Server error"); }
});

// Mark all as read
router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json("All marked read");
  } catch (e) { res.status(500).json("Server error"); }
});

module.exports = router;
