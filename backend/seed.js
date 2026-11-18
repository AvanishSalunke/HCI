const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const committees = require('./committees');
dotenv.config();

if (process.env.DNS_SERVERS) {
  require('dns').setServers(process.env.DNS_SERVERS.split(',').map(s => s.trim()));
}
const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');
    await User.deleteMany({});
    console.log('Cleared existing users.');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);
    const users = [];
    for (const committee of committees) {
      users.push({
        username: `${committee.id}-student`,
        password: hashedPassword,
        role: 'student',
        committee: committee.id,
      });
      users.push({
        username: `${committee.id}-teacher`,
        password: hashedPassword,
        role: 'teacher',
        committee: committee.id,
      });
    }
    users.push({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      committee: 'admin',
    });
    await User.insertMany(users);
    console.log(`Seeded ${users.length} users successfully (including the admin account)!\n`);
    console.log('=== DUMMY LOGIN CREDENTIALS ===');
    console.log('Password for ALL accounts: 123\n');
    console.log('Committee'.padEnd(20), 'Student Username'.padEnd(30), 'Teacher Username');
    console.log('-'.repeat(80));
    for (const committee of committees) {
      console.log(
        committee.name.padEnd(20),
        `${committee.id}-student`.padEnd(30),
        `${committee.id}-teacher`
      );
    }
    console.log('\n');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};
seedUsers();