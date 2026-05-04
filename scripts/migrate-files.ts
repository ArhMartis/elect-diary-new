import Database from "better-sqlite3";

const db = new Database("sqlite.db");

console.log("🔄 Running migration: Add file columns to messages table...\n");

try {
  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(messages)").all() as any[];
  const columns = tableInfo.map(col => col.name);
  
  // Add file_url column if not exists
  if (!columns.includes("file_url")) {
    db.prepare("ALTER TABLE messages ADD COLUMN file_url TEXT").run();
    console.log("✅ Added column: file_url");
  } else {
    console.log("ℹ️ Column file_url already exists");
  }
  
  // Add file_name column if not exists
  if (!columns.includes("file_name")) {
    db.prepare("ALTER TABLE messages ADD COLUMN file_name TEXT").run();
    console.log("✅ Added column: file_name");
  } else {
    console.log("ℹ️ Column file_name already exists");
  }
  
  // Add file_size column if not exists
  if (!columns.includes("file_size")) {
    db.prepare("ALTER TABLE messages ADD COLUMN file_size INTEGER").run();
    console.log("✅ Added column: file_size");
  } else {
    console.log("ℹ️ Column file_size already exists");
  }
  
  // Add file_type column if not exists
  if (!columns.includes("file_type")) {
    db.prepare("ALTER TABLE messages ADD COLUMN file_type TEXT").run();
    console.log("✅ Added column: file_type");
  } else {
    console.log("ℹ️ Column file_type already exists");
  }
  
  console.log("\n✨ Migration completed successfully!");
  
} catch (error) {
  console.error("\n❌ Migration failed:", error);
  process.exit(1);
}

db.close();
