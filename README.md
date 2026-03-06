# 🌾 TN Price Monitor — Real-Time Commodity Price Tracker for Tamil Nadu

> A full-stack web platform that enables farmers, buyers, and market participants across Tamil Nadu to **submit, track, and analyse live commodity prices** — making markets more transparent and accessible for everyone.

🔗 **Live Demo:** [tn-price-tracker-9ekp.vercel.app](https://tn-price-tracker-9ekp.vercel.app)  
🐙 **GitHub:** [github.com/deepakharish17/TN_PRICE_TRACKER](https://github.com/deepakharish17/TN_PRICE_TRACKER)

---

## 🚀 What I Built

A production-ready MERN stack application covering **all 25 districts of Tamil Nadu** and **16 commodity categories** — from tomatoes and onions to rice, dal, and cooking oils.

The platform has two distinct experiences:

- **Users** can submit live market prices, track their submissions, bookmark prices, compare districts, and view analytics
- **Admins** have a full moderation dashboard — approve/reject/edit submissions, manage users, view audit logs, post announcements, and export data

---

## ✨ Key Features

### 📊 Market & Analytics
- Live market price board with card and table views
- 30-day price history with line charts (avg / min / max)
- District-wise price comparison bar charts
- Commodity distribution pie charts
- Cheapest vs most expensive district finder

### 👥 Community
- 🏆 Leaderboard with GitHub-style badges (Champion / Expert / Pro)
- 📢 Announcements system with Info / Alert / Urgent / Good News types
- 🌦️ Weather & price impact predictions using Open-Meteo API

### 🛡️ Admin Tools
- Pending review queue with approve / reject / bulk actions
- Full audit log of every admin action
- Activity heatmap (GitHub-style 52-week grid)
- User management with suspend / promote / demote
- CSV data export with filters
- Configurable districts and commodities

### 🎨 UI/UX
- Dark and light mode toggle
- Fully responsive — desktop, tablet, and mobile
- Bottom navigation bar on mobile
- Animated sidebar drawer on mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Recharts, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JWT (JSON Web Tokens), bcryptjs |
| **Styling** | Pure CSS with CSS variables (no UI library) |
| **Deployment** | Vercel (frontend) + Render (backend) + MongoDB Atlas |
| **External API** | Open-Meteo (free weather API) |

---

## 🏗️ Architecture
```
tn-price-monitor/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── pages/            # 22 pages
│   │   ├── components/       # Layout, Sidebar
│   │   ├── hooks/            # useSettings
│   │   └── utils/            # auth, theme helpers
│   └── index.html
│
└── backend/                  # Node + Express
    ├── routes/               # auth, price, admin, notifications, announcements
    ├── models/               # User, Price, Notification, Announcement, AuditLog
    ├── middleware/           # JWT auth, role checks
    └── server.js
```

---

## 🌟 Highlights

- **~1,200 seeded price entries** across all 25 TN districts and 16 commodities
- **Role-based access control** — user vs admin with protected routes
- **Audit logging** on every admin action (approve, reject, suspend, announce)
- **User suspension system** with reason tracking and notifications
- **Weather integration** — shows how temperature/rain affects each commodity price
- **Zero cost deployment** — runs 24/7 for free using Vercel + Render + MongoDB Atlas + UptimeRobot

---

## 💡 Why I Built This

Price information in local Tamil Nadu markets is largely inaccessible to farmers who travel long distances without knowing current rates. This platform gives them a simple way to check and contribute live prices — helping both sellers and buyers make informed decisions.

---

## 🚦 Getting Started Locally
```bash
# Clone the repo
git clone https://github.com/deepakharish17/TN_PRICE_TRACKER.git

# Backend
cd backend
npm install
cp .env.example .env   # add your MONGO_URI and JWT_SECRET
node seed.js           # seed the database
npm run dev            # runs on :5000

# Frontend
cd ../frontend
npm install
npm run dev            # runs on :5173
```

---

## 🔑 Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@tnprice.com | admin123 |
| User | arjun@gmail.com | user123 |

---

## 📬 Connect With Me

Built by **Deepak Harish** — open to feedback, collaborations, and opportunities!

- 💼 LinkedIn: [# 🌾 TN Price Monitor — Real-Time Commodity Price Tracker for Tamil Nadu

> A full-stack web platform that enables farmers, buyers, and market participants across Tamil Nadu to **submit, track, and analyse live commodity prices** — making markets more transparent and accessible for everyone.

🔗 **Live Demo:** [tn-price-tracker-9ekp.vercel.app](https://tn-price-tracker-9ekp.vercel.app)  
🐙 **GitHub:** [github.com/deepakharish17/TN_PRICE_TRACKER](https://github.com/deepakharish17/TN_PRICE_TRACKER)

---

## 🚀 What I Built

A production-ready MERN stack application covering **all 25 districts of Tamil Nadu** and **16 commodity categories** — from tomatoes and onions to rice, dal, and cooking oils.

The platform has two distinct experiences:

- **Users** can submit live market prices, track their submissions, bookmark prices, compare districts, and view analytics
- **Admins** have a full moderation dashboard — approve/reject/edit submissions, manage users, view audit logs, post announcements, and export data

---

## ✨ Key Features

### 📊 Market & Analytics
- Live market price board with card and table views
- 30-day price history with line charts (avg / min / max)
- District-wise price comparison bar charts
- Commodity distribution pie charts
- Cheapest vs most expensive district finder

### 👥 Community
- 🏆 Leaderboard with GitHub-style badges (Champion / Expert / Pro)
- 📢 Announcements system with Info / Alert / Urgent / Good News types
- 🌦️ Weather & price impact predictions using Open-Meteo API

### 🛡️ Admin Tools
- Pending review queue with approve / reject / bulk actions
- Full audit log of every admin action
- Activity heatmap (GitHub-style 52-week grid)
- User management with suspend / promote / demote
- CSV data export with filters
- Configurable districts and commodities

### 🎨 UI/UX
- Dark and light mode toggle
- Fully responsive — desktop, tablet, and mobile
- Bottom navigation bar on mobile
- Animated sidebar drawer on mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Recharts, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JWT (JSON Web Tokens), bcryptjs |
| **Styling** | Pure CSS with CSS variables (no UI library) |
| **Deployment** | Vercel (frontend) + Render (backend) + MongoDB Atlas |
| **External API** | Open-Meteo (free weather API) |

---

## 🏗️ Architecture
```
tn-price-monitor/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── pages/            # 22 pages
│   │   ├── components/       # Layout, Sidebar
│   │   ├── hooks/            # useSettings
│   │   └── utils/            # auth, theme helpers
│   └── index.html
│
└── backend/                  # Node + Express
    ├── routes/               # auth, price, admin, notifications, announcements
    ├── models/               # User, Price, Notification, Announcement, AuditLog
    ├── middleware/           # JWT auth, role checks
    └── server.js
```

---

## 🌟 Highlights

- **~1,200 seeded price entries** across all 25 TN districts and 16 commodities
- **Role-based access control** — user vs admin with protected routes
- **Audit logging** on every admin action (approve, reject, suspend, announce)
- **User suspension system** with reason tracking and notifications
- **Weather integration** — shows how temperature/rain affects each commodity price
- **Zero cost deployment** — runs 24/7 for free using Vercel + Render + MongoDB Atlas + UptimeRobot

---

## 💡 Why I Built This

Price information in local Tamil Nadu markets is largely inaccessible to farmers who travel long distances without knowing current rates. This platform gives them a simple way to check and contribute live prices — helping both sellers and buyers make informed decisions.

---

## 🚦 Getting Started Locally
```bash
# Clone the repo
git clone https://github.com/deepakharish17/TN_PRICE_TRACKER.git

# Backend
cd backend
npm install
cp .env.example .env   # add your MONGO_URI and JWT_SECRET
node seed.js           # seed the database
npm run dev            # runs on :5000

# Frontend
cd ../frontend
npm install
npm run dev            # runs on :5173
```

---

## 🔑 Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@tnprice.com | admin123 |
| User | arjun@gmail.com | user123 |

---

## 📬 Connect With Me

Built by **Deepak Harish** — open to feedback, collaborations, and opportunities!

- 💼 LinkedIn: [(https://www.linkedin.com/in/deepak-harish-t-m/)](https://www.linkedin.com/in/deepak-harish-t-m/)
- 🐙 GitHub: [github.com/deepakharish17](https://github.com/deepakharish17)
- 📧 Email: harishdeepak35@gmail.com

---

*If you found this useful, please ⭐ the repo — it means a lot!*
- 🐙 GitHub: [github.com/deepakharish17](https://github.com/deepakharish17)
- 📧 Email: harishdeepak35@gmail.com

---

*If you found this useful, please ⭐ the repo — it means a lot!*
