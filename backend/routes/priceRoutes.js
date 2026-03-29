const express = require("express");
const router  = express.Router();
const Price   = require("../models/Price");

// GET /api/price — list all prices with optional filters
router.get("/", async (req, res) => {
  try {
    const { district, commodity, status, source } = req.query;
    const filter = {};
    if (district)  filter.district  = { $regex: new RegExp(district,  "i") };
    if (commodity) filter.commodity = { $regex: new RegExp(commodity, "i") };
    if (status)    filter.status    = status;
    if (source)    filter.source    = source;

    const prices = await Price.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/price/all — alias used by frontend
router.get("/all", async (req, res) => {
  try {
    const { district, commodity, status, source } = req.query;
    const filter = {};
    if (district)  filter.district  = { $regex: new RegExp(district,  "i") };
    if (commodity) filter.commodity = { $regex: new RegExp(commodity, "i") };
    if (status)    filter.status    = status;
    if (source)    filter.source    = source;

    const prices = await Price.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/price/districts
router.get("/districts", async (req, res) => {
  try {
    const districts = await Price.distinct("district");
    res.json(districts.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/price/commodities
router.get("/commodities", async (req, res) => {
  try {
    const commodities = await Price.distinct("commodity");
    res.json(commodities.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/price — add a price entry (admin/user)
router.post("/", async (req, res) => {
  try {
    const price = new Price(req.body);
    await price.save();
    res.status(201).json(price);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/price/:id — update a price entry
router.put("/:id", async (req, res) => {
  try {
    const price = await Price.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(price);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/price/:id
router.delete("/:id", async (req, res) => {
  try {
    await Price.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
