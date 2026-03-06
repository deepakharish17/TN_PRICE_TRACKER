const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json("Email already registered");
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.json({ message:"Registered", userId: user._id });
  } catch { res.status(500).json("Server error"); }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json("User not found");
    if (user.suspended) return res.status(403).json(`Account suspended: ${user.suspendReason}`);
    if (!await bcrypt.compare(password, user.password)) return res.status(400).json("Invalid credentials");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn:"7d" });
    // Log login in audit
    AuditLog.create({ adminId:user._id, adminName:user.name, adminEmail:user.email, action:"login", details:`Logged in`, targetName:user.name }).catch(()=>{});
    res.json({ token, role: user.role, name: user.name, email: user.email, userId: user._id });
  } catch { res.status(500).json("Server error"); }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json("Name required");
    await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    res.json("Updated");
  } catch { res.status(500).json("Server error"); }
});

router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!await bcrypt.compare(currentPassword, user.password)) return res.status(400).json("Current password is incorrect");
    if (newPassword.length < 6) return res.status(400).json("Password must be 6+ characters");
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json("Password updated");
  } catch { res.status(500).json("Server error"); }
});

module.exports = router;
