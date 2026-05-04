'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'edgerift-secret-key-change-in-production-2025';

// ─── Database setup ───────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'algotrd.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');  // faster writes, safe with WAL
db.pragma('cache_size = -32000');   // 32MB cache, reduces disk IO

// BUG FIX: transaction wrapper for batching DB ops (prevents event loop blocking)
const runInTransaction = db.transaction((fn) => fn());

// ─── Migrations ───────────────────────────────────────────────────────────────
// Check if we need to migrate the sim_challenges table
const tableInfo = db.prepare("PRAGMA table_info(sim_challenges)").all();
const hasPair = tableInfo.some(col => col.name === 'pair');
const hasInterval = tableInfo.some(col => col.name === 'interval');
const hasCurrentDayTrades = tableInfo.some(col => col.name === 'current_day_trades');
const hasCandleIndex = tableInfo.some(col => col.name === 'candle_index');
const hasLastTradeDate = tableInfo.some(col => col.name === 'last_trade_date');

if (!hasPair) {
  if (tableInfo.length > 0) {
    console.log('Migrating sim_challenges table to new schema...');
    db.exec("ALTER TABLE sim_challenges ADD COLUMN pair TEXT NOT NULL DEFAULT 'BTCUSDT'");
  }
}
if (!hasInterval && tableInfo.length > 0) {
  db.exec("ALTER TABLE sim_challenges ADD COLUMN interval TEXT NOT NULL DEFAULT '5m'");
}
if (!hasCurrentDayTrades && tableInfo.length > 0) {
  db.exec("ALTER TABLE sim_challenges ADD COLUMN current_day_trades INTEGER DEFAULT 0");
}
if (!hasCandleIndex && tableInfo.length > 0) {
  db.exec("ALTER TABLE sim_challenges ADD COLUMN candle_index INTEGER DEFAULT 100");
}
if (!hasLastTradeDate && tableInfo.length > 0) {
  db.exec("ALTER TABLE sim_challenges ADD COLUMN last_trade_date TEXT");
}

// Ensure sim_pair_states table exists (idempotent)
db.exec(`
  CREATE TABLE IF NOT EXISTS sim_pair_states (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id    INTEGER NOT NULL,
    pair            TEXT    NOT NULL,
    interval        TEXT    NOT NULL,
    candle_index    INTEGER DEFAULT 100,
    last_advance_at INTEGER DEFAULT 0,
    UNIQUE(challenge_id, pair, interval),
    FOREIGN KEY (challenge_id) REFERENCES sim_challenges(id)
  );
`);

// Check if sim_trades needs migration
const tradesInfo = db.prepare("PRAGMA table_info(sim_trades)").all();
const hasAction = tradesInfo.some(col => col.name === 'action');
const hasPairTrades = tradesInfo.some(col => col.name === 'pair');
const hasDirection = tradesInfo.some(col => col.name === 'direction');
const hasBalanceAfter = tradesInfo.some(col => col.name === 'balance_after');
const hasTypeCol = tradesInfo.some(col => col.name === 'type');
const hasTradesSL = tradesInfo.some(col => col.name === 'stop_loss');
const hasTradesTP = tradesInfo.some(col => col.name === 'take_profit');

if (!hasAction && tradesInfo.length > 0) {
  db.exec("ALTER TABLE sim_trades ADD COLUMN action TEXT NOT NULL DEFAULT 'open'");
}
if (!hasPairTrades && tradesInfo.length > 0) {
  db.exec("ALTER TABLE sim_trades ADD COLUMN pair TEXT NOT NULL DEFAULT 'BTCUSDT'");
}
if (!hasDirection && tradesInfo.length > 0) {
  db.exec("ALTER TABLE sim_trades ADD COLUMN direction TEXT NOT NULL DEFAULT 'long'");
}
if (!hasBalanceAfter && tradesInfo.length > 0) {
  db.exec("ALTER TABLE sim_trades ADD COLUMN balance_after REAL NOT NULL DEFAULT 0");
}
if (!hasTypeCol && tradesInfo.length > 0) {
  db.exec("ALTER TABLE sim_trades ADD COLUMN type TEXT DEFAULT 'market'");
}
if (!hasTradesSL && tradesInfo.length > 0) {
  db.exec("ALTER TABLE sim_trades ADD COLUMN stop_loss REAL");
}
if (!hasTradesTP && tradesInfo.length > 0) {
  db.exec("ALTER TABLE sim_trades ADD COLUMN take_profit REAL");
}

// Migrate sim_positions: add pair column if missing
const positionsInfo = db.prepare("PRAGMA table_info(sim_positions)").all();
const hasPairPositions   = positionsInfo.some(col => col.name === 'pair');
const hasClosePrice      = positionsInfo.some(col => col.name === 'close_price');
const hasPnlPct          = positionsInfo.some(col => col.name === 'pnl_pct');
const hasInterval_pos    = positionsInfo.some(col => col.name === 'interval');

if (!hasPairPositions && positionsInfo.length > 0) {
  try { db.exec("ALTER TABLE sim_positions ADD COLUMN pair TEXT NOT NULL DEFAULT 'BTCUSDT'"); console.log('Migrated sim_positions: added pair'); } catch(e) { if (!e.message.includes('duplicate')) throw e; }
}
if (!hasClosePrice && positionsInfo.length > 0) {
  try { db.exec("ALTER TABLE sim_positions ADD COLUMN close_price REAL"); console.log('Migrated sim_positions: added close_price'); } catch(e) { if (!e.message.includes('duplicate')) throw e; }
}
if (!hasPnlPct && positionsInfo.length > 0) {
  try { db.exec("ALTER TABLE sim_positions ADD COLUMN pnl_pct REAL DEFAULT 0"); console.log('Migrated sim_positions: added pnl_pct'); } catch(e) { if (!e.message.includes('duplicate')) throw e; }
}

