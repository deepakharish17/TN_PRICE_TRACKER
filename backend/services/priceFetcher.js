const axios = require("axios");
const cheerio = require("cheerio");
const Price = require("../models/Price");

/**
 * Agmarknet commodity codes for Tamil Nadu vegetables/commodities
 * Source: agmarknet.gov.in
 */
const COMMODITIES = [
  { code: 78,  name: "Tomato" },
  { code: 24,  name: "Onion" },
  { code: 53,  name: "Potato" },
  { code: 25,  name: "Brinjal" },
  { code: 30,  name: "Cabbage" },
  { code: 31,  name: "Carrot" },
  { code: 34,  name: "Cauliflower" },
  { code: 39,  name: "Drumstick" },
  { code: 41,  name: "Garlic" },
  { code: 46,  name: "Green Chilli" },
  { code: 47,  name: "Green Peas" },
  { code: 56,  name: "Lady Finger" },
  { code: 62,  name: "Bitter Gourd" },
  { code: 64,  name: "Ash Gourd" },
  { code: 70,  name: "Snake Gourd" },
  { code: 1,   name: "Rice" },
];

/**
 * Format date as DD-Mon-YYYY for agmarknet URL
 */
function formatDate(date) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = String(date.getDate()).padStart(2, "0");
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/**
 * Scrape agmarknet for a single commodity across all TN markets
 */
async function scrapeCommodity(commodity, fromDate, toDate) {
  const url = `https://agmarknet.gov.in/SearchCmmMkt.aspx` +
    `?Tx_Commodity=${commodity.code}` +
    `&Tx_State=TN` +
    `&Tx_District=0` +
    `&Tx_Market=0` +
    `&DateFrom=${fromDate}` +
    `&DateTo=${toDate}` +
    `&Fr_Date=${fromDate}` +
    `&To_Date=${toDate}` +
    `&Tx_Trend=0` +
    `&Tx_CommodityHead=${encodeURIComponent(commodity.name)}` +
    `&Tx_StateHead=Tamil+Nadu` +
    `&Tx_DistrictHead=--Select--` +
    `&Tx_MarketHead=--Select--`;

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://agmarknet.gov.in/",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);
  const records = [];

  // Agmarknet columns: State | District | Market | Commodity | Variety | Grade | Min | Max | Modal | Unit | Date
  $("table.tableagmark_new tr, table#cphBody_GridPriceData tr").each((i, row) => {
    if (i === 0) return; // skip header

    const cols = $(row).find("td");
    if (cols.length < 9) return;

    const getText = (idx) => $(cols[idx]).text().trim();

    const district   = getText(1);
    const market     = getText(2);
    const minPrice   = parseFloat(getText(6))  || 0;
    const maxPrice   = parseFloat(getText(7))  || 0;
    const modalPrice = parseFloat(getText(8))  || 0;
    const priceDate  = getText(10) || toDate;

    if (!district || !market || modalPrice === 0) return;

    records.push({
      commodity: commodity.name,
      district,
      market,
      minPrice,
      maxPrice,
      modalPrice,
      unit: "Quintal",
      priceDate,
      source: "AGMARKNET",
      fetchedAt: new Date(),
    });
  });

  return records;
}

/**
 * Main function:
 * 1. Clear ALL existing price data
 * 2. Scrape agmarknet for last 3 days (catches data even if today's isn't posted yet)
 * 3. Insert into MongoDB
 */
async function fetchAndStorePrices() {
  try {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const fromDate = formatDate(threeDaysAgo);
    const toDate   = formatDate(today);

    console.log(`📅 Scraping agmarknet: ${fromDate} → ${toDate}`);

    // Step 1: Clear DB
    console.log("🗑️  Clearing all existing price data from DB...");
    const deleted = await Price.deleteMany({});
    console.log(`   → Deleted ${deleted.deletedCount} records.`);

    // Step 2: Scrape each commodity one by one
    let allDocs = [];

    for (const commodity of COMMODITIES) {
      try {
        console.log(`   🌿 Scraping ${commodity.name}...`);
        const records = await scrapeCommodity(commodity, fromDate, toDate);
        allDocs = allDocs.concat(records);
        console.log(`      → ${records.length} records found`);
        // Polite delay — agmarknet is a slow govt server
        await new Promise((r) => setTimeout(r, 2500));
      } catch (err) {
        console.warn(`   ⚠️  ${commodity.name} failed: ${err.message}`);
      }
    }

    if (!allDocs.length) {
      console.warn("⚠️  No records scraped. DB is now empty.");
      return;
    }

    // Step 3: Insert
    console.log(`\n💾 Inserting ${allDocs.length} records into MongoDB...`);
    const result = await Price.insertMany(allDocs, { ordered: false });
    console.log(`✅ Successfully inserted ${result.length} price records.`);

  } catch (err) {
    if (err.code === 11000 || err.name === "BulkWriteError") {
      const inserted = err.result?.nInserted || 0;
      console.warn(`⚠️  Done with duplicates skipped. Inserted: ${inserted}`);
    } else {
      console.error("❌ fetchAndStorePrices error:", err.message);
      throw err;
    }
  }
}

module.exports = { fetchAndStorePrices };
