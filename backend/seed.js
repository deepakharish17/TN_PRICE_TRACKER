const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Models ──────────────────────────────────────────────
const User = require("./models/User");
const Price = require("./models/Price");
const Notification = require("./models/Notification");
const Settings = require("./models/Settings");

// ── Connect ─────────────────────────────────────────────
mongoose.connect("mongodb://127.0.0.1:27017/tn-price-monitor")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ DB Error:", err); process.exit(1); });

// ── Data ────────────────────────────────────────────────

const DISTRICTS = [
  "Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli",
  "Vellore","Erode","Thoothukudi","Dindigul","Thanjavur","Namakkal",
  "Kancheepuram","Tiruppur","Krishnagiri","Dharmapuri","Villupuram",
  "Ramanathapuram","Tiruvannamalai","Cuddalore","Nagapattinam","The Nilgiris",
  "Tirupathur",
];

const COMMODITIES = [
  "Tomato","Onion","Potato","Rice (Raw)","Rice (Boiled)","Wheat",
  "Tur Dal","Chana Dal","Moong Dal","Groundnut Oil","Coconut Oil",
  "Milk","Eggs (dozen)","Banana","Brinjal","Carrot",
];

const MARKETS = {
  "Chennai":          ["Koyambedu Market", "Anna Nagar Market", "T.Nagar Market"],
  "Coimbatore":       ["Gandhipuram Market", "RS Puram Market", "Ukkadam Market"],
  "Madurai":          ["Mattuthavani Market", "Surveyor Colony Market", "Villapuram Market"],
  "Tiruchirappalli":  ["Ariyamangalam Market", "Srirangam Market", "Chatram Bus Stand Market"],
  "Salem":            ["Shevapet Market", "Suramangalam Market", "Five Roads Market"],
  "Tirunelveli":      ["Palayamkottai Market", "Melapalayam Market"],
  "Vellore":          ["Katpadi Market", "Vellore Town Market"],
  "Erode":            ["Brough Road Market", "Erode Town Market"],
  "Thoothukudi":      ["Thoothukudi Port Market", "Sipcot Market"],
  "Dindigul":         ["Dindigul Town Market", "Palani Road Market"],
  "Thanjavur":        ["Thanjavur Big Market", "Medical College Market"],
  "Namakkal":         ["Namakkal Town Market"],
  "Kancheepuram":     ["Kancheepuram Silk Market", "Old Town Market"],
  "Tiruppur":         ["Tiruppur Textile Market", "Avinashi Road Market"],
  "Krishnagiri":      ["Krishnagiri Town Market", "Hosur Road Market"],
  "Dharmapuri":       ["Dharmapuri Town Market"],
  "Villupuram":       ["Villupuram Town Market"],
  "Ramanathapuram":   ["Ramanathapuram Market"],
  "Tiruvannamalai":   ["Tiruvannamalai Town Market"],
  "Cuddalore":        ["Cuddalore Old Town Market"],
  "Nagapattinam":     ["Nagapattinam Fishing Market"],
  "The Nilgiris":     ["Ooty Market", "Coonoor Market"],
  "Tirupathur":       ["Tirupathur Town Market"],
};

// Realistic price ranges per commodity (min, max) in ₹/kg
const PRICE_RANGES = {
  "Tomato":         [20, 80],
  "Onion":          [15, 60],
  "Potato":         [20, 50],
  "Rice (Raw)":     [40, 70],
  "Rice (Boiled)":  [45, 75],
  "Wheat":          [25, 45],
  "Tur Dal":        [110, 160],
  "Chana Dal":      [90, 130],
  "Moong Dal":      [100, 140],
  "Groundnut Oil":  [150, 200],
  "Coconut Oil":    [180, 240],
  "Milk":           [50, 70],
  "Eggs (dozen)":   [60, 90],
  "Banana":         [30, 60],
  "Brinjal":        [20, 50],
  "Carrot":         [30, 70],
};

const randPrice = (commodity) => {
  const [min, max] = PRICE_RANGES[commodity] || [20, 100];
  return Math.round((Math.random() * (max - min) + min) * 2) / 2; // multiples of 0.5
};

const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randDate = (daysBack) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
};

