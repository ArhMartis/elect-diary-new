import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const sqlite = new Database("sqlite.db");

// Проверяем существование таблицы messages
const checkTable = sqlite.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='messages'"
);
const tableExists = checkTable.get();

if (!tableExists) {
  console.log("Создание таблицы messages...");
  
  // Создаем таблицу messages
  sqlite.exec(`
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT,
      receiver_id TEXT,
      group_id INTEGER,
      is_broadcast INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      read_at TEXT,
      FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Создаем индексы
  sqlite.exec(`CREATE INDEX idx_messages_sender ON messages(sender_id);`);
  sqlite.exec(`CREATE INDEX idx_messages_receiver ON messages(receiver_id);`);
  sqlite.exec(`CREATE INDEX idx_messages_created ON messages(created_at DESC);`);

  console.log("✅ Таблица messages успешно создана!");
  console.log("✅ Индексы созданы!");
} else {
  console.log("Таблица messages уже существует.");
}

sqlite.close();
console.log("Готово!");
