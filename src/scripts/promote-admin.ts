import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from '@/config/db';
import User from '@/models/User';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: yarn admin:promote <email>');
  process.exit(1);
}

(async () => {
  try {
    await connectDB();

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: 'admin', isEmailVerified: true } },
      { new: true }
    );

    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    console.log(`User promoted to admin: ${user.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to promote user to admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
