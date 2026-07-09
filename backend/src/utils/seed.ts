import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const usersToSeed = [
  {
    name: 'Jane Doe',
    email: 'citizen@aasha.space',
    password: 'password123',
    role: 'citizen',
    phone: '+91 98765 00001',
    location: { lat: 28.6139, lng: 77.2090 }, // Delhi
    languagePreference: 'en',
  },
  {
    name: 'John Doe',
    email: 'volunteer@aasha.space',
    password: 'password123',
    role: 'volunteer',
    phone: '+91 98765 00002',
    location: { lat: 28.6250, lng: 77.2200 },
    languagePreference: 'en',
    skills: ['medical', 'transport', 'general'],
  },
  {
    name: 'System Admin',
    email: 'admin@aasha.space',
    password: 'admin123',
    role: 'admin',
    phone: '+91 98765 00003',
    location: { lat: 28.6300, lng: 77.2150 },
    languagePreference: 'en',
  },
];

const seedDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    // Remove existing seed users first
    const emails = usersToSeed.map(u => u.email);
    const deleteResult = await User.deleteMany({ email: { $in: emails } });
    console.log(`🧹 Cleaned up ${deleteResult.deletedCount} existing seed accounts.`);

    // Insert users
    for (const userData of usersToSeed) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      const user = await User.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        passwordHash,
        role: userData.role,
        location: userData.location,
        languagePreference: userData.languagePreference,
        skills: (userData as any).skills || [],
      });

      console.log(`👤 Created user: ${user.name} (${user.role}) - Email: ${user.email}`);
    }

    console.log('\n🎉 Database seeding complete!');
    console.log('--------------------------------------------------');
    console.log('Use the following credentials to sign in:');
    console.log('1. Citizen Portal:   citizen@aasha.space / password123');
    console.log('2. Volunteer Portal: volunteer@aasha.space / password123');
    console.log('3. Admin Portal:     admin@aasha.space / admin123');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
