const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/vticket';

async function main() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  console.log('Connected successfully. Seeding database...');

  const rolesCol = db.collection('roles');
  const usersCol = db.collection('users');
  const userProfilesCol = db.collection('userProfiles');

  // 1. Seed Roles
  const rolesList = ['USER', 'ORGANIZER', 'ADMIN'];
  const roleMap = {};

  for (const roleName of rolesList) {
    let role = await rolesCol.findOne({ roleName });
    if (!role) {
      const result = await rolesCol.insertOne({
        roleName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      role = { _id: result.insertedId, roleName };
      console.log(`Created Role: ${roleName}`);
    } else {
      console.log(`Role already exists: ${roleName}`);
    }
    roleMap[roleName] = role._id;
  }

  // 2. Hash default password
  const defaultPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 3. Seed Accounts
  const testUsers = [
    {
      email: 'user@vticket.com',
      roleName: 'USER',
      fullName: 'Standard User Test',
      phone: '0901234567',
    },
    {
      email: 'organizer@vticket.com',
      roleName: 'ORGANIZER',
      fullName: 'Event Organizer Test',
      phone: '0908765432',
    },
    {
      email: 'admin@vticket.com',
      roleName: 'ADMIN',
      fullName: 'System Admin Test',
      phone: '0999999999',
    },
  ];

  for (const item of testUsers) {
    let user = await usersCol.findOne({ email: item.email });
    if (!user) {
      const userRes = await usersCol.insertOne({
        email: item.email,
        password: hashedPassword,
        roleId: roleMap[item.roleName],
        status: 'ACTIVE',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      user = { _id: userRes.insertedId };

      await userProfilesCol.insertOne({
        userId: user._id,
        fullName: item.fullName,
        phone: item.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Created User [${item.roleName}]: ${item.email}`);
    } else {
      console.log(`User already exists: ${item.email}`);
    }
  }

  console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
  console.log('Test credentials (all passwords are: Password123!):');
  console.log('1. User:      user@vticket.com');
  console.log('2. Organizer: organizer@vticket.com');
  console.log('3. Admin:     admin@vticket.com');

  await client.close();
}

main().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