// ─── Table creation ───────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    UNIQUE NOT NULL,
    email     TEXT    UNIQUE NOT NULL,
    password  TEXT    NOT NULL,
    plan      TEXT    DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS enrollments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    course_id   TEXT    NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, course_id)
  );
  CREATE TABLE IF NOT EXISTS sim_challenges (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    tier                TEXT    NOT NULL,
    pair                TEXT    NOT NULL DEFAULT 'BTCUSDT',
    interval            TEXT    NOT NULL DEFAULT '5m',
    status              TEXT    DEFAULT 'active',
    initial_balance     REAL    NOT NULL,
    current_balance     REAL    NOT NULL,
    peak_balance        REAL    NOT NULL,
    daily_start_balance REAL    NOT NULL,
    current_day_trades  INTEGER DEFAULT 0,
    trading_days_count  INTEGER DEFAULT 0,
    candle_index        INTEGER DEFAULT 0,
    last_trade_date     TEXT,
    started_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at            DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS sim_positions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    pair         TEXT    NOT NULL,
    direction    TEXT    NOT NULL,
    entry_price  REAL    NOT NULL,
    size         REAL    NOT NULL,
    stop_loss    REAL,
    take_profit  REAL,
    status       TEXT    DEFAULT 'open',
    opened_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at    DATETIME,
    close_price  REAL,
    pnl          REAL    DEFAULT 0,
    pnl_pct      REAL    DEFAULT 0,
    FOREIGN KEY (challenge_id) REFERENCES sim_challenges(id)
  );
  CREATE TABLE IF NOT EXISTS sim_trades (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id  INTEGER NOT NULL,
    position_id   INTEGER,
    action        TEXT    NOT NULL,
    pair          TEXT    NOT NULL,
    direction     TEXT    NOT NULL,
    price         REAL    NOT NULL,
    size          REAL    NOT NULL,
    pnl           REAL    DEFAULT 0,
    balance_after REAL    NOT NULL,
    timestamp     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES sim_challenges(id),
    FOREIGN KEY (position_id) REFERENCES sim_positions(id)
  );
  CREATE TABLE IF NOT EXISTS signals (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_id    TEXT    NOT NULL,
    pair           TEXT    NOT NULL,
    direction      TEXT    NOT NULL,
    entry_price    REAL    NOT NULL,
    stop_loss      REAL    NOT NULL,
    take_profit    REAL    NOT NULL,
    timeframe      TEXT    NOT NULL,
    status         TEXT    DEFAULT 'active',
    confidence     TEXT    DEFAULT 'medium',
    fired_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at    DATETIME,
    result_pnl_pct REAL
  );
