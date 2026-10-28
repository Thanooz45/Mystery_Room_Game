import express from 'express';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { config } from './config.js';
import { User, Case, Progress } from './models.js';
import { generateMystery } from './mystery.js';
import { DIFFICULTY_RULES, scoreCase } from './game-rules.js';

await mongoose.connect(config.MONGODB_URI);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.NODE_ENV === 'production' ? 1 : false);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin === config.CLIENT_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, X-Request-Id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin === config.CLIENT_ORIGIN ? 204 : 403);
  next();
});
app.use((req, res, next) => { res.setHeader('X-Request-Id', req.get('x-request-id') || `req_${randomUUID()}`); next(); });
app.use(express.json({ limit: config.MAX_CASE_PAYLOAD_BYTES }));
app.use(session({
  name: 'mystery.sid', secret: config.SESSION_SECRET, resave: false, saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: config.MONGODB_URI, collectionName: 'sessions', ttl: 60 * 60 * 24 * 14 }),
  cookie: { httpOnly: true, secure: config.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 14 },
}));
app.use('/api/v1', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.get('origin') && req.get('origin') !== config.CLIENT_ORIGIN) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Request origin is not allowed.', requestId: res.getHeader('X-Request-Id'), details: [] } });
  next();
});
const api = express.Router();
const limiter = rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.RATE_LIMIT_MAX_REQUESTS, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again shortly.', details: [] } } });
api.use(limiter);
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const requireAuth = asyncRoute(async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Please sign in to continue.', requestId: res.getHeader('X-Request-Id'), details: [] } });
  const user = await User.findById(req.session.userId).select('email displayName');
  if (!user) { req.session.destroy(() => {}); return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Please sign in to continue.', requestId: res.getHeader('X-Request-Id'), details: [] } }); }
  req.user = user; next();
});
const publicUser = (user) => ({ id: user.id, email: user.email, displayName: user.displayName });
const ownerCase = async (id, userId) => Case.findOne({ _id: id, ownerId: userId });
const newProgress = (record) => ({ viewedEvidenceIds: record?.viewedEvidenceIds || [], notes: record?.notes || '', selectedSuspectId: record?.selectedSuspectId || null, hintsUsed: record?.hintsUsed || 0 });
const caseSummary = (c) => ({ id: c.id, title: c.title, difficulty: c.difficulty, tone: c.tone, length: c.length, status: c.status, createdAt: c.createdAt, updatedAt: c.updatedAt });