// ── Seed ────────────────────────────────────────────────
async function seed() {
  try {
    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Price.deleteMany({}),
      Notification.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log("🗑️  Cleared all collections");

    // ── 1. Users ─────────────────────────────────────────
    const passwordHash = await bcrypt.hash("password123", 10);
    const adminHash    = await bcrypt.hash("admin123", 10);

    const users = await User.insertMany([
      // Admins
      { name: "Harish Deepak",  email: "harish@gmail.com",   password: adminHash,    role: "admin" },
      { name: "Priya Admin",    email: "priya@gmail.com",    password: adminHash,    role: "admin" },

      // Regular users
      { name: "Deepak Kumar",   email: "deepak@gmail.com",   password: passwordHash, role: "user" },
      { name: "Anitha Rajan",   email: "anitha@gmail.com",   password: passwordHash, role: "user" },
      { name: "Murugan S",      email: "murugan@gmail.com",  password: passwordHash, role: "user" },
      { name: "Kavitha Devi",   email: "kavitha@gmail.com",  password: passwordHash, role: "user" },
      { name: "Selvam P",       email: "selvam@gmail.com",   password: passwordHash, role: "user" },
      { name: "Lakshmi N",      email: "lakshmi@gmail.com",  password: passwordHash, role: "user" },
      { name: "Rajesh M",       email: "rajesh@gmail.com",   password: passwordHash, role: "user" },
      { name: "Suganya K",      email: "suganya@gmail.com",  password: passwordHash, role: "user" },
    ]);

    const adminUsers = users.filter(u => u.role === "admin");
    const regularUsers = users.filter(u => u.role === "user");
    console.log(`👥 Created ${users.length} users (${adminUsers.length} admins, ${regularUsers.length} contributors)`);

    // ── 2. Prices ─────────────────────────────────────────
    const prices = [];

    // Admin-submitted prices (auto-approved) — good coverage across all districts
    for (const district of DISTRICTS) {
      const markets = MARKETS[district] || [`${district} Market`];
      // 3-5 commodities per district
      const selectedCommodities = [...COMMODITIES].sort(() => 0.5 - Math.random()).slice(0, 4);
      for (const commodity of selectedCommodities) {
        prices.push({
          userId:    randItem(adminUsers)._id,
          commodity,
          marketName: randItem(markets),
          district,
          price:     randPrice(commodity),
          status:    "approved",
          editedByAdmin: true,
          createdAt: randDate(30),
        });
      }
    }

    // User-submitted prices — mix of pending/approved/rejected
    const statuses = ["approved", "approved", "approved", "pending", "pending", "rejected"];
    for (let i = 0; i < 60; i++) {
      const user      = randItem(regularUsers);
      const district  = randItem(DISTRICTS);
      const commodity = randItem(COMMODITIES);
      const markets   = MARKETS[district] || [`${district} Market`];
      const status    = randItem(statuses);
      prices.push({
        userId:    user._id,
        commodity,
        marketName: randItem(markets),
        district,
        price:     randPrice(commodity),
        status,
        rejectionReason: status === "rejected" ? randItem([
          "Price seems too high for this region",
          "Duplicate entry for this market",
          "Invalid price — please verify",
          "Market name is incorrect",
        ]) : undefined,
        editedByAdmin: false,
        createdAt: randDate(14),
      });
    }

    const insertedPrices = await Price.insertMany(prices);
    const pendingCount  = insertedPrices.filter(p => p.status === "pending").length;
    const approvedCount = insertedPrices.filter(p => p.status === "approved").length;
    const rejectedCount = insertedPrices.filter(p => p.status === "rejected").length;
    console.log(`🌾 Created ${insertedPrices.length} prices — ${approvedCount} approved, ${pendingCount} pending, ${rejectedCount} rejected`);

    // ── 3. Notifications ──────────────────────────────────
    const notifications = [];
    for (const price of insertedPrices.filter(p => p.status !== "pending")) {
      const msg = price.status === "approved"
        ? `✅ Your price submission for ${price.commodity} (₹${price.price}) was approved`
        : `❌ Your submission for ${price.commodity} was rejected: ${price.rejectionReason}`;

      notifications.push({
        userId:    price.userId,
        message:   msg,
        read:      Math.random() > 0.4,
        createdAt: new Date(price.createdAt.getTime() + 60 * 60 * 1000),
      });
    }

    // Extra welcome notifications
    for (const user of regularUsers) {
      notifications.push({
        userId:  user._id,
        message: "👋 Welcome to TN Price Monitor! Start submitting commodity prices from your local market.",
        read:    false,
        createdAt: randDate(30),
      });
    }

    await Notification.insertMany(notifications);
    console.log(`🔔 Created ${notifications.length} notifications`);

    // ── 4. Settings ───────────────────────────────────────
    await Settings.create({
      key:         "platform",
      districts:   DISTRICTS,
      commodities: COMMODITIES,
    });
    console.log(`⚙️  Saved platform settings (${DISTRICTS.length} districts, ${COMMODITIES.length} commodities)`);

    // ── Summary ───────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("✅  SEED COMPLETE — Login credentials:");
    console.log("════════════════════════════════════════");
    console.log("👑 ADMIN 1:  harish@gmail.com  / admin123");
    console.log("👑 ADMIN 2:  priya@gmail.com   / admin123");
    console.log("────────────────────────────────────────");
    console.log("👤 USER 1:   deepak@gmail.com  / password123");
    console.log("👤 USER 2:   anitha@gmail.com  / password123");
    console.log("👤 USER 3:   murugan@gmail.com / password123");
    console.log("👤 USER 4:   kavitha@gmail.com / password123");
    console.log("👤 USER 5:   selvam@gmail.com  / password123");
    console.log("👤 USER 6:   lakshmi@gmail.com / password123");
    console.log("👤 USER 7:   rajesh@gmail.com  / password123");
    console.log("👤 USER 8:   suganya@gmail.com / password123");
    console.log("════════════════════════════════════════\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
