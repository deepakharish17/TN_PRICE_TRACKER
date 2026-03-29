/**
 * One-time seed script — run manually:
 *   node seedPrices.js
 *
 * Clears DB and scrapes fresh data from agmarknet.gov.in (APMC regulated, no API key needed)
 * After this, the cron job runs every 2 days automatically.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { fetchAndStorePrices } = require("./services/priceFetcher");

async function main() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected.\n");

    await fetchAndStorePrices();

    console.log("\n🎉 Seed complete!");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