api.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
api.post('/auth/register', asyncRoute(async (req, res) => {
  const input = z.object({ displayName: z.string().trim().min(1).max(60), email: z.string().trim().email().max(254), password: z.string().min(10).max(128) }).parse(req.body);
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) return res.status(409).json({ error: { code: 'CONFLICT', message: 'An account with that email already exists.', requestId: res.getHeader('X-Request-Id'), details: [] } });
  const user = await User.create({ email, displayName: input.displayName, passwordHash: await bcrypt.hash(input.password, 12) });
  req.session.userId = user.id; res.status(201).json({ user: publicUser(user) });
}));
api.post('/auth/login', asyncRoute(async (req, res) => {
  const input = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) }).parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Email or password is incorrect.', requestId: res.getHeader('X-Request-Id'), details: [] } });
  req.session.regenerate((error) => { if (error) return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Could not start your session.', details: [] } }); req.session.userId = user.id; res.json({ user: publicUser(user) }); });
}));
api.post('/auth/logout', (req, res) => req.session.destroy((error) => { if (error) return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Could not end the session.', details: [] } }); res.clearCookie('mystery.sid', { httpOnly: true, secure: config.COOKIE_SECURE === 'true', sameSite: 'lax' }); res.json({ ok: true }); }));
api.get('/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

api.post('/cases', requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({ scenario: z.string().trim().min(50).max(config.MAX_SCENARIO_LENGTH), difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'), tone: z.enum(['classic_detective', 'psychological_mystery', 'thriller', 'lighthearted']).default('classic_detective'), length: z.enum(['short', 'standard', 'extended']).default('standard') }).parse(req.body);
  const key = req.get('Idempotency-Key');
  if (key && (key.length > 128 || key.length < 8)) throw Object.assign(new Error('Idempotency-Key must be between 8 and 128 characters.'), { status: 400, code: 'VALIDATION_ERROR' });
  const requestFingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  if (key) {
    const existing = await Case.findOne({ ownerId: req.user.id, idempotencyKey: key }).select('+requestFingerprint');
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw Object.assign(new Error('This idempotency key was already used with different case settings.'), { status: 409, code: 'CONFLICT' });
      return res.status(202).json({ caseId: existing.id, status: existing.status, statusUrl: `/api/v1/cases/${existing.id}/status` });
    }
  }
  let doc;
  try { doc = await Case.create({ ownerId: req.user.id, ...input, idempotencyKey: key || null, requestFingerprint, generationMetadata: { provider: 'gemini', model: config.GEMINI_MODEL, promptVersion: '1.0', startedAt: new Date(), attemptCount: 0 } }); }
  catch (error) {
    if (!key || error.code !== 11000) throw error;
    const existing = await Case.findOne({ ownerId: req.user.id, idempotencyKey: key }).select('+requestFingerprint');
    if (!existing || existing.requestFingerprint !== requestFingerprint) throw Object.assign(new Error('This idempotency key conflicts with another request.'), { status: 409, code: 'CONFLICT' });
    return res.status(202).json({ caseId: existing.id, status: existing.status, statusUrl: `/api/v1/cases/${existing.id}/status` });
  }
  setImmediate(async () => {
    try {
      const result = await generateMystery(input, config);
      await Case.updateOne({ _id: doc._id, status: 'generating' }, { $set: { title: result.publicCase.title, publicCase: result.publicCase, privateSolution: result.solution, status: 'ready', 'generationMetadata.completedAt': new Date(), 'generationMetadata.attemptCount': result.attemptCount, 'generationMetadata.generationDurationMs': result.durationMs, 'validationMetadata': { valid: true, validatedAt: new Date() } } });
    } catch (error) {
      console.error(JSON.stringify({ event: 'case_generation_failed', caseId: doc.id, code: error.code || 'AI_PROVIDER_ERROR' }));
      await Case.updateOne({ _id: doc._id, status: 'generating' }, { $set: { status: 'failed', failureCode: error.code || 'AI_PROVIDER_ERROR', 'generationMetadata.completedAt': new Date() } });
    }
  });
  return res.status(202).json({ caseId: doc.id, status: 'generating', statusUrl: `/api/v1/cases/${doc.id}/status` });
}));
api.get('/cases', requireAuth, asyncRoute(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filter = { ownerId: req.user.id }; if (req.query.status && ['generating', 'ready', 'failed', 'completed'].includes(req.query.status)) filter.status = req.query.status;
  const [cases, total] = await Promise.all([Case.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Case.countDocuments(filter)]);
  res.json({ cases: cases.map(caseSummary), total, page, limit });
}));
api.delete('/cases/:caseId', requireAuth, asyncRoute(async (req, res) => {
  const c = await Case.findOneAndDelete({ _id: req.params.caseId, ownerId: req.user.id });
  if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  await Progress.deleteOne({ caseId: c.id, userId: req.user.id });
  res.json({ deleted: true });
}));
api.get('/cases/:caseId/status', requireAuth, asyncRoute(async (req, res) => {
  const c = await ownerCase(req.params.caseId, req.user.id); if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  res.json({ caseId: c.id, status: c.status, retryable: c.status === 'failed', ...(c.status === 'failed' ? { errorCode: c.failureCode || 'AI_PROVIDER_ERROR' } : {}) });
}));
api.get('/cases/:caseId', requireAuth, asyncRoute(async (req, res) => {
  const c = await Case.findOne({ _id: req.params.caseId, ownerId: req.user.id }).select('+privateSolution'); if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  const progress = await Progress.findOne({ caseId: c.id, userId: req.user.id });
  const hintLimit = DIFFICULTY_RULES[c.difficulty].hints;
  const hints = c.status === 'completed' ? [] : (c.privateSolution?.hints || []).slice(0, progress?.hintsUsed || 0);
  res.json({ case: { ...caseSummary(c), publicCase: c.publicCase, hints, hintLimit, progress: newProgress(progress) } });
}));
api.put('/cases/:caseId/progress', requireAuth, asyncRoute(async (req, res) => {
  const c = await ownerCase(req.params.caseId, req.user.id); if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  if (!c.publicCase) return res.status(409).json({ error: { code: 'CONFLICT', message: 'This case is not ready yet.', details: [] } });
  const input = z.object({ notes: z.string().max(10000).optional(), selectedSuspectId: z.string().max(80).nullable().optional() }).strict().parse(req.body);
  const sids = new Set(c.publicCase.suspects.map((x) => x.id));
  if (input.selectedSuspectId && !sids.has(input.selectedSuspectId)) throw Object.assign(new Error('The selected suspect is invalid.'), { status: 400, code: 'VALIDATION_ERROR' });
  const progress = await Progress.findOneAndUpdate({ userId: req.user.id, caseId: c.id }, { $set: { ...input } , $setOnInsert: { userId: req.user.id, caseId: c.id } }, { upsert: true, new: true, runValidators: true });
  res.json({ progress: newProgress(progress) });
}));
api.post('/cases/:caseId/evidence/:evidenceId/discover', requireAuth, asyncRoute(async (req, res) => {
  const c = await ownerCase(req.params.caseId, req.user.id);
  if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  if (c.status !== 'ready') return res.status(409).json({ error: { code: 'CONFLICT', message: 'Evidence can only be discovered during an active investigation.', details: [] } });
  if (!c.publicCase.evidence.some((item) => item.id === req.params.evidenceId)) throw Object.assign(new Error('Select evidence from this case.'), { status: 400, code: 'VALIDATION_ERROR' });
  let progress;
  try {
    progress = await Progress.findOneAndUpdate(
      { userId: req.user.id, caseId: c.id, status: { $ne: 'completed' } },
      { $addToSet: { viewedEvidenceIds: req.params.evidenceId }, $setOnInsert: { userId: req.user.id, caseId: c.id } },
      { upsert: true, new: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    progress = await Progress.findOneAndUpdate({ userId: req.user.id, caseId: c.id, status: { $ne: 'completed' } }, { $addToSet: { viewedEvidenceIds: req.params.evidenceId } }, { new: true });
  }
  if (!progress) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Evidence can only be discovered during an active investigation.', details: [] } });
  res.json({ progress: newProgress(progress) });
}));
api.post('/cases/:caseId/hints', requireAuth, asyncRoute(async (req, res) => {
  const c = await Case.findOne({ _id: req.params.caseId, ownerId: req.user.id }).select('+privateSolution');
  if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  if (c.status !== 'ready' || !c.privateSolution?.hints) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Hints are only available during an active investigation.', details: [] } });
  const hintLimit = DIFFICULTY_RULES[c.difficulty].hints;
  let progress = await Progress.findOne({ userId: req.user.id, caseId: c.id });
  if (!progress) {
    try {
      progress = await Progress.create({ userId: req.user.id, caseId: c.id });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  progress = await Progress.findOneAndUpdate(
    { userId: req.user.id, caseId: c.id, status: { $ne: 'completed' }, $or: [{ hintsUsed: { $lt: hintLimit } }, { hintsUsed: { $exists: false } }] },
    { $inc: { hintsUsed: 1 } },
    { new: true },
  );
  if (!progress) return res.status(409).json({ error: { code: 'HINTS_EXHAUSTED', message: 'You have used all the hints for this case.', details: [] } });
  const hint = c.privateSolution.hints[progress.hintsUsed - 1];
  if (!hint) throw new Error('The generated case is missing a requested hint.');
  res.json({ hint, hintsUsed: progress.hintsUsed, hintLimit, hintsRemaining: hintLimit - progress.hintsUsed });
}));
api.post('/cases/:caseId/accusation', requireAuth, asyncRoute(async (req, res) => {
  const { suspectId } = z.object({ suspectId: z.string().min(1).max(80) }).parse(req.body);
  const c = await Case.findOne({ _id: req.params.caseId, ownerId: req.user.id }).select('+privateSolution');
  if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  if (c.status !== 'ready' || !c.privateSolution) return res.status(409).json({ error: { code: 'CONFLICT', message: 'This case is not ready for an accusation.', details: [] } });
  if (!c.publicCase.suspects.some((s) => s.id === suspectId)) throw Object.assign(new Error('Select a suspect from this case.'), { status: 400, code: 'VALIDATION_ERROR' });
  const now = new Date();
  let progress;
  let alreadySubmitted = false;
  try {
    progress = await Progress.findOneAndUpdate(
      { caseId: c.id, userId: req.user.id, status: { $ne: 'completed' } },
      { $set: { status: 'completed', accusation: suspectId, result: suspectId === c.privateSolution.culpritId, completedAt: now }, $setOnInsert: { caseId: c.id, userId: req.user.id } },
      { upsert: true, new: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    progress = await Progress.findOne({ caseId: c.id, userId: req.user.id });
    alreadySubmitted = progress?.status === 'completed';
  }
  if (alreadySubmitted) return res.status(409).json({ error: { code: 'CONFLICT', message: 'This accusation has already been submitted.', details: [] } });
  await Case.updateOne({ _id: c.id, status: 'ready' }, { $set: { status: 'completed', completedAt: now } });
  res.json({ caseId: c.id, status: 'completed', correct: progress.result, resultUrl: `/api/v1/cases/${c.id}/result` });
}));
api.get('/cases/:caseId/result', requireAuth, asyncRoute(async (req, res) => {
  const c = await Case.findOne({ _id: req.params.caseId, ownerId: req.user.id }).select('+privateSolution');
  if (!c) return res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.', details: [] } });
  if (c.status !== 'completed' || !c.privateSolution) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Complete the investigation to view the solution.', details: [] } });
  const p = await Progress.findOne({ caseId: c.id, userId: req.user.id }); const culprit = c.publicCase.suspects.find((s) => s.id === c.privateSolution.culpritId);
  const correct = p?.result ?? false;
  const score = scoreCase({
    difficulty: c.difficulty,
    correct,
    discoveredClues: Math.min(p?.viewedEvidenceIds?.length || 0, DIFFICULTY_RULES[c.difficulty].clues),
    hintsUsed: p?.hintsUsed || 0,
  });
  res.json({ result: { caseId: c.id, correct, accusation: p?.accusation, score: score.total, scoreBreakdown: score, culprit: { id: culprit.id, name: culprit.name }, motive: c.privateSolution.motive, method: c.privateSolution.method, chronology: c.privateSolution.chronology, reasoning: c.privateSolution.reasoning, decisiveEvidenceIds: c.privateSolution.decisiveEvidenceIds, redHerringExplanations: c.privateSolution.redHerringExplanations } });
}));

app.use('/api/v1', api);
app.use('/api/v1', (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.', requestId: res.getHeader('X-Request-Id'), details: [] } }));
if (config.NODE_ENV === 'production') {
  const { fileURLToPath } = await import('node:url'); const { dirname, resolve } = await import('node:path');
  const here = dirname(fileURLToPath(import.meta.url)); const dist = resolve(here, '../dist');
  app.use(express.static(dist)); app.get('*', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
}
app.use((err, req, res, _next) => {
  const status = err.status || (err instanceof z.ZodError ? 400 : err.name === 'CastError' ? 404 : 500);
  const code = err.code || (err instanceof z.ZodError ? 'VALIDATION_ERROR' : status === 404 ? 'CASE_NOT_FOUND' : 'INTERNAL_ERROR');
  const message = status === 500 ? 'Something went wrong. Please try again.' : (err instanceof z.ZodError ? 'Please check the submitted fields.' : err.message);
  res.status(status).json({ error: { code, message, requestId: res.getHeader('X-Request-Id'), details: err instanceof z.ZodError ? err.issues.map((x) => ({ field: x.path.join('.'), message: x.message })) : [] } });
});

const server = app.listen(config.PORT, '0.0.0.0', () => console.log(`AI Mystery Room API listening on port ${config.PORT}`));
async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down gracefully.`);
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();
  server.close(async () => {
    try { await mongoose.disconnect(); process.exit(0); }
    catch (error) { console.error('Shutdown cleanup failed:', error.message); process.exit(1); }
  });
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
