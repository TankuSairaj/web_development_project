require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const { requirePage } = require('./middleware/auth');

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGODB_URI or JWT_SECRET in .env');
  process.exit(1);
}

const app = express();

// Security headers. "upgrade-insecure-requests" is disabled so the site also
// works over plain http on your Wi-Fi (needed for scanning QR codes with a phone).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': null,
      },
    },
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Public static files (home, verify, login, about, css, js)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the installed QR decoder at the URL used by verify.html.
app.get('/js/jsQR.js', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'jsqr', 'dist', 'jsQR.js'), (err) => {
    if (err) next(err);
  });
});

// Protected dashboard page: redirects to login if not authenticated
app.get('/dashboard', requirePage, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API routes
const verifyLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/api/auth', authRoutes);
app.use('/api/verify', verifyLimiter, verifyRoutes);
app.use('/api/certificates', certificateRoutes);

app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Central error handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message: msg });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid data supplied' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 3000;

// mongodb_connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });