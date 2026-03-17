// debug_scraper.js — run this to see what HTML the site returns
// node debug_scraper.js

const axios = require("axios");
const cheerio = require("cheerio");

async function debug() {
  const url = "https://vegetablemarketprice.com/market/coimbatore/today";
  console.log("Fetching:", url);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 15000,
    });

    console.log("\n--- First 3000 chars of HTML ---");
    console.log(data.substring(0, 3000));

    const $ = cheerio.load(data);

    console.log("\n--- All table rows found ---");
    $("table tr").each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length > 0) {
        const texts = [];
        cols.each((j, col) => texts.push($(col).text().trim()));
        console.log(`Row ${i}:`, texts);
      }
    });

    console.log("\n--- All divs with 'price' in class ---");
    $("[class*='price']").each((i, el) => {
      console.log(`Price div ${i}:`, $(el).text().trim().substring(0, 100));
    });

    console.log("\n--- All divs with 'vegetable' in class ---");
    $("[class*='vegetable'], [class*='product'], [class*='item'], [class*='market']").each((i, el) => {
      console.log(`Item ${i} [${$(el).attr("class")}]:`, $(el).text().trim().substring(0, 100));
    });

  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Headers:", err.response.headers);
    }
  }
}

debug();
