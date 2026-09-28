import './env.js';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { business } from '../shared/business.js';
import { adminConfigured } from './auth.js';
import { TIME_ZONE } from './availability.js';
import { ROOT_DIR } from './env.js';
import { mailEnabled } from './mailer.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/public.js';

const PORT = Number(process.env.PORT || 3001);
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IPs and https detection behind a hosting proxy

app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  next();
});
app.use(express.json({ limit: '50kb' }));

app.use('/api/admin', adminRouter);
app.use('/api', publicRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// In production the API also serves the built website (npm run build → dist/).
if (fs.existsSync(DIST_DIR)) {
  app.use(
    express.static(DIST_DIR, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`\n  ${business.name} API running on http://localhost:${PORT}`);
  console.log(`  Time zone: ${TIME_ZONE}`);
  console.log(`  Emails: ${mailEnabled ? 'sending via SMTP' : 'printed to this console (set SMTP_* in .env to send)'}`);
  console.log(`  Admin dashboard: ${adminConfigured ? 'enabled at /admin' : 'disabled (set ADMIN_PASSWORD in .env)'}`);
  if (fs.existsSync(DIST_DIR)) console.log(`  Serving the built website from dist/`);
  console.log('');
});
