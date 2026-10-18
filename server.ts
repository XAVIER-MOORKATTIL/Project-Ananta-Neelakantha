import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let db: any;

const metrics = {
  totalIngested: 0,
  totalQuarantined: 0,
  threatsInWindow: 0,
  circuitStatus: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF-OPEN',
  lastStateChange: Date.now()
};

connectDB().then(database => {
  db = database;
});

function circuitBreaker(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();

  if (metrics.circuitStatus === 'OPEN' && now - metrics.lastStateChange > 15000) {
    metrics.circuitStatus = 'HALF-OPEN';
    metrics.lastStateChange = now;
    console.warn("🔄 CIRCUIT BREAKER MUTATED TO HALF-OPEN: Testing cluster stability...");
  }

  if (metrics.circuitStatus === 'OPEN') {
    return res.status(503).json({
      status: 'CIRCUIT_OPEN',
      message: 'System in quarantine lockdown. Self-healing in progress...'
    });
  }

  next();
}

function poisonShield(req: Request, res: Response, next: NextFunction) {
  const payload = req.body;

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ status: 'QUARANTINED', reason: 'Invalid payload structure' });
  }

  const isToxic = JSON.stringify(payload).includes('$') || JSON.stringify(payload).includes('eval(');

  if (isToxic) {
    metrics.totalQuarantined++;
    metrics.threatsInWindow++;
    console.warn(`⚠️ TOXIC PAYLOAD DETECTED! (Threat Window: ${metrics.threatsInWindow}/3)`);

    if (metrics.threatsInWindow >= 3 && metrics.circuitStatus !== 'OPEN') {
      metrics.circuitStatus = 'OPEN';
      metrics.lastStateChange = Date.now();
      console.error("🚨 CRITICAL THREAT THRESHOLD BREACHED: CIRCUIT BREAKER TRIPPED TO OPEN!");
    }

    if (db) {
      db.collection('quarantine_logs').insertOne({
        payload,
        timestamp: new Date(),
        clientIP: req.ip
      });
    }

    return res.status(422).json({ status: 'QUARANTINED', message: 'Toxic data neutralized.' });
  }

  next();
}

setInterval(() => {
  metrics.threatsInWindow = 0;
}, 10000);

app.post('/api/ingest', circuitBreaker, poisonShield, async (req: Request, res: Response) => {
  try {
    const validData = req.body;
    const result = await db.collection('ledger').insertOne({ ...validData, processedAt: new Date() });
    
    metrics.totalIngested++;
    if (metrics.circuitStatus === 'HALF-OPEN') {
      metrics.circuitStatus = 'CLOSED';
      metrics.lastStateChange = Date.now();
      console.log("⚡ CLUSTER STABILITY RESTORED: CIRCUIT BREAKER CLOSED.");
    }

    res.status(200).json({ status: 'ACCEPTED', transactionId: result.insertedId });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Internal processing failure' });
  }
});

app.get('/api/telemetry', (req: Request, res: Response) => {
  res.status(200).json({
    timestamp: new Date(),
    metrics
  });
});

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Neelakantha Cosmic Mirror Server running on port ${PORT}`);
});