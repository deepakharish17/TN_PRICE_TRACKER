const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test";

const UserSchema = new mongoose.Schema({ name:String, email:String, password:String, role:String, suspended:{type:Boolean,default:false}, suspendReason:String }, { timestamps:true });
const PriceSchema = new mongoose.Schema({ commodity:String, marketName:String, district:String, price:Number, status:String, userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, rejectionReason:String }, { timestamps:true });
const NotificationSchema = new mongoose.Schema({ userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, message:String, type:String, read:{type:Boolean,default:false} }, { timestamps:true });
const AnnouncementSchema = new mongoose.Schema({ title:String, body:String, type:String, postedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"} }, { timestamps:true });
const SettingsSchema = new mongoose.Schema({ key:String, value:mongoose.Schema.Types.Mixed });
const AuditSchema = new mongoose.Schema({ adminId:mongoose.Schema.Types.ObjectId, adminName:String, adminEmail:String, action:String, targetId:mongoose.Schema.Types.ObjectId, targetName:String, details:String }, { timestamps:true });

const User         = mongoose.model("User",         UserSchema);
const Price        = mongoose.model("Price",        PriceSchema);
const Notification = mongoose.model("Notification", NotificationSchema);
const Announcement = mongoose.model("Announcement", AnnouncementSchema);
const Settings     = mongoose.model("Setting",      SettingsSchema);
const AuditLog     = mongoose.model("AuditLog",     AuditSchema);

const DISTRICTS = [
  "Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem",
  "Tirunelveli","Vellore","Erode","Thanjavur","Tiruppur",
  "Dindigul","Krishnagiri","Namakkal","Kancheepuram","Villupuram",
  "Cuddalore","Nagapattinam","Thiruvarur","Ariyalur","Perambalur",
  "Karur","Pudukkottai","Sivaganga","Virudhunagar","Tenkasi",
];

const COMMODITIES = [
  "Tomato","Onion","Potato","Rice (Raw)","Rice (Boiled)",
  "Wheat","Tur Dal","Chana Dal","Moong Dal",
  "Groundnut Oil","Coconut Oil","Milk","Eggs (dozen)",
  "Banana","Brinjal","Carrot",
];

const MARKETS = {
  "Chennai":         ["Koyambedu Market","Broadway Market","Parrys Market","Anna Nagar Market","T Nagar Market"],
  "Coimbatore":      ["Mettupalayam Road Market","RS Puram Market","Ukkadam Market","Gandhipuram Market","Singanallur Market"],
  "Madurai":         ["Mattuthavani Market","Alanganallur Market","Periyar Market","KK Nagar Market","Simmakkal Market"],
  "Tiruchirappalli": ["Ariyamangalam Market","Srirangam Market","Thillai Nagar Market","Chatram Bus Stand Market","Woraiyur Market"],
  "Salem":           ["Shevapet Market","Suramangalam Market","Five Roads Market","Ammapet Market","Kondalampatti Market"],
  "Tirunelveli":     ["Palayamkottai Market","Junction Market","Melapalayam Market","Vannarpettai Market","Pettai Market"],
  "Vellore":         ["Sathuvachari Market","Katpadi Market","Gandhi Road Market","Bagayam Market","Sainathapuram Market"],
  "Erode":           ["Brough Road Market","Perundurai Market","Chithode Market","Surampatti Market","Kavindapadi Market"],
  "Thanjavur":       ["Old Bus Stand Market","Nanjikottai Market","Medical College Market","Papanasam Market","Vallam Market"],
  "Tiruppur":        ["Avinashi Road Market","Palladam Market","Kangeyam Market","Dharapuram Market","Udumalaipettai Market"],
  "Dindigul":        ["Palani Road Market","Begampur Market","Thadikombu Market","Natham Market","Oddanchatram Market"],
  "Krishnagiri":     ["Hosur Market","Bargur Market","Pochampalli Market","Denkanikottai Market","Shoolagiri Market"],
  "Namakkal":        ["Tiruchengode Market","Rasipuram Market","Mohanur Market","Paramathi Market","Senthamangalam Market"],
  "Kancheepuram":    ["Silk City Market","Uthiramerur Market","Walajabad Market","Sriperumbudur Market","Madurantakam Market"],
  "Villupuram":      ["Gingee Market","Tindivanam Market","Ulundurpet Market","Kallakurichi Market","Sankarapuram Market"],
  "Cuddalore":       ["Panruti Market","Chidambaram Market","Virudhachalam Market","Neyveli Market","Kurinjipadi Market"],
  "Nagapattinam":    ["Velankanni Market","Sirkazhi Market","Mayiladuthurai Market","Tharangambadi Market","Kilvelur Market"],
  "Thiruvarur":      ["Papanasam Market","Kumbakonam Market","Needamangalam Market","Valangaiman Market","Thiruthuraipoondi Market"],
  "Ariyalur":        ["Jayankondam Market","Senthurai Market","Udayarpalayam Market","Andimadam Market","T Palur Market"],
  "Perambalur":      ["Perambalur Central Market","Veppur Market","Alathur Market","Kunnam Market","Poolambadi Market"],
  "Karur":           ["Karur Bypass Market","Pugalur Market","Kulithalai Market","Aravakurichi Market","Krishnarayapuram Market"],
  "Pudukkottai":     ["Alangudi Market","Aranthangi Market","Gandarvakottai Market","Karambakkudi Market","Iluppur Market"],
  "Sivaganga":       ["Karaikudi Market","Devakottai Market","Manamadurai Market","Sivaganga Central Market","Tiruppattur Market"],
  "Virudhunagar":    ["Aruppukkottai Market","Rajapalayam Market","Srivilliputhur Market","Sivakasi Market","Sattur Market"],
  "Tenkasi":         ["Courtallam Market","Sankarankovil Market","Alangulam Market","Kadayanallur Market","Tenkasi Central Market"],
};

// Base prices — realistic TN market rates
const BASE_PRICES = {
  "Tomato":         { base:45,  min:25,  max:80  },
  "Onion":          { base:32,  min:18,  max:55  },
  "Potato":         { base:28,  min:18,  max:45  },
  "Rice (Raw)":     { base:52,  min:44,  max:62  },
  "Rice (Boiled)":  { base:48,  min:40,  max:58  },
  "Wheat":          { base:38,  min:32,  max:46  },
  "Tur Dal":        { base:110, min:95,  max:135 },
  "Chana Dal":      { base:95,  min:80,  max:115 },
  "Moong Dal":      { base:105, min:90,  max:125 },
  "Groundnut Oil":  { base:180, min:160, max:210 },
  "Coconut Oil":    { base:200, min:175, max:230 },
  "Milk":           { base:55,  min:50,  max:62  },
  "Eggs (dozen)":   { base:72,  min:60,  max:90  },
  "Banana":         { base:40,  min:28,  max:58  },
  "Brinjal":        { base:35,  min:20,  max:55  },
  "Carrot":         { base:42,  min:28,  max:65  },
};

// District-wise price multipliers (some districts costlier)
const DISTRICT_MULTIPLIER = {
  "Chennai":1.15,"Coimbatore":1.08,"Madurai":1.05,"Tiruchirappalli":1.02,
  "Salem":1.0,"Tirunelveli":0.98,"Vellore":1.0,"Erode":0.96,
  "Thanjavur":0.94,"Tiruppur":1.02,"Dindigul":0.97,"Krishnagiri":0.95,
  "Namakkal":0.96,"Kancheepuram":1.10,"Villupuram":0.95,"Cuddalore":0.96,
  "Nagapattinam":0.93,"Thiruvarur":0.92,"Ariyalur":0.91,"Perambalur":0.90,
  "Karur":0.96,"Pudukkottai":0.93,"Sivaganga":0.94,"Virudhunagar":0.97,
  "Tenkasi":0.95,
};

const randFloat = (min,max) => Math.round((Math.random()*(max-min)+min)*2)/2;
const varyPrice = (commodity, district) => {
  const { min, max } = BASE_PRICES[commodity];
  const mult = DISTRICT_MULTIPLIER[district] || 1;
  return randFloat(min*mult, max*mult);
};

// Generate date spread over last 30 days
const pastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random()*12)+6, Math.floor(Math.random()*60));
  return d;
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  await Promise.all([
    User.deleteMany({}), Price.deleteMany({}),
    Notification.deleteMany({}), Announcement.deleteMany({}),
    Settings.deleteMany({}), AuditLog.deleteMany({}),
  ]);
  console.log("🗑️  Cleared old data");

  // ── Users ──────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash  = await bcrypt.hash("user123",  10);

  const admin1 = await User.create({ name:"Deepak Harish",   email:"admin@tnprice.com",   password:adminHash, role:"admin" });
  const admin2 = await User.create({ name:"Priya Rajan",     email:"priya@tnprice.com",   password:adminHash, role:"admin" });

  const users = await User.create([
    { name:"Arjun Kumar",      email:"arjun@gmail.com",     password:userHash, role:"user" },
    { name:"Meena Selvam",     email:"meena@gmail.com",     password:userHash, role:"user" },
    { name:"Ravi Shankar",     email:"ravi@gmail.com",      password:userHash, role:"user" },
    { name:"Lakshmi Devi",     email:"lakshmi@gmail.com",   password:userHash, role:"user" },
    { name:"Murugan Pillai",   email:"murugan@gmail.com",   password:userHash, role:"user" },
    { name:"Kavitha Nair",     email:"kavitha@gmail.com",   password:userHash, role:"user" },
    { name:"Senthil Kumar",    email:"senthil@gmail.com",   password:userHash, role:"user" },
    { name:"Anitha Raj",       email:"anitha@gmail.com",    password:userHash, role:"user" },
    { name:"Vijay Prakash",    email:"vijay@gmail.com",     password:userHash, role:"user" },
    { name:"Suganya Devi",     email:"suganya@gmail.com",   password:userHash, role:"user" },
    { name:"Karthik Raja",     email:"karthik@gmail.com",   password:userHash, role:"user" },
    { name:"Nithya Priya",     email:"nithya@gmail.com",    password:userHash, role:"user" },
    { name:"Balamurugan S",    email:"bala@gmail.com",      password:userHash, role:"user" },
    { name:"Deepa Krishnan",   email:"deepa@gmail.com",     password:userHash, role:"user" },
    { name:"Saravanan M",      email:"saravanan@gmail.com", password:userHash, role:"user" },
  ]);
  console.log(`👥 Created ${users.length + 2} users`);

  const allUsers = [admin1, admin2, ...users];

  // ── Prices ─────────────────────────────────────────────
  const priceData = [];

  // APPROVED: every district × every commodity × 5 entries each
  // = 25 × 16 × 5 = 2000 approved prices
  for (const district of DISTRICTS) {
    const markets = MARKETS[district];
    for (const commodity of COMMODITIES) {
      for (let i = 0; i < 5; i++) {
        const user   = allUsers[Math.floor(Math.random() * allUsers.length)];
        const market = markets[Math.floor(Math.random() * markets.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const date  = pastDate(daysAgo);
        priceData.push({
          commodity,
          marketName: market,
          district,
          price:  varyPrice(commodity, district),
          status: "approved",
          userId: user._id,
          createdAt:  date,
          updatedAt:  date,
        });
      }
    }
  }

  // PENDING: 20 entries spread across districts
  for (let i = 0; i < 20; i++) {
    const district  = DISTRICTS[i % DISTRICTS.length];
    const commodity = COMMODITIES[Math.floor(Math.random() * COMMODITIES.length)];
    const user      = users[Math.floor(Math.random() * users.length)];
    const markets   = MARKETS[district];
    priceData.push({
      commodity,
      marketName: markets[0],
      district,
      price:  varyPrice(commodity, district),
      status: "pending",
      userId: user._id,
    });
  }

  // REJECTED: 8 entries with clearly wrong prices
  for (let i = 0; i < 8; i++) {
    const district  = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    const commodity = COMMODITIES[Math.floor(Math.random() * COMMODITIES.length)];
    const user      = users[Math.floor(Math.random() * users.length)];
    priceData.push({
      commodity,
      marketName: `${district} Central Market`,
      district,
      price:  BASE_PRICES[commodity].max * 4, // obviously wrong
      status: "rejected",
      userId: user._id,
      rejectionReason: "Price seems too high — does not match regional market rates",
    });
  }

  await Price.insertMany(priceData);
  console.log(`🌾 Created ${priceData.length} price entries (${priceData.filter(p=>p.status==="approved").length} approved, 20 pending, 8 rejected)`);

  // ── Announcements ──────────────────────────────────────
  await Announcement.create([
    { title:"Welcome to TN Price Monitor!", body:"This platform helps farmers and buyers track real-time commodity prices across Tamil Nadu. Submit prices from your local market to help the community!", type:"info", postedBy:admin1._id },
    { title:"Tomato prices rising in Northern Districts", body:"Due to reduced rainfall, tomato prices have increased 15-20% in Vellore and Krishnagiri. Farmers are advised to plan accordingly.", type:"alert", postedBy:admin1._id },
    { title:"Coverage expanded to all 25 districts!", body:"We now cover all 25 districts of Tamil Nadu. Submit prices from your local market and help the community!", type:"success", postedBy:admin2._id },
    { title:"Mobile app coming soon!", body:"We are building a dedicated mobile app for easier price submission directly from the market. Stay tuned!", type:"info", postedBy:admin1._id },
    { title:"Festival season — expect price fluctuations", body:"During Pongal and Diwali, commodity prices typically fluctuate. Monitor the platform daily for accurate rates.", type:"urgent", postedBy:admin2._id },
    { title:"Onion prices stabilizing", body:"After last month's spike, onion prices are returning to normal. Current average is ₹32/kg across most districts.", type:"success", postedBy:admin1._id },
    { title:"Rice prices update — Kharif season", body:"With the new Kharif harvest arriving, rice prices are expected to dip slightly in Thanjavur, Thiruvarur and Nagapattinam.", type:"info", postedBy:admin2._id },
    { title:"New contributors recognised!", body:"Top 10 contributors this month have been awarded Champion badges. Keep submitting accurate prices to climb the leaderboard!", type:"success", postedBy:admin1._id },
  ]);
  console.log("📢 Created 8 announcements");

  // ── Notifications ──────────────────────────────────────
  const notifData = [];
  for (const user of users) {
    notifData.push(
      { userId:user._id, message:"Your price submission has been approved and is now live!", type:"success", read:false },
      { userId:user._id, message:"Welcome to TN Price Monitor! Start by submitting a market price from your district.", type:"info", read:true },
    );
  }
  notifData.push(
    { userId:users[0]._id, message:"Your Onion price submission was rejected — price entered seems unusually high.", type:"error",   read:false },
    { userId:users[1]._id, message:"New announcement: Festival season price fluctuations expected.", type:"info",    read:false },
    { userId:users[2]._id, message:"🏆 You've earned the Top Contributor badge this month!", type:"success", read:false },
    { userId:users[3]._id, message:"Your Tomato price for Chennai has been approved!", type:"success", read:false },
    { userId:users[4]._id, message:"Admin edited your submission before approving. Check your submissions.", type:"info", read:false },
    { userId:users[5]._id, message:"You are now ranked #3 on the leaderboard! Keep contributing.", type:"success", read:false },
  );
  await Notification.insertMany(notifData);
  console.log(`🔔 Created ${notifData.length} notifications`);

  // ── Settings ───────────────────────────────────────────
  await Settings.create([
    { key:"districts",   value: DISTRICTS },
    { key:"commodities", value: COMMODITIES },
  ]);
  console.log("⚙️  Created settings");

  // ── Audit Logs ─────────────────────────────────────────
  await AuditLog.create([
    { adminId:admin1._id, adminName:"Deepak Harish", adminEmail:"admin@tnprice.com", action:"approve",  targetName:"Tomato - Chennai",      details:"Approved price submission ₹45/kg" },
    { adminId:admin1._id, adminName:"Deepak Harish", adminEmail:"admin@tnprice.com", action:"reject",   targetName:"Onion - Madurai",        details:"Rejected — price too high (₹250/kg)" },
    { adminId:admin2._id, adminName:"Priya Rajan",   adminEmail:"priya@tnprice.com", action:"approve",  targetName:"Rice (Raw) - Thanjavur", details:"Approved price submission ₹52/kg" },
    { adminId:admin1._id, adminName:"Deepak Harish", adminEmail:"admin@tnprice.com", action:"edit",     targetName:"Potato - Coimbatore",    details:"Edited price from ₹15 to ₹28 before approving" },
    { adminId:admin2._id, adminName:"Priya Rajan",   adminEmail:"priya@tnprice.com", action:"promote",  targetName:"Arjun Kumar",            details:"Promoted user to admin role" },
    { adminId:admin1._id, adminName:"Deepak Harish", adminEmail:"admin@tnprice.com", action:"suspend",  targetName:"Test Spammer",           details:"Suspended for submitting fake prices repeatedly" },
    { adminId:admin1._id, adminName:"Deepak Harish", adminEmail:"admin@tnprice.com", action:"announce", targetName:"Welcome announcement",   details:"Posted welcome announcement to all users" },
    { adminId:admin2._id, adminName:"Priya Rajan",   adminEmail:"priya@tnprice.com", action:"announce", targetName:"Festival season alert",  details:"Posted urgent festival season price alert" },
  ]);
  console.log("📋 Created audit logs");

  // ── Final Summary ──────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log("✅  SEED COMPLETE!");
  console.log("════════════════════════════════════════");
  console.log(`👥  Users:          ${users.length + 2} (2 admins + ${users.length} users)`);
  console.log(`🌾  Prices:         ${priceData.length}`);
  console.log(`    ✅ Approved:    ${priceData.filter(p=>p.status==="approved").length}`);
  console.log(`    ⏳ Pending:     20`);
  console.log(`    ❌ Rejected:    8`);
  console.log(`📢  Announcements:  8`);
  console.log(`🔔  Notifications:  ${notifData.length}`);
  console.log(`🗺️   Districts:      ${DISTRICTS.length}`);
  console.log(`🌾  Commodities:    ${COMMODITIES.length}`);
  console.log("────────────────────────────────────────");
  console.log("🔑  Admin:  admin@tnprice.com  /  admin123");
  console.log("🔑  User:   arjun@gmail.com    /  user123");
  console.log("════════════════════════════════════════\n");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});