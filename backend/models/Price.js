const mongoose = require("mongoose");

const PriceSchema = new mongoose.Schema({
  commodity:  String,
  marketName: String,
  district:   String,
  price:      Number,
  minPrice:   Number,
  maxPrice:   Number,
  status:     { type: String, default: "approved" },
  source:     { type: String, default: "scraped" },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.models.Price || mongoose.model("Price", PriceSchema);
