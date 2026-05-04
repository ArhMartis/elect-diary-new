-- Создание таблицы messages для системы сообщений
CREATE TABLE IF NOT EXISTS messages (
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

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
