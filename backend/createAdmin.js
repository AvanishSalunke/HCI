// Adds the admin account (username "admin", password "123") without touching any other user.
// Run:  npm run create-admin
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
dotenv.config();

if (process.env.DNS_SERVERS) {
  require('dns').setServers(process.env.DNS_SERVERS.split(',').map(s => s.trim()));
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (await User.exists({ username: 'admin' })) {
      console.log('The admin account already exists.');
    } else {
      const salt = await bcrypt.genSalt(10);
      await User.create({
        username: 'admin',
        password: await bcrypt.hash('123', salt),
        role: 'admin',
        committee: 'admin',
      });
      console.log('Admin account created. Username: admin  Password: 123');
    }
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
