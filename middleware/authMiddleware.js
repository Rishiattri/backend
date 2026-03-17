const { verifyToken } = require("../utils/jwt");

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const token = header.split(" ")[1];
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || "Invalid token" });
  }
};
