const express = require("express");
const Price   = require("../models/Price");
const AuditLog = require("../models/AuditLog");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const router  = express.Router();

// Add price
router.post("/add", protect, async (req, res) => {
  try {
    const { commodity, marketName, district, price } = req.body;
    const isAdm = req.user.role === "admin";
    const entry = await Price.create({
      userId: req.user._id, commodity, marketName, district, price,
      status: isAdm ? "approved" : "pending",
      editedByAdmin: isAdm,
    });
    res.json(entry);
  } catch { res.status(500).json("Server error"); }
});

// My submissions
router.get("/my", protect, async (req, res) => {
  try {
    const prices = await Price.find({ userId: req.user._id }).sort({ createdAt:-1 });
    res.json(prices);
  } catch { res.status(500).json("Server error"); }
});

// All approved (public feed)
router.get("/all", protect, async (req, res) => {
  try {
    const filter = { status:"approved" };
    if (req.query.district)  filter.district  = req.query.district;
    if (req.query.commodity) filter.commodity = req.query.commodity;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to)   filter.createdAt.$lte = new Date(req.query.to);
    }
    const prices = await Price.find(filter).sort({ createdAt:-1 });
    res.json(prices);
  } catch { res.status(500).json("Server error"); }
});

// By district
router.get("/district/:district", protect, async (req, res) => {
  try {
    const prices = await Price.find({ district: req.params.district, status:"approved" }).sort({ createdAt:-1 });
    res.json(prices);
  } catch { res.status(500).json("Server error"); }
});

// Leaderboard
router.get("/leaderboard", protect, async (req, res) => {
  try {
    const { period } = req.query;
    const matchDate = {};
    if (period === "week")  matchDate.$gte = new Date(Date.now() - 7*86400000);
    if (period === "month") matchDate.$gte = new Date(Date.now() - 30*86400000);

    const match = { status:"approved" };
    if (matchDate.$gte) match.createdAt = matchDate;

    // Approved counts
    const approved = await Price.aggregate([
      { $match: match },
      { $group: { _id:"$userId", count:{ $sum:1 } } },
      { $sort: { count:-1 } },
      { $limit: 50 },
      { $lookup: { from:"users", localField:"_id", foreignField:"_id", as:"user" } },
      { $unwind:"$user" },
      { $project: { name:"$user.name", email:"$user.email", count:1 } },
    ]);

    // Also get pending totals
    const pending = await Price.aggregate([
      { $match: { status:"pending" } },
      { $group: { _id:"$userId", pending:{ $sum:1 } } },
    ]);
    const pendingMap = {};
    pending.forEach(p => { pendingMap[p._id.toString()] = p.pending; });

    const result = approved.map(a => ({
      ...a,
      pending: pendingMap[a._id.toString()] || 0,
      total: a.count + (pendingMap[a._id.toString()]||0),
    }));

    res.json(result);
  } catch(e) { res.status(500).json("Server error"); }
});

module.exports = router;
