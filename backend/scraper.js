const axios    = require("axios");
const cheerio  = require("cheerio");
const cron     = require("node-cron");
const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test";

const PriceSchema = new mongoose.Schema({
  commodity:  String, marketName: String, district: String,
  price:      Number, minPrice: Number, maxPrice: Number,
  status:     { type: String, default: "approved" },
  source:     { type: String, default: "scraped" },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

const Price = mongoose.models.Price || mongoose.model("Price", PriceSchema);

const DISTRICT_SLUGS = {
  "Chennai":"chennai","Coimbatore":"coimbatore","Madurai":"madurai",
  "Tiruchirappalli":"trichy","Salem":"salem","Tirunelveli":"tirunelveli",
  "Vellore":"vellore","Erode":"erode","Thanjavur":"thanjavur","Tiruppur":"tiruppur",
  "Dindigul":"dindigul","Krishnagiri":"krishnagiri","Namakkal":"namakkal",
  "Kancheepuram":"kanchipuram","Villupuram":"villupuram","Cuddalore":"cuddalore",
  "Nagapattinam":"nagapattinam","Thiruvarur":"thiruvarur","Ariyalur":"ariyalur",
  "Perambalur":"perambalur","Karur":"karur","Pudukkottai":"pudukkottai",
  "Sivaganga":"sivaganga","Virudhunagar":"virudhunagar","Tenkasi":"tenkasi",
};

// Clean name — remove Tamil part in brackets e.g. "Tomato (தக்காளி)" → "Tomato"
const cleanName = (raw) => {
  return raw.replace(/\s*\([^)]*\)\s*/g, "").trim();
};

// Normalize to match your app commodity names
const COMMODITY_MAP = {
  "Tomato":"Tomato","Onion Big":"Onion","Onion Small":"Onion","Onion":"Onion",
  "Potato":"Potato","Brinjal":"Brinjal","Brinjal (Big)":"Brinjal",
  "Carrot":"Carrot","Banana":"Banana","Raw Banana (Plantain)":"Banana",
  "Cabbage":"Cabbage","Cauliflower":"Cauliflower","Ladies Finger":"Ladies Finger",
  "Bitter Gourd":"Bitter Gourd","Bottle Gourd":"Bottle Gourd",
  "Snake Gourd":"Snake Gourd","Ash gourd":"Ash Gourd","Pumpkin":"Pumpkin",
  "Cucumber":"Cucumber","Radish":"Radish","Drumsticks":"Drumstick",
  "Ginger":"Ginger","Garlic":"Garlic","Lemon (Lime)":"Lemon",
  "Spinach":"Spinach","Coriander Leaves":"Coriander","Mint Leaves":"Mint",
  "Green Chilli":"Green Chilli","Capsicum":"Capsicum","Corn":"Corn",
  "French Beans":"Beans","Cluster beans":"Beans","Broad Beans":"Beans",
  "Green Peas":"Green Peas","Coconut":"Coconut","Mushroom":"Mushroom",
  "Ridge Gourd":"Ridge Gourd","Ivy Gourd":"Ivy Gourd",
  "Shallot (Pearl Onion)":"Onion","Onion Green":"Onion",
  "Butter Beans":"Beans","Elephant Yam":"Yam","Sweet Potato":"Sweet Potato",
  "Colocasia":"Colocasia","Mango Raw":"Raw Mango","Amla":"Amla",
  "Baby Corn":"Baby Corn","Banana Flower":"Banana Flower",
  "Amaranth Leaves":"Greens","Fenugreek Leaves":"Greens",
  "Dill Leaves":"Greens","Mustard Leaves":"Greens","Curry Leaves":"Curry Leaves",
  "Sorrel Leaves":"Greens","Colocasia Leaves":"Greens",
};

const normalizeName = (name) => COMMODITY_MAP[name] || name;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function scrapeDistrict(district, slug) {
  const url = `https://vegetablemarketprice.com/market/${slug}/today`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);
    const prices = [];

    $("table tr").each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length < 4) return;

      const rawName   = $(cols[1]).text().trim();
      const retailTxt = $(cols[2]).text().replace(/[^\d.]/g, "").trim();
      const rangeTxt  = $(cols[3]).text().trim();

      if (!rawName || !retailTxt) return;

      const cleanedName = cleanName(rawName);
      const commodity   = normalizeName(cleanedName);
      const retailPrice = parseFloat(retailTxt);

      if (isNaN(retailPrice) || retailPrice <= 0) return;

      const rangeParts = rangeTxt.replace(/₹/g, "").split("-").map(s => parseFloat(s.trim()));
      const minPrice = rangeParts[0] || retailPrice;
      const maxPrice = rangeParts[1] || retailPrice;
      const avgPrice = Math.round((minPrice + maxPrice) / 2);

      prices.push({
        commodity,
        marketName: `${district} Market`,
        district,
        price:    avgPrice,
        minPrice,
        maxPrice,
        status:   "approved",
        source:   "scraped",
      });
    });

    return prices;
  } catch (err) {
    console.error(`  ❌ Failed ${district}: ${err.message}`);
    return [];
  }
}

async function scrapeAll() {
  console.log(`\n🕐 Starting scrape — ${new Date().toLocaleString("en-IN")}`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  }

  // 1. Delete today's existing scraped data (avoid duplicates)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  await Price.deleteMany({ source: "scraped", createdAt: { $gte: todayStart } });
  console.log("🗑️  Cleared today's old scraped data");

  // 2. Delete data exactly 5 days old (rolling window — keeps last 4 days intact)
  const fiveDaysAgoStart = new Date();
  fiveDaysAgoStart.setDate(fiveDaysAgoStart.getDate() - 5);
  fiveDaysAgoStart.setHours(0, 0, 0, 0);
  const fiveDaysAgoEnd = new Date(fiveDaysAgoStart);
  fiveDaysAgoEnd.setHours(23, 59, 59, 999);

  const old = await Price.deleteMany({
    source: "scraped",
    createdAt: { $gte: fiveDaysAgoStart, $lte: fiveDaysAgoEnd },
  });
  console.log(`🗑️  Deleted ${old.deletedCount} records from 5 days ago`);

  // 3. Scrape fresh data for today
  let totalInserted = 0;
  const failed = [];

  for (const [district, slug] of Object.entries(DISTRICT_SLUGS)) {
    process.stdout.write(`  📍 Scraping ${district}...`);
    const prices = await scrapeDistrict(district, slug);
    if (prices.length > 0) {
      await Price.insertMany(prices);
      console.log(` ✅ ${prices.length} items`);
      totalInserted += prices.length;
    } else {
      console.log(` ⚠️  0 items`);
      failed.push(district);
    }
    await sleep(1500);
  }

  console.log("\n════════════════════════════════════");
  console.log("✅ Scrape complete!");
  console.log(`📦 Total inserted: ${totalInserted}`);
  console.log(`⚠️  Failed: ${failed.length > 0 ? failed.join(", ") : "None"}`);
  console.log(`🕐 Finished: ${new Date().toLocaleString("en-IN")}`);
  console.log("════════════════════════════════════\n");
}

// Run daily at 6:00 AM IST
cron.schedule("0 0 6 * * *", async () => {
  console.log("⏰ Cron triggered — daily 6:00 AM scrape");
  await scrapeAll();
}, { timezone: "Asia/Kolkata" });

// Run immediately on startup
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log("🚀 Scraper started — runs daily at 6:00 AM IST");
  console.log("🔄 Running initial scrape now...");
  await scrapeAll();
  console.log("✅ Done. Cron job active — keeping process alive...");
})();
