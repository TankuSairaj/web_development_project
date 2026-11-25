require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

(async () => {
  const { MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('Set MONGODB_URI, ADMIN_USERNAME and ADMIN_PASSWORD in .env first.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const username = ADMIN_USERNAME.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await Admin.findOneAndUpdate({ username }, { username, passwordHash }, { upsert: true, new: true });
  console.log(`Admin "${username}" is ready. You can now remove ADMIN_PASSWORD from .env.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});