`);

// ─── Middleware ───────────────────────────────────────────────────────────────
const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'];
const prodOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
  origin: [...devOrigins, ...prodOrigins],
  credentials: true
}));
app.use(express.json({ limit: '16kb' }));

// BUG FIX: Kill hanging requests after 10s so server stays responsive
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    if (!res.headersSent) res.status(503).json({ error: 'Request timed out' });
  });
  next();
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired. Please sign in again.' });
  }
}

// ─── Input validation helper ──────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Challenge Tiers Config ───────────────────────────────────────────────────
const CHALLENGE_TIERS = {
  starter: {
    name: 'Starter',
    initialBalance: 10000,
    profitTarget: 0.08,
    maxDailyLoss: 0.04,
    maxTotalDrawdown: 0.08,
    minTradingDays: 3,
    maxPositionRiskPct: 0.02
  },
  pro: {
    name: 'Pro',
    initialBalance: 50000,
    profitTarget: 0.08,
    maxDailyLoss: 0.04,
    maxTotalDrawdown: 0.10,
    minTradingDays: 5,
    maxPositionRiskPct: 0.02
  },
  elite: {
    name: 'Elite',
    initialBalance: 100000,
    profitTarget: 0.10,
    maxDailyLoss: 0.05,
    maxTotalDrawdown: 0.12,
    minTradingDays: 7,
    maxPositionRiskPct: 0.02
  }
};

// ─── Market Data Setup ────────────────────────────────────────────────────────
const marketData = new Map();

function loadCandleDataFromFile(filename) {
  const filePath = path.join(__dirname, 'data', filename);
  if (!fs.existsSync(filePath)) return null;

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const klineData = JSON.parse(rawData);
    return klineData.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));
  } catch (err) {
    console.error(`Failed to load ${filename}:`, err.message);
    return null;
  }
}

function generateSyntheticCandles(pair, count = 1000) {
  const candles = [];
  const basePrice = pair === 'BTCUSDT' ? 67000 : pair === 'ETHUSDT' ? 3400 : 4500;
  const volatility = pair === 'BTCUSDT' ? 0.008 : pair === 'ETHUSDT' ? 0.009 : 0.005;
  const intervalMs = 5 * 60 * 1000;

  let prevClose = basePrice;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility * prevClose;
    const open = prevClose;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor(Math.random() * 450) + 50;

    candles.push({
      time: now - (count - i) * intervalMs,
      open,
      high,
      low,
      close,
      volume
    });

    prevClose = close;
  }

  return candles;
}

function initializeMarketData() {
  const datasets = [
    { key: 'BTCUSDT_5m',  file: 'BTCUSDT_5m.json',  pair: 'BTCUSDT' },
    { key: 'ETHUSDT_5m',  file: 'ETHUSDT_5m.json',  pair: 'ETHUSDT' },
    { key: 'BTCUSDT_15m', file: 'BTCUSDT_15m.json', pair: 'BTCUSDT' }
  ];

  datasets.forEach(({ key, file, pair }) => {
    let candles = loadCandleDataFromFile(file);
    if (!candles) {
      console.log(`No data file found for ${key}, generating synthetic candles`);
      candles = generateSyntheticCandles(pair, 1000);
    }
    marketData.set(key, candles);
  });

  console.log(`Market data loaded: ${marketData.size} datasets`);
}

initializeMarketData();

// ─── Interval helpers ─────────────────────────────────────────────────────────
const INTERVAL_MS = { '1m': 60000, '3m': 180000, '5m': 300000, '15m': 900000, '1h': 3600000 };

// Replay engine: advance one candle every 2 s regardless of the real interval
const REPLAY_SPEED_MS = 2000;

/** Get or lazily create per-pair state for a challenge */
function getOrCreatePairState(challengeId, pair, interval) {
  let state = db.prepare(
    'SELECT * FROM sim_pair_states WHERE challenge_id = ? AND pair = ? AND interval = ?'
  ).get(challengeId, pair, interval);

  if (!state) {
    const candles = marketData.get(`${pair}_${interval}`);
    const startIndex = candles ? Math.min(200, Math.floor(candles.length * 0.1)) : 100;
    db.prepare(
      'INSERT OR IGNORE INTO sim_pair_states (challenge_id, pair, interval, candle_index, last_advance_at) VALUES (?, ?, ?, ?, 0)'
    ).run(challengeId, pair, interval, startIndex);
    state = db.prepare(
      'SELECT * FROM sim_pair_states WHERE challenge_id = ? AND pair = ? AND interval = ?'
    ).get(challengeId, pair, interval);
  }
  return state;
}

/**
 * Advance the candle index for this pair every REPLAY_SPEED_MS (2 s).
 * Returns { index, lastAdvanceAt } so callers can compute the live candle fraction.
 */
function advancePairState(challengeId, pair, interval) {
  const now = Date.now();
  const state = getOrCreatePairState(challengeId, pair, interval);

  if (state.last_advance_at === 0 || (now - state.last_advance_at) >= REPLAY_SPEED_MS) {
    const candles = marketData.get(`${pair}_${interval}`);
    // Keep -2 so there is always a "next" candle available for the live animation
    const maxIndex = candles ? candles.length - 2 : 999;
    let newIndex = state.candle_index + 1;
    if (newIndex >= maxIndex) newIndex = 100;

    db.prepare(
      'UPDATE sim_pair_states SET candle_index = ?, last_advance_at = ? WHERE challenge_id = ? AND pair = ? AND interval = ?'
    ).run(newIndex, now, challengeId, pair, interval);
    return { index: newIndex, lastAdvanceAt: now };
  }
  return { index: state.candle_index, lastAdvanceAt: state.last_advance_at };
}

/**
 * Build the partially-formed candle that is currently "printing" on the chart.
 * It is candle[completedIndex+1] interpolated by elapsed fraction (0→1).
 */
function getLiveCandle(pair, interval, completedIndex, lastAdvanceAt) {
  const candles = marketData.get(`${pair}_${interval}`);
  if (!candles) return null;

  const liveIndex = completedIndex + 1;
  if (liveIndex >= candles.length) return null;

  const c = candles[liveIndex];
  const elapsed = Math.max(0, Date.now() - lastAdvanceAt);
  const fraction = Math.min(1, elapsed / REPLAY_SPEED_MS);

  // Smoothly interpolate close along the open→final-close path
  const liveClose = c.open + (c.close - c.open) * fraction;

  // Wicks grow progressively as the candle forms
  const liveHigh = Math.max(c.open, liveClose,
    c.open + (c.high - c.open) * Math.min(fraction * 1.4, 1));
  const liveLow = Math.min(c.open, liveClose,
    c.open - (c.open - c.low) * Math.min(fraction * 1.4, 1));

  return {
    time:  c.time,
    open:  c.open,
    high:  liveHigh,
    low:   liveLow,
    close: liveClose,
  };
}

/** Best current price for a pair/challenge (picks the most recently advanced interval) */
function getPairPrice(challengeId, pair) {
  // Pick the pair state with the most recent advance
  const state = db.prepare(
    'SELECT * FROM sim_pair_states WHERE challenge_id = ? AND pair = ? ORDER BY last_advance_at DESC LIMIT 1'
  ).get(challengeId, pair);
  if (state) return getCurrentPrice(pair, state.interval, state.candle_index);
  // fallback: use challenge fields
  const ch = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challengeId);
  if (ch) return getCurrentPrice(ch.pair, ch.interval || '5m', ch.candle_index || 100);
  return 0;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getCandles(pair, interval, challengeCandleIndex, limit = 80) {
  const key = `${pair}_${interval}`;
  const candles = marketData.get(key);
  if (!candles || candles.length === 0) return [];

  const endIndex = Math.min(challengeCandleIndex + 1, candles.length);
  const startIndex = Math.max(0, endIndex - limit);
  return candles.slice(startIndex, endIndex);
}

function getCurrentPrice(pair, interval, candleIndex) {
  const key = `${pair}_${interval}`;
  const candles = marketData.get(key);
  if (!candles || candles.length === 0) return 0;

  const idx = typeof candleIndex === 'number' && isFinite(candleIndex)
    ? Math.min(Math.max(0, candleIndex), candles.length - 1)
    : candles.length - 1;
  return candles[idx]?.close ?? 0;
}

function getCurrentCandle(pair, interval, candleIndex) {
  const key = `${pair}_${interval}`;
  const candles = marketData.get(key);
  if (!candles || candles.length === 0) return null;
  const idx = typeof candleIndex === 'number' && isFinite(candleIndex)
    ? Math.min(Math.max(0, candleIndex), candles.length - 1)
    : candles.length - 1;
  return candles[idx] ?? null;
}

function calculatePnL(direction, entryPrice, closePrice, size) {
  if (direction === 'long') return (closePrice - entryPrice) * size;
  return (entryPrice - closePrice) * size;
}

// BUG FIX #3: closePosition no longer calls checkPositionsAndRules() at the end.
// The original code caused infinite recursion:
//   checkPositionsAndRules → closePosition → checkPositionsAndRules → ...
// The caller (checkPositionsAndRules or an API route) is responsible for
// calling checkPositionsAndRules after closing positions if needed.
function closePosition(positionId, closePrice, action = 'close') {
  const position = db.prepare('SELECT * FROM sim_positions WHERE id = ?').get(positionId);
  if (!position || position.status !== 'open') return;

  const pnl = calculatePnL(position.direction, position.entry_price, closePrice, position.size);
  const pnlPct = (pnl / (position.entry_price * position.size)) * 100;

  db.prepare(`
    UPDATE sim_positions
    SET status = ?, closed_at = ?, close_price = ?, pnl = ?, pnl_pct = ?
    WHERE id = ?
  `).run(action, new Date().toISOString(), closePrice, pnl, pnlPct, positionId);

  const challenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(position.challenge_id);
  const newBalance = challenge.current_balance + pnl;

  db.prepare('UPDATE sim_challenges SET current_balance = ? WHERE id = ?')
    .run(newBalance, position.challenge_id);

  db.prepare(`
    INSERT INTO sim_trades (challenge_id, position_id, type, action, pair, direction, price, size, pnl, stop_loss, take_profit, balance_after)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    position.challenge_id, positionId, action, action,
    position.pair, position.direction,
    closePrice, position.size, pnl,
    position.stop_loss, position.take_profit,
    newBalance
  );
}

