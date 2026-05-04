'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'algotrd.db'));

console.log('\n=== USERS ===');
const users = db.prepare('SELECT id, username, email FROM users').all();
console.log(JSON.stringify(users, null, 2));

console.log('\n=== ACTIVE CHALLENGES ===');
const challenges = db.prepare("SELECT id, user_id, tier, status, current_balance, pair, interval FROM sim_challenges WHERE status = 'active'").all();
console.log(JSON.stringify(challenges, null, 2));

console.log('\n=== OPEN POSITIONS ===');
const positions = db.prepare("SELECT id, challenge_id, pair, direction, entry_price, size, stop_loss, take_profit, status FROM sim_positions WHERE status = 'open'").all();
console.log(JSON.stringify(positions, null, 2));

console.log('\n=== SIM_POSITIONS SCHEMA ===');
const schema = db.prepare("PRAGMA table_info(sim_positions)").all();
console.log(schema.map(c => c.name).join(', '));

console.log('\n=== SIM_TRADES SCHEMA ===');
const tschema = db.prepare("PRAGMA table_info(sim_trades)").all();
console.log(tschema.map(c => c.name).join(', '));

console.log('\n=== SIM_PAIR_STATES ===');
const states = db.prepare('SELECT * FROM sim_pair_states').all();
console.log(JSON.stringify(states, null, 2));

db.close();
