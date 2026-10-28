import mongoose from 'mongoose';

const { Schema } = mongoose;
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true, trim: true, maxlength: 60 },
}, { timestamps: true });

const caseSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'Untitled Case' },
  scenario: { type: String, required: true, maxlength: 3000, select: false },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  tone: { type: String, enum: ['classic_detective', 'psychological_mystery', 'thriller', 'lighthearted'], required: true },
  length: { type: String, enum: ['short', 'standard', 'extended'], required: true },
  status: { type: String, enum: ['generating', 'ready', 'completed', 'failed'], default: 'generating', index: true },
  publicCase: { type: Schema.Types.Mixed, default: null },
  privateSolution: { type: Schema.Types.Mixed, default: null, select: false },
  schemaVersion: { type: String, default: '1.0' },
  idempotencyKey: { type: String, default: null },
  requestFingerprint: { type: String, default: null, select: false },
  failureCode: { type: String, default: null },
  generationMetadata: { type: Schema.Types.Mixed, default: {} },
  validationMetadata: { type: Schema.Types.Mixed, default: {} },
  completedAt: { type: Date, default: null },
}, { timestamps: true, minimize: false });
caseSchema.index({ ownerId: 1, createdAt: -1 });
caseSchema.index({ ownerId: 1, status: 1 });
caseSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });

const progressSchema = new Schema({
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  viewedEvidenceIds: { type: [String], default: [] },
  hintsUsed: { type: Number, min: 0, default: 0 },
  notes: { type: String, maxlength: 10000, default: '' },
  selectedSuspectId: { type: String, default: null },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  accusation: { type: String, default: null },
  result: { type: Boolean, default: null },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { timestamps: true });
progressSchema.index({ userId: 1, caseId: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
export const Case = mongoose.model('Case', caseSchema);
export const Progress = mongoose.model('Progress', progressSchema);
