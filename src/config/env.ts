import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Central place for environment-driven settings.
 *
 * Credentials are read from environment variables (see `.env.example`) so no
 * sensitive data is hardcoded in the test files. The defaults below are the
 * public, well-known credentials of the OrangeHRM open-source demo and only
 * act as a convenience fallback.
 */
export const ENV = {
  baseURL: process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
  username: process.env.ADMIN_USERNAME ?? 'Admin',
  password: process.env.ADMIN_PASSWORD ?? 'admin123',
} as const;
