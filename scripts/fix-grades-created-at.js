const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

// Add created_at column without default value first
try {
  db.exec('ALTER TABLE grades ADD COLUMN created_at INTEGER;');
  console.log('Column created_at added');
} catch (e) {
  console.log('Column might already exist:', e.message);
}

// Create index
try {
  db.exec('CREATE INDEX IF NOT EXISTS grades_created_at_idx ON grades (created_at);');
  console.log('Index created');
} catch (e) {
  console.log('Index error:', e.message);
}

// Update existing records with current timestamp
try {
  db.exec("UPDATE grades SET created_at = CAST(strftime('%s', 'now') * 1000 AS INTEGER) WHERE created_at IS NULL;");
  console.log('Existing records updated');
} catch (e) {
  console.log('Update error:', e.message);
}

// Verify
const result = db.prepare('PRAGMA table_info(grades)').all();
console.log('Columns:', result.map(c => c.name).join(', '));

// Add migration record
const fs = require('fs');
const hash = fs.readFileSync('./drizzle/0025_add_grades_created_at.sql', 'utf8')
  .split('\n')
  .filter(line => !line.startsWith('--') && line.trim() !== '')
  .join('\n')
  .trim();

const crypto = require('crypto');
const migrationHash = crypto.createHash('sha256').update(hash).digest('hex');

try {
  db.prepare('INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)')
    .run(migrationHash, Date.now());
  console.log('Migration record added');
} catch (e) {
  console.log('Migration record error:', e.message);
}

console.log('Done!');
