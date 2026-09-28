import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Imported first by server/index.js so every other module sees the .env values.
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const isProduction = process.env.NODE_ENV === 'production';

const envFile = path.join(ROOT_DIR, '.env');

// First run on a dev machine: create .env with a random admin password, so there is never a default one.
if (!isProduction && !fs.existsSync(envFile) && !process.env.ADMIN_PASSWORD) {
  const password = crypto.randomBytes(9).toString('base64url');
  try {
    fs.writeFileSync(
      envFile,
      [
        '# Created on first start. See .env.example for every option.',
        `ADMIN_PASSWORD=${password}`,
        `SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`,
        '',
      ].join('\n'),
    );
    console.log(`\n  Created .env. Your admin dashboard password is: ${password}\n`);
  } catch (err) {
    console.warn(`Could not create .env: ${err.message}`);
  }
}

try {
  process.loadEnvFile(envFile);
} catch (err) {
  if (err.code !== 'ENOENT') console.warn(`Could not read .env: ${err.message}`);
}