function failChallenge(challengeId, reason) {
  const challenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challengeId);
  if (!challenge || challenge.status !== 'active') return;

  console.log(`Challenge ${challengeId} FAILED: ${reason}`);
  db.prepare('UPDATE sim_challenges SET status = ?, ended_at = ? WHERE id = ?')
    .run('failed', new Date().toISOString(), challengeId);

  const positions = db.prepare(
    'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
  ).all(challengeId, 'open');

  const currentPrice = getCurrentPrice(challenge.pair, challenge.interval, challenge.candle_index);
  positions.forEach(pos => closePosition(pos.id, currentPrice, 'close'));
}

function passChallenge(challengeId) {
  const challenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challengeId);
  if (!challenge || challenge.status !== 'active') return;

  console.log(`Challenge ${challengeId} PASSED!`);
  db.prepare('UPDATE sim_challenges SET status = ?, ended_at = ? WHERE id = ?')
    .run('passed', new Date().toISOString(), challengeId);

  const positions = db.prepare(
    'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
  ).all(challengeId, 'open');

  const currentPrice = getCurrentPrice(challenge.pair, challenge.interval, challenge.candle_index);
  positions.forEach(pos => closePosition(pos.id, currentPrice, 'close'));
}

function checkPositionsAndRules(challengeId) {
  const challenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challengeId);
  if (!challenge || challenge.status !== 'active') return;
  // BUG FIX: run all checks in one transaction so DB IO doesn't block event loop
  try { runInTransaction(() => _doChecks(challengeId, challenge)); }
  catch(e) { console.error('[checkPositionsAndRules]', e.message); }
}
function _doChecks(challengeId, challenge) {

  const config = CHALLENGE_TIERS[challenge.tier];

  const positions = db.prepare(
    'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
  ).all(challengeId, 'open');

  // Check each open position for SL/TP hits using that position's pair candle high/low
  positions.forEach(pos => {
    const pair = pos.pair || challenge.pair || 'BTCUSDT';
    const state = db.prepare(
      'SELECT * FROM sim_pair_states WHERE challenge_id = ? AND pair = ? ORDER BY last_advance_at DESC LIMIT 1'
    ).get(challengeId, pair);
    if (!state) return;

    const candle = getCurrentCandle(pair, state.interval, state.candle_index);
    if (!candle) return;

    // Use close as the settlement price for PnL
    const closePrice = candle.close;
    if (!closePrice) return;

    // SL/TP check uses candle high/low so intrabar touches are caught
    const slHit = pos.stop_loss != null && (
      (pos.direction === 'long'  && candle.low  <= pos.stop_loss) ||
      (pos.direction === 'short' && candle.high >= pos.stop_loss)
    );
    const tpHit = !slHit && pos.take_profit != null && (
      (pos.direction === 'long'  && candle.high >= pos.take_profit) ||
      (pos.direction === 'short' && candle.low  <= pos.take_profit)
    );

    if (slHit) closePosition(pos.id, pos.stop_loss, 'sl_hit');
    else if (tpHit) closePosition(pos.id, pos.take_profit, 'tp_hit');
  });

  // Re-fetch challenge after position closes may have updated balance
  const updated = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challengeId);

  // Update peak balance
  if (updated.current_balance > updated.peak_balance) {
    db.prepare('UPDATE sim_challenges SET peak_balance = ? WHERE id = ?')
      .run(updated.current_balance, challengeId);
  }

  // BUG FIX #4: Use updated.peak_balance (not undefined `peak_balance`)
  // Original: const drawdownPct = (peakBalance - currentBalance) / peak_balance;
  //           `peak_balance` was a typo — it's the snake_case DB column name used
  //           as a JS variable, which is undefined. Fixed to use `updated.peak_balance`.
  const peakBalance = Math.max(updated.peak_balance, updated.current_balance);
  const drawdownPct = peakBalance > 0
    ? (peakBalance - updated.current_balance) / peakBalance
    : 0;

  if (drawdownPct > config.maxTotalDrawdown) {
    failChallenge(challengeId, 'Total drawdown limit exceeded');
    return;
  }

  // Check daily loss
  const dailyPnl = updated.current_balance - updated.daily_start_balance;
  const dailyLossPct = updated.daily_start_balance > 0
    ? -dailyPnl / updated.daily_start_balance
    : 0;

  if (dailyPnl < 0 && dailyLossPct > config.maxDailyLoss) {
    failChallenge(challengeId, 'Daily loss limit exceeded');
    return;
  }

  // Check profit target
  const profitPct = (updated.current_balance - updated.initial_balance) / updated.initial_balance;
  if (profitPct >= config.profitTarget && updated.trading_days_count >= config.minTradingDays) {
    passChallenge(challengeId);
  }
} // end _doChecks


// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (username.length < 3 || username.length > 32) {
    return res.status(400).json({ error: 'Username must be 3–32 characters.' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const hash = await bcrypt.hash(password, 12);
  try {
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(username.trim(), email.trim().toLowerCase(), hash);
    const payload = {
      id: result.lastInsertRowid,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      plan: 'free'
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: payload });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      const field = err.message.toLowerCase().includes('email') ? 'email' : 'username';
      return res.status(409).json({ error: `This ${field} is already registered.` });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const payload = { id: user.id, username: user.username, email: user.email, plan: user.plan };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: payload });
});

