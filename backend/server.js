const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/price",         require("./routes/priceRoutes"));
app.use("/api/admin",         require("./routes/adminRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));

// ── DB + Start ───────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tn-price-monitor")
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error("❌ DB error:", err));
