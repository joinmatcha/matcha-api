import bcrypt from 'bcrypt';

import { env } from '@/config/env';
import User from '@/models/User';
import { logger } from '@/utils/logger';

export const ensureInitialAdmin = async (): Promise<void> => {
  const email = env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.INITIAL_ADMIN_PASSWORD;

  if (!email) {
    return;
  }

  if (!password) {
    logger.warn('admin_bootstrap_skipped_missing_password', { email });
    return;
  }

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      email,
      passwordHash,
      firstName: env.INITIAL_ADMIN_FIRST_NAME,
      lastName: env.INITIAL_ADMIN_LAST_NAME,
      consentAccepted: true,
      isEmailVerified: true,
      role: 'admin',
    });

    logger.info('admin_bootstrap_created', { email });
    return;
  }

  let hasChanges = false;

  if (existingUser.role !== 'admin') {
    existingUser.role = 'admin';
    hasChanges = true;
  }

  if (!existingUser.isEmailVerified) {
    existingUser.isEmailVerified = true;
    hasChanges = true;
  }

  if (env.INITIAL_ADMIN_FORCE_PASSWORD_RESET) {
    existingUser.passwordHash = await bcrypt.hash(password, 10);
    hasChanges = true;
  }

  if (!existingUser.firstName && env.INITIAL_ADMIN_FIRST_NAME) {
    existingUser.firstName = env.INITIAL_ADMIN_FIRST_NAME;
    hasChanges = true;
  }

  if (!existingUser.lastName && env.INITIAL_ADMIN_LAST_NAME) {
    existingUser.lastName = env.INITIAL_ADMIN_LAST_NAME;
    hasChanges = true;
  }

  if (hasChanges) {
    await existingUser.save();
    logger.info('admin_bootstrap_updated', { email });
  }
};
