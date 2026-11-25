const jwt = require('jsonwebtoken');

function getAdmin(req) {
  const token = req.cookies && req.cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// For API routes: respond with 401 JSON
exports.requireAuth = (req, res, next) => {
  const admin = getAdmin(req);
  if (!admin) return res.status(401).json({ message: 'Please log in' });
  req.admin = admin;
  next();
};

// For HTML pages: redirect to the login page
exports.requirePage = (req, res, next) => {
  if (!getAdmin(req)) return res.redirect('/login.html');
  next();
};