// GET /api/me
app.get('/api/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, plan, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

// POST /api/enroll
app.post('/api/enroll', authenticate, (req, res) => {
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ error: 'courseId required.' });
  try {
    db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)')
      .run(req.user.id, courseId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/enrollments
app.get('/api/enrollments', authenticate, (req, res) => {
  const rows = db.prepare('SELECT course_id FROM enrollments WHERE user_id = ?').all(req.user.id);
  res.json({ enrollments: rows.map(r => r.course_id) });
});

// ─── Simulator Routes ─────────────────────────────────────────────────────────

// POST /api/simulator/start
app.post('/api/simulator/start', authenticate, (req, res) => {
  const { tier } = req.body;
  if (!CHALLENGE_TIERS[tier]) {
    return res.status(400).json({ error: 'Invalid tier. Choose starter, pro, or elite.' });
  }

  const existing = db.prepare(
    'SELECT * FROM sim_challenges WHERE user_id = ? AND status = ?'
  ).get(req.user.id, 'active');
  if (existing) {
    return res.status(400).json({ error: 'You already have an active challenge.' });
  }

  const config = CHALLENGE_TIERS[tier];
  const today = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO sim_challenges
      (user_id, tier, pair, interval, initial_balance, current_balance,
       peak_balance, daily_start_balance, candle_index, last_trade_date)
    VALUES (?, ?, 'BTCUSDT', '5m', ?, ?, ?, ?, 100, ?)
  `).run(
    req.user.id, tier,
    config.initialBalance, config.initialBalance,
    config.initialBalance, config.initialBalance,
    today
  );

  const challenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(result.lastInsertRowid);
  res.json({ challenge });
});

// GET /api/simulator/challenge
app.get('/api/simulator/challenge', authenticate, (req, res) => {
  const challenge = db.prepare(
    'SELECT * FROM sim_challenges WHERE user_id = ? AND status = ?'
  ).get(req.user.id, 'active');

  if (!challenge) return res.status(404).json({ error: 'No active challenge' });

  const positions = db.prepare(
    'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
  ).all(challenge.id, 'open');

  const trades = db.prepare(
    'SELECT * FROM sim_trades WHERE challenge_id = ? ORDER BY timestamp DESC LIMIT 20'
  ).all(challenge.id);

  const currentPrice = getCurrentPrice(challenge.pair, challenge.interval, challenge.candle_index);

  res.json({ challenge, positions, trades, currentPrice });
});

// GET /api/simulator/candles
app.get('/api/simulator/candles', authenticate, (req, res) => {
  try {
    const pair     = ((req.query.pair     || 'BTCUSDT').toString().trim()).toUpperCase();
    const interval = (req.query.interval  || '5m').toString().trim();
    const limit    = Math.max(10, Math.min(500, parseInt(req.query.limit) || 200));

    const challenge = db.prepare(
      'SELECT * FROM sim_challenges WHERE user_id = ? AND status = ?'
    ).get(req.user.id, 'active');

    if (!challenge) return res.status(404).json({ error: 'No active challenge' });

    const key = `${pair}_${interval}`;
    const candles = marketData.get(key);
    if (!candles || candles.length === 0) {
      return res.status(400).json({ error: `No market data for ${key}. Check server/data/ folder.` });
    }

    // Track trading days: new UTC date → reset daily balance, increment day count
    const today = new Date().toISOString().split('T')[0];
    if (challenge.last_trade_date !== today) {
      db.prepare(`
        UPDATE sim_challenges
        SET last_trade_date = ?, daily_start_balance = current_balance,
            trading_days_count = trading_days_count + 1
        WHERE id = ?
      `).run(today, challenge.id);
    }

    // Advance candle index every REPLAY_SPEED_MS (2 s)
    const { index: newIndex, lastAdvanceAt } = advancePairState(challenge.id, pair, interval);

    // Check SL/TP and challenge rules against new price
    checkPositionsAndRules(challenge.id);

    // Fetch fresh state after rule checks
    const updatedChallenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challenge.id);
    const positions = db.prepare(
      'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
    ).all(challenge.id, 'open');

    const visibleCandles = getCandles(pair, interval, newIndex, limit);
    const liveCandle     = getLiveCandle(pair, interval, newIndex, lastAdvanceAt);
    const currentPrice   = liveCandle ? liveCandle.close : getCurrentPrice(pair, interval, newIndex);

    return res.json({
      candles: visibleCandles,
      liveCandle,
      currentPrice,
      challenge: updatedChallenge,
      positions,
      candleIndex: newIndex,
    });

  } catch (err) {
    console.error('[/api/simulator/candles] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error in candles endpoint', detail: err.message });
  }
});

// POST /api/simulator/order
app.post('/api/simulator/order', authenticate, (req, res) => {
  try {
  const { direction, size, stopLoss, takeProfit, pair: reqPair, interval: reqInterval } = req.body;

  if (!direction || !size) {
    return res.status(400).json({ error: 'direction and size are required.' });
  }
  if (direction !== 'long' && direction !== 'short') {
    return res.status(400).json({ error: 'direction must be "long" or "short".' });
  }
  if (size <= 0) {
    return res.status(400).json({ error: 'Size must be greater than 0.' });
  }

  const challenge = db.prepare(
    'SELECT * FROM sim_challenges WHERE user_id = ? AND status = ?'
  ).get(req.user.id, 'active');
  if (!challenge) return res.status(400).json({ error: 'No active challenge.' });

  const config = CHALLENGE_TIERS[challenge.tier];

  // Determine the pair/interval for this order
  const tradingPair     = reqPair     ? reqPair.toString().trim().toUpperCase() : (challenge.pair || 'BTCUSDT');
  const tradingInterval = reqInterval ? reqInterval.toString().trim()           : (challenge.interval || '5m');

  // Get current price from the pair's state
  const pairState    = getOrCreatePairState(challenge.id, tradingPair, tradingInterval);
  const currentPrice = getCurrentPrice(tradingPair, tradingInterval, pairState.candle_index);

  if (currentPrice === 0) {
    return res.status(400).json({ error: `No price data available for ${tradingPair}/${tradingInterval}.` });
  }

  // Validate stop loss direction
  if (stopLoss) {
    if (direction === 'long' && stopLoss >= currentPrice) {
      return res.status(400).json({ error: 'Stop loss must be below entry price for long positions.' });
    }
    if (direction === 'short' && stopLoss <= currentPrice) {
      return res.status(400).json({ error: 'Stop loss must be above entry price for short positions.' });
    }

    // Risk check: how much USD is at risk if SL is hit
    const riskAmount = direction === 'long'
      ? (currentPrice - stopLoss) * size
      : (stopLoss - currentPrice) * size;
    const maxRisk = challenge.current_balance * config.maxPositionRiskPct;

    if (riskAmount > maxRisk) {
      return res.status(400).json({
        error: `Position risk $${riskAmount.toFixed(2)} exceeds ${config.maxPositionRiskPct * 100}% of balance (max: $${maxRisk.toFixed(2)}).`
      });
    }
  }

  // Max 3 open positions
  const openCount = db.prepare(
    'SELECT COUNT(*) as count FROM sim_positions WHERE challenge_id = ? AND status = ?'
  ).get(challenge.id, 'open').count;

  if (openCount >= 3) {
    return res.status(400).json({ error: 'Maximum 3 open positions allowed.' });
  }

  const result = db.prepare(`
    INSERT INTO sim_positions (challenge_id, pair, direction, entry_price, size, stop_loss, take_profit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    challenge.id, tradingPair, direction,
    currentPrice, size,
    stopLoss || null, takeProfit || null
  );

  db.prepare(`
    INSERT INTO sim_trades (challenge_id, position_id, type, action, pair, direction, price, size, stop_loss, take_profit, balance_after)
    VALUES (?, ?, 'open', 'open', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    challenge.id, result.lastInsertRowid,
    tradingPair, direction,
    currentPrice, size, stopLoss || null, takeProfit || null, challenge.current_balance
  );

  db.prepare('UPDATE sim_challenges SET current_day_trades = current_day_trades + 1 WHERE id = ?')
    .run(challenge.id);

  const position = db.prepare('SELECT * FROM sim_positions WHERE id = ?').get(result.lastInsertRowid);
  const updatedChallenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challenge.id);
  const allOpenPositions = db.prepare(
    'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
  ).all(challenge.id, 'open');

  res.json({ position, positions: allOpenPositions, entryPrice: currentPrice, challenge: updatedChallenge });
  } catch (err) {
    console.error('[/api/simulator/order] Error:', err);
    return res.status(500).json({ error: 'Server error placing order: ' + err.message });
  }
});

// PATCH /api/simulator/position/:positionId  — update SL/TP
app.patch('/api/simulator/position/:positionId', authenticate, (req, res) => {
  try {
    const positionId = parseInt(req.params.positionId);
    if (isNaN(positionId)) return res.status(400).json({ error: 'Invalid position ID.' });

    const position = db.prepare('SELECT * FROM sim_positions WHERE id = ?').get(positionId);
    if (!position) return res.status(404).json({ error: 'Position not found.' });
    if (position.status !== 'open') return res.status(400).json({ error: 'Position is already closed.' });

    const challenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(position.challenge_id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });
    if (Number(challenge.user_id) !== Number(req.user.id)) return res.status(403).json({ error: 'Not your position.' });

    const { stopLoss, takeProfit } = req.body;
    const sl = stopLoss  !== undefined ? (stopLoss  === null || stopLoss  === '' ? null : Number(stopLoss))  : position.stop_loss;
    const tp = takeProfit !== undefined ? (takeProfit === null || takeProfit === '' ? null : Number(takeProfit)) : position.take_profit;

    // Validate direction
    const pair = position.pair || challenge.pair || 'BTCUSDT';
    const currentPrice = getPairPrice(challenge.id, pair);
    if (sl !== null) {
      if (position.direction === 'long'  && sl >= currentPrice) return res.status(400).json({ error: 'Stop loss must be below current price for long.' });
      if (position.direction === 'short' && sl <= currentPrice) return res.status(400).json({ error: 'Stop loss must be above current price for short.' });
    }
    if (tp !== null) {
      if (position.direction === 'long'  && tp <= currentPrice) return res.status(400).json({ error: 'Take profit must be above current price for long.' });
      if (position.direction === 'short' && tp >= currentPrice) return res.status(400).json({ error: 'Take profit must be below current price for short.' });
    }

    db.prepare('UPDATE sim_positions SET stop_loss = ?, take_profit = ? WHERE id = ?').run(sl, tp, positionId);

    const updated = db.prepare('SELECT * FROM sim_positions WHERE id = ?').get(positionId);
    const positions = db.prepare('SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?').all(challenge.id, 'open');
    res.json({ position: updated, positions });
  } catch (err) {
    console.error('[/api/simulator/position PATCH] Error:', err);
    return res.status(500).json({ error: 'Server error updating position: ' + err.message });
  }
});

// POST /api/simulator/close/:positionId
app.post('/api/simulator/close/:positionId', authenticate, (req, res) => {
  try {
  const positionId = parseInt(req.params.positionId);
  if (isNaN(positionId)) return res.status(400).json({ error: 'Invalid position ID.' });

  // Check if position exists at all (may have been auto-closed by SL/TP)
  const anyPosition = db.prepare('SELECT * FROM sim_positions WHERE id = ?').get(positionId);
  if (!anyPosition) return res.status(404).json({ error: 'Position not found.' });

  const challenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(anyPosition.challenge_id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });
  if (Number(challenge.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ error: 'Not your position.' });
  }

  // If already closed by SL/TP, return current state so UI syncs up
  if (anyPosition.status !== 'open') {
    const updatedChallenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challenge.id);
    const positions = db.prepare(
      'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
    ).all(challenge.id, 'open');
    return res.json({ challenge: updatedChallenge, positions, alreadyClosed: true });
  }

  // Get current price using per-pair state (fallback to challenge pair for old rows)
  const posPair = anyPosition.pair || challenge.pair || 'BTCUSDT';
  const currentPrice = getPairPrice(challenge.id, posPair);
  closePosition(positionId, currentPrice, 'close');

  // Run rule check after manual close (may trigger pass/fail)
  checkPositionsAndRules(challenge.id);

  const updatedChallenge = db.prepare('SELECT * FROM sim_challenges WHERE id = ?').get(challenge.id);
  const positions = db.prepare(
    'SELECT * FROM sim_positions WHERE challenge_id = ? AND status = ?'
  ).all(challenge.id, 'open');

  res.json({ challenge: updatedChallenge, positions });
  } catch (err) {
    console.error('[/api/simulator/close] Error:', err);
    return res.status(500).json({ error: 'Server error closing position: ' + err.message });
  }
});

// GET /api/simulator/trades
app.get('/api/simulator/trades', authenticate, (req, res) => {
  const challenge = db.prepare(
    'SELECT * FROM sim_challenges WHERE user_id = ? AND status = ?'
  ).get(req.user.id, 'active');

  if (!challenge) return res.status(404).json({ error: 'No active challenge.' });

  const trades = db.prepare(
    'SELECT * FROM sim_trades WHERE challenge_id = ? ORDER BY timestamp DESC LIMIT 50'
  ).all(challenge.id);

  res.json({ trades });
});

// GET /api/simulator/leaderboard
app.get('/api/simulator/leaderboard', (req, res) => {
  const results = db.prepare(`
    SELECT sc.*, u.username
    FROM sim_challenges sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.status = 'passed'
    ORDER BY ((sc.current_balance - sc.initial_balance) / sc.initial_balance) DESC
    LIMIT 15
  `).all();

  res.json({
    leaderboard: results.map(r => ({
      username: r.username,
      tier: r.tier,
      initialBalance: r.initial_balance,
      finalBalance: r.current_balance,
      profitPct: ((r.current_balance - r.initial_balance) / r.initial_balance * 100).toFixed(2),
      tradingDays: r.trading_days_count,
      endedAt: r.ended_at
    }))
  });
});

app.post('/api/simulator/reset', authenticate, (req, res) => {
  db.prepare("UPDATE sim_challenges SET status='abandoned' WHERE user_id=? AND status='active'").run(req.user.id);
  db.prepare("UPDATE sim_positions SET status='closed' WHERE challenge_id IN (SELECT id FROM sim_challenges WHERE user_id=?)").run(req.user.id);
  res.json({ ok: true });
});

// ─── Signal Strategy Functions ────────────────────────────────────────────────

function calculateSMA(data, period) {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((sum, c) => sum + c.close, 0) / period;
}

function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
  }
  return ema;
}

function calculateATR(data, period = 14) {
  if (data.length < period + 1) return null;
  let trSum = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const c = data[i];
    const prev = data[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prev.close),
      Math.abs(c.low - prev.close)
    );
    trSum += tr;
  }
  return trSum / period;
}

function calculateRSI(data, period = 14) {
  if (data.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const sma = calculateSMA(data, period);
  if (!sma) return null;
  const slice = data.slice(-period);
  const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  return { upper: sma + stdDev * std, lower: sma - stdDev * std, middle: sma };
}

function checkMomentumBreakout() {
  const candles = marketData.get('BTCUSDT_15m') || [];
  if (candles.length < 50) return null;

  const recent = candles.slice(-16);
  const current = recent[recent.length - 1];
  const prior = recent.slice(0, -1);

  const highestHigh = Math.max(...prior.map(c => c.high));
  const lowestLow = Math.min(...prior.map(c => c.low));
  const avgVolume = prior.reduce((sum, c) => sum + c.volume, 0) / prior.length;
  const ema50 = calculateEMA(candles, 50);
  const atr = calculateATR(candles, 14);

  if (!ema50 || !atr) return null;

  if (current.close > highestHigh && current.volume > avgVolume * 1.5 && current.close > ema50) {
    return {
      strategy_id: 'momentum-breakout',
      pair: 'BTC/USDT',
      direction: 'long',
      entry_price: current.close,
      stop_loss: current.close - atr * 1.5,
      take_profit: current.close + atr * 3,
      timeframe: '15m',
      confidence: 'high'
    };
  }

  if (current.close < lowestLow && current.volume > avgVolume * 1.5 && current.close < ema50) {
    return {
      strategy_id: 'momentum-breakout',
      pair: 'BTC/USDT',
      direction: 'short',
      entry_price: current.close,
      stop_loss: current.close + atr * 1.5,
      take_profit: current.close - atr * 3,
      timeframe: '15m',
      confidence: 'high'
    };
  }

  return null;
}

function checkRSIMeanReversion() {
  // BUG FIX #5 (continued from original Bug 4):
  // This strategy fires signals with timeframe '1h' but we only store 'ETHUSDT_5m' data.
  // checkOpenSignals() was building the key as pair.replace('/','') + '_' + timeframe
  // = 'ETHUSDT_1h' which doesn't exist in the map → candles array would be empty.
  // Fix: set timeframe to '5m' to match the actual data key stored in marketData,
  // OR add ETHUSDT_1h to the datasets. Here we align the timeframe label with
  // the actual data being used (5m) so signal resolution works correctly.
  const candles = marketData.get('ETHUSDT_5m') || [];
  if (candles.length < 50) return null;

  const current = candles[candles.length - 1];
  const rsi = calculateRSI(candles, 14);
  const bb = calculateBollingerBands(candles, 20, 2);

  if (!rsi || !bb) return null;

  if (rsi < 32 && current.close <= bb.lower) {
    const swingLow = Math.min(...candles.slice(-5).map(c => c.low));
    return {
      strategy_id: 'rsi-mean-reversion',
      pair: 'ETH/USDT',
      direction: 'long',
      entry_price: current.close,
      stop_loss: swingLow * 0.99,
      take_profit: bb.middle,
      timeframe: '5m',   // ← fixed: matches 'ETHUSDT_5m' key in marketData
      confidence: 'medium'
    };
  }

  if (rsi > 68 && current.close >= bb.upper) {
    const swingHigh = Math.max(...candles.slice(-5).map(c => c.high));
    return {
      strategy_id: 'rsi-mean-reversion',
      pair: 'ETH/USDT',
      direction: 'short',
      entry_price: current.close,
      stop_loss: swingHigh * 1.01,
      take_profit: bb.middle,
      timeframe: '5m',   // ← fixed: matches 'ETHUSDT_5m' key in marketData
      confidence: 'medium'
    };
  }

  return null;
}

function checkSignalCooldown(strategyId, direction) {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const recent = db.prepare(
    'SELECT id FROM signals WHERE strategy_id = ? AND direction = ? AND fired_at > ?'
  ).get(strategyId, direction, fourHoursAgo);
  return !!recent;
}

function sendTelegramSignal(signal) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !channelId) return;

  const emoji = signal.direction === 'long' ? '🟢' : '🔴';
  const action = signal.direction === 'long' ? 'BUY' : 'SELL';
  const slPct = ((signal.stop_loss - signal.entry_price) / signal.entry_price * 100).toFixed(2);
  const tpPct = ((signal.take_profit - signal.entry_price) / signal.entry_price * 100).toFixed(2);
  const strategyName = signal.strategy_id === 'momentum-breakout'
    ? 'Momentum Breakout'
    : 'RSI Mean Reversion';

  const message = `${emoji} ${action} SIGNAL — EDGERIFT
━━━━━━━━━━━━━━━━
Asset: ${signal.pair}
Strategy: ${strategyName}
Entry: $${signal.entry_price.toFixed(2)}
Stop Loss: $${signal.stop_loss.toFixed(2)} (${slPct}%)
Take Profit: $${signal.take_profit.toFixed(2)} (${tpPct}%)
Timeframe: ${signal.timeframe.toUpperCase()}
Confidence: ${signal.confidence.toUpperCase()}
━━━━━━━━━━━━━━━━
⚠️ Educational signals only. Not financial advice.`;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: channelId, text: message })
  }).catch(err => console.error('Telegram send error:', err.message));
}

function fireSignal(signal) {
  if (checkSignalCooldown(signal.strategy_id, signal.direction)) return;

  const result = db.prepare(`
    INSERT INTO signals (strategy_id, pair, direction, entry_price, stop_loss, take_profit, timeframe, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    signal.strategy_id, signal.pair, signal.direction,
    signal.entry_price, signal.stop_loss, signal.take_profit,
    signal.timeframe, signal.confidence
  );

  signal.id = result.lastInsertRowid;
  sendTelegramSignal(signal);
  console.log(`Signal fired: ${signal.strategy_id} ${signal.direction} ${signal.pair}`);
}

function checkOpenSignals() {
  const activeSignals = db.prepare("SELECT * FROM signals WHERE status = 'active'").all();

  activeSignals.forEach(signal => {
    // BUG FIX #5: Build the market data key correctly.
    // signal.pair is 'BTC/USDT' or 'ETH/USDT' — remove the slash and append timeframe.
    // With the timeframe fix in checkRSIMeanReversion() above, this now resolves
    // to valid keys: 'BTCUSDT_15m' and 'ETHUSDT_5m'.
    const pairKey = signal.pair.replace('/', '');
    const dataKey = `${pairKey}_${signal.timeframe}`;
    const candles = marketData.get(dataKey) || [];

    if (candles.length === 0) {
      console.warn(`No candle data for signal key: ${dataKey}`);
      return;
    }

    const currentPrice = candles[candles.length - 1].close;
    const now = new Date().toISOString();

    // Check expiry first
    const firedAt = new Date(signal.fired_at).getTime();
    if (Date.now() - firedAt > 48 * 60 * 60 * 1000) {
      db.prepare('UPDATE signals SET status = ?, resolved_at = ? WHERE id = ?')
        .run('expired', now, signal.id);
      return;
    }

    if (signal.direction === 'long') {
      if (currentPrice >= signal.take_profit) {
        const pnlPct = ((signal.take_profit - signal.entry_price) / signal.entry_price * 100);
        db.prepare('UPDATE signals SET status = ?, resolved_at = ?, result_pnl_pct = ? WHERE id = ?')
          .run('hit_tp', now, pnlPct, signal.id);
      } else if (currentPrice <= signal.stop_loss) {
        const pnlPct = ((signal.stop_loss - signal.entry_price) / signal.entry_price * 100);
        db.prepare('UPDATE signals SET status = ?, resolved_at = ?, result_pnl_pct = ? WHERE id = ?')
          .run('hit_sl', now, pnlPct, signal.id);
      }
    } else {
      if (currentPrice <= signal.take_profit) {
        const pnlPct = ((signal.entry_price - signal.take_profit) / signal.entry_price * 100);
        db.prepare('UPDATE signals SET status = ?, resolved_at = ?, result_pnl_pct = ? WHERE id = ?')
          .run('hit_tp', now, pnlPct, signal.id);
      } else if (currentPrice >= signal.stop_loss) {
        const pnlPct = ((signal.entry_price - signal.stop_loss) / signal.entry_price * 100);
        db.prepare('UPDATE signals SET status = ?, resolved_at = ?, result_pnl_pct = ? WHERE id = ?')
          .run('hit_sl', now, pnlPct, signal.id);
      }
    }
  });
}

function runSignalGeneration() {
  const momentumSignal = checkMomentumBreakout();
  if (momentumSignal) fireSignal(momentumSignal);

  const rsiSignal = checkRSIMeanReversion();
  if (rsiSignal) fireSignal(rsiSignal);

  checkOpenSignals();
}

// Run SL/TP + rule checks for all active challenges every 4 seconds
let _checkRunning = false;
setInterval(() => {
  if (_checkRunning) return;
  _checkRunning = true;
  try {
    const activeChallenges = db.prepare("SELECT id FROM sim_challenges WHERE status = 'active'").all();
    activeChallenges.forEach(ch => {
      try { checkPositionsAndRules(ch.id); }
      catch(e) { console.error('[tick check challenge', ch.id, ']', e.message, e.stack); }
    });
  } catch(e) {
    console.error('[tick check outer]', e.message);
  } finally {
    _checkRunning = false;
  }
}, 4000);

// Run signal generation every 60 seconds
// BUG FIX: guard prevents signal gen stacking up under load
let _signalRunning = false;
setInterval(() => {
  if (_signalRunning) return;
  _signalRunning = true;
  try { runSignalGeneration(); }
  catch(e) { console.error('[signal]', e.message); }
  finally { _signalRunning = false; }
}, 60 * 1000);

// ─── Signal Routes ────────────────────────────────────────────────────────────

// GET /api/signals?status=active
app.get('/api/signals', (req, res) => {
  const { status = 'active', limit = 50 } = req.query;
  const signals = db.prepare(
    'SELECT * FROM signals WHERE status = ? ORDER BY fired_at DESC LIMIT ?'
  ).all(status, parseInt(limit));
  res.json({ signals });
});

// GET /api/signals/history
app.get('/api/signals/history', (req, res) => {
  const { limit = 50 } = req.query;
  const signals = db.prepare(
    "SELECT * FROM signals WHERE status != 'active' ORDER BY fired_at DESC LIMIT ?"
  ).all(parseInt(limit));
  res.json({ signals });
});

// GET /api/signals/:id  — must come AFTER /api/signals/history to avoid route clash
app.get('/api/signals/:id', (req, res) => {
  const signal = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id);
  if (!signal) return res.status(404).json({ error: 'Signal not found.' });
  res.json({ signal });
});

// ─── Global Express error handler ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Express error]', req.method, req.path, err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─── Global JSON error handler (must be after all routes) ───────────────────
app.use((err, req, res, _next) => {
  console.error('[Express error]', err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ─── Crash guards ─────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] Continuing:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  EDGERIFT API  →  http://localhost:${PORT}
`);
  console.log('  Market data:');
  marketData.forEach((candles, key) => {
    console.log(`    ${key.padEnd(16)} → ${candles.length} candles`);
  });
  console.log('');
});
