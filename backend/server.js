import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { fetchTrends } from './services/trendFetcher.js';
import { generateEducationalTopics, generatePost } from './services/postGenerator.js';
import {
  exchangeCodeForToken,
  getAuthorizationUrl,
  getMyProfile,
  getProfileFromToken,
  publishToLinkedIn,
  publishToLinkedInWithImage,
} from './services/linkedin.js';
import { generateGeminiTopicImage } from './services/geminiImageGenerator.js';
import { appendPublishLog, readPublishLog } from './services/publishLog.js';

const app = express();
const PORT = process.env.PORT || 4000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const oauthStates = new Set();
const TOKEN_STORE_PATH = path.join(__dirname, 'token-store.json');
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
      return callback(new Error('Only PNG and JPG images are supported'));
    }
    callback(null, true);
  },
});

async function getScheduler() {
  return import('./services/scheduler.js');
}

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = new Set([corsOrigin, 'http://localhost:3000', 'null']);

    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/me', async (req, res) => {
  try {
    res.json(await getMyProfile());
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get LinkedIn profile' });
  }
});

app.get('/auth/linkedin', (req, res) => {
  try {
    const state = crypto.randomUUID();
    oauthStates.add(state);
    res.redirect(getAuthorizationUrl(state));
  } catch (err) {
    console.error('LinkedIn auth error:', err);
    res.status(500).send('Failed to start LinkedIn authorization');
  }
});

app.get('/auth/linkedin/callback', async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    return res.status(400).send(`LinkedIn authorization failed: ${errorDescription || error}`);
  }

  if (!code || !state || !oauthStates.has(state)) {
    return res.status(400).send('Invalid LinkedIn OAuth callback. Missing code or state.');
  }

  oauthStates.delete(state);

  try {
    const token = await exchangeCodeForToken(code);
    const profile = await getProfileFromToken(token.access_token);

    const tokenData = {
      access_token: token.access_token,
      personUrn: profile.personUrn,
      expiresAt: Date.now() + token.expires_in * 1000,
      updatedAt: new Date().toISOString(),
    };

    const tempPath = TOKEN_STORE_PATH + '.tmp';
    await fs.writeFile(tempPath, JSON.stringify(tokenData, null, 2), { mode: 0o600 });
    await fs.rename(tempPath, TOKEN_STORE_PATH);

    res.type('text/plain').send('LinkedIn OAuth success. Tokens stored securely on server.');
  } catch (err) {
    console.error('LinkedIn OAuth callback error:', err);
    res.status(500).send('Failed to exchange LinkedIn code');
  }
});

app.get('/api/trends', async (req, res) => {
  try {
    const excludedTitles = req.query.excluded
      ? req.query.excluded.split(',').map(t => t.trim())
      : [];
    const count = parseInt(req.query.count) || 10;

    res.json(await fetchTrends({ excludedTitles, count }));
  } catch (err) {
    console.error('Trend fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

app.post('/api/topics/educational', async (req, res) => {
  try {
    const topics = await generateEducationalTopics(req.body || {});
    res.json(topics);
  } catch (err) {
    console.error('Educational topic generation error:', err);
    res.status(500).json({ error: 'Failed to generate educational topics' });
  }
});

app.post('/api/images/generate', async (req, res) => {
  const { topic } = req.body;

  if (!topic?.title) {
    return res.status(400).json({ error: 'topic.title is required' });
  }

  try {
    const image = await generateGeminiTopicImage(topic);
    res.json({ success: true, image });
  } catch (err) {
    console.error('Gemini image generation error:', err);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.use('/generated-images', express.static('generated-images'));

app.post('/api/generate', async (req, res) => {
  const { topic, tone, audience, length, previousTemplateStyle } = req.body;

  if (!topic?.title) {
    return res.status(400).json({ error: 'topic.title is required' });
  }

  try {
    const { postText, templateStyle, imageVisualBrief } = await generatePost({ topic, tone, audience, length, previousTemplateStyle });
    res.json({ postText, templateStyle, imageVisualBrief });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Failed to generate post' });
  }
});

app.post('/api/publish', async (req, res) => {
  const { postText } = req.body;

  if (!postText?.trim()) {
    return res.status(400).json({ error: 'postText is required' });
  }

  try {
    const result = await publishToLinkedIn(postText.trim());
    await appendPublishLog({ type: 'text', status: 'success', result });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Publish error:', err);
    await appendPublishLog({
      type: 'text',
      status: 'failed',
      error: err.message,
      linkedinStatus: err.response?.status,
      linkedinDetails: err.response?.data,
    });
    res.status(500).json({ error: 'Failed to publish to LinkedIn' });
  }
});

app.post('/api/publish/image', upload.single('image'), async (req, res) => {
  const postText = req.body.postText;

  if (!postText?.trim()) {
    return res.status(400).json({ error: 'postText is required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'image file is required' });
  }

  try {
    const result = await publishToLinkedInWithImage(postText.trim(), req.file);
    await appendPublishLog({ type: 'image', status: 'success', result });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Publish image error:', err);
    await appendPublishLog({
      type: 'image',
      status: 'failed',
      error: err.message,
      linkedinStatus: err.response?.status,
      linkedinDetails: err.response?.data,
    });
    res.status(500).json({ error: 'Failed to publish to LinkedIn' });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
  }
});

app.get('/api/publish/log', async (req, res) => {
  res.json(await readPublishLog());
});

app.post('/api/schedule', async (req, res) => {
  const { topic, tone, audience, length, scheduledTime } = req.body;

  if (!topic?.title || !scheduledTime) {
    return res.status(400).json({ error: 'topic.title and scheduledTime are required' });
  }

  try {
    const { schedulePost } = await getScheduler();
    const job = await schedulePost({ topic, tone, audience, length, scheduledTime });
    res.json({ success: true, job });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: 'Failed to schedule post' });
  }
});

app.post('/api/schedule/daily', async (req, res) => {
  const { topic, tone, audience, length, publishTime, timezone } = req.body;

  if (!topic?.title || !publishTime) {
    return res.status(400).json({ error: 'topic.title and publishTime are required' });
  }

  try {
    const { scheduleDailyPost } = await getScheduler();
    const job = await scheduleDailyPost({ topic, tone, audience, length, publishTime, timezone });
    res.json({ success: true, job });
  } catch (err) {
    console.error('Daily schedule error:', err);
    res.status(500).json({ error: 'Failed to schedule daily post' });
  }
});

app.get('/api/schedule', async (req, res) => {
  try {
    const { getAllJobs } = await getScheduler();
    res.json(await getAllJobs());
  } catch (err) {
    console.error('Get scheduled jobs error:', err);
    res.status(500).json({ error: 'Failed to get scheduled jobs' });
  }
});

app.delete('/api/schedule/:jobId', async (req, res) => {
  try {
    const { cancelJob } = await getScheduler();
    await cancelJob(req.params.jobId);
    res.json({ success: true });
  } catch (err) {
    console.error('Cancel schedule error:', err);
    res.status(500).json({ error: 'Failed to cancel scheduled job' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`CORS origin: ${corsOrigin}`);
});
