// scraper.js — fetches live vegetable prices from vegetablemarketprice.com
// Runs daily at 6:00 AM via node-cron
// Install: npm install axios cheerio node-cron mongoose dotenv

const axios   = require("axios");
const cheerio = require("cheerio");
const cron    = require("node-cron");
const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test";

// ── Schema ────────────────────────────────────────────────
const PriceSchema = new mongoose.Schema({
  commodity:   String,
  marketName:  String,
  district:    String,
  price:       Number,
  minPrice:    Number,
  maxPrice:    Number,
  status:      { type: String, default: "approved" },
  source:      { type: String, default: "scraped" }, // "scraped" | "user_submitted"
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

const Price = mongoose.models.Price || mongoose.model("Price", PriceSchema);

// ── District → URL slug mapping ────────────────────────────
const DISTRICT_SLUGS = {
  "Chennai":          "chennai",
  "Coimbatore":       "coimbatore",
  "Madurai":          "madurai",
  "Tiruchirappalli":  "trichy",
  "Salem":            "salem",
  "Tirunelveli":      "tirunelveli",
  "Vellore":          "vellore",
  "Erode":            "erode",
  "Thanjavur":        "thanjavur",
  "Tiruppur":         "tiruppur",
  "Dindigul":         "dindigul",
  "Krishnagiri":      "krishnagiri",
  "Namakkal":         "namakkal",
  "Kancheepuram":     "kanchipuram",
  "Villupuram":       "villupuram",
  "Cuddalore":        "cuddalore",
  "Nagapattinam":     "nagapattinam",
  "Thiruvarur":       "thiruvarur",
  "Ariyalur":         "ariyalur",
  "Perambalur":       "perambalur",
  "Karur":            "karur",
  "Pudukkottai":      "pudukkottai",
  "Sivaganga":        "sivaganga",
  "Virudhunagar":     "virudhunagar",
  "Tenkasi":          "tenkasi",
};

// Normalize commodity names to match your app's naming
const COMMODITY_MAP = {
  "tomato":        "Tomato",
  "onion":         "Onion",
  "potato":        "Potato",
  "brinjal":       "Brinjal",
  "carrot":        "Carrot",
  "beans":         "Beans",
  "banana":        "Banana",
  "cabbage":       "Cabbage",
  "cauliflower":   "Cauliflower",
  "ladiesfinger":  "Ladies Finger",
  "ladies finger": "Ladies Finger",
  "okra":          "Ladies Finger",
  "bittergourd":   "Bitter Gourd",
  "bitter gourd":  "Bitter Gourd",
  "drumstick":     "Drumstick",
  "beetroot":      "Beetroot",
  "radish":        "Radish",
  "pumpkin":       "Pumpkin",
  "ash gourd":     "Ash Gourd",
  "ashgourd":      "Ash Gourd",
  "greens":        "Greens",
  "spinach":       "Spinach",
  "ginger":        "Ginger",
  "garlic":        "Garlic",
  "raw banana":    "Banana",
  "lemon":         "Lemon",
  "cucumber":      "Cucumber",
  "snake gourd":   "Snake Gourd",
  "coriander":     "Coriander",
  "tomatoes":      "Tomato",
};

const normalizeItem = (name) => {
  const lower = name.toLowerCase().trim();
  return COMMODITY_MAP[lower] || name.trim();
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Scrape single district ─────────────────────────────────
async function scrapeDistrict(district, slug) {
  const url = `https://vegetablemarketprice.com/market/${slug}/today`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);
    const prices = [];

    // The site uses a table — find all rows with price data
    $("table tr").each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 3) {
        const name     = $(cols[0]).text().trim();
        const minText  = $(cols[1]).text().replace(/[^\d.]/g, "").trim();
        const maxText  = $(cols[2]).text().replace(/[^\d.]/g, "").trim();
        const avgText  = cols.length >= 4
          ? $(cols[3]).text().replace(/[^\d.]/g, "").trim()
          : null;

        if (!name || !minText) return;

        const minPrice = parseFloat(minText);
        const maxPrice = parseFloat(maxText) || minPrice;
        const avgPrice = avgText
          ? parseFloat(avgText)
          : Math.round((minPrice + maxPrice) / 2);

        if (isNaN(minPrice) || minPrice <= 0) return;

        prices.push({
          commodity:  normalizeItem(name),
          marketName: `${district} Market`,
          district,
          price:      avgPrice,
          minPrice,
          maxPrice,
          status:     "approved",
          source:     "scraped",
        });
      }
    });

    return prices;
  } catch (err) {
    console.error(`  ❌ Failed ${district}: ${err.message}`);
    return [];
  }
}

// ── Main scrape function ───────────────────────────────────
async function scrapeAll() {
  console.log(`\n🕐 Starting scrape — ${new Date().toLocaleString("en-IN")}`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  }

  // Delete today's previously scraped data to avoid duplicates
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  await Price.deleteMany({ source: "scraped", createdAt: { $gte: todayStart } });
  console.log("🗑️  Cleared today's old scraped data");

  let totalInserted = 0;
  let failedDistricts = [];

  for (const [district, slug] of Object.entries(DISTRICT_SLUGS)) {
    process.stdout.write(`  📍 Scraping ${district}...`);
    const prices = await scrapeDistrict(district, slug);

    if (prices.length > 0) {
      await Price.insertMany(prices);
      console.log(` ✅ ${prices.length} items`);
      totalInserted += prices.length;
    } else {
      console.log(` ⚠️  0 items`);
      failedDistricts.push(district);
    }

    // Polite delay between requests — avoid rate limiting
    await sleep(1500);
  }

  console.log("\n════════════════════════════════════");
  console.log(`✅ Scrape complete!`);
  console.log(`📦 Total prices inserted: ${totalInserted}`);
  console.log(`⚠️  Failed districts: ${failedDistricts.length > 0 ? failedDistricts.join(", ") : "None"}`);
  console.log(`🕐 Finished at: ${new Date().toLocaleString("en-IN")}`);
  console.log("════════════════════════════════════\n");
}

// ── Cron schedule: every day at 6:00 AM ───────────────────
// Format: second minute hour day month weekday
cron.schedule("0 0 6 * * *", async () => {
  console.log("⏰ Cron triggered — daily 6:00 AM scrape");
  await scrapeAll();
}, {
  timezone: "Asia/Kolkata" // IST
});

// ── Also run immediately on startup ───────────────────────
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log("🚀 Scraper started — will run daily at 6:00 AM IST");
  console.log("🔄 Running initial scrape now...");
  await scrapeAll();
  console.log("✅ Initial scrape done. Cron job is active — keeping process alive...");
})();
