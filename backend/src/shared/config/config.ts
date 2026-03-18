import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import z from 'zod';

config({ path: '.env' });

if (!fs.existsSync(path.resolve('./.env'))) {
  console.log('Cannot find env file');
  process.exit(1);
}

const configSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.string().optional(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  SENTRY_DSN: z.string().optional(),
  NODE_ENV: z.string().optional(),
  FRONTEND_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  ADMIN_FIRST_NAME: z.string().min(1).max(100),
  ADMIN_LAST_NAME: z.string().min(1).max(100),
  ADMIN_PASSWORD: z.string().min(1).max(100),
  ADMIN_EMAIL: z.string().email(),
});

const configServer = configSchema.safeParse(process.env);
if (!configServer.success) {
  console.log('Declared values in env file is not valid');
  console.error(configServer.error);
  process.exit(1);
}

const envConfig = configServer.data;
export default envConfig;
