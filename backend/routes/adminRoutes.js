const express = require("express");
const Price = require("../models/Price");
const Notification = require("../models/Notification");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Pending submissions ──────────────────────────────
router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    const prices = await Price.find({ status: "pending" }).populate("userId", "name email");
    res.json(prices);
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Approve ──────────────────────────────────────────
router.put("/approve/:id", protect, adminOnly, async (req, res) => {
  try {
    const price = await Price.findById(req.params.id);
    if (!price) return res.status(404).json("Not found");
    price.status = "approved";
    price.editedByAdmin = true;
    await price.save();
    await Notification.create({ userId: price.userId, message: `✅ Your price submission for ${price.commodity} was approved` });
    res.json("Approved");
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Reject ───────────────────────────────────────────
router.put("/reject/:id", protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const price = await Price.findById(req.params.id);
    if (!price) return res.status(404).json("Not found");
    price.status = "rejected";
    price.rejectionReason = reason || "No reason provided";
    await price.save();
    await Notification.create({ userId: price.userId, message: `❌ Your submission for ${price.commodity} was rejected: ${reason}` });
    res.json("Rejected");
  } catch (e) { res.status(500).json("Server error"); }
});

// ── All users ─────────────────────────────────────────
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Promote user to admin ─────────────────────────────
router.put("/users/:id/promote", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found");
    if (user.role === "admin") return res.status(400).json("Already an admin");
    user.role = "admin";
    await user.save();
    res.json("Promoted to admin");
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Demote admin to user ──────────────────────────────
router.put("/users/:id/demote", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found");
    if (req.user._id.toString() === req.params.id) return res.status(400).json("Cannot demote yourself");
    user.role = "user";
    await user.save();
    res.json("Demoted to user");
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Delete user ───────────────────────────────────────
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) return res.status(400).json("Cannot delete yourself");
    await User.findByIdAndDelete(req.params.id);
    res.json("User deleted");
  } catch (e) { res.status(500).json("Server error"); }
});

const Settings = require("../models/Settings");

const DEFAULT_DISTRICTS = [
  "Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli",
  "Vellore","Erode","Thoothukudi","Dindigul","Thanjavur","Namakkal",
  "Kancheepuram","Tiruppur","Krishnagiri","Dharmapuri","Villupuram",
  "Ramanathapuram","Tiruvannamalai","Cuddalore","Nagapattinam","The Nilgiris",
];
const DEFAULT_COMMODITIES = [
  "Tomato","Onion","Potato","Rice (Raw)","Rice (Boiled)","Wheat",
  "Tur Dal","Chana Dal","Moong Dal","Groundnut Oil","Coconut Oil",
  "Milk","Eggs (dozen)","Banana","Brinjal","Carrot",
];

// ── GET settings (PUBLIC — every user fetches this) ───
router.get("/settings", async (req, res) => {
  try {
    const saved = await Settings.findOne({ key: "platform" });
    const districts   = saved?.districts.length   ? saved.districts   : DEFAULT_DISTRICTS;
    const commodities = saved?.commodities.length ? saved.commodities : DEFAULT_COMMODITIES;
    res.json({ districts: districts.sort(), commodities: commodities.sort() });
  } catch (e) { res.status(500).json("Server error"); }
});

// ── SAVE settings (admin only) ────────────────────────
router.post("/settings", protect, adminOnly, async (req, res) => {
  try {
    const { districts, commodities } = req.body;
    await Settings.findOneAndUpdate(
      { key: "platform" },
      { districts, commodities },
      { upsert: true, new: true }
    );
    res.json("Settings saved");
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Stats for admin dashboard ─────────────────────────
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [pending, approved, rejected, totalUsers] = await Promise.all([
      Price.countDocuments({ status: "pending" }),
      Price.countDocuments({ status: "approved" }),
      Price.countDocuments({ status: "rejected" }),
      User.countDocuments({ role: "user" }),
    ]);
    res.json({ pending, approved, rejected, totalUsers });
  } catch (e) { res.status(500).json("Server error"); }
});

module.exports = router;

// ── Edit a price submission ───────────────────────────
router.put("/edit/:id", protect, adminOnly, async (req, res) => {
  try {
    const { price, marketName, district } = req.body;
    await Price.findByIdAndUpdate(req.params.id, { price, marketName, district, editedByAdmin: true });
    res.json("Updated");
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Edit a price submission ────────────────────────────
router.put("/edit/:id", protect, adminOnly, async (req, res) => {
  try {
    const { price, marketName, district } = req.body;
    const updated = await Price.findByIdAndUpdate(
      req.params.id,
      { price, marketName, district, editedByAdmin: true },
      { new: true }
    );
    if (!updated) return res.status(404).json("Not found");
    res.json(updated);
  } catch (e) { res.status(500).json("Server error"); }
});

// ── Export all approved prices as CSV ──────────────────
router.get("/export/csv", protect, adminOnly, async (req, res) => {
  try {
    const { district, commodity, from, to } = req.query;
    const filter = { status: "approved" };
    if (district)  filter.district  = district;
    if (commodity) filter.commodity = commodity;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const prices = await Price.find(filter).populate("userId", "name email").sort({ createdAt: -1 });

    const header = "Commodity,Market Name,District,Price (₹/kg),Submitted By,Email,Date\n";
    const rows = prices.map(p =>
      [
        `"${p.commodity}"`,
        `"${p.marketName}"`,
        `"${p.district}"`,
        p.price,
        `"${p.userId?.name || ""}"`,
        `"${p.userId?.email || ""}"`,
        `"${new Date(p.createdAt).toLocaleDateString("en-IN")}"`,
      ].join(",")
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="tn-prices-${Date.now()}.csv"`);
    res.send(header + rows);
  } catch (e) { res.status(500).json("Server error"); }
});
