const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json("No token");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json("User not found");
    if (user.suspended) return res.status(403).json("Account suspended");
    req.user = user;
    next();
  } catch { res.status(401).json("Invalid token"); }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json("Admin access required");
  next();
};

module.exports = { protect, adminOnly };
